// Options: an app on the Gnomlet tablet (gnomlet/), also opened straight away by O or Start on a pad. Its content is the
// Options registry (optionsRegistry.ts): every module registers its own rows or sections, and this file draws them in
// order. The built-in sections registered here: Controls (touch layout, controls list, the Steam Controller slot),
// Dialogue and radio, Multiplayer, World (time of day), Cheats (driving realism), Save (cloud status, Save Trainer) and
// the Profiler. View, Water waves and Sound register themselves (viewPrefs.ts, waveOptions.ts, sound/volumeUi.ts).
import { TUNES, getTune, type Tune } from './simdrive';
import type { TimeMode } from './atmosphere';
import { getRadioText, setRadioText } from './radio/prefs';
import { TEXT_SPEEDS, getTextSpeed, setTextSpeed, type TextSpeed } from './cutscene/textSpeed';
import { KEYS } from './keys';
import { getMapPlayers, setMapPlayers } from './mapPrefs';
import { registerSoundOptions } from './sound/volumeUi';
import { mountCloudStatus } from './cloudSave';
import { registerWaveOptions } from './waveOptions';
import { registerViewOptions } from './viewPrefs';
import { registerWeatherOptions } from './weather/options';
import {
  flushPerfUpload, isOverlayOpen, isProfiling, perfCounts, perfUploadStatus, setPerfOverlay, setProfileUpload,
} from './perf';
import { registerAction } from './ui/actions';
import { getTouchLayout, setTouchLayout, TOUCH_LAYOUTS, type TouchLayout } from './ui/style';
import { controlsFor, esc } from './ui/glyphs';
import { currentGlyphSet, onInputSourceChange } from './ui/inputSource';
import {
  activateOption, listOptionSections, onOptionsChange, optionDescText, optionValueText, registerOption,
  registerOptionsSection, type OptionDef, type OptionsSectionHooks,
} from './optionsRegistry';
import { closeGnomlet, toggleGnomletApp } from './gnomlet/gnomlet';
import { registerGnomletApp } from './gnomlet/registry';

const LAYOUT_TEXT: Record<TouchLayout, { label: string; desc: string }> = {
  standard: { label: 'Standard', desc: 'Every button' },
  minimal: { label: 'Minimal', desc: 'Fewer buttons, no pinned shortcuts' },
  'left-handed': { label: 'Left-handed', desc: 'Stick on the right, buttons on the left' },
};

const GOLD = '#ffd23f';
const DIM = 'rgba(255,255,255,.3)';

