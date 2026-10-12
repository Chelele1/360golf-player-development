const STORAGE_KEY = "360golf_level2_initiation2";

let currentExercise = 4;

const exerciseData = {
  4: {
    hole1Distance: 50,
    hole2Distance: 100
  },
  5: {
    hole1Distance: 75,
    hole2Distance: 125
  },
  6: {
    hole1Distance: 100,
    hole2Distance: 150
  }
};

const $ = (id) => document.getElementById(id);

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(
    now.getTime() - offset * 60000
  ).toISOString().slice(0, 10);
}

function getPractices() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function setPractices(rows) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(rows)
  );
}

function calculateStars(score, target) {
  if (!Number.isFinite(score) || score <= 0) {
    return "";
  }

  return Math.max(0, target - score);
}

function selectExercise(exercise) {
  currentExercise = Number(exercise);

  const data = exerciseData[currentExercise];

  document
    .querySelectorAll("#ex button")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        Number(button.dataset.e) === currentExercise
      );
    });

  $("title").textContent =
    `Exercise ${currentExercise} - ${data.hole1Distance} / ${data.hole2Distance}`;

  $("d1").textContent =
    data.hole1Distance;

  $("d2").textContent =
    data.hole2Distance;
}

function studentCard(index) {
  return `
    <div class="player">

      <h3>Student ${index + 1}</h3>

      <div class="fields">

        <label>
          Player name
          <input
            class="student-name"
            type="text"
            placeholder="Enter player name"
          >
        </label>

        <label>
          Hole 1 Score
          <input
            class="score1"
            type="number"
            min="1"
            max="20"
          >
        </label>

        <div>
          Stars
          <br>
          <b class="stars1"></b>
        </div>

        <label>
          Hole 2 Score
          <input
            class="score2"
            type="number"
            min="1"
            max="20"
          >
        </label>

        <div>
          Stars
          <br>
          <b class="stars2"></b>
        </div>

        <label>
          Achievement
          <input
            class="achievement"
            type="text"
          >
        </label>

      </div>

      <label style="display:grid">
        Practice notes

        <textarea
          class="notes"
          rows="2"
          placeholder="Optional notes for this player"
        ></textarea>

      </label>

    </div>
  `;
}

function renderStudents() {

  const count =
    Number($("count").value);

  $("players").innerHTML =
    Array.from(
      { length: count },
      (_, index) =>
        studentCard(index)
    ).join("");

  document
    .querySelectorAll(".player")
    .forEach((card) => {

      const updateStars = () => {

        const score1 =
          Number(
            card
              .querySelector(".score1")
              .value
          );

        const score2 =
          Number(
            card
              .querySelector(".score2")
              .value
          );

        card
          .querySelector(".stars1")
          .textContent =
          calculateStars(score1, 5);

        card
          .querySelector(".stars2")
          .textContent =
          calculateStars(score2, 6);
      };

      card
        .querySelector(".score1")
        .addEventListener(
          "input",
          updateStars
        );

      card
        .querySelector(".score2")
        .addEventListener(
          "input",
          updateStars
        );
    });
}

function saveGroupPractice() {

  const date =
    $("date").value;

  if (!date) {

    $("status").textContent =
      "Please enter the practice date.";

    return;
  }

  const cards =
    Array.from(
      document.querySelectorAll(".player")
    );

  const records = [];

  for (
    let index = 0;
    index < cards.length;
    index++
  ) {

    const card =
      cards[index];

    const playerName =
      card
        .querySelector(".student-name")
        .value
        .trim();

    const score1 =
      Number(
        card
          .querySelector(".score1")
          .value
      );

    const score2 =
      Number(
        card
          .querySelector(".score2")
          .value
      );

    if (!playerName) {

      $("status").textContent =
        `Please enter the name for Student ${index + 1}.`;

      return;
    }

    if (!score1 || !score2) {

      $("status").textContent =
        `Please enter both scores for ${playerName}.`;

      return;
    }

    const data =
      exerciseData[currentExercise];

    records.push({

      id:
        `${Date.now()}-${index}-${Math.random()}`,

      date,

      playerName,

      groupName:
        $("group").value.trim(),

      level: 2,

      exercise:
        currentExercise,

      hole1Distance:
        data.hole1Distance,

      hole1Target: 5,

      hole1Score:
        score1,

      hole1Stars:
        calculateStars(
          score1,
          5
        ),

      hole2Distance:
        data.hole2Distance,

      hole2Target: 6,

      hole2Score:
        score2,

      hole2Stars:
        calculateStars(
          score2,
          6
        ),

      achievement:
        card
          .querySelector(".achievement")
          .value
          .trim(),

      notes:
        card
          .querySelector(".notes")
          .value
          .trim()

    });
  }

  const oldRecords =
    getPractices();

  setPractices([
    ...records.reverse(),
    ...oldRecords
  ]);

  $("status").textContent =
    `Saved ${records.length} player record${records.length === 1 ? "" : "s"}.`;

  renderTable();
}

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    );
}

