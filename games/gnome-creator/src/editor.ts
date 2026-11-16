// The editing panel: pickers for every part of the look, the name, save, and the share code.
import { DEFAULT_LOOK, PALETTE, type Look } from '@lawn/gnome';

export interface EditorState {
  name: string;
  look: Look;
}

export interface EditorCallbacks {
  /** Every edit (a colour, a toggle, typing in the name). Used for the live preview. */
  onChange(s: EditorState): void;
  /** The SAVE button. */
  onSave(s: EditorState): void;
  /** The IMPORT button with the text in the share-code field. */
  onImport(code: string): void;
}

export interface Editor {
  /** Replaces what the panel shows (does not call onChange). */
  setState(s: EditorState): void;
  /** The text shown in the share-code field. */
  setShareCode(code: string): void;
  /** A line under the buttons: text '' clears it; bad = true shows it as an error. */
  setStatus(text: string, bad?: boolean): void;
}

// Injected once. Landscape: a right-hand column. Portrait: a bottom sheet, so the preview stays visible above it.
const CSS = `
.ge-panel {
  position: fixed; top: 0; right: 0; bottom: 0; width: 340px; box-sizing: border-box;
  overflow-y: auto; padding: 14px; pointer-events: auto; color: #fff; font-family: inherit;
  background: rgba(20,30,20,0.86);
}
@media (max-aspect-ratio: 1/1) {
  .ge-panel { top: auto; left: 0; right: 0; bottom: 0; width: auto; height: 52vh; }
}
.ge-panel h2 { margin: 0 0 8px; font-size: 20px; letter-spacing: 1px; }
.ge-panel a { color: #fff; font-size: 12px; }
.ge-sec { margin-top: 12px; }
.ge-lbl { display: block; font-size: 12px; letter-spacing: 1px; margin-bottom: 4px; }
.ge-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.ge-sw {
  width: 28px; height: 28px; min-width: 28px; box-sizing: border-box; padding: 0;
  border-radius: 50%; border: 2px solid rgba(0,0,0,0.4); cursor: pointer;
}
.ge-sw.sel { outline: 3px solid #fff; outline-offset: 1px; }
.ge-none {
  width: auto; border-radius: 6px; padding: 0 8px; background: rgba(255,255,255,0.12);
  color: #fff; font: inherit; font-size: 11px; letter-spacing: 1px;
}
.ge-row { display: flex; gap: 6px; }
.ge-btn, .ge-tog {
  font: inherit; font-size: 12px; letter-spacing: 1px; padding: 8px 10px; border-radius: 6px; cursor: pointer;
  background: rgba(255,255,255,0.12); color: #fff; border: 2px solid rgba(255,255,255,0.5);
}
.ge-btn.wide { width: 100%; box-sizing: border-box; margin-top: 8px; }
.ge-tog.on { background: #ffd54f; color: #2a1400; border-color: #ffd54f; }
.ge-input {
  flex: 1; min-width: 0; box-sizing: border-box; font: inherit; font-size: 14px; padding: 7px 8px;
  border-radius: 6px; background: rgba(0,0,0,0.35); color: #fff; border: 2px solid rgba(255,255,255,0.5);
}
.ge-status { min-height: 1.2em; margin-top: 8px; font-size: 12px; color: #c8f7c8; }
`;

const COLOUR_SECTIONS: { key: 'hatRgb' | 'coatRgb' | 'pantsRgb' | 'bootsRgb' | 'skinRgb'; label: string; colours: readonly number[] }[] = [
  { key: 'hatRgb', label: 'HAT', colours: PALETTE },
  { key: 'coatRgb', label: 'SHIRT', colours: PALETTE },
  { key: 'pantsRgb', label: 'PANTS', colours: PALETTE },
  { key: 'bootsRgb', label: 'BOOTS', colours: PALETTE },
  // Skin tones are the first 8 palette entries only.
  { key: 'skinRgb', label: 'SKIN', colours: PALETTE.slice(0, 8) },
];

