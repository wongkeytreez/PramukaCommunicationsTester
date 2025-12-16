const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let fps = 50;
const semaphoreList = {
  a: [0, 1],
  b: [0, 2],
  c: [0, 3],
  d: [0, 4],
  e: [5, 0],
  f: [6, 0],
  g: [7, 0],
  h: [2, 1],
  i: [3, 1],
  j: [6, 4],
  k: [4, 1],
  l: [5, 1],
  m: [6, 1],
  n: [7, 1],
  o: [3, 2],
  p: [4, 2],
  q: [5, 2],
  r: [6, 2],
  s: [7, 2],
  t: [4, 3],
  u: [5, 3],
  v: [7, 4],
  w: [5, 6],
  x: [5, 7],
  y: [6, 3],
  z: [6, 7],
};
function drawTriangle(ctx, p1, p2, p3, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();

  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function rotate(point, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: point.x * c - point.y * s, y: point.x * s + point.y * c };
}

function SemaphoreFlag(baseX, baseY, dir = 0) {
  this.size = 50;
  this.Direction = dir;
  this.forces = { x: 0, y: 0 };
  this.forceDirection = 0;

  this.baseX = baseX;
  this.baseY = baseY;
  this.stickLength = 120;

  this.draw = (ctx, dt = 100) => {
    const t = dt / 1000; // seconds

    // gravity (downwards)
    this.forces.y += 0.4 * t;

    // damping (air resistance)
    const damping = Math.exp(-6 * t);
    this.forces.x *= damping;
    this.forces.y *= damping;

    this.forceDirection = Math.atan2(-this.forces.x, this.forces.y);

    const { p1, p2, p3, p4 } = calculateEdges(
      this.size,
      this.Direction + this.forceDirection
    );

    const rp1 = rotate(p1, this.forceDirection);
    const rp2 = rotate(p2, this.forceDirection);
    const rp3 = rotate(p3, this.forceDirection);
    const rp4 = rotate(p4, this.forceDirection);

    const sinD = Math.sin(this.Direction);
    const cosD = Math.cos(this.Direction);
    const offset = this.stickLength - this.size;

    ctx.beginPath();
    ctx.moveTo(this.baseX, this.baseY);
    ctx.lineTo(
      this.baseX + sinD * this.stickLength,
      this.baseY + cosD * this.stickLength
    );
    ctx.strokeStyle = "brown";
    ctx.lineWidth = 6;
    ctx.stroke();

    const ox = this.baseX + sinD * offset;
    const oy = this.baseY + cosD * offset;

    drawTriangle(
      ctx,
      { x: rp1.x + ox, y: rp1.y + oy },
      { x: rp4.x + ox, y: rp4.y + oy },
      { x: rp3.x + ox, y: rp3.y + oy },
      "red",
      "black"
    );

    drawTriangle(
      ctx,
      { x: rp1.x + ox, y: rp1.y + oy },
      { x: rp2.x + ox, y: rp2.y + oy },
      { x: rp3.x + ox, y: rp3.y + oy },
      "yellow",
      "black"
    );
  };

  this.Rotate = (radian, pivot) => {
    const delta = mod(this.Direction, Math.PI * 2) - mod(radian, Math.PI * 2);
    this.Direction = radian;

    const dx = pivot.x - this.baseX + this.stickLength / 2;
    const dy = pivot.y - this.baseY + this.stickLength / 2;
    const distance = Math.hypot(dx, dy);
    const force = Math.sin(Math.abs(delta)) * distance * 0.015;

    this.ApplyForce(force, radian + (delta > 0 ? Math.PI / 2 : -Math.PI / 2));
  };

  this.ApplyForce = (force, dir) => {
    const a = mod(dir, Math.PI * 2);
    this.forces.x += Math.sin(a) * force;
    this.forces.y += Math.cos(a) * force;
  };

  this.RotateTo = async (seconds, fps, target, pivot) => {
    let delta = mod(target, Math.PI * 2) - mod(this.Direction, Math.PI * 2);

    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    const step = delta / (fps * seconds);

    for (let i = 0; i < fps * seconds; i++) {
      this.Rotate(this.Direction + step, pivot);
      await sleep(1000 / fps);
    }
  };
}

