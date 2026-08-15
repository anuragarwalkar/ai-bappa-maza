require('dotenv').config();

const http = require('http');
const { createApp } = require('./app');
const { PORT } = require('./config');
const { initWebSocketServer } = require('./services/websocket');
const { killProcessOnPort } = require('./utils/port');
killProcessOnPort(PORT);

const app = createApp();
let server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log('\n=================================================');
  console.log('  🚩 AI Bappa Maza Server is Running!');
  console.log(`  🌐 PC URL: http://localhost:${PORT}`);
  console.log(`  📱 Mobile Control: http://localhost:${PORT}/control`);
  console.log('  🙏 Gesture: 1-Hand Pranam detection (750ms hold)');
  console.log('=================================================\n');
});

let isRecovering = false;
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && !isRecovering) {
    isRecovering = true;
    console.warn(`\n⚠️ [PORT IN USE] Port ${PORT} is occupied. Auto-recovering...`);
    killProcessOnPort(PORT);
    setTimeout(() => {
      try {
        server.close();
      } catch (closeError) {
        // The initial listener may not have finished opening.
      }
      server = http.createServer(app);
      initWebSocketServer(server);
      server.listen(PORT, () => {
        console.log(`✅ [Auto-Recovered] Server listening on http://localhost:${PORT}\n`);
      });
    }, 400);
    return;
  }

  console.error('❌ Server error:', error);
  process.exit(1);
});

function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down AI Bappa Maza Server gracefully...`);
  if (server.closeAllConnections) {
    server.closeAllConnections();
  }
  server.close(() => {
    console.log('✅ Server stopped and port released.');
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  });
}

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
