// Admin Trainer menu (F9 or gear button): God Mode, Fly/Noclip, Region Teleport, Kits, Hatless & World controls.
import type { RegionDef, RegionId, WeatherKind } from '../sim/types';

export interface TrainerState {
  godMode: boolean;
  flyMode: boolean;
  flySpeed: number;
  infiniteStamina?: boolean;
}

export interface TrainerDeps {
  regions: readonly RegionDef[];
  onTeleport(region: RegionId): void;
  onGiveKit(kit: 'survival' | 'combat' | 'build' | 'climb' | 'acorns' | 'heal'): void;
  onHatless(action: 'spawn5' | 'clear'): void;
  onSetTime(hour: number): void;
  onCycleWeather(): WeatherKind;
  onSetTimeScale(scale: number): void;
  onToggleLootRespawn?: () => boolean;
  onGiveVehicleParts?: () => void;
  onUnlockAllLore?: () => void;
  onTriggerSupplyDrop?: () => void;
}

export interface TrainerPanel {
  root: HTMLElement;
  state: TrainerState;
  toggle(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
  updateInfo?(text: string): void;
}

const CSS = `
#dayg-trainer{position:fixed;top:calc(68px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));z-index:70;
  width:min(320px,92vw);max-height:calc(100dvh - 84px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow-y:auto;background:var(--dg-surface);border:1px solid var(--dg-border-strong);border-radius:12px;padding:12px;box-sizing:border-box;
  color:var(--dg-text);font:13px var(--dg-font);pointer-events:auto;display:none;flex-direction:column;gap:10px;
  box-shadow:var(--dg-shadow);backdrop-filter:blur(6px)}
#dayg-trainer.dt-open{display:flex}
#dayg-trainer .dt-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--dg-border);padding-bottom:6px}
#dayg-trainer .dt-title{font-weight:700;font-size:15px;color:var(--dg-accent)}
#dayg-trainer .dt-sec{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--dg-muted);margin-top:2px}
#dayg-trainer .dt-row{display:flex;flex-wrap:wrap;gap:6px}
#dayg-trainer .dt-btn{min-height:44px;min-width:44px;padding:6px 10px;border-radius:8px;border:1px solid var(--dg-border);
  background:var(--dg-surface-2);color:var(--dg-text);font:13px var(--dg-font);cursor:pointer;touch-action:manipulation;flex:1 1 auto}
#dayg-trainer .dt-btn:hover{background:var(--dg-surface-hover);border-color:var(--dg-border-strong)}
#dayg-trainer .dt-btn.dt-on{background:#4f6b3a;border-color:var(--dg-accent);color:#fff;font-weight:600}
#dayg-trainer select{min-height:44px;flex:1 1 160px;padding:6px 8px;border-radius:8px;border:1px solid var(--dg-border);background:var(--dg-surface-2);color:var(--dg-text);font:13px var(--dg-font)}
#dayg-trainer .dt-info{display:none;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,0.24);border:1px solid var(--dg-border);font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dg-muted)}
#dayg-trainer .dt-range-row{display:flex;align-items:center;gap:8px}
#dayg-trainer .dt-range-lbl{font-size:12px;color:var(--dg-text);min-width:74px;font-variant-numeric:tabular-nums}
#dayg-trainer input[type=range]{flex:1;min-height:44px;accent-color:var(--dg-accent);cursor:pointer;touch-action:manipulation}`;

export function createTrainerPanel(ui: HTMLElement, deps: TrainerDeps): TrainerPanel {
  if (!document.getElementById('dayg-trainer-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-trainer-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const state: TrainerState = { godMode: false, flyMode: false, flySpeed: 18, infiniteStamina: false };
  const root = document.createElement('div');
  root.id = 'dayg-trainer';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Admin Trainer');
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  const mkBtn = (label: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dt-btn';
    b.textContent = label;
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  };

  const head = document.createElement('div');
  head.className = 'dt-head';
  const title = document.createElement('div');
  title.className = 'dt-title';
  title.textContent = 'Admin Trainer';
  const closeBtn = mkBtn('✕', () => close());
  closeBtn.style.flex = '0 0 44px';
  head.append(title, closeBtn);

  const infoEl = document.createElement('div');
  infoEl.className = 'dt-info';

  // Modes
  const modesSec = document.createElement('div');
  modesSec.className = 'dt-sec';
  modesSec.textContent = 'Player Cheats';
  const modesRow = document.createElement('div');
  modesRow.className = 'dt-row';
  const godBtn = mkBtn('God Mode: OFF', () => {
    state.godMode = !state.godMode;
    godBtn.textContent = `God Mode: ${state.godMode ? 'ON' : 'OFF'}`;
    godBtn.classList.toggle('dt-on', state.godMode);
  });
  const flyBtn = mkBtn('Fly / Noclip: OFF', () => {
    state.flyMode = !state.flyMode;
    flyBtn.textContent = `Fly / Noclip: ${state.flyMode ? 'ON' : 'OFF'}`;
    flyBtn.classList.toggle('dt-on', state.flyMode);
  });
  const stamBtn = mkBtn('Inf. Stamina: OFF', () => {
    state.infiniteStamina = !state.infiniteStamina;
    stamBtn.textContent = `Inf. Stamina: ${state.infiniteStamina ? 'ON' : 'OFF'}`;
    stamBtn.classList.toggle('dt-on', Boolean(state.infiniteStamina));
  });
  modesRow.append(godBtn, flyBtn, stamBtn);

  const speedRow = document.createElement('div');
  speedRow.className = 'dt-row';
  for (const [label, spd] of [['Fly 1x', 12], ['Fly 2x', 24], ['Fly 4x', 48]] as const) {
    const b = mkBtn(label, () => {
      state.flySpeed = spd;
      for (const child of speedRow.children) child.classList.remove('dt-on');
      b.classList.add('dt-on');
    });
    if (spd === 24) b.classList.add('dt-on');
    speedRow.appendChild(b);
  }
  state.flySpeed = 24;

  // Teleport
  const tpSec = document.createElement('div');
  tpSec.className = 'dt-sec';
  tpSec.textContent = 'Teleport to Region';
  const tpRow = document.createElement('div');
  tpRow.className = 'dt-row';
  const sel = document.createElement('select');
  for (const r of deps.regions) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    sel.appendChild(opt);
  }
  const tpBtn = mkBtn('Go', () => deps.onTeleport(sel.value as RegionId));
  tpBtn.style.flex = '0 0 64px';
  tpRow.append(sel, tpBtn);

  // Kits & Heal
  const kitSec = document.createElement('div');
  kitSec.className = 'dt-sec';
  kitSec.textContent = 'Items & Health';
  const kitRow = document.createElement('div');
  kitRow.className = 'dt-row';
  kitRow.append(
    mkBtn('Heal All', () => deps.onGiveKit('heal')),
    mkBtn('+50 Acorns', () => deps.onGiveKit('acorns')),
    mkBtn('Combat Kit', () => deps.onGiveKit('combat')),
    mkBtn('Build Kit', () => deps.onGiveKit('build')),
    mkBtn('Climb Kit', () => deps.onGiveKit('climb')),
    mkBtn('Survival Kit', () => deps.onGiveKit('survival')),
  );
  if (deps.onGiveVehicleParts) {
    kitRow.append(mkBtn('All Vehicle Parts', () => deps.onGiveVehicleParts!()));
  }

  // Hatless
  const zSec = document.createElement('div');
  zSec.className = 'dt-sec';
  zSec.textContent = 'Hatless';
  const zRow = document.createElement('div');
  zRow.className = 'dt-row';
  zRow.append(
    mkBtn('Spawn 5 Nearby', () => deps.onHatless('spawn5')),
    mkBtn('Clear All', () => deps.onHatless('clear')),
  );

  // World
  const wSec = document.createElement('div');
  wSec.className = 'dt-sec';
  wSec.textContent = 'World & Time';
  const tRow = document.createElement('div');
  tRow.className = 'dt-row';
  tRow.append(
    mkBtn('Dawn', () => deps.onSetTime(7)),
    mkBtn('Noon', () => deps.onSetTime(12)),
    mkBtn('Dusk', () => deps.onSetTime(19.5)),
    mkBtn('Night', () => deps.onSetTime(23)),
  );
  const timeRangeRow = document.createElement('div');
  timeRangeRow.className = 'dt-range-row';
  const timeLbl = document.createElement('div');
  timeLbl.className = 'dt-range-lbl';
  timeLbl.textContent = 'Time: 12:00';
  const timeSlider = document.createElement('input');
  timeSlider.type = 'range';
  timeSlider.min = '0';
  timeSlider.max = '23.5';
  timeSlider.step = '0.5';
  timeSlider.value = '12';
  timeSlider.setAttribute('aria-label', 'Time of day');
  timeSlider.addEventListener('input', (e) => {
    e.stopPropagation();
    const val = Number(timeSlider.value);
    const hh = String(Math.floor(val)).padStart(2, '0');
    const mm = val % 1 === 0 ? '00' : '30';
    timeLbl.textContent = `Time: ${hh}:${mm}`;
    deps.onSetTime(val);
  });
  timeRangeRow.append(timeLbl, timeSlider);

  const wRow = document.createElement('div');
  wRow.className = 'dt-row';
  const weatherBtn = mkBtn('Cycle Weather', () => {
    const w = deps.onCycleWeather();
    weatherBtn.textContent = `Weather: ${w}`;
  });
  wRow.append(
    weatherBtn,
    mkBtn('Sim 1x', () => deps.onSetTimeScale(1)),
    mkBtn('Sim 5x', () => deps.onSetTimeScale(5)),
    mkBtn('Sim 20x', () => deps.onSetTimeScale(20)),
  );
  if (deps.onTriggerSupplyDrop) {
    wRow.append(mkBtn('Spawn Supply Drop', () => deps.onTriggerSupplyDrop!()));
  }
  if (deps.onToggleLootRespawn) {
    const lootBtn = mkBtn('Loot Respawn: OFF', () => {
      const on = deps.onToggleLootRespawn!();
      lootBtn.textContent = `Loot Respawn: ${on ? 'ON' : 'OFF'}`;
      lootBtn.classList.toggle('dt-on', on);
    });
    wRow.append(lootBtn);
  }
  if (deps.onUnlockAllLore) {
    wRow.append(mkBtn('Unlock All Lore', () => deps.onUnlockAllLore!()));
  }

  root.append(head, infoEl, modesSec, modesRow, speedRow, tpSec, tpRow, kitSec, kitRow, zSec, zRow, wSec, tRow, timeRangeRow, wRow);
  ui.appendChild(root);

  let openFlag = false;
  function open(): void { openFlag = true; root.classList.add('dt-open'); }
  function close(): void { openFlag = false; root.classList.remove('dt-open'); }
  function toggle(): void { if (openFlag) close(); else open(); }

  return {
    root,
    state,
    toggle,
    open,
    close,
    isOpen: () => openFlag,
    updateInfo(text: string) {
      infoEl.textContent = text;
      infoEl.style.display = text ? 'block' : 'none';
    },
  };
}
