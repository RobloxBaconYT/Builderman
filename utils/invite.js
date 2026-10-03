const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

const isUrl = (value) => /^https?:\/\//.test(value || '');

function getInviteUrl(client) {
  const permissions = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks;
  return `https://discord.com/oauth2/authorize?client_id=${client.application.id}&scope=bot%20applications.commands&permissions=${permissions}`;
}

// Invite button, plus optional Support/Vote buttons if SUPPORT_URL / TOPGG_URL are set in .env.
function getLinkRow(client) {
  const buttons = [new ButtonBuilder().setLabel('Invite Builderman').setStyle(ButtonStyle.Link).setURL(getInviteUrl(client))];
  if (isUrl(process.env.SUPPORT_URL)) {
    buttons.push(new ButtonBuilder().setLabel('Support / Feedback').setStyle(ButtonStyle.Link).setURL(process.env.SUPPORT_URL));
  }
  if (isUrl(process.env.TOPGG_URL)) {
    buttons.push(new ButtonBuilder().setLabel('Vote on top.gg').setStyle(ButtonStyle.Link).setURL(process.env.TOPGG_URL));
  }
  return new ActionRowBuilder().addComponents(buttons);
}

module.exports = { getInviteUrl, getLinkRow };
