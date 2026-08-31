import { REST, Routes } from "discord.js"
import { readdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import config from "./config.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const commands = []
const commandsPath = join(__dirname, "commands")
const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`)
  commands.push(command.default.data.toJSON())
}

const rest = new REST({ version: "10" }).setToken(config.token)

try {
  console.log(`Started refreshing ${commands.length} application (/) commands.`)
  // Allow optional CLI guild id override: `node src/deploy-commands.js <GUILD_ID>`
  const cliGuildId = process.argv[2]
  const guildIdToUse = cliGuildId || config.guildId

  if (!guildIdToUse) {
    console.error("No guild id provided. Pass a guild id as an argument or set GUILD_ID in env/config.")
    process.exit(1)
  }

  console.log(`Registering commands to guild: ${guildIdToUse}`)
  const data = await rest.put(Routes.applicationGuildCommands(config.clientId, guildIdToUse), {
    body: commands,
  })

  console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guildIdToUse}.`)
} catch (error) {
  console.error(error)
}
