// On-screen controls for phones and touch screens. A move stick on the left, a look pad on the right, and buttons for
// every key: Sprint and Crouch are held, Lantern, Interact and Pause are taps. Everything sits on its own layer inside
// the shared #ui element, and the layer never intercepts a touch it does not own.

export interface TouchSample {
  forward: number; // -1..1
  right: number; // -1..1
  yawDelta: number;
  pitchDelta: number;
  sprint: boolean;
  crouch: boolean;
  interact: boolean;
  lantern: boolean;
}

export interface TouchControls {
  /** Takes what the touch controls did since the last call (look deltas and taps are used up). */
  read(): TouchSample;
  /** True once if the Pause button was tapped. */
  consumePause(): boolean;
  /** Whether the on-screen controls are showing at all. */
  readonly active: boolean;
  /** Show the controls while a run is being played; hide them behind the menus so they never block a button. */
  setPlaying(on: boolean): void;
  dispose(): void;
}

const EMPTY: TouchSample = {
  forward: 0,
  right: 0,
  yawDelta: 0,
  pitchDelta: 0,
  sprint: false,
  crouch: false,
  interact: false,
  lantern: false,
};

const STYLE = `
.pg-touch { position: absolute; inset: 0; pointer-events: none; touch-action: none; user-select: none; -webkit-user-select: none; font-family: 'Segoe UI', system-ui, sans-serif; }
.pg-look { position: absolute; top: 110px; right: 0; bottom: 0; width: 55%; pointer-events: auto; touch-action: none; }
.pg-stick { position: absolute; left: 16px; bottom: 92px; width: 136px; height: 136px; border-radius: 50%; background: rgba(12, 15, 24, 0.42); border: 2px solid rgba(160, 180, 210, 0.35); pointer-events: auto; touch-action: none; }
.pg-stick-knob { position: absolute; left: 50%; top: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(158, 197, 255, 0.55); border: 1px solid rgba(220, 235, 255, 0.6); pointer-events: none; }
.pg-actions { position: absolute; right: 16px; bottom: 16px; display: grid; grid-template-columns: 66px 66px; gap: 10px; pointer-events: auto; }
.pg-tbtn { width: 66px; height: 66px; border-radius: 14px; background: rgba(12, 15, 24, 0.78); border: 1px solid rgba(160, 180, 210, 0.38); color: #e8e4dc; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; display: flex; align-items: center; justify-content: center; touch-action: none; -webkit-tap-highlight-color: transparent; }
.pg-tbtn.on { background: rgba(59, 130, 246, 0.6); border-color: rgba(147, 197, 253, 0.8); }
.pg-tbtn.big { width: 66px; height: 66px; background: rgba(30, 58, 110, 0.82); }
.pg-tpause { position: absolute; top: 64px; right: 16px; width: 76px; height: 44px; padding: 0 14px; border-radius: 10px; background: rgba(12, 15, 24, 0.8); border: 1px solid rgba(160, 180, 210, 0.38); color: #e8e4dc; font-size: 13px; pointer-events: auto; touch-action: none; }
`;

