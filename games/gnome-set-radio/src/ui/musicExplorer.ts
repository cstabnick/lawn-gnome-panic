import { GSR_TRACKS, type GsrMusicOptions, type GsrTrackId, type GsrTrackMeta } from '@lawn/music';

export interface MusicExplorerHandle {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  onBeat(step: number, section?: string): void;
  getReactiveOverrides(): GsrMusicOptions | null;
}

export function createMusicExplorer(
  container: HTMLElement,
  opts: {
    onSelectTrack: (id: GsrTrackId, overrides: GsrMusicOptions) => void;
    onStop: () => void;
    getCurrentTrack: () => GsrTrackId;
  },
): MusicExplorerHandle {
  const modal = document.createElement('div');
  modal.id = 'gsr-music-explorer';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:40; display:none; align-items:center; justify-content:center;
    background:rgba(10,4,22,0.82); backdrop-filter:blur(6px); pointer-events:auto; padding:12px;
  `;

  let grinding = false;
  let air = false;
  let boss = false;
  let skillPeak = false;
  let hype = 0.45;
  let revealSecret = false;
  let selectedId: GsrTrackId = opts.getCurrentTrack();
  let beatLevel = 0;

  const box = document.createElement('div');
  box.style.cssText = `
    width:min(760px, 96vw); max-height:90vh; overflow-y:auto;
    background:#190c2e; border:2px solid #00e5ff; border-radius:14px;
    color:#f5f0ff; padding:16px; box-shadow:0 16px 48px rgba(0,0,0,0.65);
    display:flex; flex-direction:column; gap:12px;
  `;
  modal.appendChild(box);

  const header = document.createElement('div');
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;';
  header.innerHTML = `
    <div>
      <div style="font-size:20px; font-weight:900; color:#00e5ff; letter-spacing:0.5px;">🎵 BROADCAST MUSIC EXPLORER</div>
      <div style="font-size:12px; color:#c8b6e8;">100% Synthesized Tone.js Score · Live Reactive Mix Controls</div>
    </div>
  `;
  const sectionBadge = document.createElement('span');
  sectionBadge.style.cssText =
    'font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; background:#2b124d; border:1px solid #00e5ff; color:#00e5ff; letter-spacing:0.6px;';
  sectionBadge.textContent = 'SECTION: INTRO';
  header.appendChild(sectionBadge);
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Close';
  closeBtn.style.cssText =
    'min-height:44px; min-width:44px; padding:8px 14px; border-radius:8px; border:1px solid #ff4ecd; background:#2b124d; color:#fff; font-weight:700; cursor:pointer;';
  closeBtn.onclick = () => close();
  header.appendChild(closeBtn);
  box.appendChild(header);

  // Beat visualizer canvas
  const viz = document.createElement('canvas');
  viz.width = 640;
  viz.height = 48;
  viz.style.cssText = 'width:100%; height:48px; border-radius:8px; background:#0f061c; border:1px solid #3c2266;';
  box.appendChild(viz);
  const vctx = viz.getContext('2d');

  // Detail card
  const detail = document.createElement('div');
  detail.style.cssText =
    'background:#231140; border:1px solid #4a2a7a; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:6px;';
  box.appendChild(detail);

  // Reactive controls
  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; align-items:center;';
  const makeToggle = (label: string, get: () => boolean, set: (v: boolean) => void) => {
    const b = document.createElement('button');
    const sync = () => {
      b.textContent = `${get() ? '● ' : '○ '}${label}`;
      b.style.background = get() ? '#ff4ecd' : '#2b124d';
      b.style.borderColor = get() ? '#ffd740' : '#55308a';
    };
    b.style.cssText =
      'min-height:44px; padding:8px 12px; border-radius:8px; border:1px solid #55308a; color:#fff; font-weight:700; font-size:12px; cursor:pointer;';
    b.onclick = () => {
      set(!get());
      sync();
    };
    sync();
    return b;
  };
  controls.appendChild(makeToggle('Grinding Hats', () => grinding, (v) => (grinding = v)));
  controls.appendChild(makeToggle('Airborne Filter', () => air, (v) => (air = v)));
  controls.appendChild(makeToggle('Boss Horns', () => boss, (v) => (boss = v)));
  controls.appendChild(makeToggle('Skill Combo Flair', () => skillPeak, (v) => (skillPeak = v)));

  const hypeWrap = document.createElement('label');
  hypeWrap.style.cssText = 'display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; margin-left:auto;';
  hypeWrap.innerHTML = '<span>Hype</span>';
  const hypeSlider = document.createElement('input');
  hypeSlider.type = 'range';
  hypeSlider.min = '0';
  hypeSlider.max = '100';
  hypeSlider.value = String(Math.round(hype * 100));
  hypeSlider.oninput = () => (hype = Number(hypeSlider.value) / 100);
  hypeWrap.appendChild(hypeSlider);
  controls.appendChild(hypeWrap);

  const stopBtn = document.createElement('button');
  stopBtn.textContent = '⏹ Stop';
  stopBtn.style.cssText =
    'min-height:44px; padding:8px 14px; border-radius:8px; border:1px solid #ff5252; background:#3d1322; color:#fff; font-weight:700; cursor:pointer;';
  stopBtn.onclick = () => opts.onStop();
  controls.appendChild(stopBtn);
  box.appendChild(controls);

  // Track list
  const list = document.createElement('div');
  list.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:8px;';
  box.appendChild(list);

  // Secret Area 9 reveal toggle
  const secretBtn = document.createElement('button');
  secretBtn.textContent = '🔒 Reveal Secret Area 9 Frequency';
  secretBtn.style.cssText =
    'min-height:44px; padding:8px 12px; border-radius:8px; border:1px dashed #ffd740; background:#1e1036; color:#ffd740; font-weight:700; cursor:pointer;';
  secretBtn.onclick = () => {
    revealSecret = !revealSecret;
    secretBtn.textContent = revealSecret ? '🔓 Hide Secret Area 9' : '🔒 Reveal Secret Area 9 Frequency';
    renderList();
  };
  box.appendChild(secretBtn);

  const overrides: GsrMusicOptions = {
    grinding: () => grinding,
    air: () => air,
    boss: () => boss,
    skillPeak: () => skillPeak,
    hype: () => hype,
  };

  function renderDetail(t: GsrTrackMeta): void {
    detail.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="font-size:16px; color:${t.color};">${t.areaNumber === 0 ? 'HUB' : `AREA ${t.areaNumber}`}: ${t.title}</strong>
        <span style="font-size:12px; padding:3px 8px; border-radius:999px; background:#33185e;">${t.bpm} BPM · ${t.key} ${t.mode}</span>
      </div>
      <div style="font-size:12px; color:#e0d4f7;"><b>District & Gang:</b> ${t.areaName} — ${t.gangName}</div>
      <div style="font-size:12px; color:#00e5ff;"><b>Style:</b> ${t.style} · <b>Chords:</b> ${t.progression}</div>
      <div style="font-size:12px; color:#c8b6e8;"><b>Motif:</b> ${t.motifNote}</div>
      <div style="font-size:12px; color:#c8b6e8;"><b>Beat:</b> ${t.beatNote}</div>
    `;
  }

  function renderList(): void {
    list.innerHTML = '';
    for (const t of GSR_TRACKS) {
      if (t.secret && !revealSecret) continue;
      const active = t.id === selectedId;
      const card = document.createElement('button');
      card.style.cssText = `
        text-align:left; padding:10px; border-radius:10px; cursor:pointer; min-height:54px;
        background:${active ? '#361a63' : '#140926'};
        border:2px solid ${active ? t.color : '#331d57'}; color:#fff;
      `;
      card.innerHTML = `
        <div style="font-size:11px; color:${t.color}; font-weight:800;">${t.areaNumber === 0 ? 'TITLE HUB' : `AREA ${t.areaNumber}${t.secret ? ' (SECRET)' : ''}`} · ${t.bpm} BPM</div>
        <div style="font-size:13px; font-weight:800; margin:2px 0;">${t.title}</div>
        <div style="font-size:11px; color:#b8a5db;">${t.style}</div>
      `;
      card.onclick = () => {
        selectedId = t.id;
        renderDetail(t);
        renderList();
        opts.onSelectTrack(t.id, overrides);
      };
      list.appendChild(card);
    }
  }

  let raf = 0;
  function drawViz(): void {
    if (modal.style.display !== 'flex') return;
    if (vctx) {
      vctx.fillStyle = '#0f061c';
      vctx.fillRect(0, 0, viz.width, viz.height);
      const bars = 24;
      const bw = viz.width / bars;
      const meta = GSR_TRACKS.find((x) => x.id === selectedId) ?? GSR_TRACKS[0];
      vctx.fillStyle = meta.color;
      for (let i = 0; i < bars; i++) {
        const wave = 0.25 + 0.75 * Math.abs(Math.sin(performance.now() * 0.006 + i * 0.45)) * beatLevel;
        const h = Math.max(4, wave * (viz.height - 8));
        vctx.fillRect(i * bw + 3, viz.height - h - 4, bw - 6, h);
      }
      beatLevel = Math.max(0.25, beatLevel * 0.92);
    }
    raf = requestAnimationFrame(drawViz);
  }

  function open(): void {
    selectedId = opts.getCurrentTrack();
    const meta = GSR_TRACKS.find((x) => x.id === selectedId) ?? GSR_TRACKS[0];
    renderDetail(meta);
    renderList();
    modal.style.display = 'flex';
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(drawViz);
  }

  function close(): void {
    modal.style.display = 'none';
    cancelAnimationFrame(raf);
  }

  container.appendChild(modal);

  return {
    open,
    close,
    toggle() {
      if (modal.style.display === 'flex') close();
      else open();
    },
    isOpen: () => modal.style.display === 'flex',
    onBeat(step, section) {
      if (step % 4 === 0) beatLevel = 1.0;
      else if (step % 2 === 0) beatLevel = Math.max(beatLevel, 0.65);
      if (section) {
        const label = section.replace(/([A-Z])/g, ' $1').toUpperCase();
        sectionBadge.textContent = `SECTION: ${label}`;
      }
    },
    getReactiveOverrides: () => (modal.style.display === 'flex' ? overrides : null),
  };
}
