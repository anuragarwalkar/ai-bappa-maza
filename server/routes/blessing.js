const express = require('express');
const { generateMarathiAudio } = require('../services/gemini');
const {
  getCachedBlessing,
  clearCachedBlessing,
  prefetchBlessing,
} = require('../services/blessingCache');

const router = express.Router();
const fallbackBlessing = 'माझ्या लेकरा, तुझी सर्व विघ्ने दूर होवोत आणि तुझ्या आयुष्यात सुख-समृद्धी नांदो, हा माझा आशीर्वाद आहे!';

router.post('/', async (req, res) => {
  try {
    const devoteePhoto = req.body?.image;
    let result;

    if (devoteePhoto) {
      console.log('📸 [Photo Context] Devotee photo received, crafting customized visual blessing...');
      result = await generateMarathiAudio(devoteePhoto);
    } else {
      const cachedBlessing = getCachedBlessing();
      if (cachedBlessing) {
        result = cachedBlessing;
        clearCachedBlessing();
        console.log('⚡ [Cache HIT] Serving pre-fetched blessing instantly!');
        prefetchBlessing();
      } else {
        console.log('🐢 [Cache MISS] Generating blessing on-demand...');
        result = await generateMarathiAudio();
        prefetchBlessing();
      }
    }

    res.json({
      success: true,
      blessing: result.blessing,
      audio: result.audio,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('❌ Error generating blessing audio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while generating blessing',
      blessing: fallbackBlessing,
      audio: null,
    });
    prefetchBlessing();
  }
});

module.exports = router;
