// Goal checklist and victory screen.
import type { Ctx, GameState, System } from './config';
import { sfx } from './audio';
import { notify } from './rules';

interface Objective { text: string; done: (s: GameState) => boolean }

const OBJECTIVES: Objective[] = [
  { text: 'Cut some grass (E on a grown tile)', done: (s) => s.stats.cut >= 1 },
  { text: 'Fish up 3 pieces of junk (hold LMB, release, hold to reel)', done: (s) => s.stats.caught >= 3 },
  { text: 'Expand the raft by 3 tiles (B)', done: (s) => s.tilesBuilt >= 3 },
  { text: 'Craft a telescope (Tab)', done: (s) => s.hasTelescope },
  { text: 'Spot an island through the telescope (T)', done: (s) => Object.values(s.islands).some((i) => i.spotted) },
  { text: 'Land on Scrapyard Isle (C in the telescope to chart a course)', done: (s) => s.islands.scrapyard.visited },
  { text: 'Craft a push mower', done: (s) => s.tools.push },
  { text: 'Land on Fuel Depot Key', done: (s) => s.islands.fuelDepot.visited },
  { text: 'Craft a gas mower', done: (s) => s.tools.gas },
  { text: 'Land on the Mower Graveyard', done: (s) => s.islands.mowerGraveyard.visited },
  { text: 'Craft the riding mower', done: (s) => s.tools.riding },
  { text: 'Grow your raft to 40 tiles', done: (s) => s.tiles.size >= 40 },
];

const TOTAL = OBJECTIVES.length;

/** Index of the first objective not done, or TOTAL when all are done. */
function currentIndex(s: GameState): number {
  const i = OBJECTIVES.findIndex((o) => !o.done(s));
  return i === -1 ? TOTAL : i;
}

function mmss(seconds: number): string {
  const t = Math.floor(seconds);
  const m = Math.floor(t / 60);
  const r = t % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function el(tag: string, css: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createObjectives(ctx: Ctx): System {
  // Goal panel
  const panel = el(
    'div',
    'position:absolute;top:204px;right:12px;width:220px;box-sizing:border-box;display:none;' +
      'background:rgba(10,30,45,0.75);border-radius:10px;padding:8px 12px;' +
      'color:#fff;text-shadow:0 1px 3px #000;font:14px system-ui,sans-serif;',
  );
  panel.id = 'rg-goals';
  const caption = el('div', 'font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;');
  const body = el('div', 'margin-top:2px;');
  panel.append(caption, body);
  ctx.ui.appendChild(panel);

  // Victory overlay (built now, shown once)
  const win = el(
    'div',
    'position:absolute;inset:0;display:none;align-items:center;justify-content:center;' +
      'background:rgba(5,20,35,0.8);pointer-events:auto;color:#fff;font:16px system-ui,sans-serif;text-align:center;',
  );
  win.id = 'rg-win';
  const card = el(
    'div',
    'background:rgba(10,30,45,0.95);border-radius:14px;padding:24px 32px;max-width:420px;box-sizing:border-box;margin:16px;',
  );
  const title = el('div', 'font-size:32px;font-weight:bold;margin-bottom:8px;text-shadow:0 2px 6px #000;', 'LAWN OF THE SEAS');
  const blurb = el('div', 'margin-bottom:16px;', 'You built a riding-mower-powered lawn empire adrift at sea.');
  const statsBox = el('div', 'line-height:1.6;margin-bottom:18px;');
  const keep = el(
    'button',
    'font:16px system-ui,sans-serif;padding:8px 18px;border:0;border-radius:8px;background:#3fa34d;color:#fff;cursor:pointer;',
    'Keep mowing',
  );
  keep.addEventListener('click', () => {
    win.style.display = 'none';
    ctx.input.requestLock();
  });
  card.append(title, blurb, statsBox, keep);
  win.appendChild(card);
  ctx.ui.appendChild(win);

  function showWin(s: GameState): void {
    const lines = [
      `Time played: ${mmss(s.time)}`,
      `Grass mowed: ${s.stats.cut} tiles`,
      `Junk fished: ${s.stats.caught}`,
      `Raft size: ${s.tiles.size} tiles`,
      `Gulls shooed: ${s.stats.gullsScared}`,
      `Sharks bonked: ${s.stats.sharksBonked}`,
      `Tiles lost to sharks: ${s.stats.tilesLost}`,
    ];
    statsBox.replaceChildren(...lines.map((l) => el('div', '', l)));
    win.style.display = 'flex';
    ctx.input.exitLock();
  }

  let prev = -1;      // -1 = first frame not seen yet
  let shown = '';     // last panel key, so the DOM is only touched on change

  return {
    update() {
      const s = ctx.state;
      const idx = currentIndex(s);

      // Completed objectives (not on the first frame, so loaded saves stay quiet)
      if (prev !== -1 && idx > prev) {
        for (let k = prev; k < idx; k++) notify(s, 'Goal complete: ' + OBJECTIVES[k].text);
        sfx('loot');
      }
      prev = idx;

      // Panel
      const visible = s.mode !== 'title' && s.mode !== 'telescope';
      const label = idx >= TOTAL ? `GOAL ${TOTAL}/${TOTAL}` : `GOAL ${idx + 1}/${TOTAL}`;
      const text = idx >= TOTAL ? 'All goals complete' : OBJECTIVES[idx].text;
      const key = `${visible}|${label}|${text}`;
      if (key !== shown) {
        shown = key;
        panel.style.display = visible ? 'block' : 'none';
        caption.textContent = label;
        body.textContent = text;
      }

      // Victory
      if (idx >= TOTAL && !s.won) {
        s.won = true;
        sfx('win');
        showWin(s);
      }
    },
  };
}
