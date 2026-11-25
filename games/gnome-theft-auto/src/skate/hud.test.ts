// The skateboard HUD and its input reader. Node has no DOM, so this file brings a tiny element stand-in (as golf/hud.test.ts does).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ComboView } from '@lawn/trickboard';
import type { InputState } from '../types';
import { createSkateHud, createSkateInputReader, type SkateTouch } from './hud';

class FakeEl {
  children: FakeEl[] = [];
  parent: FakeEl | null = null;
  style: Record<string, string> = {};
  id = '';
  private _text = '';
  private listeners: Record<string, Array<(e: unknown) => void>> = {};
  constructor(readonly tagName: string) {
    // style.cssText = 'a:b; c:d' fills the style map, as a browser does.
    Object.defineProperty(this.style, 'cssText', {
      configurable: true,
      set: (css: string) => {
        for (const decl of css.split(';')) {
          const i = decl.indexOf(':');
          if (i > 0) this.style[decl.slice(0, i).trim().replace(/-(\w)/g, (_, c: string) => c.toUpperCase())] = decl.slice(i + 1).trim();
        }
      },
    });
  }
  get textContent(): string {
    return this._text;
  }
  set textContent(v: string) {
    this._text = v;
    if (v === '') this.children = [];
  }
  appendChild(c: FakeEl): FakeEl {
    c.parent = this;
    this.children.push(c);
    return c;
  }
  remove(): void {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((x) => x !== this);
    this.parent = null;
  }
  addEventListener(type: string, fn: (e: unknown) => void): void {
    (this.listeners[type] ??= []).push(fn);
  }
  fire(type: string): void {
    const ev = { preventDefault() {}, stopPropagation() {} };
    for (const fn of this.listeners[type] ?? []) fn(ev);
  }
  text(): string {
    return this.textContent + this.children.map((c) => c.text()).join(' ');
  }
  all(pred: (e: FakeEl) => boolean): FakeEl[] {
    const out: FakeEl[] = pred(this) ? [this] : [];
    for (const c of this.children) out.push(...c.all(pred));
    return out;
  }
}

const g = globalThis as { document?: unknown };
let savedDoc: unknown;

beforeAll(() => {
  savedDoc = g.document;
  g.document = { createElement: (tag: string) => new FakeEl(tag) };
});

afterAll(() => {
  if (savedDoc === undefined) delete g.document;
  else g.document = savedDoc;
});

function input(over: Partial<InputState> = {}): InputState {
  return { moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false,
    radio: false, camYaw: 0, camPitch: 0, ...over };
}

const noTouch: SkateTouch = { olliePressed: false, flipPressed: false, grabHeld: false };

function combo(over: Partial<ComboView> = {}): ComboView {
  return { lines: [], points: 0, mult: 0, linkLeft: 0, total: 0, best: 0, last: null, ...over };
}

function setup(): { ui: FakeEl; hud: ReturnType<typeof createSkateHud>; box: FakeEl } {
  const ui = new FakeEl('div');
  const hud = createSkateHud(ui as unknown as HTMLElement);
  return { ui, hud, box: ui.children[0]! };
}

function button(root: FakeEl, label: string): FakeEl {
  const hit = root.all((e) => e.tagName === 'button' && e.textContent === label)[0];
  if (!hit) throw new Error('no button ' + label);
  return hit;
}

describe('skate input reader', () => {
  it('maps the stick to push, brake and steer', () => {
    const r = createSkateInputReader();
    const pushed = r.read(input({ moveX: 0.4, moveY: 0.8 }), input({ moveX: 0.4, moveY: 0.8 }), noTouch);
    expect(pushed.steer).toBe(0.4);
    expect(pushed.push).toBeCloseTo(0.8);
    expect(pushed.brake).toBe(0);
    expect(pushed.stick).toEqual({ x: 0, y: 0 });
    const braked = r.read(input({ moveY: -0.5 }), input({ moveY: -0.5 }), noTouch);
    expect(braked.brake).toBeCloseTo(0.5);
    expect(braked.push).toBe(0);
  });

  it('gives the stick (clamped to the unit disc) only while a trick button is held, with no push or brake', () => {
    const r = createSkateInputReader();
    const held = r.read(input({ moveX: 0.9, moveY: 0.9, fire: true }), input({ moveX: 0.9, moveY: 0.9, fire: true }), noTouch);
    expect(held.push).toBe(0);
    expect(held.brake).toBe(0);
    expect(Math.hypot(held.stick.x, held.stick.y)).toBeCloseTo(1);
    const grabbing = r.read(input({ moveX: 0.3, moveY: 0.2 }), input({ moveX: 0.3, moveY: 0.2, aim: true }), noTouch);
    expect(grabbing.stick).toEqual({ x: 0.3, y: 0.2 });
    const touchHeld = r.read(input({ moveY: 0.6 }), input({ moveY: 0.6 }), { ...noTouch, grabHeld: true });
    expect(touchHeld.push).toBe(0);
    expect(touchHeld.stick.y).toBeCloseTo(0.6);
  });

  it('makes flip an edge: once per press of fire, and a touch flip once', () => {
    const r = createSkateInputReader();
    const first = r.read(input({ fire: true }), input({ fire: true }), noTouch);
    expect(first.flip).toBe(true);
    const held = r.read(input({ fire: true }), input({ fire: true }), noTouch);
    expect(held.flip).toBe(false);
    r.read(input(), input(), noTouch);
    expect(r.read(input({ fire: true }), input({ fire: true }), noTouch).flip).toBe(true);
    expect(r.read(input(), input(), { ...noTouch, flipPressed: true }).flip).toBe(true);
  });

  it('takes ollie from jump or the touch button, and grab from aim or the touch hold', () => {
    const r = createSkateInputReader();
    expect(r.read(input({ jump: true }), input({ jump: true }), noTouch).ollie).toBe(true);
    expect(r.read(input(), input(), { ...noTouch, olliePressed: true }).ollie).toBe(true);
    expect(r.read(input(), input(), noTouch).ollie).toBe(false);
    expect(r.read(input(), input({ aim: true }), noTouch).grab).toBe(true);
    expect(r.read(input(), input(), { ...noTouch, grabHeld: true }).grab).toBe(true);
    expect(r.read(input(), input(), noTouch).grab).toBe(false);
  });
});

