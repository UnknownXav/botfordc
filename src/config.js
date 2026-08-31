import dotenv from "dotenv"
dotenv.config()

export default {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  port: process.env.PORT || 3000,
  webUrl: process.env.WEB_URL || "http://localhost:3000",
  databasePath: process.env.DATABASE_PATH || "./data/bot.db",
}
