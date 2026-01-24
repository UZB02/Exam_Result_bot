const { Canvas } = require("skia-canvas");
const fs = require("fs");

// =========================================
// 1️⃣ USTUN KENGLIKlarini dinamik hisoblash
// =========================================
function calculateDynamicColumnWidths(ctx, header, rows, minWidth = 120, padding = 30) {
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

  const className = sheetData[0][0];
  const header = sheetData[1];
  const rows = sheetData.slice(2);

  // Saralash — umumiy ball bo‘yicha
  const scoreIndex = header.length - 2; 
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // ✅ TARTIB RAQAM (RANKING)
  let rank = 1;
  let prevScore = null;
  for (let i = 0; i < rows.length; i++) {
    const score = parseFloat(rows[i][scoreIndex]);
    if (i > 0 && score !== prevScore) rank++;
    rows[i][0] = rank;
    prevScore = score;
  }

  // Eng yuqori ballni aniqlash
  let maxScore = Math.max(...rows.map(r => parseFloat(r[scoreIndex]) || 0));

  // O'lchamlarni hisoblash
  const tempCanvas = new Canvas(2000, 2000);
  const tempCtx = tempCanvas.getContext("2d");
  const colWidths = calculateDynamicColumnWidths(tempCtx, header, rows);
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

  const titleHeight = 90;
  const headerHeight = 65;
  const rowHeight = 58;
  const footerHeight = 180; // Fanlar ko'p bo'lsa joy yetishi uchun kengaytirildi

  const height = titleHeight + headerHeight + (rows.length * rowHeight) + footerHeight;
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

  // TABLE HEADER
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
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(header[i]), xPos + w / 2, headerY + headerHeight / 2 + 8);
    xPos += w;
  }

  // TABLE BODY
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowY = headerY + headerHeight + r * rowHeight;
    xPos = tableX;
    const isTopScore = parseFloat(row[scoreIndex]) === maxScore;

    for (let c = 0; c < header.length; c++) {
      const w = colWidths[c];
      ctx.fillStyle = isTopScore ? "#ffe082" : "#ffffff";
      ctx.fillRect(xPos, rowY, w, rowHeight);
      ctx.strokeStyle = "#999";
      ctx.strokeRect(xPos, rowY, w, rowHeight);

      const val = String(row[c] ?? "");
      // Agar ball 50 bo'lsa qizil rangda chiqarish (shartingiz bo'yicha)
      if (c >= 2 && c <= header.length - 3 && parseFloat(val) === 50) {
        ctx.fillStyle = "#d00000";
        ctx.font = "bold 24px Arial";
      } else {
        ctx.fillStyle = "#000";
        ctx.font = "22px Arial";
      }

      ctx.textAlign = "center";
      ctx.fillText(val, xPos + w / 2, rowY + rowHeight / 2 + 7);
      xPos += w;
    }
  }

  // ===============================
  // 3️⃣ YANGILANGAN FOOTER - FANLAR SAMARADORLIGI
  // ===============================
  let footerY = headerY + headerHeight + (rows.length * rowHeight) + 50;
  ctx.fillStyle = "#0f2f66";
  ctx.textAlign = "left";
  ctx.font = "bold 26px Arial";
  ctx.fillText("Fanlar bo'yicha samaradorlik:", tableX, footerY);

  footerY += 40;
  ctx.font = "22px Arial";
  
  const subjectStartIndex = 2; // "Ona tili"
  const subjectEndIndex = header.length - 3; // "Kimyo"
  let summaryText = "";
  let totalEfficiencySum = 0;
  let subjectCount = 0;

  for (let i = subjectStartIndex; i <= subjectEndIndex; i++) {
    let subTotal = 0;
    let students = 0;
    
    // Ustun nomidan maksimal ballni olish (masalan: "Ona tili (10)" -> 10)
    const match = header[i].match(/\((\d+)\)/);
    const maxVal = match ? parseInt(match[1]) : 50;

    rows.forEach(r => {
      const s = parseFloat(r[i]);
      if (!isNaN(s)) {
        subTotal += (s / maxVal) * 100;
        students++;
      }
    });

    if (students > 0) {
      const avg = (subTotal / students).toFixed(1);
      const subjectName = header[i].split(' (')[0];
      summaryText += `${subjectName}: ${avg}% | `;
      totalEfficiencySum += parseFloat(avg);
      subjectCount++;
    }
  }

  // Fanlar ro'yxatini chiqarish (agar juda uzun bo'lsa, qisqartirish mumkin)
  ctx.fillStyle = "#333";
  ctx.fillText(summaryText.slice(0, -3), tableX, footerY);

  // Umumiy sinf samaradorligi
  footerY += 40;
  ctx.fillStyle = "#d00000";
  ctx.font = "bold 26px Arial";
  const finalAvg = subjectCount > 0 ? (totalEfficiencySum / subjectCount).toFixed(1) : 0;
  ctx.fillText(`O'rtacha sinf samaradorligi: ${finalAvg}%`, tableX, footerY);

  const output = `./${className}.png`;
  fs.writeFileSync(output, await canvas.toBuffer("png"));
  return output;
}

async function deleteImage(path) {
  try { fs.unlinkSync(path); } catch {}
}

module.exports = { generateImageFromSheetData, deleteImage };
