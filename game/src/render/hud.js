// The heist HUD: a top bar with the job name, current objective, the four-tier alarm meter, haul
// and clock; the tool belt with prices and counts; a legend for shadow, cones and loot; the
// hold-E progress ring beside the thief; toasts; and the red lockdown countdown.
import { ALARM, PALETTE, TOOLS, VIEW } from '../config.js';
import { alarmTier } from '../alarm.js';
import { TOOL_ORDER } from '../tools.js';
import { roomAt } from '../level.js';

function panel(g, x, y, w, h, r = 8) {
  g.fillStyle = PALETTE.hudPanel;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
  g.strokeStyle = 'rgba(255,207,74,0.35)';
  g.stroke();
}

function objective(run) {
  const { museum, thief } = run;
  if (thief.carrying) return 'Get the Orrery back to the van';
  if (museum.grid[10][27] !== 4) return 'Lift the Gilded Orrery';
  if (museum.keycard.taken) return 'Swipe the keycard at the vault door';
  return 'Reach the Orrery: keycard, vent or crack the vault';
}

function drawAlarmMeter(g, alarm, x, y, w, time) {
  const tier = alarmTier(alarm);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'bold 11px "Trebuchet MS", sans-serif';
  g.textAlign = 'left';
  g.fillText('ALARM', x, y + 4);
  const bx = x + 52;
  const bw = w - 52;
  g.fillStyle = '#1c1f33';
  g.beginPath();
  g.roundRect(bx, y - 8, bw, 16, 4);
  g.fill();
  const fill = (alarm.level / ALARM.max) * bw;
  const grad = g.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#2fe0c0');
  grad.addColorStop(0.34, '#ffcf4a');
  grad.addColorStop(0.67, '#ff8a3a');
  grad.addColorStop(1, '#ff2a40');
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(bx, y - 8, Math.max(4, fill), 16, 4);
  g.fill();
  if (alarm.pulse > 0 || alarm.lockdown) {
    g.strokeStyle = `rgba(255,74,74,${alarm.lockdown ? 0.6 + Math.sin(time * 10) * 0.4 : alarm.pulse})`;
    g.lineWidth = 3;
    g.strokeRect(bx - 2, y - 10, bw + 4, 20);
    g.lineWidth = 1;
  }
  g.font = 'bold 9px "Trebuchet MS", sans-serif';
  for (let i = 1; i < ALARM.tiers.length; i += 1) {
    const tx = bx + (ALARM.tiers[i].at / ALARM.max) * bw;
    g.fillStyle = 'rgba(10,12,26,0.9)';
    g.fillRect(tx - 1, y - 8, 2, 16);
  }
  ALARM.tiers.forEach((t, i) => {
    const tx = bx + (t.at / ALARM.max) * bw;
    g.fillStyle = i === tier ? PALETTE.hudInk : PALETTE.hudDim;
    g.textAlign = i === ALARM.tiers.length - 1 ? 'right' : 'left';
    g.fillText(t.name, i === ALARM.tiers.length - 1 ? tx : tx + 3, y + 20);
  });
}

function drawTopBar(g, run, time) {
  g.fillStyle = '#080a16';
  g.fillRect(0, 0, VIEW.width, VIEW.top);
  g.fillStyle = 'rgba(255,207,74,0.5)';
  g.fillRect(0, VIEW.top - 2, VIEW.width, 2);
  g.textAlign = 'left';
  g.fillStyle = PALETTE.gold;
  g.font = 'bold 22px Georgia, serif';
  g.fillText('GILDED HOUR', 16, 31);
  g.fillStyle = PALETTE.hudDim;
  g.font = '10px "Trebuchet MS", sans-serif';
  g.fillText(roomAt(run.thief.x, run.thief.y), 206, 18);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'bold 13px "Trebuchet MS", sans-serif';
  g.fillText('▸ ' + objective(run), 206, 36);
  drawAlarmMeter(g, run.alarm, 560, 18, 400, time);
  g.textAlign = 'right';
  g.fillStyle = PALETTE.gold;
  g.font = 'bold 20px Georgia, serif';
  g.fillText(`$${run.cash.toLocaleString('en-US')}`, 1160, 31);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'bold 14px "Trebuchet MS", sans-serif';
  const m = Math.floor(run.time / 60);
  const s = Math.floor(run.time % 60);
  g.fillText(`${m}:${String(s).padStart(2, '0')}`, 1264, 30);
  g.fillStyle = PALETTE.hudDim;
  g.font = '9px "Trebuchet MS", sans-serif';
  g.fillText('HAUL', 1160, 42);
  g.fillText('TIME', 1264, 42);
}

