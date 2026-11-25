// Real top-down world-render map: orthographic 3D scene snapshot + vector blocks/paths/water/havens, markers, zoom/pan, and player arrow.
import * as THREE from 'three';
import { DOM } from '../config';
import type { BlockoutMap } from '../world/types';
import type { RegionDef } from '../sim/types';

const CSS = `
#${DOM.map}{position:fixed;inset:0;z-index:52;display:none;flex-direction:column;background:var(--dg-bg);color:var(--dg-text);pointer-events:auto;
  font:14px var(--dg-font);user-select:none;-webkit-user-select:none;box-sizing:border-box;backdrop-filter:blur(6px);
  padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
#${DOM.map}.mp-open{display:flex}
#${DOM.map} .mp-top{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--dg-border);background:var(--dg-surface);min-height:58px;box-sizing:border-box;flex-wrap:wrap}
#${DOM.map} .mp-title{font-weight:700;font-size:18px;flex:1;min-width:120px;color:var(--dg-accent)}
#${DOM.map} .mp-note{font-size:12px;color:var(--dg-muted)}
#${DOM.map} .mp-btn{min-width:44px;min-height:44px;padding:0 12px;border:1px solid var(--dg-border);border-radius:var(--dg-radius);background:var(--dg-surface-2);color:var(--dg-text);font:16px var(--dg-font);cursor:pointer;touch-action:manipulation;flex:none}
#${DOM.map} .mp-btn:hover{background:var(--dg-surface-hover);border-color:var(--dg-border-strong)}
#${DOM.map} .mp-stage{flex:1;min-height:0;position:relative;padding:8px;box-sizing:border-box;overflow:hidden}
#${DOM.map} canvas{width:100%;height:100%;display:block;border-radius:var(--dg-radius);border:1px solid var(--dg-border);background:#121811;touch-action:none}`;

export interface MapMarker {
  x: number;
  z: number;
  label: string;
  color: string;
}

