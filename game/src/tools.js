// The thief's kit: brass coins that clatter and lure guards, soot bombs that swallow cones, tick
// jammers that kill nearby cameras and lamps, and the power state they act on. Each throw flies
// in an arc to the cursor (clamped to the tool's range) and takes effect where it lands.
import { TOOLS } from './config.js';
import { hasLineOfSight } from './geometry.js';
import { hearNoise } from './guards.js';

export const TOOL_ORDER = ['coin', 'smoke', 'emp', 'pick', 'rag'];

/** The power grid: lamps and cameras, the office loop timer and active jammer zones. */
export function createPower() {
  const power = {
    on: true,
    camerasLooped: 0,
    jams: [],
    jammed(x, y) {
      for (const jam of power.jams) if (Math.hypot(x - jam.x, y - jam.y) < jam.radius) return true;
      return false;
    },
  };
  return power;
}

/** Starting kit from the planning board's purchases. */
export function createKit(loadout) {
  const kit = {};
  for (const id of TOOL_ORDER) kit[id] = TOOLS[id].start + (loadout[id] ?? 0);
  return kit;
}

/** Throw the selected tool from the thief toward (tx, ty). Returns false if it cannot be thrown. */
export function throwTool(run, id, tx, ty) {
  const spec = TOOLS[id];
  if (!spec.range || run.kit[id] <= 0) return false;
  const { thief } = run;
  let dx = tx - thief.x;
  let dy = ty - thief.y;
  const dist = Math.hypot(dx, dy);
  if (dist > spec.range) {
    dx = (dx / dist) * spec.range;
    dy = (dy / dist) * spec.range;
  }
  let landX = thief.x + dx;
  let landY = thief.y + dy;
  if (!hasLineOfSight(run.museum, thief.x, thief.y, landX, landY)) {
    const back = 0.5;
    landX = thief.x + dx * back;
    landY = thief.y + dy * back;
  }
  run.kit[id] -= 1;
  run.projectiles.push({ id, fromX: thief.x, fromY: thief.y, x: landX, y: landY, t: 0, flight: 0.45 });
  run.events.push({ kind: 'throw', tool: id });
  return true;
}

function land(run, shot) {
  const spec = TOOLS[shot.id];
  if (shot.id === 'coin') {
    hearNoise(run, shot.x, shot.y, spec.noise);
    run.rings.push({ x: shot.x, y: shot.y, radius: spec.noise, t: 0, color: 'gold' });
    run.events.push({ kind: 'clink' });
  } else if (shot.id === 'smoke') {
    run.smokes.push({ x: shot.x, y: shot.y, radius: spec.radius, life: spec.seconds, full: spec.seconds });
    run.events.push({ kind: 'hiss' });
  } else if (shot.id === 'emp') {
    run.power.jams.push({ x: shot.x, y: shot.y, radius: spec.radius, life: spec.seconds, full: spec.seconds });
    run.rings.push({ x: shot.x, y: shot.y, radius: spec.radius, t: 0, color: 'cyan' });
    run.events.push({ kind: 'zap' });
  }
}

/** Fly projectiles, age clouds, jams, noise rings and the office camera loop. */
export function updateTools(run, dt) {
  for (const shot of run.projectiles) {
    shot.t += dt;
    if (shot.t >= shot.flight && !shot.done) {
      shot.done = true;
      land(run, shot);
    }
  }
  run.projectiles = run.projectiles.filter((shot) => !shot.done);
  for (const cloud of run.smokes) cloud.life -= dt;
  run.smokes = run.smokes.filter((cloud) => cloud.life > 0);
  for (const jam of run.power.jams) jam.life -= dt;
  run.power.jams = run.power.jams.filter((jam) => jam.life > 0);
  for (const ring of run.rings) ring.t += dt;
  run.rings = run.rings.filter((ring) => ring.t < 0.9);
  run.power.camerasLooped = Math.max(0, run.power.camerasLooped - dt);
}
