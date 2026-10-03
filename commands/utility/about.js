const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { getLinkRow } = require('../../utils/invite');
const { version } = require('../../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('About Builderman: stats, version and invite link'),

  async execute(interaction) {
    const client = interaction.client;
    const startedAt = Math.floor(Date.now() / 1000 - process.uptime());
    const ping = client.ws.ping >= 0 ? `${Math.round(client.ws.ping)}ms` : 'N/A';

    const embed = new EmbedBuilder()
      .setTitle('Builderman')
      .setColor(BRAND_COLOR)
      .setDescription('A Roblox-focused Discord bot: user, game and group lookups, DevForum news and outage alerts.')
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Version', value: `v${version}`, inline: true },
        { name: 'Ping', value: ping, inline: true },
        { name: 'Online since', value: `<t:${startedAt}:R>`, inline: true },
      )
      .setFooter({ text: 'Type /help to see all commands' });

    await interaction.reply({ embeds: [embed], components: [getLinkRow(client)] });
  },
};
