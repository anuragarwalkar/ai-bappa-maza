# 🐘 AI Bappa Maza — Project Memory Bank

> Auto-generated memory bank for AI assistants. Last updated: 2026-08-31.
> This is the single source of truth for understanding this project quickly.

---

## 📋 Project Overview

**Name:** AI Bappa Maza (`ai-bappa-maza`)  
**Type:** Nx Monorepo — React 19 (Vite) frontend + Express.js backend + shared library  
**Purpose:** A real-time webcam gesture recognition app that detects Namaskar (🙏) hand gestures and triggers Lord Ganesha (Bappa) AI-generated blessings in Marathi with caring health & wellness advice, read aloud via Gemini TTS.  
**Language:** Marathi (मराठी) / Devanagari script — ALL user-facing text is in Marathi.  
**Run Command:** `npm run dev` (Nx runs both frontend + backend in parallel) or `npm start`  
**Default Port:** `3000` (Backend + built React frontend) / `5173` (Vite dev)  
**Locale:** `lang="mr"` (Marathi)  
**Monorepo Tool:** Nx with npm workspaces

---

## 🗂️ File Structure (Nx Monorepo)

```
ai-bappa-maza/
├── nx.json                          # Nx workspace configuration
├── tsconfig.base.json               # Root TypeScript paths (@ai-bappa/shared alias)
├── package.json                     # Root workspaces config + Nx scripts
├── nodemon.json                     # Watches apps/api/src/ and libs/shared/src/
├── .env                             # GEMINI_API_KEY (required)
├── AGENTS.md                        # Agent rules (this is auto-loaded)
│
├── apps/
│   ├── web/                         # React + Vite frontend
│   │   ├── index.html               # Vite root HTML (Google Fonts & MediaPipe CDN)
│   │   ├── vite.config.mjs          # Vite config with proxy + @ai-bappa/shared alias
│   │   ├── project.json             # Nx project: dev, build, preview targets
│   │   ├── package.json             # react, react-dom, vite, @vitejs/plugin-react
│   │   └── src/
│   │       ├── main.jsx             # React entrypoint
│   │       ├── App.jsx              # Root App — routes / vs /control
│   │       ├── containers/
│   │       │   ├── AppContainer.jsx # Main PC container (gesture + blessing)
│   │       │   └── ControlContainer.jsx # Mobile remote control container
│   │       ├── components/          # Presentational components (Header, CameraCard, etc.)
│   │       ├── hooks/               # useBlessing, useMediaPipeHands, useAudioEngine, etc.
│   │       ├── services/            # api.js (fetch wrappers)
│   │       ├── utils/               # gesture.js, particles.js, sound.js
│   │       ├── constants/           # config.js, marathiStrings.js
│   │       └── styles/              # variables.css, global.css, animations.css, control.css
│   │
│   └── api/                         # Express.js backend
│       ├── project.json             # Nx project: serve, dev, start targets
│       ├── package.json             # express, @google/genai, ws, cors, dotenv
│       └── src/
│           ├── index.js             # Server entry — HTTP + WS + graceful shutdown
│           ├── app.js               # Express app factory (cors, json, routes, static)
│           ├── config/index.js      # PORT, apiKey, rootDir
│           ├── constants/themes.js  # BLESSING_THEMES array
│           ├── middleware/static.js  # Serves dist/ and public/
│           ├── routes/              # blessing.js, control.js, health.js, music.js
│           ├── services/            # gemini.js, websocket.js, restart.js
│           └── utils/               # audio.js (pcmToWav), port.js (killProcessOnPort)
│
├── libs/
│   └── shared/                      # Shared constants library (@ai-bappa/shared)
│       ├── project.json             # Nx library project
│       ├── package.json             # CommonJS for Express compat, aliased in Vite
│       └── src/
│           ├── index.js             # Barrel export
│           ├── ws-message-types.js  # WS_MESSAGE_TYPES, WS_ROLES
│           └── constants.js         # APP_CONSTANTS (port, body limit, ws path)
│
├── public/                          # Static assets served by Express
│   ├── background_music.mp3
│   ├── forground_music/
│   ├── images/
│   └── index.html                   # Fallback production HTML (standalone)
│
└── dist/                            # Vite build output (served by Express in production)
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key (from root `.env` file) |
| `PORT` | Optional | Server port, defaults to `3000` |

---

## 🖥️ Backend — `apps/api/src/`

### Architecture
- Express.js backend serving `/api` routes and static bundle from `dist/` (fallback to `public/`)
- AI Prompt (`gemini-3.6-flash`):
  - Observes devotee's facial expression, energy, smile, and posture (strictly no comments on clothes or colors).
  - Delivers a warm personalized Marathi blessing with divine parental affection (वात्सल्य: "बाळा", "लेकरा", "वत्सा") — strictly no peer/street slang like "अरे दोस्ता" or "वाघा".
  - Predicts a **bright future** & positive astrological outlook (उज्ज्वल भविष्य, सुवर्णकाळ, भाग्योदय व शुभ संकेत).
  - Gives practical, caring **health & wellness advice** (eye care, posture, water intake, breathing/pranayama, balanced sleep).
- AI Audio (`gemini-3.1-flash-tts-preview`): Synthesizes divine Marathi voice `Charon` and converts raw PCM to 24kHz 16-bit mono WAV.
- WebSocket relay server at `/ws` for PC ↔ Mobile Controller real-time communication.

---

## ⚡ Nx Commands

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend in parallel |
| `npm run dev:frontend` | Start only Vite dev server |
| `npm run dev:backend` | Start only Express backend with nodemon |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production backend (serves dist/) |
| `npx nx graph` | Visualize project dependency graph |
| `npx nx show projects` | List all Nx projects |

---

## 📦 Shared Library — `@ai-bappa/shared`

Shared constants used by both frontend (ESM) and backend (CommonJS):
- `WS_MESSAGE_TYPES` — WebSocket message type strings (REGISTER, STATE_UPDATE, COMMAND, etc.)
- `WS_ROLES` — Client role identifiers (PC, CONTROLLER)
- `APP_CONSTANTS` — App-level config (DEFAULT_PORT, JSON_BODY_LIMIT, WS_PATH)

**Import patterns:**
- Backend: `const { WS_MESSAGE_TYPES } = require('@ai-bappa/shared');`
- Frontend: `import { WS_MESSAGE_TYPES } from '@ai-bappa/shared';`
