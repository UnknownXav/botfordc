import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js"
import { ordersModel } from "../database/models/orders.js"
import { ticketModel } from "../database/models/ticket.js"

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Create an order queue entry")
    .addUserOption((u) => u.setName("buyer").setDescription("Buyer user").setRequired(true))
    .addStringOption((s) => s.setName("amount").setDescription("Amount (e.g. 10GBP)").setRequired(true))
    .addStringOption((s) => s.setName("item").setDescription("Item being ordered").setRequired(true))
    .addStringOption((s) => s.setName("mop").setDescription("Method of payment (gcash, maya, paypal)").setRequired(true))
    .addStringOption((s) => s.setName("price").setDescription("Price").setRequired(true))
    .addChannelOption((c) => c.setName("channel").setDescription("Channel to post the order").setRequired(false)),

  async execute(interaction) {
    // Permission check: allow only guild owner, members with ManageGuild, or role named 'Staff'
    const member = interaction.member
    const isOwner = interaction.guild && interaction.user.id === interaction.guild.ownerId
    const hasManage = member?.permissions?.has?.(PermissionFlagsBits.ManageGuild)
    const hasStaffRole = member?.roles?.cache?.some((r) => r.name && r.name.toLowerCase() === "staff")

    if (!isOwner && !hasManage && !hasStaffRole) {
      await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true })
      return
    }
    await interaction.deferReply({ ephemeral: true })

    const buyer = interaction.options.getUser("buyer")
    if (!buyer) {
      await interaction.editReply({ content: "Could not resolve the specified user." })
      return
    }
    const amount = interaction.options.getString("amount")
    const item = interaction.options.getString("item")
    const mop = interaction.options.getString("mop")
    const price = interaction.options.getString("price")
    const channel = interaction.options.getChannel("channel") || interaction.channel

    // try to link this order to an open ticket (if any)
    let ticketChannelId = null
    try {
      const ticketForChannel = ticketModel.getByChannelId(interaction.guild.id, channel.id)
      if (ticketForChannel) ticketChannelId = ticketForChannel.channel_id

      if (!ticketChannelId) {
        const buyerTickets = ticketModel.getByUserId(interaction.guild.id, buyer.id) || []
        const openTicket = buyerTickets.find((t) => t.status === "open")
        if (openTicket) ticketChannelId = openTicket.channel_id
      }
    } catch (e) {
      // ignore ticket linking errors
    }

    const desc = `${buyer} - # ${buyer.tag || "unknown"}
**order:** ${amount} ${item}
**payment:** ${mop}
**queued by:** ${interaction.user}
**status:** noted`

    const embed = new EmbedBuilder().setTitle("order in queue !  ʚɞ").setColor(0x007dfe).setDescription(desc)

    const select = new StringSelectMenuBuilder()
      .setCustomId(`order_status_select_${buyer.id}`)
      .setPlaceholder("Select order status")
      .addOptions([
        { label: "Processing", description: "Order is being processed", value: "processing" },
        { label: "Done", description: "Order completed", value: "done" },
      ])

    const row = new ActionRowBuilder().addComponents(select)

    const sent = await channel.send({ embeds: [embed], components: [row] })

    try {
      await ordersModel.create(interaction.guild.id, {
        buyer_id: buyer.id,
        buyer_tag: buyer.tag,
        amount,
        item,
        mop,
        price,
        channel_id: channel.id,
        message_id: sent.id,
        ticket_channel_id: ticketChannelId,
      })
    } catch (e) {
      console.error("Failed to persist order:", e)
    }

    // Notify ticket channel / buyer if linked to a ticket
    if (ticketChannelId) {
      try {
        const ticketChannel = await interaction.guild.channels.fetch(ticketChannelId)
        if (ticketChannel) {
          // rename ticket channel to noted-<base>
          try {
            const baseName = ticketChannel.name.replace(/^(noted-|processing-|done-|order-)/i, "")
            await ticketChannel.setName(`noted-${baseName}`)
          } catch (e) {
            // ignore permission issues when renaming
          }

          await ticketChannel.send(
            "your order has been noted !  ʚɞ\nyour order has been submitted to the queue !\n\nplease  be patient with us and don't rush, we'll update you as soon as we can, thank you !",
          )
        }
      } catch (e) {
        console.error("Failed to notify ticket channel:", e)
      }
    }

    await interaction.editReply({ content: `Order posted in ${channel}` })
  },
}
