import type * as ToneNS from 'tone';
import {
  buildTranceTrack,
  createAmbientPad,
  createBongoKit,
  createFx,
  createRhodes,
  createSitar,
  createVibraphone,
  type Keep,
  type Tone,
} from '@lawn/music';

function midiToNote(m: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const oct = Math.floor(m / 12) - 1;
  return `${names[((m % 12) + 12) % 12]}${oct}`;
}

function degToMidi(root: number, scale: readonly number[], deg: number): number {
  const len = scale.length;
  const oct = Math.floor(deg / len);
  const idx = ((deg % len) + len) % len;
  return root + oct * 12 + scale[idx];
}

// Shared Gnomokemon Safari Leitmotif (scale degrees)
const SAFARI_MOTIF = [0, 2, 4, 7, 5, 4, 2, 4, 0, -1, 0, 2];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
const IONIAN = [0, 2, 4, 5, 7, 9, 11];
const PHRYGIAN_DOM = [0, 1, 4, 5, 7, 8, 10];

function createBass(T: Tone, keep: Keep, dest: ToneNS.InputNode): (midi: number, dur: number, time: number, vel: number) => void {
  const synth = keep(
    new T.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.22, sustain: 0.35, release: 0.15 },
      filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.2, baseFrequency: 180, octaves: 1.5 },
    }),
  ).connect(dest);
  synth.volume.value = -7;
  return (midi, dur, time, vel) => {
    synth.triggerAttackRelease(midiToNote(midi), dur, time, vel);
  };
}

/**
 * World 1: Fescue Lawn — bouncy Lydian dog-back safari with Vibraphone, Rhodes, and Bongos.
 */
export function buildGnomokemonLawnTrack(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = 116;
  const fx = createFx(T, keep, out, { reverbDecay: 2.8, echoTime: '8n.', delayDry: 0.12 });
  const vibe = createVibraphone(T, keep, out, fx);
  const rhodes = createRhodes(T, keep, out, fx);
  const bongos = createBongoKit(T, keep, out, fx);
  const bass = createBass(T, keep, out);

  const root = 65; // F4
  const bassRoot = 41; // F2
  const chords = [0, 1, 4, 0, 3, 4, 2, 0];
  let step = 0;

  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      const deg = chords[bar];
      const sectionB = Math.floor(step / 128) % 2 === 1;

      if (pos === 0 || pos === 6 || pos === 8) bongos.low(time, pos === 0 ? 0.8 : 0.58);
      if (pos === 4 || pos === 10 || pos === 14) bongos.high(time, 0.55);
      if (pos % 2 === 1) bongos.shaker(time, 0.25);

      if (pos === 0 || pos === 8) {
        bass(degToMidi(bassRoot, LYDIAN, deg), 0.22, time, 0.78);
      } else if (pos === 12) {
        bass(degToMidi(bassRoot, LYDIAN, deg + 4), 0.14, time, 0.6);
      }

      if (pos === 0 || pos === 6 || pos === 12) {
        const triad = [
          degToMidi(root - 12, LYDIAN, deg),
          degToMidi(root - 12, LYDIAN, deg + 2),
          degToMidi(root - 12, LYDIAN, deg + 4),
        ];
        rhodes.play(triad, 0.28, time, pos === 0 ? 0.62 : 0.44);
      }

      if (pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        const mDeg = SAFARI_MOTIF[idx] + (sectionB ? 2 : 0);
        if (pos !== 14 || bar % 2 === 1) {
          vibe.play(degToMidi(root, LYDIAN, mDeg), 0.28, time, 0.74);
        }
      }

      step++;
    }, '16n'),
  );
  loop.start(0);
}

/**
 * World 2: Desert Yard — sun-baked Phrygian-Dominant safari with Sitar, Vibraphone, and Bongos.
 */
