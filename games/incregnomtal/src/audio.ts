import { createVolumeStore } from '@arcade/volume';

export const volumeStore = createVolumeStore();

class LawnAudio {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private gain(): number {
    return volumeStore.effective('sounds') * 0.25;
  }

  private tone(freq: number, endFreq: number, dur: number, type: OscillatorType = 'triangle', vol = 1): void {
    const g = this.gain() * vol;
    if (g <= 0.001) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + dur);
    amp.gain.setValueAtTime(g, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  snip(): void {
    this.tone(920, 420, 0.06, 'sawtooth', 0.45);
  }

  splash(): void {
    this.tone(360, 680, 0.11, 'sine', 0.65);
  }

  pop(): void {
    this.tone(420, 860, 0.08, 'triangle', 0.7);
  }

  golden(): void {
    this.tone(660, 1320, 0.16, 'sine', 0.85);
    setTimeout(() => this.tone(990, 1580, 0.18, 'triangle', 0.7), 70);
  }

  bark(): void {
    this.tone(320, 170, 0.1, 'sawtooth', 0.65);
    setTimeout(() => this.tone(360, 190, 0.09, 'sawtooth', 0.55), 110);
  }

  bell(): void {
    this.tone(784, 780, 0.45, 'sine', 0.85);
    this.tone(1175, 1170, 0.35, 'triangle', 0.4);
  }

  problem(): void {
    this.tone(240, 180, 0.18, 'square', 0.35);
  }

  wish(): void {
    this.tone(520, 1040, 0.22, 'sine', 0.6);
  }
}

export const audio = new LawnAudio();
