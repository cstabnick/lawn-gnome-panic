import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActionDock } from './actionDock';

interface FakeNode {
  tagName: string;
  id: string;
  className: string;
  textContent: string | null;
  title: string;
  type: string;
  children: FakeNode[];
  parent: FakeNode | null;
  attributes: Record<string, string>;
  listeners: Record<string, ((e: { key?: string; target?: unknown; stopPropagation: () => void }) => void)[]>;
  classList: {
    set: Set<string>;
    toggle(cls: string, force?: boolean): boolean;
    contains(cls: string): boolean;
  };
  setAttribute(k: string, v: string): void;
  getAttribute(k: string): string | undefined;
  addEventListener(type: string, fn: (e: { key?: string; target?: unknown; stopPropagation: () => void }) => void): void;
  dispatch(type: string, event?: Partial<{ key: string; target: unknown }>): void;
  append(...nodes: FakeNode[]): void;
  appendChild(node: FakeNode): FakeNode;
  insertBefore(node: FakeNode, ref: FakeNode | null): FakeNode;
  contains(node: unknown): boolean;
}

function makeFakeElement(tag: string): FakeNode {
  const classSet = new Set<string>();
  const node: FakeNode = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    textContent: null,
    title: '',
    type: '',
    children: [],
    parent: null,
    attributes: {},
    listeners: {},
    classList: {
      set: classSet,
      toggle(cls: string, force?: boolean): boolean {
        const next = force === undefined ? !classSet.has(cls) : force;
        if (next) classSet.add(cls);
        else classSet.delete(cls);
        node.className = [...classSet].join(' ');
        return next;
      },
      contains(cls: string): boolean {
        return classSet.has(cls);
      },
    },
    setAttribute(k: string, v: string) {
      node.attributes[k] = v;
    },
    getAttribute(k: string) {
      return node.attributes[k];
    },
    addEventListener(type, fn) {
      (node.listeners[type] ??= []).push(fn);
    },
    dispatch(type, event = {}) {
      const ev = { stopPropagation: () => {}, ...event };
      for (const fn of node.listeners[type] ?? []) fn(ev);
    },
    append(...nodes: FakeNode[]) {
      for (const n of nodes) node.appendChild(n);
    },
    appendChild(child: FakeNode) {
      child.parent = node;
      node.children.push(child);
      return child;
    },
    insertBefore(child: FakeNode, ref: FakeNode | null) {
      child.parent = node;
      const idx = ref ? node.children.indexOf(ref) : -1;
      if (idx >= 0) node.children.splice(idx, 0, child);
      else node.children.push(child);
      return child;
    },
    contains(other: unknown) {
      if (other === node) return true;
      return node.children.some((c) => c.contains(other));
    },
  };
  return node;
}

describe('createActionDock', () => {
  const origDoc = globalThis.document;
  const origWin = globalThis.window;

  beforeEach(() => {
    const head = makeFakeElement('head');
    const byId = new Map<string, FakeNode>();
    const fakeDoc = {
      head,
      createElement(tag: string) {
        const el = makeFakeElement(tag);
        return new Proxy(el, {
          set(target, prop, value) {
            (target as unknown as Record<string | symbol, unknown>)[prop] = value;
            if (prop === 'id' && typeof value === 'string' && value) byId.set(value, target);
            if (prop === 'className' && typeof value === 'string') {
              target.classList.set.clear();
              for (const c of value.split(/\s+/).filter(Boolean)) target.classList.set.add(c);
            }
            return true;
          },
        });
      },
      getElementById(id: string) {
        return byId.get(id) ?? null;
      },
    };
    const fakeWin = { addEventListener: vi.fn() };
    (globalThis as unknown as { document: unknown }).document = fakeDoc;
    (globalThis as unknown as { window: unknown }).window = fakeWin;
  });

  afterEach(() => {
    (globalThis as unknown as { document: unknown }).document = origDoc;
    (globalThis as unknown as { window: unknown }).window = origWin;
  });

  it('orders play buttons before the separator and system buttons after it', () => {
    const ui = makeFakeElement('div') as unknown as HTMLElement;
    const dock = createActionDock(ui);
    const onCraft = vi.fn();
    const onWorlds = vi.fn();

    dock.addButton({ id: 'dayg-craft-btn', label: 'Craft', title: 'Crafting', group: 'play', onClick: onCraft });
    dock.addButton({ id: 'dayg-room-open', label: 'Worlds', title: 'Worlds', group: 'system', onClick: onWorlds });

    const root = dock.root as unknown as FakeNode;
    const bar = root.children[1];
    expect(bar.children.map((c) => c.id || c.className)).toEqual([
      'dayg-craft-btn',
      'dg-dock-sep',
      'dayg-room-open',
    ]);
  });

  it('toggles mobile menu and closes it when a button is clicked or dock is hidden', () => {
    const ui = makeFakeElement('div') as unknown as HTMLElement;
    const dock = createActionDock(ui);
    const onClick = vi.fn();
    const btn = dock.addButton({ id: 'dayg-craft-btn', label: 'Craft', title: 'Crafting', group: 'play', onClick }) as unknown as FakeNode;

    const root = dock.root as unknown as FakeNode;
    const toggle = root.children[0];

    toggle.dispatch('click');
    expect(root.classList.contains('dg-dock-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    btn.dispatch('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(root.classList.contains('dg-dock-open')).toBe(false);

    toggle.dispatch('click');
    expect(root.classList.contains('dg-dock-open')).toBe(true);
    dock.setVisible(false);
    expect(root.classList.contains('dg-dock-hidden')).toBe(true);
    expect(root.classList.contains('dg-dock-open')).toBe(false);

    dock.setVisible(true);
    expect(root.classList.contains('dg-dock-hidden')).toBe(false);
  });
});
