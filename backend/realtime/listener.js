import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

// For audio transcription, we use OpenAI's Whisper API
// The main text analysis uses GPT-4o-mini - see engine.js
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000 // 30 second timeout for audio processing
});

export async function createRealtimeConnection({ onTranscript, onError }) {
  let conversationHistory = '';
  let isConnected = true;
  // Cap history so long sessions don't grow prompt size unbounded (prevents slowdown)
  const MAX_HISTORY_CHARS = Number(process.env.MAX_TRANSCRIPT_CHARS || 8000);
  const AUDIO_MIN_INTERVAL_MS = Number(process.env.AUDIO_MIN_INTERVAL_MS || 1800);
  let lastAudioTranscribeMs = 0;

  function extForMime(mimeType) {
    const mt = String(mimeType || '').toLowerCase();
    if (mt.includes('webm')) return 'webm';
    if (mt.includes('ogg') || mt.includes('oga')) return 'ogg';
    if (mt.includes('wav')) return 'wav';
    if (mt.includes('mp3')) return 'mp3';
    if (mt.includes('m4a') || mt.includes('mp4')) return 'm4a';
    return 'webm';
  }

  function looksLikeHallucination(text) {
    const t = String(text || '').trim().toLowerCase();
    if (!t) return true;
    // Common Whisper hallucinations on silence / noise
    const badPhrases = [
      'thank you for watching',
      'thanks for watching',
      'like and subscribe',
      'subscribe to my channel',
      'hit the bell',
      'music',
      'applause'
    ];
    if (badPhrases.some((p) => t.includes(p))) return true;
    return false;
  }

  async function transcribeAudioChunk(audioData, mimeType = '') {
    // We receive a single MediaRecorder chunk (typically webm/opus).
    // Persist to a temp file so OpenAI SDK can stream it as multipart form.
    const tmpDir = os.tmpdir();
    const id = crypto.randomBytes(8).toString('hex');
    const filename = path.join(tmpDir, `chunk-${id}.${extForMime(mimeType)}`);
    try {
      await fsp.writeFile(filename, audioData);
      const fileStream = fs.createReadStream(filename);
      // Use verbose_json when possible so we can suppress "no speech" hallucinations.
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        language: 'en',
        prompt: 'Real estate sales call between a CLOSER (salesperson) and a PROSPECT (property owner). Common terms: foreclosure, auction date, months behind, mortgage, lender, loan balance, equity, cash offer, seller financing, tenant, landlord, motivation, timeline.',
        temperature: 0,
        response_format: 'verbose_json'
      });
      const text =
        typeof transcription === 'string'
          ? transcription
          : (transcription?.text ?? '');

      const trimmed = String(text || '').trim();
      if (!trimmed) return '';

      // If we have per-segment no_speech_prob, drop likely silence.
      const segments = (transcription && typeof transcription === 'object') ? (transcription.segments || []) : [];
      if (Array.isArray(segments) && segments.length > 0) {
        const avgNoSpeech = segments
          .map((s) => Number(s?.no_speech_prob))
          .filter((n) => Number.isFinite(n))
          .reduce((a, b, _, arr) => a + b / arr.length, 0);
        if (Number.isFinite(avgNoSpeech) && avgNoSpeech >= 0.8) {
          return '';
        }
      }

      // Heuristic: suppress common hallucination phrases
      if (looksLikeHallucination(trimmed)) return '';

      return trimmed;
    } finally {
      try {
        await fsp.unlink(filename);
      } catch {
        // ignore
      }
    }
  }

  try {
    // OpenAI Realtime API integration
    // For production, use OpenAI's Realtime API WebSocket
    // For now, we'll use a hybrid approach:
    // 1. Accept audio/text input via WebSocket
    // 2. Process with OpenAI Whisper for transcription
    // 3. Analyze in real-time
    
    const connection = {
      // Send audio data (from browser microphone)
      sendAudio: async (audioData, mimeType = '') => {
        try {
          const now = Date.now();
          if (now - lastAudioTranscribeMs < AUDIO_MIN_INTERVAL_MS) {
            return { text: '' };
          }
          lastAudioTranscribeMs = now;

          const text = await transcribeAudioChunk(audioData, mimeType);
          if (!text) return { text: '' };
          return { text };
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

