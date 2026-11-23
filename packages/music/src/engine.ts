// Playback engine: loads Tone.js lazily, owns the single Transport, and tears a song down
// completely before the next one starts.
//
// - Every start tears down the Transport, its events and all nodes (the `keep` list) before
//   building again; otherwise the next song stacks on top of the last.
// - A `generation` counter drops stale async starts (Tone loads with a dynamic import).
// - resume() is never awaited: without a user gesture (a song started on page load,
//   a headless test) it never resolves. The song is built and the Transport started right
//   away; the context unlocks on the first tap, click or key (see armUnlock).
// - Mobile: the AudioContext exists before Tone loads, keeps the device rate on phones,
//   asks iOS for the "playback" audio session (ringer switch), and re-arms after interruptions.
// - The context comes from standardized-audio-context (Tone's own backend), never the bare native
//   AudioContext: Tone relies on its patches for Firefox and Safari (no cancelAndHoldAtTime, ramps
//   with no previous event, param ranges). On a native context, music broke in Firefox.
// - Everything is wrapped in try/catch: music must never break the game.
import type * as ToneNS from 'tone';
import { AudioContext as StdAudioContext, type IAudioContext } from 'standardized-audio-context';

export type Tone = typeof ToneNS;
/** Registers a node for disposal when the song ends, and returns it. */
export type Keep = <V extends { dispose(): unknown }>(x: V) => V;
/** Builds a song: create nodes (via keep), connect them to `out`, schedule on the Transport. */
export type SongBuilder = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

export interface PlayOptions {
  offsetSeconds?: number;
}

export interface SongSpatial {
  gain?: number;
  pan?: number;
  cutoffHz?: number;
  reverbWet?: number;
  rampS?: number;
}

const MUSIC_DB = -12; // under the game's sound effects
/** Extra dB a game can add on top of MUSIC_DB (default 0). Set per game with setMusicBoost. */
let boostDb = 0;
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
  const effectiveGain = volumeGain * (spatial?.gain ?? 1);
  const silent = muted || effectiveGain <= 0.0001;
  try {
    outVolume.mute = silent;
    if (!silent) outVolume.volume.value = MUSIC_DB + boostDb + 20 * Math.log10(effectiveGain);
  } catch { /* ignore */ }
}

/** Sets linear music volume (0..1) relative to MUSIC_DB. */
export function setMusicVolume(gain: number): void {
  volumeGain = Math.min(1, Math.max(0, Number.isFinite(gain) ? gain : 1));
  applyOutput();
}

/** Adds `db` decibels to this game's music (0 = the shared level). Takes effect at once. */
export function setMusicBoost(db: number): void {
  boostDb = Number.isFinite(db) ? db : 0;
  applyOutput();
}

export function isMuted(): boolean { return muted || volumeGain <= 0.0001; }

export function setMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem(muteKey, m ? '1' : '0'); } catch { /* per-session only */ }
  applyOutput();
}

const LATE_START_MSG = 'Start time must be strictly greater';

/**
 * Tone's Source.start clamps a start time that is already in the past to "now", then asserts that it is strictly later
 * than the voice's previous start. When the main thread stalls past Tone's look-ahead (a long frame while a game streams
 * in a region), two late notes on one mono voice both clamp to the same "now" and the assert throws inside Tone's
 * clock, which kills the song. Retry that one start a hair after the previous one instead.
 */
function guardLateStarts(m: Tone): void {
  type Start = (this: LateSource, time?: unknown, offset?: unknown, duration?: unknown) => unknown;
  interface LateSource { now(): number; _state?: { get(t: number): { time: number } | null } }
  // Tone does not export Source itself; every oscillator, player and noise source inherits its start from it.
  const osc = (m as unknown as { Oscillator?: { prototype: object } }).Oscillator?.prototype;
  const proto = (osc ? Object.getPrototypeOf(osc) : null) as { start: Start; __lateGuard?: boolean } | null;
  if (!proto || typeof proto.start !== 'function' || proto.__lateGuard) return;
  const start = proto.start;
  proto.start = function (time, offset, duration) {
    try {
      return start.call(this, time, offset, duration);
    } catch (e) {
      if (!(e instanceof Error) || !e.message.startsWith(LATE_START_MSG)) throw e;
      const now = this.now();
      const prev = this._state?.get(now)?.time ?? now;
      return start.call(this, Math.max(now, prev) + 0.003, offset, duration);
    }
  };
  proto.__lateGuard = true;
}

function loadTone(): Promise<Tone | null> {
  if (tone) return Promise.resolve(tone);
  loading ??= import('tone')
    .then((m) => {
      const raw = getRawContext();
      if (raw) {
        // Tone's types name the native AudioContext, but at runtime it builds on this same library.
        try { m.setContext(new m.Context(raw as unknown as AudioContext)); } catch { /* fall back to Tone's default context */ }
      }
      guardLateStarts(m);
      return (tone = m);
    })
    .catch(() => null);
  return loading;
}

let rawCtx: IAudioContext | null = null;

/**
 * The engine owns the AudioContext (created synchronously, before Tone has loaded) so the
 * first tap can unlock it even while Tone's dynamic import is still in flight. On phones that
 * first tap is often the only gesture for a while; missing it meant no music.
 *
 * The rate is pinned to 48 kHz only on devices running faster than that: on a 192 kHz device every
 * synth, reverb and compressor does 4x the work, and the 128-frame render quantum is only 0.67 ms,
 * so the music crackles. Phones run at 44.1/48 kHz, and iOS Safari can play nothing (or garbage)
 * from a context forced to a rate other than the hardware's, so they keep the native rate.
 * "playback" latency: music doesn't need low latency, notes are scheduled ahead.
 */
