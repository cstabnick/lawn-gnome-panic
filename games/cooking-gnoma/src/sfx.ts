// Sound effects made in code with WebAudio: no files. Browsers only allow sound after a tap, so the first press
// calls unlockAudio().

type Sound = 'tap' | 'pop' | 'swish' | 'plop' | 'splat' | 'ding' | 'cheer';

let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    // No audio here. The game is still playable.
  }
}

function tone(freq: number, toFreq: number, dur: number, type: OscillatorType, vol: number, at: number): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function sfx(kind: Sound): void {
  if (!ctx || ctx.state !== 'running') return;
  switch (kind) {
    case 'tap':
      tone(520, 480, 0.06, 'sine', 0.15, 0);
      break;
    case 'pop':
      tone(660, 990, 0.12, 'sine', 0.18, 0);
      break;
    case 'swish':
      tone(300, 520, 0.14, 'triangle', 0.08, 0);
      break;
    case 'plop':
      tone(260, 120, 0.22, 'sine', 0.2, 0);
      break;
    case 'splat':
      tone(160, 60, 0.12, 'square', 0.08, 0);
      break;
    case 'ding':
      tone(1046, 1046, 0.5, 'sine', 0.2, 0);
      tone(1568, 1568, 0.6, 'sine', 0.14, 0.08);
      break;
    case 'cheer':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.14, i * 0.09));
      break;
  }
}
