const { execSync } = require('child_process');

function killProcessOnPort(port) {
  try {
    const stdout = execSync(`lsof -t -sTCP:LISTEN -i:${port}`, { encoding: 'utf8' }).trim();
    if (!stdout) return;

    for (const pidStr of stdout.split('\n')) {
      const pid = parseInt(pidStr.trim(), 10);
      if (pid && pid !== process.pid && pid !== process.ppid) {
        console.log(`🧹 [Auto-Cleanup] Freeing occupied port ${port} (PID ${pid})...`);
        try {
          process.kill(pid, 'SIGKILL');
        } catch (error) {
          // The process may have exited between discovery and termination.
        }
      }
    }
  } catch (error) {
    // lsof exits non-zero when the port is available.
  }
}

module.exports = { killProcessOnPort };
