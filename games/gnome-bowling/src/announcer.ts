// The alley announcer: an over-the-top robot voice on the PA, with WebAudio stingers (air horn, organ, crowd).
// Reads state every frame like every other system. Speaks only through speech.ts, and only while announcerOn().
import type { BallResult, Ctx, Phase, ResultKind, System } from './config';
import { audioOut } from './audio';
import { NPCS } from './npc';
import { totalScore } from './scoring';
import { announcerOn, speak } from './speech';
import type { SpeechPart } from './speech';

type Out = NonNullable<ReturnType<typeof audioOut>>;

// =====================================================================
// Which results the announcer calls itself
// =====================================================================

const ALWAYS_CALLED: ReadonlySet<ResultKind> = new Set<ResultKind>([
  'strike',
  'double',
  'turkey',
  'hambone',
  'spare',
  'split',
  'gutter',
]);

/**
 * True when the announcer will call this result itself (audio.ts then skips the gnome's own spoken line,
 * so two voices never queue up for one ball). Must give the same answer every time for the same result.
 */
export function announcerTakes(r: BallResult): boolean {
  if (ALWAYS_CALLED.has(r.kind)) return true;
  return r.serial % 3 === 0;
}

// =====================================================================
// Small WebAudio helpers (copied from audio.ts, which keeps its own private)
// =====================================================================

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

/** Attack-then-exponential-decay envelope on a gain param. */
function env(g: AudioParam, t: number, peak: number, attack: number, dur: number): void {
  const p = Math.max(0.0001, peak);
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(p, t + Math.max(0.001, attack));
  g.exponentialRampToValueAtTime(0.0001, t + dur);
}

/** One enveloped oscillator note (optionally swept from f0 to f1), stopped when it ends. */
function note(
  o: Out,
  t: number,
  f0: number,
  dur: number,
  peak: number,
  type: OscillatorType = 'sine',
  f1?: number,
): OscillatorNode {
  const s = o.ac.createOscillator();
  s.type = type;
  s.frequency.setValueAtTime(f0, t);
  if (f1 !== undefined && f1 !== f0) s.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = o.ac.createGain();
  env(g.gain, t, peak, 0.005, dur);
  s.connect(g);
  g.connect(o.out);
  s.start(t);
  s.stop(t + dur + 0.05);
  return s;
}

let noiseCtx: AudioContext | null = null;
let noiseData: AudioBuffer | null = null;

/** A 4 s block of white noise, made once per audio context. */
function noiseBuffer(o: Out): AudioBuffer {
  if (noiseData && noiseCtx === o.ac) return noiseData;
  const n = Math.floor(o.ac.sampleRate * 4);
  const buf = o.ac.createBuffer(1, n, o.ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  noiseCtx = o.ac;
  noiseData = buf;
  return buf;
}

/** A filtered noise burst into the master out. */
function noiseBurst(
  o: Out,
  t: number,
  dur: number,
  peak: number,
  type: BiquadFilterType,
  freq: number,
  q: number,
  attack = Math.min(0.005, dur * 0.2),
): void {
  const s = o.ac.createBufferSource();
  s.buffer = noiseBuffer(o);
  const f = o.ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = o.ac.createGain();
  env(g.gain, t, peak, attack, dur);
  s.connect(f);
  f.connect(g);
  g.connect(o.out);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
}

// =====================================================================
// Stingers
// =====================================================================

/** PA mic tap before a call: two low thumps and a faint feedback whine. */
function micThump(): void {
  const o = audioOut();
  if (!o) return;
  const t = o.ac.currentTime;
  note(o, t, 90, 0.08, 0.3, 'sine', 50);
  note(o, t + 0.12, 90, 0.08, 0.3, 'sine', 50);
  note(o, t, 2600, 0.25, 0.03);
}

/** One blast of three detuned sawtooths through a lowpass, held then cut. */
function hornBlast(o: Out, t: number, dur: number): void {
  const lp = o.ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  lp.Q.value = 1;
  const g = o.ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.015);
  g.gain.setValueAtTime(0.08, t + dur - 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g);
  g.connect(o.out);
  for (const f of [233, 235, 311]) {
    const s = o.ac.createOscillator();
    s.type = 'sawtooth';
    s.frequency.value = f;
    s.connect(lp);
    s.start(t);
    s.stop(t + dur + 0.05);
  }
}

/** BWAP BWAP BWAAAP. */
function airHorn(): void {
  const o = audioOut();
  if (!o) return;
  const t = o.ac.currentTime;
  hornBlast(o, t, 0.18);
  hornBlast(o, t + 0.24, 0.18);
  hornBlast(o, t + 0.48, 0.6);
}

