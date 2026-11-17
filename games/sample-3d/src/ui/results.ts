import type { ResultsUI, RunSummary } from '../config';
import { MOWER_TIERS, SOLO_LEVELS } from '../config';

const FLAVOUR_LINES = [
  'Your gnome is gone. Your acorns are not. The cycle continues.',
  'Death is just a loading screen with extra steps.',
  'Somewhere, a lawn is slightly shorter because of you.',
  'Spend your acorns. Become stronger. Die again, but better.',
];

const GUARD_MS = 800;
const COUNT_MS = 1000;

const CSS = `
.rs-root {
  width: 100%; height: 100%; box-sizing: border-box; padding: 24px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
  text-align: center; pointer-events: auto; color: #fff;
  font-family: 'Arial Black', Impact, system-ui, sans-serif;
}
.rs-root.rs-death { background: linear-gradient(180deg, rgba(20, 0, 0, .75), rgba(0, 0, 0, .85)); }
.rs-root.rs-victory { background: linear-gradient(180deg, rgba(40, 30, 0, .7), rgba(0, 0, 0, .85)); }
.rs-title-row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 14px; }
.rs-title { margin: 0; font-size: 80px; line-height: 1; color: #ff4d4d; }
.rs-victory .rs-title { font-size: 64px; color: #ffd54f; }
.rs-permanent { font-size: 22px; opacity: .85; }
.rs-line { margin: 0; font-size: 18px; font-family: system-ui, sans-serif; }
.rs-stats { display: flex; flex-direction: column; gap: 6px; font-size: 20px; font-family: system-ui, sans-serif; }
.rs-best {
  display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 8px;
  background: #ffd54f; color: #111; font-size: 13px; font-family: 'Arial Black', Impact, sans-serif; vertical-align: middle;
}
.rs-place { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 14px; font-size: 72px; line-height: 1; color: #ffd54f; }
.rs-of { font-size: 24px; color: #fff; opacity: .85; }
.rs-acorns { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; font-size: 16px; font-family: system-ui, sans-serif; }
.rs-banked { margin-top: 6px; font-size: 36px; color: #ffd54f; }
.rs-flavour { max-width: 560px; font-size: 16px; font-style: italic; opacity: .85; font-family: system-ui, sans-serif; }
.rs-button {
  margin-top: 12px; padding: 16px 36px; cursor: pointer;
  font-family: inherit; font-size: 26px; color: #1a1200;
  border-radius: 14px; border: 3px solid #ffd54f;
  background: linear-gradient(180deg, #ffe082, #ffb300);
}
.rs-footnote { margin-top: auto; font-size: 12px; opacity: .6; font-family: system-ui, sans-serif; }
@media (max-width: 760px) {
  .rs-root { justify-content: flex-start; overflow-y: auto; }
  .rs-root .rs-title, .rs-victory .rs-title { font-size: 44px; }
  .rs-place { font-size: 48px; }
  .rs-button { width: 100%; box-sizing: border-box; }
}
`;

