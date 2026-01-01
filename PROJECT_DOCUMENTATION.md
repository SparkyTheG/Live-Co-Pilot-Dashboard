# Zero-Stress Sales CoPilot - Complete Project Documentation

## 📋 Table of Contents
1. [What This App Does](#what-this-app-does)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [System Flow](#system-flow)
5. [Key Components](#key-components)
6. [Data Flow Details](#data-flow-details)
7. [Current Problems & Issues](#current-problems--issues)
8. [Configuration & Environment](#configuration--environment)
9. [CSV Framework Integration](#csv-framework-integration)
10. [Prospect Types](#prospect-types)
11. [Testing](#testing)
12. [Known Limitations](#known-limitations)
13. [Recommendations for Improvement](#recommendations-for-improvement)
14. [Quick Start Guide](#quick-start-guide)
15. [File Structure](#file-structure-summary)

---

## What This App Does

**Zero-Stress Sales CoPilot** is a real-time sales conversation analysis application designed for real estate sales professionals. It analyzes live conversations between a salesperson and a prospect to provide:

1. **Lubometer Score** (0-90): Overall prospect readiness indicator
2. **Hot Buttons**: Emotional triggers that indicate prospect motivation (27 indicators)
3. **Top Objections**: Detected hesitations with suggested rebuttals
4. **Diagnostic Questions**: Tracks which qualifying questions have been asked
5. **Truth Index** (0-100): Coherence/consistency score of the prospect
6. **7 Pillars Analysis**: Breaks down 27 indicators across 7 weighted pillars

### Core Purpose
Help salespeople during live calls by providing real-time insights, suggested questions, objection handling strategies, and readiness scores based on the Zero-Stress Sales Framework.

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Web Speech API (browser speech-to-text)
- WebSocket client (real-time communication)

**Backend:**
- Node.js + Express (HTTP server)
- WebSocket Server (ws library)
- OpenAI SDK
- GPT-4o-mini (for AI analysis)

### System Flow

```
User speaks → Browser Speech Recognition
    ↓
Frontend (RecordingButton.tsx)
    ↓
WebSocket → ws://localhost:3001/ws
    ↓
Backend (server/index.js)
    ↓
Real-time Listener (realtime/listener.js)
    ↓
Analysis Engine (analysis/engine.js)
    ↓
┌─────────────────────────────────────┐
│ 1. Load Prospect Context (TXT)     │
│ 2. AI Analysis (GPT-4o-mini)       │
│ 3. Pillar Scoring (27 Indicators)   │
│ 4. Lubometer Calculation           │
│ 5. Truth Index Calculation         │
│ 6. Hot Buttons Extraction          │
│ 7. Objections Detection             │
│ 8. Diagnostic Questions Tracking   │
└─────────────────────────────────────┘
    ↓
WebSocket sends analysis_update
    ↓
Frontend (LiveCoPilotDashboard.tsx)
    ↓
UI Updates in Real-Time
```

---

## Key Components

### Frontend Components

**1. `LiveCoPilotDashboard.tsx`** - Main dashboard component
- Displays all analysis metrics (Lubometer, Truth Index, Hot Buttons, Objections)
- Manages analysis data state
- Handles diagnostic questions tracking
- Uses history sets to persist detected items across updates

**2. `RecordingButton.tsx`** - Audio recording component
- Integrates with Web Speech API for browser-based speech-to-text
- Manages WebSocket connection lifecycle
- Sends transcripts to backend via WebSocket
- Implements keepalive pings to prevent connection timeouts
- Handles speech recognition restart logic

**3. `websocket.ts`** - WebSocket client library
- Manages WebSocket connection lifecycle
- Auto-reconnect logic with exponential backoff
- Message handling and routing
- Connection health monitoring

### Backend Components

**1. `server/index.js`** - Main server entry point
- Express HTTP server (port 3001)
- WebSocket server (port 3002, path: /ws)
- Connection management per client
- Ping/pong heartbeat to keep connections alive
- Routes messages to analysis engine

**2. `server/analysis/engine.js`** - Core analysis orchestrator
- Main function: `analyzeConversation(transcript, prospectType)`
- Coordinates all analysis modules
- Calls GPT-4o-mini via OpenAI
- Implements caching (5 second TTL) and debouncing (2 second minimum interval)
- Combines AI analysis with CSV-based calculations
- Returns complete analysis object

**3. `server/analysis/pillars.js`** - Pillar scoring module
- Scores all 27 indicators (1-10 scale)
- Uses AI-generated `indicatorSignals` ONLY (no keyword fallbacks)
- Calculates 7 pillar averages from indicators
- Applies pillar weights (P1: 1.5x, P4: 1.5x, others: 1.0x)
- Handles reverse scoring for P6 (Price Sensitivity)

**4. `server/analysis/lubometer.js`** - Readiness score calculator
- Calculates weighted pillar scores (max 90)
- Applies Truth Index penalties
- Determines level: "no-go" (<30), "caution" (30-49), "go" (50-69), "high" (70-90)
- Provides interpretation and action recommendations

**5. `server/analysis/truthIndex.js`** - Coherence score calculator
- Base score: 45
- Positive signals increase score (+3 to +5 each)
- Incoherence penalties (T1-T6 rules, -10 to -15 each)
- Detects contradictions (e.g., high pain + low urgency)
- Returns signals, red flags, and penalties array

**6. `server/analysis/hotButtons.js`** - Hot button extractor
- Extracts hot buttons from AI analysis
- Indicator name comes from CSV files
- Quote, score, and contextualPrompt are AI-generated
- Only shows indicators with score >= 6
- NO fallbacks to CSV examples

**7. `server/analysis/objections.js`** - Objection detector
- Detects objections from AI analysis only
- Extracts objection text, fear, whisper, probability, rebuttalScript
- Sorts by probability (highest first)
- Limits to top 5 objections
- NO keyword/pattern matching fallbacks

**8. `server/analysis/diagnosticQuestions.js`** - Question tracker
- Tracks which diagnostic questions were asked
- Uses AI-detected `askedQuestions` array (question indices)
- Validates indices are within bounds
- NO pattern matching fallbacks
- Returns completion percentage

**9. `server/analysis/csvContext.js`** - CSV framework loader
- Loads comprehensive CSV framework context
- Includes all 7 pillars, 27 indicators, scoring levels
- Includes Lubometer formula, Truth Index penalties
- Includes hot buttons tracker, objection matrix
- Provides context to AI in prompts

**10. `server/analysis/prospectFiles.js`** - Prospect context loader
- Loads prospect-specific TXT files from `txt files/` directory
- Maps prospect types to file names
- Returns file content for AI prompt context

---

## Data Flow Details

### 1. Speech-to-Text Flow
- Browser Web Speech API transcribes audio in real-time
- Transcripts accumulated and sent to backend every 3 seconds (throttled)
- WebSocket sends `{ type: 'transcript', text: '...', prospectType: '...' }`

### 2. AI Analysis Flow
- GPT-4o-mini analyzes the transcript with:
  - CSV framework context (7 pillars, 27 indicators, formulas)
  - Prospect-specific TXT file content
  - Full conversation transcript
- Returns structured JSON:
  - `indicatorSignals`: Object with all 27 indicator scores (1-10)
  - `hotButtonDetails`: Array of hot buttons with quotes and prompts
  - `objections`: Array of detected objections with rebuttals
  - `askedQuestions`: Array of diagnostic question indices

### 3. Pillar Calculation Flow
- Uses AI `indicatorSignals` for all 27 indicators
- Calculates 7 pillar averages (groups indicators by pillar)
- Applies pillar weights to averages
- Handles P6 reverse scoring (low sensitivity = high score)

### 4. Lubometer Calculation Flow
- Weighted sum of pillar scores (max 90)
- Minus Truth Index penalties
- Final score: 0-90
- Level determination based on score ranges

### 5. Truth Index Calculation Flow
- Starts at base score: 45
- Positive signals: +3 to +5 per signal
- Incoherence penalties: -10 to -15 per violation
- Final score: 0-100 (clamped)

### 6. Hot Buttons Extraction Flow
- Only uses AI-provided `hotButtonDetails`
- Extracts indicator ID, name (from CSV mapping), quote, score, contextualPrompt
- Filters indicators with score >= 6
- NO fallbacks if AI doesn't provide data

### 7. Objections Detection Flow
- Only uses AI-provided `objections` array
- Extracts objectionText, fear, whisper, probability, rebuttalScript
- Sorts by probability, limits to top 5
- NO keyword matching fallbacks

---

## Current Problems & Issues

### 🔴 Critical Issues

**1. Hot Buttons Accuracy**
- **Problem**: Hot button quotes sometimes display text that wasn't actually said
- **Root Cause**: AI may be paraphrasing instead of extracting exact quotes
- **Impact**: Misleading information reduces trust in the system
- **Status**: Partially addressed (AI prompt explicitly asks for exact quotes), needs validation

**2. Lubometer Scoring Accuracy**
- **Problem**: Lubometer score not reaching expected values (e.g., 80) even with high-scoring input
- **Root Cause**: Possible issues with:
  - AI indicator scoring (not scoring high enough)
  - Pillar weight application
  - Truth index penalties being too aggressive
- **Impact**: Incorrect readiness assessment
- **Status**: Needs testing with provided test scripts

**3. Speech-to-Text Reliability**
- **Problem**: Web Speech API can stop working after 10-15 seconds
- **Root Cause**: Browser API limitations, timeouts, speech recognition service issues
- **Impact**: Recording stops mid-conversation, breaks user experience
- **Status**: Partially fixed with restart logic, but may still occur

**4. WebSocket Connection Stability**
- **Problem**: Connections can timeout or drop during long conversations
- **Root Cause**: Network issues, server timeouts, inactivity
- **Impact**: Analysis stops updating, requires reconnection
- **Status**: Partially fixed with keepalive pings, but may still occur

**5. Diagnostic Questions False Positives**
- **Problem**: Questions marked as asked when they weren't actually asked
- **Root Cause**: AI over-detecting questions in conversation
- **Impact**: Incorrect progress tracking
- **Status**: Fixed (AI-only detection, stricter prompt), needs validation

**6. App Stops Updating After Restart**
- **Problem**: After stopping and restarting recording, analysis stops updating
- **Root Cause**: WebSocket connection not properly cleaned up before restart
- **Impact**: Requires page refresh to continue
- **Status**: Fixed (cleanup logic added), needs validation

### 🟡 Moderate Issues

**7. AI Response Speed**
- **Problem**: AI models can have variable response times
- **Root Cause**: API latency, network conditions
- **Impact**: Occasional delayed real-time updates
- **Status**: Using GPT-4o-mini (fast and cost-effective)

**8. Two-Person Conversation Detection**
- **Problem**: AI may not clearly distinguish between salesperson and prospect speech
- **Root Cause**: Transcript may not include speaker labels, AI may confuse roles
- **Impact**: Incorrect attribution of signals (e.g., salesperson questions marked as prospect signals)
- **Status**: Partially addressed in AI prompt, needs validation

**9. Caching and Debouncing**
- **Problem**: May skip analysis if requests come too frequently
- **Root Cause**: 2 second debounce interval, cache TTL of 5 seconds
- **Impact**: Missed updates during rapid speech
- **Status**: Working as designed, but may need tuning

### 🟢 Minor Issues

**10. Error Handling**
- **Problem**: Some errors may not be properly surfaced to the user
- **Root Cause**: Silent failures in some code paths, errors logged but not displayed
- **Impact**: Users don't know why analysis stopped
- **Status**: Needs improvement in error messaging

**11. Logging**
- **Problem**: Extensive logging may clutter console
- **Root Cause**: Debug logs left in production code
- **Impact**: Harder to find real issues, console noise
- **Status**: Minor issue, can be cleaned up

---

## Configuration & Environment

### Required Environment Variables

**Backend (`server/.env`):**
```env
# Required: OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# Optional: Server ports (defaults shown)
PORT=3001
WS_PORT=3002
```

### Ports
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend HTTP**: `http://localhost:3001`
- **Backend WebSocket**: `ws://localhost:3001/ws`

---

## CSV Framework Integration

The application implements the **Zero-Stress Sales Framework** which includes:

- **7 Pillars** (with weights):
  - P1: Perceived Spread (Pain & Desire Gap) - Weight: 1.5
  - P2: Urgency - Weight: 1.0
  - P3: Decisiveness - Weight: 1.0
  - P4: Available Money - Weight: 1.5
  - P5: Responsibility & Ownership - Weight: 1.0
  - P6: Price Sensitivity (Reverse Scored) - Weight: 1.0
  - P7: Trust - Weight: 1.0

- **27 Indicators** (scored 1-10):
  - 4 indicators per pillar (P1-P5, P7), 3 indicators for P6
  - Each indicator has Low (1-3), Mid (4-6), High (7-10) scoring levels

- **Lubometer Formula**:
  - Weighted pillar scores (max 90)
  - Minus Truth Index penalties
  - Final score: 0-90

- **Truth Index Penalties** (T1-T6 incoherence rules):
  - T1: High Pain + Low Urgency (-15)
  - T2: High Desire + Low Decisiveness (-15)
  - T3: High Money Access + High Price Sensitivity (-10)
  - T4: Claims Authority + Low Self-Permission (-10)
  - T5: High Desire + Low Responsibility (-15)
  - T6: High Commitment + Low Locus of Control (-10)

- **Hot Buttons Tracker**: All 27 indicators can be hot buttons
- **Objection Matrix**: Patterns and responses for common objections

**Important**: All CSV logic is embedded in the AI prompt via `csvContext.js`, not hardcoded in the analysis logic. The AI uses this context to score indicators correctly.

---

## Prospect Types

The application supports 5 prospect types, each with:

1. **foreclosure** → `foreclosure-prospect.txt`
2. **creative-seller-financing** → `creative-finance-savvy-prospect.txt`
3. **distressed-landlord** → `distressed-landlord-prospect.txt`
4. **performing-tired-landlord** → `tired-landlord-prospect.txt`
5. **cash-equity-seller** → `cash-equity-seller.txt`

Each prospect type has:
- Specific diagnostic questions (defined in `diagnosticQuestions.js`)
- Context file loaded into AI prompt (from `txt files/` directory)
- Different scoring patterns and expectations

---

## Testing

### Test Scripts

Test scripts are provided in `TEST_SCRIPTS.md`:

**High Score Script** (Target: 70-90):
- Strong pain/urgency language
- Available money indicators
- Low price sensitivity
- Decision authority
- Responsibility/ownership
- Trust signals
- Commitment language

**Low Score Script** (Target: <30):
- Weak pain/urgency
- Avoids sharing information
- High price sensitivity
- No decision authority
- Blames external factors
- Low trust
- No commitment

Use these scripts to validate:
- Lubometer scoring accuracy
- Hot button detection
- Objection detection
- Truth index calculation
- Pillar scoring

### Manual Testing Steps

1. Start both servers (frontend and backend)
2. Open browser to `http://localhost:5173`
3. Select prospect type from dropdown
4. Click "Start Recording"
5. Speak the test script (as the prospect)
6. Observe real-time updates in dashboard
7. Check console logs for errors
8. Verify scores match expectations

---

## Known Limitations

1. **No Keyword Fallbacks**: If AI fails, returns empty analysis (no guessing with keywords)
2. **Browser Dependent**: Requires Web Speech API support (Chrome, Edge, Safari)
3. **Single Conversation**: One active conversation per WebSocket connection
4. **No Persistence**: Analysis not saved to database (only real-time)
5. **Real-time Only**: No historical analysis review feature
6. **API Dependency**: Requires OpenAI API key (paid service)
7. **Speech Recognition Limits**: Web Speech API has timeout limitations
8. **No Speaker Diarization**: Cannot automatically distinguish salesperson vs prospect

---

## Recommendations for Improvement

1. **Add Speaker Diarization**: Automatically identify who said what in transcript
2. **Implement Retry Logic**: Retry failed AI calls with exponential backoff
3. **Add Database Persistence**: Save analysis history for review
4. **Improve Error Messages**: Show user-friendly error messages in UI
5. **Add Validation**: Validate AI output (quote accuracy, score ranges)
6. **Consider Hybrid Model**: Fast model for initial analysis, GPT-4 for refinement
7. **Add Unit Tests**: Test pillar/lubometer calculations independently
8. **Implement Rate Limiting**: Prevent API abuse
9. **Add Monitoring**: Track connection health, API usage, errors
10. **Create Admin Dashboard**: Review analysis quality, adjust prompts
11. **Add Export Feature**: Export analysis reports to PDF/CSV
12. **Improve Speech Recognition**: Consider alternative STT services (e.g., Deepgram, AssemblyAI)

---

## Quick Start Guide

### For New Developers

**1. Install Dependencies:**
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

**2. Set Up Environment:**
```bash
cd server
# Create .env file
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

**3. Start Servers:**
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
npm run dev
```

**4. Open Browser:**
- Navigate to `http://localhost:5173`
- Should see the Live CoPilot Dashboard

**5. Test:**
- Select a prospect type from dropdown
- Click "Start Recording"
- Speak test script from `TEST_SCRIPTS.md`
- Observe real-time analysis updates

### Troubleshooting

**Backend won't start:**
- Check `OPENAI_API_KEY` is set in `server/.env`
- Check ports 3001 and 3002 are not in use
- Check Node.js version (requires Node 18+)

**Frontend won't start:**
- Check Node.js version (requires Node 18+)
- Try deleting `node_modules` and reinstalling

**WebSocket connection fails:**
- Ensure backend is running on port 3001
- Check browser console for errors
- Check CORS settings

**No analysis appearing:**
- Check backend console for AI API calls
- Verify API key is valid
- Check transcript is being sent (frontend console)

---

## File Structure Summary

```
/
├── src/
│   ├── components/
│   │   ├── LiveCoPilotDashboard.tsx    # Main dashboard
│   │   ├── coPilot/
│   │   │   └── RecordingButton.tsx    # Audio recording
│   │   ├── TopObjections.tsx          # Objections display
│   │   ├── Lubometer.tsx              # Lubometer gauge
│   │   ├── TruthIndex.tsx             # Truth Index display
│   │   └── ...
│   ├── lib/
│   │   ├── websocket.ts               # WebSocket client
│   │   └── supabase.ts                # (Not used in this feature)
│   ├── data/
│   │   ├── diagnosticQuestions.ts     # Question definitions
│   │   └── ...
│   └── App.tsx                        # Main app component
├── server/
│   ├── index.js                       # Main server entry point
│   ├── analysis/
│   │   ├── engine.js                  # Core orchestrator
│   │   ├── pillars.js                 # 27 indicators scoring
│   │   ├── lubometer.js               # Readiness score
│   │   ├── truthIndex.js              # Coherence score
│   │   ├── hotButtons.js              # Hot button extraction
│   │   ├── objections.js              # Objection detection
│   │   ├── diagnosticQuestions.js     # Question tracking
│   │   ├── prospectType.js            # Prospect type detection
│   │   ├── csvContext.js              # CSV framework loader
│   │   └── prospectFiles.js           # TXT file loader
│   └── realtime/
│       ├── listener.js                # Real-time connection handler
│       └── realtimeAPI.js             # (Not used currently)
├── txt files/                         # Prospect-specific context files
│   ├── foreclosure-prospect.txt
│   ├── creative-finance-savvy-prospect.txt
│   ├── distressed-landlord-prospect.txt
│   ├── tired-landlord-prospect.txt
│   └── cash-equity-seller.txt
├── package.json                       # Frontend dependencies
├── server/package.json                # Backend dependencies
├── TEST_SCRIPTS.md                    # Test conversation scripts
├── README.md                          # Basic readme (needs update)
└── [various markdown docs]            # Other documentation files
```

---

## Key Code Locations

### AI Analysis Configuration
- **Model**: `server/analysis/engine.js` line 90-92
- **Prompt**: `server/analysis/engine.js` line 277-554 (`analyzeWithAI` function)
- **CSV Context**: `server/analysis/csvContext.js`

### Pillar Scoring
- **Main Logic**: `server/analysis/pillars.js`
- **AI Integration**: Uses `aiAnalysis.indicatorSignals`
- **Weights**: Defined in `PILLAR_WEIGHTS` object

### Lubometer Calculation
- **Main Logic**: `server/analysis/lubometer.js`
- **Formula**: Weighted pillars - Truth Index penalties
- **Levels**: Defined in `calculateLubometer` function

### WebSocket Communication
- **Frontend**: `src/lib/websocket.ts`
- **Backend**: `server/index.js` (lines 64-296)
- **Message Types**: `start_listening`, `stop_listening`, `transcript`, `analysis_update`

### Speech Recognition
- **Frontend**: `src/components/coPilot/RecordingButton.tsx`
- **API**: Browser Web Speech API
- **Restart Logic**: Lines 200-250 (approximate)

---

## Important Notes

1. **AI-Only Analysis**: The application has been refactored to use AI-only analysis with NO keyword fallbacks. If AI fails, empty analysis is returned.

2. **GPT-4o-mini**: Currently using GPT-4o-mini via OpenAI for fast and cost-effective analysis.

3. **Real-time Processing**: Analysis happens in real-time as conversation progresses. Transcripts are sent every 3 seconds (throttled).

4. **Caching**: Analysis results are cached for 5 seconds to avoid duplicate API calls.

5. **Debouncing**: Minimum 2 second interval between AI analyses to prevent API spam.

6. **WebSocket Keepalive**: Frontend sends empty transcripts every 30 seconds to keep connection alive.

7. **Error Handling**: If AI analysis fails, the system returns empty analysis rather than guessing with keywords.

---

## Contact & Support

For questions or issues:
1. Check this documentation first
2. Review `TROUBLESHOOTING.md` for common issues
3. Check `DEBUGGING_GUIDE.md` for debugging steps
4. Review console logs (both frontend and backend)
5. Use test scripts from `TEST_SCRIPTS.md` to validate functionality

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Status**: Active Development
