# Zero-Stress Sales CoPilot

Real-time conversation analysis application with AI-powered insights for sales professionals.

## Project Structure

```
.
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js + Express backend server
└── README.md          # This file
```

## Quick Start

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Add your API keys
npm start
```

The backend will run on `http://localhost:3001`

## Deployment

### Railway Deployment

**Frontend Service:**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Start Command: `npx serve -s dist -l $PORT`
- Environment Variables:
  - `VITE_WS_URL=wss://your-backend.railway.app/ws`
  - `VITE_SUPABASE_URL` (optional)
  - `VITE_SUPABASE_ANON_KEY` (optional)

**Backend Service:**
- Root Directory: `backend`
- Start Command: `npm start`
- Environment Variables:
  - `OPENAI_API_KEY` (required)
  - `PORT` (auto-set by Railway)

## Features

- Real-time conversation analysis
- AI-powered hot button detection
- Lubometer scoring
- Truth Index calculation
- Objection detection and rebuttal suggestions
- Diagnostic questions tracking

## Documentation

See individual README files:
- `frontend/README.md` - Frontend documentation
- `backend/README.md` - Backend documentation

## License

Private - All rights reserved
