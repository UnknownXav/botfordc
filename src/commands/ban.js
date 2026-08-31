import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => option.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for ban").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason") || "No reason provided"

    try {
      const member = await interaction.guild.members.fetch(user.id)

      if (!member.bannable) {
        await interaction.reply({
          content: "I cannot ban this user! They may have higher permissions than me.",
          ephemeral: true,
        })
        return
      }

      await member.ban({ reason })

      const embed = new EmbedBuilder()
        .setTitle("User Banned")
        .setDescription(`${user.tag} has been banned from the server.`)
        .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.tag })
        .setColor(0xed4245)
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.error("Error banning user:", error)
      await interaction.reply({
        content: "There was an error trying to ban this user.",
        ephemeral: true,
      })
    }
  },
}
