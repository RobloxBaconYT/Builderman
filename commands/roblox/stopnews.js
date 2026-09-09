const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { supabase } = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopnews')
    .setDescription('Stop Roblox news updates in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const { data, error } = await supabase
        .from('news_subscriptions')
        .delete()
        .eq('guild_id', interaction.guildId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return interaction.reply({ content: 'This server isn\'t subscribed to news updates.', flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle('📰 Roblox News Disabled')
        .setColor(BRAND_COLOR)
        .setDescription('This server will no longer receive Roblox DevForum updates.');

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Something went wrong disabling the news feed.', flags: 64 });
    }
  },
};
