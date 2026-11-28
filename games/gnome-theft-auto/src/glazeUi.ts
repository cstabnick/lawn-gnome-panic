// Shared building blocks for the Pay 'n' Glaze shop panels (option cards, sliders, colour swatches) and the panel contract.
// Plain DOM, no framework. Every widget returns a detached element; the caller appends it.
import type { Loadout } from '@lawn/glaze';
import { getPrefab, prefabIconElement } from '@lawn/prefabs';
import type { Vehicle, VehicleKind } from './types';

/** What a shop panel gets: the draft loadout being edited and the ways to change it. */
export interface PanelCtx {
  kind: VehicleKind;
  /** The loadout being edited now (what the preview vehicle wears). */
  draft(): Loadout;
  /** What the player already owns for this model (what the price is measured against). */
  owned(): Loadout;
  /** Merge changes into the draft: updates the preview vehicle live, the price line and every panel's `refresh`. */
  patch(p: Partial<Loadout>): void;
  /** Acorns in the wallet. */
  acorns(): number;
  /** The vehicle on the stage (the one the player drove in). Set by both shops (Pay 'n' Glaze, Wingwright's Slipway). */
  vehicle?(): Vehicle;
  /** Take Acorns for a service the panel sells on its own (the Repair tab); false when the player cannot pay. */
  spend?(amount: number, reason: string): boolean;
  /** A short message on the game HUD. */
  toast?(text: string): void;
}

/**
 * One tab of the shop. `build` is called once per shop open; `refresh` after any `patch` (and after a purchase) so the panel can
 * re-mark its selection and its Owned badges. Register a panel with glazePanels.ts registerGlazePanel to add a tab.
 */
export interface Panel {
  id: string;
  label: string;
  /** A short emoji for the tab button. */
  icon: string;
  /** Which vehicle models get this tab. Missing = every model the shop dresses (glazeStore.ts GLAZE_KINDS). */
  appliesTo?(kind: VehicleKind): boolean;
  build(ctx: PanelCtx): HTMLElement;
  refresh?(): void;
}

export interface OptionItem<T extends string> { id: T; name: string; blurb: string; price: number }

/**
 * A card thumbnail maker for a Glaze part slot: the prefab `glaze-<slot>-<id>` as a 40 px icon, or null when no such prefab
 * is registered (ids like 'none' and 'stock' usually have none). Pass it as optionGrid's `thumb`.
 */
export function glazeThumb(slot: string): (id: string) => HTMLElement | null {
  return (id: string) => {
    const pid = `glaze-${slot}-${id}`;
    return getPrefab(pid) ? prefabIconElement(pid, '', 40) : null;
  };
}

/** An optionGrid `badge` that says 'Owned' on the card equal to what the player owns now (read fresh on every refresh). */
export function ownedBadge<T extends string>(owned: () => T): (id: T) => string | null {
  return (id: T) => (id === owned() ? 'Owned' : null);
}

/**
 * A responsive grid of option cards (min 44 px touch targets).
 * Returns `{ el, set(v) }`: `el` is a `div.gz-grid` holding one `button.gz-card` per item, each with an optional
 * thumbnail, the name, the price ("Free" or "<n> 🌰") and the blurb. The card equal to `value` gets `.active` and
 * `aria-pressed="true"`. Clicking a card calls `onPick(id)` and marks it at once. `set(v)` re-marks without calling `onPick`.
 * An empty `items` gives an empty grid; a `value` not in the list leaves no card active.
 * `badge(id)`, when given and it returns a string (e.g. 'Owned', see ownedBadge), shows that text instead of the price and adds
 * `.gz-owned` to the card; it is asked again on every `set`, so a purchase re-badges the cards on the next refresh.
 */
