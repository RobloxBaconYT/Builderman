const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get info about a member')
    .addUserOption((option) =>
      option.setName('target').setDescription('The member to look up').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('target') || interaction.member;

    const embed = new EmbedBuilder()
      .setTitle(target.user.tag)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: 'Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: target.roles.cache.map((r) => r.name).join(', ') || 'None' },
      )
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
