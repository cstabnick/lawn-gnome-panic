// The "make your household" start screen shown at start. Resolves when the player picks.
import type { NewHouseholdOptions, TraitId } from './types';
import { TRAITS, START_FUNDS } from './config';

export interface CreateInput {
  /** The gnome's name from @lawn/gnome (getMyGnome()?.name), if the player made one. */
  defaultGnomeName: string | null;
  /** Set when a save exists: the screen offers "Continue" (household name, gnome name, day number) next to "New household". */
  saved: { householdName: string; gnomeName: string; day: number } | null;
}

// Gnome surnames are soil, tools and household things; first names are plants (see docs/lore/canon.md).
const SURNAMES = ['Trowelby', 'Dibblecombe', 'Hoeworth', 'Compostwick', 'Rakesby', 'Spadeford', 'Loamley', 'Stakeney'];
const GNOME_NAMES = ['Sorrel', 'Clover', 'Yarrow', 'Hazel', 'Basil', 'Thyme', 'Mallow', 'Nettle'];
const TRAIT_ORDER: TraitId[] = ['neat', 'glutton', 'sleepy', 'goofy', 'hustler'];
const MAX_NAME = 24;

const CSS = `
#snigms-create { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000; overflow-y: auto; -webkit-overflow-scrolling: touch;
  box-sizing: border-box; display: flex; justify-content: center; align-items: flex-start;
  padding: calc(16px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));
  background: radial-gradient(circle at 50% 20%, #e4f7cf 0%, #9ccb7c 55%, #4f7a3a 100%);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #26351b; }
#snigms-create * { box-sizing: border-box; }
#snigms-create .sc-card { width: 100%; max-width: 480px; background: #fffaf0; border-radius: 18px; padding: 20px;
  box-shadow: 0 10px 30px rgba(20, 40, 10, 0.35); }
#snigms-create .sc-hat { width: 0; height: 0; margin: 14px auto 6px; position: relative;
  border-left: 44px solid transparent; border-right: 44px solid transparent; border-bottom: 84px solid #c0392b; }
#snigms-create .sc-hat::before { content: ''; position: absolute; left: -12px; top: -26px; width: 24px; height: 24px; border-radius: 50%; background: #fff6e0; }
#snigms-create .sc-hat::after { content: ''; position: absolute; left: -58px; top: 78px; width: 116px; height: 14px; border-radius: 7px; background: #8b5e34; }
#snigms-create h1 { margin: 22px 0 2px; text-align: center; font-size: 34px; color: #3d6b2a; }
#snigms-create .sc-tag { margin: 0 0 16px; text-align: center; font-size: 15px; color: #4d5f3d; }
#snigms-create h2 { margin: 18px 0 8px; font-size: 16px; color: #3d6b2a; }
#snigms-create label { display: block; font-size: 14px; margin-bottom: 8px; color: #4d5f3d; }
#snigms-create input[type=text] { display: block; width: 100%; min-height: 44px; margin-top: 4px; padding: 8px 10px; font-size: 16px;
  border: 2px solid #b7cf9d; border-radius: 10px; background: #fff; color: #26351b; }
#snigms-create input[type=text]:focus { outline: none; border-color: #5b9a3c; }
#snigms-create .sc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
#snigms-create .sc-lots { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
#snigms-create .sc-card-btn { display: block; width: 100%; min-height: 44px; padding: 10px; text-align: left; font: inherit; color: inherit;
  background: #f1f7e6; border: 2px solid #c7dcaf; border-radius: 12px; cursor: pointer; }
#snigms-create .sc-card-btn b { display: block; font-size: 16px; margin-bottom: 2px; }
#snigms-create .sc-card-btn span { display: block; font-size: 14px; line-height: 1.35; color: #4d5f3d; }
#snigms-create .sc-card-btn.on { background: #d4ecb4; border-color: #3d8a2e; box-shadow: 0 0 0 2px #3d8a2e inset; }
#snigms-create .sc-primary { display: block; width: 100%; min-height: 48px; margin-top: 18px; padding: 10px 16px; font: inherit; font-size: 18px;
  font-weight: 700; color: #fff; background: #3d8a2e; border: 0; border-radius: 12px; cursor: pointer; }
#snigms-create .sc-primary:hover, #snigms-create .sc-primary:focus-visible { background: #2f6f22; }
#snigms-create .sc-continue { background: #b2651c; }
#snigms-create .sc-continue:hover, #snigms-create .sc-continue:focus-visible { background: #8f4f14; }
#snigms-create .sc-or { margin: 14px 0 0; text-align: center; font-size: 14px; color: #6a7a58; }
`;

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