export function optionGrid<T extends string>(opts: {
  items: readonly OptionItem<T>[];
  value: T;
  onPick(id: T): void;
  thumb?(id: T): HTMLElement | null;
  badge?(id: T): string | null;
}): { el: HTMLElement; set(v: T): void } {
  const el = document.createElement('div');
  el.className = 'gz-grid';
  const cards: { id: T; btn: HTMLButtonElement; price: HTMLElement; priceText: string }[] = [];

  const mark = (v: T): void => {
    for (const c of cards) {
      const on = c.id === v;
      c.btn.classList.toggle('active', on);
      c.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const b = opts.badge ? opts.badge(c.id) : null;
      c.price.textContent = b ?? c.priceText;
      c.btn.classList.toggle('gz-owned', b !== null);
    }
  };

  for (const item of opts.items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-card';
    btn.title = item.blurb;

    const thumb = opts.thumb ? opts.thumb(item.id) : null;
    if (thumb) {
      thumb.classList.add('gz-card-thumb');
      btn.appendChild(thumb);
    }

    const name = document.createElement('span');
    name.className = 'gz-card-name';
    name.textContent = item.name;

    const price = document.createElement('span');
    price.className = 'gz-card-price';
    const priceText = item.price === 0 ? 'Free' : `${item.price} 🌰`;
    price.textContent = priceText;

    const blurb = document.createElement('span');
    blurb.className = 'gz-card-blurb';
    blurb.textContent = item.blurb;

    btn.append(name, price, blurb);
    btn.addEventListener('click', () => {
      mark(item.id);
      opts.onPick(item.id);
    });

    cards.push({ id: item.id, btn, price, priceText });
    el.appendChild(btn);
  }

  mark(opts.value);
  return { el, set: (v: T) => mark(v) };
}

/**
 * A labelled range slider with a live value readout.
 * Returns `{ el, set(v) }`: `el` is a `div.gz-slider` with a top line (label left, readout right, from `format` or
 * `toFixed(2)`), the blurb, and an `input.gz-range`. The `input` event calls `onInput(Number(value))` and updates the
 * readout. `set(v)` updates input and readout without calling `onInput`.
 */
export function sliderRow(opts: {
  label: string;
  blurb: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?(v: number): string;
  onInput(v: number): void;
}): { el: HTMLElement; set(v: number): void } {
  const fmt = opts.format ?? ((v: number) => v.toFixed(2));

  const el = document.createElement('div');
  el.className = 'gz-slider';

  const top = document.createElement('div');
  top.className = 'gz-slider-top';
  const label = document.createElement('span');
  label.className = 'gz-slider-label';
  label.textContent = opts.label;
  const readout = document.createElement('span');
  readout.className = 'gz-slider-val';
  readout.textContent = fmt(opts.value);
  top.append(label, readout);

  const blurb = document.createElement('div');
  blurb.className = 'gz-slider-blurb';
  blurb.textContent = opts.blurb;

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'gz-range';
  input.min = String(opts.min);
  input.max = String(opts.max);
  input.step = String(opts.step);
  input.value = String(opts.value);
  input.setAttribute('aria-label', opts.label);

  input.addEventListener('input', () => {
    const v = Number(input.value);
    readout.textContent = fmt(v);
    opts.onInput(v);
  });

  el.append(top, blurb, input);

  return {
    el,
    set(v: number) {
      input.value = String(v);
      readout.textContent = fmt(v);
    },
  };
}

/**
 * A row of colour swatches (44 px round buttons, the name as tooltip and aria-label) plus, when `custom`, a native colour input.
 * Returns `{ el, set(hex) }`: `el` is a `div.gz-swatches`. The swatch equal to `value` gets `.active` and `aria-pressed`.
 * Clicking a swatch calls `onPick(hex)`. With `custom`, a last `label.gz-swatch.gz-custom` wraps an `input[type=color]`
 * whose `input` event calls `onPick(parseInt(hex.slice(1), 16))`; that label is `.active` when no swatch matches `value`.
 * `set(hex)` re-marks and updates the colour input.
 */
