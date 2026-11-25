// E25 firefighter: the hose controls while the player mans the hose: an aim pad, a Spray hold button, a Ladder hold
// button (rescue calls), the tank gauge and "Back to the cab". Keys and pad too.
import { firstPad } from '@lawn/gamepad';
import { KEYS, isTyping } from '../../keys';

export interface HoseInput {
  /** Aim rates -1..1 (x: turn right +, y: raise +). */
  aimX: number;
  aimY: number;
  spray: boolean;
  /** Raise-ladder button held. */
  ladder: boolean;
  /** "Back to the cab" was pressed (edge; read() clears it). */
  leave: boolean;
}

export interface HoseUi {
  /** This frame's input. */
  read(): HoseInput;
  /** Tank gauge 0..1; refilling shows a "Refilling" label. */
  setTank(frac: number, refilling: boolean): void;
  /** Ladder gauge: extension 0..1 and the target band, or null to hide the Ladder button and gauge. */
  setLadder(ext: number | null, band: [number, number] | null): void;
  /** One line at the top ("2 fires left", "Out of water: find a hydrant"). */
  setHint(text: string): void;
  isOpen(): boolean;
  close(): void;
}

const CSS_ID = 'gta-hose-ui-css';
const CSS = `
#gta-hose-ui{position:fixed;inset:0;pointer-events:none;z-index:30;font:600 13px system-ui,sans-serif;color:#fff;user-select:none;-webkit-user-select:none}
#gta-hose-ui *{box-sizing:border-box}
#gta-hose-ui .hz-pad{position:absolute;left:calc(env(safe-area-inset-left,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);width:150px;height:150px;border-radius:50%;background:rgba(20,30,40,.45);border:2px solid rgba(255,255,255,.4);pointer-events:auto;touch-action:none}
#gta-hose-ui .hz-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(120,200,255,.75);border:2px solid #fff}
#gta-hose-ui .hz-btn{position:absolute;border-radius:50%;border:3px solid #fff;color:#fff;font:700 13px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;padding:0}
#gta-hose-ui .hz-spray{right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);width:96px;height:96px;background:rgba(40,130,220,.7);font-size:40px}
#gta-hose-ui .hz-ladder{right:calc(env(safe-area-inset-right,0px) + 28px);bottom:calc(env(safe-area-inset-bottom,0px) + 124px);width:64px;height:64px;background:rgba(220,150,40,.75)}
#gta-hose-ui .hz-btn.on{filter:brightness(1.4);transform:scale(.95)}
#gta-hose-ui .hz-gauge{position:absolute;width:18px;height:120px;border:2px solid #fff;border-radius:6px;background:rgba(0,0,0,.5);overflow:hidden}
#gta-hose-ui .hz-fill{position:absolute;left:0;right:0;bottom:0;background:#4aa8ff}
#gta-hose-ui .hz-band{position:absolute;left:0;right:0;background:rgba(80,220,100,.55);border-top:2px solid #6f6;border-bottom:2px solid #6f6}
#gta-hose-ui .hz-tank{left:calc(env(safe-area-inset-left,0px) + 12px);top:calc(env(safe-area-inset-top,0px) + 30px)}
#gta-hose-ui .hz-tanklbl{position:absolute;left:calc(env(safe-area-inset-left,0px) + 12px);top:calc(env(safe-area-inset-top,0px) + 8px);text-shadow:0 1px 2px #000;white-space:nowrap}
#gta-hose-ui .hz-lgauge{right:calc(env(safe-area-inset-right,0px) + 104px);bottom:calc(env(safe-area-inset-bottom,0px) + 124px)}
#gta-hose-ui .hz-hint{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 10px);max-width:calc(100% - 340px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000;background:rgba(0,0,0,.35);padding:4px 10px;border-radius:12px}
@media (max-width:600px){#gta-hose-ui .hz-hint{top:calc(env(safe-area-inset-top,0px) + 62px);max-width:calc(100% - 140px);white-space:normal}}
#gta-hose-ui .hz-hint:empty{display:none}
#gta-hose-ui .hz-back{position:absolute;right:calc(env(safe-area-inset-right,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 8px);min-width:44px;min-height:44px;padding:0 12px;border-radius:22px;border:2px solid #fff;background:rgba(20,30,40,.7);color:#fff;font:700 13px system-ui,sans-serif;pointer-events:auto;touch-action:manipulation}
`;

const PAD_R = 75;
const KNOB_R = 28;
const PAD_DEAD = 0.12;
const STICK_DEAD = 0.15;

const clamp = (v: number, lo = -1, hi = 1): number => Math.max(lo, Math.min(hi, v));

