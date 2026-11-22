// The heist camera: a close view (1.4x) that glides after the thief, clamped to the museum's walls,
// with helpers to turn museum pixels into screen pixels (for HUD prompts) and back (for the mouse).
import { COLS, ROWS, TILE, VIEW } from '../config.js';

export const ZOOM = 1.4;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;
const HALF_W = VIEW.width / 2 / ZOOM;
const HALF_H = (VIEW.height - VIEW.top) / 2 / ZOOM;

export function createCamera() {
  return { x: WORLD_W / 2, y: WORLD_H / 2, zoom: ZOOM, primed: false };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Follow the run's focus point (the thief, or a scene's chosen focus); snap on the first frame. */
export function updateCamera(camera, run, dt, snap) {
  const focus = run.cameraFocus ?? run.thief;
  const tx = clamp(focus.x, HALF_W, WORLD_W - HALF_W);
  const ty = clamp(focus.y, HALF_H, WORLD_H - HALF_H);
  if (snap || !camera.primed) {
    camera.x = tx;
    camera.y = ty;
    camera.primed = true;
    return;
  }
  const k = Math.min(1, dt * 5);
  camera.x += (tx - camera.x) * k;
  camera.y += (ty - camera.y) * k;
}

/** Transform the context so museum pixels draw through the camera (call after save()). */
export function applyCamera(g, camera) {
  g.translate(0, VIEW.top);
  g.scale(camera.zoom, camera.zoom);
  g.translate(-(camera.x - HALF_W), -(camera.y - HALF_H));
}

/** Museum pixel to canvas pixel. */
export function toScreen(camera, x, y) {
  return { x: (x - camera.x + HALF_W) * camera.zoom, y: (y - camera.y + HALF_H) * camera.zoom + VIEW.top };
}

/** Canvas pixel (with the HUD bar already removed from y) to museum pixel. */
export function toWorld(camera, sx, syBelowBar) {
  return { x: sx / camera.zoom + camera.x - HALF_W, y: syBelowBar / camera.zoom + camera.y - HALF_H };
}
