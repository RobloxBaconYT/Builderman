const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Builderman — Command List')
      .setColor(BRAND_COLOR)
      .setDescription('The Roblox lookup bot — plus news and status tracking on the side.')
      .addFields(
        { name: '🎮 Roblox Lookups', value: '`/robloxuser` `/robloxgame` `/robloxcompare` `/robloxgroup`' },
        { name: '📰 News', value: '`/setnews` `/stopnews` `/latestnews`' },
        { name: '🚦 Status Alerts', value: '`/setstatus` `/stopstatus`' },
        { name: '🔧 Utility', value: '`/ping` `/help`' },
      )
      .setFooter({ text: 'Type / and start typing a command name to see its options.' });

    await interaction.reply({ embeds: [embed] });
  },
};
