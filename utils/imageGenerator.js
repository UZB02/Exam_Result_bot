const { Canvas } = require("skia-canvas");
const fs = require("fs");
const path = require("path");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);

  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // Canvas o‘lchami
  const width = 1500;
  const cellHeight = 50;
  const headerHeight = 60;
  const height = headerHeight + rows.length * cellHeight + 200;

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(`${className} sinfi natijalari`, 50, 60);

  // Table header
  ctx.font = "bold 26px Arial";
  ctx.fillStyle = "darkslategray";

  let x = 50;
  const colWidth = (width - 100) / header.length;

  header.forEach((h, i) => {
    ctx.fillText(h, x + i * colWidth, 120);
  });

  // Body rows
  ctx.font = "24px Arial";

  rows.forEach((row, rowIndex) => {
    const y = 120 + (rowIndex + 1) * cellHeight;

    row.forEach((col, colIndex) => {
      if (parseFloat(col) === 50) {
        ctx.fillStyle = "red";
        ctx.font = "bold 24px Arial";
      } else {
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
      }

      ctx.fillText(col.toString(), x + colIndex * colWidth, y);
    });
  });

  const outputPath = `./${className}.png`;
  const buffer = await canvas.toBuffer("png");
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

async function deleteImage(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Rasmni o'chirishda xato:", err);
  }
}

module.exports = { generateImageFromSheetData, deleteImage };
