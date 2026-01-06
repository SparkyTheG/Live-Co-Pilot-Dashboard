type RealtimeAiAnalysis = Record<string, any>;

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeTranscript(text: string): string {
  const t = String(text || '').trim();
  if (!t) return '';
  const lower = t.toLowerCase();

  // Drop anything that looks like our own prompts/instructions leaking in.
  const badSubstrings = [
    'custom_script_prompt',
    'prospect_type:',
    'new_audio_transcript:',
    'output only valid json',
    'return json',
    'transcribe audio',
    'transcribe spoken english'
  ];
  if (badSubstrings.some((s) => lower.includes(s))) return '';

  // Reject extremely short/noisy outputs.
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2) return '';

  // Must contain at least some letters (avoid garbage tokens)
  if (!/[a-z]/i.test(t)) return '';

  // Reject if it's mostly repeated same word (common hallucination on silence/noise)
  const uniq = new Set(words.map((w) => w.toLowerCase()));
  if (uniq.size <= 2 && words.length >= 6) return '';

  // Do NOT normalize casing/punctuation here — user wants the exact transcript text.
  return t;
}

// requireExactMatch removed: analysis now uses authoritative input_audio_transcription transcript

function extractTextFromResponseDone(msg: any): string {
  // Some Realtime implementations put final text in response.output[].content[]
  try {
    const out = msg?.response?.output;
    if (!Array.isArray(out)) return '';
    const parts: string[] = [];
    for (const item of out) {
      const content = item?.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        const t = c?.type || '';
        if (t === 'output_text' || t === 'text') {
          const v = c?.text;
          if (typeof v === 'string' && v.trim()) parts.push(v);
        }
      }
    }
    return parts.join('');
  } catch {
    return '';
  }
}

function collapseConsecutiveSentenceRepeats(text: string): string {
  const s = String(text || '').trim();
  if (!s) return '';
  const sentenceRe = /[^.!?]+[.!?]+|\S+$/g;
  const chunks = s.match(sentenceRe) || [s];
  const out: string[] = [];
  let lastNorm = '';
  for (const ch of chunks) {
    const norm = ch.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!norm) continue;
    if (norm === lastNorm) continue;
    out.push(ch.trim());
    lastNorm = norm;
  }
  return out.join(' ');
}

function wsUrlToHttpBase(wsUrl: string): string {
  // ws://host/ws -> http://host
  // wss://host/ws -> https://host
  const httpish = wsUrl.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');
  return httpish.replace(/\/ws\/?$/i, '');
}

export class OpenAIRealtimeWebRTC {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadRaf: number | null = null;
  private lastLoudMs = 0;
  private wsUrl: string;
  private authToken: string;
  private model: string;
  private prospectType: string;
  private customScriptPrompt: string;
  private currentResponseText = '';
  private finalizedResponseText = ''; // Text finalized from response.text.done
  private lastGoodTranscript = '';
  private lastGoodTranscriptMs = 0;
  private responseInFlight = false;
  private pendingTranscript: string | null = null;
  private debug = false;
  private analysisTickTimer: number | null = null; // backup only
  private watchdogTimer: number | null = null;
  private lastResponseStartMs = 0;
  private lastTranscriptForAnalysis = '';
  private transcriptBuf = '';
  private deviceId: string | null = null;
  private onError?: (err: Error) => void;
  private onTranscript?: (text: string) => void;
  private onAiAnalysis?: (transcriptText: string, ai: RealtimeAiAnalysis) => void;

