// controllers/adminController.js
const Group = require("./models/Group.js");
const { getSheetData } = require("./googleService.js");
const {
  generateImageFromSheetData,
  deleteImage,
} = require("./utils/imageGenerator.js");

// 🔥 Bir nechta admin
const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(" ").map((id) => id.trim())
  : [];

module.exports = (bot) => {
  // -----------------------------------
  // /start → Admin menyusi
  // -----------------------------------
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (ADMIN_IDS.includes(userId)) {
      bot.sendMessage(
        chatId,
        "Assalomu alaykum, Admin!\nQuyidagi menyudan buyruq tanlang:",
        {
          reply_markup: {
            keyboard: [
              [
                { text: "📤 Barcha sinflarga natija yuborish" },
                // { text: "📤 Bitta sinfga natija yuborish" },
              ],
              [
                { text: "📢 Barcha guruhlarga xabar yuborish" },
                { text: "📢 Bitta sinfga xabar yuborish" },
              ],
            ],
            resize_keyboard: true,
          },
        }
      );
    } else {
      bot.sendMessage(chatId, "Assalomu alaykum! Botga xush kelibsiz.");
    }
  });

  // -----------------------------------
  //   /register (yangi sinf qo‘shish)
  // -----------------------------------
  bot.onText(/\/register (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const className = match[1];

    if (!ADMIN_IDS.includes(msg.from.id.toString())) {
      return bot.sendMessage(chatId, "❌ Siz admin emassiz!");
    }

    await Group.create({ name: className, chatId });
    bot.sendMessage(chatId, `✅ ${className} sinfi ro‘yxatga olindi.`);
  });
  // -----------------------------------
  // 🔹 429 himoyalangan yuborish
  // -----------------------------------
  async function sendWithRetry(chatId, content, caption = "", isPhoto = false) {
    try {
      if (isPhoto) {
        return await bot.sendPhoto(chatId, content, {
          caption: caption,
        });
      } else {
        return await bot.sendMessage(chatId, content);
      }
    } catch (err) {
      const retry = err?.response?.body?.parameters?.retry_after;
      if (retry) {
        console.log(`⏳ 429! ${retry} soniya kutilyapti...`);
        await new Promise((res) => setTimeout(res, retry * 1000));
        return await sendWithRetry(chatId, content, caption, isPhoto);
      }
      console.error("TELEGRAM ERROR:", err?.response?.body || err);
      throw err;
    }
  }
  // -----------------------------------
  // Inline tugmalarni chiroyli joylashtirish
  // -----------------------------------
  function buildInlineKeyboard(groups, prefix, perRow = 3) {
    const keyboard = [];
    let row = [];
    groups.forEach((g, idx) => {
      row.push({ text: g.name, callback_data: `${prefix}_${g.name}` });
      if ((idx + 1) % perRow === 0) {
        keyboard.push(row);
        row = [];
      }
    });
    if (row.length) keyboard.push(row);
    return keyboard;
  }
  // -----------------------------------
  // 📤 Barcha sinflarga natija yuborish
  // -----------------------------------
  bot.on("message", async (msg) => {
    if (msg.text === "📤 Barcha sinflarga natija yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString()))
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");
      const groups = await Group.find();
      for (const group of groups) {
        try {
          const sheetData = await getSheetData(group.name);
          const imagePath = await generateImageFromSheetData(
            sheetData,
            group.name
          );
          await sendWithRetry(
            group.chatId,
            imagePath,
            `${sheetData[0][0]}!`,
            true
          );
          await deleteImage(imagePath);
        } catch (err) {
          console.error("❌ XATOLIK:", err?.message);
        }
      }
      return bot.sendMessage(
        msg.chat.id,
        "✅ Barcha sinflarga natijalar yuborildi!"
      );
    }
  });
