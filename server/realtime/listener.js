import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// For audio transcription, we still use OpenAI's Whisper API
// (OpenRouter doesn't offer faster alternatives for audio)
// The main text analysis uses OpenRouter with faster models - see engine.js
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000 // 30 second timeout for audio processing
});

export async function createRealtimeConnection({ onTranscript, onError }) {
  let conversationHistory = '';
  let isConnected = true;
  let audioBuffer = Buffer.alloc(0);

  try {
    // OpenAI Realtime API integration
    // For production, use OpenAI's Realtime API WebSocket
    // For now, we'll use a hybrid approach:
    // 1. Accept audio/text input via WebSocket
    // 2. Process with OpenAI Whisper for transcription
    // 3. Analyze in real-time
    
    const connection = {
      // Send audio data (from browser microphone)
      sendAudio: async (audioData) => {
        try {
          // Append to buffer
          audioBuffer = Buffer.concat([audioBuffer, audioData]);
          
          // Process in chunks (every 2 seconds of audio)
          // In production, use OpenAI Realtime API WebSocket
          // For now, we'll process text transcripts sent from frontend
        } catch (error) {
          console.error('Audio processing error:', error);
          if (onError) onError(error);
        }
      },
      
      // Send text transcript (from frontend or transcription)
      sendTranscript: async (text, prospectType = null) => {
        if (!text || text.trim().length === 0) return;
        
        conversationHistory += text + ' ';
        console.log(`[Realtime] Received transcript chunk: "${text.trim()}" (total history: ${conversationHistory.length} chars)`);
        
        // Trigger analysis on transcript updates
        if (onTranscript && isConnected) {
          try {
            await onTranscript(conversationHistory, prospectType);
          } catch (error) {
            console.error('[Realtime] Transcript analysis error:', error);
            if (onError) onError(error);
          }
        }
      },
      
      // Process audio file with Whisper
      processAudioFile: async (audioFile) => {
        try {
          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en',
            response_format: 'text'
          });
          
          await connection.sendTranscript(transcription);
          return transcription;
        } catch (error) {
          console.error('Whisper transcription error:', error);
          if (onError) onError(error);
          throw error;
        }
      },
      
      close: () => {
        isConnected = false;
        audioBuffer = Buffer.alloc(0);
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
    // This would use OpenAI's Whisper API or Realtime API
    // For now, we'll use a placeholder that processes text transcripts
    
    // In production, integrate with:
    // 1. OpenAI Realtime API (when available)
    // 2. WebRTC for audio capture
    // 3. Streaming transcription service
    
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

