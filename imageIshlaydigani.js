const { Canvas } = require("skia-canvas");
const fs = require("fs");

async function generateImageFromSheetData(sheetData) {
  if (!Array.isArray(sheetData) || sheetData.length < 2) {
    throw new Error("❌ sheetData formati noto‘g‘ri.");
  }

  // ============================
  // 1️⃣ KELAYOTGAN FORMAT TO‘G‘RI O‘QILADI
  // ============================
  const className = sheetData[0][0]; // ["5 Green"] → "5 Green"
  const header = sheetData[1]; // header array
  const rows = sheetData.slice(2); // qolganlar — rows

  // Umumiy ball bo‘yicha saralash
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => {
    const av = parseFloat(a[scoreIndex]);
    const bv = parseFloat(b[scoreIndex]);
    return (isNaN(bv) ? -Infinity : bv) - (isNaN(av) ? -Infinity : av);
  });

  // ============================
  // 2️⃣ RASM O‘LCHAMLARI
  // ============================
  const width = 1700;
  const tableX = 40;
  const colCount = header.length;
  const colWidth = Math.floor((width - 80) / colCount);

  const titleHeight = 90;
  const headerHeight = 65;
  const rowHeight = 58;
  const footerHeight = 110;

  const height =
    titleHeight + headerHeight + rows.length * rowHeight + footerHeight;

  // Canvas
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // ============================
  // 3️⃣ FON
  // ============================
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);

  // ============================
  // 4️⃣ YUQORI BANNER (CLASS NAME)
  // ============================
  ctx.fillStyle = "#0f2f66";
  ctx.fillRect(0, 0, width, titleHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(className, width / 2, 58);

  // ============================
  // 5️⃣ HEADER
  // ============================
  const headerY = titleHeight;

  ctx.fillStyle = "#dfe8f0";
  ctx.fillRect(tableX, headerY, colCount * colWidth, headerHeight);

  ctx.strokeStyle = "#000";
  ctx.strokeRect(tableX, headerY, colCount * colWidth, headerHeight);

  ctx.fillStyle = "#000";
  ctx.font = "bold 24px Arial";
  for (let i = 0; i < colCount; i++) {
    const x = tableX + i * colWidth + colWidth / 2;
    const y = headerY + headerHeight / 2 + 8;
    ctx.fillText(String(header[i] ?? ""), x, y);
  }

  // ============================
  // 6️⃣ BODY (ROWS)
  // ============================
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowY = headerY + headerHeight + r * rowHeight;

    // 🔥 Top 1 sariq fon
    ctx.fillStyle = r === 0 ? "#ffe082" : "#ffffff";
    ctx.fillRect(tableX, rowY, colCount * colWidth, rowHeight);

    ctx.strokeStyle = "#999";
    ctx.strokeRect(tableX, rowY, colCount * colWidth, rowHeight);

    for (let c = 0; c < colCount; c++) {
      const text = row[c] == null ? "" : String(row[c]);
      const x = tableX + c * colWidth + colWidth / 2;

      // 🔴 50 ball qizil
      if (!isNaN(text) && Number(text) === 50) {
        ctx.fillStyle = "#d00000";
        ctx.font = "bold 24px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.fillText(text, x, rowY + rowHeight / 2 + 7);
    }
  }

  // ============================
  // 7️⃣ FOOTER
  // ============================
  ctx.fillStyle = "#0f2f66";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";

  ctx.fillText("Fanlar kesimida samaradorlik (100%)", tableX, height - 60);
  ctx.fillText("Sinf samaradorligi: 75%", tableX, height - 25);

  // ============================
  // 8️⃣ SAQLASH
  // ============================
  const output = `./${className}.png`;
  fs.writeFileSync(output, await canvas.toBuffer("png"));

  return output;
}

async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch {}
}

module.exports = { generateImageFromSheetData, deleteImage };
