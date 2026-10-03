const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Parser = require('rss-parser');
const { BRAND_COLOR } = require('../../utils/constants');

const parser = new Parser({ timeout: 8000 });
const DEVFORUM_FEED_URL = 'https://devforum.roblox.com/c/updates/45.rss';

function formatItem(item) {
  const title = (item.title || 'Untitled').replace(/[\[\]]/g, '');
  const snippet = (item.contentSnippet || '').trim();
  const body = snippet.length > 150 ? `${snippet.slice(0, 150)}...` : snippet;
  return `**[${title}](${item.link})**${body ? `\n${body}` : ''}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('latestnews')
    .setDescription('See the most recent official Roblox DevForum updates'),
  cooldown: 10,

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const feed = await parser.parseURL(DEVFORUM_FEED_URL);
      const items = feed.items.slice(0, 3);

      if (items.length === 0) {
        return interaction.editReply('No recent updates found.');
      }

      const embed = new EmbedBuilder()
        .setTitle('📰 Latest Roblox DevForum Updates')
        .setColor(BRAND_COLOR)
        .setDescription(items.map(formatItem).join('\n\n'));

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply('Something went wrong fetching the latest news. Try again in a moment.');
    }
  },
};
