import { GSR_TRACKS } from '@lawn/music';
import type { ProgressState } from '../game/events';
import type { GsrLevelId } from '../levels/loader';

export function mountTitleOverlay(
  container: HTMLElement,
  progress: ProgressState,
  handlers: {
    onPlay: (levelId: GsrLevelId) => void;
    onOpenMusic: () => void;
  },
): { show: (p: ProgressState) => void; hide: () => void } {
  const root = document.createElement('div');
  root.id = 'gsr-title';
  root.style.cssText = `
    position:fixed; inset:0; z-index:30; display:flex; align-items:center; justify-content:center;
    background:radial-gradient(circle at 50% 25%, rgba(92,22,135,0.88), rgba(14,5,28,0.94));
    pointer-events:auto; padding:16px; overflow-y:auto;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    width:min(860px, 96vw); background:#180b2e; border:3px solid #ff4ecd; border-radius:16px;
    padding:20px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.7);
    display:flex; flex-direction:column; gap:14px;
  `;
  root.appendChild(card);

  const codexModal = document.createElement('div');
  codexModal.style.cssText = `
    position:fixed; inset:0; z-index:45; display:none; align-items:center; justify-content:center;
    background:rgba(10,4,22,0.86); padding:14px; pointer-events:auto;
  `;
  const codexInner = document.createElement('div');
  codexInner.style.cssText = `
    width:min(740px, 95vw); max-height:86vh; overflow-y:auto; background:#1c0e36;
    border:2px solid #ffd740; border-radius:14px; padding:16px; color:#f5f0ff;
    display:flex; flex-direction:column; gap:10px;
  `;
  codexModal.appendChild(codexInner);
  root.appendChild(codexModal);

  function openCodex(): void {
    codexInner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:18px; color:#ffd740;">📖 BROADCAST ARCHIPELAGO — FREQUENCY LADDER & LORE</strong>
        <button id="gsr-codex-close" style="min-height:44px; padding:6px 14px; border-radius:8px; border:1px solid #ff4ecd; background:#2b124d; color:#fff; font-weight:700; cursor:pointer;">✕ Close</button>
      </div>
      <p style="font-size:13px; color:#e0d4f7; margin:0;">
        The Broadcast Archipelago is a vertical <b>Resonant Harmonic Ladder</b> climbing above Aether Board's islands.
        Each gang holds a Harmonic Relay Lock on a higher carrier band: <b>1. Velvet Keys</b> (Base Melody) → <b>2. Bongo Basin</b> (Master Clock) →
        <b>3. Chrome Kiln</b> (Thermal Wattage) → <b>4. Neon Birdbath</b> (Pirate Beacon) → <b>5–7</b> (Upper Dome) → <b>8. Subsoil Relay Tower</b> (108.0 Convergence).
        Retuning Area 8 reveals the tower isn't broadcasting upward—it's holding back <b>Area 9: Zero-Hz Zenith</b>, an anti-sound cosmos where only all 8 styles together can break the silence!
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:8px;">
        ${GSR_TRACKS.filter((t) => t.areaNumber >= 1 && !t.secret)
          .map(
            (t) => `
          <div style="background:#130824; border:1px solid ${t.color}; border-radius:10px; padding:10px;">
            <div style="font-size:11px; font-weight:800; color:${t.color};">AREA ${t.areaNumber}</div>
            <div style="font-size:14px; font-weight:800;">${t.areaName}</div>
            <div style="font-size:12px; color:#ffd740;">Gang: ${t.gangName}</div>
            <div style="font-size:11px; color:#c8b6e8; margin-top:4px;">${t.style} (${t.bpm} BPM)</div>
          </div>`,
          )
          .join('')}
        <div style="background:#130824; border:1px dashed #ffd740; border-radius:10px; padding:10px;">
          <div style="font-size:11px; font-weight:800; color:#ffd740;">AREA 09 · SECRET ENCORE</div>
          <div style="font-size:14px; font-weight:800; color:#fff;">Zero-Hz Zenith</div>
          <div style="font-size:11px; color:#c8b6e8; margin-top:4px;">The Original Needle & Unfired Choir. Revealed upon harmonizing Area 8.</div>
        </div>
      </div>
    `;
    codexModal.style.display = 'flex';
    codexInner.querySelector('#gsr-codex-close')?.addEventListener('click', () => (codexModal.style.display = 'none'));
  }

  function render(p: ProgressState): void {
    const done1 = p.completedAreas.includes('velvet-keys');
    const done2 = p.completedAreas.includes('bongo-basin');
    const done3 = p.completedAreas.includes('chrome-kiln');
    const done4 = p.completedAreas.includes('neon-birdbath');
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-size:12px; font-weight:800; color:#00e5ff; letter-spacing:1px;">AETHER REALM × TURFTON PIRATE RADIO</div>
          <h1 style="margin:2px 0; font-size:32px; font-weight:900; color:#ffd740; text-shadow:3px 3px 0 #ff4ecd;">GNOM SET RADIO</h1>
          <div style="font-size:13px; color:#dfd3f7;">Carve, air-jump, grind ley-lines, and spray-tag the Broadcast Archipelago.</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="gsr-btn-music" style="min-height:44px; padding:8px 14px; border-radius:10px; border:2px solid #00e5ff; background:#142847; color:#fff; font-weight:800; cursor:pointer;">🎵 Music Explorer</button>
          <button id="gsr-btn-lore" style="min-height:44px; padding:8px 14px; border-radius:10px; border:2px solid #ffd740; background:#2b1a40; color:#ffd740; font-weight:800; cursor:pointer;">📖 Lore & Ladder</button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px;">
        <div style="background:#241145; border:2px solid #ff4ecd; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:800; color:#ff4ecd;">AREA 1 · JUNGLE-JAZZ FUSION ${done1 ? '✅' : ''}</div>
          <div style="font-size:16px; font-weight:900;">Velvet Keys Plaza</div>
          <div style="font-size:12px; color:#d8c9f2;">Ivory Syndicate: Maestro Upright & Pluck. Helper: Pippi Pitchpipe.</div>
          <button id="gsr-play-1" style="margin-top:auto; min-height:44px; border-radius:8px; border:none; background:#ff4ecd; color:#140824; font-weight:900; font-size:14px; cursor:pointer;">▶ SKATE AREA 1</button>
        </div>

        <div style="background:#241145; border:2px solid #ff9100; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:800; color:#ff9100;">AREA 2 · BONGO RIP MIX ${done2 ? '✅' : ''}</div>
          <div style="font-size:16px; font-weight:900;">Bongo Basin Overpass</div>
          <div style="font-size:12px; color:#d8c9f2;">Rip-Skin Collective: Conga King Kora. Helper: Bam-Bam Bramble.</div>
          <button id="gsr-play-2" style="margin-top:auto; min-height:44px; border-radius:8px; border:none; background:#ff9100; color:#140824; font-weight:900; font-size:14px; cursor:pointer;">▶ SKATE AREA 2</button>
        </div>

        <div style="background:#241145; border:2px solid #76ff03; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:800; color:#76ff03;">AREA 3 · ACID-FUNK BREAKBEAT ${done3 ? '✅' : ''}</div>
          <div style="font-size:16px; font-weight:900;">Chrome Kiln Foundry</div>
          <div style="font-size:12px; color:#d8c9f2;">Glaze Grinders: Furnace Vera. Updraft vents & 13m Crucible Crown.</div>
          <button id="gsr-play-3" style="margin-top:auto; min-height:44px; border-radius:8px; border:none; background:#76ff03; color:#140824; font-weight:900; font-size:14px; cursor:pointer;">▶ SKATE AREA 3</button>
        </div>

        <div style="background:#241145; border:2px solid #00e5ff; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:800; color:#00e5ff;">AREA 4 · LIQUID JAZZ-DNB ${done4 ? '✅' : ''}</div>
          <div style="font-size:16px; font-weight:900;">Neon Birdbath Spire</div>
          <div style="font-size:12px; color:#d8c9f2;">Splash-Back Skaters: Fountainhead Finn. 16.5m Spiral Beacon.</div>
          <button id="gsr-play-4" style="margin-top:auto; min-height:44px; border-radius:8px; border:none; background:#00e5ff; color:#140824; font-weight:900; font-size:14px; cursor:pointer;">▶ SKATE AREA 4</button>
        </div>

        <div style="background:#170d29; border:2px dashed #ff5252; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px; opacity:0.86;">
          <div style="font-size:11px; font-weight:800; color:#ff5252;">AREA 5 · SIGNAL LOCKED</div>
          <div style="font-size:16px; font-weight:900; color:#ffb3b3;">Mulch Alley Arcade</div>
          <div style="font-size:12px; color:#b8a5db;">The Token Sharks (Chiptune Funk-Hop). ${done4 ? 'Frequency detected — coming next!' : 'Clear Area 4 to intercept signal.'}</div>
          <button disabled style="margin-top:auto; min-height:44px; border-radius:8px; border:1px solid #663344; background:#241221; color:#997788; font-weight:800; cursor:not-allowed;">🔒 UNAVAILABLE</button>
        </div>
      </div>

      <div style="font-size:11px; color:#b8a5db; display:flex; flex-wrap:wrap; gap:12px;">
        <span><b>Carve:</b> WASD / Arrows</span>
        <span><b>Jump / Air-Jump:</b> Space (×2)</span>
        <span><b>Grind / Trick:</b> E / Q / R</span>
        <span><b>Spray / Talk:</b> F / Enter</span>
        <span><b>Tag Stencil:</b> 1 / 2 / 3 / C</span>
        <span><b>Helper Hint:</b> H</span>
        <span><b>Boost:</b> Shift</span>
      </div>
    `;

    card.querySelector('#gsr-play-1')?.addEventListener('click', () => handlers.onPlay('velvet-keys'));
    card.querySelector('#gsr-play-2')?.addEventListener('click', () => handlers.onPlay('bongo-basin'));
    card.querySelector('#gsr-play-3')?.addEventListener('click', () => handlers.onPlay('chrome-kiln'));
    card.querySelector('#gsr-play-4')?.addEventListener('click', () => handlers.onPlay('neon-birdbath'));
    card.querySelector('#gsr-btn-music')?.addEventListener('click', () => handlers.onOpenMusic());
    card.querySelector('#gsr-btn-lore')?.addEventListener('click', openCodex);
  }

  render(progress);
  container.appendChild(root);

  return {
    show(p) {
      render(p);
      root.style.display = 'flex';
    },
    hide() {
      root.style.display = 'none';
    },
  };
}

