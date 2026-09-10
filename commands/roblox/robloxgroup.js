const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robloxgroup')
    .setDescription('Look up a Roblox group')
    .addStringOption((option) =>
      option.setName('groupid').setDescription('The Roblox group ID').setRequired(true),
    ),
  cooldown: 5,

  async execute(interaction) {
    const groupId = interaction.options.getString('groupid').trim();

    if (!/^\d+$/.test(groupId)) {
      return interaction.reply({ content: 'Please provide a valid numeric group ID.', flags: 64 });
    }

    await interaction.deferReply();

    try {
      const [groupRes, iconRes] = await Promise.all([
        fetchWithTimeout(`https://groups.roblox.com/v1/groups/${groupId}`),
        fetchWithTimeout(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png`),
      ]);

      const group = await groupRes.json();
      const iconData = await iconRes.json();

      if (!group || group.errors) {
        return interaction.editReply('Could not find a group with that ID.');
      }

      const iconUrl = iconData.data?.[0]?.imageUrl;
      const description = group.description?.trim() || 'No description set.';

      const embed = new EmbedBuilder()
        .setTitle(`${group.name}${group.owner?.hasVerifiedBadge ? ' ✅' : ''}`)
        .setURL(`https://www.roblox.com/groups/${groupId}`)
        .setThumbnail(iconUrl || null)
        .setDescription(description.length > 300 ? `${description.slice(0, 300)}...` : description)
        .addFields(
          { name: 'Members', value: `${group.memberCount?.toLocaleString() ?? 'N/A'}`, inline: true },
          { name: 'Owner', value: group.owner?.username ? `@${group.owner.username}` : 'None (unowned)', inline: true },
          { name: 'Public Entry', value: group.publicEntryAllowed ? 'Yes' : 'No', inline: true },
        )
        .setColor(BRAND_COLOR)
        .setFooter({ text: `Group ID: ${groupId}` });

      if (group.shout?.body) {
        embed.addFields({
          name: '📢 Latest Shout',
          value: `${group.shout.body.slice(0, 200)}${group.shout.body.length > 200 ? '...' : ''}\n— ${group.shout.poster?.username ? `@${group.shout.poster.username}` : 'Unknown'}`,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      let message = 'Something went wrong looking up that group. Try again in a moment.';
      if (error.name === 'AbortError') {
        message = 'Roblox took too long to respond. Try again in a moment.';
      } else if (error.status === 429) {
        message = 'Roblox is rate-limiting requests right now. Try again in a minute.';
      }
      await interaction.editReply(message);
    }
  },
};
