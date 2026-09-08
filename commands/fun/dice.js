const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll a die')
    .addIntegerOption((option) =>
      option
        .setName('sides')
        .setDescription('Number of sides (default 6)')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(1000),
    ),

  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const roll = Math.floor(Math.random() * sides) + 1;
    const embed = new EmbedBuilder()
      .setTitle('🎲 Dice Roll')
      .setColor(BRAND_COLOR)
      .setDescription(`You rolled a **${roll}** (d${sides})`);
    await interaction.reply({ embeds: [embed] });
  },
};
