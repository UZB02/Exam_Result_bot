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
                { text: "📤 Bitta sinfga natija yuborish" },
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

  // Inline tugmalarni chiroyli joylashtirish funksiyasi
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

    if (row.length) keyboard.push(row); // qolgan tugmalar
    return keyboard;
  }

  // -----------------------------------
  // 🔥 429 holdan himoya qilingan yuborish
  // -----------------------------------
async function sendWithRetry(chatId, imagePath = null, caption = "") {
  try {
    if (imagePath) {
      return await bot.sendPhoto(chatId, imagePath, { caption });
    } else {
      return await bot.sendMessage(chatId, caption);
    }
  } catch (err) {
    const retry = err?.response?.body?.parameters?.retry_after;
    if (retry) {
      console.log(`⏳ 429! ${retry} soniya kutilyapti...`);
      await new Promise((res) => setTimeout(res, retry * 1000));
      return await sendWithRetry(chatId, imagePath, caption);
    }
    console.error("TELEGRAM ERROR:", err?.response?.body || err);
    throw err;
  }
}

  // ---------------------------------------------------
  // 📤 1) BARCHA SINFLARGA NATIJA YUBORISH
  // ---------------------------------------------------
  bot.on("message", (msg) => {
    if (msg.text === "📤 Barcha sinflarga natija yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString())) {
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");
      }
      bot.emit("send_results_all", msg);
    }
  });

  bot.on("send_results_all", async (msg) => {
    const groups = await Group.find();

    for (const group of groups) {
      try {
        const sheetData = await getSheetData(group.name);
        const imagePath = await generateImageFromSheetData(
          sheetData,
          group.name
        );

        await sendWithRetry(group.chatId, imagePath, `📊 ${group.name}`);
        await deleteImage(imagePath);
      } catch (err) {
        console.error("❌ XATOLIK:", err?.message);
      }
    }

    bot.sendMessage(msg.chat.id, "✅ Barcha sinflarga natijalar yuborildi!");
  });

  // ---------------------------------------------------
  // 📤 2) BITTA SINFGA NATIJA YUBORISH INLINE
  // ---------------------------------------------------
bot.on("message", async (msg) => {
  if (msg.text === "📤 Bitta sinfga natija yuborish") {
    if (!ADMIN_IDS.includes(msg.from.id.toString()))
      return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

    const groups = await Group.find();

    const inlineKeyboard = buildInlineKeyboard(groups, "result", 3); // 3 ta tugma bir qator

    return bot.sendMessage(msg.chat.id, "📝 Qaysi sinfga natija yuborasiz?", {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  }
});


  // ---------------------------------------------------
  // 📢 4) BITTA SINFGA XABAR YUBORISH INLINE
  // ---------------------------------------------------
  let pendingMessage = null;

 bot.on("message", async (msg) => {
   if (msg.text === "📢 Bitta sinfga xabar yuborish") {
     if (!ADMIN_IDS.includes(msg.from.id.toString()))
       return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

     pendingMessage = null;
     return bot.sendMessage(
       msg.chat.id,
       "➡️ Endi yubormoqchi bo‘lgan xabaringizni yuboring:"
     );
   }

   // Xabarni saqlaymiz
   if (
     !pendingMessage &&
     msg.text &&
     msg.text !== "📢 Bitta sinfga xabar yuborish"
   ) {
     pendingMessage = msg;

     const groups = await Group.find();

     const inlineKeyboard = buildInlineKeyboard(groups, "message", 3); // 3 ta tugma bir qator

     return bot.sendMessage(msg.chat.id, "📝 Qaysi sinfga yuborasiz?", {
       reply_markup: { inline_keyboard: inlineKeyboard },
     });
   }
 });


  // ---------------------------------------------------
  // CALLBACK QUERY HANDLING
  // ---------------------------------------------------
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
    if (data.startsWith("result_")) {
      const className = data.replace("result_", "");
      const group = await Group.findOne({ name: className });
      if (!group)
        return bot.sendMessage(msg.chat.id, "❌ Bunday sinf topilmadi!");

      const sheetData = await getSheetData(group.name);
      const imagePath = await generateImageFromSheetData(sheetData, group.name);

      await sendWithRetry(group.chatId, imagePath, `📊 ${group.name}`);
      await deleteImage(imagePath);

      return bot.sendMessage(
        msg.chat.id,
        `✅ ${group.name} sinfiga yuborildi!`
      );
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

      // Xabarni yuborish
      if (pendingMessage.text)
        await bot.sendMessage(group.chatId, pendingMessage.text);
      if (pendingMessage.photo)
        await bot.sendPhoto(
          group.chatId,
          pendingMessage.photo[pendingMessage.photo.length - 1].file_id
        );

      pendingMessage = null;

      return bot.sendMessage(
        msg.chat.id,
        `✅ Xabar *${group.name}* sinfiga yuborildi!`
      );
    }

    // Callbackni tugatish
    await bot.answerCallbackQuery(callbackQuery.id);
  });

  // ---------------------------------------------------
  // 📢 3) BARCHA SINFLARGA XABAR YUBORISH (mavjud)
  // ---------------------------------------------------
  let broadcastAllMode = false;

 bot.on("message", async (msg) => {
   if (msg.text === "📢 Barcha guruhlarga xabar yuborish") {
     if (!ADMIN_IDS.includes(msg.from.id.toString()))
       return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

     broadcastAllMode = true;
     return bot.sendMessage(
       msg.chat.id,
       "📢 Yuborayotgan xabaringiz barcha guruhlarga tarqatiladi."
     );
   }

   if (broadcastAllMode) {
     broadcastAllMode = false;

     const groups = await Group.find();

     for (const group of groups) {
       try {
         // Text yuborish
         if (msg.text) await sendWithRetry(group.chatId, msg.text, false);

         // Rasm yuborish (oxirgi rasm)
         if (msg.photo) {
           const fileId = msg.photo[msg.photo.length - 1].file_id;
           await sendWithRetry(group.chatId, fileId, true);
         }
       } catch (err) {
         console.log("Xabar yuborishda xato:", err.message);
       }
     }

     return bot.sendMessage(msg.chat.id, "✅ Xabar yuborildi!");
   }
 });
};
