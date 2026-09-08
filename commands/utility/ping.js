const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Check the bot's latency"),

  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(BRAND_COLOR)
      .addFields(
        { name: 'Latency', value: `${latency}ms`, inline: true },
        { name: 'API', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
      );
    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
