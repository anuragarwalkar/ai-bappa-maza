const { WebSocketServer, WebSocket } = require('ws');
const { WS_MESSAGE_TYPES, WS_ROLES, APP_CONSTANTS } = require('@ai-bappa/shared');

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
  isFgMusicEnabled: true,
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
    type: WS_MESSAGE_TYPES.CONTROLLER_COUNT,
    count: controllerClients.size
  });
}

/**
 * Initialize WebSocket Server attached to Node HTTP server
 */
function initWebSocketServer(server) {
  if (wss) {
    try {
      wss.close();
    } catch (e) {}
    wss = null;
    pcClients.clear();
    controllerClients.clear();
  }

  wss = new WebSocketServer({ server, path: APP_CONSTANTS.WS_PATH });

  // Handle errors on WebSocketServer to prevent unhandled EventEmitter exception on EADDRINUSE
  wss.on('error', (err) => {
    if (err && err.code !== 'EADDRINUSE') {
      console.warn('⚠️ WebSocketServer error:', err.message);
    }
  });

  console.log('📡 WebSocket Server initialized at /ws');

  wss.on('connection', (ws, req) => {
    let clientRole = 'UNKNOWN';
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (messageBuffer) => {
      try {
        const message = JSON.parse(messageBuffer.toString());

        switch (message.type) {
          case WS_MESSAGE_TYPES.REGISTER: {
            clientRole = message.role;
            if (clientRole === WS_ROLES.PC) {
              pcClients.add(ws);
              console.log(`🖥️ PC client registered (Total PC: ${pcClients.size})`);
              safeSend(ws, {
                type: WS_MESSAGE_TYPES.REGISTER_ACK,
                role: WS_ROLES.PC,
                controllerCount: controllerClients.size
              });
            } else if (clientRole === WS_ROLES.CONTROLLER) {
              controllerClients.add(ws);
              console.log(`📱 Mobile Controller registered (Total Controllers: ${controllerClients.size})`);
              safeSend(ws, {
                type: WS_MESSAGE_TYPES.REGISTER_ACK,
                role: WS_ROLES.CONTROLLER,
                state: currentState
              });
              notifyControllerCount();
            }
            break;
          }

          case WS_MESSAGE_TYPES.STATE_UPDATE: {
            if (clientRole === WS_ROLES.PC || message.role === WS_ROLES.PC) {
              currentState = {
                ...currentState,
                ...message.state,
                lastUpdated: Date.now()
              };
              broadcastToControllers({
                type: WS_MESSAGE_TYPES.STATE_UPDATE,
                state: currentState
              });
            }
            break;
          }

          case WS_MESSAGE_TYPES.STREAM_FRAME: {
            if (clientRole === WS_ROLES.PC || message.role === WS_ROLES.PC) {
              // Forward live JPEG frame to all connected mobile controllers
              broadcastToControllers({
                type: WS_MESSAGE_TYPES.STREAM_FRAME,
                frame: message.frame,
                timestamp: message.timestamp || Date.now()
              });
            }
            break;
          }

          case WS_MESSAGE_TYPES.COMMAND: {
            // Forward command from Controller to PC
            console.log(`⚡ Received command from controller: ${message.command}`, message.payload || '');
            broadcastToPc({
              type: WS_MESSAGE_TYPES.COMMAND,
              command: message.command,
              payload: message.payload,
              timestamp: Date.now()
            });
            break;
          }

          case WS_MESSAGE_TYPES.PING: {
            safeSend(ws, { type: WS_MESSAGE_TYPES.PONG, timestamp: Date.now() });
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
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
    type: WS_MESSAGE_TYPES.COMMAND,
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
