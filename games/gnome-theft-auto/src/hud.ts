// Gnome Theft Auto HUD: Hat Watch hats, dryness and tank bars, gun, vehicle name, soaked count, crosshair,
// prompts, toasts, a big banner and a minimap. Everything lives in one #gta-hud container appended to #ui.
import { prefabIconElement } from '@lawn/prefabs';
import { BASE, COLORS, GUNS, MAX_HEAT, ROAD_LINES, ROAD_WIDTH, WORLD_HALF } from './config';
import type { GunKind, Hud, HudState } from './types';

const CSS = `
#gta-hud{position:fixed;inset:0;pointer-events:none;font-family:system-ui,sans-serif;font-weight:700;color:#fff;
  text-shadow:0 1px 3px rgba(0,0,0,.85);
  --sat:env(safe-area-inset-top,0px);--sar:env(safe-area-inset-right,0px);
  --sab:env(safe-area-inset-bottom,0px);--sal:env(safe-area-inset-left,0px);}
#gta-hud .gta-tl{position:absolute;top:calc(var(--sat) + 12px);left:calc(var(--sal) + 12px);max-width:190px;
  padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.25);font-size:12px;box-sizing:border-box;}
#gta-hud .gta-label{font-size:11px;letter-spacing:.08em;opacity:.95;}
#gta-hud .gta-hats{display:flex;gap:4px;margin-top:4px;}
#gta-hud .gta-hat{display:inline-block;width:22px;height:22px;line-height:0;}
#gta-hud .gta-hat svg{width:22px;height:22px;overflow:visible;}
#gta-hud .gta-hat path,#gta-hud .gta-hat rect{fill:rgba(128,128,128,.35);stroke:none;}
#gta-hud .gta-hat.lit path,#gta-hud .gta-hat.lit rect{fill:#1f3a93;stroke:#fff;stroke-width:1.5;}
#gta-hud .gta-hats.hot .gta-hat.lit{animation:gta-pulse .9s ease-in-out infinite;}
#gta-hud .gta-row{display:flex;align-items:center;gap:6px;margin-top:5px;}
#gta-hud .gta-row .gta-k{width:30px;font-size:11px;}
#gta-hud .gta-bar{width:120px;height:9px;border-radius:5px;background:rgba(0,0,0,.45);overflow:hidden;
  border:1px solid rgba(255,255,255,.6);box-sizing:border-box;}
#gta-hud .gta-bar i{display:block;height:100%;width:0;}
#gta-hud .gta-gun{display:flex;align-items:center;gap:6px;margin-top:6px;}
#gta-hud .gta-gunicon{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;flex:none;}
#gta-hud .gta-gunicon img,#gta-hud .gta-gunicon canvas{width:28px;height:28px;object-fit:contain;}
#gta-hud .gta-gunicon span{font-size:22px;line-height:1;}
#gta-hud .gta-soaked{font-size:12px;margin-top:4px;}
#gta-hud .gta-help{font-size:11px;margin-top:6px;opacity:.95;line-height:1.3;}
#gta-hud .gta-tr{position:absolute;top:calc(var(--sat) + 12px);right:calc(var(--sar) + 12px);}
#gta-hud .gta-map{display:block;border-radius:12px;border:2px solid rgba(255,255,255,.75);
  box-shadow:0 2px 6px rgba(0,0,0,.4);}
#gta-hud .gta-toasts{position:absolute;top:calc(var(--sat) + 12px);left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:6px;width:max-content;max-width:50vw;}
#gta-hud .gta-pill{background:rgba(0,0,0,.62);border-radius:999px;padding:6px 14px;font-size:14px;
  line-height:1.25;text-align:center;box-sizing:border-box;max-width:100%;}
#gta-hud .gta-toast{transition:opacity .4s ease;}
#gta-hud .gta-toast.out{opacity:0;}
#gta-hud .gta-cross{position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;
  box-sizing:border-box;border:2px solid rgba(255,255,255,.9);border-radius:50%;box-shadow:0 0 2px rgba(0,0,0,.6);}
#gta-hud .gta-bottom{position:absolute;left:0;right:0;bottom:calc(var(--sab) + 120px);
  display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 16px;box-sizing:border-box;}
#gta-hud .gta-banner{position:absolute;left:0;right:0;top:38%;transform:translateY(-50%);text-align:center;padding:0 16px;}
#gta-hud .gta-banner-text{display:inline-block;font-size:clamp(28px,7vw,64px);line-height:1.1;font-weight:800;
  text-shadow:0 2px 6px rgba(0,0,0,.9);animation:gta-scale-in .3s ease-out both;}
#gta-hud .gta-banner-text.out{animation:gta-fade-out .4s ease-in both;}
#gta-hud .gta-online{position:absolute;right:calc(var(--sar) + 12px);top:calc(var(--sat) + 150px);font-size:12px;}
@keyframes gta-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.18);}}
@keyframes gta-scale-in{0%{transform:scale(2.2);opacity:0;}60%{transform:scale(.95);opacity:1;}100%{transform:scale(1);opacity:1;}}
@keyframes gta-fade-out{from{opacity:1;}to{opacity:0;}}
@media (max-width:600px){
  #gta-hud .gta-toasts{top:calc(var(--sat) + 210px);max-width:80vw;}
}
/* Portrait phone: the touch buttons fill the bottom ~260 px, so the prompt sits above them. */
@media (max-width:600px) and (min-height:501px){
  #gta-hud .gta-bottom{bottom:calc(var(--sab) + 275px);}
}
@media (max-width:420px){
  #gta-hud .gta-online{top:calc(var(--sat) + 118px);}
}
/* Short screens (a phone in landscape): smaller panel, prompt down low between the stick and the buttons. */
@media (max-height:500px){
  #gta-hud .gta-tl{transform:scale(.78);transform-origin:top left;}
  #gta-hud .gta-bottom{bottom:calc(var(--sab) + 10px);left:200px;right:240px;padding:0;}
  #gta-hud .gta-bottom .gta-pill{font-size:12px;padding:4px 10px;}
  #gta-hud .gta-help{display:none;}
  #gta-hud .gta-toasts{top:calc(var(--sat) + 8px);max-width:40vw;}
}
`;

