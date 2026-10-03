const { supabase } = require('./supabase');

// Records which command ran (and whether it crashed) plus the server ID. No user data.
// Skipped when DISABLE_BACKGROUND_JOBS=true so local testing doesn't pollute the stats.
async function logUsage(interaction, ok) {
  if (process.env.DISABLE_BACKGROUND_JOBS === 'true') return;
  try {
    const { error } = await supabase
      .from('command_usage')
      .insert({ command: interaction.commandName, guild_id: interaction.guildId, guild_name: interaction.guild?.name ?? null, ok });
    if (error) throw error;
  } catch (error) {
    console.error('Usage log failed:', error.message);
  }
}

module.exports = { logUsage };
