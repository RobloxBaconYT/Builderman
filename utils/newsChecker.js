const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('./constants');
const { supabase } = require('./supabase');

const parser = new Parser();
const DEVFORUM_FEED_URL = 'https://devforum.roblox.com/c/updates/45.rss';
const SOURCE_KEY = 'devforum_updates';

async function checkNews(client) {
  try {
    const feed = await parser.parseURL(DEVFORUM_FEED_URL);
    if (!feed.items || feed.items.length === 0) return;

    const { data: stateRow } = await supabase
      .from('feed_state')
      .select('last_item_link')
      .eq('source', SOURCE_KEY)
      .maybeSingle();

    const lastSeenLink = stateRow?.last_item_link;
    const newestLink = feed.items[0].link;

    let newItems = [];
    if (!lastSeenLink) {
      // First run ever — don't backfill history, just note the current newest item.
      newItems = [];
    } else {
      const lastSeenIndex = feed.items.findIndex((item) => item.link === lastSeenLink);
      newItems = lastSeenIndex === -1 ? [feed.items[0]] : feed.items.slice(0, lastSeenIndex);
    }

    if (newItems.length > 0) {
      const { data: subs } = await supabase.from('news_subscriptions').select('*');

      for (const item of newItems.reverse()) {
        const embed = new EmbedBuilder()
          .setTitle(item.title)
          .setURL(item.link)
          .setColor(BRAND_COLOR)
          .setDescription((item.contentSnippet || '').slice(0, 300))
          .setFooter({ text: `Roblox DevForum${item.categories ? ' · ' + item.categories.join(', ') : ''}` })
          .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date());

        for (const sub of subs || []) {
          try {
            const channel = await client.channels.fetch(sub.channel_id);
            await channel.send({ embeds: [embed] });
          } catch (sendError) {
            console.error(`Failed to send news to guild ${sub.guild_id}:`, sendError.message);
          }
        }
      }
    }

    await supabase.from('feed_state').upsert({ source: SOURCE_KEY, last_item_link: newestLink, updated_at: new Date() });
  } catch (error) {
    console.error('Error checking Roblox news feed:', error);
  }
}

module.exports = { checkNews };
