const fs = require('fs');
const path = require('path');
const express = require('express');
const { rootDir } = require('../config');

const router = express.Router();
const musicDir = path.join(rootDir, 'public', 'forground_music');
const fallbackTrack = '/forground_music/first.mp3';

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(musicDir)) {
      return res.json({ success: true, tracks: [fallbackTrack] });
    }

    const files = fs.readdirSync(musicDir)
      .filter((file) => /\.(mp3|wav|ogg|m4a|aac)$/i.test(file) && !file.startsWith('.'))
      .sort((first, second) => first.localeCompare(second, undefined, {
        numeric: true,
        sensitivity: 'base',
      }));

    const tracks = files.map((file) => `/forground_music/${encodeURIComponent(file)}`);
    res.json({ success: true, tracks: tracks.length > 0 ? tracks : [fallbackTrack] });
  } catch (error) {
    console.warn('⚠️ Error listing foreground music files:', error.message);
    res.json({ success: true, tracks: [fallbackTrack] });
  }
});

module.exports = router;
