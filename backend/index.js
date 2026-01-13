import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRealtimeConnection } from './realtime/listener.js';
import { analyzeConversationProgressive } from './analysis/engine.js';
import { createUserSupabaseClient, isSupabaseConfigured } from './supabase.js';
import { runConversationSummaryAgent, runSpeakerRoleAgent } from './analysis/aiAgents.js';

dotenv.config();

// Build/version marker for runtime verification (set in Railway as BACKEND_BUILD_SHA)
const BACKEND_BUILD_SHA = process.env.BACKEND_BUILD_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown';
console.log('[BOOT] backend starting', {
  BACKEND_BUILD_SHA,
  hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
  hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
  hasRealtimeModelEnv: Boolean(process.env.OPENAI_REALTIME_MODEL),
  realtimeDisabled: process.env.OPENAI_REALTIME_DISABLED === 'true',
  supabaseConfigured: isSupabaseConfigured()
});

// Debug-mode instrumentation removed after verification.

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/ws'
});

// Store active connections
const connections = new Map();
// Store per-connection persistence metadata
const connectionPersistence = new Map(); // connectionId -> { authToken, sessionId, userId, userEmail, lastTranscriptPersistMs, conversationHistory, lastSummaryMs, summaryId }

// Ping all connections every 10 seconds to keep them alive (Railway proxy times out idle connections)
const PING_INTERVAL = 10000;
const CONNECTION_TIMEOUT = 35000; // Mark connection dead if no pong in 35 seconds

const pingInterval = setInterval(() => {
  const now = Date.now();
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      // Check if connection is dead (no pong received)
      if (ws.isAlive === false) {
        console.log(`[WS] Terminating unresponsive connection (no pong received)`);
        return ws.terminate();
      }
      
      // Check if connection has been inactive too long
      if (ws.lastActivity && (now - ws.lastActivity) > CONNECTION_TIMEOUT) {
        console.log(`[WS] Connection inactive for ${Math.round((now - ws.lastActivity) / 1000)}s, sending ping`);
      }
      
      // Mark as not alive, will be set true on pong
      ws.isAlive = false;
      ws.ping();
    }
  });
}, PING_INTERVAL);

// -----------------------------------------------------------------------------
// Minimal per-connection heartbeat (every 10s)
// Helps diagnose "stops updating after ~30s" issues on Railway.
// -----------------------------------------------------------------------------
const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  for (const [connectionId, ws] of connections.entries()) {
    const meta = connectionPersistence.get(connectionId) || {};
    const lastActivity = Number(ws?.lastActivity || 0);
    const lastChunkMs = Number(meta._lastChunkMs || 0);
    const lastAnalysisMs = Number(meta._lastAnalysisMs || 0);
    const lastAnalysisOkMs = Number(meta._lastAnalysisOkMs || 0);
    const pending = Boolean(meta._analysisPending);
    const pendingStart = Number(meta._analysisPendingStart || 0);
    const seq = Number(meta._analysisSeq || 0);
    const dirty = Boolean(meta._analysisDirty);
    const lastErr = String(meta._lastAnalysisErr || '').slice(0, 160);
    const wsState = typeof ws?.readyState === 'number' ? ws.readyState : -1;

    console.log('[HB]', {
      conn: String(connectionId).slice(-8),
      wsState,
      ageActivityS: lastActivity ? Math.round((now - lastActivity) / 1000) : null,
      ageChunkS: lastChunkMs ? Math.round((now - lastChunkMs) / 1000) : null,
      pending,
      pendingAgeS: pending && pendingStart ? Math.round((now - pendingStart) / 1000) : null,
      ageAnalysisStartS: lastAnalysisMs ? Math.round((now - lastAnalysisMs) / 1000) : null,
      ageAnalysisOkS: lastAnalysisOkMs ? Math.round((now - lastAnalysisOkMs) / 1000) : null,
      seq,
      dirty,
      lastErr: lastErr || null
    });
  }
}, 10000);

// Clean up interval on server close
process.on('SIGINT', () => {
  clearInterval(pingInterval);
  clearInterval(heartbeatInterval);
  wss.close();
  process.exit(0);
});

// Process-level crash visibility (Railway will restart the container)
process.on('unhandledRejection', (reason) => {
  console.error('[PROC] unhandledRejection', { reason: String(reason || '') });
});
process.on('uncaughtException', (err) => {
  console.error('[PROC] uncaughtException', { message: err?.message, stack: err?.stack });
});

// Helpful boot log to correlate with Railway container restarts (no secrets)
console.log('[BOOT] backend started', {
  ts: new Date().toISOString(),
  hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
  hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY)
});

