import type { HudData, HudUI } from '../config';

const CSS = `
.hud-root {
  position: absolute; inset: 0; pointer-events: none; display: none;
  font-family: 'Arial Black', Impact, system-ui, sans-serif;
  color: #fff; text-shadow: 0 2px 4px rgba(0, 0, 0, .6);
}

/* Left column: health, stamina, buffs */
.hud-left { position: absolute; top: 16px; left: 16px; display: flex; flex-direction: column; gap: 8px; }
.hud-indent { margin-left: 34px; }
.hud-health { display: flex; align-items: center; gap: 10px; transform-origin: left center; }
.hud-heart-icon { width: 24px; font-size: 34px; line-height: 1; color: #ff5252; text-align: center; flex: none; }
.hud-health-bar {
  position: relative; flex: none; width: 320px; height: 28px; box-sizing: border-box;
  border-radius: 14px; border: 2px solid rgba(255, 255, 255, .85);
  background: rgba(0, 0, 0, .55); overflow: hidden;
  transition: border-color .2s, box-shadow .2s;
}
.hud-health-ghost, .hud-health-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; }
.hud-health-ghost { background: #fff59d; transition: width .4s .35s; }
.hud-health-fill { background: linear-gradient(90deg, #ff8a80, #ff1744); transition: width .25s; }
.hud-health-segs { position: absolute; inset: 0; }
.hud-health-seg { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: rgba(0, 0, 0, .45); }
.hud-health-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}
.hud-low { animation: hud-heartbeat .9s ease-in-out infinite; }
.hud-low .hud-health-bar { border-color: #ff1744; box-shadow: 0 0 14px 3px rgba(255, 23, 68, .9); }
@keyframes hud-heartbeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.08); }
  30% { transform: scale(1); }
  45% { transform: scale(1.05); }
  60% { transform: scale(1); }
}

.hud-stam { display: flex; align-items: center; gap: 8px; }
.hud-stam-label { flex: none; width: 56px; font-size: 11px; }
.hud-stam-bar { position: relative; flex: none; width: 320px; height: 10px; border-radius: 5px; background: rgba(0, 0, 0, .55); overflow: hidden; }
.hud-stam-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #ffd54f; }
.hud-blink { animation: hud-blink 0.5s steps(2, start) infinite; }
@keyframes hud-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }

.hud-buffs { display: flex; flex-direction: column; gap: 6px; }
.hud-buff { width: 220px; box-sizing: border-box; padding: 4px 8px; border-radius: 8px; background: rgba(0, 0, 0, .55); }
.hud-buff-label { font-size: 13px; margin-bottom: 3px; }
.hud-buff-bar { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, .2); overflow: hidden; }
.hud-buff-fill { height: 100%; width: 0%; background: #80deea; }

/* XP bar across the bottom, with level badge */
.hud-xp {
  position: absolute; left: 90px; right: 24px; bottom: 20px; height: 24px; box-sizing: border-box;
  border-radius: 12px; border: 2px solid rgba(255, 255, 255, .85);
  background: rgba(0, 0, 0, .55); overflow: hidden;
}
.hud-xp-fill {
  position: absolute; left: 0; top: 0; bottom: 0; width: 0%; overflow: hidden;
  background: linear-gradient(90deg, #76ff03, #00e5ff); transition: width .25s;
}
.hud-xp-shine {
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, .6) 50%, transparent 65%);
  background-size: 200% 100%;
  animation: hud-shine 1.4s linear infinite;
}
@keyframes hud-shine { from { background-position: 150% 0; } to { background-position: -50% 0; } }
.hud-xp-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 16px; white-space: nowrap;
}
.hud-xp-flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
.hud-badge {
  position: absolute; left: 16px; bottom: 8px; width: 64px; height: 64px; box-sizing: border-box;
  border-radius: 50%; border: 3px solid #fff8e1;
  background: radial-gradient(circle at 35% 30%, #fff3c4, #ffd54f 45%, #c99700);
  color: #2a1a00; text-shadow: none; font-size: 30px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, .5);
}

/* Timer */
.hud-timer { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); text-align: center; font-size: 34px; white-space: nowrap; }
.hud-run { display: block; font-size: 13px; opacity: .8; }

/* Top right chips */
.hud-stats { position: absolute; top: 18px; right: 220px; display: flex; flex-direction: column; align-items: flex-end; font-size: 22px; white-space: nowrap; }
.hud-chip { display: inline-block; margin-top: 6px; padding: 2px 14px; border-radius: 999px; background: rgba(0, 0, 0, .45); line-height: 1.3; }

/* Boss bar */
.hud-boss { position: absolute; top: 76px; left: 50%; transform: translateX(-50%); width: 50vw; text-align: center; }
.hud-boss-label { font-size: 22px; color: #ff6b5a; margin-bottom: 6px; }
.hud-boss-bar {
  position: relative; height: 18px; box-sizing: border-box; border-radius: 9px;
  border: 2px solid rgba(255, 255, 255, .85); background: rgba(0, 0, 0, .55); overflow: hidden;
}
.hud-boss-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #e53935; }

/* Banner */
.hud-banner { position: absolute; top: 26vh; left: 0; right: 0; text-align: center; opacity: 0; }
.hud-banner-title { font-size: 44px; font-weight: 900; color: #ffd54f; }
.hud-banner-sub { font-size: 20px; color: #fff; }
@media (max-width: 760px) {
  .hud-health-bar { width: 200px; height: 22px; }
  .hud-stam-bar { width: 200px; }
  .hud-timer { font-size: 24px; }
  .hud-stats { font-size: 16px; }
  .hud-xp { left: 70px; height: 18px; }
  .hud-badge { width: 48px; height: 48px; }
}
`;

