// The Halvorsen Horology Museum, built room by room: a tile grid of walls, floors, doors, vents and
// cover, plus the lamps, loot, guards' patrol loops and cameras that sit on it. Three routes lead to
// the Orrery: the guarded grand gallery and the office keycard, the service corridor and its vent,
// or cracking the vault door by hand under the gallery camera.
import { COLS, ROWS, TILE } from './config.js';

export const T = {
  WALL: 0,
  FLOOR: 1,
  DOORWAY: 2,
  LOCKED: 3,
  VAULT: 4,
  VENT: 5,
  PILLAR: 6,
  CRATE: 7,
  CASE: 8,
};

export const ROOMS = [
  { id: 'dock', name: 'LOADING DOCK', x0: 1, y0: 1, x1: 5, y1: 19, floor: 'concrete' },
  { id: 'gallery', name: 'GRAND GALLERY', x0: 7, y0: 1, x1: 26, y1: 12, floor: 'carpet' },
  { id: 'office', name: 'SECURITY OFFICE', x0: 28, y0: 1, x1: 38, y1: 6, floor: 'tile' },
  { id: 'vault', name: 'ORRERY VAULT', x0: 28, y0: 8, x1: 38, y1: 12, floor: 'steel' },
  { id: 'corridor', name: 'SERVICE CORRIDOR', x0: 7, y0: 14, x1: 38, y1: 19, floor: 'concrete' },
];

