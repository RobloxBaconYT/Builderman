const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),

  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const embed = new EmbedBuilder()
      .setTitle('🪙 Coin Flip')
      .setColor(BRAND_COLOR)
      .setDescription(`It landed on **${result}**!`);
    await interaction.reply({ embeds: [embed] });
  },
};
