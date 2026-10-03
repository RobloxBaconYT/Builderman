const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');
const { supabase } = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setstatus')
    .setDescription('Get alerted here when key Roblox services go down or recover')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Channel to post alerts in (defaults to this channel)').addChannelTypes(ChannelType.GuildText).setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'This command only works in a server.', flags: 64 });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const guild = interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId));
    const me = guild.members.me ?? (await guild.members.fetchMe());
    const needed = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];

    if (!channel.permissionsFor(me)?.has(needed)) {
      return interaction.reply({
        content: `I need **View Channel** and **Send Messages** in ${channel} first.`,
        flags: 64,
      });
    }

    try {
      const { error } = await supabase
        .from('status_subscriptions')
        .upsert({ guild_id: interaction.guildId, channel_id: channel.id }, { onConflict: 'guild_id' });

      if (error) throw error;

      const embed = new EmbedBuilder()
        .setTitle('🚦 Roblox Status Alerts Enabled')
        .setColor(BRAND_COLOR)
        .setDescription(`Alerts for Roblox service outages/recoveries will post in ${channel}.`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Something went wrong setting up status alerts.', flags: 64 });
    }
  },
};
