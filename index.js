require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { checkNews } = require('./utils/newsChecker');
const { checkServiceStatus } = require('./utils/statusChecker');
const { supabase } = require('./utils/supabase');
const { logUsage } = require('./utils/usageLogger');
const { startHealthServer } = require('./utils/healthServer');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: { parse: [] },
});

client.commands = new Collection();
const cooldowns = new Collection();
const DEFAULT_COOLDOWN_SECONDS = 3;

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] Command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  const cooldownSeconds = command.cooldown ?? DEFAULT_COOLDOWN_SECONDS;
  const cooldownKey = `${interaction.commandName}-${interaction.user.id}`;
  const now = Date.now();

  if (cooldowns.has(cooldownKey)) {
    const expiresAt = cooldowns.get(cooldownKey);
    if (now < expiresAt) {
      const secondsLeft = ((expiresAt - now) / 1000).toFixed(1);
      return interaction.reply({
        content: `Slow down — try \`/${interaction.commandName}\` again in ${secondsLeft}s.`,
        flags: 64,
      });
    }
  }
  cooldowns.set(cooldownKey, now + cooldownSeconds * 1000);
  setTimeout(() => cooldowns.delete(cooldownKey), cooldownSeconds * 1000);

  try {
    await command.execute(interaction);
    logUsage(interaction, true);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    logUsage(interaction, false);
    try {
      const errorReply = { content: 'There was an error while executing this command.', flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    } catch (followUpError) {
      console.error('Failed to send error reply (interaction likely expired):', followUpError.message);
    }
  }
});

client.on(Events.GuildDelete, async (guild) => {
  if (!guild.available || process.env.DISABLE_BACKGROUND_JOBS === 'true') return; // temporary outage, not a removal
  for (const table of ['news_subscriptions', 'status_subscriptions']) {
    const { error } = await supabase.from(table).delete().eq('guild_id', guild.id);
    if (error) console.error(`Failed to clean ${table} for guild ${guild.id}:`, error.message);
  }
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  readyClient.user.setActivity('Roblox news | /help', { type: 3 }); // type 3 = Watching

  if (process.env.DISABLE_BACKGROUND_JOBS === 'true') {
    console.log('Background jobs disabled (dev mode).');
    return;
  }

  const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
  checkNews(readyClient);
  checkServiceStatus(readyClient);
  setInterval(() => {
    checkNews(readyClient);
    checkServiceStatus(readyClient);
  }, CHECK_INTERVAL_MS);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1); // let Railway restart a clean process
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startHealthServer(client);
client.login(process.env.DISCORD_TOKEN);
