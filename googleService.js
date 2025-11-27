const { google } = require("googleapis");

function getGoogleAuth() {
  const creds = JSON.parse(process.env.GOOGLE_CREDS);

  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function getSheetData(sheetName) {
  const auth = getGoogleAuth();
  const client = await auth.getClient();

  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A1:I200`,
  });

  return res.data.values;
}

module.exports = { getSheetData };
