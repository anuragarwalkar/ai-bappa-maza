require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing (with limit for image base64)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the Google GenAI client using GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in environment variables!');
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

// Wraps raw PCM bytes in a valid WAV container (16-bit, mono, 24 kHz)
function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);               // PCM chunk size
  header.writeUInt16LE(1, 20);                // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Random blessing themes for variety — Bappa picks a different topic each time
const BLESSING_THEMES = [
  'career growth and professional success (करिअर)',
  'health, fitness and mental peace (आरॉग्य)',
  'education, exams and knowledge (शिक्षण)',
  'family harmony and relationships (कुटुंब)',
  'financial wisdom and prosperity (संपत्ती)',
  'courage to overcome obstacles (धैर्य)',
  'love, friendship and emotional well-being (प्रेम)',
  'creativity, art and self-expression (कला)',
  'spiritual growth and inner peace (अध्यात्म)',
  'new beginnings and fresh starts (नवीन सुरुवात)',
  'gratitude and contentment (कृतज्ञता)',
  'leadership, confidence and self-belief (आत्मविश्वास)',
  'travel, adventure and new experiences (प्रवास)',
  'technology, innovation and modern skills (तंत्रज्ञान)',
  'patience, discipline and time management (संयम)',
];

// Generates a unique Marathi blessing + practical life tip from Lord Ganesha
// Can optionally accept devotee's webcam snapshot for rich visual context
async function generateBlessing(imageBase64 = null) {
  const theme = BLESSING_THEMES[Math.floor(Math.random() * BLESSING_THEMES.length)];
  
  let prompt;
  const contentParts = [];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    contentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64
      }
    });

    prompt = `You are Lord Ganesha (Bappa), the loving and wise deity, looking directly at your devotee who is offering Namaskar / Pranam in the attached camera photo.

Today's theme: ${theme}

Look closely at the person in the photo:
1. Notice their facial expression, smile, eyes, clothes, glasses, posture, age, or background vibe.
2. In your blessing, warmly and kindly acknowledge their appearance or presence (e.g. "तुझ्या चेहऱ्यावरील हा सात्त्विक/उत्साही भाव...", "तुझे हे प्रसन्न रूप...", "तुझ्या डोळ्यांतील चमक...").
3. Give a heartfelt आशीर्वाद (blessing) related to ${theme}.
4. Give ONE practical, actionable real-life tip or advice tailored for them.

Rules:
- Write ONLY in Marathi (Devanagari script)
- 2-3 sentences max (crisp for voice audio)
- Sound like a wise, loving grandfather / father (बाप्पा)
- Keep it natural, personal and divine
- NO English words, NO translations, NO commentary`;
  } else {
    prompt = `You are Lord Ganesha (Bappa), the remover of obstacles and god of wisdom.
A devotee is offering sincere Namaskar to you. 

Today's theme: ${theme}

Give a UNIQUE blessing in Marathi (2-3 sentences max) that includes:
1. A warm, heartfelt आशीर्वाद (blessing) related to this theme
2. One practical, actionable real-life tip or advice that Bappa would lovingly give

Rules:
- Write ONLY in Marathi (Devanagari script)
- Sound like a wise, loving grandfather giving advice
- Make each blessing completely different and fresh
- Include specific, practical advice (not just generic blessings)
- NO English, NO translations, NO commentary
- Do NOT repeat common phrases like "तुझ्या आयुष्यात सुख-समृद्धी"`;
  }

  contentParts.push(prompt);

  const result = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: contentParts,
    config: {
      temperature: 1.2,
    },
  });
  return result.candidates[0].content.parts[0].text.trim();
}

// Generates Marathi blessing and its corresponding TTS audio as base64 WAV
async function generateMarathiAudio(imageBase64 = null) {
  console.log(imageBase64 
    ? '📸 [Blessing Request] Analyzing devotee photo & generating personalized Marathi blessing...'
    : '🕉️ [Blessing Request] Generating Marathi blessing from Bappa...');
  
  const blessingText = await generateBlessing(imageBase64);
  console.log(`🌺 [Bappa says]: "${blessingText}"`);

  console.log('🎙️ [TTS Generation] Synthesizing divine voice...');
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: blessingText,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Charon' // Deep, authoritative and benevolent male voice
          }
        }
      }
    }
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData && part.inlineData.mimeType.startsWith('audio/')
  );

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('No audio data returned from Gemini TTS API.');
  }

  const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
  const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
  const audioBase64 = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

  console.log(`✅ [Audio Generated] WAV audio size: ${(wavBuffer.length / 1024).toFixed(1)} KB`);
  return {
    blessing: blessingText,
    audio: audioBase64,
    timestamp: new Date().toISOString()
  };
}

// ==========================================
// PRE-FETCH CACHE: Keep one blessing ready at all times
// Generates on server startup so first request is instant
// ==========================================
let cachedBlessing = null;
let isCaching = false;

async function prefetchBlessing() {
  if (isCaching) return;
  isCaching = true;
  try {
    console.log('🔄 [Pre-fetch] Generating blessing in background...');
    cachedBlessing = await generateMarathiAudio();
    console.log('✅ [Pre-fetch] Blessing ready and cached!');
  } catch (err) {
    console.warn('⚠️ [Pre-fetch] Failed, will generate on-demand:', err.message);
    cachedBlessing = null;
  } finally {
    isCaching = false;
  }
}

// Start pre-fetching immediately on server boot
prefetchBlessing();

// Endpoint: Generate blessing on Namaskar gesture
app.post('/api/blessing', async (req, res) => {
  try {
    const devoteePhoto = req.body?.image;
    let result;

    if (devoteePhoto) {
      // Personalized photo blessing — generate with visual context!
      console.log('📸 [Photo Context] Devotee photo received, crafting customized visual blessing...');
      result = await generateMarathiAudio(devoteePhoto);
    } else if (cachedBlessing) {
      // Serve cached blessing instantly for text-only flow
      result = cachedBlessing;
      cachedBlessing = null;
      console.log('⚡ [Cache HIT] Serving pre-fetched blessing instantly!');

      // Immediately start pre-fetching the next one in background
      prefetchBlessing();
    } else {
      // Cache miss — generate on-demand
      console.log('🐢 [Cache MISS] Generating blessing on-demand...');
      result = await generateMarathiAudio();

      // Pre-fetch next one for later
      prefetchBlessing();
    }

    res.json({
      success: true,
      blessing: result.blessing,
      audio: result.audio,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('❌ Error generating blessing audio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while generating blessing',
      // Fallback blessing in case of API limit/temporary failure
      blessing: 'माझ्या लेकरा, तुझी सर्व विघ्ने दूर होवोत आणि तुझ्या आयुष्यात सुख-समृद्धी नांदो, हा माझा आशीर्वाद आहे!',
      audio: null
    });

    // Try to pre-fetch again for next time
    prefetchBlessing();
  }
});



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-bappa-maza', time: new Date().toISOString() });
});

// Serve frontend fallback for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express server with robust error handling
const server = app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`  🚩 AI Bappa Maza Server is Running!`);
  console.log(`  🌐 URL: http://localhost:${PORT}`);
  console.log(`  🙏 Gesture: Namaskar / 1-Hand Pranam detection`);
  console.log(`=================================================\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT IN USE] Port ${PORT} is already in use by another running server!`);
    console.error(`👉 Solution: Kill the existing process or use a different port:`);
    console.error(`   kill -9 $(lsof -t -i:${PORT}) || PORT=3001 npm start\n`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AI Bappa Maza Server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped.');
    process.exit(0);
  });
});