import { WebSocket as WS } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Debug logging - no-op in production (logs go to Railway console instead)
function dbg() {}

/**
 * ElevenLabs Scribe v2 Realtime STT
 * - Requires PCM 16-bit little-endian at 16kHz (we stream this from the frontend)
 * - Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
 */
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'scribe_v2_realtime';
// Use VAD commit strategy - Scribe commits on natural pauses in speech.
// This produces much better transcription quality than manual commits which fragment words.
// NOTE: Too-low VAD thresholds can treat noise as speech → hallucinated transcripts.
const ELEVENLABS_URL =
  `wss://api.elevenlabs.io/v1/speech-to-text/realtime?` +
  `model_id=${encodeURIComponent(ELEVENLABS_MODEL_ID)}` +
  `&language_code=en` +
  `&audio_format=pcm_16000` +
  `&commit_strategy=vad` +
  // Balance: too-low threshold can hallucinate; too-high can miss speech (no transcripts).
  // Controlled-test evidence: our audio often has <0.5s pauses (e.g. 0.4s max quiet in a 5s window),
  // so 0.5s can prevent commits entirely. Use 0.3s to ensure commits happen.
  `&vad_silence_threshold_secs=0.3` +
  `&vad_threshold=0.25`;

class ElevenLabsScribeRealtime {
  constructor({ onError, onTranscript } = {}) {
    this.onError = onError;
    this.onTranscript = onTranscript; // Callback for committed transcripts (VAD-based)
    this.ws = null;
    this.connected = false;
    this.closed = false; // true = user explicitly closed, don't reconnect
    this.lastCommitted = '';
    this.lastPartial = '';
    this.sentFirstChunk = false; // previous_text only allowed on first chunk
  }