export const OPTIONS_CSS = `
#gta-options{display:flex;flex-direction:column;gap:6px;font:600 14px system-ui,sans-serif;color:#fff;}
#gta-options button{font:inherit;color:#fff;touch-action:manipulation;cursor:pointer;}
#gta-options h3{margin:10px 0 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${GOLD};}
#gta-options h3:first-child{margin-top:0;}
#gta-options .gta-opt-note{font-weight:400;font-size:12px;opacity:.8;line-height:1.3;}
#gta-options .gta-opt-sub{font-weight:700;font-size:12px;opacity:.9;margin-top:4px;}
#gta-options .gta-opt-list{display:grid;grid-template-columns:1fr;gap:6px;}
#gta-options .gta-opt-mode{min-height:48px;padding:6px 12px;text-align:left;border-radius:8px;border:2px solid ${DIM};background:rgba(255,255,255,.08);}
#gta-options .gta-opt-mode small{display:block;font-weight:400;font-size:12px;opacity:.8;margin-top:1px;}
#gta-options .gta-opt-fold summary{min-height:44px;display:flex;align-items:center;cursor:pointer;list-style:none;}
#gta-options .gta-opt-fold summary::before{content:'▸';margin-right:6px;}
#gta-options .gta-opt-fold[open] summary::before{content:'▾';}
#gta-options .gta-opt-controls{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;font-size:12px;}
#gta-options .gta-opt-slider{display:flex;flex-direction:column;justify-content:center;gap:4px;min-height:48px;box-sizing:border-box;padding:4px 12px;border-radius:8px;border:2px solid ${DIM};background:rgba(255,255,255,.05);}
#gta-options .gta-opt-slider-top{display:flex;align-items:center;justify-content:space-between;}
#gta-options .gta-opt-slider-top span:last-child{font-variant-numeric:tabular-nums;opacity:.9;}
#gta-options .gta-opt-slider input[type="range"]{display:block;width:100%;height:32px;margin:0;accent-color:${GOLD};touch-action:pan-y;}
@media (min-width:700px),(max-height:520px){#gta-options .gta-opt-list{grid-template-columns:1fr 1fr;}}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function modeButton(html: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', 'gta-opt-mode');
  b.type = 'button';
  b.innerHTML = html;
  b.addEventListener('click', onClick);
  return b;
}

/** One registry row as an element, and how to repaint it. */
function renderRow(o: OptionDef): { el: HTMLElement; paint(): void } {
  if (o.kind === 'slider') {
    const row = el('label', 'gta-opt-slider');
    row.dataset.opt = o.id;
    const top = el('div', 'gta-opt-slider-top');
    const name = el('span', '', o.label);
    const pct = el('span');
    top.append(name, pct);
    const input = el('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = String(Math.round((o.step ?? 0.05) * 100));
    input.setAttribute('aria-label', o.label);
    const paint = (): void => {
      input.value = String(Math.round(o.get() * 100));
      pct.textContent = optionValueText(o);
    };
    input.addEventListener('input', () => {
      o.set(Number(input.value) / 100);
      pct.textContent = `${input.value}%`;
    });
    input.addEventListener('keydown', (e) => e.stopPropagation());
    row.append(top, input);
    return { el: row, paint };
  }
  const b = el('button', 'gta-opt-mode');
  b.type = 'button';
  b.dataset.opt = o.id;
  const paint = (): void => {
    const v = optionValueText(o);
    const d = optionDescText(o);
    b.innerHTML = `${esc(o.label)}${v ? `: ${esc(v)}` : ''}${d ? `<small>${esc(d)}</small>` : ''}`;
    if (o.kind === 'toggle') b.setAttribute('aria-pressed', String(o.get()));
  };
  b.addEventListener('click', () => { activateOption(o); paint(); });
  return { el: b, paint };
}

let timeMode: TimeMode = 'auto';

/** Builds the Options content and registers it as the Gnomlet's Options app. Returns the Controls slot inside it, for
 *  the Steam Controller button. */
export function createOptions(
  _ui: HTMLElement,
  onPickMode: (t: Tune) => void,
  onPickTime?: (mode: TimeMode) => void,
): HTMLElement {
  if (!document.getElementById('gta-options-style')) {
    const style = el('style');
    style.id = 'gta-options-style';
    style.textContent = OPTIONS_CSS;
    document.head.appendChild(style);
  }
  const root = el('div');
  root.id = 'gta-options';
  // Controls holds the Steam Controller button (it only shows when one is in use). Kept across rebuilds.
  const extras = el('div', 'gta-opt-extras');
  registerBuiltInOptions(extras, onPickMode, onPickTime);

  let hooks: OptionsSectionHooks[] = [];
  let painters: (() => void)[] = [];
  let built = false;
  let dirty = true;
  let shown = false;
  let abort = new AbortController();

  function build(): void {
    for (const h of hooks) h.hide?.();
    abort.abort();
    abort = new AbortController();
    hooks = [];
    painters = [];
    root.replaceChildren();
    for (const s of listOptionSections()) {
      const rows = s.rows.filter((r) => (r.visible ? r.visible() : true));
      if (!rows.length && !s.mount) continue;
      const sec = el('section', 'gta-opt-sec');
      sec.dataset.section = s.id;
      sec.append(el('h3', '', s.title));
      if (rows.length) {
        const list = el('div', 'gta-opt-list');
        for (const r of rows) {
          const { el: rowEl, paint } = renderRow(r);
          painters.push(paint);
          if (r.watch) window.addEventListener(r.watch, paint, { signal: abort.signal });
          list.append(rowEl);
        }
        sec.append(list);
      }
      if (s.mount) {
        const box = el('div', 'gta-opt-custom');
        const h = s.mount(box);
        if (h) hooks.push(h);
        sec.append(box);
      }
      root.append(sec);
    }
    built = true;
    dirty = false;
  }
  onOptionsChange(() => {
    dirty = true;
    if (shown) { build(); show(); }
  });

  function show(): void {
    if (!built || dirty) build();
    shown = true;
    for (const p of painters) p();
    for (const h of hooks) h.show?.();
  }
  function hide(): void {
    shown = false;
    for (const h of hooks) h.hide?.();
  }

  registerGnomletApp({
    id: 'options',
    label: 'Options',
    icon: '⚙',
    group: 'system',
    order: 10,
    open: (screen) => {
      screen.append(root);
      show();
      return () => { hide(); root.remove(); };
    },
  });
  const toggle = (): void => toggleGnomletApp('options');
  window.addEventListener('gta:options', toggle);
  registerAction('options', { run: toggle });
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    if (e.code === KEYS.options && !e.repeat) toggle();
  });
  return extras;
}

/** The sections and rows that used to be hand-built here, now registry entries (same storage keys and behaviour). */
function registerBuiltInOptions(
  extras: HTMLElement,
  onPickMode: (t: Tune) => void,
  onPickTime?: (mode: TimeMode) => void,
): void {
  // Controls: touch layout picker (standard / minimal / left-handed, ui/style.ts), the controls list for the device in
  // use (keyboard keys, pad glyphs or the touch words), and the Steam Controller slot.
  registerOptionsSection('controls', 'Controls', (box) => {
    const layoutHead = el('div', 'gta-opt-sub', 'Touch layout');
    const layoutList = el('div', 'gta-opt-list');
    const layoutBtns = new Map<TouchLayout, HTMLButtonElement>();
    const paintLayout = (): void => {
      const cur = getTouchLayout();
      layoutBtns.forEach((b, id) => { b.style.borderColor = id === cur ? GOLD : DIM; });
    };
    for (const id of TOUCH_LAYOUTS) {
      const b = modeButton(`${LAYOUT_TEXT[id].label}<small>${LAYOUT_TEXT[id].desc}</small>`, () => { setTouchLayout(id); paintLayout(); });
      b.dataset.opt = `layout-${id}`;
      layoutBtns.set(id, b);
      layoutList.append(b);
    }
    window.addEventListener('gta:touch-layout', paintLayout);
    // The controls list is long: folded by default so the rest of Options is one scroll away.
    const ctlBox = el('details', 'gta-opt-fold');
    const ctlHead = el('summary', 'gta-opt-sub');
    const ctlList = el('div', 'gta-opt-controls');
    ctlBox.append(ctlHead, ctlList);
    const paintControls = (): void => {
      const set = currentGlyphSet();
      const device = set === 'touch' ? 'touch' : set === 'keyboard' ? 'keyboard' : 'gamepad';
      ctlHead.textContent = `Your controls (${device})`;
      ctlList.innerHTML = controlsFor(set, 'all').map((r) => `<span>${esc(r.label)}</span><span>${r.html}</span>`).join('');
    };
    // The controls list follows the device while Options is open (a pad plugged in, a key pressed).
    onInputSourceChange(() => { if (ctlList.isConnected) paintControls(); });
    box.append(extras, layoutHead, layoutList, ctlBox);
    return { show: () => { paintLayout(); paintControls(); } };
  });

  registerViewOptions();

  // Dialogue and radio.
  registerOption({
    section: 'dialogue', id: 'radio-text', label: 'Radio text', kind: 'toggle', order: 10,
    desc: 'Station, DJ, adverts and bulletins as floating text. Off keeps the music and hides the words.',
    get: getRadioText, set: setRadioText,
  });
  const speedLabels: Record<TextSpeed, string> = { slow: 'Slow', normal: 'Normal', fast: 'Fast', instant: 'Instant' };
  registerOption({
    section: 'dialogue', id: 'text-speed', label: 'Text speed', kind: 'cycle', order: 20,
    desc: 'How fast cutscene lines type out. Tap a line to finish it; tap again for the next.',
    values: TEXT_SPEEDS.map((id) => ({ id, label: speedLabels[id] })),
    get: getTextSpeed, set: (id) => setTextSpeed(id as TextSpeed),
  });

  // Multiplayer: other online players on the minimap and big map. On by default; off hides them from both maps.
  registerOption({
    section: 'online', id: 'map-players', label: 'Players on the map', kind: 'toggle', order: 10, watch: 'gta:map-players',
    desc: 'Other online players as dots on the minimap and big map. Off hides them from both.',
    get: getMapPlayers, set: setMapPlayers,
  });

  // World: time of day (E06 adds weather rows here), then water waves (waveOptions.ts).
  if (onPickTime) {
    const modes: { id: TimeMode; label: string; desc: string }[] = [
      { id: 'auto', label: 'Auto Cycle', desc: 'Smooth 6-minute day, golden hour & neon night.' },
      { id: 'noon', label: 'Noon', desc: 'Crisp midday garden sun.' },
      { id: 'golden', label: 'Golden Hour', desc: 'Warm sunset glow across Turfton.' },
      { id: 'night', label: 'Neon Night', desc: 'Streetlamps, headlights & Greenhouse neon.' },
    ];
    registerOption({
      section: 'world', id: 'time-of-day', label: 'Time of day', kind: 'cycle', order: 10,
      desc: () => modes.find((m) => m.id === timeMode)?.desc ?? '',
      values: modes.map((m) => ({ id: m.id, label: m.label })),
      get: () => timeMode,
      set: (id) => { timeMode = id as TimeMode; onPickTime(timeMode); },
    });
  }
  registerWaveOptions();
  registerWeatherOptions();
  registerSoundOptions();

  // Cheats: driving realism, the physics family every ground vehicle uses (a fun extra, not a primary control).
  registerOptionsSection('cheats', 'Cheats', (box) => {
    box.insertAdjacentHTML('beforeend', '<div class="gta-opt-note">Just for fun. Driving realism changes how every ground vehicle handles; each still drives like itself.</div>');
    const tuneBtns = new Map<string, HTMLButtonElement>();
    const mark = (): void => tuneBtns.forEach((b, id) => { b.style.borderColor = id === getTune().id ? GOLD : DIM; });
    const group = (title: string, g: Tune['group']): void => {
      const list = el('div', 'gta-opt-list');
      for (const t of TUNES.filter((x) => x.group === g)) {
        const b = modeButton(`${t.name}<small>${t.blurb}</small>`, () => { onPickMode(t); mark(); });
        b.dataset.opt = t.id;
        tuneBtns.set(t.id, b);
        list.append(b);
      }
      box.append(el('div', 'gta-opt-sub', title), list);
    };
    group('Driving realism', 'realism');
    group('Silly handling', 'silly');
    return { show: mark };
  });

  // Save: cloud status (cloudSave.ts), then the Save Trainer (src/trainer/: export, import or reset the save, edit the
  // character, spawn things, play cutscenes).
  registerOptionsSection('save', 'Save', (box) => { mountCloudStatus(box); });
  registerOption({
    section: 'save', id: 'trainer', label: 'Save Trainer', kind: 'button', order: 10,
    desc: () => 'Export, import or reset your save; edit the character, spawn things, play cutscenes.'
      + (currentGlyphSet() === 'keyboard' ? ' F9 or ` too.' : ''),
    run: () => { closeGnomlet(); window.dispatchEvent(new CustomEvent('gta:trainer')); },
  });

  // Profiler: toggle hitch profiling + upload, live perf overlay, and manual flush.
  registerOptionsSection('dev', 'Profiler', (box) => {
    const list = el('div', 'gta-opt-list');
    const profNote = el('div', 'gta-opt-note');
    let timer = 0;
    const profBtn = modeButton('', () => {
      const next = !isProfiling();
      setProfileUpload(next);
      if (next && !isOverlayOpen()) setPerfOverlay(true);
      paint();
    });
    profBtn.dataset.opt = 'profiler-toggle';
    const overlayBtn = modeButton('', () => { setPerfOverlay(!isOverlayOpen()); paint(); });
    overlayBtn.dataset.opt = 'profiler-overlay';
    const uploadNowBtn = modeButton('Upload now<small>Flush queued hitch and frame-health reports immediately.</small>', () => {
      flushPerfUpload();
      paint();
    });
    uploadNowBtn.dataset.opt = 'profiler-flush';
    function paint(): void {
      const on = isProfiling();
      const ov = isOverlayOpen();
      profBtn.style.borderColor = on ? GOLD : DIM;
      profBtn.innerHTML = `${on ? 'Profiling & Upload: ON' : 'Profile & Upload: OFF'}<small>Record hitches &gt;${perfCounts().thresholdMs} ms and 5 s frame samples; kept across reloads.</small>`;
      overlayBtn.style.borderColor = ov ? GOLD : DIM;
      overlayBtn.innerHTML = `${ov ? 'Perf Overlay: ON' : 'Perf Overlay: OFF'}<small>Show live FPS, CPU/GPU ms, draw calls and slowest systems.</small>`;
      uploadNowBtn.style.display = on ? 'block' : 'none';
      if (!on) {
        profNote.textContent = 'Off (or open with ?profile=upload). View reports at /admin/profiler/.';
        return;
      }
      const c = perfCounts();
      const u = perfUploadStatus();
      if (!u) profNote.textContent = `Recording: ${c.reports} hitches, ${c.samples} samples · starting upload...`;
      else if (u.state === 'unavailable' || u.state === 'error') profNote.textContent = `${c.reports} hitches, ${c.samples} samples · upload error: ${u.lastError}`;
      else profNote.textContent = `${c.reports} hitches, ${c.samples} samples · ${u.sent} sent, ${u.queued} queued`;
    }
    list.append(profBtn, overlayBtn, uploadNowBtn);
    box.append(list, profNote);
    return {
      show: () => { paint(); window.clearInterval(timer); timer = window.setInterval(paint, 1000); },
      hide: () => window.clearInterval(timer),
    };
  });
}