function HandHoldingSemaphore(base, hand = "left") {
  this.baseX = base.x;
  this.baseY = base.y;
  this.handLength = 50;

  this.Direction = Math.PI / 4;
  this.flag = new SemaphoreFlag(
    this.baseX + Math.cos(Math.PI / 4) * this.handLength,
    this.baseY + Math.cos(Math.PI / 4) * this.handLength,

    Math.min((Math.PI * 7) / 4, this.Direction) -
      Math.max(0, Math.PI / 4 - this.Direction)
  );

  this.TrueDirection = this.Direction;
  this.hand = hand;
  this.rotateTO = async (seconds, fps, target) => {
    if (hand == "left") {
      let delta =
        mod(target, Math.PI * 2) - mod(this.TrueDirection, Math.PI * 2);

      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      const step = delta / (fps * seconds);

      const norm = mod(target, Math.PI * 2);
      const clamped =
        Math.min((Math.PI * 7) / 4, norm) - Math.max(0, Math.PI / 4 - norm);

      this.flag.RotateTo(seconds, fps, clamped, base);

      for (let i = 0; i < fps * seconds; i++) {
        this.TrueDirection = mod(this.TrueDirection + step, Math.PI * 2);
        this.Direction =
          Math.max(this.TrueDirection, Math.PI / 4) +
          Math.max(0, this.TrueDirection - (Math.PI * 7) / 4);

        const offset = rotate({ x: 0, y: this.handLength }, -this.Direction);
        this.flag.baseX = this.baseX + offset.x;
        this.flag.baseY = this.baseY + offset.y;

        if (!(i >= fps * seconds - 1)) await sleep(1000 / fps);
      }
      this.TrueDirection = target;
      this.Direction =
        Math.max(this.TrueDirection, Math.PI / 4) +
        Math.max(0, this.TrueDirection - (Math.PI * 7) / 4);
      this.flag.Direction = clamped;
      const offset = rotate({ x: 0, y: this.handLength }, -this.Direction);
      this.flag.baseX = this.baseX + offset.x;
      this.flag.baseY = this.baseY + offset.y;
      await sleep(1000 / fps);
    } else {
      let delta =
        mod(target, Math.PI * 2) - mod(this.TrueDirection, Math.PI * 2);

      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      const step = delta / (fps * seconds);

      const norm = mod(target, Math.PI * 2);

      const clamped =
        Math.max(Math.PI / 4, norm) + Math.max(0, norm - (Math.PI / 4) * 7) * 2;

      this.flag.RotateTo(seconds, fps, clamped, base);

      for (let i = 0; i < fps * seconds; i++) {
        this.TrueDirection = mod(this.TrueDirection + step, Math.PI * 2);
        this.Direction =
          Math.min(this.TrueDirection, (Math.PI / 4) * 7) -
          Math.max(0, Math.PI / 4 - this.TrueDirection);

        const offset = rotate({ x: 0, y: this.handLength }, -this.Direction);
        this.flag.baseX = this.baseX + offset.x;
        this.flag.baseY = this.baseY + offset.y;

        if (!(i >= fps * seconds - 1)) await sleep(1000 / fps);
      }
      this.TrueDirection = target;
      this.Direction =
        Math.min(this.TrueDirection, (Math.PI / 4) * 7) -
        Math.max(0, Math.PI / 4 - this.TrueDirection);
      this.flag.Direction = clamped;
      const offset = rotate({ x: 0, y: this.handLength }, -this.Direction);
      this.flag.baseX = this.baseX + offset.x;
      this.flag.baseY = this.baseY + offset.y;
      await sleep(1000 / fps);
    }
  };
  this.goToMiddle = async (seconds, fps) => {
    const flagTarget = Math.PI; // flag UP
    const handTarget = 0; // hand DOWN

    let flagDelta =
      mod(flagTarget, Math.PI * 2) - mod(this.flag.Direction, Math.PI * 2);

    let truehandDelta =
      mod(handTarget, Math.PI * 2) - mod(this.TrueDirection, Math.PI * 2);

    let handDelta =
      mod(handTarget, Math.PI * 2) - mod(this.Direction, Math.PI * 2);

    if (flagDelta > Math.PI) flagDelta -= Math.PI * 2;
    if (flagDelta < -Math.PI) flagDelta += Math.PI * 2;

    if (truehandDelta > Math.PI) truehandDelta -= Math.PI * 2;
    if (truehandDelta < -Math.PI) truehandDelta += Math.PI * 2;

    if (handDelta > Math.PI) handDelta -= Math.PI * 2;
    if (handDelta < -Math.PI) handDelta += Math.PI * 2;

    const flagStep = flagDelta / (fps * seconds);
    const truehandStep = truehandDelta / (fps * seconds);
    const handStep = handDelta / (fps * seconds);
    for (let i = 0; i < fps * seconds; i++) {
      // Hand moves down
      this.TrueDirection = mod(this.TrueDirection + truehandStep, Math.PI * 2);
      this.Direction = mod(this.Direction + handStep, Math.PI * 2);
      this.flag.stickLength -= 50 / (fps * seconds);
      // Flag rotates to face up
      this.flag.Direction = mod(this.flag.Direction + flagStep, Math.PI * 2);

      // Update flag base position
      const offset = rotate({ x: 0, y: this.handLength }, -this.Direction);

      this.flag.baseX = this.baseX + offset.x;
      this.flag.baseY = this.baseY + offset.y;

      await sleep(1000 / fps);
    }
  };
  this.fromMiddleToLetter = async (seconds, fps, target) => {
    // we are assumed to be at:
    // hand = 0 (down)
    // flag = Math.PI (up)

    let delta = mod(target, Math.PI * 2) - mod(this.TrueDirection, Math.PI * 2);

    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    const step = delta / (fps * seconds);

    // normal clamping resumes here
    const norm = mod(target, Math.PI * 2);
    let clamped, handtarget, handdelta;
    if (this.hand == "left") {
      clamped =
        Math.min((Math.PI * 7) / 4, norm) - Math.max(0, Math.PI / 4 - norm);
      handtarget =
        Math.max(target, Math.PI / 4) + Math.max(0, target - (Math.PI * 7) / 4);
    } else {
      clamped =
        Math.max(Math.PI / 4, norm) + Math.max(0, norm - (Math.PI / 4) * 7) * 2;
      handtarget =
        Math.min(target, (Math.PI / 4) * 7) - Math.max(0, Math.PI / 4 - target);
    }
    handdelta = mod(handtarget, Math.PI * 2) - mod(this.Direction, Math.PI * 2);
    if (handdelta > Math.PI) handdelta -= Math.PI * 2;
    if (handdelta < -Math.PI) handdelta += Math.PI * 2;

    this.flag.RotateTo(seconds, fps, clamped, { x: this.baseX, y: this.baseY });

    for (let i = 0; i < fps * seconds; i++) {
      this.TrueDirection = mod(this.TrueDirection + step, Math.PI * 2);

      this.Direction += handdelta / (fps * seconds);
      this.flag.stickLength += 50 / (fps * seconds);
      const offset = rotate({ x: 0, y: this.handLength }, -this.Direction);

      this.flag.baseX = this.baseX + offset.x;
      this.flag.baseY = this.baseY + offset.y;

      if (!(i >= fps * seconds - 1)) await sleep(1000 / fps);
    }
    this.TrueDirection = target;
    this.Direction = handtarget;
    this.flag.Direction = clamped;
    await sleep(1000 / fps);
  };

  this.draw = (ctx, dt = 10) => {
    ctx.beginPath();
    ctx.moveTo(this.baseX, this.baseY);
    ctx.lineTo(
      this.baseX + Math.sin(this.Direction) * this.handLength,
      this.baseY + Math.cos(this.Direction) * this.handLength
    );

    ctx.strokeStyle = "black";
    ctx.lineWidth = 6;
    ctx.stroke();
    this.flag.draw(ctx, dt);
  };
}
function person(facing, pos) {
  this.pos = pos;
  this.facing = facing;
  this.hand1 = new HandHoldingSemaphore({ x: pos.x - 25, y: pos.y }, "right");
  this.hand1.rotateTO(0.5, fps, 0);
  this.hand2 = new HandHoldingSemaphore({ x: pos.x + 25, y: pos.y }, "left");
  this.hand2.rotateTO(0.5, fps, 0);
  this.draw = (ctx, fps) => {
    this.hand1.draw(ctx, fps);
    this.hand2.draw(ctx, fps);
  };
}
const player = new person("towards", { x: 225, y: 200 });
setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.draw(ctx, fps);
}, 1000 / fps);

