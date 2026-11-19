import type { InputController } from './input';
import { addCustomLoreFromText, clearCustomLore, getActiveLore, getCustomLoreCount } from './lore/registry';
import type { SimState } from './sim/types';

export interface HudController {
  update: (sim: SimState) => void;
  showStart: (onStart: () => void) => void;
  hideStart: () => void;
  showPause: (onResume: () => void, onRestart: () => void) => void;
  hidePause: () => void;
  showEnd: (sim: SimState, onRestart: () => void) => void;
  hideEnd: () => void;
  toggleLedger: (sim?: SimState) => boolean;
  setHidden: (hidden: boolean) => void;
}

const STYLE = `
.ts-root { position: relative; width: 100%; height: 100%; color: #e6dfd3; font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; pointer-events: none; }
.ts-topbar { position: fixed; top: env(safe-area-inset-top, 10px); left: 10px; right: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; font-size: 13px; }
.ts-pill { background: rgba(10, 10, 15, 0.82); border: 1px solid rgba(220, 195, 155, 0.25); padding: 6px 10px; border-radius: 6px; backdrop-filter: blur(4px); pointer-events: auto; }
.ts-dread-wrap { display: inline-flex; align-items: center; gap: 6px; }
.ts-dread-bar { width: 88px; height: 8px; background: #1e1a1a; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); }
.ts-dread-fill { height: 100%; background: linear-gradient(90deg, #c97a3a, #d92b2b); transition: width 0.15s; }
.ts-crosshair { position: fixed; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255, 240, 210, 0.75); box-shadow: 0 0 6px rgba(0,0,0,0.9); }
.ts-bottom { position: fixed; bottom: calc(env(safe-area-inset-bottom, 12px) + 12px); left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; width: min(92vw, 620px); text-align: center; }
.ts-whisper { background: rgba(8, 8, 12, 0.88); border-left: 3px solid #d9823b; padding: 8px 12px; border-radius: 4px; font-size: 13px; line-height: 1.4; max-width: 100%; }
.ts-prompt { background: rgba(18, 15, 12, 0.9); border: 1px solid rgba(235, 200, 140, 0.45); padding: 6px 12px; border-radius: 6px; font-size: 13px; color: #f6e3ba; }
.ts-modal { position: fixed; inset: 0; background: rgba(4, 4, 8, 0.88); display: flex; align-items: center; justify-content: center; padding: 16px; pointer-events: auto; z-index: 20; }
.ts-card { background: #0f0f15; border: 1px solid rgba(220, 195, 155, 0.3); border-radius: 10px; padding: 20px; width: min(94vw, 560px); max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.85); }
.ts-card h1, .ts-card h2 { margin: 0 0 10px; color: #f0cf95; font-size: 20px; letter-spacing: 0.04em; }
.ts-card p, .ts-card li { font-size: 13px; line-height: 1.5; color: #cfc7ba; }
.ts-btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.ts-btn { min-height: 44px; padding: 8px 14px; border-radius: 6px; border: 1px solid rgba(235, 200, 140, 0.4); background: #221b15; color: #f4dfc0; font-family: inherit; font-size: 13px; cursor: pointer; pointer-events: auto; }
.ts-btn:hover { background: #33271d; }
.ts-btn-primary { background: #8f351e; border-color: #e07a52; color: #fff6eb; font-weight: bold; }
.ts-btn-primary:hover { background: #ab4126; }
.ts-textarea { width: 100%; min-height: 110px; box-sizing: border-box; background: #07070b; color: #e6dfd3; border: 1px solid rgba(220, 195, 155, 0.3); border-radius: 6px; padding: 8px; font-family: inherit; font-size: 12px; margin-top: 8px; }
.ts-log { max-height: 160px; overflow-y: auto; background: #08080c; border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; font-size: 12px; margin-top: 8px; }
.ts-touch { display: none; position: fixed; inset: 0; pointer-events: none; z-index: 10; }
.ts-joy { position: fixed; left: 18px; bottom: calc(env(safe-area-inset-bottom, 16px) + 16px); width: 104px; height: 104px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.22); pointer-events: auto; touch-action: none; }
.ts-joy-knob { position: absolute; left: 50%; top: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; background: rgba(240, 207, 149, 0.5); }
.ts-look-pad { position: fixed; right: 0; top: 64px; bottom: 140px; width: 52%; pointer-events: auto; touch-action: none; }
.ts-touch-btns { position: fixed; right: 14px; bottom: calc(env(safe-area-inset-bottom, 16px) + 16px); display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; pointer-events: auto; }
.ts-tbtn { min-width: 68px; min-height: 48px; border-radius: 8px; background: rgba(20, 18, 22, 0.85); border: 1px solid rgba(235, 200, 140, 0.45); color: #f6e3ba; font-family: inherit; font-size: 12px; font-weight: bold; }
@media (pointer: coarse), (max-width: 820px) {
  .ts-touch { display: block; }
  .ts-bottom { bottom: calc(env(safe-area-inset-bottom, 12px) + 132px); }
}
`;

