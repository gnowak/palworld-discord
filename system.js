const { exec } = require('child_process');
const config = require('./config');

/**
 * Execute a shell command and return a promise with stdout, stderr, and success status.
 * @param {string} command 
 * @param {string|null} cwd 
 * @returns {Promise<{success: boolean, code: number, stdout: string, stderr: string}>}
 */
function runCommand(command, cwd = null) {
  if (config.dryRun) {
    console.log(`[DRY-RUN] Executing: "${command}" (cwd: ${cwd || 'default'})`);
    
    // Return mock successful outputs depending on the command
    let stdout = '';
    if (command.includes('docker compose ps')) {
      stdout = 'NAME                IMAGE                              COMMAND                  SERVICE             CREATED             STATUS              PORTS\npalworld-server-1   thijsvanloef/palworld-server-docker:latest   "/init"                  palworld            2 hours ago         Up 2 hours          0.0.0.0:8211->8211/udp';
    } else if (command.includes('tmux has-session')) {
      stdout = 'playit session exists (mocked)';
    } else if (command.includes('docker compose restart')) {
      stdout = 'Restarting palworld-server-1 ... done';
    }
    
    return Promise.resolve({
      success: true,
      code: 0,
      stdout,
      stderr: ''
    });
  }

  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        code: error ? error.code : 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

/**
 * Get the status of the Palworld Docker containers.
 */
async function getPalworldStatus() {
  const result = await runCommand('docker compose ps', config.palworldDir);
  return {
    running: result.success && result.stdout.toLowerCase().includes('up'),
    output: result.stdout || result.stderr || 'No output from docker compose ps.'
  };
}

/**
 * Restart the Palworld Docker containers.
 */
async function restartPalworld() {
  const result = await runCommand('docker compose restart', config.palworldDir);
  return {
    success: result.success,
    output: result.stdout || result.stderr || 'Restart completed.'
  };
}

/**
 * Get the status of the playit tmux session.
 */
async function getPlayitStatus() {
  // tmux has-session exits with 0 if session exists, 1 if not
  const result = await runCommand(`tmux has-session -t ${config.tmuxSession}`);
  return {
    running: result.success,
    output: result.success 
      ? `Session "${config.tmuxSession}" is running.` 
      : `Session "${config.tmuxSession}" is NOT running.`
  };
}

/**
 * Restart the playit tmux session.
 */
async function restartPlayit() {
  // First, attempt to kill the existing tmux session if it is running
  await runCommand(`tmux kill-session -t ${config.tmuxSession}`);
  
  // Start a new tmux session in detached mode running the playit command inside palworldDir
  const startCmd = `tmux new-session -d -s ${config.tmuxSession} -c "${config.palworldDir}" '${config.playitCommand}'`;
  const result = await runCommand(startCmd, config.palworldDir);
  
  // Verify it started successfully
  const verify = await getPlayitStatus();
  
  return {
    success: verify.running,
    output: verify.running 
      ? `Tunnel restarted successfully inside tmux session "${config.tmuxSession}" (working dir: ${config.palworldDir}).`
      : `Failed to start tunnel. Command output: ${result.stderr || result.stdout}`
  };
}

module.exports = {
  getPalworldStatus,
  restartPalworld,
  getPlayitStatus,
  restartPlayit
};
