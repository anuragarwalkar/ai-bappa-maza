require('dotenv').config();

const http = require('http');
const { createApp } = require('./app');
const { PORT } = require('./config');
const { initWebSocketServer } = require('./services/websocket');
const { killProcessOnPort } = require('./utils/port');
killProcessOnPort(PORT);

const app = createApp();
let server = null;
let retryCount = 0;
const MAX_RETRIES = 5;

function createAndStartServer() {
  server = http.createServer(app);
  server.setMaxListeners(50);

  // Initialize WebSocket server attached to HTTP server
  initWebSocketServer(server);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      if (retryCount >= MAX_RETRIES) {
        console.error(`❌ [PORT ERROR] Port ${PORT} remains occupied after ${MAX_RETRIES} attempts.`);
        process.exit(1);
      }
      retryCount++;
      console.warn(`\n⚠️ [PORT IN USE] Port ${PORT} is occupied. Auto-recovering (Attempt ${retryCount}/${MAX_RETRIES})...`);
      killProcessOnPort(PORT);

      setTimeout(() => {
        try {
          server.close();
        } catch (e) {}
        createAndStartServer();
      }, 500);
      return;
    }

    console.error('❌ Server error:', error);
    process.exit(1);
  });

  server.listen(PORT, () => {
    retryCount = 0;
    console.log('\n=================================================');
    console.log('  🚩 AI Bappa Maza Server is Running!');
    console.log(`  🌐 PC URL: http://localhost:${PORT}`);
    console.log(`  📱 Mobile Control: http://localhost:${PORT}/control`);
    console.log('  🙏 Gesture: 1-Hand Pranam detection (750ms hold)');
    console.log('=================================================\n');
  });
}

createAndStartServer();

function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down AI Bappa Maza Server gracefully...`);
  if (server) {
    if (server.closeAllConnections) {
      server.closeAllConnections();
    }
    server.close(() => {
      console.log('✅ Server stopped and port released.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
