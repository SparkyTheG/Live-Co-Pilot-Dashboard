# Debugging Guide: Real-time Analysis Flow

## 🔍 How to Debug

### 1. Check Backend Logs

The backend now has extensive logging. When you speak, you should see:

```
[WS] Received transcript message from conn_xxx: "your text..."
[Realtime] Received transcript chunk: "your text" (total history: X chars)
[conn_xxx] Analyzing transcript (X chars), prospectType: foreclosure
[AI] Calling GPT-4o-mini with transcript length: X
[AI] GPT-4o-mini response received (X chars)
[AI] Parsed JSON successfully, keys: ...
[conn_xxx] Analysis complete: { hotButtons: X, objections: X, ... }
[WS] Sending to conn_xxx: analysis_update { hotButtons: X, objections: X }
```

### 2. Check Frontend Console (Browser DevTools)

When you speak, you should see:

```
🎤 Frontend: Speech-to-text transcript: "your text"
📤 Frontend: Sending transcript to backend via WebSocket
✅ Frontend: Analysis update received: { hotButtons: X, objections: X, ... }
```

### 3. Common Issues

#### Issue: No hot buttons or objections appearing

**Check:**
1. Are backend logs showing analysis is running?
2. Are frontend logs showing analysis updates received?
3. Check the `hotButtons` and `objections` arrays in the logs - are they empty or populated?

**Possible causes:**
- Transcript not matching indicator patterns (needs keywords like "terrified", "auction", "behind")
- Pillar scores not high enough (hot buttons only show if score >= 6)
- Objection patterns not matching (needs phrases like "don't understand", "scam", "trust")

#### Issue: GPT-4o-mini not being called

**Check backend logs for:**
- `[AI] Calling GPT-4o-mini` - should appear after transcript received
- `[AI] GPT-4o-mini response received` - confirms API call succeeded
- If missing, check OpenAI API key in `server/.env`

#### Issue: WebSocket not connected

**Check frontend console for:**
- `WebSocket connected` message
- WebSocket errors
- Check backend is running on port 3001

### 4. Test Commands

**Test transcript that should trigger hot buttons:**
- "I'm 3 months behind on my mortgage payments"
- "The auction is in 2 weeks and I'm terrified"
- "I need to save my credit and protect my family"

**Test transcript that should trigger objections:**
- "I don't understand how this works"
- "How do I know you're not trying to scam me?"
- "This sounds confusing"

### 5. Data Format

**Hot Buttons Format:**
- Should be an array: `[{ id: 1, name: "...", quote: "...", score: 7, prompt: "..." }]`
- Only indicators with score >= 6 appear
- Check backend logs to see how many were detected

**Objections Format:**
- Should be an array: `[{ objectionText: "...", fear: "...", whisper: "...", probability: 0.7, rebuttalScript: "..." }]`
- Only objections matching patterns appear
- Check backend logs to see how many were detected

