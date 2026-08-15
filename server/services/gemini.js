const { GoogleGenAI } = require('@google/genai');
const { apiKey } = require('../config');
const { BLESSING_THEMES } = require('../constants/themes');
const { pcmToWav } = require('../utils/audio');

const ai = new GoogleGenAI({ apiKey });

async function generateBlessing(imageBase64 = null) {
  const theme = BLESSING_THEMES[Math.floor(Math.random() * BLESSING_THEMES.length)];
  const contentParts = [];
  let prompt;

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    contentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64,
      },
    });

    prompt = `You are Lord Ganesha (Bappa), the all-seeing, loving and wise deity, looking directly at the devotee in this webcam photo who is offering Namaskar / Pranam to you.

Carefully observe the person in the photo:
- Notice their facial expression, eyes (calm, focused, tired, bright), posture (sitting straight, relaxed), facial glow/smile, and overall physical state or energy.
- Do NOT mention or comment on their clothes, clothing colors, fabrics, or outfit.

Address this specific devotee directly in Marathi (2-3 sentences max):
1. Lovingly acknowledge their devotion with 1 real visual observation about their expression, eyes, posture, or facial aura (for example: "तुझ्या चेहऱ्यावरील ही प्रसन्नता आणि डोळ्यांमधील ही सकारात्मकता...", "तुझी ही नम्र मुद्रा आणि एकाग्र नजर...", "तुझ्या चेहऱ्यावर थोडा थकवा जाणवतोय पण मनातील श्रद्धा खरी आहे...").
2. Give a warm, personalized आशीर्वाद (blessing) related to ${theme}.
3. Give one practical, caring health & wellness tip tailored to what you observe about them (such as taking care of eyes/screen-time rest, correct back/neck posture, regular hydration/water intake, daily pranayama/deep breathing, balanced sleep, or physical activity).

Rules:
- Write ONLY in Marathi (Devanagari script)
- Make it 100% obvious and delightful that you are seeing THIS exact person in real-time
- Do NOT talk about clothes, fabrics, or dress colors
- Sound like a loving, caring divine father/grandfather (बाप्पा) who deeply cares about their health, mind, and life
- Keep it concise (2-3 sentences) so the audio voice is crisp and impactful
- NO English words, NO translation, NO commentary`;
  } else {
    prompt = `You are Lord Ganesha (Bappa), the remover of obstacles and god of wisdom and well-being.
A devotee is offering sincere Namaskar to you.

Today's theme: ${theme}

Give a UNIQUE blessing in Marathi (2-3 sentences max) that includes:
1. A warm, heartfelt आशीर्वाद (blessing) related to this theme
2. A practical, caring health & wellness or lifestyle tip (e.g. good posture, mental peace, pranayama, hydration, eye care, balanced routine) that Bappa would lovingly give to keep their body and mind healthy

Rules:
- Write ONLY in Marathi (Devanagari script)
- Sound like a wise, loving grandfather giving advice
- Make each blessing completely different and fresh
- Include specific, practical health and life advice (not just generic blessings)
- NO English, NO translations, NO commentary
- Do NOT repeat common phrases like "तुझ्या आयुष्यात सुख-समृद्धी"`;
  }

  contentParts.push(prompt);

  const result = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: contentParts,
    config: { temperature: 1.2 },
  });

  return result.candidates[0].content.parts[0].text.trim();
}

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
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        },
      },
    },
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData && part.inlineData.mimeType.startsWith('audio/')
  );

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('No audio data returned from Gemini TTS API.');
  }

  const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
  const wavBuffer = pcmToWav(pcmBuffer);
  const audioBase64 = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

  console.log(`✅ [Audio Generated] WAV audio size: ${(wavBuffer.length / 1024).toFixed(1)} KB`);
  return {
    blessing: blessingText,
    audio: audioBase64,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { generateBlessing, generateMarathiAudio };
