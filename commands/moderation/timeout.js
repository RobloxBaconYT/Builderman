const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a set duration')
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to time out').setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Duration in minutes (max 40320 = 28 days)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ content: 'That member could not be found.', flags: 64 });
    }
    if (!target.moderatable) {
      return interaction.reply({ content: "I can't time out that member (role hierarchy or missing permissions).", flags: 64 });
    }

    try {
      await target.timeout(minutes * 60 * 1000, reason);
      const embed = new EmbedBuilder()
        .setTitle('🔇 Member Timed Out')
        .setColor(BRAND_COLOR)
        .addFields(
          { name: 'Member', value: `${target.user.tag}`, inline: true },
          { name: 'Duration', value: `${minutes} minute(s)`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
        );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Something went wrong trying to time out that member. Check my role permissions and try again.', flags: 64 });
    }
  },
};
