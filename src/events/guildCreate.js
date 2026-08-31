export default {
  name: "guildCreate",
  async execute(guild) {
    console.log(`Bot joined a new server: ${guild.name} (${guild.id})`)

    try {
      const owner = await guild.fetchOwner()
      if (owner) {
        await owner.send(
          `Thanks for adding me to **${guild.name}**!\n\n` +
            `To get started, use the following commands:\n` +
            `• \`/paymentsetup add\` - Set up payment methods\n` +
            `• \`/welcome set\` - Configure welcome messages`,
        )
        console.log(`Sent onboarding DM to guild owner of ${guild.name}`)
      }
    } catch (error) {
      console.warn(`Could not send onboarding DM to owner of guild ${guild.name} (${guild.id}): ${error.message}`)
    }
  },
}
