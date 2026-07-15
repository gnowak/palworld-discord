const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('pal-status')
    .setDescription('Check the status of the Palworld server and Playit tunnel'),
  new SlashCommandBuilder()
    .setName('pal-restart')
    .setDescription('Restart the Palworld Docker container'),
  new SlashCommandBuilder()
    .setName('playit-restart')
    .setDescription('Restart the playit.gg tunnel tmux session'),
  new SlashCommandBuilder()
    .setName('pal-help')
    .setDescription('Show help and explanation of all commands')
].map(command => command.toJSON());

async function registerCommands() {
  if (config.dryRun && (!config.discordToken || !config.clientId || !config.guildId)) {
    console.log('[DRY-RUN] Skipping command registration because config variables are not fully set.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    console.log(`Started refreshing application (/) commands for Guild ${config.guildId}...`);
    
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering application commands:', error);
  }
}

module.exports = {
  registerCommands
};
