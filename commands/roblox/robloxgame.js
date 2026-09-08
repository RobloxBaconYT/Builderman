const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');

function extractPlaceId(input) {
  const urlMatch = input.match(/roblox\.com\/games\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  if (/^\d+$/.test(input.trim())) return input.trim();
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robloxgame')
    .setDescription('Look up a Roblox game/experience')
    .addStringOption((option) =>
      option.setName('game').setDescription('Place ID or roblox.com/games/... link').setRequired(true),
    ),

  cooldown: 5,
  async execute(interaction) {
    const input = interaction.options.getString('game');
    const placeId = extractPlaceId(input);

    if (!placeId) {
      return interaction.reply({
        content: 'Please provide a valid Place ID (the number in a roblox.com/games/... link) or paste the link itself.',
        flags: 64,
      });
    }

    await interaction.deferReply();

    try {
      const universeRes = await fetchWithTimeout(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
      const universeData = await universeRes.json();
      const universeId = universeData.universeId;

      if (!universeId) {
        return interaction.editReply('Could not find a game with that Place ID.');
      }

      const [gameRes, votesRes, iconRes] = await Promise.all([
        fetchWithTimeout(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
        fetchWithTimeout(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`),
        fetchWithTimeout(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`),
      ]);

      const gameData = await gameRes.json();
      const votesData = await votesRes.json();
      const iconData = await iconRes.json();

      const game = gameData.data?.[0];

      if (!game) {
        return interaction.editReply('Found the game, but Roblox returned no details for it.');
      }

      const votes = votesData.data?.[0];
      const iconUrl = iconData.data?.[0]?.imageUrl;

      const upVotes = votes?.upVotes ?? 0;
      const downVotes = votes?.downVotes ?? 0;
      const totalVotes = upVotes + downVotes;
      const ratingPercent = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : null;

      const bio = game.description?.trim() || 'No description set.';

      const embed = new EmbedBuilder()
        .setTitle(game.name)
        .setURL(`https://www.roblox.com/games/${placeId}`)
        .setThumbnail(iconUrl || null)
        .setDescription(bio.length > 300 ? `${bio.slice(0, 300)}...` : bio)
        .addFields(
          { name: 'Playing Now', value: `${game.playing?.toLocaleString() ?? 'N/A'}`, inline: true },
          { name: 'Total Visits', value: `${game.visits?.toLocaleString() ?? 'N/A'}`, inline: true },
          { name: 'Rating', value: ratingPercent !== null ? `👍 ${ratingPercent}%` : 'N/A', inline: true },
          { name: 'Creator', value: game.creator?.name || 'Unknown', inline: true },
          { name: 'Genre', value: game.genre || 'N/A', inline: true },
          { name: 'Max Players', value: `${game.maxPlayers ?? 'N/A'}`, inline: true },
        )
        .setColor(BRAND_COLOR)
        .setFooter({ text: `Place ID: ${placeId} | Universe ID: ${universeId}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View Game')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/games/${placeId}`),
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error(error);
      let message = 'Something went wrong looking up that game. Try again in a moment.';
      if (error.name === 'AbortError') {
        message = 'Roblox took too long to respond. Try again in a moment.';
      } else if (error.status === 429) {
        message = 'Roblox is rate-limiting requests right now. Try again in a minute.';
      }
      await interaction.editReply(message);
    }
  },
};
