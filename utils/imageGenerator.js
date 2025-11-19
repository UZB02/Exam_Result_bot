const { Canvas } = require("skia-canvas");
const fs = require("fs");

// =========================================
// 1️⃣ USTUN KENGLIKlarini dinamik hisoblash
// =========================================
function calculateDynamicColumnWidths(
  ctx,
  header,
  rows,
  minWidth = 120,
  padding = 30
) {
  const colWidths = [];

  for (let c = 0; c < header.length; c++) {
    let maxText = String(header[c] ?? "");

    for (let r = 0; r < rows.length; r++) {
      const t = rows[r][c] ? String(rows[r][c]) : "";
      if (t.length > maxText.length) maxText = t;
    }

    ctx.font = "22px Arial";
    const textWidth = ctx.measureText(maxText).width;

    colWidths[c] = Math.max(minWidth, textWidth + padding);
  }

  return colWidths;
}

// =========================================
// 2️⃣ RASM GENERATOR
// =========================================
async function generateImageFromSheetData(sheetData) {
  if (!Array.isArray(sheetData) || sheetData.length < 2) {
    throw new Error("❌ sheetData formati noto‘g‘ri.");
  }

  // MA'LUMOTLARNI AJRATAMIZ
  const className = sheetData[0][0];
  const header = sheetData[1];
  const rows = sheetData.slice(2);

  // Saralash — umumiy ball bo‘yicha
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // TEMPORARY canvas — ustun kengligini hisoblash uchun
  const tempCanvas = new Canvas(2000, 2000);
  const tempCtx = tempCanvas.getContext("2d");

  const colWidths = calculateDynamicColumnWidths(tempCtx, header, rows);
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

  // Jadval dizayn o‘lchamlari
  const titleHeight = 90;
  const headerHeight = 65;
  const rowHeight = 58;
  const footerHeight = 110;

  const height =
    titleHeight + headerHeight + rows.length * rowHeight + footerHeight;
  const width = tableWidth + 80;

  // Asosiy canvas
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // =========================================
  // 3️⃣ BACKGROUND
  // =========================================
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // =========================================
  // 4️⃣ BANNER — CLASS NAME
  // =========================================
  ctx.fillStyle = "#0f2f66";
  ctx.fillRect(0, 0, width, titleHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(className, width / 2, 58);

  // =========================================
  // 5️⃣ HEADER
  // =========================================
  const tableX = 40;
  let xPos = tableX;
  const headerY = titleHeight;

  for (let i = 0; i < header.length; i++) {
    const w = colWidths[i];

    ctx.fillStyle = "#dfe8f0";
    ctx.fillRect(xPos, headerY, w, headerHeight);

    ctx.strokeStyle = "#000";
    ctx.strokeRect(xPos, headerY, w, headerHeight);

    ctx.fillStyle = "#000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
      String(header[i]),
      xPos + w / 2,
      headerY + headerHeight / 2 + 8
    );

    xPos += w;
  }

  // =========================================
  // 6️⃣ BODY (ROWS)
  // =========================================
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowY = headerY + headerHeight + r * rowHeight;

    xPos = tableX;

    for (let c = 0; c < header.length; c++) {
      const w = colWidths[c];
      const text = String(row[c] ?? "");

      // Top-1 sariq rang
      ctx.fillStyle = r === 0 ? "#ffe082" : "#ffffff";
      ctx.fillRect(xPos, rowY, w, rowHeight);

      ctx.strokeStyle = "#999";
      ctx.strokeRect(xPos, rowY, w, rowHeight);

      // Matnni joylash
      ctx.textAlign = "center";

      if (!isNaN(text) && Number(text) === 50) {
        ctx.fillStyle = "#d00000";
        ctx.font = "bold 24px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.fillText(text, xPos + w / 2, rowY + rowHeight / 2 + 7);

      xPos += w;
    }
  }

  // =========================================
  // 7️⃣ FOOTER
  // =========================================
  ctx.fillStyle = "#0f2f66";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";

  ctx.fillText("Fanlar kesimida samaradorlik (100%)", tableX, height - 60);
  ctx.fillText("Sinf samaradorligi: 75%", tableX, height - 25);

  // =========================================
  // 8️⃣ PNG holatida saqlash
  // =========================================
  const output = `./${className}.png`;
  fs.writeFileSync(output, await canvas.toBuffer("png"));

  return output;
}

// FAYL O‘CHIRISH
async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch {}
}

module.exports = { generateImageFromSheetData, deleteImage };
