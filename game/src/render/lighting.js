// Light and shadow: an indigo darkness layer multiplied over the museum, with warm pools cut by
// each lamp's shadow-casting light polygon and the guards' flashlights. Tiles the lamps never
// reach get a teal hatch, so safe shadow reads at a glance.
import { COLS, PALETTE, ROWS, TILE } from '../config.js';
import { visionFan } from '../geometry.js';
import { lightLevel } from '../geometry.js';
import { isWalkable } from '../level.js';

const LAMP_RAYS = 120;

export function createLighting() {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  return { canvas, g: canvas.getContext('2d'), lampFans: null, shadowKey: '', shadowTiles: [] };
}

function fillFan(g, fan) {
  g.beginPath();
  g.moveTo(fan[0].x, fan[0].y);
  for (let i = 1; i < fan.length; i += 1) g.lineTo(fan[i].x, fan[i].y);
  g.closePath();
  g.fill();
}

function lampFans(lighting, museum) {
  if (!lighting.lampFans) {
    lighting.lampFans = museum.lamps.map((lamp) => visionFan(museum, lamp.x, lamp.y, 0, Math.PI * 2, lamp.radius, LAMP_RAYS));
  }
  return lighting.lampFans;
}

/** Tiles in deep shadow, recomputed only when doors, power or jammers change. */
function shadowTiles(lighting, run) {
  const key = `${run.power.jams.length}|${run.museum.grid.flat().join('')}`;
  if (key === lighting.shadowKey) return lighting.shadowTiles;
  const tiles = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!isWalkable(run.museum.grid[y][x], false)) continue;
      if (lightLevel(run.museum, (x + 0.5) * TILE, (y + 0.5) * TILE, run.power) < 0.22) tiles.push({ x, y });
    }
  }
  lighting.shadowKey = key;
  lighting.shadowTiles = tiles;
  lighting.lampFans = null;
  return tiles;
}

/** Draw the darkness layer for this frame and multiply it over the world. */
export function drawLighting(g, lighting, run, time) {
  const lg = lighting.g;
  const { museum, power } = run;
  lg.globalCompositeOperation = 'source-over';
  lg.fillStyle = PALETTE.ambient;
  lg.fillRect(0, 0, lighting.canvas.width, lighting.canvas.height);
  lg.globalCompositeOperation = 'lighter';
  const fans = lampFans(lighting, museum);
  museum.lamps.forEach((lamp, index) => {
    if (!power.on || power.jammed(lamp.x, lamp.y)) return;
    const flicker = 1 + Math.sin(time * 7 + index * 3.1) * 0.02;
    const grad = lg.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.radius * flicker);
    grad.addColorStop(0, 'rgba(255,214,150,0.95)');
    grad.addColorStop(0.55, 'rgba(200,150,95,0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = grad;
    fillFan(lg, fans[index]);
  });
  for (const guard of run.guards) {
    if (guard.fan.length < 3) continue;
    const grad = lg.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, 150);
    grad.addColorStop(0, 'rgba(255,240,200,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = grad;
    fillFan(lg, guard.fan);
  }
  lg.globalCompositeOperation = 'source-over';
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.drawImage(lighting.canvas, 0, 0);
  g.restore();
  drawShadowHatch(g, shadowTiles(lighting, run));
}

function drawShadowHatch(g, tiles) {
  g.save();
  g.strokeStyle = 'rgba(47,224,192,0.16)';
  g.lineWidth = 1;
  g.beginPath();
  for (const { x, y } of tiles) {
    const px = x * TILE;
    const py = y * TILE;
    for (let i = 0; i < TILE; i += 8) {
      g.moveTo(px + i, py);
      g.lineTo(px, py + i);
      g.moveTo(px + TILE, py + i);
      g.lineTo(px + i, py + TILE);
    }
  }
  g.stroke();
  g.restore();
}