export function buildGnomokemonDesertTrack(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = 112;
  const fx = createFx(T, keep, out, { reverbDecay: 3.4, echoTime: '8n.', delayDry: 0.18 });
  const sitar = createSitar(T, keep, out, fx);
  const vibe = createVibraphone(T, keep, out, fx);
  const pad = createAmbientPad(T, keep, out, fx);
  const bongos = createBongoKit(T, keep, out, fx);
  const bass = createBass(T, keep, out);

  const root = 62; // D4
  const bassRoot = 38; // D2
  const chords = [0, 1, 0, 6, 0, 1, 4, 0];
  let step = 0;

  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      const deg = chords[bar];

      if (pos === 0 || pos === 6 || pos === 10) bongos.low(time, pos === 0 ? 0.85 : 0.62);
      if (pos === 4 || pos === 8 || pos === 12 || pos === 14) bongos.high(time, 0.56);
      if (pos % 2 === 0) bongos.shaker(time, 0.24);

      if (pos === 0 || pos === 10) {
        bass(degToMidi(bassRoot, PHRYGIAN_DOM, deg), 0.24, time, 0.8);
      }

      if (pos === 0 && bar % 2 === 0) {
        pad.play(
          [
            degToMidi(root - 12, PHRYGIAN_DOM, deg),
            degToMidi(root - 12, PHRYGIAN_DOM, deg + 2),
            degToMidi(root - 12, PHRYGIAN_DOM, deg + 4),
          ],
          2.1,
          time,
          0.35,
        );
      }

      if (pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        const mDeg = SAFARI_MOTIF[idx];
        const midi = degToMidi(root, PHRYGIAN_DOM, mDeg);
        if (bar % 2 === 0) sitar.pluck(midi, time, 0.72);
        else vibe.play(midi, 0.26, time, 0.68);
      }

      step++;
    }, '16n'),
  );
  loop.start(0);
}

/**
 * Gnokomindex & Photo Gallery — relaxed 3/4 Field Guide Waltz.
 */
export function buildGnomokemonMenuTrack(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = 98;
  const fx = createFx(T, keep, out, { reverbDecay: 3.6, echoTime: '4n', delayDry: 0.1 });
  const vibe = createVibraphone(T, keep, out, fx);
  const rhodes = createRhodes(T, keep, out, fx);
  const bongos = createBongoKit(T, keep, out, fx);
  const bass = createBass(T, keep, out);

  const root = 67; // G4
  const bassRoot = 43; // G2
  const chords = [0, 3, 4, 0, 5, 3, 4, 0];
  let step = 0;

  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 12) % 8;
      const pos = step % 12;
      const deg = chords[bar];

      if (pos === 0) {
        bass(degToMidi(bassRoot, IONIAN, deg), 0.4, time, 0.72);
        bongos.low(time, 0.55);
      } else if (pos === 4 || pos === 8) {
        rhodes.play(
          [
            degToMidi(root - 12, IONIAN, deg),
            degToMidi(root - 12, IONIAN, deg + 2),
            degToMidi(root - 12, IONIAN, deg + 4),
          ],
          0.24,
          time,
          0.45,
        );
        bongos.shaker(time, 0.22);
      }

      if (pos === 0 || pos === 4 || pos === 8) {
        const idx = (bar * 3 + pos / 4) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, IONIAN, SAFARI_MOTIF[idx]), 0.42, time, 0.65);
      }

      step++;
    }, '16n'),
  );
  loop.start(0);
}

/**
 * Gnome Jesus Grading — reverent, whimsical review theme.
 */
export function buildGnomokemonGradingTrack(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = 92;
  const fx = createFx(T, keep, out, { reverbDecay: 4.2, echoTime: '4n', delayDry: 0.14 });
  const pad = createAmbientPad(T, keep, out, fx);
  const vibe = createVibraphone(T, keep, out, fx);
  const rhodes = createRhodes(T, keep, out, fx);

  const root = 60; // C4
  const chords = [0, 3, 4, 0];
  let step = 0;

  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 4;
      const pos = step % 16;
      const deg = chords[bar];

      if (pos === 0) {
        const triad = [
          degToMidi(root - 12, IONIAN, deg),
          degToMidi(root - 12, IONIAN, deg + 2),
          degToMidi(root - 12, IONIAN, deg + 4),
        ];
        pad.play(triad, 2.4, time, 0.42);
        rhodes.play(triad, 0.6, time, 0.5);
      }

      if (pos % 4 === 0) {
        const arp = [0, 2, 4, 7][pos / 4];
        vibe.play(degToMidi(root, IONIAN, deg + arp), 0.45, time, 0.62);
      }

      step++;
    }, '16n'),
  );
  loop.start(0);
}