/** A colour button and the value it stands for (undefined for the NONE button). */
interface Swatch {
  el: HTMLButtonElement;
  value: number | undefined;
  get: () => number | undefined;
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function hex(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function injectStyle(): void {
  if (document.getElementById('ge-style')) return;
  const style = h('style');
  style.id = 'ge-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** Appends the panel to parent (the page's #ui; never restyle or hide #ui itself). */
export function createEditor(parent: HTMLElement, cb: EditorCallbacks): Editor {
  injectStyle();

  let state: EditorState = { name: '', look: { ...DEFAULT_LOOK } };

  const panel = h('div', 'ge-panel');
  // The page may have pointer listeners of its own; the panel must not reach them.
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());

  const swatches: Swatch[] = [];
  const toggles: { el: HTMLButtonElement; key: 'freckles' | 'dress' | 'glasses' }[] = [];

  /** Replaces the look with next and tells the page. */
  function update(next: Look): void {
    state = { name: state.name, look: next };
    emit();
  }

  /** Re-applies the sel/on classes from the current state. */
  function refresh(): void {
    for (const s of swatches) {
      const current = s.get();
      s.el.classList.toggle('sel', current === s.value);
    }
    for (const t of toggles) t.el.classList.toggle('on', state.look[t.key]);
  }

  function emit(): void {
    refresh();
    cb.onChange({ name: state.name, look: { ...state.look } });
  }

  // Heading and back link
  const title = h('h2', undefined, 'GNOME CREATOR');
  const back = h('a', undefined, 'BACK TO THE ARCADE');
  back.href = '../';
  panel.append(title, back);

  // Name
  const nameSec = h('div', 'ge-sec');
  const nameLbl = h('label', 'ge-lbl', 'NAME');
  const nameInput = h('input', 'ge-input');
  nameInput.type = 'text';
  nameInput.maxLength = 18;
  nameInput.autocomplete = 'off';
  nameLbl.htmlFor = 'ge-name';
  nameInput.id = 'ge-name';
  nameInput.addEventListener('keydown', (e) => e.stopPropagation()); // typing must not trigger game keys
  nameInput.addEventListener('input', () => {
    state = { name: nameInput.value, look: state.look };
    emit();
  });
  nameSec.append(nameLbl, nameInput);
  panel.appendChild(nameSec);

  // One section per colour part
  const addColourButton = (grid: HTMLElement, value: number | undefined, get: () => number | undefined, onPick: () => void, label: string, text?: string): void => {
    const btn = h('button', text !== undefined ? 'ge-sw ge-none' : 'ge-sw', text);
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    if (text === undefined) btn.style.background = label;
    btn.onclick = onPick;
    swatches.push({ el: btn, value, get });
    grid.appendChild(btn);
  };

  for (const sec of COLOUR_SECTIONS) {
    const wrap = h('div', 'ge-sec');
    wrap.appendChild(h('span', 'ge-lbl', sec.label));
    const grid = h('div', 'ge-grid');
    for (const c of sec.colours) {
      addColourButton(grid, c, () => state.look[sec.key], () => update({ ...state.look, [sec.key]: c }), hex(c));
    }
    wrap.appendChild(grid);
    panel.appendChild(wrap);
  }

  // Beard and hair: NONE removes the key (both are optional in Look), then every palette colour
  for (const sec of [
    { key: 'beardRgb' as const, label: 'BEARD' },
    { key: 'hairRgb' as const, label: 'HAIR' },
  ]) {
    const wrap = h('div', 'ge-sec');
    wrap.appendChild(h('span', 'ge-lbl', sec.label));
    const grid = h('div', 'ge-grid');
    addColourButton(grid, undefined, () => state.look[sec.key], () => {
      const look: Look = { ...state.look };
      delete look[sec.key];
      update(look);
    }, 'none', 'NONE');
    for (const c of PALETTE) {
      addColourButton(grid, c, () => state.look[sec.key], () => update({ ...state.look, [sec.key]: c }), hex(c));
    }
    wrap.appendChild(grid);
    panel.appendChild(wrap);
  }

  // Toggles
  const togWrap = h('div', 'ge-sec ge-row');
  const TOGGLE_DEFS: { key: 'freckles' | 'dress' | 'glasses'; label: string }[] = [
    { key: 'freckles', label: 'FRECKLES' },
    { key: 'dress', label: 'DRESS' },
    { key: 'glasses', label: 'GLASSES' },
  ];
  for (const t of TOGGLE_DEFS) {
    const btn = h('button', 'ge-tog', t.label);
    btn.type = 'button';
    btn.onclick = () => {
      const look: Look = { ...state.look };
      look[t.key] = !look[t.key];
      update(look);
    };
    toggles.push({ el: btn, key: t.key });
    togWrap.appendChild(btn);
  }
  panel.appendChild(togWrap);

  // SAVE
  const saveBtn = h('button', 'ge-btn wide', 'SAVE');
  saveBtn.type = 'button';
  saveBtn.onclick = () => cb.onSave({ name: state.name, look: { ...state.look } });
  panel.appendChild(saveBtn);

  // Share code (read-only) with COPY
  const shareSec = h('div', 'ge-sec');
  shareSec.appendChild(h('span', 'ge-lbl', 'SHARE CODE'));
  const shareRow = h('div', 'ge-row');
  const codeInput = h('input', 'ge-input');
  codeInput.type = 'text';
  codeInput.readOnly = true;
  codeInput.autocomplete = 'off';
  const copyBtn = h('button', 'ge-btn', 'COPY');
  copyBtn.type = 'button';
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(codeInput.value);
      setStatus('Copied.');
    } catch {
      // No clipboard permission here: select the code so the player can copy it by hand.
      codeInput.select();
    }
  };
  shareRow.append(codeInput, copyBtn);
  shareSec.appendChild(shareRow);
  panel.appendChild(shareSec);

  // Import
  const importSec = h('div', 'ge-sec');
  importSec.appendChild(h('span', 'ge-lbl', 'IMPORT A CODE'));
  const importRow = h('div', 'ge-row');
  const importInput = h('input', 'ge-input');
  importInput.type = 'text';
  importInput.autocomplete = 'off';
  importInput.spellcheck = false;
  importInput.addEventListener('keydown', (e) => e.stopPropagation());
  const importBtn = h('button', 'ge-btn', 'IMPORT');
  importBtn.type = 'button';
  importBtn.onclick = () => cb.onImport(importInput.value);
  importRow.append(importInput, importBtn);
  importSec.appendChild(importRow);
  panel.appendChild(importSec);

  // Status line
  const statusEl = h('div', 'ge-status');
  panel.appendChild(statusEl);

  function setStatus(text: string, bad = false): void {
    statusEl.textContent = text;
    statusEl.style.color = bad ? '#ffb3b3' : '#c8f7c8';
  }

  nameInput.value = state.name;
  refresh();
  parent.appendChild(panel);

  return {
    setState(s: EditorState) {
      state = { name: s.name, look: { ...s.look } };
      nameInput.value = state.name;
      refresh();
    },
    setShareCode(code: string) {
      codeInput.value = code;
    },
    setStatus,
  };
}
