import { configModel } from "../database/models/config.js"

export default {
  name: "guildMemberAdd",
  async execute(member) {
    const channelId = configModel.get(member.guild.id, "welcome_channel")
    const verifyChannelId = configModel.get(member.guild.id, "verify_channel")
    const rulesChannelId = configModel.get(member.guild.id, "rules_channel")

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
