// Everything that moves or changes, drawn over the lit floor: doors and the vault, the getaway van,
// loot glints and the Gilded Orrery, the thief with her teal scarf, guards with suspicion rings,
// camera housings, soot clouds, jammer pulses, thrown coins and the footprint trail.
import { PALETTE, TILE } from '../config.js';
import { T } from '../level.js';

export function drawDoors(g, museum) {
  for (let y = 0; y < museum.grid.length; y += 1) {
    for (let x = 0; x < museum.grid[y].length; x += 1) {
      const kind = museum.grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (kind === T.LOCKED) {
        g.fillStyle = '#6b4424';
        g.fillRect(px + 3, py + 1, TILE - 6, TILE - 2);
        g.strokeStyle = '#2c1a0c';
        g.lineWidth = 2;
        g.strokeRect(px + 4, py + 2, TILE - 8, TILE - 4);
        g.fillStyle = PALETTE.danger;
        g.beginPath();
        g.arc(px + TILE / 2, py + TILE / 2, 4, 0, Math.PI * 2);
        g.fill();
        g.lineWidth = 1;
      } else if (kind === T.VAULT) {
        g.fillStyle = '#8994a8';
        g.fillRect(px, py - 4, TILE, TILE + 8);
        const grad = g.createRadialGradient(px + 12, py + 12, 2, px + 16, py + 16, 16);
        grad.addColorStop(0, '#e6ecf5');
        grad.addColorStop(1, '#58637a');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(px + TILE / 2, py + TILE / 2, 14, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#2d3445';
        g.lineWidth = 2;
        for (let i = 0; i < 6; i += 1) {
          const a = (i / 6) * Math.PI * 2;
          g.beginPath();
          g.moveTo(px + 16 + Math.cos(a) * 5, py + 16 + Math.sin(a) * 5);
          g.lineTo(px + 16 + Math.cos(a) * 12, py + 16 + Math.sin(a) * 12);
          g.stroke();
        }
        g.lineWidth = 1;
      }
    }
  }
}

/** Brass lamp fittings: a hot bulb with a soft halo, dark when the power or a jammer kills them. */
export function drawLampFixtures(g, museum, power, time) {
  museum.lamps.forEach((lamp, index) => {
    const lit = power.on && !power.jammed(lamp.x, lamp.y);
    if (lit) {
      const halo = g.createRadialGradient(lamp.x, lamp.y, 1, lamp.x, lamp.y, 18);
      halo.addColorStop(0, `rgba(255,236,180,${0.8 + Math.sin(time * 7 + index) * 0.1})`);
      halo.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(lamp.x, lamp.y, 18, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = lit ? '#fff4d0' : '#3a3f55';
    g.strokeStyle = '#8a6a2a';
    g.beginPath();
    g.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  });
}

export function drawExitAndVan(g, museum, time) {
  const z = museum.exitZone;
  g.save();
  g.strokeStyle = PALETTE.safe;
  g.lineWidth = 2;
  g.setLineDash([8, 6]);
  g.lineDashOffset = -time * 20;
  g.strokeRect(z.x0 * TILE + 4, z.y0 * TILE + 4, (z.x1 - z.x0 + 1) * TILE - 8, (z.y1 - z.y0 + 1) * TILE - 8);
  g.restore();
  const { x, y } = museum.van;
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.fillRect(-26, -40, 60, 92);
  g.fillStyle = '#1e3b46';
  g.fillRect(-30, -46, 58, 90);
  g.fillStyle = '#2fe0c0';
  g.fillRect(-30, -10, 58, 6);
  g.fillStyle = '#9fd8ff';
  g.fillRect(-26, -42, 50, 14);
  g.fillStyle = '#0d1a20';
  g.fillRect(-24, 10, 46, 28);
  g.fillStyle = '#f4ead2';
  g.font = 'bold 8px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText('QUILL & SONS', -1, 4);
  g.restore();
  g.fillStyle = PALETTE.safe;
  g.font = 'bold 12px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText('GETAWAY', (z.x0 + z.x1 + 1) * TILE / 2, z.y1 * TILE + TILE - 6);
}

function glint(g, x, y, time, phase, size) {
  const pulse = 0.6 + Math.sin(time * 3 + phase) * 0.4;
  const grad = g.createRadialGradient(x, y, 1, x, y, size * 2.4);
  grad.addColorStop(0, `rgba(255,220,110,${0.55 * pulse})`);
  grad.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(x, y, size * 2.4, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = `rgba(255,250,220,${pulse})`;
  g.beginPath();
  g.moveTo(x - size, y);
  g.lineTo(x + size, y);
  g.moveTo(x, y - size);
  g.lineTo(x, y + size);
  g.stroke();
}

/** A small gold pocket watch: the loot icon. */
function drawPocketWatch(g, x, y) {
  g.fillStyle = PALETTE.gold;
  g.strokeStyle = PALETTE.goldDeep;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(x, y, 6.5, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#fff6d8';
  g.beginPath();
  g.arc(x, y, 4, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#5a3a08';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 3);
  g.moveTo(x, y);
  g.lineTo(x + 2.5, y + 1);
  g.stroke();
  g.fillStyle = PALETTE.gold;
  g.fillRect(x - 1.5, y - 10, 3, 3);
}

export function drawLoot(g, museum, time) {
  for (const item of museum.loot) {
    if (item.taken) continue;
    glint(g, item.x, item.y, time, item.id, 9);
    drawPocketWatch(g, item.x, item.y);
    g.font = 'bold 9px "Trebuchet MS", sans-serif';
    g.textAlign = 'center';
    g.fillStyle = 'rgba(10,12,26,0.8)';
    g.fillRect(item.x - 15, item.y + 9, 30, 11);
    g.fillStyle = PALETTE.gold;
    g.fillText(`$${item.value}`, item.x, item.y + 18);
  }
  if (!museum.keycard.taken) {
    const { x, y } = museum.keycard;
    glint(g, x, y, time, 9, 6);
    g.fillStyle = '#5fe0ff';
    g.fillRect(x - 7, y - 5, 14, 10);
    g.fillStyle = '#123';
    g.fillRect(x - 5, y - 1, 10, 2);
  }
  const panel = museum.panel;
  g.fillStyle = panel.cut ? '#3a3f55' : '#2a2f45';
  g.fillRect(panel.x - 10, panel.y - 12, 20, 18);
  g.fillStyle = panel.cut ? '#555' : time % 1 < 0.5 ? '#ff4a4a' : '#ffb04a';
  g.fillRect(panel.x - 6, panel.y - 8, 4, 4);
  g.fillStyle = '#4aff9a';
  g.fillRect(panel.x + 2, panel.y - 8, 4, 4);
}

/** The Gilded Orrery: a pedestal of nested brass rings with planets turning on them. */
export function drawOrrery(g, orrery, time, carriedBy) {
  const x = carriedBy ? carriedBy.x : orrery.x;
  const y = carriedBy ? carriedBy.y - 16 : orrery.y;
  const scale = carriedBy ? 0.45 : 1;
  if (orrery.taken && !carriedBy) return;
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  const halo = g.createRadialGradient(0, 0, 4, 0, 0, 56);
  halo.addColorStop(0, 'rgba(255,214,110,0.75)');
  halo.addColorStop(1, 'rgba(255,190,60,0)');
  g.fillStyle = halo;
  g.beginPath();
  g.arc(0, 0, 56, 0, Math.PI * 2);
  g.fill();
  if (!carriedBy) {
    g.fillStyle = '#3b2a1a';
    g.beginPath();
    g.arc(0, 0, 22, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = PALETTE.gold;
  g.lineWidth = 2;
  const rings = [8, 13, 18];
  rings.forEach((r, i) => {
    g.beginPath();
    g.ellipse(0, 0, r, r * 0.8, 0.3 * i, 0, Math.PI * 2);
    g.stroke();
    const a = time * (1.4 - i * 0.35) + i * 2;
    g.fillStyle = ['#7fd6ff', '#ff8a5c', '#d6f07a'][i];
    g.beginPath();
    g.arc(Math.cos(a) * r, Math.sin(a) * r * 0.8, 2.6, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = '#fff3c0';
  g.beginPath();
  g.arc(0, 0, 4, 0, Math.PI * 2);
  g.fill();
  g.restore();
  if (!carriedBy) {
    g.fillStyle = PALETTE.gold;
    g.font = 'bold 11px "Trebuchet MS", sans-serif';
    g.textAlign = 'center';
    g.fillText('THE GILDED ORRERY', x, y + 34);
  }
}

export function drawCameraBodies(g, cameras, time) {
  for (const cam of cameras) {
    g.save();
    g.translate(cam.x, cam.y);
    g.rotate(cam.angle);
    g.fillStyle = cam.offline ? '#3a3f55' : '#d9dbe6';
    g.fillRect(-6, -6, 16, 12);
    g.fillStyle = '#20232f';
    g.fillRect(8, -4, 5, 8);
    g.restore();
    const blink = cam.offline ? '#5a6080' : cam.sees ? PALETTE.danger : time % 1.2 < 0.6 ? '#ff60d0' : '#702060';
    g.fillStyle = blink;
    g.beginPath();
    g.arc(cam.x, cam.y, 3, 0, Math.PI * 2);
    g.fill();
  }
}

function drawSuspicion(g, guard) {
  if (guard.suspicion <= 0.02 && guard.mode === 'patrol') return;
  const x = guard.x;
  const y = guard.y - 24;
  const alert = guard.mode === 'alert';
  g.fillStyle = 'rgba(10,12,26,0.85)';
  g.beginPath();
  g.arc(x, y, 10, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = alert ? PALETTE.danger : '#ffb04a';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (alert ? 1 : guard.suspicion));
  g.stroke();
  g.lineWidth = 1;
  g.fillStyle = alert ? PALETTE.danger : '#ffd27a';
  g.font = 'bold 13px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText(alert ? '!' : '?', x, y + 5);
}

/** Each patrolling guard's next two legs as a faint dotted line, so a beat can be read ahead. */
export function drawPatrolHints(g, guards, time) {
  g.save();
  g.strokeStyle = 'rgba(255,196,80,0.4)';
  g.lineWidth = 2;
  g.setLineDash([2, 7]);
  g.lineDashOffset = -time * 12;
  for (const guard of guards) {
    if (guard.mode !== 'patrol' || guard.down) continue;
    const a = guard.route[guard.waypoint];
    const b = guard.route[(guard.waypoint + 1) % guard.route.length];
    g.beginPath();
    g.moveTo(guard.x, guard.y);
    g.lineTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
    g.fillStyle = 'rgba(255,196,80,0.55)';
    g.beginPath();
    g.arc(a.x, a.y, 3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** A guard put to sleep: slumped on his side, cap off, a slow "z" drifting up. */
function drawSleepingGuard(g, guard) {
  g.save();
  g.translate(guard.x, guard.y);
  g.rotate(guard.facing + Math.PI / 2);
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.ellipse(2, 3, 15, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PALETTE.guard;
  g.beginPath();
  g.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#e6c9a0';
  g.beginPath();
  g.arc(12, 0, 5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#111a33';
  g.beginPath();
  g.arc(20, 4, 4, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.fillStyle = guard.found ? PALETTE.danger : '#9fb4ff';
  g.font = 'bold 12px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText(guard.found ? 'FOUND!' : 'z z', guard.x, guard.y - 16);
}

export function drawGuards(g, guards) {
  for (const guard of guards) {
    if (guard.down) {
      drawSleepingGuard(g, guard);
      continue;
    }
    g.save();
    g.translate(guard.x, guard.y);
    g.scale(1.2, 1.2);
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.beginPath();
    g.ellipse(3, 4, 13, 11, 0, 0, Math.PI * 2);
    g.fill();
    g.rotate(guard.facing);
    const swing = Math.sin(guard.stride * 0.25) * 4;
    g.fillStyle = '#1a2340';
    g.fillRect(-4 + swing, -9, 7, 5);
    g.fillRect(-4 - swing, 4, 7, 5);
    g.fillStyle = PALETTE.guard;
    g.beginPath();
    g.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e6c9a0';
    g.beginPath();
    g.arc(1, 0, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111a33';
    g.beginPath();
    g.arc(-1, 0, 6, Math.PI * 0.5, Math.PI * 1.5);
    g.fill();
    g.fillStyle = '#ffe9a8';
    g.fillRect(9, 5, 7, 3);
    g.restore();
    drawSuspicion(g, guard);
  }
}

export function drawThief(g, thief, time, hidden) {
  g.save();
  g.translate(thief.x, thief.y);
  if (hidden) {
    g.strokeStyle = `rgba(47,224,192,${0.5 + Math.sin(time * 4) * 0.2})`;
    g.lineWidth = 2;
    g.setLineDash([3, 3]);
    g.beginPath();
    g.arc(0, 0, 16, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }
  g.fillStyle = PALETTE.scarf;
  g.font = 'bold 10px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText('WREN', 0, -22);
  g.scale(1.3, 1.3);
  const aura = g.createRadialGradient(0, 0, 4, 0, 0, 20);
  aura.addColorStop(0, 'rgba(47,224,192,0.45)');
  aura.addColorStop(1, 'rgba(47,224,192,0)');
  g.fillStyle = aura;
  g.beginPath();
  g.arc(0, 0, 20, 0, Math.PI * 2);
  g.fill();
  g.rotate(thief.facing);
  g.strokeStyle = PALETTE.scarf;
  g.lineWidth = 1.6;
  g.beginPath();
  g.ellipse(0, 0, 9.5, 11.5, 0, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1;
  const swing = thief.moving ? Math.sin(thief.stride * 0.3) * 3 : 0;
  g.fillStyle = '#0c0d12';
  g.fillRect(-3 + swing, -8, 6, 4);
  g.fillRect(-3 - swing, 4, 6, 4);
  g.fillStyle = thief.carrying ? '#3a2a10' : '#2c2f3c';
  g.beginPath();
  g.ellipse(-6, 0, 5, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PALETTE.thief;
  g.beginPath();
  g.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PALETTE.scarf;
  g.fillRect(-2, -6, 4, 12);
  g.beginPath();
  g.moveTo(-2, 4);
  g.lineTo(-12 - swing, 7);
  g.lineTo(-11 - swing, 3);
  g.fill();
  g.fillStyle = '#0a0b10';
  g.beginPath();
  g.arc(2, 0, 5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = PALETTE.scarf;
  g.fillRect(5, -2, 2, 4);
  g.restore();
}

export function drawEffects(g, run, time) {
  for (const jam of run.power.jams) {
    const a = Math.min(1, jam.life / 1.5);
    g.strokeStyle = `rgba(95,224,255,${0.35 * a})`;
    g.lineWidth = 2;
    g.setLineDash([4, 8]);
    g.lineDashOffset = time * 30;
    g.beginPath();
    g.arc(jam.x, jam.y, jam.radius, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.lineWidth = 1;
  }
  for (const cloud of run.smokes) {
    const a = Math.min(1, cloud.life / 1.2) * Math.min(1, (cloud.full - cloud.life) * 4 + 0.3);
    for (let i = 0; i < 7; i += 1) {
      const ang = i * 0.9 + time * 0.3;
      const r = cloud.radius * (0.45 + (i % 3) * 0.12);
      const cx = cloud.x + Math.cos(ang) * cloud.radius * 0.35;
      const cy = cloud.y + Math.sin(ang) * cloud.radius * 0.35;
      const grad = g.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, `rgba(70,66,78,${0.85 * a})`);
      grad.addColorStop(1, 'rgba(40,38,48,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  const colors = { gold: '255,207,74', cyan: '95,224,255', red: '255,74,74', white: '220,225,255' };
  for (const ring of run.rings) {
    const k = ring.t / 0.9;
    g.strokeStyle = `rgba(${colors[ring.color]},${(1 - k) * (ring.color === 'white' ? 0.25 : 0.7)})`;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(ring.x, ring.y, ring.radius * (0.2 + k * 0.8), 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 1;
  }
  for (const shot of run.projectiles) {
    const k = shot.t / shot.flight;
    const x = shot.fromX + (shot.x - shot.fromX) * k;
    const y = shot.fromY + (shot.y - shot.fromY) * k - Math.sin(k * Math.PI) * 30;
    g.fillStyle = shot.id === 'coin' ? PALETTE.gold : shot.id === 'emp' ? '#5fe0ff' : '#777';
    g.beginPath();
    g.arc(x, y, 4, 0, Math.PI * 2);
    g.fill();
  }
}

export function drawTrail(g, trail) {
  g.fillStyle = 'rgba(47,224,192,0.35)';
  const from = Math.max(0, trail.length - 60);
  for (let i = from; i < trail.length; i += 1) {
    const p = trail[i];
    g.beginPath();
    g.arc(p.x + (i % 2 ? 3 : -3), p.y, 2, 0, Math.PI * 2);
    g.fill();
  }
}

export function drawAimLine(g, thief, mouse, range) {
  if (!range) return;
  let dx = mouse.x - thief.x;
  let dy = mouse.y - thief.y;
  const d = Math.hypot(dx, dy);
  if (d > range) {
    dx = (dx / d) * range;
    dy = (dy / d) * range;
  }
  g.save();
  g.strokeStyle = 'rgba(244,234,210,0.45)';
  g.setLineDash([3, 6]);
  g.beginPath();
  g.moveTo(thief.x, thief.y);
  g.quadraticCurveTo(thief.x + dx / 2, thief.y + dy / 2 - 30, thief.x + dx, thief.y + dy);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.arc(thief.x + dx, thief.y + dy, 8, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}
