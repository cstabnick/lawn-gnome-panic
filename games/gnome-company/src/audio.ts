import type { SoundEvent } from './shared/types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureCtx();
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType = 'sine',
    gainVal = 0.14,
    delay = 0,
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(gainVal, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  public play(kind: SoundEvent['kind']): void {
    switch (kind) {
      case 'sermon':
        // Satirical heavenly organ triad
        this.tone(220, 220, 0.9, 'triangle', 0.1, 0);
        this.tone(277.18, 277.18, 0.9, 'triangle', 0.08, 0.04);
        this.tone(329.63, 329.63, 1.0, 'sine', 0.1, 0.08);
        break;
      case 'pray':
        this.tone(440, 660, 0.5, 'sine', 0.12);
        this.tone(554.37, 880, 0.6, 'triangle', 0.08, 0.08);
        break;
      case 'bell':
        this.tone(587.33, 585, 1.4, 'sine', 0.18);
        this.tone(1174.66, 1170, 0.9, 'sine', 0.07);
        break;
      case 'tithe':
        this.tone(523.25, 523.25, 0.18, 'triangle', 0.14, 0);
        this.tone(659.25, 659.25, 0.18, 'triangle', 0.14, 0.1);
        this.tone(783.99, 1046.5, 0.45, 'sine', 0.16, 0.2);
        break;
      case 'pickup':
        this.tone(380, 620, 0.12, 'sine', 0.12);
        break;
      case 'bonk':
        this.tone(190, 75, 0.16, 'square', 0.18);
        break;
      case 'airhorn':
        this.tone(340, 330, 0.55, 'sawtooth', 0.22, 0);
        this.tone(450, 440, 0.55, 'sawtooth', 0.18, 0.02);
        break;
      case 'bark':
        this.tone(240, 140, 0.13, 'sawtooth', 0.16, 0);
        this.tone(280, 150, 0.15, 'sawtooth', 0.14, 0.16);
        break;
      case 'acorn_throw':
        this.tone(720, 320, 0.14, 'triangle', 0.11);
        break;
      case 'worm_erupt':
        this.tone(110, 45, 0.5, 'sawtooth', 0.24);
        break;
      case 'mower_rev':
        this.tone(85, 220, 0.65, 'sawtooth', 0.18);
        break;
      case 'spider_hiss':
        this.tone(1400, 700, 0.28, 'sawtooth', 0.09);
        break;
      case 'cultist_chant':
        this.tone(140, 115, 0.5, 'triangle', 0.14);
        this.tone(175, 145, 0.5, 'sine', 0.1, 0.12);
        break;
      case 'hurt':
        this.tone(180, 70, 0.22, 'sawtooth', 0.22);
        break;
      case 'die':
        // Ceramic gnome shattering!
        this.tone(900, 200, 0.12, 'square', 0.2, 0);
        this.tone(1200, 300, 0.15, 'square', 0.16, 0.06);
        this.tone(600, 90, 0.35, 'sawtooth', 0.18, 0.12);
        break;
      case 'portal':
        this.tone(240, 540, 0.28, 'sine', 0.12);
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
