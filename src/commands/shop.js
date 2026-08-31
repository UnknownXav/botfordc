import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js"
import { configModel } from "../database/models/config.js"

export default {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Manage shop status and announcements")
    .addSubcommand((sc) =>
      sc
        .setName("setup")
        .setDescription("Set the category to lock/unlock when shop opens/closes")
        .addChannelOption((opt) =>
          opt.setName("category")
            .setDescription("The category to manage")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
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
      configModel.set("shop_category", category.id)
      await interaction.reply({ content: `Shop category set to **${category.name}**. It will be locked/unlocked via /shop close and /shop open.`, ephemeral: true })
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

    const headerOpen = `## shop is now open ! ʚɞ
      @everyone 

      — feel free to ask anytime in  #inquiries
      — always check #daily sales
      — you may create a #ticket here if you’d like to order
      — read <#1368119390662561824>rules so everything’s clear`

    const headerClose = `## shop is now closed ! ʚɞ
      @everyone 

      — tickets are still open 
      — you may still send your orders, and you can expect them 
      to be processed tomorrow all pending orders will be continued tomorrow
      — inquiries are still welcome, but responses may be slower`

    // Manage Category Permissions
    const shopCategoryId = configModel.get("shop_category")
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
        const otherHeader = headerClose // The close message link
        for (const msg of fetched.values()) {
          if (msg.id === sent.id) continue
          if (msg.author?.id === interaction.client.user.id && msg.content && msg.content.includes(otherHeader)) {
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
        const otherHeader = headerOpen // The open message link
        for (const msg of fetched.values()) {
          if (msg.id === sent.id) continue
          if (msg.author?.id === interaction.client.user.id && msg.content && msg.content.includes(otherHeader)) {
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
