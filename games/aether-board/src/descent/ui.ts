// Descent overlay (DOM): hill cards with three slider bars, the perk pick after a hill, the lives / hill HUD while
// riding, the crash flash, and the run-over / run-won screens. Also the mode switch pill on the title card.
import { PALETTE } from '../config';
import { DESCENT, type CrashResult, type HillCard, type HillParams, type HillReward, type HillResult, type PerkId, type RunState } from './types';
import { PERKS } from './perks';

export interface DescentUi {
  /** Show the hill picker; onPick runs once with the chosen card. */
  showPicker(run: RunState, cards: HillCard[], onPick: (card: HillCard) => void): void;
  /** Show the hill result and, if result.perkChoices is not empty, the perk cards; onDone runs once (perk or null). */
  showReward(run: RunState, result: HillResult, onDone: (perk: PerkId | null) => void): void;
  /** Run over (won = cleared every hill). onRestart runs once when the player asks for a new run. */
  showEnd(run: RunState, won: boolean, best: number, onRestart: () => void): void;
  /** Hide the picker / reward / end screens (the riding HUD stays). */
  hideScreens(): void;
  /** Every frame while riding (and between hills): lives, shields, hill n / total, hill score vs bonus target. */
  updateHud(run: RunState, hillScore: number, riding: boolean): void;
  /** Big '-1 LIFE' (or 'SHIELD!') flash after a crash. */
  flashCrash(r: CrashResult): void;
  /** Big 'SAVED!' flash when a perk saved a bad landing (reason: what would have bailed you). */
  flashSave(reason: string): void;
}

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const C = {
  ink: hex(PALETTE.ink), pink: hex(PALETTE.pink), cyan: hex(PALETTE.cyan), lime: hex(PALETTE.lime),
  purple: hex(PALETTE.purple), yellow: hex(PALETTE.yellow), red: '#ff2d4b', orange: '#ff9f1c',
};

