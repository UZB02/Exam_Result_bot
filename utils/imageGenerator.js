// tableToImageSkia.js
const { Canvas } = require("skia-canvas");
const fs = require("fs");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));
  
  console.log(header,rows);
  // O'lchamlar
  const width = 1600;
  const rowHeight = 50;
  const headerHeight = 60;
  const titleHeight = 80;
  const footerHeight = 100;
  const height =
    titleHeight + headerHeight + rows.length * rowHeight + footerHeight;

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fon
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Sarlavha
  ctx.fillStyle = "#1a3d7c";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText(className, width / 2, 50);

  // Header rectangle
  const tableX = 50;
  const tableWidth = width - 100;
  const colWidth = Math.floor(tableWidth / header.length);
  const headerY = titleHeight;

  ctx.fillStyle = "#b8cee3";
  ctx.fillRect(tableX, headerY, tableWidth, headerHeight);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(tableX, headerY, tableWidth, headerHeight);

  // Header text
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  header.forEach((h, i) => {
    const x = tableX + i * colWidth + colWidth / 2;
    const y = headerY + headerHeight / 2 + 8;
    ctx.fillText(h, x, y);
  });

  // Body
  ctx.font = "22px Arial";
  rows.forEach((row, r) => {
    const y = headerY + headerHeight + r * rowHeight;

    // 1-o'rin sariq fon
    ctx.fillStyle = r === 0 ? "#ffd54f" : "#ffffff";
    ctx.fillRect(tableX, y, tableWidth, rowHeight);

    // chiziq
    ctx.strokeStyle = "#999";
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);

    row.forEach((cell, c) => {
      const x = tableX + c * colWidth + colWidth / 2;
      const text = cell == null ? "" : String(cell);

      // 50 ball qizil
      if (!isNaN(text) && parseFloat(text) === 50) {
        ctx.fillStyle = "red";
        ctx.font = "bold 22px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.textAlign = "center";
      ctx.fillText(text, x, y + rowHeight / 2 + 8);
    });
  });

  // Footer statistikalar
  ctx.fillStyle = "#1a3d7c";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "left";
  const footerX = tableX;
  ctx.fillText("Fanlar kesimida samaradorlik (100%)", footerX, height - 40);
  ctx.fillText("Sinf samaradorligi: 75%", footerX, height - 15);

  // Save
  const outputPath = `./${className}.png`;
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

module.exports = { generateImageFromSheetData, deleteImage };
