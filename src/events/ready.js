export default {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`)
    console.log(`Bot is in ${client.guilds.cache.size} server(s)`)
  },
}
