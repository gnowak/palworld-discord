const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const config = require('./config');
const { registerCommands } = require('./commands');
const system = require('./system');

// Create a new client instance
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

// When the client is ready, run this code (only once)
client.once('ready', async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
  
  // Update presence
  client.user.setPresence({
    activities: [{ name: 'Palworld VM', type: ActivityType.Watching }],
    status: 'online',
  });

  // Register commands
  await registerCommands();
});

// Handle command interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Defer reply because status and restart commands might take more than 3 seconds
  await interaction.deferReply();

  try {
    if (commandName === 'pal-status') {
      const palResult = await system.getPalworldStatus();
      const playitResult = await system.getPlayitStatus();

      const palStatusEmoji = palResult.running ? '🟢 Running' : '🔴 Stopped';
      const playitStatusEmoji = playitResult.running ? '🟢 Active' : '🔴 Inactive';

      let replyText = `### 🎮 Palworld Server Status\n`;
      replyText += `* **Docker Container:** ${palStatusEmoji}\n`;
      replyText += `* **Playit Tunnel (tmux):** ${playitStatusEmoji}\n\n`;
      replyText += `**Docker Compose Output:**\n\`\`\`\n${palResult.output}\n\`\`\`\n`;
      replyText += `**Playit Tunnel Details:**\n\`\`\`\n${playitResult.output}\n\`\`\``;

      await interaction.editReply(replyText);
    } 
    
    else if (commandName === 'pal-restart') {
      await interaction.editReply('⏳ Restarting Palworld Docker container... (This might take a minute)');
      const result = await system.restartPalworld();
      
      if (result.success) {
        await interaction.editReply(`✅ **Palworld container successfully restarted!**\n\`\`\`\n${result.output}\n\`\`\``);
      } else {
        await interaction.editReply(`❌ **Failed to restart Palworld container.**\n\`\`\`\n${result.output}\n\`\`\``);
      }
    } 
    
    else if (commandName === 'playit-restart') {
      await interaction.editReply('⏳ Restarting playit.gg tunnel inside tmux...');
      const result = await system.restartPlayit();

      if (result.success) {
        await interaction.editReply(`✅ **Playit tunnel successfully restarted!**\n${result.output}`);
      } else {
        await interaction.editReply(`❌ **Failed to restart Playit tunnel.**\n${result.output}`);
      }
    } 
    
    else if (commandName === 'pal-help') {
      const helpText = `### 🤖 Palworld VM Manager Bot Help\n` +
        `Here are the available slash commands you can use to manage the server:\n\n` +
        `* \`/pal-status\` - Check if the Palworld container and playit.gg tunnel are online.\n` +
        `* \`/pal-restart\` - Restart the Palworld Docker container (\`docker compose restart\`).\n` +
        `* \`/playit-restart\` - Kill and recreate the playit.gg tmux session.\n` +
        `* \`/pal-help\` - Show this help message.`;
      
      await interaction.editReply(helpText);
    }
  } catch (error) {
    console.error(`Error handling command /${commandName}:`, error);
    await interaction.editReply(`❌ An error occurred while executing the command: ${error.message}`);
  }
});

// Login to Discord or run dry-run mock checks
if (config.dryRun && !config.discordToken) {
  console.log('[DRY-RUN] Dry run mode is active. Bot will not login to Discord.');
  console.log('[DRY-RUN] Testing mock command execution:');
  
  (async () => {
    console.log('\n--- MOCK PALWORLD STATUS ---');
    console.log(await system.getPalworldStatus());
    console.log('\n--- MOCK PLAYIT STATUS ---');
    console.log(await system.getPlayitStatus());
    console.log('\n--- MOCK PALWORLD RESTART ---');
    console.log(await system.restartPalworld());
    console.log('\n--- MOCK PLAYIT RESTART ---');
    console.log(await system.restartPlayit());
    console.log('\n[DRY-RUN] All mock execution tests passed successfully!');
  })();
} else {
  client.login(config.discordToken);
}
