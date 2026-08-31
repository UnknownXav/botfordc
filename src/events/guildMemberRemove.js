import { verificationModel } from "../database/models/verification.js"

export default {
  name: "guildMemberRemove",
  async execute(member) {
    try {
      verificationModel.remove(member.guild.id, member.id)
    } catch (error) {
      console.error(
        `[guildMemberRemove] Error clearing verification record for member ${member.id} in guild ${member.guild.id}:`,
        error
      )
    }
  },
}
