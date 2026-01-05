import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { createRealtimeConnection } from './realtime/listener.js';
import { analyzeConversation, analyzeConversationFromAiAnalysis } from './analysis/engine.js';
import { createUserSupabaseClient, isSupabaseConfigured } from './supabase.js';
import { runSpeakerDetectionAgent, runConversationSummaryAgent } from './analysis/aiAgents.js';
import { RealtimeAnalysisSession } from './realtime/realtimeAnalysis.js';

dotenv.config();

// Build/version marker for runtime verification (set in Railway as BACKEND_BUILD_SHA)
const BACKEND_BUILD_SHA = process.env.BACKEND_BUILD_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown';
console.log('[BOOT] backend starting', {
  BACKEND_BUILD_SHA,
  hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
  hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
  hasRealtimeModelEnv: Boolean(process.env.OPENAI_REALTIME_MODEL),
  realtimeDisabled: process.env.OPENAI_REALTIME_DISABLED === 'true'
});

// #region agent log helper
const DEBUG_LOG_PATH = '/home/sparky/Documents/github-realestste-demo-main/.cursor/debug.log';
function debugLog(msg, data = {}) {
  const line = JSON.stringify({ ts: Date.now(), msg, ...data }) + '\n';
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, line);
  } catch {
    // In production (Railway), this path may not exist; never crash the server for logging.
  }
}
// #endregion

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

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

app.use(cors());
app.use(express.json());

