// queueModel removed per request
import { ticketModel } from "../database/models/ticket.js"
import { verificationModel } from "../database/models/verification.js"
import { orderModel } from "../database/models/order.js"
import { ordersModel } from "../database/models/orders.js"
import { paymentModel } from "../database/models/payment.js"
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags, // Add this import for MessageFlags
  AttachmentBuilder,
} from "discord.js"
import { configModel } from "../database/models/config.js"

export default {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName)

        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`)
          return
        }

        try {
          await command.execute(interaction)
        } catch (error) {
          console.error(`Error executing ${interaction.commandName}:`, error)
          const replyMethod = interaction.replied || interaction.deferred ? "followUp" : "reply"
          await interaction[replyMethod]({
            content: "There was an error while executing this command!",
            ephemeral: true,
          })
        }
      }

      // Handle select menu interactions
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket_type_select") {
          await handleTicketTypeSelect(interaction)
        } else if (interaction.customId.startsWith("order_status_select_")) {
          await handleOrderStatusSelect(interaction)
        }
      }

      // Handle button interactions
      if (interaction.isButton()) {
        if (interaction.customId === "ticket_close") {
          await handleTicketClose(interaction)
        } else if (interaction.customId === "ticket_order") {
          await handleTicketOrderClick(interaction)
        } else if (interaction.customId === "ticket_report") {
          await handleTicketReportClick(interaction)
        } else if (interaction.customId === "ticket_others") {
          await handleTicketOthersClick(interaction)
        } else if (interaction.customId === "order_confirm_yes") {
          await handleOrderConfirmYes(interaction)
        } else if (interaction.customId === "order_confirm_no") {
          await handleOrderConfirmNo(interaction)
        } else if (interaction.customId.startsWith("payment_")) {
          await handlePaymentMethodSelect(interaction)
        } else if (interaction.customId.startsWith("copy_")) {
          await handleCopyButton(interaction)
        } else if (interaction.customId === "verify_start") {
          await handleVerifyStart(interaction)
        } else if (interaction.customId === "order_form_start") {
          await handleOrderFormStart(interaction)
        } else if (interaction.customId === "ticket_transcript") {
          await handleTicketTranscript(interaction)
        } else if (interaction.customId === "ticket_delete") {
          await handleTicketDelete(interaction)
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("ticket_modal_")) {
          await handleTicketModalSubmit(interaction)
        } else if (interaction.customId === "captcha_modal") {
          await handleCaptchaModalSubmit(interaction)
        }
      }
    } catch (error) {
      console.error("Interaction execution error:", error)
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: "Something went wrong, please try again." })
        } else {
          await interaction.reply({ content: "Something went wrong, please try again.", flags: MessageFlags.Ephemeral })
        }
      } catch (replyError) {
        // Swallow errors, especially code 10062 (Unknown interaction) and 40060 (Already acknowledged)
        if (replyError?.code !== 10062 && replyError?.code !== 40060) {
          console.error("Failed to send fallback error reply:", replyError)
        }
      }
    }
  },
}



async function handleTicketTypeSelect(interaction) {
  const ticketType = interaction.values[0]

  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${ticketType}`)
    .setTitle(`Create ${capitalizeFirst(ticketType)} Ticket`)

  const descriptionInput = new TextInputBuilder()
    .setCustomId("ticket_description")
    .setLabel("Description")
    .setPlaceholder("Please describe your issue or request in detail...")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(1000)

  const row = new ActionRowBuilder().addComponents(descriptionInput)
  modal.addComponents(row)

  await interaction.showModal(modal)
}

