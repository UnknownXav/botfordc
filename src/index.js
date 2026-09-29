import { Client, Collection, GatewayIntentBits } from "discord.js"
import { readdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import config from "./config.js"
import { startWebServer } from "./web/server.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
})

client.on("error", (err) => console.error("Discord client error:", err))
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err))
process.on("uncaughtException", (err) => console.error("Uncaught exception:", err))

// Load commands
client.commands = new Collection()
const commandsPath = join(__dirname, "commands")
const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`)
  client.commands.set(command.default.data.name, command.default)
  console.log(`Loaded command: ${command.default.data.name}`)
}

// Load events
const eventsPath = join(__dirname, "events")
const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith(".js"))

for (const file of eventFiles) {
  const event = await import(`./events/${file}`)
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args))
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args))
  }
  console.log(`Loaded event: ${event.default.name}`)
}

// Start web server
startWebServer(client)

client.login(config.token)
