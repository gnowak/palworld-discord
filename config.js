const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const config = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  palworldDir: process.env.PALWORLD_DIR || '/root/palworld-server',
  tmuxSession: process.env.TMUX_SESSION || 'playit',
  playitCommand: process.env.PLAYIT_COMMAND || 'playit',
  dryRun: process.env.DRY_RUN === 'true',
};

// Simple validation
const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missing = [];

// If dryRun is active, we don't strictly require these credentials to test compilation/dry-run behavior.
if (!config.dryRun) {
  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });
}

if (missing.length > 0) {
  console.error(`[ERROR] Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please create a .env file based on .env.example and populate these values.');
  process.exit(1);
}

module.exports = config;