async function handleTicketModalSubmit(interaction) {
  await interaction.deferReply({ ephemeral: true })

  const ticketType = interaction.customId.replace("ticket_modal_", "")
  const description = interaction.fields.getTextInputValue("ticket_description")

  try {
    // Create ticket category if it doesn't exist
    let category = interaction.guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === "tickets",
    )

    if (!category) {
      category = await interaction.guild.channels.create({
        name: "tickets",
        type: ChannelType.GuildCategory,
      })
    }

    // Create ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    })

    // Create ticket in database
    const ticketNumber = ticketModel.create(
      interaction.guild.id,
      interaction.user.id,
      interaction.user.tag,
      ticketType,
      description,
      ticketChannel.id,
    )

    orderModel.setState(interaction.guild.id, ticketChannel.id, interaction.user.id, "awaiting_start", {})

    // Send initial message
    const embed = new EmbedBuilder()
      .setTitle("Order Ticket")
      .setDescription(
        `${interaction.user}, your ticket has been created.\n\n` +
        `Please describe your order and staff will assist you shortly.\n\n` +
        `${new Date().toLocaleString()}`,
      )
      .setColor(0x5865f2)

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_close").setLabel("Close Ticket").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("order_form_start").setLabel("order form").setStyle(ButtonStyle.Secondary),
    )

    await ticketChannel.send({ embeds: [embed], components: [buttons] })

    await interaction.editReply({
      content: `Your order ticket has been created: ${ticketChannel}`,
    })
  } catch (error) {
    console.error("Error creating ticket:", error)
    await interaction.editReply({
      content: "Failed to create ticket. Please try again later.",
    })
  }
}

async function handleTicketClose(interaction) {
  // Prefer permissive lookup so staff can close tickets regardless of current status
  const ticket = ticketModel.getByChannelIdAny(interaction.guild.id, interaction.channel.id)

  if (!ticket) {
    await interaction.reply({ content: "This is not a valid ticket channel!", ephemeral: true })
    return
  }

  let statusNotice = null
  if (ticket.status && ticket.status !== "open") {
    // Defer a notice to send after the main reply to avoid double-reply errors
    statusNotice = `Ticket found (status: ${ticket.status}). Closing it now.`
  }

  const closeEmbed = new EmbedBuilder()
    .setDescription("STATUS: CLOSING")
    .setColor(0xed4245)

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Transcript')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📄'),
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
    )

  await interaction.reply({ embeds: [closeEmbed], components: [row] })
  try {
    // mark ticket closed in the DB
    try {
      ticketModel.setStatus(interaction.guild.id, interaction.channel.id, "closed")
    } catch (err) {
      console.error("Failed to update ticket status on close:", err)
    }

    // No longer moving to 'closed' category. Channel stays here until deleted.
    // Optionally, we could lock permissions here if desired, but user just asked to remove the category move.

    // No longer moving to 'closed' category. Channel stays here until deleted.
    // Optionally, we could lock permissions here if desired, but user just asked to remove the category move.

    if (statusNotice) {
      try {
        await interaction.followUp({ content: statusNotice, ephemeral: true })
      } catch (e) {
        // ignore followUp failures
      }
    }
  } catch (e) {
    console.error("Error during ticket close follow-up:", e)
  }

  return
}

async function handleVerifyStart(interaction) {
  if (verificationModel.isVerified(interaction.guild.id, interaction.user.id)) {
    await interaction.reply({
      content: "You are already verified!",
      ephemeral: true,
    })
    return
  }

  const num1 = Math.floor(Math.random() * 10) + 1
  const num2 = Math.floor(Math.random() * 10) + 1
  const answer = num1 + num2

  if (!interaction.client.captchaAnswers) {
    interaction.client.captchaAnswers = new Map()
  }
  interaction.client.captchaAnswers.set(interaction.user.id, answer)

  const modal = new ModalBuilder()
    .setCustomId("captcha_modal")
    .setTitle("Verification Captcha")

  const answerInput = new TextInputBuilder()
    .setCustomId("captcha_answer")
    .setLabel(`What is ${num1} + ${num2}?`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter the answer...")
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(5)

  const row = new ActionRowBuilder().addComponents(answerInput)
  modal.addComponents(row)

  await interaction.showModal(modal)
}

async function handleCaptchaModalSubmit(interaction) {
  const userAnswer = Number.parseInt(interaction.fields.getTextInputValue("captcha_answer"))
  const correctAnswer = interaction.client.captchaAnswers?.get(interaction.user.id)

  if (!correctAnswer) {
    await interaction.reply({
      content: "Captcha expired! Please try again.",
      ephemeral: true,
    })
    return
  }

  if (userAnswer !== correctAnswer) {
    await interaction.reply({
      content: "Incorrect answer! Please try again.",
      ephemeral: true,
    })
    return
  }

  // Correct answer - verify user
  interaction.client.captchaAnswers.delete(interaction.user.id)

  // Check if already verified
  if (verificationModel.isVerified(interaction.guild.id, interaction.user.id)) {
    await interaction.reply({
      content: "You are already verified!",
      ephemeral: true,
    })
    return
  }

  // Add to verified users
  verificationModel.add(interaction.guild.id, interaction.user.id, interaction.user.tag)

  // Try to add verified role (if exists)
  try {
    const verifiedRole = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === "verified")
    if (verifiedRole) {
      await interaction.member.roles.add(verifiedRole)
    }
  } catch (error) {
    console.error("Error adding verified role:", error)
  }

  // Try to remove unverified role (if exists and member has it)
  try {
    const unverifiedRole = interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === "unverified")
    if (unverifiedRole && interaction.member.roles.cache.has(unverifiedRole.id)) {
      await interaction.member.roles.remove(unverifiedRole)
    }
  } catch (error) {
    console.error("Error removing unverified role:", error)
  }

  const embed = new EmbedBuilder()
    .setTitle("Verification Successful!")
    .setDescription("You have been successfully verified!")
    .setColor(0x57f287)
    .setTimestamp()

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  })
}

