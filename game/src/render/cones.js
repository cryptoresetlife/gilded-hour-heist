// Vision cones drawn over the lit museum: amber for guards, magenta for cameras, flushing red
// while they have eyes on the thief, fading toward their reach and edged so a sweep reads clearly.
import { CAMERA, GUARD, PALETTE } from '../config.js';

function traceFan(g, fan) {
  g.beginPath();
  g.moveTo(fan[0].x, fan[0].y);
  for (let i = 1; i < fan.length; i += 1) g.lineTo(fan[i].x, fan[i].y);
  g.closePath();
}

function drawFan(g, fan, x, y, range, color, edge) {
  if (fan.length < 3) return;
  const grad = g.createRadialGradient(x, y, 6, x, y, range);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  traceFan(g, fan);
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 1.5;
  g.setLineDash([6, 5]);
  g.beginPath();
  g.moveTo(fan[1].x, fan[1].y);
  for (let i = 2; i < fan.length; i += 1) g.lineTo(fan[i].x, fan[i].y);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(fan[1].x, fan[1].y);
  g.moveTo(x, y);
  g.lineTo(fan[fan.length - 1].x, fan[fan.length - 1].y);
  g.stroke();
  g.lineWidth = 1;
}

/** Every guard's and camera's cone for this frame. */
export function drawCones(g, run) {
  for (const camera of run.cameras) {
    const hot = camera.sees;
    drawFan(g, camera.fan, camera.x, camera.y, CAMERA.range, hot ? PALETTE.cameraConeHot : PALETTE.cameraCone, hot ? 'rgba(255,80,110,0.9)' : 'rgba(255,120,220,0.55)');
  }
  for (const guard of run.guards) {
    const hot = guard.sees || guard.mode === 'alert';
    const warm = guard.suspicion > 0.3;
    const color = hot ? PALETTE.guardConeHot : warm ? 'rgba(255,150,60,0.30)' : PALETTE.guardCone;
    drawFan(g, guard.fan, guard.x, guard.y, GUARD.range, color, hot ? 'rgba(255,90,70,0.95)' : 'rgba(255,210,120,0.6)');
  }
}
