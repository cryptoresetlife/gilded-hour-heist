// Draws one frame: the screen for the current phase, or the heist itself in layers (floorplan,
// doors, lighting, cones, loot, actors, effects) seen through the following camera, under the HUD.
import { TOOLS, VIEW } from '../config.js';
import { PHASE, scoreRun } from '../heist.js';
import { paintFloorplan } from './floorplan.js';
import { createLighting, drawLighting } from './lighting.js';
import { drawCones } from './cones.js';
import {
  drawAimLine, drawCameraBodies, drawDoors, drawEffects, drawExitAndVan, drawGuards, drawLampFixtures, drawLasers, drawLoot, drawOrrery,
  drawPatrolHints, drawThief, drawTrail,
} from './actors.js';
import { applyCamera, createCamera, updateCamera } from './camera.js';
import { drawHud } from './hud.js';
import { drawEnd, drawPlan, drawTitle } from './screens.js';

export function createRenderer(canvas, museum) {
  return {
    g: canvas.getContext('2d'),
    floorplan: paintFloorplan(museum),
    lighting: createLighting(),
    camera: createCamera(),
    buttons: [],
    lastTime: 0,
  };
}

/** Darken the frame's edges so the eye settles on the lit middle of the view. */
function drawVignette(g) {
  const w = VIEW.width;
  const h = VIEW.height - VIEW.top;
  g.save();
  g.translate(0, VIEW.top);
  const grad = g.createRadialGradient(w / 2, h / 2, h * 0.5, w / 2, h / 2, w * 0.62);
  grad.addColorStop(0, 'rgba(5,6,14,0)');
  grad.addColorStop(1, 'rgba(5,6,14,0.35)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.restore();
}

function drawWorld(g, renderer, run, time, mouse) {
  g.fillStyle = '#05060c';
  g.fillRect(0, VIEW.top, VIEW.width, VIEW.height - VIEW.top);
  g.save();
  applyCamera(g, renderer.camera);
  g.drawImage(renderer.floorplan, 0, 0);
  drawDoors(g, run.museum);
  drawExitAndVan(g, run.museum, time);
  drawLighting(g, renderer.lighting, run, time);
  drawLampFixtures(g, run.museum, run.power, time);
  drawCones(g, run);
  drawPatrolHints(g, run.guards, time);
  drawLasers(g, run.lasers, time);
  drawTrail(g, run.routeTrail);
  drawLoot(g, run.museum, time);
  drawOrrery(g, run.museum.orrery, time, null);
  drawCameraBodies(g, run.cameras, time);
  drawEffects(g, run, time);
  drawGuards(g, run.guards);
  const hidden = !run.guards.some((x) => x.sees) && !run.cameras.some((c) => c.sees);
  drawThief(g, run.thief, time, hidden);
  if (run.thief.carrying) drawOrrery(g, run.museum.orrery, time, run.thief);
  if (mouse) drawAimLine(g, run.thief, mouse, TOOLS[run.selected].range && run.kit[run.selected] > 0 ? TOOLS[run.selected].range : 0);
  g.restore();
  drawVignette(g);
}

/** Render the whole frame for `app` (phase, run, loadout); `mouse` is in museum pixels or null. */
export function renderFrame(renderer, app, time, mouse, snapCamera = false) {
  const { g } = renderer;
  const dt = Math.max(0, Math.min(0.1, time - renderer.lastTime));
  renderer.lastTime = time;
  g.setTransform(1, 0, 0, 1, 0, 0);
  renderer.buttons = [];
  if (app.phase === PHASE.TITLE) drawTitle(g, renderer.floorplan, time);
  else if (app.phase === PHASE.PLAN) renderer.buttons = drawPlan(g, renderer.floorplan, app.planMuseum, app.loadout, time);
  else if (app.phase === PHASE.HEIST) {
    updateCamera(renderer.camera, app.run, dt, snapCamera);
    drawWorld(g, renderer, app.run, time, mouse);
    drawHud(g, app.run, time, renderer.camera, renderer.floorplan);
  } else {
    renderer.camera.primed = false;
    drawEnd(g, scoreRun(app.run), app.run.endReason, time, renderer.floorplan, app.run.routeTrail);
  }
}