function formatClock(sim: SimState): string {
  const totalMinutes = Math.floor((sim.timeSeconds / sim.shiftDurationSeconds) * 360);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const dispH = h === 0 ? 12 : h;
  return `${dispH}:${m.toString().padStart(2, '0')} AM`;
}

export function createHud(
  uiRoot: HTMLElement,
  input: InputController,
  callbacks: { onMuteToggle: () => boolean; onLoreChanged: () => void },
): HudController {
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  uiRoot.appendChild(styleEl);

  const root = document.createElement('div');
  root.className = 'ts-root';
  root.id = 'hud-root';
  uiRoot.appendChild(root);

  root.innerHTML = `
    <div class="ts-topbar">
      <div class="ts-pill" id="ts-clock">12:00 AM</div>
      <div class="ts-pill ts-dread-wrap">
        <span>DREAD</span>
        <div class="ts-dread-bar"><div class="ts-dread-fill" id="ts-dread-fill" style="width:12%"></div></div>
      </div>
      <div class="ts-pill" id="ts-blinks">BLINKS: ● ○ ○</div>
      <div class="ts-pill" id="ts-scam">SCAMMED: 2 PRICE PTS</div>
      <div style="display:flex;gap:6px;">
        <button class="ts-btn" id="ts-ledger-btn" style="min-height:36px;padding:4px 10px;">LEDGER [L]</button>
        <button class="ts-btn" id="ts-mute-btn" style="min-height:36px;padding:4px 10px;">AUDIO</button>
      </div>
    </div>
    <div class="ts-crosshair"></div>
    <div class="ts-bottom">
      <div class="ts-whisper" id="ts-whisper" style="display:none;"></div>
      <div class="ts-prompt" id="ts-prompt"></div>
    </div>
    <div class="ts-touch" id="ts-touch">
      <div class="ts-joy" id="ts-joy"><div class="ts-joy-knob" id="ts-joy-knob"></div></div>
      <div class="ts-look-pad" id="ts-look-pad"></div>
      <div class="ts-touch-btns">
        <button class="ts-tbtn" id="tb-interact">USE</button>
        <button class="ts-tbtn" id="tb-nod">NOD</button>
        <button class="ts-tbtn" id="tb-chirp">CHIRP</button>
        <button class="ts-tbtn" id="tb-light">LIGHT</button>
      </div>
    </div>
    <div class="ts-modal" id="ts-start-modal" style="display:none;"></div>
    <div class="ts-modal" id="ts-pause-modal" style="display:none;"></div>
    <div class="ts-modal" id="ts-end-modal" style="display:none;"></div>
    <div class="ts-modal" id="ts-ledger-modal" style="display:none;"></div>
  `;

  const clockEl = root.querySelector('#ts-clock') as HTMLElement;
  const dreadFill = root.querySelector('#ts-dread-fill') as HTMLElement;
  const blinksEl = root.querySelector('#ts-blinks') as HTMLElement;
  const scamEl = root.querySelector('#ts-scam') as HTMLElement;
  const whisperEl = root.querySelector('#ts-whisper') as HTMLElement;
  const promptEl = root.querySelector('#ts-prompt') as HTMLElement;
  const startModal = root.querySelector('#ts-start-modal') as HTMLElement;
  const pauseModal = root.querySelector('#ts-pause-modal') as HTMLElement;
  const endModal = root.querySelector('#ts-end-modal') as HTMLElement;
  const ledgerModal = root.querySelector('#ts-ledger-modal') as HTMLElement;
  const muteBtn = root.querySelector('#ts-mute-btn') as HTMLButtonElement;
  const ledgerBtn = root.querySelector('#ts-ledger-btn') as HTMLButtonElement;

  muteBtn.addEventListener('click', () => {
    const m = callbacks.onMuteToggle();
    muteBtn.textContent = m ? 'MUTED' : 'AUDIO';
  });

  // Touch joystick
  const joy = root.querySelector('#ts-joy') as HTMLElement;
  const knob = root.querySelector('#ts-joy-knob') as HTMLElement;
  let joyPointerId: number | null = null;
  joy.addEventListener('pointerdown', (e) => {
    joyPointerId = e.pointerId;
    joy.setPointerCapture(e.pointerId);
  });
  joy.addEventListener('pointermove', (e) => {
    if (joyPointerId !== e.pointerId) return;
    const rect = joy.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    const dx = Math.max(-maxR, Math.min(maxR, e.clientX - cx));
    const dy = Math.max(-maxR, Math.min(maxR, e.clientY - cy));
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    input.setTouchMove(dx / maxR, -dy / maxR);
  });
  const resetJoy = (e: PointerEvent) => {
    if (joyPointerId !== e.pointerId) return;
    joyPointerId = null;
    knob.style.transform = '';
    input.setTouchMove(0, 0);
  };
  joy.addEventListener('pointerup', resetJoy);
  joy.addEventListener('pointercancel', resetJoy);

  // Touch look pad
  const lookPad = root.querySelector('#ts-look-pad') as HTMLElement;
  let lookPointerId: number | null = null;
  let lastLookX = 0;
  let lastLookY = 0;
  lookPad.addEventListener('pointerdown', (e) => {
    lookPointerId = e.pointerId;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    lookPad.setPointerCapture(e.pointerId);
  });
  lookPad.addEventListener('pointermove', (e) => {
    if (lookPointerId !== e.pointerId) return;
    input.addTouchLook(e.clientX - lastLookX, e.clientY - lastLookY);
    lastLookX = e.clientX;
    lastLookY = e.clientY;
  });
  const resetLook = (e: PointerEvent) => {
    if (lookPointerId === e.pointerId) lookPointerId = null;
  };
  lookPad.addEventListener('pointerup', resetLook);
  lookPad.addEventListener('pointercancel', resetLook);

  // Touch buttons
  (root.querySelector('#tb-interact') as HTMLElement).addEventListener('click', () => input.triggerAction('interact'));
  (root.querySelector('#tb-nod') as HTMLElement).addEventListener('click', () => input.triggerAction('nod'));
  (root.querySelector('#tb-chirp') as HTMLElement).addEventListener('click', () => input.triggerAction('chirp'));
  (root.querySelector('#tb-light') as HTMLElement).addEventListener('click', () => input.triggerAction('light'));

  let lastSim: SimState | null = null;

  function renderLedgerModal(sim?: SimState): void {
    const active = getActiveLore();
    const logItems = (sim?.ledgerLog ?? []).slice(-12).reverse().map((l) => `<div>• ${l}</div>`).join('');
    ledgerModal.innerHTML = `
      <div class="ts-card">
        <h2>SCAM LEDGER &amp; LORE EXTENSION</h2>
        <p>Active packs: <b>${active.packs.length}</b> (${active.whispers.length} whispers, ${active.scams.length} price-point scams, ${active.tributes.length} tributes). Custom pasted batches: <b>${getCustomLoreCount()}</b>.</p>
        <div class="ts-log">${logItems || '<div>No incidents logged yet.</div>'}</div>
        <p style="margin-top:12px;margin-bottom:4px;"><b>Paste New Discord / Whalebot Responses:</b></p>
        <textarea class="ts-textarea" id="ts-paste-box" placeholder="Paste raw shitposts from #shitpost or #test2 here..."></textarea>
        <div id="ts-paste-status" style="font-size:12px;color:#9ed49e;margin-top:6px;"></div>
        <div class="ts-btn-row">
          <button class="ts-btn ts-btn-primary" id="ts-inject-btn">Inject Responses</button>
          <button class="ts-btn" id="ts-clear-lore-btn">Clear Pasted</button>
          <button class="ts-btn" id="ts-close-ledger-btn">Close</button>
        </div>
      </div>
    `;
    (ledgerModal.querySelector('#ts-inject-btn') as HTMLElement).addEventListener('click', () => {
      const box = ledgerModal.querySelector('#ts-paste-box') as HTMLTextAreaElement;
      const status = ledgerModal.querySelector('#ts-paste-status') as HTMLElement;
      const pack = addCustomLoreFromText(box.value);
      box.value = '';
      callbacks.onLoreChanged();
      status.textContent = `Added ${pack.whispers.length} whispers, ${pack.scams.length} scams, ${pack.tributes.length} tributes!`;
    });
    (ledgerModal.querySelector('#ts-clear-lore-btn') as HTMLElement).addEventListener('click', () => {
      clearCustomLore();
      callbacks.onLoreChanged();
      renderLedgerModal(sim);
    });
    (ledgerModal.querySelector('#ts-close-ledger-btn') as HTMLElement).addEventListener('click', () => {
      ledgerModal.style.display = 'none';
    });
  }

  function toggleLedger(sim?: SimState): boolean {
    const opening = ledgerModal.style.display === 'none';
    if (opening) {
      document.exitPointerLock?.();
      renderLedgerModal(sim ?? lastSim ?? undefined);
      ledgerModal.style.display = 'flex';
    } else {
      ledgerModal.style.display = 'none';
    }
    return opening;
  }

  ledgerBtn.addEventListener('click', () => toggleLedger());

  return {
    update(sim: SimState) {
      lastSim = sim;
      clockEl.textContent = formatClock(sim);
      dreadFill.style.width = `${Math.round(sim.dread)}%`;
      blinksEl.textContent =
        sim.smokeDetector.blinks === 1
          ? 'BLINKS: ● ○ ○'
          : sim.smokeDetector.blinks === 2
            ? 'BLINKS: ● ● ○ (SOON)'
            : 'BLINKS: ● ● ●';
      blinksEl.style.borderColor = sim.smokeDetector.blinks >= 2 ? '#ff3b3b' : 'rgba(220,195,155,0.25)';
      scamEl.textContent = `SCAMMED: ${sim.pricePoints} PRICE PTS`;

      if (sim.activeMessage) {
        whisperEl.style.display = 'block';
        whisperEl.textContent = `[#${sim.activeMessage.source}] ${sim.activeMessage.text}`;
      } else {
        whisperEl.style.display = 'none';
      }
      promptEl.textContent = sim.player.promptText;
    },

    showStart(onStart: () => void) {
      startModal.style.display = 'flex';
      startModal.innerHTML = `
        <div class="ts-card" id="ts-title-card">
          <h1>THE TRIBUTE SCHEDULE</h1>
          <p><i>"I no longer keep a clock. I keep a cone."</i></p>
          <p>Survive from <b>12:00 AM to 6:00 AM</b> in your apartment:</p>
          <ul>
            <li><b>Rotating Doner Cone:</b> Bring offerings (<code>[E]</code>). Never offer Extended Warranty Paperwork. Stand still if it pauses.</li>
            <li><b>The Fridge:</b> Listen to its 4–7 notes, then <b>Nod</b> (<code>[SPACE]</code>) when it waits.</li>
            <li><b>Smoke Detector:</b> If it blinks twice ("SOON"), <b>Chirp Back</b> (<code>[C]</code>) before the 3rd blink.</li>
            <li><b>Microwave &amp; Printer:</b> Cover the glowing Microwave with a dish towel (<code>[E]</code>). Pay Printer Scam Tolls in the hallway.</li>
          </ul>
          <div class="ts-btn-row">
            <button class="ts-btn ts-btn-primary" id="ts-begin-btn">Begin Shift (12:00 AM)</button>
            <button class="ts-btn" id="ts-open-paste-btn">Paste New Responses</button>
          </div>
        </div>
      `;
      (startModal.querySelector('#ts-begin-btn') as HTMLElement).addEventListener('click', onStart);
      (startModal.querySelector('#ts-open-paste-btn') as HTMLElement).addEventListener('click', () => toggleLedger());
    },

    hideStart() {
      startModal.style.display = 'none';
    },

    showPause(onResume: () => void, onRestart: () => void) {
      pauseModal.style.display = 'flex';
      pauseModal.innerHTML = `
        <div class="ts-card">
          <h2>SHIFT PAUSED</h2>
          <p>The cone is still rotating in the dark.</p>
          <div class="ts-btn-row">
            <button class="ts-btn ts-btn-primary" id="ts-resume-btn">Resume</button>
            <button class="ts-btn" id="ts-paste-pause-btn">Ledger / Paste Responses</button>
            <button class="ts-btn" id="ts-restart-btn">Restart Shift</button>
          </div>
        </div>
      `;
      (pauseModal.querySelector('#ts-resume-btn') as HTMLElement).addEventListener('click', onResume);
      (pauseModal.querySelector('#ts-paste-pause-btn') as HTMLElement).addEventListener('click', () => toggleLedger());
      (pauseModal.querySelector('#ts-restart-btn') as HTMLElement).addEventListener('click', onRestart);
    },

    hidePause() {
      pauseModal.style.display = 'none';
    },

    showEnd(sim: SimState, onRestart: () => void) {
      endModal.style.display = 'flex';
      const won = sim.outcome === 'survived';
      endModal.innerHTML = `
        <div class="ts-card">
          <h2>${won ? '6:00 AM — SHIFT SURVIVED' : 'HOUSEHOLD INCIDENT'}</h2>
          <p>${sim.outcomeReason}</p>
          <p>Offerings Accepted: <b>${sim.cone.acceptedCount}</b> | Fridge Nods: <b>${sim.fridge.satisfiedCount}</b> | Scammed At: <b>${sim.pricePoints} Price Points</b></p>
          <div class="ts-btn-row">
            <button class="ts-btn ts-btn-primary" id="ts-retry-btn">Try Another Night</button>
            <button class="ts-btn" id="ts-end-ledger-btn">View Scam Ledger</button>
          </div>
        </div>
      `;
      (endModal.querySelector('#ts-retry-btn') as HTMLElement).addEventListener('click', onRestart);
      (endModal.querySelector('#ts-end-ledger-btn') as HTMLElement).addEventListener('click', () => toggleLedger(sim));
    },

    hideEnd() {
      endModal.style.display = 'none';
    },

    toggleLedger,

    setHidden(hidden: boolean) {
      root.style.display = hidden ? 'none' : 'block';
    },
  };
}
