import { configModel } from "../database/models/config.js"
import { orderModel } from "../database/models/order.js"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"

export default {
  name: "messageCreate",
  async execute(message) {
    // Ignore bot messages or non-guild messages
    if (message.author.bot || !message.guild) return

    if (message.content.toLowerCase() === ".pay") {
      await handlePayCommand(message)
      return
    }

    const orderState = orderModel.getState(message.guild.id, message.channel.id)
    if (orderState && orderState.user_id === message.author.id) {
      await handleOrderConversation(message, orderState)
      return
    }

    // Check for sticky message in this channel
    const channelId = message.channel.id
    const stickyData = configModel.get(message.guild.id, `sticky_${channelId}`)

    if (!stickyData) return

    try {
      const data = JSON.parse(stickyData)

      // Delete old sticky message
      try {
        const oldMsg = await message.channel.messages.fetch(data.messageId)
        await oldMsg.delete()
      } catch (error) {
        // Message might already be deleted
      }

      // Send new sticky message
      const newStickyMsg = await message.channel.send(data.content)

      // Update database with new message ID
      configModel.set(message.guild.id, `sticky_${channelId}`, JSON.stringify({ messageId: newStickyMsg.id, content: data.content }))
    } catch (error) {
      console.error("Error updating sticky message:", error)
    }
  },
}

async function handlePayCommand(message) {
  // Check if this is an order ticket
  const orderState = orderModel.getState(message.guild.id, message.channel.id)
  if (!orderState || orderState.user_id !== message.author.id) {
    return // Not an order ticket or wrong user
  }

  if (orderState.state !== "confirmed") {
    return // Order not confirmed yet
  }

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(
        `-don't forget to send a screenshot after paying!\n` +
        `-no screenshot = no payment confirmed.\n` +
        `-please no rush orders are processed in queue.`,
    )

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("payment_gcash").setLabel("gcash").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("payment_maya").setLabel("maya").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("payment_paypal").setLabel("paypal").setStyle(ButtonStyle.Secondary),
  )

  await message.reply({ embeds: [embed], components: [buttons] })
}

async function handleOrderConversation(message, orderState) {
  const data = orderState.data

  if (orderState.state === "awaiting_start") {
    // User sent first message, now ask for item
    orderModel.setState(message.guild.id, message.channel.id, message.author.id, "awaiting_item", data)
    await message.reply(`what item would you like to purchase?\n-# bobux , nboozt , decor, load , etc.`)
  } else if (orderState.state === "awaiting_item") {
    // User provided item
    data.item = message.content
    orderModel.setState(message.guild.id, message.channel.id, message.author.id, "awaiting_quantity", data)

    await message.reply(`how many?\n-# 2x money , #10 , #20`)
  } else if (orderState.state === "awaiting_quantity") {
    // User provided quantity
    data.quantity = message.content
    orderModel.setState(message.guild.id, message.channel.id, message.author.id, "awaiting_payment_method", data)

    await message.reply(`which payment method would you like to use?\n-# gcash / maya / paypal`)
  } else if (orderState.state === "awaiting_payment_method") {
    // User provided payment method
    data.paymentMethod = message.content
    orderModel.setState(message.guild.id, message.channel.id, message.author.id, "awaiting_confirmation", data)

    // Show confirmation
    const embed = new EmbedBuilder()
      .setTitle("Order Confirmation ! !")
      .setColor(0x2b2d31)
      .setDescription(
        `is this correct?\n\nitem: ${data.item}\nquantity: ${data.quantity}\nmop: ${data.paymentMethod}`,
      )

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("order_confirm_yes").setLabel("yes").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("order_confirm_no").setLabel("no").setStyle(ButtonStyle.Secondary),
    )

    await message.reply({ embeds: [embed], components: [buttons] })
  }
}
