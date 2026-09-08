require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
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
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Refreshing ${commands.length} application (/) commands.`);

    // Guild-scoped deploy = instant updates, good for development.
    // Switch to Routes.applicationCommands(CLIENT_ID) for global (takes up to 1hr to propagate).
    const isGuildDeploy = Boolean(process.env.GUILD_ID);
    const route = isGuildDeploy
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

const data = await rest.put(route, { body: commands });

console.log(
  `Successfully reloaded ${data.length} ${isGuildDeploy ? 'guild (instant, test server only)' : 'global (may take up to 1 hour)'} application (/) commands.`,
);
  } catch (error) {
    console.error(error);
  }
})();