/**
 * Adapted Trance Generator for Gnomokemon Snap (Fescue Lawn):
 * Runs @lawn/music's uplifting trance generator and overlays the Gnomokemon Safari Leitmotif
 * on Vibraphone + Bongos synced to the shared Transport.
 */
export function buildGnomokemonTranceLawn(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  buildTranceTrack(T, keep, out, 777);
  const fx = createFx(T, keep, out, { reverbDecay: 3.0, echoTime: '8n.' });
  const vibe = createVibraphone(T, keep, out, fx, { volumeDb: -10 });
  const bongos = createBongoKit(T, keep, out, fx, { volumeDb: -6 });
  const root = 65; // F4
  let step = 0;

  const overlay = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      if (pos === 0 || pos === 6 || pos === 10) bongos.high(time, 0.45);
      if (bar >= 2 && pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, LYDIAN, SAFARI_MOTIF[idx]), 0.24, time, 0.72);
      }
      step++;
    }, '16n'),
  );
  overlay.start(0);
}

/**
 * Adapted Trance Generator for Gnomokemon Snap (Desert Yard):
 * Pairs @lawn/music's trance engine with Sitar & Vibraphone Phrygian-Dominant safari hooks.
 */
export function buildGnomokemonTranceDesert(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  buildTranceTrack(T, keep, out, 404);
  const fx = createFx(T, keep, out, { reverbDecay: 3.4, echoTime: '8n.' });
  const sitar = createSitar(T, keep, out, fx, { volumeDb: -7 });
  const bongos = createBongoKit(T, keep, out, fx, { volumeDb: -5 });
  const root = 62; // D4
  let step = 0;

  const overlay = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      if (pos === 0 || pos === 6 || pos === 12) bongos.low(time, 0.52);
      if (bar >= 2 && pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        sitar.pluck(degToMidi(root, PHRYGIAN_DOM, SAFARI_MOTIF[idx]), time, 0.7);
      }
      step++;
    }, '16n'),
  );
  overlay.start(0);
}

export function buildGnomokemonTranceDepths(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  buildTranceTrack(T, keep, out, 303);
  const fx = createFx(T, keep, out, { reverbDecay: 4.2, echoTime: '8n.' });
  const vibe = createVibraphone(T, keep, out, fx, { volumeDb: -9 });
  const root = 60; // C4
  let step = 0;

  const overlay = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      if (bar >= 2 && pos % 4 === 0) {
        const idx = (bar * 4 + pos / 4) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, IONIAN, SAFARI_MOTIF[idx]), 0.32, time, 0.68);
      }
      step++;
    }, '16n'),
  );
  overlay.start(0);
}

export function buildGnomokemonTranceKiln(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  buildTranceTrack(T, keep, out, 999);
  const fx = createFx(T, keep, out, { reverbDecay: 3.6, echoTime: '8n.' });
  const vibe = createVibraphone(T, keep, out, fx, { volumeDb: -8 });
  const bongos = createBongoKit(T, keep, out, fx, { volumeDb: -4 });
  const root = 65; // F4
  let step = 0;

  const overlay = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      if (pos === 0 || pos === 6 || pos === 10 || pos === 14) bongos.high(time, 0.55);
      if (bar >= 1 && pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, LYDIAN, SAFARI_MOTIF[idx] + 2), 0.24, time, 0.78);
      }
      step++;
    }, '16n'),
  );
  overlay.start(0);
}

export function buildGnomokemonTranceOcean(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  buildTranceTrack(T, keep, out, 505);
  const fx = createFx(T, keep, out, { reverbDecay: 4.5, echoTime: '8n.', delayDry: 0.16 });
  const vibe = createVibraphone(T, keep, out, fx, { volumeDb: -8 });
  const pad = createAmbientPad(T, keep, out, fx, { volumeDb: -12 });
  const root = 64; // E4
  let step = 0;

  const overlay = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      if (pos === 0 && bar % 2 === 0) {
        pad.play([40, 47, 52, 59], 2.5, time, 0.35);
      }
      if (bar >= 1 && pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, LYDIAN, SAFARI_MOTIF[idx]), 0.35, time, 0.72);
      }
      step++;
    }, '16n'),
  );
  overlay.start(0);
}

/**
 * World 5: Cistern Reef — breezy underwater bossa-nova / marimba groove
 * with syncopated Rhodes chords, bubbly Vibraphone, and soft Bongos.
 */
