// tableToImageSkia.js
const { Canvas } = require("skia-canvas");
const fs = require("fs");

async function generateImageFromSheetData(sheetData) {
  // 1) Kiruvchi ma'lumotni tekshirish
  if (!Array.isArray(sheetData) || sheetData.length < 2) {
    throw new Error(
      "❌ sheetData noto‘g‘ri formatda. [className, table] kutilgan."
    );
  }

  const className = sheetData[0];
  const table = sheetData[1];

  if (!Array.isArray(table) || table.length === 0) {
    throw new Error("❌ table bo‘sh yoki massiv emas.");
  }

  const header = table[0];
  let rows = table.slice(1);

  if (!Array.isArray(header)) {
    throw new Error("❌ header massiv emas. Google Sheetdan 2D array kerak.");
  }

  // Umumiy ball ustuni bo‘yicha saralash
  const scoreIndex = header.length - 2;
  rows = rows.filter(Array.isArray);
  rows.sort((a, b) => {
    const av = parseFloat(a[scoreIndex]);
    const bv = parseFloat(b[scoreIndex]);
    const aScore = isNaN(av) ? -Infinity : av;
    const bScore = isNaN(bv) ? -Infinity : bv;
    return bScore - aScore;
  });

  // Rasm o‘lchamlari
  const width = 1600;
  const rowHeight = 50;
  const headerHeight = 60;
  const titleHeight = 80;
  const footerHeight = 100;
  const tableX = 50;
  const tableWidth = width - 100;
  const headerY = titleHeight;
  const height =
    titleHeight + headerHeight + rows.length * rowHeight + footerHeight;

  const colCount = header.length;
  const colWidth = Math.floor(tableWidth / colCount);

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fon
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Sarlavha
  ctx.fillStyle = "#1a3d7c";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText(String(className || ""), width / 2, 50);

  // Header fon va chiziq
  ctx.fillStyle = "#b8cee3";
  ctx.fillRect(tableX, headerY, tableWidth, headerHeight);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(tableX, headerY, tableWidth, headerHeight);

  // Header matnlari
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  for (let i = 0; i < colCount; i++) {
    const h = header[i] == null ? "" : String(header[i]);
    const x = tableX + i * colWidth + colWidth / 2;
    const y = headerY + headerHeight / 2 + 8;
    ctx.fillText(h, x, y);
  }

  // Body qatorlari
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const y = headerY + headerHeight + r * rowHeight;

    ctx.fillStyle = r === 0 ? "#ffd54f" : "#ffffff";
    ctx.fillRect(tableX, y, tableWidth, rowHeight);

    ctx.strokeStyle = "#999";
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);

    for (let c = 0; c < colCount; c++) {
      const cell = row[c];
      const text = cell == null ? "" : String(cell);
      const x = tableX + c * colWidth + colWidth / 2;

      if (!isNaN(parseFloat(text)) && parseFloat(text) === 50) {
        ctx.fillStyle = "red";
        ctx.font = "bold 22px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.textAlign = "center";
      ctx.fillText(text, x, y + rowHeight / 2 + 8);
    }
  }

  // Footer statistikalar
  ctx.fillStyle = "#1a3d7c";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Fanlar kesimida samaradorlik (100%)", tableX, height - 40);
  ctx.fillText("Sinf samaradorligi: 75%", tableX, height - 15);

  // Saqlash
  const outputPath = `./${String(className || "output")}.png`;
  fs.writeFileSync(outputPath, await canvas.toBuffer("png"));
  return outputPath;
}

async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch (e) {
    console.error(e);
  }
}


async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch (e) {
    console.error(e);
  }
}

module.exports = { generateImageFromSheetData, deleteImage };