function getServiceName(service) {
  const names = {
    graphic_design: "Graphic Design",
    video_editing: "Video Editing",
    web_development: "Web Development",
    content_writing: "Content Writing",
  }
  return names[service] || service
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function handleTicketReportClick(interaction) {
  // Implement ticket report handling logic here
}

async function handleTicketOthersClick(interaction) {
  // Placeholder for handleTicketOthersClick logic 
}

async function handleTicketTranscript(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  try {
    // Simple transcript: fetch messages and send as file
    const messages = await interaction.channel.messages.fetch({ limit: 100 })
    const content = messages.map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).reverse().join("\n")

    const attachment = new AttachmentBuilder(Buffer.from(content, 'utf-8'), { name: `transcript-${interaction.channel.name}.txt` })

    // Send to #transcripts channel
    let transcriptsChannel = interaction.guild.channels.cache.find(c => c.name === "transcripts" && c.type === ChannelType.GuildText)

    if (!transcriptsChannel) {
      // Create transcripts channel if not exists (assume staff/private)
      try {
        transcriptsChannel = await interaction.guild.channels.create({
          name: "transcripts",
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            // Assume bot has permission. Maybe staff too?
          ]
        })
      } catch (e) {
        console.error("Failed to create transcripts channel:", e)
      }
    }

    if (transcriptsChannel) {
      await transcriptsChannel.send({
        content: `**Transcript generated for ticket <#${interaction.channel.id}>**\nUser: ${interaction.user.tag}\nClosed by: ${interaction.user.tag}`,
        files: [attachment]
      })

      await interaction.editReply({ content: `Transcript saved to ${transcriptsChannel}.` })
    } else {
      // Fallback if creation failed
      await interaction.editReply({
        content: `**Transcript generated for ${interaction.channel}:**`,
        files: [attachment],
      })
    }
  } catch (error) {
    console.error("Error generating transcript:", error)
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "Failed to generate transcript." })
      } else {
        await interaction.reply({ content: "Failed to generate transcript.", flags: MessageFlags.Ephemeral })
      }
    } catch (replyError) {
      console.error("Failed to send transcript error reply:", replyError)
    }
  }
}