// Test endpoint to verify analysis works
app.post('/api/test-analysis', async (req, res) => {
  try {
    const { transcript, prospectType } = req.body;
    const analysis = await analyzeConversation(transcript || 'I am 3 months behind on my mortgage payments. The auction is in 2 weeks and I am terrified of losing my home.', prospectType || 'foreclosure');
    res.json({
      success: true,
      analysis: {
        hotButtonsCount: analysis.hotButtons?.length || 0,
        objectionsCount: analysis.objections?.length || 0,
        lubometerScore: analysis.lubometer?.score,
        truthIndexScore: analysis.truthIndex?.score,
        hotButtons: analysis.hotButtons,
        objections: analysis.objections,
        diagnosticQuestions: analysis.diagnosticQuestions
      }
    });
  } catch (error) {
    console.error('Test analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
// Optional: OpenAI Realtime analysis sessions (single-session "Option B")
const realtimeAnalysisSessions = new Map(); // connectionId -> RealtimeAnalysisSession

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

// Clean up interval on server close
process.on('SIGINT', () => {
  clearInterval(pingInterval);
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(pingInterval);
  wss.close();
  process.exit(0);
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  // #region agent log
  debugLog('H-G: NEW WebSocket connection', { ip: req.socket.remoteAddress });
  // #endregion
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
    // Option B: use OpenAI Realtime single-session analysis
    useRealtimeAnalysis: false
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
      // #region agent log
      debugLog('H-H: WS message received', { type: data.type, hasText: !!data.text, hasAudio: !!data.audio });
      // #endregion

      if (data.type === 'start_listening') {
        // Start real-time conversation listening
        console.log(`[WS] Received start_listening from ${connectionId}`);
        // Capture config/settings for this connection (used for audio-driven transcription as well)
        {
          const meta = connectionPersistence.get(connectionId) || { authToken: null, sessionId: null, userId: null };
          meta.prospectType = typeof data.config?.prospectType === 'string' ? data.config.prospectType : (meta.prospectType || '');
          meta.customScriptPrompt = typeof data.config?.customScriptPrompt === 'string' ? data.config.customScriptPrompt : (meta.customScriptPrompt || '');
          meta.pillarWeights = Array.isArray(data.config?.pillarWeights) ? data.config.pillarWeights : (meta.pillarWeights || null);
          // Enable Realtime analysis by default when OPENAI_API_KEY is set (model defaults internally)
          meta.useRealtimeAnalysis = Boolean(process.env.OPENAI_API_KEY) && process.env.OPENAI_REALTIME_DISABLED !== 'true';
          connectionPersistence.set(connectionId, meta);

          // Runtime evidence in Railway logs (no secrets)
          console.log('[A1] start_listening env check', {
            useRealtimeAnalysis: meta.useRealtimeAnalysis,
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

          // #region agent log
          dbg('A1', 'backend/index.js:start_listening', 'Realtime analysis enabled?', {
            useRealtimeAnalysis: meta.useRealtimeAnalysis,
            hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
            hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
            hasRealtimeModelEnv: Boolean(process.env.OPENAI_REALTIME_MODEL)
          });
          // #endregion

          if (meta.useRealtimeAnalysis && process.env.OPENAI_API_KEY) {
            if (!realtimeAnalysisSessions.get(connectionId)) {
              const instructions = `You are a REAL-TIME sales call analyzer. Output ONLY valid JSON.

CONTEXT: Analyzing calls between CLOSER (salesperson) and PROSPECT (potential customer).
- The CUSTOM_SCRIPT_PROMPT (if provided) describes the business/product being sold - USE THIS to tailor rebuttal scripts.
- Example: If CUSTOM_SCRIPT_PROMPT says "we are a CRM company", rebuttals should reference CRM benefits.

SPEAKER DETECTION:
- CLOSER: The salesperson asking questions, presenting offers, handling objections
- PROSPECT: The potential customer responding, raising concerns, expressing interest or objections

===== 27 INDICATORS (score 1-10, higher=stronger signal) =====
P1-PAIN/DESIRE GAP:
1-Pain Intensity: How much distress about current situation? (stress, frustration, urgency in voice)
2-Pain Awareness: Do they recognize their problem? ("I know I need to...", "The issue is...")
3-Desire Clarity: Clear vision of what they want? ("I want to...", specific goals)
4-Desire Priority: How important is solving this? ("This is my top priority", "I need this now")

P2-URGENCY:
5-Time Pressure: External deadlines? ("I need to sell by...", "The bank is...")
6-Cost of Delay: Aware of consequences? ("Every month costs me...", "I'm losing...")
7-Internal Timing: Personal readiness? ("I'm ready to move forward", "Now is the time")
8-Environmental Availability: Time/resources to act? ("I have time this week", "I can meet")

P3-DECISIVENESS:
9-Decision Authority: Can they decide alone? ("I make the decisions", "I need to check with...")
10-Decision Style: Quick or slow decider? (asks for details vs. ready to commit)
11-Commitment to Decide: Will they actually decide? ("I will decide by...", "Let me think...")
12-Self-Permission: Allow themselves to act? ("I deserve this", "I should do this")

P4-MONEY AVAILABILITY:
13-Resource Access: Do they have funds? ("I have savings", "Money isn't the issue")
14-Resource Fluidity: Can they access it? ("It's liquid", "I'd need to...")
15-Investment Mindset: See it as investment? ("It's worth it", "ROI", "value")
16-Resourcefulness: Can find money if needed? ("I'll figure it out", "I can borrow")

P5-OWNERSHIP:
17-Problem Recognition: Own their problem? ("It's my fault", "I created this")
18-Solution Ownership: Own fixing it? ("I need to fix this", "It's on me")
19-Locus of Control: Feel in control? ("I can change this", "It's up to me")
20-Action Integrity: Actions match words? (doing what they say)

P6-PRICE SENSITIVITY (REVERSE - high score = LESS price sensitive):
21-Emotional Response to Price: Calm about costs? (not shocked, accepting)
22-Negotiation Reflex: Don't immediately haggle? (accepts pricing)
23-Structural Rigidity: Flexible on terms? (open to options)

P7-TRUST:
24-ROI Belief: Trust it will work? ("I believe this will help")
25-External Trust: Trust the closer/company? ("I trust you", "You seem honest")
26-Internal Trust: Trust themselves to succeed? ("I can do this")
27-Risk Tolerance: Comfortable with uncertainty? ("I'm okay with risk")

===== HOT BUTTONS (PROSPECT ONLY) =====
IMPORTANT: Only detect hot buttons from what the PROSPECT says, NOT the closer!
Hot buttons are emotional triggers the prospect reveals:
- Family concerns, health issues, financial stress, time pressure, frustration, dreams/goals
- Quote MUST be exact words the PROSPECT said
- Score 1-10 based on emotional intensity
- These help the closer understand what motivates the prospect

===== OBJECTIONS (PROSPECT ONLY) =====
IMPORTANT: Only detect objections from what the PROSPECT says, NOT the closer!
Common objection patterns from prospects:
- PRICE: "too expensive", "can't afford", "need to think about cost"
- TIMING: "not the right time", "maybe later", "need more time"
- TRUST: "how do I know", "sounds too good", "what's the catch"
- AUTHORITY: "need to talk to spouse/partner", "not my decision alone"
- NEED: "not sure I need this", "might not be necessary"

For each objection provide:
- fear: the underlying worry driving this objection
- whisper: what they secretly want to hear
- rebuttalScript: A response the closer can use. USE THE CUSTOM_SCRIPT_PROMPT context if provided to tailor the rebuttal to the specific business/product being sold.

===== TRUTH INDEX SIGNALS =====
- coherenceSignals: List any contradictions, hesitations, deflections, or confidence markers
- overallCoherence: "high" (consistent, confident), "medium" (some hesitation), "low" (contradictory, evasive)

OUTPUT JSON (no markdown, no explanations):
{
  "speaker": "closer|prospect|unknown",
  "indicatorSignals": {"1":7,"2":6,...}, 
  "hotButtonDetails": [{"id":5,"quote":"exact PROSPECT words","contextualPrompt":"follow-up question for closer to ask","score":8}],
  "objections": [{"objectionText":"what PROSPECT said","probability":0.8,"fear":"prospect's underlying fear","whisper":"what prospect wants to hear","rebuttalScript":"response using CUSTOM_SCRIPT_PROMPT context"}],
  "askedQuestions": [1,5,12],
  "detectedRules": [{"ruleId":"T1","evidence":"quote","confidence":0.8}],
  "coherenceSignals": ["signal1","signal2"],
  "overallCoherence": "high|medium|low",
  "insights": {"summary":"brief summary","keyMotivators":["motivator1"],"concerns":["concern1"],"recommendation":"next step","closingReadiness":"ready|almost|not_ready"}
}

CRITICAL RULES:
1. Score indicators based on ACTUAL evidence in conversation. Be generous when there's any signal.
2. Hot buttons and objections are ONLY from PROSPECT speech - never from what the CLOSER says.
3. Rebuttal scripts should incorporate CUSTOM_SCRIPT_PROMPT context to be relevant to the specific product/service.`;

              const session = new RealtimeAnalysisSession({
                apiKey: process.env.OPENAI_API_KEY,
                model: process.env.OPENAI_REALTIME_MODEL || undefined,
                instructions,
                temperature: 0.6
              });
              realtimeAnalysisSessions.set(connectionId, session);
              console.log('[A1] RealtimeAnalysisSession created', {
                connectionId,
                model: process.env.OPENAI_REALTIME_MODEL || 'default'
              });
              // Connect in background so first chunk is fast
              void session.connect().catch(() => {});
            }
          }
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

        await startRealtimeListening(connectionId, data.config);

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
          // #region agent log
          dbg('A2', 'backend/index.js:audio_chunk', 'Audio chunk received', {
            bytes: audioBuffer.length,
            mimeType
          });
          // #endregion
          const meta = connectionPersistence.get(connectionId);
          const audioResult = await realtimeConnection.sendAudio(audioBuffer, mimeType);
          const transcribedText = String(audioResult?.text || '').trim();
          if (transcribedText) {
            await handleIncomingTextChunk(connectionId, {
              chunkText: transcribedText,
              prospectType: (typeof data.prospectType === 'string' ? data.prospectType : '') || meta?.prospectType || '',
              customScriptPrompt: meta?.customScriptPrompt || '',
              pillarWeights: meta?.pillarWeights ?? null,
              clientTsMs: typeof data.clientTsMs === 'number' ? data.clientTsMs : null
            });
          }
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

  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${connectionId}`);
    connections.delete(connectionId);
    // Close realtime analysis session if present
    const rt = realtimeAnalysisSessions.get(connectionId);
    if (rt) {
      try {
        rt.close();
      } catch {}
      realtimeAnalysisSessions.delete(connectionId);
    }
    // Mark session ended and generate final summary if we have one
    const meta = connectionPersistence.get(connectionId);
    if (meta?.authToken && meta?.sessionId && meta?.userId && isSupabaseConfigured()) {
      const supabase = createUserSupabaseClient(meta.authToken);
      if (supabase) {
        // Use prospect type from meta (set during session)
        const closeProspectType = meta.prospectType || '';
        console.log(`[${connectionId}] WebSocket closing, saving final state with prospectType: ${closeProspectType}`);

        // Update session end time
        void supabase
          .from('call_sessions')
          .update({ 
            ended_at: new Date().toISOString(), 
            updated_at: new Date().toISOString(),
            prospect_type: closeProspectType // Ensure it's saved
          })
          .eq('id', meta.sessionId)
          .eq('user_id', meta.userId)
          .then(({ error }) => {
            if (error) console.warn(`[WS] Failed to update session on close: ${error.message}`);
          })
          .catch(() => {});

        // Generate FINAL summary of entire conversation
        const formattedTranscript = meta.conversationHistory || '';
        if (formattedTranscript.length > 100) {
          console.log(`[${connectionId}] Generating FINAL conversation summary on close with prospectType: ${closeProspectType}`);
          runConversationSummaryAgent(formattedTranscript, closeProspectType, true)
            .then((summaryResult) => {
              if (summaryResult && !summaryResult.error) {
                const summaryData = {
                  session_id: meta.sessionId,
                  user_id: meta.userId,
                  user_email: meta.userEmail || '',
                  prospect_type: closeProspectType,
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
                      console.log(`[${connectionId}] Final summary generated and saved on close`);
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
    connectionPersistence.delete(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
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

async function handleIncomingTextChunk(connectionId, {
  chunkText,
  prospectType = '',
  customScriptPrompt = '',
  pillarWeights = null,
  clientTsMs = null
}) {
  const text = String(chunkText || '').trim();
  if (!text) return;
  
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
  const useRealtime = Boolean(meta?.useRealtimeAnalysis && realtimeAnalysisSessions.get(connectionId));

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

  let detectedSpeaker = 'unknown';
  let aiAnalysisFromRealtime = null;

  // #region agent log
  debugLog('H-E: handleIncomingTextChunk', { useRealtime, hasSession: !!realtimeAnalysisSessions.get(connectionId), chunkTextLen: text.length });
  // #endregion
  // Runtime evidence in Railway logs (no secrets)
  console.log('[A2] handleIncomingTextChunk', {
    useRealtime,
    hasSession: !!realtimeAnalysisSessions.get(connectionId),
    chunkTextLen: text.length
  });

  if (useRealtime) {
    try {
      const session = realtimeAnalysisSessions.get(connectionId);
      // #region agent log
      debugLog('H-A,H-B: Calling analyzeChunk', { sessionConnected: session?.connected, sessionClosed: session?.closed, inFlight: session?.inFlight });
      // #endregion
      aiAnalysisFromRealtime = await session.analyzeChunk({
        chunkText: text,
        prospectType: prospectType || meta?.prospectType || '',
        customScriptPrompt: customScriptPrompt || meta?.customScriptPrompt || ''
      });
      // #region agent log
      debugLog('H-B,H-D: analyzeChunk returned', { isNull: aiAnalysisFromRealtime===null, hasIndicatorSignals: !!aiAnalysisFromRealtime?.indicatorSignals, hasHotButtonDetails: Array.isArray(aiAnalysisFromRealtime?.hotButtonDetails), hasObjections: Array.isArray(aiAnalysisFromRealtime?.objections), speaker: aiAnalysisFromRealtime?.speaker });
      // #endregion
      if (aiAnalysisFromRealtime?.speaker) {
        detectedSpeaker = aiAnalysisFromRealtime.speaker;
      }
    } catch (e) {
      // #region agent log
      debugLog('H-A,H-C: analyzeChunk threw', { errorMsg: e.message });
      // #endregion
      console.warn(`[WS] Realtime analysis error: ${e.message}`);
    }
  } else {
    // Fallback: Speaker detection via dedicated agent
    try {
      const speakerResult = await runSpeakerDetectionAgent(text, conversationHistory);
      if (speakerResult && !speakerResult.error) {
        detectedSpeaker = speakerResult.speaker || 'unknown';
      }
    } catch (speakerErr) {
      console.warn(`[WS] Speaker detection agent error: ${speakerErr.message}`);
    }
  }

  // Format speaker label for transcript
  const speakerLabel = detectedSpeaker === 'closer' ? 'CLOSER' : detectedSpeaker === 'prospect' ? 'PROSPECT' : 'UNKNOWN';

  // Update conversation history with formatted speaker labels (cap at 8000 chars)
  const MAX_HISTORY_CHARS = 8000;
  const formattedLine = `${speakerLabel}: ${text}`;
  const newHistory = conversationHistory ? conversationHistory + '\n\n' + formattedLine : formattedLine;
  if (meta) {
    meta.conversationHistory = newHistory.length > MAX_HISTORY_CHARS
      ? newHistory.slice(-MAX_HISTORY_CHARS)
      : newHistory;
    connectionPersistence.set(connectionId, meta);
  }

  // Send the transcribed chunk to the frontend for transparency/debugging
  sendToClient(connectionId, {
    type: 'transcript_chunk',
    data: {
      speaker: detectedSpeaker,
      text,
      ts: Date.now()
    }
  });

  // Option B: use realtime single-session analysis to update frontend quickly
  if (useRealtime && aiAnalysisFromRealtime) {
    // Log what realtime AI returned (especially objections with rebuttals)
    console.log('[REALTIME-AI-RESULT]', {
      hasObjections: Array.isArray(aiAnalysisFromRealtime.objections),
      objectionCount: aiAnalysisFromRealtime.objections?.length || 0,
      firstObjection: aiAnalysisFromRealtime.objections?.[0] || null,
      hotButtonCount: aiAnalysisFromRealtime.hotButtonDetails?.length || 0
    });
    
    const normalizedAi = {
      indicatorSignals: aiAnalysisFromRealtime.indicatorSignals || {},
      hotButtonDetails: aiAnalysisFromRealtime.hotButtonDetails || [],
      objections: aiAnalysisFromRealtime.objections || [],
      askedQuestions: aiAnalysisFromRealtime.askedQuestions || [],
      detectedRules: aiAnalysisFromRealtime.detectedRules || [],
      coherenceSignals: aiAnalysisFromRealtime.coherenceSignals || [],
      overallCoherence: aiAnalysisFromRealtime.overallCoherence || 'medium',
      insights: aiAnalysisFromRealtime.insights?.summary || '',
      keyMotivators: aiAnalysisFromRealtime.insights?.keyMotivators || [],
      concerns: aiAnalysisFromRealtime.insights?.concerns || [],
      recommendation: aiAnalysisFromRealtime.insights?.recommendation || '',
      closingReadiness: aiAnalysisFromRealtime.insights?.closingReadiness || 'not_ready',
      agentErrors: {}
    };

    try {
      const final = await analyzeConversationFromAiAnalysis(
        meta?.plainTranscript || text,
        prospectType || meta?.prospectType || null,
        pillarWeights ?? meta?.pillarWeights ?? null,
        normalizedAi
      );

      const safeAnalysis = {
        ...final,
        hotButtons: Array.isArray(final.hotButtons) ? final.hotButtons : [],
        objections: Array.isArray(final.objections) ? final.objections : []
      };

      sendToClient(connectionId, { type: 'analysis_update', data: safeAnalysis });
    } catch (e) {
      console.warn(`[WS] Failed to build analysis from realtime ai: ${e.message}`);
    }
  }

  // IMPORTANT: If Realtime is enabled but did not return usable JSON for this chunk,
  // fall back to the legacy analysis pipeline so the UI keeps updating.
  if (useRealtime && !aiAnalysisFromRealtime) {
    try {
      let realtimeConnection = realtimeConnections.get(connectionId);
      if (!realtimeConnection) {
        await startRealtimeListening(connectionId, {});
        realtimeConnection = realtimeConnections.get(connectionId);
      }
      if (realtimeConnection) {
        await realtimeConnection.sendTranscript(text, prospectType, customScriptPrompt, pillarWeights);
      }
    } catch (e) {
      console.warn(`[WS] Legacy fallback analysis failed: ${e.message}`);
    }
  }

  // Also run conversation summary updates (independent of analysis pipeline)
  if (meta?.authToken && meta?.sessionId && meta?.userId && isSupabaseConfigured()) {
    const now = Date.now();
    const SUMMARY_INTERVAL_MS = 15000;
    if (!meta.lastSummaryMs || (now - meta.lastSummaryMs) > SUMMARY_INTERVAL_MS) {
      meta.lastSummaryMs = now;
      connectionPersistence.set(connectionId, meta);
      const formattedTranscript = meta.conversationHistory || '';
      const summaryProspectType = meta.prospectType || prospectType || '';
      if (formattedTranscript.length > 50) {
        runConversationSummaryAgent(formattedTranscript, summaryProspectType, false)
          .then((summaryResult) => {
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
                void supabase.from('call_summaries').upsert(summaryData, { onConflict: 'session_id' }).catch(() => {});
              }
            }
          })
          .catch(() => {});
      }
    }
  }

  // Persist transcript chunk to Supabase with AI-detected speaker role
  if (meta?.authToken && meta?.sessionId && meta?.userId && isSupabaseConfigured()) {
    const supabase = createUserSupabaseClient(meta.authToken);
    if (supabase) {
      void supabase
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
        .then(({ error }) => {
          if (error) console.warn(`[WS] Supabase transcript insert failed: ${error.message}`);
        })
        .catch(() => {});

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
    }
  }

  // Legacy path: push transcript into analysis engine via realtimeConnection
  if (!useRealtime) {
    let realtimeConnection = realtimeConnections.get(connectionId);
    if (!realtimeConnection) {
      console.warn(`[WS] No realtime connection found for ${connectionId}, creating one...`);
      await startRealtimeListening(connectionId, {});
      realtimeConnection = realtimeConnections.get(connectionId);
    }
    if (realtimeConnection) {
      await realtimeConnection.sendTranscript(text, prospectType, customScriptPrompt, pillarWeights);
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
          // OLD 15 AI AGENTS DISABLED - Realtime AI is now the ONLY analysis source
          // Analysis is done in onChunk -> handleIncomingTextChunk() using the realtime AI session
          console.log(`[${connectionId}] onTranscript: Skipping legacy 15 AI agents (realtime AI is active)`);
          console.log(`[${connectionId}] Transcript length: ${transcript.length} chars, prospectType: ${prospectType}`);

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
    console.error('Error starting realtime listening:', error);
    sendToClient(connectionId, {
      type: 'error',
      message: `Failed to start listening: ${error.message}`
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

// REST API endpoint for manual analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, prospectType } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const analysis = await analyzeConversation(transcript, prospectType);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), backendBuildSha: BACKEND_BUILD_SHA });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});