function drawToolIcon(g, id, x, y) {
  if (id === 'coin') {
    g.fillStyle = PALETTE.gold;
    g.beginPath();
    g.arc(x, y, 7, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = PALETTE.goldDeep;
    g.stroke();
  } else if (id === 'smoke') {
    g.fillStyle = '#6a6474';
    for (const [ox, oy, r] of [[-4, 2, 6], [4, 1, 6], [0, -4, 6]]) {
      g.beginPath();
      g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      g.fill();
    }
  } else if (id === 'emp') {
    g.strokeStyle = '#5fe0ff';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 6, y - 7);
    g.lineTo(x + 1, y - 1);
    g.lineTo(x - 2, y + 1);
    g.lineTo(x + 6, y + 8);
    g.stroke();
    g.lineWidth = 1;
  } else if (id === 'rag') {
    g.fillStyle = '#e8e2d0';
    g.beginPath();
    g.moveTo(x - 7, y - 5);
    g.quadraticCurveTo(x, y - 9, x + 7, y - 4);
    g.lineTo(x + 5, y + 7);
    g.quadraticCurveTo(x - 1, y + 3, x - 6, y + 7);
    g.closePath();
    g.fill();
    g.fillStyle = '#7fb0ff';
    g.fillRect(x - 2, y - 2, 4, 4);
  } else {
    g.strokeStyle = '#d9dbe6';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 7, y + 6);
    g.lineTo(x + 5, y - 6);
    g.moveTo(x - 5, y + 7);
    g.lineTo(x + 7, y - 2);
    g.stroke();
    g.lineWidth = 1;
  }
}

function drawToolBelt(g, run) {
  const y = VIEW.height - 58;
  panel(g, 12, y, 602, 48);
  TOOL_ORDER.forEach((id, i) => {
    const x = 20 + i * 118;
    const spec = TOOLS[id];
    const active = run.selected === id;
    g.fillStyle = active ? 'rgba(255,207,74,0.22)' : 'rgba(255,255,255,0.04)';
    g.beginPath();
    g.roundRect(x, y + 6, 112, 36, 6);
    g.fill();
    if (active) {
      g.strokeStyle = PALETTE.gold;
      g.stroke();
    }
    drawToolIcon(g, id, x + 16, y + 24);
    g.textAlign = 'left';
    g.fillStyle = run.kit[id] > 0 ? PALETTE.hudInk : PALETTE.hudDim;
    g.font = 'bold 10px "Trebuchet MS", sans-serif';
    g.fillText(spec.name, x + 30, y + 20);
    g.font = '9px "Trebuchet MS", sans-serif';
    g.fillStyle = PALETTE.hudDim;
    g.fillText(`[${spec.key}] x${run.kit[id]}  ${spec.info}`.slice(0, 26), x + 30, y + 34);
  });
}

/** The stealth gauge: how lit the thief stands (an eye that opens with the light) and how loud she moves. */
function drawStealthGauge(g, run) {
  const x = 628;
  const y = VIEW.height - 58;
  panel(g, x, y, 340, 48);
  const light = run.thiefLight ?? 0;
  const seen = run.guards.some((guard) => guard.sees) || run.cameras.some((c) => c.sees);
  const open = 2 + light * 9;
  const eyeX = x + 26;
  const eyeY = y + 24;
  g.strokeStyle = seen ? PALETTE.danger : light < 0.22 ? PALETTE.scarf : PALETTE.gold;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(eyeX - 15, eyeY);
  g.quadraticCurveTo(eyeX, eyeY - open * 1.6, eyeX + 15, eyeY);
  g.quadraticCurveTo(eyeX, eyeY + open * 1.6, eyeX - 15, eyeY);
  g.stroke();
  g.fillStyle = g.strokeStyle;
  g.beginPath();
  g.arc(eyeX, eyeY, Math.min(open, 5), 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 1;
  g.textAlign = 'left';
  g.font = 'bold 11px "Trebuchet MS", sans-serif';
  g.fillStyle = PALETTE.hudInk;
  g.fillText(seen ? 'SEEN' : light < 0.22 ? 'IN SHADOW' : light < 0.6 ? 'DIM LIGHT' : 'IN LIGHT', x + 52, y + 19);
  g.fillStyle = '#1c1f33';
  g.fillRect(x + 52, y + 27, 120, 8);
  const grad = g.createLinearGradient(x + 52, 0, x + 172, 0);
  grad.addColorStop(0, PALETTE.scarf);
  grad.addColorStop(1, PALETTE.gold);
  g.fillStyle = grad;
  g.fillRect(x + 52, y + 27, 120 * light, 8);
  const { thief } = run;
  const gait = thief.inVent ? 'CRAWLING' : !thief.moving ? 'STILL' : thief.sneaking ? 'CREEPING' : 'WALKING';
  const loud = gait === 'WALKING';
  g.fillStyle = loud ? '#ff9a7a' : PALETTE.hudInk;
  g.fillText(gait, x + 196, y + 19);
  for (let i = 0; i < 5; i += 1) {
    const h = 4 + i * 3;
    const on = loud ? i < 4 : gait === 'STILL' ? false : i < 1;
    g.fillStyle = on ? (loud ? '#ff9a7a' : PALETTE.scarf) : '#2a2e48';
    g.fillRect(x + 196 + i * 9, y + 40 - h, 6, h);
  }
  g.fillStyle = PALETTE.hudDim;
  g.font = '9px "Trebuchet MS", sans-serif';
  g.fillText('VISIBILITY', x + 128, y + 19);
  g.fillText('NOISE', x + 250, y + 40);
}

function drawLegend(g) {
  const x = VIEW.width - 300;
  const y = VIEW.height - 58;
  panel(g, x, y, 288, 48);
  const items = [
    ['rgba(47,224,192,0.8)', 'SAFE SHADOW'],
    ['rgba(255,196,80,0.9)', 'GUARD SIGHT'],
    ['rgba(255,90,200,0.9)', 'CAMERA'],
    ['#ff3a4a', 'LASER'],
    [PALETTE.gold, 'LOOT'],
  ];
  g.font = 'bold 9px "Trebuchet MS", sans-serif';
  g.textAlign = 'left';
  items.forEach(([color, label], i) => {
    const ix = x + 10 + (i % 3) * 94;
    const iy = y + 18 + Math.floor(i / 3) * 18;
    g.fillStyle = color;
    g.fillRect(ix, iy - 7, 14, 9);
    g.fillStyle = PALETTE.hudInk;
    g.fillText(label, ix + 20, iy + 1);
  });
}

function drawPrompt(g, run) {
  const action = run.prompt;
  if (!action) return;
  const { thief } = run;
  const x = thief.x;
  const y = thief.y + VIEW.top - 34;
  g.font = 'bold 11px "Trebuchet MS", sans-serif';
  const w = g.measureText(action.label).width + 40;
  panel(g, x - w / 2, y - 26, w, 22, 6);
  g.fillStyle = action.loud ? '#ff9a7a' : PALETTE.hudInk;
  g.textAlign = 'left';
  g.fillText(`[E] ${action.label}`, x - w / 2 + 10, y - 11);
  if (thief.busy) {
    g.strokeStyle = PALETTE.gold;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x, thief.y + VIEW.top, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, thief.busy.progress));
    g.stroke();
    g.lineWidth = 1;
  }
}

