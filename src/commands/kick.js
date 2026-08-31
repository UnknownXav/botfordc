import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for kick").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason") || "No reason provided"

    try {
      const member = await interaction.guild.members.fetch(user.id)

      if (!member.kickable) {
        await interaction.reply({
          content: "I cannot kick this user! They may have higher permissions than me.",
          ephemeral: true,
        })
        return
      }

      await member.kick(reason)

      const embed = new EmbedBuilder()
        .setTitle("User Kicked")
        .setDescription(`${user.tag} has been kicked from the server.`)
        .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.tag })
        .setColor(0xfaa61a)
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.error("Error kicking user:", error)
      await interaction.reply({
        content: "There was an error trying to kick this user.",
        ephemeral: true,
      })
    }
  },
}
