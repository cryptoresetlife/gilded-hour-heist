// Hold-E actions: what the thief can do from where they stand (grab loot, pick a lock, swipe or
// crack the vault, loop the camera feeds, lift the Orrery, drive off) and the timed progress bar
// that finishes each one. Some actions are loud while they run.
import { PLAYER, TILE, TIMES } from './config.js';
import { T } from './level.js';
import { hearNoise } from './guards.js';

function inZone(zone, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return tx >= zone.x0 && tx <= zone.x1 && ty >= zone.y0 && ty <= zone.y1;
}

function adjacentTile(museum, thief, kind) {
  const tx = Math.floor(thief.x / TILE);
  const ty = Math.floor(thief.y / TILE);
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = tx + ox;
    const y = ty + oy;
    if (museum.grid[y]?.[x] !== kind) continue;
    const cx = (x + 0.5) * TILE;
    const cy = (y + 0.5) * TILE;
    if (Math.hypot(cx - thief.x, cy - thief.y) < TILE * 1.05) return { tx: x, ty: y };
  }
  return null;
}

/** The one action available right now, or null. */
export function availableAction(run) {
  const { thief, museum, kit } = run;
  const near = (p) => Math.hypot(p.x - thief.x, p.y - thief.y) < PLAYER.interactRange;
  if (inZone(museum.exitZone, thief.x, thief.y)) {
    return { id: 'escape', label: thief.carrying ? 'DRIVE OFF WITH THE ORRERY' : 'DRIVE OFF (no Orrery)', time: 0.6 };
  }
  if (!museum.orrery.taken && Math.hypot(museum.orrery.x - thief.x, museum.orrery.y - thief.y) < PLAYER.interactRange + 12) return { id: 'lift', label: 'LIFT THE ORRERY', time: TIMES.liftOrrery };
  const item = museum.loot.find((l) => !l.taken && near(l));
  if (item) return { id: 'grab', label: `TAKE ${item.name.toUpperCase()}  $${item.value}`, time: TIMES.grabLoot, item };
  if (!museum.keycard.taken && near(museum.keycard)) return { id: 'keycard', label: 'TAKE CURATOR KEYCARD', time: TIMES.grabLoot };
  if (!museum.panel.cut && near(museum.panel)) return { id: 'loop', label: 'LOOP CAMERA FEEDS (30s)', time: TIMES.cutPower };
  const lock = adjacentTile(museum, thief, T.LOCKED);
  if (lock) {
    const fast = kit.pick > 0;
    return { id: 'pick', label: fast ? 'PICK LOCK (silent)' : 'FORCE LOCK (loud)', time: fast ? TIMES.pickLockFast : TIMES.pickLock, tile: lock, loud: !fast };
  }
  const vault = adjacentTile(museum, thief, T.VAULT);
  if (vault) {
    if (museum.keycard.taken) return { id: 'swipe', label: 'SWIPE KEYCARD', time: TIMES.useKeycard, tile: vault };
    return { id: 'crack', label: 'CRACK VAULT DIAL (loud)', time: TIMES.crackVault, tile: vault, loud: true };
  }
  return null;
}

function complete(run, action) {
  const { museum, thief } = run;
  if (action.id === 'grab') {
    action.item.taken = true;
    run.cash += action.item.value;
    run.events.push({ kind: 'loot', text: `+$${action.item.value} ${action.item.name}` });
  } else if (action.id === 'keycard') {
    museum.keycard.taken = true;
    run.events.push({ kind: 'loot', text: 'Keycard: the vault door will open for you' });
  } else if (action.id === 'loop') {
    museum.panel.cut = true;
    run.power.camerasLooped = 30;
    run.events.push({ kind: 'loot', text: 'Camera feeds looped for 30 seconds' });
  } else if (action.id === 'pick' || action.id === 'swipe' || action.id === 'crack') {
    museum.grid[action.tile.ty][action.tile.tx] = T.DOORWAY;
    run.events.push({ kind: 'door' });
  } else if (action.id === 'lift') {
    museum.orrery.taken = true;
    thief.carrying = true;
    run.cash += 5000;
    run.events.push({ kind: 'orrery', text: 'THE GILDED ORRERY  +$5000  - now get out' });
  } else if (action.id === 'escape') {
    run.events.push({ kind: 'escape' });
  }
}

/** Advance the held action; releasing E or walking off cancels it. */
export function updateInteraction(run, input, dt) {
  const { thief } = run;
  const action = availableAction(run);
  run.prompt = action;
  if (!input.interact || !action) {
    thief.busy = null;
    return;
  }
  if (!thief.busy || thief.busy.id !== action.id) thief.busy = { id: action.id, progress: 0, noiseTimer: 0 };
  thief.busy.progress += dt / action.time;
  if (action.loud) {
    thief.busy.noiseTimer -= dt;
    if (thief.busy.noiseTimer <= 0) {
      thief.busy.noiseTimer = 1.1;
      hearNoise(run, thief.x, thief.y, 150);
      run.rings.push({ x: thief.x, y: thief.y, radius: 150, t: 0, color: 'red' });
      run.events.push({ kind: 'clank' });
    }
  }
  if (thief.busy.progress >= 1) {
    complete(run, action);
    thief.busy = null;
  }
}