async function showLetter(letter, seconds, fps, person, nextLetter) {
  if (letter == "/") {
    person.hand1.goToMiddle(seconds / 5, fps);
    person.hand2.goToMiddle(seconds / 5, fps);
    await sleep((seconds / 5) * 4 * 1000);
    let next;
    if (!nextLetter || !semaphoreList[nextLetter]) next = [0, 0];
    else if (person.facing == "towards") {
      next = [
        mod(8 - semaphoreList[nextLetter][1], 8),
        mod(8 - semaphoreList[nextLetter][0], 8),
      ];
    } else if (person.facing == "away") {
      next = semaphoreList[nextLetter];
    }
    person.hand1.fromMiddleToLetter(seconds / 5, fps, (next[0] * Math.PI) / 4);
    person.hand2.fromMiddleToLetter(seconds / 5, fps, (next[1] * Math.PI) / 4);
    await sleep((seconds / 5) * 1000);
  } else if (semaphoreList[letter] != null) {
    console.log(letter, semaphoreList[letter]);
    let translated;
    if (person.facing == "towards") {
      translated = [
        mod(8 - semaphoreList[letter][1], 8),
        mod(8 - semaphoreList[letter][0], 8),
      ];
    } else if (person.facing == "away") {
      translated = semaphoreList[letter];
    }
    person.hand1.rotateTO(seconds / 5, fps, (translated[0] * Math.PI) / 4);
    person.hand2.rotateTO(seconds / 5, fps, (translated[1] * Math.PI) / 4);
    await sleep(seconds * 1000);
  } else {
    person.hand1.rotateTO(seconds / 5, fps, 0);
    person.hand2.rotateTO(seconds / 5, fps, 0);
    await sleep(seconds * 1000);
  }
}
async function play(text, lps, person) {
  let translatedText = "";
  for (let i = 0; i < text.length; i++) {
    if (
      i > 0 &&
      translatedText[translatedText.length - 1] == text[i] &&
      semaphoreList[text[i]] != null
    ) {
      translatedText += "/";
    } else if (semaphoreList[text[i]] != null) {
      translatedText += text[i];
    } else if (text[i] == " ") {
      translatedText += " ";
    }
  }
  translatedText += " ";

  for (let i = 0; i < translatedText.length; i++) {
    await showLetter(
      translatedText[i],
      Math.ceil((1 / lps) * 100) / 100,
      fps,
      person,
      i + 1 < translatedText.length ? translatedText[i + 1] : " "
    );
  }
  return;
}
function mod(x, y) {
  return ((x % y) + y) % y;
}
async function startSemaphore() {
  if (isPlaying) return;

  fps = +document.getElementById("fps").value;
  const lps = +document.getElementById("lps").value;
  const wordCount = +document.getElementById("wordCount").value;
  const mistakes = +document.getElementById("mistakes").value;
  const lang = document.getElementById("language").value;

  const text = getRandomWords(lang, wordCount);
  const textWithMistakes = addMistakes(text, mistakes);

  lastText = text;
  lastTextWithMistakes = textWithMistakes;

  hideResults();
  isPlaying = true;

  await play(textWithMistakes, lps, player);
  isPlaying = false;
  document.getElementById("showResultsBtn").disabled = false;
}

let lastText = "";
let lastTextWithMistakes = "";
let isPlaying = false;
async function replaySemaphore() {
  if (isPlaying || !lastTextWithMistakes) return;

  const lps = +document.getElementById("lps").value;

  hideResults();
  isPlaying = true;
  console.log("we");
  await play(lastTextWithMistakes, lps, player);

  isPlaying = false;

  document.getElementById("showResultsBtn").disabled = false;
}
function showResults() {
  const panel = document.getElementById("resultsPanel");
  panel.style.filter = "blur(0)";
  panel.style.pointerEvents = "auto";

  document.getElementById("resultText").textContent = lastText;
  document.getElementById("resultMistake").textContent = lastTextWithMistakes;
}

function hideResults() {
  const panel = document.getElementById("resultsPanel");
  panel.style.filter = "blur(8px)";
  panel.style.pointerEvents = "none";

  document.getElementById("showResultsBtn").disabled = true;
}
