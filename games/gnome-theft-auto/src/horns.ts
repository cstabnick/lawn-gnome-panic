// Pay 'n' Glaze horn sounds as plain note lists. Pure data and maths, no WebAudio: audio.ts plays them.

export interface HornNote {
  freq: number;
  start: number;
  dur: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  gain: number;
  slideTo?: number;
  vibrato?: number;
}

const STOCK: HornNote[] = [
  // The game's original honk (the default playHorn case).
  { freq: 420, start: 0, dur: 0.18, type: 'sawtooth', gain: 0.18 },
];

const NOTES: Record<string, HornNote[]> = {
  stock: STOCK,
  // Rubber duck: a rising squeeze, then a short blip.
  squeak: [
    { freq: 900, start: 0, dur: 0.12, type: 'sine', gain: 0.3, slideTo: 1700 },
    { freq: 1400, start: 0.13, dur: 0.06, type: 'sine', gain: 0.3 },
  ],
  // Cow: a long falling low moo with a wobble.
  moo: [
    { freq: 160, start: 0, dur: 0.9, type: 'sawtooth', gain: 0.3, slideTo: 120, vibrato: 6 },
  ],
  // Party trumpet: two short notes, then a held third.
  trumpet: [
    { freq: 392, start: 0, dur: 0.12, type: 'square', gain: 0.25 },
    { freq: 392, start: 0.12, dur: 0.12, type: 'square', gain: 0.25 },
    { freq: 523, start: 0.24, dur: 0.4, type: 'square', gain: 0.25 },
  ],
  // Sheriff siren: up to 900 Hz and back down to 600 Hz.
  siren: [
    { freq: 600, start: 0, dur: 0.5, type: 'triangle', gain: 0.3, slideTo: 900 },
    { freq: 900, start: 0.5, dur: 0.5, type: 'triangle', gain: 0.3, slideTo: 600 },
  ],
  // Bicycle bell: two inharmonic pings that ring out.
  bell: [
    { freq: 1760, start: 0, dur: 0.5, type: 'sine', gain: 0.3 },
    { freq: 2349, start: 0, dur: 0.5, type: 'sine', gain: 0.2 },
  ],
  // Kazoo: a buzzy reed with fast vibrato.
  kazoo: [
    { freq: 330, start: 0, dur: 0.5, type: 'sawtooth', gain: 0.25, vibrato: 30 },
  ],
};

/** Note list for a horn id. Unknown ids give the stock honk. Times in seconds from 0. */
export function hornNotes(id: string): HornNote[] {
  const notes = Object.prototype.hasOwnProperty.call(NOTES, id) ? NOTES[id] : STOCK;
  return notes.map((n) => ({ ...n }));
}
