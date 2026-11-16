import { createVolumePanel } from '@arcade/volume';
import type { PauseData, PauseUI } from '../config';
import { volume } from '../volume';

/** Pause screen: compact run summary, volume controls, resume / give up. */

const SUB_LINES = [
  'The mowers are also paused. Out of respect.',
  'Take a breath. The lawn will wait.',
  'Pausing is a valid roguelike strategy.',
  'Your gnome is frozen in a heroic pose.',
];

const DISARM_MS = 3000;

const CSS = `
.ps-root {
  position: absolute; inset: 0; z-index: 50; width: 100%; height: 100%; box-sizing: border-box; overflow-y: auto; pointer-events: auto;
  display: flex; flex-direction: column;
  background: rgba(10, 10, 30, .78); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  font-family: 'Arial Black', Impact, system-ui, sans-serif; color: #fff;
}
.ps-col {
  width: 100%; max-width: 520px; box-sizing: border-box; margin: auto; padding: 28px 16px;
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

  function render(): void {
    if (!state) return;
    col.replaceChildren(
      headerSection(state.d),
      volumeSection,
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
