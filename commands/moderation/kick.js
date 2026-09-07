const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to kick').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the kick').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ content: 'That member could not be found.', ephemeral: true });
    }
    if (!target.kickable) {
      return interaction.reply({ content: "I can't kick that member (role hierarchy or missing permissions).", ephemeral: true });
    }

    await target.kick(reason);
    await interaction.reply(`👢 Kicked **${target.user.tag}** — ${reason}`);
  },
};
