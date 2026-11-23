import { ARCHIPELAGO_NODES } from '../data/archipelago';
import type { ProgressState } from '../game/events';
import { LEVEL_ORDER, type GsrLevelId } from '../levels/loader';

export function createArchipelagoMap(
  container: HTMLElement,
  handlers: { onTravel: (levelId: GsrLevelId) => void },
): { open: (currentId: GsrLevelId, progress: ProgressState) => void; close: () => void } {
  const modal = document.createElement('div');
  modal.id = 'gsr-archipelago-map';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:48; display:none; align-items:center; justify-content:center;
    background:rgba(10,4,22,0.9); padding:14px; pointer-events:auto; font-family:system-ui,sans-serif;
  `;
  const inner = document.createElement('div');
  inner.style.cssText = `
    width:min(820px, 96vw); max-height:90vh; overflow-y:auto; background:#180b2e;
    border:3px solid #00e5ff; border-radius:16px; padding:18px; color:#fff;
    display:flex; flex-direction:column; gap:12px; box-shadow:0 20px 60px rgba(0,0,0,0.85);
  `;
  modal.appendChild(inner);
  container.appendChild(modal);

  function close(): void {
    modal.style.display = 'none';
  }

  function open(currentId: GsrLevelId, progress: ProgressState): void {
    const drawnEdges = new Set<string>();
    const edgeLines: string[] = [];
    for (const id of LEVEL_ORDER) {
      const a = ARCHIPELAGO_NODES[id];
      for (const link of a.links) {
        const key = [a.id, link.targetId].sort().join('--');
        if (drawnEdges.has(key)) continue;
        drawnEdges.add(key);
        const b = ARCHIPELAGO_NODES[link.targetId];
        const isExpress = link.transitType === 'pink-gondola' || link.transitType === 'subsoil-lift' && Math.abs(a.areaNumber - b.areaNumber) > 1;
        edgeLines.push(
          `<line x1="${a.mapX}%" y1="${a.mapY}%" x2="${b.mapX}%" y2="${b.mapY}%" stroke="${link.color}" stroke-width="${isExpress ? 3 : 4}" ${isExpress ? 'stroke-dasharray="7 5"' : ''} stroke-opacity="0.85" />`,
        );
      }
    }

    const svgNodes = LEVEL_ORDER.map((id) => {
      const n = ARCHIPELAGO_NODES[id];
      const here = id === currentId;
      return `
        <g style="cursor:pointer;" class="gsr-map-node" data-level="${id}">
          <circle cx="${n.mapX}%" cy="${n.mapY}%" r="${here ? 15 : 11}" fill="#140824" stroke="${n.color}" stroke-width="${here ? 4 : 3}" />
          <text x="${n.mapX}%" y="${n.mapY}%" dy="4" text-anchor="middle" fill="#fff" font-size="11" font-weight="900">${n.areaNumber}</text>
        </g>
      `;
    }).join('');

    const cards = [...LEVEL_ORDER].reverse().map((id) => {
      const n = ARCHIPELAGO_NODES[id];
      const here = id === currentId;
      const done = progress.completedAreas.includes(id);
      const linksText = n.links.map((l) => `${l.direction.toUpperCase()}: ${ARCHIPELAGO_NODES[l.targetId].name}`).join(' · ');
      return `
        <div style="background:${here ? '#2b124d' : '#130824'}; border:2px solid ${n.color}; border-radius:10px; padding:10px; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
          <div style="min-width:190px; flex:1;">
            <div style="font-size:11px; font-weight:900; color:${n.color};">AREA ${n.areaNumber} · ${n.frequency} · ${n.elevationM}m ALT ${done ? '✅' : ''} ${here ? '📍 HERE' : ''}</div>
            <div style="font-size:14px; font-weight:900;">${n.name}</div>
            <div style="font-size:11px; color:#c8b6e8; margin-top:2px;">Connected: ${linksText}</div>
          </div>
          <button class="gsr-map-go" data-level="${id}" style="min-height:44px; min-width:96px; padding:6px 14px; border-radius:8px; border:none; background:${n.color}; color:#140824; font-weight:900; cursor:pointer;">${here ? '↻ Restart' : '▶ Travel'}</button>
        </div>
      `;
    }).join('');

    inner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div>
          <div style="font-size:11px; font-weight:900; color:#ffd740; letter-spacing:1px;">FREQUENCY LADDER & SKY TRANSIT</div>
          <h2 style="margin:0; font-size:20px; color:#00e5ff;">🗺️ BROADCAST ARCHIPELAGO MAP <span style="font-size:12px; color:#ffd740; margin-left:8px;">💿 ${progress.collectedVinyls.length}/27</span></h2>
        </div>
        <button id="gsr-map-close" style="min-height:44px; padding:6px 14px; border-radius:8px; border:1px solid #ff4ecd; background:#2b124d; color:#fff; font-weight:800; cursor:pointer;">✕ Close</button>
      </div>
      <div style="font-size:12px; color:#dfd3f7;">
        All 9 islands float along the Frequency Ladder (120m → 650m). Ride the glowing <b>Transit Gates</b> on each island's perimeter—or travel directly below! Solid lines = main Ladder rails; dashed = Express Gondola & 108.0 Subsoil Lift.
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; align-items:start;">
        <div style="background:#0f061c; border:2px solid #3a2360; border-radius:12px; padding:10px;">
          <svg viewBox="0 0 300 420" style="width:100%; height:360px; display:block;">
            ${edgeLines.join('')}
            ${svgNodes}
          </svg>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${cards}
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    inner.querySelector('#gsr-map-close')?.addEventListener('click', close);
    inner.querySelectorAll<HTMLElement>('.gsr-map-go, .gsr-map-node').forEach((el) => {
      el.addEventListener('click', () => {
        const lvl = el.dataset.level as GsrLevelId | undefined;
        if (!lvl) return;
        close();
        handlers.onTravel(lvl);
      });
    });
  }

  return { open, close };
}
