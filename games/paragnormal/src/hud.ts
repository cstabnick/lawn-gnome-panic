import { findNearestInteractable } from './sim/engine';
import type { SimState } from './sim/types';
import { volume } from './volume';

export interface HudController {
  showStart(seed: number, onStart: (seed: number) => void): void;
  hideStart(): void;
  showPause(onResume: () => void, onRestart: () => void): void;
  hidePause(): void;
  showEnd(won: boolean, state: SimState, onReplaySame: () => void, onNewSeed: () => void): void;
  hideEnd(): void;
  update(state: SimState): void;
  setHidden(nohud: boolean): void;
}

const STYLE = `
.pg-root { position: absolute; inset: 0; font-family: 'Segoe UI', system-ui, sans-serif; color: #e8e4dc; pointer-events: none; }
.pg-vignette { position: absolute; inset: 0; pointer-events: none; transition: opacity 0.15s linear; background: radial-gradient(circle at center, transparent 42%, rgba(4, 6, 12, 0.92) 100%); }
.pg-hud-top { position: absolute; top: 16px; left: 16px; display: flex; flex-direction: column; gap: 8px; background: rgba(8, 10, 16, 0.72); border: 1px solid rgba(160, 180, 210, 0.18); border-radius: 10px; padding: 12px 14px; backdrop-filter: blur(4px); max-width: 310px; }
.pg-room { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ec5ff; font-weight: 600; }
.pg-hp { display: flex; gap: 6px; font-size: 14px; align-items: center; }
.pg-pip { width: 12px; height: 12px; border-radius: 50%; background: #5ef2ff; box-shadow: 0 0 8px #5ef2ff; }
.pg-pip.lost { background: #2b303c; box-shadow: none; }
.pg-tasks { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #c7c4bc; }
.pg-task.done { color: #6ee7b7; text-decoration: line-through; opacity: 0.75; }
.pg-top-right { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; align-items: center; pointer-events: auto; }
.pg-btn-sm { background: rgba(12, 15, 24, 0.8); color: #e8e4dc; border: 1px solid rgba(160, 180, 210, 0.25); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; min-height: 44px; min-width: 44px; }
.pg-btn-sm:hover { background: rgba(28, 35, 52, 0.9); }
.pg-bottom-left { position: absolute; bottom: 18px; left: 16px; display: flex; flex-direction: column; gap: 6px; background: rgba(8, 10, 16, 0.72); border: 1px solid rgba(160, 180, 210, 0.18); border-radius: 10px; padding: 10px 14px; font-size: 12px; }
.pg-bar-wrap { width: 150px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
.pg-bar { height: 100%; background: #9ec5ff; transition: width 0.08s linear; }
.pg-badges { display: flex; gap: 8px; align-items: center; }
.pg-badge { padding: 2px 7px; border-radius: 5px; background: rgba(255,255,255,0.08); font-size: 11px; }
.pg-badge.hidden { background: rgba(110, 231, 183, 0.22); color: #6ee7b7; }
.pg-badge.drag { background: rgba(248, 113, 113, 0.25); color: #fca5a5; }
.pg-crosshair { position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(232, 228, 220, 0.75); }
.pg-prompt { position: absolute; top: 56%; left: 50%; transform: translateX(-50%); background: rgba(8, 10, 16, 0.85); border: 1px solid rgba(94, 242, 255, 0.45); color: #e8faff; padding: 7px 14px; border-radius: 8px; font-size: 13px; white-space: nowrap; }
.pg-banner { position: absolute; top: 16%; left: 50%; transform: translateX(-50%); background: rgba(8, 10, 16, 0.82); border: 1px solid rgba(255, 255, 255, 0.14); padding: 8px 16px; border-radius: 8px; font-size: 13px; color: #f6e7c8; text-align: center; max-width: 460px; }
.pg-whisper { position: absolute; bottom: 22%; left: 50%; transform: translateX(-50%); font-size: 15px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(252, 165, 165, 0.85); text-shadow: 0 0 12px rgba(0,0,0,0.9); }
.pg-modal { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(4, 5, 10, 0.86); pointer-events: auto; }
.pg-card { box-sizing: border-box; width: min(460px, calc(100vw - 32px)); background: #0d1018; border: 1px solid rgba(160, 180, 210, 0.25); border-radius: 14px; padding: 26px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.75); }
.pg-title { margin: 0; font-size: 28px; letter-spacing: 0.16em; text-transform: uppercase; color: #d8e7ff; }
.pg-sub { margin: 0; font-size: 13px; line-height: 1.5; color: #b5b2aa; }
.pg-controls { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; font-size: 12px; line-height: 1.6; color: #d2cfc7; }
.pg-row { display: flex; gap: 8px; align-items: center; }
.pg-row .pg-btn-sm { white-space: nowrap; flex: none; }
.pg-input { flex: 1; min-width: 0; background: #141925; color: #fff; border: 1px solid rgba(160,180,210,0.28); border-radius: 8px; padding: 8px 10px; font-size: 13px; }
.pg-primary { background: #3b82f6; color: #fff; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; min-height: 44px; }
.pg-card { max-height: calc(100vh - 24px); overflow-y: auto; }
@media (max-height: 520px) { .pg-title { font-size: 20px; } .pg-sub { font-size: 12px; } .pg-controls { font-size: 11px; } }
.pg-primary:hover { background: #2563eb; }
`;