describe('skate HUD', () => {
  it('creates one #skate-hud container under ui, hidden until show', () => {
    const { ui, hud, box } = setup();
    expect(ui.children.length).toBe(1);
    expect(box.id).toBe('skate-hud');
    expect(box.style.display).toBe('none');
    hud.show(true);
    expect(box.style.display).toBe('block');
    hud.show(false);
    expect(box.style.display).toBe('none');
  });

  it('shows the trick names joined (last four) and the points times the multiplier', () => {
    const { hud, box } = setup();
    hud.setCombo(combo({
      lines: ['Ollie', 'Kickflip', 'Indy 1.2s', 'Varial Heelflip', 'Nightmare Flip'],
      points: 1250, mult: 3, linkLeft: 0.7,
    }), 10);
    const text = box.text();
    expect(text).toContain('Kickflip + Indy 1.2s + Varial Heelflip + Nightmare Flip');
    expect(text).not.toContain('Ollie + Kickflip');
    expect(text).toContain('1,250 x 3');
  });

  it('shows LANDED with points in green and BAILED in red, fading after the hold', () => {
    const { hud, box } = setup();
    hud.setCombo(combo({ lines: ['Kickflip'], points: 3750, mult: 1, last: { text: 'Kickflip', points: 3750, t: 5, kind: 'landed' } }), 5.2);
    expect(box.text()).toContain('LANDED 3,750');
    const big = box.all((e) => e.textContent === 'LANDED 3,750')[0]!;
    expect(big.style.color).toBe('#7dff9a');
    expect(big.style.opacity).toBe('1');
    hud.setCombo(combo({ last: { text: 'Kickflip', points: 3750, t: 5, kind: 'landed' } }), 9);
    expect(big.style.opacity).toBe('0');
    hud.setCombo(combo({ last: { text: 'Kickflip', points: 0, t: 5, kind: 'bailed' } }), 5.5);
    const bailed = box.all((e) => e.textContent === 'BAILED')[0]!;
    expect(bailed.style.color).toBe('#ff5a5a');
  });

  it('sets the line and info strips, and hides the line when it is null', () => {
    const { hud, box } = setup();
    hud.setLine('First Push  gate 2/3  12.4 s');
    hud.setInfo('18 km/h  best combo 2,450');
    expect(box.text()).toContain('First Push  gate 2/3  12.4 s');
    expect(box.text()).toContain('18 km/h  best combo 2,450');
    const lineEl = box.all((e) => e.textContent === 'First Push  gate 2/3  12.4 s')[0]!;
    expect(lineEl.style.display).toBe('block');
    hud.setLine(null);
    expect(lineEl.style.display).toBe('none');
  });

  it('GRAB holds until pointerup, and touch() clears the one-shot flags', () => {
    const { hud, box } = setup();
    button(box, 'GRAB').fire('pointerdown');
    expect(hud.touch().grabHeld).toBe(true);
    expect(hud.touch().grabHeld).toBe(true);
    button(box, 'GRAB').fire('pointerup');
    expect(hud.touch().grabHeld).toBe(false);

    button(box, 'OLLIE').fire('pointerdown');
    button(box, 'FLIP').fire('pointerdown');
    const first = hud.touch();
    expect(first.olliePressed).toBe(true);
    expect(first.flipPressed).toBe(true);
    const second = hud.touch();
    expect(second.olliePressed).toBe(false);
    expect(second.flipPressed).toBe(false);
  });

  it('dispose removes the container', () => {
    const { ui, hud } = setup();
    hud.dispose();
    expect(ui.children.length).toBe(0);
  });
});
