import express from "express"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import config from "../config.js"
import { vouchModel } from "../database/models/vouch.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

// Set view engine
app.set("view engine", "ejs")
app.set("views", join(__dirname, "views"))

// Static files
app.use(express.static(join(__dirname, "public")))

// Routes
app.get("/", (req, res) => {
  res.status(404).send("Please specify a server ID to view vouches: /g/YOUR_GUILD_ID")
})

app.get("/g/:guildId", (req, res) => {
  const { guildId } = req.params
  res.render("index", { title: "Discord Bot - Vouch System", guildId })
})

app.get("/api/g/:guildId/vouches", (req, res) => {
  try {
    const { guildId } = req.params
    const vouches = vouchModel.getAll(guildId)
    res.json({ success: true, data: vouches })
  } catch (error) {
    console.error("Error fetching vouches:", error)
    res.status(500).json({ success: false, error: "Failed to fetch vouches" })
  }
})

app.get("/api/g/:guildId/vouches/:userId", (req, res) => {
  try {
    const { guildId, userId } = req.params
    const vouches = vouchModel.getByUserId(guildId, userId)
    const count = vouchModel.getCount(guildId, userId)

    res.json({
      success: true,
      data: {
        vouches,
        count,
        userId,
      },
    })
  } catch (error) {
    console.error("Error fetching user vouches:", error)
    res.status(500).json({ success: false, error: "Failed to fetch user vouches" })
  }
})

app.get("/g/:guildId/user/:userId", (req, res) => {
  try {
    const { guildId, userId } = req.params
    const vouches = vouchModel.getByUserId(guildId, userId)
    const count = vouchModel.getCount(guildId, userId)

    if (vouches.length === 0) {
      res.render("user", {
        title: "User Vouches",
        guildId,
        userId,
        userTag: "Unknown User",
        vouches: [],
        count: 0,
      })
      return
    }

    const userTag = vouches[0].target_tag

    res.render("user", {
      title: `${userTag} - Vouches`,
      guildId,
      userId,
      userTag,
      vouches,
      count,
    })
  } catch (error) {
    console.error("Error fetching user vouches:", error)
    res.status(500).send("Error loading user vouches")
  }
})

export function startWebServer(client) {
  app.locals.client = client

  const server = app.listen(config.port, () => {
    console.log(`Web server running on ${config.webUrl}`)
  })

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Web Server Error] Port ${config.port} is already in use. Clean up the process or set PORT in .env.`)
    } else {
      console.error("[Web Server Error]", err)
    }
  })
}
