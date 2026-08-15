# 🐘 AI Bappa Maza — Project Memory Bank

> Auto-generated memory bank for AI assistants. Last updated: 2026-08-15.
> This is the single source of truth for understanding this project quickly.

---

## 📋 Project Overview

**Name:** AI Bappa Maza (`ai-bappa-maza`)  
**Type:** Node.js + Vanilla HTML/CSS/JS web application  
**Purpose:** A real-time webcam gesture recognition app that detects Namaskar (🙏) hand gestures and triggers Lord Ganesha (Bappa) AI-generated blessings in Marathi, read aloud via Gemini TTS.  
**Language:** Marathi (मराठी) / Devanagari script — ALL user-facing text is in Marathi.  
**Run Command:** `npm run dev` (uses `nodemon`) or `npm start` (plain node)  
**Default Port:** `3000`  
**Locale:** `lang="mr"` (Marathi)

---

## 🗂️ File Structure

```
ai-bappa-maza/
├── index.js                  # Express server — API + static file serving
├── package.json              # CommonJS, dependencies
├── .env                      # GEMINI_API_KEY (required)
├── public/
│   ├── index.html            # ENTIRE frontend (HTML + CSS + JS — monolithic file, 1759 lines)
│   └── background_music.mp3  # Devotional ambient music (~1.8 MB, plays during blessing)
└── node_modules/
```

> ⚠️ **Critical:** All frontend code (HTML structure, CSS styles, and JavaScript logic) is in a **single `public/index.html` file**. There are no separate CSS or JS files.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key (from `.env` file) |
| `PORT` | Optional | Server port, defaults to `3000` |

**`.env` file format:**
```env
GEMINI_API_KEY=your_api_key_here
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@google/genai` | `^2.17.1` | Gemini AI SDK (text generation + TTS) |
| `express` | `^5.2.1` | HTTP server |
| `cors` | `^2.8.6` | CORS headers |
| `dotenv` | `^17.4.2` | Load `.env` file |
| `nodemon` | `^3.1.10` | Dev auto-restart |

---

## 🖥️ Backend — `index.js`

### Architecture
- Pure Express.js, CommonJS (`require`), single file
- Serves frontend from `public/` as static files
- One POST API endpoint for blessings
- One GET health check endpoint
- Starts pre-fetching a blessing on server boot (zero-latency first request)

### API Endpoints

#### `POST /api/blessing`
**Purpose:** Generate a Marathi blessing + TTS audio from Bappa

**Request body (JSON):**
```json
{
  "image": "data:image/jpeg;base64,...",  // optional — devotee webcam snapshot
  "timestamp": "2026-08-15T12:00:00.000Z"
}
```

**Response (JSON):**
```json
{
  "success": true,
  "blessing": "मराठी आशीर्वाद मजकूर...",
  "audio": "data:audio/wav;base64,...",   // base64 WAV (24kHz, 16-bit mono)
  "timestamp": "2026-08-15T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "...",
  "blessing": "fallback Marathi text",  // hardcoded fallback
  "audio": null
}
```

#### `GET /api/health`
Returns `{ status: 'ok', service: 'ai-bappa-maza', time: "..." }`

### AI Models Used

| Model | Usage | Notes |
|---|---|---|
| `gemini-3.6-flash` | Text generation (blessing) | `temperature: 1.2` for creative variety |
| `gemini-3.1-flash-tts-preview` | Audio TTS synthesis | Voice: `Charon` (deep, authoritative male) |

### Blessing Flow (with image)
1. Strip base64 prefix from image
2. Send image + Marathi prompt to `gemini-3.6-flash`
3. Prompt asks Bappa to observe the devotee and give a personalized blessing
4. Send blessing text to `gemini-3.1-flash-tts-preview`
5. Get raw PCM audio back
6. Wrap PCM in WAV header (24kHz, 16-bit mono) using `pcmToWav()`
7. Return base64 WAV + blessing text

### Pre-fetch Cache System
```
Server starts → prefetchBlessing() → generates 1 blessing in background
First request → serve cached result instantly → trigger next prefetch
Subsequent requests → same pattern
Photo requests → always generate fresh (no cache used)
```

**Cache variables:**
- `cachedBlessing`: `null` or `{ blessing, audio, timestamp }`
- `isCaching`: Boolean lock to prevent parallel fetches

### Blessing Themes (15 total)
Randomly selected per blessing. Themes include:
- Career (करिअर), Health (आरोग्य), Education (शिक्षण), Family (कुटुंब)
- Finance (संपत्ती), Courage (धैर्य), Love (प्रेम), Creativity (कला)
- Spirituality (अध्यात्म), New Beginnings (नवीन सुरुवात), Gratitude (कृतज्ञता)
- Leadership (आत्मविश्वास), Travel (प्रवास), Technology (तंत्रज्ञान), Patience (संयम)

