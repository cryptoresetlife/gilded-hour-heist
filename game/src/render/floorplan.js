// The museum's static look, painted once to an offscreen canvas: a blueprint void, per-room floors
// (gallery carpet with gilt trim, dock concrete with hazard paint, office tiles, vault diamond
// plate), raised walls with lit edges, marble pillars, crates, glass display cases and room names.
import { COLS, PALETTE, ROWS, TILE } from '../config.js';
import { ROOMS, T } from '../level.js';
import { mulberry32 } from '../random.js';

function paintVoid(g, w, h) {
  g.fillStyle = PALETTE.void;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = PALETTE.blueprintLine;
  g.lineWidth = 1;
  for (let x = 0; x <= w; x += 16) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, h);
    g.stroke();
  }
  for (let y = 0; y <= h; y += 16) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(w, y + 0.5);
    g.stroke();
  }
}

function paintFloorTile(g, kind, x, y, rand) {
  const px = x * TILE;
  const py = y * TILE;
  if (kind === 'carpet') {
    g.fillStyle = PALETTE.carpet;
    g.fillRect(px, py, TILE, TILE);
    g.strokeStyle = 'rgba(255,200,120,0.10)';
    g.beginPath();
    g.moveTo(px + TILE / 2, py + 4);
    g.lineTo(px + TILE - 4, py + TILE / 2);
    g.lineTo(px + TILE / 2, py + TILE - 4);
    g.lineTo(px + 4, py + TILE / 2);
    g.closePath();
    g.stroke();
  } else if (kind === 'concrete') {
    g.fillStyle = PALETTE.concrete;
    g.fillRect(px, py, TILE, TILE);
    for (let i = 0; i < 6; i += 1) {
      g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      g.fillRect(px + rand() * TILE, py + rand() * TILE, 2, 2);
    }
    g.strokeStyle = 'rgba(0,0,0,0.12)';
    g.strokeRect(px + 0.5, py + 0.5, TILE, TILE);
  } else if (kind === 'tile') {
    g.fillStyle = (x + y) % 2 ? PALETTE.tileFloor : '#7c806c';
    g.fillRect(px, py, TILE, TILE);
  } else if (kind === 'steel') {
    g.fillStyle = PALETTE.steel;
    g.fillRect(px, py, TILE, TILE);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) g.fillRect(px + 4 + i * 8, py + 4 + j * 8 + (i % 2) * 3, 4, 1.5);
  }
}

function paintRoomTrim(g, room) {
  if (room.id !== 'gallery') return;
  g.strokeStyle = 'rgba(255,207,74,0.45)';
  g.lineWidth = 2;
  g.strokeRect(room.x0 * TILE + 6, room.y0 * TILE + 6, (room.x1 - room.x0 + 1) * TILE - 12, (room.y1 - room.y0 + 1) * TILE - 12);
  g.lineWidth = 1;
}

function paintDockHazard(g) {
  g.save();
  g.beginPath();
  g.rect(1 * TILE, 8 * TILE, 5 * TILE, 5 * TILE);
  g.clip();
  g.fillStyle = 'rgba(47,224,192,0.10)';
  g.fillRect(1 * TILE, 8 * TILE, 5 * TILE, 5 * TILE);
  g.restore();
  for (let i = 0; i < 10; i += 1) {
    g.fillStyle = i % 2 ? '#d9b22b' : '#1d1d1d';
    g.fillRect(1 * TILE + i * 16, 8 * TILE - 4, 16, 4);
    g.fillRect(1 * TILE + i * 16, 13 * TILE, 16, 4);
  }
}

function isSolid(grid, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  return grid[y][x] === T.WALL;
}

function paintWalls(g, grid) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (grid[y][x] !== T.WALL) continue;
      const px = x * TILE;
      const py = y * TILE;
      g.fillStyle = PALETTE.wallTop;
      g.fillRect(px, py, TILE, TILE);
      g.fillStyle = 'rgba(255,255,255,0.035)';
      g.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      g.strokeStyle = PALETTE.wallEdge;
      g.lineWidth = 2;
      g.beginPath();
      if (!isSolid(grid, x, y - 1)) { g.moveTo(px, py + 1); g.lineTo(px + TILE, py + 1); }
      if (!isSolid(grid, x - 1, y)) { g.moveTo(px + 1, py); g.lineTo(px + 1, py + TILE); }
      if (!isSolid(grid, x + 1, y)) { g.moveTo(px + TILE - 1, py); g.lineTo(px + TILE - 1, py + TILE); }
      g.stroke();
      if (!isSolid(grid, x, y + 1)) {
        g.fillStyle = PALETTE.wallFace;
        g.fillRect(px, py + TILE - 9, TILE, 9);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(px, py + TILE, TILE, 6);
      }
    }
  }
  g.lineWidth = 1;
}

