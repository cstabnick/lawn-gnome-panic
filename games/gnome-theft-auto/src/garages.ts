// Turfton garages: Pay 'n' Glaze (auto-respray, repair & heat-clear bay) and Side-Valve Salvage (11-knob tuning & livery).
import { TUNING_PARAMS, type TuningParamId } from '@lawn/vehicle';
import { brandForVehicle } from './brands';
import { MOWER_TINTS, PAY_N_GLAZE, SIDE_VALVE, VEHICLES } from './config';
import type { Economy } from './economy';
import { rangeFor } from './handling';
import { getSetup, resetSetup, setSetup } from './simdrive';
import type { Hud, Player, Sfx, Vehicle, VehicleKind, Watch } from './types';

export interface GarageDeps {
  repaintVehicle(v: Vehicle, tint: number): void;
  repairVehicle(v: Vehicle): void;
  onTuningChange(): void;
  play(sfx: Sfx): void;
}

export interface Garages {
  update(dt: number, player: Player, watch: Watch): void;
  openTuningModal(kind?: VehicleKind): void;
  closeTuningModal(): void;
  isOpen(): boolean;
  prompt(player: Player): string | null;
}

const GROUND_KINDS: readonly VehicleKind[] = ['push-bike', 'ride-on', 'zero-turn', 'combine'];
const SIDE_VALVE_RADIUS = 10;
const RESPRAY_DURATION = 2.5;
const RESPRAY_COOLDOWN = 8;
const RESPRAY_COST = 50;

interface LiverySwatch {
  name: string;
  hex: number;
}

const LIVERY_SWATCHES: readonly LiverySwatch[] = [
  { name: 'Buck-Iron Green', hex: 0x2e7d32 },
  { name: 'Razor-Back Orange', hex: 0xf05a24 },
  { name: 'Husky-Blade Blue', hex: 0x1f6feb },
  { name: 'Thorne Obsidian', hex: 0x1c1c22 },
  { name: 'Sea-Foam', hex: 0x38b2ac },
];

const CSS = `
#gta-garage{position:fixed;inset:0;pointer-events:none;z-index:35;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-garage button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-garage .gta-tune-fab{
  position:fixed;display:none;align-items:center;justify-content:center;gap:6px;
  min-width:44px;min-height:44px;padding:10px 18px;border-radius:999px;
  border:2px solid rgba(255,210,63,0.9);background:rgba(22,26,30,0.88);
  color:#ffd23f;font-size:15px;font-weight:800;letter-spacing:0.02em;
  box-shadow:0 4px 14px rgba(0,0,0,0.5);pointer-events:auto;
  left:calc(50% + (env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)) / 2);
  transform:translateX(-50%);
  bottom:calc(env(safe-area-inset-bottom,0px) + 56px);
}
#gta-garage .gta-tune-fab:active{transform:translateX(-50%) scale(0.97);}
@media (max-width:600px) and (min-height:501px){
  #gta-garage .gta-tune-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 324px);}
}
@media (max-height:500px){
  #gta-garage .gta-tune-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 52px);}
}
#gta-garage .gta-garage-backdrop{
  position:fixed;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.68);pointer-events:auto;
  padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px)
          calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);
  box-sizing:border-box;
}
#gta-garage .gta-garage-backdrop.open{display:flex;}
#gta-garage .gta-garage-modal{
  width:min(100%,540px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-y;background:#181c20;border:2px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:14px;box-sizing:border-box;box-shadow:0 12px 32px rgba(0,0,0,0.65);
  display:flex;flex-direction:column;gap:12px;
}
#gta-garage .gta-garage-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-garage .gta-garage-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-garage .gta-garage-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-garage .gta-garage-close{
  min-width:44px;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.08);font-size:18px;font-weight:700;padding:0;
}
#gta-garage .gta-garage-sec-label{
  font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#ffd23f;margin-bottom:6px;
}
#gta-garage .gta-kind-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
#gta-garage .gta-kind-btn{
  min-height:44px;padding:8px 10px;border-radius:10px;border:2px solid rgba(255,255,255,0.24);
  background:rgba(255,255,255,0.06);font-size:13px;font-weight:700;text-align:center;
}
#gta-garage .gta-kind-btn.active{border-color:#ffd23f;background:rgba(255,210,63,0.16);color:#ffd23f;}
#gta-garage .gta-vehicle-badge{
  padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:space-between;gap:8px;
}
#gta-garage .gta-vehicle-name{font-size:15px;font-weight:800;}
#gta-garage .gta-vehicle-brand{font-size:12px;opacity:0.8;}
#gta-garage .gta-swatches{display:flex;flex-wrap:wrap;gap:8px;}
#gta-garage .gta-swatch{
  min-width:44px;min-height:44px;padding:6px 10px;border-radius:10px;
  border:2px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.06);
  display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;
}
#gta-garage .gta-swatch.active{border-color:#ffd23f;background:rgba(255,210,63,0.14);}
#gta-garage .gta-swatch-dot{
  width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,0.65);flex-shrink:0;
}
#gta-garage .gta-sliders{display:grid;grid-template-columns:1fr;gap:10px;}
@media (max-height:500px){
  #gta-garage .gta-garage-modal{width:min(100%,680px);}
  #gta-garage .gta-sliders{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px;}
}
#gta-garage .gta-slider-row{
  padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1);
}
#gta-garage .gta-slider-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:13px;font-weight:700;}
#gta-garage .gta-slider-val{font-variant-numeric:tabular-nums;color:#ffd23f;}
#gta-garage .gta-slider-blurb{font-size:11px;opacity:0.74;line-height:1.25;margin-top:2px;}
#gta-garage .gta-slider-input{
  width:100%;height:44px;margin:0;accent-color:#ffd23f;cursor:pointer;background:transparent;
}
#gta-garage .gta-garage-foot{display:flex;gap:10px;justify-content:space-between;padding-top:4px;}
#gta-garage .gta-btn-reset{
  min-height:44px;padding:0 16px;border-radius:10px;border:2px solid rgba(255,120,90,0.6);
  background:rgba(255,90,60,0.14);color:#ffb3a0;font-size:14px;font-weight:700;flex:1;
}
#gta-garage .gta-btn-done{
  min-height:44px;padding:0 18px;border-radius:10px;border:2px solid #ffd23f;
  background:#ffd23f;color:#181c20;font-size:14px;font-weight:800;flex:1;
}
`;

