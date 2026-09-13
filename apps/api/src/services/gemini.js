const { GoogleGenAI } = require('@google/genai');
const { apiKey } = require('../config');
const { BLESSING_THEMES, BAPPA_MOODS, OPENING_HOOKS } = require('../constants/themes');
const { pcmToWav } = require('../utils/audio');

const ai = new GoogleGenAI({ apiKey });

async function generateBlessing(imageBase64 = null) {
  const theme = BLESSING_THEMES[Math.floor(Math.random() * BLESSING_THEMES.length)];
  const mood = BAPPA_MOODS[Math.floor(Math.random() * BAPPA_MOODS.length)];
  const hook = OPENING_HOOKS[Math.floor(Math.random() * OPENING_HOOKS.length)];
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

    prompt = `You are Lord Ganesha (बाप्पा), the loving, omniscient, and affectionate deity, looking directly at the devotee in this real-time webcam photo who is offering Namaskar / Pranam to you.

CURRENT DIVINE MOOD & PERSONALITY:
"${mood.name}" — ${mood.instruction}

TODAY'S SPECIAL THEME:
${theme}

OPENING STYLE INSPIRATION:
${hook}

TASK:
Observe the devotee in the photo with genuine love:
- Note their expression, smile, gaze/eyes (calm, tired, focused, bright), posture (head tilt, spine, shoulders), and overall facial aura or energy.
- Address this devotee directly in rich, natural Marathi (2-3 spoken sentences max).

ANTI-REPETITION RULES (VERY IMPORTANT):
1. Under NO circumstances follow a predictable formula (like always starting with "माझ्या बाळा, तुझ्या चेहऱ्यावरील..."). Every response must feel uniquely improvised and spontaneous!
2. Vary your opening and tone according to the selected mood:
   - Sometimes start with affectionate wonder ("अरे वाघा!", "अरे दोस्ता!", "कौतुक वाटतं रे तुझं...", "अरे वेड्या, कसला विचार करतोस?")
   - Sometimes start directly with a striking observation of what their eyes or smile reveal.
   - Sometimes open with a poetic metaphor or a comforting declaration.
3. Weave together naturally:
   - A hyper-personalized observation of their facial expression, eyes, or posture (NEVER mention clothes, fabrics, or clothing colors).
   - A deeply meaningful blessing related to ${theme}.
   - One caring, practical wellness or mental health advice (hydration, deep breathing, eye relaxation, posture, unwinding from screen, or trusting the journey).
4. Strictly write ONLY in pure Marathi (Devanagari script). No English words, no phonetic English, no translations, no meta commentary.
5. Keep it crisp (2-3 sentences) so the synthesized voice sounds dynamic, lively, and warm.`;
  } else {
    prompt = `You are Lord Ganesha (बाप्पा) giving a spontaneous, fresh Marathi blessing to a devotee.

DIVINE MOOD: "${mood.name}" — ${mood.instruction}
THEME: ${theme}
OPENING TECHNIQUE: ${hook}

TASK:
Generate a completely UNIQUE, unpredictable, heartfelt blessing in Marathi (2-3 sentences max).

RULES:
- NEVER use standard cookie-cutter templates or repeated stock phrases.
- Adopt the specified mood and opening style to make the response sound fresh, alive, and authentic.
- Include a warm blessing and practical health/wellness advice for the devotee's body and mind.
- Write ONLY in Marathi (Devanagari script). NO English, NO translations, NO meta commentary.`;
  }

  contentParts.push(prompt);

  console.log(`🎭 [Bappa's Random Mood]: "${mood.name}"`);
  console.log(`🎯 [Today's Focus Theme]: "${theme}"`);

  const result = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: contentParts,
    config: {
      temperature: 1.35,
      topP: 0.95,
      topK: 64,
    },
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