export function createTouchControls(ui: HTMLElement, force = false): TouchControls {
  const coarse =
    (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  if (!coarse && !force) {
    return { read: () => ({ ...EMPTY }), consumePause: () => false, active: false, setPlaying: () => {}, dispose: () => {} };
  }

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  const layer = document.createElement('div');
  layer.className = 'pg-touch';
  layer.innerHTML = `
    <div class="pg-look" id="pg-look"></div>
    <div class="pg-stick" id="pg-stick"><div class="pg-stick-knob" id="pg-knob"></div></div>
    <div class="pg-actions">
      <button class="pg-tbtn" id="pg-t-lantern" type="button">F<br/>Lantern</button>
      <button class="pg-tbtn" id="pg-t-crouch" type="button">C<br/>Crouch</button>
      <button class="pg-tbtn" id="pg-t-sprint" type="button">Shift<br/>Sprint</button>
      <button class="pg-tbtn big" id="pg-t-interact" type="button">E<br/>Use</button>
    </div>
    <button class="pg-tpause" id="pg-t-pause" type="button">Pause</button>
  `;
  layer.style.display = 'none';
  ui.appendChild(layer);

  const look = layer.querySelector('#pg-look') as HTMLElement;
  const stick = layer.querySelector('#pg-stick') as HTMLElement;
  const knob = layer.querySelector('#pg-knob') as HTMLElement;
  const lanternBtn = layer.querySelector('#pg-t-lantern') as HTMLButtonElement;
  const crouchBtn = layer.querySelector('#pg-t-crouch') as HTMLButtonElement;
  const sprintBtn = layer.querySelector('#pg-t-sprint') as HTMLButtonElement;
  const interactBtn = layer.querySelector('#pg-t-interact') as HTMLButtonElement;
  const pauseBtn = layer.querySelector('#pg-t-pause') as HTMLButtonElement;

  let forward = 0;
  let right = 0;
  let yawDelta = 0;
  let pitchDelta = 0;
  let sprintHeld = false;
  let crouchHeld = false;
  let interactQueued = false;
  let lanternQueued = false;
  let pauseQueued = false;

  // Move stick
  let stickId: number | null = null;
  const STICK_RADIUS = 48;
  const moveKnob = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy);
    const k = len > STICK_RADIUS ? STICK_RADIUS / len : 1;
    const kx = dx * k;
    const ky = dy * k;
    knob.style.transform = `translate(${kx}px, ${ky}px)`;
    right = kx / STICK_RADIUS;
    forward = -ky / STICK_RADIUS;
  };
  const resetStick = () => {
    stickId = null;
    forward = 0;
    right = 0;
    knob.style.transform = 'translate(0px, 0px)';
  };
  stick.addEventListener('pointerdown', (e) => {
    stickId = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    const r = stick.getBoundingClientRect();
    stick.dataset.cx = String(r.left + r.width / 2);
    stick.dataset.cy = String(r.top + r.height / 2);
    moveKnob(e.clientX - Number(stick.dataset.cx), e.clientY - Number(stick.dataset.cy));
    e.preventDefault();
  });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    moveKnob(e.clientX - Number(stick.dataset.cx), e.clientY - Number(stick.dataset.cy));
  });
  const endStick = (e: PointerEvent) => {
    if (e.pointerId === stickId) resetStick();
  };
  stick.addEventListener('pointerup', endStick);
  stick.addEventListener('pointercancel', endStick);

  // Look pad (the right side of the screen, around the buttons)
  let lookId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  look.addEventListener('pointerdown', (e) => {
    lookId = e.pointerId;
    look.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  });
  look.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    yawDelta -= (e.clientX - lastX) * 0.0038;
    pitchDelta -= (e.clientY - lastY) * 0.0032;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const endLook = (e: PointerEvent) => {
    if (e.pointerId === lookId) lookId = null;
  };
  look.addEventListener('pointerup', endLook);
  look.addEventListener('pointercancel', endLook);

  // Buttons: held ones track press and release; taps are queued until the sim reads them
  const hold = (btn: HTMLButtonElement, set: (v: boolean) => void) => {
    const down = (e: PointerEvent) => {
      e.preventDefault();
      set(true);
      btn.classList.add('on');
      btn.setPointerCapture?.(e.pointerId);
    };
    const up = () => {
      set(false);
      btn.classList.remove('on');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  };
  hold(sprintBtn, (v) => (sprintHeld = v));
  hold(crouchBtn, (v) => (crouchHeld = v));
  const tap = (btn: HTMLButtonElement, fire: () => void) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      fire();
    });
  };
  tap(lanternBtn, () => (lanternQueued = true));
  tap(interactBtn, () => (interactQueued = true));
  tap(pauseBtn, () => (pauseQueued = true));

  return {
    active: true,
    read(): TouchSample {
      const out: TouchSample = {
        forward,
        right,
        yawDelta,
        pitchDelta,
        sprint: sprintHeld,
        crouch: crouchHeld,
        interact: interactQueued,
        lantern: lanternQueued,
      };
      yawDelta = 0;
      pitchDelta = 0;
      interactQueued = false;
      lanternQueued = false;
      return out;
    },
    consumePause(): boolean {
      const v = pauseQueued;
      pauseQueued = false;
      return v;
    },
    setPlaying(on: boolean): void {
      layer.style.display = on ? '' : 'none';
      if (!on) {
        // Let go of everything when the controls go away, so nothing stays held down
        resetStick();
        sprintHeld = false;
        crouchHeld = false;
        [sprintBtn, crouchBtn].forEach((b) => b.classList.remove('on'));
      }
    },
    dispose(): void {
      layer.remove();
      styleEl.remove();
    },
  };
}
