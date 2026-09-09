const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');

async function getRobloxProfile(username) {
  const lookupRes = await fetchWithTimeout('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  const lookupData = await lookupRes.json();
  if (!lookupData.data || lookupData.data.length === 0) return null;

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

  return {
    userId,
    name,
    displayName,
    hasVerifiedBadge,
    avatarUrl: avatarData.data?.[0]?.imageUrl,
    created: new Date(profile.created),
    friendsCount: friends.count ?? 0,
    followersCount: followers.count ?? 0,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robloxcompare')
    .setDescription('Compare two Roblox users side by side')
    .addStringOption((option) =>
      option.setName('user1').setDescription('First Roblox username').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('user2').setDescription('Second Roblox username').setRequired(true),
    ),
  cooldown: 5,

  async execute(interaction) {
    const username1 = interaction.options.getString('user1');
    const username2 = interaction.options.getString('user2');

    await interaction.deferReply();

    try {
      const [profile1, profile2] = await Promise.all([
        getRobloxProfile(username1),
        getRobloxProfile(username2),
      ]);

      if (!profile1) {
        return interaction.editReply(`No Roblox user found with the username **${username1}**.`);
      }
      if (!profile2) {
        return interaction.editReply(`No Roblox user found with the username **${username2}**.`);
      }

      const olderAccount = profile1.created < profile2.created ? profile1 : profile2;
      const moreFriends =
        profile1.friendsCount === profile2.friendsCount
          ? null
          : profile1.friendsCount > profile2.friendsCount
          ? profile1
          : profile2;
      const moreFollowers =
        profile1.followersCount === profile2.followersCount
          ? null
          : profile1.followersCount > profile2.followersCount
          ? profile1
          : profile2;

      const embed1 = new EmbedBuilder()
        .setTitle(`${profile1.displayName}${profile1.hasVerifiedBadge ? ' ✅' : ''} (@${profile1.name})`)
        .setURL(`https://www.roblox.com/users/${profile1.userId}/profile`)
        .setThumbnail(profile1.avatarUrl || null)
        .setColor(BRAND_COLOR)
        .addFields(
          { name: 'Account Created', value: `<t:${Math.floor(profile1.created.getTime() / 1000)}:R>`, inline: true },
          { name: 'Friends', value: `${profile1.friendsCount}`, inline: true },
          { name: 'Followers', value: `${profile1.followersCount}`, inline: true },
        );

      const embed2 = new EmbedBuilder()
        .setTitle(`${profile2.displayName}${profile2.hasVerifiedBadge ? ' ✅' : ''} (@${profile2.name})`)
        .setURL(`https://www.roblox.com/users/${profile2.userId}/profile`)
        .setThumbnail(profile2.avatarUrl || null)
        .setColor(BRAND_COLOR)
        .addFields(
          { name: 'Account Created', value: `<t:${Math.floor(profile2.created.getTime() / 1000)}:R>`, inline: true },
          { name: 'Friends', value: `${profile2.friendsCount}`, inline: true },
          { name: 'Followers', value: `${profile2.followersCount}`, inline: true },
        );

      const summaryLines = [
        `🏆 Older account: **${olderAccount.displayName}**`,
        moreFriends ? `👥 More friends: **${moreFriends.displayName}**` : `👥 Friends: tied`,
        moreFollowers ? `👣 More followers: **${moreFollowers.displayName}**` : `👣 Followers: tied`,
      ];

      await interaction.editReply({
        content: `🆚 **${profile1.displayName} vs ${profile2.displayName}**\n${summaryLines.join('\n')}`,
        embeds: [embed1, embed2],
      });
    } catch (error) {
      console.error(error);
      let message = 'Something went wrong comparing those users. Try again in a moment.';
      if (error.name === 'AbortError') {
        message = 'Roblox took too long to respond. Try again in a moment.';
      } else if (error.status === 429) {
        message = 'Roblox is rate-limiting requests right now. Try again in a minute.';
      }
      await interaction.editReply(message);
    }
  },
};
