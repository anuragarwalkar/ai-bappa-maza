# AI Bappa Maza — Agent Rules

> This file is auto-loaded by AI assistants (Antigravity, Claude, etc.) as project context.
> For the full detailed memory bank, read: [.agents/MEMORY_BANK.md](.agents/MEMORY_BANK.md)

## Critical Facts (Must Know)

- **Language:** ALL user-facing text is in **Marathi (मराठी / Devanagari script)**. Never replace Marathi text with English unless explicitly asked.
- **Monorepo:** Nx monorepo with npm workspaces. Three projects: `apps/web` (React frontend), `apps/api` (Express backend), `libs/shared` (shared constants).
- **Frontend Architecture:** React (Vite + JSX) with Container/Presentational component pattern, custom hooks, and modular CSS (`apps/web/src/`).
- **AI Models:** Text generation uses `gemini-3.6-flash` (personalized blessing + caring health & wellness advice, zero clothing mentions), TTS uses `gemini-3.1-flash-tts-preview` with voice `Charon`.
- **Backend:** Express.js backend in `apps/api/src/`, serving `dist/` and `public/` assets.
- **Port:** Runs on `3000` by default. Kill conflicts with `kill -9 $(lsof -t -i:3000)`.
- **API Key:** Requires `GEMINI_API_KEY` in root `.env` file.

## Architecture in One Line

> Webcam → MediaPipe Pose (Local WASM/TFLite) → Namaskar pose detection → POST `/api/blessing` → Gemini text (Blessing + Health advice) + Gemini TTS → WAV audio playback in browser

## Do's and Don'ts

✅ Keep all UI labels, button text, and instructions in Marathi (Devanagari)  
✅ Use `pcmToWav()` to wrap PCM audio from Gemini TTS into WAV  
✅ Use `useBlessing`, `useMediaPipeHands`, `useAudioEngine`, `useSpiritualParticles` hooks for logic  
✅ Follow Container (`AppContainer.jsx`) and Presentational component conventions (`apps/web/src/components/`)  
✅ Focus AI visual context on devotee's expression, energy, posture, and caring health/wellness advice (never mention clothes)  
✅ Generate blessings strictly on-demand (personalized with devotee photo when camera active)  
✅ Use `@ai-bappa/shared` for WebSocket message types and shared constants across frontend/backend  

❌ Don't comment on clothes, clothing colors, or outfits in the AI prompt  
❌ Don't bypass the 10s cooldown (`CONFIG.COOLDOWN_DURATION_MS`) without user request  
❌ Don't change Gemini model names without verifying they exist  

## Key Constants to Know

| Constant | Value | Location |
|---|---|---|
| Hold time to trigger | 250ms (0.25s) | `CONFIG.HOLD_TARGET_TIME_MS` in `apps/web/src/constants/config.js` |
| Cooldown between blessings | 10,000ms | `CONFIG.COOLDOWN_DURATION_MS` in `apps/web/src/constants/config.js` |
| MediaPipe min confidence | 0.25 | `CONFIG.HANDS_MIN_DETECTION_CONFIDENCE` in `apps/web/src/constants/config.js` |
| TTS WAV sample rate | 24,000 Hz | `pcmToWav()` in `apps/api/src/utils/audio.js` |
| JSON body size limit | 10MB | `express.json({ limit: '10mb' })` in `apps/api/src/app.js` |
| Gemini text temperature | 1.2 | `generateBlessing()` in `apps/api/src/services/gemini.js` |
| AI Voice | `Charon` | `generateMarathiAudio()` in `apps/api/src/services/gemini.js` |

## Nx Commands

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend in parallel |
| `npm run dev:frontend` | Start only Vite dev server |
| `npm run dev:backend` | Start only Express backend with nodemon |
| `npm run build` | Build frontend for production |
| `npx nx graph` | Visualize project dependency graph |
