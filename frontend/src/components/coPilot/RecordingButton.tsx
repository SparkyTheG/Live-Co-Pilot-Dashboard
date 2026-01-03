import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { ConversationWebSocket } from '../../lib/websocket';
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<ConversationWebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  // Use ref to track recording state (avoids stale closure issues)
  const isRecordingRef = useRef(false);
  // Keepalive interval for WebSocket
  const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Transcript accumulation for throttling
  const accumulatedTranscriptRef = useRef<string>('');
  const lastSendTimeRef = useRef<number>(0);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MIN_SEND_INTERVAL = 3000; // Minimum 3 seconds between sends
  // Track restart attempts to prevent infinite loops
  const restartAttemptsRef = useRef<number>(0);
  const MAX_RESTART_ATTEMPTS = 500; // Very high limit for long sessions (increased from 50)
  const lastResetTimeRef = useRef<number>(Date.now());

  // Update prospect type when it changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.setProspectType(prospectType);
    }
  }, [prospectType]);

  useEffect(() => {
    return () => {
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

      ws.setOnError((err) => {
        console.error('WebSocket error:', err);
        setError(err.message);
        setIsRecording(false);
        isRecordingRef.current = false;
      });

      await ws.connect();
      console.log('✅ Frontend: WebSocket connected, starting listening...');
      // Provide auth token so backend can persist this call session under RLS
      ws.setAuthToken(session?.access_token ?? null);
      ws.setProspectType(prospectType); // Set initial prospect type
      ws.startListening(); // This sends 'start_listening' message
      wsRef.current = ws;
      console.log('✅ Frontend: Listening started, WebSocket ready for transcripts');

      // Start WebSocket keepalive to prevent timeout
      startKeepalive();

      // Try to use OpenAI Realtime API via backend
      // For now, we'll use Web Speech API as fallback and send to backend
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        // Increase max silence time (some browsers support this)
        if ('maxSilenceSeconds' in recognition) {
          (recognition as any).maxSilenceSeconds = 60;
        }

        recognition.onresult = (event: any) => {
          let transcript = '';
          let isFinal = false;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
            if (event.results[i].isFinal) {
              isFinal = true;
            }
          }

          if (transcript.trim()) {
            // Update UI immediately
            if (onTranscriptUpdate) {
              onTranscriptUpdate(transcript);
            }

            // Accumulate transcript
            accumulatedTranscriptRef.current += ' ' + transcript;

            // Throttle sending to backend
            const now = Date.now();
            const timeSinceLastSend = now - lastSendTimeRef.current;

            // Send immediately if final result OR enough time has passed
            if (isFinal || timeSinceLastSend >= MIN_SEND_INTERVAL) {
              // Clear any pending timeout
              if (sendTimeoutRef.current) {
                clearTimeout(sendTimeoutRef.current);
                sendTimeoutRef.current = null;
              }

              // Send accumulated transcript
              if (wsRef.current && accumulatedTranscriptRef.current.trim()) {
                console.log('📤 Sending transcript to backend:', accumulatedTranscriptRef.current.substring(0, 100));
                wsRef.current.sendTranscript(accumulatedTranscriptRef.current.trim(), prospectType, customScriptPrompt, pillarWeights);
                lastSendTimeRef.current = now;
                accumulatedTranscriptRef.current = '';
              }
            } else {
              // Schedule a send after the interval
              if (!sendTimeoutRef.current) {
                sendTimeoutRef.current = setTimeout(() => {
                  if (wsRef.current && accumulatedTranscriptRef.current.trim()) {
                    console.log('📤 Sending accumulated transcript:', accumulatedTranscriptRef.current.substring(0, 100));
                    wsRef.current.sendTranscript(accumulatedTranscriptRef.current.trim(), prospectType, customScriptPrompt, pillarWeights);
                    lastSendTimeRef.current = Date.now();
                    accumulatedTranscriptRef.current = '';
                  }
                  sendTimeoutRef.current = null;
                }, MIN_SEND_INTERVAL - timeSinceLastSend);
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Don't show error for 'no-speech' as it's common during pauses
          if (event.error !== 'no-speech') {
            setError(`Speech recognition: ${event.error}`);
          }
          // Auto-restart on errors except 'aborted' and 'not-allowed'
          // Use ref to check recording state (avoids stale closure)
          if (event.error !== 'aborted' && event.error !== 'not-allowed' && isRecordingRef.current) {
            console.log('🔄 Restarting speech recognition after error...');
            setTimeout(() => {
              if (isRecordingRef.current && recognitionRef.current) {
                try {
                  recognition.start();
                  console.log('✅ Speech recognition restarted after error');
                } catch (e) {
                  console.error('Error restarting recognition:', e);
                }
              }
            }, 500);
          }
        };

        recognition.onend = () => {
          console.log('🔚 Speech recognition ended, isRecordingRef:', isRecordingRef.current);
          // Use ref to check recording state (avoids stale closure issue!)
          if (isRecordingRef.current) {
            // Reset counter every 30 seconds to prevent accumulation during long sessions
            const now = Date.now();
            if (now - lastResetTimeRef.current > 30000) {
              console.log('🔄 Resetting restart counter (30s elapsed)');
              restartAttemptsRef.current = 0;
              lastResetTimeRef.current = now;
            }

            // Check if we've exceeded max restart attempts
            if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) {
              console.error('❌ Max restart attempts reached, stopping recording');
              setError('Speech recognition stopped after multiple restart attempts. Please try again.');
              stopRecording();
              return;
            }

            restartAttemptsRef.current++;
            console.log(`🔄 Recording still active, restarting speech recognition (attempt ${restartAttemptsRef.current}/${MAX_RESTART_ATTEMPTS})...`);

            // Simplified restart logic - just restart immediately
            setTimeout(() => {
              if (!isRecordingRef.current) {
                console.log('⏹️ Recording stopped during restart delay, not restarting');
                return;
              }
              try {
                recognition.start();
                console.log('✅ Speech recognition restarted successfully');
              } catch (e: any) {
                // If already started, that's fine
                if (e.message?.includes('already started')) {
                  console.log('ℹ️ Recognition already running');
                } else {
                  console.error('Failed to restart recognition:', e.message);
                  // Try one more time after a longer delay
                  setTimeout(() => {
                    if (isRecordingRef.current) {
                      try {
                        recognition.start();
                        console.log('✅ Speech recognition restarted on retry');
                      } catch (e2) {
                        console.error('Failed to restart recognition on retry:', e2);
                      }
                    }
                  }, 1000);
                }
              }
            }, 100); // Short delay before restart
          } else {
            console.log('⏹️ Recording stopped, not restarting speech recognition');
            restartAttemptsRef.current = 0; // Reset counter
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        console.log('✅ Speech recognition started');
      } else {
        // No Web Speech API available - show helpful message
        setError('Speech recognition not available in this browser. Please use Chrome or Edge.');
        setIsConnecting(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        return;
      }

      // Update both state and ref
      setIsRecording(true);
      isRecordingRef.current = true;
      restartAttemptsRef.current = 0; // Reset restart counter
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
    console.log('🛑 Frontend: Stopping recording...');

    // CRITICAL: Update ref FIRST to prevent restart loops
    isRecordingRef.current = false;

    // Stop keepalive
    stopKeepalive();

    // Clear any pending send timeout
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }

    // Send any remaining accumulated transcript before disconnecting
    if (wsRef.current && accumulatedTranscriptRef.current.trim()) {
      console.log('📤 Sending final accumulated transcript');
      wsRef.current.sendTranscript(accumulatedTranscriptRef.current.trim(), prospectType, customScriptPrompt, pillarWeights);
      accumulatedTranscriptRef.current = '';
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
      mediaRecorderRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.stopListening();
        wsRef.current.disconnect();
        console.log('✅ Frontend: WebSocket disconnected');
      } catch (e) {
        console.warn('Error disconnecting WebSocket:', e);
      }
      wsRef.current = null;
    }

    setIsRecording(false);
    audioChunksRef.current = [];
    console.log('✅ Frontend: Recording stopped and cleaned up');
  };

  const handleToggle = () => {
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

