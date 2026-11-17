/**
 * Programmatic music-theory analyzer for @lawn/music SongBuilders.
 * Simulates Tone.Transport (Loop / Part) in pure Node to capture all scheduled
 * tonal note events, then evaluates:
 *   - Key/mode fit (out-of-scale ratio)
 *   - Vertical harmonic clashes (low-register minor 2nds, low-interval limit mud)
 *   - Bass-vs-harmony semitone clashes
 *   - Melodic leap smoothness & register separation
 *   - Pitch-class variety & note density
 */
import type * as ToneNS from 'tone';
import type { Keep, SongBuilder, Tone } from '../engine';
import { MODES, NOTE_NAMES, type ModeName } from '../theory';
import type { MixIssue } from './dsp';

export interface NoteEvent {
  instrument: string;
  id: number;
  time: number;
  dur: number;
  midi: number;
  vel: number;
}

export interface DetectedKey {
  root: number;
  rootName: string;
  mode: ModeName;
  inScaleRatio: number;
}

export interface TheoryReport {
  ok: boolean;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  durationS: number;
  noteCount: number;
  uniquePitchClasses: number;
  notesPerSecond: number;
  detectedKey: DetectedKey;
  /** Fraction of polyphonic slices with harsh low/mid minor-2nd or sub-5th mud. */
  clashRatio: number;
  /** Fraction of melodic steps > 12 semitones within an instrument. */
  largeLeapRatio: number;
  /** Mean melodic interval (semitones) within single-line instruments. */
  avgMelodicStep: number;
  /** Register spread (max midi - min midi). */
  registerSpan: number;
  issues: MixIssue[];
}

const TONAL_SYNTHS = new Set(['Synth', 'MonoSynth', 'FMSynth', 'PolySynth', 'PluckSynth', 'AMSynth', 'DuoSynth']);

const NOTE_BASE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

export function noteToMidi(note: unknown): number | null {
  if (typeof note === 'number' && Number.isFinite(note)) {
    return note > 127 ? Math.round(69 + 12 * Math.log2(note / 440)) : Math.round(note);
  }
  if (typeof note !== 'string') return null;
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!m) return null;
  const base = NOTE_BASE[m[1].toUpperCase()];
  if (base === undefined) return null;
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const oct = Number(m[3]);
  return (oct + 1) * 12 + base + acc;
}

function parseDurationSeconds(val: unknown, bpm: number): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0.01, val);
  const q = 60 / Math.max(20, bpm);
  if (typeof val !== 'string') return q;
  const s = val.trim();
  const table: Record<string, number> = {
    '32n': q / 8,
    '16n': q / 4,
    '16n.': (q / 4) * 1.5,
    '8n': q / 2,
    '8n.': (q / 2) * 1.5,
    '4n': q,
    '4n.': q * 1.5,
    '2n': q * 2,
    '2n.': q * 3,
    '1m': q * 4,
    '2m': q * 8,
    '4m': q * 16,
  };
  if (s in table) return table[s];
  const mMatch = /^(\d+)m$/.exec(s);
  if (mMatch) return Number(mMatch[1]) * q * 4;
  return q;
}

