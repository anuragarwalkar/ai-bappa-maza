const { WebSocketServer, WebSocket } = require('ws');

let wss = null;
const pcClients = new Set();
const controllerClients = new Set();

let currentState = {
  isCameraLive: true,
  isDetectionEnabled: true,
  isProcessing: false,
  isPlayingAudio: false,
  isCooldownActive: false,
  cooldownRemaining: 0,
  handsCount: 0,
  fps: 30,
  gestureInstruction: 'कॅमेऱ्यासमोर हात दाखवून प्रणाम करा',
  blessingStatus: 'प्रतीक्षेत...',
  blessingText: '',
  hasLastBlessing: false,
  isSoundMuted: false,
  lastUpdated: Date.now()
};

/**
 * Safely send JSON to a WebSocket client
 */
function safeSend(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } catch (err) {
      console.error('WebSocket send error:', err);
    }
  }
}

/**
 * Broadcast message to all connected mobile controllers
 */
function broadcastToControllers(data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  for (const client of controllerClients) {
    if (client.readyState === WebSocket.OPEN) {
      safeSend(client, json);
    }
  }
}

/**
 * Broadcast message to all connected PC clients
 */
function broadcastToPc(data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      safeSend(client, json);
    }
  }
}

/**
 * Notify PC client of active mobile controller count
 */
function notifyControllerCount() {
  broadcastToPc({
    type: 'CONTROLLER_COUNT',
    count: controllerClients.size
  });
}

/**
 * Initialize WebSocket Server attached to Node HTTP server
 */
function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  console.log('📡 WebSocket Server initialized at /ws');

  wss.on('connection', (ws, req) => {
    let clientRole = 'UNKNOWN';
    ws.isAlive = true;
    const clientIp = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;
    const origin = req.headers.origin || 'no-origin';
    const userAgent = req.headers['user-agent'] || 'no-agent';

    console.log(`🔌 [WS Connected] from ${clientIp}:${clientPort} (Origin: ${origin})`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (messageBuffer) => {
      try {
        const message = JSON.parse(messageBuffer.toString());

        switch (message.type) {
          case 'REGISTER': {
            clientRole = message.role;
            if (clientRole === 'PC') {
              pcClients.add(ws);
              console.log(`🖥️ PC client registered (Total PC: ${pcClients.size}) from ${clientIp}:${clientPort}`);
              safeSend(ws, {
                type: 'REGISTER_ACK',
                role: 'PC',
                controllerCount: controllerClients.size
              });
            } else if (clientRole === 'CONTROLLER') {
              controllerClients.add(ws);
              console.log(`📱 Mobile Controller registered (Total Controllers: ${controllerClients.size}) from ${clientIp}:${clientPort}`);
              safeSend(ws, {
                type: 'REGISTER_ACK',
                role: 'CONTROLLER',
                state: currentState
              });
              notifyControllerCount();
            }
            break;
          }

          case 'STATE_UPDATE': {
            if (clientRole === 'PC' || message.role === 'PC') {
              currentState = {
                ...currentState,
                ...message.state,
                lastUpdated: Date.now()
              };
              broadcastToControllers({
                type: 'STATE_UPDATE',
                state: currentState
              });
            }
            break;
          }

          case 'STREAM_FRAME': {
            if (clientRole === 'PC' || message.role === 'PC') {
              // Forward live JPEG frame to all connected mobile controllers
              broadcastToControllers({
                type: 'STREAM_FRAME',
                frame: message.frame,
                timestamp: message.timestamp || Date.now()
              });
            }
            break;
          }

          case 'COMMAND': {
            // Forward command from Controller to PC
            console.log(`⚡ Received command from controller: ${message.command}`, message.payload || '');
            broadcastToPc({
              type: 'COMMAND',
              command: message.command,
              payload: message.payload,
              timestamp: Date.now()
            });
            break;
          }

          case 'PING': {
            safeSend(ws, { type: 'PONG', timestamp: Date.now() });
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 [WS Closed] role=${clientRole} code=${code} reason=${reason.toString() || 'none'}`);
      if (pcClients.has(ws)) {
        pcClients.delete(ws);
        console.log(`🖥️ PC client disconnected (Remaining PC: ${pcClients.size})`);
      }
      if (controllerClients.has(ws)) {
        controllerClients.delete(ws);
        console.log(`📱 Controller disconnected (Remaining Controllers: ${controllerClients.size})`);
        notifyControllerCount();
      }
    });

    ws.on('error', (err) => {
      console.warn('WebSocket client error:', err.message);
    });
  });

  // Heartbeat ping-pong every 25 seconds
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

/**
 * Get current system state
 */
function getCurrentState() {
  return currentState;
}

/**
 * Dispatch command to PC from REST fallback
 */
function dispatchCommand(command, payload) {
  broadcastToPc({
    type: 'COMMAND',
    command,
    payload,
    timestamp: Date.now()
  });
  return { success: true, command, pcClientsCount: pcClients.size };
}

module.exports = {
  initWebSocketServer,
  getCurrentState,
  dispatchCommand,
  broadcastToControllers,
  broadcastToPc
};
