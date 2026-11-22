// Breadth-first paths over the tile grid for guards walking to a noise, a sighting or back to
// their beat. Guards never crawl vents and only pass doors the thief has already opened.
import { COLS, ROWS, TILE } from './config.js';
import { T } from './level.js';

function guardCanWalk(kind) {
  return kind === T.FLOOR || kind === T.DOORWAY;
}

/** Tile path from one pixel point to another as a list of pixel waypoints (tile centres), or []. */
export function findPath(museum, fromX, fromY, toX, toY) {
  const sx = Math.floor(fromX / TILE);
  const sy = Math.floor(fromY / TILE);
  let gx = Math.floor(toX / TILE);
  let gy = Math.floor(toY / TILE);
  if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return [];
  if (!guardCanWalk(museum.grid[gy][gx])) {
    const near = nearestWalkable(museum, gx, gy);
    if (!near) return [];
    gx = near.tx;
    gy = near.ty;
  }
  const prev = new Int32Array(COLS * ROWS).fill(-1);
  const start = sy * COLS + sx;
  const goal = gy * COLS + gx;
  prev[start] = start;
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head];
    if (cell === goal) break;
    const cx = cell % COLS;
    const cy = (cell - cx) / COLS;
    const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [ox, oy] of steps) {
      const nx = cx + ox;
      const ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const next = ny * COLS + nx;
      if (prev[next] !== -1 || !guardCanWalk(museum.grid[ny][nx])) continue;
      prev[next] = cell;
      queue.push(next);
    }
  }
  if (prev[goal] === -1) return [];
  const path = [];
  for (let cell = goal; cell !== start; cell = prev[cell]) {
    const cx = cell % COLS;
    path.push({ x: (cx + 0.5) * TILE, y: ((cell - cx) / COLS + 0.5) * TILE });
  }
  path.reverse();
  return path;
}

function nearestWalkable(museum, tx, ty) {
  for (let r = 1; r < 4; r += 1) {
    for (let oy = -r; oy <= r; oy += 1) {
      for (let ox = -r; ox <= r; ox += 1) {
        const x = tx + ox;
        const y = ty + oy;
        if (x >= 0 && y >= 0 && x < COLS && y < ROWS && guardCanWalk(museum.grid[y][x])) return { tx: x, ty: y };
      }
    }
  }
  return null;
}
