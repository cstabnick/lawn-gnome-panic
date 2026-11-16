// One queue for every spoken line (gnome shouts and the announcer), on the browser's speech synthesis.
// Speech synthesis cannot be routed through WebAudio, so voice "effects" are made from the speech itself:
// pitch, rate, stretched spellings, and echo tails (the same words again, quieter and lower).
// Add `#mute` to the URL to silence everything.

/** Which kind of voice to use. 'announcer' prefers a local robotic voice (Microsoft David/Mark/Sam on Windows). */
export type VoiceKind = 'gnome' | 'announcer';

export interface SpeechPart {
  text: string;
  voice?: VoiceKind;
  /** 0..2, default 1. */
  pitch?: number;
  /** 0.1..10, default 1. */
  rate?: number;
  /** 0..1, default 1. */
  volume?: number;
}

const ANNOUNCER_KEY = 'gnome-bowling-announcer';

function muted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

function synth(): SpeechSynthesis | null {
  if (muted() || typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

/** Robot-sounding local voices first (the classic Windows ones), then any local English voice, then any English. */
const ROBOT_NAMES = ['sam', 'david', 'mark', 'george', 'fred', 'zarvox', 'ralph'];

function findVoice(kind: VoiceKind): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const en = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (en.length === 0) return null;
  if (kind === 'announcer') {
    const local = en.filter((v) => v.localService);
    for (const n of ROBOT_NAMES) {
      const v = local.find((x) => x.name.toLowerCase().includes(n));
      if (v) return v;
    }
    return local[0] ?? en[0];
  }
  return en.find((v) => v.localService) ?? en[0];
}

/**
 * Speaks the parts one after another. `interrupt` (default false) first cancels anything still queued or speaking.
 * Safe to call when speech is missing or muted (does nothing).
 */
export function speak(parts: SpeechPart[], interrupt = false): void {
  const s = synth();
  if (!s) return;
  try {
    if (interrupt) s.cancel();
    for (const p of parts) {
      const u = new SpeechSynthesisUtterance(p.text);
      u.pitch = p.pitch ?? 1;
      u.rate = p.rate ?? 1;
      u.volume = p.volume ?? 1;
      const v = findVoice(p.voice ?? 'gnome');
      if (v) u.voice = v;
      s.speak(u);
    }
  } catch {
    // speech unavailable: the sound effects still play
  }
}

/** True while something is being spoken or is queued. */
export function speaking(): boolean {
  const s = synth();
  return s !== null && (s.speaking || s.pending);
}

/** Stops all speech now. */
export function hush(): void {
  synth()?.cancel();
}

/** The announcer setting (menu toggle), saved in localStorage. Default on. */
export function announcerOn(): boolean {
  try {
    return localStorage.getItem(ANNOUNCER_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setAnnouncerOn(on: boolean): void {
  try {
    localStorage.setItem(ANNOUNCER_KEY, on ? 'on' : 'off');
  } catch {
    // storage blocked: the setting lasts until reload
  }
}

// Some browsers load the voice list late; asking once early makes findVoice work on the first line.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
  } catch {
    // ignore
  }
}
