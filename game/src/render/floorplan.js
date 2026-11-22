// The museum's static look, painted once to an offscreen canvas: a blueprint void, per-room floors
// (gallery carpet with gilt trim, dock concrete with hazard paint, office tiles, vault diamond
// plate), raised walls with lit edges, marble pillars, crates, glass display cases and room names.
import { COLS, PALETTE, ROWS, TILE } from '../config.js';
import { DECOR, PAINTINGS, ROOMS, T } from '../level.js';
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

function paintCctvDesk(g, tiles) {
  const x0 = tiles[0][0] * TILE;
  const y0 = tiles[0][1] * TILE;
  const w = tiles.length * TILE;
  g.fillStyle = '#3b2c22';
  g.fillRect(x0 + 2, y0 + 4, w - 4, TILE - 6);
  g.fillStyle = '#5a4434';
  g.fillRect(x0 + 2, y0 + 4, w - 4, 4);
  tiles.forEach((_, i) => {
    const mx = x0 + i * TILE + 5;
    g.fillStyle = '#10151c';
    g.fillRect(mx, y0 + 8, 22, 15);
    g.fillStyle = ['#2f8f7a', '#3a6fa8', '#7a3a8f'][i % 3];
    g.fillRect(mx + 2, y0 + 10, 18, 11);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let s = 0; s < 11; s += 3) g.fillRect(mx + 2, y0 + 10 + s, 18, 1);
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(mx + 6, y0 + 13, 6, 5);
  });
}

function paintClockShelf(g, tiles) {
  const x0 = tiles[0][0] * TILE;
  const y0 = tiles[0][1] * TILE;
  const w = tiles.length * TILE;
  g.fillStyle = '#4a3020';
  g.fillRect(x0 + 1, y0 + 3, w - 2, TILE - 8);
  for (let i = 0; i < tiles.length * 3; i += 1) {
    const cx = x0 + 6 + i * 10;
    g.fillStyle = i % 2 ? '#d7b46a' : '#c0c8d8';
    g.beginPath();
    g.arc(cx, y0 + 14, 4, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a1a0a';
    g.beginPath();
    g.moveTo(cx, y0 + 14);
    g.lineTo(cx, y0 + 11);
    g.stroke();
  }
}

function paintPaintings(g, columns) {
  const palettes = [['#3a5a8a', '#e0b060'], ['#7a2a3a', '#f0d090'], ['#2a6a4a', '#d0e0a0'], ['#5a3a7a', '#f0a070'], ['#8a6a2a', '#a0c0f0']];
  columns.forEach((col, i) => {
    const x = col * TILE + 2;
    const y = TILE - 12;
    const [bg, fg] = palettes[i % palettes.length];
    g.fillStyle = '#c99a2a';
    g.fillRect(x - 2, y - 2, TILE * 2 - 4, 13);
    g.fillStyle = bg;
    g.fillRect(x, y, TILE * 2 - 8, 9);
    g.fillStyle = fg;
    g.beginPath();
    g.arc(x + 12 + (i % 3) * 10, y + 4, 3, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x + 4, y + 6, TILE * 2 - 16, 2);
  });
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
  for (const item of DECOR) {
    if (item.kind === 'cctv') paintCctvDesk(g, item.tiles);
    else paintClockShelf(g, item.tiles);
  }
  paintPaintings(g, PAINTINGS);
  paintLabels(g);
  return canvas;
}