const HAT_SVG =
  '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 1.5 L18.5 15 L3.5 15 Z" stroke-linejoin="round"/>' +
  '<rect x="1" y="14.5" width="20" height="4.5" rx="2.25"/></svg>';

const DRY_DARK = [10, 31, 92];
const DRY_LIGHT = [58, 160, 255];
const TANK_COLOR = '#a8e6ff';
const hexColor = (n: number) => '#' + n.toString(16).padStart(6, '0');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function dryColor(v: number): string {
  const t = clamp01(v);
  const c = (i: number) => Math.round(DRY_DARK[i] + (DRY_LIGHT[i] - DRY_DARK[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

function bar(label: string): { row: HTMLElement; fill: HTMLElement } {
  const row = el('div', 'gta-row');
  const track = el('div', 'gta-bar');
  const fill = el('i');
  track.append(fill);
  row.append(el('span', 'gta-k', label), track);
  return { row, fill };
}

export function createHud(ui: HTMLElement): Hud {
  const root = el('div');
  root.id = 'gta-hud';
  const style = el('style');
  style.textContent = CSS;
  root.append(style);

  // Top-left: Hat Watch, bars, gun, soaked count, first-visit help.
  const tl = el('div', 'gta-tl');
  const hatsRow = el('div', 'gta-hats');
  const hats: HTMLElement[] = [];
  for (let i = 0; i < MAX_HEAT; i++) {
    const h = el('span', 'gta-hat');
    h.innerHTML = HAT_SVG;
    hats.push(h);
    hatsRow.append(h);
  }
  const hatLabel = el('div', 'gta-label', 'HAT WATCH');
  const dry = bar('Dry');
  const tank = bar('Tank');
  const gunRow = el('div', 'gta-gun');
  const gunIcon = el('span', 'gta-gunicon');
  const gunName = el('span');
  gunRow.append(gunIcon, gunName);
  const soakedEl = el('div', 'gta-soaked', 'Soaked: 0');
  tl.append(hatLabel, hatsRow, dry.row, tank.row, gunRow, soakedEl);
  const helpText = matchMedia('(pointer: fine)').matches
    ? 'WASD move · click + mouse look · click/F squirt · E steal · Space jump · Q swap'
    : 'Stick to move · drag to look · Squirt · Enter to steal';
  const help = el('div', 'gta-help', helpText);
  tl.append(help);
  setTimeout(() => help.remove(), 8000);

  // Top-right: minimap.
  const tr = el('div', 'gta-tr');
  const mapCanvas = el('canvas', 'gta-map');
  tr.append(mapCanvas);
  const mapCtx = mapCanvas.getContext('2d');

  const toasts = el('div', 'gta-toasts');
  const cross = el('div', 'gta-cross');
  const bannerBox = el('div', 'gta-banner');

  // Bottom-centre: vehicle name and prompt.
  const bottom = el('div', 'gta-bottom');
  const vehicleEl = el('div', 'gta-pill');
  const promptEl = el('div', 'gta-pill');
  vehicleEl.style.display = 'none';
  promptEl.style.display = 'none';
  bottom.append(vehicleEl, promptEl);
  const fine = matchMedia('(pointer: fine)').matches;

  const online = el('div', 'gta-online');
  online.style.display = 'none';

  root.append(tl, tr, toasts, cross, bannerBox, bottom, online);
  ui.append(root);

  // ---- Minimap -------------------------------------------------------------------------------------------------
  const H = WORLD_HALF;
  let size = 0;
  let mapDpr = 1;
  let bgCanvas: HTMLCanvasElement | null = null;

  function drawBackground(g: CanvasRenderingContext2D, px: number) {
    const s = px / (2 * H);
    const rect = (x0: number, z0: number, x1: number, z1: number, color: string) => {
      g.fillStyle = color;
      const ax = (Math.min(x0, x1) + H) * s;
      const ay = (H - Math.max(z0, z1)) * s;
      g.fillRect(ax, ay, Math.abs(x1 - x0) * s, Math.abs(z1 - z0) * s);
    };
    const road = hexColor(COLORS.road);
    rect(-H, -H, H, H, hexColor(COLORS.grass));
    const hw = ROAD_WIDTH / 2;
    // Roads follow the world: nothing inside the base (x > minX, z < maxZ) except the gate stub north of it.
    for (const L of ROAD_LINES) {
      // Road along x = L (runs along z).
      if (L > BASE.minX) rect(L - hw, BASE.maxZ, L + hw, H, road);
      else rect(L - hw, -H, L + hw, H, road);
      // Road along z = L (runs along x).
      if (L < BASE.maxZ) rect(-H, L - hw, BASE.minX, L + hw, road);
      else rect(-H, L - hw, H, L + hw, road);
    }
    rect(BASE.minX, BASE.minZ, BASE.maxX, BASE.maxZ, hexColor(COLORS.sand));
    g.strokeStyle = hexColor(COLORS.baseWall);
    g.lineWidth = 1;
    g.strokeRect(
      (BASE.minX + H) * s, (H - BASE.maxZ) * s,
      (BASE.maxX - BASE.minX) * s, (BASE.maxZ - BASE.minZ) * s,
    );
  }

  function sizeMap(px: number) {
    size = px;
    mapDpr = window.devicePixelRatio || 1;
    mapCanvas.style.width = `${px}px`;
    mapCanvas.style.height = `${px}px`;
    mapCanvas.width = Math.round(px * mapDpr);
    mapCanvas.height = Math.round(px * mapDpr);
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = mapCanvas.width;
    bgCanvas.height = mapCanvas.height;
    const g = bgCanvas.getContext('2d');
    if (g) {
      g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
      drawBackground(g, px);
    }
  }

  const mx = (x: number) => (x + H) * (size / (2 * H));
  const mz = (z: number) => (H - z) * (size / (2 * H));

  function drawMap(s: HudState) {
    if (!mapCtx) return;
    const px = window.innerWidth < 420 ? 96 : 128;
    if (px !== size) sizeMap(px);
    const g = mapCtx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (bgCanvas) g.drawImage(bgCanvas, 0, 0);
    g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
    for (const b of s.blips) {
      g.fillStyle = b.color;
      g.beginPath();
      g.arc(mx(b.x), mz(b.z), 1.5, 0, Math.PI * 2);
      g.fill();
    }
    // Player: white arrow along yaw. Forward in world (sin, cos) is (sin, -cos) on the map.
    const px0 = mx(s.player.x);
    const py0 = mz(s.player.z);
    const fx = Math.sin(s.player.yaw);
    const fy = -Math.cos(s.player.yaw);
    const perpX = -fy;
    const perpY = fx;
    g.beginPath();
    g.moveTo(px0 + fx * 7, py0 + fy * 7);
    g.lineTo(px0 - fx * 3 + perpX * 4, py0 - fy * 3 + perpY * 4);
    g.lineTo(px0 - fx * 3 - perpX * 4, py0 - fy * 3 - perpY * 4);
    g.closePath();
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.6)';
    g.lineWidth = 1;
    g.stroke();
  }

  sizeMap(window.innerWidth < 420 ? 96 : 128);

  // ---- Gun icon ------------------------------------------------------------------------------------------------
  let gunShown: string | null = null;
  function setGun(name: string) {
    if (name === gunShown) return;
    gunShown = name;
    const kind = (Object.keys(GUNS) as GunKind[]).find((k) => GUNS[k].name === name);
    let node: HTMLElement | null = null;
    try {
      node = prefabIconElement(kind ? GUNS[kind].prefab : undefined, '💦', 28);
    } catch {
      node = null;
    }
    if (!node) {
      node = el('span', undefined, '💦');
    }
    gunIcon.replaceChildren(node);
    gunName.textContent = name;
  }

  // ---- Per-frame state (DOM written only on change) ----------------------------------------------------------------
  const last: {
    heat?: number; dryness?: number; tank?: number; gun?: string; vehicle?: string | null;
    soaked?: number; prompt?: string | null; online?: string | null; crosshair?: boolean;
  } = {};

  return {
    setWorld() {}, // STUB (issue 1E)
    set(s: HudState) {
      if (s.heat !== last.heat) {
        last.heat = s.heat;
        const lit = Math.floor(s.heat);
        hats.forEach((h, i) => h.classList.toggle('lit', i < lit));
        hatsRow.classList.toggle('hot', lit >= 1);
      }
      if (s.dryness !== last.dryness) {
        last.dryness = s.dryness;
        const v = clamp01(s.dryness);
        dry.fill.style.width = `${Math.round(v * 100)}%`;
        dry.fill.style.background = dryColor(v);
      }
      const ammoFrac = s.mag > 0 ? s.ammo / s.mag : 0; // STUB (issue 1E): show the numbers
      if (ammoFrac !== last.tank) {
        last.tank = ammoFrac;
        const v = clamp01(ammoFrac);
        tank.fill.style.width = `${Math.round(v * 100)}%`;
        tank.fill.style.background = TANK_COLOR;
      }
      if (s.gun !== last.gun) {
        last.gun = s.gun;
        setGun(s.gun);
      }
      if (s.soaked !== last.soaked) {
        last.soaked = s.soaked;
        soakedEl.textContent = `Soaked: ${s.soaked}`;
      }
      if (s.vehicle !== last.vehicle) {
        last.vehicle = s.vehicle;
        vehicleEl.style.display = s.vehicle === null ? 'none' : '';
        vehicleEl.textContent = s.vehicle ?? '';
      }
      if (s.prompt !== last.prompt) {
        last.prompt = s.prompt;
        promptEl.style.display = s.prompt === null ? 'none' : '';
        promptEl.textContent = s.prompt === null ? '' : (fine ? 'E: ' : '') + s.prompt;
      }
      if (s.online !== last.online) {
        last.online = s.online;
        online.style.display = s.online === null ? 'none' : '';
        online.textContent = s.online ?? '';
      }
      const crosshair = s.vehicle === null;
      if (crosshair !== last.crosshair) {
        last.crosshair = crosshair;
        cross.style.display = crosshair ? '' : 'none';
      }
      drawMap(s);
    },

    toast(text: string, ms = 2600) {
      const t = el('div', 'gta-pill gta-toast', text);
      toasts.append(t);
      while (toasts.children.length > 4) toasts.firstElementChild?.remove();
      setTimeout(() => t.classList.add('out'), Math.max(0, ms - 400));
      setTimeout(() => t.remove(), ms);
    },

    banner(text: string, ms = 2000) {
      const b = el('div', 'gta-banner-text', text);
      bannerBox.replaceChildren(b);
      setTimeout(() => b.classList.add('out'), Math.max(0, ms - 400));
      setTimeout(() => {
        if (b.parentNode === bannerBox) b.remove();
      }, ms);
    },
  };
}