const CSS = `
.dsc-screen{position:fixed;inset:0;z-index:20;pointer-events:auto;background:rgba(23,7,46,.88);display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;overflow-y:auto;box-sizing:border-box;color:#fff;font-family:system-ui,sans-serif}
.dsc-screen.on{display:flex}
.dsc-head{font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;font-size:clamp(28px,5vw,56px);line-height:1;color:${C.yellow};text-shadow:3px 3px 0 ${C.ink},6px 6px 0 ${C.pink};transform:skewX(-10deg);text-align:center}
.dsc-tag{display:inline-block;margin-left:12px;font-size:14px;vertical-align:middle;color:${C.ink};background:${C.pink};padding:4px 8px;border:2px solid ${C.ink}}
.dsc-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;font-family:"Arial Black",Impact,system-ui,sans-serif;font-size:clamp(16px,2.4vw,24px);text-shadow:2px 2px 0 ${C.ink}}
.dsc-hearts{color:${C.pink}}
.dsc-shields{color:${C.cyan}}
.dsc-cards,.dsc-perks{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;max-width:1000px;width:100%}
.dsc-card,.dsc-perk{flex:0 1 270px;max-width:300px;display:flex;flex-direction:column;gap:10px;padding:14px;background:rgba(23,7,46,.85);border:3px solid ${C.purple};box-shadow:5px 5px 0 ${C.pink};color:#fff;text-align:left;font-family:system-ui,sans-serif;cursor:pointer;touch-action:manipulation;margin:0}
.dsc-card:hover,.dsc-card:focus-visible,.dsc-perk:hover,.dsc-perk:focus-visible{border-color:${C.yellow};outline:none;transform:translate(-2px,-2px)}
.dsc-card.boss{border-color:${C.yellow};box-shadow:5px 5px 0 ${C.red}}
.dsc-cname,.dsc-pname{font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;font-size:22px;line-height:1.05;color:${C.cyan};text-shadow:2px 2px 0 ${C.ink}}
.dsc-sliders{display:flex;flex-direction:column;gap:6px}
.dsc-row{display:flex;align-items:center;gap:8px}
.dsc-lbl{width:72px;font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;font-size:13px;color:var(--c)}
.dsc-pips{display:flex;gap:4px}
.dsc-pip{display:inline-block;width:18px;height:12px;background:rgba(255,255,255,.12);border:2px solid ${C.ink}}
.dsc-pip.on{background:var(--c);box-shadow:0 0 6px var(--c)}
.dsc-mult{font-family:"Arial Black",Impact,system-ui,sans-serif;font-size:20px;color:${C.yellow};text-shadow:2px 2px 0 ${C.ink}}
.dsc-chips{display:flex;flex-wrap:wrap;gap:6px}
.dsc-chip{display:inline-block;font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;font-size:13px;text-transform:uppercase;line-height:1;padding:4px 7px;border:2px solid ${C.ink};color:${C.ink};background:#fff;transform:skewX(-10deg);white-space:nowrap}
.dsc-chip.k-perk{background:${C.cyan}}
.dsc-chip.k-life{background:${C.lime}}
.dsc-chip.k-shield{background:${C.yellow}}
.dsc-chip.k-none{background:rgba(255,255,255,.35);color:#fff}
.dsc-bonus{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:13px;color:${C.lime};text-shadow:1px 1px 0 ${C.ink}}
.dsc-key{font-size:12px;font-weight:700;color:rgba(255,255,255,.6)}
.dsc-dim{color:rgba(255,255,255,.5)}
.dsc-terrain{font-family:"Arial Black",Impact,system-ui,sans-serif;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.5)}
.dsc-lines{display:flex;flex-direction:column;align-items:center;gap:4px;font-family:"Arial Black",Impact,system-ui,sans-serif;text-transform:uppercase}
.dsc-line{font-size:20px;color:#fff;text-shadow:2px 2px 0 ${C.ink}}
.dsc-line.big{font-size:clamp(40px,8vw,80px);line-height:1;color:${C.yellow};text-shadow:4px 4px 0 ${C.ink},8px 8px 0 ${C.pink}}
.dsc-line.lime{color:${C.lime}}
.dsc-line.red{color:${C.red}}
.dsc-line.yellow{color:${C.yellow}}
.dsc-pdesc{font-size:14px;color:rgba(255,255,255,.85)}
.dsc-lv{font-family:"Arial Black",Impact,system-ui,sans-serif;font-size:14px;color:${C.lime}}
.dsc-btn{font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;font-size:clamp(20px,3vw,30px);padding:10px 26px;color:${C.ink};background:${C.yellow};border:3px solid ${C.ink};box-shadow:5px 5px 0 ${C.pink};transform:skewX(-10deg);cursor:pointer;touch-action:manipulation}
.dsc-btn:hover,.dsc-btn:focus-visible{background:${C.lime};outline:none}
.dsc-hud{position:fixed;top:16px;left:50%;transform:translateX(-50%);pointer-events:none;z-index:5;display:none;flex-direction:column;align-items:center;gap:6px;color:#fff;white-space:nowrap;font-family:"Arial Black",Impact,system-ui,sans-serif}
.dsc-hud-top{display:flex;gap:12px;font-size:22px;text-shadow:2px 2px 0 ${C.ink}}
.dsc-hud-label{font-size:16px;font-style:italic;text-transform:uppercase;color:${C.yellow};text-shadow:2px 2px 0 ${C.ink}}
.dsc-track{width:240px;height:10px;background:rgba(23,7,46,.6);border:2px solid ${C.ink};transform:skewX(-10deg);overflow:hidden}
.dsc-fill{height:100%;width:0;background:linear-gradient(90deg,${C.cyan},${C.pink})}
.dsc-fill.on{background:${C.lime}}
.dsc-hud-bonus{font-size:13px;color:${C.cyan};text-shadow:2px 2px 0 ${C.ink}}
.dsc-crash{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);z-index:15;pointer-events:none;opacity:0;white-space:nowrap;font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;font-size:clamp(40px,9vw,96px);text-shadow:4px 4px 0 ${C.ink},8px 8px 0 ${C.pink}}
.dsc-crash.hit{color:${C.red}}
.dsc-crash.shield{color:${C.cyan}}
.dsc-crash.over{color:${C.red}}
.dsc-crash.save{color:${C.lime}}
.dsc-crash .sub{display:block;font-size:clamp(18px,3vw,32px);line-height:1.1;color:#fff;text-shadow:2px 2px 0 ${C.ink}}
.dsc-crash.go{animation:dsc-crash 1.2s ease-out forwards}
@keyframes dsc-crash{0%{opacity:0;transform:translate(-50%,-50%) skewX(-10deg) scale(.4)}12%{opacity:1;transform:translate(-50%,-50%) skewX(-10deg) scale(1.15)}22%{opacity:1;transform:translate(-50%,-50%) skewX(-10deg) scale(1)}75%{opacity:1;transform:translate(-50%,-50%) skewX(-10deg) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) skewX(-10deg) scale(1)}}
.dsc-mode{position:fixed;top:56px;left:50%;transform:translateX(-50%) skewX(-10deg);pointer-events:auto;z-index:6;display:inline-block;font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;font-size:18px;line-height:1;text-transform:uppercase;color:${C.ink};background:linear-gradient(90deg,${C.cyan},${C.yellow});padding:7px 14px;border:2px solid ${C.ink};box-shadow:4px 4px 0 ${C.pink};text-decoration:none;white-space:nowrap}
.dsc-mode:hover,.dsc-mode:focus-visible{outline:none;filter:brightness(1.1)}
@media (max-width:600px){.dsc-cards,.dsc-perks{flex-direction:column;align-items:stretch}.dsc-card,.dsc-perk{flex:none;max-width:none;width:100%}}
`;

