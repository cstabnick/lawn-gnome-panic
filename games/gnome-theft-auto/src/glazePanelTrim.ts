// Pay 'n' Glaze shop panel: trim: grille, bumper, canopy, mirrors, exhaust and horn (with a horn preview).
import {
  BUMPERS,
  CANOPIES,
  EXHAUSTS,
  GRILLES,
  HORNS,
  MIRRORS,
  type BumperId,
  type CanopyId,
  type ExhaustId,
  type GrilleId,
  type HornId,
  type Loadout,
  type ModDef,
  type MirrorId,
} from '@lawn/glaze';
import { glazeThumb, optionGrid, ownedBadge, sectionLabel, type OptionItem, type Panel, type PanelCtx } from './glazeUi';
import { playHornVariant } from './audio';

/** Catalogue entries as option-card items, typed to the id union they carry. */
const toItems = <T extends string>(defs: readonly ModDef[]): OptionItem<T>[] =>
  defs.map((d) => ({ id: d.id as T, name: d.name, blurb: d.blurb, price: d.price }));

let ctxRef: PanelCtx | null = null;
let setGrille: ((v: GrilleId) => void) | null = null;
let setBumper: ((v: BumperId) => void) | null = null;
let setCanopy: ((v: CanopyId | 'none') => void) | null = null;
let setMirror: ((v: MirrorId | 'none') => void) | null = null;
let setExhaust: ((v: ExhaustId | 'none') => void) | null = null;
let setHorn: ((v: HornId) => void) | null = null;

export const trimPanel: Panel = {
  id: 'trim',
  label: 'Trim',
  icon: '🔩',
  build(ctx: PanelCtx): HTMLElement {
    ctxRef = ctx;
    const draft = ctx.draft();

    const root = document.createElement('div');
    root.className = 'gz-panel-body';

    // 1. Grille
    const grilleGrid = optionGrid<GrilleId>({
      items: toItems<GrilleId>(GRILLES),
      value: draft.grille,
      onPick: (v) => ctxRef?.patch({ grille: v }),
      thumb: glazeThumb('grille'),
      badge: ownedBadge(() => ctx.owned().grille),
    });
    setGrille = grilleGrid.set;

    // 2. Bumper
    const bumperGrid = optionGrid<BumperId>({
      items: toItems<BumperId>(BUMPERS),
      value: draft.bumper,
      onPick: (v) => ctxRef?.patch({ bumper: v }),
      thumb: glazeThumb('bumper'),
      badge: ownedBadge(() => ctx.owned().bumper),
    });
    setBumper = bumperGrid.set;

    // 3. Canopy
    const canopyGrid = optionGrid<CanopyId | 'none'>({
      items: [
        { id: 'none', name: 'No canopy', blurb: 'Open to the sky.', price: 0 },
        ...toItems<CanopyId>(CANOPIES),
      ],
      value: draft.canopy,
      onPick: (v) => ctxRef?.patch({ canopy: v }),
      thumb: glazeThumb('canopy'),
      badge: ownedBadge(() => ctx.owned().canopy),
    });
    setCanopy = canopyGrid.set;

    // 4. Mirrors
    const mirrorGrid = optionGrid<MirrorId | 'none'>({
      items: [
        { id: 'none', name: 'No mirrors', blurb: 'Look straight ahead.', price: 0 },
        ...toItems<MirrorId>(MIRRORS),
      ],
      value: draft.mirror,
      onPick: (v) => ctxRef?.patch({ mirror: v }),
      thumb: glazeThumb('mirror'),
      badge: ownedBadge(() => ctx.owned().mirror),
    });
    setMirror = mirrorGrid.set;

    // 5. Exhaust
    const exhaustGrid = optionGrid<ExhaustId | 'none'>({
      items: [
        { id: 'none', name: 'Stock tailpipe', blurb: 'The tailpipe it came with.', price: 0 },
        ...toItems<ExhaustId>(EXHAUSTS),
      ],
      value: draft.exhaust,
      onPick: (v) => ctxRef?.patch({ exhaust: v }),
      thumb: glazeThumb('exhaust'),
      badge: ownedBadge(() => ctx.owned().exhaust),
    });
    setExhaust = exhaustGrid.set;

    // 6. Horn: picking one also plays it, and the Honk button replays the selected horn.
    const hornGrid = optionGrid<HornId>({
      items: toItems<HornId>(HORNS),
      value: draft.horn,
      onPick: (v) => {
        playHornVariant(v);
        ctxRef?.patch({ horn: v });
      },
      badge: ownedBadge(() => ctx.owned().horn),
    });
    setHorn = hornGrid.set;

    const honkBtn = document.createElement('button');
    honkBtn.type = 'button';
    honkBtn.className = 'gz-btn gz-btn-ghost';
    honkBtn.textContent = 'Honk';
    honkBtn.addEventListener('click', () => {
      if (ctxRef) playHornVariant(ctxRef.draft().horn);
    });

    root.append(
      sectionLabel('Grille'), grilleGrid.el,
      sectionLabel('Bumper'), bumperGrid.el,
      sectionLabel('Canopy'), canopyGrid.el,
      sectionLabel('Mirrors'), mirrorGrid.el,
      sectionLabel('Exhaust'), exhaustGrid.el,
      sectionLabel('Horn'), hornGrid.el, honkBtn,
    );
    return root;
  },
  refresh(): void {
    if (!ctxRef) return;
    const draft: Loadout = ctxRef.draft();
    setGrille?.(draft.grille);
    setBumper?.(draft.bumper);
    setCanopy?.(draft.canopy);
    setMirror?.(draft.mirror);
    setExhaust?.(draft.exhaust);
    setHorn?.(draft.horn);
  },
};
