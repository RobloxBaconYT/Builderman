require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
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
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
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

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  readyClient.user.setActivity('Roblox stats | /help', { type: 3 }); // type 3 = Watching
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

client.login(process.env.DISCORD_TOKEN);
