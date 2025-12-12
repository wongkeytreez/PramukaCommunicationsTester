/* ------------------ UTILITIES ------------------ */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Add mistakes to letters and morse characters */
function addMistakes(text, mistakes) {
  mistakes = Number(mistakes);
  if (mistakes <= 0) return text;
  if (mistakes > text.length) mistakes = text.length;

  const chars = text.split("");
  const used = new Set();
  const changeable = [];

  // letters / dot / dash only
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (/[a-zA-Z]/.test(ch) || ch === "." || ch === "-") changeable.push(i);
  }

  if (changeable.length === 0) return text;

  while (mistakes > 0) {
    if (used.size === changeable.length) break;

    const pos = changeable[Math.floor(Math.random() * changeable.length)];
    if (used.has(pos)) continue;

    const ch = chars[pos];

    if (/[a-zA-Z]/.test(ch)) {
      const letters = "abcdefghijklmnopqrstuvwxyz";
      let newChar;
      do {
        newChar = letters[Math.floor(Math.random() * 26)];
        if (ch === ch.toUpperCase()) newChar = newChar.toUpperCase();
      } while (newChar === ch);

      chars[pos] = newChar;
    } else if (ch === ".") chars[pos] = "-";
    else if (ch === "-") chars[pos] = ".";

    used.add(pos);
    mistakes--;
  }

  return chars.join("");
}

/* ------------------ WORD LISTS ------------------ */

const wordLists = {};

function loadWords() {
  fetch("en.txt")
    .then((res) => res.text())
    .then((text) => (wordLists.en = text.split("\n")));

  fetch("id.lst")
    .then((res) => res.text())
    .then((text) => (wordLists.id = text.split("\n")));
}

loadWords();

function getRandomWords(lang, count) {
  const list = wordLists[lang] || [];
  if (list.length === 0) return "";

  let out = [];
  for (let i = 0; i < count; i++) {
    out.push(list[Math.floor(Math.random() * list.length)]);
  }
  return out.join(" ");
}

/* ------------------ RESULT PANEL ------------------ */

let playFinished = false;

function setResults(morse, text, mistake) {
  document.getElementById("resultMorse").textContent = morse;
  document.getElementById("resultText").textContent = text;
  document.getElementById("resultMistake").textContent = mistake;

  const panel = document.getElementById("resultsPanel");
  panel.style.filter = "blur(8px)";
  panel.style.pointerEvents = "none";

  document.getElementById("showResultsBtn").disabled = true;
  playFinished = false;
}

function finishPlay() {
  playFinished = true;
  document.getElementById("showResultsBtn").disabled = false;
}

function showResults() {
  if (!playFinished) return;

  const panel = document.getElementById("resultsPanel");
  panel.style.filter = "blur(0px)";
  panel.style.pointerEvents = "auto";
}

/* ------------------ PLAY MORSE ------------------ */

async function playMorse() {
  const playButton = document.getElementById("playButton");
  playButton.disabled = true;

  const lang = document.getElementById("language").value;
  const words = Number(
    document.getElementById("amount of words generated").value
  );
  const mistakes = Number(document.getElementById("mistakes per letter").value);
  const wpm = Number(document.getElementById("wpm").value);
  const freq = Number(document.getElementById("frequency").value);
  const soundType = document.getElementById("playType").value; // buzzer / whistle

  // choose random word(s)
  const answer = getRandomWords(lang, words);
  const answerMistake = addMistakes(answer, mistakes);

  // blur results immediately
  setResults("---", "---", "---");

  // wait for the sound to complete
  await play(answerMistake, wpm, soundType, freq);

  // fill results
  setResults(translate(answer), answer, answerMistake);

  finishPlay();
  playButton.disabled = false;
}
