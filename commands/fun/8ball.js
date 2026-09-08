const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BRAND_COLOR } = require('../../utils/constants');

const responses = [
  'It is certain.', 'Without a doubt.', 'Yes, definitely.', 'You may rely on it.',
  'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Signs point to yes.',
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
  'Cannot predict now.', "Don't count on it.", 'My reply is no.',
  'My sources say no.', 'Outlook not so good.', 'Very doubtful.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption((option) =>
      option.setName('question').setDescription('Your question').setRequired(true),
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder()
      .setTitle('🎱 Magic 8-Ball')
      .setColor(BRAND_COLOR)
      .addFields(
        { name: 'Question', value: question },
        { name: 'Answer', value: answer },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
