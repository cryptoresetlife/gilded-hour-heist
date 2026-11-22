// Line-of-sight maths on the museum grid: marching rays for vision cones and lamp light, sight
// checks between two points, angle helpers and wall-sliding movement for every body.
import { TILE } from './config.js';
import { blocksSight, isWalkable, tileAt } from './level.js';

const RAY_STEP = 4;

/** True when a soot cloud covers this point. */
function inSmoke(smokes, x, y) {
  for (const cloud of smokes) {
    const dx = x - cloud.x;
    const dy = y - cloud.y;
    if (dx * dx + dy * dy < cloud.radius * cloud.radius) return true;
  }
  return false;
}

/** Distance a ray travels from (x, y) at `angle` before a sight-blocking tile or smoke stops it. */
export function castRay(museum, x, y, angle, maxDist, smokes = []) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = RAY_STEP; d < maxDist; d += RAY_STEP) {
    const px = x + cos * d;
    const py = y + sin * d;
    const tile = tileAt(museum, px, py);
    if (!tile || blocksSight(tile.kind)) return d;
    if (smokes.length && inSmoke(smokes, px, py)) return d;
  }
  return maxDist;
}

/** Points of a vision fan: origin first, then the end of each ray across the field of view. */
export function visionFan(museum, x, y, facing, fov, range, rays, smokes = []) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i += 1) {
    const angle = facing - fov / 2 + (fov * i) / rays;
    const d = castRay(museum, x, y, angle, range, smokes);
    points.push({ x: x + Math.cos(angle) * d, y: y + Math.sin(angle) * d });
  }
  return points;
}

/** Whether nothing blocks the straight line from a to b. */
export function hasLineOfSight(museum, ax, ay, bx, by, smokes = []) {
  const dist = Math.hypot(bx - ax, by - ay);
  if (dist < 1) return true;
  return castRay(museum, ax, ay, Math.atan2(by - ay, bx - ax), dist, smokes) >= dist - 1;
}

/** Signed smallest difference between two angles, in (-PI, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Turn `current` toward `target` by at most `maxStep` radians. */
export function turnToward(current, target, maxStep) {
  const d = angleDiff(target, current);
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

function blockedAt(museum, x, y, radius, forThief) {
  const probes = [[-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]];
  for (const [ox, oy] of probes) {
    const tile = tileAt(museum, x + ox, y + oy);
    if (!tile || !isWalkable(tile.kind, forThief)) return true;
  }
  return false;
}

/** Move a body by (dx, dy), sliding along walls one axis at a time. */
export function moveBody(museum, body, dx, dy, forThief) {
  if (!blockedAt(museum, body.x + dx, body.y, body.radius, forThief)) body.x += dx;
  else if (dx && !dy) nudgeTowardLane(museum, body, 'y', Math.abs(dx), forThief);
  if (!blockedAt(museum, body.x, body.y + dy, body.radius, forThief)) body.y += dy;
  else if (dy && !dx) nudgeTowardLane(museum, body, 'x', Math.abs(dy), forThief);
}

/** Corner assist: slide toward the middle of the current tile so one-tile doorways are easy to enter. */
function nudgeTowardLane(museum, body, axis, amount, forThief) {
  const centre = (Math.floor(body[axis] / TILE) + 0.5) * TILE;
  const offset = centre - body[axis];
  if (Math.abs(offset) < 0.5) return;
  const step = Math.sign(offset) * Math.min(Math.abs(offset), amount);
  const nx = axis === 'x' ? body.x + step : body.x;
  const ny = axis === 'y' ? body.y + step : body.y;
  if (!blockedAt(museum, nx, ny, body.radius, forThief)) body[axis] += step;
}

/** How brightly lamps light a point, 0 (pitch dark) to 1 (full light). */
export function lightLevel(museum, x, y, power) {
  if (!power.on) return 0.12;
  let best = 0.12;
  for (const lamp of museum.lamps) {
    if (power.jammed(lamp.x, lamp.y)) continue;
    const dist = Math.hypot(x - lamp.x, y - lamp.y);
    if (dist >= lamp.radius) continue;
    if (!hasLineOfSight(museum, lamp.x, lamp.y, x, y)) continue;
    best = Math.max(best, 1 - (dist / lamp.radius) ** 1.6);
  }
  return best;
}

/** Tile coordinates of a pixel position. */
export function toTile(x, y) {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}
