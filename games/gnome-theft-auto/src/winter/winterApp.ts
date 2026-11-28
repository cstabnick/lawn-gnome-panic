// Winter sports (E12): the "Snowdrop" Gnomlet app (best times, runs, ice catches, "drop my sled here") and the Hot
// Cocoa snack item.
import { registerGnomletApp, type GnomletCtx } from '../gnomlet/registry';
import { itemDef, registerItem } from '../inventory';
import type { WinterStore } from './save';
import type { RunId } from './types';
import { formatTime } from './course';
import {
  BEAR_HUG_TARGET,
  BLACK_DIAMOND_S,
  ICE_STATION_TARGET,
  NURSERY_RUN,
  TEA_TRAY_RUN,
  WINTER_APP_ID,
  WOOL_RUN,
} from './types';

export const HOT_COCOA_ID = 'hot-cocoa';

/** Register the Hot Cocoa item (inventory.ts registerItem). Safe to call more than once. */
export function registerWinterItems(): void {
  if (itemDef(HOT_COCOA_ID)) return;
  registerItem({
    id: HOT_COCOA_ID,
    name: 'Hot Cocoa',
    prefab: 'cocoa-mug',
    kind: 'snack',
    heal: 0.35,
    price: 6,
    blurb: 'Brown, sweet and too hot. Gentian says three marshmallows is a rule.',
  });
}

export interface WinterAppCtx {
  store(): WinterStore;
  /** Drop the player's own sled at their feet and sit on it. Null on success, else why not (no sled owned, not on snow...). */
  dropSled(): string | null;
  /** Put the player on a run's ride at its start (WinterApi.startRun). */
  startRun(id: RunId): string | null;
  toast(text: string): void;
}

const CARD_CSS = 'display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid currentColor;border-radius:8px;'
  + 'box-sizing:border-box;width:100%;';
const BUTTON_CSS = 'min-height:44px;padding:0 12px;font-size:15px;cursor:pointer;max-width:100%;';
const LINE_CSS = 'margin:0;overflow-wrap:anywhere;';

function el(tag: keyof HTMLElementTagNameMap, text?: string, css?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (css) e.style.cssText = css;
  return e;
}

/** Register the Gnomlet app (id WINTER_APP_ID). */
export function registerWinterApp(ctx: WinterAppCtx): void {
  registerGnomletApp({
    id: WINTER_APP_ID,
    label: 'Snowdrop',
    icon: '🎿',
    group: 'fun',
    order: 30,
    detail: () => {
      const best = ctx.store().data().best[WOOL_RUN.id];
      return best === undefined ? 'no runs yet' : formatTime(best);
    },
    open: (root: HTMLElement, tablet: GnomletCtx) => {
      const store = ctx.store();
      const data = store.data();

      const box = el('div', undefined, 'display:flex;flex-direction:column;gap:10px;padding:12px;font-size:15px;'
        + 'color:inherit;width:100%;box-sizing:border-box;overflow-y:auto;');
      root.appendChild(box);

      const status = el('p', '', `${LINE_CSS}min-height:1.2em;`);
      const line = (text: string, parent: HTMLElement = box): void => {
        parent.appendChild(el('p', text, LINE_CSS));
      };
      const button = (label: string, parent: HTMLElement, onClick: () => void): void => {
        const b = el('button', label, BUTTON_CSS) as HTMLButtonElement;
        b.type = 'button';
        b.addEventListener('click', onClick);
        parent.appendChild(b);
      };
      // Null from a ride action means it worked: close the tablet. A string is why it did not.
      const act = (result: string | null): void => {
        if (result === null) tablet.close();
        else status.textContent = result;
      };

      box.appendChild(el('h3', 'Snowdrop Slope', 'margin:0;font-size:18px;overflow-wrap:anywhere;'));

      for (const run of [WOOL_RUN, NURSERY_RUN, TEA_TRAY_RUN]) {
        const card = el('div', undefined, CARD_CSS);
        box.appendChild(card);
        const best = data.best[run.id];
        card.appendChild(el('p', run.name, `${LINE_CSS}font-weight:bold;`));
        line(`Best: ${best === undefined ? '—' : formatTime(best)}`, card);
        line(`Runs finished: ${data.runs[run.id] ?? 0}`, card);
        if (run.id === WOOL_RUN.id) {
          const tick = best !== undefined && best <= BLACK_DIAMOND_S && data.clean > 0 ? ' ✓' : '';
          line(`Black Diamond: clean in ≤ ${BLACK_DIAMOND_S.toFixed(1)} s${tick}`, card);
        }
        button(run.ride === 'snow-skis' ? 'Ski it' : 'Sled it', card, () => act(ctx.startRun(run.id)));
      }

      const pond = el('div', undefined, CARD_CSS);
      box.appendChild(pond);
      pond.appendChild(el('p', 'Pail Pond', `${LINE_CSS}font-weight:bold;`));
      line(`Ice catches: ${data.iceCatches} / ${ICE_STATION_TARGET}`, pond);
      line(`Holes drilled: ${data.holes}`, pond);

      const bears = el('div', undefined, CARD_CSS);
      box.appendChild(bears);
      bears.appendChild(el('p', 'Bears', `${LINE_CSS}font-weight:bold;`));
      line(`Bears hugged: ${data.hugged.length} / ${BEAR_HUG_TARGET}`, bears);
      line('They will barely notice.', bears);

      if (store.hasSled()) {
        button('Drop my sled here', box, () => act(ctx.dropSled()));
      } else {
        line('Buy a tea tray to keep at the Woolly Sock Lodge (30 Acorns).');
      }

      box.appendChild(status);

      return () => {
        box.remove();
      };
    },
  });
}
