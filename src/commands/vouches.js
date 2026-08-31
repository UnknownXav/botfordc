import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { vouchModel } from "../database/models/vouch.js"

export default {
  data: new SlashCommandBuilder()
    .setName("vouches")
    .setDescription("View vouches for a user")
    .addUserOption((option) => option.setName("user").setDescription("User to check vouches for").setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user

    try {
      const vouches = vouchModel.getByUserId(targetUser.id)

      const embed = new EmbedBuilder().setTitle(`Vouches for ${targetUser.tag}`).setColor(0x5865f2).setTimestamp()

      if (vouches.length === 0) {
        embed.setDescription("No vouches yet!")
      } else {
        const vouchList = vouches
          .slice(0, 10)
          .map((v) => {
            const date = new Date(v.created_at).toLocaleDateString()
            return `• ${v.voucher_tag} - ${date}`
          })
          .join("\n")

        embed.setDescription(vouchList)
        embed.setFooter({ text: `Total vouches: ${vouches.length}` })
      }

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.error("Error fetching vouches:", error)
      await interaction.reply({
        content: "There was an error fetching vouches. Please try again later.",
        ephemeral: true,
      })
    }
  },
}
