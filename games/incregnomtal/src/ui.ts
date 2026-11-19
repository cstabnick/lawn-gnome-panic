import { createVolumeButton } from '@arcade/volume';
import {
  BISCUIT_TRICKS,
  CRITTER_ORDER,
  CRITTERS,
  DAY_NAMES,
  DECOR_ORDER,
  DECORS,
  GRASS_ORDER,
  GRASSES,
  PLOT_TIERS,
  PROBLEMS,
  TOOLS,
  TREE_NODES,
  decorCost,
  formatNum,
  gnomeHireCost,
  resowCost,
  weekLengthSec,
} from './balance.ts';
import type { JobId } from './balance.ts';
import { volumeStore } from './audio.ts';
import {
  canBuyTreeNode,
  computeStats,
  countDecor,
  hasCritter,
  hasNode,
  hasTrick,
} from './sim/engine.ts';
import { exportSaveString, importSaveString } from './sim/state.ts';
import type { GameAction, GameState, SimEvent } from './sim/types.ts';

type TabId = 'crew' | 'lawn' | 'critters' | 'decor' | 'tree';

export interface UIController {
  render: (state: GameState) => void;
  showOfflineModal: (clippingsEarned: number, secondsApplied: number) => void;
  showEndingModal: (state: GameState) => void;
  setTab: (tab: TabId) => void;
}

const JOB_META: { id: JobId; name: string; icon: string; desc: string }[] = [
  { id: 'trim', name: 'Trim', icon: '✂️', desc: 'Auto-trims grass for Clippings/s' },
  { id: 'water', name: 'Water', icon: '💧', desc: 'Carries water to keep tiles lush' },
  { id: 'weed', name: 'Weed', icon: '🌼', desc: 'Pulls dandelions into Wishes' },
  { id: 'compost', name: 'Compost', icon: '🟤', desc: 'Turns Clippings into Loam' },
  { id: 'dog', name: 'Dog-Handler', icon: '🎾', desc: 'Slowly teaches Biscuit tricks' },
];

