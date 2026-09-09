const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { supabase } = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stopstatus')
    .setDescription('Stop Roblox status alerts in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const { data, error } = await supabase
        .from('status_subscriptions')
        .delete()
        .eq('guild_id', interaction.guildId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return interaction.reply({ content: "This server isn't subscribed to status alerts.", flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle('🚦 Roblox Status Alerts Disabled')
        .setColor(BRAND_COLOR)
        .setDescription('This server will no longer receive Roblox status alerts.');

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Something went wrong disabling status alerts.', flags: 64 });
    }
  },
};
