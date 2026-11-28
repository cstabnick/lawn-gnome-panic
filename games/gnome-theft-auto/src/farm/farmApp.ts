// The Farm app on the Gnomlet tablet (E16 D4): Windfall Croft at a glance. Not owned: the sale line and where to buy it.
// Owned: the eight beds, the oak, the crate and the seed picker. No farming actions here: the croft is worked in person.
import { registerGnomletApp } from '../gnomlet/registry';
import type { FarmRuntime } from './runtime';
import { bedSecondsLeft, bedStatus, oakReady, oakSecondsLeft } from './state';
import { BED_CROPS, BEDS, CROPS, FARM, cropDef, type BedStatus, type FarmState } from './types';

const FARM_APP_ID = 'farm';
const REFRESH_MS = 1000;

const STATUS_COLOUR: Record<BedStatus, string> = {
  empty: '#7a7a6a',
  dry: '#b7791f',
  growing: '#2f855a',
  ripe: '#d69e2e',
};

const BOX_CSS = 'display:flex;flex-direction:column;gap:10px;padding:12px;font-size:15px;color:inherit;width:100%;'
  + 'box-sizing:border-box;overflow-y:auto;';
const CARD_CSS = 'display:flex;flex-direction:column;gap:4px;padding:10px;border:2px solid currentColor;border-radius:8px;'
  + 'box-sizing:border-box;min-width:0;';
const LINE_CSS = 'margin:0;overflow-wrap:anywhere;';
const BUTTON_CSS = 'min-height:44px;padding:6px 10px;font-size:14px;line-height:1.3;text-align:left;cursor:pointer;'
  + 'border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;width:100%;box-sizing:border-box;'
  + 'white-space:normal;';

/** m:ss from seconds (rounded up, so a timer never reads 0:00 while still growing). */
function mmss(seconds: number): string {
  const t = Math.ceil(seconds);
  const r = t % 60;
  return `${Math.floor(t / 60)}:${r < 10 ? '0' : ''}${r}`;
}

function el(tag: keyof HTMLElementTagNameMap, text?: string, css?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (css) e.style.cssText = css;
  return e;
}

/** Produce names for the crate line: "3 radishes", "1 pumpkin". */
function produceCount(name: string, n: number): string {
  return n === 1 ? `1 ${name.toLowerCase().replace(/s$/, '')}` : `${n} ${name.toLowerCase()}`;
}

function bedText(s: FarmState, bed: number): { title: string; status: string; st: BedStatus } {
  const b = s.beds[bed];
  const st = bedStatus(s, bed);
  if (!b.crop) return { title: 'Empty', status: `Empty: plant ${cropDef(s.seed).name.toLowerCase()}`, st };
  const title = cropDef(b.crop).name;
  if (st === 'ripe') return { title, status: 'Ripe!', st };
  if (st === 'dry') return { title, status: 'Needs water', st };
  return { title, status: `Growing ${mmss(bedSecondsLeft(s, bed))}`, st };
}

function oakText(s: FarmState): { status: string; ready: boolean } {
  if (!s.oak.planted) return { status: 'Not planted', ready: false };
  if (s.oak.stage < 2) return { status: `Growing ${mmss(oakSecondsLeft(s))}`, ready: false };
  if (oakReady(s)) return { status: 'Ready to shake!', ready: true };
  return { status: `Acorns in ${mmss(oakSecondsLeft(s))}`, ready: false };
}

function crateText(s: FarmState): string {
  const parts = CROPS.filter((c) => (s.crate[c.id] ?? 0) > 0).map((c) => produceCount(c.name, s.crate[c.id] ?? 0));
  return parts.length ? `Crate: ${parts.join(', ')}` : 'Crate: empty';
}

interface Screen {
  update(): void;
}

function buildSale(box: HTMLElement): Screen {
  box.appendChild(el('h3', FARM.name, 'margin:0;font-size:18px;overflow-wrap:anywhere;'));
  box.appendChild(el('p', FARM.blurb, LINE_CSS));
  box.appendChild(el('p', `${FARM.price.toLocaleString('en-GB')} Acorns: ${FARM.down} down, the rest a First Kiln Bank `
    + `loan at ${Math.round(FARM.interest * 100)}%`, `${LINE_CSS}font-weight:bold;`));
  box.appendChild(el('p', 'Buy it at the For Sale board by the croft gate in Cloverfield, or in the Ledger app.', LINE_CSS));
  return { update: () => undefined };
}

