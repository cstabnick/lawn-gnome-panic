// Gnome Theft Auto HUD: Hat Watch hats, health bar, gun and ammo, flight readout, cracked count, crosshair, prompts,
// toasts, a biome label, a big banner and a minimap. Everything lives in one #gta-hud container appended to #ui.
import { prefabIconElement } from '@lawn/prefabs';
import { BIOME_GROUND, BIOME_NAMES, CITY_HALF, COLORS, GUNS, MAX_HEAT, ROAD_WIDTH } from './config';
import type { GunKind, Hud, HudState, RoadNode, World } from './types';

const CSS = `
#gta-hud{position:fixed;inset:0;pointer-events:none;font-family:system-ui,sans-serif;font-weight:700;color:#fff;
  text-shadow:0 1px 3px rgba(0,0,0,.85);
  --sat:env(safe-area-inset-top,0px);--sar:env(safe-area-inset-right,0px);
  --sab:env(safe-area-inset-bottom,0px);--sal:env(safe-area-inset-left,0px);--m:max(18px,4vw);}
#gta-hud .gta-tl{position:absolute;top:calc(var(--sat) + var(--m));left:calc(var(--sal) + var(--m));max-width:190px;
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
#gta-hud .gta-gun{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:6px;}
#gta-hud .gta-gunicon{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;flex:none;}
#gta-hud .gta-gunicon img,#gta-hud .gta-gunicon canvas{width:28px;height:28px;object-fit:contain;}
#gta-hud .gta-gunicon span{font-size:22px;line-height:1;}
#gta-hud .gta-ammo{margin-left:auto;font-size:20px;line-height:1;font-variant-numeric:tabular-nums;}
#gta-hud .gta-reload{flex-basis:100%;font-size:12px;line-height:14px;letter-spacing:.08em;color:#ffd84a;
  visibility:hidden;}
#gta-hud .gta-reload.on{visibility:visible;animation:gta-blink .5s ease-in-out infinite;}
#gta-hud .gta-flight{margin-top:6px;font-size:12px;line-height:1.35;font-variant-numeric:tabular-nums;}
#gta-hud .gta-chute{color:#bff3ff;}
#gta-hud .gta-cracked{font-size:12px;margin-top:4px;}
#gta-hud .gta-quest{display:none;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.3);font-size:12px;line-height:1.35;}
#gta-hud .gta-quest b{color:#ffd23f;letter-spacing:.04em;}
#gta-hud .gta-quest .gta-demo{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;background:#d64541;font-size:10px;letter-spacing:.08em;}
#gta-hud .gta-help{font-size:11px;margin-top:6px;opacity:.95;line-height:1.3;}
#gta-hud .gta-tr{position:absolute;top:calc(var(--sat) + var(--m));right:calc(var(--sar) + var(--m));}
#gta-hud .gta-map{display:block;border-radius:12px;border:2px solid rgba(255,255,255,.75);
  box-shadow:0 2px 6px rgba(0,0,0,.4);pointer-events:auto;cursor:zoom-in;touch-action:none;}
#gta-hud .gta-big{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;
  gap:8px;background:rgba(0,0,0,.72);pointer-events:auto;cursor:zoom-out;touch-action:none;z-index:30;}
#gta-hud .gta-big.open{display:flex;}
#gta-hud .gta-big canvas{border-radius:12px;border:2px solid rgba(255,255,255,.85);}
#gta-hud .gta-big .gta-bighint{font-size:12px;opacity:.9;}
#gta-hud .gta-toasts{position:absolute;top:calc(var(--sat) + var(--m));left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:6px;width:max-content;max-width:50vw;}
#gta-hud .gta-pill{background:rgba(0,0,0,.62);border-radius:999px;padding:6px 14px;font-size:14px;
  line-height:1.25;text-align:center;box-sizing:border-box;max-width:100%;}
#gta-hud .gta-toast{transition:opacity .4s ease;}
#gta-hud .gta-toast.out{opacity:0;}
#gta-hud .gta-cross{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;}
#gta-hud .gta-cross svg{width:24px;height:24px;overflow:visible;display:block;}
#gta-hud .gta-biome{position:absolute;left:0;right:0;top:22%;text-align:center;padding:0 16px;box-sizing:border-box;
  font-size:clamp(20px,5.5vw,40px);line-height:1.1;font-weight:800;text-shadow:0 2px 6px rgba(0,0,0,.9);
  opacity:0;transition:opacity .6s ease;}
#gta-hud .gta-biome.show{opacity:1;transition:opacity .15s ease;}
#gta-hud .gta-bottom{position:absolute;left:0;right:0;bottom:calc(var(--sab) + 120px);
  display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 16px;box-sizing:border-box;}
#gta-hud .gta-banner{position:absolute;left:0;right:0;top:38%;transform:translateY(-50%);text-align:center;padding:0 16px;}
#gta-hud .gta-banner-text{display:inline-block;font-size:clamp(28px,7vw,64px);line-height:1.1;font-weight:800;
  text-shadow:0 2px 6px rgba(0,0,0,.9);animation:gta-scale-in .3s ease-out both;}
#gta-hud .gta-banner-text.out{animation:gta-fade-out .4s ease-in both;}
#gta-hud .gta-online{position:absolute;right:calc(var(--sar) + var(--m));top:calc(var(--sat) + 160px);font-size:12px;}
@keyframes gta-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.18);}}
@keyframes gta-blink{0%,100%{opacity:1;}50%{opacity:.35;}}
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
  #gta-hud .gta-online{top:calc(var(--sat) + 126px);}
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

// Centred crosshair: a dot with four ticks. A dark halo under a white line reads on light and dark ground.
const TICKS = 'M12 3.5V8.5M12 15.5V20.5M3.5 12H8.5M15.5 12H20.5';
const CROSS_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  `<path d="${TICKS}" fill="none" stroke="rgba(0,0,0,.65)" stroke-width="3.4" stroke-linecap="round"/>` +
  '<circle cx="12" cy="12" r="2.4" fill="rgba(0,0,0,.65)"/>' +
  `<path d="${TICKS}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>` +
  '<circle cx="12" cy="12" r="1.3" fill="#fff"/></svg>';

