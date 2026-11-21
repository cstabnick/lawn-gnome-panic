import type { Swatch } from '@lawn/prefabs';
import { gnomeokemonIcon, type GnomeokemonElement, type GnomeokemonEntry } from './prefabs/registry';

export const ELEMENT_META: Record<GnomeokemonElement, { label: string; color: string; bg: string }> = {
  bloom: { label: 'Bloom', color: '#8ae278', bg: '#274523' },
  sun: { label: 'Sun', color: '#ffae42', bg: '#4a2b17' },
  rain: { label: 'Rain', color: '#64c8ff', bg: '#1a384d' },
  clay: { label: 'Clay', color: '#e69b73', bg: '#472c21' },
  iron: { label: 'Iron', color: '#c4d0db', bg: '#2f3942' },
};

export const TINT_SWATCHES: readonly Swatch[] = [
  'moss', 'leaf', 'terracotta', 'flame', 'glaze-blue', 'glaze-green',
  'red', 'blue', 'yellow', 'purple', 'gold', 'ruby', 'amethyst', 'chalk', 'black',
];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: Partial<CSSStyleDeclaration> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function makeBadge(element: GnomeokemonElement): HTMLElement {
  const meta = ELEMENT_META[element];
  return el(
    'span',
    {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.03em',
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.color}44`,
    },
    meta.label,
  );
}

export function makeIconImg(entry: GnomeokemonEntry, px: number, tint?: Swatch | number): HTMLElement {
  const url = gnomeokemonIcon(entry, { size: px * 2, tint });
  if (!url) {
    return el(
      'div',
      { width: `${px}px`, height: `${px}px`, display: 'grid', placeItems: 'center', fontSize: `${Math.round(px * 0.5)}px` },
      entry.prefab.emoji[0] ?? '❓',
    );
  }
  const img = el('img', { width: `${px}px`, height: `${px}px`, display: 'block', objectFit: 'contain' });
  img.src = url;
  img.alt = entry.prefab.name;
  return img;
}

/** Gutter every docked panel uses, so the panes line up when you walk from room to room. */
export const PANE_PAD = '18px';

/**
 * The header every docked panel opens with: the room's name as an eyebrow, the panel's title, and an optional one-line
 * hint. Same type scale everywhere; put extra controls beside it in a row of your own.
 */
export function paneHead(p: { eyebrow: string; title: string; hint?: string }): HTMLElement {
  const head = el('div', { minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' });
  head.append(
    el('div', { fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }, p.eyebrow),
    el('h2', { margin: '0', fontSize: '22px', lineHeight: '1.15', letterSpacing: '-0.01em' }, p.title),
  );
  if (p.hint) head.append(el('div', { marginTop: '2px', fontSize: '13px', color: 'var(--dim)', lineHeight: '1.45' }, p.hint));
  return head;
}

export function makeBtn(label: string, onClick: () => void, active = false): HTMLButtonElement {
  const b = el(
    'button',
    {
      minHeight: '44px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
      background: active ? 'var(--panel-2)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--ink)',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
    },
    label,
  );
  b.type = 'button';
  b.onclick = onClick;
  return b;
}

