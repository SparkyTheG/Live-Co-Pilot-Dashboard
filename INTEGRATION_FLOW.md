# CSV & TXT File Integration Flow

This document shows exactly where and how CSV files and TXT files are integrated into the AI analysis pipeline.

## 🔄 Complete Flow Diagram

```
Frontend (User speaks)
    ↓
RecordingButton Component
    ↓
WebSocket → ws://localhost:3001/ws
    ↓
Backend (server/index.js)
    ↓
analyzeConversation(transcript, prospectType)
    ↓
┌─────────────────────────────────────────┐
│  INTEGRATION POINT #1: TXT Files        │
│  loadProspectFile(prospectType)         │
│  ↳ Loads prospect-specific TXT file     │
│  ↳ e.g., foreclosure-prospect.txt       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  INTEGRATION POINT #2: AI Analysis      │
│  analyzeWithAI(transcript, prospectType)│
│  ↳ Uses GPT-4o-mini                     │
│  ↳ Receives:                            │
│    - CSV Framework Context              │
│    - Prospect-Specific TXT Content      │
│    - Conversation Transcript            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  INTEGRATION POINT #3: CSV Logic        │
│  analyzePillars(transcript, prospectType)│
│  ↳ 7 Pillars (27 Indicators)            │
│  ↳ Pattern matching based on CSV rules  │
│  ↳ Scores 1-10 for each indicator       │
└─────────────────────────────────────────┘
    ↓
calculateLubometer() + calculateTruthIndex()
    ↓
┌─────────────────────────────────────────┐
│  OUTPUT TO FRONTEND                     │
│  WebSocket sends:                       │
│  - Lubometer score                      │
│  - Truth Index                          │
│  - Pillar scores                        │
│  - Hot Buttons                          │
│  - Objections                           │
└─────────────────────────────────────────┘
```

## 📍 Key Integration Points

### 1. **TXT File Loading** 
**File**: `server/analysis/prospectFiles.js`

```javascript
// Line 27-50: Loads prospect-specific TXT file
export function loadProspectFile(prospectType) {
  const fileName = PROSPECT_FILE_MAP[prospectType];
  const txtFilesPath = path.join(__dirname, '../../txt files', fileName);
  const content = fs.readFileSync(txtFilesPath, 'utf-8');
  return content; // Returns full TXT file content
}
```

**Called in**: `server/analysis/engine.js` line 29
```javascript
const prospectContext = loadProspectFile(prospectType);
```

### 2. **CSV Framework Integration**
**File**: `server/analysis/engine.js`

**Lines 128-165**: CSV Context Summary
```javascript
function getCSVContextSummary() {
  return `
    Zero-Stress Sales Framework - 7 Pillars:
    P1: Perceived Spread (Pain & Desire Gap) - Weight: 1.5
    P2: Urgency - Weight: 1.0
    P3: Decisiveness - Weight: 1.0
    P4: Available Money - Weight: 1.5
    P5: Responsibility & Ownership - Weight: 1.0
    P6: Price Sensitivity (Reverse Scored) - Weight: 1.0
    P7: Trust - Weight: 1.0
    
    Lubometer Calculation:
    - Weighted pillar scores (max 90)
    - Minus Truth Index penalties
    
    Truth Index Penalties (T1-T5):
    - T1: High Pain + Low Urgency (-15)
    - T2: High Desire + Low Decisiveness (-15)
    ...
  `;
}
```

**Lines 82-126**: GPT-4o-mini Analysis with CSV + TXT
```javascript
async function analyzeWithAI(transcript, prospectType, prospectContext) {
  const csvContext = getCSVContextSummary(); // CSV logic
  
  const systemPrompt = `You are an expert sales conversation analyst...
  
  CSV Framework Context:
  ${csvContext}  // ← CSV LOGIC HERE
  
  Prospect-Specific Context:
  ${prospectContext}  // ← TXT FILE CONTENT HERE
  
  Analyze the conversation...
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',  // ← AI MODEL
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this conversation:\n\n${transcript}` }
    ]
  });
}
```

### 3. **CSV-Based Pillar Analysis**
**File**: `server/analysis/pillars.js`

**Lines 26-683**: Implements CSV logic for all 7 Pillars and 27 Indicators
- Pattern matching based on CSV rules
- Scores each indicator 1-10
- Calculates weighted pillar averages

**Called in**: `server/analysis/engine.js` line 35
```javascript
const pillarScores = await analyzePillars(lowerTranscript, prospectType);
```

