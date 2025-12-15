function calculateEdges(sideLength, angle) {
  // Normalize angle to [0, 2π)
  angle = mod(angle, Math.PI * 2);

  const PI = Math.PI;
  const Q = PI / 4; // quarter of a right angle (45°)
  const SQRT2 = Math.sqrt(2);

  // Region 1: 0 → 90°
  if (angle <= PI / 2) {
    const p1 = { x: 0, y: 0 };

    const p3 = {
      x: sideLength * SQRT2 * Math.sin(Math.max(0, angle - Q)),
      y: sideLength * SQRT2 * Math.cos(Math.max(0, angle - Q)),
    };

    const p2 = {
      x: -sideLength * Math.tan(Math.min(PI / 2 - angle, Q) / 2),
      y: sideLength,
    };

    const foldLength = sideLength / Math.cos(Math.max(0, Q - angle) / 2);

    const p4 = {
      x: foldLength * Math.sin(Math.max(0, Q - angle) / 2 + angle),
      y: foldLength * Math.cos(Math.max(0, Q - angle) / 2 + angle),
    };

    return { p1, p2, p3, p4 };
  }
  // Region 2: 90° → 180°
  if (angle <= PI) {
    const foldLength = sideLength / Math.cos(Math.max(0, angle - Q * 3) / 2);

    const p4 = {
      x: sideLength * Math.sin(angle),
      y: sideLength * Math.cos(angle),
    };

    const p1 = {
      x: p4.x - foldLength * Math.sin(angle - Math.max(0, angle - Q * 3) / 2),
      y: p4.y - foldLength * Math.cos(angle - Math.max(0, angle - Q * 3) / 2),
    };

    const p3 = {
      x: p4.x + sideLength * Math.tan(Math.min(Q, angle - PI / 2) / 2),
      y: p4.y + sideLength,
    };

    const p2 = {
      x: p4.x + sideLength * SQRT2 * Math.sin(Math.min(0, angle - Q * 3)),
      y: p4.y + sideLength * SQRT2 * Math.cos(Math.min(0, angle - Q * 3)),
    };

    return { p1, p2, p3, p4 };
  } // Region 3: 180° → 270°
  if (angle <= (PI / 2) * 3) {
    const foldLength = sideLength / Math.cos(Math.max(0, Q * 5 - angle) / 2);

    const p4 = {
      x: sideLength * Math.sin(angle),
      y: sideLength * Math.cos(angle),
    };

    const p1 = {
      x: p4.x - foldLength * Math.sin(angle + Math.max(0, Q * 5 - angle) / 2),
      y: p4.y - foldLength * Math.cos(angle + Math.max(0, Q * 5 - angle) / 2),
    };

    const p3 = {
      x: p4.x - sideLength * Math.tan(Math.min((PI / 2) * 3 - angle, Q) / 2),
      y: p4.y + sideLength,
    };

    const p2 = {
      x: p4.x + sideLength * SQRT2 * Math.sin(Math.max(0, angle - Q * 5)),
      y: p4.y + sideLength * SQRT2 * Math.cos(Math.max(0, angle - Q * 5)),
    };

    return { p1, p2, p3, p4 };
  } // Region 4: 270° → 360°
  const p1 = { x: 0, y: 0 };

  const p3 = {
    x: -sideLength * SQRT2 * Math.sin(Math.max(0, Q * 7 - angle)),
    y: sideLength * SQRT2 * Math.cos(Math.max(0, Q * 7 - angle)),
  };

  const p2 = {
    x: sideLength * Math.tan(Math.min(angle - (PI / 2) * 3, Q) / 2),
    y: sideLength,
  };

  const foldLength = sideLength / Math.cos(Math.max(0, angle - Q * 7) / 2);

  const p4 = {
    x: foldLength * Math.sin(angle - Math.max(0, angle - Q * 7) / 2),
    y: foldLength * Math.cos(angle - Math.max(0, angle - Q * 7) / 2),
  };

  return { p1, p2, p3, p4 };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
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
function translate(text) {
  text = text.toLowerCase();
  let SemaphoreText = "";

  for (let i = 0; i < text.length; i++) {
    const ThisLetterInMorse = morseList[text[i]];
    if (text[i] == " ") {
      morseText = morseText.substring(0, morseText.length - 1);
      morseText += "/";
      continue;
    }
    if (ThisLetterInMorse == null) continue;
    for (let j = 0; j < ThisLetterInMorse.length; j++) {
      morseText += ThisLetterInMorse[j];
    }
    morseText += " ";
  }

  return SemaphoreText;
}