// -----------------------------------
  // 📢 Bitta sinfga xabar yuborish INLINE
  // -----------------------------------
  let pendingMessage = null;

  bot.on("message", async (msg) => {
    // 1) Admin tekshiruvi
    if (msg.text === "📢 Bitta sinfga xabar yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString()))
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

      pendingMessage = null;

      return bot.sendMessage(
        msg.chat.id,
        "➡️ Endi yubormoqchi bo‘lgan xabaringizni yuboring:"
      );
    }

    // 2) Xabar faqat ADMIN va faqat PRIVATE CHATdan bo‘lsa qabul qilamiz
    if (
      !pendingMessage &&
      msg.chat.type === "private" && // ❗️ tugmalar guruhga chiqmasligi uchun
      ADMIN_IDS.includes(msg.from.id.toString())
    ) {
      pendingMessage = msg;

      const groups = await Group.find();
      const inlineKeyboard = buildInlineKeyboard(groups, "message", 3);

      return bot.sendMessage(msg.chat.id, "📝 Qaysi sinfga yuborasiz?", {
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
    }
  });
  // -----------------------------------
  // 📢 Barcha guruhlarga xabar yuborish
  // -----------------------------------
  let broadcastAllMode = false;

  bot.on("message", async (msg) => {
    if (msg.text === "📢 Barcha guruhlarga xabar yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString()))
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

      broadcastAllMode = true;
      return bot.sendMessage(
        msg.chat.id,
        "📢 Endi yubormoqchi bo‘lgan xabaringizni yuboring (har qanday format bo‘ladi):"
      );
    }

 if (broadcastAllMode) {
      broadcastAllMode = false;

      const groups = await Group.find();

      for (const group of groups) {
        try {
          // Bu yerda msg — admin yuborgan o'sha rasm/video/matn
          await bot.copyMessage(group.chatId, msg.chat.id, msg.message_id);
        } catch (err) {
          console.log(`${group.chatId} ga yuborishda xato:`, err.message);
        }
      }

      return bot.sendMessage(
        msg.chat.id,
        "✅ Xabar barcha guruhlarga asl formatida yuborildi!"
      );
    }
  });
// Eski sendAnyMessage funksiyasini mana bu bilan almashtiring yoki shunchaki copyMessage ishlatib ketavering
async function sendAnyMessage(bot, chatId, msg) {
  try {
    // copyMessage xabarni hamma formati (bold, italic, link) bilan ko'chirib beradi
    return await bot.copyMessage(chatId, msg.chat.id, msg.message_id);
  } catch (err) {
    console.error("Xabar nusxalashda xato:", err.message);
    // Agar xabar copy qilib bo'lmaydigan bo'lsa (masalan, Poll), oddiy xabar yuboradi
    return bot.sendMessage(chatId, "⚠ Ushbu xabarni yuborib bo'lmadi.");
  }
}

  // -----------------------------------
  // CALLBACK QUERY HANDLING
  // -----------------------------------
  bot.on("callback_query", async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id.toString();

    if (!ADMIN_IDS.includes(userId)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Siz admin emassiz!",
      });
    }
    // Bitta sinfga xabar yuborish
    if (data.startsWith("message_")) {
      const className = data.replace("message_", "");
      const group = await Group.findOne({ name: className });
      if (!group)
        return bot.sendMessage(msg.chat.id, "❌ Bunday sinf topilmadi!");
      if (!pendingMessage) {
        return bot.sendMessage(
          msg.chat.id,
          "❌ Xabar hali saqlanmagan. Avval xabar yuboring."
        );
      }
      // ❗ HAR QANDAY FORMATDAGI XABARNI NUSXA KO‘CHIRIB YUBORAMIZ
      await bot.copyMessage(
        group.chatId,
        pendingMessage.chat.id,
        pendingMessage.message_id
      );
      pendingMessage = null;
      return bot.sendMessage(
        msg.chat.id,
        `✅ Xabar *${group.name}* sinfiga yuborildi!`
      );
    }
    await bot.answerCallbackQuery(callbackQuery.id);
  });
};
