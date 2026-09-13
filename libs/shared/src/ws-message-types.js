/**
 * WebSocket message types shared between PC frontend and Express backend.
 */
export const WS_MESSAGE_TYPES = {
  REGISTER: 'REGISTER',
  REGISTER_ACK: 'REGISTER_ACK',
  STATE_UPDATE: 'STATE_UPDATE',
  STREAM_FRAME: 'STREAM_FRAME',
  COMMAND: 'COMMAND',
  PING: 'PING',
  PONG: 'PONG',
  CONTROLLER_COUNT: 'CONTROLLER_COUNT',
  SERVER_RESTARTING: 'SERVER_RESTARTING',
};

/**
 * WebSocket client roles
 */
export const WS_ROLES = {
  PC: 'PC',
  CONTROLLER: 'CONTROLLER',
};
