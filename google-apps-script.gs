/**
 * 360Golf Level 1 Group Practice -> Google Sheets receiver
 * Each student in a group is written as a separate row.
 */
const SHEET_NAME = "Level 1 Practices";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "360Golf Level 1" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Timestamp","Practice Date","Player Name","Group Name","Group Session ID",
        "Level","Exercise","Hole","Distance","Distance Unit","Goal Strokes",
        "Score","Achievement","Result","Stars","Notes","Record ID"
      ]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.date || "",
      data.playerName || "",
      data.groupName || "",
      data.groupSessionId || "",
      data.level || 1,
      data.exercise || "",
      data.hole || 1,
      data.distance || "",
      "yards",
      data.goalStrokes || 6,
      data.score || "",
      data.achievement || "",
      data.result || "",
      data.stars ?? "",
      data.notes || "",
      data.id || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
