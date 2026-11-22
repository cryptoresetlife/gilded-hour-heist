// The museum's alarm meter: cameras and alerted guards push it up, it bleeds off slowly while the
// thief stays hidden, it never falls back below a tier it has reached, and at 100 the building
// locks down and a countdown to the police starts.
import { ALARM } from './config.js';

export function createAlarm() {
  return { level: 0, floor: 0, peak: 0, lockdown: false, countdown: ALARM.lockdownSeconds, pulse: 0 };
}

/** Index into ALARM.tiers for the current level. */
export function alarmTier(alarm) {
  let tier = 0;
  for (let i = 0; i < ALARM.tiers.length; i += 1) if (alarm.level >= ALARM.tiers[i].at) tier = i;
  return tier;
}

/** Push the alarm up by `amount`; crossing a tier raises the floor it can decay to. */
export function raiseAlarm(alarm, amount) {
  if (alarm.lockdown) return;
  const before = alarmTier(alarm);
  alarm.level = Math.min(ALARM.max, alarm.level + amount);
  alarm.peak = Math.max(alarm.peak, alarm.level);
  const after = alarmTier(alarm);
  if (after > before) {
    alarm.floor = ALARM.tiers[after].at;
    alarm.pulse = 1;
  }
  if (alarm.level >= ALARM.max) alarm.lockdown = true;
}

/** Per-step decay toward the floor, the lockdown countdown and the HUD pulse. */
export function updateAlarm(alarm, dt, hidden) {
  alarm.pulse = Math.max(0, alarm.pulse - dt * 1.5);
  if (alarm.lockdown) {
    alarm.countdown = Math.max(0, alarm.countdown - dt);
    return;
  }
  if (hidden) alarm.level = Math.max(alarm.floor, alarm.level - ALARM.decay * dt);
}

/** Guard speed multiplier and extra wariness at the current tier. */
export function alarmPressure(alarm) {
  return [1, 1.15, 1.3, 1.45][alarmTier(alarm)];
}
