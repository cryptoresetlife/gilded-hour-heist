// Keyboard and mouse: held keys for movement, one-shot presses for tool picks, menu keys and
// throws, and the cursor mapped from the scaled canvas back into museum pixels.
import { VIEW } from './config.js';

const TOOL_KEYS = { Digit1: 'coin', Digit2: 'smoke', Digit3: 'emp', Digit4: 'pick', Digit5: 'rag' };

export function createInput(canvas) {
  const held = new Set();
  const state = { pressed: [], clicks: [], mouse: { x: 0, y: 0, screenX: 0, screenY: 0 }, unlocked: false };

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    const code = e.code || e.key;
    if (!e.repeat) state.pressed.push(code === 'Return' ? 'Enter' : code);
    held.add(code);
    state.unlocked = true;
  });
  window.addEventListener('keyup', (e) => held.delete(e.code || e.key));
  window.addEventListener('blur', () => held.clear());

  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW.width;
    const sy = ((e.clientY - rect.top) / rect.height) * VIEW.height;
    state.mouse = { screenX: sx, screenY: sy, x: sx, y: sy - VIEW.top };
  }
  canvas.addEventListener('mousemove', toCanvas);
  canvas.addEventListener('mousedown', (e) => {
    toCanvas(e);
    state.clicks.push({ ...state.mouse, button: e.button });
    state.unlocked = true;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  /** Snapshot for one fixed step; one-shot presses and clicks are consumed. */
  state.read = () => {
    const pressed = state.pressed.splice(0);
    const clicks = state.clicks.splice(0);
    let selectTool = null;
    for (const code of pressed) if (TOOL_KEYS[code]) selectTool = TOOL_KEYS[code];
    const throwClick = clicks.find((c) => c.button === 0 && c.screenY > VIEW.top);
    return {
      left: held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0,
      right: held.has('KeyD') || held.has('ArrowRight') ? 1 : 0,
      up: held.has('KeyW') || held.has('ArrowUp') ? 1 : 0,
      down: held.has('KeyS') || held.has('ArrowDown') ? 1 : 0,
      sneak: held.has('ShiftLeft') || held.has('ShiftRight'),
      interact: held.has('KeyE') || held.has('Space'),
      selectTool,
      throwAt: throwClick ? { x: throwClick.x, y: throwClick.y } : null,
      pressed,
      clicks,
      mouse: state.mouse,
    };
  };
  return state;
}
