# AI Bappa Maza — Agent Rules

> This file is auto-loaded by AI assistants (Antigravity, Claude, etc.) as project context.
> For the full detailed memory bank, read: [.agents/MEMORY_BANK.md](.agents/MEMORY_BANK.md)

## Critical Facts (Must Know)

- **Language:** ALL user-facing text is in **Marathi (मराठी / Devanagari script)**. Never replace Marathi text with English unless explicitly asked.
- **Single HTML File:** The entire frontend (HTML + CSS + JS) lives in `public/index.html` (1759 lines). There are no separate CSS/JS files.
- **AI Models:** Text generation uses `gemini-3.6-flash`, TTS uses `gemini-3.1-flash-tts-preview` with voice `Charon`.
- **No frameworks:** Pure Express.js backend, vanilla HTML/CSS/JS frontend. No React, no Vite, no Tailwind.
- **Port:** Runs on `3000` by default. Kill conflicts with `kill -9 $(lsof -t -i:3000)`.
- **API Key:** Requires `GEMINI_API_KEY` in `.env` file.

## Architecture in One Line

> Webcam → MediaPipe Hands (CDN) → Namaskar gesture detection → POST `/api/blessing` → Gemini text + Gemini TTS → WAV audio playback in browser

## Do's and Don'ts

✅ Keep all UI labels, button text, and instructions in Marathi (Devanagari)  
✅ Use `pcmToWav()` to wrap PCM audio from Gemini TTS into WAV  
✅ Check `STATE.isFetchingBlessing` before triggering new API calls  
✅ Use `spawnFlowerPetalsRain()` for celebratory visual effects  
✅ Use `prefetchBlessing()` pattern for zero-latency non-photo blessings  

❌ Don't create separate CSS/JS files — keep everything in `public/index.html`  
❌ Don't use npm build tools or frontend frameworks  
❌ Don't bypass the 10s cooldown (`STATE.cooldownDurationMs`) without user request  
❌ Don't change Gemini model names without verifying they exist  
❌ Don't send photo to cache — photo blessings are always generated fresh  

## Key Constants to Know

| Constant | Value | Location |
|---|---|---|
| Hold time to trigger | 750ms (0.75s) | `STATE.holdTargetTimeMs` in index.html |
| Cooldown between blessings | 10,000ms | `STATE.cooldownDurationMs` in index.html |
| MediaPipe min confidence | 0.35 | `hands.setOptions()` in index.html |
| TTS WAV sample rate | 24,000 Hz | `pcmToWav()` in index.js |
| JSON body size limit | 10MB | `express.json({ limit: '10mb' })` in index.js |
| Gemini text temperature | 1.2 | `generateBlessing()` in index.js |

## File Line Number Reference

| Section | File | Lines |
|---|---|---|
| Auto-free port & imports | index.js | 1–30 |
| PCM→WAV converter | index.js | 46–66 |
| BLESSING_THEMES array | index.js | 69–85 |
| generateBlessing() — Gemini text | index.js | 89–149 |
| generateMarathiAudio() — TTS | index.js | 152–194 |
| Pre-fetch cache logic | index.js | 200–219 |
| POST /api/blessing handler | index.js | 222–267 |
| Server startup & auto-recovery | index.js | 282–326 |
| CSS design variables | index.html | 20–34 |
| STATE object | index.html | 950–962 |
| Background particle canvas | index.html | 994–1103 |
| Temple bell + background music | index.html | 1105–1228 |
| Gesture detection algorithm | index.html | 1230–1343 |
| MediaPipe hands setup | index.html | 1345–1463 |
| Gesture progression + hold meter | index.html | 1465–1515 |
| triggerDivineBlessing() | index.html | 1556–1637 |
| Audio playback + waveform | index.html | 1639–1673 |
| Button event handlers | index.html | 1699–1738 |
