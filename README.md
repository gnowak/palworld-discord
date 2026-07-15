# Palworld VM Manager Discord Bot

A lightweight Discord bot built with `discord.js` to monitor and control a Palworld Dedicated Server (Docker Compose) and a `playit.gg` tunnel (tmux session) running directly on your Proxmox VM.

---

## Features

- **🎮 Status Monitoring:** Checks if the Palworld container is up and if the playit tunnel is active.
- **🔄 Container Restart:** Triggers `docker compose restart` directly from Discord.
- **🌐 Tunnel Restart:** Safely kills the existing tunnel session in tmux and starts a new one (`playit`).
- **🛡️ Secure & Self-Hosted:** No remote SSH keys are stored since the bot runs locally on the Palworld VM.
- **🧪 Dry Run Mode:** Test the bot locally on any machine (like Windows) without actual Docker or tmux installed.

---

## Command Reference

- `/pal-status` - Check the status of both the Docker containers and the tmux tunnel.
- `/pal-restart` - Restart the Palworld Docker container.
- `/playit-restart` - Restart the playit tunnel.
- `/pal-help` - Show available commands.

---

## Setup Instructions

### 1. Create a Discord Bot
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and give it a name (e.g., *Palworld Manager*).
3. Under the **Bot** tab:
   - Click **Add Bot**.
   - Under **Token**, click **Reset Token** and copy the generated token. (This goes into `DISCORD_TOKEN`).
4. Under the **OAuth2** tab:
   - Copy the **Client ID** (under General Information). (This goes into `CLIENT_ID`).
   - Go to **URL Generator**, select the `applications.commands` scope (no other scopes are required).
   - Copy the generated URL, open it in your browser, and authorize the bot to join your Discord server.
5. In Discord, turn on Developer Mode, right-click your Discord server icon, and select **Copy Server ID**. (This goes into `GUILD_ID`).

---

### 2. Install & Configure the Bot
Clone this project onto your Palworld VM (or copy the files):
```bash
cd /path/to/palworld-discord-bot
npm install
```

Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

Edit `.env` using your favorite text editor (e.g. `nano .env`) and enter your configuration details:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_server_id_here
PALWORLD_DIR=/root/palworld-server
TMUX_SESSION=playit
PLAYIT_COMMAND=playit
DRY_RUN=false
```

---

### 3. Running the Bot

#### Running in Development/Testing
To test compilation and registration locally, keep `DRY_RUN=true`. To run with real integrations:
```bash
npm start
```

#### Running in Production on the VM
To keep the bot running in the background after you close your SSH terminal, it is recommended to use **PM2** (Process Manager) or a **systemd service**.

##### Option A: Using PM2 (Recommended)
1. Install PM2 globally on your VM:
   ```bash
   sudo npm install -g pm2
   ```
2. Start the bot:
   ```bash
   pm2 start index.js --name "palworld-bot"
   ```
3. Set PM2 to start automatically on system reboot:
   ```bash
   pm2 startup
   pm2 save
   ```
4. To check logs:
   ```bash
   pm2 logs palworld-bot
   ```

##### Option B: Using systemd
Create a service file `/etc/systemd/system/palworld-bot.service`:
```ini
[Unit]
Description=Palworld Discord Manager Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/palworld-discord
ExecStart=/usr/bin/node index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
*(Note: Replace WorkingDirectory and the paths to node if they differ on your VM)*

Enable and start the service:
```bash
sudo systemctl enable palworld-bot
sudo systemctl start palworld-bot
```
Check status:
```bash
sudo systemctl status palworld-bot
```