function drawToasts(g, run) {
  run.toasts.forEach((t, i) => {
    const a = Math.min(1, t.life);
    g.globalAlpha = a;
    g.font = 'bold 14px "Trebuchet MS", sans-serif';
    const w = g.measureText(t.text).width + 30;
    const x = VIEW.width / 2 - w / 2;
    const y = VIEW.top + 12 + i * 30;
    panel(g, x, y, w, 24, 6);
    g.fillStyle = t.tone === 'danger' ? '#ff6a6a' : PALETTE.gold;
    g.textAlign = 'center';
    g.fillText(t.text, VIEW.width / 2, y + 17);
    g.globalAlpha = 1;
  });
}

function drawLockdown(g, run, time) {
  if (!run.alarm.lockdown) return;
  const a = 0.25 + Math.sin(time * 6) * 0.12;
  const grad = g.createRadialGradient(VIEW.width / 2, VIEW.height / 2, 200, VIEW.width / 2, VIEW.height / 2, 760);
  grad.addColorStop(0, 'rgba(255,0,30,0)');
  grad.addColorStop(1, `rgba(255,20,40,${a})`);
  g.fillStyle = grad;
  g.fillRect(0, VIEW.top, VIEW.width, VIEW.height - VIEW.top);
  panel(g, VIEW.width / 2 - 170, VIEW.height - 64, 340, 50);
  g.fillStyle = '#ff5a5a';
  g.font = 'bold 20px Georgia, serif';
  g.textAlign = 'center';
  g.fillText(`LOCKDOWN — POLICE IN ${run.alarm.countdown.toFixed(1)}s`, VIEW.width / 2, VIEW.height - 33);
}

/** The freeze-frame banner when the night ends: who caught the thief, or the getaway. */
function drawFinale(g, run) {
  if (run.phase === 'heist') return;
  const caught = run.phase !== 'escaped';
  const k = Math.min(1, (run.freeze ?? 0) * 3);
  g.fillStyle = caught ? `rgba(120,0,20,${0.35 * k})` : `rgba(0,60,50,${0.3 * k})`;
  g.fillRect(0, VIEW.top, VIEW.width, VIEW.height - VIEW.top);
  g.fillStyle = `rgba(8,10,22,${0.9 * k})`;
  g.fillRect(0, 300, VIEW.width, 110);
  g.textAlign = 'center';
  g.fillStyle = caught ? '#ff5a5a' : PALETTE.gold;
  g.font = 'bold 54px Georgia, serif';
  g.fillText(caught ? 'CAUGHT' : run.thief.carrying ? 'CLEAN GETAWAY' : 'WALKED AWAY', VIEW.width / 2, 362);
  g.fillStyle = PALETTE.hudInk;
  g.font = 'bold 16px "Trebuchet MS", sans-serif';
  g.fillText(caught ? run.endReason.toUpperCase() : `THE VAN PULLS AWAY WITH $${run.cash.toLocaleString('en-US')}`, VIEW.width / 2, 394);
}

/** Every HUD layer, drawn in screen space over the world. */
export function drawHud(g, run, time) {
  drawTopBar(g, run, time);
  drawToolBelt(g, run);
  drawStealthGauge(g, run);
  drawLegend(g);
  drawPrompt(g, run);
  drawToasts(g, run);
  drawLockdown(g, run, time);
  drawFinale(g, run);
}
