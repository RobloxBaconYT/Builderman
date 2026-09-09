const { EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('./constants');
const { fetchWithTimeout } = require('./fetchWithTimeout');
const { supabase } = require('./supabase');

const SERVICES = [
  { name: 'Users API', url: 'https://users.roblox.com/v1/users/1' },
  { name: 'Games API', url: 'https://games.roblox.com/v1/games?universeIds=1' },
  { name: 'Thumbnails API', url: 'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=1&size=150x150&format=Png' },
  { name: 'DevForum', url: 'https://devforum.roblox.com' },
];

const FAILURES_TO_CONFIRM_DOWN = 2;

async function checkServiceStatus(client) {
  try {
    const { data: rows } = await supabase.from('service_status').select('*');
    const stateByName = new Map((rows || []).map((r) => [r.service_name, r]));
    const { data: subs } = await supabase.from('status_subscriptions').select('*');

    for (const service of SERVICES) {
      const stored = stateByName.get(service.name);
      let isUp = true;

      try {
        await fetchWithTimeout(service.url, {}, 6000);
      } catch {
        isUp = false;
      }

      if (!stored) {
        await supabase.from('service_status').insert({
          service_name: service.name,
          status: isUp ? 'up' : 'down',
          consecutive_failures: isUp ? 0 : 1,
        });
        continue;
      }

      if (isUp) {
        if (stored.status === 'down') {
          await announceChange(client, subs, service.name, 'up');
        }
        await supabase
          .from('service_status')
          .update({ status: 'up', consecutive_failures: 0, last_changed: stored.status === 'down' ? new Date() : stored.last_changed, updated_at: new Date() })
          .eq('service_name', service.name);
      } else {
        const failures = stored.consecutive_failures + 1;
        if (failures >= FAILURES_TO_CONFIRM_DOWN && stored.status !== 'down') {
          await announceChange(client, subs, service.name, 'down');
          await supabase
            .from('service_status')
            .update({ status: 'down', consecutive_failures: failures, last_changed: new Date(), updated_at: new Date() })
            .eq('service_name', service.name);
        } else {
          await supabase
            .from('service_status')
            .update({ consecutive_failures: failures, updated_at: new Date() })
            .eq('service_name', service.name);
        }
      }
    }
  } catch (error) {
    console.error('Error checking Roblox service status:', error);
  }
}

async function announceChange(client, subs, serviceName, newStatus) {
  const embed = new EmbedBuilder()
    .setTitle(newStatus === 'down' ? `🔴 ${serviceName} is down` : `🟢 ${serviceName} is back up`)
    .setColor(newStatus === 'down' ? 0xed4245 : 0x57f287)
    .setTimestamp();

  for (const sub of subs || []) {
    try {
      const channel = await client.channels.fetch(sub.channel_id);
      await channel.send({ embeds: [embed] });
    } catch (sendError) {
      console.error(`Failed to send status alert to guild ${sub.guild_id}:`, sendError.message);
    }
  }
}

module.exports = { checkServiceStatus };
