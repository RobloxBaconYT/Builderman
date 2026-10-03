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
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'This command only works in a server.', flags: 64 });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const guild = interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId));
    const me = guild.members.me ?? (await guild.members.fetchMe());
    const needed = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

    if (!channel.permissionsFor(me)?.has(needed)) {
      return interaction.reply({
        content: `I need **View Channel**, **Send Messages** and **Embed Links** in ${channel} first.`,
        flags: 64,
      });
    }

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
