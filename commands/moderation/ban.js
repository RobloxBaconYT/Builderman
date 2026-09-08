const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

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
      return interaction.reply({ content: 'That member could not be found.', flags: 64 });
    }
    if (!target.bannable) {
      return interaction.reply({ content: "I can't ban that member (role hierarchy or missing permissions).", flags: 64 });
    }

    try {
      await target.ban({ reason });
      const embed = new EmbedBuilder()
        .setTitle('🔨 Member Banned')
        .setColor(BRAND_COLOR)
        .addFields(
          { name: 'Member', value: `${target.user.tag}`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
        );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Something went wrong trying to ban that member. Check my role permissions and try again.', flags: 64 });
    }
  },
};
