// Security cameras: each sweeps back and forth across its arc, locks onto the thief while it sees
// them in light, feeds the alarm meter and calls the nearest guard over. A Tick Jammer or the
// office panel blinds them for a while.
import { ALARM, CAMERA } from './config.js';
import { angleDiff, hasLineOfSight, lightLevel, turnToward, visionFan } from './geometry.js';
import { raiseAlarm } from './alarm.js';
import { MODE, sendToInvestigate } from './guards.js';

export function createCameras(museum) {
  return museum.cameras.map((spec) => ({
    ...spec,
    angle: (spec.from + spec.to) / 2,
    phase: spec.id * 1.7,
    sees: false,
    seenFor: 0,
    offline: false,
    fan: [],
    called: 0,
  }));
}

function cameraSees(camera, run) {
  const { thief, museum, smokes, power } = run;
  if (thief.inVent) return 0;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.range) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), camera.angle)) > CAMERA.fov / 2) return 0;
  if (!hasLineOfSight(museum, camera.x, camera.y, thief.x, thief.y, smokes)) return 0;
  const light = lightLevel(museum, thief.x, thief.y, power);
  return light < 0.22 ? 0 : light;
}

function nearestCalmGuard(run, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const guard of run.guards) {
    if (guard.mode === MODE.ALERT) continue;
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  return best;
}

/** One step of every camera: sweep or track, alarm feed and the guard call-out. */
export function updateCameras(run, dt) {
  for (const camera of run.cameras) {
    camera.offline = run.power.camerasLooped > 0 || run.power.jammed(camera.x, camera.y);
    camera.called = Math.max(0, camera.called - dt);
    if (camera.offline) {
      camera.sees = false;
      camera.seenFor = 0;
      camera.fan = [];
      continue;
    }
    const sight = cameraSees(camera, run);
    camera.sees = sight > 0;
    if (camera.sees) {
      camera.seenFor += dt;
      const toThief = Math.atan2(run.thief.y - camera.y, run.thief.x - camera.x);
      camera.angle = turnToward(camera.angle, toThief, dt * 1.4);
      if (camera.seenFor > 0.35) raiseAlarm(run.alarm, CAMERA.alarmRate * sight * dt);
      if (camera.seenFor > 0.8 && camera.called === 0) {
        const guard = nearestCalmGuard(run, run.thief.x, run.thief.y);
        if (guard) sendToInvestigate(guard, run.museum, run.thief.x, run.thief.y);
        camera.called = 4;
        run.events.push({ kind: 'camera', id: camera.id });
      }
    } else {
      camera.seenFor = Math.max(0, camera.seenFor - dt);
      camera.phase += dt * CAMERA.sweepSpeed;
      const t = (Math.sin(camera.phase) + 1) / 2;
      const target = camera.from + (camera.to - camera.from) * t;
      camera.angle = turnToward(camera.angle, target, dt * 1.2);
    }
    camera.fan = visionFan(run.museum, camera.x, camera.y, camera.angle, CAMERA.fov, CAMERA.range, CAMERA.rays, run.smokes);
  }
  if (run.alarm.level >= ALARM.max) run.alarm.lockdown = true;
}
