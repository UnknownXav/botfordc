import { configModel } from "../database/models/config.js"

export default {
  name: "guildMemberAdd",
  async execute(member) {
    const channelId = configModel.get("welcome_channel")
    const verifyChannelId = configModel.get("verify_channel")
    const rulesChannelId = configModel.get("rules_channel")

    if (!channelId || !verifyChannelId || !rulesChannelId) return

    try {
      const channel = await member.guild.channels.fetch(channelId)
      if (!channel) return

      const welcomeMessage = `🔨 welcome <@${member.id}> to pixel shop !

— click to <#${verifyChannelId}>

— please read <#${rulesChannelId}>`

      await channel.send(welcomeMessage)
    } catch (error) {
      console.error("Error sending welcome message:", error)
    }
  },
}
