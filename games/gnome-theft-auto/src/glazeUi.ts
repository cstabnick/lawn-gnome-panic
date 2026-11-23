// Shared building blocks for the Pay 'n' Glaze shop panels (option cards, sliders, colour swatches) and the panel contract.
// STUB: the shop-widgets issue fills the bodies; the exported names and shapes are final. Plain DOM, no framework.
import type { Loadout } from '@lawn/glaze';
import type { VehicleKind } from './types';

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
}

/** One tab of the shop. `build` is called once per shop open; `refresh` after any `patch` so the panel can re-mark its selection. */
export interface Panel {
  id: string;
  label: string;
  /** A short emoji for the tab button. */
  icon: string;
  build(ctx: PanelCtx): HTMLElement;
  refresh?(): void;
}

export interface OptionItem<T extends string> { id: T; name: string; blurb: string; price: number }

/** A responsive grid of option cards (min 44 px touch targets; name, price in acorns or "Free", blurb as a tooltip/second line). One card is `.active`. `thumb` may add a small preview element to a card. */
export function optionGrid<T extends string>(opts: {
  items: readonly OptionItem<T>[];
  value: T;
  onPick(id: T): void;
  thumb?(id: T): HTMLElement | null;
}): { el: HTMLElement; set(v: T): void } {
  void opts;
  return { el: document.createElement('div'), set() { /* stub */ } };
}

/** A labelled range slider with a live value readout. */
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
  void opts;
  return { el: document.createElement('div'), set() { /* stub */ } };
}

/** A row of colour swatches (44 px round buttons, the name as a tooltip) plus, when `custom`, a native colour input. */
export function swatchRow(opts: {
  swatches: readonly { name: string; hex: number }[];
  value: number;
  custom?: boolean;
  onPick(hex: number): void;
}): { el: HTMLElement; set(hex: number): void } {
  void opts;
  return { el: document.createElement('div'), set() { /* stub */ } };
}

/** A section heading line used inside panels. */
export function sectionLabel(text: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'gz-sec';
  el.textContent = text;
  return el;
}

/** Stylesheet for everything above and for the shop frame; `#gta-glaze ...` selectors, injected once by glazeShop.ts. */
export const GLAZE_CSS = '';
