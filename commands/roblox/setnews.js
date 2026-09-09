const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { supabase } = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setnews')
    .setDescription('Get official Roblox DevForum updates posted in this server')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Channel to post news in (defaults to this channel)').addChannelTypes(ChannelType.GuildText).setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      const { error } = await supabase
        .from('news_subscriptions')
        .upsert({ guild_id: interaction.guildId, channel_id: channel.id }, { onConflict: 'guild_id' });

      if (error) throw error;

      const embed = new EmbedBuilder()
        .setTitle('📰 Roblox News Enabled')
        .setColor(BRAND_COLOR)
        .setDescription(`Official Roblox DevForum updates will now post in ${channel}.`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Something went wrong setting up the news feed.', flags: 64 });
    }
  },
};
