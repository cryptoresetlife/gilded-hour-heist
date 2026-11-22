// Tunable numbers and the colour palette for Gilded Hour. Every other module reads from here,
// so balancing the heist (speeds, cone sizes, alarm rates, tool prices) happens in one place.

export const TILE = 32;
export const COLS = 40;
export const ROWS = 21;
export const VIEW = { width: 1280, height: 720, top: 48 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 9,
  walkSpeed: 118,
  sneakSpeed: 58,
  crawlSpeed: 40,
  walkNoise: 88,
  interactRange: 30,
};

export const GUARD = {
  radius: 10,
  patrolSpeed: 52,
  warySpeed: 70,
  chaseSpeed: 112,
  fov: (72 * Math.PI) / 180,
  range: 210,
  darkRange: 105,
  suspicionRise: 1.25,
  suspicionFall: 0.35,
  catchRange: 16,
  turnRate: 3.2,
  rays: 44,
};

export const CAMERA = {
  fov: (48 * Math.PI) / 180,
  range: 250,
  sweepSpeed: 0.55,
  alarmRate: 34,
  rays: 32,
};

export const ALARM = {
  max: 100,
  decay: 2.2,
  tiers: [
    { at: 0, name: 'QUIET' },
    { at: 34, name: 'WARY' },
    { at: 67, name: 'HUNT' },
    { at: 100, name: 'LOCKDOWN' },
  ],
  guardAlertBump: 22,
  noiseBump: 6,
  lockdownSeconds: 35,
};

export const TOOLS = {
  coin: { key: '1', name: 'Brass Coin', cost: 0, start: 3, range: 220, noise: 150, info: 'lure a guard' },
  smoke: { key: '2', name: 'Soot Bomb', cost: 300, start: 0, range: 200, radius: 58, seconds: 7, info: 'blinds cones' },
  emp: { key: '3', name: 'Tick Jammer', cost: 400, start: 0, range: 240, radius: 150, seconds: 8, info: 'kills cameras + lamps' },
  pick: { key: '4', name: 'Silent Picks', cost: 250, start: 0, info: 'fast quiet locks' },
};

export const PLAN_BUDGET = 1200;

export const TIMES = {
  pickLock: 4.2,
  pickLockFast: 1.6,
  crackVault: 9,
  grabLoot: 0.6,
  liftOrrery: 2.2,
  useKeycard: 0.8,
  cutPower: 1.4,
};

export const PALETTE = {
  void: '#0b0f1e',
  blueprint: '#13203f',
  blueprintLine: 'rgba(110,160,255,0.10)',
  wallTop: '#3a4262',
  wallFace: '#262c47',
  wallEdge: '#6f7aa8',
  carpet: '#5a2236',
  carpetTrim: '#8a3b4f',
  marble: '#c9c2b2',
  marbleVein: 'rgba(120,110,100,0.25)',
  concrete: '#545a66',
  steel: '#4c5a6e',
  tileFloor: '#6b6f5e',
  glass: 'rgba(160,230,255,0.35)',
  gold: '#ffcf4a',
  goldDeep: '#c98a12',
  thief: '#1a1c24',
  scarf: '#2fe0c0',
  guard: '#2b3f7a',
  guardCone: 'rgba(255,196,80,0.22)',
  guardConeHot: 'rgba(255,70,60,0.34)',
  cameraCone: 'rgba(255,90,200,0.20)',
  cameraConeHot: 'rgba(255,40,80,0.38)',
  safe: 'rgba(47,224,192,0.55)',
  danger: '#ff4a4a',
  hudInk: '#f4ead2',
  hudDim: '#8c93b8',
  hudPanel: 'rgba(10,12,26,0.86)',
  ambient: 'rgb(34,38,70)',
};
