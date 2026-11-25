// Old-school circular minimap in the top-right under the orbs: cached terrain chunks,
// houses, shrines, exits, NPCs, enemies, loot, remote players, compass, zoom, and click-to-walk.
import { TUNING, UI, WORLD } from '../config';
import { ZONES } from '../content';
import { getCameraYaw, setCameraYaw } from '../camera';
import { allEntities } from '../entities';
import { localCompanions } from '../companions';
import { remotePlayers } from '../net/mmo';
import { player, walkTo } from '../player';
import { checkCondition } from '../quests';
import { onSettingsChange, settings, updateSettings } from '../settings';
import { buildMinimapPixels, groundColourAt, heightAt } from '../terrain';
import { activeZones, currentZone, isTeleportExit } from '../zones';
import { EDGE, TOUCH, compact, onLayout } from './layout';

/** Pixels per 64m terrain chunk in the offscreen terrain cache (2m per pixel). */
const CHUNK_PX = 32;
/** Base world radius (metres) shown from center to edge at minimapZoom = 1. */
const BASE_RADIUS_M = 58;
const WATER_RGB = '#2d6a9f';

const chunkCache = new Map<number, HTMLCanvasElement>();
const chunkKey = (ci: number, cj: number): number => (ci + 32768) * 65536 + (cj + 32768);
let lastCompassTransform = '';
let lastZoneText = '';

let wrap: HTMLDivElement;
let circle: HTMLDivElement;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let compassBtn: HTMLButtonElement;
let zoneLabel: HTMLDivElement;
let sizePx = 164;
let compassRadius = 82;

function getTerrainChunk(ci: number, cj: number): HTMLCanvasElement {
  const key = chunkKey(ci, cj);
  const cached = chunkCache.get(key);
  if (cached) return cached;

  const c = document.createElement('canvas');
  c.width = CHUNK_PX;
  c.height = CHUNK_PX;
  const g = c.getContext('2d')!;
  const step = WORLD.chunk / CHUNK_PX;
  const x0 = ci * WORLD.chunk;
  const z0 = cj * WORLD.chunk;

  const wasmPixels = buildMinimapPixels(x0, z0, WORLD.chunk, CHUNK_PX, TUNING.waterLevel);
  if (wasmPixels) {
    const bytes = new Uint8ClampedArray(wasmPixels.buffer as ArrayBuffer, wasmPixels.byteOffset, wasmPixels.byteLength);
    g.putImageData(new ImageData(bytes, CHUNK_PX, CHUNK_PX), 0, 0);
    chunkCache.set(key, c);
    return c;
  }

  for (let py = 0; py < CHUNK_PX; py++) {
    const wz = z0 + (py + 0.5) * step;
    for (let px = 0; px < CHUNK_PX; px++) {
      const wx = x0 + (px + 0.5) * step;
      if (heightAt(wx, wz) < TUNING.waterLevel) {
        g.fillStyle = WATER_RGB;
      } else {
        const hex = groundColourAt(wx, wz);
        g.fillStyle = `#${hex.toString(16).padStart(6, '0')}`;
      }
      g.fillRect(px, py, 1, 1);
    }
  }
  chunkCache.set(key, c);
  return c;
}

