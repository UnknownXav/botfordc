import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { vouchModel } from "../database/models/vouch.js"

export default {
  data: new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Vouch for a user")
    .addUserOption((option) => option.setName("user").setDescription("User to vouch for").setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user")

    // Can't vouch for yourself
    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: "You cannot vouch for yourself!",
        ephemeral: true,
      })
      return
    }

    // Can't vouch for bots
    if (targetUser.bot) {
      await interaction.reply({
        content: "You cannot vouch for bots!",
        ephemeral: true,
      })
      return
    }

    try {
      // Add vouch to database
      vouchModel.add(interaction.guild.id, interaction.user.id, interaction.user.tag, targetUser.id, targetUser.tag)

      // Get total vouch count
      const vouchCount = vouchModel.getCount(interaction.guild.id, targetUser.id)

      const embed = new EmbedBuilder()
        .setTitle("Vouch Added!")
        .setDescription(`${interaction.user} vouched for ${targetUser}`)
        .addFields({ name: "Total Vouches", value: vouchCount.toString(), inline: true })
        .setColor(0x57f287)
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.error("Error adding vouch:", error)
      await interaction.reply({
        content: "There was an error adding your vouch. Please try again later.",
        ephemeral: true,
      })
    }
  },
}
