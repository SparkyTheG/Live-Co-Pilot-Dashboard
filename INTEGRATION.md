# Backend Integration Guide

This guide explains how to integrate the real-time conversation analysis backend with your frontend.

## Quick Start

1. **Start the backend server:**
```bash
cd server
npm install
npm start
```

2. **The backend will be available at:**
   - HTTP API: `http://localhost:3001`
   - WebSocket: `ws://localhost:3001/ws`

## Frontend Integration

The backend provides real-time analysis updates via WebSocket. Your frontend already has a WebSocket client at `src/lib/websocket.ts`.

### Basic Usage

```typescript
import { ConversationWebSocket, AnalysisUpdate } from '../lib/websocket';
import { useEffect, useState } from 'react';

function YourComponent() {
  const [ws, setWs] = useState<ConversationWebSocket | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisUpdate | null>(null);

  useEffect(() => {
    const websocket = new ConversationWebSocket('ws://localhost:3001/ws');
    
    websocket.setOnAnalysisUpdate((data) => {
      setAnalysis(data);
      // Update your component state with:
      // - data.lubometer.score
      // - data.truthIndex.score
      // - data.hotButtons
      // - data.objections
      // - data.dials
      // - data.prospectType
    });

    websocket.setOnError((error) => {
      console.error('WebSocket error:', error);
    });

    websocket.connect().then(() => {
      websocket.startListening();
      setWs(websocket);
    });

    return () => {
      websocket.disconnect();
    };
  }, []);

  // Send transcript updates (from your conversation input)
  const sendTranscript = (text: string) => {
    if (ws && ws.isConnected()) {
      ws.sendTranscript(text);
    }
  };

  return (
    <div>
      {/* Your UI components */}
      {analysis && (
        <div>
          <p>Lubometer: {analysis.lubometer.score}</p>
          <p>Truth Index: {analysis.truthIndex.score}</p>
        </div>
      )}
    </div>
  );
}
```

### Manual Analysis (REST API)

If you prefer REST API over WebSocket:

```typescript
async function analyzeTranscript(transcript: string) {
  const response = await fetch('http://localhost:3001/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript }),
  });

  const analysis = await response.json();
  return analysis;
}
```

## Data Structure

The analysis response includes:

```typescript
{
  prospectType: string; // 'foreclosure' | 'distressed-landlord' | etc.
  
  lubometer: {
    score: number; // 0-90
    level: 'high' | 'medium' | 'low' | 'no-go';
    interpretation: string;
    action: string;
  };
  
  truthIndex: {
    score: number; // 0-100
    signals: string[]; // Positive truth signals
    redFlags: string[]; // Warning signs
    penalties: Array<{
      rule: string; // T1-T5
      description: string;
      penalty: number;
      details: string;
    }>;
  };
  
  hotButtons: {
    pain1: string; // Quote showing pain
    pain2: string; // Another pain quote
    desire: string; // Quote showing desire
  };
  
  objections: Array<{
    objectionText: string;
    fear: string;
    whisper: string; // Suggested response
    probability: number; // 0-1
    rebuttalScript: string;
  }>;
  
  dials: {
    urgency: string; // Quote
    trust: string; // Quote
    authority: string; // Quote
    structure: string; // Quote
  };
  
  pillars: {
    indicators: Record<number, number>; // Indicator ID -> Score (1-10)
    pillars: {
      P1: { average: number; weighted: number; indicators: Array<...> };
      // ... P2-P7
    };
  };
}
```

## Integration Points

### 1. LiveCoPilotDashboard
Update `LiveCoPilotDashboard.tsx` to receive real-time analysis:

```typescript
// Add WebSocket connection
const ws = new ConversationWebSocket();
ws.setOnAnalysisUpdate((analysis) => {
  setProspectType(analysis.prospectType);
  // Update lubometer, truth index, hot buttons, etc.
});
```

### 2. ConversationUpload
The `ConversationUpload` component can send transcripts to the backend:

```typescript
// After extracting text from PDF or manual input
ws.sendTranscript(extractedText);
```

### 3. Real-time Audio
For real-time audio transcription, you can:
1. Use browser's Web Speech API for client-side transcription
2. Send audio chunks to backend for Whisper API processing
3. Send transcribed text via WebSocket

## Testing

Test the backend with a sample transcript:

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I am behind on my mortgage payments. The auction is in 3 weeks and I am terrified of losing everything. I need to sell fast to save my credit."
  }'
```

## Production Deployment

For production:
1. Update WebSocket URL to your production server
2. Add authentication/authorization
3. Use environment variables for API endpoints
4. Consider using a message queue for high-volume scenarios
5. Add rate limiting and error handling

## Notes

- The backend analyzes conversations incrementally as transcripts are received
- Analysis updates are sent in real-time via WebSocket
- The frontend UI doesn't need to change - just connect to WebSocket and update state
- All analysis logic is based on your CSV files and follows the exact formulas specified