export function buildGnomokemonOceanBossa(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = 108;
  const fx = createFx(T, keep, out, { reverbDecay: 3.8, echoTime: '8n.', delayDry: 0.14 });
  const vibe = createVibraphone(T, keep, out, fx, { volumeDb: -9 });
  const rhodes = createRhodes(T, keep, out, fx, { volumeDb: -11 });
  const bongos = createBongoKit(T, keep, out, fx, { volumeDb: -6 });
  const bass = createBass(T, keep, out);

  const root = 64; // E4
  const bassRoot = 40; // E2
  const chords = [0, 3, 2, 4, 0, 5, 3, 4];
  let step = 0;

  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      const deg = chords[bar];

      // Bossa clave / bongo pattern
      if (pos === 0 || pos === 6 || pos === 10) bongos.low(time, 0.62);
      if (pos === 3 || pos === 8 || pos === 14) bongos.high(time, 0.48);
      if (pos % 2 === 0) bongos.shaker(time, 0.22);

      // Syncopated bossa bass (1, dotted-4th, 3, 4-and)
      if (pos === 0 || pos === 10) {
        bass(degToMidi(bassRoot, LYDIAN, deg), 0.3, time, 0.76);
      } else if (pos === 6 || pos === 14) {
        bass(degToMidi(bassRoot, LYDIAN, deg + 4), 0.16, time, 0.6);
      }

      // Lush Rhodes bossa stabs
      if (pos === 0 || pos === 3 || pos === 6 || pos === 12) {
        rhodes.play(
          [
            degToMidi(root - 12, LYDIAN, deg),
            degToMidi(root - 12, LYDIAN, deg + 2),
            degToMidi(root - 12, LYDIAN, deg + 4),
            degToMidi(root - 12, LYDIAN, deg + 6),
          ],
          0.26,
          time,
          0.46,
        );
      }

      // Bubbly Vibraphone Gnomokemon Leitmotif
      if (pos % 2 === 0 && (pos !== 10 || bar % 2 === 1)) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, LYDIAN, SAFARI_MOTIF[idx]), 0.3, time, 0.72);
      }

      step++;
    }, '16n'),
  );
  loop.start(0);
}

/**
 * World 6: Starlight Greenhouse — dreamy 94 BPM midnight nocturne
 * with AmbientPad, Rhodes, shimmering Vibraphone arps, and soft Bongos.
 */
export function buildGnomokemonNightNocturne(T: Tone, keep: Keep, out: ToneNS.Volume): void {
  T.getTransport().bpm.value = 94;
  const fx = createFx(T, keep, out, { reverbDecay: 4.8, echoTime: '8n.', delayDry: 0.2 });
  const pad = createAmbientPad(T, keep, out, fx, { volumeDb: -11 });
  const vibe = createVibraphone(T, keep, out, fx, { volumeDb: -8 });
  const rhodes = createRhodes(T, keep, out, fx, { volumeDb: -10 });
  const bongos = createBongoKit(T, keep, out, fx, { volumeDb: -8 });
  const bass = createBass(T, keep, out);

  const root = 69; // A4
  const bassRoot = 45; // A2
  const chords = [0, 5, 3, 4, 0, 2, 3, 4];
  let step = 0;

  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(step / 16) % 8;
      const pos = step % 16;
      const deg = chords[bar];

      if (pos === 0) {
        const triad = [
          degToMidi(root - 12, IONIAN, deg),
          degToMidi(root - 12, IONIAN, deg + 2),
          degToMidi(root - 12, IONIAN, deg + 4),
        ];
        pad.play(triad, 2.5, time, 0.38);
        rhodes.play(triad, 0.8, time, 0.45);
        bass(degToMidi(bassRoot, IONIAN, deg), 0.5, time, 0.7);
      }

      if (pos === 0 || pos === 8) bongos.low(time, 0.48);
      if (pos % 4 === 2) bongos.shaker(time, 0.2);

      if (pos % 2 === 0) {
        const idx = (bar * 8 + pos / 2) % SAFARI_MOTIF.length;
        vibe.play(degToMidi(root, IONIAN, SAFARI_MOTIF[idx]), 0.42, time, 0.66);
      }

      step++;
    }, '16n'),
  );
  loop.start(0);
}
