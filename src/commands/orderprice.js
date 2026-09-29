import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js"
import { orderModel } from "../database/models/order.js"

export default {
  data: new SlashCommandBuilder()
    .setName("orderprice")
    .setDescription("Set the price for an order ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("The order price in PHP")
        .setRequired(true)
        .setMinValue(1),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    // Permission check: allow only ManageGuild, guild owner, or members with a role named 'Staff'
    const member = interaction.member
    const isOwner = interaction.user.id === interaction.guild.ownerId
    const hasManage = member?.permissions?.has?.(PermissionFlagsBits.ManageGuild) || member?.permissions?.has?.("ManageGuild")
    const hasStaffRole = member?.roles?.cache?.some((r) => r.name && r.name.toLowerCase() === "staff")

    if (!isOwner && !hasManage && !hasStaffRole) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const orderState = orderModel.getState(interaction.guild.id, interaction.channel.id)
    if (!orderState) {
      await interaction.reply({
        content: "This is not an active order ticket!",
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const amount = interaction.options.getNumber("amount")
    const updatedData = {
      ...(orderState.data || {}),
      price: amount,
    }

    orderModel.setState(
      interaction.guild.id,
      interaction.channel.id,
      orderState.user_id,
      orderState.state,
      updatedData,
    )

    await interaction.reply({
      content: `Amount set to PHP${amount.toFixed(2)}`,
    })
  },
}
