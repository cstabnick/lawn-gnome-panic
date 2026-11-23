// Pay 'n' Glaze shop panel: body: spoiler, seat, steering wheel, hood ornament and extras.
import {
  EXTRAS,
  MAX_EXTRAS,
  ORNAMENTS,
  SEATS,
  SPOILERS,
  STEERS,
  type ExtraId,
  type Loadout,
  type ModDef,
  type OrnamentId,
  type SeatId,
  type SpoilerId,
  type SteerId,
} from '@lawn/glaze';
import { glazeThumb, optionGrid, ownedBadge, sectionLabel, type OptionItem, type Panel, type PanelCtx } from './glazeUi';

/** Catalogue entries as option-card items, typed to the id union they carry. */
const toItems = <T extends string>(defs: readonly ModDef[]): OptionItem<T>[] =>
  defs.map((d) => ({ id: d.id as T, name: d.name, blurb: d.blurb, price: d.price }));

let ctxRef: PanelCtx | null = null;
let setSpoiler: ((v: SpoilerId | 'none') => void) | null = null;
let setSeat: ((v: SeatId | 'none') => void) | null = null;
let setSteer: ((v: SteerId) => void) | null = null;
let setOrnament: ((v: OrnamentId | 'none') => void) | null = null;
/** The extras cards, in the order of EXTRAS, with the button each one toggles. */
let extraCards: { id: ExtraId; btn: HTMLButtonElement }[] = [];
let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const showToast = (text: string): void => {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add('show');
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl?.classList.remove('show');
    toastTimer = null;
  }, 2400);
};

const markExtras = (chosen: readonly ExtraId[]): void => {
  for (const c of extraCards) {
    const on = chosen.includes(c.id);
    c.btn.classList.toggle('active', on);
    c.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
};

const toggleExtra = (id: ExtraId): void => {
  if (!ctxRef) return;
  const current = ctxRef.draft().extras;
  if (current.includes(id)) {
    ctxRef.patch({ extras: current.filter((e) => e !== id) });
  } else {
    if (current.length >= MAX_EXTRAS) {
      showToast('Four extras at most: remove one first.');
      return;
    }
    ctxRef.patch({ extras: [...current, id] });
  }
};

const buildExtras = (): HTMLElement => {
  const grid = document.createElement('div');
  grid.className = 'gz-grid';
  extraCards = [];
  for (const d of EXTRAS) {
    const id = d.id as ExtraId;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-card';
    btn.title = d.blurb;

    const name = document.createElement('span');
    name.className = 'gz-card-name';
    name.textContent = d.name;

    const price = document.createElement('span');
    price.className = 'gz-card-price';
    price.textContent = d.price === 0 ? 'Free' : `${d.price} 🌰`;

    const blurb = document.createElement('span');
    blurb.className = 'gz-card-blurb';
    blurb.textContent = d.blurb;

    btn.append(name, price, blurb);
    btn.addEventListener('click', () => toggleExtra(id));
    extraCards.push({ id, btn });
    grid.appendChild(btn);
  }
  return grid;
};

export const bodyPanel: Panel = {
  id: 'body',
  label: 'Body',
  icon: '🧩',
  build(ctx: PanelCtx): HTMLElement {
    ctxRef = ctx;
    const draft = ctx.draft();

    const root = document.createElement('div');
    root.className = 'gz-panel-body';

    // 1. Spoiler
    const spoilerGrid = optionGrid<SpoilerId | 'none'>({
      items: [
        { id: 'none', name: 'No spoiler', blurb: 'Clean tail.', price: 0 },
        ...toItems<SpoilerId>(SPOILERS),
      ],
      value: draft.spoiler,
      onPick: (v) => ctxRef?.patch({ spoiler: v }),
      thumb: glazeThumb('spoiler'),
      badge: ownedBadge(() => ctx.owned().spoiler),
    });
    setSpoiler = spoilerGrid.set;

    // 2. Seat
    const seatGrid = optionGrid<SeatId | 'none'>({
      items: [
        { id: 'none', name: 'Stock seat', blurb: 'The seat it came with.', price: 0 },
        ...toItems<SeatId>(SEATS),
      ],
      value: draft.seat,
      onPick: (v) => ctxRef?.patch({ seat: v }),
      thumb: glazeThumb('seat'),
      badge: ownedBadge(() => ctx.owned().seat),
    });
    setSeat = seatGrid.set;

    // 3. Steering wheel
    const steerGrid = optionGrid<SteerId>({
      items: toItems<SteerId>(STEERS),
      value: draft.steer,
      onPick: (v) => ctxRef?.patch({ steer: v }),
      thumb: glazeThumb('steer'),
      badge: ownedBadge(() => ctx.owned().steer),
    });
    setSteer = steerGrid.set;
    const steerNote = document.createElement('div');
    steerNote.className = 'gz-slider-blurb';
    steerNote.textContent = 'Your gnome holds the wheel, and it turns with the steering.';

    // 4. Hood ornament
    const ornamentGrid = optionGrid<OrnamentId | 'none'>({
      items: [
        { id: 'none', name: 'No ornament', blurb: 'A bare bonnet.', price: 0 },
        ...toItems<OrnamentId>(ORNAMENTS),
      ],
      value: draft.ornament,
      onPick: (v) => ctxRef?.patch({ ornament: v }),
      thumb: glazeThumb('ornament'),
      badge: ownedBadge(() => ctx.owned().ornament),
    });
    setOrnament = ornamentGrid.set;

    // 5. Extras (multi-select, up to MAX_EXTRAS)
    const extrasGrid = buildExtras();
    markExtras(draft.extras);

    toastEl = document.createElement('div');
    toastEl.className = 'gz-toast';
    toastEl.setAttribute('role', 'status');

    root.append(
      sectionLabel('Spoiler'), spoilerGrid.el,
      sectionLabel('Seat'), seatGrid.el,
      sectionLabel('Steering wheel'), steerGrid.el, steerNote,
      sectionLabel('Hood ornament'), ornamentGrid.el,
      sectionLabel(`Extras (up to ${MAX_EXTRAS})`), extrasGrid,
      toastEl,
    );
    return root;
  },
  refresh(): void {
    if (!ctxRef) return;
    const draft: Loadout = ctxRef.draft();
    setSpoiler?.(draft.spoiler);
    setSeat?.(draft.seat);
    setSteer?.(draft.steer);
    setOrnament?.(draft.ornament);
    markExtras(draft.extras);
  },
};
