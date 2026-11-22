// Every sound is synthesised with WebAudio: footstep ticks, coin clinks, soot hiss, jammer zaps,
// the spotted stinger, and a clockwork score (a ticking escapement over a low drone) whose tempo
// and pitch climb with the alarm tier. Nothing is loaded from a file.
let ctx = null;
let master = null;
let noiseBuffer = null;
let musicTimer = 0;
let beat = 0;

/** Create the audio context on the first user gesture (browsers require it). */
export function unlockAudio() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
}

function tone(freq, start, length, type = 'sine', gain = 0.2, slideTo = null) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(amp).connect(master);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

function hiss(start, length, gain, filterFreq) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  src.connect(filter).connect(amp).connect(master);
  src.start(start);
  src.stop(start + length);
}

const EFFECTS = {
  step: (t) => hiss(t, 0.05, 0.08, 900),
  throw: (t) => hiss(t, 0.25, 0.06, 2400),
  clink: (t) => { tone(2350, t, 0.25, 'triangle', 0.15); tone(3100, t + 0.07, 0.2, 'triangle', 0.08); },
  hiss: (t) => hiss(t, 1.2, 0.25, 500),
  zap: (t) => tone(900, t, 0.4, 'sawtooth', 0.12, 60),
  spotted: (t) => { tone(220, t, 0.5, 'square', 0.12); tone(233, t, 0.5, 'square', 0.1); tone(880, t, 0.18, 'sawtooth', 0.1); },
  camera: (t) => { tone(1320, t, 0.08, 'square', 0.08); tone(1320, t + 0.14, 0.08, 'square', 0.08); },
  loot: (t) => [660, 880, 1320].forEach((f, i) => tone(f, t + i * 0.06, 0.3, 'triangle', 0.1)),
  orrery: (t) => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, t + i * 0.09, 0.9, 'sine', 0.12)),
  door: (t) => { tone(140, t, 0.2, 'square', 0.12, 70); hiss(t, 0.12, 0.1, 400); },
  clank: (t) => { tone(310, t, 0.15, 'square', 0.1, 180); hiss(t, 0.1, 0.15, 1800); },
  caught: (t) => [330, 262, 196, 131].forEach((f, i) => tone(f, t + i * 0.16, 0.4, 'sawtooth', 0.12)),
  busted: (t) => { for (let i = 0; i < 6; i += 1) tone(i % 2 ? 660 : 880, t + i * 0.22, 0.2, 'square', 0.1); },
  escape: (t) => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.6, 'triangle', 0.12)),
  ui: (t) => tone(1046, t, 0.06, 'triangle', 0.08),
};

/** Play every sound named this frame. */
export function playSounds(names) {
  if (!ctx) {
    names.length = 0;
    return;
  }
  const t = ctx.currentTime + 0.01;
  for (const name of new Set(names)) EFFECTS[name]?.(t);
  names.length = 0;
}

/** The clockwork score: call every frame with the alarm tier (0-3); it schedules ticks as due. */
export function updateMusic(dt, tier, playing) {
  if (!ctx || !playing) return;
  const interval = [0.5, 0.4, 0.3, 0.2][tier];
  musicTimer -= dt;
  if (musicTimer > 0) return;
  musicTimer = interval;
  const t = ctx.currentTime + 0.02;
  const tick = beat % 2 === 0 ? 1900 : 1500;
  tone(tick, t, 0.03, 'square', 0.025);
  const bass = [55, 55, 65.4, 49][Math.floor(beat / 8) % 4] * (tier >= 2 ? 1.06 : 1);
  if (beat % 4 === 0) tone(bass, t, interval * 3.6, 'triangle', 0.09);
  if (tier >= 1 && beat % 2 === 1) tone(bass * 4, t, 0.08, 'sine', 0.035);
  beat += 1;
}
