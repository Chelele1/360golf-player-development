
const STORAGE_KEY = "gamyplan_level1_practices_v2_group";

const state = {
  stage: 1,
  distances: { 1: 25, 2: 50, 3: 75 }
};

const $ = (id) => document.getElementById(id);

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
    return { achievement: "", stars: "" };
  }

  const passed = score <= 6;
  return {
    achievement: passed ? "PASS" : "KEEP PRACTICING",
    stars: passed ? Math.max(0, 6 - score) : 0
  };
}

function selectStage(stage) {
  state.stage = Number(stage);
  const distance = state.distances[state.stage];

  document.querySelectorAll(".stage").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.stage) === state.stage);
  });

  $("stageTitle").textContent = `Stage ${state.stage} - ${distance}`;
  $("stageBadge").textContent = String(state.stage);
  $("distanceValue").textContent = String(distance);
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
          <input class="student-score" type="number" min="1" max="20" inputmode="numeric" placeholder="1-20" />
        </label>

        <div class="result-inline">
          <span class="label">Achievement</span>
          <strong class="student-achievement">Waiting</strong>
        </div>

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

        <label>
          Player's signature / initials
          <input class="student-player-signature" type="text" placeholder="Player initials/name" />
        </label>

        <label>
          Marker's signature / initials
          <input class="student-marker-signature" type="text" placeholder="Coach/marker initials" />
        </label>
      </div>
    </article>
  `;
}

function renderStudentCards() {
  const count = Number($("studentCount").value);
  const container = $("studentCards");

  const current = Array.from(container.querySelectorAll(".student-card")).map((card) => ({
    name: card.querySelector(".student-name")?.value || "",
    score: card.querySelector(".student-score")?.value || "",
    notes: card.querySelector(".student-notes")?.value || "",
    playerSignature: card.querySelector(".student-player-signature")?.value || "",
    markerSignature: card.querySelector(".student-marker-signature")?.value || ""
  }));

  container.innerHTML = Array.from({ length: count }, (_, i) => studentCard(i)).join("");

  Array.from(container.querySelectorAll(".student-card")).forEach((card, i) => {
    const saved = current[i];
    if (saved) {
      card.querySelector(".student-name").value = saved.name;
      card.querySelector(".student-score").value = saved.score;
      card.querySelector(".student-notes").value = saved.notes;
      card.querySelector(".student-player-signature").value = saved.playerSignature;
      card.querySelector(".student-marker-signature").value = saved.markerSignature;
    }

    card.querySelector(".student-score").addEventListener("input", () => updateStudentResult(card));
    updateStudentResult(card);
  });
}

function updateStudentResult(card) {
  const score = Number(card.querySelector(".student-score").value);
  const result = calculateResult(score);
  const achievement = card.querySelector(".student-achievement");
  const stars = card.querySelector(".student-stars");

  if (!result.achievement) {
    achievement.textContent = "Waiting";
    achievement.className = "student-achievement";
    stars.textContent = "-";
    return;
  }

  achievement.textContent = result.achievement;
  achievement.className = "student-achievement " + (result.achievement === "PASS" ? "pass" : "not-pass");
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
      playerSignature: card.querySelector(".student-player-signature").value.trim(),
      markerSignature: card.querySelector(".student-marker-signature").value.trim(),
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
    if (!Number.isFinite(entry.score) || entry.score < 1 || entry.score > 20) {
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
    return { attempted: true, ok: response.ok };
  } catch (error) {
    console.error("Cloud save failed:", error);
    return { attempted: true, ok: false };
  }
}

async function saveGroupPractice() {
  const entries = readGroupEntries();
  const error = validateGroup(entries);

  if (error) {
    $("status").textContent = error;
    $("status").className = "status error";
    return;
  }

  const groupSessionId = crypto.randomUUID ? crypto.randomUUID() : `group-${Date.now()}-${Math.random()}`;
  const newRecords = entries.map((entry) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${entry.index}-${Math.random()}`,
    groupSessionId,
    timestamp: new Date().toISOString(),
    playerName: entry.playerName,
    date: entry.date,
    groupName: entry.groupName,
    level: 1,
    stage: state.stage,
    hole: 1,
    distance: state.distances[state.stage],
    distanceUnit: "steps/yards/meters",
    goalStrokes: 6,
    score: entry.score,
    achievement: entry.result.achievement,
    stars: entry.result.stars,
    notes: entry.notes,
    playerSignature: entry.playerSignature,
    markerSignature: entry.markerSignature,
    cloudSaved: false
  }));

  const rows = getPractices();
  setPractices([...newRecords.reverse(), ...rows]);
  renderTable();

  $("status").textContent = `Saved ${newRecords.length} individual practice record${newRecords.length === 1 ? "" : "s"} on this device...`;
  $("status").className = "status ok";

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
      `Saved all ${newRecords.length} records locally. ${cloudSuccess} reached the Google Sheet; ${newRecords.length - cloudSuccess} did not.`;
    $("status").className = "status error";
  }

  renderTable();
}