/** Captures scheduled tonal NoteEvents from a SongBuilder over `durationS` seconds. */
export function captureNoteEvents(build: SongBuilder, durationS = 28): NoteEvent[] {
  const events: NoteEvent[] = [];
  const transport = {
    bpm: { value: 120, rampTo: () => undefined },
    swing: 0,
    swingSubdivision: '16n',
    start: () => undefined,
    stop: () => undefined,
    pause: () => undefined,
    cancel: () => undefined,
    schedule: () => 0,
    scheduleRepeat: () => 0,
    clear: () => undefined,
  };

  interface LoopRec {
    cb: (time: number) => void;
    interval: unknown;
    startTime: number;
    started: boolean;
  }
  interface PartRec {
    cb: (time: number, value: unknown) => void;
    items: [number, unknown][];
    loop: boolean;
    loopEnd: number;
    startTime: number;
    started: boolean;
  }

  const loops: LoopRec[] = [];
  const parts: PartRec[] = [];
  let nextId = 0;

  const makeParamProxy = (): unknown => new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'value') return 0;
      if (prop === 'connect' || prop === 'fan') return () => makeParamProxy();
      return () => makeParamProxy();
    },
    set() { return true; },
  });

  const makeNode = (kind: string): unknown => {
    const id = nextId++;
    const self: Record<PropertyKey, unknown> = {
      maxPolyphony: 16,
      volume: makeParamProxy(),
      frequency: makeParamProxy(),
      Q: makeParamProxy(),
      gain: makeParamProxy(),
      detune: makeParamProxy(),
      connect: () => proxy,
      fan: () => proxy,
      toDestination: () => proxy,
      start: () => proxy,
      stop: () => proxy,
      dispose: () => proxy,
      sync: () => proxy,
      triggerAttackRelease(notes: unknown, dur: unknown, time: unknown = 0, vel: unknown = 0.8) {
        if (!TONAL_SYNTHS.has(kind)) return;
        const list = Array.isArray(notes) ? notes : [notes];
        const t = typeof time === 'number' && Number.isFinite(time) ? time : 0;
        const d = parseDurationSeconds(dur, transport.bpm.value);
        const v = typeof vel === 'number' && Number.isFinite(vel) ? vel : 0.8;
        for (const item of list) {
          const midi = noteToMidi(item);
          if (midi !== null) {
            events.push({ instrument: kind, id, time: t, dur: d, midi, vel: v });
          }
        }
      },
    };
    const proxy: unknown = new Proxy(self, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'symbol') return undefined;
        return makeParamProxy();
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    });
    return proxy;
  };

  const timeObj = (val: unknown) => ({
    toSeconds: () => parseDurationSeconds(val, transport.bpm.value),
    toMilliseconds: () => parseDurationSeconds(val, transport.bpm.value) * 1000,
    toBarsBeatsSixteenths: () => '0:0:0',
  });

  const toneProxy = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'getTransport') return () => transport;
      if (prop === 'getContext') return () => ({ state: 'running', currentTime: 0, rawContext: {} });
      if (prop === 'Time') return timeObj;
      if (prop === 'Frequency') return (v: unknown) => ({
        toFrequency: () => (typeof v === 'number' ? v : 440),
        toMidi: () => noteToMidi(v) ?? 60,
        toNote: () => (typeof v === 'string' ? v : 'C4'),
      });
      if (prop === 'Midi') return (v: unknown) => ({
        toFrequency: () => 440,
        toNote: () => `${NOTE_NAMES[(((typeof v === 'number' ? v : 60) % 12) + 12) % 12]}4`,
        toMidi: () => (typeof v === 'number' ? v : 60),
      });
      if (prop === 'now') return () => 0;
      if (prop === 'start') return () => Promise.resolve();
      if (prop === 'Loop') {
        return class {
          constructor(cb: (time: number) => void, interval: unknown = '4n') {
            const rec: LoopRec = { cb, interval, startTime: 0, started: false };
            loops.push(rec);
            return {
              start(t = 0) { rec.started = true; rec.startTime = typeof t === 'number' ? t : 0; return this; },
              stop() { rec.started = false; return this; },
              dispose() { return this; },
            } as object;
          }
        };
      }
      if (prop === 'Part') {
        return class {
          constructor(cb: (time: number, v: unknown) => void, rawEvents: unknown[] = []) {
            const items: [number, unknown][] = rawEvents.map((ev) => {
              if (Array.isArray(ev)) return [parseDurationSeconds(ev[0], transport.bpm.value), ev[1]];
              if (ev && typeof ev === 'object' && 'time' in ev) {
                return [parseDurationSeconds((ev as { time: unknown }).time, transport.bpm.value), ev];
              }
              return [0, ev];
            });
            const rec: PartRec = { cb, items, loop: false, loopEnd: 0, startTime: 0, started: false };
            parts.push(rec);
            return new Proxy(rec, {
              get(target, p) {
                if (p === 'start') return (t = 0) => { target.started = true; target.startTime = typeof t === 'number' ? t : 0; return target; };
                if (p === 'stop') return () => { target.started = false; return target; };
                if (p === 'dispose') return () => target;
                return (target as unknown as Record<PropertyKey, unknown>)[p];
              },
              set(target, p, val) {
                if (p === 'loopEnd') target.loopEnd = parseDurationSeconds(val, transport.bpm.value);
                else (target as unknown as Record<PropertyKey, unknown>)[p] = val;
                return true;
              },
            }) as object;
          }
        };
      }
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        const kind = prop;
        return class {
          constructor() { return makeNode(kind) as object; }
        };
      }
      return () => undefined;
    },
  }) as unknown as Tone;

  const keep: Keep = (x) => x;
  const out = makeNode('MasterOut') as ToneNS.Volume;
  build(toneProxy, keep, out);

  // Advance simulated clock for Loops
  for (const l of loops) {
    if (!l.started) continue;
    const stepS = Math.max(0.01, parseDurationSeconds(l.interval, transport.bpm.value));
    for (let t = l.startTime; t < durationS; t += stepS) {
      try { l.cb(t); } catch { /* ignore */ }
    }
  }

  // Advance simulated clock for Parts
  for (const p of parts) {
    if (!p.started || p.items.length === 0) continue;
    const loopLen = p.loop && p.loopEnd > 0 ? p.loopEnd : durationS + 1;
    const maxPass = p.loop && p.loopEnd > 0 ? Math.ceil(durationS / loopLen) : 1;
    for (let pass = 0; pass < maxPass; pass++) {
      const base = p.startTime + pass * loopLen;
      for (const [offset, val] of p.items) {
        const t = base + offset;
        if (t >= durationS) continue;
        try { p.cb(t, val); } catch { /* ignore */ }
      }
    }
  }

  events.sort((a, b) => a.time - b.time || a.midi - b.midi);
  return events;
}

