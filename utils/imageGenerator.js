const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);

  // 🔹 Eng yuqori ballni aniqlash va saralash (oxirgi ustun – Umumiy ball)
  const scoreIndex = header.length - 2; // oxirgi -1 = %, -2 = Umumiy ball
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // 🔹 Logoni o‘qish
  const logoPath = path.resolve(__dirname, "../img/logo.png");
  const logoData = fs.readFileSync(logoPath, { encoding: "base64" });
  const logoBase64 = `data:image/png;base64,${logoData}`;

  const html = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          min-height: 100vh;
          background: #fff;
          position: relative;
        }

        body::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 150px;
          height: 150px;
          background: url(${logoBase64}) no-repeat center center;
          background-size: contain;
          filter: blur(10px) brightness(0.6);
          transform: translate(-50%, -50%);
          z-index: -1;
        }

        h2 {
          text-align: center;
          margin-bottom: 20px;
          background-color: #1a3d7c;
          color: white;
          padding: 10px;
          border-radius: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        th, td {
          border: 1px solid #999;
          padding: 8px;
          text-align: center;
        }

        thead tr th {
          background-color: darkslategray;
          color: white;
        }

        tbody tr:first-child td {
           background-color: #1a3d7c;
          color: white;
        }
         tbody tr:nth-child(2) td  {
          background-color: orange;
          color: black;
        }

        tbody tr td {
          background-color: #ffffff;
          color: black;
        }
      </style>
    </head>
    <body>
      <h2>${className} sinfi natijalari</h2>
      <table>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((col) => {
                    // Agar qiymat 50 ga teng bo'lsa, rangini qizil qilamiz
                    const style =
                      parseFloat(col) === 50
                        ? "color: red; font-weight: bold;"
                        : "";
                    return `<td style="${style}">${col}</td>`;
                  })
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const outputPath = `./${className}.png`;
  await page.screenshot({ path: outputPath, fullPage: true });
  await browser.close();
  return outputPath;
}

async function deleteImage(path) {
  try {
    fs.unlinkSync(path);
    console.log(`🗑️ O‘chirildi: ${path}`);
  } catch (err) {
    console.error("O‘chirishda xatolik:", err);
  }
}

module.exports = { generateImageFromSheetData, deleteImage };
