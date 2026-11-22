// Night guards: they walk a fixed beat, see through a cone that walls, pillars and soot block,
// grow suspicious before they act (the "?" ring fills first, so a caught moment is always fair),
// walk over to noises, chase on "!" and give up after losing the thief for a while.
import { ALARM, GUARD } from './config.js';
import { angleDiff, hasLineOfSight, lightLevel, moveBody, turnToward, visionFan } from './geometry.js';
import { findPath } from './pathfind.js';
import { raiseAlarm, alarmPressure } from './alarm.js';

export const MODE = { PATROL: 'patrol', INVESTIGATE: 'investigate', ALERT: 'alert', RETURN: 'return' };

export function createGuards(museum) {
  return museum.guards.map((spec) => ({
    id: spec.id,
    name: spec.name,
    route: spec.route,
    x: spec.route[0].x,
    y: spec.route[0].y,
    radius: GUARD.radius,
    facing: Math.atan2(spec.route[1].y - spec.route[0].y, spec.route[1].x - spec.route[0].x),
    waypoint: 1,
    mode: MODE.PATROL,
    suspicion: 0,
    path: [],
    lookTimer: 0,
    lostTimer: 0,
    sees: false,
    fan: [],
    stride: 0,
  }));
}

/** How strongly a guard sees the thief this step, 0 when not at all. */
export function guardSight(guard, thief, museum, smokes, power) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.range) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.facing)) > GUARD.fov / 2) return 0;
  if (thief.inVent && dist > 36) return 0;
  if (!hasLineOfSight(museum, guard.x, guard.y, thief.x, thief.y, smokes)) return 0;
  const light = Math.max(lightLevel(museum, thief.x, thief.y, power), flashlightOn(guard, dist));
  const reach = GUARD.darkRange + (GUARD.range - GUARD.darkRange) * light;
  const sneakFactor = thief.sneaking ? 0.8 : 1;
  if (dist > reach * sneakFactor) return 0;
  return (1.4 - dist / GUARD.range) * (0.45 + light * 0.55);
}

function flashlightOn(guard, dist) {
  return dist < 70 ? 0.7 : 0;
}

function walkTo(guard, museum, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  moveBody(museum, guard, (dx / dist) * step, (dy / dist) * step, false);
  guard.facing = turnToward(guard.facing, Math.atan2(dy, dx), GUARD.turnRate * dt);
  guard.stride += step;
  return dist - step < 2;
}

function followPath(guard, museum, speed, dt) {
  if (!guard.path.length) return true;
  const next = guard.path[0];
  if (walkTo(guard, museum, next.x, next.y, speed, dt)) guard.path.shift();
  return guard.path.length === 0;
}

/** Send a guard to look at a point (a thrown coin, a noise, a camera sighting). */
export function sendToInvestigate(guard, museum, x, y) {
  if (guard.mode === MODE.ALERT) return;
  guard.mode = MODE.INVESTIGATE;
  guard.path = findPath(museum, guard.x, guard.y, x, y);
  guard.lookTimer = 2.6;
  guard.suspicion = Math.max(guard.suspicion, 0.3);
}

function patrol(guard, museum, speed, dt) {
  const target = guard.route[guard.waypoint];
  if (walkTo(guard, museum, target.x, target.y, speed, dt)) guard.waypoint = (guard.waypoint + 1) % guard.route.length;
}

function startReturn(guard, museum) {
  guard.mode = MODE.RETURN;
  const target = guard.route[guard.waypoint];
  guard.path = findPath(museum, guard.x, guard.y, target.x, target.y);
}

function lookAround(guard, dt) {
  guard.lookTimer -= dt;
  guard.facing += Math.sin(guard.lookTimer * 2.4) * dt * 2.2;
  return guard.lookTimer <= 0;
}

