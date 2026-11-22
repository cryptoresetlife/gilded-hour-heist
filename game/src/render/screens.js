// Full screens around the heist: the title card, the planning board (a blueprint of the museum
// with the three routes, patrol loops and camera arcs marked, beside the kit shop and its budget)
// and the morning-after front page that scores the night.
import { PALETTE, PLAN_BUDGET, TILE, TOOLS, VIEW } from '../config.js';
import { TOOL_ORDER } from '../tools.js';
import { budgetLeft } from '../heist.js';
import { drawOrrery } from './actors.js';

const ROUTES = [
  { name: 'A  GALLERY & KEYCARD', color: '#ffcf4a', note: 'Most loot, most eyes. Pick the office, swipe in.', points: [[3, 9], [7, 7], [9, 5], [14, 2], [26, 3], [30, 4], [37, 5], [30, 4], [26, 3], [25, 9], [27, 10], [34, 10]] },
  { name: 'B  SERVICE VENT', color: '#2fe0c0', note: 'Locked dock door, a corridor camera, a slow crawl.', points: [[3, 13], [5, 17], [7, 17], [12, 18], [24, 18], [33, 15], [33, 13], [34, 10]] },
  { name: 'C  CRACK THE DIAL', color: '#ff6a6a', note: 'No keycard. Nine loud seconds at the vault door.', points: [[3, 9], [7, 7], [12, 8], [20, 8], [26, 10], [27, 10], [34, 10]] },
];

function heading(g, text, x, y, size = 42) {
  g.fillStyle = PALETTE.gold;
  g.font = `bold ${size}px Georgia, serif`;
  g.fillText(text, x, y);
}

/** The title card: the museum glowing behind a gilt name plate. */
export function drawTitle(g, floorplan, time) {
  g.fillStyle = PALETTE.void;
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  g.globalAlpha = 0.35;
  g.drawImage(floorplan, 0, VIEW.top);
  g.globalAlpha = 1;
  const grad = g.createRadialGradient(640, 330, 60, 640, 330, 620);
  grad.addColorStop(0, 'rgba(11,15,30,0.4)');
  grad.addColorStop(1, 'rgba(11,15,30,0.95)');
  g.fillStyle = grad;
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  g.textAlign = 'center';
  g.fillStyle = PALETTE.hudDim;
  g.font = '15px "Trebuchet MS", sans-serif';
  g.fillText('THE HALVORSEN HOROLOGY MUSEUM  ·  02:14 AM', 640, 200);
  heading(g, 'GILDED HOUR', 640, 290, 96);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'italic 20px Georgia, serif';
  g.fillText('One night. Four guards. Four cameras. One clockwork Orrery worth stealing.', 640, 340);
  const pulse = 0.6 + Math.sin(time * 3) * 0.4;
  g.fillStyle = `rgba(255,207,74,${pulse})`;
  g.font = 'bold 20px "Trebuchet MS", sans-serif';
  g.fillText('PRESS ENTER OR CLICK TO PLAN THE JOB', 640, 430);
  g.fillStyle = PALETTE.hudDim;
  g.font = '14px "Trebuchet MS", sans-serif';
  g.fillText('WASD move  ·  SHIFT creep silently  ·  E hold to act  ·  1-5 pick tool  ·  CLICK throw', 640, 500);
  g.fillText('Stay in teal-hatched shadow. Read the cones. Watch the alarm meter.', 640, 524);
}

