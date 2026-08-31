import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete multiple messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount")

    try {
      await interaction.deferReply({ ephemeral: true })

      const messages = await interaction.channel.messages.fetch({ limit: amount })
      await interaction.channel.bulkDelete(messages, true)

      await interaction.editReply({
        content: `Successfully deleted ${messages.size} messages.`,
      })

      // Auto-delete confirmation after 3 seconds
      setTimeout(async () => {
        try {
          await interaction.deleteReply()
        } catch (error) {
          // Reply might already be deleted
        }
      }, 3000)
    } catch (error) {
      console.error("Error purging messages:", error)
      await interaction.editReply({
        content: "There was an error trying to delete messages. Messages older than 14 days cannot be bulk deleted.",
      })
    }
  },
}
