// The editing panel: pickers for every part of the look, equipment unlocks, the name, save, and the share code.
import { DEFAULT_LOOK, PALETTE, type EquipSlot, type GnomeEquipment, type HairStyle, type Look } from '@lawn/gnome';
import { equipmentCatalog, type AchievementDef } from '@lawn/achievements';
import { prefabIconElement } from '@lawn/prefabs';

export interface EditorState {
  name: string;
  look: Look;
}

/** One emote as the EMOTES section shows it. */
export interface EmoteChoice {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  /** How to get it, e.g. "Bop to Victory (Gnome Front): Win a Conquest match." or "Everyone has this one." */
  hint: string;
}

/**
 * The parts of the panel, top to bottom. SAVE and the status line are always shown.
 * name: NAME input. guide: "Make your gnome stand out" tips. colours: HAT, SHIRT, PANTS, BOOTS. skin: SKIN.
 * hair: HAIR STYLE, HAIR colour and BEARD colour. toggles: FRECKLES, DRESS, GLASSES. equipment: gear per slot.
 * emotes: the emote loadout. share: SHARE CODE and IMPORT A CODE.
 */
export type EditorSection = 'name' | 'guide' | 'colours' | 'skin' | 'hair' | 'toggles' | 'equipment' | 'emotes' | 'share';
export const ALL_EDITOR_SECTIONS: readonly EditorSection[] = ['name', 'guide', 'colours', 'skin', 'hair', 'toggles', 'equipment', 'emotes', 'share'];

/** One hair style button as the HAIR section shows it. */
export interface HairStyleChoice {
  id: HairStyle;
  label: string;
  /** Owned styles can be picked; others show a lock and `price`. */
  owned: boolean;
  /** Shown on a locked button, e.g. "🌰 150" or "Salon". */
  price?: string;
}

export interface EditorOptions {
  /** Which sections to show (default ALL_EDITOR_SECTIONS). */
  sections?: readonly EditorSection[];
  /** Panel heading (default 'GNOME CREATOR'). */
  title?: string;
  /** When set, a "✕ CLOSE" button replaces the "BACK TO THE ARCADE" link and calls this. */
  onClose?: () => void;
  /** Label of the SAVE button (default 'SAVE'). */
  saveLabel?: string;
}

export interface EditorCallbacks {
  /** Every edit (a colour, a toggle, typing in the name). Used for the live preview. */
  onChange(s: EditorState): void;
  /** The SAVE button. */
  onSave(s: EditorState): void;
  /** The IMPORT button with the text in the share-code field. */
  onImport(code: string): void;
  /** The equipped emotes changed (capped at 4, in order). */
  onEmotesChange(ids: string[]): void;
  /** An emote button was tapped: play it on the preview. */
  onEmotePreview(id: string): void;
  /** A locked hair style was tapped (the salon offers to buy it). */
  onHairStyleLocked?(id: HairStyle): void;
}

