# Troubleshooting Guide: Hot Buttons and Objections Not Appearing

## 🔍 Step-by-Step Debugging

### 1. Check Backend Server is Running

Make sure backend is running:
```bash
cd server
npm start
```

You should see:
```
Server running on port 3001
WebSocket server ready
```

### 2. Check Frontend is Running

Make sure frontend is running:
```bash
npm run dev
```

### 3. Check Browser Console (F12)

When you click "Start Recording", you should see:
```
✅ Frontend: WebSocket connected, starting listening...
✅ Frontend: Listening started, WebSocket ready for transcripts
```

When you speak, you should see:
```
🎤 Frontend: Speech-to-text transcript: "your words"
📤 Frontend: Sending transcript to backend via WebSocket
✅ Frontend: Analysis update received: { hotButtons: X, objections: X, ... }
```

### 4. Check Backend Console

When frontend connects, you should see:
```
New WebSocket connection: conn_xxx
[WS] Received start_listening from conn_xxx
[WS] Starting realtime listening for conn_xxx
[WS] Realtime connection created for conn_xxx, total connections: 1
```

When you speak, you should see:
```
[WS] Received transcript message from conn_xxx: "your words..."
[Realtime] Received transcript chunk: "your words" (total history: X chars)
[conn_xxx] Analyzing transcript (X chars), prospectType: foreclosure
[AI] Calling GPT-4o-mini with transcript length: X
[AI] GPT-4o-mini response received (X chars)
[conn_xxx] Analysis complete: { hotButtons: X, objections: X, lubometer: X, truthIndex: X }
[WS] Sending to conn_xxx: analysis_update { hotButtons: X, objections: X }
```

### 5. If Hot Buttons/Objections Count is 0

**Check transcript content:**
- Hot buttons require indicator scores >= 6 from pillar analysis
- Objections require matching patterns (e.g., "don't understand", "scam", "trust")

**Test with explicit phrases:**
- For hot buttons: "I'm 3 months behind on payments, auction in 2 weeks, I'm terrified"
- For objections: "I don't understand how this works" or "This sounds like a scam"

### 6. Check OpenAI API Key

Make sure `server/.env` has:
```
OPENAI_API_KEY=sk-proj-...
```

If missing, you'll see errors in backend console about API key.

### 7. Common Issues

**Issue: "WebSocket is not connected"**
- Check backend is running on port 3001
- Check browser console for connection errors
- Check network tab for WebSocket connection

**Issue: No logs appearing**
- Check if backend server is actually running
- Check if frontend is sending messages (check Network tab)
- Check browser console for JavaScript errors

**Issue: Analysis runs but returns empty arrays**
- This means transcript isn't matching patterns
- Try speaking the test phrases above
- Check backend logs to see what pillar scores are calculated

**Issue: Frontend shows "--" for Truth Index**
- This means analysis data isn't being received
- Check backend logs to see if analysis_update is being sent
- Check frontend console to see if analysis_update is received

