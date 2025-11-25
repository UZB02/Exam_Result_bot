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
              [{ text: "📤 Barcha sinflarga natija yuborish" }],
              [{ text: "📤 Bitta sinfga natija yuborish" }],
              [{ text: "📢 Barcha guruhlarga xabar yuborish" }],
              [{ text: "📢 Bitta sinfga xabar yuborish" }],
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
  // 🔥 429 holdan himoya qilingan yuborish
  // -----------------------------------
  async function sendWithRetry(chatId, imagePath, caption = "") {
    try {
      return await bot.sendPhoto(chatId, imagePath, { caption });
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
  // 📤 2) BITTA SINFGA NATIJA YUBORISH
  // ---------------------------------------------------
  let chooseClassForResult = false;

  bot.on("message", async (msg) => {
    if (msg.text === "📤 Bitta sinfga natija yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString()))
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

      const groups = await Group.find();

      chooseClassForResult = true;

      return bot.sendMessage(msg.chat.id, "📝 Qaysi sinfga natija yuborasiz?", {
        reply_markup: {
          keyboard: groups.map((g) => [{ text: g.name }]),
          resize_keyboard: true,
        },
      });
    }

    if (chooseClassForResult) {
      chooseClassForResult = false;

      const group = await Group.findOne({ name: msg.text });
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
  });

  // ---------------------------------------------------
  // 📢 3) BARCHA SINFLARGA XABAR YUBORISH
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
          if (msg.text) await bot.sendMessage(group.chatId, msg.text);
          if (msg.photo)
            await bot.sendPhoto(
              group.chatId,
              msg.photo[msg.photo.length - 1].file_id
            );
        } catch (err) {
          console.log("Xabar yuborishda xato:", err.message);
        }
      }

      return bot.sendMessage(msg.chat.id, "✅ Xabar yuborildi!");
    }
  });

  // ---------------------------------------------------
  // 📢 4) BITTA SINFGA XABAR YUBORISH
  // ---------------------------------------------------
  let chooseClassForMessage = false;
  let pendingMessage = null;

  bot.on("message", async (msg) => {
    if (msg.text === "📢 Bitta sinfga xabar yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString()))
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");

      const groups = await Group.find();

      chooseClassForMessage = true;

      return bot.sendMessage(msg.chat.id, "📝 Qaysi sinfga yuborasiz?", {
        reply_markup: {
          keyboard: groups.map((g) => [{ text: g.name }]),
          resize_keyboard: true,
        },
      });
    }

    // Xabarni avval saqlab qo‘yamiz
    if (
      chooseClassForMessage &&
      !pendingMessage &&
      msg.text !== "📢 Bitta sinfga xabar yuborish"
    ) {
      pendingMessage = msg;
      return bot.sendMessage(msg.chat.id, "➡️ Endi sinf nomini yuboring:");
    }

    // Sinfni qabul qilamiz
    if (chooseClassForMessage && pendingMessage) {
      chooseClassForMessage = false;

      const group = await Group.findOne({ name: msg.text });
      if (!group) {
        pendingMessage = null;
        return bot.sendMessage(msg.chat.id, "❌ Bunday sinf yo‘q!");
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
  });
};