/** Pixel centre of a tile. */
export function tileCentre(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

function carveRoom(grid, floors, room) {
  for (let y = room.y0; y <= room.y1; y += 1) {
    for (let x = room.x0; x <= room.x1; x += 1) {
      grid[y][x] = T.FLOOR;
      floors[y][x] = room.floor;
    }
  }
}

function placeOpenings(grid, floors) {
  const openings = [
    [6, 6, T.DOORWAY, 'concrete'],
    [6, 7, T.DOORWAY, 'concrete'],
    [6, 17, T.LOCKED, 'concrete'],
    [12, 13, T.DOORWAY, 'concrete'],
    [22, 13, T.DOORWAY, 'concrete'],
    [27, 3, T.LOCKED, 'tile'],
    [27, 10, T.VAULT, 'steel'],
    [33, 13, T.VENT, 'steel'],
    [34, 13, T.VENT, 'steel'],
  ];
  for (const [x, y, kind, floor] of openings) {
    grid[y][x] = kind;
    floors[y][x] = floor;
  }
}

/** Furniture that blocks walking but not sight: the CCTV desk in the office and the vault's clock shelves. */
export const DECOR = [
  { kind: 'cctv', tiles: [[34, 1], [35, 1], [36, 1]] },
  { kind: 'shelf', tiles: [[35, 8], [36, 8]] },
];

/** Gilt-framed paintings hung along the gallery's north wall (tile columns on wall row 0). */
export const PAINTINGS = [8, 12, 16, 20, 24];

function placeCover(grid) {
  for (const item of DECOR) for (const [x, y] of item.tiles) grid[y][x] = T.CASE;
  const pillars = [[13, 6], [13, 7], [18, 6], [18, 7], [23, 6], [23, 7]];
  const crates = [[2, 3], [3, 3], [4, 15], [4, 16], [2, 17], [15, 17], [16, 17], [26, 16], [27, 16], [31, 17], [9, 17]];
  const cases = [[10, 3], [11, 3], [10, 10], [11, 10], [16, 3], [16, 10], [21, 3], [21, 10], [31, 3], [32, 3]];
  for (const [x, y] of pillars) grid[y][x] = T.PILLAR;
  for (const [x, y] of crates) grid[y][x] = T.CRATE;
  for (const [x, y] of cases) grid[y][x] = T.CASE;
}

function placeLamps() {
  const spots = [
    [3, 6, 150], [3, 13, 120], [10, 6, 170], [17, 2, 150], [21, 8, 170], [25, 11, 120],
    [33, 3, 150], [33, 10, 140], [12, 16, 130], [24, 17, 140], [35, 17, 130],
  ];
  return spots.map(([tx, ty, radius], index) => ({ id: index, ...tileCentre(tx, ty), radius }));
}

function placeLoot() {
  const items = [
    [9, 2, 300, 'Pocket Chronometer'],
    [12, 11, 250, 'Silver Repeater'],
    [24, 2, 400, 'Enamel Carriage Clock'],
    [19, 11, 350, 'Moonphase Watch'],
    [37, 2, 600, 'Curator’s Cash Box'],
    [30, 17, 200, 'Spare Gears Tin'],
    [37, 17, 450, 'Pearl Escapement'],
    [4, 5, 150, 'Courier Envelope'],
  ];
  return items.map(([tx, ty, value, name], index) => ({ id: index, ...tileCentre(tx, ty), value, name, taken: false }));
}

function placeGuards() {
  const loops = [
    { name: 'Brask', route: [[8, 2], [25, 2], [25, 11], [8, 11]] },
    { name: 'Odell', route: [[17, 4], [17, 11], [14, 11], [14, 4]] },
    { name: 'Mirren', route: [[8, 15], [37, 15], [37, 18], [8, 18]] },
    { name: 'Tamsin', route: [[29, 9], [37, 9], [37, 12], [29, 12]] },
  ];
  return loops.map((loop, index) => ({
    id: index,
    name: loop.name,
    route: loop.route.map(([tx, ty]) => tileCentre(tx, ty)),
  }));
}

function placeCameras() {
  // Each camera hangs on a wall at `x, y` and sweeps between angles `from` and `to` (radians).
  return [
    { id: 0, ...tileCentre(26, 1), from: Math.PI * 0.55, to: Math.PI * 0.95 },
    { id: 1, ...tileCentre(20, 14), from: Math.PI * 0.15, to: Math.PI * 0.85 },
    { id: 2, ...tileCentre(38, 8), from: Math.PI * 0.6, to: Math.PI * 0.95 },
    { id: 3, ...tileCentre(7, 19), from: -Math.PI * 0.45, to: -Math.PI * 0.05 },
  ];
}

/** Build the whole museum: grid, floor materials and every placed thing, fresh for a new run. */
export function buildMuseum() {
  const grid = [];
  const floors = [];
  for (let y = 0; y < ROWS; y += 1) {
    grid.push(new Array(COLS).fill(T.WALL));
    floors.push(new Array(COLS).fill(null));
  }
  for (const room of ROOMS) carveRoom(grid, floors, room);
  placeOpenings(grid, floors);
  placeCover(grid);
  return {
    grid,
    floors,
    lamps: placeLamps(),
    loot: placeLoot(),
    guards: placeGuards(),
    cameras: placeCameras(),
    orrery: { ...tileCentre(34, 10), taken: false },
    keycard: { ...tileCentre(37, 5), taken: false },
    panel: { ...tileCentre(29, 1), cut: false },
    van: { ...tileCentre(3, 10) },
    exitZone: { x0: 1, y0: 8, x1: 5, y1: 12 },
    start: tileCentre(3, 14),
  };
}

/** Tile under a pixel position, or null outside the grid. */
export function tileAt(museum, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return null;
  return { tx, ty, kind: museum.grid[ty][tx] };
}

/** Can a body walk through this tile kind? Vents are walkable only for the thief, crawling. */
export function isWalkable(kind, forThief) {
  if (kind === T.FLOOR || kind === T.DOORWAY) return true;
  if (kind === T.VENT) return forThief;
  return false;
}

/** Does this tile kind stop a line of sight? Glass cases and vents let sight through. */
export function blocksSight(kind) {
  return kind === T.WALL || kind === T.PILLAR || kind === T.CRATE || kind === T.LOCKED || kind === T.VAULT;
}

/** Name of the room containing a pixel position. */
export function roomAt(x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  const room = ROOMS.find((r) => tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1);
  return room ? room.name : 'PASSAGE';
}
