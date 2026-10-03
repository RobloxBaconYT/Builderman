const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('./constants');
const { supabase } = require('./supabase');
const { handleSendError } = require('./subscriptions');

const parser = new Parser({ timeout: 8000 });
const DEVFORUM_FEED_URL = 'https://devforum.roblox.com/c/updates/45.rss';
const SOURCE_KEY = 'devforum_updates';

async function checkNews(client) {
  try {
    const feed = await parser.parseURL(DEVFORUM_FEED_URL);
    if (!feed.items || feed.items.length === 0) return;

    const { data: stateRow, error: stateError } = await supabase
      .from('feed_state')
      .select('last_item_link')
      .eq('source', SOURCE_KEY)
      .maybeSingle();
    if (stateError) throw stateError;

    const lastSeenLink = stateRow?.last_item_link;
    const newestLink = feed.items[0].link;

    let newItems = [];
    if (lastSeenLink) {
      const lastSeenIndex = feed.items.findIndex((item) => item.link === lastSeenLink);
      newItems = lastSeenIndex === -1 ? [feed.items[0]] : feed.items.slice(0, lastSeenIndex);
    }
    // No lastSeenLink = first run ever: don't backfill history, just record the newest item.

    if (newItems.length > 0) {
      const { data: subs, error: subsError } = await supabase.from('news_subscriptions').select('*');
      if (subsError) throw subsError; // abort so we don't mark items as seen without sending them

      for (const item of newItems.reverse()) {
        const embed = new EmbedBuilder()
          .setTitle((item.title || 'Untitled').slice(0, 256))
          .setURL(item.link)
          .setColor(BRAND_COLOR)
          .setDescription((item.contentSnippet || '').slice(0, 300) || null)
          .setFooter({ text: `Roblox DevForum${item.categories ? ' · ' + item.categories.join(', ') : ''}` })
          .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date());

        for (const sub of subs || []) {
          try {
            const channel = await client.channels.fetch(sub.channel_id);
            await channel.send({ embeds: [embed] });
          } catch (sendError) {
            await handleSendError('news_subscriptions', sub, sendError, client);
          }
        }
      }
    }

    const { error: upsertError } = await supabase
      .from('feed_state')
      .upsert({ source: SOURCE_KEY, last_item_link: newestLink, updated_at: new Date() });
    if (upsertError) throw upsertError;
  } catch (error) {
    console.error('Error checking Roblox news feed:', error);
  }
}

module.exports = { checkNews };
