// Resolves a fetch promise to parsed JSON, or null if anything fails.
// Use for cosmetic data (thumbnails, counts) that shouldn't break a command.
async function optionalJson(promise) {
  try {
    const res = await promise;
    return await res.json();
  } catch {
    return null;
  }
}

module.exports = { optionalJson };
