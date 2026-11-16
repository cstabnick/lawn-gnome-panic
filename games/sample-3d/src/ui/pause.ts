import { createVolumePanel } from '@arcade/volume';
import type { MetaUpgradeId, PassiveId, PauseData, PauseUI, PlayerStats, WeaponId } from '../config';
import { BASE_STATS, META_UPGRADES, PASSIVE_DEFS, WEAPON_DEFS } from '../config';
import { volume } from '../volume';

/** Pause screen: run progress, owned weapons and passives, stats, permanent upgrades. */

const SUB_LINES = [
  'The mowers are also paused. Out of respect.',
  'Take a breath. The lawn will wait.',
  'Pausing is a valid roguelike strategy.',
  'Your gnome is frozen in a heroic pose.',
];

const ICONS: Record<string, string> = {
  slingshot: '🪨', trowels: '🔱', sprinkler: '💦', mushrooms: '🍄',
  stormOfDaggers: '🗡️', leafPileFireball: '🍂', hoseMissile: '🚿', windChimeLullaby: '🎐', leafBlower: '🌬️', pitchfork: '🔱',
  fertilizer: '🌱', compost: '♻️', comfyBoots: '👢', rake: '🧲', thickBeard: '🧔', sneakers: '👟', luckyClover: '🍀', mulchArmor: '🛡️',
};

const WEAPON_BORDER = '#ffd54f';
const PASSIVE_BORDER = '#4dd0e1';
const DISARM_MS = 3000;

