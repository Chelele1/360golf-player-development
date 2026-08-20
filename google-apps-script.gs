/**
 * GamyPlan Level 1 Group Practice -> Google Sheets receiver
 *
 * SETUP
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste this code and save.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as: Me.
 * 6. Who has access: Anyone.
 * 7. Copy the Web App /exec URL into config.js.
 *
 * Each child in a group is written as a separate row.
 */

const SHEET_NAME = "Level 1 Practices";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "GamyPlan Level 1" }))
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
        "Timestamp",
        "Practice Date",
        "Player Name",
        "Group Name",
        "Group Session ID",
        "Level",
        "Stage",
        "Hole",
        "Distance",
        "Distance Unit",
        "Goal Strokes",
        "Score",
        "Achievement",
        "Stars",
        "Notes",
        "Player Signature",
        "Marker Signature",
        "Record ID"
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
      data.stage || "",
      data.hole || 1,
      data.distance || "",
      data.distanceUnit || "",
      data.goalStrokes || 6,
      data.score || "",
      data.achievement || "",
      data.stars ?? "",
      data.notes || "",
      data.playerSignature || "",
      data.markerSignature || "",
      data.id || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
