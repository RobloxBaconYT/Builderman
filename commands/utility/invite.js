const { SlashCommandBuilder } = require('discord.js');
const { getLinkRow } = require('../../utils/invite');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Add Builderman to your own server'),

  async execute(interaction) {
    await interaction.reply({
      content: 'Want Builderman in your server? Use the button below.',
      components: [getLinkRow(interaction.client)],
    });
  },
};