function applyLayout(): void {
  const small = compact();
  sizePx = small ? 114 : 164;
  compassRadius = sizePx / 2 + 2;
  wrap.style.width = `${sizePx}px`;
  wrap.style.height = `${sizePx}px`;
  wrap.style.top = small ? '92px' : '94px';
  wrap.style.right = EDGE.right;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(sizePx * dpr);
  canvas.height = Math.round(sizePx * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function applyVisibility(): void {
  wrap.style.display = settings.showMinimap ? '' : 'none';
}

function makeRimBtn(text: string, title: string, css: Partial<CSSStyleDeclaration>): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = text;
  b.title = title;
  b.setAttribute('aria-label', title);
  const s = TOUCH ? '24px' : '20px';
  Object.assign(b.style, {
    position: 'absolute', width: s, height: s, padding: '0', borderRadius: '50%',
    background: UI.panelBgDark, color: UI.text, border: `1px solid ${UI.borderLight}`,
    fontFamily: UI.font, fontSize: '12px', fontWeight: 'bold', lineHeight: '1',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'auto', touchAction: 'manipulation', zIndex: '2',
    ...css,
  } satisfies Partial<CSSStyleDeclaration>);
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  wrap.appendChild(b);
  return b;
}

export function createMinimap(root: HTMLElement): void {
  wrap = document.createElement('div');
  wrap.id = 'minimap';
  Object.assign(wrap.style, {
    position: 'absolute', zIndex: '4', pointerEvents: 'none', userSelect: 'none',
  } satisfies Partial<CSSStyleDeclaration>);

  circle = document.createElement('div');
  Object.assign(circle.style, {
    position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
    background: '#1a150f', border: `2px solid ${UI.border}`,
    boxShadow: `0 0 0 1px ${UI.borderLight}, 0 2px 8px rgba(0,0,0,0.6)`,
    boxSizing: 'border-box', pointerEvents: 'auto', cursor: 'crosshair',
  } satisfies Partial<CSSStyleDeclaration>);

  canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    display: 'block', width: '100%', height: '100%',
  } satisfies Partial<CSSStyleDeclaration>);
  ctx = canvas.getContext('2d')!;
  circle.appendChild(canvas);
  wrap.appendChild(circle);

  // North compass badge on the rim; clicking snaps camera yaw to North.
  compassBtn = makeRimBtn('N', 'Face North (click to reset camera)', {
    left: '50%', top: '50%', color: UI.gold, fontSize: '11px',
  });
  compassBtn.onclick = (e) => {
    e.stopPropagation();
    setCameraYaw(0);
  };

  // Zoom + / - rim buttons at bottom-right / bottom-left.
  const zoomIn = makeRimBtn('+', 'Zoom minimap in', { right: '2px', bottom: '2px' });
  zoomIn.onclick = (e) => {
    e.stopPropagation();
    updateSettings({ minimapZoom: Number((settings.minimapZoom + 0.2).toFixed(2)) });
  };
  const zoomOut = makeRimBtn('−', 'Zoom minimap out', { left: '2px', bottom: '2px' });
  zoomOut.onclick = (e) => {
    e.stopPropagation();
    updateSettings({ minimapZoom: Number((settings.minimapZoom - 0.2).toFixed(2)) });
  };

  // Zone / indoor name pill tucked right beneath the circle.
  zoneLabel = document.createElement('div');
  Object.assign(zoneLabel.style, {
    position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)',
    marginTop: '3px', padding: '1px 6px', background: UI.panelBgDark,
    border: `1px solid ${UI.border}`, color: UI.textDim, fontFamily: UI.font,
    fontSize: '10px', whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  wrap.appendChild(zoneLabel);

  // Click on the minimap to walk there.
  circle.addEventListener('pointerdown', (e) => e.stopPropagation());
  circle.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = circle.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dxPx = e.clientX - cx;
    const dyPx = e.clientY - cy;
    const radiusM = BASE_RADIUS_M / settings.minimapZoom;
    const mPerPx = radiusM / (rect.width / 2);
    let rx = dxPx * mPerPx;
    let rz = dyPx * mPerPx;
    if (settings.minimapRotate) {
      const yaw = getCameraYaw();
      const c = Math.cos(-yaw);
      const s = Math.sin(-yaw);
      const wx = rx * c - rz * s;
      const wz = rx * s + rz * c;
      rx = wx;
      rz = wz;
    }
    const tx = player.position.x + rx;
    const tz = player.position.z + rz;
    walkTo(tx, tz, heightAt(tx, tz));
  });

  // Hotkey N toggles the minimap.
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.key.toLowerCase() === 'n') {
      updateSettings({ showMinimap: !settings.showMinimap });
    }
  });

  root.appendChild(wrap);
  onLayout(applyLayout);
  onSettingsChange(applyVisibility);
  applyVisibility();
}