function paintPillar(g, cx, cy) {
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.ellipse(cx + 4, cy + 5, 14, 13, 0, 0, Math.PI * 2);
  g.fill();
  const grad = g.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 14);
  grad.addColorStop(0, '#f2ece0');
  grad.addColorStop(1, '#9d9584');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, 13, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(80,70,60,0.5)';
  g.beginPath();
  g.arc(cx, cy, 9, 0, Math.PI * 2);
  g.stroke();
}

function paintCrate(g, px, py) {
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.fillRect(px + 5, py + 6, TILE - 4, TILE - 4);
  g.fillStyle = '#8a6136';
  g.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  g.strokeStyle = '#4e3418';
  g.lineWidth = 2;
  g.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  g.beginPath();
  g.moveTo(px + 4, py + 4);
  g.lineTo(px + TILE - 4, py + TILE - 4);
  g.moveTo(px + TILE - 4, py + 4);
  g.lineTo(px + 4, py + TILE - 4);
  g.stroke();
  g.lineWidth = 1;
}

function paintCase(g, px, py) {
  g.fillStyle = '#2c2430';
  g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
  g.fillStyle = '#d7b46a';
  g.beginPath();
  g.arc(px + TILE / 2, py + TILE / 2, 7, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#3a2a10';
  g.beginPath();
  g.moveTo(px + TILE / 2, py + TILE / 2);
  g.lineTo(px + TILE / 2, py + TILE / 2 - 5);
  g.moveTo(px + TILE / 2, py + TILE / 2);
  g.lineTo(px + TILE / 2 + 4, py + TILE / 2);
  g.stroke();
  g.fillStyle = PALETTE.glass;
  g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
  g.strokeStyle = 'rgba(200,245,255,0.8)';
  g.strokeRect(px + 1.5, py + 1.5, TILE - 3, TILE - 3);
  g.beginPath();
  g.moveTo(px + 5, py + 12);
  g.lineTo(px + 12, py + 5);
  g.stroke();
}

function paintVents(g, grid) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (grid[y][x] !== T.VENT) continue;
      const px = x * TILE;
      const py = y * TILE;
      g.fillStyle = '#1b2030';
      g.fillRect(px, py, TILE, TILE);
      g.strokeStyle = '#7d8bb0';
      for (let i = 4; i < TILE; i += 5) {
        g.beginPath();
        g.moveTo(px + 3, py + i);
        g.lineTo(px + TILE - 3, py + i);
        g.stroke();
      }
    }
  }
}

function paintLabels(g) {
  g.font = '600 11px "Trebuchet MS", sans-serif';
  g.textAlign = 'left';
  for (const room of ROOMS) {
    g.fillStyle = 'rgba(244,234,210,0.55)';
    g.fillText(room.name, room.x0 * TILE + 10, room.y1 * TILE + TILE - 8);
  }
}

/** Paint the static museum into a new offscreen canvas the size of the grid. */
export function paintFloorplan(museum) {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  const g = canvas.getContext('2d');
  const rand = mulberry32(7);
  paintVoid(g, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const floor = museum.floors[y][x];
      if (floor) paintFloorTile(g, floor, x, y, rand);
    }
  }
  for (const room of ROOMS) paintRoomTrim(g, room);
  paintDockHazard(g);
  paintWalls(g, museum.grid);
  paintVents(g, museum.grid);
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const kind = museum.grid[y][x];
      if (kind === T.PILLAR) paintPillar(g, (x + 0.5) * TILE, (y + 0.5) * TILE);
      else if (kind === T.CRATE) paintCrate(g, x * TILE, y * TILE);
      else if (kind === T.CASE) paintCase(g, x * TILE, y * TILE);
    }
  }
  paintLabels(g);
  return canvas;
}
