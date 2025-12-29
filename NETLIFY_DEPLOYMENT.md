# Netlify Deployment Guide

## Quick Fix for Blank Screen

The app was showing a blank screen because:
1. **Hardcoded localhost URLs** - Fixed ✅
2. **Missing SPA routing configuration** - Fixed ✅
3. **No environment variable support** - Fixed ✅

## Setup Steps

### 1. Environment Variables

In your Netlify dashboard, go to **Site settings → Environment variables** and add:

```
VITE_WS_URL=wss://your-backend-domain.com/ws
```

Replace `your-backend-domain.com` with your actual backend server URL.

**Important**: 
- Use `wss://` (secure WebSocket) for production, not `ws://`
- The backend must support WebSocket connections
- Make sure CORS is configured on your backend to allow requests from your Netlify domain

### 2. Build Settings

Netlify should automatically detect:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

If not, manually set these in **Site settings → Build & deploy → Build settings**

### 3. Backend Requirements

Your backend server must:
- Support WebSocket connections (wss://)
- Have CORS configured to allow your Netlify domain
- Be accessible from the internet (not localhost)

### 4. Testing

After deployment:
1. Open browser console (F12)
2. Check for any errors
3. Verify WebSocket connection attempts
4. If WebSocket fails, the app should still load (with a warning)

## Troubleshooting

### Blank Screen Still Appearing?

1. **Check browser console** for JavaScript errors
2. **Check Netlify build logs** for build errors
3. **Verify environment variable** is set correctly in Netlify
4. **Check network tab** to see if assets are loading
5. **Verify backend URL** is correct and accessible

### WebSocket Connection Failing?

The app will still load even if WebSocket fails, but you'll see warnings in the console. To fix:
- Verify `VITE_WS_URL` is set correctly
- Check backend is running and accessible
- Verify CORS settings on backend
- Check browser console for specific WebSocket errors

## Files Changed

- ✅ `netlify.toml` - Added SPA routing configuration
- ✅ `src/lib/websocket.ts` - Added environment variable support
- ✅ `src/components/coPilot/RecordingButton.tsx` - Removed hardcoded URL
- ✅ `src/main.tsx` - Added error handling
