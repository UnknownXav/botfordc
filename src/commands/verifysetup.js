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
    .setName("verifysetup")
    .setDescription("Post the verification panel in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to send the verification panel")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel")

    if (!channel) {
      return await interaction.reply({
        content: "Could not find the specified channel. Please try again.",
        ephemeral: true,
      })
    }

    const embed = new EmbedBuilder()
      .setTitle("Verification Required")
      .setDescription("Click the button below to start the captcha verification process.")
      .setColor(0x57f287)

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_start")
        .setLabel("Start Verification")
        .setStyle(ButtonStyle.Success)
    )

    try {
      await channel.send({
        embeds: [embed],
        components: [row],
      })

      await interaction.reply({
        content: `Verification panel posted in ${channel}.`,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error posting verification panel:", error)
      await interaction.reply({
        content: "Failed to post verification panel. Make sure I have permissions in that channel.",
        ephemeral: true,
      })
    }
  },
}
