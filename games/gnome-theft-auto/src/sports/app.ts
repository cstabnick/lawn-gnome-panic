// Founders' Green Gnomlet card (batch 3 E19): Drainpipe Court and The Gutter Bowls on one tablet app. The records come from
// the sports save; the buttons start a pickup game, a shootaround, a skate line or drop the player's board. A refusal
// from the runtime (too far, already busy) goes to the toast.
import { registerGnomletApp, type GnomletCtx } from '../gnomlet/registry';
import { PICKUP, type CourtApi } from '../court/types';
import { SKATE_LINES, type SkateApi } from '../skate/types';
import type { SportsSave, SportsStore } from './types';

export interface FoundersAppDeps {
  store(): SportsStore;
  court(): CourtApi | null;
  skate(): SkateApi | null;
  toast(text: string): void;
}

const CARD_CSS = 'display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid currentColor;border-radius:8px;'
  + 'box-sizing:border-box;width:100%;';
const BUTTON_CSS = 'min-height:44px;padding:0 12px;font-size:15px;cursor:pointer;max-width:100%;';
const ROW_CSS = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';
const LINE_CSS = 'margin:0;overflow-wrap:anywhere;';
const HEAD_CSS = 'margin:0;font-weight:bold;font-size:17px;overflow-wrap:anywhere;';
const FLAVOUR_CSS = 'margin:0;font-style:italic;opacity:0.85;overflow-wrap:anywhere;';

function el(tag: keyof HTMLElementTagNameMap, text?: string, css?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (css) e.style.cssText = css;
  return e;
}

function button(text: string, onClick: () => void, disabled: boolean): HTMLButtonElement {
  const b = el('button', text, BUTTON_CSS) as HTMLButtonElement;
  b.type = 'button';
  b.disabled = disabled;
  if (!disabled) b.addEventListener('click', onClick);
  return b;
}

function detailText(save: SportsSave): string {
  if (save.jam.games === 0 && save.skate.linesDone === 0) return 'Nothing on the court yet';
  return `Court: ${save.jam.wins} of ${save.jam.games} won. Lines done: ${save.skate.linesDone}`;
}

/** Register the Founders' Green Gnomlet app (id `founders-green`). */
export function registerFoundersApp(deps: FoundersAppDeps): void {
  registerGnomletApp({
    id: 'founders-green',
    label: "Founders' Green",
    icon: '🏀',
    group: 'fun',
    detail: () => detailText(deps.store().data()),
    open: (root: HTMLElement, tablet: GnomletCtx) => {
      const save = deps.store().data();

      const box = el('div', undefined, 'display:flex;flex-direction:column;gap:10px;padding:12px;font-size:15px;'
        + 'color:inherit;width:100%;box-sizing:border-box;overflow-y:auto;');
      root.appendChild(box);

      const line = (text: string, parent: HTMLElement): void => {
        parent.appendChild(el('p', text, LINE_CSS));
      };

      // A start that the runtime refuses goes to the toast; one that starts closes the tablet.
      const finish = (reason: string | null): void => {
        if (reason === null) tablet.close();
        else deps.toast(reason);
      };

      box.appendChild(el('h3', "Founders' Green", 'margin:0;font-size:18px;overflow-wrap:anywhere;'));

      // Drainpipe Court.
      const court = el('div', undefined, CARD_CSS);
      box.appendChild(court);
      court.appendChild(el('p', 'Drainpipe Court', HEAD_CSS));
      court.appendChild(el('p', 'Nobody owns the court. Swish is the nearest thing.', FLAVOUR_CSS));
      line(`Games: ${save.jam.games}. Wins: ${save.jam.wins}.`, court);
      line(`Threes: ${save.jam.threes}. Dunks: ${save.jam.dunks}.`, court);
      line(`Beat Swish: ${save.jam.swishBeaten} times. Best winning margin: ${save.jam.bestMargin}.`, court);
      const courtApi = deps.court();
      const courtRow = el('div', undefined, ROW_CSS);
      court.appendChild(courtRow);
      courtRow.appendChild(button(`Pickup game (to ${PICKUP.target})`, () => {
        if (courtApi) finish(courtApi.startGame({ opponents: 'regulars' }));
      }, !courtApi));
      courtRow.appendChild(button('Shootaround', () => {
        if (courtApi) finish(courtApi.startShootaround());
      }, !courtApi));

      // The Gutter Bowls.
      const gutter = el('div', undefined, CARD_CSS);
      box.appendChild(gutter);
      gutter.appendChild(el('p', 'The Gutter Bowls', HEAD_CSS));
      gutter.appendChild(el('p', "It's only a gutter. It's the best gutter in the yard.", FLAVOUR_CSS));
      line(`Best combo: ${save.skate.bestCombo}. Full rails: ${save.skate.fullRails}.`, gutter);
      line(`Lines done: ${save.skate.linesDone}.`, gutter);

      const skateApi = deps.skate();
      for (const l of SKATE_LINES) {
        const best = save.skate.lines[l.id];
        const row = el('div', undefined, ROW_CSS);
        gutter.appendChild(row);
        row.appendChild(el('span', `${l.name}: ${best === undefined ? 'not yet' : `${best.toFixed(2)} s`}`, LINE_CSS));
        row.appendChild(button('Skate it', () => {
          if (skateApi) finish(skateApi.startLine(l.id));
        }, !skateApi));
      }

      if (skateApi?.boardOwned()) {
        const dropRow = el('div', undefined, ROW_CSS);
        gutter.appendChild(dropRow);
        dropRow.appendChild(button('Drop your board', () => finish(skateApi.dropBoard()), false));
      }

      return () => {
        box.remove();
      };
    },
  });
}
