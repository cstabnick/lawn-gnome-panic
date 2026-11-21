// Options: a small gear button (and O, or Start on a pad) opens a panel. Right now it holds one section, CHEATS, with "Driving
// realism": the physics family every ground vehicle uses. It is a fun extra, not a primary control: nothing in the HUD shouts about it.
import { firstPad } from '@lawn/gamepad';
import { TUNES, getTune, type Tune } from './simdrive';
import { getRadioText, setRadioText } from './radio/prefs';
import { exportSaveBundle, importSaveBundle, resetSaveBundle } from './saveIO';

/** Builds the gear and its settings panel. Returns the Controls slot inside it, for the Steam Controller button. */
export function createOptions(ui: HTMLElement, onPickMode: (t: Tune) => void): HTMLElement {
  const style = document.createElement('style');
  style.textContent = `
    #gta-options{position:fixed;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font:600 14px system-ui,sans-serif;color:#fff;pointer-events:none;}
    #gta-options button{font:inherit;color:#fff;touch-action:manipulation;}
    #gta-options .gta-opt-gear{width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(20,20,20,.5);font-size:22px;line-height:1;padding:0;pointer-events:auto;}
    #gta-options .gta-opt-panel{display:none;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:rgba(20,20,20,.88);width:min(86vw,330px);max-height:calc(100dvh - env(safe-area-inset-top) - 260px);overflow-y:auto;touch-action:pan-y;pointer-events:auto;box-sizing:border-box;}
    #gta-options .gta-opt-head{display:flex;align-items:center;justify-content:space-between;font-size:16px;}
    #gta-options .gta-opt-close{width:44px;height:44px;margin:-8px -8px -8px 0;border:0;background:none;font-size:20px;}
    #gta-options h3{margin:4px 0 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ffd23f;}
    #gta-options .gta-opt-note{font-weight:400;font-size:12px;opacity:.8;line-height:1.3;}
    #gta-options .gta-opt-list{display:grid;grid-template-columns:1fr;gap:6px;}
    #gta-options .gta-opt-mode{min-height:48px;padding:6px 12px;text-align:left;border-radius:8px;border:2px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);}
    #gta-options .gta-opt-mode small{display:block;font-weight:400;font-size:12px;opacity:.8;margin-top:1px;}
    @media (max-height:520px){#gta-options .gta-opt-panel{position:fixed;top:calc(env(safe-area-inset-top) + 8px);right:calc(env(safe-area-inset-right) + 64px);width:min(72vw,480px);max-height:calc(100dvh - env(safe-area-inset-top) - 16px);}#gta-options .gta-opt-list{grid-template-columns:1fr 1fr;}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-options';
  const gear = document.createElement('button');
  gear.type = 'button';
  gear.className = 'gta-opt-gear';
  gear.setAttribute('aria-label', 'Options');
  gear.textContent = '⚙';
  const panel = document.createElement('div');
  panel.className = 'gta-opt-panel';
  // The settings menu. Controls holds the Steam Controller button (it only shows when one is in use).
  panel.innerHTML = '<div class="gta-opt-head"><span>Options</span><button type="button" class="gta-opt-close" aria-label="Close options">✕</button></div>'
    + '<h3>Controls</h3><div class="gta-opt-extras"></div>'
    + '<h3>Cheats</h3><div class="gta-opt-note">Just for fun. Driving realism changes how every ground vehicle handles; each still drives like itself.</div>';
  const extras = panel.querySelector<HTMLElement>('.gta-opt-extras') as HTMLElement;
  root.append(gear, panel);
  ui.appendChild(root);

  const buttons = new Map<string, HTMLButtonElement>();
  const addGroup = (title: string, group: Tune['group']): void => {
    const h = document.createElement('div');
    h.className = 'gta-opt-note';
    h.style.fontWeight = '700';
    h.textContent = title;
    const list = document.createElement('div');
    list.className = 'gta-opt-list';
    for (const t of TUNES.filter((x) => x.group === group)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gta-opt-mode';
      b.innerHTML = `${t.name}<small>${t.blurb}</small>`;
      b.addEventListener('click', () => { onPickMode(t); mark(); });
      buttons.set(t.id, b);
      list.appendChild(b);
    }
    panel.append(h, list);
  };
  addGroup('Driving realism', 'realism');
  addGroup('Silly handling', 'silly');
  const hint = document.createElement('div');
  hint.className = 'gta-opt-note';
  hint.textContent = 'Handbrake: Space, A on a pad, or the Handbrake button on touch.';
  panel.appendChild(hint);
  // Radio: the station and DJ text that floats over the screen. Off keeps the music and hides the words.
  const radioHead = document.createElement('div');
  radioHead.className = 'gta-opt-note';
  radioHead.style.fontWeight = '700';
  radioHead.textContent = 'Radio';
  const radioList = document.createElement('div');
  radioList.className = 'gta-opt-list';
  const radioBtn = document.createElement('button');
  radioBtn.type = 'button';
  radioBtn.className = 'gta-opt-mode';
  const paintRadio = (): void => {
    radioBtn.innerHTML = `Radio text: ${getRadioText() ? 'on' : 'off'}<small>Station, DJ, adverts and bulletins as floating text. Off keeps the music and hides the words.</small>`;
  };
  paintRadio();
  radioBtn.addEventListener('click', () => { setRadioText(!getRadioText()); paintRadio(); });
  buttons.set('radio-text', radioBtn);
  radioList.appendChild(radioBtn);
  panel.append(radioHead, radioList);

  // Experimental: dev-testing tools to export, import, or reset local save data.
  const expHeading = document.createElement('h3');
  expHeading.textContent = 'Experimental';
  const expNote = document.createElement('div');
  expNote.className = 'gta-opt-note';
  expNote.textContent = 'Dev testing: back up, restore, or wipe your Turfton save (quests, acorns, collectibles).';
  const expList = document.createElement('div');
  expList.className = 'gta-opt-list';
  const expStatus = document.createElement('div');
  expStatus.className = 'gta-opt-note';
  expStatus.style.color = '#ffd23f';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'gta-opt-mode';
  exportBtn.innerHTML = 'Export save<small>Downloads gta-save.json &amp; copies to clipboard.</small>';
  exportBtn.addEventListener('click', () => {
    const json = JSON.stringify(exportSaveBundle(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gta-save.json';
    a.click();
    URL.revokeObjectURL(url);
    navigator.clipboard?.writeText(json).catch(() => {});
    expStatus.textContent = 'Exported gta-save.json.';
  });
  buttons.set('exp-export', exportBtn);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    const res = importSaveBundle(await file.text());
    if (res.ok) {
      expStatus.textContent = `Imported ${res.keys.length} key(s). Reloading...`;
      location.reload();
    } else {
      expStatus.textContent = `Import failed: ${res.error}`;
    }
  });

  const importFileBtn = document.createElement('button');
  importFileBtn.type = 'button';
  importFileBtn.className = 'gta-opt-mode';
  importFileBtn.innerHTML = 'Import save (file)<small>Load a gta-save.json file and reload.</small>';
  importFileBtn.addEventListener('click', () => fileInput.click());
  buttons.set('exp-import-file', importFileBtn);

  const pasteBox = document.createElement('div');
  pasteBox.style.display = 'none';
  pasteBox.style.flexDirection = 'column';
  pasteBox.style.gap = '6px';
  const pasteArea = document.createElement('textarea');
  pasteArea.rows = 4;
  pasteArea.placeholder = '{"format":"gta-save/v1","data":{...}}';
  pasteArea.style.cssText = 'width:100%;box-sizing:border-box;border-radius:8px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.45);color:#fff;font:12px monospace;padding:6px;resize:vertical;';
  pasteArea.addEventListener('keydown', (e) => e.stopPropagation());
  const applyPasteBtn = document.createElement('button');
  applyPasteBtn.type = 'button';
  applyPasteBtn.className = 'gta-opt-mode';
  applyPasteBtn.innerHTML = 'Apply pasted JSON<small>Overwrite local save and reload.</small>';
  applyPasteBtn.addEventListener('click', () => {
    const res = importSaveBundle(pasteArea.value);
    if (res.ok) {
      expStatus.textContent = `Imported ${res.keys.length} key(s). Reloading...`;
      location.reload();
    } else {
      expStatus.textContent = `Import failed: ${res.error}`;
    }
  });
  pasteBox.append(pasteArea, applyPasteBtn);

  const pasteToggleBtn = document.createElement('button');
  pasteToggleBtn.type = 'button';
  pasteToggleBtn.className = 'gta-opt-mode';
  pasteToggleBtn.innerHTML = 'Paste save JSON<small>Toggle JSON text box for quick dev edits.</small>';
  pasteToggleBtn.addEventListener('click', () => {
    pasteBox.style.display = pasteBox.style.display === 'none' ? 'flex' : 'none';
  });
  buttons.set('exp-paste-toggle', pasteToggleBtn);

  let resetArmed = false;
  let resetTimer: number | undefined;
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'gta-opt-mode';
  const paintReset = (): void => {
    resetBtn.style.borderColor = resetArmed ? '#ff5c5c' : 'rgba(255,255,255,.3)';
    resetBtn.innerHTML = resetArmed
      ? 'Tap again to confirm reset<small>Wipes quests, acorns, and collectibles, then reloads.</small>'
      : 'Reset save<small>Wipe local save data and start fresh.</small>';
  };
  paintReset();
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      paintReset();
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => { resetArmed = false; paintReset(); }, 5000);
      return;
    }
    resetSaveBundle();
    expStatus.textContent = 'Save wiped. Reloading...';
    location.reload();
  });
  buttons.set('exp-reset', resetBtn);

  expList.append(exportBtn, importFileBtn, pasteToggleBtn, resetBtn);
  panel.append(expHeading, expNote, expList, fileInput, pasteBox, expStatus);

  const mark = (): void => buttons.forEach((b, id) => { b.style.borderColor = id === getTune().id ? '#ffd23f' : 'rgba(255,255,255,.3)'; });

  // Gamepad: while open the panel owns the pad (input.ts reads body[data-options]); D-pad or stick picks, A selects, B / Start close.
  const ids = [...buttons.keys()];
  let focus = 0;
  let isOpen = false;
  let padPrev: boolean[] = [];
  // The focus ring is for the pad; with a mouse or touch it only gets in the way.
  const showFocus = (): void => buttons.forEach((b, id) => { b.style.outline = id === ids[focus] && firstPad() ? '3px solid #7cf0ff' : 'none'; });
  function pollPad(): void {
    if (!isOpen) return;
    const p = firstPad();
    if (p) {
      const down = p.buttons.map((b) => b.pressed);
      const y = p.axes[1] ?? 0;
      const up = down[12] || y < -0.6;
      const dn = down[13] || y > 0.6;
      const wasUp = padPrev[12] || padPrev[100];
      const wasDn = padPrev[13] || padPrev[101];
      down[100] = y < -0.6;
      down[101] = y > 0.6;
      if (up && !wasUp) { focus = (focus + ids.length - 1) % ids.length; showFocus(); }
      if (dn && !wasDn) { focus = (focus + 1) % ids.length; showFocus(); }
      if (down[0] && !padPrev[0]) buttons.get(ids[focus])?.click();
      if ((down[1] && !padPrev[1]) || (down[9] && !padPrev[9])) { setOpen(false); return; }
      padPrev = down;
    }
    requestAnimationFrame(pollPad);
  }
  function setOpen(open: boolean): void {
    isOpen = open;
    panel.style.display = open ? 'flex' : 'none';
    document.body.dataset.options = open ? 'open' : '';
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      focus = Math.max(0, ids.indexOf(getTune().id));
      showFocus();
      // Buttons already held when it opened (the Start press itself) must not count as new presses.
      const p = firstPad();
      padPrev = p ? p.buttons.map((b) => b.pressed) : [];
      requestAnimationFrame(pollPad);
    }
  }
  const toggle = (): void => setOpen(!isOpen);
  window.addEventListener('gta:options', toggle);
  // Keep touches and clicks on the panel from starting the stick, camera drag or pointer lock underneath, and let it scroll.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  panel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  gear.addEventListener('click', toggle);
  panel.querySelector('.gta-opt-close')?.addEventListener('click', () => setOpen(false));
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    if (e.code === 'KeyO' && !e.repeat) toggle();
  });
  mark();
  return extras;
}
