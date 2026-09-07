const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Get a member's avatar")
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to look up').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`${target.tag}'s Avatar`)
      .setImage(target.displayAvatarURL({ size: 512 }))
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
