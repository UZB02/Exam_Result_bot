const { Canvas } = require("skia-canvas");
const fs = require("fs");

async function generateImageFromSheetData(sheetData) {
  if (!Array.isArray(sheetData) || sheetData.length < 2) {
    throw new Error("❌ [className, table] formatida kelishi kerak.");
  }

  const className = sheetData[0];
  const table = sheetData[1];

  const header = table[0];
  let rows = table.slice(1).filter(Array.isArray);

  // 🔥 Umumiy ball bo‘yicha saralash (so‘nggi -2 ustun)
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => {
    const av = parseFloat(a[scoreIndex]);
    const bv = parseFloat(b[scoreIndex]);
    return (isNaN(bv) ? -Infinity : bv) - (isNaN(av) ? -Infinity : av);
  });

  // === RASM O'LCHAMLARI ===
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

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // === FON ===
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // === KO‘K BANNER (Sarlavha) ===
  ctx.fillStyle = "#0f2f66";
  ctx.fillRect(0, 0, width, titleHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(String(className), width / 2, 58);

  // === HEADER ===
  const headerY = titleHeight;

  ctx.fillStyle = "#dfe8f0";
  ctx.fillRect(tableX, headerY, colWidth * colCount, headerHeight);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, headerY, colWidth * colCount, headerHeight);

  // Header textlari
  ctx.fillStyle = "#000";
  ctx.font = "bold 24px Arial";

  for (let i = 0; i < colCount; i++) {
    const text = header[i] == null ? "" : String(header[i]);
    const x = tableX + i * colWidth + colWidth / 2;
    const y = headerY + headerHeight / 2 + 8;
    ctx.fillText(text, x, y);
  }

  // === BODY QATORLARI ===
  for (let r = 0; r < rows.length; r++) {
    const rowY = headerY + headerHeight + r * rowHeight;

    // ❗ 1-o‘rin — oltin fon
    if (r === 0) ctx.fillStyle = "#ffe082";
    else ctx.fillStyle = "#ffffff";

    ctx.fillRect(tableX, rowY, colWidth * colCount, rowHeight);

    ctx.strokeStyle = "#777";
    ctx.strokeRect(tableX, rowY, colWidth * colCount, rowHeight);

    for (let c = 0; c < colCount; c++) {
      let text = rows[r][c];
      text = text == null ? "" : String(text);

      const x = tableX + c * colWidth + colWidth / 2;

      // 50 ball → qizil matn
      if (!isNaN(parseFloat(text)) && parseFloat(text) === 50) {
        ctx.fillStyle = "#d00000";
        ctx.font = "bold 24px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.fillText(text, x, rowY + rowHeight / 2 + 7);
    }
  }

  // === FOOTER ===
  ctx.fillStyle = "#0f2f66";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";

  ctx.fillText("Fanlar kesimida samaradorlik (100%)", tableX, height - 60);
  ctx.fillText("Sinf samaradorligi: 75%", tableX, height - 25);

  // === SAQLASH ===
  const output = `./${String(className)}.png`;
  fs.writeFileSync(output, await canvas.toBuffer("png"));

  return output;
}

async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch (err) {
    console.error(err);
  }
}

module.exports = { generateImageFromSheetData, deleteImage };