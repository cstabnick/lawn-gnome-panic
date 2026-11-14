// src/ui/touch.ts: on-screen controls for phones and tablets.
// Writes into the same InputState the keyboard and mouse use, so the player code needs no changes.
import type { Input } from '../config';

export interface TouchControls {
  /** True if the device has a coarse pointer or a touch has been seen. */
  readonly active: boolean;
  /** Show the controls only while the match is running. */
  setVisible(visible: boolean): void;
  /** Call once per frame before the player update: writes the joystick into input.state. */
  update(): void;
}

const JOY_BASE_PX = 120;
const JOY_KNOB_PX = 56;
const JOY_RADIUS = 60;     // knob travel from the base centre, px
const JOY_DEADZONE = 0.12;
const LOOK_GAIN = 1.4;

const CSS = `
.gft-root { position: fixed; inset: 0; display: none; pointer-events: none; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.gft-root.gft-on { display: block; pointer-events: auto; }
.gft-base, .gft-knob { position: absolute; display: none; box-sizing: border-box; transform: translate(-50%, -50%); }
.gft-base { width: ${JOY_BASE_PX}px; height: ${JOY_BASE_PX}px; border-radius: 50%; background: rgba(255,255,255,.15); border: 2px solid #fff; }
.gft-knob { width: ${JOY_KNOB_PX}px; height: ${JOY_KNOB_PX}px; border-radius: 50%; background: rgba(255,255,255,.6); }
.gft-base.gft-show, .gft-knob.gft-show { display: block; }
.gft-btn { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 60px; height: 60px; border-radius: 50%; background: rgba(20,20,20,.45); border: 2px solid rgba(255,255,255,.7); color: #fff; font: 700 11px system-ui, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,.6); touch-action: none; user-select: none; -webkit-user-select: none; transition: transform .05s, filter .05s; }
.gft-btn.gft-pressed { transform: scale(.92); filter: brightness(1.35); }
.gft-fire { width: 84px; height: 84px; bottom: 130px; right: 30px; background: rgba(214,42,42,.75); font-size: 13px; }
.gft-jump { bottom: 120px; right: 130px; }
.gft-reload { bottom: 230px; right: 30px; }
.gft-gren { bottom: 230px; right: 130px; }
.gft-ride { bottom: 330px; right: 30px; }
.gft-scores { top: 12px; left: 12px; width: auto; height: 30px; padding: 0 14px; border-radius: 15px; font-size: 12px; }
`;

function injectStyle(): void {
  if (document.getElementById('gft-style')) return;
  const style = document.createElement('style');
  style.id = 'gft-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

function makeEl(cls: string, text = ''): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = text;
  return d;
}

interface Button {
  el: HTMLDivElement;
  pid: number | null;
  onDown(pid: number, x: number, y: number): void;
  onUp(): void;
}

