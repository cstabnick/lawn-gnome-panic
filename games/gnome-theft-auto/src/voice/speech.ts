// The game's one speaking voice engine (@lawn/mutter), routed through the game's audio graph:
//   audio.ts master <- voices gain (the Voices slider in Options, saved as 'gta.vol.voices')
// so the mute key mutes it, and the world duck (cutscenes, shops) does not. Cutscene dialogue (director.ts), the
// mission comms panel (briefing/) and ambient gnome barks (ambientGnomes.ts) all speak through it.
import { createMutter, type Mutter, type SayOptions, type VoiceSpec } from '@lawn/mutter';
import { getAudioOutput, unlockAudio } from '../audio';
import { getListener } from '../sound/bus';

const VOL_KEY = 'gta.vol.voices';
/** Voices sit a little under the music: the Blackjack mutter at full scale is loud. */
const VOICE_LEVEL = 0.5;

let voicesVol = loadVol();
let gain: GainNode | null = null;
let gainCtx: AudioContext | null = null;
let mutter: Mutter | null = null;

function loadVol(): number {
  try {
    const raw = localStorage.getItem(VOL_KEY);
    const v = Number(raw);
    return raw === null || !Number.isFinite(v) ? 1 : Math.max(0, Math.min(1, v));
  } catch {
    return 1;
  }
}

function out(): { ctx: AudioContext; dest: AudioNode } | null {
  const o = getAudioOutput();
  if (!o) return null;
  if (!gain || gainCtx !== o.ctx) {
    gain = o.ctx.createGain();
    gain.gain.value = voicesVol;
    gain.connect(o.master);
    gainCtx = o.ctx;
  }
  return { ctx: o.ctx, dest: gain };
}

/** The shared voice engine. Silent until the game's audio is unlocked (audio.ts unlockAudio, on the first gesture). */
export function speech(): Mutter {
  if (!mutter) mutter = createMutter({ gain: () => VOICE_LEVEL, output: out });
  return mutter;
}

/** Make sure the audio graph exists (call from a user gesture, e.g. a tap on the comms panel). */
export function unlockSpeech(): void {
  unlockAudio();
  speech().unlock();
}

export function getVoiceVolume(): number {
  return voicesVol;
}

/** 0..1, saved in localStorage ('gta.vol.voices'). */
export function setVoiceVolume(v: number): void {
  voicesVol = Math.max(0, Math.min(1, v));
  try {
    localStorage.setItem(VOL_KEY, String(voicesVol));
  } catch {
    /* storage blocked: the volume still applies to this page */
  }
  if (gain && gainCtx) gain.gain.setTargetAtTime(voicesVol, gainCtx.currentTime, 0.05);
}

/** Say a line in a voice. Returns its length in seconds (0 when silent). */
export function speak(text: string, voice: number | VoiceSpec, opts?: SayOptions): number {
  return speech().say(text, voice, opts);
}

/** Gain and pan for a voice at (x, z) heard from the listener (sound/bus.ts): full within 3 m, gone by `maxDist`. */
export function voiceSpatial(x: number, z: number, maxDist = 16): { gain: number; pan: number } {
  const l = getListener();
  const dx = x - l.x;
  const dz = z - l.z;
  const d = Math.hypot(dx, dz);
  const g = d <= 3 ? 1 : Math.max(0, 1 - (d - 3) / Math.max(1, maxDist - 3));
  // The chase-camera convention of sound/spatial.ts: right is (-cos yaw, sin yaw).
  const right = (dx * -Math.cos(l.yaw) + dz * Math.sin(l.yaw)) / Math.max(4, d);
  return { gain: g * g, pan: Math.max(-1, Math.min(1, right)) * 0.7 };
}

/** Say a line from a place in the world (an ambient gnome's bark): quieter with distance, panned. 0 if out of range. */
export function speakAt(text: string, voice: number | VoiceSpec, x: number, z: number, maxDist = 16): number {
  const s = voiceSpatial(x, z, maxDist);
  if (s.gain <= 0.01) return 0;
  return speech().say(text, voice, { gain: s.gain, pan: s.pan });
}
