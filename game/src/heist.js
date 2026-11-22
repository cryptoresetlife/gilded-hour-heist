// One heist run from the first step out of the van to the getaway: builds the museum, the cast and
// the kit from the planning board's loadout, steps every system in order, turns their events into
// toasts and sounds, and decides how the night ends (escaped, caught or busted at lockdown).
import { ALARM, PLAN_BUDGET, STEP, TOOLS } from './config.js';
import { buildMuseum } from './level.js';
import { createAlarm, raiseAlarm, updateAlarm } from './alarm.js';
import { createGuards, MODE, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { createKit, createPower, throwTool, TOOL_ORDER, updateTools } from './tools.js';
import { createThief, updateThief } from './thief.js';
import { updateInteraction } from './interactions.js';
import { lightLevel } from './geometry.js';

export const PHASE = { TITLE: 'title', PLAN: 'plan', HEIST: 'heist', ESCAPED: 'escaped', CAUGHT: 'caught', BUSTED: 'busted' };

/** Money left on the planning board after buying this loadout. */
export function budgetLeft(loadout) {
  let spent = 0;
  for (const id of TOOL_ORDER) spent += (loadout[id] ?? 0) * TOOLS[id].cost;
  return PLAN_BUDGET - spent;
}

export function createRun(loadout = {}) {
  const museum = buildMuseum();
  return {
    phase: PHASE.HEIST,
    museum,
    loadout,
    thief: createThief(museum),
    guards: createGuards(museum),
    cameras: createCameras(museum),
    alarm: createAlarm(),
    power: createPower(),
    kit: createKit(loadout),
    selected: 'coin',
    projectiles: [],
    smokes: [],
    rings: [],
    events: [],
    toasts: [],
    sounds: [],
    cash: 0,
    time: 0,
    spottedCount: 0,
    prompt: null,
    endReason: '',
    routeTrail: [],
  };
}

function toast(run, text, tone) {
  run.toasts.push({ text, tone, life: 3.2 });
  if (run.toasts.length > 4) run.toasts.shift();
}

function handleEvents(run) {
  for (const event of run.events) {
    run.sounds.push(event.kind);
    if (event.kind === 'spotted') {
      run.spottedCount += 1;
      toast(run, `${event.guard.toUpperCase()} SPOTTED YOU`, 'danger');
    } else if (event.kind === 'camera') toast(run, 'CAMERA HAS EYES ON YOU', 'danger');
    else if (event.kind === 'body') toast(run, `${event.guard.toUpperCase()} FOUND ${event.other.toUpperCase()} ASLEEP`, 'danger');
    else if (event.kind === 'loot') toast(run, event.text, 'gold');
    else if (event.kind === 'orrery') {
      toast(run, event.text, 'gold');
      raiseAlarm(run.alarm, 18);
      toast(run, 'PRESSURE PLATE TRIPPED', 'danger');
    } else if (event.kind === 'caught' && run.phase === PHASE.HEIST) {
      run.phase = PHASE.CAUGHT;
      run.endReason = `${event.guard} caught you`;
    } else if (event.kind === 'escape' && run.phase === PHASE.HEIST) {
      run.phase = PHASE.ESCAPED;
    }
  }
  run.events.length = 0;
}

/** Whether no guard or camera has eyes on the thief this step. */
function thiefHidden(run) {
  return !run.guards.some((g) => g.sees) && !run.cameras.some((c) => c.sees);
}

/** Advance the heist by one fixed step. */
export function stepRun(run, input) {
  if (run.phase !== PHASE.HEIST) return;
  const dt = STEP;
  run.time += dt;
  if (input.selectTool) run.selected = input.selectTool;
  if (input.throwAt) throwTool(run, run.selected, input.throwAt.x, input.throwAt.y);
  updateThief(run, input, dt);
  updateInteraction(run, input, dt);
  updateTools(run, dt);
  updateGuards(run, dt);
  updateCameras(run, dt);
  updateAlarm(run.alarm, dt, thiefHidden(run));
  run.thiefLight = lightLevel(run.museum, run.thief.x, run.thief.y, run.power);
  if (run.alarm.lockdown && run.alarm.countdown <= 0 && run.phase === PHASE.HEIST) {
    run.events.push({ kind: 'busted' });
    run.phase = PHASE.BUSTED;
    run.endReason = 'Police sealed the museum';
  }
  if (Math.floor(run.time * 4) !== Math.floor((run.time - dt) * 4)) run.routeTrail.push({ x: run.thief.x, y: run.thief.y });
  for (const t of run.toasts) t.life -= dt;
  run.toasts = run.toasts.filter((t) => t.life > 0);
  handleEvents(run);
}

/** Ratings and totals for the end screen. */
export function scoreRun(run) {
  const escaped = run.phase === PHASE.ESCAPED;
  const haul = escaped ? run.cash : 0;
  const peak = Math.round(run.alarm.peak);
  let rating = 'BUSTED';
  if (escaped && run.thief.carrying) {
    rating = peak < 10 ? 'GHOST' : peak < ALARM.tiers[1].at ? 'SHADOW' : peak < ALARM.tiers[2].at ? 'PROFESSIONAL' : 'SMASH & DASH';
  } else if (escaped) rating = 'WALKED AWAY';
  const alerted = run.guards.filter((g) => g.mode === MODE.ALERT).length;
  return { escaped, haul, peak, rating, seconds: Math.round(run.time), spotted: run.spottedCount, alerted, budget: budgetLeft(run.loadout) };
}