export function createHud(uiRoot: HTMLElement): HudController {
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.className = 'pg-root';
  uiRoot.appendChild(root);

  const vignette = document.createElement('div');
  vignette.className = 'pg-vignette';
  vignette.style.opacity = '0.35';

  const hudLayer = document.createElement('div');
  hudLayer.id = 'pg-hud';
  hudLayer.innerHTML = `
    <div class="pg-hud-top">
      <div class="pg-room" id="pg-room">Entry Parlor</div>
      <div class="pg-hp" id="pg-hp"></div>
      <div class="pg-tasks" id="pg-tasks"></div>
    </div>
    <div class="pg-top-right">
      <span class="pg-badge" id="pg-seed-badge">Seed #1337</span>
      <button class="pg-btn-sm" id="pg-mute-btn" type="button">Sound: ON</button>
    </div>
    <div class="pg-bottom-left">
      <div class="pg-badges">
        <span class="pg-badge" id="pg-lantern">[F] Lantern: ON</span>
        <span class="pg-badge" id="pg-crouch">[C] Stand</span>
        <span class="pg-badge drag" id="pg-drag" style="display:none">DREAM DRAG</span>
      </div>
      <div class="pg-bar-wrap"><div class="pg-bar" id="pg-stamina" style="width:100%"></div></div>
    </div>
    <div class="pg-crosshair"></div>
    <div class="pg-prompt" id="pg-prompt" style="display:none"></div>
    <div class="pg-banner" id="pg-banner" style="display:none"></div>
    <div class="pg-whisper" id="pg-whisper" style="display:none">Your legs feel like wet clay...</div>
  `;

  const modalLayer = document.createElement('div');
  modalLayer.style.display = 'none';
  modalLayer.className = 'pg-modal';

  root.append(vignette, hudLayer, modalLayer);

  const roomEl = hudLayer.querySelector('#pg-room') as HTMLElement;
  const hpEl = hudLayer.querySelector('#pg-hp') as HTMLElement;
  const tasksEl = hudLayer.querySelector('#pg-tasks') as HTMLElement;
  const seedBadgeEl = hudLayer.querySelector('#pg-seed-badge') as HTMLElement;
  const muteBtn = hudLayer.querySelector('#pg-mute-btn') as HTMLButtonElement;
  const lanternEl = hudLayer.querySelector('#pg-lantern') as HTMLElement;
  const crouchEl = hudLayer.querySelector('#pg-crouch') as HTMLElement;
  const dragEl = hudLayer.querySelector('#pg-drag') as HTMLElement;
  const staminaEl = hudLayer.querySelector('#pg-stamina') as HTMLElement;
  const promptEl = hudLayer.querySelector('#pg-prompt') as HTMLElement;
  const bannerEl = hudLayer.querySelector('#pg-banner') as HTMLElement;
  const whisperEl = hudLayer.querySelector('#pg-whisper') as HTMLElement;

  const syncMuteLabel = () => {
    muteBtn.textContent = volume.isMuted('master') ? 'Audio: OFF' : 'Audio: ON';
  };
  syncMuteLabel();
  volume.subscribe(syncMuteLabel);
  muteBtn.addEventListener('click', () => {
    volume.toggleMute('master');
  });

  return {
    showStart(seed: number, onStart: (seed: number) => void): void {
      modalLayer.style.display = 'flex';
      modalLayer.innerHTML = `
        <div class="pg-card" id="pg-start">
          <h1 class="pg-title">Paragnormal</h1>
          <p class="pg-sub">You are a tiny porcelain garden gnome trapped inside a dark house stalked by giant Gnome-Souls. Slip under towering furniture, manage your lantern, and overcome 3 obstacles to reach the moonlit Garden Pet-Door.</p>
          <div class="pg-controls">
            <b>WASD</b> Move &nbsp;|&nbsp; <b>Mouse / Arrows</b> Look &nbsp;|&nbsp; <b>Shift</b> Sprint<br/>
            <b>C</b> Crouch &amp; Hide under tables/beds &nbsp;|&nbsp; <b>F</b> Lantern<br/>
            <b>E</b> Interact &nbsp;|&nbsp; <b>P</b> Pause<br/>
            <b>Phone:</b> left stick moves, drag the right side to look, buttons bottom-right
          </div>
          <div class="pg-row">
            <label style="font-size:12px;color:#9ea6b8">House Seed:</label>
            <input class="pg-input" id="pg-seed-input" type="number" value="${seed}" />
            <button class="pg-btn-sm" id="pg-rand-btn" type="button">Random</button>
          </div>
          <button class="pg-primary" id="pg-play-btn" type="button">Enter the House</button>
        </div>
      `;
      const input = modalLayer.querySelector('#pg-seed-input') as HTMLInputElement;
      const randBtn = modalLayer.querySelector('#pg-rand-btn') as HTMLButtonElement;
      const playBtn = modalLayer.querySelector('#pg-play-btn') as HTMLButtonElement;
      randBtn.addEventListener('click', () => {
        input.value = String(Math.floor(1 + Math.random() * 9999));
      });
      playBtn.addEventListener('click', () => {
        const parsed = parseInt(input.value, 10);
        onStart(Number.isFinite(parsed) ? parsed : seed);
      });
    },

    hideStart(): void {
      modalLayer.style.display = 'none';
      modalLayer.innerHTML = '';
    },

    showPause(onResume: () => void, onRestart: () => void): void {
      modalLayer.style.display = 'flex';
      modalLayer.innerHTML = `
        <div class="pg-card" id="pg-pause">
          <h2 class="pg-title" style="font-size:22px">Paused</h2>
          <p class="pg-sub">Take a breath beneath the floorboards.</p>
          <div class="pg-row">
            <button class="pg-primary" id="pg-resume-btn" type="button" style="flex:1">Resume</button>
            <button class="pg-btn-sm" id="pg-restart-btn" type="button" style="padding:10px 14px">Restart Seed</button>
          </div>
        </div>
      `;
      modalLayer.querySelector('#pg-resume-btn')?.addEventListener('click', onResume);
      modalLayer.querySelector('#pg-restart-btn')?.addEventListener('click', onRestart);
    },

    hidePause(): void {
      modalLayer.style.display = 'none';
      modalLayer.innerHTML = '';
    },

    showEnd(won: boolean, state: SimState, onReplaySame: () => void, onNewSeed: () => void): void {
      modalLayer.style.display = 'flex';
      modalLayer.innerHTML = `
        <div class="pg-card" id="pg-end">
          <h2 class="pg-title" style="font-size:24px;color:${won ? '#6ee7b7' : '#fca5a5'}">
            ${won ? 'Escaped into the Garden' : 'Claimed by the House'}
          </h2>
          <p class="pg-sub">
            ${won
              ? `You slipped through the Garden Pet-Door in ${state.time.toFixed(1)}s on Seed #${state.seed}.`
              : `A giant Gnome-Soul shattered your porcelain shell after ${state.time.toFixed(1)}s (${state.player.obstaclesCleared}/3 obstacles cleared).`}
          </p>
          <div class="pg-row">
            <button class="pg-primary" id="pg-new-btn" type="button" style="flex:1">New House</button>
            <button class="pg-btn-sm" id="pg-retry-btn" type="button" style="padding:10px 14px">Retry #${state.seed}</button>
          </div>
        </div>
      `;
      modalLayer.querySelector('#pg-new-btn')?.addEventListener('click', onNewSeed);
      modalLayer.querySelector('#pg-retry-btn')?.addEventListener('click', onReplaySame);
    },

    hideEnd(): void {
      modalLayer.style.display = 'none';
      modalLayer.innerHTML = '';
    },

    update(state: SimState): void {
      const p = state.player;
      const room = state.rooms[p.roomId];
      roomEl.textContent = room ? room.name : 'Dark Corridor';
      seedBadgeEl.textContent = `Seed #${state.seed}`;

      let pips = '<span style="font-size:11px;color:#9ea6b8;margin-right:4px">SOUL:</span>';
      for (let i = 0; i < p.maxHp; i++) {
        pips += `<span class="pg-pip ${i < p.hp ? '' : 'lost'}"></span>`;
      }
      hpEl.innerHTML = pips;

      const t1 = state.obstacleStatus.kilnCleared;
      const t2 = state.obstacleStatus.bridgeCleared;
      const t3 = state.obstacleStatus.bellsCleared;
      tasksEl.innerHTML = `
        <div class="pg-task ${t1 ? 'done' : ''}">1. Shatter Kiln Ward (${p.shards}/${p.shardsNeeded} Shards)</div>
        <div class="pg-task ${t2 ? 'done' : ''}">2. Spring Snare-Trap (${p.hasAcorn || t2 ? 'Acorn Ready' : 'Find Acorn'})</div>
        <div class="pg-task ${t3 ? 'done' : ''}">3. Ring Soul-Bells (${p.bellsRung}/${p.bellsNeeded}) &amp; Exit</div>
      `;

      const lanternState = !p.lanternOn ? 'OFF' : p.lanternLit ? 'ON' : 'GUTTERING';
      lanternEl.textContent = `[F] Lantern: ${lanternState}`;
      lanternEl.className = p.lanternOn && !p.lanternLit ? 'pg-badge drag' : 'pg-badge';
      crouchEl.textContent = p.hiding ? (p.crouching ? 'HIDDEN' : 'UNDER COVER [C]') : p.crouching ? '[C] Crouch' : '[C] Stand';
      crouchEl.className = p.hiding ? 'pg-badge hidden' : 'pg-badge';

      const dragActive = state.director.dreamDrag > 0.28;
      dragEl.style.display = dragActive ? 'inline-block' : 'none';
      whisperEl.style.display = state.director.dreamDrag > 0.36 ? 'block' : 'none';

      staminaEl.style.width = `${Math.round(p.stamina * 100)}%`;

      const near = findNearestInteractable(state);
      if (near && near.hint) {
        promptEl.style.display = 'block';
        promptEl.textContent = near.hint;
      } else {
        promptEl.style.display = 'none';
      }

      if (state.messageTimer > 0 && state.message) {
        bannerEl.style.display = 'block';
        bannerEl.textContent = state.message;
      } else {
        bannerEl.style.display = 'none';
      }

      vignette.style.opacity = String(Math.min(0.95, 0.25 + state.director.tension * 0.45 + state.director.dreamDrag * 0.35));
    },

    setHidden(nohud: boolean): void {
      hudLayer.style.display = nohud ? 'none' : 'block';
    },
  };
}
