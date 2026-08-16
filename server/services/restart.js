const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { broadcastToPc, broadcastToControllers } = require('./websocket');

/**
 * Triggers a graceful server restart
 */
function triggerServerRestart() {
  console.log('\n🔄 [SERVER RESTART] Restart request received. Notifying clients...');

  // 1. Notify all connected WebSocket clients (PC and Mobile Controllers)
  try {
    const restartMsg = JSON.stringify({
      type: 'SERVER_RESTARTING',
      timestamp: Date.now(),
      message: 'Server is restarting...'
    });
    broadcastToPc(restartMsg);
    broadcastToControllers(restartMsg);
  } catch (err) {
    console.warn('⚠️ Error notifying clients of restart:', err.message);
  }

  // 2. Schedule restart after a short delay so the HTTP response and WS message can flush
  setTimeout(() => {
    try {
      // Touch/write the trigger file watched by nodemon
      const triggerPath = path.join(__dirname, '..', '.restart-trigger.json');
      fs.writeFileSync(
        triggerPath,
        JSON.stringify({ restartedAt: new Date().toISOString(), timestamp: Date.now() }, null, 2),
        'utf8'
      );
      console.log('🔄 [SERVER RESTART] Trigger file updated for nodemon.');
    } catch (err) {
      console.warn('⚠️ Could not write restart trigger file:', err.message);
    }

    // Check if we are running in standalone mode (without nodemon watching)
    const isNodemon = Boolean(
      process.env.NODEMON ||
      process.env.npm_lifecycle_script?.includes('nodemon') ||
      process.argv.some(arg => arg.includes('nodemon'))
    );

    if (!isNodemon) {
      console.log('🔄 [SERVER RESTART] Spawning new process and exiting current process...');
      const child = spawn(process.argv[0], process.argv.slice(1), {
        detached: true,
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env
      });
      child.unref();
      process.exit(0);
    }
  }, 200);
}

module.exports = {
  triggerServerRestart
};
