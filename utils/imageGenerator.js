const { Canvas } = require("skia-canvas");
const fs = require("fs");

/**
 * Google Sheets dan olingan ma'lumotlardan rasm yaratish
 * @param {Array} data - 2D massiv (0-qator: header, qolganlari: qiymatlar)
 * @param {String} className - rasm nomi va sarlavha
 */
async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);

  // 🔹 Eng yuqori ball bo‘yicha saralash
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // 🔹 HTML orqali jadval yaratamiz
  const html = buildHtmlTable(header, rows, className);

  // 🔹 HTMLni Canvasga chizish
  const canvas = new Canvas(1600, 2000); // balandlik keyin avtomatik kesiladi
  await canvas.drawHTML(html);

  const outputPath = `./${className}.png`;
  fs.writeFileSync(outputPath, await canvas.toBuffer("png"));

  return outputPath;
}

/**
 * HTML jadval yaratish funksiyasi
 */
function buildHtmlTable(header, rows, className) {
  return `
  <html>
  <style>
    body {
      font-family: Arial;
      background: white;
    }

    h1 {
      text-align: center;
      color: #1a3d7c;
      margin-top: 20px;
    }

    table {
      width: 90%;
      margin: 20px auto;
      border-collapse: collapse;
      font-size: 20px;
    }

    th {
      background: #b8cee3;
      padding: 12px;
      border: 1px solid #000;
      font-weight: bold;
    }

    td {
      border: 1px solid #999;
      padding: 10px;
      text-align: center;
    }

    tr:nth-child(1) td {
      background: #ffd54f !important; /* 1-o‘rin sariq */
      font-weight: bold;
    }

    td.red {
      color: red;
      font-weight: bold;
    }

    .footer {
      width: 90%;
      margin: 30px auto;
      color: #1a3d7c;
      font-size: 22px;
      font-weight: bold;
    }
  </style>

  <body>
    <h1>${className}</h1>

    <table>
      <thead>
        <tr>
          ${header.map((h) => `<th>${h}</th>`).join("")}
        </tr>
      </thead>

      <tbody>
        ${rows
          .map((row, idx) => {
            return `
              <tr>
                ${row
                  .map((col) => {
                    const val = col.toString();

                    // 50 ball bo‘lsa qizil rang
                    const cls =
                      !isNaN(val) && parseFloat(val) === 50 ? "red" : "";

                    return `<td class="${cls}">${val}</td>`;
                  })
                  .join("")}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>

    <div class="footer">
      Fanlar kesimida samaradorlik (100%)<br>
      Sinf samaradorligi: 75%
    </div>
  </body>
  </html>
  `;
}

/**
 * Rasmni o'chirish
 */
async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
  } catch (err) {
    console.log("Delete error:", err);
  }
}

module.exports = { generateImageFromSheetData, deleteImage };
