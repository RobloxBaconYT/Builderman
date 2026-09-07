const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
      return interaction.reply({ content: 'That member could not be found.', ephemeral: true });
    }
    if (!target.moderatable) {
      return interaction.reply({ content: "I can't time out that member (role hierarchy or missing permissions).", ephemeral: true });
    }

    await target.timeout(minutes * 60 * 1000, reason);
    await interaction.reply(`🔇 Timed out **${target.user.tag}** for ${minutes} minute(s) — ${reason}`);
  },
};
