// The room view: one station per instrument with its pads.
import { INSTRUMENTS, INSTRUMENT_NAMES, INSTRUMENT_KEYS, PADS, padForNote, cssColor } from './config';
import type { InstrumentId, Member } from './config';

export interface Stage {
  /** Highlight my instrument's station. */
  setMine(i: InstrumentId): void;
  /** Show the keyboard's current octave shift (-2..2). */
  setOctave(octave: number): void;
  /** Show who is holding which instrument. */
  setPlayers(players: Member[]): void;
  /** Light the pad for note n of instrument i in color (0xRRGGBB) and show name on the station briefly. */
  flash(i: InstrumentId, n: number, color: number, name: string): void;
  /** A pad was pressed with mouse or touch (pad = index into PADS[i]). */
  onPad(fn: (i: InstrumentId, pad: number) => void): void;
  /** A station's header was clicked: the player wants that instrument. */
  onPick(fn: (i: InstrumentId) => void): void;
}

const STYLE_ID = 'mr-stage-style';

const ICONS: Record<InstrumentId, string> = { drums: '🥁', keys: '🎹', cowbell: '🔔' };

const CSS = `
#mr-stage{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;padding:16px;align-content:start;min-width:0;box-sizing:border-box;}
.mr-station{position:relative;box-sizing:border-box;min-width:0;background:#2a1f30;border:2px solid #3d2f47;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;color:#f4ecdf;transition:border-color .15s,opacity .15s;}
.mr-station.mr-mine{border:3px solid #ffd54f;}
.mr-station.mr-dim .mr-pads,.mr-station.mr-dim .mr-piano,.mr-station.mr-dim .mr-cowbell{opacity:.45;}
.mr-station.mr-shake{animation:mr-shake 120ms ease-out;}
@keyframes mr-shake{0%{transform:scale(1);}50%{transform:scale(1.015);}100%{transform:scale(1);}}
.mr-head{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;background:transparent;border:1px solid #5a4a66;border-radius:10px;color:inherit;font:inherit;font-size:1.05rem;font-weight:700;padding:8px 10px;cursor:pointer;text-align:left;touch-action:manipulation;}
.mr-head:hover{border-color:#ffd54f;}
.mr-icon{font-size:1.3rem;}
.mr-title{flex:1;}
.mr-hint{font-size:.75rem;font-weight:400;opacity:.7;}
.mr-you-tag{display:none;font-size:.7rem;background:#ffd54f;color:#1b1420;border-radius:6px;padding:2px 6px;font-weight:700;}
.mr-station.mr-mine .mr-you-tag{display:inline;}
.mr-players{display:flex;flex-wrap:wrap;gap:6px;min-height:24px;align-items:center;font-size:.85rem;}
.mr-chip{color:#1b1420;border-radius:999px;padding:2px 9px;font-weight:700;font-size:.8rem;}
.mr-empty{opacity:.6;font-style:italic;font-size:.85rem;}
.mr-octave{font-size:.9rem;display:flex;gap:8px;align-items:baseline;}
.mr-tag{position:absolute;top:8px;right:12px;background:#ffd54f;color:#1b1420;font-weight:800;border-radius:8px;padding:3px 8px;font-size:.85rem;opacity:0;transform:translateY(-4px);transition:opacity .15s,transform .15s;pointer-events:none;}
.mr-tag.on{opacity:1;transform:none;}
.mr-pad{font:inherit;color:#1b1420;background:#f4ecdf;border:2px solid #0c0810;border-radius:10px;padding:6px 4px;min-height:52px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:background .05s,box-shadow .05s,transform .05s;}
.mr-cap{font-weight:800;font-size:1.05rem;line-height:1;}
.mr-padname{font-size:.7rem;opacity:.75;}
.mr-drums{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.mr-drums .mr-pad{border-radius:50%;aspect-ratio:1;min-height:0;padding:0;}
.mr-piano{position:relative;height:150px;}
.mr-whites{display:flex;height:100%;gap:0;}
.mr-whites .mr-pad{flex:1;min-width:0;height:100%;border-radius:0 0 8px 8px;justify-content:flex-end;padding-bottom:8px;}
.mr-piano .mr-black{position:absolute;top:0;width:7%;height:60%;min-height:0;background:#1b1420;color:#f4ecdf;border-color:#000;border-radius:0 0 6px 6px;padding:4px 0 0;z-index:1;justify-content:flex-end;}
.mr-piano .mr-black .mr-padname{display:none;}
.mr-cowbell{display:flex;flex-direction:column;gap:8px;}
.mr-bell-big{min-height:110px;font-size:1.2rem;border-radius:50% 50% 40% 40%;}
.mr-bell-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
`;

