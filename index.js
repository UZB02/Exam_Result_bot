// index.js
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
require("dotenv").config();
require("./db");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ADMIN CONTROLLERNI ULAYMIZ
require("./adminCommands.js")(bot);

console.log("Bot ishga tushdi...");