### PCM → WAV Conversion
```js
function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16)
// Writes standard 44-byte WAV RIFF header and concatenates PCM data
```

### Error Handling
- EADDRINUSE → friendly message with kill command hint
- API errors → fallback hardcoded Marathi blessing text returned (no crash)
- No API key → warns but uses `'dummy-key'` (calls will fail at API level)
- Graceful SIGINT shutdown

---

## 🖼️ Frontend — `public/index.html`

### Tech Stack
- Pure Vanilla HTML5, CSS3, JavaScript (ES2020+)
- No frameworks, no build step
- MediaPipe Hands loaded from CDN
- Google Fonts loaded from CDN

### External CDN Dependencies
```html
<!-- MediaPipe -->
https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js
https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js
https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js

<!-- Google Fonts -->
Tiro Devanagari Marathi  → Marathi text rendering
Rozha One                → Decorative headings  
Cinzel Decorative        → Fallback heading font
Poppins                  → UI sans-serif font
```

### CSS Design System (CSS Variables)
```css
--bg-dark: #0f0709             /* Near-black deep crimson background */
--bg-card: rgba(28, 12, 18, 0.75)
--gold-primary: #FFD700        /* Main accent — gold */
--gold-glow: #FFA500           /* Gold with warmth */
--saffron: #FF6600             /* Spiritual saffron orange */
--saffron-light: #FF8833
--crimson: #800020
--text-light: #FFF8E7          /* Off-white for body text */
--text-muted: #E2C9B6          /* Muted warm cream */
--accent-green: #00E676        /* Status/live indicators */
--font-marathi: 'Tiro Devanagari Marathi', serif
--font-heading: 'Rozha One', 'Cinzel Decorative', serif
--font-sans: 'Poppins', sans-serif
```

### Layout
```
Header (ॐ logo + title + badge)
│
App Grid (2-column on desktop, 1-column on mobile <960px)
├── Left Column: glass-card
│   ├── camera-wrapper (webcam canvas + HUD overlays)
│   │   ├── output-canvas (640×480, mirrored)
│   │   ├── camera-hud (live indicator + hand count)
│   │   └── gesture-indicator-overlay (hold meter SVG circle)
│   └── controls-row
│       ├── btn-trigger-manual (Manual Blessing)
│       ├── btn-toggle-sound (mute/unmute)
│       ├── btn-toggle-cam (restart camera)
│       └── btn-audio-replay (replay last audio)
│       └── cooldown-banner (10s cooldown timer)
└── Right Column: blessing-column
    ├── bappa-hero (🐘 elephant icon + shloka + rotating aura)
    ├── blessing-card
    │   ├── blessing-header (tag + status)
    │   ├── processing-hud (spinner shown during API call)
    │   ├── blessing-text-box (Marathi blessing text)
    │   └── audio-section (voice label + waveform bars)
    └── diagnostics-panel (distance, vertical align, confidence, state)

Instruction Steps (3 cards: Step 1, 2, 3)
```

### Key DOM Element IDs
| ID | Purpose |
|---|---|
| `webcam-video` | Hidden video element for MediaPipe |
| `output-canvas` | Canvas where video + landmarks are rendered |
| `particles-canvas` | Background spiritual particle animation |
| `hold-progress-circle` | SVG circle for gesture hold meter |
| `gesture-overlay` | Gesture indicator container |
| `gesture-instruction` | Text instruction below hold meter |
| `hands-count` | "0/2" hand counter |
| `blessing-container` | Blessing card (gets `.is-processing`, `.active-glow` classes) |
| `blessing-text-box` | Marathi blessing text display |
| `blessing-status` | Small status label |
| `processing-hud` | Spinner shown during API call |
| `processing-msg-text` | Rotating devotional message during processing |
| `blessing-audio` | `<audio>` element for WAV playback |
| `waveform-visualizer` | 7 animated wave bars |
| `bappa-hero` | Elephant icon card (gets `.processing` class) |
| `btn-trigger-manual` | Manual blessing button |
| `btn-toggle-sound` | Mute toggle button |
| `btn-toggle-cam` | Camera restart button |
| `btn-audio-replay` | Replay last audio button |
| `cooldown-banner` | 10s cooldown countdown |
| `fps-counter` | Live FPS display |
| `diag-distance` | Hand distance metric |
| `diag-vertical` | Vertical alignment metric |
| `diag-confidence` | Confidence percentage |
| `diag-state` | Current state label |

