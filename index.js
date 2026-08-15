require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

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

// Generates a heartfelt 1-sentence Marathi blessing from Lord Ganesha
async function generateBlessing() {
  const result = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'You are Lord Ganesha (Bappa). Give a unique, heartfelt blessing in Marathi to a devotee who is offering Namaskar. Keep it 1 sentences. Return only the blessing text in Devanagari script, no extra commentary or translation.',
  });
  return result.candidates[0].content.parts[0].text.trim();
}

// Generates Marathi blessing and its corresponding TTS audio as base64 WAV
async function generateMarathiAudio() {
  console.log('🕉️ [Blessing Request] Generating Marathi blessing from Bappa...');
  const blessingText = await generateBlessing();
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

// Endpoint: Generate blessing on Namaskar gesture
app.post('/api/blessing', async (req, res) => {
  try {
    const result = await generateMarathiAudio();
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

// Start Express server
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`  🚩 AI Bappa Maza Server is Running!`);
  console.log(`  🌐 URL: http://localhost:${PORT}`);
  console.log(`  🙏 Gesture: Namaskar / Anjali Mudra detection`);
  console.log(`=================================================\n`);
});