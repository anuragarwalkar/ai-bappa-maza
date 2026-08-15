# 🐘 AI Bappa Maza — Project Memory Bank

> Auto-generated memory bank for AI assistants. Last updated: 2026-08-15.
> This is the single source of truth for understanding this project quickly.

---

## 📋 Project Overview

**Name:** AI Bappa Maza (`ai-bappa-maza`)  
**Type:** Node.js + React 19 (Vite) + Express.js fullstack web application  
**Purpose:** A real-time webcam gesture recognition app that detects Namaskar (🙏) hand gestures and triggers Lord Ganesha (Bappa) AI-generated blessings in Marathi with caring health & wellness advice, read aloud via Gemini TTS.  
**Language:** Marathi (मराठी) / Devanagari script — ALL user-facing text is in Marathi.  
**Run Command:** `npm run dev` (concurrently runs Express backend + Vite dev / build) or `npm start`  
**Default Port:** `3000` (Backend + built React frontend) / `5173` (Vite dev)  
**Locale:** `lang="mr"` (Marathi)

---

## 🗂️ File Structure

```
ai-bappa-maza/
├── index.js                  # Express server — API + static file serving (dist/ and public/)
├── package.json              # Dependencies: react, react-dom, express, @google/genai, vite, concurrently
├── vite.config.mjs           # Vite configuration with React plugin and /api proxy
├── index.html                # Vite root HTML template (Google Fonts & MediaPipe CDN scripts)
├── .env                      # GEMINI_API_KEY (required)
├── src/
│   ├── main.jsx              # React entrypoint
│   ├── App.jsx               # Root App component
│   ├── containers/
│   │   └── AppContainer.jsx  # Main container orchestrating state, hooks & UI
│   ├── components/
│   │   ├── Header.jsx        # Header with Om & Marathi title
│   │   ├── CameraCard.jsx    # Camera video, canvas, HUD & circular hold meter
│   │   ├── ControlsRow.jsx   # Manual blessing, Mute, Camera toggle, Replay, Cooldown banner
│   │   ├── BappaHero.jsx     # Elephant icon, aura animation & shloka
│   │   ├── BlessingCard.jsx  # Blessing status, spinner with devotional text, blessing text, 7-bar waveform
│   │   ├── DiagnosticsPanel.jsx # Real-time FPS, posture, vertical align, confidence %, status
│   │   ├── InstructionSteps.jsx # 3 instruction step cards in Marathi
│   │   └── ParticlesBackground.jsx # Fixed canvas for particles & flower petals rain
│   ├── hooks/
│   │   ├── useMediaPipeHands.js    # Camera stream, MediaPipe Hands detection, landmark rendering
│   │   ├── useAudioEngine.js       # Temple bell (Web Audio API), foreground music playlist loop, ambient chime
│   │   ├── useBlessing.js          # Devotee snapshot, API request, TTS voice playback, waveform & cooldown
│   │   └── useSpiritualParticles.js# Particle physics, marigold & hibiscus flower petals rain loop
│   ├── services/
│   │   └── api.js                  # API calls: postBlessing, fetchForegroundMusicList, fetchHealth
│   ├── utils/
│   │   ├── gesture.js              # distance3D, isHandUprightAndOpen, evaluateNamaskarGesture
│   │   ├── sound.js                # Web Audio API harmonic oscillator synthesis
│   │   └── particles.js            # Particle physics and canvas rendering
│   ├── constants/
│   │   ├── config.js               # Timing constants, hold threshold (250ms), cooldown duration (10s)
│   │   └── marathiStrings.js       # Centralized Marathi text constants in Devanagari
│   └── styles/
│       ├── variables.css           # Design tokens (gold, saffron, crimson)
│       ├── global.css              # Global resets, glassmorphism cards, layout
│       └── animations.css          # Keyframes: aura rotation, float, pulse glow, waveform bars
├── public/
│   ├── background_music.mp3  # Devotional ambient chime (~1.8 MB)
│   └── forground_music/      # Devotional music playlist tracks
└── dist/                     # Optimized production bundle built by Vite
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key (from `.env` file) |
| `PORT` | Optional | Server port, defaults to `3000` |

---

## 🖥️ Backend — `index.js`

### Architecture
- Express.js backend serving `/api` routes and static bundle from `dist/` (fallback to `public/`)
- AI Prompt (`gemini-3.6-flash`):
  - Observes devotee's facial expression, energy, smile, and posture (strictly no comments on clothes or colors).
  - Delivers a warm personalized Marathi blessing.
  - Gives practical, caring **health & wellness advice** (eye care, posture, water intake, breathing/pranayama, balanced sleep).
- AI Audio (`gemini-3.1-flash-tts-preview`): Synthesizes divine Marathi voice `Charon` and converts raw PCM to 24kHz 16-bit mono WAV.