const CSS = `
.ps-root {
  position: absolute; inset: 0; z-index: 50; width: 100%; height: 100%; box-sizing: border-box; overflow-y: auto; pointer-events: auto;
  display: flex; flex-direction: column;
  background: rgba(10, 10, 30, .78); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  font-family: 'Arial Black', Impact, system-ui, sans-serif; color: #fff;
}
.ps-col {
  width: 100%; max-width: 1000px; box-sizing: border-box; margin: auto; padding: 32px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 22px;
}
.ps-title { margin: 0; font-size: 56px; line-height: 1; color: #ffd54f; font-style: italic; text-align: center; text-shadow: 0 4px 0 #000, 0 0 18px rgba(255, 213, 79, .5); }
.ps-sub { margin: 0; font-size: 18px; opacity: .9; text-align: center; font-family: system-ui, sans-serif; text-shadow: 0 2px 0 #000; }
.ps-section { width: 100%; }
.ps-h { margin: 0 0 10px; font-size: 18px; color: #ffd54f; letter-spacing: 2px; text-shadow: 0 2px 0 #000; }
.ps-chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.ps-chip {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 12px;
  background: #1d1d3a; border: 2px solid #3d3d6b; font-size: 16px; white-space: nowrap; text-shadow: 0 2px 0 #000;
}
.ps-chip-accent { color: #ffd54f; }
.ps-xp { width: 110px; height: 10px; border-radius: 5px; background: #0b0b1f; border: 1px solid #3d3d6b; overflow: hidden; }
.ps-xp-fill { height: 100%; background: linear-gradient(90deg, #76ff03, #00e5ff); }
.ps-heart { color: #ff5252; }
.ps-heart-off { color: #4a3a5a; }
.ps-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.ps-card {
  display: flex; gap: 12px; align-items: flex-start; box-sizing: border-box; padding: 12px;
  border-radius: 14px; border: 3px solid var(--ps-c); background: linear-gradient(160deg, #2b2b4f, #101028);
}
.ps-card-dim { opacity: .4; }
.ps-card-icon { font-size: 34px; line-height: 1; }
.ps-card-body { flex: 1; min-width: 0; }
.ps-card-name { font-size: 17px; line-height: 1.15; }
.ps-pips { margin: 4px 0; font-size: 12px; letter-spacing: 2px; color: var(--ps-c); }
.ps-pip-off { color: #3d3d6b; }
.ps-card-text { font-size: 13px; line-height: 1.3; opacity: .9; font-family: system-ui, sans-serif; }
.ps-empty { font-size: 14px; opacity: .7; font-family: system-ui, sans-serif; }
.ps-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-family: system-ui, sans-serif; }
.ps-stat { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 5px 0; border-bottom: 1px dotted #3d3d6b; font-size: 15px; }
.ps-stat-val { white-space: nowrap; }
.ps-delta { margin-left: 6px; color: #76ff03; font-size: 13px; }
.ps-delta-down { color: #ff8a80; }
.ps-buttons { display: flex; flex-direction: column; align-items: center; gap: 14px; width: 100%; }
.ps-resume {
  font-family: inherit; font-size: 28px; padding: 16px 56px; cursor: pointer;
  border-radius: 16px; border: 3px solid #ffd54f; background: #ffd54f; color: #111;
  box-shadow: 0 6px 0 #b08d1f; text-shadow: none;
}
.ps-resume:active { transform: translateY(3px); box-shadow: 0 3px 0 #b08d1f; }
.ps-quit {
  font-family: inherit; font-size: 15px; padding: 10px 22px; cursor: pointer;
  border-radius: 12px; border: 2px solid #8b1a1a; background: transparent; color: #ff8a80;
}
.ps-quit.ps-armed { background: #5a0d0d; color: #fff; border-color: #ff5252; }
@media (max-width: 760px) {
  .ps-title { font-size: 36px; }
  .ps-cards, .ps-stats { grid-template-columns: 1fr; }
  .ps-resume, .ps-quit { width: 100%; box-sizing: border-box; }
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
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Pips: filled up to `level`, empty up to `max`. */
function pips(level: number, max: number, colour: string): HTMLElement {
  const row = el('div', 'ps-pips');
  row.style.setProperty('--ps-c', colour);
  for (let i = 1; i <= max; i++) {
    const p = el('span', i <= level ? '' : 'ps-pip-off', i <= level ? '●' : '○');
    row.append(p);
  }
  return row;
}

interface StatSpec {
  label: string;
  value: string;
  delta: string | null;
  down: boolean;
}

/** Additive stat: delta shown as (+x) in green, (-x) in red. */
function additive(label: string, now: number, base: number, digits: number, unit: string): StatSpec {
  const diff = now - base;
  const changed = Math.abs(diff) > 1e-6;
  const sign = diff > 0 ? '+' : '';
  return {
    label,
    value: `${now.toFixed(digits)}${unit}`,
    delta: changed ? `(${sign}${diff.toFixed(digits)})` : null,
    down: diff < 0,
  };
}

/** Multiplier stat: delta shown as (xN) where N is the ratio to base. */
function multiplier(label: string, now: number, base: number): StatSpec {
  const ratio = base === 0 ? 1 : now / base;
  const changed = Math.abs(now - base) > 1e-6;
  return {
    label,
    value: `x${now.toFixed(2)}`,
    delta: changed ? `(x${ratio.toFixed(2)})` : null,
    down: now < base,
  };
}

function statSpecs(s: PlayerStats): StatSpec[] {
  const b = BASE_STATS;
  return [
    additive('Move speed', s.moveSpeed, b.moveSpeed, 1, ' m/s'),
    additive('Sprint', s.staminaMax, b.staminaMax, 1, 's'),
    additive('Stamina regen', s.staminaRegenPerSec, b.staminaRegenPerSec, 1, '/s'),
    additive('Jump power', s.jumpSpeed, b.jumpSpeed, 1, ''),
    additive('Max hearts', s.maxHearts, b.maxHearts, 0, ''),
    additive('Pickup range', s.magnetRadius, b.magnetRadius, 2, ' m'),
    multiplier('Damage', s.damageMult, b.damageMult),
    multiplier('Cooldowns', s.cooldownMult, b.cooldownMult),
    multiplier('XP gain', s.xpMultiplier, b.xpMultiplier),
    additive('Rerolls', s.rerolls, b.rerolls, 0, ''),
  ];
}

interface PauseState {
  d: PauseData;
  onResume: () => void;
  onQuit: () => void;
}

export function createPauseUI(parent: HTMLElement): PauseUI {
  // Own container: never restyle the shared #ui root.
  const root = document.createElement('div');
  parent.appendChild(root);
  injectStyle('ps-style', CSS);
  root.classList.add('ps-root');
  root.style.display = 'none';

  const col = el('div', 'ps-col');
  root.appendChild(col);

  let state: PauseState | null = null;
  let subText = SUB_LINES[0];
  let armed = false;
  let armTimer: number | null = null;

  // Buttons & volume panel persist across renders.
  const volumeSection = el('div', 'ps-section');
  volumeSection.append(el('h2', 'ps-h', 'VOLUME'));
  createVolumePanel(volumeSection, volume, {
    theme: { accent: '#ffd54f', bg: 'linear-gradient(160deg, #2b2b4f, #101028)', border: '#3d3d6b' },
  });

  const buttons = el('div', 'ps-buttons');
  const resumeBtn = el('button', 'ps-resume', 'RESUME');
  resumeBtn.type = 'button';
  const quitBtn = el('button', 'ps-quit', 'GIVE UP');
  quitBtn.type = 'button';
  buttons.append(resumeBtn, quitBtn);

  function disarm(): void {
    if (armTimer !== null) {
      window.clearTimeout(armTimer);
      armTimer = null;
    }
    armed = false;
    quitBtn.textContent = 'GIVE UP';
    quitBtn.classList.remove('ps-armed');
  }

  resumeBtn.addEventListener('click', () => {
    state?.onResume();
  });
  quitBtn.addEventListener('click', () => {
    if (!state) return;
    if (armed) {
      const onQuit = state.onQuit;
      disarm();
      onQuit();
      return;
    }
    armed = true;
    quitBtn.textContent = 'REALLY? (acorns still banked)';
    quitBtn.classList.add('ps-armed');
    armTimer = window.setTimeout(disarm, DISARM_MS);
  });

  function headerSection(d: PauseData): HTMLElement {
    const wrap = el('div', 'ps-section');
    const title = el('h1', 'ps-title', 'PAUSED');
    const sub = el('p', 'ps-sub', subText);
    const chips = el('div', 'ps-chips');
    chips.style.marginTop = '12px';

    chips.append(el('div', 'ps-chip', d.mode === 'royale' ? 'BATTLE ROYALE' : 'SOLO'));
    chips.append(el('div', 'ps-chip', `Run #${d.runNumber}`));
    chips.append(el('div', 'ps-chip', fmtTime(d.elapsedS)));

    const lv = el('div', 'ps-chip');
    lv.append(el('span', 'ps-chip-accent', `LV ${d.level}`));
    const bar = el('div', 'ps-xp');
    const fill = el('div', 'ps-xp-fill');
    fill.style.width = `${Math.max(0, Math.min(1, d.xp01)) * 100}%`;
    bar.append(fill);
    lv.append(bar);
    chips.append(lv);

    const hearts = el('div', 'ps-chip');
    for (let i = 0; i < d.maxHearts; i++) {
      hearts.append(el('span', i < d.hearts ? 'ps-heart' : 'ps-heart-off', '♥'));
    }
    chips.append(hearts);

    chips.append(el('div', 'ps-chip', `☠ ${d.kills}`));
    chips.append(el('div', 'ps-chip', `🌰 ${d.acorns}`));
    if (d.gnomesLeft !== null) {
      chips.append(el('div', 'ps-chip ps-chip-accent', `${d.gnomesLeft} GNOMES LEFT`));
    }

    wrap.append(chips);
    const head = el('div', 'ps-section');
    head.style.display = 'flex';
    head.style.flexDirection = 'column';
    head.style.alignItems = 'center';
    head.style.gap = '10px';
    head.append(title, sub);
    const out = el('div', 'ps-section');
    out.style.display = 'flex';
    out.style.flexDirection = 'column';
    out.style.alignItems = 'center';
    out.append(head, wrap);
    return out;
  }

  function loadoutSection(d: PauseData): HTMLElement {
    const section = el('div', 'ps-section');
    section.append(el('h2', 'ps-h', 'LOADOUT'));
    const cards = el('div', 'ps-cards');

    for (const id of Object.keys(d.weapons) as WeaponId[]) {
      const lvl = d.weapons[id] ?? 0;
      const def = WEAPON_DEFS[id];
      if (!def || lvl < 1) continue;
      const card = el('div', 'ps-card');
      card.style.setProperty('--ps-c', WEAPON_BORDER);
      const body = el('div', 'ps-card-body');
      body.append(
        el('div', 'ps-card-name', def.name),
        pips(lvl, def.levelText.length, WEAPON_BORDER),
        el('div', 'ps-card-text', def.levelText[lvl - 1] ?? ''),
      );
      card.append(el('div', 'ps-card-icon', ICONS[id] ?? ''), body);
      cards.append(card);
    }

    for (const id of Object.keys(d.passives) as PassiveId[]) {
      const lvl = d.passives[id] ?? 0;
      const def = PASSIVE_DEFS[id];
      if (!def || lvl < 1) continue;
      const card = el('div', 'ps-card');
      card.style.setProperty('--ps-c', PASSIVE_BORDER);
      const body = el('div', 'ps-card-body');
      body.append(
        el('div', 'ps-card-name', def.name),
        pips(lvl, def.maxLevel, PASSIVE_BORDER),
        el('div', 'ps-card-text', `${def.effect} x${lvl}`),
      );
      card.append(el('div', 'ps-card-icon', ICONS[id] ?? ''), body);
      cards.append(card);
    }

    if (cards.childElementCount === 0) {
      section.append(el('div', 'ps-empty', 'Nothing owned yet. Just vibes.'));
    } else {
      section.append(cards);
    }
    return section;
  }

  function statsSection(d: PauseData): HTMLElement {
    const section = el('div', 'ps-section');
    section.append(el('h2', 'ps-h', 'STATS'));
    const list = el('div', 'ps-stats');
    for (const s of statSpecs(d.stats)) {
      const row = el('div', 'ps-stat');
      row.append(el('span', '', s.label));
      const val = el('span', 'ps-stat-val', s.value);
      if (s.delta) {
        const delta = el('span', s.down ? 'ps-delta ps-delta-down' : 'ps-delta', s.delta);
        val.append(delta);
      }
      row.append(val);
      list.append(row);
    }
    section.append(list);
    return section;
  }

  function metaSection(d: PauseData): HTMLElement {
    const section = el('div', 'ps-section');
    section.append(el('h2', 'ps-h', 'PRIMITIVE POWERS (permanent)'));
    const grid = el('div', 'ps-cards');
    for (const def of META_UPGRADES) {
      const lvl = d.meta[def.id as MetaUpgradeId] ?? 0;
      const card = el('div', lvl > 0 ? 'ps-card' : 'ps-card ps-card-dim');
      card.style.setProperty('--ps-c', lvl > 0 ? WEAPON_BORDER : '#3d3d6b');
      const body = el('div', 'ps-card-body');
      body.append(
        el('div', 'ps-card-name', def.name),
        pips(lvl, def.maxLevel, '#ffd54f'),
        el('div', 'ps-card-text', def.effect),
      );
      card.append(body);
      grid.append(card);
    }
    section.append(grid);
    return section;
  }

  function render(): void {
    if (!state) return;
    const d = state.d;
    col.replaceChildren(
      headerSection(d),
      volumeSection,
      loadoutSection(d),
      statsSection(d),
      metaSection(d),
      buttons,
    );
  }

  return {
    show(d: PauseData, onResume: () => void, onQuit: () => void): void {
      disarm();
      state = { d, onResume, onQuit };
      subText = SUB_LINES[Math.floor(Math.random() * SUB_LINES.length)];
      render();
      root.style.display = '';
    },
    hide(): void {
      root.style.display = 'none';
      disarm();
      state = null;
    },
  };
}
