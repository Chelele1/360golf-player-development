
const STORAGE_KEY = "360golf_level1_practices_v2_group";

const DRAFT_KEY = "360golf_level1_locked_draft_v1";

const state = {
  exercise: 1,
  distances: { 1: 25, 2: 50, 3: 75 }
};

const $ = (id) => document.getElementById(id);

// This prevents normal UI edits on this device. Server-side enforcement and
// authenticated player identities are required to resist storage clearing.
function newDraft() {
  return { sessionId: crypto.randomUUID(), exercise: 1, date: todayLocal(),
    groupName: "", count: 4, exercises: {}, records: {} };
}
function loadDraft() {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (value && value.sessionId && value.exercises && value.records) return value;
  } catch (error) { console.error("Draft could not be restored", error); }
  return newDraft();
}
let draft = loadDraft();
function persistDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}
function currentCards() {
  return draft.exercises[state.exercise] ||= [];
}
function captureDraft() {
  draft.exercise = state.exercise;
  draft.date = $("practiceDate").value;
  draft.groupName = $("groupName").value;
  draft.count = Number($("studentCount").value);
  const cards = currentCards();
  document.querySelectorAll(".student-card").forEach((card, i) => {
    const old = cards[i] || {};
    cards[i] = {
      name: old.locked ? old.name : card.querySelector(".student-name").value,
      score: old.locked ? old.score : card.querySelector(".student-score").value,
      locked: Boolean(old.locked),
      lockedAt: old.lockedAt || "",
      notes: card.querySelector(".student-notes").value,
      achievement: card.querySelector(".student-achievement").value
    };
  });
  persistDraft();
}
function anyLocked() {
  return Object.values(draft.exercises).some(cards => cards.some(c => c && c.locked));
}
function applyLocks() {
  const cards = currentCards();
  document.querySelectorAll(".student-card").forEach((card, i) => {
    const saved = cards[i];
    const input = card.querySelector(".student-score");
    const name = card.querySelector(".student-name");
    input.readOnly = Boolean(saved?.locked);
    name.readOnly = Boolean(saved?.locked);
    if (saved?.locked) { input.value = saved.score; name.value = saved.name; }
    input.title = saved?.locked ? "Score locked. It cannot be changed." : "";
    card.querySelector(".score-lock-note").textContent = saved?.locked
      ? "Score locked" : "The score locks when you leave this box or press Enter. Enter the player name first.";
  });
  const exerciseSaved = Boolean(draft.records[String(state.exercise)]);
  document.querySelectorAll(".student-card").forEach(card => {
    card.querySelector(".student-notes").readOnly = exerciseSaved;
    card.querySelector(".student-achievement").readOnly = exerciseSaved;
  });
  $("studentCount").disabled = Object.keys(draft.records).length > 0;
  $("practiceDate").disabled = anyLocked();
  $("groupName").readOnly = anyLocked();
}
function lockScore(card) {
  const index = Number(card.dataset.studentIndex);
  const input = card.querySelector(".student-score");
  if (currentCards()[index]?.locked) { applyLocks(); return; }
  if (input.value === "") return;
  const score = Number(input.value);
  if (!Number.isInteger(score) || score < 1 || score > 20) {
    $("status").textContent = "Enter a whole-number score from 1 to 20.";
    $("status").className = "status error";
    return;
  }
  if (!card.querySelector(".student-name").value.trim()) {
    $("status").textContent = "Enter the player name before recording the score.";
    $("status").className = "status error";
    return;
  }
  captureDraft();
  const saved = currentCards()[index];
  saved.locked = true;
  saved.lockedAt = new Date().toISOString();
  try { persistDraft(); } catch (error) {
    saved.locked = false;
    $("status").textContent = "Cannot store the locked score. Do not continue; enable browser storage first.";
    $("status").className = "status error";
    return;
  }
  applyLocks();
  updateStudentResult(card);
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function getPractices() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setPractices(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function calculateResult(score) {
  if (!Number.isFinite(score) || score <= 0) {
    return { result: "", stars: "" };
  }

  const passed = score <= 6;
  return {
    result: passed ? "PASS" : "KEEP PRACTICING",
    stars: passed ? Math.max(0, 6 - score) : 0
  };
}

function selectExercise(exercise) {
  if ($("studentCards").children.length) captureDraft();
  state.exercise = Number(exercise);
  draft.exercise = state.exercise;
  const distance = state.distances[state.exercise];

  document.querySelectorAll(".stage").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.exercise) === state.exercise);
  });

  $("exerciseTitle").textContent = `Exercise ${state.exercise} - ${distance}`;
  $("exerciseBadge").textContent = String(state.exercise);
  $("distanceValue").textContent = String(distance);
  renderStudentCards();
  persistDraft();
}

