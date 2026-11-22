// Draws one frame: the screen for the current phase, or the heist itself in layers (floorplan,
// doors, lighting, cones, loot, actors, effects) under the HUD.
import { TOOLS, VIEW } from '../config.js';
import { PHASE, scoreRun } from '../heist.js';
import { paintFloorplan } from './floorplan.js';
import { createLighting, drawLighting } from './lighting.js';
import { drawCones } from './cones.js';
import {
  drawAimLine, drawCameraBodies, drawDoors, drawEffects, drawExitAndVan, drawGuards, drawLoot, drawOrrery, drawThief, drawTrail,
} from './actors.js';
import { drawHud } from './hud.js';
import { drawEnd, drawPlan, drawTitle } from './screens.js';

export function createRenderer(canvas, museum) {
  return {
    g: canvas.getContext('2d'),
    floorplan: paintFloorplan(museum),
    lighting: createLighting(),
    buttons: [],
  };
}

function drawWorld(g, renderer, run, time, mouse) {
  g.save();
  g.translate(0, VIEW.top);
  g.drawImage(renderer.floorplan, 0, 0);
  drawDoors(g, run.museum);
  drawExitAndVan(g, run.museum, time);
  drawLighting(g, renderer.lighting, run, time);
  drawCones(g, run);
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
}

/** Render the whole frame for `app` (phase, run, loadout). */
export function renderFrame(renderer, app, time, mouse) {
  const { g } = renderer;
  g.setTransform(1, 0, 0, 1, 0, 0);
  renderer.buttons = [];
  if (app.phase === PHASE.TITLE) drawTitle(g, renderer.floorplan, time);
  else if (app.phase === PHASE.PLAN) renderer.buttons = drawPlan(g, renderer.floorplan, app.planMuseum, app.loadout, time);
  else if (app.phase === PHASE.HEIST) {
    drawWorld(g, renderer, app.run, time, mouse);
    drawHud(g, app.run, time);
  } else drawEnd(g, scoreRun(app.run), app.run.endReason, time);
}
