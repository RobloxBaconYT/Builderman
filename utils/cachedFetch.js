const { fetchWithTimeout } = require('./fetchWithTimeout');

const TTL_MS = 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map(); // key -> { expires, body }
const inflight = new Map(); // key -> Promise<string>

// Drop-in for fetchWithTimeout: same arguments, same error behaviour,
// but successful responses are reused for 60s and identical in-flight requests are shared.
async function cachedFetch(url, options = {}, timeoutMs) {
  const key = `${options.method || 'GET'} ${url} ${options.body || ''}`;

  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return new Response(hit.body, { status: 200 });

  let pending = inflight.get(key);
  if (!pending) {
    pending = fetchWithTimeout(url, options, timeoutMs)
      .then(async (res) => {
        const body = await res.text();
        if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
        cache.set(key, { expires: Date.now() + TTL_MS, body });
        return body;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }

  return new Response(await pending, { status: 200 });
}

module.exports = { cachedFetch };
