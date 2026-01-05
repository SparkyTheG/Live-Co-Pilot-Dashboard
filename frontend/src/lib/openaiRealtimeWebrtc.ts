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

function requireExactMatch(a: string, b: string): boolean {
  return String(a || '').trim() === String(b || '').trim();
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
  private wsUrl: string;
  private authToken: string;
  private model: string;
  private prospectType: string;
  private customScriptPrompt: string;
  private currentResponseText = '';
  private lastGoodTranscript = '';
  private lastGoodTranscriptMs = 0;
  private responseInFlight = false;
  private pendingTranscript: string | null = null;
  private debug = false;
  private hadSpeechSinceLastTick = false;
  private analysisTickTimer: number | null = null;
  private deviceId: string | null = null;
  private onError?: (err: Error) => void;
  private onTranscript?: (text: string) => void;
  private onAiAnalysis?: (transcriptText: string, ai: RealtimeAiAnalysis) => void;

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
    // 1) Get ephemeral client_secret from backend
    const httpBase = wsUrlToHttpBase(this.wsUrl);
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
      // Configure session: server VAD. We DO NOT use a separate transcription model (no Whisper/gpt-4o-transcribe).
      // Instead, we ask the realtime model itself to output transcriptText + aiAnalysis JSON.
      this.#send({
        type: 'session.update',
        session: {
          modalities: ['text'],
          turn_detection: { type: 'server_vad' },
          // OpenAI Realtime enforces minimum temperature >= 0.6
          temperature: 0.6,
          instructions: this.#buildInstructions()
        }
      });

      // Fallback: request an analysis tick periodically (only if speech happened)
      this.analysisTickTimer = window.setInterval(() => {
        if (!this.responseInFlight && this.hadSpeechSinceLastTick) {
          this.requestAnalysisTick();
        }
      }, 2500);
    };

    // 3) SDP exchange with OpenAI Realtime (WebRTC)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

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
      throw new Error(`OpenAI Realtime SDP exchange failed (${sdpResp.status}): ${answerSdp.slice(0, 200)}`);
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
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
    this.hadSpeechSinceLastTick = false;
    if (this.analysisTickTimer) window.clearInterval(this.analysisTickTimer);
    this.analysisTickTimer = null;
  }

  requestAnalysisTick() {
    if (this.responseInFlight) return;
    this.responseInFlight = true;
    this.hadSpeechSinceLastTick = false;
    this.currentResponseText = '';
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
      `Transcribe audio accurately.`
    );
  }

  #buildResponseInstructions() {
    return (
      `Output ONLY valid JSON. No markdown.\n` +
      `You are listening to LIVE AUDIO from the user.\n` +
      `First, output rawTranscriptText as the VERBATIM transcript of ONLY the newest audio segment you just heard.\n` +
      `STRICT TRANSCRIPTION RULES (no "improving"):\n` +
      `- Language: English.\n` +
      `- Preserve filler words, false starts, stutters, and informal phrasing.\n` +
      `- Do NOT correct grammar.\n` +
      `- Do NOT paraphrase.\n` +
      `- Do NOT add information that wasn't spoken.\n` +
      `- Do NOT add extra words.\n` +
      `- Do NOT repeat the same phrase multiple times.\n` +
      `- Do NOT repeat earlier segments.\n` +
      `- If unclear/silence/noise, set rawTranscriptText to "".\n` +
      `Second, output analysisTextUsed which MUST be EXACTLY rawTranscriptText (character-for-character).\n` +
      `Then output analysis based ONLY on analysisTextUsed.\n` +
      `Rules: Objections + hot buttons ONLY from PROSPECT speech.\n` +
      (this.customScriptPrompt
        ? `Use CUSTOM_SCRIPT_PROMPT (${this.customScriptPrompt}) to tailor rebuttalScript to the business/product.\n`
        : '') +
      `Return JSON EXACTLY like:\n` +
      `{\n` +
      `  "rawTranscriptText":"verbatim transcript of the newest audio segment (English)",\n` +
      `  "analysisTextUsed":"MUST EXACTLY equal rawTranscriptText",\n` +
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

    // VAD / speech state events. Trigger analysis when speech stops.
    if (/speech_stopped|speech_end|speech_ended/i.test(t)) {
      this.hadSpeechSinceLastTick = true;
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

    if (
      t === 'response.done' ||
      t === 'response.completed' ||
      t === 'response.text.done' ||
      t === 'response.output_text.done' ||
      t === 'response.cancelled'
    ) {
      const parsed = safeJsonParse(this.currentResponseText);
      if (parsed && this.onAiAnalysis) {
        const rawTranscriptTextRaw = String(parsed?.rawTranscriptText || '').trim();
        const analysisTextUsedRaw = String(parsed?.analysisTextUsed || '').trim();

        // Enforce that analysisTextUsed is EXACTLY the transcript we display (no "improving" before analysis).
        const ok = requireExactMatch(rawTranscriptTextRaw, analysisTextUsedRaw);
        const rawTranscriptText = ok ? sanitizeTranscript(rawTranscriptTextRaw) : '';
        if (!rawTranscriptText) return;

        if (!ok && this.debug) {
          // eslint-disable-next-line no-console
          console.warn('[OAI-RT] analysisTextUsed mismatch; dropping for safety', {
            rawTranscriptTextRaw,
            analysisTextUsedRaw
          });
        }

        // UI shows exactly what model returned (we only filter obvious prompt leaks / noise).
        const now = Date.now();
        if (!(rawTranscriptText === this.lastGoodTranscript && now - this.lastGoodTranscriptMs < 2500)) {
          this.lastGoodTranscript = rawTranscriptText;
          this.lastGoodTranscriptMs = now;
          this.onTranscript?.(rawTranscriptText);
        }

        // Strip transcript fields out of aiAnalysis payload before forwarding.
        const { rawTranscriptText: _rt, analysisTextUsed: _atu, transcriptText: _legacy, ...ai } = parsed || {};
        this.onAiAnalysis(rawTranscriptText, ai);
      }
      this.currentResponseText = '';
      this.responseInFlight = false;

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

