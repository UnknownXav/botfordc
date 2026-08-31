import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js"
import { configModel } from "../database/models/config.js"

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Manage shop status and announcements")
    .addSubcommand((sc) =>
      sc
        .setName("setup")
        .setDescription("Set the category to lock/unlock and announcement channels")
        .addChannelOption((opt) =>
          opt.setName("category")
            .setDescription("The category to manage")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt.setName("rules_channel")
            .setDescription("Rules channel to mention")
            .setRequired(false)
        )
        .addChannelOption((opt) =>
          opt.setName("inquiries_channel")
            .setDescription("Inquiries channel to mention")
            .setRequired(false)
        ),
    )
    .addSubcommand((sc) =>
      sc
        .setName("open")
        .setDescription("Open the shop (unlock category + announce)")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to post the announcement in")),
    )
    .addSubcommand((sc) =>
      sc
        .setName("close")
        .setDescription("Close the shop (lock category + announce)")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to post the announcement in")),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand()

    // Handle Setup
    if (sub === "setup") {
      const category = interaction.options.getChannel("category")
      const rulesChannel = interaction.options.getChannel("rules_channel")
      const inquiriesChannel = interaction.options.getChannel("inquiries_channel")

      configModel.set(interaction.guild.id, "shop_category", category.id)
      if (rulesChannel) {
        configModel.set(interaction.guild.id, "rules_channel", rulesChannel.id)
      }
      if (inquiriesChannel) {
        configModel.set(interaction.guild.id, "inquiries_channel", inquiriesChannel.id)
      }

      let replyContent = `Shop category set to **${category.name}**.`
      if (rulesChannel) replyContent += ` Rules channel: <#${rulesChannel.id}>.`
      if (inquiriesChannel) replyContent += ` Inquiries channel: <#${inquiriesChannel.id}>.`
      replyContent += ` It will be locked/unlocked via /shop close and /shop open.`

      await interaction.reply({ content: replyContent, ephemeral: true })
      return
    }

    const target = interaction.options.getChannel("channel") || interaction.channel

    if (!target) {
      await interaction.reply({ content: "Channel not found.", ephemeral: true })
      return
    }

    // ensure we can send to the channel
    if (typeof target.isTextBased === "function" && !target.isTextBased()) {
      await interaction.reply({ content: "Target is not a text channel.", ephemeral: true })
      return
    }

    const rulesChannelId = configModel.get(interaction.guild.id, "rules_channel")
    const inquiriesChannelId = configModel.get(interaction.guild.id, "inquiries_channel")

    const rulesMention = rulesChannelId ? `<#${rulesChannelId}>` : "#rules"
    const inquiriesMention = inquiriesChannelId ? `<#${inquiriesChannelId}>` : "#inquiries"

    const headerOpen = `## shop is now open ! ʚɞ
      @everyone 

      — feel free to ask anytime in ${inquiriesMention}
      — always check #daily sales
      — you may create a #ticket here if you’d like to order
      — read ${rulesMention} so everything’s clear`

    const headerClose = `## shop is now closed ! ʚɞ
      @everyone 

      — tickets are still open 
      — you may still send your orders, and you can expect them 
      to be processed tomorrow all pending orders will be continued tomorrow
      — inquiries are still welcome, but responses may be slower`

    // Manage Category Permissions
    const shopCategoryId = configModel.get(interaction.guild.id, "shop_category")
    let categoryActionMsg = ""

    if (shopCategoryId) {
      try {
        const shopCategory = interaction.guild.channels.cache.get(shopCategoryId) || await interaction.guild.channels.fetch(shopCategoryId).catch(() => null)

        if (shopCategory) {
          if (sub === "open") {
            // Unlock: Reset @everyone view to null (inherit) or true
            // Usually setting to null allows it to inherit or be visible if neutral. 
            // To be safe, let's set ViewChannel: true or null. 
            // If the server is private, we might want to just remove the Deny.
            // Let's just remove the ViewChannel deny from @everyone

            await shopCategory.permissionOverwrites.edit(interaction.guild.id, {
              ViewChannel: null // Remove explicit deny/allow, fall back to role defaults
            })
            categoryActionMsg = `(Category **${shopCategory.name}** unlocked)`
          } else if (sub === "close") {
            // Lock: Deny @everyone view
            await shopCategory.permissionOverwrites.edit(interaction.guild.id, {
              ViewChannel: false
            })
            categoryActionMsg = `(Category **${shopCategory.name}** locked)`
          }
        } else {
          categoryActionMsg = "(Linked shop category not found)"
        }
      } catch (e) {
        console.error("Failed to update shop category permissions:", e)
        categoryActionMsg = "(Failed to update category permissions)"
      }
    }


    if (sub === "open") {
      const content = headerOpen

      const sent = await target.send({ content })
      const link = `https://discord.com/channels/${interaction.guild.id}/${sent.channel.id}/${sent.id}`

      // delete any prior close announcement from the bot in this channel so they take turns
      try {
        const fetched = await target.messages.fetch({ limit: 50 })
        for (const msg of fetched.values()) {
          if (msg.id === sent.id) continue
          if (msg.author?.id === interaction.client.user.id && msg.content && msg.content.includes("## shop is now closed !")) {
            try { await msg.delete() } catch (e) { /* ignore deletion errors */ }
          }
        }
      } catch (e) {
        // ignore fetch/delete errors
      }

      await interaction.reply({ content: `Posted open announcement: ${link} ${categoryActionMsg}`, ephemeral: true })
      return
    }

    if (sub === "close") {
      const content = headerClose

      const sent = await target.send({ content })
      const link = `https://discord.com/channels/${interaction.guild.id}/${sent.channel.id}/${sent.id}`

      // delete any prior open announcement from the bot in this channel so they take turns
      try {
        const fetched = await target.messages.fetch({ limit: 50 })
        for (const msg of fetched.values()) {
          if (msg.id === sent.id) continue
          if (msg.author?.id === interaction.client.user.id && msg.content && msg.content.includes("## shop is now open !")) {
            try { await msg.delete() } catch (e) { /* ignore deletion errors */ }
          }
        }
      } catch (e) {
        // ignore fetch/delete errors
      }

      await interaction.reply({ content: `Posted close announcement: ${link} ${categoryActionMsg}`, ephemeral: true })
      return
    }

    await interaction.reply({ content: "Unknown subcommand.", ephemeral: true })
  },
}
