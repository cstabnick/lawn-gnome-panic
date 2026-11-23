// The death recap: a card in the house style that reads the last minute back from the gnome's event log.
import { DOM } from '../config';
import type { DeathCause } from '../sim/types';
import type { EventLog, Recap } from '../game/types';

const TITLES: Record<DeathCause, string> = {
  hatless: 'Shattered by the Hatless',
  gnome: 'Shattered by another gnome',
  moss: 'The moss took you',
  fall: 'Shattered in a fall',
  cold: 'The cold cracked you through',
  thirst: 'Dried out',
  hunger: 'Starved',
};
const MAX_SENTENCES = 8;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clockText(hourOfDay: number): string {
  const h = Math.floor(hourOfDay) % 24;
  const m = Math.floor((hourOfDay - Math.floor(hourOfDay)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function createRecap(ui: HTMLElement, log: EventLog): Recap {
  let shown = false;

  const root = document.createElement('div');
  root.id = DOM.recap;
  root.style.cssText = 'display:none;position:absolute;inset:0;align-items:center;justify-content:center;' +
    'background:rgba(10,14,12,0.8);pointer-events:auto;padding:12px;box-sizing:border-box;z-index:50;' +
    'font:16px/1.45 system-ui,sans-serif;color:#e8eee6';
  ui.appendChild(root);

  const card = el('div',
    'box-sizing:border-box;width:min(440px,92vw);max-width:92vw;min-width:0;max-height:calc(100% - 24px);overflow-y:auto;white-space:normal;' +
    'background:#1c2420;border:1px solid #4d5f52;border-radius:10px;padding:18px 20px;' +
    '-webkit-overflow-scrolling:touch');
  root.appendChild(card);

  return {
    show(cause, where, day, hourOfDay) {
      if (shown) return;
      shown = true;
      card.textContent = '';

      card.appendChild(el('h2', 'margin:0 0 10px;font:600 22px/1.2 system-ui,sans-serif;color:#f2d28a',
        TITLES[cause] ?? 'Shattered'));

      const lines = log.lines(60);
      const recent = lines.slice(-MAX_SENTENCES);
      const body = recent.length > 0 ? recent.join(' ') : 'The last minute is blank.';
      card.appendChild(el('p', 'margin:0 0 12px', body));

      const stamp = where
        ? `Day ${day}, ${clockText(hourOfDay)}, in the ${where}.`
        : `Day ${day}, ${clockText(hourOfDay)}.`;
      card.appendChild(el('p', 'margin:0 0 12px;color:#aebbb0;font-size:14px', stamp));

      const s = log.stats();
      card.appendChild(el('p', 'margin:0 0 12px;font-size:14px',
        `Hatless cracked: ${s.hatlessDestroyed}. Containers searched: ${s.containersSearched}. Climbs: ${s.climbs}.`));

      if (cause === 'hatless' || cause === 'moss') {
        card.appendChild(el('p', 'margin:0 0 14px;font-style:italic', 'You will rise as a Hatless in your gear.'));
      }

      const button = el('button',
        'display:block;width:100%;min-height:48px;margin-top:4px;border:0;border-radius:8px;background:#7fae6a;' +
        'color:#10180f;font:600 18px system-ui,sans-serif;cursor:pointer;touch-action:manipulation', 'Walk again');
      button.type = 'button';
      button.addEventListener('click', () => {
        const params = new URLSearchParams(location.search);
        params.set('seed', String(Math.floor(Math.random() * 1_000_000_000)));
        location.search = params.toString();
      });
      card.appendChild(button);

      root.style.display = 'flex';
    },
  };
}
