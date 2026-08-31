import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"

export default {
  data: new SlashCommandBuilder().setName("verify").setDescription("Start the verification process"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Verification Required")
      .setDescription("Click the button below to start the captcha verification process.")
      .setColor(0x57f287)

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("verify_start").setLabel("Start Verification").setStyle(ButtonStyle.Success),
    )

    await interaction.reply({
      embeds: [embed],
      components: [button],
      ephemeral: true,
    })
  },
}
