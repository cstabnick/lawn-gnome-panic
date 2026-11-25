// The Repair tab (E08, L90) for Pay 'n' Glaze and the Wingwright's Slipway: price from the missing hit points and the
// damage level, one button that fixes the vehicle on the stage. Registered in glazePanels.ts at order 60.
import type { Panel, PanelCtx } from './glazeUi';
import { sectionLabel } from './glazeUi';
import { dealerPrice, UNLISTED_VALUE } from './dealers/config';
import { repairVehicle } from './vehicles';
import type { Vehicle, VehicleKind } from './types';

/** Repair pricing (Acorns). */
export const REPAIR = {
  /** Any repair at all costs at least this. */
  base: 10,
  /** Per whole vehicle of missing hit points (hp 0 -> 1), scaled by the model's tier. */
  perHp: 120,
  /** Per damage level showing (vehicles.ts v.damage). */
  perLevel: 15,
} as const;

/** Price of repairing a vehicle with hp (0..1) and damage level `damage` of model `kind`; 0 when there is nothing to fix. */
export function repairQuote(hp: number, damage: number, kind: VehicleKind): number {
  const h = Math.min(1, Math.max(0, hp));
  if (h >= 0.999 && damage <= 0) return 0;
  const value = dealerPrice(kind, null) ?? UNLISTED_VALUE;
  const tier = Math.min(2.5, Math.max(0.5, value / 1000));
  return Math.round(REPAIR.base + REPAIR.perHp * (1 - h) * tier + REPAIR.perLevel * Math.max(0, damage));
}

/** Set by the game: called after every repair from the tab (achievements). */
let onRepair: ((kind: VehicleKind, paid: number) => void) | null = null;
export function setRepairHook(cb: ((kind: VehicleKind, paid: number) => void) | null): void {
  onRepair = cb;
}
export function repairHook(): ((kind: VehicleKind, paid: number) => void) | null {
  return onRepair;
}

/** The health bar colour for a hit-point percentage. */
function healthColour(pct: number): string {
  if (pct > 60) return '#7bd67b';
  if (pct > 30) return '#ffb347';
  return '#ff5a3c';
}

let ctxRef: PanelCtx | null = null;
let shownEls: HTMLElement[] = [];
let unavailableEl: HTMLElement | null = null;
let nameEl: HTMLElement | null = null;
let barFill: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let button: HTMLButtonElement | null = null;

/** Pull the live numbers from the vehicle and paint the tab. */
function paint(): void {
  if (!ctxRef || !nameEl || !barFill || !statusEl || !button || !unavailableEl) return;
  const available = !!(ctxRef.vehicle && ctxRef.spend);
  unavailableEl.style.display = available ? 'none' : '';
  for (const el of shownEls) el.style.display = available ? '' : 'none';
  const v: Vehicle | undefined = ctxRef.vehicle?.();
  if (!available || !v) return;

  const pct = Math.round(Math.min(1, Math.max(0, v.hp)) * 100);
  nameEl.textContent = v.spec.name;
  barFill.style.width = `${pct}%`;
  barFill.style.background = healthColour(pct);
  statusEl.textContent = v.damage > 0 ? `Health ${pct} % · damage level ${v.damage}` : `Health ${pct} %`;

  const q = repairQuote(v.hp, v.damage, v.kind);
  button.textContent = q > 0 ? `Repair · ${q} 🌰` : 'Nothing to fix';
  button.disabled = q <= 0 || ctxRef.acorns() < q;
}

function onRepairClick(): void {
  if (!ctxRef?.vehicle || !ctxRef.spend) return;
  const v = ctxRef.vehicle();
  const q = repairQuote(v.hp, v.damage, v.kind);
  if (q <= 0) return;
  if (!ctxRef.spend(q, "Pay 'n' Glaze repair")) {
    ctxRef.toast?.('Not enough Acorns.');
    return;
  }
  repairVehicle(v);
  ctxRef.toast?.('Dents out, cracks filled. Good as new.');
  repairHook()?.(v.kind, q);
  paint();
}

export const repairPanel: Panel = {
  id: 'repair',
  label: 'Repair',
  icon: '🔧',
  build(ctx: PanelCtx): HTMLElement {
    ctxRef = ctx;
    const root = document.createElement('div');
    root.className = 'gz-panel-body';

    const label = sectionLabel('Repair');
    nameEl = document.createElement('div');
    nameEl.className = 'gz-slider-top';

    const track = document.createElement('div');
    track.style.cssText = 'width:100%;height:10px;border-radius:5px;background:rgba(255,255,255,0.14);overflow:hidden;';
    barFill = document.createElement('div');
    barFill.style.cssText = 'height:100%;width:100%;border-radius:5px;';
    track.appendChild(barFill);

    statusEl = document.createElement('div');
    statusEl.className = 'gz-slider-blurb';

    button = document.createElement('button');
    button.type = 'button';
    button.className = 'gz-btn gz-btn-buy';
    button.style.cssText = 'width:100%;min-height:44px;margin-top:6px;';
    button.addEventListener('click', onRepairClick);

    unavailableEl = document.createElement('div');
    unavailableEl.className = 'gz-slider-blurb';
    unavailableEl.textContent = 'Repairs are not available here.';

    shownEls = [label, nameEl, track, statusEl, button];
    root.append(...shownEls, unavailableEl);
    paint();
    return root;
  },
  refresh(): void {
    paint();
  },
};
