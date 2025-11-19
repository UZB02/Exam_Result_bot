const fs = require("fs");
const path = require("path");
const nodeHtmlToImage = require("node-html-to-image");

async function generateImageFromSheetData(data, className) {
  const header = data[0];
  let rows = data.slice(1);

  // Ball bo‘yicha saralash (oxirgi 2-ustun)
  const scoreIndex = header.length - 2;
  rows.sort((a, b) => parseFloat(b[scoreIndex]) - parseFloat(a[scoreIndex]));

  // Logo base64
  const logoPath = path.resolve(__dirname, "../img/logo.png");
  const logoData = fs.readFileSync(logoPath, { encoding: "base64" });
  const logoBase64 = `data:image/png;base64,${logoData}`;

  // HTML yaratish
  const html = `
<html>
<head>
  <style>
    body { font-family: Arial; padding:20px; }
    table { width:100%; border-collapse: collapse; }
    th, td { border:1px solid #999; padding:8px; text-align:center; }
    thead th { background: darkslategray; color:white; }
    tbody tr:first-child td { background: #1a3d7c; color:white; }
    tbody tr:nth-child(2) td { background: orange; color:black; }
    td.red { color:red; font-weight:bold; }
  </style>
</head>
<body>
  <img src="${logoBase64}" alt="Logo" width="100"/>
  <h2>${className} sinfi natijalari</h2>
  <table>
    <thead>
      <tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
          <tr>
            ${row
              .map((col) =>
                parseFloat(col) === 50
                  ? `<td class="red">${col}</td>`
                  : `<td>${col}</td>`
              )
              .join("")}
          </tr>
        `
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>
`;

  // Rasmga aylantirish
  const outputPath = `./${className}.png`;
  await nodeHtmlToImage({
    output: outputPath,
    html: html,
  });

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
