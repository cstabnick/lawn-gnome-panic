// Sound effects made in WebAudio (no files). Muted with M, or with #mute in the URL. The context starts on the first tap.
let ctx: AudioContext | null = null;
let muted = typeof location !== 'undefined' && /(^|[#&])mute\b/.test(location.hash);

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number): void {
  if (muted) return;
  const a = audio();
  if (!a) return;
  try {
    const t0 = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch {
    /* audio is optional */
  }
}

export const sfx = {
  isMuted: () => muted,
  toggle(): boolean {
    muted = !muted;
    return muted;
  },
  /** A ball knock; louder for a harder hit. */
  clack(strength: number): void {
    tone(1400 + strength * 300, 0.05, 'triangle', Math.min(0.25, 0.04 + strength * 0.12));
  },
  pocket(): void {
    tone(260, 0.22, 'sine', 0.22, 0, 90);
  },
  foul(): void {
    tone(180, 0.35, 'sawtooth', 0.12, 0, 120);
  },
  win(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, i * 0.12));
  },
  lose(): void {
    [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.09, i * 0.18));
  },
};
