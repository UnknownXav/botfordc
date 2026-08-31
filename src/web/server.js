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
  res.render("index", { title: "Discord Bot - Vouch System" })
})

app.get("/api/vouches", (req, res) => {
  try {
    const vouches = vouchModel.getAll()
    res.json({ success: true, data: vouches })
  } catch (error) {
    console.error("Error fetching vouches:", error)
    res.status(500).json({ success: false, error: "Failed to fetch vouches" })
  }
})

app.get("/api/vouches/:userId", (req, res) => {
  try {
    const { userId } = req.params
    const vouches = vouchModel.getByUserId(userId)
    const count = vouchModel.getCount(userId)

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

app.get("/user/:userId", (req, res) => {
  try {
    const { userId } = req.params
    const vouches = vouchModel.getByUserId(userId)
    const count = vouchModel.getCount(userId)

    if (vouches.length === 0) {
      res.render("user", {
        title: "User Vouches",
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

  app.listen(config.port, () => {
    console.log(`Web server running on ${config.webUrl}`)
  })
}
