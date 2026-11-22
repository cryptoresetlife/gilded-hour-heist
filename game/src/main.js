// Boots Gilded Hour: sets up the canvas, input, renderer and sound, runs the fixed-step loop and
// moves between the title, the planning board, the heist and the morning paper. With ?shot=<name>
// it freezes on one of the screenshot scenes instead.
import { STEP, TOOLS, VIEW } from './config.js';
import { buildMuseum } from './level.js';
import { PHASE, budgetLeft, createRun, stepRun } from './heist.js';
import { alarmTier } from './alarm.js';
import { createInput } from './input.js';
import { createRenderer, renderFrame } from './render/renderer.js';
import { playSounds, unlockAudio, updateMusic } from './audio.js';
import { sceneFor } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const input = createInput(canvas);
const renderer = createRenderer(canvas, buildMuseum());
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

let app = sceneFor(shot) ?? { phase: PHASE.TITLE };
app.loadout ??= {};
app.planMuseum ??= buildMuseum();

function hit(buttons, click) {
  return buttons.find((b) => click.screenX >= b.x && click.screenX <= b.x + b.w && click.screenY >= b.y && click.screenY <= b.y + b.h);
}

function beginHeist() {
  app.run = createRun(app.loadout);
  app.phase = PHASE.HEIST;
}

function changeLoadout(id, delta) {
  const next = { ...app.loadout, [id]: Math.max(0, (app.loadout[id] ?? 0) + delta) };
  if (budgetLeft(next) >= 0) app.loadout = next;
}

/** Menu screens: title -> plan -> heist, end -> plan. */
function updateMenus(frame) {
  const enter = frame.pressed.includes('Enter') || frame.pressed.includes('NumpadEnter');
  if (app.phase === PHASE.TITLE) {
    if (enter || frame.clicks.length) app.phase = PHASE.PLAN;
    return;
  }
  if (app.phase === PHASE.PLAN) {
    for (const click of frame.clicks) {
      const button = hit(renderer.buttons, click);
      if (!button) continue;
      app.run = null;
      if (button.id === 'start') beginHeist();
      else changeLoadout(button.id, button.delta);
      playSounds(['ui']);
    }
    for (const code of frame.pressed) {
      const id = { Digit2: 'smoke', Digit3: 'emp', Digit4: 'pick' }[code];
      if (id && TOOLS[id].cost) changeLoadout(id, 1);
      if (code === 'Backspace') app.loadout = {};
    }
    if (enter && app.phase === PHASE.PLAN) beginHeist();
    return;
  }
  if (app.phase !== PHASE.HEIST && enter) app.phase = PHASE.PLAN;
}

let last = performance.now();
let acc = 0;
let clock = 0;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (input.unlocked) unlockAudio();
  if (!shot) {
    acc += elapsed;
    clock += elapsed;
    while (acc >= STEP) {
      acc -= STEP;
      const snapshot = input.read();
      if (app.phase === PHASE.HEIST) {
        if (snapshot.pressed.includes('Escape')) app.phase = PHASE.PLAN;
        else if (app.run.phase === PHASE.HEIST) stepRun(app.run, snapshot);
        else {
          // Hold the final moment in the museum (who caught you, or the van door closing) before the paper.
          app.run.freeze = (app.run.freeze ?? 0) + STEP;
          if (app.run.freeze > 1.8) app.phase = app.run.phase;
        }
      } else updateMenus(snapshot);
    }
    if (app.run) playSounds(app.run.sounds);
    updateMusic(elapsed, app.run ? alarmTier(app.run.alarm) : 0, app.phase === PHASE.HEIST);
  } else clock = 3.2;
  renderFrame(renderer, app, clock, shot ? null : input.mouse);
  if (!shot) requestAnimationFrame(frame);
  else document.body.dataset.ready = '1';
}
requestAnimationFrame(frame);
