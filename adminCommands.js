// controllers/adminController.js
const Group = require("./models/Group.js");
const { getSheetData } = require("./googleService.js");
const {
  generateImageFromSheetData,
  deleteImage,
  lastClassName,
} = require("./utils/imageGenerator.js");

// 🔥 Bir nechta adminlarni qo‘llab-quvvatlash
const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(" ").map((id) => id.trim())
  : [];

module.exports = (bot) => {
  // -----------------------------------
  //   /start → Admin menyusi
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
              [{ text: "📤 Natijalarni yuborish" }],
              [{ text: "📢 Barcha guruhlarga xabar yuborish" }],
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
  // 📤 "Natijalarni yuborish" tugmasi
  // -----------------------------------
  bot.on("message", (msg) => {
    if (msg.text === "📤 Natijalarni yuborish") {
      if (!ADMIN_IDS.includes(msg.from.id.toString())) {
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");
      }

      bot.emit("send_results_command", msg);
    }
  });

  // -----------------------------------
  // 🔥 Natijalarni barcha sinflarga yuborish
  // -----------------------------------
  bot.on("send_results_command", async (msg) => {
    const userId = msg.from.id.toString();

    if (!ADMIN_IDS.includes(userId)) {
      return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");
    }

    const groups = await Group.find();

    for (const group of groups) {
      try {
        console.log("📌 SINFDAN MA'LUMOT OLINYAPTI:", group.name);

        const sheetData = await getSheetData(group.name);
        console.log("📌 GoogleSheetdan keldi:", sheetData?.length);

        const imagePath = await generateImageFromSheetData(
          sheetData,
          group.name,
          lastClassName
        );
        console.log("📌 Rasm yaratildi:", imagePath);

        await bot.sendPhoto(group.chatId, imagePath, {
          caption: `📊 ${lastClassName} sinfi natijalari!`,
        });

        await deleteImage(imagePath);
      } catch (err) {
        console.error("❌ XATOLIK:", err.message);
        await bot.sendMessage(
          group.chatId,
          "❌ Natijalarni yuborishda xatolik yuz berdi."
        );
      }
    }

    bot.sendMessage(msg.chat.id, "✅ Barcha sinflarga natijalar yuborildi!");
  });


  // ================================================================
  // 📢 Barcha guruhlarga xabar/yuklama yuborish
  // ================================================================
  let broadcastMode = false;

  bot.on("message", async (msg) => {
    const userId = msg.from.id.toString();

    if (msg.text === "📢 Barcha guruhlarga xabar yuborish") {
      if (!ADMIN_IDS.includes(userId)) {
        return bot.sendMessage(msg.chat.id, "❌ Siz admin emassiz!");
      }

      broadcastMode = true;
      return bot.sendMessage(
        msg.chat.id,
        "📢 Yubormoqchi bo'lgan xabar yoki faylni yuboring.\n\n⚠️ Diqqat: U barcha guruhlarga tarqatiladi!"
      );
    }

    if (broadcastMode && ADMIN_IDS.includes(userId)) {
      broadcastMode = false;

      const groups = await Group.find();

      for (const group of groups) {
        try {
          if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            await bot.sendPhoto(group.chatId, fileId, {
              caption: msg.caption || "",
            });
          } else if (msg.document) {
            await bot.sendDocument(group.chatId, msg.document.file_id);
          } else if (msg.text) {
            await bot.sendMessage(group.chatId, msg.text);
          }
        } catch (err) {
          console.log("Forward xatosi:", err);
        }
      }

      return bot.sendMessage(
        msg.chat.id,
        "✅ Xabar barcha guruhlarga yuborildi!"
      );
    }
  });
};
