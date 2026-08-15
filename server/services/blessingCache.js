const { generateMarathiAudio } = require('./gemini');

let cachedBlessing = null;
let isCaching = false;

async function prefetchBlessing() {
  if (isCaching) return;

  isCaching = true;
  try {
    console.log('🔄 [Pre-fetch] Generating blessing in background...');
    cachedBlessing = await generateMarathiAudio();
    console.log('✅ [Pre-fetch] Blessing ready and cached!');
  } catch (error) {
    console.warn('⚠️ [Pre-fetch] Failed, will generate on-demand:', error.message);
    cachedBlessing = null;
  } finally {
    isCaching = false;
  }
}

function getCachedBlessing() {
  return cachedBlessing;
}

function clearCachedBlessing() {
  cachedBlessing = null;
}

module.exports = {
  prefetchBlessing,
  getCachedBlessing,
  clearCachedBlessing,
};
