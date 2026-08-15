# AI Bappa Maza — Agent Rules

> This file is auto-loaded by AI assistants (Antigravity, Claude, etc.) as project context.
> For the full detailed memory bank, read: [.agents/MEMORY_BANK.md](.agents/MEMORY_BANK.md)

## Critical Facts (Must Know)

- **Language:** ALL user-facing text is in **Marathi (मराठी / Devanagari script)**. Never replace Marathi text with English unless explicitly asked.
- **Frontend Architecture:** React (Vite + JSX) with Container/Presentational component pattern, custom hooks, and modular CSS (`src/`).
- **AI Models:** Text generation uses `gemini-3.6-flash` (personalized blessing + caring health & wellness advice, zero clothing mentions), TTS uses `gemini-3.1-flash-tts-preview` with voice `Charon`.
- **Backend:** Express.js backend in `index.js`, serving `dist/` and `public/` assets.
- **Port:** Runs on `3000` by default. Kill conflicts with `kill -9 $(lsof -t -i:3000)`.
- **API Key:** Requires `GEMINI_API_KEY` in `.env` file.

## Architecture in One Line

> Webcam → MediaPipe Hands (CDN) → Namaskar gesture detection → POST `/api/blessing` → Gemini text (Blessing + Health advice) + Gemini TTS → WAV audio playback in browser

## Do's and Don'ts

✅ Keep all UI labels, button text, and instructions in Marathi (Devanagari)  
✅ Use `pcmToWav()` to wrap PCM audio from Gemini TTS into WAV  
✅ Use `useBlessing`, `useMediaPipeHands`, `useAudioEngine`, `useSpiritualParticles` hooks for logic  
✅ Follow Container (`AppContainer.jsx`) and Presentational component conventions (`src/components/`)  
✅ Focus AI visual context on devotee's expression, energy, posture, and caring health/wellness advice (never mention clothes)  
✅ Use `prefetchBlessing()` pattern for zero-latency non-photo blessings  

❌ Don't comment on clothes, clothing colors, or outfits in the AI prompt  
❌ Don't bypass the 10s cooldown (`CONFIG.COOLDOWN_DURATION_MS`) without user request  
❌ Don't change Gemini model names without verifying they exist  
❌ Don't send photo to cache — photo blessings are always generated fresh  

## Key Constants to Know

| Constant | Value | Location |
|---|---|---|
| Hold time to trigger | 250ms (0.25s) | `CONFIG.HOLD_TARGET_TIME_MS` in `src/constants/config.js` |
| Cooldown between blessings | 10,000ms | `CONFIG.COOLDOWN_DURATION_MS` in `src/constants/config.js` |
| MediaPipe min confidence | 0.25 | `CONFIG.HANDS_MIN_DETECTION_CONFIDENCE` in `src/constants/config.js` |
| TTS WAV sample rate | 24,000 Hz | `pcmToWav()` in index.js |
| JSON body size limit | 10MB | `express.json({ limit: '10mb' })` in index.js |
| Gemini text temperature | 1.2 | `generateBlessing()` in index.js |
| AI Voice | `Charon` | `generateMarathiAudio()` in index.js |
