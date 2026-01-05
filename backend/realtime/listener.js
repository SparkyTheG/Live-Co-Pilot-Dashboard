import { WebSocket as WS } from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// #region agent debug-mode log (HTTP ingest) - keep tiny, no secrets
const DEBUG_INGEST =
  'http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a';
function dbg(hypothesisId, location, message, data = {}) {
  fetch(DEBUG_INGEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'scribe-v2',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now()
    })
  }).catch(() => {});
}
// #endregion

/**
 * ElevenLabs Scribe v2 Realtime STT
 * - Requires PCM 16-bit little-endian at 16kHz (we stream this from the frontend)
 * - Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
 */
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'scribe_v2_realtime';
// Use MANUAL commit strategy; we send discrete ~0.6s PCM chunks from the browser and explicitly commit each chunk.
// This ensures we get committed transcripts even on short recordings (no need to wait for VAD silence).
const ELEVENLABS_URL =
  `wss://api.elevenlabs.io/v1/speech-to-text/realtime?` +
  `model_id=${encodeURIComponent(ELEVENLABS_MODEL_ID)}` +
  `&language_code=en` +
  `&audio_format=pcm_16000` +
  `&commit_strategy=manual`;

class ElevenLabsScribeRealtime {
  constructor({ onError } = {}) {
    this.onError = onError;
    this.ws = null;
    this.connected = false;
    // "closed" should mean user-requested close() only.
    // Network disconnects should be reconnectable.
    this.closed = false;
    this.pending = []; // FIFO resolves: (text) => void
    this.lastCommitted = '';
    this.lastPartial = '';
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
      // #region agent log
      dbg('S3', 'backend/realtime/listener.js:close', 'Scribe WS closed', { code, reason: reasonStr.slice(0, 200) });
      // #endregion
      this.ws = null;
      this.#flushPending('');
    });
    this.ws.on('error', (err) => {
      this.connected = false;
      this.ws = null;
      this.#flushPending('');
      console.log('[S3] ElevenLabs Scribe WS error', { msg: err?.message || String(err) });
      // #region agent log
      dbg('S3', 'backend/realtime/listener.js:error', 'Scribe WS error', { msg: err?.message || String(err) });
      // #endregion
      if (this.onError) this.onError(err);
    });
  }

  close() {
    this.closed = true;
    this.connected = false;
    try {
      this.ws?.close();
    } catch {}
    this.#flushPending('');
  }

  #flushPending(text) {
    while (this.pending.length) {
      const r = this.pending.shift();
      try {
        r(text);
      } catch {}
    }
  }

  #onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    const t = String(msg?.message_type || '');
    // Always log message types for debugging (no secrets).
    // #region agent log
    dbg('S2', 'backend/realtime/listener.js:#onMessage', 'Scribe message', {
      message_type: t,
      keys: msg && typeof msg === 'object' ? Object.keys(msg).slice(0, 12) : []
    });
    // #endregion

    if (t === 'partial_transcript') {
      const text = String(msg?.text || '').trim();
      if (text) this.lastPartial = text;
      return;
    }

    if (t === 'committed_transcript' || t === 'committed_transcript_with_timestamps') {
      const text = String(msg?.text || '').trim();
      if (!text) return;

      // Dedup common repeats
      if (text === this.lastCommitted) return;
      this.lastCommitted = text;
      this.lastPartial = '';

      console.log('[S2] ElevenLabs committed transcript', { len: text.length, preview: text.slice(0, 80) });
      // #region agent log
      dbg('S2', 'backend/realtime/listener.js:#onMessage', 'Committed transcript received', {
        textLen: text.length,
        preview: text.slice(0, 120)
      });
      // #endregion

      const r = this.pending.shift();
      if (r) r(text);
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
      await this.connect();
    }
    if (!this.ws || this.ws.readyState !== WS.OPEN) return '';

    // reset partial before sending
    this.lastPartial = '';

    const payload = {
      message_type: 'input_audio_chunk',
      audio_base_64: Buffer.from(pcmBuffer).toString('base64'),
      commit: true,
      sample_rate: 16000,
      ...(previousText ? { previous_text: String(previousText).slice(-500) } : {})
    };

    // #region agent log
    dbg('S2', 'backend/realtime/listener.js:sendPcmChunk', 'Sending PCM chunk', {
      bytes: Buffer.byteLength(pcmBuffer)
    });
    // #endregion

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (e) {
      // #region agent log
      dbg('S3', 'backend/realtime/listener.js:sendPcmChunk', 'WS send failed', { msg: e?.message || String(e) });
      // #endregion
      return '';
    }

    // Resolve when we get a committed transcript.
    // If we never get a commit (rare), fall back to last partial so UI/analysis can still progress.
    return await Promise.race([
      new Promise((resolve) => this.pending.push(resolve)),
      new Promise((resolve) =>
        setTimeout(() => resolve(this.lastPartial || ''), 2500)
      )
    ]);
  }
}

export async function createRealtimeConnection({ onTranscript, onError }) {
  let conversationHistory = '';
  let isConnected = true;
  // Cap history so long sessions don't grow prompt size unbounded (prevents slowdown)
  const MAX_HISTORY_CHARS = Number(process.env.MAX_TRANSCRIPT_CHARS || 8000);
  const AUDIO_MIN_INTERVAL_MS = Number(process.env.AUDIO_MIN_INTERVAL_MS || 250);
  let lastAudioTranscribeMs = 0;

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
  // If what's left is too small, treat as noise.
  if (trimmed.split(/\s+/).filter(Boolean).length < 3) return '';
  return trimmed;
}

  const scribe = new ElevenLabsScribeRealtime({ onError });

  try {
    const connection = {
      // Send audio data (from browser microphone)
      sendAudio: async (audioData, mimeType = '') => {
        try {
          const now = Date.now();
          if (now - lastAudioTranscribeMs < AUDIO_MIN_INTERVAL_MS) {
            return { text: '' };
          }
          lastAudioTranscribeMs = now;

          // Expect PCM16@16k from frontend. Ignore mimeType; kept for backward compatibility.
          // Avoid feeding bad hallucinated context back into Scribe as previous_text.
          const safePrev =
            conversationHistory && !looksLikeHallucination(conversationHistory)
              ? conversationHistory
              : '';
          const text = await scribe.sendPcmChunk(audioData, safePrev);
          const trimmed = String(text || '').trim();
          if (!trimmed) return { text: '' };
          if (looksLikeHallucination(trimmed)) return { text: '' };
          const cleaned = sanitizeTranscript(trimmed);
          if (!cleaned) return { text: '' };
          if (looksLikeHallucination(cleaned)) return { text: '' };
          return { text: cleaned };
        } catch (error) {
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