function renderTable() {

  const playerFilter =
    $("fp")
      .value
      .trim()
      .toLowerCase();

  const exerciseFilter =
    $("fe").value;

  const groupFilter =
    $("fg")
      .value
      .trim()
      .toLowerCase();

  const rows =
    getPractices()
      .filter((row) => {

        const byPlayer =
          !playerFilter ||
          row.playerName
            .toLowerCase()
            .includes(
              playerFilter
            );

        const byExercise =
          !exerciseFilter ||
          String(
            row.exercise
          ) ===
          exerciseFilter;

        const byGroup =
          !groupFilter ||
          String(
            row.groupName || ""
          )
            .toLowerCase()
            .includes(
              groupFilter
            );

        return (
          byPlayer &&
          byExercise &&
          byGroup
        );
      });

  if (!rows.length) {

    $("rows").innerHTML =
      `
      <tr>
        <td colspan="12">
          No saved practices yet.
        </td>
      </tr>
      `;

    return;
  }

  $("rows").innerHTML =
    rows
      .map((row) => `
        <tr>
          <td>${escapeHtml(row.date)}</td>

          <td>${escapeHtml(row.playerName)}</td>

          <td>${escapeHtml(row.groupName)}</td>

          <td>${row.exercise}</td>

          <td>${row.hole1Distance} yards</td>

          <td>${row.hole1Score}</td>

          <td>${row.hole1Stars}</td>

          <td>${row.hole2Distance} yards</td>

          <td>${row.hole2Score}</td>

          <td>${row.hole2Stars}</td>

          <td>${escapeHtml(row.achievement)}</td>

          <td>${escapeHtml(row.notes)}</td>

        </tr>
      `)
      .join("");
}

function downloadFile(
  filename,
  type,
  content
) {

  const blob =
    new Blob(
      [content],
      { type }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    filename;

  link.click();

  URL.revokeObjectURL(
    url
  );
}

function exportCSV() {

  const rows =
    getPractices();

  if (!rows.length) {

    alert(
      "There are no practices to export yet."
    );

    return;
  }

  const fields = [
    "date",
    "playerName",
    "groupName",
    "level",
    "exercise",
    "hole1Distance",
    "hole1Target",
    "hole1Score",
    "hole1Stars",
    "hole2Distance",
    "hole2Target",
    "hole2Score",
    "hole2Stars",
    "achievement",
    "notes"
  ];

  const quote = (value) =>
    `"${String(value ?? "")
      .replaceAll(
        '"',
        '""'
      )}"`;

  const csv =
    [
      fields.join(","),

      ...rows.map(
        (row) =>
          fields
            .map(
              (field) =>
                quote(
                  row[field]
                )
            )
            .join(",")
      )
    ].join("\n");

  downloadFile(
    "360golf-level2-practices.csv",
    "text/csv",
    csv
  );
}

document
  .querySelectorAll("#ex button")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () =>
        selectExercise(
          button.dataset.e
        )
    );
  });

$("count")
  .addEventListener(
    "change",
    renderStudents
  );

$("save")
  .addEventListener(
    "click",
    saveGroupPractice
  );

$("new")
  .addEventListener(
    "click",
    () => {

      $("group").value = "";

      $("count").value = "4";

      renderStudents();

      $("status").textContent = "";
    }
  );

$("csv")
  .addEventListener(
    "click",
    exportCSV
  );

$("json")
  .addEventListener(
    "click",
    () =>
      downloadFile(
        "360golf-level2-practices.json",
        "application/json",
        JSON.stringify(
          getPractices(),
          null,
          2
        )
      )
  );

$("clear")
  .addEventListener(
    "click",
    () => {

      if (
        confirm(
          "Delete all saved Level 2 practices?"
        )
      ) {

        localStorage.removeItem(
          STORAGE_KEY
        );

        renderTable();
      }
    }
  );

$("fp")
  .addEventListener(
    "input",
    renderTable
  );

$("fe")
  .addEventListener(
    "change",
    renderTable
  );

$("fg")
  .addEventListener(
    "input",
    renderTable
  );

$("date").value =
  todayLocal();

selectExercise(4);

renderStudents();

renderTable();