/** One step of every guard: sight, suspicion, mode changes, movement and catching. */
export function updateGuards(run, dt) {
  const { museum, thief, alarm, smokes, power } = run;
  const pressure = alarmPressure(alarm);
  for (const guard of run.guards) {
    const sight = guardSight(guard, thief, museum, smokes, power);
    guard.sees = sight > 0;
    if (guard.sees) {
      guard.suspicion = Math.min(1, guard.suspicion + GUARD.suspicionRise * sight * pressure * dt);
      guard.lastSeen = { x: thief.x, y: thief.y };
      if (guard.suspicion >= 1 && guard.mode !== MODE.ALERT) {
        guard.mode = MODE.ALERT;
        raiseAlarm(alarm, ALARM.guardAlertBump);
        run.events.push({ kind: 'spotted', guard: guard.name });
      } else if (guard.mode === MODE.PATROL || guard.mode === MODE.RETURN) {
        if (guard.suspicion > 0.4) sendToInvestigate(guard, museum, thief.x, thief.y);
        else guard.facing = turnToward(guard.facing, Math.atan2(thief.y - guard.y, thief.x - guard.x), dt * 1.2);
      }
    } else if (guard.mode !== MODE.ALERT) {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionFall * dt);
    }

    if (alarm.lockdown && guard.mode !== MODE.ALERT) {
      guard.mode = MODE.ALERT;
      guard.lastSeen = { x: thief.x, y: thief.y };
    }

    if (guard.mode === MODE.ALERT) updateChase(guard, run, dt, pressure);
    else if (guard.mode === MODE.INVESTIGATE) {
      if (followPath(guard, museum, GUARD.warySpeed * pressure, dt) && lookAround(guard, dt)) startReturn(guard, museum);
    } else if (guard.mode === MODE.RETURN) {
      if (followPath(guard, museum, GUARD.patrolSpeed * pressure, dt)) guard.mode = MODE.PATROL;
    } else patrol(guard, museum, GUARD.patrolSpeed * pressure, dt);

    guard.fan = visionFan(museum, guard.x, guard.y, guard.facing, GUARD.fov, GUARD.range, GUARD.rays, smokes);
    if (guard.mode === MODE.ALERT && Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchRange + thief.radius) {
      run.events.push({ kind: 'caught', guard: guard.name });
    }
  }
}

function updateChase(guard, run, dt, pressure) {
  const { museum, thief } = run;
  if (guard.sees) {
    guard.lostTimer = 0;
    guard.repath = (guard.repath ?? 0) - dt;
    if (guard.repath <= 0) {
      guard.path = findPath(museum, guard.x, guard.y, thief.x, thief.y);
      guard.repath = 0.35;
    }
  } else {
    guard.lostTimer += dt;
    guard.radio = (guard.radio ?? 0) - dt;
    if (run.alarm.lockdown && guard.radio <= 0) {
      // In lockdown the control room radios the thief's position to every guard every few seconds.
      guard.radio = 3;
      guard.lastSeen = { x: thief.x, y: thief.y };
      guard.path = findPath(museum, guard.x, guard.y, thief.x, thief.y);
    }
    if (!guard.path.length && guard.lastSeen) guard.path = findPath(museum, guard.x, guard.y, guard.lastSeen.x, guard.lastSeen.y);
  }
  const arrived = followPath(guard, museum, GUARD.chaseSpeed * Math.min(pressure, 1.2), dt);
  if (arrived) lookAround(guard, dt);
  if (!run.alarm.lockdown && guard.lostTimer > 6) {
    guard.suspicion = 0.55;
    guard.lostTimer = 0;
    startReturn(guard, museum);
  }
}

/** A noise reaches every guard in its radius who is not already chasing. */
export function hearNoise(run, x, y, radius) {
  for (const guard of run.guards) {
    if (guard.mode === MODE.ALERT) continue;
    if (Math.hypot(guard.x - x, guard.y - y) <= radius) sendToInvestigate(guard, run.museum, x, y);
  }
}
