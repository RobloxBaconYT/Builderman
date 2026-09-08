const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robloxuser')
    .setDescription('Look up a Roblox user profile')
    .addStringOption((option) =>
      option.setName('username').setDescription('The Roblox username to look up').setRequired(true),
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    await interaction.deferReply();

    try {
      const lookupRes = await fetchWithTimeout('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      });
      const lookupData = await lookupRes.json();

      if (!lookupData.data || lookupData.data.length === 0) {
        return interaction.editReply(`No Roblox user found with the username **${username}**.`);
      }

      const { id: userId, name, displayName, hasVerifiedBadge } = lookupData.data[0];

      const [profileRes, avatarRes, friendsRes, followersRes] = await Promise.all([
        fetchWithTimeout(`https://users.roblox.com/v1/users/${userId}`),
        fetchWithTimeout(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
        fetchWithTimeout(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
        fetchWithTimeout(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
      ]);

      const profile = await profileRes.json();
      const avatarData = await avatarRes.json();
      const friends = await friendsRes.json();
      const followers = await followersRes.json();

      const avatarUrl = avatarData.data?.[0]?.imageUrl;
      const created = new Date(profile.created);
      const bio = profile.description?.trim() || 'No bio set.';

      const embed = new EmbedBuilder()
        .setTitle(`${displayName}${hasVerifiedBadge ? ' ✅' : ''} (@${name})`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setThumbnail(avatarUrl || null)
        .setDescription(bio.length > 300 ? `${bio.slice(0, 300)}...` : bio)
        .addFields(
          { name: 'Account Created', value: `<t:${Math.floor(created.getTime() / 1000)}:R>`, inline: true },
          { name: 'Friends', value: `${friends.count ?? 'N/A'}`, inline: true },
          { name: 'Followers', value: `${followers.count ?? 'N/A'}`, inline: true },
        )
        .setColor(BRAND_COLOR)
        .setFooter({ text: `Roblox User ID: ${userId}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View Profile')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/users/${userId}/profile`),
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error(error);
      let message = 'Something went wrong looking up that Roblox user. Try again in a moment.';
      if (error.name === 'AbortError') {
        message = 'Roblox took too long to respond. Try again in a moment.';
      } else if (error.status === 429) {
        message = 'Roblox is rate-limiting requests right now. Try again in a minute.';
      }
      await interaction.editReply(message);
    }
  },
};
