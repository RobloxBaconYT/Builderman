# Contributing

Thanks for considering contributing to this bot! Contributions of all sizes are welcome, bug fixes, new commands, documentation improvements.

## Getting started

1. Fork this repo and clone your fork
2. Follow the setup steps in `README.md` to get a test bot running (you'll need your own Discord application/token for local testing, never use the production bot's token)
3. Create a branch for your change: `git checkout -b feature/your-feature-name`

## Adding a new command

Drop a new file in the matching subfolder under `commands/` (`roblox/` or `utility/`) following this shape:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('What it does'),
  async execute(interaction) {
    // command logic
  },
};```


index.js auto-loads every file in those folders, no registration needed elsewhere. Run npm run deploy against your own test server to see it appear.
Style

Keep commands focused, one command, one job
Use interaction.reply() for quick responses; ephemeral: true for anything only the command user should see (errors, moderation confirmations)
Match the existing code style (2-space indent, semicolons)

## Submitting changes
Commit with a clear message describing the change
Push to your fork and open a pull request against main
Describe what the change does and why in the PR description

## Reporting bugs / requesting features
Open an issue with as much detail as you can, steps to reproduce for bugs, or the use case for feature requests.

## Code of conduct
Be respectful. No harassment, no spam PRs, no malicious code (obviously).
