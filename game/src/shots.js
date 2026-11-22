// Fixed scenes behind ?shot=heist|plan|lockdown|getaway, used to take the screenshots: each one
// builds a real run with the game's own rules, places the cast where a night like that would put
// them, then steps the simulation a moment so cones, light and suspicion are live, not painted.
import { PHASE, createRun, stepRun } from './heist.js';
import { buildMuseum, tileCentre, T } from './level.js';
import { raiseAlarm } from './alarm.js';
import { MODE, knockOut } from './guards.js';

const IDLE = { left: 0, right: 0, up: 0, down: 0, sneak: true, interact: false, selectTool: null, throwAt: null };

function place(body, tx, ty, facing) {
  const p = tileCentre(tx, ty);
  body.x = p.x;
  body.y = p.y;
  if (facing !== undefined) body.facing = facing;
}

function trail(run, points) {
  for (const [tx, ty] of points) run.routeTrail.push(tileCentre(tx, ty));
}

function settle(run, steps) {
  for (let i = 0; i < steps; i += 1) stepRun(run, IDLE);
}

function heistScene() {
  const run = createRun({ smoke: 1, emp: 1, rag: 1 });
  run.time = 96;
  run.cash = 650;
  run.museum.loot[0].taken = true;
  run.museum.loot[1].taken = true;
  run.kit.coin = 2;
  run.selected = 'smoke';
  run.museum.grid[17][6] = T.DOORWAY;
  place(run.thief, 19, 5, -0.3);
  run.thief.moving = true;
  run.thief.stride = 14;
  trail(run, [[3, 9], [4, 8], [5, 7], [6, 7], [7, 7], [8, 6], [9, 5], [9, 4], [9, 3], [9, 2], [10, 2], [11, 2], [12, 4], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]);
  const [brask, odell, mirren, tamsin] = run.guards;
  place(brask, 24, 2, Math.PI * 0.5);
  brask.waypoint = 2;
  place(odell, 17, 8, -Math.PI * 0.55);
  odell.waypoint = 0;
  odell.suspicion = 0.55;
  odell.mode = MODE.INVESTIGATE;
  odell.path = [];
  odell.lookTimer = 2;
  place(mirren, 28, 17, 0.4);
  knockOut(mirren);
  run.kit.rag = 0;
  place(tamsin, 30, 9, 0);
  tamsin.waypoint = 1;
  raiseAlarm(run.alarm, 41);
  run.alarm.pulse = 0;
  run.smokes.push({ x: tileCentre(21, 6).x, y: tileCentre(21, 6).y + 4, radius: 46, life: 5, full: 7 });
  run.kit.smoke = 0;
  settle(run, 8);
  run.thief.moving = true;
  run.toasts = [{ text: 'ODELL HEARD SOMETHING', tone: 'danger', life: 3 }];
  return run;
}

function lockdownScene() {
  const run = createRun({ smoke: 2, pick: 1 });
  run.time = 251;
  run.cash = 6350;
  for (const i of [0, 1, 2, 3, 4, 5]) run.museum.loot[i].taken = true;
  run.museum.orrery.taken = true;
  run.museum.keycard.taken = true;
  run.museum.panel.cut = true;
  run.thief.carrying = true;
  run.museum.grid[10][27] = T.DOORWAY;
  run.museum.grid[3][27] = T.DOORWAY;
  run.museum.grid[17][6] = T.DOORWAY;
  place(run.thief, 9, 15, Math.PI);
  run.thief.moving = true;
  run.thief.sneaking = false;
  trail(run, [[33, 13], [33, 14], [32, 15], [30, 15], [28, 15], [26, 15], [24, 15], [22, 15], [20, 15], [18, 15], [16, 15], [14, 15], [12, 15], [10, 15]]);
  const [brask, odell, mirren, tamsin] = run.guards;
  for (const g of run.guards) {
    g.mode = MODE.ALERT;
    g.suspicion = 1;
    g.lastSeen = { x: run.thief.x, y: run.thief.y };
  }
  place(brask, 12, 12, Math.PI * 0.6);
  place(odell, 22, 14, Math.PI);
  place(mirren, 17, 16, Math.PI);
  place(tamsin, 33, 12, Math.PI * 0.5);
  raiseAlarm(run.alarm, 100);
  run.alarm.countdown = 21.4;
  run.smokes.push({ ...tileCentre(13, 15), radius: 52, life: 6, full: 7 });
  run.kit.smoke = 1;
  settle(run, 6);
  run.toasts = [
    { text: 'PRESSURE PLATE TRIPPED', tone: 'danger', life: 3 },
    { text: 'THE GILDED ORRERY  +$5000  - now get out', tone: 'gold', life: 3 },
  ];
  return run;
}

function getawayRun() {
  const run = createRun({ emp: 1, pick: 1 });
  run.phase = PHASE.ESCAPED;
  run.time = 287;
  run.cash = 6800;
  run.thief.carrying = true;
  run.alarm.peak = 58;
  run.spottedCount = 1;
  return run;
}

/** Build the app state for a screenshot scene, or null for normal play. */
export function sceneFor(name) {
  if (name === 'heist') return { phase: PHASE.HEIST, run: heistScene() };
  if (name === 'lockdown') return { phase: PHASE.HEIST, run: lockdownScene() };
  if (name === 'plan') return { phase: PHASE.PLAN, loadout: { smoke: 1, emp: 1, rag: 1 }, planMuseum: buildMuseum() };
  if (name === 'getaway') return { phase: PHASE.ESCAPED, run: getawayRun() };
  if (name === 'title') return { phase: PHASE.TITLE };
  return null;
}
