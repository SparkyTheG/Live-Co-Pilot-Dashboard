# Quick Test Guide

## Test the Analysis Directly (Without Frontend)

To verify the analysis engine works, test it directly:

```bash
curl -X POST http://localhost:3001/api/test-analysis \
  -H "Content-Type: application/json" \
  -d '{"transcript": "I am 3 months behind on my mortgage payments. The auction is in 2 weeks and I am terrified of losing my home.", "prospectType": "foreclosure"}'
```

Expected response:
```json
{
  "success": true,
  "analysis": {
    "hotButtonsCount": 3,
    "objectionsCount": 0,
    "lubometerScore": 42,
    "truthIndexScore": 56,
    "hotButtons": [...],
    "objections": [...]
  }
}
```

If this works but the WebSocket doesn't, the issue is in the WebSocket/real-time flow.

## Check Logs

**Backend Terminal** should show logs when you test:
- Connection established
- Transcript received
- Analysis running
- Results being sent

**Browser Console (F12)** should show:
- WebSocket connected
- Transcripts being sent
- Analysis updates received

If you don't see these logs, that tells us where the problem is.

