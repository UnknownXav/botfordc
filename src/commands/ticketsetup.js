import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js"
import { configModel } from "../database/models/config.js"

export default {
  data: new SlashCommandBuilder()
    .setName("ticketsetup")
    .setDescription("Setup the ticket panel in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to send the ticket panel")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel")

    if (!channel) {
      return await interaction.reply({
        content: "Could not find the specified channel. Please try again.",
        flags: [4096], // MessageFlags.Ephemeral
      })
    }

    const embed = new EmbedBuilder()
      .setTitle("TICKET HERE")
      .setDescription(
        `need help with an order or have something to discuss? choose the ticket category that best fits your concern.

**orders** : if you would like to buy item
**report** : for reports/concerns

**gentle reminders**
opening a ticket means you follow our rules
open only when you're sure.
this is blackmarket, buy at your own risk.`,
      )
      .setColor(0x2b2d31)

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_order").setLabel("order").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_report").setLabel("report").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_others").setLabel("others").setStyle(ButtonStyle.Primary),
    )

    let isUpdate = false

    try {
      const storedMessageId = configModel.get(interaction.guild.id, `ticketpanel_${channel.id}`)

      if (storedMessageId) {
        try {
          const existingMsg = await channel.messages.fetch(storedMessageId)
          await existingMsg.edit({
            embeds: [embed],
            components: [row],
          })
          isUpdate = true
        } catch (fetchOrEditError) {
          const newMsg = await channel.send({
            embeds: [embed],
            components: [row],
          })
          configModel.set(interaction.guild.id, `ticketpanel_${channel.id}`, newMsg.id)
        }
      } else {
        const newMsg = await channel.send({
          embeds: [embed],
          components: [row],
        })
        configModel.set(interaction.guild.id, `ticketpanel_${channel.id}`, newMsg.id)
      }

      await interaction.reply({
        content: isUpdate
          ? `Ticket panel updated in ${channel}!`
          : `Ticket panel has been set up in ${channel}!`,
        flags: [4096], // MessageFlags.Ephemeral
      })
    } catch (error) {
      console.error("Error setting up ticket panel:", error)
      await interaction.reply({
        content: "Failed to set up ticket panel. Make sure I have permissions in that channel.",
        flags: [4096], // MessageFlags.Ephemeral
      })
    }
  },
}
