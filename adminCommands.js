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
  // 📤 Bitta sinfga natija yuborish INLINE
  // -----------------------------------
  // bot.on("message", async (msg) => {
  //   if (msg.text === "📤 Bitta sinfga natija yuborish") {
  //     if (!ADMIN_IDS.includes(msg.from.id.toString()))
  //       return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

  //     const groups = await Group.find();
  //     const inlineKeyboard = buildInlineKeyboard(groups, "result", 3);

  //     return bot.sendMessage(msg.chat.id, "📝 Qaysi sinfga natija yuborasiz?", {
  //       reply_markup: { inline_keyboard: inlineKeyboard },
  //     });
  //   }
  // });
  // -----------------------------------
  // 📢 Bitta sinfga xabar yuborish INLINE
  // -----------------------------------
 let pendingMessage = null;

 bot.on("message", async (msg) => {
   // 1) Admin bosganda reset qilinadi
   if (msg.text === "📢 Bitta sinfga xabar yuborish") {
     if (!ADMIN_IDS.includes(msg.from.id.toString()))
       return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

     pendingMessage = null;
     return bot.sendMessage(
       msg.chat.id,
       "➡️ Endi yubormoqchi bo‘lgan xabaringizni yuboring (matn, rasm, video, hujjat — barchasi bo‘ladi):"
     );
   }

   // 2) Agar hali xabar olinmagan bo‘lsa
   if (!pendingMessage && msg.text !== "📢 Bitta sinfga xabar yuborish") {
     // ❗ Har qanday turdagi xabarni olish uchun butun msg obyektini saqlaymiz
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
          await sendAnyMessage(bot, group.chatId, msg);
        } catch (err) {
          console.log("Xabar yuborishda xato:", err.message);
        }
      }

      return bot.sendMessage(
        msg.chat.id,
        "✅ Xabar barcha guruhlarga yuborildi!"
      );
    }
  });
async function sendAnyMessage(bot, chatId, msg) {
  // TEXT
  if (msg.text) return bot.sendMessage(chatId, msg.text);

  // PHOTO
  if (msg.photo)
    return bot.sendPhoto(chatId, msg.photo[msg.photo.length - 1].file_id, {
      caption: msg.caption || "",
    });

  // VIDEO
  if (msg.video)
    return bot.sendVideo(chatId, msg.video.file_id, {
      caption: msg.caption || "",
    });

  // DOCUMENT
  if (msg.document)
    return bot.sendDocument(chatId, msg.document.file_id, {
      caption: msg.caption || "",
    });

  // AUDIO
  if (msg.audio)
    return bot.sendAudio(chatId, msg.audio.file_id, {
      caption: msg.caption || "",
    });

  // VOICE
  if (msg.voice) return bot.sendVoice(chatId, msg.voice.file_id);

  // VIDEO NOTE
  if (msg.video_note) return bot.sendVideoNote(chatId, msg.video_note.file_id);

  // ANIMATION (GIF)
  if (msg.animation)
    return bot.sendAnimation(chatId, msg.animation.file_id, {
      caption: msg.caption || "",
    });

  // STICKER
  if (msg.sticker) return bot.sendSticker(chatId, msg.sticker.file_id);

  // CONTACT
  if (msg.contact)
    return bot.sendContact(
      chatId,
      msg.contact.phone_number,
      msg.contact.first_name
    );

  // LOCATION
  if (msg.location)
    return bot.sendLocation(
      chatId,
      msg.location.latitude,
      msg.location.longitude
    );

  // POLL — forward bo‘lmaydi → qayta yubora olmaymiz
  if (msg.poll)
    return bot.sendMessage(
      chatId,
      "⚠ Ushbu formatni qayta yuborib bo‘lmaydi (poll)."
    );

  // DICE
  if (msg.dice) return bot.sendDice(chatId, { emoji: msg.dice.emoji || "🎲" });

  // DEFAULT
  return bot.sendMessage(chatId, "⚠ Ushbu format qo‘llab-quvvatlanmaydi.");
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
    // Bitta sinfga natija yuborish
    // if (data.startsWith("result_")) {
    //   const className = data.replace("result_", "");
    //   const group = await Group.findOne({ name: className });
    //   if (!group)
    //     return bot.sendMessage(msg.chat.id, "❌ Bunday sinf topilmadi!");

    //   const sheetData = await getSheetData(group.name);
    //   const imagePath = await generateImageFromSheetData(sheetData, group.name);
    //   await sendWithRetry(group.chatId, imagePath, true);
    //   await deleteImage(imagePath);

    //   return bot.sendMessage(
    //     msg.chat.id,
    //     `✅ ${group.name} sinfiga yuborildi!`
    //   );
    // }
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
      if (pendingMessage.text)
        await sendWithRetry(group.chatId, pendingMessage.text, false);
      if (pendingMessage.photo) {
        const fileId =
          pendingMessage.photo[pendingMessage.photo.length - 1].file_id;
        await sendWithRetry(group.chatId, fileId, true);
      }

      pendingMessage = null;

      return bot.sendMessage(
        msg.chat.id,
        `✅ Xabar *${group.name}* sinfiga yuborildi!`
      );
    }
    await bot.answerCallbackQuery(callbackQuery.id);
  });
};