const DRY_DARK = [120, 40, 20];
const DRY_LIGHT = [214, 140, 80];
const MAP_RANGE = 150;            // the minimap shows this far from the player, each way
const MAP_VIEW = MAP_RANGE * 2;   // world units across the minimap
const MAP_BLANK = '#0b0d10';
const BIOME_SHOW_MS = 3000;
const HELP_DESKTOP =
  'WASD move · mouse look · click fire · R reload · Q swap gun · E enter/exit · Space jump / climb · ' +
  'Shift descend · bail out of a plane in the air with E';
const HELP_TOUCH = 'Stick to move · drag to look · Fire · Reload · Enter / Exit';
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

/** The static minimap picture of a world: 1 pixel per world unit, north (+z) up. */
function buildBackground(world: World): HTMLCanvasElement {
  const H = world.half;
  const W = 2 * H;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = W;
  const g = c.getContext('2d');
  if (!g) return c;
  const X = (x: number) => x + H;
  const Y = (z: number) => H - z;
  const poly = (pts: [number, number][], color: number) => {
    g.fillStyle = hexColor(color);
    g.beginPath();
    pts.forEach(([x, z], i) => (i === 0 ? g.moveTo(X(x), Y(z)) : g.lineTo(X(x), Y(z))));
    g.closePath();
    g.fill();
  };

  g.fillStyle = hexColor(BIOME_GROUND.city);
  g.fillRect(0, 0, W, W);
  // Biome wedges from the origin to the world corners, split along the diagonals (see biomeAt in config.ts).
  poly([[0, 0], [H, -H], [H, H]], BIOME_GROUND.desert);
  poly([[0, 0], [-H, -H], [-H, H]], BIOME_GROUND.forest);
  poly([[0, 0], [-H, -H], [H, -H]], BIOME_GROUND.tundra);
  poly([[0, 0], [-H, H], [H, H]], BIOME_GROUND.farmland);
  // Turfton on top.
  g.fillStyle = hexColor(BIOME_GROUND.city);
  g.fillRect(X(-CITY_HALF), Y(CITY_HALF), 2 * CITY_HALF, 2 * CITY_HALF);

  // Roads: every link once (from the lower id to the higher one).
  const byId = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) byId.set(n.id, n);
  g.strokeStyle = hexColor(COLORS.road);
  g.lineWidth = ROAD_WIDTH;
  g.lineCap = 'round';
  g.beginPath();
  for (const n of world.roads.nodes) {
    for (const id of n.links) {
      if (id <= n.id) continue;
      const m = byId.get(id);
      if (!m) continue;
      g.moveTo(X(n.x), Y(n.z));
      g.lineTo(X(m.x), Y(m.z));
    }
  }
  g.stroke();

  // Fort Sandpit: sand inside a walled outline.
  const b = world.base;
  g.fillStyle = hexColor(COLORS.sand);
  g.fillRect(X(b.minX), Y(b.maxZ), b.maxX - b.minX, b.maxZ - b.minZ);
  g.strokeStyle = hexColor(COLORS.baseWall);
  g.lineWidth = 1;
  g.strokeRect(X(b.minX), Y(b.maxZ), b.maxX - b.minX, b.maxZ - b.minZ);

  // Runway: forward = (sin yaw, cos yaw), width across it.
  const a = world.airfield;
  const fx = Math.sin(a.yaw);
  const fz = Math.cos(a.yaw);
  const sx = Math.cos(a.yaw);
  const sz = -Math.sin(a.yaw);
  const hl = a.length / 2;
  const hw = a.width / 2;
  poly(
    [
      [a.x + fx * hl + sx * hw, a.z + fz * hl + sz * hw],
      [a.x + fx * hl - sx * hw, a.z + fz * hl - sz * hw],
      [a.x - fx * hl - sx * hw, a.z - fz * hl - sz * hw],
      [a.x - fx * hl + sx * hw, a.z - fz * hl + sz * hw],
    ],
    COLORS.road,
  );
  return c;
}