interface Station {
  card: HTMLElement;
  players: HTMLElement;
  pads: HTMLButtonElement[];
  tag: HTMLElement;
  nameTimer?: number;
  octave?: HTMLElement;
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function restartShake(card: HTMLElement): void {
  card.classList.remove('mr-shake');
  void card.offsetWidth;
  card.classList.add('mr-shake');
}

export function createStage(parent: HTMLElement): Stage {
  ensureStyle();
  const root = document.createElement('div');
  root.id = 'mr-stage';
  parent.appendChild(root);

  const pickListeners: Array<(i: InstrumentId) => void> = [];
  const padListeners: Array<(i: InstrumentId, pad: number) => void> = [];
  const stations = {} as Record<InstrumentId, Station>;
  const padTimers = new Map<string, number>();

  for (const i of INSTRUMENTS) {
    const card = node('section', `mr-station mr-st-${i}`);
    const pads: HTMLButtonElement[] = [];

    // Header: a button that asks for this instrument.
    const head = node('button', 'mr-head');
    head.type = 'button';
    head.appendChild(node('span', 'mr-icon', ICONS[i]));
    head.appendChild(node('span', 'mr-title', INSTRUMENT_NAMES[i]));
    head.appendChild(node('span', 'mr-hint', `press ${INSTRUMENT_KEYS[i].replace('Digit', '')}`));
    head.appendChild(node('span', 'mr-you-tag', 'you are playing this'));
    head.addEventListener('click', () => {
      for (const f of pickListeners) f(i);
    });
    card.appendChild(head);

    const players = node('div', 'mr-players');
    card.appendChild(players);

    let octave: HTMLElement | undefined;
    if (i === 'keys') {
      octave = node('div', 'mr-octave');
      octave.appendChild(node('span', 'mr-octave-text', 'Octave 0'));
      octave.appendChild(node('span', 'mr-hint', 'Z / X'));
      card.appendChild(octave);
    }

    const makePad = (idx: number, extra?: string): HTMLButtonElement => {
      const def = PADS[i][idx];
      const b = node('button', 'mr-pad' + (def.black ? ' mr-black' : '') + (extra ? ' ' + extra : ''));
      b.type = 'button';
      b.appendChild(node('span', 'mr-cap', def.label));
      b.appendChild(node('span', 'mr-padname', def.name));
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        for (const f of padListeners) f(i, idx);
      });
      pads[idx] = b;
      return b;
    };

    if (i === 'drums') {
      const box = node('div', 'mr-pads mr-drums');
      PADS[i].forEach((_, idx) => box.appendChild(makePad(idx)));
      card.appendChild(box);
    } else if (i === 'keys') {
      const piano = node('div', 'mr-piano');
      const whites = node('div', 'mr-whites');
      PADS[i].forEach((d, idx) => {
        if (!d.black) whites.appendChild(makePad(idx));
      });
      piano.appendChild(whites);
      // Black keys sit over the gap after the white keys before them (8 white keys, 12.5% each).
      let whiteBefore = 0;
      PADS[i].forEach((d, idx) => {
        if (d.black) {
          const b = makePad(idx);
          b.style.left = `${whiteBefore * 12.5 - 3.5}%`;
          piano.appendChild(b);
        } else {
          whiteBefore++;
        }
      });
      card.appendChild(piano);
    } else {
      const box = node('div', 'mr-cowbell');
      box.appendChild(makePad(0, 'mr-bell-big'));
      const row = node('div', 'mr-bell-row');
      PADS[i].forEach((_, idx) => {
        if (idx > 0) row.appendChild(makePad(idx));
      });
      box.appendChild(row);
      card.appendChild(box);
    }

    const tag = node('div', 'mr-tag');
    card.appendChild(tag);

    root.appendChild(card);
    stations[i] = { card, players, pads, tag, octave: octave?.querySelector<HTMLElement>('.mr-octave-text') ?? undefined };
  }

  return {
    setMine(mine) {
      for (const i of INSTRUMENTS) {
        const on = i === mine;
        stations[i].card.classList.toggle('mr-mine', on);
        stations[i].card.classList.toggle('mr-dim', !on);
      }
    },

    setOctave(o) {
      const text = `Octave ${o > 0 ? `+${o}` : String(o)}`;
      const label = stations.keys.octave;
      if (label) label.textContent = text;
    },

    setPlayers(players) {
      for (const i of INSTRUMENTS) {
        const s = stations[i];
        s.players.textContent = '';
        const here = players.filter((p) => p.instrument === i);
        if (here.length === 0) {
          s.players.appendChild(node('span', 'mr-empty', 'nobody yet'));
          continue;
        }
        for (const p of here) {
          const chip = node('span', 'mr-chip', p.name + (p.me ? ' (you)' : ''));
          chip.style.background = cssColor(p.color);
          s.players.appendChild(chip);
        }
      }
    },

    flash(i, n, color, name) {
      const s = stations[i];
      const pad = padForNote(i, n);
      const b: HTMLButtonElement | undefined = s.pads[pad];
      if (b) {
        const key = `${i}:${pad}`;
        const prev = padTimers.get(key);
        if (prev !== undefined) clearTimeout(prev);
        const c = cssColor(color);
        b.style.background = c;
        b.style.boxShadow = `0 0 18px ${c}`;
        b.style.transform = 'scale(0.94)';
        padTimers.set(
          key,
          window.setTimeout(() => {
            b.style.background = '';
            b.style.boxShadow = '';
            b.style.transform = '';
            padTimers.delete(key);
          }, 140),
        );
      }

      s.tag.textContent = name;
      s.tag.classList.add('on');
      if (s.nameTimer !== undefined) clearTimeout(s.nameTimer);
      s.nameTimer = window.setTimeout(() => {
        s.tag.classList.remove('on');
        s.nameTimer = undefined;
      }, 600);

      if (i !== 'keys') restartShake(s.card);
    },

    onPad(fn) {
      padListeners.push(fn);
    },

    onPick(fn) {
      pickListeners.push(fn);
    },
  };
}
