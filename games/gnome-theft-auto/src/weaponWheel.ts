// The weapon wheel: hold Q (gamepad: hold LB) for a ring of every gun, point at one and let go to equip it; a quick tap still
// cycles to the next gun. On touch the Guns button opens it and a tap on a gun equips it. The 🔧 in the middle opens the Pocket Kit.
import { firstPad } from '@lawn/gamepad';
import { prefabIconElement } from '@lawn/prefabs';
import { GUNS, GUN_ORDER } from './config';
import { moddedGun } from './gunMods';
import { KEYS, isTyping } from './keys';
import { currentGlyphSet } from './ui/inputSource';
import { fillHint } from './ui/glyphs';
import type { GunKind, Hud, Sfx, Weapons } from './types';

/** Hold the key or LB this long (ms) before the wheel shows; a shorter press is a tap (next gun). */
export const HOLD_MS = 180;

export interface WeaponWheelDeps {
  ui: HTMLElement;
  weapons: Weapons;
  hud: Hud;
  /** May the wheel open now (on foot, alive, not mid-air, no shop, menu or cutscene open). */
  canOpen(): boolean;
  play?(sfx: Sfx): void;
  /** The 🔧 button in the middle: close the wheel and open the Pocket Kit on this gun. */
  openModKit(gun: GunKind): void;
}

export interface WeaponWheel {
  /**
   * The touch Guns button or the gamepad LB was pressed (app.ts calls this on inp.switchGun; the keyboard is handled inside).
   * `pad` true: LB pressed it, so holding LB keeps the wheel open and letting go equips the pointed gun (a tap under HOLD_MS
   * cycles to the next gun). `pad` false: the wheel opens in tap mode until a gun, the 🔧 or the backdrop is tapped.
   */
  press(pad: boolean): void;
  isOpen(): boolean;
  /** Close without equipping anything. */
  close(): void;
  /** Every frame: polls the gamepad (stick pointing, LB release) while open. */
  update(dt: number): void;
}

/**
 * Which of `count` equal sectors a pointer offset (dx right, dy DOWN, screen pixels or stick units) points at: sector 0 is
 * straight up, numbered clockwise. Returns -1 when the offset is shorter than `deadzone`.
 */
export function sectorAt(dx: number, dy: number, count: number, deadzone: number): number {
  if (count <= 0 || Math.hypot(dx, dy) < deadzone) return -1;
  const a = Math.atan2(dx, -dy); // 0 = up, + = clockwise
  const step = (Math.PI * 2) / count;
  const i = Math.round((a < 0 ? a + Math.PI * 2 : a) / step) % count;
  return i;
}

const LB = 4;
const MOUSE_REACH = 120;
const MOUSE_DEADZONE = 30;
const PAD_DEADZONE = 0.5;
const STYLE_ID = 'gta-wheel-style';

const CSS = `
#gta-wheel{position:fixed;inset:0;z-index:38;display:none;align-items:center;justify-content:center;box-sizing:border-box;
  padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);
  background:rgba(0,0,0,0.45);touch-action:none;user-select:none;-webkit-user-select:none}
#gta-wheel .gw-ring{position:relative;width:0;height:0}
#gta-wheel .gw-gun{position:absolute;left:0;top:0;width:64px;height:64px;margin:0;padding:0;box-sizing:border-box;border-radius:50%;
  border:3px solid rgba(255,255,255,0.35);background:rgba(20,30,20,0.88);display:flex;align-items:center;justify-content:center;
  transform:translate(-50%,-50%);transition:transform 80ms ease-out;pointer-events:auto;touch-action:none;cursor:pointer}
#gta-wheel .gw-gun.gw-held{box-shadow:0 0 0 3px #ffd23f}
#gta-wheel .gw-gun.gw-hi{transform:translate(-50%,-50%) scale(1.15);border-color:#ff7a1a}
#gta-wheel .gw-hub{position:absolute;left:0;top:0;width:120px;height:120px;box-sizing:border-box;transform:translate(-50%,-50%);
  border-radius:50%;background:rgba(20,30,20,0.92);color:#fff;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:14px 8px 0;font:600 12px/1.25 system-ui,sans-serif;pointer-events:none}
#gta-wheel .gw-name{font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis}
#gta-wheel .gw-ammo{font-size:15px;font-weight:700;color:#ffd23f}
#gta-wheel .gw-mods{opacity:0.8}
#gta-wheel .gw-kit{position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);width:48px;height:48px;margin:0;padding:0;
  box-sizing:border-box;border-radius:50%;border:2px solid #fff;background:#2f6b2f;color:#fff;font-size:22px;line-height:44px;
  pointer-events:auto;touch-action:none;cursor:pointer}
#gta-wheel .gw-foot{position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#fff;font:600 13px/1.3 system-ui,sans-serif;
  pointer-events:none}
`;

