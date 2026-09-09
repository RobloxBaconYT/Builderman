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

function compareCategory(label, emoji, value1, value2, format, p1Name, p2Name) {
  if (value1 === value2) {
    return { line: `${emoji} **${label}**\n🤝 Tied — ${format(value1)}`, winner: null };
  }
  const p1Wins = value1 > value2;
  const winnerName = p1Wins ? p1Name : p2Name;
  return {
    line: `${emoji} **${label}**\n🥇 ${winnerName} — ${format(p1Wins ? value1 : value2)}\n🥈 ${p1Wins ? p2Name : p1Name} — ${format(p1Wins ? value2 : value1)}`,
    winner: p1Wins ? 1 : 2,
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

      const p1 = profile1.displayName;
      const p2 = profile2.displayName;
      let score1 = 0;
      let score2 = 0;
      const sections = [];

      const ageResult = compareCategory(
        'Account Age', '🏆',
        -profile1.created.getTime(), -profile2.created.getTime(),
        () => '', p1, p2,
      );
      sections.push(
        `🏆 **Account Age**\n${
          profile1.created.getTime() === profile2.created.getTime()
            ? `🤝 Tied`
            : profile1.created < profile2.created
            ? `🥇 ${p1} — <t:${Math.floor(profile1.created.getTime() / 1000)}:R>\n🥈 ${p2} — <t:${Math.floor(profile2.created.getTime() / 1000)}:R>`
            : `🥇 ${p2} — <t:${Math.floor(profile2.created.getTime() / 1000)}:R>\n🥈 ${p1} — <t:${Math.floor(profile1.created.getTime() / 1000)}:R>`
        }`,
      );
      if (profile1.created.getTime() !== profile2.created.getTime()) {
        profile1.created < profile2.created ? score1++ : score2++;
      }

      const friendsResult = compareCategory('Friends', '👥', profile1.friendsCount, profile2.friendsCount, (v) => `${v}`, p1, p2);
      sections.push(friendsResult.line);
      if (friendsResult.winner === 1) score1++;
      if (friendsResult.winner === 2) score2++;

      const followersResult = compareCategory('Followers', '👣', profile1.followersCount, profile2.followersCount, (v) => `${v}`, p1, p2);
      sections.push(followersResult.line);
      if (followersResult.winner === 1) score1++;
      if (followersResult.winner === 2) score2++;

      if (profile1.hasVerifiedBadge !== profile2.hasVerifiedBadge) {
        const verifiedName = profile1.hasVerifiedBadge ? p1 : p2;
        sections.push(`✅ **Verified Badge**\n🥇 ${verifiedName}`);
        profile1.hasVerifiedBadge ? score1++ : score2++;
      }

      const winnerLine =
        score1 === score2
          ? "🤝 **It's an overall tie!**"
          : `👑 **Overall Winner: ${score1 > score2 ? p1 : p2}** (${Math.max(score1, score2)}-${Math.min(score1, score2)})`;

      const embed = new EmbedBuilder()
        .setAuthor({ name: p1, iconURL: profile1.avatarUrl || undefined, url: `https://www.roblox.com/users/${profile1.userId}/profile` })
        .setThumbnail(profile2.avatarUrl || null)
        .setTitle(`🆚 ${p1} vs ${p2}`)
        .setColor(BRAND_COLOR)
        .setDescription(`${sections.join('\n\n')}\n\n${winnerLine}`)
        .setFooter({ text: `${p2}'s profile linked via thumbnail` });

      await interaction.editReply({ embeds: [embed] });
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
