import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js"

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
      .setTitle("gentle reminders")
      .setDescription(
        `**order**
— opening a ticket means you follow our rules.
— open only when you're sure.
— marketplace area , buy at your own risk.

**reports**
— warranty applies with vouch..

**others**
— claim prize , partnership , etc.`,
      )
      .setColor(0x2b2d31)

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_order").setLabel("order").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_report").setLabel("report").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_others").setLabel("others").setStyle(ButtonStyle.Primary),
    )

    try {
      await channel.send({
        embeds: [embed],
        components: [row],
      })

      await interaction.reply({
        content: `Ticket panel has been set up in ${channel}!`,
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
