import { WebSocket as WS } from 'ws';

/**
 * OpenAI Realtime API bridge (TEXT mode).
 *
 * Why TEXT mode:
 * - Browser MediaRecorder outputs webm/opus, which is not a supported Realtime input audio format.
 * - We can still get most of the Realtime benefits (persistent session memory + streaming + low overhead)
 *   by feeding transcript chunks and having the Realtime model emit a single JSON "aiAnalysis" payload.
 *
 * Env:
 * - OPENAI_API_KEY (required)
 * - OPENAI_REALTIME_MODEL (optional; default gpt-4o-realtime-preview)
 */

const DEFAULT_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview';

function safeJsonParse(text) {
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

export class RealtimeAnalysisSession {
  constructor({
    apiKey,
    model = DEFAULT_MODEL,
    instructions,
    temperature = 0
  }) {
    this.apiKey = apiKey;
    this.model = model;
    this.instructions = instructions;
    this.temperature = temperature;

    this.ws = null;
    this.connected = false;
    this.closed = false;

    this.currentText = '';
    this.pendingResolve = null;
    this.pendingReject = null;
    this.pendingTimer = null;
    this.inFlight = false;
    this.hasPending = false;
    this.pendingPayload = null;
  }

  async connect() {
    if (this.connected) return;
    if (!this.apiKey) throw new Error('OPENAI_API_KEY missing');

    const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(this.model)}`;
    this.ws = new WS(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Realtime connect timeout')), 15000);
      this.ws.on('open', () => {
        clearTimeout(t);
        resolve();
      });
      this.ws.on('error', (err) => {
        clearTimeout(t);
        reject(err);
      });
    });

    this.ws.on('message', (raw) => this.#onMessage(raw));
    this.ws.on('close', () => {
      this.connected = false;
      this.closed = true;
      this.#failPending(new Error('Realtime session closed'));
    });
    this.ws.on('error', (err) => {
      this.connected = false;
      this.#failPending(err);
    });

    this.connected = true;

    // Configure session.
    this.#send({
      type: 'session.update',
      session: {
        modalities: ['text'],
        instructions: this.instructions,
        temperature: this.temperature
      }
    });
  }

  close() {
    this.closed = true;
    this.connected = false;
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.#failPending(new Error('Realtime session closed'));
  }

  /**
   * Request updated aiAnalysis JSON given a new transcript chunk.
   * Coalesces rapid updates to avoid spamming the Realtime session.
   */
  async analyzeChunk({ chunkText, prospectType, customScriptPrompt }) {
    if (this.closed) throw new Error('Realtime session closed');
    await this.connect();

    const payload = { chunkText, prospectType, customScriptPrompt };
    if (this.inFlight) {
      this.hasPending = true;
      this.pendingPayload = payload;
      return null;
    }

    return await this.#runOnce(payload);
  }

  async #runOnce(payload) {
    this.inFlight = true;
    this.currentText = '';

    const { chunkText, prospectType, customScriptPrompt } = payload;

    // Add message to conversation (the Realtime session keeps memory).
    this.#send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              `PROSPECT_TYPE: ${prospectType || 'unknown'}\n` +
              (customScriptPrompt ? `CUSTOM_SCRIPT_PROMPT: ${customScriptPrompt}\n` : '') +
              `NEW_TEXT: ${chunkText}`
          }
        ]
      }
    });

    // Ask for updated state (JSON only).
    this.#send({
      type: 'response.create',
      response: {
        modalities: ['text'],
        instructions:
          'Return ONLY valid JSON, no markdown. Update state based on the entire conversation so far.',
        max_output_tokens: 1200
      }
    });

    const result = await new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
      this.pendingTimer = setTimeout(() => {
        this.pendingResolve = null;
        this.pendingReject = null;
        reject(new Error('Realtime analysis timeout'));
      }, 12000);
    });

    this.inFlight = false;

    if (this.hasPending && this.pendingPayload) {
      const next = this.pendingPayload;
      this.hasPending = false;
      this.pendingPayload = null;
      // Fire and forget: next update will come in soon and UI will catch up.
      void this.#runOnce(next).catch(() => {});
    }

    return result;
  }

  #send(obj) {
    if (!this.ws || this.ws.readyState !== WS.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }

  #failPending(err) {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    if (this.pendingReject) this.pendingReject(err);
    this.pendingResolve = null;
    this.pendingReject = null;
  }

  #finishPending(text) {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    const parsed = safeJsonParse(text);
    if (!parsed) {
      this.#failPending(new Error('Realtime returned invalid JSON'));
      return;
    }
    if (this.pendingResolve) this.pendingResolve(parsed);
    this.pendingResolve = null;
    this.pendingReject = null;
  }

  #onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    const t = msg?.type || '';

    // Different Realtime implementations may emit different event names.
    // We handle multiple common shapes defensively.
    const delta =
      msg?.delta ??
      msg?.text?.delta ??
      msg?.response?.output_text?.delta ??
      msg?.response?.text?.delta ??
      msg?.output_text?.delta ??
      null;

    if (typeof delta === 'string' && delta.length) {
      this.currentText += delta;
      return;
    }

    // Some events provide full text at once
    const fullText =
      msg?.text ??
      msg?.response?.output_text ??
      msg?.response?.text ??
      msg?.output_text ??
      null;

    if (typeof fullText === 'string' && fullText.trim().startsWith('{')) {
      this.currentText = fullText;
      this.#finishPending(this.currentText);
      return;
    }

    // Common "done" events
    if (
      t === 'response.done' ||
      t === 'response.text.done' ||
      t === 'response.output_text.done'
    ) {
      this.#finishPending(this.currentText);
    }
  }
}