async function handleTicketDelete(interaction) {
  try {
    await interaction.reply({ content: "Deleting ticket channel in 5 seconds...", ephemeral: true })

    // Wait 5 seconds
    setTimeout(async () => {
      try {
        const channel = interaction.channel;
        if (!channel) return;

        // 1. Fetch Ticket Data
        const ticket = ticketModel.getByChannelIdAny(interaction.guild.id, channel.id);

        // 2. Fetch Messages for Transcript
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        const transcriptContent = sortedMessages.map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join("\n");

        const { AttachmentBuilder, EmbedBuilder, ChannelType } = await import("discord.js");
        const attachment = new AttachmentBuilder(Buffer.from(transcriptContent, 'utf-8'), { name: `transcript-${channel.name}.txt` });

        // 3. Prepare Embed Data
        const ticketOwnerId = ticket ? ticket.user_id : "Unknown";
        const ticketOwnerTag = ticket ? ticket.user_tag : "Unknown";
        const ticketType = ticket ? ticket.type.toUpperCase() : "UNKNOWN";
        const ticketNumber = ticket ? `#${ticket.ticket_number}` : "N/A";
        const createdAt = ticket ? new Date(ticket.created_at) : new Date();
        const closedAt = new Date(); // Now
        const closedBy = interaction.user;
        const guildName = interaction.guild ? interaction.guild.name : "Unknown Server";

        // Calculate Duration
        const durationMs = closedAt - createdAt;
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        let durationStr = "";
        if (days > 0) durationStr += `${days}d `;
        if (hours > 0) durationStr += `${hours}h `;
        durationStr += `${minutes}m`;
        if (durationStr === "") durationStr = "Just now";

        // 4. Build Embed
        const embed = new EmbedBuilder()
          .setTitle("📋 Ticket Transcript")
          .setColor(0x2b2d31) // Dark/Greyish like the example
          .addFields(
            { name: "Ticket", value: `${channel.name}`, inline: true },
            { name: "Channel", value: `${channel.name} (${channel.id})`, inline: true },
            { name: "👤 Ticket Owner", value: `${ticketOwnerTag} (${ticketOwnerId})`, inline: false },
            { name: "📂 Type", value: `${ticketType}`, inline: true },
            { name: "🔢 Ticket Number", value: `${ticketNumber}`, inline: true },
            { name: "📅 Created At", value: `${createdAt.toLocaleString()}`, inline: false },
            { name: "⏱️ Duration", value: `${durationStr}`, inline: true },
            { name: "💬 Messages", value: `${messages.size}`, inline: true },
            { name: "🏷️ Closed By", value: `${closedBy.tag}`, inline: true },
            { name: "🕐 Closed At", value: `${closedAt.toLocaleString()}`, inline: false },
            { name: "🌐 Server", value: `${guildName}`, inline: false }
          )
          .setFooter({ text: `Ticket System - ${guildName} - ${new Date().toLocaleString()}` });

        // 5. Send to Ticket Owner
        if (ticketOwnerId) {
          try {
            const user = await interaction.client.users.fetch(ticketOwnerId);
            if (user) {
              await user.send({ embeds: [embed], files: [attachment] });
            }
          } catch (dmError) {
            console.error("Failed to DM ticket owner:", dmError);
          }
        }

        // 6. Send to Transcripts Channel
        try {
          let transcriptsChannel = interaction.guild.channels.cache.find(c => c.name === "transcripts" && c.type === ChannelType.GuildText);
          if (!transcriptsChannel) {
            transcriptsChannel = await interaction.guild.channels.create({
              name: "transcripts",
              type: ChannelType.GuildText,
              permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }] // Assuming PermissionFlagsBits is available or I should import it
            });
          }
          if (transcriptsChannel) {
            await transcriptsChannel.send({ embeds: [embed], files: [attachment] });
          }
        } catch (logError) {
          console.error("Failed to log transcript:", logError);
        }

        // 7. Delete Channel
        await channel.delete();

      } catch (innerError) {
        console.error("Error during deletion process:", innerError);
        // Force delete if transcript fails?
        // interaction.channel.delete().catch(e => console.error("Force delete failed:", e)); 
      }
    }, 5000);

  } catch (error) {
    console.error("Error initiating ticket delete:", error);
  }
}

