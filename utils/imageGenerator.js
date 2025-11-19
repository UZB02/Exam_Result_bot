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
console.log(className, "Salom", table);
  // 2) Jadvalni tekshirish
  if (!Array.isArray(table) || table.length === 0) {
    throw new Error("❌ table bo‘sh yoki massiv emas.");
  }

  const header = table[0];
  let rows = table.slice(1);

  // 3) Header massivligini kafolatlash
  if (!Array.isArray(header)) {
    // Agar header string bo‘lsa (masalan CSV yoki Range.getDisplayValues), ajratib ko‘ramiz
    if (typeof header === "string") {
      // Oddiy ehtiyot chorasi: vergul yoki tab bo‘yicha split
      const parsedHeader = header.split(/\t|,|\s{2,}/).filter(Boolean);
      if (parsedHeader.length > 1) {
        rows.unshift(...table.slice(1)); // mavjud satrlar saqlanadi
      } else {
        throw new Error("❌ header massiv emas va ajratib bo‘lmadi.");
      }
    } else {
      throw new Error("❌ header massiv emas. Google Sheetdan 2D array kerak.");
    }
  }

  // 4) Raqamli saralash indeksini aniqlash (Umumiy ball ustuni)
  const scoreIndex = header.length - 2; // "Umumiy ball" deb qabul qilyapmiz
  // Safety: har bir row massiv bo‘lishi shart
  rows = rows.filter(Array.isArray);

  // 5) Saralash (NaN bo‘lsa 0 deb qabul qilamiz)
  rows.sort((a, b) => {
    const av = parseFloat(a[scoreIndex]);
    const bv = parseFloat(b[scoreIndex]);
    const aScore = isNaN(av) ? -Infinity : av;
    const bScore = isNaN(bv) ? -Infinity : bv;
    return bScore - aScore;
  });

  // 6) Rasm o‘lchamlari
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

  // 7) Fon
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 8) Sarlavha
  ctx.fillStyle = "#1a3d7c";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText(String(className || ""), width / 2, 50);

  // 9) Header fon va chiziq
  ctx.fillStyle = "#b8cee3";
  ctx.fillRect(tableX, headerY, tableWidth, headerHeight);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, headerY, tableWidth, headerHeight);

  // 10) Header matnlari (for bilan xavfsiz)
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";

  for (let i = 0; i < colCount; i++) {
    const h = header[i] == null ? "" : String(header[i]);
    const x = tableX + i * colWidth + colWidth / 2;
    const y = headerY + headerHeight / 2 + 8;
    ctx.fillText(h, x, y);
  }

  // 11) Qatorlar
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const y = headerY + headerHeight + r * rowHeight;

    // 1-o‘rin sariq fon
    ctx.fillStyle = r === 0 ? "#ffd54f" : "#ffffff";
    ctx.fillRect(tableX, y, tableWidth, rowHeight);

    // Qator chiziqlari
    ctx.strokeStyle = "#999";
    ctx.strokeRect(tableX, y, tableWidth, rowHeight);

    // Ichki hujayralar
    for (let c = 0; c < colCount; c++) {
      const cell = row[c];
      const text = cell == null ? "" : String(cell);
      const x = tableX + c * colWidth + colWidth / 2;

      // 50 ball — qizil
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

  // 12) Footer statistikalar (agar kerak bo‘lsa dinamik kiritish mumkin)
  ctx.fillStyle = "#1a3d7c";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Fanlar kesimida samaradorlik (100%)", tableX, height - 40);
  ctx.fillText("Sinf samaradorligi: 75%", tableX, height - 15);

  // 13) Saqlash
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

module.exports = { generateImageFromSheetData, deleteImage };
