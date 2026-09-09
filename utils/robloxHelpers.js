function extractPlaceId(input) {
  const urlMatch = input.match(/roblox\.com\/games\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  if (/^\d+$/.test(input.trim())) return input.trim();
  return null;
}

module.exports = { extractPlaceId };
