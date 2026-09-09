# 🎮 Builderman



![License](https://img.shields.io/badge/license-Apache%202.0-blue)




![discord.js](https://img.shields.io/badge/built%20with-discord.js%20v14-blueviolet)



[**Invite this bot to your server**](https://discord.com/oauth2/authorize?client_id=1546521909376843816) — free, open source, and ready to use.

A Discord bot built for Roblox communities — look up any Roblox user or game instantly, and get official Roblox platform news delivered straight to your server.

## Features
- 🎮 Live Roblox user and game lookups, right in Discord
- 📰 Official Roblox DevForum news, auto-posted or on demand
- ⚡ Stable — crash-protected, rate-limit aware, cooldown-protected

## Commands

**🎮 Roblox Lookups**
- `/robloxuser <username>` — look up a Roblox account
- `/robloxgame <place-id-or-link>` — look up a Roblox game/experience

**📰 News**
- `/setnews [channel]` — get official Roblox DevForum updates posted here (requires Manage Server)
- `/stopnews` — stop the news feed (requires Manage Server)
- `/latestnews` — see the 3 most recent DevForum posts on demand, no subscription needed

**🔧 Utility**
- `/ping`
- `/help`

## Self-Hosting / Development

Want to run your own copy — for development, contributing, or hosting independently instead of using the public bot? Follow these steps.

### 1. Create your own bot on Discord's Developer Portal
1. Go to https://discord.com/developers/applications and click **New Application**.
2. Go to the **Bot** tab → **Reset Token** → copy it (this is your `DISCORD_TOKEN`). Keep it secret.
3. Go to **OAuth2** and copy the **Client ID** (this is your `CLIENT_ID`).
4. Go to **Installation**, and under Default Install Settings check scopes `bot` and `applications.commands`, then Bot Permissions: Send Messages, Embed Links, Read Message History.
5. Use the install link shown there to invite the bot to your own test server.
6. Right-click your test server icon (with Developer Mode on, in User Settings → Advanced) and **Copy Server ID** — this is your `GUILD_ID`, used for instant local command deployment.

### 2. Set up a Supabase database
The news feature needs somewhere to remember which servers are subscribed. Create a free project at https://supabase.com, then in the SQL Editor run:
```sql
create table news_subscriptions (id bigint generated always as identity primary key, guild_id text not null unique, channel_id text not null, created_at timestamptz default now());
create table feed_state (source text primary key, last_item_link text, updated_at timestamptz default now());
```
Grab your **Project URL** and **secret key** (`sb_secret_...`, under Settings → API Keys → Publishable and secret API keys — not the legacy keys, which Supabase is deprecating).

### 3. Install dependencies
```bash
npm install
```

### 4. Configure environment variables
```bash
cp .env.example .env
```
```
DISCORD_TOKEN=your-bot-token-here
CLIENT_ID=your-application-client-id-here
GUILD_ID=your-test-server-id-here
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-secret-key
```
Never commit `.env` or share your token — it's already in `.gitignore`.

### 5. Register the slash commands
```bash
npm run deploy
```
If `GUILD_ID` is set, commands deploy instantly to that one server. Leave it unset to deploy globally (takes up to an hour).

### 6. Run the bot
```bash
npm start
```

### A note for Android/Termux developers
Use a **separate bot application** for local dev — never share a token with a deployed copy. Run `termux-wake-lock` before starting the bot, and keep Termux visible on-screen (e.g. split-screen with Discord) while testing — Android suspends backgrounded terminal sessions even with the wake lock held.

## Adding new commands
Drop a new file in `commands/roblox/` or `commands/utility/` following the same `{ data, execute }` shape as the existing ones — `index.js` loads every file automatically.

## Contributing
Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License
Licensed under the [Apache License 2.0](LICENSE).

## Notes
- Roblox lookup commands time out gracefully after 8 seconds and handle Roblox's rate limiting with a clear message instead of failing silently.
- The news checker runs every 10 minutes and only announces posts published after the bot's first-ever check — it won't backfill old history into a server that just subscribed.
