const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to ban').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ content: 'That member could not be found.', ephemeral: true });
    }
    if (!target.bannable) {
      return interaction.reply({ content: "I can't ban that member (role hierarchy or missing permissions).", ephemeral: true });
    }

    await target.ban({ reason });
    await interaction.reply(`🔨 Banned **${target.user.tag}** — ${reason}`);
  },
};