export function createTouchControls(root: HTMLElement, input: Input): TouchControls {
  injectStyle();

  const container = makeEl('gft-root');
  const base = makeEl('gft-base');
  const knob = makeEl('gft-knob');
  container.append(base, knob);

  let active = window.matchMedia('(pointer: coarse)').matches;
  let visible = false;

  // Joystick: one pointer at a time, floating base at the touch-down point.
  let joyPid: number | null = null;
  let joyX = 0;
  let joyY = 0;
  let joyOffX = 0; // clamped knob offset from base centre, px
  let joyOffY = 0;
  let joyNx = 0;   // normalised -1..1, x right +
  let joyNy = 0;   // normalised -1..1, y down +

  // Look drag: every pointer that started on the right half or on FIRE, with its last position.
  const lookPtrs = new Map<number, { x: number; y: number }>();

  const buttons: Button[] = [];

  function addButton(
    cls: string,
    label: string,
    onDown: (pid: number, x: number, y: number) => void,
    onUp: () => void,
  ): void {
    const d = makeEl(`gft-btn ${cls}`, label);
    const btn: Button = { el: d, pid: null, onDown, onUp };
    d.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation(); // do not start a look drag or a joystick
      if (btn.pid !== null) return;
      btn.pid = e.pointerId;
      try {
        d.setPointerCapture(e.pointerId);
      } catch {
        // synthetic events cannot be captured; window listeners still see the release
      }
      d.classList.add('gft-pressed');
      btn.onDown(e.pointerId, e.clientX, e.clientY);
      render();
    });
    container.appendChild(d);
    buttons.push(btn);
  }

  addButton('gft-fire', 'FIRE',
    (pid, x, y) => {
      input.state.fire = true;
      lookPtrs.set(pid, { x, y }); // a finger on FIRE can also drag to aim
    },
    () => { input.state.fire = false; },
  );
  addButton('gft-jump', 'JUMP',
    () => { input.state.jumpPressed = true; },
    () => {},
  );
  addButton('gft-reload', 'RELOAD',
    () => { input.state.reloadPressed = true; },
    () => {},
  );
  addButton('gft-gren', 'GREN',
    () => { input.state.grenadePressed = true; },
    () => {},
  );
  addButton('gft-ride', 'RIDE',
    () => { input.state.usePressed = true; },
    () => {},
  );
  addButton('gft-scores', 'SCORES',
    () => { input.state.scoreboard = true; },
    () => { input.state.scoreboard = false; },
  );

  function placeJoy(): void {
    base.style.left = `${joyX}px`;
    base.style.top = `${joyY}px`;
    knob.style.left = `${joyX + joyOffX}px`;
    knob.style.top = `${joyY + joyOffY}px`;
  }

  function render(): void {
    const on = visible && active;
    container.classList.toggle('gft-on', on);
    const joyShown = on && joyPid !== null;
    base.classList.toggle('gft-show', joyShown);
    knob.classList.toggle('gft-show', joyShown);
  }

  /** Clears the joystick's five movement fields once, on release. */
  function clearMove(): void {
    const s = input.state;
    s.forward = false;
    s.back = false;
    s.left = false;
    s.right = false;
    s.sprint = false;
    joyNx = 0;
    joyNy = 0;
  }

  /** Ends whatever a pointer was doing. */
  function releasePointer(pid: number): void {
    if (pid === joyPid) {
      joyPid = null;
      clearMove();
    }
    lookPtrs.delete(pid);
    for (const b of buttons) {
      if (b.pid === pid) {
        b.pid = null;
        b.el.classList.remove('gft-pressed');
        b.onUp();
      }
    }
    render();
  }

  function onRootDown(e: PointerEvent): void {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    if (x < window.innerWidth * 0.5) {
      if (joyPid !== null) return; // joystick already owned by another finger
      joyPid = e.pointerId;
      joyX = x;
      joyY = y;
      joyOffX = 0;
      joyOffY = 0;
      joyNx = 0;
      joyNy = 0;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // ignore: window listeners still track the pointer
      }
      placeJoy();
    } else {
      lookPtrs.set(e.pointerId, { x, y });
    }
    render();
  }

  function onWindowMove(e: PointerEvent): void {
    if (e.pointerId === joyPid) {
      let ox = e.clientX - joyX;
      let oy = e.clientY - joyY;
      const len = Math.hypot(ox, oy);
      if (len > JOY_RADIUS) {
        ox *= JOY_RADIUS / len;
        oy *= JOY_RADIUS / len;
      }
      joyOffX = ox;
      joyOffY = oy;
      let nx = ox / JOY_RADIUS;
      let ny = oy / JOY_RADIUS;
      const mag = Math.hypot(nx, ny);
      if (mag < JOY_DEADZONE) {
        nx = 0;
        ny = 0;
      } else if (mag > 1) {
        nx /= mag;
        ny /= mag;
      }
      joyNx = nx;
      joyNy = ny;
      placeJoy();
    }
    const look = lookPtrs.get(e.pointerId);
    if (look) {
      input.state.mouseDx += (e.clientX - look.x) * LOOK_GAIN;
      input.state.mouseDy += (e.clientY - look.y) * LOOK_GAIN;
      look.x = e.clientX;
      look.y = e.clientY;
    }
  }

  function onWindowUp(e: PointerEvent): void {
    releasePointer(e.pointerId);
  }

  function onFirstTouch(): void {
    if (active) return;
    active = true;
    render();
  }

  container.addEventListener('pointerdown', onRootDown);
  window.addEventListener('touchstart', onFirstTouch, { passive: true });
  window.addEventListener('pointermove', onWindowMove);
  window.addEventListener('pointerup', onWindowUp);
  window.addEventListener('pointercancel', onWindowUp);

  root.appendChild(container);
  render();

  return {
    get active(): boolean {
      return active;
    },
    setVisible(v: boolean): void {
      visible = v;
      if (!v) {
        // Release everything: held fields false, one-frame flags cleared, deltas dropped.
        const s = input.state;
        joyPid = null;
        clearMove();
        lookPtrs.clear();
        for (const b of buttons) {
          b.pid = null;
          b.el.classList.remove('gft-pressed');
          b.onUp();
        }
        s.fire = false;
        s.scoreboard = false;
        s.jumpPressed = false;
        s.reloadPressed = false;
        s.usePressed = false;
        s.grenadePressed = false;
        s.mouseDx = 0;
        s.mouseDy = 0;
      }
      render();
    },
    update(): void {
      if (joyPid === null) return; // idle: leave the keyboard state alone
      const s = input.state;
      s.forward = joyNy < -0.35;
      s.back = joyNy > 0.35;
      s.left = joyNx < -0.35;
      s.right = joyNx > 0.35;
      s.sprint = joyNy < -0.9;
    },
  };
}
