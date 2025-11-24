const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
require("dotenv").config();
require("./db");

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_PATH = `/webhook/${TOKEN}`;
const WEBHOOK_URL = `${process.env.WEBHOOK_URL}${WEBHOOK_PATH}`;

// Botni webhook rejimida ishga tushiramiz
const bot = new TelegramBot(TOKEN, { webHook: true });

// Webhookni sozlaymiz
bot.setWebHook(WEBHOOK_URL);

console.log("Webhook set to:", WEBHOOK_URL);

// Express → webhook endpoint
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Admin komandalar
require("./adminCommands")(bot);

// ===============================
// 🔥 AUTO-PING — Render uyquga ketmasin
// ===============================
setInterval(() => {
  fetch(process.env.WEBHOOK_URL)
    .then(() => console.log("♻️ Auto-ping sent"))
    .catch((e) => console.log("Auto-ping error:", e.message));
}, 10 * 60 * 1000); // ➝ har 10 daqiqada ping
// Server run
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
