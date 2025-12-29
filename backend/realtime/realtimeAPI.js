import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Creates a connection to OpenAI Realtime API for speech-to-text
 * Uses gpt-4o-realtime-preview-2024-10-01 model
 */
export async function createRealtimeAPIConnection({ onTranscript, onError }) {
  try {
    // OpenAI Realtime API endpoint
    const response = await openai.beta.realtime.connect({
      model: 'gpt-4o-realtime-preview-2024-10-01',
    });

    // Note: OpenAI Realtime API uses WebSocket-like interface
    // This is a simplified implementation - in production, you'd use the actual WebSocket connection
    
    const connection = {
      sendAudio: async (audioData) => {
        // Send audio data to Realtime API
        // Implementation depends on OpenAI Realtime API SDK
        try {
          // This would use the actual Realtime API WebSocket connection
          // For now, this is a placeholder structure
        } catch (error) {
          if (onError) onError(error);
        }
      },
      
      close: () => {
        // Close the Realtime API connection
      }
    };

    return connection;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Alternative: Use OpenAI Audio API for transcription
 * This can be used as a fallback or for batch processing
 */
export async function transcribeAudio(audioBuffer) {
  try {
    // Convert buffer to File-like object for OpenAI API
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });

    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

