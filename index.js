require('dotenv').config();
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

// Initialize the client using the GEMINI_API_KEY from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function findAudioModels() {
  console.log("Fetching available models for your API key...");
  try {
    const response = await ai.models.list();
    
    // Loop through and print the models you have access to
    for await (const model of response) {
        console.log(`Model Name: ${model.name}`);
        console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ')}\n`);
    }
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}
// findAudioModels();

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

async function generateBlessing() {
  const result = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'You are Lord Ganesha (Bappa). Give a unique, heartfelt blessing in Marathi to a devotee. Keep it 1 sentences. Return only the blessing text, no extra commentary.',
  });
  return result.candidates[0].content.parts[0].text.trim();
}

async function generateMarathiAudio() {
  console.log("Generating blessing...");
  const prompt = await generateBlessing();
  console.log(`Bappa says: ${prompt}\n`);

  console.log("Generating audio...");

  try {
    const response = await ai.models.generateContent({
      // Change this from 'gemini-2.5-flash' to 'gemini-1.5-flash'
      model: 'gemini-3.1-flash-tts-preview', 
      contents: prompt,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Charon" // deep male voice
            }
          }
        }
      }
    });

    // The audio is returned as base64 encoded data in the inlineData object
    const audioPart = response.candidates[0].content.parts.find(
        (part) => part.inlineData && part.inlineData.mimeType.startsWith('audio/')
    );

    if (audioPart) {
      const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer);
      fs.writeFileSync('marathi_output.wav', wavBuffer);
      console.log("Success! Audio saved to marathi_output.wav");
    } else {
      console.log("No audio data was returned.");
    }

  } catch (error) {
    console.error("Error generating audio:", error);
  }
}

generateMarathiAudio();