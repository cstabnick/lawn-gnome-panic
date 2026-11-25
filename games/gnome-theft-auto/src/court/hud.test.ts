// Drainpipe Court HUD (E19 A5). Node has no DOM, so this file brings a tiny element stand-in (as golf/hud.test.ts does).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { InputState } from '../types';
import { courtControl, createCourtHud } from './hud';
import type { CourtTouch, PickupView } from './types';

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
  /** Setting '' drops the children too, as a browser does. */
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
  setAttribute(): void {}
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

const noTouch: CourtTouch = { shootHeld: false, passPressed: false, turboHeld: false, fakePressed: false, quitPressed: false };

function pickup(over: Partial<PickupView> = {}): PickupView {
  return {
    gnomes: [], ball: { x: 0, y: 1, z: 0 }, score: [4, 6], target: 11, t: 125.7, phase: 'live',
    charge: 0.5, turbo: 40, controlled: 0, ...over,
  };
}

function button(root: FakeEl, label: string): FakeEl {
  const hit = root.all((e) => e.tagName === 'button' && e.textContent === label)[0];
  if (!hit) throw new Error('no button ' + label);
  return hit;
}

function setup(): { ui: FakeEl; hud: ReturnType<typeof createCourtHud>; box: FakeEl } {
  const ui = new FakeEl('div');
  const hud = createCourtHud(ui as unknown as HTMLElement);
  const box = ui.children[0];
  return { ui, hud, box };
}

describe('courtControl', () => {
  it('maps the stick (moveZ = -moveY) and the held and edge inputs', () => {
    const c = courtControl(input({ moveX: 0.5, moveY: 1, boost: true }), noTouch, false);
    expect(c.moveX).toBe(0.5);
    expect(c.moveZ).toBe(-1);
    expect(c.turbo).toBe(true);
    expect(courtControl(input({ moveY: -0.25 }), noTouch, false).moveZ).toBe(0.25);
    expect(Object.is(courtControl(input(), noTouch, false).moveZ, 0)).toBe(true);
  });

  it('gives shoot pressed on the first down frame and released on the first up frame', () => {
    const down = courtControl(input({ fire: true }), noTouch, false);
    expect(down.shootDown).toBe(true);
    expect(down.shootPressed).toBe(true);
    expect(down.shootReleased).toBe(false);
    const held = courtControl(input({ fire: true }), noTouch, true);
    expect(held.shootPressed).toBe(false);
    const up = courtControl(input(), noTouch, true);
    expect(up.shootDown).toBe(false);
    expect(up.shootReleased).toBe(true);
    expect(up.shootPressed).toBe(false);
  });

  it('touch buttons count as the same controls', () => {
    const c = courtControl(input(), { ...noTouch, shootHeld: true, turboHeld: true, passPressed: true, fakePressed: true },
      false);
    expect(c.shootDown).toBe(true);
    expect(c.shootPressed).toBe(true);
    expect(c.turbo).toBe(true);
    expect(c.passPressed).toBe(true);
    expect(c.fakePressed).toBe(true);
    expect(courtControl(input({ jump: true, switchGun: true }), noTouch, false)).toMatchObject({
      passPressed: true, fakePressed: true,
    });
  });
});

describe('court HUD', () => {
  it('creates one #court-hud container under ui, hidden until show', () => {
    const { ui, hud, box } = setup();
    expect(ui.children.length).toBe(1);
    expect(box.id).toBe('court-hud');
    expect(box.style.display).toBe('none');
    hud.show('game');
    expect(box.style.display).toBe('block');
    hud.show('none');
    expect(box.style.display).toBe('none');
  });

  it('show(game) then setGame shows the score and the clock', () => {
    const { hud, box } = setup();
    hud.show('game');
    hud.setGame(pickup(), ['You & Pansy', 'Swish & Lintel']);
    const text = box.text();
    expect(text).toContain('You & Pansy 4 : 6 Swish & Lintel');
    expect(text).toContain('to 11 · 02:05');
  });

  it('shootaround shows its strip with makes, shots and the three flag', () => {
    const { hud, box } = setup();
    hud.show('shootaround');
    hud.setShoot({ charge: 0, makes: 3, shots: 7, three: true });
    expect(box.text()).toContain('Shootaround 3/7 - three!');
  });

  it('pointerdown on SHOOT holds it until pointerup', () => {
    const { hud, box } = setup();
    hud.show('game');
    button(box, 'SHOOT').fire('pointerdown');
    expect(hud.touch().shootHeld).toBe(true);
    expect(hud.touch().shootHeld).toBe(true);
    button(box, 'SHOOT').fire('pointerup');
    expect(hud.touch().shootHeld).toBe(false);
  });

  it('a PASS tap is read once', () => {
    const { hud, box } = setup();
    hud.show('game');
    button(box, 'PASS').fire('pointerdown');
    button(box, 'PASS').fire('pointerup');
    expect(hud.touch().passPressed).toBe(true);
    expect(hud.touch().passPressed).toBe(false);
  });

  it('result shows its text with a Close button that hides it', () => {
    const { hud, box } = setup();
    hud.show('game');
    hud.result('You win 11-7. Swish gives the stake back.');
    expect(box.text()).toContain('You win 11-7. Swish gives the stake back.');
    button(box, 'Close').fire('pointerdown');
    expect(button(box, 'Close').parent?.style.display).toBe('none');
    hud.result(null);
    expect(box.all((e) => e.textContent === 'You win 11-7. Swish gives the stake back.').length).toBe(0);
  });

  it('show(none) hides the box', () => {
    const { hud, box } = setup();
    hud.show('none');
    expect(box.style.display).toBe('none');
  });

  it('dispose removes the container', () => {
    const { ui, hud } = setup();
    hud.dispose();
    expect(ui.children.length).toBe(0);
  });
});
