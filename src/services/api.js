/**
 * API Service for interacting with backend endpoints
 */

/**
 * Requests divine blessing from Bappa
 * @param {{image?: string, timestamp?: string}} payload 
 * @returns {Promise<{success: boolean, blessing: string, audio: string|null, timestamp?: string, error?: string}>}
 */
export async function postBlessing(payload) {
  const response = await fetch('/api/blessing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches the dynamic list of foreground music tracks
 * @returns {Promise<{success: boolean, tracks: string[]}>}
 */
export async function fetchForegroundMusicList() {
  const response = await fetch('/api/foreground-music');
  if (!response.ok) {
    throw new Error(`Failed to fetch music tracks (${response.status})`);
  }
  return response.json();
}

/**
 * Health check endpoint
 * @returns {Promise<{status: string, service: string, time: string}>}
 */
export async function fetchHealth() {
  const response = await fetch('/api/health');
  return response.json();
}

/**
 * Fetches local server IP and mobile connection URLs
 * @returns {Promise<{success: boolean, localIp: string, port: number, controlUrl: string, viteControlUrl: string}>}
 */
export async function fetchServerInfo() {
  const response = await fetch('/api/server-info');
  if (!response.ok) {
    throw new Error(`Failed to fetch server info (${response.status})`);
  }
  return response.json();
}

/**
 * Sends a remote control command via REST fallback
 * @param {string} command 
 * @param {any} payload 
 */
export async function sendControlCommand(command, payload) {
  const response = await fetch('/api/control/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, payload })
  });
  return response.json();
}

/**
 * Requests the backend server to restart gracefully
 * @returns {Promise<{success: boolean, message: string, timestamp?: number}>}
 */
export async function requestServerRestart() {
  const response = await fetch('/api/control/restart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