export interface Editor {
  /** Replaces what the panel shows (does not call onChange). */
  setState(s: EditorState): void;
  /** Updates which achievement IDs are unlocked so equipment buttons enable/disable. */
  setUnlocked(ids: ReadonlySet<string>): void;
  /** Shows every emote and which are equipped. Calls no callbacks. */
  setEmotes(choices: readonly EmoteChoice[], equipped: readonly string[]): void;
  /** The text shown in the share-code field. */
  setShareCode(code: string): void;
  /** A line under the buttons: text '' clears it; bad = true shows it as an error. */
  setStatus(text: string, bad?: boolean): void;
  /** The HAIR STYLE buttons (owned and locked). Calls no callbacks. */
  setHairStyles(choices: readonly HairStyleChoice[]): void;
  /** Removes the panel from the page. */
  dispose(): void;
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
.ge-eq-slot { margin-top: 8px; }
.ge-eq-slot-lbl { display: block; font-size: 10px; letter-spacing: 1px; color: #b7ceb7; margin-bottom: 4px; }
.ge-eq-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.ge-eq {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 6px;
  background: rgba(255,255,255,0.1); color: #fff; border: 2px solid rgba(255,255,255,0.35);
  font: inherit; font-size: 11px; cursor: pointer; text-align: left;
}
.ge-eq.sel { border-color: #ffd54f; background: rgba(255, 213, 79, 0.22); }
.ge-eq.locked { opacity: 0.48; cursor: not-allowed; border-style: dashed; }
.ge-eq-lock { font-size: 10px; color: #ffd54f; }
.ge-eq-rare {
  font-size: 9px; font-weight: 700; letter-spacing: 1px; padding: 1px 4px; border-radius: 4px;
  color: #2a1400; background: #ffd54f; border: 1px solid #fff3b0;
}
.ge-guide {
  margin-top: 12px; padding: 10px; box-sizing: border-box; max-width: 100%; border-radius: 8px;
  background: rgba(255, 213, 79, 0.1); border: 1px solid rgba(255, 213, 79, 0.45);
}
.ge-guide h3 { margin: 0 0 6px; font-size: 13px; letter-spacing: 1px; color: #ffd54f; }
.ge-guide ul { margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.4; color: #e6efe6; }
.ge-guide li { margin-top: 4px; overflow-wrap: anywhere; }
.ge-note { font-size: 11px; line-height: 1.35; color: #b7ceb7; margin: 0 0 6px; }
.ge-emo { min-height: 44px; }
.ge-emo-slot { font-weight: 700; font-size: 11px; min-width: 12px; text-align: center; }
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
export function createEditor(parent: HTMLElement, cb: EditorCallbacks, opts: EditorOptions = {}): Editor {
  injectStyle();
  const sections = new Set<EditorSection>(opts.sections ?? ALL_EDITOR_SECTIONS);

  let state: EditorState = { name: '', look: { ...DEFAULT_LOOK } };

  const panel = h('div', 'ge-panel');
  // The page may have pointer listeners of its own; the panel must not reach them.
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());

  /** Appends a section only when it is one of the chosen sections. Call order is the panel order. */
  const add = (id: EditorSection, el: HTMLElement): void => {
    if (sections.has(id)) panel.appendChild(el);
  };

  const swatches: Swatch[] = [];
  const toggles: { el: HTMLButtonElement; key: 'freckles' | 'dress' | 'glasses' }[] = [];
  let unlockedIds: ReadonlySet<string> = new Set();
  const equipButtons: {
    el: HTMLButtonElement;
    slot: EquipSlot;
    prefabId: string | undefined;
    def?: AchievementDef;
  }[] = [];
  let hairStyleButtons: { el: HTMLButtonElement; id: HairStyle }[] = [];

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
    for (const b of hairStyleButtons) b.el.classList.toggle('sel', (state.look.hairStyle ?? 'pigtails') === b.id);
    for (const eq of equipButtons) {
      const current = state.look.equipment?.[eq.slot];
      eq.el.classList.toggle('sel', current === eq.prefabId);
      if (eq.def) {
        const unlocked = unlockedIds.has(eq.def.id);
        eq.el.classList.toggle('locked', !unlocked);
        eq.el.disabled = !unlocked;
        const lockSpan = eq.el.querySelector('.ge-eq-lock');
        if (lockSpan) lockSpan.textContent = unlocked ? '' : '🔒';
      }
    }
  }

  function emit(): void {
    refresh();
    cb.onChange({ name: state.name, look: { ...state.look } });
  }

  // Heading, then either the back link or a close button (heading and button share one row)
  const title = h('h2', undefined, opts.title ?? 'GNOME CREATOR');
  const onClose = opts.onClose;
  if (onClose) {
    const headRow = h('div');
    headRow.style.display = 'flex';
    headRow.style.justifyContent = 'space-between';
    headRow.style.alignItems = 'center';
    headRow.style.gap = '8px';
    const closeBtn = h('button', 'ge-btn', '✕ CLOSE');
    closeBtn.type = 'button';
    closeBtn.style.minHeight = '44px';
    closeBtn.onclick = () => onClose();
    headRow.append(title, closeBtn);
    panel.appendChild(headRow);
  } else {
    const back = h('a', undefined, 'BACK TO THE ARCADE');
    back.href = '../';
    panel.append(title, back);
  }

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
  add('name', nameSec);

  // Guidance: how to make the gnome stand out (plain text, verbatim tips)
  const GUIDE_TIPS = [
    'Pick a hat colour nobody else picks. The hat is the first thing a crowd sees.',
    'Clash on purpose: a bright coat over pants from the other end of the palette looks like nobody else\'s.',
    'Features do the rest: a beard, pigtails, freckles, glasses or a dress. Two gnomes in the same colours look nothing alike with different features.',
    'Gear shows what you have done, so pick the pieces that match your own story, not the first ones you unlock.',
    'RARE gear comes only from the hardest achievements. Earn it, then show it off.',
  ];
  const guide = h('div', 'ge-guide');
  guide.appendChild(h('h3', undefined, 'Make your gnome stand out'));
  const guideList = h('ul');
  for (const tip of GUIDE_TIPS) guideList.appendChild(h('li', undefined, tip));
  guide.appendChild(guideList);
  add('guide', guide);

  // One section per colour part (skin is its own section)
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
    add(sec.key === 'skinRgb' ? 'skin' : 'colours', wrap);
  }

  // HAIR STYLE first (in the salon it is what is for sale, so it must show without scrolling): filled by setHairStyles. Owned styles are picked; locked ones ask the page to sell them.
  const hairStyleWrap = h('div', 'ge-sec');
  hairStyleWrap.appendChild(h('span', 'ge-lbl', 'HAIR STYLE'));
  const hairStyleGrid = h('div', 'ge-eq-grid');
  hairStyleWrap.appendChild(hairStyleGrid);
  add('hair', hairStyleWrap);

  // Hair and beard colours: NONE removes the key (both are optional in Look), then every palette colour
  for (const sec of [
    { key: 'hairRgb' as const, label: 'HAIR' },
    { key: 'beardRgb' as const, label: 'BEARD' },
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
    add('hair', wrap);
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
  add('toggles', togWrap);

  // Equipment (unlocked via @lawn/achievements, rendered with @lawn/prefabs)
  const equipSec = h('div', 'ge-sec');
  equipSec.appendChild(h('span', 'ge-lbl', 'EQUIPMENT (UNLOCK VIA ACHIEVEMENTS)'));
  const EQUIP_SLOTS: { slot: EquipSlot; label: string }[] = [
    { slot: 'head', label: 'HEAD' },
    { slot: 'neck', label: 'NECK' },
    { slot: 'back', label: 'BACK' },
    { slot: 'hand', label: 'HAND' },
  ];
  const setEquip = (slot: EquipSlot, prefabId: string | undefined): void => {
    const nextEq: GnomeEquipment = { ...(state.look.equipment ?? {}) };
    if (prefabId) nextEq[slot] = prefabId;
    else delete nextEq[slot];
    const look: Look = { ...state.look };
    if (Object.keys(nextEq).length > 0) look.equipment = nextEq;
    else delete look.equipment;
    update(look);
  };
  for (const { slot, label } of EQUIP_SLOTS) {
    const items = equipmentCatalog(slot);
    if (items.length === 0) continue;
    const slotWrap = h('div', 'ge-eq-slot');
    slotWrap.appendChild(h('span', 'ge-eq-slot-lbl', label));
    const grid = h('div', 'ge-eq-grid');

    const noneBtn = h('button', 'ge-eq', 'NONE');
    noneBtn.type = 'button';
    noneBtn.onclick = () => setEquip(slot, undefined);
    equipButtons.push({ el: noneBtn, slot, prefabId: undefined });
    grid.appendChild(noneBtn);

    for (const def of items) {
      const reward = def.reward!;
      const btn = h('button', 'ge-eq');
      btn.type = 'button';
      btn.title = `${def.title} (${def.gameTitle}): ${def.description}`;
      const icon = prefabIconElement(reward.prefabId, '🏆', 24);
      const nameSpan = h('span', undefined, reward.label);
      const lockSpan = h('span', 'ge-eq-lock', '🔒');
      if (reward.exclusive === true) {
        btn.title = `${btn.title}\nRare: earned from this achievement only.`;
        btn.append(icon, nameSpan, h('span', 'ge-eq-rare', 'RARE'), lockSpan);
      } else {
        btn.append(icon, nameSpan, lockSpan);
      }
      btn.onclick = () => {
        if (!unlockedIds.has(def.id)) return;
        setEquip(slot, reward.prefabId);
      };
      equipButtons.push({ el: btn, slot, prefabId: reward.prefabId, def });
      grid.appendChild(btn);
    }
    slotWrap.appendChild(grid);
    equipSec.appendChild(slotWrap);
  }
  add('equipment', equipSec);

  // Emotes: up to 4 equipped, saved at once through onEmotesChange (main.ts writes the loadout)
  const MAX_EQUIPPED_EMOTES = 4;
  let emoteChoices: readonly EmoteChoice[] = [];
  let equippedEmotes: string[] = [];
  const emoteSec = h('div', 'ge-sec');
  emoteSec.appendChild(h('span', 'ge-lbl', 'EMOTES (EQUIP UP TO 4)'));
  emoteSec.appendChild(h('p', 'ge-note', 'Tap to try one. Earn more from achievements across the arcade; play them in Club Gnome.'));
  const emoteGrid = h('div', 'ge-eq-grid');
  emoteSec.appendChild(emoteGrid);

  function renderEmotes(): void {
    emoteGrid.replaceChildren();
    for (const c of emoteChoices) {
      const btn = h('button', 'ge-eq ge-emo');
      btn.type = 'button';
      btn.title = c.hint;
      btn.setAttribute('aria-label', c.label);
      const slot = equippedEmotes.indexOf(c.id);
      btn.classList.toggle('sel', slot >= 0);
      btn.classList.toggle('locked', !c.unlocked);
      btn.append(
        h('span', undefined, c.icon),
        h('span', undefined, c.label),
        h('span', 'ge-eq-lock', c.unlocked ? '' : '🔒'),
        h('span', 'ge-emo-slot', slot >= 0 ? String(slot + 1) : ''),
      );
      btn.onclick = () => {
        cb.onEmotePreview(c.id);
        if (!c.unlocked) {
          setStatus(`Locked: ${c.hint}`);
          return;
        }
        if (slot >= 0) {
          equippedEmotes.splice(slot, 1);
        } else if (equippedEmotes.length < MAX_EQUIPPED_EMOTES) {
          equippedEmotes.push(c.id);
        } else {
          setStatus('You can equip 4 emotes. Tap one of yours to take it off.', true);
          return;
        }
        renderEmotes();
        cb.onEmotesChange([...equippedEmotes]);
      };
      emoteGrid.appendChild(btn);
    }
  }
  add('emotes', emoteSec);

  // SAVE
  const saveBtn = h('button', 'ge-btn wide', opts.saveLabel ?? 'SAVE');
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
  add('share', shareSec);

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
  add('share', importSec);

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
    setUnlocked(ids: ReadonlySet<string>) {
      unlockedIds = ids;
      refresh();
    },
    setEmotes(choices: readonly EmoteChoice[], equipped: readonly string[]) {
      emoteChoices = choices.slice();
      equippedEmotes = equipped.slice(0, MAX_EQUIPPED_EMOTES);
      renderEmotes();
    },
    setShareCode(code: string) {
      codeInput.value = code;
    },
    setStatus,
    setHairStyles(choices: readonly HairStyleChoice[]) {
      hairStyleGrid.replaceChildren();
      hairStyleButtons = [];
      for (const choice of choices) {
        const btn = h('button', 'ge-eq');
        btn.type = 'button';
        btn.style.minHeight = '44px';
        btn.classList.toggle('locked', !choice.owned);
        btn.append(h('span', undefined, choice.label));
        if (!choice.owned) btn.append(h('span', 'ge-eq-lock', `🔒 ${choice.price ?? ''}`));
        btn.onclick = () => {
          if (!choice.owned) {
            cb.onHairStyleLocked?.(choice.id);
            return;
          }
          const look: Look = { ...state.look };
          if (choice.id === 'pigtails') delete look.hairStyle;
          else look.hairStyle = choice.id;
          if (look.hairRgb === undefined) look.hairRgb = PALETTE[18]; // a hair brown, so the style shows
          update(look);
        };
        hairStyleButtons.push({ el: btn, id: choice.id });
        hairStyleGrid.appendChild(btn);
      }
      refresh();
    },
    dispose() {
      panel.remove();
    },
  };
}
