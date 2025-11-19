const { Canvas } = require("skia-canvas");
const fs = require("fs");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);

  // 🔹 Eng yuqori ball bo‘yicha saralash (Oxiridan 2-ustun — Umumiy ball)
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // 📌 O‘lchamlar
  const width = 1600;
  const colWidth = Math.floor((width - 100) / header.length);
  const rowHeight = 50;
  const headerHeight = 60;
  const titleHeight = 70;
  const footerHeight = 80;

  const height =
    titleHeight + headerHeight + rows.length * rowHeight + footerHeight;

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // 🔹 Oq fon
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 🔹 Sarlavha
  ctx.font = "bold 45px Arial";
  ctx.fillStyle = "#1a3d7c";
  ctx.textAlign = "center";
  ctx.fillText(className, width / 2, 50);

  // 🔹 HEADER (Ustunlar)
  const headerY = 80;

  ctx.fillStyle = "#b8cee3";
  ctx.fillRect(50, headerY, width - 100, headerHeight);

  ctx.strokeStyle = "#000";
  ctx.strokeRect(50, headerY, width - 100, headerHeight);

  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  header.forEach((h, i) => {
    const x = 50 + i * colWidth + colWidth / 2;
    ctx.fillText(h, x, headerY + headerHeight / 2 + 8);
  });

  // 🔹 BODY QATORLARI
  rows.forEach((row, r) => {
    const y = headerY + headerHeight + r * rowHeight;

    // 1-o‘rin — sariq fon
    ctx.fillStyle = r === 0 ? "#ffd54f" : "#ffffff";
    ctx.fillRect(50, y, width - 100, rowHeight);

    // Chiziqlar
    ctx.strokeStyle = "#999";
    ctx.strokeRect(50, y, width - 100, rowHeight);

    ctx.textAlign = "center";

    row.forEach((col, c) => {
      let textColor = "#000";
      let font = "22px Arial";
      const value = col.toString();

      // 50 ball qizil
      if (!isNaN(value) && parseFloat(value) === 50) {
        textColor = "red";
        font = "bold 22px Arial";
      }

      ctx.fillStyle = textColor;
      ctx.font = font;

      const x = 50 + c * colWidth + colWidth / 2;
      const yText = y + rowHeight / 2 + 8;

      ctx.fillText(value, x, yText);
    });
  });

  // 🔹 Pastki statistikalar
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#1a3d7c";

  const footerY1 = height - 40;
  const footerY2 = height - 10;

  ctx.fillText("Fanlar kesimida samaradorlik (100%)", 200, footerY1);

  ctx.fillText("Sinf samaradorligi: 75%", 200, footerY2);

  // 🔹 Saqlash
  const outputPath = `./${className}.png`;
  fs.writeFileSync(outputPath, await canvas.toBuffer("png"));

  return outputPath;
}

async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch (err) {
    console.log("Delete error:", err);
  }
}

module.exports = { generateImageFromSheetData, deleteImage };
