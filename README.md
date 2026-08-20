# GamyPlan - Level 1 Group Practice Log

This version is designed for one coach working with **1 to 10 students at the same time**.

## Level 1 content included

Level 1 contains all three stages:

- Stage 1: 1 hole from 25 steps, yards, or meters to the edge of the green.
- Stage 2: 1 hole from 50 steps, yards, or meters to the edge of the green.
- Stage 3: 1 hole from 75 steps, yards, or meters to the edge of the green.
- Goal: complete the hole in 6 strokes or fewer.
- Star system: 1 star for each stroke under the 6-stroke limit.
- Tee rule: tee may be used for all shots except on the green.
- Bunker rule: take the ball out from the side without penalty and rake the marks.
- No out of bounds: place another ball.
- Bag checklist: water, golf balls, tees, ball markers, ballmark repair tool, pencil.

## Group Practice mode

1. Choose Stage 1, 2 or 3 once.
2. Choose the practice date once.
3. Select 1 to 10 students.
4. Optional: enter a group/class name.
5. Enter each player's:
   - name
   - score
   - notes
   - player signature/initials
   - marker/coach signature/initials
6. Achievement and stars are calculated separately for every player.
7. Press **Save Group Practice**.

Even though the players practiced together, **every player is saved as an individual record**.
This lets you later filter the database by one player's name and see only that player's history.

## GitHub Pages

Upload these files to the root of a GitHub repository:

- index.html
- styles.css
- app.js
- config.js

Then:

1. GitHub repository -> Settings.
2. Pages.
3. Build and deployment -> Deploy from a branch.
4. Branch -> main.
5. Folder -> / (root).
6. Save.

## Central Google Sheets database

The site works immediately using local browser storage. To collect practices from different phones
or computers into one database, connect it to Google Sheets.

1. Create a Google Sheet.
2. Extensions -> Apps Script.
3. Replace the Apps Script editor content with `google-apps-script.gs`.
4. Save.
5. Deploy -> New deployment.
6. Type -> Web app.
7. Execute as -> Me.
8. Who has access -> Anyone.
9. Deploy and authorize.
10. Copy the Web App URL ending in `/exec`.
11. Paste that URL into `config.js`.
12. Commit the change in GitHub.

Every student submitted from a group becomes a separate row in the Google Sheet.

## Database columns

Timestamp, Practice Date, Player Name, Group Name, Group Session ID, Level, Stage, Hole,
Distance, Distance Unit, Goal Strokes, Score, Achievement, Stars, Notes,
Player Signature, Marker Signature, Record ID.

## Backup

The page can also export all records on the current device to:

- CSV
- JSON
