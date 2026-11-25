// The Gnomlet's Hedgeworth card (A14): the holes with par and length, the player's best scores, and a button that
// starts a round from the tablet (the runtime refuses with a reason when the player is far from the course).
import { registerGnomletApp, type GnomletCtx } from '../gnomlet/registry';
import { COURSE_PAR, HOLES, LOST_BALLS, YD, type GolfApi, type GolfSave, type GolfStore } from './types';

export interface GolfAppDeps {
  store(): GolfStore;
  api(): GolfApi | null;
  toast(text: string): void;
}

const CARD_CSS = 'display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid currentColor;border-radius:8px;'
  + 'box-sizing:border-box;width:100%;';
const BUTTON_CSS = 'min-height:44px;padding:0 12px;font-size:15px;cursor:pointer;max-width:100%;';
const LINE_CSS = 'margin:0;overflow-wrap:anywhere;';
const CELL_CSS = 'padding:4px 6px;text-align:left;';

function el(tag: keyof HTMLElementTagNameMap, text?: string, css?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (css) e.style.cssText = css;
  return e;
}

/** Score to par as text: 'E' for even, else '+n' / '-n'. */
function toParText(n: number): string {
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}

/** Length of each hole's fairway from the tee to the green, in gnome yards. */
function holeYards(index: number): number {
  const path = HOLES[index].path;
  let metres = 0;
  for (let i = 0; i < path.length - 1; i++) {
    metres += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].z - path[i].z);
  }
  return Math.round(metres / YD);
}

function detailText(save: GolfSave): string {
  if (save.bestRound === null) return 'No card yet';
  return `Best round ${save.bestRound} (${toParText(save.bestRound - COURSE_PAR)})`;
}

/** Register the Hedgeworth Gnomlet app (id `hedgeworth`). */
export function registerGolfApp(deps: GolfAppDeps): void {
  registerGnomletApp({
    id: 'hedgeworth',
    label: 'Hedgeworth',
    icon: '⛳',
    group: 'fun',
    detail: () => detailText(deps.store().data()),
    open: (root: HTMLElement, tablet: GnomletCtx) => {
      const save = deps.store().data();

      const box = el('div', undefined, 'display:flex;flex-direction:column;gap:10px;padding:12px;font-size:15px;'
        + 'color:inherit;width:100%;box-sizing:border-box;overflow-y:auto;');
      root.appendChild(box);

      const line = (text: string, parent: HTMLElement = box): void => {
        parent.appendChild(el('p', text, LINE_CSS));
      };

      box.appendChild(el('h3', 'Hedgeworth Links', 'margin:0;font-size:18px;overflow-wrap:anywhere;'));
      line(`Four holes. Nine on the card. Par ${COURSE_PAR}.`);

      // The holes: number, name, par, length (gnome yards from the tee), your best.
      const table = el('table', undefined, 'width:100%;border-collapse:collapse;font-size:14px;');
      const head = el('tr');
      for (const title of ['No.', 'Hole', 'Par', 'Yards', 'Best']) head.appendChild(el('th', title, CELL_CSS));
      table.appendChild(head);
      for (const h of HOLES) {
        const best = save.best[h.index];
        const row = el('tr');
        row.appendChild(el('td', String(h.number), CELL_CSS));
        row.appendChild(el('td', h.name, CELL_CSS));
        row.appendChild(el('td', String(h.par), CELL_CSS));
        row.appendChild(el('td', String(holeYards(h.index)), CELL_CSS));
        row.appendChild(el('td', best === null || best === undefined ? '–' : String(best), CELL_CSS));
        table.appendChild(row);
      }
      box.appendChild(table);

      // The stats.
      const stats = el('div', undefined, CARD_CSS);
      box.appendChild(stats);
      stats.appendChild(el('p', 'The card', `${LINE_CSS}font-weight:bold;`));
      line(`Rounds played: ${save.rounds}`, stats);
      line(`Best round: ${save.bestRound === null ? '—' : `${save.bestRound} (${toParText(save.bestRound - COURSE_PAR)})`}`, stats);
      line(`Holes in one: ${save.aces}`, stats);
      line(`Lost balls found: ${save.ballsFound.length} / ${LOST_BALLS.length}`, stats);
      line(`The Kicked Board: ${save.boardBroken ? 'broken' : 'still standing'}`, stats);

      const play = el('button', 'Play a round', BUTTON_CSS) as HTMLButtonElement;
      play.type = 'button';
      const api = deps.api();
      if (!api) {
        play.disabled = true;
      } else {
        play.addEventListener('click', () => {
          const reason = api.startRound(0);
          if (reason === null) tablet.close();
          else deps.toast(reason);
        });
      }
      box.appendChild(play);

      return () => {
        box.remove();
      };
    },
  });
}