function studentCard(index) {
  return `
    <article class="student-card" data-student-index="${index}">
      <h3><span class="student-number">${index + 1}</span> Student ${index + 1}</h3>

      <div class="student-fields">
        <label>
          Player name
          <input class="student-name" type="text" autocomplete="off" placeholder="Enter player name" />
        </label>

        <label>
          Score
          <input class="student-score" type="number" min="1" max="20" step="1" inputmode="numeric" placeholder="1-20" />
          <small class="score-lock-note" aria-live="polite"></small>
        </label>

        <label>
          Achievement
          <input class="student-achievement" type="text" autocomplete="off" placeholder="" />
        </label>

        <div class="result-inline">
          <span class="label">Stars</span>
          <strong class="student-stars">-</strong>
        </div>
      </div>

      <div class="student-extra">
        <label>
          Practice notes
          <textarea class="student-notes" rows="2" placeholder="Optional notes for this player"></textarea>
        </label>
      </div>
    </article>
  `;
}

function renderStudentCards() {
  const count = Number($("studentCount").value);
  const container = $("studentCards");

  const current = currentCards();

  container.innerHTML = Array.from({ length: count }, (_, i) => studentCard(i)).join("");

  Array.from(container.querySelectorAll(".student-card")).forEach((card, i) => {
    const saved = current[i];
    if (saved) {
      card.querySelector(".student-name").value = saved.name;
      card.querySelector(".student-score").value = saved.score;
      card.querySelector(".student-notes").value = saved.notes;
      card.querySelector(".student-achievement").value = saved.achievement;
    }

    const scoreInput = card.querySelector(".student-score");
    scoreInput.addEventListener("input", () => { applyLocks(); updateStudentResult(card); captureDraft(); });
    scoreInput.addEventListener("blur", () => lockScore(card));
    scoreInput.addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); lockScore(card); scoreInput.blur(); }
    });
    card.querySelectorAll("input:not(.student-score), textarea").forEach(input => {
      input.addEventListener("input", captureDraft);
    });
    updateStudentResult(card);
  });
  applyLocks();
}

function updateStudentResult(card) {
  const score = Number(card.querySelector(".student-score").value);
  const result = calculateResult(score);
  const stars = card.querySelector(".student-stars");

  if (!result.result) {
    stars.textContent = "-";
    return;
  }

  stars.textContent = String(result.stars);
}

function readGroupEntries() {
  const date = $("practiceDate").value;
  const groupName = $("groupName").value.trim();

  return Array.from(document.querySelectorAll(".student-card")).map((card, index) => {
    const score = Number(card.querySelector(".student-score").value);
    const result = calculateResult(score);

    return {
      index,
      playerName: card.querySelector(".student-name").value.trim(),
      score,
      notes: card.querySelector(".student-notes").value.trim(),
      achievement: card.querySelector(".student-achievement").value.trim(),
      date,
      groupName,
      result
    };
  });
}

function validateGroup(entries) {
  if (!$("practiceDate").value) return "Please enter the practice date.";

  for (const entry of entries) {
    const n = entry.index + 1;
    if (!entry.playerName) return `Please enter the name for Student ${n}.`;
    if (!Number.isInteger(entry.score) || entry.score < 1 || entry.score > 20) {
      return `Please enter a score from 1 to 20 for ${entry.playerName || `Student ${n}`}.`;
    }
  }

  return "";
}

async function sendToCloud(entry) {
  const endpoint = (window.GAMYPLAN_CONFIG && window.GAMYPLAN_CONFIG.googleSheetsWebAppUrl) || "";
  if (!endpoint || endpoint.includes("PASTE_")) {
    return { attempted: false, ok: false };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(entry)
    });
    const text = await response.text();
    let acknowledgement;
    try { acknowledgement = JSON.parse(text); } catch { acknowledgement = null; }
    return { attempted: true, ok: response.ok && acknowledgement?.ok === true && acknowledgement.id === entry.id };
  } catch (error) {
    console.error("Cloud save failed:", error);
    return { attempted: true, ok: false };
  }
}

