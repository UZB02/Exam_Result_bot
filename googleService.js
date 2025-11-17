const { google } = require("googleapis");
require("dotenv").config();

async function getSheetData(sheetName) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // Google Cloud’dan olingan service account fayl
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A1:H20`,
  });

  return res.data.values;
}

module.exports = { getSheetData };