function resetGroup() {
  $("practiceDate").value = todayLocal();
  $("groupName").value = "";
  $("studentCount").value = "4";
  renderStudentCards();
  $("status").textContent = "";
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
  const stageFilter = $("filterStage").value;
  const groupFilter = $("filterGroup").value.trim().toLowerCase();

  const rows = getPractices().filter((r) => {
    const byPlayer = !playerFilter || String(r.playerName).toLowerCase().includes(playerFilter);
    const byStage = !stageFilter || String(r.stage) === stageFilter;
    const byGroup = !groupFilter || String(r.groupName || "").toLowerCase().includes(groupFilter);
    return byPlayer && byStage && byGroup;
  });

  if (!rows.length) {
    $("practiceRows").innerHTML = `<tr><td colspan="12">No saved practices match the current filter.</td></tr>`;
    return;
  }

  $("practiceRows").innerHTML = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.playerName)}</td>
      <td>${escapeHtml(r.groupName || "")}</td>
      <td>${escapeHtml(r.stage)}</td>
      <td>${escapeHtml(r.distance)}</td>
      <td>${escapeHtml(r.score)}</td>
      <td class="${r.achievement === "PASS" ? "pass" : "not-pass"}">${escapeHtml(r.achievement)}</td>
      <td>${escapeHtml(r.stars)}</td>
      <td>${escapeHtml(r.notes)}</td>
      <td>${escapeHtml(r.playerSignature)}</td>
      <td>${escapeHtml(r.markerSignature)}</td>
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
    "timestamp","date","playerName","groupName","groupSessionId","level","stage","hole","distance",
    "distanceUnit","goalStrokes","score","achievement","stars","notes","playerSignature","markerSignature","cloudSaved"
  ];

  const csv = [
    fields.join(","),
    ...rows.map(row => fields.map(key => csvEscape(row[key])).join(","))
  ].join("\n");

  downloadBlob("gamyplan-level1-practices.csv", "text/csv;charset=utf-8", csv);
}

function exportJSON() {
  const rows = getPractices();
  if (!rows.length) {
    alert("There are no practices to export yet.");
    return;
  }

  downloadBlob(
    "gamyplan-level1-practices.json",
    "application/json;charset=utf-8",
    JSON.stringify(rows, null, 2)
  );
}

function clearLocalData() {
  if (!confirm("Delete all Level 1 practice entries saved on this device?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderTable();
  $("status").textContent = "Local practice data cleared.";
  $("status").className = "status ok";
}

document.querySelectorAll(".stage").forEach((button) => {
  button.addEventListener("click", () => selectStage(button.dataset.stage));
});

$("studentCount").addEventListener("change", renderStudentCards);
$("saveGroupBtn").addEventListener("click", saveGroupPractice);
$("resetGroupBtn").addEventListener("click", resetGroup);
$("exportBtn").addEventListener("click", exportCSV);
$("exportJsonBtn").addEventListener("click", exportJSON);
$("clearBtn").addEventListener("click", clearLocalData);
$("filterPlayer").addEventListener("input", renderTable);
$("filterStage").addEventListener("change", renderTable);
$("filterGroup").addEventListener("input", renderTable);

$("practiceDate").value = todayLocal();
selectStage(1);
renderStudentCards();
renderTable();