function ensureStyle(): void {
  if (document.getElementById('dsc-style')) return;
  const s = document.createElement('style');
  s.id = 'dsc-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function chip(r: HillReward): HTMLElement {
  if (r.kind === 'perk') return el('span', 'dsc-chip k-perk', `PERK (${r.amount} choices)`);
  if (r.kind === 'life') return el('span', 'dsc-chip k-life', `+${r.amount} ❤ 1-UP`);
  return el('span', 'dsc-chip k-shield', `+${r.amount} 🛡 SHIELD`);
}

function chipRow(rewards: HillReward[]): HTMLElement {
  const row = el('div', 'dsc-chips');
  if (rewards.length === 0) row.appendChild(el('span', 'dsc-chip k-none', 'SCORE ONLY'));
  for (const r of rewards) row.appendChild(chip(r));
  return row;
}

const SLIDERS: [keyof HillCard['params'], string, string][] = [
  ['hazard', 'HAZARD', C.red],
  ['steep', 'STEEP', C.orange],
  ['tricky', 'TRICKY', C.cyan],
];

/** The terrain a hill card promises, read off its sliders (for the dim line under the bars). */
function terrainTags(p: HillParams): string {
  const tags = ['PINE FORESTS'];
  if (p.hazard >= 1) tags.push('GLADES');
  if (p.hazard >= 2) tags.push('ROCK GARDENS');
  if (p.hazard >= 3) tags.push('SPIKES');
  if (p.steep >= 2) tags.push('CLIFFS');
  if (p.steep >= 4) tags.push('BIG DROPS');
  if (p.tricky >= 2) tags.push('TRICK LINE');
  if (p.hazard >= 1 || p.tricky >= 2) tags.push('FORKS');
  return tags.join(' · ');
}

