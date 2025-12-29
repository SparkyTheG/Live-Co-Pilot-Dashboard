# Zero-Stress Sales Backend

Real-time conversation analysis backend for Zero-Stress Sales application.

## Features

- Real-time conversation listening and transcription
- AI-powered analysis based on 7 Pillars and 27 Indicators (from CSV files)
- Lubometer calculation
- Truth Index scoring with incoherence detection
- Hot Buttons extraction
- Objection detection and rebuttal suggestions
- Prospect type detection
- WebSocket support for live updates to frontend

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will start on:
- HTTP API: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

## API Endpoints

### POST /api/analyze
Manually analyze a conversation transcript.

**Request:**
```json
{
  "transcript": "I'm behind on my mortgage payments and the auction is in 3 weeks..."
}
```

**Response:**
```json
{
  "prospectType": "foreclosure",
  "lubometer": {
    "score": 72,
    "level": "high",
    "interpretation": "High buy probability - prospect is ready and coherent",
    "action": "Push to close"
  },
  "truthIndex": {
    "score": 68,
    "signals": ["High pain awareness", "Shares loan details"],
    "redFlags": [],
    "penalties": []
  },
  "pillars": {...},
  "hotButtons": {...},
  "objections": [...],
  "dials": {...}
}
```

### GET /health
Health check endpoint.

## WebSocket API

Connect to `ws://localhost:3001/ws` for real-time updates.

### Messages from Client to Server:

**Start Listening:**
```json
{
  "type": "start_listening",
  "config": {}
}
```

**Stop Listening:**
```json
{
  "type": "stop_listening"
}
```

**Send Transcript:**
```json
{
  "type": "transcript",
  "text": "I need to sell my house fast..."
}
```

**Send Audio Chunk:**
```json
{
  "type": "audio_chunk",
  "audio": "base64_encoded_audio_data"
}
```

### Messages from Server to Client:

**Analysis Update:**
```json
{
  "type": "analysis_update",
  "data": {
    "prospectType": "foreclosure",
    "lubometer": {...},
    "truthIndex": {...},
    "hotButtons": {...},
    "objections": [...],
    "dials": {...}
  }
}
```

**Connection Status:**
```json
{
  "type": "connected",
  "connectionId": "conn_1234567890_abc123"
}
```

**Error:**
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Analysis Logic

The backend analyzes conversations based on the CSV files:

1. **7 Pillars Analysis:**
   - P1: Perceived Spread (Pain & Desire Gap) - Weight: 1.5
   - P2: Urgency - Weight: 1.0
   - P3: Decisiveness - Weight: 1.0
   - P4: Available Money - Weight: 1.5
   - P5: Responsibility & Ownership - Weight: 1.0
   - P6: Price Sensitivity (Reverse Scored) - Weight: 1.0
   - P7: Trust - Weight: 1.0

2. **27 Indicators:** Each pillar has 3-4 indicators scored 1-10

3. **Lubometer Calculation:**
   - Weighted pillar scores (max 90)
   - Minus Truth Index penalties
   - Zones: 70-90 (High), 50-69 (Medium), 30-49 (Low), <30 (No-Go)

4. **Truth Index:**
   - Base score: 45
   - Increases with positive signals
   - Decreases with incoherence penalties (T1-T5)

5. **Hot Buttons:** Extracted pain points and desires

6. **Objections:** Detected objections with rebuttal suggestions

## Integration with Frontend

The frontend can use the WebSocket client (`src/lib/websocket.ts`) to connect and receive real-time updates:

```typescript
import { ConversationWebSocket } from '../lib/websocket';

const ws = new ConversationWebSocket('ws://localhost:3001/ws');

ws.setOnAnalysisUpdate((analysis) => {
  // Update UI with analysis data
  setLubometer(analysis.lubometer.score);
  setTruthIndex(analysis.truthIndex.score);
  // etc.
});

await ws.connect();
ws.startListening();

// Send transcript updates
ws.sendTranscript("New conversation text...");
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: HTTP server port (default: 3001)
- `WS_PORT`: WebSocket port (default: 3002, but uses same port as HTTP)

## Notes

- The backend uses pattern matching and keyword detection for analysis
- For production, consider integrating OpenAI's Realtime API when available
- Audio transcription can be done client-side or server-side using Whisper API
- The analysis engine processes transcripts incrementally for real-time updates