function el(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function pop(e: HTMLElement, from: number, ms: number): void {
  e.animate(
    [{ transform: `scale(${from})` }, { transform: 'scale(1)' }],
    { duration: ms, easing: 'ease-out' },
  );
}

export function createHud(root: HTMLElement): HudUI {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const hudRoot = el('div', 'hud-root');

  // Health: heart icon, bar with damage ghost, segment dividers, count text.
  const health = el('div', 'hud-health');
  health.appendChild(el('div', 'hud-heart-icon', '♥'));
  const hpBar = el('div', 'hud-health-bar');
  const hpGhost = el('div', 'hud-health-ghost');
  const hpFill = el('div', 'hud-health-fill');
  const hpSegs = el('div', 'hud-health-segs');
  const hpText = el('div', 'hud-health-text');
  hpBar.appendChild(hpGhost);
  hpBar.appendChild(hpFill);
  hpBar.appendChild(hpSegs);
  hpBar.appendChild(hpText);
  health.appendChild(hpBar);

  // Stamina
  const stam = el('div', 'hud-stam hud-indent');
  stam.appendChild(el('div', 'hud-stam-label', 'SPRINT'));
  const stamBar = el('div', 'hud-stam-bar');
  const stamFill = el('div', 'hud-stam-fill');
  stamBar.appendChild(stamFill);
  stam.appendChild(stamBar);

  // Buffs
  const buffsBox = el('div', 'hud-buffs hud-indent');
  let buffEls: { fill: HTMLElement; last: string }[] = [];

  const left = el('div', 'hud-left');
  left.appendChild(health);
  left.appendChild(stam);
  left.appendChild(buffsBox);

  // XP bar and level badge
  const xp = el('div', 'hud-xp');
  const xpFill = el('div', 'hud-xp-fill');
  xpFill.appendChild(el('div', 'hud-xp-shine'));
  const xpText = el('div', 'hud-xp-text');
  const xpFlash = el('div', 'hud-xp-flash');
  xp.appendChild(xpFill);
  xp.appendChild(xpText);
  xp.appendChild(xpFlash);
  const badge = el('div', 'hud-badge');

  // Timer
  const timer = el('div', 'hud-timer');
  const timerText = el('span', 'hud-timer-text', '0:00');
  const runEl = el('span', 'hud-run', 'RUN #1');
  timer.appendChild(timerText);
  timer.appendChild(runEl);

  // Top right stats
  const stats = el('div', 'hud-stats');
  const killsEl = el('div', 'hud-chip hud-kills', '☠ 0');
  const acornsEl = el('div', 'hud-chip hud-acorns', '🌰 0');
  stats.appendChild(killsEl);
  stats.appendChild(acornsEl);

  // Boss bar
  const boss = el('div', 'hud-boss');
  boss.style.display = 'none';
  const bossLabel = el('div', 'hud-boss-label', 'THE COMBINE');
  boss.appendChild(bossLabel);
  const bossBar = el('div', 'hud-boss-bar');
  const bossFill = el('div', 'hud-boss-fill');
  bossBar.appendChild(bossFill);
  boss.appendChild(bossBar);

  // Banner
  const banner = el('div', 'hud-banner');
  const bannerTitle = el('div', 'hud-banner-title');
  const bannerSub = el('div', 'hud-banner-sub');
  banner.appendChild(bannerTitle);
  banner.appendChild(bannerSub);

  for (const child of [left, timer, stats, boss, xp, badge, banner]) {
    hudRoot.appendChild(child);
  }
  root.appendChild(hudRoot);

  // Last written value per element, so update() only touches the DOM on change.
  const cache = new Map<string, string>();
  function sync(key: string, value: string, write: (v: string) => void): void {
    if (cache.get(key) === value) return;
    cache.set(key, value);
    write(value);
  }

  let bannerTimers: number[] = [];
  let lastLevel: number | null = null;
  let lastKills: number | null = null;
  let lastAcorns: number | null = null;

  function clearBannerTimers(): void {
    for (const t of bannerTimers) window.clearTimeout(t);
    bannerTimers = [];
  }

  return {
    show() {
      hudRoot.style.display = 'block';
    },

    hide() {
      hudRoot.style.display = 'none';
      clearBannerTimers();
      banner.style.transition = 'none';
      banner.style.opacity = '0';
    },

    update(d: HudData) {
      // Health
      const maxH = Math.max(0, d.maxHearts);
      sync('segs', `${maxH}`, () => {
        hpSegs.textContent = '';
        for (let i = 1; i < maxH; i++) {
          const seg = el('div', 'hud-health-seg');
          seg.style.left = `${(i / maxH) * 100}%`;
          hpSegs.appendChild(seg);
        }
      });
      const hpFrac = maxH > 0 ? clamp01(d.hearts / maxH) : 0;
      sync('hpText', `${d.hearts}/${maxH}`, () => { hpText.textContent = `${d.hearts} / ${maxH}`; });
      sync('hpW', `${hpFrac}`, v => {
        const w = `${Number(v) * 100}%`;
        hpFill.style.width = w;
        hpGhost.style.width = w; // ghost lags behind via its CSS transition delay
      });
      const low = d.hearts <= 1;
      sync('low', low ? '1' : '0', v => { health.classList.toggle('hud-low', v === '1'); });

      // Stamina
      sync('stamW', `${clamp01(d.stamina01)}`, v => { stamFill.style.width = `${Number(v) * 100}%`; });
      sync('stamEx', d.exhausted ? '1' : '0', v => {
        const ex = v === '1';
        stamFill.style.background = ex ? '#ff6b5a' : '#ffd54f';
        stamBar.classList.toggle('hud-blink', ex);
      });

      // Buffs: chips are rebuilt only when the labels change; widths follow remaining01.
      sync('buffs', JSON.stringify(d.buffs.map(b => b.label)), () => {
        buffsBox.textContent = '';
        buffEls = [];
        for (const b of d.buffs) {
          const chip = el('div', 'hud-buff');
          chip.appendChild(el('div', 'hud-buff-label', b.label));
          const track = el('div', 'hud-buff-bar');
          const fill = el('div', 'hud-buff-fill');
          track.appendChild(fill);
          chip.appendChild(track);
          buffsBox.appendChild(chip);
          buffEls.push({ fill, last: '' });
        }
      });
      for (let i = 0; i < buffEls.length; i++) {
        const w = `${clamp01(d.buffs[i].remaining01)}`;
        if (buffEls[i].last !== w) {
          buffEls[i].last = w;
          buffEls[i].fill.style.width = `${Number(w) * 100}%`;
        }
      }

      // XP and level
      const xp01 = clamp01(d.xp01);
      const levelUp = lastLevel !== null && d.level > lastLevel;
      if (levelUp) {
        // Snap the fill back to empty without a transition, then animate up on the next frame.
        cache.set('xp', `${xp01}`);
        xpFill.style.transition = 'none';
        xpFill.style.width = '0%';
        void xpFill.offsetWidth; // commit the 0% before the transition is re-enabled
        requestAnimationFrame(() => {
          xpFill.style.transition = '';
          xpFill.style.width = `${xp01 * 100}%`;
        });
        xpFlash.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 300, easing: 'linear' });
        pop(badge, 1.5, 400);
      } else {
        sync('xp', `${xp01}`, v => { xpFill.style.width = `${Number(v) * 100}%`; });
      }
      lastLevel = d.level;

      sync('level', `${d.level}`, v => { badge.textContent = v; });
      sync('xpText', `LV ${d.level}  ▸  ${d.level + 1}     ${Math.floor(xp01 * 100)}%`, v => {
        xpText.textContent = v;
      });

      // Timer
      sync('timer', fmtTime(d.elapsedS), v => { timerText.textContent = v; });
      sync('run', `RUN #${d.runNumber}${d.levelLabel ? ' · ' + d.levelLabel : ''}`, v => { runEl.textContent = v; });

      // Top right chips
      sync('kills', `☠ ${d.kills}`, v => { killsEl.textContent = v; });
      if (lastKills !== null && d.kills > lastKills) pop(killsEl, 1.35, 250);
      lastKills = d.kills;
      sync('acorns', `🌰 ${d.acorns}`, v => { acornsEl.textContent = v; });
      if (lastAcorns !== null && d.acorns > lastAcorns) pop(acornsEl, 1.35, 250);
      lastAcorns = d.acorns;

      // Boss
      const bossOn = d.boss !== null;
      sync('bossOn', bossOn ? '1' : '0', v => { boss.style.display = v === '1' ? 'block' : 'none'; });
      if (d.boss) {
        sync('bossLbl', d.boss.count > 1 ? `${d.bossName}S ×${d.boss.count}` : d.bossName, v => { bossLabel.textContent = v; });
        const pct = d.boss.max > 0 ? clamp01(d.boss.hp / d.boss.max) : 0;
        sync('bossW', `${pct}`, v => { bossFill.style.width = `${Number(v) * 100}%`; });
      }
    },

    banner(title: string, sub: string, seconds: number) {
      clearBannerTimers();
      bannerTitle.textContent = title;
      bannerSub.textContent = sub;

      // Fade in over 0.2 s from fully transparent.
      banner.style.transition = 'none';
      banner.style.opacity = '0';
      void banner.offsetWidth; // force reflow so the transition starts from 0
      banner.style.transition = 'opacity 0.2s ease-out';
      banner.style.opacity = '1';

      // Fade out over 0.5 s, finishing at `seconds`.
      const outStart = Math.max(0, seconds - 0.5);
      const outDur = Math.max(0, seconds - outStart);
      bannerTimers.push(window.setTimeout(() => {
        banner.style.transition = `opacity ${outDur}s ease-in`;
        banner.style.opacity = '0';
      }, outStart * 1000));
    },
  };
}

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}