function clean(s: string): string {
  return s.trim().slice(0, MAX_NAME);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function runCreate(root: HTMLElement, input: CreateInput): Promise<NewHouseholdOptions | 'continue'> {
  return new Promise((resolve) => {
    const defaultHousehold = `The ${pick(SURNAMES)}s`;
    const defaultGnome = clean(input.defaultGnomeName ?? '') || pick(GNOME_NAMES);

    let trait: TraitId = 'neat';
    let lot: NewHouseholdOptions['lot'] = 'starter';

    const overlay = el('div', { id: 'snigms-create' });
    overlay.appendChild(el('style', {}, CSS));
    const card = el('div', { class: 'sc-card' });
    overlay.appendChild(card);

    const finish = (result: NewHouseholdOptions | 'continue') => {
      overlay.remove();
      resolve(result);
    };

    // Hat icon and title.
    card.appendChild(el('div', { class: 'sc-hat', 'aria-hidden': 'true' }));
    card.appendChild(el('h1', {}, 'Snigms'));
    card.appendChild(el('p', { class: 'sc-tag' }, 'Build a little house on the lawn, and keep one gnome happy while it holds down a job.'));

    // Continue (when a save exists).
    if (input.saved) {
      const s = input.saved;
      const cont = el('button', { type: 'button', class: 'sc-primary sc-continue' }, `Continue: ${s.householdName}, ${s.gnomeName}, day ${s.day}`);
      cont.addEventListener('click', () => finish('continue'));
      card.appendChild(cont);
      card.appendChild(el('p', { class: 'sc-or' }, 'or start a new household below'));
    }

    // Names.
    const householdInput = el('input', { type: 'text', maxlength: String(MAX_NAME), value: defaultHousehold, 'aria-label': 'Household name' });
    const gnomeInput = el('input', { type: 'text', maxlength: String(MAX_NAME), value: defaultGnome, 'aria-label': 'Gnome name' });
    const householdLabel = el('label', {}, 'Household name');
    householdLabel.appendChild(householdInput);
    const gnomeLabel = el('label', {}, 'Gnome name');
    gnomeLabel.appendChild(gnomeInput);
    card.appendChild(el('h2', {}, 'Your household'));
    card.appendChild(householdLabel);
    card.appendChild(gnomeLabel);

    // Traits.
    card.appendChild(el('h2', {}, 'Personality'));
    const traitGrid = el('div', { class: 'sc-grid', role: 'group', 'aria-label': 'Trait' });
    const traitButtons = new Map<TraitId, HTMLButtonElement>();
    for (const id of TRAIT_ORDER) {
      const def = TRAITS[id];
      const btn = el('button', { type: 'button', class: 'sc-card-btn', 'aria-pressed': 'false' });
      btn.appendChild(el('b', {}, def.name));
      btn.appendChild(el('span', {}, def.blurb));
      btn.addEventListener('click', () => {
        trait = id;
        syncTraits();
      });
      traitButtons.set(id, btn);
      traitGrid.appendChild(btn);
    }
    card.appendChild(traitGrid);

    const syncTraits = () => {
      for (const [id, btn] of traitButtons) {
        const on = id === trait;
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    };

    // Lots.
    card.appendChild(el('h2', {}, 'Where to live'));
    const lotGrid = el('div', { class: 'sc-lots', role: 'group', 'aria-label': 'Lot' });
    const lotButtons = new Map<NewHouseholdOptions['lot'], HTMLButtonElement>();
    const addLot = (id: NewHouseholdOptions['lot'], title: string, blurb: string) => {
      const btn = el('button', { type: 'button', class: 'sc-card-btn', 'aria-pressed': 'false' });
      btn.appendChild(el('b', {}, title));
      btn.appendChild(el('span', {}, blurb));
      btn.addEventListener('click', () => {
        lot = id;
        syncLots();
      });
      lotButtons.set(id, btn);
      lotGrid.appendChild(btn);
    };
    addLot('starter', 'Starter cottage', `A ready two-room cottage. ${START_FUNDS.starter} acorns to furnish it.`);
    addLot('empty', 'Empty lot', `${START_FUNDS.empty} acorns. Build it all yourself.`);
    card.appendChild(lotGrid);

    const syncLots = () => {
      for (const [id, btn] of lotButtons) {
        const on = id === lot;
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    };

    syncTraits();
    syncLots();

    // Move in.
    const moveIn = el('button', { type: 'button', class: 'sc-primary' }, 'Move in');
    moveIn.addEventListener('click', () => {
      finish({
        householdName: clean(householdInput.value) || defaultHousehold,
        gnomeName: clean(gnomeInput.value) || defaultGnome,
        trait,
        lot,
      });
    });
    card.appendChild(moveIn);

    root.appendChild(overlay);
  });
}
