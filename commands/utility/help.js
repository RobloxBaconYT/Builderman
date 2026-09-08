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
      .addFields(
        { name: '🛡️ Moderation', value: '`/kick` `/ban` `/timeout` `/clear`' },
        { name: '🎉 Fun', value: '`/8ball` `/coinflip` `/dice`' },
        { name: '🔧 Utility', value: '`/ping` `/userinfo` `/serverinfo` `/avatar` `/help`' },
        { name: '🎮 Roblox', value: '`/robloxuser` `/robloxgame`' },
      )
      .setFooter({ text: 'Type / and start typing a command name to see its options.' });

    await interaction.reply({ embeds: [embed] });
  },
};
