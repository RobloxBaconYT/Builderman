# Discord Server Bot

A general-purpose Discord bot built with discord.js v14 — moderation, quality-of-life, and fun slash commands.

## What's included

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

## Setup

### 1. Create the bot on Discord's Developer Portal
1. Go to https://discord.com/developers/applications and click **New Application**.
2. Go to the **Bot** tab → **Reset Token** → copy it (this is your `DISCORD_TOKEN`). Keep it secret.
3. On the same **Bot** tab, enable these under **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
4. Go to **OAuth2 → General** and copy the **Client ID** (this is your `CLIENT_ID`).
5. Go to **OAuth2 → URL Generator**, check `bot` and `applications.commands` scopes, then under Bot Permissions check at least: Kick Members, Ban Members, Moderate Members, Manage Messages, Send Messages, Read Message History, Embed Links.
6. Open the generated URL in your browser and invite the bot to your server.
7. Right-click your server icon in Discord (with Developer Mode on, in User Settings → Advanced) and **Copy Server ID** — this is your `GUILD_ID`, used for fast local command deployment.

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in the three values:
```bash
cp .env.example .env
```
```
DISCORD_TOKEN=your-bot-token-here
CLIENT_ID=your-application-client-id-here
GUILD_ID=your-test-server-id-here
```
Never commit `.env` or share your token — add `.env` to `.gitignore`.

### 4. Register the slash commands
```bash
npm run deploy
```
This registers commands to your one test server (`GUILD_ID`) so they show up instantly. For a bot in many servers, switch `deploy-commands.js` to `Routes.applicationCommands(CLIENT_ID)` for global commands (these take up to an hour to propagate).

### 5. Run the bot
```bash
npm start
```
You should see `Logged in as <YourBot>#0000` in the console. Try `/ping` in your server.

## Adding new commands
Drop a new file in `commands/moderation/`, `commands/fun/`, or `commands/utility/` following the same `{ data, execute }` shape as the existing ones — `index.js` loads every file in those folders automatically. Run `npm run deploy` again after adding one.

## Notes
- Moderation commands respect Discord's role hierarchy — the bot's role must sit above the target's highest role, and `setDefaultMemberPermissions` hides each command from members without that permission.
- `/clear` only bulk-deletes messages younger than 14 days (a Discord API limit).