function sliderRow(label: string, value: number, color: string): HTMLElement {
  const row = el('div', 'dsc-row');
  row.style.setProperty('--c', color);
  row.appendChild(el('span', 'dsc-lbl', label));
  const pips = el('span', 'dsc-pips');
  const v = Math.max(0, Math.min(5, Math.round(value)));
  for (let i = 0; i < 5; i++) pips.appendChild(el('i', i < v ? 'dsc-pip on' : 'dsc-pip'));
  row.appendChild(pips);
  return row;
}

function heartsText(lives: number, maxLives: number): string {
  const l = Math.max(0, Math.round(lives));
  return '❤'.repeat(l) + '♡'.repeat(Math.max(0, Math.round(maxLives) - l));
}

export function createDescentUi(ui: HTMLElement): DescentUi {
  ensureStyle();
  const root = el('div');
  root.id = 'dsc';
  ui.appendChild(root);

  // ---- shared screen layer (picker / reward / end)
  const layer = el('div', 'dsc-screen');
  root.appendChild(layer);

  let keyOff: (() => void) | null = null;
  function clearKeys(): void {
    if (keyOff) {
      keyOff();
      keyOff = null;
    }
  }
  function setKeys(fn: (e: KeyboardEvent) => void): void {
    clearKeys();
    const h = (e: KeyboardEvent): void => fn(e);
    window.addEventListener('keydown', h);
    keyOff = () => window.removeEventListener('keydown', h);
  }
  function showScreen(nodes: HTMLElement[]): void {
    layer.textContent = '';
    for (const n of nodes) layer.appendChild(n);
    layer.classList.add('on');
    layer.scrollTop = 0;
  }
  function statsEl(run: RunState): HTMLElement {
    const s = el('div', 'dsc-stats');
    s.appendChild(el('span', 'dsc-hearts', heartsText(run.lives, run.maxLives)));
    if (run.shields > 0) s.appendChild(el('span', 'dsc-shields', `🛡 x${Math.round(run.shields)}`));
    s.appendChild(el('span', '', `SCORE ${Math.round(run.score).toLocaleString()}`));
    return s;
  }

  // ---- riding HUD
  const hud = el('div', 'dsc-hud');
  const hudTop = el('div', 'dsc-hud-top');
  const hudHearts = el('span', 'dsc-hearts');
  const hudShields = el('span', 'dsc-shields');
  hudTop.appendChild(hudHearts);
  hudTop.appendChild(hudShields);
  const hudLabel = el('div', 'dsc-hud-label');
  const hudFill = el('div', 'dsc-fill');
  const hudTrack = el('div', 'dsc-track');
  hudTrack.appendChild(hudFill);
  const hudBonus = el('div', 'dsc-hud-bonus');
  hud.appendChild(hudTop);
  hud.appendChild(hudLabel);
  hud.appendChild(hudTrack);
  hud.appendChild(hudBonus);
  root.appendChild(hud);
  let hudOn = false;
  const hudCache = { hearts: '', shields: '', label: '', pct: -1, reached: false, bonus: '' };

  // ---- crash flash (one element, restarted per crash)
  const crash = el('div', 'dsc-crash');
  root.appendChild(crash);

  return {
    showPicker(run, cards, onPick): void {
      let done = false;
      const pick = (c: HillCard): void => {
        if (done) return;
        done = true;
        clearKeys();
        onPick(c);
      };
      const head = el('div', 'dsc-head', `HILL ${run.hill + 1} / ${DESCENT.hills}`);
      if (cards.length > 0 && cards[0].boss) head.appendChild(el('span', 'dsc-tag', 'BOSS HILL'));

      const row = el('div', 'dsc-cards');
      cards.forEach((card, i) => {
        const b = el('button', 'dsc-card' + (card.boss ? ' boss' : ''));
        b.type = 'button';
        b.appendChild(el('div', 'dsc-cname', card.name));
        const sliders = el('div', 'dsc-sliders');
        for (const [k, label, color] of SLIDERS) sliders.appendChild(sliderRow(label, card.params[k], color));
        b.appendChild(sliders);
        b.appendChild(el('div', 'dsc-terrain', terrainTags(card.params)));
        b.appendChild(el('div', 'dsc-mult', `x${card.mult.toFixed(2)} SCORE`));
        b.appendChild(chipRow(card.rewards));
        const bonus = el('div', 'dsc-bonus', `BONUS ${Math.round(card.bonusTarget).toLocaleString()} PTS →`);
        bonus.appendChild(chip(card.bonusReward));
        b.appendChild(bonus);
        b.appendChild(el('div', 'dsc-key', `[${i + 1}]`));
        b.addEventListener('click', () => pick(card));
        row.appendChild(b);
      });

      setKeys((e) => {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= cards.length) {
          e.preventDefault();
          pick(cards[n - 1]);
        }
      });
      showScreen([head, statsEl(run), row]);
    },

    showReward(run, result, onDone): void {
      let done = false;
      const finish = (perk: PerkId | null): void => {
        if (done) return;
        done = true;
        clearKeys();
        onDone(perk);
      };
      const hillScore = Math.round(result.hillScore);
      const lines = el('div', 'dsc-lines');
      lines.appendChild(el('div', 'dsc-line', `TRICKS ${hillScore.toLocaleString()}`));
      if (result.hillScore > 0) {
        lines.appendChild(el('div', 'dsc-line', `x${(result.banked / result.hillScore).toFixed(2)}`));
      }
      lines.appendChild(el('div', 'dsc-line big', `BANKED +${Math.round(result.banked).toLocaleString()}`));
      lines.appendChild(result.bonusHit
        ? el('div', 'dsc-line lime', 'BONUS HIT!')
        : el('div', 'dsc-line dsc-dim', 'bonus missed'));

      const nodes: HTMLElement[] = [el('div', 'dsc-head', 'HILL CLEARED'), lines];
      if (result.granted.length > 0) nodes.push(chipRow(result.granted));

      if (result.perkChoices.length > 0) {
        nodes.push(el('div', 'dsc-line yellow', 'PICK A PERK'));
        const perks = el('div', 'dsc-perks');
        result.perkChoices.forEach((id, i) => {
          const def = PERKS[id];
          const owned = run.perks[id] ?? 0;
          const b = el('button', 'dsc-perk');
          b.type = 'button';
          b.appendChild(el('div', 'dsc-pname', def.name));
          b.appendChild(el('div', 'dsc-pdesc', def.desc));
          b.appendChild(el('div', 'dsc-lv', `LV ${owned} → ${owned + 1}`));
          b.appendChild(el('div', 'dsc-key', `[${i + 1}]`));
          b.addEventListener('click', () => finish(id));
          perks.appendChild(b);
        });
        nodes.push(perks);
        setKeys((e) => {
          const n = Number(e.key);
          if (Number.isInteger(n) && n >= 1 && n <= result.perkChoices.length) {
            e.preventDefault();
            finish(result.perkChoices[n - 1]);
          }
        });
      } else {
        const btn = el('button', 'dsc-btn', 'CONTINUE');
        btn.type = 'button';
        btn.addEventListener('click', () => finish(null));
        nodes.push(btn);
        setKeys((e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            finish(null);
          }
        });
      }
      showScreen(nodes);
    },

    showEnd(run, won, best, onRestart): void {
      let done = false;
      const restart = (): void => {
        if (done) return;
        done = true;
        clearKeys();
        onRestart();
      };
      const lines = el('div', 'dsc-lines');
      lines.appendChild(el('div', 'dsc-line', `HILLS ${run.hill}`));
      lines.appendChild(el('div', 'dsc-line', `SCORE ${Math.round(run.score).toLocaleString()}`));
      lines.appendChild(el('div', 'dsc-line yellow', `BEST ${Math.round(best).toLocaleString()}`));
      if (run.score >= best && run.score > 0) lines.appendChild(el('div', 'dsc-line lime', 'NEW BEST!'));
      const btn = el('button', 'dsc-btn', 'NEW RUN');
      btn.type = 'button';
      btn.addEventListener('click', restart);
      setKeys((e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          restart();
        }
      });
      showScreen([
        el('div', 'dsc-head', won ? 'DESCENT CLEARED!' : 'WIPEOUT'),
        lines,
        btn,
      ]);
    },

    hideScreens(): void {
      clearKeys();
      layer.classList.remove('on');
      layer.textContent = '';
    },

    updateHud(run, hillScore, riding): void {
      const cur = run.current;
      const on = riding && cur !== null;
      if (on !== hudOn) {
        hudOn = on;
        hud.style.display = on ? 'flex' : 'none';
      }
      if (!on || !cur) return;

      const hearts = heartsText(run.lives, run.maxLives);
      if (hearts !== hudCache.hearts) {
        hudCache.hearts = hearts;
        hudHearts.textContent = hearts;
      }
      const shields = run.shields > 0 ? `🛡 x${Math.round(run.shields)}` : '';
      if (shields !== hudCache.shields) {
        hudCache.shields = shields;
        hudShields.textContent = shields;
      }
      const label = `HILL ${run.hill + 1}/${DESCENT.hills} · ${cur.name}`;
      if (label !== hudCache.label) {
        hudCache.label = label;
        hudLabel.textContent = label;
      }
      const score = Math.max(0, Math.round(hillScore));
      const target = Math.max(1, Math.round(cur.bonusTarget));
      const pct = Math.min(100, Math.round((score / target) * 100));
      if (pct !== hudCache.pct) {
        hudCache.pct = pct;
        hudFill.style.width = `${pct}%`;
      }
      const reached = score >= target;
      if (reached !== hudCache.reached) {
        hudCache.reached = reached;
        hudFill.classList.toggle('on', reached);
      }
      const bonus = `BONUS ${score.toLocaleString()}/${target.toLocaleString()}`;
      if (bonus !== hudCache.bonus) {
        hudCache.bonus = bonus;
        hudBonus.textContent = bonus;
      }
    },

    flashSave(reason: string): void {
      crash.className = 'dsc-crash save';
      crash.textContent = 'SAVED!';
      crash.appendChild(el('span', 'sub', reason));
      void crash.offsetWidth;
      crash.classList.add('go');
    },
    flashCrash(r): void {
      const text = r.shielded ? 'SHIELD!' : r.over ? 'WIPEOUT' : `-1 ❤  (${Math.round(r.livesLeft)} LEFT)`;
      const kind = r.shielded ? 'shield' : r.over ? 'over' : 'hit';
      crash.className = `dsc-crash ${kind}`;
      crash.textContent = text;
      void crash.offsetWidth;
      crash.classList.add('go');
    },
  };
}

/** A small pill on the title / pause card: 'DESCENT MODE →' (in free ride) or '← FREE RIDE' (in descent). It links
 *  to ?mode=descent or to the page without mode (keeping ?seed). Visible only while `show` is true. */
export interface ModeSwitch {
  update(show: boolean): void;
}

export function createModeSwitch(ui: HTMLElement, descent: boolean): ModeSwitch {
  ensureStyle();
  const a = el('a', 'dsc-mode');
  const u = new URL(location.href);
  if (descent) u.searchParams.delete('mode');
  else u.searchParams.set('mode', 'descent');
  a.href = u.toString();
  a.textContent = descent ? '← FREE RIDE' : 'DESCENT MODE →';
  a.style.display = 'none';
  ui.appendChild(a);
  let shown = false;
  return {
    update(show: boolean): void {
      if (show === shown) return;
      shown = show;
      a.style.display = show ? '' : 'none';
    },
  };
}
