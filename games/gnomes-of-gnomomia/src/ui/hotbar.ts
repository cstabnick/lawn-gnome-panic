// Action bar: 8 square slots bottom-centre. Left-click uses a slot; right-click opens a menu to assign one.
import { TUNING, UI, type SpellDef, type SpellId } from '../config';
import { abilityCooldown, knownAbilities, resource, useHotbar } from '../abilities';
import { spellCooldown } from '../combat';
import { SPELLS } from '../data/core';
import { bus } from '../events';
import { state } from '../state';
import { showContextMenu } from './hud';

const SLOT_COUNT = 8;
const SLOT_PX = 40;

interface Slot {
  el: HTMLDivElement;
  icon: HTMLDivElement;
  shade: HTMLDivElement;
  tint: HTMLDivElement;
  shownIcon: string;
}

let bar: HTMLDivElement;
const slots: Slot[] = [];

/** What a hotbar entry shows: a spell (Flare, Mend) or a known ability. */
interface SlotInfo { name: string; icon: string; cost: number; remaining: number; total: number }

function make<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement | null, tag: K, css: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  parent?.appendChild(node);
  return node;
}

/** Resolves a hotbar entry id to its icon, cost and cooldown; null for an unknown id. */
function describe(id: string): SlotInfo | null {
  const spell: SpellDef | undefined = SPELLS[id as SpellId];
  if (spell) {
    // Spells share one global cooldown.
    return { name: spell.name, icon: spell.icon, cost: spell.cost, remaining: spellCooldown(), total: TUNING.spellCooldownSeconds };
  }
  const ability = knownAbilities().find((a) => a.id === id);
  if (ability) {
    return { name: ability.name, icon: ability.icon, cost: ability.cost, remaining: abilityCooldown(id), total: ability.cooldown };
  }
  return null;
}

/** Positions the bar: above the chat box on narrow screens, which the chat box fills at the bottom. */
function placeBar(): void {
  bar.style.bottom = innerWidth < 700 ? '104px' : '8px';
}

/** Builds the hotbar inside the shared UI root. Appends its own container; never touches #ui itself. */
export function createHotbar(root: HTMLElement): void {
  bar = make(root, 'div', {
    position: 'absolute', left: '50%', bottom: '8px', transform: 'translateX(-50%)',
    display: 'flex', gap: '4px', padding: '4px', boxSizing: 'border-box',
    background: UI.panelBg, border: `2px solid ${UI.borderLight}`,
    fontFamily: UI.font, pointerEvents: 'auto', userSelect: 'none',
  });
  bar.id = 'hotbar';
  placeBar();
  window.addEventListener('resize', placeBar);

  for (let i = 0; i < SLOT_COUNT; i++) {
    const el = make(bar, 'div', {
      position: 'relative', width: `${SLOT_PX}px`, height: `${SLOT_PX}px`, boxSizing: 'border-box',
      background: '#1a150f', border: `2px solid ${UI.borderLight}`, cursor: 'pointer', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    const num = make(el, 'div', {
      position: 'absolute', left: '2px', top: '0', fontSize: '10px', fontWeight: 'bold',
      color: UI.textDim, textShadow: '1px 1px 0 #000', pointerEvents: 'none',
    });
    num.textContent = String(i + 1);
    const icon = make(el, 'div', { fontSize: '20px', lineHeight: '1', pointerEvents: 'none' });
    const shade = make(el, 'div', {
      position: 'absolute', left: '0', right: '0', top: '0', height: '0%',
      background: 'rgba(0, 0, 0, 0.6)', pointerEvents: 'none',
    });
    const tint = make(el, 'div', {
      position: 'absolute', inset: '0', background: 'rgba(224, 58, 58, 0.4)',
      display: 'none', pointerEvents: 'none',
    });
    const slot: Slot = { el, icon, shade, tint, shownIcon: '' };
    slots.push(slot);

    el.addEventListener('click', () => useHotbar(i));
    el.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      showContextMenu(ev.clientX, ev.clientY, assignOptions(i));
    });
  }
}

/** Menu entries for right-click: every known ability, then Flare and Mend. */
function assignOptions(slot: number) {
  const choices: { id: string; name: string }[] = [
    ...knownAbilities().map((a) => ({ id: a.id, name: a.name })),
    { id: 'flare', name: SPELLS.flare.name },
    { id: 'mend', name: SPELLS.mend.name },
  ];
  return choices.map((c) => ({
    label: `Set ${c.name}`,
    onSelect: () => {
      state.hotbar[slot] = c.id;
      bus.emit('changed', {});
      updateHotbar();
    },
  }));
}

/** Refreshes the hotbar from state. Called every frame from the HUD update. */
export function updateHotbar(): void {
  if (slots.length === 0) return;
  const res = resource();
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = slots[i];
    const id = state.hotbar[i] ?? null;
    const info = id ? describe(id) : null;

    const icon = info?.icon ?? (id ? '?' : '');
    if (slot.shownIcon !== icon) {
      slot.icon.textContent = icon;
      slot.shownIcon = icon;
    }
    slot.el.title = info ? info.name : id ? id : 'Empty slot. Right-click to assign.';

    if (info) {
      const frac = info.total > 0 ? Math.max(0, Math.min(1, info.remaining / info.total)) : 0;
      slot.shade.style.height = `${frac * 100}%`;
      slot.tint.style.display = info.cost > res.value ? '' : 'none';
    } else {
      slot.shade.style.height = '0%';
      slot.tint.style.display = 'none';
    }
  }
}
