# Discord Bot MVP

A feature-rich Discord bot with queue management, ticketing, verification, moderation, and vouch system with web interface.

## Features

### Discord Bot
- **Queue System**: Manage service queues with positions and admin controls
- **Ticket System**: Create support/order/report tickets with private channels
- **Verification**: Captcha-based user verification with role assignment
- **Welcome Messages**: Automated greetings for new members
- **Sticky Messages**: Persistent messages that stay at bottom of channels
- **Moderation**: Ban, kick, warn, and purge commands
- **Vouch System**: User reputation tracking with database storage

### Web Interface
- **Public Vouch Viewer**: Browse all vouches in real-time
- **User Profiles**: View individual user vouch history
- **REST API**: JSON endpoints for integration
- **Responsive Design**: Mobile-friendly interface

## Setup

### Prerequisites
- Node.js 18+ installed
- Discord bot token (from Discord Developer Portal)
- Discord server with admin permissions

### Installation

1. Clone or download this project

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Copy `.env.example` to `.env` and fill in your Discord credentials:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env`:
\`\`\`env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
PORT=3000
\`\`\`

4. Initialize the database:
\`\`\`bash
npm run init-db
\`\`\`

5. Deploy slash commands to your server:
\`\`\`bash
npm run deploy-commands
\`\`\`

6. Start the bot:
\`\`\`bash
npm start
\`\`\`

The bot will start and the web interface will be available at `http://localhost:3000`

## Commands

### User Commands
- `/queue` - Join or leave service queues
- `/ticket` - Create support, order, or report tickets
- `/verify` - Start captcha verification process
- `/vouch @user` - Vouch for another user
- `/vouches [@user]` - View vouch history (defaults to yourself)

### Admin Commands
- `/queue-admin` - Manage queue (complete/remove users)
- `/welcome set <channel> <message>` - Configure welcome messages
- `/welcome disable` - Disable welcome messages
- `/sticky set <message>` - Set sticky message for current channel
- `/sticky remove` - Remove sticky message
- `/ban @user [reason]` - Ban a user
- `/kick @user [reason]` - Kick a user
- `/warn @user [reason]` - Warn a user
- `/purge <amount>` - Delete bulk messages (1-100)

## Web Interface

### Endpoints

**Homepage**: `http://localhost:3000`
- Search users by Discord ID
- View recent vouches

**User Profile**: `http://localhost:3000/user/:userId`
- View user's vouch count
- See complete vouch history

**API - All Vouches**: `GET /api/vouches`
\`\`\`json
{
  "success": true,
  "data": [...]
}
\`\`\`

**API - User Vouches**: `GET /api/vouches/:userId`
\`\`\`json
{
  "success": true,
  "data": {
    "vouches": [...],
    "count": 5,
    "userId": "123456789"
  }
}
\`\`\`

## Development

Run with auto-reload:
\`\`\`bash
npm run dev
\`\`\`

## File Structure

\`\`\`
├── src/
│   ├── commands/         # Slash commands
│   ├── events/          # Discord event handlers
│   ├── database/        # Database models and schema
│   │   ├── models/      # Data models
│   │   ├── db.js        # Database connection
│   │   ├── init.js      # Database initialization
│   │   └── schema.js    # Table schemas
│   ├── web/            # Web server
│   │   ├── views/      # EJS templates
│   │   ├── public/     # Static files (CSS)
│   │   └── server.js   # Express server
│   ├── config.js       # Configuration
│   ├── deploy-commands.js
│   └── index.js        # Main entry point
├── data/               # SQLite database (auto-created)
├── .env               # Environment variables
├── package.json
└── README.md
\`\`\`

## Database

The bot uses SQLite for data persistence. The database is created automatically on first run.

Tables:
- `queue` - Queue entries and positions
- `tickets` - Ticket information and status
- `verified_users` - Verified user records
- `vouches` - User vouch history
- `warnings` - Moderation warnings
- `config` - Bot configuration (welcome messages, sticky messages)

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2:
\`\`\`bash
npm install -g pm2
pm2 start src/index.js --name discord-bot
\`\`\`

3. Configure reverse proxy (nginx) for the web interface
4. Consider migrating to PostgreSQL for better scalability

## Support

For issues or questions, please check the documentation or contact the developer.

## License

This project is provided as-is for educational and commercial use.