export function openHoseUi(ui: HTMLElement): HoseUi {
  if (!document.getElementById(CSS_ID)) {
    const st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.getElementById('gta-hose-ui')?.remove();
  const root = document.createElement('div');
  root.id = 'gta-hose-ui';
  root.setAttribute('data-gnl-touch', 'none');
  root.innerHTML =
    '<div class="hz-pad"><div class="hz-knob"></div></div>' +
    '<button type="button" class="hz-btn hz-spray" aria-label="Spray">\u{1F4A7}</button>' +
    '<button type="button" class="hz-btn hz-ladder" aria-label="Ladder" style="display:none">Ladder</button>' +
    '<div class="hz-tanklbl">Tank</div>' +
    '<div class="hz-gauge hz-tank"><div class="hz-fill"></div></div>' +
    '<div class="hz-gauge hz-lgauge" style="display:none"><div class="hz-band"></div><div class="hz-fill hz-lfill" style="background:#ffd24a;opacity:.85"></div></div>' +
    '<div class="hz-hint"></div>' +
    '<button type="button" class="hz-back">Back to the cab</button>';
  ui.appendChild(root);
  const q = (sel: string): HTMLElement => root.querySelector(sel) as HTMLElement;
  const pad = q('.hz-pad');
  const knob = q('.hz-knob');
  const sprayBtn = q('.hz-spray');
  const ladderBtn = q('.hz-ladder');
  const tankLbl = q('.hz-tanklbl');
  const tankFill = q('.hz-tank .hz-fill');
  const lGauge = q('.hz-lgauge');
  const lBand = q('.hz-band');
  const lFill = q('.hz-lfill');
  const hint = q('.hz-hint');
  const backBtn = q('.hz-back');

  let open = true;
  let touchX = 0;
  let touchY = 0;
  let padId = -1;
  let sprayId = -1;
  let ladderId = -1;
  let leave = false;
  let ladderShown = false;
  let padB = false;
  const keys = new Set<string>();
  const cleanups: Array<() => void> = [];
  const on = (t: EventTarget, type: string, fn: (e: never) => void): void => {
    t.addEventListener(type, fn as unknown as EventListener);
    cleanups.push(() => t.removeEventListener(type, fn as unknown as EventListener));
  };

  const setKnob = (nx: number, ny: number): void => {
    knob.style.transform = `translate(${nx * (PAD_R - KNOB_R)}px,${ny * (PAD_R - KNOB_R)}px)`;
  };
  const dragPad = (e: PointerEvent): void => {
    const r = pad.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / PAD_R;
    let dy = (e.clientY - (r.top + r.height / 2)) / PAD_R;
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    setKnob(dx, dy);
    if (Math.min(m, 1) < PAD_DEAD) { touchX = 0; touchY = 0; return; }
    touchX = dx;
    touchY = -dy; // drag up = raise
  };
  const releasePad = (): void => { padId = -1; touchX = 0; touchY = 0; setKnob(0, 0); };

  on(pad, 'pointerdown', (e: PointerEvent) => {
    if (padId !== -1) return;
    e.preventDefault();
    padId = e.pointerId;
    try { pad.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    dragPad(e);
  });
  on(pad, 'pointermove', (e: PointerEvent) => { if (e.pointerId === padId) dragPad(e); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    on(pad, t, (e: PointerEvent) => { if (e.pointerId === padId) releasePad(); });
  }

  const hold = (btn: HTMLElement, get: () => number, set: (id: number) => void): void => {
    on(btn, 'pointerdown', (e: PointerEvent) => {
      if (get() !== -1) return;
      e.preventDefault();
      set(e.pointerId);
      try { btn.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
      btn.classList.add('on');
    });
    const up = (e: PointerEvent): void => {
      if (e.pointerId !== get()) return;
      set(-1);
      btn.classList.remove('on');
    };
    for (const t of ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']) on(btn, t, up);
  };
  hold(sprayBtn, () => sprayId, (id) => { sprayId = id; });
  hold(ladderBtn, () => ladderId, (id) => { ladderId = id; });
  on(backBtn, 'pointerdown', (e: PointerEvent) => { e.preventDefault(); leave = true; });
  on(root, 'contextmenu', (e: Event) => e.preventDefault());

  on(window, 'keydown', (e: KeyboardEvent) => {
    if (isTyping(e)) return;
    if (e.code === KEYS.close) { leave = true; return; }
    keys.add(e.code);
  });
  on(window, 'keyup', (e: KeyboardEvent) => { keys.delete(e.code); });
  on(window, 'blur', () => keys.clear());

  const dz = (v: number): number => (Math.abs(v) < STICK_DEAD ? 0 : v);

  return {
    read() {
      const kx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
      const ky = (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0);
      let ax = touchX + kx;
      let ay = touchY + ky;
      let spray = sprayId !== -1 || keys.has('Space');
      let ladder = ladderShown && (ladderId !== -1 || keys.has('KeyL'));
      const p = firstPad();
      if (p) {
        ax += dz(p.axes[0] ?? 0);
        ay -= dz(p.axes[1] ?? 0);
        const b = p.buttons;
        if (b[0]?.pressed || (b[7]?.value ?? 0) > 0.4) spray = true;
        if (ladderShown && b[2]?.pressed) ladder = true;
        const nowB = !!b[1]?.pressed;
        if (nowB && !padB) leave = true;
        padB = nowB;
      }
      const out: HoseInput = { aimX: clamp(ax), aimY: clamp(ay), spray, ladder, leave };
      leave = false;
      return out;
    },
    setTank(frac, refilling) {
      const f = clamp(frac, 0, 1);
      tankFill.style.height = `${f * 100}%`;
      tankFill.style.background = f < 0.15 ? '#e33' : '#4aa8ff';
      tankLbl.textContent = refilling ? 'Tank: Refilling...' : 'Tank';
    },
    setLadder(ext, band) {
      ladderShown = band !== null;
      ladderBtn.style.display = ladderShown ? 'flex' : 'none';
      lGauge.style.display = ladderShown ? 'block' : 'none';
      if (!band) return;
      const lo = clamp(band[0], 0, 1);
      lBand.style.bottom = `${lo * 100}%`;
      lBand.style.height = `${Math.max(0, clamp(band[1], 0, 1) - lo) * 100}%`;
      lFill.style.height = `${clamp(ext ?? 0, 0, 1) * 100}%`;
    },
    setHint(text) { hint.textContent = text; },
    isOpen: () => open,
    close() {
      if (!open) return;
      open = false;
      for (const c of cleanups) c();
      cleanups.length = 0;
      root.remove();
    },
  };
}
