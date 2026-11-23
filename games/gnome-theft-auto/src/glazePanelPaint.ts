// Pay 'n' Glaze shop panel: paint finish, body colour, sprays and underglow.
// The export name and the Panel shape (glazeUi.ts) are final.
import {
  DECALS,
  FINISHES,
  PAINT_SWATCHES,
  PRICES,
  UNDERGLOW_COLORS,
  type DecalId,
  type FinishId,
} from '@lawn/glaze';
import { optionGrid, sectionLabel, sliderRow, swatchRow, type OptionItem, type Panel, type PanelCtx } from './glazeUi';

/** The spray colour choices: the body colours plus chalk white and soot black. */
const SPRAY_SWATCHES: readonly { name: string; hex: number }[] = [
  ...PAINT_SWATCHES,
  { name: 'Chalk White', hex: 0xffffff },
  { name: 'Soot Black', hex: 0x1c1c22 },
];

/** Ids of the underglow cards: 'off' for none, 'g<i>' for UNDERGLOW_COLORS[i]. */
const underglowId = (hex: number | null): string => {
  if (hex === null) return 'off';
  const i = UNDERGLOW_COLORS.findIndex((c) => c.hex === hex);
  return i < 0 ? '' : `g${i}`;
};

let current: PanelCtx | null = null;

// Widgets kept so `refresh` can re-mark them.
let bodySwatch: { set(hex: number): void } | null = null;
let finishGrid: { set(v: FinishId): void } | null = null;
let decalGrid: { set(v: string): void } | null = null;
let sprayBox: HTMLElement | null = null;
let sprayColour: { set(hex: number): void } | null = null;
let numberBox: HTMLElement | null = null;
let numberSlider: { set(v: number): void } | null = null;
let underglowGrid: { set(v: string): void } | null = null;

export const paintPanel: Panel = {
  id: 'paint',
  label: 'Paint',
  icon: '🎨',
  build(ctx: PanelCtx): HTMLElement {
    current = ctx;
    const draft = ctx.draft();
    const root = document.createElement('div');

    // 1. Body colour.
    const body = swatchRow({
      swatches: PAINT_SWATCHES,
      value: draft.paint,
      custom: true,
      onPick: (hex) => ctx.patch({ paint: hex }),
    });
    bodySwatch = body;
    const repaint = document.createElement('div');
    repaint.className = 'gz-card-blurb';
    repaint.textContent = `Repaint: ${PRICES.paint} 🌰`;
    root.append(sectionLabel('Body colour'), body.el, repaint);

    // 2. Finish.
    const finishItems: OptionItem<FinishId>[] = FINISHES.map((f) => ({
      id: f.id as FinishId,
      name: f.name,
      blurb: f.blurb,
      price: f.price,
    }));
    const finish = optionGrid<FinishId>({
      items: finishItems,
      value: draft.finish,
      onPick: (id) => ctx.patch({ finish: id }),
    });
    finishGrid = finish;
    root.append(sectionLabel('Finish'), finish.el);

    // 3. Special paint sprays.
    const decalItems: OptionItem<string>[] = [
      { id: 'none', name: 'No spray', blurb: 'Plain panels.', price: 0 },
      ...DECALS.map((d) => ({ id: d.id, name: d.name, blurb: d.blurb, price: d.price })),
    ];
    const decal = optionGrid<string>({
      items: decalItems,
      value: draft.decal,
      onPick: (id) => ctx.patch({ decal: id as DecalId | 'none' }),
    });
    decalGrid = decal;

    const colour = swatchRow({
      swatches: SPRAY_SWATCHES,
      value: draft.decalColor,
      custom: true,
      onPick: (hex) => ctx.patch({ decalColor: hex }),
    });
    sprayColour = colour;

    const number = sliderRow({
      label: 'Lucky number',
      blurb: 'The number painted on each flank.',
      min: 0,
      max: 99,
      step: 1,
      value: draft.decalNumber,
      format: (v) => String(Math.round(v)),
      onInput: (v) => ctx.patch({ decalNumber: Math.round(v) }),
    });
    numberSlider = number;
    numberBox = number.el;

    const spray = document.createElement('div');
    spray.append(sectionLabel('Spray colour'), colour.el, number.el);
    sprayBox = spray;

    root.append(sectionLabel('Special paint sprays'), decal.el, spray);

    // 4. Neon underglow.
    const glowItems: OptionItem<string>[] = [
      { id: 'off', name: 'No glow', blurb: 'Dark underneath.', price: 0 },
      ...UNDERGLOW_COLORS.map((c, i) => ({
        id: 'g' + i,
        name: c.name,
        blurb: 'A neon glow under the chassis.',
        price: PRICES.underglow,
      })),
    ];
    const glow = optionGrid<string>({
      items: glowItems,
      value: underglowId(draft.underglow),
      onPick: (id) => {
        if (id === 'off') {
          ctx.patch({ underglow: null });
          return;
        }
        const i = Number(id.slice(1));
        const c = UNDERGLOW_COLORS[i];
        if (c) ctx.patch({ underglow: c.hex });
      },
    });
    underglowGrid = glow;
    root.append(sectionLabel('Neon underglow'), glow.el);

    refreshSprayRows(draft.decal);
    return root;
  },
  refresh(): void {
    if (!current) return;
    const draft = current.draft();
    bodySwatch?.set(draft.paint);
    finishGrid?.set(draft.finish);
    decalGrid?.set(draft.decal);
    sprayColour?.set(draft.decalColor);
    numberSlider?.set(draft.decalNumber);
    underglowGrid?.set(underglowId(draft.underglow));
    refreshSprayRows(draft.decal);
  },
};

/** Shows the spray colour row while a spray is picked, and the lucky number only for the 'number' spray. */
function refreshSprayRows(decal: string): void {
  if (sprayBox) sprayBox.style.display = decal === 'none' ? 'none' : '';
  if (numberBox) numberBox.style.display = decal === 'number' ? '' : 'none';
}