type Mode = 'key' | 'pad' | 'tap';

export function createWeaponWheel(deps: WeaponWheelDeps): WeaponWheel {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const N = GUN_ORDER.length;
  const root = document.createElement('div');
  root.id = 'gta-wheel';
  const ring = document.createElement('div');
  ring.className = 'gw-ring';

  const hub = document.createElement('div');
  hub.className = 'gw-hub';
  const hubName = document.createElement('div');
  hubName.className = 'gw-name';
  const hubAmmo = document.createElement('div');
  hubAmmo.className = 'gw-ammo';
  const hubMods = document.createElement('div');
  hubMods.className = 'gw-mods';
  const kit = document.createElement('button');
  kit.type = 'button';
  kit.className = 'gw-kit';
  kit.textContent = '🔧';
  kit.setAttribute('aria-label', 'Pocket Kit: fit mods');
  hub.append(hubName, hubAmmo, hubMods, kit);
  ring.appendChild(hub);

  const buttons: HTMLButtonElement[] = GUN_ORDER.map((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gw-gun';
    b.setAttribute('aria-label', GUNS[k].name);
    b.addEventListener('pointerenter', () => {
      if (!open || highlighted === k) return;
      highlighted = k;
      render();
    });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (open) equip(k);
    });
    ring.appendChild(b);
    return b;
  });
  // Gun icons are rendered the first time the wheel shows (perf pass 2: building them was 3-4 % of the load).
  let iconsBuilt = false;
  function buildIcons(): void {
    if (iconsBuilt) return;
    iconsBuilt = true;
    buttons.forEach((b, i) => b.prepend(prefabIconElement(GUNS[GUN_ORDER[i]].prefab, '🔫', 34)));
  }
  // Footer hint naming the keys; hidden on touch (the Guns button and taps need no keys).
  const foot = document.createElement('div');
  foot.className = 'gw-foot';
  root.append(ring, foot);
  deps.ui.appendChild(root);

  let open = false;
  let shown = false;
  let mode: Mode = 'tap';
  let highlighted: GunKind = GUN_ORDER[0];
  let heldKey: string | null = null;
  let pressedAt = 0;
  let mx = 0;
  let my = 0;

  function render(): void {
    const k = highlighted;
    const h = GUN_ORDER.indexOf(k);
    buttons.forEach((b, i) => {
      b.classList.toggle('gw-held', GUN_ORDER[i] === deps.weapons.gun);
      b.classList.toggle('gw-hi', i === h);
    });
    const loadout = deps.weapons.loadoutOf(k);
    const mods = Object.keys(loadout).length;
    const mag = moddedGun(k, loadout).mag;
    const ammo = deps.weapons.ammoOf?.(k) ?? (k === deps.weapons.gun ? deps.weapons.ammo : mag);
    hubName.textContent = GUNS[k].name;
    hubAmmo.textContent = `${ammo} / ${mag}`;
    hubMods.textContent = mods === 0 ? 'stock' : `${mods} mod${mods === 1 ? '' : 's'}`;
  }

  function layout(): void {
    const R = Math.min(150, (Math.min(window.innerWidth, window.innerHeight) - 110) / 2);
    buttons.forEach((b, i) => {
      const a = (i * 2 * Math.PI) / N;
      b.style.left = `${R * Math.sin(a)}px`;
      b.style.top = `${-R * Math.cos(a)}px`;
    });
  }

  function show(): void {
    if (shown) return;
    buildIcons();
    shown = true;
    layout();
    render();
    const touch = currentGlyphSet() === 'touch';
    foot.style.display = touch ? 'none' : '';
    if (!touch) foot.textContent = fillHint('Release {switchGun} to equip · {modKit} Pocket Kit');
    root.style.display = 'flex';
  }

  function maybeShow(): void {
    if (open && !shown && mode !== 'tap' && performance.now() - pressedAt >= HOLD_MS) show();
  }

  function close(): void {
    open = false;
    shown = false;
    heldKey = null;
    root.style.display = 'none';
  }

  function nextGun(): void {
    deps.weapons.switchGun();
    deps.hud.toast(GUNS[deps.weapons.gun].name);
  }

  function equip(k: GunKind): void {
    if (k !== deps.weapons.gun) {
      deps.weapons.selectGun(k);
      deps.play?.('reload');
      deps.hud.toast(GUNS[k].name);
    }
    close();
  }

  /** The key or LB came up: a shown wheel equips the pointed gun, a quick tap cycles to the next one. */
  function release(): void {
    if (shown) {
      equip(highlighted);
    } else {
      close();
      nextGun();
    }
  }

  function point(dx: number, dy: number, deadzone: number): void {
    const s = sectorAt(dx, dy, N, deadzone);
    if (s >= 0 && GUN_ORDER[s] !== highlighted) {
      highlighted = GUN_ORDER[s];
      render();
    }
  }

  function begin(next: Mode, key: string | null): void {
    mode = next;
    heldKey = key;
    open = true;
    shown = false;
    pressedAt = performance.now();
    highlighted = deps.weapons.gun;
    mx = 0;
    my = 0;
    setTimeout(maybeShow, HOLD_MS);
  }

  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('click', (e) => {
    if (e.target === root && open) close();
    e.stopPropagation();
  });
  kit.addEventListener('click', (e) => {
    e.stopPropagation();
    const g = highlighted;
    close();
    deps.openModKit(g);
  });

  window.addEventListener('keydown', (e) => {
    if (open && e.code === KEYS.close) {
      close();
      return;
    }
    // Q only: Tab used to open the wheel too, and is now the More menu (ui/moreMenu.ts; keys.ts KEYS.more).
    if (e.code !== KEYS.switchGun) return;
    if (e.repeat || isTyping(e)) return;
    if (open) {
      if (mode === 'tap') close();
      return;
    }
    if (!deps.canOpen()) return;
    begin('key', e.code);
  });

  window.addEventListener('keyup', (e) => {
    if (!open || mode !== 'key' || heldKey === null || e.code !== heldKey) return;
    release();
  });

  window.addEventListener('blur', () => {
    if (open && mode === 'key') close();
  });

  window.addEventListener('mousemove', (e) => {
    if (!open) return;
    mx += e.movementX;
    my += e.movementY;
    const len = Math.hypot(mx, my);
    if (len > MOUSE_REACH) {
      mx *= MOUSE_REACH / len;
      my *= MOUSE_REACH / len;
    }
    point(mx, my, MOUSE_DEADZONE);
  });

  window.addEventListener(
    'wheel',
    (e) => {
      if (!open) return;
      const step = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (step === 0) return;
      highlighted = GUN_ORDER[(GUN_ORDER.indexOf(highlighted) + step + N) % N];
      render();
    },
    { passive: true },
  );

  return {
    press(pad: boolean): void {
      if (open) {
        if (mode === 'tap') close();
        return;
      }
      if (!deps.canOpen()) return;
      if (pad) {
        begin('pad', null);
      } else {
        begin('tap', null);
        show();
      }
    },
    isOpen: () => open,
    close,
    update(): void {
      if (!open) return;
      if (!deps.canOpen()) {
        close();
        return;
      }
      if (mode === 'pad') {
        const p = firstPad();
        if (!p) {
          close();
          return;
        }
        const ax = p.axes[2] ?? 0;
        const ay = p.axes[3] ?? 0;
        const lx = p.axes[0] ?? 0;
        const ly = p.axes[1] ?? 0;
        if (Math.hypot(ax, ay) >= Math.hypot(lx, ly)) point(ax, ay, PAD_DEADZONE);
        else point(lx, ly, PAD_DEADZONE);
        if (!p.buttons[LB]?.pressed) {
          release();
          return;
        }
      }
      maybeShow();
    },
  };
}