export function createUI(
  uiRoot: HTMLElement,
  getState: () => GameState,
  dispatch: (action: GameAction) => SimEvent[],
  onImportState: (s: GameState) => void,
  onResetGame: () => void,
): UIController {
  let activeTab: TabId = 'crew';
  let lastBodyKey = '';

  const style = document.createElement('style');
  style.textContent = `
    #inc-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      color: #f4f1e6;
      font-size: 13px;
    }
    #inc-root button {
      font-family: inherit;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 8px;
      background: #2f422b;
      color: #f6f4ec;
      min-height: 44px;
      min-width: 44px;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 600;
      touch-action: manipulation;
    }
    #inc-root button:active { transform: scale(0.97); }
    #inc-root button:disabled {
      opacity: 0.45;
      cursor: default;
    }
    #inc-root button.primary {
      background: #467d3b;
      border-color: #7cc96b;
    }
    #inc-root button.accent {
      background: #8c6222;
      border-color: #e6b85c;
    }
    #inc-hud {
      pointer-events: auto;
      background: rgba(20, 31, 18, 0.92);
      border-bottom: 1px solid rgba(255,255,255,0.12);
      padding: calc(6px + env(safe-area-inset-top)) 10px 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 10;
    }
    .inc-hud-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .inc-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255,255,255,0.08);
      padding: 3px 8px;
      border-radius: 999px;
      font-weight: 600;
      white-space: nowrap;
    }
    .inc-bar-wrap {
      flex: 1;
      min-width: 60px;
      height: 10px;
      background: rgba(255,255,255,0.12);
      border-radius: 999px;
      overflow: hidden;
    }
    .inc-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #74c95b, #f0c948);
      width: 0%;
    }
    #inc-bell-btn, #inc-settings-btn, #inc-wish-btn {
      min-height: 36px;
      padding: 4px 9px;
      font-size: 12px;
    }
    #inc-combine-banner {
      display: none;
      pointer-events: none;
      position: fixed;
      top: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: #9e241b;
      border: 2px solid #ffd257;
      color: #fff;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 10px;
      z-index: 40;
      text-align: center;
    }
    #inc-panel {
      pointer-events: auto;
      margin-top: auto;
      background: rgba(22, 33, 20, 0.95);
      border-top: 1px solid rgba(255,255,255,0.14);
      display: flex;
      flex-direction: column;
      height: clamp(235px, 36vh, 310px);
      padding-bottom: env(safe-area-inset-bottom);
      z-index: 12;
    }
    #inc-teacup {
      padding: 5px 10px;
      background: rgba(58, 43, 26, 0.9);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 12px;
      color: #f7e6c4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #inc-tabs {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
      padding: 5px 6px;
      background: rgba(15, 24, 14, 0.9);
    }
    #inc-tabs button {
      min-height: 44px;
      padding: 4px 2px;
      font-size: 12px;
      border-radius: 6px;
      background: #233320;
    }
    #inc-tabs button.active {
      background: #487a3d;
      border-color: #9be685;
    }
    #inc-body {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .inc-card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .inc-card-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .inc-card-title { font-weight: 700; font-size: 13px; }
    .inc-card-sub { font-size: 11px; color: #c7d4c0; line-height: 1.3; }
    .inc-btn-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .inc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    #inc-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.68);
      pointer-events: auto;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 60;
    }
    #inc-modal {
      background: #21301e;
      border: 2px solid #79b869;
      border-radius: 12px;
      max-width: 420px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #inc-modal textarea {
      width: 100%;
      min-height: 70px;
      background: #141f12;
      color: #e6f0df;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 6px;
      box-sizing: border-box;
      font-size: 11px;
    }
    @media (min-width: 680px) and (orientation: landscape) {
      #inc-hud {
        max-width: calc(100% - clamp(300px, 40vw, 390px));
        border-right: 1px solid rgba(255,255,255,0.12);
      }
      #inc-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: clamp(300px, 40vw, 390px);
        height: 100%;
        border-top: none;
        border-left: 1px solid rgba(255,255,255,0.16);
      }
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'inc-root';

  // Top HUD
  const hud = document.createElement('div');
  hud.id = 'inc-hud';
  hud.innerHTML = `
    <div class="inc-hud-row">
      <span class="inc-pill" id="inc-clock">☀ W1 Mon</span>
      <div class="inc-bar-wrap"><div class="inc-bar-fill" id="inc-week-bar"></div></div>
      <button id="inc-bell-btn" class="accent" title="Call Old Saturday early (from Wed)">🔔 Mow</button>
      <span id="inc-vol-slot"></span>
      <button id="inc-settings-btn" title="Save & Settings">⚙️</button>
    </div>
    <div class="inc-hud-row">
      <span class="inc-pill" id="inc-clippings">✂ 0</span>
      <span class="inc-pill" id="inc-water">💧 45</span>
      <span class="inc-pill" id="inc-loam">🟤 40</span>
      <span class="inc-pill" id="inc-acorns">🌰 3</span>
      <span class="inc-pill" id="inc-charm">✨ 0</span>
      <button id="inc-wish-btn" class="primary" style="display:none">🌼 Wish</button>
    </div>
  `;

  // Volume button inside HUD
  const volSlot = hud.querySelector('#inc-vol-slot') as HTMLElement;
  const volBtn = createVolumeButton(volSlot, volumeStore);
  volBtn.element.style.position = 'static';

  // Combine fake-out banner
  const combineBanner = document.createElement('div');
  combineBanner.id = 'inc-combine-banner';
  combineBanner.textContent = '⚠️ A COMBINE APPROACHES — It is not here for you. This time.';

  // Panel (Teacup + Tabs + Body)
  const panel = document.createElement('div');
  panel.id = 'inc-panel';
  const teacupEl = document.createElement('div');
  teacupEl.id = 'inc-teacup';
  const tabsEl = document.createElement('div');
  tabsEl.id = 'inc-tabs';
  const bodyEl = document.createElement('div');
  bodyEl.id = 'inc-body';

  const tabDefs: { id: TabId; label: string }[] = [
    { id: 'crew', label: 'Crew' },
    { id: 'lawn', label: 'Lawn' },
    { id: 'critters', label: 'Critters' },
    { id: 'decor', label: 'Decor' },
    { id: 'tree', label: 'Tree' },
  ];
  const tabBtns: Record<TabId, HTMLButtonElement> = {} as Record<TabId, HTMLButtonElement>;
  for (const t of tabDefs) {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      activeTab = t.id;
      lastBodyKey = '';
      render(getState());
    });
    tabBtns[t.id] = btn;
    tabsEl.appendChild(btn);
  }

  panel.append(teacupEl, tabsEl, bodyEl);

  // Modal backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'inc-modal-backdrop';
  const modal = document.createElement('div');
  modal.id = 'inc-modal';
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.style.display = 'none';
  });

  root.append(hud, combineBanner, panel, backdrop);
  uiRoot.appendChild(root);

  // Wire HUD buttons
  const clockEl = hud.querySelector('#inc-clock') as HTMLElement;
  const weekBarEl = hud.querySelector('#inc-week-bar') as HTMLElement;
  const bellBtn = hud.querySelector('#inc-bell-btn') as HTMLButtonElement;
  const settingsBtn = hud.querySelector('#inc-settings-btn') as HTMLButtonElement;
  const clipEl = hud.querySelector('#inc-clippings') as HTMLElement;
  const waterEl = hud.querySelector('#inc-water') as HTMLElement;
  const loamEl = hud.querySelector('#inc-loam') as HTMLElement;
  const acornEl = hud.querySelector('#inc-acorns') as HTMLElement;
  const charmEl = hud.querySelector('#inc-charm') as HTMLElement;
  const wishBtn = hud.querySelector('#inc-wish-btn') as HTMLButtonElement;

  bellBtn.addEventListener('click', () => {
    dispatch({ type: 'ring-bell' });
    lastBodyKey = '';
    render(getState());
  });
  wishBtn.addEventListener('click', () => {
    dispatch({ type: 'blow-wish' });
    lastBodyKey = '';
    render(getState());
  });
  settingsBtn.addEventListener('click', () => openSettingsModal());

  function openModal(html: string): void {
    modal.innerHTML = html;
    backdrop.style.display = 'flex';
  }

  function closeModal(): void {
    backdrop.style.display = 'none';
  }

  function openSettingsModal(): void {
    const s = getState();
    const saveStr = exportSaveString(s);
    openModal(`
      <h3 style="margin:0">Settings & Save</h3>
      <div class="inc-card-sub">Autosaves every 10s. Copy this string to back up or move your lawn:</div>
      <textarea id="inc-export-box" readonly>${saveStr}</textarea>
      <div class="inc-btn-row">
        <button id="inc-copy-btn" class="primary">Copy Save</button>
        <button id="inc-import-btn">Import From Box</button>
      </div>
      <div class="inc-card-sub">Paste a save string below and tap Import:</div>
      <textarea id="inc-import-box" placeholder="Paste save string here..."></textarea>
      <div class="inc-btn-row" style="justify-content:space-between;margin-top:6px">
        <button id="inc-reset-btn" style="background:#7a2822">Hard Reset</button>
        <button id="inc-close-modal">Close</button>
      </div>
    `);
    modal.querySelector('#inc-copy-btn')?.addEventListener('click', () => {
      const box = modal.querySelector('#inc-export-box') as HTMLTextAreaElement;
      box.select();
      navigator.clipboard?.writeText(box.value).catch(() => {});
    });
    modal.querySelector('#inc-import-btn')?.addEventListener('click', () => {
      const box = modal.querySelector('#inc-import-box') as HTMLTextAreaElement;
      const imported = importSaveString(box.value);
      if (imported) {
        onImportState(imported);
        closeModal();
      }
    });
    modal.querySelector('#inc-reset-btn')?.addEventListener('click', () => {
      onResetGame();
      closeModal();
    });
    modal.querySelector('#inc-close-modal')?.addEventListener('click', closeModal);
  }

  function showOfflineModal(clippingsEarned: number, secondsApplied: number): void {
    const mins = Math.max(1, Math.round(secondsApplied / 60));
    openModal(`
      <h3 style="margin:0">While You Were Away</h3>
      <div class="inc-card-sub">Old Saturday waited patiently while the tab was closed. Your gnomes kept trimming for ${mins} min of catch-up and brought in:</div>
      <div style="font-size:20px;font-weight:800;color:#9ef584">+${formatNum(clippingsEarned)} ✂ Clippings</div>
      <button id="inc-close-modal" class="primary">Back to the Lawn</button>
    `);
    modal.querySelector('#inc-close-modal')?.addEventListener('click', closeModal);
  }

  function showEndingModal(state: GameState): void {
    const mins = Math.round(state.totalElapsedSec / 60);
    openModal(`
      <h2 style="margin:0;color:#ffe675">🏆 Yard of the Year!</h2>
      <div class="inc-card-sub">
        Old Saturday rolls to a gentle stop by the shed. The sign flips to <b>Yard of the Year</b>,
        the Panic Yard and Island Links gleam across the fence, and Biscuit curls up asleep in the shade.
      </div>
      ${state.secretHatEnding ? '<div class="inc-pill" style="background:#7a5b18;color:#fff3b0">🎩 Secret Ending: You mowed a Gnome Hat into the lawn!</div>' : ''}
      <div class="inc-card-sub">
        Run time: <b>${mins} min</b> · Mowing Days: <b>${state.mowingDays}</b> · Lifetime Mulch: <b>${formatNum(state.lifetimeMulch)}</b>
      </div>
      <div class="inc-card-sub" style="font-style:italic">
        Loose threads left loose: who starts Old Saturday, who gives the award, and whose boot print that was.
      </div>
      <button id="inc-sandbox-btn" class="primary">Continue in Sandbox (Golden Grass unlocked!)</button>
    `);
    modal.querySelector('#inc-sandbox-btn')?.addEventListener('click', () => {
      dispatch({ type: 'enter-sandbox' });
      closeModal();
      lastBodyKey = '';
      render(getState());
    });
  }

  function renderBody(state: GameState, stats: ReturnType<typeof computeStats>): void {
    bodyEl.innerHTML = '';

    if (activeTab === 'crew') {
      // Thimble + Hire Gnome top row
      const hire = gnomeHireCost(state.gnomes);
      const topRow = document.createElement('div');
      topRow.className = 'inc-grid-2';
      const thimbleBtn = document.createElement('button');
      thimbleBtn.className = 'primary';
      thimbleBtn.textContent = '💧 Tap Thimble';
      thimbleBtn.addEventListener('click', () => dispatch({ type: 'tap-thimble' }));

      const hireBtn = document.createElement('button');
      hireBtn.className = 'accent';
      hireBtn.disabled = state.clippings < hire.clippings || state.acorns < hire.acorns;
      hireBtn.textContent = `🎩 Hire (${formatNum(hire.clippings)}✂ ${hire.acorns}🌰)`;
      hireBtn.addEventListener('click', () => {
        dispatch({ type: 'hire-gnome' });
        lastBodyKey = '';
        render(getState());
      });
      topRow.append(thimbleBtn, hireBtn);
      bodyEl.appendChild(topRow);

      // Jobs list
      const unassigned = state.gnomes - Object.values(state.jobs).reduce((a, b) => a + b, 0);
      const crewHdr = document.createElement('div');
      crewHdr.className = 'inc-card-sub';
      crewHdr.textContent = `Crew: ${state.gnomes} gnomes (${unassigned} idle) · Milestones ×2 at 5, 10, 20 per job`;
      bodyEl.appendChild(crewHdr);

      for (const j of JOB_META) {
        const count = state.jobs[j.id];
        const card = document.createElement('div');
        card.className = 'inc-card';
        const left = document.createElement('div');
        left.className = 'inc-card-col';
        left.innerHTML = `<div class="inc-card-title">${j.icon} ${j.name}: ${count}</div><div class="inc-card-sub">${j.desc}</div>`;
        const right = document.createElement('div');
        right.className = 'inc-btn-row';
        const minus = document.createElement('button');
        minus.textContent = '−';
        minus.disabled = count <= 0;
        minus.addEventListener('click', () => {
          dispatch({ type: 'assign-job', job: j.id, delta: -1 });
          lastBodyKey = '';
          render(getState());
        });
        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.className = 'primary';
        plus.disabled = state.gnomes <= count;
        plus.addEventListener('click', () => {
          dispatch({ type: 'assign-job', job: j.id, delta: 1 });
          lastBodyKey = '';
          render(getState());
        });
        right.append(minus, plus);
        card.append(left, right);
        bodyEl.appendChild(card);
      }

      // Tool upgrades
      for (const key of ['trimTool', 'waterTool', 'weedTool'] as const) {
        const def = TOOLS[key];
        const cur = state[key];
        const next = def.tiers[cur + 1];
        const card = document.createElement('div');
        card.className = 'inc-card';
        const left = document.createElement('div');
        left.className = 'inc-card-col';
        left.innerHTML = `<div class="inc-card-title">🛠️ ${def.name}: ${def.tiers[cur].name}</div>
          <div class="inc-card-sub">${next ? `Next: ${next.name} (×${next.mult})` : 'Max tier for this week'}</div>`;
        const btn = document.createElement('button');
        btn.className = 'primary';
        if (next) {
          btn.textContent = `${formatNum(next.cost)} ✂`;
          btn.disabled = state.clippings < next.cost;
          btn.addEventListener('click', () => {
            dispatch({ type: 'upgrade-tool', tool: key });
            lastBodyKey = '';
            render(getState());
          });
        } else {
          btn.textContent = 'MAX';
          btn.disabled = true;
        }
        card.append(left, btn);
        bodyEl.appendChild(card);
      }
    } else if (activeTab === 'lawn') {
      // Plot expansion
      const nextPlot = PLOT_TIERS[state.plotLevel + 1];
      if (nextPlot) {
        const card = document.createElement('div');
        card.className = 'inc-card';
        card.innerHTML = `<div class="inc-card-col"><div class="inc-card-title">📏 Expand Yard: ${nextPlot.label}</div>
          <div class="inc-card-sub">Permanent across Mowing Days</div></div>`;
        const btn = document.createElement('button');
        btn.className = 'accent';
        btn.textContent = `${nextPlot.acornCost} 🌰`;
        btn.disabled = state.acorns < nextPlot.acornCost;
        btn.addEventListener('click', () => {
          dispatch({ type: 'expand-plot' });
          lastBodyKey = '';
          render(getState());
        });
        card.appendChild(btn);
        bodyEl.appendChild(card);
      }

      // Rain Dance active ability
      if (hasNode(state, 'rain-dance')) {
        const card = document.createElement('div');
        card.className = 'inc-card';
        card.innerHTML = `<div class="inc-card-col"><div class="inc-card-title">🌧️ Rain Dance</div>
          <div class="inc-card-sub">20s rain shower: full water & +30% growth</div></div>`;
        const btn = document.createElement('button');
        btn.className = 'primary';
        btn.disabled = state.rainCooldownSec > 0;
        btn.textContent = state.rainCooldownSec > 0 ? `${Math.ceil(state.rainCooldownSec)}s` : 'Cast!';
        btn.addEventListener('click', () => {
          dispatch({ type: 'rain-dance' });
          lastBodyKey = '';
          render(getState());
        });
        card.appendChild(btn);
        bodyEl.appendChild(card);
      }

      // Grass seeds
      const freeSeed = hasNode(state, 'seed-sense');
      for (const gid of GRASS_ORDER) {
        const g = GRASSES[gid];
        const unlocked = state.unlockedGrasses.includes(gid);
        const card = document.createElement('div');
        card.className = 'inc-card';
        const cost = resowCost(gid, freeSeed);
        card.innerHTML = `<div class="inc-card-col">
          <div class="inc-card-title">${unlocked ? '🌱' : '🔒'} ${g.name} (Val ${g.value} · 💧${g.water} · 🟤${g.loam})</div>
          <div class="inc-card-sub">${unlocked ? g.tooltip : `Unlock: ${g.unlockHint}`}</div>
        </div>`;
        if (unlocked) {
          const right = document.createElement('div');
          right.className = 'inc-btn-row';
          const selBtn = document.createElement('button');
          selBtn.textContent = state.selectedGrass === gid ? 'Selected' : 'Select';
          if (state.selectedGrass === gid) selBtn.className = 'primary';
          selBtn.addEventListener('click', () => {
            dispatch({ type: 'select-grass', grass: gid });
            lastBodyKey = '';
            render(getState());
          });
          const allBtn = document.createElement('button');
          allBtn.textContent = cost === 0 ? 'Sow All' : `All (${formatNum(cost)}/t)`;
          allBtn.addEventListener('click', () => {
            dispatch({ type: 'sow-all', grass: gid });
            lastBodyKey = '';
            render(getState());
          });
          right.append(selBtn, allBtn);
          card.appendChild(right);
        }
        bodyEl.appendChild(card);
      }

      // Active problems summary
      if (state.activeProblems.length > 0) {
        for (const pid of state.activeProblems) {
          const p = PROBLEMS.find((r) => r.id === pid);
          if (!p) continue;
          const card = document.createElement('div');
          card.className = 'inc-card';
          card.style.borderColor = '#d98c4a';
          card.innerHTML = `<div class="inc-card-col">
            <div class="inc-card-title">⚠️ ${p.name}</div>
            <div class="inc-card-sub">Fix: ${p.fixHint}</div>
          </div>`;
          bodyEl.appendChild(card);
        }
      }
    } else if (activeTab === 'critters') {
      // Biscuit headline card
      const biscuitCard = document.createElement('div');
      biscuitCard.className = 'inc-card';
      biscuitCard.style.borderColor = '#e6b85c';
      const nextTrick = BISCUIT_TRICKS.find((t) => !hasTrick(state, t.id));
      biscuitCard.innerHTML = `<div class="inc-card-col">
        <div class="inc-card-title">🐕 Biscuit (${state.biscuitTricks.length}/${BISCUIT_TRICKS.length} tricks)</div>
        <div class="inc-card-sub">${nextTrick ? `Next: ${nextTrick.name} (${state.biscuitFetches}/${nextTrick.fetchNeeded} fetches) — ${nextTrick.desc}` : 'Goodest boy in the Yard! All tricks learned.'}</div>
      </div>`;
      const bBtns = document.createElement('div');
      bBtns.className = 'inc-btn-row';
      const fetchBtn = document.createElement('button');
      fetchBtn.className = 'primary';
      fetchBtn.textContent = '🎾 Fetch';
      fetchBtn.addEventListener('click', () => {
        dispatch({ type: 'play-fetch' });
        lastBodyKey = '';
        render(getState());
      });
      const petBtn = document.createElement('button');
      petBtn.textContent = `🤚 Pet (${state.biscuitPets})`;
      petBtn.addEventListener('click', () => {
        dispatch({ type: 'pet-biscuit' });
        lastBodyKey = '';
        render(getState());
      });
      bBtns.append(fetchBtn, petBtn);
      biscuitCard.appendChild(bBtns);
      bodyEl.appendChild(biscuitCard);

      for (const cid of CRITTER_ORDER) {
        if (cid === 'biscuit') continue;
        const c = CRITTERS[cid];
        const friend = hasCritter(state, cid);
        const card = document.createElement('div');
        card.className = 'inc-card';
        card.innerHTML = `<div class="inc-card-col">
          <div class="inc-card-title">${c.icon} ${c.name} ${friend ? '✅' : ''}</div>
          <div class="inc-card-sub">${friend ? `Helps: ${c.helps}` : `Wants: ${c.wants}`} · Catch: ${c.sideEffect}</div>
        </div>`;

        if (cid === 'squirrels') {
          const btn = document.createElement('button');
          btn.className = 'accent';
          btn.textContent = 'Trade 3🌰';
          btn.disabled = state.acorns < 3;
          btn.addEventListener('click', () => {
            dispatch({ type: 'trade-squirrels' });
            lastBodyKey = '';
            render(getState());
          });
          card.appendChild(btn);
        } else if (cid === 'crows' && !friend) {
          const btn = document.createElement('button');
          btn.className = 'accent';
          btn.textContent = 'Gift 6🌰';
          btn.disabled = state.acorns < 6;
          btn.addEventListener('click', () => {
            dispatch({ type: 'befriend-crows' });
            lastBodyKey = '';
            render(getState());
          });
          card.appendChild(btn);
        } else if (cid === 'frog' && !friend && state.week >= 4) {
          const btn = document.createElement('button');
          btn.className = 'primary';
          btn.textContent = 'Befriend';
          btn.addEventListener('click', () => {
            dispatch({ type: 'befriend-frog' });
            lastBodyKey = '';
            render(getState());
          });
          card.appendChild(btn);
        }
        bodyEl.appendChild(card);
      }
    } else if (activeTab === 'decor') {
      if (state.placingDecor) {
        const banner = document.createElement('div');
        banner.className = 'inc-card';
        banner.style.borderColor = '#8ceeff';
        banner.innerHTML = `<div class="inc-card-col"><div class="inc-card-title">Placing ${DECORS[state.placingDecor].icon} ${DECORS[state.placingDecor].name}</div>
          <div class="inc-card-sub">Tap any empty lawn tile to place it.</div></div>`;
        const cancel = document.createElement('button');
        cancel.textContent = 'Cancel';
        cancel.addEventListener('click', () => {
          dispatch({ type: 'start-place-decor', decor: null });
          lastBodyKey = '';
          render(getState());
        });
        banner.appendChild(cancel);
        bodyEl.appendChild(banner);
      }

      for (const did of DECOR_ORDER) {
        const d = DECORS[did];
        const owned = countDecor(state, did);
        const cost = decorCost(did, owned);
        const curSym = d.currency === 'clippings' ? '✂' : d.currency === 'acorns' ? '🌰' : '🟤';
        const canPay =
          (d.currency === 'clippings' && state.clippings >= cost) ||
          (d.currency === 'acorns' && state.acorns >= cost) ||
          (d.currency === 'loam' && state.loam >= cost);
        const card = document.createElement('div');
        card.className = 'inc-card';
        card.innerHTML = `<div class="inc-card-col">
          <div class="inc-card-title">${d.icon} ${d.name} (${owned}) · ✨${d.charm >= 0 ? '+' : ''}${d.charm}</div>
          <div class="inc-card-sub">${d.desc}</div>
        </div>`;
        const btn = document.createElement('button');
        btn.className = state.placingDecor === did ? 'accent' : 'primary';
        btn.disabled = !canPay;
        btn.textContent = state.placingDecor === did ? 'Tap Tile' : `${formatNum(cost)} ${curSym}`;
        btn.addEventListener('click', () => {
          dispatch({ type: 'start-place-decor', decor: state.placingDecor === did ? null : did });
          lastBodyKey = '';
          render(getState());
        });
        card.appendChild(btn);
        bodyEl.appendChild(card);
      }
    } else if (activeTab === 'tree') {
      const hdr = document.createElement('div');
      hdr.className = 'inc-card';
      hdr.innerHTML = `<div class="inc-card-col">
        <div class="inc-card-title">🍂 Mulch: ${formatNum(state.mulch)} (Next Mow: +${formatNum(stats.mulchPreview)})</div>
        <div class="inc-card-sub">Lifetime Mulch: ${formatNum(state.lifetimeMulch)} (+${Math.round(state.lifetimeMulch * 2)}% all production)</div>
      </div>`;
      const respecBtn = document.createElement('button');
      respecBtn.textContent = 'Free Respec';
      respecBtn.disabled = !state.canRespec || state.treeNodes.length === 0;
      respecBtn.addEventListener('click', () => {
        dispatch({ type: 'respec-tree' });
        lastBodyKey = '';
        render(getState());
      });
      hdr.appendChild(respecBtn);
      bodyEl.appendChild(hdr);

      for (const n of TREE_NODES) {
        const owned = hasNode(state, n.id);
        const buyable = canBuyTreeNode(state, n.id);
        const card = document.createElement('div');
        card.className = 'inc-card';
        if (owned) card.style.borderColor = '#84e36d';
        else if (n.id === 'tame-mower') card.style.borderColor = '#f5cc51';

        card.innerHTML = `<div class="inc-card-col">
          <div class="inc-card-title">${owned ? '✅' : n.id === 'tame-mower' ? '🚜' : '🌿'} T${n.tier} ${n.name} (${n.branch})</div>
          <div class="inc-card-sub">${n.desc}</div>
        </div>`;
        const btn = document.createElement('button');
        if (owned) {
          btn.textContent = 'Owned';
          btn.disabled = true;
        } else {
          btn.className = n.id === 'tame-mower' ? 'accent' : 'primary';
          btn.textContent = `${n.cost} 🍂`;
          btn.disabled = !buyable;
          btn.addEventListener('click', () => {
            dispatch({ type: 'buy-tree-node', id: n.id });
            lastBodyKey = '';
            render(getState());
          });
        }
        card.appendChild(btn);
        bodyEl.appendChild(card);
      }
    }
  }

  function render(state: GameState): void {
    const stats = computeStats(state);
    const wLen = weekLengthSec(state.week, hasNode(state, 'late-riser'));
    const pct = Math.min(100, (state.weekElapsedSec / wLen) * 100);
    const dayLabel = state.gnomedayActive ? 'Gnomeday' : DAY_NAMES[state.dayIndex] ?? 'Sun';
    const weatherIcon = state.rainSec > 0 ? '🌧️' : state.drySummerActive ? '🔥' : stats.isNight ? '🌙' : '☀️';

    clockEl.textContent = `${weatherIcon} W${state.week} ${dayLabel}`;
    weekBarEl.style.width = `${pct.toFixed(1)}%`;
    bellBtn.disabled = !stats.bellReady;
    bellBtn.textContent = hasNode(state, 'tame-mower') && !state.ended ? '🚜 Ride!' : '🔔 Mow';

    clipEl.textContent = `✂ ${formatNum(state.clippings)} (${formatNum(stats.autoIncomePerSec)}/s)`;
    waterEl.textContent = `💧 ${Math.round(state.water)} (${Math.round(stats.waterFactor * 100)}%)`;
    loamEl.textContent = `🟤 ${Math.round(state.loam)} (${Math.round(stats.loamFactor * 100)}%)`;
    acornEl.textContent = `🌰 ${formatNum(state.acorns)}`;
    charmEl.textContent = `✨ ${stats.charm.toFixed(0)} (×${stats.charmMult.toFixed(2)})`;

    if (state.wishes > 0) {
      wishBtn.style.display = 'inline-flex';
      wishBtn.textContent = `🌼 Wish (${state.wishes})`;
    } else {
      wishBtn.style.display = 'none';
    }

    combineBanner.style.display = state.combineBannerSec > 0 ? 'block' : 'none';
    teacupEl.textContent = state.teacupLine;

    for (const t of tabDefs) {
      tabBtns[t.id].classList.toggle('active', activeTab === t.id);
    }

    // Throttle full DOM body rebuild to meaningful state changes so scrolling & taps stay smooth
    const key = [
      activeTab,
      Math.floor(state.clippings / 5),
      Math.floor(state.acorns),
      Math.floor(state.loam / 5),
      Math.floor(state.mulch),
      state.gnomes,
      state.plotLevel,
      state.selectedGrass,
      state.placingDecor ?? '',
      state.treeNodes.length,
      state.unlockedGrasses.length,
      state.befriendedCritters.length,
      state.biscuitFetches,
      state.biscuitPets,
      state.activeProblems.length,
      Math.ceil(state.rainCooldownSec / 2),
      state.trimTool,
      state.waterTool,
      state.weedTool,
    ].join('|');

    if (key !== lastBodyKey) {
      lastBodyKey = key;
      renderBody(state, stats);
    }
  }

  return {
    render,
    showOfflineModal,
    showEndingModal,
    setTab: (tab: TabId) => {
      activeTab = tab;
      lastBodyKey = '';
      render(getState());
    },
  };
}
