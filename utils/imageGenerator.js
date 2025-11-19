const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  const rows = data.slice(1);

  // Eng so‘ngi 2-ustun ball bo‘lgani uchun sortlash
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // Rasm o‘lchami
  const width = 1200;
  const rowHeight = 60;
  const headerHeight = 80;
  const height = headerHeight + rowHeight * rows.length + 200;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Oq fon
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Logo yuklash (ixtiyoriy)
  let logo = null;
  const logoPath = path.resolve(__dirname, "../img/logo.png");
  if (fs.existsSync(logoPath)) {
    logo = await loadImage(logoPath);
    ctx.drawImage(logo, 30, 20, 120, 120);
  }

  // Sarlavha
  ctx.fillStyle = "#000";
  ctx.font = "bold 32px Arial";
  ctx.fillText(`${className} sinfi natijalari`, 180, 80);

  // Header fon
  ctx.fillStyle = "#2f4f4f";
  ctx.fillRect(0, 150, width, headerHeight);

  // Header matni
  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px Arial";

  let colWidth = width / header.length;
  header.forEach((h, i) => {
    ctx.fillText(h, i * colWidth + 20, 200);
  });

  // Jadval qatorlari
  rows.forEach((row, rowIndex) => {
    const y = 150 + headerHeight + rowIndex * rowHeight;

    // 1-o‘rin — ko‘k
    if (rowIndex === 0) {
      ctx.fillStyle = "#1a3d7c";
      ctx.fillRect(0, y, width, rowHeight);
      ctx.fillStyle = "#fff";
    }
    // 2-o‘rin — sariq
    else if (rowIndex === 1) {
      ctx.fillStyle = "orange";
      ctx.fillRect(0, y, width, rowHeight);
      ctx.fillStyle = "#000";
    } else {
      ctx.fillStyle = "#000";
    }

    ctx.font = "24px Arial";

    row.forEach((col, colIndex) => {
      // Ball 50 bo‘lsa qizil
      if (parseFloat(col) === 50) {
        ctx.fillStyle = "red";
        ctx.font = "bold 26px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "24px Arial";
      }

      ctx.fillText(col.toString(), colIndex * colWidth + 20, y + 40);
    });
  });

  const outputPath = `./${className}.png`;
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

async function deleteImage(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch {}
}

module.exports = { generateImageFromSheetData, deleteImage };