### 4. **Frontend Integration**
**File**: `server/index.js`

**Lines 114-122**: Receives transcript and prospect type
```javascript
onTranscript: async (transcript, prospectType) => {
  // Analyze the conversation in real-time with prospect type
  const analysis = await analyzeConversation(transcript, prospectType);
  
  // Send analysis to frontend
  sendToClient(connectionId, {
    type: 'analysis_update',
    data: analysis  // ← Contains all CSV + TXT based analysis
  });
}
```

## 📊 Data Flow Summary

### CSV Files Integration:
1. **Pillars Logic** (`pillars.js`): Implements scoring rules from CSV files
2. **Lubometer Calculation** (`lubometer.js`): Uses CSV formula for readiness score
3. **Truth Index** (`truthIndex.js`): Applies CSV penalty rules (T1-T5)
4. **Hot Buttons** (`hotButtons.js`): Extracts based on CSV patterns
5. **Objections** (`objections.js`): Detects based on CSV objection matrix
6. **AI Prompt** (`engine.js`): Includes CSV framework summary for GPT-4o-mini

### TXT Files Integration:
1. **File Loading** (`prospectFiles.js`): Loads prospect-specific TXT file
2. **AI Analysis** (`engine.js`): Includes TXT content in GPT-4o-mini prompt
3. **Prospect Type Mapping**: 
   - `foreclosure` → `foreclosure-prospect.txt`
   - `performing-tired-landlord` → `tired-landlord-prospect.txt`
   - `distressed-landlord` → `distressed-landlord-prospect.txt`
   - `cash-equity-seller` → `cash-equity-seller.txt`
   - `creative-seller-financing` → `creative-finance-savvy-prospect.txt`

## 🎯 Where It All Comes Together

**File**: `server/analysis/engine.js` - `analyzeConversation()` function

```javascript
// Line 29: Load TXT file
const prospectContext = loadProspectFile(prospectType);

// Line 32: AI analysis with CSV + TXT
const aiAnalysis = await analyzeWithAI(transcript, prospectType, prospectContext);

// Line 35: CSV-based pillar analysis
const pillarScores = await analyzePillars(lowerTranscript, prospectType);

// Line 38: CSV-based truth index
const truthIndex = calculateTruthIndex(pillarScores, lowerTranscript);

// Line 41: CSV-based lubometer
const lubometer = calculateLubometer(pillarScores);

// Line 44-47: CSV-based hot buttons & objections (enhanced with AI)
const hotButtons = extractHotButtons(lowerTranscript, prospectType, aiAnalysis);
const objections = detectObjections(lowerTranscript, prospectType, aiAnalysis);

// Line 55-76: Return combined results to frontend
return {
  prospectType,
  lubometer,      // ← CSV calculated
  truthIndex,     // ← CSV calculated
  pillars,        // ← CSV calculated
  hotButtons,     // ← CSV + AI enhanced
  objections,     // ← CSV + AI enhanced
  aiInsights: aiAnalysis  // ← GPT-4o-mini with CSV + TXT context
};
```

## 🔍 Key Files Reference

| File | Purpose | Integration Type |
|------|---------|-----------------|
| `server/analysis/engine.js` | Main orchestrator | CSV + TXT + AI |
| `server/analysis/prospectFiles.js` | TXT file loader | TXT files |
| `server/analysis/pillars.js` | 7 Pillars logic | CSV logic |
| `server/analysis/lubometer.js` | Lubometer calculation | CSV formula |
| `server/analysis/truthIndex.js` | Truth Index calculation | CSV penalties |
| `server/index.js` | WebSocket handler | Frontend connection |

## 💡 How It Works

1. **User speaks** → Frontend sends transcript + prospect type
2. **Backend receives** → `analyzeConversation(transcript, prospectType)`
3. **TXT file loaded** → Prospect-specific context (e.g., foreclosure-prospect.txt)
4. **AI analyzes** → GPT-4o-mini receives:
   - CSV framework summary (7 Pillars, 27 Indicators, formulas)
   - Prospect-specific TXT file content
   - Conversation transcript
5. **CSV analysis** → Structured scoring using CSV logic:
   - Pattern matching for indicators
   - Pillar score calculation
   - Lubometer calculation
   - Truth Index with penalties
6. **Results combined** → AI insights + CSV calculations
7. **Sent to frontend** → WebSocket sends complete analysis
8. **Frontend displays** → Dashboard updates with all metrics

This dual approach (CSV logic + AI with TXT context) ensures both structured, rule-based analysis AND intelligent, context-aware insights!