function hexCss(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
}

function isGroundVehicle(v: Vehicle | null | undefined): v is Vehicle {
  return Boolean(v && !v.spec.flies && !v.exploded);
}

function isGroundKind(kind: VehicleKind | undefined): kind is VehicleKind {
  return Boolean(kind && GROUND_KINDS.includes(kind));
}

function pickNextTint(current: number): number {
  const idx = MOWER_TINTS.indexOf(current as (typeof MOWER_TINTS)[number]);
  if (idx >= 0) return MOWER_TINTS[(idx + 1) % MOWER_TINTS.length];
  return MOWER_TINTS[0];
}

/**
 * Builds the Pay 'n' Glaze bay logic and Side-Valve Salvage tuning/livery modal.
 */
export function createGarages(
  ui: HTMLElement,
  hud: Hud,
  economy: Economy,
  deps: GarageDeps,
): Garages {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-garage';

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'gta-tune-fab';
  fab.textContent = '🔧 Tune Mower';

  const backdrop = document.createElement('div');
  backdrop.className = 'gta-garage-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gta-garage-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Side-Valve Salvage Tuning Garage');

  backdrop.appendChild(modal);
  root.append(fab, backdrop);
  ui.appendChild(root);

  // Prevent touches/clicks on garage controls from triggering camera look, stick, or pointer lock.
  fab.addEventListener('pointerdown', (e) => e.stopPropagation());
  backdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  let modalOpen = false;
  let activeKind: VehicleKind = 'ride-on';
  let lastPlayer: Player | null = null;
  let lastTunedBrand: string | null = null;
  let selectedTint: number | null = null;

  // Pay 'n' Glaze state.
  let resprayTimer = 0;
  let resprayCooldown = 0;
  let resprayTarget: Vehicle | null = null;

  const sliderMap = new Map<TuningParamId, { input: HTMLInputElement; valEl: HTMLElement }>();

  function trackBrand(kind: VehicleKind, tint: number): void {
    const nextBrand = brandForVehicle(kind, tint).id;
    if (
      (lastTunedBrand === 'buck-iron' && nextBrand === 'razor-back') ||
      (lastTunedBrand === 'razor-back' && nextBrand === 'buck-iron')
    ) {
      hud.toast('Side-Valve Salvage: 20% "Emotional Damage Surcharge" applied!');
    }
    lastTunedBrand = nextBrand;
  }

  function currentGroundVehicle(): Vehicle | null {
    const v = lastPlayer?.vehicle;
    return isGroundVehicle(v) ? v : null;
  }

  function renderModal(): void {
    modal.innerHTML = '';
    sliderMap.clear();

    const driving = currentGroundVehicle();
    const displayTint = driving ? driving.tint : (selectedTint ?? LIVERY_SWATCHES[0].hex);
    const brand = brandForVehicle(activeKind, displayTint);

    // Header
    const head = document.createElement('div');
    head.className = 'gta-garage-head';
    const titleWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'gta-garage-title';
    title.textContent = 'Side-Valve Salvage';
    const sub = document.createElement('div');
    sub.className = 'gta-garage-sub';
    sub.textContent = '11-knob chassis tuning & custom livery glaze';
    titleWrap.append(title, sub);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gta-garage-close';
    closeBtn.setAttribute('aria-label', 'Close tuning garage');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => closeTuningModal());
    head.append(titleWrap, closeBtn);
    modal.appendChild(head);

    // Vehicle kind selector or current vehicle badge
    const vehSec = document.createElement('div');
    const vehLabel = document.createElement('div');
    vehLabel.className = 'gta-garage-sec-label';
    vehLabel.textContent = driving ? 'Current Vehicle' : 'Select Mower Class';
    vehSec.appendChild(vehLabel);

    if (driving) {
      const badge = document.createElement('div');
      badge.className = 'gta-vehicle-badge';
      const nameEl = document.createElement('span');
      nameEl.className = 'gta-vehicle-name';
      nameEl.textContent = VEHICLES[activeKind].name;
      const brandEl = document.createElement('span');
      brandEl.className = 'gta-vehicle-brand';
      brandEl.textContent = brand.name;
      badge.append(nameEl, brandEl);
      vehSec.appendChild(badge);
    } else {
      const grid = document.createElement('div');
      grid.className = 'gta-kind-grid';
      for (const k of GROUND_KINDS) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `gta-kind-btn${k === activeKind ? ' active' : ''}`;
        btn.textContent = VEHICLES[k].name;
        btn.addEventListener('click', () => {
          if (activeKind === k) return;
          activeKind = k;
          trackBrand(activeKind, selectedTint ?? LIVERY_SWATCHES[0].hex);
          renderModal();
        });
        grid.appendChild(btn);
      }
      vehSec.appendChild(grid);
    }
    modal.appendChild(vehSec);

    // Livery tint picker
    const livSec = document.createElement('div');
    const livLabel = document.createElement('div');
    livLabel.className = 'gta-garage-sec-label';
    livLabel.textContent = driving ? 'Livery Tint' : 'Livery Tint (drive a ground mower to apply)';
    const swatches = document.createElement('div');
    swatches.className = 'gta-swatches';

    const updateSwatchActive = (activeHex: number): void => {
      swatches.querySelectorAll<HTMLButtonElement>('.gta-swatch').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.hex) === activeHex);
      });
    };

    for (const sw of LIVERY_SWATCHES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gta-swatch${displayTint === sw.hex ? ' active' : ''}`;
      btn.dataset.hex = String(sw.hex);
      const dot = document.createElement('span');
      dot.className = 'gta-swatch-dot';
      dot.style.background = hexCss(sw.hex);
      const label = document.createElement('span');
      label.textContent = sw.name;
      btn.append(dot, label);
      btn.addEventListener('click', () => {
        selectedTint = sw.hex;
        const v = currentGroundVehicle();
        if (v) deps.repaintVehicle(v, sw.hex);
        trackBrand(activeKind, sw.hex);
        updateSwatchActive(sw.hex);
      });
      swatches.appendChild(btn);
    }
    livSec.append(livLabel, swatches);
    modal.appendChild(livSec);

    // 11 Tuning sliders
    const tuneSec = document.createElement('div');
    const tuneLabel = document.createElement('div');
    tuneLabel.className = 'gta-garage-sec-label';
    tuneLabel.textContent = 'Chassis & Drivetrain Setup';
    const sliders = document.createElement('div');
    sliders.className = 'gta-sliders';

    const setup = getSetup(activeKind);
    for (const param of TUNING_PARAMS) {
      const [lo, hi] = rangeFor(activeKind, param.id);
      const val = Math.max(lo, Math.min(hi, setup[param.id]));

      const row = document.createElement('div');
      row.className = 'gta-slider-row';

      const top = document.createElement('div');
      top.className = 'gta-slider-top';
      const lbl = document.createElement('label');
      lbl.textContent = param.label;
      lbl.htmlFor = `gta-tune-${param.id}`;
      const valEl = document.createElement('span');
      valEl.className = 'gta-slider-val';
      valEl.textContent = val.toFixed(2);
      top.append(lbl, valEl);

      const blurb = document.createElement('div');
      blurb.className = 'gta-slider-blurb';
      blurb.textContent = param.blurb;

      const input = document.createElement('input');
      input.type = 'range';
      input.id = `gta-tune-${param.id}`;
      input.className = 'gta-slider-input';
      input.min = String(lo);
      input.max = String(hi);
      input.step = String(param.step);
      input.value = String(val);

      input.addEventListener('input', () => {
        const raw = Number.parseFloat(input.value);
        const clamped = Math.max(lo, Math.min(hi, Math.round(raw * 100) / 100));
        valEl.textContent = clamped.toFixed(2);
        setSetup(activeKind, { [param.id]: clamped });
        deps.onTuningChange();
      });

      row.append(top, blurb, input);
      sliders.appendChild(row);
      sliderMap.set(param.id, { input, valEl });
    }
    tuneSec.append(tuneLabel, sliders);
    modal.appendChild(tuneSec);

    // Footer buttons
    const foot = document.createElement('div');
    foot.className = 'gta-garage-foot';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'gta-btn-reset';
    resetBtn.textContent = 'Reset Stock';
    resetBtn.addEventListener('click', () => {
      const fresh = resetSetup(activeKind);
      for (const param of TUNING_PARAMS) {
        const entry = sliderMap.get(param.id);
        if (!entry) continue;
        const [lo, hi] = rangeFor(activeKind, param.id);
        const clamped = Math.max(lo, Math.min(hi, fresh[param.id]));
        entry.input.value = String(clamped);
        entry.valEl.textContent = clamped.toFixed(2);
      }
      deps.onTuningChange();
      deps.play('door');
    });

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'gta-btn-done';
    doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', () => closeTuningModal());

    foot.append(resetBtn, doneBtn);
    modal.appendChild(foot);
  }

  function openTuningModal(kind?: VehicleKind): void {
    const driving = currentGroundVehicle();
    const resolved: VehicleKind = isGroundKind(kind)
      ? kind
      : driving
        ? driving.kind
        : 'ride-on';
    activeKind = resolved;
    const tint = driving ? driving.tint : (selectedTint ?? LIVERY_SWATCHES[0].hex);
    trackBrand(activeKind, tint);
    renderModal();
    modalOpen = true;
    backdrop.classList.add('open');
    fab.style.display = 'none';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function closeTuningModal(): void {
    if (!modalOpen) return;
    modalOpen = false;
    backdrop.classList.remove('open');
  }

  fab.addEventListener('click', () => openTuningModal());
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeTuningModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && modalOpen) closeTuningModal();
  });

  function updatePayNGlaze(dt: number, player: Player, watch: Watch): void {
    if (resprayCooldown > 0) resprayCooldown = Math.max(0, resprayCooldown - dt);

    const v = player.vehicle;
    if (!isGroundVehicle(v)) {
      resprayTimer = 0;
      resprayTarget = null;
      return;
    }

    const dist = Math.hypot(v.x - PAY_N_GLAZE.bay.x, v.z - PAY_N_GLAZE.bay.z);
    if (resprayTarget === v && resprayTimer > 0) {
      if (dist > PAY_N_GLAZE.bay.radius + 1.5) {
        resprayTimer = 0;
        resprayTarget = null;
        return;
      }
      v.speed *= 0.9;
      resprayTimer -= dt;
      if (resprayTimer <= 0) {
        resprayTimer = 0;
        resprayTarget = null;
        deps.repairVehicle(v);
        const nextTint = pickNextTint(v.tint);
        deps.repaintVehicle(v, nextTint);
        watch.clear();
        if (economy.state().acorns >= RESPRAY_COST) {
          economy.spend(RESPRAY_COST, "Pay 'n' Glaze");
        }
        deps.play('door');
        hud.toast("PAY 'N' GLAZE: Fresh paint, VIN filed off, Hat Watch confused!");
        resprayCooldown = RESPRAY_COOLDOWN;
      }
      return;
    }

    if (resprayCooldown <= 0 && dist <= PAY_N_GLAZE.bay.radius) {
      resprayTarget = v;
      resprayTimer = RESPRAY_DURATION;
      v.speed *= 0.9;
      hud.toast("PAY 'N' GLAZE: Respraying...");
    }
  }

  function nearSideValve(player: Player): boolean {
    const px = player.vehicle ? player.vehicle.x : player.x;
    const pz = player.vehicle ? player.vehicle.z : player.z;
    return Math.hypot(px - SIDE_VALVE.bay.x, pz - SIDE_VALVE.bay.z) <= SIDE_VALVE_RADIUS;
  }

  return {
    update(dt: number, player: Player, watch: Watch): void {
      lastPlayer = player;
      updatePayNGlaze(dt, player, watch);
      const showFab = !modalOpen && nearSideValve(player);
      fab.style.display = showFab ? 'inline-flex' : 'none';
    },

    openTuningModal,
    closeTuningModal,
    isOpen: (): boolean => modalOpen,

    prompt(player: Player): string | null {
      if (player.vehicle) return null;
      const dist = Math.hypot(player.x - SIDE_VALVE.bay.x, player.z - SIDE_VALVE.bay.z);
      return dist <= SIDE_VALVE_RADIUS ? 'Tune Mower (Side-Valve Salvage)' : null;
    },
  };
}