export function showArea5Teaser(
  container: HTMLElement,
  onOpenMusic: () => void,
  onReturnToTitle: () => void,
): void {
  const modal = document.createElement('div');
  modal.id = 'gsr-area5-teaser';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:42; display:flex; align-items:center; justify-content:center;
    background:rgba(12,4,24,0.88); padding:16px; pointer-events:auto;
  `;
  modal.innerHTML = `
    <div style="width:min(520px, 94vw); background:#1d0b2e; border:3px solid #ff5252; border-radius:16px; padding:20px; color:#fff; display:flex; flex-direction:column; gap:10px; box-shadow:0 20px 60px rgba(0,0,0,0.8);">
      <div style="font-size:12px; font-weight:900; color:#ffd740; letter-spacing:1px;">📡 INCOMING TRANSMISSION — AREA 4 CLEARED!</div>
      <h2 style="margin:0; font-size:24px; color:#00e5ff;">NEXT FREQUENCY: MULCH ALLEY ARCADE</h2>
      <p style="margin:0; font-size:13px; color:#e5daf8;">
        Neon Birdbath Spire is retuned! Its pirate beacon just pierced the upper cloud deck, revealing <b>Area 5: Mulch Alley Arcade</b>—held by <b>Quarter-Slot Quinn & The Token Sharks</b>.
      </p>
      <div style="font-size:12px; color:#ffb3b3; background:#2b1124; padding:10px; border-radius:8px; border:1px dashed #ff5252;">
        <b>STATUS:</b> Signal Locked in this build. Preview its Chiptune Funk-Hop track right now in the Music Explorer!
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
        <button id="gsr-t5-music" style="flex:1; min-height:44px; border-radius:8px; border:2px solid #00e5ff; background:#142847; color:#fff; font-weight:800; cursor:pointer;">🎵 Preview Area 5 Track</button>
        <button id="gsr-t5-ok" style="flex:1; min-height:44px; border-radius:8px; border:none; background:#ffd740; color:#140824; font-weight:900; cursor:pointer;">Area Select</button>
      </div>
    </div>
  `;
  container.appendChild(modal);
  modal.querySelector('#gsr-t5-music')?.addEventListener('click', () => {
    modal.remove();
    onOpenMusic();
  });
  modal.querySelector('#gsr-t5-ok')?.addEventListener('click', () => {
    modal.remove();
    onReturnToTitle();
  });
}
