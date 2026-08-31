import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { configModel } from "../database/models/config.js"

export default {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure welcome messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set the welcome message channel")
        .addChannelOption((option) =>
          option.setName("channel").setDescription("Channel for welcome messages").setRequired(true),
        )
        .addChannelOption((option) =>
          option.setName("verify").setDescription("Verify channel to mention").setRequired(true),
        )
        .addChannelOption((option) =>
          option.setName("rules").setDescription("Rules channel to mention").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("disable").setDescription("Disable welcome messages")),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === "set") {
      const channel = interaction.options.getChannel("channel")
      const verifyChannel = interaction.options.getChannel("verify")
      const rulesChannel = interaction.options.getChannel("rules")

      if (!channel || !verifyChannel || !rulesChannel) {
        return await interaction.reply({
          content: "One or more channels could not be found. Please try again.",
          ephemeral: true,
        })
      }

      configModel.set("welcome_channel", channel.id)
      configModel.set("verify_channel", verifyChannel.id)
      configModel.set("rules_channel", rulesChannel.id)

      await interaction.reply({
        content: `Welcome messages enabled in ${channel}!\nVerify: ${verifyChannel}\nRules: ${rulesChannel}`,
        ephemeral: true,
      })
    } else if (interaction.options.getSubcommand() === "disable") {
      configModel.delete("welcome_channel")
      configModel.delete("verify_channel")
      configModel.delete("rules_channel")

      await interaction.reply({
        content: "Welcome messages have been disabled.",
        ephemeral: true,
      })
    }
  },
}
