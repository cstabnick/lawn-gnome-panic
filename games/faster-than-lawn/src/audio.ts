import type { SfxName } from './config';

// WebAudio sound effects, generated in code. Every call is wrapped so audio never throws.

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/** One oscillator through a gain envelope, sweeping frequency and fading out. */
function tone(
  freqStart: number,
  freqEnd: number,
  durationS: number,
  type: OscillatorType,
  volume: number,
  delayS = 0,
): void {
  try {
    const c = getContext();
    const start = c.currentTime + delayS;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, start);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, start + durationS);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationS);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + durationS);
  } catch {
    // Audio must never break the game.
  }
}

export function playSfx(name: SfxName): void {
  try {
    switch (name) {
      case 'click':
        tone(600, 600, 0.04, 'square', 0.06);
        break;
      case 'fire':
        tone(900, 300, 0.12, 'square', 0.08);
        break;
      case 'hit':
        tone(200, 50, 0.3, 'sawtooth', 0.14);
        break;
      case 'shieldBlock':
        tone(1200, 800, 0.15, 'sine', 0.12);
        break;
      case 'miss':
        tone(400, 600, 0.1, 'triangle', 0.1);
        break;
      case 'jump':
        tone(200, 1200, 0.5, 'sine', 0.12);
        break;
      case 'win':
        // Three rising notes.
        tone(523, 523, 0.12, 'square', 0.08, 0);
        tone(659, 659, 0.12, 'square', 0.08, 0.14);
        tone(784, 784, 0.25, 'square', 0.08, 0.28);
        break;
      case 'lose':
        tone(400, 60, 0.8, 'sawtooth', 0.12);
        break;
      case 'buy':
        tone(1320, 1320, 0.06, 'square', 0.07, 0);
        tone(1760, 1760, 0.08, 'square', 0.07, 0.07);
        break;
    }
  } catch {
    // Audio must never break the game.
  }
}
