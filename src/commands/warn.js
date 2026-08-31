import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import { warningModel } from "../database/models/warning.js"

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for warning").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason") || "No reason provided"

    try {
      // Add warning to database
      warningModel.add(user.id, user.tag, interaction.user.id, interaction.user.tag, reason)

      // Get warning count
      const warningCount = warningModel.getCount(user.id)

      const embed = new EmbedBuilder()
        .setTitle("User Warned")
        .setDescription(`${user.tag} has been warned.`)
        .addFields(
          { name: "Reason", value: reason },
          { name: "Moderator", value: interaction.user.tag },
          { name: "Total Warnings", value: warningCount.toString() },
        )
        .setColor(0xfaa61a)
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })

      // Try to DM the user
      try {
        await user.send(
          `You have been warned in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`,
        )
      } catch (error) {
        // User has DMs disabled
        console.log("Could not DM user about warning")
      }
    } catch (error) {
      console.error("Error warning user:", error)
      await interaction.reply({
        content: "There was an error trying to warn this user.",
        ephemeral: true,
      })
    }
  },
}