export function createHud(ui: HTMLElement): Hud {
  const root = el('div');
  root.id = 'gta-hud';
  const style = el('style');
  style.textContent = CSS;
  root.append(style);

  // Top-left: Hat Watch, health, gun and ammo, flight readout, cracked count, first-visit help.
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
  const dry = bar('Clay');
  const gunRow = el('div', 'gta-gun');
  const gunIcon = el('span', 'gta-gunicon');
  const gunName = el('span');
  const ammoEl = el('span', 'gta-ammo', '0 / 0');
  const reloadEl = el('span', 'gta-reload', 'RELOADING');
  gunRow.append(gunIcon, gunName, ammoEl, reloadEl);
  const flightEl = el('div', 'gta-flight');
  const altEl = el('div');
  const spdEl = el('div');
  const chuteEl = el('div', 'gta-chute', 'PARACHUTE');
  flightEl.append(altEl, spdEl, chuteEl);
  flightEl.style.display = 'none';
  chuteEl.style.display = 'none';
  const crackedEl = el('div', 'gta-cracked', 'Cracked: 0');
  const questEl = el('div', 'gta-quest');
  tl.append(hatLabel, hatsRow, dry.row, gunRow, flightEl, crackedEl, questEl);
  const fine = matchMedia('(pointer: fine)').matches;
  const help = el('div', 'gta-help', fine ? HELP_DESKTOP : HELP_TOUCH);
  tl.append(help);
  setTimeout(() => help.remove(), 8000);

  // Top-right: minimap.
  const tr = el('div', 'gta-tr');
  const mapCanvas = el('canvas', 'gta-map');
  tr.append(mapCanvas);
  const mapCtx = mapCanvas.getContext('2d');

  const toasts = el('div', 'gta-toasts');
  const cross = el('div', 'gta-cross');
  cross.innerHTML = CROSS_SVG;
  const biomeEl = el('div', 'gta-biome');
  const bannerBox = el('div', 'gta-banner');

  // Bottom-centre: vehicle name and prompt.
  const bottom = el('div', 'gta-bottom');
  const vehicleEl = el('div', 'gta-pill');
  const promptEl = el('div', 'gta-pill');
  vehicleEl.style.display = 'none';
  promptEl.style.display = 'none';
  bottom.append(vehicleEl, promptEl);

  const online = el('div', 'gta-online');
  online.style.display = 'none';

  // Big map: click or tap the minimap, or press M, to see the whole world; click, tap, M or Esc closes it.
  const big = el('div', 'gta-big');
  const bigCanvas = el('canvas');
  const bigHint = el('div', 'gta-bighint', 'Click, tap, M or Esc to close');
  big.append(bigCanvas, bigHint);

  root.append(tl, tr, toasts, cross, biomeEl, bannerBox, bottom, online, big);
  ui.append(root);

  // ---- Minimap -------------------------------------------------------------------------------------------------
  let size = 0;
  let mapDpr = 1;
  let bgCanvas: HTMLCanvasElement | null = null;

  function sizeMap(px: number) {
    size = px;
    mapDpr = window.devicePixelRatio || 1;
    mapCanvas.style.width = `${px}px`;
    mapCanvas.style.height = `${px}px`;
    mapCanvas.width = Math.round(px * mapDpr);
    mapCanvas.height = Math.round(px * mapDpr);
  }

  function drawMap(s: HudState) {
    if (!mapCtx) return;
    const want = window.innerWidth < 420 ? 96 : 128;
    if (want !== size) sizeMap(want);
    const g = mapCtx;
    const dev = mapCanvas.width;
    const px0 = s.player.x;
    const pz0 = s.player.z;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, dev, dev);
    if (bgCanvas) {
      const H = bgCanvas.width / 2;
      const k = dev / MAP_VIEW; // device pixels per world unit
      // Window in background pixels (1 px per unit): left edge, top edge.
      const bx0 = px0 - MAP_RANGE + H;
      const by0 = H - pz0 - MAP_RANGE;
      g.fillStyle = MAP_BLANK;
      g.fillRect(0, 0, dev, dev);
      const cx0 = Math.max(bx0, 0);
      const cy0 = Math.max(by0, 0);
      const cx1 = Math.min(bx0 + MAP_VIEW, bgCanvas.width);
      const cy1 = Math.min(by0 + MAP_VIEW, bgCanvas.height);
      if (cx1 > cx0 && cy1 > cy0) {
        g.drawImage(
          bgCanvas, cx0, cy0, cx1 - cx0, cy1 - cy0,
          (cx0 - bx0) * k, (cy0 - by0) * k, (cx1 - cx0) * k, (cy1 - cy0) * k,
        );
      }
      // Blips in range, in CSS pixels.
      g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
      const ks = size / MAP_VIEW;
      for (const b of s.blips) {
        const dx = b.x - px0;
        const dz = b.z - pz0;
        if (Math.abs(dx) > MAP_RANGE || Math.abs(dz) > MAP_RANGE) continue;
        g.fillStyle = b.color;
        g.beginPath();
        g.arc(size / 2 + dx * ks, size / 2 - dz * ks, 1.5, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Player: white arrow at the centre along yaw. Forward in world (sin, cos) is (sin, -cos) on the map.
    g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
    const cx = size / 2;
    const cy = size / 2;
    const fx = Math.sin(s.player.yaw);
    const fy = -Math.cos(s.player.yaw);
    const perpX = -fy;
    const perpY = fx;
    g.beginPath();
    g.moveTo(cx + fx * 7, cy + fy * 7);
    g.lineTo(cx - fx * 3 + perpX * 4, cy - fy * 3 + perpY * 4);
    g.lineTo(cx - fx * 3 - perpX * 4, cy - fy * 3 - perpY * 4);
    g.closePath();
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.6)';
    g.lineWidth = 1;
    g.stroke();
  }

  sizeMap(window.innerWidth < 420 ? 96 : 128);

  // ---- Big map ---------------------------------------------------------------------------------------------------
  let bigOpen = false;
  let bigPx = 0;
  function setBig(open: boolean) {
    if (open === bigOpen) return;
    bigOpen = open;
    big.classList.toggle('open', open);
    if (open && document.pointerLockElement) document.exitPointerLock();
  }
  mapCanvas.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); setBig(true); });
  big.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); setBig(false); });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') setBig(!bigOpen);
    else if (e.code === 'Escape') setBig(false);
  });

  function drawBig(s: HudState) {
    if (!bgCanvas) return;
    const px = Math.max(160, Math.floor(Math.min(window.innerWidth - 24, window.innerHeight - 70)));
    const dpr = window.devicePixelRatio || 1;
    if (px !== bigPx) {
      bigPx = px;
      bigCanvas.style.width = `${px}px`;
      bigCanvas.style.height = `${px}px`;
      bigCanvas.width = Math.round(px * dpr);
      bigCanvas.height = Math.round(px * dpr);
    }
    const g = bigCanvas.getContext('2d');
    if (!g) return;
    const W = bgCanvas.width;
    const k = px / W; // CSS pixels per world unit
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(bgCanvas, 0, 0, px, px);
    const X = (x: number) => (x + W / 2) * k;
    const Y = (z: number) => (W / 2 - z) * k;
    for (const b of s.blips) {
      g.fillStyle = b.color;
      g.beginPath();
      g.arc(X(b.x), Y(b.z), 2, 0, Math.PI * 2);
      g.fill();
    }
    // Biome names, one per wedge.
    g.font = '700 12px system-ui,sans-serif';
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,.65)';
    const lab = (txt: string, x: number, z: number) => g.fillText(txt, X(x), Y(z));
    const q = W / 2;
    lab(BIOME_NAMES.city, 0, 0);
    lab(BIOME_NAMES.desert, q * 0.7, 0);
    lab(BIOME_NAMES.forest, -q * 0.7, 0);
    lab(BIOME_NAMES.tundra, 0, -q * 0.7);
    lab(BIOME_NAMES.farmland, 0, q * 0.7);
    // Player arrow.
    const cx = X(s.player.x);
    const cy = Y(s.player.z);
    const fx = Math.sin(s.player.yaw);
    const fy = -Math.cos(s.player.yaw);
    g.beginPath();
    g.moveTo(cx + fx * 9, cy + fy * 9);
    g.lineTo(cx - fx * 4 - fy * 5, cy - fy * 4 + fx * 5);
    g.lineTo(cx - fx * 4 + fy * 5, cy - fy * 4 - fx * 5);
    g.closePath();
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.7)';
    g.lineWidth = 1.5;
    g.stroke();
  }

  // ---- Gun icon ------------------------------------------------------------------------------------------------
  let gunShown: string | null = null;
  function setGun(name: string) {
    if (name === gunShown) return;
    gunShown = name;
    const kind = (Object.keys(GUNS) as GunKind[]).find((k) => GUNS[k].name === name);
    let node: HTMLElement | null = null;
    try {
      node = prefabIconElement(kind ? GUNS[kind].prefab : undefined, '🔫', 28);
    } catch {
      node = null;
    }
    if (!node) {
      node = el('span', undefined, '🔫');
    }
    gunIcon.replaceChildren(node);
    gunName.textContent = name;
  }

  // ---- Biome label ---------------------------------------------------------------------------------------------
  let biomeTimer = 0;
  function showBiome(name: string) {
    biomeEl.textContent = name;
    biomeEl.classList.add('show');
    clearTimeout(biomeTimer);
    biomeTimer = window.setTimeout(() => biomeEl.classList.remove('show'), BIOME_SHOW_MS);
  }

  // ---- Per-frame state (DOM written only on change) ----------------------------------------------------------------
  const last: {
    heat?: number; health?: number; ammo?: number; mag?: number; reloading?: boolean; gun?: string;
    vehicle?: string | null; cracked?: number; prompt?: string | null; online?: string | null;
    altitude?: number | null; speed?: number | null; chute?: boolean; biome?: string;
  } = {};

  return {
    setWorld(world: World) {
      bgCanvas = buildBackground(world);
    },
    set(s: HudState) {
      if (s.heat !== last.heat) {
        last.heat = s.heat;
        const lit = Math.floor(s.heat);
        hats.forEach((h, i) => h.classList.toggle('lit', i < lit));
        hatsRow.classList.toggle('hot', lit >= 1);
      }
      if (s.health !== last.health) {
        last.health = s.health;
        const v = clamp01(s.health);
        dry.fill.style.width = `${Math.round(v * 100)}%`;
        dry.fill.style.background = dryColor(v);
      }
      if (s.ammo !== last.ammo || s.mag !== last.mag) {
        last.ammo = s.ammo;
        last.mag = s.mag;
        ammoEl.textContent = `${s.ammo} / ${s.mag}`;
      }
      if (s.reloading !== last.reloading) {
        last.reloading = s.reloading;
        reloadEl.classList.toggle('on', s.reloading);
      }
      if (s.gun !== last.gun) {
        last.gun = s.gun;
        setGun(s.gun);
      }
      if (s.cracked !== last.cracked) {
        last.cracked = s.cracked;
        crackedEl.textContent = `Cracked: ${s.cracked}`;
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
      // Flight panel: only while altitude is known (flying or falling).
      const alt = s.altitude === null ? null : Math.round(s.altitude);
      if (alt !== last.altitude) {
        last.altitude = alt;
        flightEl.style.display = alt === null ? 'none' : '';
        altEl.textContent = alt === null ? '' : `ALT ${alt} m`;
      }
      const spd = s.speed === null ? null : Math.round(s.speed);
      if (spd !== last.speed) {
        last.speed = spd;
        spdEl.style.display = spd === null ? 'none' : '';
        spdEl.textContent = spd === null ? '' : `SPD ${spd}`;
      }
      if (s.chute !== last.chute) {
        last.chute = s.chute;
        chuteEl.style.display = s.chute ? '' : 'none';
      }
      if (s.biome !== last.biome) {
        last.biome = s.biome;
        showBiome(s.biome);
      }
      drawMap(s);
      if (bigOpen) drawBig(s);
    },

    toast(text: string, ms = 2600) {
      const t = el('div', 'gta-pill gta-toast', text);
      toasts.append(t);
      while (toasts.children.length > 4) toasts.firstElementChild?.remove();
      setTimeout(() => t.classList.add('out'), Math.max(0, ms - 400));
      setTimeout(() => t.remove(), ms);
    },

    setObjective(o: { title: string; lines: string[]; demo: boolean } | null) {
      questEl.replaceChildren();
      questEl.style.display = o ? 'block' : 'none';
      if (!o) return;
      const t = el('div');
      const b = el('b', undefined, o.title);
      t.append(b);
      if (o.demo) t.append(el('span', 'gta-demo', 'DEMO'));
      questEl.append(t);
      for (const line of o.lines) questEl.append(el('div', undefined, line));
    },

    setVisible(visible: boolean) {
      root.style.display = visible ? '' : 'none';
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