  async connect() {
    if (this.connected) return;
    if (this.closed) throw new Error('Scribe session closed');
    if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY missing');

    // #region agent log
    dbg('S1', 'backend/realtime/listener.js:connect', 'Connecting ElevenLabs Scribe WS', {
      model: ELEVENLABS_MODEL_ID
    });
    // #endregion

    this.ws = new WS(ELEVENLABS_URL, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });

    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('ElevenLabs connect timeout')), 15000);
      this.ws.on('open', () => {
        clearTimeout(t);
        this.connected = true;
        // New session = can send previous_text on first chunk again
        this.sentFirstChunk = false;
        // Runtime evidence in Railway logs (no secrets)
        console.log('[S1] ElevenLabs Scribe WS open', { model: ELEVENLABS_MODEL_ID });
        // #region agent log
        dbg('S1', 'backend/realtime/listener.js:connect', 'ElevenLabs WS open');
        // #endregion
        resolve();
      });
      this.ws.on('error', (err) => {
        clearTimeout(t);
        reject(err);
      });
    });

    this.ws.on('message', (raw) => this.#onMessage(raw));
    this.ws.on('close', (code, reason) => {
      // IMPORTANT: do not permanently "close" on transient disconnects.
      this.connected = false;
      const reasonStr = Buffer.isBuffer(reason) ? reason.toString('utf8') : String(reason || '');
      console.log('[S3] ElevenLabs Scribe WS closed', { code, reason: reasonStr.slice(0, 200) });
      // #region debug log H5
      try{require('fs').appendFileSync('/home/sparky/Documents/github-realestste-demo-main/.cursor/debug.log',JSON.stringify({location:'listener.js:76',message:'Scribe WS closed',data:{code,reason:reasonStr.slice(0,200),closed:this.closed},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})+'\n');}catch(e){}
      // #endregion
      this.ws = null;
    });
    this.ws.on('error', (err) => {
      this.connected = false;
      this.ws = null;
      console.log('[S3] ElevenLabs Scribe WS error', { msg: err?.message || String(err) });
      if (this.onError) this.onError(err);
    });
  }

  close() {
    this.closed = true;
    this.connected = false;
    try {
      this.ws?.close();
    } catch {}
  }

  #onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    const t = String(msg?.message_type || '');
    // Log ALL messages from ElevenLabs for debugging
    console.log('[SCRIBE-MSG]', { 
      type: t, 
      hasText: !!msg?.text,
      textLen: msg?.text?.length || 0,
      textPreview: msg?.text?.slice?.(0, 50) || '(none)',
      keys: Object.keys(msg || {}).slice(0, 8).join(',')
    });

    if (t === 'partial_transcript') {
      const text = String(msg?.text || '').trim();
      if (text) {
        this.lastPartial = text;
        // With VAD, send partial transcripts to callback for real-time UI updates
        if (this.onTranscript) {
          this.onTranscript(text, false); // false = not committed
        }
      }
      return;
    }

    if (
      t === 'committed_transcript' ||
      t === 'committed_transcript_with_timestamps' ||
      t === 'final_transcript' ||
      t === 'final_transcript_with_timestamps'
    ) {
      const text = String(msg?.text || '').trim();
      if (!text) return;

      // Dedup common repeats
      if (text === this.lastCommitted) return;
      this.lastCommitted = text;
      this.lastPartial = '';

      console.log('[S2] ElevenLabs committed transcript', { len: text.length, preview: text.slice(0, 80) });

      // With VAD, send committed transcripts to callback
      if (this.onTranscript) {
        this.onTranscript(text, true); // true = committed
      }
      return;
    }

    // Surface auth/quota/etc errors (do not log secrets)
    const tl = t.toLowerCase();
    // message_type can be "scribe_auth_error", "scribeQuotaExceededError", etc.
    if (tl.includes('error')) {
      const errMsg = String(msg?.message || msg?.error || t);
      console.log('[S3] ElevenLabs Scribe error msg', { msgType: t, errMsg: String(errMsg).slice(0, 140) });
      // #region agent log
      dbg('S3', 'backend/realtime/listener.js:#onMessage', 'Scribe error message', {
        msgType: t,
        errMsg
      });
      // #endregion
      if (this.onError) this.onError(new Error(errMsg));
    }
  }

  async sendPcmChunk(pcmBuffer, previousText = '') {
    // If we were disconnected, reconnect.
    if (!this.connected) {
      // If closed=true, user explicitly closed - don't reconnect
      if (this.closed) {
        console.log('[S-CLOSED] Scribe session permanently closed, not reconnecting');
        return '';
      }
      console.log('[S-RECONNECT] Scribe disconnected, attempting reconnect...');
      try {
        await this.connect();
        console.log('[S-RECONNECT-OK] Reconnected successfully');
      } catch (e) {
        console.log('[S-RECONNECT-FAIL]', { err: e?.message });
        return '';
      }
    }
    if (!this.ws || this.ws.readyState !== WS.OPEN) {
      console.log('[S-NOT-OPEN] WS not open after connect', { wsState: this.ws?.readyState, closed: this.closed });
      return '';
    }

    // reset partial before sending
    this.lastPartial = '';

    const payload = {
      message_type: 'input_audio_chunk',
      audio_base_64: Buffer.from(pcmBuffer).toString('base64'),
      sample_rate: 16000,
      // Don't include commit:true - using VAD-based commits for better quality
    };
    // IMPORTANT: do NOT send previous_text. It can bias the model and cause unrelated phrases
    // to appear when noise/VAD triggers. We want pure audio-only transcription.
    this.sentFirstChunk = true;

    // #region agent log
    dbg('S2', 'backend/realtime/listener.js:sendPcmChunk', 'Sending PCM chunk', {
      bytes: Buffer.byteLength(pcmBuffer)
    });
    // #endregion

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (e) {
      console.log('[S-SEND-FAIL] WS send failed', { err: e?.message || String(e) });
      return '';
    }

    // With VAD, don't wait for commits per-chunk - just return partial transcripts for real-time feel.
    // Committed transcripts come asynchronously when Scribe detects pauses.
    // Give a short wait for partial to arrive, then return whatever we have.
    await new Promise(r => setTimeout(r, 150));
    return this.lastPartial || '';
  }
}

