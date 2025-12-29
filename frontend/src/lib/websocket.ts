/**
 * WebSocket client for real-time conversation analysis
 */

export interface AnalysisUpdate {
  prospectType: string;
  lubometer: {
    score: number;
    level: string;
    interpretation: string;
    action: string;
  };
  truthIndex: {
    score: number;
    signals: string[];
    redFlags: string[];
    penalties: Array<{
      rule: string;
      description: string;
      penalty: number;
      details: string;
    }>;
  };
  pillars: any;
  hotButtons?: Array<{
    id: number;
    name: string;
    quote: string;
    score: number;
    prompt: string;
  }>;
  objections: Array<{
    objectionText: string;
    fear: string;
    whisper: string;
    probability: number;
    rebuttalScript: string;
  }>;
  dials: {
    urgency: string;
    trust: string;
    authority: string;
    structure: string;
  };
  diagnosticQuestions: {
    asked: number[];
    total: number;
    completion: number;
  };
  timestamp: string;
}

export class ConversationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased for long sessions
  private reconnectDelay = 1000;
  private url: string;
  private onAnalysisUpdate?: (analysis: AnalysisUpdate) => void;
  private onError?: (error: Error) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private manuallyDisconnected = false; // Track if disconnect was intentional
  private lastMessageTime = Date.now();
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(url?: string) {
    // Use environment variable or default to localhost for development
    // In production, if no URL is provided, the connection will fail gracefully
    const envUrl = import.meta.env.VITE_WS_URL;
    const defaultUrl = import.meta.env.DEV ? 'ws://localhost:3001/ws' : undefined;
    
    this.url = url || envUrl || defaultUrl || '';
    
    if (!this.url) {
      console.warn('⚠️ No WebSocket URL configured. Set VITE_WS_URL environment variable for production.');
    }
  }
  
  // Start connection health check - monitors for stale connections
  private startConnectionCheck() {
    this.stopConnectionCheck();
    this.connectionCheckInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.log('🔌 WebSocket not open, stopping health check');
        this.stopConnectionCheck();
        return;
      }
      
      // If no message received in 60 seconds and not manually disconnected, connection might be stale
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;
      if (timeSinceLastMessage > 60000 && !this.manuallyDisconnected) {
        console.log('⚠️ WebSocket appears stale, no messages in 60s');
        // The server should be sending pings, so if we haven't heard anything, try to reconnect
      }
    }, 30000);
  }
  
  private stopConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.url) {
        const error = new Error('Backend server not connected. The recording feature requires a backend server. For local testing, run: cd server && npm start');
        console.warn('WebSocket connection skipped:', error.message);
        if (this.onError) this.onError(error);
        reject(error);
        return;
      }
      
      try {
        // Reset manual disconnect flag when connecting
        this.manuallyDisconnected = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.manuallyDisconnected = false; // Reset on successful connection
          this.lastMessageTime = Date.now();
          this.startConnectionCheck();
          if (this.onConnect) this.onConnect();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // Track last message time for connection health
            this.lastMessageTime = Date.now();
            
            const data = JSON.parse(event.data);
            
            if (data.type === 'analysis_update') {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/cdfb1a12-ab48-4aa1-805a-5f93e754ce9a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'websocket.ts:84',message:'Frontend received analysis_update',data:{hasData:!!data.data,hotButtonsLength:data.data?.hotButtons?.length||0,objectionsLength:data.data?.objections?.length||0,hotButtons:data.data?.hotButtons,objections:data.data?.objections,keys:data.data?Object.keys(data.data):null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              if (this.onAnalysisUpdate) {
                this.onAnalysisUpdate(data.data);
              }
            } else if (data.type === 'error') {
              if (this.onError) {
                this.onError(new Error(data.message));
              }
            } else if (data.type === 'connected') {
              console.log('Connected to analysis server:', data.connectionId);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.onError) {
            this.onError(new Error('WebSocket connection error'));
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (this.onDisconnect) this.onDisconnect();
          
          // Only attempt to reconnect if disconnect was NOT intentional
          if (!this.manuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          } else {
            console.log('WebSocket disconnected intentionally, not reconnecting');
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  startListening(config?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'start_listening',
      config: config || {}
    }));
  }

  stopListening() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'stop_listening'
    }));
  }

  sendTranscript(text: string, prospectType?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot send transcript');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'transcript',
      text: text,
      prospectType: prospectType
    }));
  }

  setProspectType(prospectType: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot set prospect type');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'prospect_type_changed',
      prospectType: prospectType
    }));
  }

  sendAudioChunk(audio: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot send audio');
      return;
    }

    // Convert ArrayBuffer to base64
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(audio))
    );

    this.ws.send(JSON.stringify({
      type: 'audio_chunk',
      audio: base64
    }));
  }

  disconnect() {
    console.log('🔌 WebSocket: Manual disconnect requested');
    this.manuallyDisconnected = true; // Mark as intentional disconnect
    this.stopConnectionCheck();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  setOnAnalysisUpdate(callback: (analysis: AnalysisUpdate) => void) {
    this.onAnalysisUpdate = callback;
  }

  setOnError(callback: (error: Error) => void) {
    this.onError = callback;
  }

  setOnConnect(callback: () => void) {
    this.onConnect = callback;
  }

  setOnDisconnect(callback: () => void) {
    this.onDisconnect = callback;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