export function swatchRow(opts: {
  swatches: readonly { name: string; hex: number }[];
  value: number;
  custom?: boolean;
  onPick(hex: number): void;
}): { el: HTMLElement; set(hex: number): void } {
  const toCss = (hex: number): string => `#${hex.toString(16).padStart(6, '0')}`;

  const el = document.createElement('div');
  el.className = 'gz-swatches';
  const buttons: { hex: number; btn: HTMLElement }[] = [];
  let customLabel: HTMLElement | null = null;
  let colourInput: HTMLInputElement | null = null;

  const mark = (hex: number): void => {
    let matched = false;
    for (const b of buttons) {
      const on = b.hex === hex;
      if (on) matched = true;
      b.btn.classList.toggle('active', on);
      b.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (customLabel) {
      const on = !matched;
      customLabel.classList.toggle('active', on);
      customLabel.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (colourInput) colourInput.value = toCss(hex);
  };

  for (const sw of opts.swatches) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-swatch';
    btn.title = sw.name;
    btn.setAttribute('aria-label', sw.name);
    btn.style.background = toCss(sw.hex);
    btn.addEventListener('click', () => {
      mark(sw.hex);
      opts.onPick(sw.hex);
    });
    buttons.push({ hex: sw.hex, btn });
    el.appendChild(btn);
  }

  if (opts.custom) {
    const label = document.createElement('label');
    label.className = 'gz-swatch gz-custom';
    label.title = 'Custom colour';
    label.setAttribute('aria-label', 'Custom colour');
    const input = document.createElement('input');
    input.type = 'color';
    input.addEventListener('input', () => {
      const hex = parseInt(input.value.slice(1), 16);
      mark(hex);
      opts.onPick(hex);
    });
    label.appendChild(input);
    customLabel = label;
    colourInput = input;
    el.appendChild(label);
  }

  mark(opts.value);

  return { el, set: (hex: number) => mark(hex) };
}

/** A section heading line used inside panels. Styled by `.gz-sec` in GLAZE_CSS. */
export function sectionLabel(text: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'gz-sec';
  el.textContent = text;
  return el;
}

/**
 * Stylesheet for the widgets above and for the shop frame. All selectors are under `#gta-glaze`; glazeShop.ts injects it once.
 *
 * Shop frame classes (used by glazeShop.ts):
 * - `#gta-glaze`: fixed full-screen root, pointer-events none; only the frame and toast take pointer events.
 * - `.gz-frame`: bottom sheet on portrait (max 62vh, leaves the top of the screen free); right-side panel in landscape (`max-height:500px`).
 * - `.gz-head` (with `.gz-title`), `.gz-tabs` (horizontal scroll row of `.gz-tab`, `.active` yellow), `.gz-body` (scrolling content),
 *   `.gz-foot` (`.gz-price` line plus `.gz-btn`, `.gz-btn-buy`, `.gz-btn-ghost`), `.gz-toast` (`.show` makes it visible).
 * Widget classes: `.gz-grid`, `.gz-card` (`.active`, `.gz-card-thumb`, `.gz-card-name`, `.gz-card-price`, `.gz-card-blurb`),
 * `.gz-slider` (`.gz-slider-top`, `.gz-slider-label`, `.gz-slider-val`, `.gz-slider-blurb`, `.gz-range`),
 * `.gz-swatches`, `.gz-swatch` (`.active`, `.gz-custom`), `.gz-sec`.
 */
export const GLAZE_CSS = `
#gta-glaze{position:fixed;inset:0;z-index:36;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-glaze button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-glaze button:focus-visible,#gta-glaze label:focus-within{outline:3px solid #ffd23f;outline-offset:2px;}
#gta-glaze .gz-frame{
  position:fixed;left:0;right:0;bottom:0;max-height:62vh;box-sizing:border-box;
  display:flex;flex-direction:column;overflow:hidden;pointer-events:auto;
  background:#181c20;border:2px solid rgba(255,255,255,0.22);border-bottom:none;
  border-radius:16px 16px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,0.55);
  padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);
}
@media (max-height:500px){
  #gta-glaze .gz-frame{
    left:auto;top:0;width:min(46vw,420px);max-height:none;
    border-radius:0;border:none;border-left:2px solid rgba(255,255,255,0.22);
    padding-left:0;padding-right:env(safe-area-inset-right,0px);
    padding-top:env(safe-area-inset-top,0px);
  }
}
#gta-glaze .gz-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px 0;}
#gta-glaze .gz-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-glaze .gz-tabs{
  display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:8px 10px;flex:0 0 auto;
  scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x;
}
#gta-glaze .gz-tabs::-webkit-scrollbar{display:none;}
#gta-glaze .gz-tab{
  flex:0 0 auto;min-height:44px;padding:8px 12px;border-radius:10px;white-space:nowrap;
  border:2px solid rgba(255,255,255,0.24);background:rgba(255,255,255,0.06);font-size:13px;font-weight:700;
}
#gta-glaze .gz-tab.active{border-color:#ffd23f;background:rgba(255,210,63,0.16);color:#ffd23f;}
#gta-glaze .gz-body{
  flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;
  padding:10px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;
}
#gta-glaze .gz-foot{
  flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;
  padding:10px 12px;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 10px);
  border-top:1px solid rgba(255,255,255,0.12);box-sizing:border-box;
}
#gta-glaze .gz-price{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;}
#gta-glaze .gz-btn{
  min-width:44px;min-height:44px;padding:8px 16px;border-radius:10px;
  border:2px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.08);font-size:14px;font-weight:800;
}
#gta-glaze .gz-btn-buy{border-color:#ffd23f;background:#ffd23f;color:#181c20;}
#gta-glaze .gz-btn-ghost{background:transparent;}
#gta-glaze .gz-btn:disabled{opacity:0.45;cursor:default;}
#gta-glaze .gz-toast{
  position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);
  padding:10px 16px;border-radius:10px;background:rgba(22,26,30,0.94);border:1px solid #ffd23f;
  color:#ffd23f;font-size:14px;font-weight:700;pointer-events:none;opacity:0;transition:opacity 0.2s;
  box-shadow:0 4px 14px rgba(0,0,0,0.5);
}
#gta-glaze .gz-toast.show{opacity:1;}
#gta-glaze .gz-sec{
  font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#ffd23f;margin-bottom:6px;
}
#gta-glaze .gz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px;}
#gta-glaze .gz-card{
  display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:44px;box-sizing:border-box;
  padding:8px 10px;border-radius:10px;border:2px solid rgba(255,255,255,0.24);
  background:rgba(255,255,255,0.06);text-align:left;
}
#gta-glaze .gz-card.active{border-color:#ffd23f;background:rgba(255,210,63,0.16);}
#gta-glaze .gz-card-thumb{width:48px;height:48px;display:block;flex:0 0 auto;}
#gta-glaze .gz-card-name{font-size:13px;font-weight:700;}
#gta-glaze .gz-card-price{font-size:12px;font-weight:700;color:#ffd23f;font-variant-numeric:tabular-nums;}
#gta-glaze .gz-owned .gz-card-price{color:#7be08a;}
#gta-glaze .gz-card-blurb{font-size:11px;opacity:0.74;line-height:1.25;}
#gta-glaze .gz-slider{
  padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
  box-sizing:border-box;
}
#gta-glaze .gz-slider-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:13px;font-weight:700;}
#gta-glaze .gz-slider-val{font-variant-numeric:tabular-nums;color:#ffd23f;}
#gta-glaze .gz-slider-blurb{font-size:11px;opacity:0.74;line-height:1.25;margin-top:2px;}
#gta-glaze .gz-range{width:100%;height:44px;margin:0;accent-color:#ffd23f;touch-action:pan-y;}
#gta-glaze .gz-swatches{display:flex;flex-wrap:wrap;gap:8px;}
#gta-glaze .gz-swatch{
  width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border-radius:50%;box-sizing:border-box;
  border:2px solid rgba(255,255,255,0.85);display:inline-flex;align-items:center;justify-content:center;
}
#gta-glaze .gz-swatch.active{box-shadow:0 0 0 3px #181c20,0 0 0 5px #ffd23f;}
#gta-glaze .gz-custom{
  position:relative;overflow:hidden;cursor:pointer;
  background:conic-gradient(#ff3b30,#ffd23f,#34c759,#38bdf8,#5856d6,#ff2d92,#ff3b30);
}
#gta-glaze .gz-custom input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;padding:0;border:0;cursor:pointer;}
`;
