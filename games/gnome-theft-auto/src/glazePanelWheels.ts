// Pay 'n' Glaze shop panel: wheels: tyres, rims, size, camber and ride height.
import { CAMBER_MAX, CAMBER_MIN, PAINT_SWATCHES, RIMS, TYRES, WHEEL_SIZE_MAX, WHEEL_SIZE_MIN } from '@lawn/glaze';
import type { ModDef, RimId, TyreId } from '@lawn/glaze';
import { glazeThumb, optionGrid, ownedBadge, sectionLabel, sliderRow, swatchRow } from './glazeUi';
import type { OptionItem, Panel, PanelCtx } from './glazeUi';

/** The widgets built by `build`, kept so `refresh` can re-mark them from the draft. */
interface WheelRefs {
  ride: { set(v: number): void };
  tyre: { set(v: TyreId): void };
  rim: { set(v: RimId): void };
  rimColor: { set(hex: number): void };
  size: { set(v: number): void };
  camberFront: { set(v: number): void };
  camberRear: { set(v: number): void };
}

let ctx: PanelCtx | null = null;
let refs: WheelRefs | null = null;

/** Catalogue entries as option-card items, with the id narrowed to the given product-id type. */
const asItems = <T extends string>(mods: readonly ModDef[]): OptionItem<T>[] =>
  mods.map((m) => ({ id: m.id as T, name: m.name, blurb: m.blurb, price: m.price }));

const note = (text: string): HTMLElement => {
  const el = document.createElement('div');
  el.className = 'gz-slider-blurb';
  el.textContent = text;
  return el;
};

export const wheelsPanel: Panel = {
  id: 'wheels',
  label: 'Wheels',
  icon: '🛞',
  build(c: PanelCtx): HTMLElement {
    ctx = c;
    const d = c.draft();

    const ride = sliderRow({
      label: 'Ride height',
      blurb: 'Slam it onto the tyres or jack it up. Lower is steadier; higher rolls more. 15 🌰 to change.',
      min: -1,
      max: 1,
      step: 0.05,
      value: d.rideHeight,
      format: (v) => (v === 0 ? 'Stock' : (v < 0 ? 'Slammed ' : 'Lifted ') + Math.round(Math.abs(v) * 100) + '%'),
      onInput: (v) => c.patch({ rideHeight: v }),
    });

    const tyre = optionGrid<TyreId>({
      items: asItems<TyreId>(TYRES),
      value: d.tyre,
      onPick: (id) => c.patch({ tyre: id }),
      thumb: glazeThumb('tyre'),
      badge: ownedBadge(() => c.owned().tyre),
    });

    const rim = optionGrid<RimId>({
      items: asItems<RimId>(RIMS),
      value: d.rim,
      onPick: (id) => c.patch({ rim: id }),
      thumb: glazeThumb('rim'),
      badge: ownedBadge(() => c.owned().rim),
    });

    const rimColor = swatchRow({
      swatches: [
        { name: 'Chrome', hex: 0xc8ccd2 },
        { name: 'Gold', hex: 0xe0b030 },
        { name: 'Gunmetal', hex: 0x4a4f57 },
        { name: 'Matte Black', hex: 0x1c1c22 },
        ...PAINT_SWATCHES.slice(0, 6),
      ],
      value: d.rimColor,
      custom: true,
      onPick: (hex) => c.patch({ rimColor: hex }),
    });

    const size = sliderRow({
      label: 'Wheel size',
      blurb: 'Bigger wheels lift the body. 25 🌰 to change.',
      min: WHEEL_SIZE_MIN,
      max: WHEEL_SIZE_MAX,
      step: 0.05,
      value: d.wheelSize,
      format: (v) => Math.round(v * 100) + '%',
      onInput: (v) => c.patch({ wheelSize: v }),
    });

    const camberFront = sliderRow({
      label: 'Front camber',
      blurb: 'Negative leans the tops of the wheels in. 15 🌰 to change.',
      min: CAMBER_MIN,
      max: CAMBER_MAX,
      step: 0.5,
      value: d.camberFront,
      format: (v) => v.toFixed(1) + '°',
      onInput: (v) => c.patch({ camberFront: v }),
    });

    const camberRear = sliderRow({
      label: 'Rear camber',
      blurb: 'Rear wheels, set apart from the front.',
      min: CAMBER_MIN,
      max: CAMBER_MAX,
      step: 0.5,
      value: d.camberRear,
      format: (v) => v.toFixed(1) + '°',
      onInput: (v) => c.patch({ camberRear: v }),
    });

    refs = { ride, tyre, rim, rimColor, size, camberFront, camberRear };

    const root = document.createElement('div');
    root.append(
      sectionLabel('Tyres'), tyre.el,
      sectionLabel('Rims'), rim.el,
      sectionLabel('Rim colour'), rimColor.el, note('Rim colour: 10 🌰'),
      sectionLabel('Wheel size'), size.el,
      sectionLabel('Ride height'), ride.el,
      sectionLabel('Camber'), camberFront.el, camberRear.el,
    );
    return root;
  },
  refresh(): void {
    if (!ctx || !refs) return;
    const d = ctx.draft();
    refs.ride.set(d.rideHeight);
    refs.tyre.set(d.tyre);
    refs.rim.set(d.rim);
    refs.rimColor.set(d.rimColor);
    refs.size.set(d.wheelSize);
    refs.camberFront.set(d.camberFront);
    refs.camberRear.set(d.camberRear);
  },
};
