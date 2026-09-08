# Discord Server Bot

[**Invite this bot to your server**](https://discord.com/oauth2/authorize?client_id=1546521909376843816&permissions=1099511719942&integration_type=0&scope=bot+applications.commands) — free, open source, and ready to use.

A general-purpose Discord bot built with discord.js v14 — moderation, quality-of-life, and fun slash commands.

## Commands

**Moderation** (requires the relevant permission to use)
- `/kick <target> [reason]`
- `/ban <target> [reason]`
- `/timeout <target> <minutes> [reason]`
- `/clear <amount>` — bulk delete messages

**Fun**
- `/8ball <question>`
- `/coinflip`
- `/dice [sides]`

**Utility**
- `/ping`
- `/userinfo [target]`
- `/serverinfo`
- `/avatar [target]`

## Self-Hosting / Development

Want to run your own copy — for development, contributing, or hosting independently instead of using the public bot? Follow these steps.

### 1. Create your own bot on Discord's Developer Portal
1. Go to https://discord.com/developers/applications and click **New Application**.
2. Go to the **Bot** tab → **Reset Token** → copy it (this is your `DISCORD_TOKEN`). Keep it secret.
3. On the same **Bot** tab, enable these under **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
4. Go to **OAuth2** and copy the **Client ID** (this is your `CLIENT_ID`).
5. Go to **OAuth2 → URL Generator**, check `bot` and `applications.commands` scopes, then under Bot Permissions check at least: Kick Members, Ban Members, Moderate Members, Manage Messages, Send Messages, Read Message History, Embed Links.
6. Open the generated URL and invite the bot to your own test server.
7. Right-click your test server icon (with Developer Mode on, in User Settings → Advanced) and **Copy Server ID** — this is your `GUILD_ID`, used for instant local command deployment.

### 2. Install dependencies
```bash
npm install

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```
```
DISCORD_TOKEN=your-bot-token-here
CLIENT_ID=your-application-client-id-here
GUILD_ID=your-test-server-id-here
```
Never commit `.env` or share your token — it's already in `.gitignore`.

### 4. Register the slash commands
```bash
npm run deploy
```
If `GUILD_ID` is set, commands deploy instantly to that one server — ideal for testing. Leave `GUILD_ID` unset to deploy globally to every server the bot is in (takes up to an hour to propagate).

### 5. Run the bot
```bash
npm start
```
You should see `Logged in as <YourBot>#0000` in the console. Try `/ping` in your test server.

## Adding new commands
Drop a new file in `commands/moderation/`, `commands/fun/`, or `commands/utility/` following the same `{ data, execute }` shape as the existing ones — `index.js` loads every file in those folders automatically. Run `npm run deploy` again after adding one.

## Contributing
Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License
Licensed under the [Apache License 2.0](LICENSE).

## Notes
- Moderation commands respect Discord's role hierarchy — the bot's role must sit above the target's highest role, and `setDefaultMemberPermissions` hides each command from members without that permission.
- `/clear` only bulk-deletes messages younger than 14 days (a Discord API limit).
