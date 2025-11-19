const { Canvas } = require("skia-canvas");
const fs = require("fs");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);

  // 🔹 Eng yuqori ball bo‘yicha saralash
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // 📌 O‘lchamlar
  const width = 1600;
  const colWidth = (width - 100) / header.length;
  const rowHeight = 50;
  const headerHeight = 60;
  const titleHeight = 70;
  const height = titleHeight + headerHeight + rows.length * rowHeight + 50;

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // Oq fon
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.font = "bold 45px Arial";
  ctx.fillStyle = "#1a3d7c";
  ctx.textAlign = "center";
  ctx.fillText(className, width / 2, 50);

  // HEADER FON
  ctx.fillStyle = "#b8cee3";
  ctx.fillRect(50, 80, width - 100, headerHeight);

  // HEADER CHIZIQLARI
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 80, width - 100, headerHeight);

  // HEADER MATNLARI
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";

  header.forEach((h, i) => {
    ctx.fillText(h, 50 + i * colWidth + 10, 118);
  });

  // BODY QATORLARI
  rows.forEach((row, r) => {
    const y = 80 + headerHeight + r * rowHeight;

    // 1-o‘rin → SARIQ
    if (r === 0) {
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(50, y, width - 100, rowHeight);
    }

    // Oddiy qator foni
    if (r > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(50, y, width - 100, rowHeight);
    }

    // CHIZIQLAR
    ctx.strokeStyle = "#999";
    ctx.strokeRect(50, y, width - 100, rowHeight);

    // Matnlar
    row.forEach((col, c) => {
      let textColor = "#000";
      let font = "24px Arial";

      // 50 ball → qizil
      if (parseFloat(col) === 50) {
        textColor = "red";
        font = "bold 24px Arial";
      }

      // 1-o‘rin → qora matn
      if (r === 0) textColor = "#000";

      ctx.fillStyle = textColor;
      ctx.font = font;
      ctx.fillText(col.toString(), 50 + c * colWidth + 10, y + 33);
    });
  });

  // Saqlash
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
