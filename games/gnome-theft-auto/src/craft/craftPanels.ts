// The Wingwright's Slipway tabs: Paint and Tune, as Pay 'n' Glaze Panels (glazeUi.ts) registered through glazePanels.ts
// registerGlazePanel with appliesTo = isCraftKind, so the Glaze registry knows every tab.
import { isCraftKind } from '../glazeStore';
import { registerGlazePanel } from '../glazePanels';
import { sectionLabel, swatchRow, type Panel, type PanelCtx } from '../glazeUi';
import { VEHICLES } from '../config';
import type { VehicleKind } from '../types';
import type { CraftTune } from './model';
import { getCraftTune } from './craftTuneStore';
import { MAX_TUNE_LEVEL, NO_TUNE, statMult, statsFor, type CraftStatDef } from './tuning';

/** Panel ids the Slipway shows (the Glaze built-ins are skipped: they dress rigged ground vehicles). */
export const CRAFT_PANEL_IDS: readonly string[] = ['craft-paint', 'craft-tune'];
/** Acorns for a new coat of paint on a boat or aircraft. */
export const CRAFT_PAINT_PRICE = 60;
/** The colours the Paint tab offers. */
export const CRAFT_SWATCHES: readonly { name: string; hex: number }[] = [
  { name: 'Poppy Red', hex: 0xc8342c },
  { name: 'Marigold', hex: 0xf2b632 },
  { name: 'Clover', hex: 0x3fa34d },
  { name: 'Pond Teal', hex: 0x2a8f8a },
  { name: 'Sky Blue', hex: 0x4f9de0 },
  { name: 'Navy Bib', hex: 0x1f2f5a },
  { name: 'Plum', hex: 0x8e44ad },
  { name: 'Rust', hex: 0xa4502a },
  { name: 'Seed Olive', hex: 0x8a9a3c },
  { name: 'Olive Drab', hex: 0x556b2f },
  { name: 'Dandelion White', hex: 0xf4f1e6 },
  { name: 'Soot', hex: 0x2b2b2b },
];

let paintState: { ctx: PanelCtx; sw: { set(hex: number): void } } | null = null;

export const craftPaintPanel: Panel = {
  id: 'craft-paint',
  label: 'Paint',
  icon: '🎨',
  appliesTo: isCraftKind,
  build(ctx: PanelCtx): HTMLElement {
    const wrap = document.createElement('div');
    wrap.appendChild(sectionLabel('Hull & body colour'));
    const sw = swatchRow({
      swatches: CRAFT_SWATCHES,
      value: ctx.draft().paint,
      custom: true,
      onPick: (hex) => ctx.patch({ paint: hex }),
    });
    wrap.appendChild(sw.el);
    const note = document.createElement('div');
    note.style.cssText = 'font-size:12px;opacity:0.8;margin-top:8px;';
    note.textContent = `A new coat: ${CRAFT_PAINT_PRICE} 🌰`;
    wrap.appendChild(note);
    paintState = { ctx, sw };
    return wrap;
  },
  refresh(): void {
    if (paintState) paintState.sw.set(paintState.ctx.draft().paint);
  },
};

let draft: CraftTune = { ...NO_TUNE };
/** The tune being edited in the open shop (craftShop.ts sets it on open, the Tune tab changes it). */
export function getTuneDraft(): CraftTune { return draft; }
export function setTuneDraft(t: CraftTune): void { draft = { ...t }; }

let tuneState: { ctx: PanelCtx; el: HTMLElement } | null = null;

function regimeOf(kind: VehicleKind): 'sea' | 'air' {
  return VEHICLES[kind].boat === true ? 'sea' : 'air';
}

function tuneApplies(kind: VehicleKind): boolean {
  return isCraftKind(kind) && (VEHICLES[kind].boat === true || !!VEHICLES[kind].air);
}

/** One stat: name, blurb, level pips (filled = the draft, green = owned), the effect and the 44 px − / + buttons. */
function tuneRow(def: CraftStatDef, owned: CraftTune, ctx: PanelCtx): HTMLElement {
  const level = draft[def.id];
  const row = document.createElement('div');
  row.className = 'gz-slider';

  const top = document.createElement('div');
  top.className = 'gz-slider-top';
  const name = document.createElement('span');
  name.className = 'gz-slider-label';
  name.textContent = def.name;
  const effect = document.createElement('span');
  effect.className = 'gz-slider-val';
  effect.textContent = `+${Math.round((statMult(def.id, level) - 1) * 100)}%`;
  top.append(name, effect);

  const blurb = document.createElement('div');
  blurb.className = 'gz-slider-blurb';
  blurb.textContent = def.blurb;

  const pips = document.createElement('div');
  pips.setAttribute('aria-label', `Level ${level} of ${MAX_TUNE_LEVEL}`);
  for (let i = 1; i <= MAX_TUNE_LEVEL; i++) {
    const pip = document.createElement('span');
    pip.className = i <= owned[def.id] ? 'craft-pip owned' : 'craft-pip';
    pip.textContent = i <= level ? '●' : '○';
    pips.appendChild(pip);
  }

  const controls = document.createElement('div');
  controls.className = 'craft-tune-row';
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'gz-btn gz-btn-ghost';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Lower ${def.name}`);
  minus.disabled = level <= 0;
  minus.addEventListener('click', () => {
    const cur = draft[def.id];
    if (cur <= 0) return;
    setTuneDraft({ ...draft, [def.id]: cur - 1 });
    ctx.patch({});
  });
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'gz-btn';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Raise ${def.name}`);
  plus.disabled = level >= MAX_TUNE_LEVEL;
  plus.addEventListener('click', () => {
    const cur = draft[def.id];
    if (cur >= MAX_TUNE_LEVEL) return;
    setTuneDraft({ ...draft, [def.id]: cur + 1 });
    ctx.patch({});
  });
  const next = document.createElement('span');
  next.style.cssText = 'font-size:12px;font-weight:700;color:#ffd23f;font-variant-numeric:tabular-nums;';
  next.textContent = level >= MAX_TUNE_LEVEL ? 'Max' : `Next ${def.prices[level]} 🌰`;
  controls.append(minus, plus, next);

  row.append(top, blurb, pips, controls);
  return row;
}

function renderTune(): void {
  if (!tuneState) return;
  const { ctx, el } = tuneState;
  const owned = getCraftTune(ctx.kind);
  el.innerHTML = '';
  for (const def of statsFor(regimeOf(ctx.kind))) el.appendChild(tuneRow(def, owned, ctx));
}

export const craftTunePanel: Panel = {
  id: 'craft-tune',
  label: 'Tune',
  icon: '🔧',
  appliesTo: tuneApplies,
  build(ctx: PanelCtx): HTMLElement {
    const el = document.createElement('div');
    tuneState = { ctx, el };
    renderTune();
    return el;
  },
  refresh(): void {
    renderTune();
  },
};

/** Register both tabs with the Glaze registry (order 60 and 70). Safe to call more than once. */
export function registerCraftPanels(): void {
  registerGlazePanel(craftPaintPanel, 60);
  registerGlazePanel(craftTunePanel, 70);
}