### JavaScript Architecture (7 Sections)

#### Section 1 — STATE & CONSTANTS
```js
const STATE = {
  isDetecting: true,
  lastBlessingTime: 0,
  cooldownDurationMs: 10000,  // 10s between blessings
  holdProgress: 0,            // 0.0 to 1.0
  holdTargetTimeMs: 750,      // 0.75s hold to trigger
  lastFrameTime: performance.now(),
  fps: 0,
  isFetchingBlessing: false,
  isPlayingAudio: false,
  lastBlessingData: null,
  cooldownInterval: null
};
```

#### Section 2 — Background Particle Canvas
- Gold/saffron floating spark particles (`particles-canvas`)
- Flower petals: marigold (saffron/gold) and hibiscus (crimson/pink)
- `spawnFlowerPetalsRain(count)` — called on blessing trigger
- Particles loop with `requestAnimationFrame`

#### Section 3 — Audio Engine
- **Temple Bell:** Synthesized using Web Audio API (`AudioContext`), 6 harmonic oscillators (210–2520 Hz), exponential decay
- **Background Music:** `bgMusic = new Audio('/background_music.mp3')`, loops, fades in/out smoothly
- `isSoundMuted` global toggle
- `startDevotionalAmbience()` → fade in music
- `stopDevotionalAmbience(fadeDuration)` → smooth fade out

#### Section 4 — Gesture Detection Algorithm
**`evaluateNamaskarGesture(multiHandLandmarks)`** returns:
```js
{ isNamaskar: bool, confidence: 0.0-1.0, distance: float, verticalOk: bool, mode: string }
```

**Two-hand mode:**
- Calculates normalized distances between fingertips (index, middle, ring, pinky) and palm/wrist centers of both hands
- Weighted score: fingertips 45%, palms 35%, wrists 20%
- Triggers at `totalDist < 1.25` with vertical alignment check

**One-hand mode (Pranam):**
- Checks if fingertips are above wrist (`isHandUprightAndOpen`)
- Returns `confidence: 0.88` if fully upright
- Returns `confidence: 0.65` if just pointing up

**MediaPipe landmark indices used:**
- `0`: Wrist
- `5`: Index MCP, `8`: Index Tip
- `9`: Middle MCP, `12`: Middle Tip
- `13`: Ring MCP, `16`: Ring Tip
- `17`: Pinky MCP, `20`: Pinky Tip

#### Section 5 — MediaPipe Setup
```js
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.35,  // Low for speed
  minTrackingConfidence: 0.35
});
```
- Camera: `640×480`, processed every frame
- Canvas rendered mirrored (`transform: scaleX(-1)`)
- Green connectors + gold landmarks when Namaskar detected
- Golden energy ray drawn between both middle fingertips when 2 hands

#### Section 6 — Gesture Progression & Hold Timer
- `STATE.holdProgress` increments per frame based on delta time
- Decays at 400ms rate when gesture breaks
- At `holdProgress >= 1.0` → calls `triggerDivineBlessing()`
- Cooldown check: 10s between triggers
- Updates circular SVG hold meter via `strokeDashoffset`

#### Section 7 — API Trigger & Blessing Flow
```
triggerDivineBlessing()
├── Play temple bell (Web Audio API)
├── Start devotional music (MP3 fade-in)
├── Add 'processing' class to bappa-hero (aura animation)
├── Add 'is-processing' to blessing-card (shows spinner)
├── Spawn flower petals rain (40 petals)
├── Capture webcam snapshot (JPEG, max 640px, 0.85 quality)
├── POST /api/blessing { image: base64 }
│   ├── On success: display blessing text
│   │   ├── Play WAV audio (base64)
│   │   └── Animate waveform bars
│   └── On error: show fallback Marathi text
└── Start 10s cooldown countdown
```

**Audio Fallback:** If browser blocks autoplay or audio fails → `fallbackSpeechSynthesis()` using Web Speech API with `lang: 'mr-IN'`

### CSS Animations Inventory
| Animation | Applied To | Effect |
|---|---|---|
| `pulseGlow` | OM symbol, processing | Scale + glow pulse |
| `rotateAura` / `divineRotate` | Bappa aura div | Continuous rotation |
| `floatBappa` / `divineFloat` | 🐘 icon | Gentle float up/down |
| `blink` | Live indicator dot | Opacity blink |
| `wavePulse` | Audio wave bars | Height 6px→26px |
| `divineFlash` | blessing-card | Gold box-shadow flash |
| `spinRing` | Spinner rings | 360° rotation |