/** The ballpark "charge" bugle call on an organ: square plus a sine an octave up. */
function organCharge(): void {
  const o = audioOut();
  if (!o) return;
  const t = o.ac.currentTime;
  const notes: [number, number][] = [
    [392, 0.13], // G4
    [523.25, 0.13], // C5
    [659.25, 0.13], // E5
    [783.99, 0.13], // G5
    [659.25, 0.13], // E5
    [783.99, 0.5], // G5
  ];
  let when = 0;
  for (const [f, dur] of notes) {
    const g = o.ac.createGain();
    env(g.gain, t + when, 0.12, 0.008, dur);
    g.connect(o.out);
    const sq = o.ac.createOscillator();
    sq.type = 'square';
    sq.frequency.value = f;
    const sn = o.ac.createOscillator();
    sn.type = 'sine';
    sn.frequency.value = f * 2;
    sq.connect(g);
    sn.connect(g);
    for (const s of [sq, sn]) {
      s.start(t + when);
      s.stop(t + when + dur + 0.05);
    }
    when += dur;
  }
}

/** wah wah wah waaah: a sawtooth through a lowpass, the last note with a 6 Hz vibrato. */
function sadTrombone(): void {
  const o = audioOut();
  if (!o) return;
  const t = o.ac.currentTime;
  const lp = o.ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  lp.connect(o.out);
  const notes: [number, number][] = [
    [293.66, 0.35], // D4
    [277.18, 0.35], // C#4
    [261.63, 0.35], // C4
    [246.94, 1.0], // B3
  ];
  let when = 0;
  notes.forEach(([f, dur], i) => {
    const s = o.ac.createOscillator();
    s.type = 'sawtooth';
    s.frequency.setValueAtTime(f, t + when);
    const g = o.ac.createGain();
    env(g.gain, t + when, 0.25, 0.02, dur);
    s.connect(g);
    g.connect(lp);
    if (i === notes.length - 1) {
      const lfo = o.ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 6;
      const amp = o.ac.createGain();
      amp.gain.value = 8;
      lfo.connect(amp);
      amp.connect(s.frequency);
      lfo.start(t + when);
      lfo.stop(t + when + dur + 0.05);
    }
    s.start(t + when);
    s.stop(t + when + dur + 0.05);
    when += dur;
  });
}

/** Noise bursts every 0.035 s getting louder, then a crash. */
function drumRoll(seconds: number): void {
  const o = audioOut();
  if (!o) return;
  const t = o.ac.currentTime;
  const step = 0.035;
  const n = Math.floor(seconds / step);
  for (let i = 0; i < n; i++) {
    const peak = 0.04 + 0.25 * (i / n);
    noiseBurst(o, t + i * step, 0.03, peak, 'bandpass', 1500, 1);
  }
  noiseBurst(o, t + seconds, 1.2, 0.3, 'highpass', 2000, 0.7);
}

/** 2 s of bandpassed noise swelling and falling, like cheer() in audio.ts. */
function crowd(level: number): void {
  const o = audioOut();
  if (!o) return;
  noiseBurst(o, o.ac.currentTime, 2.0, Math.min(0.35, 0.3 * level), 'bandpass', 1200, 0.7, 0.6);
}

// =====================================================================
// Lines (robot voice: plain words, no symbols)
// =====================================================================

type LineKey =
  | ResultKind
  | 'start'
  | 'tenth'
  | 'bowler'
  | 'cpu'
  | 'winner'
  | 'champ';

const LINES: Record<LineKey, string[]> = {
  start: [
    'Ladies and gnomes! Welcome to the Gnome Bowl!',
    'Good evening, gnomes! Welcome to the lanes!',
    'Welcome, welcome! The Gnome Bowl is now open!',
  ],
  tenth: [
    'Tenth frame! It all comes down to this!',
    'Tenth frame! Every pin counts now!',
    'The tenth frame! Nobody leaves the lane!',
  ],
  bowler: ['Now bowling, {name}!', 'Up next, {name}!', 'Now stepping to the line, {name}!'],
  cpu: ['Now bowling, {name}, {title}!', 'Stepping up, {name}, {title}!'],
  strike: ['STEEEEE-RIIIIKE!', 'Strike! Gnome-tastic!', 'All the gnomes are down!', 'Bowl-cut power!'],
  double: ['Double! Two in a row!', 'Double trouble!', 'Back to back strikes!'],
  turkey: ['Turkey! Gobble, gobble!', 'Three strikes in a row! Gobble, gobble!', 'Turkey on the lane!'],
  hambone: [
    'Hambone! Somebody call the fire department!',
    'Four strikes! The gnomes are on fire!',
    'Hambone! Somebody stop this gnome!',
  ],
  spare: ['Spare! Clean-up crew!', 'Picked it up, nice spare!', 'The spare is there!'],
  gutter: [
    'Gutter ball! Into the ditch!',
    'Oh no, a gutter ball!',
    'Aww, the gutter gets us all in the end.',
    'Ugh, gutter! My beard is ashamed.',
  ],
  split: ['Split! Ooh, a big gap!', 'A split! That is a tough one!', 'Split! The gap is open!'],
  nine: ['So close! One stubborn gnome!', 'Nine pins! Argh!', 'Nine! So very close!'],
  miss: ['Missed. Not even one.', 'Whoopsie! Not a single pin.', 'Zero pins, zero shame.'],
  pins: ['Meh.', 'Okay. Some pins.', 'Pins down. Moving on.'],
  winner: ['And the winner is!'],
  champ: ['{name}!', 'Our champion, {name}!'],
};

