const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete recent messages in this channel')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 10,

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      const embed = new EmbedBuilder()
        .setTitle('🧹 Messages Cleared')
        .setColor(BRAND_COLOR)
        .setDescription(`Deleted **${deleted.size}** message(s) in this channel.`);
      await interaction.reply({ embeds: [embed], flags: 64 });
    } catch (error) {
      console.error(error);
      if (error.code === 50034) {
        return interaction.reply({
          content: "I can only bulk-delete messages younger than 14 days — some messages in that range are older. Try a smaller amount.",
          flags: 64,
        });
      }
      await interaction.reply({ content: 'Something went wrong trying to delete those messages.', flags: 64 });
    }
  },
};
