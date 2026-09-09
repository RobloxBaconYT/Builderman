const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Parser = require('rss-parser');
const { BRAND_COLOR } = require('../../utils/constants');

const parser = new Parser();
const DEVFORUM_FEED_URL = 'https://devforum.roblox.com/c/updates/45.rss';

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
        .setDescription(
          items
            .map((item) => `**[${item.title}](${item.link})**\n${(item.contentSnippet || '').slice(0, 150)}...`)
            .join('\n\n'),
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply('Something went wrong fetching the latest news. Try again in a moment.');
    }
  },
};