function buildOwned(box: HTMLElement, farm: FarmRuntime): Screen {
  box.appendChild(el('h3', FARM.name, 'margin:0;font-size:18px;overflow-wrap:anywhere;'));

  const grid = el('div', undefined, 'display:grid;grid-template-columns:1fr 1fr;gap:8px;');
  box.appendChild(grid);

  const beds = BEDS.map((bed) => {
    const card = el('div', undefined, CARD_CSS);
    const title = el('p', '', `${LINE_CSS}font-weight:bold;`);
    const status = el('p', '', LINE_CSS);
    card.append(title, status);
    grid.appendChild(card);
    return { card, title, status, index: bed.index };
  });

  const oakCard = el('div', undefined, `${CARD_CSS}grid-column:1 / -1;`);
  const oakTitle = el('p', 'Oak', `${LINE_CSS}font-weight:bold;`);
  const oakStatus = el('p', '', LINE_CSS);
  oakCard.append(oakTitle, oakStatus);
  grid.appendChild(oakCard);

  const crate = el('p', '', `${LINE_CSS}font-size:14px;`);
  box.appendChild(crate);

  box.appendChild(el('h4', 'Seed', 'margin:4px 0 0;font-size:15px;'));
  const picker = el('div', undefined, 'display:grid;grid-template-columns:1fr 1fr;gap:8px;');
  box.appendChild(picker);

  const seedButtons = BED_CROPS.map((id) => {
    const c = cropDef(id);
    const min = Number((c.growS / 60).toFixed(1));
    const b = el('button', `${c.name} · ${c.seedCost} · ${min} min · sells ${c.sell} × ${c.yield}`, BUTTON_CSS) as HTMLButtonElement;
    b.type = 'button';
    const pick = (): void => {
      farm.selectSeed(id);
      update();
    };
    b.addEventListener('pointerdown', pick);
    b.addEventListener('click', pick);
    picker.appendChild(b);
    return { id, b };
  });

  box.appendChild(el('p', 'Plant, water and harvest at the croft. Sell at the stall by the gate.',
    `${LINE_CSS}font-size:13px;opacity:0.8;`));

  function update(): void {
    const s = farm.state();
    for (const bed of beds) {
      const t = bedText(s, bed.index);
      bed.card.style.borderColor = STATUS_COLOUR[t.st];
      bed.title.textContent = t.title;
      bed.status.textContent = t.status;
      bed.status.style.color = STATUS_COLOUR[t.st];
    }
    const oak = oakText(s);
    oakCard.style.borderColor = oak.ready ? STATUS_COLOUR.ripe : STATUS_COLOUR.empty;
    oakStatus.textContent = oak.status;
    crate.textContent = crateText(s);
    for (const { id, b } of seedButtons) {
      const on = s.seed === id;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.background = on ? '#2f855a' : 'transparent';
      b.style.color = on ? '#ffffff' : 'inherit';
    }
  }

  return { update };
}

function countBeds(s: FarmState): { growing: number; ripe: number; needs: number } {
  let growing = 0;
  let ripe = 0;
  let needs = 0;
  BEDS.forEach((bed) => {
    const st = bedStatus(s, bed.index);
    if (st === 'ripe') ripe += 1;
    else if (st === 'dry') needs += 1;
    if (st === 'dry' || st === 'growing') growing += 1;
  });
  return { growing, ripe, needs };
}

/** Register the Gnomlet app (id 'farm'). */
export function registerFarmApp(farm: FarmRuntime): void {
  registerGnomletApp({
    id: FARM_APP_ID,
    label: 'Farm',
    icon: '🌱',
    group: 'money',
    detail: () => {
      if (!farm.owned()) return 'Croft for sale';
      const c = countBeds(farm.state());
      return `${c.growing} growing, ${c.ripe} ripe`;
    },
    badge: () => {
      if (!farm.owned()) return null;
      const s = farm.state();
      const c = countBeds(s);
      const n = c.needs + c.ripe + (oakReady(s) ? 1 : 0);
      return n > 0 ? n : null;
    },
    open: (root: HTMLElement) => {
      const box = el('div', undefined, BOX_CSS);
      root.appendChild(box);

      let mode: 'sale' | 'owned' | null = null;
      let screen: Screen | null = null;
      const tick = (): void => {
        const owned = farm.owned();
        const want = owned ? 'owned' : 'sale';
        if (want !== mode) {
          mode = want;
          box.replaceChildren();
          screen = owned ? buildOwned(box, farm) : buildSale(box);
        }
        screen?.update();
      };
      tick();
      const timer = window.setInterval(tick, REFRESH_MS);

      return () => {
        window.clearInterval(timer);
        box.remove();
      };
    },
  });
}
