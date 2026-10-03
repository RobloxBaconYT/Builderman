const { supabase } = require('./supabase');

// 10003 = Unknown Channel, 10004 = Unknown Guild. Both are permanent.
const DEAD_CODES = new Set([10003, 10004]);

async function handleSendError(table, sub, error, client) {
  console.error(`Failed to send to guild ${sub.guild_id}:`, error.message);
  if (!DEAD_CODES.has(error.code)) return;
  if (!client?.guilds.cache.has(sub.guild_id)) return;

  const { error: deleteError } = await supabase.from(table).delete().eq('guild_id', sub.guild_id);
  if (deleteError) {
    console.error(`Failed to remove dead subscription for guild ${sub.guild_id}:`, deleteError.message);
  } else {
    console.log(`Removed dead ${table} row for guild ${sub.guild_id}`);
  }
}

module.exports = { handleSendError };
