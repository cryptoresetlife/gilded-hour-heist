// Laser tripwires: beams between two emitters that pulse on and off on a fixed rhythm. Breaking an
// active beam trips the alarm and rings a bell guards come running to; a Tick Jammer kills any
// beam whose emitters sit in its field. Timing a crossing is the whole trick.
import { TILE } from './config.js';
import { raiseAlarm } from './alarm.js';
import { hearNoise } from './guards.js';

/** The museum's three tripwires, in pixels: a corridor gate, the vault-door screen and a gallery beam. */
export function createLasers() {
  const beam = (x1, y1, x2, y2, period, onShare, offset) => ({ x1, y1, x2, y2, period, onShare, offset, active: true, cooldown: 0 });
  return [
    beam(29.5 * TILE, 14 * TILE, 29.5 * TILE, 20 * TILE, 3.4, 0.55, 0),
    beam(31.5 * TILE, 8 * TILE, 31.5 * TILE, 13 * TILE, 2.8, 0.6, 0.3),
    beam(18.5 * TILE + 13, 7 * TILE, 23.5 * TILE - 13, 7 * TILE, 4, 0.5, 0.5),
  ];
}

/** Whether a beam is lit at a given time (before jammers). */
export function beamOn(laser, time) {
  return ((time + laser.offset) % laser.period) / laser.period < laser.onShare;
}

function distanceToSegment(px, py, laser) {
  const dx = laser.x2 - laser.x1;
  const dy = laser.y2 - laser.y1;
  const t = Math.max(0, Math.min(1, ((px - laser.x1) * dx + (py - laser.y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (laser.x1 + dx * t), py - (laser.y1 + dy * t));
}

/** Pulse every beam, and trip the alarm when the thief breaks a live one. */
export function updateLasers(run, dt) {
  const { thief } = run;
  for (const laser of run.lasers) {
    const jammed = run.power.jammed(laser.x1, laser.y1) || run.power.jammed(laser.x2, laser.y2);
    laser.active = !jammed && beamOn(laser, run.time);
    laser.cooldown = Math.max(0, laser.cooldown - dt);
    if (!laser.active || laser.cooldown > 0 || thief.inVent) continue;
    if (distanceToSegment(thief.x, thief.y, laser) > thief.radius) continue;
    laser.cooldown = 2;
    raiseAlarm(run.alarm, 25);
    hearNoise(run, (laser.x1 + laser.x2) / 2, (laser.y1 + laser.y2) / 2, 220);
    run.rings.push({ x: thief.x, y: thief.y, radius: 220, t: 0, color: 'red' });
    run.events.push({ kind: 'laser' });
  }
}