export interface MapPanel {
  root: HTMLElement;
  toggle(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
  tick(): void;
}

export function createMapPanel(ui: HTMLElement, deps: {
  regions: readonly RegionDef[];
  hasFix: () => boolean;
  playerPos: () => { x: number; z: number };
  playerFacing?: () => number;
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  map?: BlockoutMap;
  getMarkers?: () => MapMarker[];
}): MapPanel {
  const { regions, hasFix, playerPos, playerFacing, scene, renderer, map, getMarkers } = deps;

  if (!document.getElementById('dayg-map-style')) {
    const style = document.createElement('style');
    style.id = 'dayg-map-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = DOM.map;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'World map');
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  const top = document.createElement('div');
  top.className = 'mp-top';
  const title = document.createElement('div');
  title.className = 'mp-title';
  title.textContent = 'Mossgrave World Map';
  const note = document.createElement('div');
  note.className = 'mp-note';

  let zoom = 1;
  let panX = 0;
  let panZ = 0;

  const mkBtn = (txt: string, aria: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.className = 'mp-btn';
    b.type = 'button';
    b.textContent = txt;
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  };
  const zoomIn = mkBtn('+', 'Zoom in', () => { zoom = Math.min(4, zoom * 1.35); renderCanvas(); });
  const zoomOut = mkBtn('−', 'Zoom out', () => { zoom = Math.max(0.75, zoom / 1.35); renderCanvas(); });
  const resetBtn = mkBtn('Reset', 'Reset view', () => { zoom = 1; panX = 0; panZ = 0; renderCanvas(); });
  const closeBtn = mkBtn('✕', 'Close map', () => setOpen(false));
  top.append(title, note, zoomIn, zoomOut, resetBtn, closeBtn);

  const stage = document.createElement('div');
  stage.className = 'mp-stage';
  const canvas = document.createElement('canvas');
  stage.append(canvas);
  root.append(top, stage);
  ui.appendChild(root);

  const x0 = Math.min(...regions.map((r) => r.rect.x0));
  const x1 = Math.max(...regions.map((r) => r.rect.x1));
  const z0 = Math.min(...regions.map((r) => r.rect.z0));
  const z1 = Math.max(...regions.map((r) => r.rect.z1));
  const worldW = Math.max(1, x1 - x0);
  const worldD = Math.max(1, z1 - z0);
  const midX = (x0 + x1) / 2;
  const midZ = (z0 + z1) / 2;

  // Offscreen top-down 3D world snapshot rendered once per open (when scene + renderer are available)
  let snapshotCanvas: HTMLCanvasElement | null = null;
  function captureTopDownRender(): void {
    if (!scene || !renderer) return;
    try {
      const res = 768;
      const rt = new THREE.WebGLRenderTarget(res, res);
      const half = Math.max(worldW, worldD) / 2 + 12;
      const cam = new THREE.OrthographicCamera(-half, half, half, -half, 1, 220);
      cam.position.set(midX, 140, midZ);
      cam.up.set(0, 0, -1);
      cam.lookAt(midX, 0, midZ);
      cam.updateProjectionMatrix();

      const oldTarget = renderer.getRenderTarget();
      const oldFog = scene.fog;
      scene.fog = null;
      renderer.setRenderTarget(rt);
      renderer.render(scene, cam);
      const px = new Uint8Array(res * res * 4);
      renderer.readRenderTargetPixels(rt, 0, 0, res, res, px);
      renderer.setRenderTarget(oldTarget);
      scene.fog = oldFog;
      rt.dispose();

      const c = document.createElement('canvas');
      c.width = res; c.height = res;
      const g = c.getContext('2d');
      if (g) {
        const img = g.createImageData(res, res);
        // Flip Y from WebGL bottom-up pixels
        for (let y = 0; y < res; y++) {
          const srcRow = (res - 1 - y) * res * 4;
          const dstRow = y * res * 4;
          img.data.set(px.subarray(srcRow, srcRow + res * 4), dstRow);
        }
        g.putImageData(img, 0, 0);
        snapshotCanvas = c;
      }
    } catch {
      snapshotCanvas = null;
    }
  }

  let dragging = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging || !open) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const scale = Math.min(canvas.width, canvas.height) / (Math.max(worldW, worldD) * zoom);
    if (scale > 0) {
      panX -= dx / scale;
      panZ -= dy / scale;
      renderCanvas();
    }
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  function renderCanvas(): void {
    const w = Math.max(300, stage.clientWidth - 16);
    const h = Math.max(240, stage.clientHeight - 16);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const g = canvas.getContext('2d');
    if (!g) return;

    g.fillStyle = '#121811';
    g.fillRect(0, 0, w, h);

    const baseScale = Math.min((w - 24) / worldW, (h - 24) / worldD) * zoom;
    const toX = (wx: number): number => w / 2 + (wx - (midX + panX)) * baseScale;
    const toZ = (wz: number): number => h / 2 + (wz - (midZ + panZ)) * baseScale;

    // 1. Top-down 3D render backdrop if available
    if (snapshotCanvas) {
      const half = Math.max(worldW, worldD) / 2 + 12;
      const sx = toX(midX - half), sz = toZ(midZ - half);
      const sw = half * 2 * baseScale;
      g.globalAlpha = 0.88;
      g.drawImage(snapshotCanvas, sx, sz, sw, sw);
      g.globalAlpha = 1;
    }

    // 2. Crisp world geometry overlay (regions, pits, paths, blocks, havens)
    for (const r of regions) {
      const rx = toX(r.rect.x0), rz = toZ(r.rect.z0);
      const rw = (r.rect.x1 - r.rect.x0) * baseScale;
      const rh = (r.rect.z1 - r.rect.z0) * baseScale;
      if (!snapshotCanvas) {
        g.fillStyle = r.traits.includes('FLOODS') ? '#24342d' : r.traits.includes('MOSSY') ? '#243120' : '#2b3623';
        g.fillRect(rx, rz, rw, rh);
      }
      g.strokeStyle = 'rgba(180,200,160,0.28)';
      g.lineWidth = 1;
      g.strokeRect(rx, rz, rw, rh);
    }

    if (map) {
      for (const pit of map.pits) {
        g.fillStyle = 'rgba(42,35,24,0.85)';
        g.fillRect(toX(pit.rect.x0), toZ(pit.rect.z0), (pit.rect.x1 - pit.rect.x0) * baseScale, (pit.rect.z1 - pit.rect.z0) * baseScale);
      }
      for (const p of map.paths) {
        if (p.points.length < 2) continue;
        g.strokeStyle = p.kind === 'gravel' ? 'rgba(185,178,162,0.75)' : 'rgba(120,145,95,0.65)';
        g.lineWidth = Math.max(2, p.width * baseScale);
        g.beginPath();
        p.points.forEach(([px, pz], i) => {
          if (i === 0) g.moveTo(toX(px), toZ(pz));
          else g.lineTo(toX(px), toZ(pz));
        });
        g.stroke();
      }
      for (const b of map.blocks) {
        const bx = toX(b.x0), bz = toZ(b.z0);
        const bw = Math.max(1.5, (b.x1 - b.x0) * baseScale);
        const bh = Math.max(1.5, (b.z1 - b.z0) * baseScale);
        g.fillStyle = b.kind === 'hedge' ? '#253d22' : b.kind === 'gatehouse' || b.kind === 'roof' ? '#7a5636' : '#8a867d';
        g.fillRect(bx, bz, bw, bh);
      }
      for (const hv of map.havens) {
        g.strokeStyle = '#e8c35a';
        g.lineWidth = 2;
        g.strokeRect(toX(hv.rect.x0), toZ(hv.rect.z0), (hv.rect.x1 - hv.rect.x0) * baseScale, (hv.rect.z1 - hv.rect.z0) * baseScale);
      }
    }

    // 3. Region labels
    g.font = `600 ${Math.max(10, Math.min(14, Math.round(11 * zoom)))}px system-ui,sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const r of regions) {
      const lx = toX((r.rect.x0 + r.rect.x1) / 2);
      const lz = toZ((r.rect.z0 + r.rect.z1) / 2);
      g.strokeStyle = 'rgba(0,0,0,0.85)';
      g.lineWidth = 3;
      g.strokeText(r.name, lx, lz);
      g.fillStyle = '#eef2e8';
      g.fillText(r.name, lx, lz);
    }

    // 4. Custom markers (Camp, Vehicles)
    if (getMarkers) {
      for (const mk of getMarkers()) {
        const mx = toX(mk.x), mz = toZ(mk.z);
        g.fillStyle = mk.color;
        g.beginPath();
        g.arc(mx, mz, 5, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#111';
        g.lineWidth = 1.5;
        g.stroke();
        g.font = '600 11px system-ui,sans-serif';
        g.fillStyle = mk.color;
        g.fillText(mk.label, mx, mz - 10);
      }
    }

    // 5. Player heading arrow (when GPS/fix is available)
    if (hasFix()) {
      const p = playerPos();
      const px = toX(p.x), pz = toZ(p.z);
      const yaw = playerFacing ? playerFacing() : 0;
      g.save();
      g.translate(px, pz);
      g.rotate(-yaw);
      g.fillStyle = '#ffd54f';
      g.strokeStyle = '#111';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, 10);
      g.lineTo(7, -7);
      g.lineTo(0, -3);
      g.lineTo(-7, -7);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }
  }

  let open = false;
  function setOpen(on: boolean): void {
    open = on;
    root.classList.toggle('mp-open', on);
    if (on) {
      if (document.pointerLockElement) document.exitPointerLock();
      captureTopDownRender();
      tick();
    }
  }

  function tick(): void {
    if (!open) return;
    note.textContent = hasFix() ? 'Drag to pan · +/- to zoom' : 'No GPS fix (find a gnomeps to show your arrow)';
    renderCanvas();
  }

  window.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  });

  return {
    root,
    toggle() { setOpen(!open); },
    open() { setOpen(true); },
    close() { setOpen(false); },
    isOpen: () => open,
    tick,
  };
}
