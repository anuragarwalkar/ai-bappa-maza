const express = require('express');
const blessingRouter = require('./blessing');
const healthRouter = require('./health');
const musicRouter = require('./music');

const router = express.Router();

router.use('/blessing', blessingRouter);
router.use('/health', healthRouter);
router.use('/foreground-music', musicRouter);

module.exports = router;
