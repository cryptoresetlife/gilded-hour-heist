// Wren, the thief: WASD to move, Shift to creep silently, crawling slowly through vents. Walking
// at full pace on hard floors throws footstep noise that guards hear; the carpet muffles it.
import { PLAYER, TILE } from './config.js';
import { moveBody } from './geometry.js';
import { T, tileAt } from './level.js';
import { hearNoise } from './guards.js';

export function createThief(museum) {
  return {
    x: museum.start.x,
    y: museum.start.y,
    radius: PLAYER.radius,
    facing: 0,
    sneaking: false,
    inVent: false,
    moving: false,
    stepTimer: 0,
    stride: 0,
    carrying: false,
    busy: null,
  };
}

/** Move the thief one step from the input's direction and modifiers; emits footstep noise. */
export function updateThief(run, input, dt) {
  const { thief, museum } = run;
  let mx = input.right - input.left;
  let my = input.down - input.up;
  if (thief.busy) {
    mx = 0;
    my = 0;
  }
  const len = Math.hypot(mx, my);
  const here = tileAt(museum, thief.x, thief.y);
  thief.inVent = here ? here.kind === T.VENT : false;
  thief.sneaking = input.sneak || thief.inVent;
  thief.moving = len > 0;
  if (!thief.moving) return;
  mx /= len;
  my /= len;
  let speed = thief.inVent ? PLAYER.crawlSpeed : thief.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (thief.carrying) speed *= 0.82;
  moveBody(museum, thief, mx * speed * dt, my * speed * dt, true);
  thief.facing = Math.atan2(my, mx);
  thief.stride += speed * dt;
  if (thief.sneaking) return;
  thief.stepTimer -= dt;
  if (thief.stepTimer <= 0) {
    thief.stepTimer = 0.34;
    const floor = museum.floors[Math.floor(thief.y / TILE)]?.[Math.floor(thief.x / TILE)];
    const radius = floor === 'carpet' ? PLAYER.walkNoise * 0.55 : PLAYER.walkNoise;
    hearNoise(run, thief.x, thief.y, radius);
    run.rings.push({ x: thief.x, y: thief.y, radius, t: 0, color: 'white' });
    run.events.push({ kind: 'step' });
  }
}
