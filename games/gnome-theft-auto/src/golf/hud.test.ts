// Hedgeworth's golf HUD (A4). Node has no DOM, so this file brings a tiny element stand-in (as winterApp.test.ts does).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGolfHud } from './hud';
import type { CardView, HudAction, HudView } from './types';

class FakeEl {
  children: FakeEl[] = [];
  parent: FakeEl | null = null;
  style: Record<string, string> = {};
  colSpan = 1;
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

function view(over: Partial<HudView> = {}): HudView {
  return {
    holeNumber: 9, holeName: 'The Ninth', par: 4, strokes: 2, toPar: 1, clubName: '7 Iron', clubYards: 138,
    lieName: 'Fairway', pinYards: 96, windRel: 0, windMph: 6, phase: 'aim', meter: null, banner: null, atBall: true,
    ...over,
  };
}

function buttonLabels(root: FakeEl): string[] {
  return root.all((e) => e.tagName === 'button' && e.style.display !== 'none').map((e) => e.textContent);
}

function button(root: FakeEl, label: string): FakeEl {
  const hit = root.all((e) => e.tagName === 'button' && e.textContent === label)[0];
  if (!hit) throw new Error('no button ' + label);
  return hit;
}

function setup(): { ui: FakeEl; hud: ReturnType<typeof createGolfHud>; actions: HudAction[]; box: FakeEl } {
  const ui = new FakeEl('div');
  const hud = createGolfHud(ui as unknown as HTMLElement);
  const actions: HudAction[] = [];
  hud.onAction((a) => actions.push(a));
  const box = ui.children[0];
  return { ui, hud, actions, box };
}

describe('golf HUD', () => {
  it('creates one #golf-hud container under ui, hidden until show', () => {
    const { ui, hud, box } = setup();
    expect(ui.children.length).toBe(1);
    expect(box.id).toBe('golf-hud');
    expect(box.style.display).toBe('none');
    hud.show(true);
    expect(box.style.display).toBe('block');
    hud.show(false);
    expect(box.style.display).toBe('none');
  });

  it('shows the hole strip lines and the wind', () => {
    const { hud, box } = setup();
    hud.set(view());
    const text = box.text();
    expect(text).toContain('Hole 9 · The Ninth · Par 4');
    expect(text).toContain('Stroke 2 · +1');
    expect(text).toContain('7 Iron 138 yd · Fairway · 96 yd to pin');
    expect(text).toContain('6 mph');
  });

  it('an aim view shows SWING and the aim, club buttons and the three-tap hint', () => {
    const { hud, box } = setup();
    hud.set(view({ phase: 'aim', meter: null }));
    const labels = buttonLabels(box);
    expect(labels).toContain('SWING');
    expect(labels).toContain('◀ Aim');
    expect(labels).toContain('Aim ▶');
    expect(labels).toContain('Club −');
    expect(labels).toContain('Club +');
    expect(labels).not.toContain('To my ball');
    expect(box.text()).toContain('Tap SWING three times: start, power, accuracy');
  });

  it('a walk view away from the ball shows To my ball', () => {
    const { hud, box } = setup();
    hud.set(view({ phase: 'walk', atBall: false }));
    expect(buttonLabels(box)).toContain('To my ball');
    expect(buttonLabels(box)).not.toContain('SWING');
  });

  it('a holed view shows Next hole', () => {
    const { hud, box } = setup();
    hud.set(view({ phase: 'holed' }));
    expect(buttonLabels(box)).toContain('Next hole');
  });

  it('SWING fires the swing action, and Card and Quit always work', () => {
    const { hud, box, actions } = setup();
    hud.set(view({ phase: 'aim' }));
    button(box, 'SWING').fire('pointerdown');
    expect(actions).toEqual(['swing']);
    button(box, 'Card').fire('pointerdown');
    button(box, 'Quit').fire('pointerdown');
    expect(actions).toEqual(['swing', 'card', 'quit']);
  });

  it('aim buttons send aim-left on down and aim-stop on up', () => {
    const { hud, box, actions } = setup();
    hud.set(view({ phase: 'aim' }));
    button(box, '◀ Aim').fire('pointerdown');
    button(box, '◀ Aim').fire('pointerup');
    expect(actions).toEqual(['aim-left', 'aim-stop']);
  });

  it('the meter shows the marker and the locked power tick', () => {
    const { hud, box } = setup();
    hud.set(view({ phase: 'swing', meter: { stage: 'accuracy', marker: 0.5, power: 0.5 } }));
    // Marker and locked tick both sit at xOf(0.5) = 50%.
    const ticks = box.all((e) => e.style.left === '50%' && e.style.display === 'block');
    expect(ticks.length).toBe(2);
  });

  it('a scorecard with a final view lists the rows, total and the closing line', () => {
    const { hud, box, actions } = setup();
    const card: CardView = {
      holes: [
        { number: 1, name: 'The Mortgage', par: 4, strokes: 4, best: 4 },
        { number: 2, name: "Vesper's Patience", par: 3, strokes: null, best: null },
      ],
      total: 17,
      toPar: 3,
      final: true,
    };
    hud.card(card);
    const text = box.text();
    expect(text).toContain("Hedgeworth Links · Members' card");
    expect(text).toContain('The Mortgage');
    expect(text).toContain("Vesper's Patience");
    expect(text).toContain('Total');
    expect(text).toContain('Round complete');
    expect(text).toContain('One does not concede a hole, my dear. One merely finishes it.');
    button(box, 'Close').fire('pointerdown');
    expect(actions).toContain('card-close');
    hud.card(null);
    expect(box.all((e) => e.textContent === 'Round complete').length).toBe(0);
  });

  it('a nine-hole card has nine hole rows and a Total row with summed par and strokes', () => {
    const { hud, box } = setup();
    const names = ['The First', 'Second', 'Third', 'The Ninth', 'Peony', 'The Maze', 'The Drip', 'The Shed', 'Rhubarb'];
    const pars = [4, 3, 4, 4, 4, 4, 3, 3, 4];
    const holes = names.map((name, i) => ({
      number: i + 1, name, par: pars[i], strokes: i < 8 ? pars[i] + 1 : null, best: null,
    }));
    const card: CardView = { holes, total: 0, toPar: 0, final: false };
    hud.card(card);
    const rows = box.all((e) => e.tagName === 'tr');
    // Header, nine holes, Total.
    expect(rows.length).toBe(11);
    expect(rows[10].text()).toContain('Total');
    // Par sum 33; strokes over the eight played holes = (33 - 4) par + 8 extra = 37; best is not summed.
    expect(rows[10].text()).toContain('33');
    expect(rows[10].text()).toContain('37');
    expect(box.text()).toContain('Rhubarb');
  });

  it('the Total strokes read dash when no hole has been played', () => {
    const { hud, box } = setup();
    const holes = [{ number: 1, name: 'The First', par: 4, strokes: null, best: null }];
    hud.card({ holes, total: 0, toPar: 0, final: false });
    const trs = box.all((e) => e.tagName === 'tr');
    const total = trs[trs.length - 1];
    expect(total.text()).toContain('Total');
    expect(total.text()).toContain('–');
  });

  it('on a narrow portrait phone the hole strip anchors right, clear of the birding row', () => {
    const g2 = globalThis as { innerWidth?: number; matchMedia?: unknown };
    const savedW = g2.innerWidth;
    const savedMM = g2.matchMedia;
    try {
      g2.innerWidth = 390;
      g2.matchMedia = () => ({ matches: false });
      const { box } = setup();
      const strip = box.children[0];
      expect(strip.style.left).toBe('auto');
      expect(strip.style.right).toContain('8px');
      expect(strip.style.transform).toBe('none');
      expect(strip.style.maxWidth).toBe('calc(100vw - 160px)');
    } finally {
      g2.innerWidth = savedW;
      g2.matchMedia = savedMM;
    }
  });

  it('on a wide screen the hole strip stays centred', () => {
    const g2 = globalThis as { innerWidth?: number; matchMedia?: unknown };
    const savedW = g2.innerWidth;
    const savedMM = g2.matchMedia;
    try {
      g2.innerWidth = 1280;
      g2.matchMedia = () => ({ matches: false });
      const { box } = setup();
      const strip = box.children[0];
      expect(strip.style.left).toBe('50%');
      expect(strip.style.transform).toBe('translateX(-50%)');
      expect(strip.style.maxWidth).toBe('92vw');
    } finally {
      g2.innerWidth = savedW;
      g2.matchMedia = savedMM;
    }
  });

  it('destroy removes the container and stops actions', () => {
    const { ui, hud, box, actions } = setup();
    hud.set(view({ phase: 'aim' }));
    hud.destroy();
    expect(ui.children.length).toBe(0);
    button(box, 'SWING').fire('pointerdown');
    expect(actions).toEqual([]);
  });
});