export function updateMinimap(): void {
  if (!settings.showMinimap) return;

  const halfPx = sizePx / 2;
  const radiusM = BASE_RADIUS_M / settings.minimapZoom;
  const pxPerM = halfPx / radiusM;
  const px = player.position.x;
  const pz = player.position.z;
  const yaw = settings.minimapRotate ? getCameraYaw() : 0;

  // Position the North badge on the rim.
  const northAngle = -Math.PI / 2 + yaw;
  const nx = Math.cos(northAngle) * (compassRadius - 8);
  const ny = Math.sin(northAngle) * (compassRadius - 8);
  const nextTransform = `translate(calc(-50% + ${nx.toFixed(2)}px), calc(-50% + ${ny.toFixed(2)}px))`;
  if (nextTransform !== lastCompassTransform) {
    lastCompassTransform = nextTransform;
    compassBtn.style.transform = nextTransform;
  }

  const nextZone = currentZone().name;
  if (nextZone !== lastZoneText) {
    lastZoneText = nextZone;
    zoneLabel.textContent = nextZone;
  }

  ctx.save();
  ctx.clearRect(0, 0, sizePx, sizePx);
  ctx.fillStyle = '#15120d';
  ctx.fillRect(0, 0, sizePx, sizePx);

  // Transform to world space centered on the player, rotated by camera yaw if enabled.
  ctx.translate(halfPx, halfPx);
  if (yaw !== 0) ctx.rotate(yaw);
  ctx.scale(pxPerM, pxPerM);
  ctx.translate(-px, -pz);

  // 1. Cached terrain chunks covering the visible circle (use sqrt(2) margin for rotation).
  const margin = radiusM * 1.45;
  const minCi = Math.floor((px - margin) / WORLD.chunk);
  const maxCi = Math.floor((px + margin) / WORLD.chunk);
  const minCj = Math.floor((pz - margin) / WORLD.chunk);
  const maxCj = Math.floor((pz + margin) / WORLD.chunk);
  ctx.imageSmoothingEnabled = true;
  for (let cj = minCj; cj <= maxCj; cj++) {
    for (let ci = minCi; ci <= maxCi; ci++) {
      const chunk = getTerrainChunk(ci, cj);
      ctx.drawImage(chunk, ci * WORLD.chunk, cj * WORLD.chunk, WORLD.chunk, WORLD.chunk);
    }
  }

  // 2. Houses, walls, shrines and teleport exits in active zones.
  const dotScale = 1 / pxPerM;
  for (const zid of activeZones()) {
    const z = ZONES[zid];
    if (!z) continue;

    // Houses
    ctx.fillStyle = '#6b4a2e';
    ctx.strokeStyle = '#2b1d12';
    ctx.lineWidth = 1.2 * dotScale;
    for (const h of z.houses) {
      ctx.save();
      ctx.translate(h.x, h.z);
      ctx.rotate(-h.yaw);
      const s = h.r * 1.5;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }

    // Indoor walls (Deeps)
    if (z.walls) {
      ctx.strokeStyle = '#4a4a4a';
      ctx.lineWidth = 2.2 * dotScale;
      ctx.beginPath();
      for (const w of z.walls) {
        ctx.moveTo(w.x1, w.z1);
        ctx.lineTo(w.x2, w.z2);
      }
      ctx.stroke();
    }

    // Shrine / Well (cyan-gold diamond)
    const sh = z.shrine;
    const sr = 4.2 * dotScale;
    ctx.fillStyle = UI.quest;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2 * dotScale;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.z - sr);
    ctx.lineTo(sh.x + sr, sh.z);
    ctx.lineTo(sh.x, sh.z + sr);
    ctx.lineTo(sh.x - sr, sh.z);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Teleport exits / doors (amber squares)
    for (const ex of z.exits) {
      if (!isTeleportExit(z.id, ex.to)) continue;
      if (!checkCondition(ex.when)) continue;
      const es = 5 * dotScale;
      ctx.fillStyle = '#e89b3c';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1 * dotScale;
      ctx.fillRect(ex.x - es / 2, ex.z - es / 2, es, es);
      ctx.strokeRect(ex.x - es / 2, ex.z - es / 2, es, es);
    }
  }

  // 3. Walk destination marker
  if (player.path.length > 0) {
    const dest = player.path[player.path.length - 1];
    const xr = 3.2 * dotScale;
    ctx.strokeStyle = UI.good;
    ctx.lineWidth = 1.8 * dotScale;
    ctx.beginPath();
    ctx.moveTo(dest.x - xr, dest.z - xr);
    ctx.lineTo(dest.x + xr, dest.z + xr);
    ctx.moveTo(dest.x + xr, dest.z - xr);
    ctx.lineTo(dest.x - xr, dest.z + xr);
    ctx.stroke();
  }

  // 4. Entities (loot, enemies, NPCs)
  for (const e of allEntities()) {
    if (e.dead) continue;
    const dx = e.position.x - px;
    const dz = e.position.z - pz;
    if (dx * dx + dz * dz > radiusM * radiusM * 1.2) continue;

    let color: string = UI.gold;
    let r = 2.6 * dotScale;
    if (e.kind === 'enemy') {
      color = UI.bad;
      r = 2.4 * dotScale;
    } else if (e.kind === 'loot') {
      color = '#d870ff';
      r = 2.2 * dotScale;
    }
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 * dotScale;
    ctx.beginPath();
    ctx.arc(e.position.x, e.position.z, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. Remote players & independent companions (cyan / player-colored dots)
  for (const c of localCompanions()) {
    if (c.dead) continue;
    if (Math.hypot(c.position.x - px, c.position.z - pz) > radiusM) continue;
    ctx.fillStyle = c.plateColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 * dotScale;
    ctx.beginPath();
    ctx.arc(c.position.x, c.position.z, 2.8 * dotScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  for (const rp of remotePlayers()) {
    if (!rp.model) continue;
    ctx.fillStyle = '#44d9ff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 * dotScale;
    ctx.beginPath();
    ctx.arc(rp.position.x, rp.position.z, 3 * dotScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 6. Local player arrow at (px, pz), pointing in player.facing.
  ctx.save();
  ctx.translate(px, pz);
  ctx.rotate(-player.facing);
  const tip = 5.5 * dotScale;
  const wing = 3.6 * dotScale;
  ctx.fillStyle = UI.textWhite;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.4 * dotScale;
  ctx.beginPath();
  ctx.moveTo(0, tip);
  ctx.lineTo(-wing, -tip * 0.65);
  ctx.lineTo(0, -tip * 0.25);
  ctx.lineTo(wing, -tip * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}