async function saveGroupPractice() {
  const button = $("saveGroupBtn");
  if (button.disabled) return;
  button.disabled = true;
  try { await saveGroupPracticeOnce(); }
  catch (error) {
    console.error(error);
    $("status").textContent = "Could not save. Keep this page open and try again.";
    $("status").className = "status error";
  } finally { button.disabled = false; }
}

async function saveGroupPracticeOnce() {
  document.querySelectorAll(".student-card").forEach(lockScore);
  captureDraft();
  const entries = readGroupEntries();
  const error = validateGroup(entries);

  if (error) {
    $("status").textContent = error;
    $("status").className = "status error";
    return;
  }

  if (entries.some(entry => !currentCards()[entry.index]?.locked)) return;
  const recordKey = String(state.exercise);
  if (draft.records[recordKey]) {
    const ids = draft.records[recordKey];
    const pending = getPractices().filter(record => ids.includes(record.id) && !record.cloudSaved);
    if (!pending.length) {
      $("status").textContent = "This exercise is already saved. Its scores cannot be changed.";
      return;
    }
    await syncPracticeRecords(pending);
    return;
  }
  const groupSessionId = draft.sessionId;
  const newRecords = entries.map((entry) => ({
    id: `${groupSessionId}-exercise-${state.exercise}-student-${entry.index}`,
    groupSessionId,
    timestamp: new Date().toISOString(),
    scoreLockedAt: currentCards()[entry.index].lockedAt,
    playerName: entry.playerName,
    date: entry.date,
    groupName: entry.groupName,
    level: 1,
    exercise: state.exercise,
    hole: 1,
    distance: state.distances[state.exercise],
    distanceUnit: "yards",
    goalStrokes: 6,
    score: entry.score,
    achievement: entry.achievement,
    result: entry.result.result,
    stars: entry.result.stars,
    notes: entry.notes,
    cloudSaved: false
  }));

  const rows = getPractices();
  setPractices([...newRecords.reverse(), ...rows]);
  draft.records[recordKey] = newRecords.map(record => record.id);
  persistDraft();
  applyLocks();
  renderTable();

  $("status").textContent = `Saved ${newRecords.length} individual practice record${newRecords.length === 1 ? "" : "s"} on this device...`;
  $("status").className = "status ok";

  await syncPracticeRecords(newRecords);
}

async function syncPracticeRecords(newRecords) {
  let cloudSuccess = 0;
  let cloudAttempted = 0;

  for (const record of newRecords) {
    const cloud = await sendToCloud(record);
    if (cloud.attempted) cloudAttempted++;
    if (cloud.ok) {
      cloudSuccess++;
      const updated = getPractices();
      const found = updated.find((r) => r.id === record.id);
      if (found) found.cloudSaved = true;
      setPractices(updated);
    }
  }

  if (cloudAttempted === 0) {
    $("status").textContent =
      `Saved ${newRecords.length} individual record${newRecords.length === 1 ? "" : "s"} locally. Add the Google Sheets web-app URL in config.js to also save centrally.`;
  } else if (cloudSuccess === newRecords.length) {
    $("status").textContent =
      `Saved ${newRecords.length} individual record${newRecords.length === 1 ? "" : "s"} locally and to the central Google Sheet.`;
  } else {
    $("status").textContent =
      `Saved all ${newRecords.length} records locally. ${cloudSuccess} reached the Google Sheet; ${newRecords.length - cloudSuccess} did not. Press Save Group Practice to retry without creating duplicates.`;
    $("status").className = "status error";
  }

  renderTable();
}

