// The emote menu: a 😀 button (touch and mouse), G on the keyboard, D-pad down on a gamepad. Tabs per category, one tile
// per animation; picking a tile plays it on the player's gnome.
import { firstPad } from '@lawn/gamepad';
import { KEYS, isTyping } from '../keys';
import { ANIM_TABS, listAnims } from './index';

export interface EmoteMenuDeps {
  /** The shared #ui element: append your own container to it, never restyle #ui. */
  ui: HTMLElement;
  /** May the menu open (and the button show) now: on foot, alive, standing, no cutscene, shop or other menu open. */
  canOpen(): boolean;
  /** Play the picked animation on the player (a library id, or a "Mine" tile's id as given). */
  play(id: string): void;
  /**
   * The player's own equipped emotes (the Gnome Creator loadout, unlocked by achievements): shown first as a "Mine" tab
   * when given. Called each time the menu opens.
   */
  mine?(): Promise<readonly EmoteTile[]>;
}

/** A "Mine" tile. */
export interface EmoteTile {
  id: string;
  label: string;
  icon: string;
}

export interface EmoteMenu {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  /** Every frame: shows or hides the button, closes the menu when canOpen() turns false, polls the gamepad while open. */
  update(dt: number): void;
}

const STYLE_ID = 'gta-emote-style';
const REPEAT_S = 0.2;
const TILE_NUMBER_LIMIT = 9;
const PAD_A = 0;
const PAD_B = 1;
const PAD_LB = 4;
const PAD_RB = 5;
const PAD_UP = 12;
const PAD_DOWN = 13;
const PAD_LEFT = 14;
const PAD_RIGHT = 15;
const STICK_DEAD = 0.5;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = 'body.gta-in-scene .gta-emote-btn, body.gta-in-scene .gta-emote-panel { display:none !important; }';
  document.head.appendChild(s);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = css;
  if (text !== undefined) e.textContent = text;
  return e;
}

function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function note(text: string): HTMLDivElement {
  return el('div', 'padding:16px;text-align:center;opacity:0.7;font-size:13px;', text);
}

/** Held direction from the D-pad or left stick: -1, 0 or 1 per axis. */
function readDir(p: { buttons: readonly { pressed: boolean; value: number }[]; axes: readonly number[] }): [number, number] {
  const down = (i: number): boolean => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
  let dx = (down(PAD_RIGHT) ? 1 : 0) - (down(PAD_LEFT) ? 1 : 0);
  let dy = (down(PAD_DOWN) ? 1 : 0) - (down(PAD_UP) ? 1 : 0);
  const sx = p.axes[0] ?? 0;
  const sy = p.axes[1] ?? 0;
  if (dx === 0 && Math.abs(sx) > STICK_DEAD) dx = sx > 0 ? 1 : -1;
  if (dy === 0 && Math.abs(sy) > STICK_DEAD) dy = sy > 0 ? 1 : -1;
  return [dx, dy];
}

function buttonDown(p: { buttons: readonly { pressed: boolean; value: number }[] }): boolean[] {
  return p.buttons.map((b) => b.pressed || b.value > 0.5);
}

