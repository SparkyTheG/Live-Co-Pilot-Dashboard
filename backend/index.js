import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRealtimeConnection } from './realtime/listener.js';
import { analyzeConversation } from './analysis/engine.js';
import { createUserSupabaseClient, isSupabaseConfigured } from './supabase.js';
import { runSpeakerDetectionAgent, runConversationSummaryAgent } from './analysis/aiAgents.js';

dotenv.config();

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
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  connections.set(connectionId, ws);
  connectionPersistence.set(connectionId, { authToken: null, sessionId: null, userId: null, userEmail: null, lastTranscriptPersistMs: 0, conversationHistory: '', lastSummaryMs: 0, summaryId: null });

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
          meta.prospectType = typeof data.config?.prospectType === 'string' ? data.config.prospectType : (meta.prospectType || '');
          meta.customScriptPrompt = typeof data.config?.customScriptPrompt === 'string' ? data.config.customScriptPrompt : (meta.customScriptPrompt || '');
          meta.pillarWeights = Array.isArray(data.config?.pillarWeights) ? data.config.pillarWeights : (meta.pillarWeights || null);
          connectionPersistence.set(connectionId, meta);
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
          // Convert base64 to buffer if needed
          const audioBuffer = Buffer.from(data.audio, 'base64');
          const meta = connectionPersistence.get(connectionId);
          const audioResult = await realtimeConnection.sendAudio(audioBuffer);
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

  const chunkCharCount = text.length;

  // Get connection metadata
  const meta = connectionPersistence.get(connectionId);
  const conversationHistory = meta?.conversationHistory || '';

  // AI SPEAKER DETECTION: Analyze who is speaking using AI agent
  let detectedSpeaker = 'unknown';
  try {
    const speakerResult = await runSpeakerDetectionAgent(text, conversationHistory);
    if (speakerResult && !speakerResult.error) {
      detectedSpeaker = speakerResult.speaker || 'unknown';
    }
  } catch (speakerErr) {
    console.warn(`[WS] Speaker detection agent error: ${speakerErr.message}`);
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

  // Ensure realtime connection exists
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

async function startRealtimeListening(connectionId, config) {
  try {
    console.log(`[WS] Starting realtime listening for ${connectionId}`);
    sendToClient(connectionId, {
      type: 'listening_started',
      message: 'Starting real-time conversation analysis...'
    });

    const realtimeConnection = await createRealtimeConnection({
      onTranscript: async (transcript, prospectType, customScriptPrompt, pillarWeights) => {
        try {
          console.log(`[${connectionId}] Analyzing transcript (${transcript.length} chars), prospectType: ${prospectType}`);
          if (pillarWeights) {
            console.log(`[${connectionId}] Using custom pillar weights from Admin Panel`);
          }
          // Analyze the conversation in real-time with prospect type, custom script prompt, and pillar weights
          const analysis = await analyzeConversation(transcript, prospectType, customScriptPrompt, pillarWeights);

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

          // PERSISTENCE LOGIC: If new analysis has 0 score but we have a previous good score,
          // preserve the previous score to prevent the UI from "dropping to zero".
          const previousAnalysis = lastGoodAnalysis.get(connectionId);
          if (previousAnalysis && analysis.lubometer?.score === 0 && previousAnalysis.lubometer?.score > 0) {
            console.log(`[${connectionId}] Preserving last good Lubometer score: ${previousAnalysis.lubometer.score} (new was 0)`);
            analysis.lubometer = previousAnalysis.lubometer;
            // Also preserve truth index if new one is default (45)
            if (analysis.truthIndex?.score === 45 && previousAnalysis.truthIndex?.score !== 45) {
              analysis.truthIndex = previousAnalysis.truthIndex;
            }
          }

          // Update last good analysis if this one is valid (score > 0)
          if (analysis.lubometer?.score > 0) {
            lastGoodAnalysis.set(connectionId, analysis);
          }

          console.log(`[${connectionId}] Analysis complete:`, {
            hotButtons: analysis.hotButtons?.length || 0,
            objections: analysis.objections?.length || 0,
            lubometer: analysis.lubometer?.score,
            truthIndex: analysis.truthIndex?.score
          });

          // Log analysis results before sending
          console.log(`[${connectionId}] Analysis results:`, {
            hotButtonsCount: analysis.hotButtons?.length || 0,
            objectionsCount: analysis.objections?.length || 0,
            hasHotButtons: !!analysis.hotButtons,
            hasObjections: !!analysis.objections,
            hotButtonsSample: analysis.hotButtons?.slice(0, 2),
            objectionsSample: analysis.objections?.slice(0, 2)
          });

          // DEFENSIVE: Ensure arrays before sending to prevent frontend crashes
          const safeAnalysis = {
            ...analysis,
            hotButtons: Array.isArray(analysis.hotButtons) ? analysis.hotButtons : [],
            objections: Array.isArray(analysis.objections) ? analysis.objections : []
          };

          // Log if we had to fix the data
          if (!Array.isArray(analysis.hotButtons)) {
            console.error(`[${connectionId}] WARNING: Fixed hotButtons type before sending (was ${typeof analysis.hotButtons})`);
          }
          if (!Array.isArray(analysis.objections)) {
            console.error(`[${connectionId}] WARNING: Fixed objections type before sending (was ${typeof analysis.objections})`);
          }

          // Send analysis to frontend
          sendToClient(connectionId, {
            type: 'analysis_update',
            data: safeAnalysis
          });
        } catch (error) {
          console.error(`[${connectionId}] Error in analysis:`, error);
          sendToClient(connectionId, {
            type: 'error',
            message: `Analysis error: ${error.message}`
          });
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});