export async function createRealtimeConnection({ onTranscript, onChunk, onError }) {
  let conversationHistory = '';
  let isConnected = true;
  // Cap history so long sessions don't grow prompt size unbounded (prevents slowdown)
  const MAX_HISTORY_CHARS = Number(process.env.MAX_TRANSCRIPT_CHARS || 8000);
  // IMPORTANT:
  // Frontend streams ~85ms frames (4096@48k → resampled to 16k). If we "throttle" by returning early,
  // we DROP audio and Scribe hears chopped speech → hallucinations / wrong transcripts.
  // Instead, we BUFFER all audio and FLUSH at a configurable interval.
  const AUDIO_FLUSH_INTERVAL_MS = Number(process.env.AUDIO_MIN_INTERVAL_MS || 250);
  const AUDIO_MAX_PENDING_MS = Number(process.env.AUDIO_MAX_PENDING_MS || 600);
  const AUDIO_MAX_PENDING_BYTES = Number(process.env.AUDIO_MAX_PENDING_BYTES || (16000 * 2 * 1)); // 1s of PCM16@16k
  let lastAudioFlushMs = 0;
  let audioChunkCount = 0;
  let pendingPcm = Buffer.alloc(0);

  function looksLikeHallucination(text) {
    const t = String(text || '').trim().toLowerCase();
    if (!t) return true;
    // Common STT hallucinations on silence / noise
    const badPhrases = [
      'thank you for watching',
      'thanks for watching',
      'like and subscribe',
      'subscribe to my channel',
      'hit the bell',
      'music',
      'applause',
      'disclaimer',
      'fema.gov',
      'for more information visit'
    ];
    if (badPhrases.some((p) => t.includes(p))) return true;
    // URLs are almost always hallucinations in this app context
    if (t.includes('http://') || t.includes('https://') || t.includes('www.')) return true;
    return false;
  }

function sanitizeTranscript(text) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  // Strip common hallucinated suffixes rather than dropping the whole chunk.
  const cutMarkers = [
    ' disclaimer',
    'disclaimer',
    'http://',
    'https://',
    'www.',
    'fema.gov',
    'sites.google.com',
    'for more information'
  ];
  let cutAt = -1;
  for (const m of cutMarkers) {
    const idx = lower.indexOf(m);
    if (idx !== -1 && (cutAt === -1 || idx < cutAt)) cutAt = idx;
  }
  const trimmed = (cutAt === -1 ? raw : raw.slice(0, cutAt)).trim();
  // If what's left is too small, treat as noise. Allow single words (e.g., "Hello", "Yes", "No")
  if (trimmed.split(/\s+/).filter(Boolean).length < 1) return '';
  return trimmed;
}

  // Handler for committed transcripts from Scribe (VAD-based commits)
  const handleScribeTranscript = (text, isCommitted) => {
    if (!text || !isCommitted) return; // Only process committed transcripts
    
    const trimmed = String(text).trim();
    if (!trimmed) return;
    if (looksLikeHallucination(trimmed)) {
      console.log('[SCRIBE-COMMIT] Rejected hallucination', { preview: trimmed.slice(0, 60) });
      return;
    }
    const cleaned = sanitizeTranscript(trimmed);
    if (!cleaned) return;
    if (looksLikeHallucination(cleaned)) return;
    
    console.log('[SCRIBE-COMMIT] Accepted', { len: cleaned.length, preview: cleaned.slice(0, 80) });
    
    // Send chunk to frontend for display (via onChunk callback)
    if (onChunk && isConnected) {
      try {
        onChunk(cleaned);
      } catch (e) {
        console.error('[SCRIBE-COMMIT] onChunk error:', e);
      }
    }
    
    // Add to conversation history
    conversationHistory += cleaned + ' ';
    if (conversationHistory.length > MAX_HISTORY_CHARS) {
      conversationHistory = conversationHistory.slice(conversationHistory.length - MAX_HISTORY_CHARS);
    }
    
    // Trigger analysis on committed transcripts
    if (onTranscript && isConnected) {
      onTranscript(conversationHistory, null, '', null).catch(err => {
        console.error('[SCRIBE-COMMIT] Analysis error:', err);
      });
    }
  };

  const scribe = new ElevenLabsScribeRealtime({ 
    onError,
    onTranscript: handleScribeTranscript
  });

  try {
    const connection = {
      // Send audio data (from browser microphone)
      sendAudio: async (audioData, mimeType = '') => {
        // Runtime evidence for Railway logs
        const chunkNum = ++audioChunkCount;
        console.log(`[A1] sendAudio chunk #${chunkNum}`, {
          bytes: audioData?.length || audioData?.byteLength || 0,
          scribeConnected: scribe.connected,
          scribeClosed: scribe.closed
        });
        try {
          const now = Date.now();
          // Always buffer audio; do NOT drop frames.
          const buf = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData || []);
          pendingPcm = pendingPcm.length ? Buffer.concat([pendingPcm, buf]) : buf;

          const pendingAgeMs = lastAudioFlushMs ? (now - lastAudioFlushMs) : 0;
          const shouldFlush =
            !lastAudioFlushMs ||
            (now - lastAudioFlushMs) >= AUDIO_FLUSH_INTERVAL_MS ||
            pendingPcm.length >= AUDIO_MAX_PENDING_BYTES ||
            pendingAgeMs >= AUDIO_MAX_PENDING_MS;

          if (!shouldFlush) {
            return { text: '' };
          }

          const pcmToSend = pendingPcm;
          pendingPcm = Buffer.alloc(0);
          lastAudioFlushMs = now;
          console.log('[A1] flushing audio to Scribe', {
            bytes: pcmToSend.length,
            flushIntervalMs: AUDIO_FLUSH_INTERVAL_MS,
            maxPendingMs: AUDIO_MAX_PENDING_MS,
            maxPendingBytes: AUDIO_MAX_PENDING_BYTES
          });

          // Expect PCM16@16k from frontend. Ignore mimeType; kept for backward compatibility.
          // We intentionally do NOT send previous_text to Scribe (see sendPcmChunk).
          const text = await scribe.sendPcmChunk(pcmToSend, '');
          const trimmed = String(text || '').trim();
          console.log(`[A2] Scribe returned for chunk #${chunkNum}`, {
            textLen: trimmed.length,
            preview: trimmed.slice(0, 60) || '(empty)'
          });
          if (!trimmed) return { text: '' };
          if (looksLikeHallucination(trimmed)) {
            console.log(`[A3] Rejected hallucination chunk #${chunkNum}`, { preview: trimmed.slice(0, 60) });
            return { text: '' };
          }
          const cleaned = sanitizeTranscript(trimmed);
          if (!cleaned) {
            console.log(`[A3] Sanitized to empty chunk #${chunkNum}`, { before: trimmed.slice(0, 60) });
            return { text: '' };
          }
          if (looksLikeHallucination(cleaned)) {
            console.log(`[A3] Post-sanitize hallucination chunk #${chunkNum}`, { cleaned: cleaned.slice(0, 60) });
            return { text: '' };
          }
          console.log(`[A4] Accepted chunk #${chunkNum}`, { cleanedLen: cleaned.length });
          return { text: cleaned };
        } catch (error) {
          console.log(`[A5] sendAudio error chunk #${chunkNum}`, { err: error?.message || String(error) });
          console.error('Audio processing error:', error);
          if (onError) onError(error);
          return { text: '', error: error.message };
        }
      },
      
      // Send text transcript (from frontend or transcription)
      sendTranscript: async (text, prospectType = null, customScriptPrompt = '', pillarWeights = null) => {
        if (!text || text.trim().length === 0) return;
        
        conversationHistory += text + ' ';
        // Trim from the left if history exceeds cap (keep most recent context)
        if (conversationHistory.length > MAX_HISTORY_CHARS) {
          conversationHistory = conversationHistory.slice(conversationHistory.length - MAX_HISTORY_CHARS);
        }
        console.log(`[Realtime] Received transcript chunk: "${text.trim()}" (total history: ${conversationHistory.length} chars)`);
        
        // Trigger analysis on transcript updates
        if (onTranscript && isConnected) {
          try {
            await onTranscript(conversationHistory, prospectType, customScriptPrompt, pillarWeights);
          } catch (error) {
            console.error('[Realtime] Transcript analysis error:', error);
            if (onError) onError(error);
          }
        }
      },
      
      close: () => {
        isConnected = false;
        try {
          scribe.close();
        } catch {}
      },
      
      isConnected: () => isConnected,
      
      getHistory: () => conversationHistory
    };

    return connection;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

// Alternative: Use OpenAI's audio transcription API for real-time processing
export async function processAudioStream(audioStream, onTranscript) {
  try {
    return {
      start: () => {
        console.log('Audio processing started');
      },
      stop: () => {
        console.log('Audio processing stopped');
      }
    };
  } catch (error) {
    console.error('Audio processing error:', error);
    throw error;
  }
}