process.on('SIGTERM', () => {
  clearInterval(pingInterval);
  clearInterval(heartbeatInterval);
  wss.close();
  process.exit(0);
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  connections.set(connectionId, ws);
  connectionPersistence.set(connectionId, {
    authToken: null,
    sessionId: null,
    userId: null,
    userEmail: null,
    lastTranscriptPersistMs: 0,
    conversationHistory: '',
    lastSummaryMs: 0,
    summaryId: null,
    // Settings/config
    prospectType: '',
    customScriptPrompt: '',
    pillarWeights: null,
    // Plain transcript (no labels) for deterministic calculations
    plainTranscript: '',
    // Client mode: backend_transcribe (default) or websocket_transcribe (frontend sends text)
    clientMode: 'backend_transcribe',
    // Heartbeat diagnostics
    _lastChunkMs: 0,
    _lastAnalysisOkMs: 0,
    _lastAnalysisErr: ''
  });

  // Track last activity time
  ws.isAlive = true;
  ws.lastActivity = Date.now();

  // Handle pong responses
  ws.on('pong', () => {
    ws.isAlive = true;
    ws.lastActivity = Date.now();
  });

  console.log(`New WebSocket connection: ${connectionId}`);

  ws.on('message', async (message) => {
    try {
      // Update activity timestamp
      ws.lastActivity = Date.now();
      ws.isAlive = true;

      const data = JSON.parse(message.toString());

      if (data.type === 'start_listening') {
        // Start real-time conversation listening
        console.log(`[WS] Received start_listening from ${connectionId}`);
        // Capture config/settings for this connection (used for audio-driven transcription as well)
        {
          const meta = connectionPersistence.get(connectionId) || { authToken: null, sessionId: null, userId: null };
          meta.clientMode = typeof data.config?.clientMode === 'string' ? data.config.clientMode : (meta.clientMode || 'backend_transcribe');
          meta.prospectType = typeof data.config?.prospectType === 'string' ? data.config.prospectType : (meta.prospectType || '');
          meta.customScriptPrompt = typeof data.config?.customScriptPrompt === 'string' ? data.config.customScriptPrompt : (meta.customScriptPrompt || '');
          meta.pillarWeights = Array.isArray(data.config?.pillarWeights) ? data.config.pillarWeights : (meta.pillarWeights || null);
          connectionPersistence.set(connectionId, meta);

          // Runtime evidence in Railway logs (no secrets)
          console.log('[A1] start_listening env check', {
            hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
            hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
            hasRealtimeModelEnv: Boolean(process.env.OPENAI_REALTIME_MODEL),
            disabled: process.env.OPENAI_REALTIME_DISABLED === 'true'
          });
          // Log custom script prompt for debugging
          console.log('[A1] Custom script prompt stored:', {
            hasCustomScript: Boolean(meta.customScriptPrompt),
            customScriptPrompt: meta.customScriptPrompt || '(none)',
            prospectType: meta.prospectType || '(none)'
          });

          // OpenAI Realtime analysis sessions removed. We use GPT-4o-mini agents for analysis.
        }
        // Capture auth token (if present) for Supabase persistence under RLS
        if (data.authToken && typeof data.authToken === 'string') {
          const meta = connectionPersistence.get(connectionId) || { authToken: null, sessionId: null, userId: null };
          meta.authToken = data.authToken;
          connectionPersistence.set(connectionId, meta);
        }

        // Clean up any existing realtime connection first (in case of restart)
        const existingConnection = realtimeConnections.get(connectionId);
        if (existingConnection) {
          console.log(`[WS] Cleaning up existing realtime connection for ${connectionId} before starting new one`);
          try {
            existingConnection.close();
          } catch (e) {
            console.warn(`[WS] Error closing existing connection:`, e);
          }
          realtimeConnections.delete(connectionId);
        }

        // Only start backend transcription if the client is streaming audio to backend.
        // For clientMode=websocket_transcribe, the browser sends text transcripts (Web Speech API),
        // so we must NOT start ElevenLabs/Realtime STT.
        const metaAfterConfig = connectionPersistence.get(connectionId);
        const cm = metaAfterConfig?.clientMode || 'backend_transcribe';
        if (cm === 'backend_transcribe') {
          console.log(`[WS] clientMode=backend_transcribe: starting backend STT`);
        await startRealtimeListening(connectionId, data.config);
        } else {
          console.log(`[WS] clientMode=${cm}: skipping backend STT (no ElevenLabs)`);
        }

        // Create a call session in Supabase (if configured + authed)
        const meta = connectionPersistence.get(connectionId);
        console.log(`[WS] Creating session - authToken: ${meta?.authToken ? 'present' : 'MISSING'}, supabase: ${isSupabaseConfigured() ? 'configured' : 'NOT CONFIGURED'}`);
        if (meta?.authToken && isSupabaseConfigured()) {
          const supabase = createUserSupabaseClient(meta.authToken);
          if (supabase) {
            // Resolve user id from token so RLS inserts work with explicit user_id
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
              console.warn(`[WS] Auth getUser error: ${userError.message}`);
            }
            const userId = userData?.user?.id || null;
            const userEmail = userData?.user?.email || null;
            console.log(`[WS] Resolved user: ${userEmail || 'NO EMAIL'}, userId: ${userId || 'NO ID'}`);
            
            meta.userId = userId;
            meta.userEmail = userEmail;
            if (userId) {
              // IMPORTANT: Store userId, userEmail, and prospectType in meta for later use by summary agent
              meta.userId = userId;
              meta.userEmail = userEmail;
              meta.prospectType = data.config?.prospectType || '';
              meta.sessionStartTime = Date.now(); // Store start time for duration calculation
              connectionPersistence.set(connectionId, meta);
              console.log(`[WS] Stored userId=${userId}, userEmail=${userEmail}, prospectType=${meta.prospectType} in connection meta`);

              const { data: sessionRow, error } = await supabase
                .from('call_sessions')
                .insert({
                  user_id: userId,
                  user_email: userEmail || '',
                  prospect_type: meta.prospectType,
                  connection_id: connectionId
                })
                .select('id')
                .single();
              if (error) {
                console.warn(`[WS] Supabase call_sessions insert failed: ${error.message}`);
              } else {
                meta.sessionId = sessionRow?.id || null;
                connectionPersistence.set(connectionId, meta);
                console.log(`[WS] Session created: sessionId=${meta.sessionId}, ready for summaries`);
                sendToClient(connectionId, { type: 'session_started', sessionId: meta.sessionId });
              }
            } else {
              console.warn(`[WS] No userId resolved from auth token - summaries will not work`);
            }
          }
        }
      } else if (data.type === 'stop_listening') {
        // Stop listening
        stopListening(connectionId);
        // Mark session ended and generate final summary
        const meta = connectionPersistence.get(connectionId);
        if (meta?.authToken && meta?.sessionId && meta?.userId && isSupabaseConfigured()) {
          const supabase = createUserSupabaseClient(meta.authToken);
          if (supabase) {
            // Use prospect type from meta (most reliable) or from stop_listening message
            const finalProspectType = meta.prospectType || data.prospectType || '';
            console.log(`[${connectionId}] Stopping session with prospectType: ${finalProspectType}`);

            // Update session end time and prospect type
            void supabase
              .from('call_sessions')
              .update({ 
                ended_at: new Date().toISOString(), 
                updated_at: new Date().toISOString(),
                prospect_type: finalProspectType // Ensure prospect type is saved
              })
              .eq('id', meta.sessionId)
              .eq('user_id', meta.userId)
              .then(({ error }) => {
                if (error) console.warn(`[WS] Failed to update session ended_at: ${error.message}`);
                else console.log(`[${connectionId}] Session marked as ended`);
              })
              .catch(() => {});

            // Generate FINAL summary of entire conversation
            const formattedTranscript = meta.conversationHistory || '';
            if (formattedTranscript.length > 100) {
              console.log(`[${connectionId}] Generating FINAL conversation summary with prospectType: ${finalProspectType}`);
              runConversationSummaryAgent(formattedTranscript, finalProspectType, true)
                .then((summaryResult) => {
                  if (summaryResult && !summaryResult.error) {
                    const summaryData = {
                      session_id: meta.sessionId,
                      user_id: meta.userId,
                      user_email: meta.userEmail || '',
                      prospect_type: finalProspectType,
                      summary_json: summaryResult,
                      is_final: true,
                      updated_at: new Date().toISOString()
                    };

                    void supabase
                      .from('call_summaries')
                      .upsert(summaryData, { onConflict: 'session_id' })
                      .then(({ error }) => {
                        if (error) {
                          console.warn(`[WS] Final summary upsert failed: ${error.message}`);
                        } else {
                          console.log(`[${connectionId}] Final summary generated and saved`);
                        }
                      })
                      .catch(() => {});
                  }
                })
                .catch((err) => {
                  console.warn(`[${connectionId}] Final summary generation error: ${err.message}`);
                });
            }
          }
        }
      } else if (data.type === 'transcript') {
        // Receive transcript from frontend (from audio transcription or manual input)
        // Ignore empty transcripts (used for keepalive)
        if (!data.text || data.text.trim().length === 0) {
          console.log(`[WS] Received keepalive ping from ${connectionId}`);
          // Respond so the browser client updates its lastMessageTime and doesn't consider the socket "stale"
          sendToClient(connectionId, { type: 'keepalive_ack', ts: Date.now() });
          return;
        }
        const meta = connectionPersistence.get(connectionId);
        await handleIncomingTextChunk(connectionId, {
          chunkText: data.text,
          prospectType: (typeof data.prospectType === 'string' ? data.prospectType : '') || meta?.prospectType || '',
          customScriptPrompt: (typeof data.customScriptPrompt === 'string' ? data.customScriptPrompt : '') || meta?.customScriptPrompt || '',
          pillarWeights: data.pillarWeights ?? meta?.pillarWeights ?? null,
          clientTsMs: typeof data.clientTsMs === 'number' ? data.clientTsMs : null
        });
      } else if (data.type === 'settings_update') {
        // Allow mid-call updates to settings that affect analysis (pillar weights, prompts).
        const meta = connectionPersistence.get(connectionId) || { authToken: null, sessionId: null, userId: null };
        const prevCustom = meta.customScriptPrompt || '';
        const prevWeights = meta.pillarWeights ? JSON.stringify(meta.pillarWeights) : null;
        
        const nextCustom = typeof data.customScriptPrompt === 'string' ? data.customScriptPrompt : meta.customScriptPrompt || '';
        const nextWeights = Array.isArray(data.pillarWeights) ? data.pillarWeights : meta.pillarWeights || null;
        const nextWeightsStr = nextWeights ? JSON.stringify(nextWeights) : null;
        
        // Check if settings actually changed
        const settingsChanged = (nextCustom !== prevCustom) || (nextWeightsStr !== prevWeights);
        
        meta.customScriptPrompt = nextCustom;
        meta.pillarWeights = nextWeights;
        connectionPersistence.set(connectionId, meta);
        console.log(`[WS] settings_update stored for ${connectionId.slice(-6)}`, {
          hasCustomScript: Boolean(nextCustom),
          pillarWeightsCount: Array.isArray(nextWeights) ? nextWeights.length : 0,
          settingsChanged
        });
        
        // ONLY re-run analysis if settings actually changed (avoid unnecessary re-analysis)
        if (settingsChanged) {
          scheduleAnalysis(connectionId, {}, { force: true, reason: 'settings_update' });
        }
        
        // Optional ack so frontend can update lastMessageTime if desired
        sendToClient(connectionId, { type: 'settings_update_ack', ts: Date.now() });
      } else if (data.type === 'debug_event') {
        // Debug-only: allows frontend to emit structured logs visible in Railway.
        // Never log secrets.
        try {
          console.log('[DEBUG_EVENT]', {
            connectionId: connectionId.slice(-8),
            tag: String(data?.tag || ''),
            message: String(data?.message || ''),
            data: data?.data && typeof data.data === 'object' ? data.data : null,
            ts: data?.ts || Date.now()
          });
        } catch {}
      } else if (data.type === 'audio_chunk') {
        // Receive audio chunk from frontend
        let realtimeConnection = realtimeConnections.get(connectionId);
        if (!realtimeConnection) {
          await startRealtimeListening(connectionId, {});
          realtimeConnection = realtimeConnections.get(connectionId);
        }
        if (realtimeConnection) {
          const mimeType = String(data.mimeType || '');
          // ElevenLabs Scribe expects PCM16@16k. If the frontend is still on the old MediaRecorder(WebM) build,
          // passing those bytes as PCM causes the "FEMA/disclaimer" hallucination spam.
          const isPcm16k = mimeType.includes('pcm_16000') || mimeType.toLowerCase().includes('pcm');
          if (!isPcm16k && process.env.ALLOW_NON_PCM_AUDIO !== 'true') {
            sendToClient(connectionId, {
              type: 'error',
              message:
                'Audio format mismatch: backend expects PCM16@16k (mimeType=pcm_16000). Please redeploy the latest frontend build that streams PCM (not MediaRecorder/webm).'
            });
            return;
          }
          // Convert base64 to buffer if needed
          const audioBuffer = Buffer.from(data.audio, 'base64');
          // Feed audio to Scribe. Committed transcripts are handled via the connection's onChunk callback (VAD-based),
          // which then calls handleIncomingTextChunk and updates the UI.
          await realtimeConnection.sendAudio(audioBuffer, mimeType);
        }
      } else if (data.type === 'prospect_type_changed') {
        // Handle prospect type change
        // Store prospect type in connection meta for summaries
        const meta = connectionPersistence.get(connectionId);
        if (meta) {
          meta.prospectType = data.prospectType || '';
          connectionPersistence.set(connectionId, meta);
          console.log(`[WS] Prospect type updated to: ${meta.prospectType}`);
        }
        // Also update the realtime connection
        const realtimeConnection = realtimeConnections.get(connectionId);
        if (realtimeConnection) {
          realtimeConnection.currentProspectType = data.prospectType;
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      sendToClient(connectionId, {
        type: 'error',
        message: error.message
      });
    }
  });

  ws.on('close', (code, reason) => {
    const reasonStr = (() => {
      try { return Buffer.isBuffer(reason) ? reason.toString() : String(reason || ''); } catch { return ''; }
    })();
    console.log(`[WS] Connection closed: ${connectionId}`, { code, reason: reasonStr });
    connections.delete(connectionId);
    // IMPORTANT: Do NOT finalize/end sessions on transient WS close.
    // Railway/proxies can drop websockets; we only finalize on explicit stop_listening.
    console.log(`[WS] Close cleanup complete (no finalization) for ${connectionId}`);
    connectionPersistence.delete(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Error for ${connectionId}:`, { message: error?.message, name: error?.name });
    connections.delete(connectionId);
    connectionPersistence.delete(connectionId);
  });

  // Send welcome message
  sendToClient(connectionId, {
    type: 'connected',
    connectionId
  });
});

// Store active realtime connections and their last known good analysis
const realtimeConnections = new Map();
const lastGoodAnalysis = new Map();

// Analysis scheduling constants
const ANALYSIS_THROTTLE_MS = 400; // Min time between analyses (normal transcript-driven runs)
const ANALYSIS_MAX_PENDING_MS = 25000; // Stuck detection: force-clear pending after this long

// Helper function to send data to client
function sendToClient(connectionId, data) {
  const ws = connections.get(connectionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    const messageStr = JSON.stringify(data);
    console.log(`[WS] Sending to ${connectionId}:`, data.type, {
      hotButtons: data.data?.hotButtons?.length || 0,
      objections: data.data?.objections?.length || 0
    });
    ws.send(messageStr);
  } else {
    console.warn(`[WS] Cannot send to ${connectionId}: WebSocket not open (state: ${ws?.readyState})`);
  }
}

/**
 * Schedule an analysis run for the given connection using the latest transcript/settings.
 * This is used both on new transcript chunks and on settings updates (so changes apply immediately).
 */
function scheduleAnalysis(connectionId, overrides = {}, opts = {}) {
  const { force = false, reason = 'unknown' } = opts || {};
  const meta = connectionPersistence.get(connectionId);
  if (!meta) return;

  const now = Date.now();

  // Stuck detection: if pending for too long, force clear it
  if (meta._analysisPending && meta._analysisPendingStart && (now - meta._analysisPendingStart) > ANALYSIS_MAX_PENDING_MS) {
    console.warn(`[${connectionId.slice(-6)}] Analysis stuck for ${now - meta._analysisPendingStart}ms, force clearing`);
    meta._analysisPending = false;
    meta._analysisPendingStart = 0;
  }

  const lastRun = meta._lastAnalysisMs || 0;
  const tooSoon = (now - lastRun) < ANALYSIS_THROTTLE_MS;

  // If analysis is running or throttled, mark dirty so we run a catch-up pass ASAP.
  if (meta._analysisPending || (!force && tooSoon)) {
    meta._analysisDirty = true;
    meta._analysisDirtyTs = now;
    connectionPersistence.set(connectionId, meta);
    return;
  }

  // Capture current state for the async task (LATEST transcript + LATEST settings)
  const transcriptSnapshot = String(meta.plainTranscript || overrides.textFallback || '').trim();
  // #region debug log - hypothesis A/C
  fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:530',message:'Transcript snapshot for analysis',data:{connId:connectionId.slice(-6),transcriptLength:transcriptSnapshot.length,transcriptLast200:transcriptSnapshot.slice(-200),reason},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
  // #endregion
  if (transcriptSnapshot.length < 5) return; // don't run analysis on near-empty transcript

  // Track what we've already analyzed for hot buttons/objections to avoid re-detecting old ones
  const lastAnalyzedLength = meta._lastAnalyzedTranscriptLength || 0;
  const newTextOnly = lastAnalyzedLength > 0 ? transcriptSnapshot.slice(lastAnalyzedLength) : transcriptSnapshot;
  const hasNewText = newTextOnly.trim().length > 0;

  const ptSnapshot = (typeof overrides.prospectType === 'string' ? overrides.prospectType : null) || meta.prospectType || null;
  const csSnapshot =
    (typeof overrides.customScriptPrompt === 'string' ? overrides.customScriptPrompt : '') || meta.customScriptPrompt || '';
  const pwSnapshot =
    (overrides.pillarWeights !== undefined ? overrides.pillarWeights : null) ?? meta.pillarWeights ?? null;

  // Sequence guard: ensures stale analysis results can't overwrite newer ones
  meta._analysisSeq = (meta._analysisSeq || 0) + 1;
  const seq = meta._analysisSeq;

  // Mark as running with timestamp
  meta._analysisPending = true;
  meta._analysisPendingStart = now;
  meta._lastAnalysisMs = now;
  meta._lastAnalysisErr = '';
  connectionPersistence.set(connectionId, meta);

  // Run in background - don't await
  setImmediate(async () => {
    try {
      console.log(
        `[${connectionId.slice(-6)}] Running AI analysis seq=${seq} (${transcriptSnapshot.length} chars) reason=${reason}`
      );
      const sendPartialIfCurrent = (partial) => {
        const mCheck = connectionPersistence.get(connectionId);
        if (!mCheck || mCheck._analysisSeq !== seq) return;
        if (!partial || typeof partial !== 'object') return;

        // Special-case streaming deltas: forward as a dedicated WS message so the frontend
        // can consume without interfering with analysis_update merging.
        if (partial._stream && typeof partial._stream === 'object') {
          sendToClient(connectionId, {
            type: 'analysis_stream',
            data: {
              ...partial._stream,
              analysisSeq: seq
            }
          });
          return;
        }
        sendToClient(connectionId, {
          type: 'analysis_update',
          data: {
            ...partial,
            analysisSeq: seq,
            partial: true
          }
        });
      };

      const analysis = await analyzeConversationProgressive(
        transcriptSnapshot,
        ptSnapshot,
        csSnapshot,
        pwSnapshot,
        sendPartialIfCurrent,
        hasNewText ? newTextOnly : null // Only analyze new text for hot buttons/objections
      );

      // Only send if this is still the newest analysis run
      const mCheck = connectionPersistence.get(connectionId);
      if (mCheck && mCheck._analysisSeq === seq && analysis) {
        sendToClient(connectionId, {
          type: 'analysis_update',
          data: {
            ...analysis,
            analysisSeq: seq,
            hotButtons: Array.isArray(analysis.hotButtons) ? analysis.hotButtons : [],
            objections: Array.isArray(analysis.objections) ? analysis.objections : []
          }
        });

        // Update tracked length to avoid re-analyzing old text
        mCheck._lastAnalyzedTranscriptLength = transcriptSnapshot.length;
        connectionPersistence.set(connectionId, mCheck);

        // Mark last successful analysis time for heartbeat visibility
        const mOk = connectionPersistence.get(connectionId);
        if (mOk) {
          mOk._lastAnalysisOkMs = Date.now();
          mOk._lastAnalysisErr = '';
          connectionPersistence.set(connectionId, mOk);
        }
      } else {
        console.log(`[${connectionId.slice(-6)}] Dropping stale analysis seq=${seq} (newer seq present)`);
      }
    } catch (e) {
      console.warn(`[WS] AI analysis failed: ${e.message}`);
      const mErr = connectionPersistence.get(connectionId);
      if (mErr) {
        mErr._lastAnalysisErr = String(e?.message || e || '').slice(0, 300);
        connectionPersistence.set(connectionId, mErr);
      }
    } finally {
      const m1 = connectionPersistence.get(connectionId);
      if (m1) {
        m1._analysisPending = false;
        m1._analysisPendingStart = 0;

        // If a new transcript/settings update arrived while we were analyzing, immediately run a catch-up pass.
        const dirty = !!m1._analysisDirty;
        m1._analysisDirty = false;
        m1._analysisDirtyTs = 0;
        connectionPersistence.set(connectionId, m1);

        if (dirty) {
          // Force=true so we don't sit behind throttle when we're already behind.
          setImmediate(() => scheduleAnalysis(connectionId, {}, { force: true, reason: 'dirty_catchup' }));
        }
      }
    }
  });
}

async function handleIncomingTextChunk(connectionId, {
  chunkText,
  prospectType = '',
  customScriptPrompt = '',
  pillarWeights = null,
  clientTsMs = null
}) {
  const text = String(chunkText || '').trim();
  console.log(`[handleIncomingTextChunk] Received text: length=${text.length}, preview="${text.slice(0,100)}"`);
  if (!text) return;

  const toSpeakerLabel = (speaker) =>
    speaker === 'closer' ? 'CLOSER' : speaker === 'prospect' ? 'PROSPECT' : 'UNKNOWN';

  const rebuildConversationHistory = (meta) => {
    // Maintain a labeled transcript derived from per-chunk entries so we can update labels later
    const entries = Array.isArray(meta?.transcriptEntries) ? meta.transcriptEntries : [];
    const joined = entries
      .map((e) => `${toSpeakerLabel(e?.speaker)}: ${String(e?.text || '').trim()}`.trim())
      .filter(Boolean)
      .join('\n\n');
    const MAX_HISTORY_CHARS = 8000;
    meta.conversationHistory = joined.length > MAX_HISTORY_CHARS ? joined.slice(-MAX_HISTORY_CHARS) : joined;
  };
  
  // Debug: Log what we received including custom script prompt
  console.log(`[handleIncomingTextChunk] Received`, {
    connectionId: connectionId.slice(-8),
    textLen: text.length,
    customScriptPrompt: customScriptPrompt || '(EMPTY)',
    prospectType: prospectType || '(none)'
  });

  const chunkCharCount = text.length;

  // Get connection metadata
  const meta = connectionPersistence.get(connectionId);
  const conversationHistory = meta?.conversationHistory || '';
  if (meta) {
    meta._lastChunkMs = Date.now();
    connectionPersistence.set(connectionId, meta);
  }

  // Maintain a plain transcript (for deterministic calculations)
  if (meta) {
    // Drop obvious Whisper hallucination spam if it somehow slips through
    const lowered = text.toLowerCase();
    if (lowered.includes('thank you for watching') || lowered.includes('like and subscribe')) {
      // If this repeats, ignore it completely
      meta._lastBadPhrase = lowered;
      meta._badPhraseCount = (meta._badPhraseCount || 0) + 1;
      connectionPersistence.set(connectionId, meta);
      if (meta._badPhraseCount >= 1) return;
    } else {
      meta._badPhraseCount = 0;
      meta._lastBadPhrase = '';
    }

    // Deduplicate repeated identical transcripts
    if (meta._lastTranscriptText === text) {
      meta._repeatCount = (meta._repeatCount || 0) + 1;
      connectionPersistence.set(connectionId, meta);
      if (meta._repeatCount >= 1) return;
    } else {
      meta._repeatCount = 0;
      meta._lastTranscriptText = text;
    }

    meta.plainTranscript = (meta.plainTranscript ? meta.plainTranscript + ' ' : '') + text;
    // Keep it bounded
    const MAX_PLAIN = 12000;
    if (meta.plainTranscript.length > MAX_PLAIN) {
      meta.plainTranscript = meta.plainTranscript.slice(-MAX_PLAIN);
    }
    connectionPersistence.set(connectionId, meta);
  }

  // Speaker-role detection is a SIDE-CAR task:
  // - Must NOT block sending transcript chunks to the frontend
  // - Must NOT block scheduling the main analysis pipeline
  // We insert the chunk as unknown immediately, then update Supabase + session transcript when the AI returns.
  const speakerPromise = (async () => {
    try {
      const aiSpeaker = await runSpeakerRoleAgent(text, conversationHistory);
      const sp = String(aiSpeaker?.speaker || '').toLowerCase();
      if (sp.includes('closer')) return 'closer';
      if (sp.includes('prospect')) return 'prospect';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  })();

  const detectedSpeaker = 'unknown';

  // Track this chunk in-memory so we can re-label it later when speakerPromise completes.
  // Keep bounded so long calls don't bloat memory.
  let localChunkSeq = null;
  if (meta) {
    meta._chunkSeq = (meta._chunkSeq || 0) + 1;
    localChunkSeq = meta._chunkSeq;
    meta.transcriptEntries = Array.isArray(meta.transcriptEntries) ? meta.transcriptEntries : [];
    meta.transcriptEntries.push({ seq: localChunkSeq, speaker: detectedSpeaker, text });
    // Bound by count first (cheap), then by char cap via rebuildConversationHistory()
    const MAX_ENTRIES = 220;
    if (meta.transcriptEntries.length > MAX_ENTRIES) {
      meta.transcriptEntries = meta.transcriptEntries.slice(-MAX_ENTRIES);
    }
    rebuildConversationHistory(meta);
    connectionPersistence.set(connectionId, meta);
  }

  console.log(`[${connectionId.slice(-6)}] chunk: "${text.slice(0, 40)}..." speaker=${detectedSpeaker} (speaker AI async)`);

  // Send the transcribed chunk to the frontend for transparency/debugging
  sendToClient(connectionId, {
    type: 'transcript_chunk',
    data: {
      speaker: detectedSpeaker,
      text,
      ts: Date.now()
    }
  });

  // Run the 15 AI agents (throttled, with catch-up) using the shared scheduler.
  scheduleAnalysis(
    connectionId,
    { prospectType, customScriptPrompt, pillarWeights, textFallback: text },
    { force: false, reason: 'transcript' }
  );

  // NOTE: Progressive summary is handled in startRealtimeListening -> onTranscript (single place).

  // Persist transcript chunk to Supabase immediately (unknown), then update speaker_role asynchronously.
  if (meta?.authToken && meta?.sessionId && meta?.userId && isSupabaseConfigured()) {
    const supabase = createUserSupabaseClient(meta.authToken);
    if (supabase) {
      const insertPromise = supabase
        .from('call_transcript_chunks')
        .insert({
          session_id: meta.sessionId,
          user_id: meta.userId,
          user_email: meta.userEmail || '',
          speaker_role: detectedSpeaker,
          chunk_text: text,
          chunk_char_count: chunkCharCount,
          client_ts_ms: clientTsMs
        })
        .select('id')
        .single();

      // Update session with formatted transcript paragraph
      void supabase
        .from('call_sessions')
        .update({
          updated_at: new Date().toISOString(),
          transcript_text: meta.conversationHistory || '',
          transcript_char_count: (meta.conversationHistory || '').length,
          ...(prospectType ? { prospect_type: prospectType } : {})
        })
        .eq('id', meta.sessionId)
        .eq('user_id', meta.userId)
        .then(() => {})
        .catch(() => {});

      // When speaker AI returns + insert succeeded, update only that row + refresh session transcript.
      void Promise.allSettled([speakerPromise, insertPromise]).then(([spRes, insRes]) => {
        const sp = spRes.status === 'fulfilled' ? spRes.value : 'unknown';
        const insertedId = insRes.status === 'fulfilled' ? insRes.value?.data?.id : null;
        if (!insertedId) return;
        if (sp !== 'closer' && sp !== 'prospect') return;

        // Update the chunk row
        void supabase
          .from('call_transcript_chunks')
          .update({ speaker_role: sp })
          .eq('id', insertedId)
          .eq('user_id', meta.userId)
          .then(() => {})
          .catch(() => {});

        // Update in-memory transcript + session transcript_text (best-effort; does not affect analysis latency)
        const m2 = connectionPersistence.get(connectionId);
        if (m2 && Array.isArray(m2.transcriptEntries) && localChunkSeq != null) {
          const idx = m2.transcriptEntries.findIndex((e) => e?.seq === localChunkSeq);
          if (idx >= 0) {
            m2.transcriptEntries[idx] = { ...m2.transcriptEntries[idx], speaker: sp };
            rebuildConversationHistory(m2);
            connectionPersistence.set(connectionId, m2);

            void supabase
              .from('call_sessions')
              .update({
                updated_at: new Date().toISOString(),
                transcript_text: m2.conversationHistory || '',
                transcript_char_count: (m2.conversationHistory || '').length,
                ...(prospectType ? { prospect_type: prospectType } : {})
              })
              .eq('id', meta.sessionId)
              .eq('user_id', meta.userId)
              .then(() => {})
              .catch(() => {});
          }
        }
      });
    }
  }

}

async function startRealtimeListening(connectionId, config) {
  try {
    console.log(`[WS] Starting realtime listening for ${connectionId}`);
    sendToClient(connectionId, {
      type: 'listening_started',
      message: 'Starting real-time conversation analysis...'
    });

    const realtimeConnection = await createRealtimeConnection({
      // Called when a new transcript chunk is committed (VAD-based)
      // This triggers the FULL analysis pipeline including realtime AI
      onChunk: async (chunkText) => {
        const meta = connectionPersistence.get(connectionId);
        console.log(`[${connectionId}] VAD committed chunk`, {
          chunkPreview: chunkText.slice(0, 60),
          customScriptPrompt: meta?.customScriptPrompt || '(NONE - not set!)',
          prospectType: meta?.prospectType || '(none)'
        });
        // Trigger the full analysis pipeline (includes realtime AI analysis)
        await handleIncomingTextChunk(connectionId, {
          chunkText: chunkText,
          prospectType: meta?.prospectType || '',
          customScriptPrompt: meta?.customScriptPrompt || '',
          pillarWeights: meta?.pillarWeights ?? null,
          clientTsMs: Date.now()
        });
      },
      onTranscript: async (transcript, prospectType, customScriptPrompt, pillarWeights) => {
        try {
          // IMPORTANT: Avoid duplicate analysis runs.
          // Analysis is driven by committed chunks (onChunk -> handleIncomingTextChunk),
          // which includes sequence-guard + dirty catch-up logic.
          // This onTranscript callback is kept for persistence/summary only.
          console.log(`[${connectionId}] onTranscript received (persistence only)`, {
            transcriptLen: transcript?.length || 0,
            prospectType: prospectType || '(none)'
          });

          // Persist a readable "paragraph" snapshot with CLOSER:/PROSPECT: labels on the session row.
          // Uses the formatted conversationHistory which has speaker labels.
          const meta = connectionPersistence.get(connectionId);
          if (meta?.authToken && meta?.sessionId && meta?.userId && isSupabaseConfigured()) {
            const now = Date.now();
            // Limit update frequency to reduce DB writes during rapid updates
            if (!meta.lastTranscriptPersistMs || (now - meta.lastTranscriptPersistMs) > 5000) {
              meta.lastTranscriptPersistMs = now;
              connectionPersistence.set(connectionId, meta);
              const supabase = createUserSupabaseClient(meta.authToken);
              if (supabase) {
                // Use the formatted conversation history with speaker labels
                const formattedTranscript = meta.conversationHistory || '';
                void supabase
                  .from('call_sessions')
                  .update({
                    updated_at: new Date().toISOString(),
                    prospect_type: prospectType || '',
                    transcript_text: formattedTranscript,
                    transcript_char_count: formattedTranscript.length
                  })
                  .eq('id', meta.sessionId)
                  .eq('user_id', meta.userId)
                  .then(({ error }) => {
                    if (error) console.warn(`[WS] Supabase call_sessions transcript update failed: ${error.message}`);
                  })
                  .catch(() => {});
              }
            }

            // CONVERSATION SUMMARY: Continuously analyze and update summary (every 15 seconds for faster testing)
            // This runs in parallel with the main analysis, non-blocking
            const SUMMARY_INTERVAL_MS = 15000; // 15 seconds (reduced from 30s for faster testing)
            const timeSinceLastSummary = meta.lastSummaryMs ? (now - meta.lastSummaryMs) : SUMMARY_INTERVAL_MS + 1;
            console.log(`[${connectionId}] Summary check: timeSince=${timeSinceLastSummary}ms, transcriptLen=${(meta.conversationHistory || '').length}, sessionId=${meta.sessionId}`);
            
            if (timeSinceLastSummary > SUMMARY_INTERVAL_MS) {
              meta.lastSummaryMs = now;
              connectionPersistence.set(connectionId, meta);
              
              // Run summary analysis in background (non-blocking)
              const formattedTranscript = meta.conversationHistory || '';
              // Use prospect type from meta (set during start_listening) or current transcript message
              const summaryProspectType = meta.prospectType || prospectType || '';
              if (formattedTranscript.length > 50) { // Reduced from 100 for testing
                console.log(`[${connectionId}] Running conversation summary agent with prospectType: ${summaryProspectType}`);
                runConversationSummaryAgent(formattedTranscript, summaryProspectType, false)
                  .then((summaryResult) => {
                    console.log(`[${connectionId}] Summary agent result:`, summaryResult ? 'success' : 'null', summaryResult?.error || '');
                    if (summaryResult && !summaryResult.error && isSupabaseConfigured()) {
                      const supabase = createUserSupabaseClient(meta.authToken);
                      if (supabase) {
                        const summaryData = {
                          session_id: meta.sessionId,
                          user_id: meta.userId,
                          user_email: meta.userEmail || '',
                          prospect_type: summaryProspectType,
                          summary_json: summaryResult,
                          is_final: false,
                          updated_at: new Date().toISOString()
          };

                        // Upsert summary (update if exists, insert if new)
                        console.log(`[${connectionId}] Upserting summary to Supabase...`, { session_id: summaryData.session_id, user_id: summaryData.user_id });
                        void supabase
                          .from('call_summaries')
                          .upsert(summaryData, { onConflict: 'session_id' })
                          .then(({ error, data: upsertData }) => {
                            if (error) {
                              console.error(`[WS] Supabase summary upsert failed: ${error.message}`, error);
                            } else {
                              console.log(`[${connectionId}] Summary upserted successfully to Supabase`);
                            }
                          })
                          .catch((err) => { console.error(`[WS] Summary upsert exception:`, err); });
                      }
                    }
                  })
                  .catch((err) => {
                    console.warn(`[${connectionId}] Summary analysis error: ${err.message}`);
                  });
              }
            }
          }

          // NOTE: Analysis is now handled in onChunk -> handleIncomingTextChunk() via realtime AI
          // This callback only handles transcript persistence and summary generation
        } catch (error) {
          console.error(`[${connectionId}] Error in onTranscript:`, error);
        }
      },
      onError: (error) => {
        sendToClient(connectionId, {
          type: 'error',
          message: error.message
        });
      }
    });

    realtimeConnections.set(connectionId, realtimeConnection);
    console.log(`[WS] Realtime connection created for ${connectionId}, total connections: ${realtimeConnections.size}`);
  } catch (error) {
    console.error('Error starting realtime listening:', { message: error?.message || String(error) });
    sendToClient(connectionId, {
      type: 'error',
      message: `Failed to start listening: ${error?.message || String(error)}`
    });
  }
}

function stopListening(connectionId) {
  const realtimeConnection = realtimeConnections.get(connectionId);
  if (realtimeConnection) {
    realtimeConnection.close();
    realtimeConnections.delete(connectionId);
    lastGoodAnalysis.delete(connectionId); // Clean up state
  }
  sendToClient(connectionId, {
    type: 'listening_stopped',
    message: 'Stopped listening to conversation'
  });
}

// API endpoint to generate diagnostic questions using AI
app.post('/api/generate-diagnostic-questions', async (req, res) => {
  try {
    const { prompt, prospectType } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[API] Generating diagnostic questions for ${prospectType} with prompt:`, prompt.slice(0, 100));

    const systemPrompt = `You are an expert real estate sales coach. Generate diagnostic questions that sales closers should ask prospects during conversations.

CRITICAL OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{
  "questions": [
    {
      "question": "The actual question to ask the prospect",
      "helper": "Why this question matters / what intel it reveals",
      "badgeText": "Category label (e.g., Financial, Timeline, Pain Point)",
      "badgeColor": "situation|timeline|authority|pain|financial"
    }
  ]
}

Badge color options:
- situation: Blue (general situation/background)
- timeline: Red (urgency/deadlines)
- authority: Purple (decision-making power)
- pain: Orange (problems/frustrations)
- financial: Green (money/budget)

Rules:
1. Questions should be conversational, not robotic
2. Each question should reveal specific intel for analysis
3. Helper text explains WHY this question matters
4. Return 3-7 questions (not too many)
5. Badge text should be short (1-2 words)`;

    const userPrompt = `Generate diagnostic questions for a ${prospectType} prospect.

User's request: "${prompt}"

Remember to return ONLY valid JSON in the format specified.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from AI response
    const parsed = JSON.parse(aiContent);
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format from AI');
    }

    console.log(`[API] Generated ${parsed.questions.length} questions successfully`);
    res.json(parsed);

  } catch (error) {
    console.error('[API] Error generating questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    backendBuildSha: BACKEND_BUILD_SHA,
    supabaseConfigured: isSupabaseConfigured()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});

