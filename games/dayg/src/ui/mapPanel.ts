// The world map: every region of the Mossgrave footprint, drawn to scale. The player's own dot shows only while they
// carry a gnomeps (the GPS): without one there is no fix, so the map is a plain chart of what they know exists.
import { DOM } from '../config';
import type { RegionDef, DistrictId } from '../sim/types';

const CSS = `
#${DOM.map}{position:fixed;inset:0;z-index:52;display:none;flex-direction:column;background:#10140e;color:#eee;
  font:14px system-ui,sans-serif;user-select:none;-webkit-user-select:none;box-sizing:border-box;
  padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
#${DOM.map}.mp-open{display:flex}
#${DOM.map} .mp-top{display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid #2f3a28;min-height:56px;box-sizing:border-box}
#${DOM.map} .mp-title{font-weight:700;font-size:18px;flex:1;min-width:0}
#${DOM.map} .mp-note{font-size:12px;opacity:.8}
#${DOM.map} .mp-close{width:48px;height:48px;border:none;border-radius:8px;background:#2d3a25;color:#eee;font:22px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;flex:none}
#${DOM.map} .mp-stage{flex:1;min-height:0;position:relative;padding:8px;box-sizing:border-box}
#${DOM.map} svg{width:100%;height:100%;display:block;touch-action:none}`;

// One hue per district, so the map reads as groups of regions.
const DISTRICT_HUE: Partial<Record<DistrictId, number>> = {};

function hueFor(district: DistrictId): number {
  let h = DISTRICT_HUE[district];
  if (h === undefined) {
    h = (Object.keys(DISTRICT_HUE).length * 67) % 360;
    DISTRICT_HUE[district] = h;
  }
  return h;
}

const NS = 'http://www.w3.org/2000/svg';
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

export interface MapPanel {
  root: HTMLElement;
  toggle(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
  /** Called every frame; moves the player's dot while the map is open. */
  tick(): void;
}

export function createMapPanel(ui: HTMLElement, deps: {
  regions: readonly RegionDef[];
  hasFix: () => boolean;
  playerPos: () => { x: number; z: number };
}): MapPanel {
  const { regions, hasFix, playerPos } = deps;

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

  const top = document.createElement('div');
  top.className = 'mp-top';
  const title = document.createElement('div');
  title.className = 'mp-title';
  title.textContent = 'Map';
  const note = document.createElement('div');
  note.className = 'mp-note';
  const close = document.createElement('button');
  close.className = 'mp-close';
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Close map');
  top.append(title, note, close);

  // Footprint of every region, so the viewBox always fits the whole map.
  const x0 = Math.min(...regions.map((r) => r.rect.x0));
  const x1 = Math.max(...regions.map((r) => r.rect.x1));
  const z0 = Math.min(...regions.map((r) => r.rect.z0));
  const z1 = Math.max(...regions.map((r) => r.rect.z1));
  const pad = 12;

  const svg = svgEl('svg', { viewBox: `${x0 - pad} ${z0 - pad} ${x1 - x0 + pad * 2} ${z1 - z0 + pad * 2}`, preserveAspectRatio: 'xMidYMid meet' });
  for (const r of regions) {
    const { x0: rx0, x1: rx1, z0: rz0, z1: rz1 } = r.rect;
    const hue = hueFor(r.district);
    svg.append(svgEl('rect', {
      x: rx0, y: rz0, width: rx1 - rx0, height: rz1 - rz0,
      fill: `hsl(${hue} 28% 22%)`, stroke: `hsl(${hue} 30% 45%)`, 'stroke-width': 0.8, 'vector-effect': 'non-scaling-stroke',
    }));
    const label = svgEl('text', {
      x: (rx0 + rx1) / 2, y: (rz0 + rz1) / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: '#eee', 'font-size': Math.max(6, Math.min(16, Math.min(rx1 - rx0, rz1 - rz0) / 4)), 'font-family': 'system-ui, sans-serif',
    });
    label.textContent = r.name;
    svg.append(label);
  }

  // The player's dot: a ring with a pip, shown only with a fix.
  const dot = svgEl('g', { display: 'none' });
  dot.append(svgEl('circle', { r: 7, fill: 'none', stroke: '#ffd54f', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }));
  dot.append(svgEl('circle', { r: 2.5, fill: '#ffd54f' }));
  svg.append(dot);

  const stage = document.createElement('div');
  stage.className = 'mp-stage';
  stage.append(svg);
  root.append(top, stage);
  ui.appendChild(root);

  let open = false;
  function setOpen(on: boolean): void {
    open = on;
    root.classList.toggle('mp-open', on);
    if (on) {
      if (document.pointerLockElement) document.exitPointerLock();
      tick();
    }
  }

  function tick(): void {
    if (!open) return;
    const fix = hasFix();
    note.textContent = fix ? '' : 'No fix. Find a gnomeps to see where you are.';
    dot.setAttribute('display', fix ? 'inline' : 'none');
    if (fix) {
      const p = playerPos();
      dot.setAttribute('transform', `translate(${p.x} ${p.z})`);
    }
  }

  close.addEventListener('click', (e) => { e.stopPropagation(); setOpen(false); });
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
