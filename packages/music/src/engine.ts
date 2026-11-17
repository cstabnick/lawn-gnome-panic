// Playback engine: loads Tone.js lazily, owns the single Transport, and tears a song down
// completely before the next one starts.
//
// - Every start tears down the Transport, its events and all nodes (the `keep` list) before
//   building again; otherwise the next song stacks on top of the last.
// - A `generation` counter drops stale async starts (Tone loads with a dynamic import).
// - resume() is never awaited: without a user gesture (a song started on page load,
//   a headless test) it never resolves. The song is built and the Transport started right
//   away; the context unlocks on the first tap, click or key (see armUnlock).
// - Mobile: the native AudioContext exists before Tone loads, keeps the device rate on phones,
//   asks iOS for the "playback" audio session (ringer switch), and re-arms after interruptions.
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
let volumeGain = 1;
const readMuted = (): boolean => { try { return localStorage.getItem(muteKey) === '1'; } catch { return false; } };
let muted = readMuted();

/** Each game stores its mute setting under its own localStorage key. Call once at startup. */
export function setMuteKey(key: string): void {
  muteKey = key;
  muted = readMuted();
}

function applyOutput(): void {
  if (!outVolume) return;
  const silent = muted || volumeGain <= 0.0001;
  try {
    outVolume.mute = silent;
    if (!silent) outVolume.volume.value = MUSIC_DB + 20 * Math.log10(volumeGain);
  } catch { /* ignore */ }
}

/** Sets linear music volume (0..1) relative to MUSIC_DB. */
export function setMusicVolume(gain: number): void {
  volumeGain = Math.min(1, Math.max(0, Number.isFinite(gain) ? gain : 1));
  applyOutput();
}

export function isMuted(): boolean { return muted || volumeGain <= 0.0001; }

export function setMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem(muteKey, m ? '1' : '0'); } catch { /* per-session only */ }
  applyOutput();
}

function loadTone(): Promise<Tone | null> {
  if (tone) return Promise.resolve(tone);
  loading ??= import('tone')
    .then((m) => {
      const raw = getRawContext();
      if (raw) {
        try { m.setContext(new m.Context(raw)); } catch { /* fall back to Tone's default context */ }
      }
      return (tone = m);
    })
    .catch(() => null);
  return loading;
}

let rawCtx: AudioContext | null = null;

/**
 * The engine owns the native AudioContext (created synchronously, before Tone has loaded) so the
 * first tap can unlock it even while Tone's dynamic import is still in flight. On phones that
 * first tap is often the only gesture for a while; missing it meant no music.
 *
 * The rate is pinned to 48 kHz only on devices running faster than that: on a 192 kHz device every
 * synth, reverb and compressor does 4x the work, and the 128-frame render quantum is only 0.67 ms,
 * so the music crackles. Phones run at 44.1/48 kHz, and iOS Safari can play nothing (or garbage)
 * from a context forced to a rate other than the hardware's, so they keep the native rate.
 * "playback" latency: music doesn't need low latency, notes are scheduled ahead.
 */
function getRawContext(): AudioContext | null {
  if (rawCtx) return rawCtx;
  if (typeof window === 'undefined') return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    let c = new AC({ latencyHint: 'playback' });
    if (c.sampleRate > 48000) {
      void c.close().catch(() => {});
      c = new AC({ sampleRate: 48000, latencyHint: 'playback' });
    }
    // iOS moves the context to "suspended"/"interrupted" on a call, lock or app switch: re-arm.
    c.addEventListener('statechange', () => { if (c.state !== 'running') armUnlock(); });
    rawCtx = c;
  } catch {
    rawCtx = null;
  }
  return rawCtx;
}

/**
 * iOS plays Web Audio in the "ambient" session by default, which the ringer switch silences, so
 * on a phone in silent mode the music never plays. "playback" is what a media player uses.
 * Safari 16.4+; elsewhere this is a no-op.
 */
function preferPlaybackSession(): void {
  try {
    const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (s && s.type !== 'playback') s.type = 'playback';
  } catch { /* ignore */ }
}

/** Plays one silent sample: older iOS only unlocks a context that starts a source inside a gesture. */
function kick(c: AudioContext): void {
  try {
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, c.sampleRate);
    src.connect(c.destination);
    src.start(0);
  } catch { /* ignore */ }
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
let visibilityBound = false;
let pausedByVisibility = false;

/** Pauses the Transport when the tab is hidden so alt-tabbing back never causes a timer catch-up storm. */
function bindVisibility(T: Tone): void {
  if (visibilityBound || typeof document === 'undefined') return;
  visibilityBound = true;
  document.addEventListener('visibilitychange', () => {
    try {
      if (document.hidden) {
        if (playing && disposables.length > 0) {
          pausedByVisibility = true;
          T.getTransport().pause();
        }
      } else if (pausedByVisibility) {
        pausedByVisibility = false;
        armUnlock();
        if (playing && disposables.length > 0) T.getTransport().start('+0.05');
      }
    } catch { /* ignore */ }
  });
}

// pointerdown is not a user activation for touch input (pointerup/touchend/click are), so a
// phone needs the later events; a drag that ends in touchend is not an activation on iOS either.
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

function disarmUnlock(): void {
  for (const ev of UNLOCK_EVENTS) window.removeEventListener(ev, unlock, true);
  unlockBound = false; // so a later suspend (phone backgrounded) can arm the unlock again
}

function unlock(): void {
  const c = rawCtx;
  if (!c) return;
  preferPlaybackSession();
  if (c.state === 'running') { disarmUnlock(); return; }
  // resume() must be called inside the gesture itself (not after an await), so call it directly.
  // It also covers iOS's "interrupted" state.
  void c.resume().then(() => { if (c.state === 'running') disarmUnlock(); }).catch(() => {});
  kick(c);
}

/** Resumes the AudioContext now if allowed, and on the first tap / click / key otherwise. */
function armUnlock(): void {
  const c = getRawContext();
  if (!c || typeof window === 'undefined') return;
  if (c.state === 'running') return;
  void c.resume().catch(() => {}); // succeeds if the page already had a gesture
  if (unlockBound) return;
  unlockBound = true;
  for (const ev of UNLOCK_EVENTS) window.addEventListener(ev, unlock, true);
}

/** Master bus: song volume (mute lives here) -> glue compressor -> limiter -> speakers. */
function createMaster(T: Tone, keep: Keep): ToneNS.Volume {
  const limiter = keep(new T.Limiter(-1)).toDestination();
  const glue = keep(new T.Compressor({ threshold: -20, ratio: 2.5, attack: 0.02, release: 0.25 })).connect(limiter);
  const silent = muted || volumeGain <= 0.0001;
  const out = keep(new T.Volume(silent ? MUSIC_DB : MUSIC_DB + 20 * Math.log10(volumeGain))).connect(glue);
  out.mute = silent;
  return out;
}

/** Stops whatever is playing and starts the song `build` describes. */
export function playSong(build: SongBuilder): void {
  const gen = ++generation;
  playing = true;
  try { armUnlock(); } catch { /* ignore */ } // now, so a tap while Tone loads still unlocks
  void loadTone().then((T) => {
    if (!T || gen !== generation) return;
    try {
      bindVisibility(T);
      armUnlock();
      pausedByVisibility = false;
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
    armUnlock();
    if (tone && disposables.length > 0) tone.getTransport().start();
  } catch { /* ignore */ }
}

export function stopSong(): void {
  generation++;
  playing = false;
  try { if (tone) teardown(tone); } catch { /* ignore */ }
}