---

## 🎨 Design Language & Theme

| Element | Value |
|---|---|
| Theme | Hindu devotional / Ganesh Chaturthi |
| Primary palette | Deep crimson background + gold accents + saffron orange |
| Typography | Devanagari (Tiro) for Marathi, Rozha One for headings, Poppins for UI |
| Visual motif | Temple aesthetics — particles, flowers, bells, aura glow |
| UI style | Glassmorphism cards with gold borders |
| Language | Marathi — ALL UI text, button labels, instructions |
| Responsive | Grid collapses to 1-column on < 960px |

---

## ⚠️ Known Issues & Gotchas

1. **Port conflict**: If `npm run dev` crashes with EADDRINUSE, run:
   ```bash
   kill -9 $(lsof -t -i:3000)
   ```

2. **Autoplay policy**: Browsers block audio autoplay without user interaction. The manual blessing button (`btn-trigger-manual`) satisfies the user gesture requirement. Gesture-detected trigger may fail on first load — the replay button is the fallback.

3. **Background music requires user interaction**: `bgMusic.play()` may throw an autoplay error. The app handles this gracefully with a catch and a console warning. Music starts correctly after user clicks any button first.

4. **Photo blessing is always fresh** (never cached): `cachedBlessing` is only used for no-photo requests.

5. **MediaPipe loads from CDN**: The app requires internet access for MediaPipe WASM files. Offline use is not supported.

6. **Large single HTML file**: All frontend code is in `public/index.html` (1759 lines). When editing, use line numbers carefully to locate sections.

7. **Gemini model names**: Use exact model strings:
   - Text: `gemini-3.6-flash`
   - TTS: `gemini-3.1-flash-tts-preview`

---

## 🔄 Data Flow Diagram

```
User performs Namaskar gesture
         │
         ▼
MediaPipe Hands (CDN WASM) detects landmarks
         │
         ▼
evaluateNamaskarGesture() → confidence score
         │
         ▼
Hold meter fills for 0.75 seconds
         │
         ▼
triggerDivineBlessing()
    │
    ├─ captureDevoteeSnapshot() → JPEG base64 from video element
    │
    ├─ POST /api/blessing { image }
    │       │
    │       ├─ generateBlessing(image) → Gemini 3.6 Flash
    │       │   (personalized Marathi text with visual context)
    │       │
    │       ├─ generateMarathiAudio() → Gemini TTS 3.1
    │       │   (PCM audio → WAV header → base64)
    │       │
    │       └─ Response: { blessing, audio, timestamp }
    │
    ├─ Display blessing text in Devanagari
    ├─ Play WAV audio via <audio> element
    └─ 10s cooldown starts
```

---

## 🧪 Testing Checklist

- [ ] `GEMINI_API_KEY` set in `.env`
- [ ] `npm run dev` starts without errors on port 3000
- [ ] Browser opens `http://localhost:3000`
- [ ] Camera permission granted → green live dot appears
- [ ] Hands badge shows count (e.g., "2/2")
- [ ] Hold meter fills when Namaskar gesture detected
- [ ] Blessing triggers after 0.75s hold
- [ ] Marathi text appears in blessing-text-box
- [ ] WAV audio plays automatically
- [ ] Waveform bars animate during audio playback
- [ ] Flower petals rain animation triggers
- [ ] 10s cooldown banner appears and counts down
- [ ] Manual blessing button works
- [ ] Mute button works
- [ ] Audio replay button works
- [ ] FPS counter shows reasonable values (20–30 FPS)

---

## 💡 Quick Reference for Common Changes

### Changing cooldown duration
```js
// public/index.html, Section 1 — STATE
cooldownDurationMs: 10000,  // Change this (milliseconds)
```

### Changing hold duration
```js
holdTargetTimeMs: 750,  // Change this (milliseconds, 750 = 0.75s)
```

### Adding a new blessing theme
```js
// index.js, BLESSING_THEMES array (~line 48)
const BLESSING_THEMES = [
  // Add new theme here:
  'your new theme in English (मराठी keyword)',
];
```

### Changing the TTS voice
```js
// index.js, generateMarathiAudio() function
voiceName: 'Charon'  // Change to another Gemini TTS voice
```

### Changing gesture sensitivity
```js
// public/index.html, MediaPipe setup (~line 1373)
minDetectionConfidence: 0.35,  // Lower = more sensitive
minTrackingConfidence: 0.35
```

### Making gesture harder/easier to trigger
```js
// evaluateNamaskarGesture() function
if (totalDist < 0.85)  // Change threshold — lower = hands must be closer
```