export function createEmoteMenu(deps: EmoteMenuDeps): EmoteMenu {
  ensureStyle();
  const hasMine = deps.mine !== undefined;
  const base = hasMine ? 1 : 0;
  const tabCount = base + ANIM_TABS.length;

  let on = false;
  let tab = 0;
  let hl = 0;
  let mine: readonly EmoteTile[] | null = null;
  let mineSeq = 0;
  let prev: boolean[] = [];
  let navKey = '';
  let navTimer = 0;
  let gridEl: HTMLDivElement | null = null;

  const root = el('div', 'position:absolute;inset:0;pointer-events:none;');
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  const btn = el('button',
    'position:absolute;right:calc(12px + env(safe-area-inset-right));top:calc(40% + env(safe-area-inset-top));'
    + 'width:56px;height:56px;border-radius:50%;box-sizing:border-box;padding:0;margin:0;'
    + 'border:2px solid rgba(255,255,255,0.7);background:rgba(20,20,20,0.5);color:#fff;'
    + 'font-size:26px;line-height:1;display:none;touch-action:none;pointer-events:auto;user-select:none;'
    + '-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer;',
    '😀');
  btn.type = 'button';
  btn.className = 'gta-emote-btn';
  btn.setAttribute('aria-label', 'Emote menu');
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    toggle();
  });

  const panel = el('div',
    'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,520px);'
    + 'max-height:min(80vh,560px);overflow-y:auto;box-sizing:border-box;padding:10px;'
    + 'background:rgba(14,16,18,0.94);border:2px solid rgba(255,255,255,0.7);border-radius:16px;color:#fff;'
    + 'font:600 13px system-ui,sans-serif;pointer-events:auto;touch-action:pan-y;display:none;');
  panel.className = 'gta-emote-panel';

  const head = el('div', 'display:flex;align-items:center;gap:6px;margin-bottom:8px;');
  const tabRow = el('div', 'flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;white-space:nowrap;touch-action:pan-x;');
  const closeBtn = el('button',
    'flex:0 0 44px;width:44px;height:44px;box-sizing:border-box;padding:0;margin:0;border-radius:10px;border:0;'
    + 'background:rgba(255,255,255,0.12);color:#fff;font-size:18px;cursor:pointer;touch-action:none;', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close emotes');
  closeBtn.addEventListener('click', () => close());
  const body = el('div', 'min-height:120px;');
  head.append(tabRow, closeBtn);
  panel.append(head, body);
  root.append(btn, panel);
  deps.ui.appendChild(root);

  function tabTitle(i: number): string {
    return hasMine && i === 0 ? 'Mine' : ANIM_TABS[i - base].title;
  }

  function tilesFor(i: number): readonly EmoteTile[] {
    if (hasMine && i === 0) return mine ?? [];
    const category = ANIM_TABS[i - base].category;
    return listAnims({ category, emote: true }).map((a) => ({ id: a.id, label: a.label, icon: a.icon }));
  }

  function pick(tile: EmoteTile): void {
    deps.play(tile.id);
    close();
  }

  function render(): void {
    clear(tabRow);
    for (let i = 0; i < tabCount; i++) {
      const active = i === tab;
      const t = el('button',
        'flex:0 0 auto;min-height:44px;padding:0 12px;border-radius:10px;border:0;color:#fff;'
        + `font:700 13px system-ui,sans-serif;cursor:pointer;touch-action:pan-x;background:${active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'};`,
        tabTitle(i));
      t.type = 'button';
      t.addEventListener('click', () => {
        tab = i;
        hl = 0;
        render();
      });
      tabRow.appendChild(t);
    }

    clear(body);
    gridEl = null;
    if (hasMine && tab === 0 && mine === null) {
      body.appendChild(note('Loading…'));
      return;
    }
    const tiles = tilesFor(tab);
    if (tiles.length === 0) {
      body.appendChild(note('Nothing here yet'));
      return;
    }
    hl = Math.min(hl, tiles.length - 1);
    const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px;');
    gridEl = grid;
    tiles.forEach((tile, n) => {
      const b = el('button',
        'position:relative;box-sizing:border-box;min-height:64px;min-width:0;padding:4px;margin:0;border:0;border-radius:10px;'
        + 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;'
        + 'background:rgba(255,255,255,0.08);color:#fff;font:600 12px system-ui,sans-serif;cursor:pointer;'
        + `touch-action:pan-y;pointer-events:auto;outline:${n === hl ? '3px solid #ffd54a' : 'none'};outline-offset:-3px;`);
      b.type = 'button';
      b.append(
        el('span', 'font-size:24px;line-height:1.2;', tile.icon),
        el('span', 'max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.2;', tile.label),
      );
      if (n < TILE_NUMBER_LIMIT) {
        b.appendChild(el('span', 'position:absolute;top:2px;right:5px;font-size:10px;opacity:0.7;', String(n + 1)));
      }
      b.addEventListener('click', () => pick(tile));
      grid.appendChild(b);
    });
    body.appendChild(grid);
  }

  function move(dx: number, dy: number): void {
    const n = tilesFor(tab).length;
    if (n === 0) return;
    const cols = Math.max(1, Math.round((gridEl?.clientWidth ?? 0) / 84));
    hl = Math.max(0, Math.min(n - 1, hl + dx + dy * cols));
    render();
  }

  function switchTab(step: number): void {
    tab = (tab + step + tabCount) % tabCount;
    hl = 0;
    render();
  }

  function open(): void {
    if (on || !deps.canOpen()) return;
    on = true;
    hl = 0;
    if (deps.mine) {
      mine = null;
      const seq = ++mineSeq;
      const settle = (tiles: readonly EmoteTile[]): void => {
        if (seq !== mineSeq) return;
        mine = tiles.slice();
        if (on) render();
      };
      new Promise<readonly EmoteTile[]>((resolve) => resolve(deps.mine!())).then(settle, () => settle([]));
    }
    document.body.dataset.emotes = 'open';
    document.exitPointerLock?.();
    // Start from what is held right now, so the D-pad press that opened the menu does not also move the highlight.
    const p = firstPad();
    prev = p ? buttonDown(p) : [];
    navKey = p ? readDir(p).join(',') : '';
    navTimer = 0;
    panel.style.display = 'block';
    render();
  }

  function close(): void {
    if (!on) return;
    on = false;
    mineSeq++;
    panel.style.display = 'none';
    delete document.body.dataset.emotes;
    prev = [];
    navKey = '';
    navTimer = 0;
  }

  function toggle(): void {
    if (on) close();
    else open();
  }

  window.addEventListener('keydown', (e) => {
    if (isTyping(e) || e.repeat) return;
    if (e.code === KEYS.emote) {
      toggle();
      return;
    }
    if (!on) return;
    if (e.code === KEYS.close) {
      close();
      return;
    }
    if (e.code.startsWith('Digit')) {
      const n = Number(e.code.slice(5));
      const tile = n >= 1 ? tilesFor(tab)[n - 1] : undefined;
      if (tile) pick(tile);
    }
  });

  window.addEventListener('gta:emote', () => toggle());

  return {
    open,
    close,
    toggle,
    isOpen: () => on,
    update(dt: number): void {
      const can = deps.canOpen();
      btn.style.display = can ? 'block' : 'none';
      if (on && !can) {
        close();
        return;
      }
      if (!on) return;
      const p = firstPad();
      if (!p) {
        prev = [];
        navKey = '';
        return;
      }
      const down = buttonDown(p);
      const edge = (i: number): boolean => !!down[i] && !prev[i];
      prev = down;

      const [dx, dy] = readDir(p);
      const key = `${dx},${dy}`;
      if (dx !== 0 || dy !== 0) {
        if (key !== navKey) {
          move(dx, dy);
          navTimer = REPEAT_S;
        } else {
          navTimer -= dt;
          if (navTimer <= 0) {
            move(dx, dy);
            navTimer = REPEAT_S;
          }
        }
      }
      navKey = key;

      if (edge(PAD_A)) {
        const tile = tilesFor(tab)[hl];
        if (tile) pick(tile);
        return;
      }
      if (edge(PAD_B)) {
        close();
        return;
      }
      if (edge(PAD_RB)) switchTab(1);
      else if (edge(PAD_LB)) switchTab(-1);
    },
  };
}
