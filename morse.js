const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const morseList = {
  a: ".-",
  b: "-...",
  c: "-.-.",
  d: "-..",
  e: ".",
  f: "..-.",
  g: "--.",
  h: "....",
  i: "..",
  j: ".---",
  k: "-.-",
  l: ".-..",
  m: "--",
  n: "-.",
  o: "---",
  p: ".--.",
  q: "--.-",
  r: ".-.",
  s: "...",
  t: "-",
  u: "..-",
  v: "...-",
  w: ".--",
  x: "-..-",
  y: "-.--",
  z: "--..",
};
function playBuzzer(duration = 100, freq = 550) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine"; // smooth, classic tone
  osc.frequency.value = freq; // 550 Hz

  // Prevent clicking (smooth fade-in and fade-out)
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.005);
  gain.gain.setValueAtTime(1, audioCtx.currentTime + duration / 1000 - 0.005);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration / 1000);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000 + 0.01);
}
function playWhistle(duration = 400, baseFreq = 550) {
  baseFreq *= 4;
  // -----------------------------
  // Turbulent noise source
  // -----------------------------
  const noiseBuffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate,
    audioCtx.sampleRate
  );
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  // -----------------------------
  // Dual resonance chambers
  // -----------------------------
  const band1 = audioCtx.createBiquadFilter();
  band1.type = "bandpass";
  band1.frequency.value = baseFreq;
  band1.Q.value = 18;

  const band2 = audioCtx.createBiquadFilter();
  band2.type = "bandpass";
  band2.frequency.value = baseFreq * 2.05; // higher harmonic
  band2.Q.value = 25;

  // -----------------------------
  // Turbulence modulation (like the pea fluttering)
  // -----------------------------
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 22; // 20–30 Hz flutter
  lfoGain.gain.value = 180; // ±180 Hz pitch shake
  lfo.connect(lfoGain).connect(band1.frequency);
  lfo.connect(lfoGain).connect(band2.frequency);

  lfo.start();

  // -----------------------------
  // Energy envelope
  // -----------------------------
  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(1, now + 0.008); // VERY sharp
  gain.gain.setValueAtTime(1, now + duration / 1000 - 0.03);
  gain.gain.linearRampToValueAtTime(0, now + duration / 1000);

  // -----------------------------
  // Connections
  // -----------------------------
  noise.connect(band1);
  noise.connect(band2);

  band1.connect(gain);
  band2.connect(gain);

  gain.connect(audioCtx.destination);

  // -----------------------------
  // Start/stop
  // -----------------------------
  noise.start();
  noise.stop(now + duration / 1000 + 0.05);
}
async function play(text, wpm = 9, type = "buzzer", frequency = 550) {
  const morseText = translate(text);
  const dotLength = 1200 / wpm;
  if (type == "whistle") {
    for (let i = 0; i < morseText.length; i++) {
      if (morseText[i] == ".") {
        playWhistle(dotLength, frequency);
        await sleep(dotLength * 2);
      } else if (morseText[i] == "-") {
        playWhistle(dotLength * 3, frequency);
        await sleep(dotLength * 4);
      } else if (morseText[i] == "/") {
        await sleep(dotLength * 7);
      }
      // automatically a space, so 3 units
      else await sleep(dotLength * 3);
    }
  } else {
    for (let i = 0; i < morseText.length; i++) {
      if (morseText[i] == ".") {
        playBuzzer(dotLength, frequency);
        await sleep(dotLength * 2);
      } else if (morseText[i] == "-") {
        playBuzzer(dotLength * 3, frequency);
        await sleep(dotLength * 4);
      } else if (morseText[i] == "/") {
        await sleep(dotLength * 7);
      }
      // automatically a space, so 3 units
      else await sleep(dotLength * 3);
    }
  }
}
function translate(text) {
  text = text.toLowerCase();
  let morseText = "";

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

  return morseText;
}
