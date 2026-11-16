// Playback engine: loads Tone.js lazily, owns the single Transport, and tears a song down
// completely before the next one starts.
//
// - Every start tears down the Transport, its events and all nodes (the `keep` list) before
//   building again; otherwise the next song stacks on top of the last.
// - A `generation` counter drops stale async starts (Tone loads with a dynamic import).
// - Tone.start() is never awaited: without a user gesture (a song started on page load,
//   a headless test) it never resolves. The song is built and the Transport started right
//   away; the context unlocks on the first pointer, key or touch event.
// - Everything is wrapped in try/catch: music must never break the game.
import type * as ToneNS from 'tone';

export type Tone = typeof ToneNS;
/** Registers a node for disposal when the song ends, and returns it. */
export type Keep = <V extends { dispose(): unknown }>(x: V) => V;
/** Builds a song: create nodes (via keep), connect them to `out`, schedule on the Transport. */
export type SongBuilder = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

const MUSIC_DB = -12; // under the game's sound effects
let muteKey = 'music-muted';

let tone: Tone | null = null;
let loading: Promise<Tone | null> | null = null;
let disposables: { dispose(): unknown }[] = [];
let generation = 0;
let playing = false;
let outVolume: ToneNS.Volume | null = null;
const readMuted = (): boolean => { try { return localStorage.getItem(muteKey) === '1'; } catch { return false; } };
let muted = readMuted();

/** Each game stores its mute setting under its own localStorage key. Call once at startup. */
export function setMuteKey(key: string): void {
  muteKey = key;
  muted = readMuted();
}

export function isMuted(): boolean { return muted; }

export function setMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem(muteKey, m ? '1' : '0'); } catch { /* per-session only */ }
  try { if (outVolume) outVolume.mute = m; } catch { /* ignore */ }
}

function loadTone(): Promise<Tone | null> {
  if (tone) return Promise.resolve(tone);
  loading ??= import('tone')
    .then((m) => {
      useFixedRateContext(m);
      return (tone = m);
    })
    .catch(() => null);
  return loading;
}

/**
 * By default the AudioContext runs at the output device's rate. On a 192 kHz device every synth,
 * reverb and compressor does 4x the work of 48 kHz, and the render quantum (128 frames) is only
 * 0.67 ms, so the audio thread misses deadlines and the music crackles. Pin the rate to 48 kHz
 * (the browser resamples to the device) and use the larger "playback" buffer: music doesn't need
 * low latency, since notes are scheduled ahead on the Transport.
 */
function useFixedRateContext(T: Tone): void {
  try {
    const raw = new AudioContext({ sampleRate: 48000, latencyHint: 'playback' });
    T.setContext(new T.Context(raw));
  } catch {
    // Fall back to Tone's default context.
  }
}

function teardown(T: Tone): void {
  const transport = T.getTransport();
  transport.stop();
  transport.cancel();
  transport.position = 0;
  for (const d of disposables) {
    try { d.dispose(); } catch { /* ignore */ }
  }
  disposables = [];
  outVolume = null;
}

let unlockBound = false;
/** Resumes Tone's AudioContext now if allowed, and on the first click / key / touch otherwise. */
function unlockOnGesture(T: Tone): void {
  if (T.getContext().state === 'running') return;
  void T.start().catch(() => {});
  if (unlockBound) return;
  unlockBound = true;
  const unlock = (): void => {
    void T.start().catch(() => {});
    if (T.getContext().state === 'running') {
      for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) window.removeEventListener(ev, unlock, true);
      unlockBound = false; // so a later suspend (phone backgrounded) can arm the unlock again
    }
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(ev, unlock, true);
}

/** Master bus: song volume (mute lives here) -> glue compressor -> limiter -> speakers. */
function createMaster(T: Tone, keep: Keep): ToneNS.Volume {
  const limiter = keep(new T.Limiter(-1)).toDestination();
  const glue = keep(new T.Compressor({ threshold: -20, ratio: 2.5, attack: 0.02, release: 0.25 })).connect(limiter);
  const out = keep(new T.Volume(MUSIC_DB)).connect(glue);
  out.mute = muted;
  return out;
}

/** Stops whatever is playing and starts the song `build` describes. */
export function playSong(build: SongBuilder): void {
  const gen = ++generation;
  playing = true;
  void loadTone().then((T) => {
    if (!T || gen !== generation) return;
    try {
      unlockOnGesture(T);
      teardown(T);
      const keep: Keep = (x) => { disposables.push(x); return x; };
      outVolume = createMaster(T, keep);
      build(T, keep, outVolume);
      if (playing) T.getTransport().start('+0.05');
    } catch {
      // Music must never break the game.
    }
  });
}

export function pauseSong(): void {
  playing = false;
  try { tone?.getTransport().pause(); } catch { /* ignore */ }
}

export function resumeSong(): void {
  playing = true;
  try {
    // The browser may have suspended the audio context meanwhile (tab hidden, phone locked).
    if (tone) unlockOnGesture(tone);
    if (tone && disposables.length > 0) tone.getTransport().start();
  } catch { /* ignore */ }
}

export function stopSong(): void {
  generation++;
  playing = false;
  try { if (tone) teardown(tone); } catch { /* ignore */ }
}
