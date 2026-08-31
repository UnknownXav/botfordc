import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js"
import { paymentModel } from "../database/models/payment.js"

export default {
  data: new SlashCommandBuilder()
    .setName("paymentsetup")
    .setDescription("Manage payment methods")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a payment method")
        .addStringOption((option) =>
          option.setName("method").setDescription("Payment method (gcash, maya, paypal)").setRequired(true),
        )
        .addStringOption((option) => option.setName("display_name").setDescription("Display name").setRequired(true))
        .addStringOption((option) =>
          option.setName("account_number").setDescription("Account number").setRequired(false),
        )
        .addStringOption((option) => option.setName("account_name").setDescription("Account name").setRequired(false))
        .addStringOption((option) =>
          option.setName("qr_code_url").setDescription("QR code image URL").setRequired(false),
        )
        .addStringOption((option) =>
          option.setName("instructions").setDescription("Payment instructions").setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit a payment method")
        .addStringOption((option) =>
          option.setName("method").setDescription("Payment method to edit").setRequired(true),
        )
        .addStringOption((option) => option.setName("display_name").setDescription("Display name").setRequired(false))
        .addStringOption((option) =>
          option.setName("account_number").setDescription("Account number").setRequired(false),
        )
        .addStringOption((option) => option.setName("account_name").setDescription("Account name").setRequired(false))
        .addStringOption((option) =>
          option.setName("qr_code_url").setDescription("QR code image URL").setRequired(false),
        )
        .addStringOption((option) =>
          option.setName("instructions").setDescription("Payment instructions").setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a payment method")
        .addStringOption((option) =>
          option.setName("method").setDescription("Payment method to remove").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all payment methods")),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand()

    if (subcommand === "add") {
      const method = interaction.options.getString("method").toLowerCase()
      const displayName = interaction.options.getString("display_name")
      const accountNumber = interaction.options.getString("account_number")
      const accountName = interaction.options.getString("account_name")
      const qrCodeUrl = interaction.options.getString("qr_code_url")
      const instructions = interaction.options.getString("instructions")

      try {
        paymentModel.create(interaction.guild.id, method, displayName, accountNumber, accountName, qrCodeUrl, instructions)
        await interaction.reply({
          content: `Payment method **${displayName}** has been added!`,
          flags: MessageFlags.Ephemeral,
        })
      } catch (error) {
        await interaction.reply({
          content: `Failed to add payment method: ${error.message}`,
          flags: MessageFlags.Ephemeral,
        })
      }
    } else if (subcommand === "edit") {
      const method = interaction.options.getString("method").toLowerCase()
      const updates = {}

      const displayName = interaction.options.getString("display_name")
      const accountNumber = interaction.options.getString("account_number")
      const accountName = interaction.options.getString("account_name")
      const qrCodeUrl = interaction.options.getString("qr_code_url")
      const instructions = interaction.options.getString("instructions")

      if (displayName) updates.displayName = displayName
      if (accountNumber) updates.accountNumber = accountNumber
      if (accountName) updates.accountName = accountName
      if (qrCodeUrl) updates.qrCodeUrl = qrCodeUrl
      if (instructions) updates.instructions = instructions

      try {
        paymentModel.update(interaction.guild.id, method, updates)
        await interaction.reply({
          content: `Payment method **${method}** has been updated!`,
          flags: MessageFlags.Ephemeral,
        })
      } catch (error) {
        await interaction.reply({
          content: `Failed to update payment method: ${error.message}`,
          flags: MessageFlags.Ephemeral,
        })
      }
    } else if (subcommand === "remove") {
      const method = interaction.options.getString("method").toLowerCase()

      try {
        paymentModel.delete(interaction.guild.id, method)
        await interaction.reply({
          content: `Payment method **${method}** has been removed!`,
          flags: MessageFlags.Ephemeral,
        })
      } catch (error) {
        await interaction.reply({
          content: `Failed to remove payment method: ${error.message}`,
          flags: MessageFlags.Ephemeral,
        })
      }
    } else if (subcommand === "list") {
      const methods = paymentModel.getAll(interaction.guild.id)

      if (methods.length === 0) {
        await interaction.reply({
          content: "No payment methods configured.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      const embed = new EmbedBuilder().setTitle("Payment Methods").setColor(0x5865f2)

      for (const method of methods) {
        let value = `**Display Name:** ${method.display_name}\n`
        if (method.account_number) value += `**Account Number:** ${method.account_number}\n`
        if (method.account_name) value += `**Account Name:** ${method.account_name}\n`
        if (method.qr_code_url) value += `**QR Code:** Set\n`
        if (method.instructions) value += `**Instructions:** ${method.instructions}\n`

        embed.addFields({ name: method.method_name, value })
      }

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
    }
  },
}