  // #region agent log
  // Railway-friendly debug helper: logs to console when enabled, and optionally forwards to backend WS via window hook.
  #dbg(tag: string, message: string, data: any) {
    if (!this.debug) return;
    try {
      // eslint-disable-next-line no-console
      console.log('[OAI-DBG]', tag, message, data);
    } catch {}
    try {
      const sink = (window as any).__OAI_DEBUG_SINK__;
      if (typeof sink === 'function') sink({ tag, message, data, ts: Date.now() });
    } catch {}
  }
  // #endregion

  constructor(opts: {
    wsUrl: string;
    authToken: string;
    model?: string;
    prospectType?: string;
    customScriptPrompt?: string;
    deviceId?: string | null;
    onTranscript?: (text: string) => void;
    onAiAnalysis?: (transcriptText: string, ai: RealtimeAiAnalysis) => void;
    onError?: (err: Error) => void;
  }) {
    this.wsUrl = opts.wsUrl;
    this.authToken = opts.authToken;
    this.model = opts.model || 'gpt-4o-realtime-preview';
    this.prospectType = opts.prospectType || 'unknown';
    this.customScriptPrompt = opts.customScriptPrompt || '';
    this.deviceId = opts.deviceId || null;
    this.onTranscript = opts.onTranscript;
    this.onAiAnalysis = opts.onAiAnalysis;
    this.onError = opts.onError;
    this.debug = Boolean((window as any).__OPENAI_REALTIME_DEBUG__);
  }

  async connect() {
    this.#dbg('connect', 'connect() start', { model: this.model, deviceId: this.deviceId || 'default' });
    // 1) Get ephemeral client_secret from backend
    const httpBase = wsUrlToHttpBase(this.wsUrl);
    this.#dbg('token', 'minting ephemeral token', { httpBase });
    const tokenResp = await fetch(`${httpBase}/api/openai/realtime-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const tokenJson = await tokenResp.json().catch(() => null);
    if (!tokenResp.ok) {
      this.#dbg('token', 'token mint failed', { status: tokenResp.status, body: tokenJson });
      throw new Error(`Failed to mint realtime token (${tokenResp.status})`);
    }
    const clientSecret =
      tokenJson?.client_secret?.value ||
      tokenJson?.client_secret ||
      tokenJson?.clientSecret ||
      null;
    const model = tokenJson?.model || this.model;
    if (!clientSecret) throw new Error('Realtime token missing client_secret.value');
    this.model = model;
    this.#dbg('token', 'token mint ok', { model: this.model });

    // 2) Get mic stream and create peer connection
    // Use strong constraints to improve transcription quality and avoid system-audio/echo issues.
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1
    };
    if (this.deviceId && this.deviceId !== 'default') {
      (audioConstraints as any).deviceId = { exact: this.deviceId };
    }
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
    this.#dbg('media', 'gotUserMedia ok', { audioTrackCount: this.mediaStream?.getAudioTracks?.().length || 0 });

    // Local VAD (no Whisper): use an analyser to detect when the user stops speaking.
    // This prevents us from requesting analysis on silence, which causes hallucinated/repeated transcripts.
    try {
      const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        const ctx: AudioContext = new AudioContextCtor();
        this.audioCtx = ctx;
        const source = ctx.createMediaStreamSource(this.mediaStream as MediaStream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        source.connect(this.analyser);

        const buf = new Uint8Array(this.analyser.fftSize);
        const THRESH = 0.018; // RMS threshold tuned for typical mics; adjust if needed
        const SILENCE_MS = 650;
        const loop = () => {
          if (!this.analyser) return;
          this.analyser.getByteTimeDomainData(buf);
          // RMS on normalized samples
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / buf.length);
          const now = Date.now();
          if (rms > THRESH) {
            this.lastLoudMs = now;
          } else {
            // If we had loud audio recently and now we're in silence, trigger an analysis tick once.
            if (this.lastLoudMs && (now - this.lastLoudMs) > SILENCE_MS) {
              // reset lastLoudMs so we don't spam
              this.lastLoudMs = 0;
              if (!this.responseInFlight && this.dc && this.dc.readyState === 'open') {
                this.#dbg('vad', 'local VAD triggered analysis tick', { THRESH, SILENCE_MS });
                this.requestAnalysisTick();
              }
            }
          }
          this.vadRaf = window.requestAnimationFrame(loop);
        };
        this.vadRaf = window.requestAnimationFrame(loop);
      }
    } catch {
      // If analyser fails, we fall back to timed ticks.
    }

    const pc = new RTCPeerConnection();
    this.pc = pc;

    // Add microphone track
    for (const track of this.mediaStream.getTracks()) {
      pc.addTrack(track, this.mediaStream);
    }

    // Data channel for events
    const dc = pc.createDataChannel('oai-events');
    this.dc = dc;
    dc.onmessage = (ev) => this.#onDataMessage(ev.data);
    dc.onopen = () => {
      this.#dbg('dc', 'datachannel open', { temperature: 0.6 });
      // Configure session: server VAD + gpt-4o-transcribe for audio-grounded transcription events.
      // Analysis is triggered when transcription completes, using the exact transcript text.
      this.#send({
        type: 'session.update',
        session: {
          modalities: ['text'],
          turn_detection: { type: 'server_vad' },
          // OpenAI Realtime enforces minimum temperature >= 0.6
          temperature: 0.6,
          // Use OpenAI's transcription stream to get audio-grounded transcript events.
          input_audio_transcription: {
            model: 'gpt-4o-transcribe',
            language: 'en',
            prompt: 'This is a real estate sales call. Transcribe exactly what is said, including filler words.'
          },
          instructions: this.#buildInstructions()
        }
      });

      // Disable periodic analysis ticks: analysis is triggered by transcription completion events.
      // Keep interval slot unused to avoid extra churn on silence.

      // Watchdog: if a response gets stuck (no response.done), unblock and continue.
      this.watchdogTimer = window.setInterval(() => {
        if (!this.responseInFlight) return;
        if (!this.lastResponseStartMs) return;
        if (Date.now() - this.lastResponseStartMs > 12000) {
          this.responseInFlight = false;
          this.currentResponseText = '';
          this.finalizedResponseText = '';
          this.#send({ type: 'response.cancel' });
        }
      }, 1000);
    };

    // 3) SDP exchange with OpenAI Realtime (WebRTC)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.#dbg('webrtc', 'created offer', { sdpLen: offer.sdp?.length || 0 });

    const sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp || ''
    });
    const answerSdp = await sdpResp.text();
    if (!sdpResp.ok) {
      this.#dbg('webrtc', 'SDP exchange failed', { status: sdpResp.status, bodyPreview: answerSdp.slice(0, 200) });
      throw new Error(`OpenAI Realtime SDP exchange failed (${sdpResp.status}): ${answerSdp.slice(0, 200)}`);
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    this.#dbg('webrtc', 'setRemoteDescription ok', { answerLen: answerSdp.length });
  }

  close() {
    try {
      this.dc?.close();
    } catch {}
    try {
      this.pc?.close();
    } catch {}
    try {
      this.mediaStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    this.dc = null;
    this.pc = null;
    this.mediaStream = null;
    this.responseInFlight = false;
    this.pendingTranscript = null;
    if (this.analysisTickTimer) window.clearInterval(this.analysisTickTimer);
    this.analysisTickTimer = null;
    if (this.watchdogTimer) window.clearInterval(this.watchdogTimer);
    this.watchdogTimer = null;
    this.lastResponseStartMs = 0;
    if (this.vadRaf) window.cancelAnimationFrame(this.vadRaf);
    this.vadRaf = null;
    try {
      this.audioCtx?.close();
    } catch {}
    this.audioCtx = null;
    this.analyser = null;
    this.lastLoudMs = 0;
  }

  requestAnalysisTick() {
    if (this.responseInFlight) return;
    this.responseInFlight = true;
    this.currentResponseText = '';
    this.finalizedResponseText = '';
    this.lastResponseStartMs = Date.now();
    this.#dbg('response', 'response.create start', { dcState: this.dc?.readyState || 'none' });
    // Cancel any ghost response then request a new one.
    this.#send({ type: 'response.cancel' });
    this.#send({
      type: 'response.create',
      response: {
        modalities: ['text'],
        instructions: this.#buildResponseInstructions(),
        max_output_tokens: 1400
      }
    });
  }

  requestAnalysisForTranscript(transcriptText: string) {
    const text = String(transcriptText || '').trim();
    if (!text) return;
    // OpenAI Realtime only allows one active response at a time. If we're still
    // waiting on the previous `response.create`, queue the latest transcript.
    if (this.responseInFlight) {
      this.pendingTranscript = text;
      return;
    }

    this.responseInFlight = true;
    this.lastTranscriptForAnalysis = text;

    // Make the transcript explicit as a conversation item, then request JSON analysis.
    this.#send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              `PROSPECT_TYPE: ${this.prospectType}\n` +
              (this.customScriptPrompt ? `CUSTOM_SCRIPT_PROMPT: ${this.customScriptPrompt}\n` : '') +
              `NEW_AUDIO_TRANSCRIPT: ${text}`
          }
        ]
      }
    });

    this.currentResponseText = '';
    this.finalizedResponseText = '';
    // Defensive: if OpenAI thinks a response is still active (event shape differences),
    // cancel before starting a new one.
    this.#send({ type: 'response.cancel' });
    this.#send({
      type: 'response.create',
      response: {
        modalities: ['text'],
        instructions: this.#buildResponseInstructions(),
        max_output_tokens: 1200
      }
    });
  }

  #send(obj: any) {
    if (!this.dc || this.dc.readyState !== 'open') return;
    try {
      this.dc.send(JSON.stringify(obj));
    } catch (e: any) {
      this.onError?.(new Error(e?.message || 'Failed to send to realtime'));
    }
  }

  #buildInstructions() {
    // Keep this short; detailed JSON spec is in response instructions.
    return (
      `You are a REAL-TIME sales call analyzer. ` +
      `Calls are between CLOSER (sales) and PROSPECT (customer). ` +
      `Wait for input audio transcription events; do not invent transcript text.`
    );
  }

  #buildResponseInstructions() {
    // Keep this closely aligned to the legacy multi-agent rubric (27 indicators + hot buttons + objections)
    // so the realtime model behaves like the prior system.
    return (
      `Output ONLY valid JSON. No markdown.\n` +
      `You are a REAL-TIME sales call analyzer.\n` +
      `CONTEXT: Calls between CLOSER (salesperson) and PROSPECT (potential customer).\n` +
      (this.customScriptPrompt
        ? `CUSTOM_SCRIPT_PROMPT: ${this.customScriptPrompt}\n`
        : '') +
      `\n` +
      `SPEAKER DETECTION:\n` +
      `- CLOSER: The salesperson asking questions, presenting offers, handling objections\n` +
      `- PROSPECT: The potential customer responding, raising concerns, expressing interest or objections\n` +
      `\n` +
      `IMPORTANT: The transcript is provided as NEW_AUDIO_TRANSCRIPT.\n` +
      `Analyze ONLY what is in NEW_AUDIO_TRANSCRIPT. Do not add or rewrite it.\n` +
      `\n` +
      `===== 27 INDICATORS (score 1-10, higher=stronger signal) =====\n` +
      `P1-PAIN/DESIRE GAP:\n` +
      `1-Pain Intensity\n` +
      `2-Pain Awareness\n` +
      `3-Desire Clarity\n` +
      `4-Desire Priority\n` +
      `\n` +
      `P2-URGENCY:\n` +
      `5-Time Pressure\n` +
      `6-Cost of Delay\n` +
      `7-Internal Timing\n` +
      `8-Environmental Availability\n` +
      `\n` +
      `P3-DECISIVENESS:\n` +
      `9-Decision Authority\n` +
      `10-Decision Style\n` +
      `11-Commitment to Decide\n` +
      `12-Self-Permission\n` +
      `\n` +
      `P4-MONEY AVAILABILITY:\n` +
      `13-Resource Access\n` +
      `14-Resource Fluidity\n` +
      `15-Investment Mindset\n` +
      `16-Resourcefulness\n` +
      `\n` +
      `P5-OWNERSHIP:\n` +
      `17-Problem Recognition\n` +
      `18-Solution Ownership\n` +
      `19-Locus of Control\n` +
      `20-Action Integrity\n` +
      `\n` +
      `P6-PRICE SENSITIVITY (REVERSE - high score = LESS price sensitive):\n` +
      `21-Emotional Response to Price\n` +
      `22-Negotiation Reflex\n` +
      `23-Structural Rigidity\n` +
      `\n` +
      `P7-TRUST:\n` +
      `24-ROI Belief\n` +
      `25-External Trust\n` +
      `26-Internal Trust\n` +
      `27-Risk Tolerance\n` +
      `\n` +
      `===== HOT BUTTONS (PROSPECT ONLY) =====\n` +
      `IMPORTANT: Only detect hot buttons from what the PROSPECT says, NOT the closer!\n` +
      `- Quote MUST be exact words the PROSPECT said (exact substring from analysisTextUsed or recent context)\n` +
      `- Score 1-10 based on emotional intensity\n` +
      `\n` +
      `===== OBJECTIONS (PROSPECT ONLY) =====\n` +
      `IMPORTANT: Only detect objections from what the PROSPECT says, NOT the closer!\n` +
      `For each objection provide fear, whisper, rebuttalScript.\n` +
      (this.customScriptPrompt
        ? `Rebuttal scripts MUST incorporate CUSTOM_SCRIPT_PROMPT context.\n`
        : '') +
      `\n` +
      `===== TRUTH INDEX SIGNALS =====\n` +
      `- coherenceSignals: contradictions, hesitations, deflections, confidence markers\n` +
      `- overallCoherence: high|medium|low\n` +
      `\n` +
      `CRITICAL RULES:\n` +
      `1. Score indicators based on ACTUAL evidence. If unknown, omit the key.\n` +
      `2. Hot buttons and objections ONLY from PROSPECT speech.\n` +
      `3. Output compact JSON only.\n` +
      `Return JSON EXACTLY like:\n` +
      `{\n` +
      `  "speaker":"closer|prospect|unknown",\n` +
      `  "indicatorSignals":{"1":7},\n` +
      `  "hotButtonDetails":[{"id":5,"quote":"exact PROSPECT words","contextualPrompt":"follow-up question","score":8}],\n` +
      `  "objections":[{"objectionText":"exact PROSPECT words","probability":0.8,"fear":"...","whisper":"...","rebuttalScript":"..."}],\n` +
      `  "askedQuestions":[1],\n` +
      `  "detectedRules":[{"ruleId":"T1","evidence":"quote","confidence":0.8}],\n` +
      `  "coherenceSignals":["..."],\n` +
      `  "overallCoherence":"high|medium|low",\n` +
      `  "insights":{"summary":"...","keyMotivators":["..."],"concerns":["..."],"recommendation":"...","closingReadiness":"ready|almost|not_ready"}\n` +
      `}\n`
    );
  }

  #onDataMessage(data: any) {
    let msg: any;
    try {
      msg = JSON.parse(typeof data === 'string' ? data : String(data));
    } catch {
      return;
    }

    const t = String(msg?.type || '');
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('[OAI-RT]', t, msg);
    }
    if (msg?.error) {
      const errMsg = String(msg.error?.message || 'OpenAI Realtime error');
      this.#dbg('error', 'OpenAI error event', { type: t, errMsg: errMsg.slice(0, 180) });
      // Benign: cancel can fail if nothing is active; don't spam UI.
      if (errMsg.toLowerCase().includes('no active response')) {
        return;
      }
      // If we accidentally tried to create a response while one is still active,
      // keep the inFlight flag set and wait for the done event.
      if (errMsg.toLowerCase().includes('active response')) {
        this.responseInFlight = true;
      }
      this.onError?.(new Error(errMsg));
      return;
    }

    // === Input audio transcription events (audio-grounded transcript) ===
    if (t.includes('input_audio_transcription')) {
      const delta =
        (typeof msg?.delta === 'string' && msg.delta) ||
        (typeof msg?.delta?.transcript === 'string' && msg.delta.transcript) ||
        (typeof msg?.delta?.text === 'string' && msg.delta.text) ||
        null;
      const isDelta = t.includes('delta');
      const isDone = t.includes('completed') || t.includes('done') || t.includes('final');
      if (isDelta && delta) {
        this.transcriptBuf += delta;
        return;
      }
      if (isDone) {
        const full =
          (typeof msg?.transcript === 'string' && msg.transcript) ||
          (typeof msg?.transcription?.text === 'string' && msg.transcription.text) ||
          this.transcriptBuf;
        this.transcriptBuf = '';
        const transcript = sanitizeTranscript(collapseConsecutiveSentenceRepeats(String(full || '').trim()));
        if (transcript) {
          const now = Date.now();
          if (!(transcript === this.lastGoodTranscript && now - this.lastGoodTranscriptMs < 2500)) {
            this.lastGoodTranscript = transcript;
            this.lastGoodTranscriptMs = now;
            this.onTranscript?.(transcript);
          }
          this.requestAnalysisForTranscript(transcript);
        }
        return;
      }
      return;
    }

    // VAD / speech state events. Trigger analysis when speech stops.
    if (/speech_stopped|speech_end|speech_ended/i.test(t)) {
      if (!this.responseInFlight) {
        this.requestAnalysisTick();
      }
      return;
    }

    // Response text streaming
    const delta = msg?.delta ?? msg?.text?.delta ?? msg?.response?.output_text?.delta ?? msg?.output_text?.delta ?? null;
    if (typeof delta === 'string' && delta.length) {
      this.currentResponseText += delta;
      return;
    }

    // Some events provide full text at once
    const fullText = msg?.text ?? msg?.response?.output_text ?? msg?.output_text ?? null;
    if (typeof fullText === 'string' && fullText.trim().startsWith('{')) {
      this.currentResponseText = fullText;
    }

    // On response.text.done, finalize the text and clear accumulator to prevent corruption
    if (t === 'response.text.done' || t === 'response.output_text.done') {
      // Text streaming finished - extract if we don't have accumulated deltas
      if (!this.currentResponseText || !this.currentResponseText.trim()) {
        const extracted = extractTextFromResponseDone(msg);
        if (extracted) this.currentResponseText = extracted;
      }
      // Save finalized text and clear accumulator so new response deltas don't corrupt it
      this.finalizedResponseText = this.currentResponseText;
      this.currentResponseText = '';
      // Don't call onAiAnalysis yet - wait for final response.done
      return;
    }

    if (t === 'response.done' || t === 'response.completed' || t === 'response.cancelled') {
      // Use finalized text if available, otherwise try extraction from this event
      let textToParse = this.finalizedResponseText || this.currentResponseText;
      if (!textToParse || !textToParse.trim()) {
        const extracted = extractTextFromResponseDone(msg);
        if (extracted) textToParse = extracted;
      }
      const parsed = safeJsonParse(textToParse);
      this.#dbg('response', 'response.done received', { type: t, textLen: (textToParse || '').length, parsedOk: !!parsed });
      if (parsed && this.onAiAnalysis) {
        // Analysis-only payload. Transcript comes from input_audio_transcription events.
        this.onAiAnalysis(this.lastTranscriptForAnalysis || this.lastGoodTranscript || '', parsed);
      }
      this.currentResponseText = '';
      this.finalizedResponseText = '';
      this.responseInFlight = false;
      this.lastResponseStartMs = 0;

      // If a newer transcript arrived while we were generating, run analysis again (latest wins).
      if (this.pendingTranscript) {
        const next = this.pendingTranscript;
        this.pendingTranscript = null;
        // Avoid deep recursion if events are synchronous; schedule next tick.
        setTimeout(() => this.requestAnalysisForTranscript(next), 0);
      }
    }
  }
}

