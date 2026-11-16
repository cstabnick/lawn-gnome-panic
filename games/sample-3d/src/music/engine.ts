// Playback engine: loads Tone.js lazily, owns the single Transport, and tears a song down
// completely before the next one starts.
//
// - Every start tears down the Transport, its events and all nodes (the `keep` list) before
//   building again; otherwise the next song stacks on top of the last.
// - A `generation` counter drops stale async starts (Tone loads with a dynamic import).
// - Tone.start() is never awaited: without a user gesture (?autostart, online match start, the
//   lobby on page load) it never resolves. The song is built and the Transport started right
//   away; the context unlocks on the first pointer, key or touch event.
// - Everything is wrapped in try/catch: music must never break the game.
import { gainToDb } from '@arcade/volume';
import type * as ToneNS from 'tone';
import { volume } from '../volume';

export type Tone = typeof ToneNS;
/** Registers a node for disposal when the song ends, and returns it. */
export type Keep = <V extends { dispose(): unknown }>(x: V) => V;
/** Builds a song: create nodes (via keep), connect them to `out`, schedule on the Transport. */
export type SongBuilder = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

const MUSIC_DB = -12; // under the SFX in audio.ts

let tone: Tone | null = null;
let loading: Promise<Tone | null> | null = null;
let disposables: { dispose(): unknown }[] = [];
let generation = 0;
let playing = false;
let outVolume: ToneNS.Volume | null = null;

function applyMusicVolume(): void {
  if (!outVolume) return;
  const eff = volume.effective('music');
  try {
    if (eff <= 0.0001) {
      outVolume.mute = true;
    } else {
      outVolume.mute = false;
      outVolume.volume.value = gainToDb(eff, MUSIC_DB);
    }
  } catch { /* ignore */ }
}

volume.subscribe(applyMusicVolume);

export function isMuted(): boolean { return volume.effective('music') <= 0; }

export function setMuted(m: boolean): void {
  volume.setMuted('music', m);
}

function loadTone(): Promise<Tone | null> {
  if (tone) return Promise.resolve(tone);
  loading ??= import('tone')
    .then((m) => (tone = m))
    .catch(() => null);
  return loading;
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
    }
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(ev, unlock, true);
}

/** Master bus: song volume (mute lives here) -> glue compressor -> limiter -> speakers. */
function createMaster(T: Tone, keep: Keep): ToneNS.Volume {
  const limiter = keep(new T.Limiter(-1)).toDestination();
  const glue = keep(new T.Compressor({ threshold: -20, ratio: 2.5, attack: 0.02, release: 0.25 })).connect(limiter);
  const eff = volume.effective('music');
  const out = keep(new T.Volume(eff <= 0.0001 ? MUSIC_DB : gainToDb(eff, MUSIC_DB))).connect(glue);
  out.mute = eff <= 0.0001;
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
    if (tone && disposables.length > 0) tone.getTransport().start();
  } catch { /* ignore */ }
}

export function stopSong(): void {
  generation++;
  playing = false;
  try { if (tone) teardown(tone); } catch { /* ignore */ }
}
