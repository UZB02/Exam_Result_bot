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
  const scoreIndex = header.length - 2; // "Umumiy ball" ustuni
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // 🔥 Avtomatik tartib raqam berish (№)
  for (let i = 0; i < rows.length; i++) {
    rows[i][0] = i + 1;
  }

  // 🔹 Eng yuqori ballni aniqlaymiz
  let maxScore = -Infinity;
  rows.forEach((r) => {
    const score = parseFloat(r[scoreIndex]);
    if (!isNaN(score) && score > maxScore) maxScore = score;
  });

  const tempCanvas = new Canvas(2000, 2000);
  const tempCtx = tempCanvas.getContext("2d");
  const colWidths = calculateDynamicColumnWidths(tempCtx, header, rows);
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

  const titleHeight = 90;
  const headerHeight = 65;
  const rowHeight = 58;
  const footerHeight = 110;

  const height =
    titleHeight + headerHeight + rows.length * rowHeight + footerHeight;
  const width = tableWidth + 80;

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // BACKGROUND
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // BANNER
  ctx.fillStyle = "#0f2f66";
  ctx.fillRect(0, 0, width, titleHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText(className, width / 2, 58);

  // HEADER
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

  // BODY
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowY = headerY + headerHeight + r * rowHeight;
    xPos = tableX;

    // 🔹 Agar umumiy ball eng yuqori bo‘lsa, sariq rang
    const isTopScore = parseFloat(row[scoreIndex]) === maxScore;

    for (let c = 0; c < header.length; c++) {
      const w = colWidths[c];
      const text = String(row[c] ?? "");

      ctx.fillStyle = isTopScore ? "#ffe082" : "#ffffff"; // sariq qator
      ctx.fillRect(xPos, rowY, w, rowHeight);

      ctx.strokeStyle = "#999";
      ctx.strokeRect(xPos, rowY, w, rowHeight);

      // Matn rangini aniqlash
      const percentIndex = header.length - 1;

      if (
        !isNaN(text) &&
        Number(text) === 50 &&
        c !== scoreIndex &&
        c !== percentIndex
      ) {
        ctx.fillStyle = "#d00000"; // fan ustuni 50 bo‘lsa qizil
        ctx.font = "bold 24px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.textAlign = "center";
      ctx.fillText(text, xPos + w / 2, rowY + rowHeight / 2 + 7);

      xPos += w;
    }
  }

  // FOOTER
  ctx.fillStyle = "#0f2f66";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";

  const percentIndex = header.length - 1;
  let totalPercent = 0;
  let count = 0;

  rows.forEach((r) => {
    const p = parseFloat(r[percentIndex]);
    if (!isNaN(p)) {
      totalPercent += p;
      count++;
    }
  });

  // Fanlar samaradorligi
  const subjectStartIndex = 2;
  const subjectEndIndex = header.length - 3;
  let subjectPercent = 0;
  let subjectCount = 0;

  for (let i = subjectStartIndex; i <= subjectEndIndex; i++) {
    let total = 0;
    let subCount = 0;
    rows.forEach((r) => {
      const s = parseFloat(r[i]);
      if (!isNaN(s)) {
        total += (s / 50) * 100;
        subCount++;
      }
    });
    if (subCount > 0) {
      subjectPercent += total / subCount;
      subjectCount++;
    }
  }

  const subjectsEfficiency =
    subjectCount > 0 ? (subjectPercent / subjectCount).toFixed(1) : 0;

  ctx.fillText(
    `Sinf samaradorligi: ${subjectsEfficiency}%`,
    tableX,
    height - 60
  );

  // PNG saqlash
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