function injectStyle(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function fmtTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function createResultsUI(parent: HTMLElement): ResultsUI {
  // Own container: never restyle the shared #ui root (that hid the lobby).
  const root = document.createElement('div');
  parent.appendChild(root);
  injectStyle('rs-style', CSS);
  root.classList.add('rs-root');
  root.style.display = 'none';

  let shownAt = 0;
  let listening = false;
  let done = false;
  let pendingContinue: (() => void) | null = null;
  let rafId = 0;
  let flavour = FLAVOUR_LINES[0];

  const fire = (): void => {
    if (done || !pendingContinue) return;
    done = true;
    pendingContinue();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (performance.now() - shownAt < GUARD_MS) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      fire();
    }
  };

  function countUp(target: HTMLElement, total: number): void {
    cancelAnimationFrame(rafId);
    const t0 = performance.now();
    const tick = (now: number): void => {
      const f = Math.min(1, (now - t0) / COUNT_MS);
      target.textContent = `BANKED: ${Math.round(total * f)} 🌰`;
      rafId = f < 1 ? requestAnimationFrame(tick) : 0;
    };
    rafId = requestAnimationFrame(tick);
  }

  return {
    show(s: RunSummary, onContinue: () => void): void {
      shownAt = performance.now();
      done = false;
      pendingContinue = onContinue;
      flavour = FLAVOUR_LINES[Math.floor(Math.random() * FLAVOUR_LINES.length)];

      const place = s.placement;
      const winner = s.victory || place?.rank === 1;
      root.classList.toggle('rs-victory', winner);
      root.classList.toggle('rs-death', !winner);

      const children: HTMLElement[] = [];

      const titleRow = el('div', 'rs-title-row');
      if (place?.rank === 1) {
        titleRow.append(el('h1', 'rs-title', '#1 LAST GNOME STANDING'));
        children.push(titleRow, el('p', 'rs-line', 'Winner winner, chicken dinner. Legally distinct.'));
      } else if (s.victory) {
        const lvl = s.soloLevel ?? 1;
        const def = SOLO_LEVELS[lvl - 1];
        const next = SOLO_LEVELS[lvl];
        const final = lvl === SOLO_LEVELS.length;
        const worldEnd = !final && next.world !== def.world;
        const again = 'You have done this before. The mowers remember.';
        if (final) {
          titleRow.append(el('h1', 'rs-title', 'THE DESERT IS YOURS'));
          children.push(titleRow, el('p', 'rs-line', 'Two worlds, ten giant enemies, one sunburnt gnome.'));
        } else if (worldEnd) {
          titleRow.append(el('h1', 'rs-title', `WORLD ${def.world} CLEAR`));
          children.push(titleRow, el('p', 'rs-line', s.unlockedLevel
            ? `WORLD ${next.world} UNLOCKED. Pick it in the lobby. Bring water.`
            : again));
        } else {
          titleRow.append(el('h1', 'rs-title', `LEVEL ${def.label} CLEAR`));
          children.push(titleRow, el('p', 'rs-line', s.unlockedLevel
            ? `LEVEL ${SOLO_LEVELS[s.unlockedLevel - 1].label} UNLOCKED. Pick it in the lobby. It is angrier.`
            : again));
        }
      } else {
        titleRow.append(el('h1', 'rs-title', 'YOU DIED'), el('span', 'rs-permanent', '(permanently*)'));
        const killer = s.killedByText ?? (s.killedBy ? MOWER_TIERS[s.killedBy].name : 'hubris');
        children.push(titleRow, el('p', 'rs-line', `Killed by: ${killer}`));
        if (place) {
          const placeRow = el('div', 'rs-place');
          placeRow.append(el('span', 'rs-rank', `#${place.rank}`), el('span', 'rs-of', `of ${place.total}`));
          children.push(placeRow);
        }
      }

      const stats = el('div', 'rs-stats');
      const timeLine = el('div', '', `Time survived ${fmtTime(s.elapsedS)}`);
      if (s.newBestTime) timeLine.append(el('span', 'rs-best', 'NEW BEST!'));
      const soloDef = s.soloLevel ? SOLO_LEVELS[s.soloLevel - 1] : null;
      const killsLabel = soloDef?.theme === 'desert' ? 'Critters stopped' : 'Mowers destroyed';
      stats.append(
        el('div', '', `Run #${s.runNumber}`),
        timeLine,
        el('div', '', `${killsLabel} ${s.kills}`),
        el('div', '', `Level reached ${s.level}`),
        ...(soloDef ? [el('div', '', `Level ${soloDef.label}`)] : []),
      );

      const acorns = el('div', 'rs-acorns');
      acorns.append(
        el('div', '', `Collected +${s.acornsCollected}`),
        el('div', '', `Survival bonus +${s.survivalBonus}`),
      );
      if (s.bossBonus > 0) acorns.append(el('div', '', `Boss bonus +${s.bossBonus}`));
      const banked = el('div', 'rs-banked', 'BANKED: 0 🌰');
      acorns.append(banked);

      const button = el('button', 'rs-button', 'RETURN TO THE GARDEN');
      button.type = 'button';
      button.addEventListener('click', fire);

      children.push(stats, acorns, el('p', 'rs-flavour', flavour), button);
      if (!s.victory) children.push(el('div', 'rs-footnote', '*until you click the button below'));

      root.replaceChildren(...children);
      root.style.display = '';
      countUp(banked, s.totalEarned);

      if (!listening) {
        window.addEventListener('keydown', onKey);
        listening = true;
      }
    },
    hide(): void {
      root.style.display = 'none';
      cancelAnimationFrame(rafId);
      rafId = 0;
      pendingContinue = null;
      if (listening) {
        window.removeEventListener('keydown', onKey);
        listening = false;
      }
      root.replaceChildren();
    },
  };
}
