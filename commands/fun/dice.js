const { SlashCommandBuilder } = require('discord.js');

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
    await interaction.reply(`🎲 You rolled a **${roll}** (d${sides})`);
  },
};
