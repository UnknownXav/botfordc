import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { configModel } from "../database/models/config.js"

export default {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("Configure sticky messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a sticky message for this channel")
        .addStringOption((option) =>
          option.setName("message").setDescription("The sticky message content").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("remove").setDescription("Remove the sticky message")),

  async execute(interaction) {
    const channelId = interaction.channel.id

    if (interaction.options.getSubcommand() === "set") {
      const message = interaction.options.getString("message")

      // Send the sticky message
      const stickyMsg = await interaction.channel.send(message)

      // Store in database
      configModel.set(interaction.guild.id, `sticky_${channelId}`, JSON.stringify({ messageId: stickyMsg.id, content: message }))

      await interaction.reply({
        content: "Sticky message has been set!",
        ephemeral: true,
      })
    } else if (interaction.options.getSubcommand() === "remove") {
      const stickyData = configModel.get(interaction.guild.id, `sticky_${channelId}`)

      if (!stickyData) {
        await interaction.reply({
          content: "There is no sticky message in this channel.",
          ephemeral: true,
        })
        return
      }

      // Delete from database
      configModel.delete(interaction.guild.id, `sticky_${channelId}`)

      // Try to delete the message
      try {
        const data = JSON.parse(stickyData)
        const msg = await interaction.channel.messages.fetch(data.messageId)
        await msg.delete()
      } catch (error) {
        console.error("Error deleting sticky message:", error)
      }

      await interaction.reply({
        content: "Sticky message has been removed!",
        ephemeral: true,
      })
    }
  },
}