function drawRoute(g, route, ox, oy, s, time) {
  g.save();
  g.strokeStyle = route.color;
  g.lineWidth = 3;
  g.setLineDash([10, 7]);
  g.lineDashOffset = -time * 25;
  g.beginPath();
  route.points.forEach(([tx, ty], i) => {
    const x = ox + (tx + 0.5) * TILE * s;
    const y = oy + (ty + 0.5) * TILE * s;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  g.stroke();
  g.restore();
}

/** The planning board; returns the clickable buttons it drew. */
export function drawPlan(g, floorplan, museum, loadout, time) {
  g.fillStyle = '#0a1430';
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  const s = 0.74;
  const ox = 20;
  const oy = 92;
  g.textAlign = 'left';
  heading(g, 'THE PLAN', 24, 52, 34);
  g.fillStyle = PALETTE.hudDim;
  g.font = '14px "Trebuchet MS", sans-serif';
  g.fillText('Blueprint of the Halvorsen, stolen from the city archive. Three ways to the Orrery.', 236, 50);
  g.save();
  g.globalAlpha = 0.9;
  g.drawImage(floorplan, ox, oy, floorplan.width * s, floorplan.height * s);
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(20,60,140,0.38)';
  g.fillRect(ox, oy, floorplan.width * s, floorplan.height * s);
  g.restore();
  g.strokeStyle = 'rgba(160,200,255,0.6)';
  g.strokeRect(ox - 0.5, oy - 0.5, floorplan.width * s + 1, floorplan.height * s + 1);
  for (const guard of museum.guards) {
    g.strokeStyle = 'rgba(255,196,80,0.85)';
    g.setLineDash([3, 4]);
    g.beginPath();
    guard.route.forEach((p, i) => (i ? g.lineTo(ox + p.x * s, oy + p.y * s) : g.moveTo(ox + p.x * s, oy + p.y * s)));
    g.closePath();
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#ffc450';
    g.font = 'bold 10px "Trebuchet MS", sans-serif';
    g.fillText(guard.name.toUpperCase(), ox + guard.route[0].x * s + 4, oy + guard.route[0].y * s - 4);
  }
  g.save();
  g.beginPath();
  g.rect(ox, oy, floorplan.width * s, floorplan.height * s);
  g.clip();
  for (const cam of museum.cameras) {
    g.fillStyle = 'rgba(255,90,200,0.22)';
    g.strokeStyle = 'rgba(255,120,220,0.7)';
    g.beginPath();
    g.moveTo(ox + cam.x * s, oy + cam.y * s);
    g.arc(ox + cam.x * s, oy + cam.y * s, 170 * s, cam.from - 0.42, cam.to + 0.42);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  ROUTES.forEach((route) => drawRoute(g, route, ox, oy, s, time));
  const o = museum.orrery;
  g.fillStyle = PALETTE.gold;
  g.beginPath();
  g.arc(ox + o.x * s, oy + o.y * s, 9 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
  g.fill();
  g.font = 'bold 12px "Trebuchet MS", sans-serif';
  g.fillText('ORRERY', ox + o.x * s + 14, oy + o.y * s + 4);
  ROUTES.forEach((route, i) => {
    const y = oy + floorplan.height * s + 26 + i * 22;
    g.fillStyle = route.color;
    g.fillRect(ox, y - 9, 22, 4);
    g.font = 'bold 13px "Trebuchet MS", sans-serif';
    g.fillText(route.name, ox + 32, y - 3);
    g.fillStyle = PALETTE.hudDim;
    g.font = '13px "Trebuchet MS", sans-serif';
    g.fillText(route.note, ox + 230, y - 3);
  });
  return drawShop(g, loadout);
}

function drawShop(g, loadout) {
  const x = 980;
  const y = 92;
  g.fillStyle = PALETTE.hudPanel;
  g.beginPath();
  g.roundRect(x, y, 280, 560, 10);
  g.fill();
  g.strokeStyle = 'rgba(255,207,74,0.5)';
  g.stroke();
  g.textAlign = 'left';
  heading(g, 'THE KIT', x + 18, y + 40, 26);
  const left = budgetLeft(loadout);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'bold 15px "Trebuchet MS", sans-serif';
  g.fillText(`Budget  $${left} / $${PLAN_BUDGET}`, x + 18, y + 68);
  const buttons = [];
  TOOL_ORDER.forEach((id, i) => {
    const spec = TOOLS[id];
    const by = y + 84 + i * 80;
    g.fillStyle = 'rgba(255,255,255,0.05)';
    g.beginPath();
    g.roundRect(x + 12, by, 256, 72, 8);
    g.fill();
    g.fillStyle = PALETTE.gold;
    g.font = 'bold 15px Georgia, serif';
    g.fillText(spec.name, x + 24, by + 22);
    g.fillStyle = PALETTE.hudDim;
    g.font = '12px "Trebuchet MS", sans-serif';
    g.fillText(spec.cost ? `$${spec.cost} each  ·  ${spec.info}` : `free x${spec.start}  ·  ${spec.info}`, x + 24, by + 40);
    g.fillStyle = PALETTE.hudInk;
    g.font = 'bold 22px "Trebuchet MS", sans-serif';
    g.fillText(`x${spec.start + (loadout[id] ?? 0)}`, x + 24, by + 64);
    if (spec.cost) {
      const minus = { x: x + 170, y: by + 8, w: 36, h: 28, id, delta: -1 };
      const plus = { x: x + 220, y: by + 8, w: 36, h: 28, id, delta: 1 };
      for (const b of [minus, plus]) {
        const ok = b.delta < 0 ? (loadout[id] ?? 0) > 0 : left >= spec.cost;
        g.fillStyle = ok ? 'rgba(255,207,74,0.25)' : 'rgba(255,255,255,0.06)';
        g.beginPath();
        g.roundRect(b.x, b.y, b.w, b.h, 6);
        g.fill();
        g.fillStyle = ok ? PALETTE.gold : PALETTE.hudDim;
        g.textAlign = 'center';
        g.fillText(b.delta < 0 ? '−' : '+', b.x + b.w / 2, b.y + 21);
        g.textAlign = 'left';
        buttons.push(b);
      }
    }
  });
  g.fillStyle = PALETTE.gold;
  g.beginPath();
  g.roundRect(x + 12, y + 492, 256, 52, 8);
  g.fill();
  g.fillStyle = '#1a1208';
  g.font = 'bold 18px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText('START THE JOB  [ENTER]', x + 140, y + 525);
  g.textAlign = 'left';
  buttons.push({ x: x + 12, y: y + 492, w: 256, h: 52, id: 'start' });
  return buttons;
}

/** A pinned police bulletin with the Orrery on it: MISSING if it got away, RECOVERED if not. */
function drawMissingPoster(g, cx, cy, time, missing) {
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.06);
  g.fillStyle = '#e9dfc4';
  g.fillRect(-90, -120, 180, 240);
  g.fillStyle = '#1b1712';
  g.textAlign = 'center';
  g.font = 'bold 22px Georgia, serif';
  g.fillText(missing ? 'MISSING' : 'RECOVERED', 0, -88);
  g.fillStyle = '#20263a';
  g.fillRect(-70, -72, 140, 130);
  drawOrrery(g, { x: 0, y: -8, taken: false }, time, null);
  g.fillStyle = '#1b1712';
  g.font = 'bold 12px Georgia, serif';
  g.fillText('The Gilded Orrery', 0, 78);
  g.font = '11px Georgia, serif';
  g.fillText('Brass, 1781. Reward offered.', 0, 96);
  g.fillStyle = '#b02020';
  g.beginPath();
  g.arc(0, -112, 5, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** The morning edition: headline, the night's numbers and the rating. */
export function drawEnd(g, score, reason, time) {
  g.fillStyle = '#0b0f1e';
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  const sky = g.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, score.escaped ? '#1d2a5c' : '#3a0d18');
  sky.addColorStop(1, '#05060c');
  g.fillStyle = sky;
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  for (let i = 0; i < 14; i += 1) {
    const bx = i * 96;
    const bh = 120 + ((i * 53) % 140);
    g.fillStyle = '#0a0d1c';
    g.fillRect(bx, 470 - bh, 90, bh);
    g.fillStyle = 'rgba(255,214,150,0.5)';
    for (let w = 0; w < 6; w += 1) if ((i + w) % 3) g.fillRect(bx + 12 + (w % 3) * 24, 490 - bh + Math.floor(w / 3) * 30, 10, 14);
  }
  const moon = g.createRadialGradient(1160, 120, 10, 1160, 120, 90);
  moon.addColorStop(0, 'rgba(255,244,214,0.95)');
  moon.addColorStop(0.35, 'rgba(255,236,190,0.6)');
  moon.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = moon;
  g.beginPath();
  g.arc(1160, 120, 90, 0, Math.PI * 2);
  g.fill();
  drawMissingPoster(g, 120, 220, time, score.escaped);
  g.fillStyle = '#14161f';
  g.fillRect(0, 470, VIEW.width, 250);
  g.fillStyle = 'rgba(255,207,74,0.5)';
  for (let x = ((time * -200) % 120) + 0; x < VIEW.width; x += 120) g.fillRect(x, 590, 60, 6);
  const vanX = score.escaped ? 200 + ((time * 160) % 1200) : 560;
  g.fillStyle = '#1e3b46';
  g.beginPath();
  g.roundRect(vanX, 420, 120, 58, [10, 22, 4, 4]);
  g.fill();
  g.fillStyle = '#9fd8ff';
  g.beginPath();
  g.roundRect(vanX + 88, 428, 26, 18, [2, 12, 2, 2]);
  g.fill();
  g.fillStyle = '#2fe0c0';
  g.fillRect(vanX, 452, 120, 6);
  g.fillStyle = '#f4ead2';
  g.font = 'bold 10px "Trebuchet MS", sans-serif';
  g.textAlign = 'center';
  g.fillText('QUILL & SONS', vanX + 46, 446);
  for (const wx of [vanX + 26, vanX + 94]) {
    g.fillStyle = '#07080c';
    g.beginPath();
    g.arc(wx, 478, 11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6a7080';
    g.beginPath();
    g.arc(wx, 478, 4, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#ff3040';
  g.fillRect(vanX - 2, 440, 4, 10);
  const beam = g.createLinearGradient(vanX + 120, 0, vanX + 360, 0);
  beam.addColorStop(0, 'rgba(255,240,190,0.5)');
  beam.addColorStop(1, 'rgba(255,240,190,0)');
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(vanX + 120, 462);
  g.lineTo(vanX + 360, 430);
  g.lineTo(vanX + 360, 500);
  g.closePath();
  g.fill();
  if (!score.escaped) {
    for (let i = 0; i < 3; i += 1) {
      g.fillStyle = (Math.floor(time * 4) + i) % 2 ? 'rgba(255,40,60,0.8)' : 'rgba(60,120,255,0.8)';
      g.fillRect(380 + i * 220, 440, 90, 40);
    }
  }
  g.fillStyle = '#efe6cf';
  g.beginPath();
  g.roundRect(240, 60, 800, 330, 4);
  g.fill();
  g.fillStyle = '#1b1712';
  g.textAlign = 'center';
  g.font = 'bold 15px Georgia, serif';
  g.fillText('THE MORNING HALVORSEN GAZETTE  ·  LATE EDITION', 640, 92);
  g.fillRect(270, 102, 740, 2);
  g.font = 'bold 40px Georgia, serif';
  const headline = score.escaped ? (score.rating === 'WALKED AWAY' ? 'BURGLAR FLEES, ORRERY SAFE' : 'ORRERY VANISHES IN THE NIGHT') : 'THIEF NABBED AT HALVORSEN';
  g.fillText(headline, 640, 152);
  g.font = 'italic 17px Georgia, serif';
  g.fillText(score.escaped ? '"Not a single camera saw a face," says baffled curator' : `${reason}. Police praise "textbook" night shift.`, 640, 184);
  g.fillRect(270, 200, 740, 1);
  const stats = [
    ['HAUL', `$${score.haul.toLocaleString('en-US')}`],
    ['TIME', `${Math.floor(score.seconds / 60)}m ${score.seconds % 60}s`],
    ['ALARM PEAK', `${score.peak}%`],
    ['TIMES SPOTTED', `${score.spotted}`],
  ];
  stats.forEach(([label, value], i) => {
    const x = 340 + i * 200;
    g.font = 'bold 12px "Trebuchet MS", sans-serif';
    g.fillText(label, x, 236);
    g.font = 'bold 28px Georgia, serif';
    g.fillText(value, x, 272);
  });
  g.font = 'bold 13px "Trebuchet MS", sans-serif';
  g.fillText('CREW RATING', 640, 316);
  g.fillStyle = score.escaped ? '#9a6a00' : '#a01020';
  g.font = 'bold 36px Georgia, serif';
  g.fillText(score.rating, 640, 360);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'bold 18px "Trebuchet MS", sans-serif';
  g.fillText('PRESS ENTER TO PLAN ANOTHER NIGHT', 640, 640);
}