/** Evaluates music theory quality (key fit, harmonic clashes, voice leading, variety) on a SongBuilder. */
export function analyzeTheory(build: SongBuilder, durationS = 28): TheoryReport {
  const events = captureNoteEvents(build, durationS);
  const issues: MixIssue[] = [];

  if (events.length === 0) {
    issues.push({ severity: 'error', code: 'no-tonal-notes', message: 'No tonal note events were scheduled' });
    return {
      ok: false,
      score: 0,
      grade: 'F',
      durationS,
      noteCount: 0,
      uniquePitchClasses: 0,
      notesPerSecond: 0,
      detectedKey: { root: 0, rootName: 'C', mode: 'ionian', inScaleRatio: 0 },
      clashRatio: 0,
      largeLeapRatio: 0,
      avgMelodicStep: 0,
      registerSpan: 0,
      issues,
    };
  }

  // 1. Detect best-fitting key/mode across all tonal notes weighted by duration * velocity
  const pcWeights = new Array<number>(12).fill(0);
  let totalWeight = 0;
  let minMidi = 127;
  let maxMidi = 0;
  const pcSet = new Set<number>();

  for (const ev of events) {
    const pc = ((ev.midi % 12) + 12) % 12;
    const w = Math.min(2, Math.max(0.05, ev.dur)) * Math.max(0.1, ev.vel);
    pcWeights[pc] += w;
    totalWeight += w;
    pcSet.add(pc);
    if (ev.midi < minMidi) minMidi = ev.midi;
    if (ev.midi > maxMidi) maxMidi = ev.midi;
  }

  let bestKey: DetectedKey = { root: 0, rootName: 'C', mode: 'ionian', inScaleRatio: 0 };
  for (const mode of Object.keys(MODES) as ModeName[]) {
    const steps = MODES[mode];
    for (let root = 0; root < 12; root++) {
      const inScale = new Set(steps.map((s) => (root + s) % 12));
      let matchWeight = 0;
      for (let pc = 0; pc < 12; pc++) {
        if (inScale.has(pc)) matchWeight += pcWeights[pc];
      }
      const ratio = totalWeight > 0 ? matchWeight / totalWeight : 0;
      if (ratio > bestKey.inScaleRatio) {
        bestKey = { root, rootName: NOTE_NAMES[root], mode, inScaleRatio: ratio };
      }
    }
  }

  // 2. Vertical harmonic clashes across 50 ms time buckets
  const bucketSize = 0.05;
  const numBuckets = Math.max(1, Math.ceil(durationS / bucketSize));
  let polyBuckets = 0;
  let clashBuckets = 0;

  // Index events by bucket overlap
  const activeInBucket: number[][] = Array.from({ length: numBuckets }, () => []);
  for (const ev of events) {
    const b0 = Math.max(0, Math.floor(ev.time / bucketSize));
    const b1 = Math.min(numBuckets - 1, Math.floor((ev.time + Math.min(ev.dur, 2)) / bucketSize));
    for (let b = b0; b <= b1; b++) activeInBucket[b].push(ev.midi);
  }

  for (let b = 0; b < numBuckets; b++) {
    const midis = [...new Set(activeInBucket[b])].sort((x, y) => x - y);
    if (midis.length < 2) continue;
    polyBuckets++;
    let hasClash = false;
    for (let i = 0; i < midis.length && !hasClash; i++) {
      for (let j = i + 1; j < midis.length; j++) {
        const diff = midis[j] - midis[i];
        // Harsh minor 2nd (1 semitone) in low/mid register, or close intervals (< 7 semitones) below A2 (45)
        if (diff === 1 && midis[i] < 60) { hasClash = true; break; }
        if (midis[j] < 45 && diff > 0 && diff < 7) { hasClash = true; break; }
        // Bass (< 52) clashing by minor 9th (13 semitones) with an upper voice
        if (midis[i] < 52 && diff === 13) { hasClash = true; break; }
      }
    }
    if (hasClash) clashBuckets++;
  }
  const clashRatio = polyBuckets > 0 ? clashBuckets / polyBuckets : 0;

  // 3. Melodic voice-leading smoothness per instrument (group simultaneous chord hits)
  const byInst = new Map<number, NoteEvent[]>();
  for (const ev of events) {
    if (!byInst.has(ev.id)) byInst.set(ev.id, []);
    byInst.get(ev.id)!.push(ev);
  }

  let stepCount = 0;
  let stepSum = 0;
  let largeLeaps = 0;
  for (const list of byInst.values()) {
    // Collapse simultaneous chord notes to their average MIDI pitch per onset
    const onsets: { t: number; avgMidi: number; count: number }[] = [];
    for (const ev of list) {
      const last = onsets[onsets.length - 1];
      if (last && Math.abs(last.t - ev.time) < 0.02) {
        last.avgMidi = (last.avgMidi * last.count + ev.midi) / (last.count + 1);
        last.count++;
      } else {
        onsets.push({ t: ev.time, avgMidi: ev.midi, count: 1 });
      }
    }
    for (let i = 1; i < onsets.length; i++) {
      const jump = Math.abs(onsets[i].avgMidi - onsets[i - 1].avgMidi);
      stepSum += jump;
      stepCount++;
      if (jump > 14) largeLeaps++;
    }
  }
  const avgMelodicStep = stepCount > 0 ? stepSum / stepCount : 0;
  const largeLeapRatio = stepCount > 0 ? largeLeaps / stepCount : 0;
  const notesPerSecond = events.length / Math.max(1, durationS);
  const registerSpan = maxMidi - minMidi;

  // Score & Issues
  let score = 100;
  if (bestKey.inScaleRatio < 0.9) {
    const penalty = Math.round((0.9 - bestKey.inScaleRatio) * 180);
    score -= penalty;
    issues.push({
      severity: bestKey.inScaleRatio < 0.8 ? 'error' : 'warn',
      code: 'out-of-scale-notes',
      message: `Only ${(bestKey.inScaleRatio * 100).toFixed(1)}% of tonal weight fits best key (${bestKey.rootName} ${bestKey.mode})`,
    });
  }
  if (clashRatio > 0.12) {
    const penalty = Math.round((clashRatio - 0.12) * 120);
    score -= penalty;
    issues.push({
      severity: clashRatio > 0.25 ? 'error' : 'warn',
      code: 'harmonic-clashes',
      message: `${(clashRatio * 100).toFixed(1)}% of polyphonic slices have low/mid minor-2nd or bass-interval clashes`,
    });
  }
  if (largeLeapRatio > 0.28) {
    score -= Math.round((largeLeapRatio - 0.28) * 60);
    issues.push({
      severity: 'warn',
      code: 'erratic-voice-leading',
      message: `${(largeLeapRatio * 100).toFixed(1)}% of melodic transitions jump > 14 semitones`,
    });
  }
  if (pcSet.size < 4) {
    score -= 15;
    issues.push({
      severity: 'warn',
      code: 'low-pitch-variety',
      message: `Only ${pcSet.size} unique pitch classes used; harmony/melody may sound monotonous`,
    });
  }
  if (notesPerSecond > 32) {
    score -= 12;
    issues.push({
      severity: 'warn',
      code: 'excessive-note-density',
      message: `Very high tonal note density (${notesPerSecond.toFixed(1)} notes/s)`,
    });
  }

  score = Math.max(0, Math.min(100, score));
  const grade: TheoryReport['grade'] =
    score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    ok: issues.every((i) => i.severity !== 'error'),
    score,
    grade,
    durationS,
    noteCount: events.length,
    uniquePitchClasses: pcSet.size,
    notesPerSecond,
    detectedKey: bestKey,
    clashRatio,
    largeLeapRatio,
    avgMelodicStep,
    registerSpan,
    issues,
  };
}