async function handleTicketOrderClick(interaction) {
  const guild = interaction.guild
  const user = interaction.user

  // Check if user already has an open ticket
  const existingTicket = ticketModel.getByUserId(interaction.guild.id, user.id).find((t) => t.status === "open")
  if (existingTicket) {
    await interaction.reply({
      content: "You already have an open ticket! Please close it before creating a new one.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  try {
    let category = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === "tickets")

    if (!category) {
      category = await guild.channels.create({
        name: "tickets",
        type: ChannelType.GuildCategory,
      })
    }

    // Create ticket channel in Tickets category
    const ticketChannel = await guild.channels.create({
      name: `order-${user.username}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    })

    // Create ticket in database
    const ticketNumber = ticketModel.create(guild.id, user.id, user.tag, "order", "Order ticket", ticketChannel.id)

    orderModel.setState(interaction.guild.id, ticketChannel.id, user.id, "awaiting_start", {})

    // Send initial message
    const embed = new EmbedBuilder()
      .setTitle("Order Ticket")
      .setDescription(
        `${user}, your ticket has been created.\n\n` +
        `Please describe your order and staff will assist you shortly.\n\n` +
        `${new Date().toLocaleString()}`,
      )
      .setColor(0x5865f2)

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_close").setLabel("Close Ticket").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("order_form_start").setLabel("order form").setStyle(ButtonStyle.Secondary),
    )

    await ticketChannel.send({ embeds: [embed], components: [buttons] })

    await interaction.editReply({
      content: `Your order ticket has been created: ${ticketChannel}`,
    })
  } catch (error) {
    console.error("Error creating order ticket:", error)
    await interaction.editReply({
      content: "Failed to create ticket. Please try again later.",
    })
  }
}

async function handleOrderConfirmYes(interaction) {
  const orderState = orderModel.getState(interaction.guild.id, interaction.channel.id)
  if (!orderState || orderState.user_id !== interaction.user.id) {
    await interaction.reply({
      content: "This is not your order!",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Update state to confirmed
  orderModel.setState(interaction.guild.id, interaction.channel.id, interaction.user.id, "confirmed", orderState.data)

  await interaction.reply(`Order Confirmed. Please type \`.pay\``)
}

async function handleOrderConfirmNo(interaction) {
  const orderState = orderModel.getState(interaction.guild.id, interaction.channel.id)
  if (!orderState || orderState.user_id !== interaction.user.id) {
    await interaction.reply({
      content: "This is not your order!",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Reset to start
  orderModel.setState(interaction.guild.id, interaction.channel.id, interaction.user.id, "awaiting_start", {})

  await interaction.reply(
    `**Order cancelled. Let's start over.**\n\nwhat item would you like to purchase?\n-# bobux , nboozt , decor, load , etc.`,
  )
}

async function handlePaymentMethodSelect(interaction) {
  const orderState = orderModel.getState(interaction.guild.id, interaction.channel.id)
  if (!orderState || orderState.user_id !== interaction.user.id) {
    await interaction.reply({
      content: "This is not your order!",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const paymentMethod = interaction.customId.replace("payment_", "")

  const paymentData = paymentModel.getByMethod(interaction.guild.id, paymentMethod)

  if (!paymentData) {
    await interaction.reply({
      content: `Payment method **${paymentMethod}** is not configured yet!`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const embed = new EmbedBuilder().setTitle(`${paymentData.display_name}`).setColor(0x007dfe)

  let description = ""
  if (paymentData.account_number) {
    description += `**${paymentData.account_number}**\n`
  }
  if (paymentData.account_name) {
    description += `**${paymentData.account_name}**\n`
  }
  if (paymentData.instructions) {
    description += `\n${paymentData.instructions}`
  }

  if (description) {
    embed.setDescription(description)
  }

  if (paymentData.qr_code_url) {
    embed.setImage(paymentData.qr_code_url)
  }

  const components = []
  if (paymentData.account_number) {
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copy_${paymentMethod}_number`)
        .setLabel("copy number")
        .setStyle(ButtonStyle.Secondary),
    )
    components.push(button)
  }

  await interaction.reply({ embeds: [embed], components })
}

async function handleCopyButton(interaction) {
  // Expected format: copy_{method}_{field}, e.g. copy_gcash_number
  const parts = interaction.customId.split("_")
  if (parts.length < 3) {
    await interaction.reply({ content: "Invalid copy action.", flags: MessageFlags.Ephemeral })
    return
  }

  const method = parts[1]
  const field = parts.slice(2).join("_")
  const paymentData = paymentModel.getByMethod(interaction.guild.id, method)

  if (!paymentData) {
    await interaction.reply({ content: `Payment method **${method}** is not configured.`, flags: MessageFlags.Ephemeral })
    return
  }

  let content = ""
  if (field === "number") {
    content = paymentData.account_number ? `Account number: ${paymentData.account_number}` : "No account number is configured for this payment method."
  } else if (field === "name") {
    content = paymentData.account_name ? `Account name: ${paymentData.account_name}` : "No account name is configured for this payment method."
  } else {
    content = `Payment info: ${paymentData.display_name}`
  }

  await interaction.reply({ content, flags: MessageFlags.Ephemeral })
}

async function handleOrderFormStart(interaction) {
  const channelId = interaction.channel.id
  const userId = interaction.user.id

  const orderState = orderModel.getState(interaction.guild.id, channelId)

  if (!orderState || orderState.state !== "awaiting_start") {
    await interaction.reply({
      content: "This order session has expired. Please create a new ticket.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Update state to awaiting_item
  orderModel.setState(interaction.guild.id, channelId, userId, "awaiting_item", orderState.data)

  // Ask first question
  await interaction.reply({
    content: "what item would you like to purchase?\n-# bobux , nboozt , decor, load , etc.",
  })
}

async function handleOrderStatusSelect(interaction) {
  // customId format: order_status_select_{buyerId}
  const parts = interaction.customId.split("_")
  let buyerId = parts.slice(3).join("_")
  // Validate ID format (17-19 digits)
  if (buyerId && !/^\d{17,19}$/.test(buyerId)) {
    console.warn(`Invalid buyerId in customId: ${buyerId}`)
    buyerId = null
  }
  const selected = interaction.values[0]

  // Permission check: allow only ManageGuild, guild owner, or members with a role named 'Staff'
  const member = interaction.member
  const isOwner = interaction.guild && interaction.user.id === interaction.guild.ownerId
  const hasManage = member?.permissions?.has?.("ManageGuild")
  const hasStaffRole = member?.roles?.cache?.some((r) => r.name && r.name.toLowerCase() === "staff")

  if (!isOwner && !hasManage && !hasStaffRole) {
    await interaction.reply({ content: "You don't have permission to change order status.", ephemeral: true })
    return
  }

  const origEmbed = interaction.message.embeds[0]
  if (!origEmbed) {
    await interaction.reply({ content: "Original order embed not found.", ephemeral: true })
    return
  }

  const embed = new EmbedBuilder(origEmbed.data || origEmbed)

  // Update or add Status field
  const fields = (embed.data.fields || []).filter((f) => f.name !== "Status")
  fields.push({ name: "Status", value: selected, inline: true })
  embed.setFields(fields)

  // Change color for done
  if (selected === "done") {
    embed.setColor(0x57f287)
    // Queue persistence removed: status updated only in embed
  } else if (selected === "processing") {
    embed.setColor(0xf1c40f)
  } else {
    embed.setColor(0x007dfe)
  }

  await interaction.update({ embeds: [embed], components: interaction.message.components })
  // Persist status change to orders table and move ticket if linked
  try {
    const problems = []

    let order = ordersModel.getByMessage(interaction.guild.id, interaction.channel.id, interaction.message.id)
    if (!order) {
      order = ordersModel.getByMessageId(interaction.guild.id, interaction.message.id)
    }
    if (!order && buyerId) {
      order = ordersModel.getLatestByBuyer(interaction.guild.id, buyerId)
    }

    if (!order) {
      await interaction.followUp({
        content: `Order status updated to **${selected}**, but: couldn't find a matching order record for this message.`,
        ephemeral: true,
      })
      return
    }

    ordersModel.updateStatus(interaction.guild.id, order.id, selected)

    if (!order.ticket_channel_id) {
      await interaction.followUp({
        content: `Order status updated to **${selected}**, but: order is not linked to a ticket channel.`,
        ephemeral: true,
      })
      return
    }

    // update ticket status in DB
    try {
      ticketModel.setStatus(interaction.guild.id, order.ticket_channel_id, selected)
    } catch (e) {
      console.error("Failed to update ticket status:", e)
    }

    // fetch ticket channel
    let ticketChannel = interaction.guild.channels.cache.get(order.ticket_channel_id)
    if (!ticketChannel) {
      try {
        ticketChannel = await interaction.guild.channels.fetch(order.ticket_channel_id)
      } catch (err) {
        ticketChannel = null
      }
    }

    if (!ticketChannel) {
      await interaction.followUp({
        content: `Order status updated to **${selected}**, but: ticket channel could not be found.`,
        ephemeral: true,
      })
      return
    }

    // rename channel to reflect status (strip existing prefixes)
    try {
      const baseName = ticketChannel.name.replace(/^(noted-|processing-|done-|order-)/i, "")
      const prefix = selected === "processing" ? "processing" : selected === "done" ? "done" : "noted"
      const newName = `${prefix}-${baseName}`
      try {
        await ticketChannel.setName(newName)
      } catch (e) {
        console.error("Failed to rename ticket channel:", e)
        problems.push(`channel rename failed (${e.message || "Missing Permissions"})`)
      }
    } catch (e) {
      console.error("Failed to compute/rename ticket channel name:", e)
      problems.push(`channel rename failed (${e.message || "Failed to compute channel name"})`)
    }

    let moved = false

    if (selected === "processing") {
      let procCat = interaction.guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === "processing")
      const staffRole = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === "staff")

      const baseOverwrites = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        ...(staffRole ? [{
          id: staffRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        }] : [])
      ]

      if (!procCat) {
        try {
          procCat = await interaction.guild.channels.create({
            name: "processing",
            type: ChannelType.GuildCategory,
            permissionOverwrites: baseOverwrites
          })
        } catch (e) {
          console.error("Failed to create processing category:", e)
          problems.push(`couldn't create processing category (${e.message || "Missing Permissions"})`)
        }
      } else {
        // Force update category permissions to be private/limited
        try {
          await procCat.permissionOverwrites.set(baseOverwrites)
        } catch (e) {
          console.error("Failed to update processing category permissions:", e)
          problems.push(`couldn't update processing category permissions (${e.message || "Missing Permissions"})`)
        }
      }

      if (procCat) {
        try {
          await ticketChannel.setParent(procCat.id)

          // Secure permissions: Deny usage for everyone, allow specific access
          const newOverwrites = [...baseOverwrites]

          // Allow Buyer
          if (buyerId) {
            newOverwrites.push({
              id: buyerId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            })
          }

          // Allow Staff Role
          if (staffRole) {
            newOverwrites.push({
              id: staffRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            })
          }

          // Ensure the person (Admin/Staff) moving it doesn't lock themselves out if not owner/admin/staff-role
          if (interaction.user.id !== buyerId) {
            newOverwrites.push({
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            })
          }

          await ticketChannel.permissionOverwrites.set(newOverwrites)

          moved = true
        } catch (e) {
          console.error("Failed to move ticket to processing category:", e)
          problems.push(`couldn't move channel to processing category (${e.message || "Missing Permissions"})`)
        }
      }

      await ticketChannel.send(
        "your order is being processed !ʚɞ\nwe've started working on your request and it's currently in progress.\n\nplease continue to be patient with us — we'll update you once it's ready, thank you for your patience !",
      )
    } else if (selected === "done") {
      let doneCat = interaction.guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === "done")
      const staffRole = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === "staff")

      const baseOverwrites = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        ...(staffRole ? [{
          id: staffRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        }] : [])
      ]

      if (!doneCat) {
        try {
          doneCat = await interaction.guild.channels.create({
            name: "done",
            type: ChannelType.GuildCategory,
            permissionOverwrites: baseOverwrites
          })
        } catch (e) {
          console.error("Failed to create done category:", e)
          problems.push(`couldn't create done category (${e.message || "Missing Permissions"})`)
        }
      } else {
        try {
          await doneCat.permissionOverwrites.set(baseOverwrites)
        } catch (e) {
          console.error("Failed to update done category permissions:", e)
          problems.push(`couldn't update done category permissions (${e.message || "Missing Permissions"})`)
        }
      }

      if (doneCat) {
        try {
          await ticketChannel.setParent(doneCat.id)

          const newOverwrites = [...baseOverwrites]

          // Allow Buyer
          if (buyerId) {
            newOverwrites.push({
              id: buyerId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            })
          }

          // Ensure the person (Admin/Staff) moving it doesn't lock themselves out
          if (interaction.user.id !== buyerId) {
            newOverwrites.push({
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            })
          }

          await ticketChannel.permissionOverwrites.set(newOverwrites)
          moved = true
        } catch (e) {
          console.error("Failed to move ticket to done category:", e)
          problems.push(`couldn't move channel to done category (${e.message || "Missing Permissions"})`)
        }
      }

      const vouchChannel = interaction.guild.channels.cache.find((c) => c.name === "vouchie" && c.type === ChannelType.GuildText)
      const vouchMention = vouchChannel ? `<#${vouchChannel.id}>` : "#vouchie"

      await ticketChannel.send(
        `your order is complete !  ʚɞ\nto help us keep everything organized, please vouch/confirm your order in ${vouchMention} once you receive it.\n\n your confirmation really helps us improve and serve you better!`,
      )
    }

    // send single consolidated ephemeral feedback to the user who changed status
    try {
      let feedback = `Order status updated to **${selected}**`
      if (problems.length === 0 && moved) {
        feedback += " and ticket moved."
      } else if (problems.length === 0) {
        feedback += "."
      } else {
        feedback += `, but: ${problems.join("; ")}.`
      }
      await interaction.followUp({ content: feedback, ephemeral: true })
    } catch (e) {
      // ignore followUp errors
    }
  } catch (e) {
    console.error("Error handling order status persistence/movement:", e)
  }
}
