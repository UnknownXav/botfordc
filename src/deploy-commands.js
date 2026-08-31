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
  console.log(`Started refreshing ${commands.length} application (/) commands globally.`)
  // Note: CLI guild ID argument is now vestigial since commands are registered globally
  // using Routes.applicationCommands(clientId) instead of per-guild deployment.
  const cliGuildId = process.argv[2]
  if (cliGuildId) {
    console.log(`[Note] CLI guild ID "${cliGuildId}" supplied, but deployment is now global across all servers.`)
  }

  console.log("Registering commands globally...")
  const data = await rest.put(Routes.applicationCommands(config.clientId), {
    body: commands,
  })

  console.log(`Successfully reloaded ${data.length} global application (/) commands.`)
} catch (error) {
  console.error(error)
}
