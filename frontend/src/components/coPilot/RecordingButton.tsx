import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { ConversationWebSocket } from '../../lib/websocket';
import { OpenAIRealtimeWebRTC } from '../../lib/openaiRealtimeWebrtc';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

interface RecordingButtonProps {
  prospectType: string;
  onTranscriptUpdate?: (transcript: string) => void;
  onAnalysisUpdate?: (analysis: any) => void;
}

export default function RecordingButton({
  prospectType,
  onTranscriptUpdate,
  onAnalysisUpdate
}: RecordingButtonProps) {
  const { session } = useAuth();
  // Get admin settings (custom script prompt + pillar weights)
  const { settings } = useSettings();
  const customScriptPrompt = settings.customScriptPrompt || '';
  // Extract pillar weights for Lubometer calculation
  const pillarWeights = settings.pillarWeights.map(p => ({ id: p.id, weight: p.weight }));
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noBackend, setNoBackend] = useState(false);
  const wsRef = useRef<ConversationWebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const openAiRealtimeRef = useRef<OpenAIRealtimeWebRTC | null>(null);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  // Use ref to track recording state (avoids stale closure issues)
  const isRecordingRef = useRef(false);
  // Keepalive interval for WebSocket
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Persist the last start_listening config so we can re-send it after reconnects
  const startListeningConfigRef = useRef<any>(null);

  // Refs for stopping media (if used)
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Mode: Use Web Speech API (browser) for transcription + 15 GPT-4o mini agents for analysis
  // This is free and doesn't require ElevenLabs or OpenAI Realtime API
  const useOpenAIWebRTC = false;

  // Update prospect type when it changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.setProspectType(prospectType);
    }
  }, [prospectType]);

  // Load microphone devices (best-effort)
  useEffect(() => {
    const refresh = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === 'audioinput');
        setAudioInputs(mics);
        // If current selection vanished, fall back to default
        if (selectedMicId !== 'default' && !mics.some(m => m.deviceId === selectedMicId)) {
          setSelectedMicId('default');
        }
      } catch {
        // ignore
      }
    };
    refresh();
    const handler = () => { void refresh(); };
    navigator.mediaDevices?.addEventListener?.('devicechange', handler as any);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handler as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('[RecordingButton] mounted');
    return () => {
      console.log('[RecordingButton] unmount cleanup -> stopRecording()');
      // Cleanup on unmount
      stopRecording();
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
      if (keepaliveIntervalRef.current) {
        clearInterval(keepaliveIntervalRef.current);
      }
    };
  }, []);

  // Start WebSocket keepalive - sends a ping every 30 seconds to prevent timeout
  const startKeepalive = useCallback(() => {
    // Clear any existing keepalive
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current);
    }

    // Send keepalive ping every 15 seconds (reduced from 30s for better stability)
    keepaliveIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.isConnected()) {
        console.log('💓 Sending WebSocket keepalive ping');
        // Send an empty transcript as keepalive (backend will ignore empty transcripts)
        // This keeps the connection alive
        wsRef.current.sendTranscript('', prospectType, customScriptPrompt, pillarWeights);
      }
    }, 15000); // 15 seconds (reduced from 30s)
  }, [prospectType, customScriptPrompt, pillarWeights]);

  // Stop keepalive
  const stopKeepalive = useCallback(() => {
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current);
      keepaliveIntervalRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setIsConnecting(true);

      // Clean up any existing connection first
      if (wsRef.current) {
        console.log('🧹 Frontend: Cleaning up existing WebSocket connection...');
        try {
          wsRef.current.stopListening();
          wsRef.current.disconnect();
        } catch (e) {
          console.warn('Error cleaning up old connection:', e);
        }
        wsRef.current = null;
      }

      // Stop any existing keepalive
      stopKeepalive();

      // Wait a bit to ensure server cleanup completes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initialize new WebSocket connection
      console.log('🔌 Frontend: Creating new WebSocket connection...');
      // Use environment variable or default (handled in ConversationWebSocket constructor)
      const ws = new ConversationWebSocket();

      ws.setOnAnalysisUpdate((analysis) => {
        if (onAnalysisUpdate) {
          onAnalysisUpdate(analysis);
        }
      });

      ws.setOnTranscriptChunk((chunk) => {
        // Show live transcript from backend (what is actually being analyzed)
        // Skip if using OpenAI WebRTC mode since onTranscript callback already updates the UI
        if (!useOpenAIWebRTC && onTranscriptUpdate && chunk?.text) {
          onTranscriptUpdate(chunk.text);
        }
      });

      ws.setOnError((err) => {
        console.error('WebSocket error:', err);
        // Do NOT stop recording on transient WS errors (Railway can drop idle sockets).
        // Keep transcription running; websocket.ts will attempt reconnect automatically.
        setError('WebSocket connection error — reconnecting…');
        setIsConnecting(true);
      });

      ws.setOnDisconnect(() => {
        // If we're recording, treat disconnect as transient and wait for auto-reconnect
        if (isRecordingRef.current) {
          setError('WebSocket disconnected — reconnecting…');
          setIsConnecting(true);
        }
      });

      ws.setOnConnect(() => {
        // On reconnect, re-send start_listening so backend resumes session updates
        if (isRecordingRef.current) {
          try {
            const cfg = startListeningConfigRef.current;
            if (cfg) {
              ws.startListening(cfg);
              console.log('✅ Frontend: Re-sent start_listening after reconnect');
            }
            setError(null);
            setIsConnecting(false);
          } catch (e) {
            console.warn('Failed to restart listening after reconnect:', e);
          }
        }
      });

      await ws.connect();
      console.log('✅ Frontend: WebSocket connected, starting listening...');
      // Provide auth token so backend can persist this call session under RLS
      ws.setAuthToken(session?.access_token ?? null);
      ws.setProspectType(prospectType); // Set initial prospect type
      // Pass settings. Browser transcribes via Web Speech API, sends text to backend for 15 agents analysis.
      const startCfg = {
        customScriptPrompt,
        pillarWeights,
        clientMode: useOpenAIWebRTC ? 'openai_webrtc' : 'websocket_transcribe'
      };
      startListeningConfigRef.current = startCfg;
      ws.startListening(startCfg);
      wsRef.current = ws;
      console.log(`✅ Frontend: Listening started (mode=${useOpenAIWebRTC ? 'openai_webrtc' : 'websocket_transcribe'})`);

      // Start WebSocket keepalive to prevent timeout
      startKeepalive();

      // Option B: Stream mic directly to OpenAI Realtime via WebRTC (no ElevenLabs required)
      if (useOpenAIWebRTC) {
        if (!session?.access_token) {
          throw new Error('Not authenticated: missing session access token');
        }
        const wsUrl =
          import.meta.env.VITE_WS_URL ||
          (import.meta.env.DEV ? 'ws://localhost:3001/ws' : '');
        if (!wsUrl) {
          throw new Error('Backend WS URL missing (set VITE_WS_URL)');
        }

        const openAi = new OpenAIRealtimeWebRTC({
          wsUrl,
          authToken: session.access_token,
          prospectType,
          customScriptPrompt,
          deviceId: selectedMicId,
          onTranscript: (text) => {
            if (onTranscriptUpdate) onTranscriptUpdate(text);
            // Immediately push transcript into backend so it's persisted (but NOT re-echoed to UI)
            wsRef.current?.sendRaw({
              type: 'realtime_transcript_chunk',
              text,
              speaker: 'unknown',
              ts: Date.now()
            });
          },
          onAiAnalysis: (transcriptText, aiAnalysis) => {
            wsRef.current?.sendRaw({
              type: 'realtime_ai_update',
              transcriptText,
              aiAnalysis,
              ts: Date.now()
            });
          },
          onError: (e) => {
            console.error('OpenAI Realtime error:', e);
            setError(e.message);
          }
        });
        openAiRealtimeRef.current = openAi;

        await openAi.connect();
        console.log('✅ OpenAI Realtime WebRTC connected');

        setIsRecording(true);
        isRecordingRef.current = true;
        setIsConnecting(false);
              return;
            }

      // Use Web Speech API for transcription (free, runs in browser)
      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionCtor) {
        setError('Speech recognition not available. Please use Chrome or Edge.');
        setIsConnecting(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        return;
      }

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = false; // Only get final results to prevent duplicates
      recognition.lang = 'en-US';

      // Track last sent transcript to prevent duplicates
      let lastSentText = '';

      recognition.onresult = (event: any) => {
        if (!isRecordingRef.current) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            // Deduplicate: don't send the same text twice
            if (text && text !== lastSentText) {
              lastSentText = text;
              console.log('[SpeechRecognition] Final transcript:', text);
              // Send final transcript to backend for analysis
              wsRef.current?.sendTranscript(text, prospectType, customScriptPrompt, pillarWeights);
              // DON'T update UI here - let backend's transcript_chunk handle it
              // This prevents double-updating
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors, just restart
          return;
        }
        if (event.error === 'aborted') {
          // Ignore aborted errors when stopping
          return;
        }
        setError(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        // Auto-restart if still recording (continuous mode can timeout)
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.warn('Failed to restart speech recognition:', e);
          }
        }
      };

      recognition.start();
      console.log('✅ Web Speech API started (browser-based transcription)');

      // Update both state and ref
      setIsRecording(true);
      isRecordingRef.current = true;
      setIsConnecting(false);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      const errorMessage = err.message || 'Failed to start recording';
      
      // Check if this is a "no backend" error
      if (errorMessage.includes('Backend server not connected') || errorMessage.includes('VITE_WS_URL')) {
        setNoBackend(true);
        setError('Backend server required for live recording. For local testing, run the backend server.');
      } else {
        setError(errorMessage);
      }
      
      setIsConnecting(false);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    const stack = new Error('stopRecording called').stack;
    console.log('🛑 Frontend: Stopping recording...', { stack });

    // CRITICAL: Update ref FIRST to prevent restart loops
    isRecordingRef.current = false;

    // Stop keepalive
    stopKeepalive();

    // Clear any pending send timeout
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      recognitionRef.current = null;
    }

    // Stop OpenAI Realtime WebRTC (if used)
    if (openAiRealtimeRef.current) {
      try {
        openAiRealtimeRef.current.close();
      } catch (e) {
        console.warn('Error closing OpenAI Realtime:', e);
      }
      openAiRealtimeRef.current = null;
    }

    // Stop PCM pipeline + mic
    try {
      processorRef.current?.disconnect();
    } catch {}
    processorRef.current = null;
    try {
      audioContextRef.current?.close();
    } catch {}
    audioContextRef.current = null;

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping media stream:', e);
      }
      mediaStreamRef.current = null;
    }

    if (wsRef.current) {
      try {
        console.log('[RecordingButton] stopRecording -> sending stop_listening + disconnect');
        wsRef.current.stopListening();
        wsRef.current.disconnect();
        console.log('✅ Frontend: WebSocket disconnected');
      } catch (e) {
        console.warn('Error disconnecting WebSocket:', e);
      }
      wsRef.current = null;
    }

    setIsRecording(false);
    console.log('✅ Frontend: Recording stopped and cleaned up');
  };

  const handleToggle = () => {
    console.log('[RecordingButton] mic button clicked', { isRecording });
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Show helpful message when no backend is configured
  if (noBackend) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 max-w-xs">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-700 border-2 border-gray-600">
          <Mic className="w-6 h-6 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-yellow-400 text-sm font-medium mb-1">Backend Required</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Live recording needs a backend server.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            For local testing: <code className="bg-gray-700 px-1 rounded">cd server && npm start</code>
          </p>
        </div>
        <button
          onClick={() => {
            setNoBackend(false);
            setError(null);
          }}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {audioInputs.length > 1 && !isRecording && (
        <select
          value={selectedMicId}
          onChange={(e) => setSelectedMicId(e.target.value)}
          className="text-xs bg-gray-800/60 border border-gray-700 rounded-md px-2 py-1 text-gray-200 max-w-[220px]"
          title="Select microphone"
        >
          <option value="default">Default microphone</option>
          {audioInputs.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={handleToggle}
        disabled={isConnecting}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all ${isRecording
          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
          : 'bg-gray-700 hover:bg-gray-600'
          } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-2 ${isRecording ? 'border-red-400' : 'border-gray-600'
          }`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isConnecting ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
        {isRecording && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900 animate-ping"></span>
        )}
      </button>
      {error && (
        <div className="text-xs text-red-400 text-center max-w-[120px]">
          {error}
        </div>
      )}
      {isRecording && !error && (
        <div className="text-xs text-green-400 text-center">
          Recording...
        </div>
      )}
    </div>
  );
}

