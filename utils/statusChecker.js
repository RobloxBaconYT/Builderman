const { fetchWithTimeout } = require('./fetchWithTimeout');
const { supabase } = require('./supabase');
const { handleSendError } = require('./subscriptions');

const SERVICES = [
  { name: 'Users API', url: 'https://users.roblox.com/v1/users/1' },
  { name: 'Games API', url: 'https://games.roblox.com/v1/games?universeIds=1' },
  { name: 'Thumbnails API', url: 'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=1&size=150x150&format=Png' },
  { name: 'DevForum', url: 'https://devforum.roblox.com' },
];

const FAILURES_TO_CONFIRM_DOWN = 2;

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

function logWrite(label, { error }) {
  if (error) console.error(`Status write failed (${label}):`, error.message);
}

async function isServiceUp(service) {
  try {
    await fetchWithTimeout(service.url, {}, 6000);
    return true;
  } catch (error) {
    return error.status === 429; // rate-limited still means the service answered
  }
}

async function checkServiceStatus(client) {
  try {
    const rows = unwrap(await supabase.from('service_status').select('*'));
    const subs = unwrap(await supabase.from('status_subscriptions').select('*'));
    const stateByName = new Map((rows || []).map((r) => [r.service_name, r]));
    const results = await Promise.all(SERVICES.map(isServiceUp));

    const newlyDown = [];
    const newlyUp = [];

    for (const [index, service] of SERVICES.entries()) {
      const stored = stateByName.get(service.name);
      const isUp = results[index];

      if (!stored) {
        // Always start as 'up'; a failure here counts toward the threshold like any other.
        logWrite(
          service.name,
          await supabase.from('service_status').insert({
            service_name: service.name,
            status: 'up',
            consecutive_failures: isUp ? 0 : 1,
          }),
        );
        continue;
      }

      if (isUp) {
        if (stored.status === 'down') newlyUp.push(service.name);
        logWrite(
          service.name,
          await supabase
            .from('service_status')
            .update({
              status: 'up',
              consecutive_failures: 0,
              last_changed: stored.status === 'down' ? new Date() : stored.last_changed,
              updated_at: new Date(),
            })
            .eq('service_name', service.name),
        );
        continue;
      }

      const failures = (stored.consecutive_failures || 0) + 1;
      const confirmedDown = failures >= FAILURES_TO_CONFIRM_DOWN && stored.status !== 'down';
      if (confirmedDown) newlyDown.push(service.name);

      logWrite(
        service.name,
        await supabase
          .from('service_status')
          .update(
            confirmedDown
              ? { status: 'down', consecutive_failures: failures, last_changed: new Date(), updated_at: new Date() }
              : { consecutive_failures: failures, updated_at: new Date() },
          )
          .eq('service_name', service.name),
      );
    }

    if (newlyDown.length > 0) await announceChange(client, subs, newlyDown, 'down');
    if (newlyUp.length > 0) await announceChange(client, subs, newlyUp, 'up');
  } catch (error) {
    console.error('Error checking Roblox service status:', error);
  }
}

async function announceChange(client, subs, serviceNames, newStatus) {
  const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;
  const list = serviceNames.join(', ');
  const verb = serviceNames.length > 1 ? 'are' : 'is';
  const content =
    newStatus === 'down'
      ? `As of ${timestamp}, **${list}** ${verb} **down**. 🔴`
      : `As of ${timestamp}, **${list}** ${verb} **back up**. 🟢`;

  for (const sub of subs || []) {
    try {
      const channel = await client.channels.fetch(sub.channel_id);
      await channel.send({ content });
    } catch (sendError) {
      await handleSendError('status_subscriptions', sub, sendError, client);
    }
  }
}

module.exports = { checkServiceStatus };