const lastLine = new Map<string, string>();

/** A random line for this key, never the same one twice in a row. */
function pickLine(key: string, lines: string[]): string {
  let pool = lines.filter((l) => l !== lastLine.get(key));
  if (pool.length === 0) pool = lines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  lastLine.set(key, line);
  return line;
}

/** Fills {name}-style slots. */
function fill(line: string, vars: Record<string, string>): string {
  return line.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

/** The last spoken word of a line, without punctuation (the echo tail repeats it). */
function lastWord(text: string): string {
  return text.split(/[^A-Za-z'-]+/).filter(Boolean).pop() ?? text;
}

/** One call as speech parts: the line, then its last word twice more, quieter and lower each time. */
function echoParts(text: string): SpeechPart[] {
  const pitch = rand(0.2, 0.6);
  const rate = rand(0.75, 0.95);
  const word = lastWord(text);
  return [
    { text, voice: 'announcer', pitch, rate },
    { text: word, voice: 'announcer', volume: 0.45, pitch: Math.max(0, pitch - 0.1), rate: 1.1 },
    { text: word, voice: 'announcer', volume: 0.2, pitch: Math.max(0, pitch - 0.2), rate: 1.1 },
  ];
}

/** Speech starts a moment after the mic tap, so the thump lands first. */
const PA_DELAY_MS = 350;

function say(text: string, interrupt: boolean, delayMs = PA_DELAY_MS): void {
  const parts = echoParts(text);
  setTimeout(() => {
    if (announcerOn()) speak(parts, interrupt);
  }, delayMs);
}

/** A PA call: mic tap, a stinger, then the voice. */
function call(text: string, stinger: () => void, interrupt = true): void {
  micThump();
  stinger();
  say(text, interrupt);
}

function stingerFor(kind: ResultKind): () => void {
  switch (kind) {
    case 'strike':
    case 'double':
      return () => {
        airHorn();
        crowd(0.8);
      };
    case 'turkey':
    case 'hambone':
      return () => {
        organCharge();
        crowd(1);
      };
    case 'spare':
      return organCharge;
    case 'gutter':
    case 'miss':
      return sadTrombone;
    default:
      return () => {};
  }
}

// =====================================================================
// The system: reads state every frame and calls the moments
// =====================================================================

/** Reads state every frame and calls the big moments over the PA. Silent while announcerOn() is false. */
export function createAnnouncer(ctx: Ctx): System {
  const s = ctx.state;
  let prev: Phase | null = null;
  let lastPlayers = s.players;
  let startPending = false;
  let lastSerial = -1;

  return {
    update() {
      const ph = s.phase;
      const on = announcerOn();
      const entering = ph !== prev;

      // Game start: a new players array, then the first intro.
      if (s.players !== lastPlayers) {
        lastPlayers = s.players;
        startPending = true;
      }
      let gameStart = false;
      if (startPending && ph === 'intro') {
        startPending = false;
        gameStart = true;
        if (on) call(pickLine('start', LINES.start), organCharge);
      }

      // A bowler is up: the tenth frame, a first frame, or a CPU bowler.
      if (entering && ph === 'intro' && !gameStart && on) {
        const p = s.players[s.current];
        if (p) {
          if (s.frame === 9) {
            call(pickLine('tenth', LINES.tenth), () => {});
          } else if (p.npc && s.frame % 3 === 0) {
            // CPU bowlers get their full billing on frames 1, 4 and 7 (every frame got old fast).
            const npc = NPCS[p.npc];
            call(fill(pickLine('cpu', LINES.cpu), { name: npc.name, title: npc.title }), () => {});
          } else if (s.frame === 0) {
            call(fill(pickLine('bowler', LINES.bowler), { name: p.name }), () => {});
          }
        }
      }

      // Result: once per new result, after the card has started to show.
      if (ph === 'result' && s.result && s.result.serial !== lastSerial && s.phaseTime >= 0.05) {
        const r = s.result;
        lastSerial = r.serial;
        if (on && announcerTakes(r)) call(pickLine(r.kind, LINES[r.kind]), stingerFor(r.kind), true);
      }

      // Final: the winner, a drum roll, then the name with the air horn.
      if (entering && ph === 'final' && on && s.players.length > 0) {
        let win = s.players[0];
        for (const p of s.players) {
          if (totalScore(p.rolls) > totalScore(win.rolls)) win = p;
        }
        const name = win.name;
        micThump();
        drumRoll(1.6);
        say(pickLine('winner', LINES.winner), true);
        setTimeout(() => {
          if (!announcerOn()) return;
          micThump();
          airHorn();
          crowd(1);
          say(fill(pickLine('champ', LINES.champ), { name }), false, 0);
        }, 1600);
      }

      prev = ph;
    },
  };
}