function resetGroup() {
  captureDraft();
  const pending = Object.entries(draft.exercises).some(([exercise, cards]) =>
    cards.some(c => c?.locked) && !draft.records[exercise]);
  if (pending) {
    $("status").textContent = "Save every exercise with locked scores before starting a new group entry.";
    $("status").className = "status error";
    return;
  }
  draft = newDraft();
  $("studentCards").innerHTML = "";
  $("practiceDate").value = draft.date;
  $("groupName").value = "";
  $("studentCount").value = "4";
  selectExercise(1);
  $("status").textContent = "New practice entry. Previous saved scores remain unchanged.";
  $("status").className = "status";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTable() {
  const playerFilter = $("filterPlayer").value.trim().toLowerCase();
  const exerciseFilter = $("filterExercise").value;
  const groupFilter = $("filterGroup").value.trim().toLowerCase();

  const rows = getPractices().filter((r) => {
    const byPlayer = !playerFilter || String(r.playerName).toLowerCase().includes(playerFilter);
    const byExercise = !exerciseFilter || String(r.exercise) === exerciseFilter;
    const byGroup = !groupFilter || String(r.groupName || "").toLowerCase().includes(groupFilter);
    return byPlayer && byExercise && byGroup;
  });

  if (!rows.length) {
    $("practiceRows").innerHTML = `<tr><td colspan="11">No saved practices match the current filter.</td></tr>`;
    return;
  }

  $("practiceRows").innerHTML = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.playerName)}</td>
      <td>${escapeHtml(r.groupName || "")}</td>
      <td>${escapeHtml(r.exercise)}</td>
      <td>${escapeHtml(r.distance)}</td>
      <td>${escapeHtml(r.score)}</td>
      <td>${escapeHtml(r.achievement)}</td>
      <td class="${r.result === "PASS" ? "pass" : "not-pass"}">${escapeHtml(r.result)}</td>
      <td>${escapeHtml(r.stars)}</td>
      <td>${escapeHtml(r.notes)}</td>
      <td>${r.cloudSaved ? "Saved" : "Local"}</td>
    </tr>
  `).join("");
}

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

function downloadBlob(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCSV() {
  const rows = getPractices();
  if (!rows.length) {
    alert("There are no practices to export yet.");
    return;
  }

  const fields = [
    "timestamp","date","playerName","groupName","groupSessionId","level","exercise","hole","distance",
    "distanceUnit","goalStrokes","score","achievement","result","stars","notes","cloudSaved"
  ];

  const csv = [
    fields.join(","),
    ...rows.map(row => fields.map(key => csvEscape(row[key])).join(","))
  ].join("\n");

  downloadBlob("360golf-level1-practices.csv", "text/csv;charset=utf-8", csv);
}

function exportJSON() {
  const rows = getPractices();
  if (!rows.length) {
    alert("There are no practices to export yet.");
    return;
  }

  downloadBlob(
    "360golf-level1-practices.json",
    "application/json;charset=utf-8",
    JSON.stringify(rows, null, 2)
  );
}

function clearLocalData() {
  $("status").textContent = "Deleting results from this page is disabled.";
  $("status").className = "status error";
}

document.querySelectorAll(".stage").forEach((button) => {
  button.addEventListener("click", () => selectExercise(button.dataset.exercise));
});

$("studentCount").addEventListener("change", () => {
  const count = Number($("studentCount").value);
  const hiddenLocked = Object.values(draft.exercises).some(cards =>
    cards.slice(count).some(c => c?.locked));
  if (hiddenLocked) {
    $("studentCount").value = String(draft.count);
    $("status").textContent = "A player with a locked score cannot be removed.";
    return;
  }
  captureDraft();
  renderStudentCards();
});
$("practiceDate").addEventListener("change", captureDraft);
$("groupName").addEventListener("input", captureDraft);
$("saveGroupBtn").addEventListener("click", saveGroupPractice);
$("resetGroupBtn").addEventListener("click", resetGroup);
$("exportBtn").addEventListener("click", exportCSV);
$("exportJsonBtn").addEventListener("click", exportJSON);
$("clearBtn").addEventListener("click", clearLocalData);
$("filterPlayer").addEventListener("input", renderTable);
$("filterExercise").addEventListener("change", renderTable);
$("filterGroup").addEventListener("input", renderTable);

$("practiceDate").value = draft.date;
$("groupName").value = draft.groupName;
$("studentCount").value = String(draft.count);
$("clearBtn").disabled = true;
$("clearBtn").title = "Deleting saved results is disabled.";
selectExercise(draft.exercise);
renderTable();
