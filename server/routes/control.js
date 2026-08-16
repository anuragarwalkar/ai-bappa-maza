const express = require('express');
const os = require('os');
const { getCurrentState, dispatchCommand } = require('../services/websocket');
const { triggerServerRestart } = require('../services/restart');
const { PORT } = require('../config');

const router = express.Router();

/**
 * Helper to get local IPv4 address of this machine
 */
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

/**
 * GET /api/server-info
 * Returns server network information and QR connection links
 */
router.get('/server-info', (req, res) => {
  const localIp = getLocalIpAddress();
  const port = PORT || 3000;
  const protocol = req.protocol || 'http';
  
  res.json({
    success: true,
    localIp,
    port,
    controlUrl: `http://${localIp}:${port}/control`,
    pcUrl: `http://${localIp}:${port}`,
    viteControlUrl: `http://${localIp}:5173/control`
  });
});

/**
 * GET /api/control/state
 * Returns current cached state
 */
router.get('/control/state', (req, res) => {
  res.json({
    success: true,
    state: getCurrentState()
  });
});

/**
 * POST /api/control/command
 * REST fallback for sending control commands
 */
router.post('/control/command', (req, res) => {
  const { command, payload } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, error: 'Command is required' });
  }

  const result = dispatchCommand(command, payload);
  res.json(result);
});

/**
 * POST /api/control/restart or POST /api/server/restart
 * Gracefully restarts the AI Bappa Maza backend server
 */
router.post(['/control/restart', '/server/restart'], (req, res) => {
  res.json({
    success: true,
    message: 'सर्व्हर रीस्टार्ट होत आहे...',
    timestamp: Date.now()
  });

  // Trigger server restart asynchronously
  triggerServerRestart();
});

module.exports = router;
