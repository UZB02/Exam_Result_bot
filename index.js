const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
require("dotenv").config();
require("./db");
const adminCommands = require("./adminCommands.js");

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false }); // polling o'chiriladi

// ADMIN COMMANDS
adminCommands(bot);

// Render.com webhook endpoint
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body); // Telegram update ni botga yuboramiz
  res.sendStatus(200);
});

// MongoDB ulanish
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB xato:", err));

// Telegram webhookni o‘rnatish
(async () => {
  const url = process.env.WEBHOOK_URL;
  await bot.setWebHook(`${url}`);
  console.log("Webhook set:", url);
})();

// Serverni ishga tushirish
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server port ${PORT} da ishlamoqda`);
});