function getRawContext(): IAudioContext | null {
  if (rawCtx) return rawCtx;
  if (typeof window === 'undefined') return null;
  try {
    let c: IAudioContext = new StdAudioContext({ latencyHint: 'playback' });
    if (c.sampleRate > 48000) {
      void c.close().catch(() => {});
      c = new StdAudioContext({ sampleRate: 48000, latencyHint: 'playback' });
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
function kick(c: IAudioContext): void {
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
  // Tempo ramps queued by a theme (e.g. Synergy Loop) must not survive into the next track.
  try { transport.bpm.cancelScheduledValues(0); } catch { /* ignore */ }
  transport.position = 0;
  for (const d of disposables) {
    try { d.dispose(); } catch { /* ignore */ }
  }
  disposables = [];
  outVolume = null;
  masterFx = null;
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

// Muffle: a master lowpass sweep plus a tight reverb send, for "the game is paused, the music is far away".
// The lowpass sits at 20 kHz (inaudible) until muffled; the reverb is only built the first time it is needed.
// The cutoff stays high enough that the arpeggios still read through the filter.
const MUFFLE_HZ = 1400;
const MUFFLE_WET = 0.45;
const MUFFLE_RAMP_S = 0.35;
const CLEAR_RAMP_S = 0.35;

interface MasterFx {
  T: Tone;
  keep: Keep;
  glue: ToneNS.Compressor;
  out: ToneNS.Volume;
  panner: ToneNS.Panner;
  lp: ToneNS.Filter;
  send: ToneNS.Gain | null;
}
let masterFx: MasterFx | null = null;
let muffled = false;
let spatial: SongSpatial | null = null;

/** Master bus: song volume (mute lives here) -> panner -> lowpass -> glue compressor -> limiter -> speakers. */
function createMaster(T: Tone, keep: Keep): ToneNS.Volume {
  const limiter = keep(new T.Limiter(-1)).toDestination();
  const glue = keep(new T.Compressor({ threshold: -20, ratio: 2.5, attack: 0.02, release: 0.25 })).connect(limiter);
  const lp = keep(new T.Filter({ frequency: muffled ? MUFFLE_HZ : 20000, type: 'lowpass', rolloff: -12 })).connect(glue);
  const panner = keep(new T.Panner(0)).connect(lp);
  const effectiveGain = volumeGain * (spatial?.gain ?? 1);
  const silent = muted || effectiveGain <= 0.0001;
  const out = keep(new T.Volume(silent ? MUSIC_DB : MUSIC_DB + boostDb + 20 * Math.log10(effectiveGain))).connect(panner);
  out.mute = silent;
  masterFx = { T, keep, glue, out, panner, lp, send: null };
  if (muffled || spatial) applyFilterAndSpatial(0);
  return out;
}

/** Ramps the master lowpass, stereo panner, and reverb send for muffle and/or spatial distance. */
function applyFilterAndSpatial(rampS: number): void {
  const fx = masterFx;
  if (!fx) return;
  try {
    const baseCutoff = muffled ? MUFFLE_HZ : 20000;
    const targetCutoff = Math.max(40, spatial?.cutoffHz !== undefined ? Math.min(baseCutoff, spatial.cutoffHz) : baseCutoff);
    const baseWet = muffled ? MUFFLE_WET : 0;
    const targetWet = Math.max(baseWet, spatial?.reverbWet ?? 0);
    const targetPan = Math.max(-1, Math.min(1, spatial?.pan ?? 0));

    if (targetWet > 0 && !fx.send) {
      // Tight room: the send is tapped before the lowpass, so the highs get a reverb wash; the
      // high-pass keeps the lows out of the tail and the short decay keeps it from smearing.
      const rev = fx.keep(new fx.T.Reverb({ decay: 1.6, preDelay: 0.015, wet: 1 })).connect(fx.glue);
      const hp = fx.keep(new fx.T.Filter(300, 'highpass')).connect(rev);
      fx.send = fx.keep(new fx.T.Gain(0)).connect(hp);
      fx.out.connect(fx.send);
    }
    if (rampS > 0) fx.lp.frequency.exponentialRampTo(targetCutoff, rampS);
    else fx.lp.frequency.setValueAtTime(targetCutoff, fx.T.now());
    if (fx.send) fx.send.gain.rampTo(targetWet, rampS);
    fx.panner.pan.rampTo(targetPan, rampS);
  } catch { /* music must never break the game */ }
}

/**
 * Makes the playing song sound far away (lowpassed, reverbed) without stopping it, e.g. while the
 * game is paused. The song keeps playing underneath. Off restores the clear sound.
 * The setting persists across songs until it is changed again.
 */
export function setSongMuffled(on: boolean): void {
  muffled = on;
  applyFilterAndSpatial(on ? MUFFLE_RAMP_S : CLEAR_RAMP_S);
}

/**
 * Applies spatial attenuation, stereo pan, lowpass, and reverb for distant speakers (e.g. a vehicle radio
 * heard from outside). Pass `null` to restore full-volume centered playback. Persists across songs.
 */
export function setSongSpatial(opts: SongSpatial | null): void {
  spatial = opts;
  applyOutput();
  applyFilterAndSpatial(opts?.rampS ?? 0.12);
}

/** Stops whatever is playing and starts the song `build` describes. */
export function playSong(build: SongBuilder, opts?: PlayOptions): void {
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
      if (playing) {
        if (opts?.offsetSeconds && opts.offsetSeconds > 0) T.getTransport().start('+0.05', opts.offsetSeconds);
        else T.getTransport().start('+0.05');
      }
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
