// Procedural Web Audio synthesizer for Gnome Souls, wired to @arcade/volume.
import { createVolumeStore } from '@arcade/volume';

export const volumeStore = createVolumeStore();

class SoulsAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private bossMusicPhase = 0; // 0 = off, 1 = phase1, 2 = phase2
  private beatTimer = 0;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = volumeStore.effective('sounds');
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.28 * volumeStore.effective('music');
      this.musicGain.connect(this.master);
      volumeStore.subscribe(() => {
        if (this.master) this.master.gain.value = volumeStore.effective('sounds');
        if (this.musicGain) this.musicGain.gain.value = 0.28 * volumeStore.effective('music');
      });
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  unlock(): void {
    const ctx = this.ensure();
    if (!ctx || this.droneOsc) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 46;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start();
    this.droneOsc = osc;
  }

  setBossPhase(phase: 0 | 1 | 2): void {
    this.bossMusicPhase = phase;
  }

  stepMusic(dt: number): void {
    if (this.bossMusicPhase === 0 || !this.ctx || !this.musicGain) return;
    const period = this.bossMusicPhase === 2 ? 0.42 : 0.62;
    this.beatTimer += dt;
    if (this.beatTimer >= period) {
      this.beatTimer = 0;
      this.playDrum(this.bossMusicPhase === 2 ? 110 : 75);
    }
  }

  private playDrum(freq: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.6, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);
    g.gain.setValueAtTime(0.26, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  private tone(freq: number, endFreq: number, dur: number, type: OscillatorType, vol: number): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  swing(): void {
    this.tone(210, 75, 0.2, 'sawtooth', 0.11);
  }

  hit(): void {
    this.tone(150, 48, 0.16, 'square', 0.18);
    this.tone(420, 180, 0.09, 'triangle', 0.12);
  }

  roll(): void {
    this.tone(130, 65, 0.14, 'triangle', 0.09);
  }

  guard(): void {
    this.tone(680, 320, 0.15, 'square', 0.14);
  }

  poiseBreak(): void {
    this.tone(540, 120, 0.42, 'sawtooth', 0.22);
    this.tone(880, 440, 0.35, 'sine', 0.15);
  }

  flask(): void {
    this.tone(360, 740, 0.28, 'sine', 0.14);
  }

  shrine(): void {
    this.tone(220, 440, 0.55, 'triangle', 0.16);
    this.tone(330, 660, 0.65, 'sine', 0.12);
  }

  bossWhip(): void {
    this.tone(340, 90, 0.25, 'sawtooth', 0.16);
  }

  bossSlam(): void {
    this.tone(120, 32, 0.38, 'sawtooth', 0.24);
  }

  bossJet(): void {
    this.tone(480, 260, 0.45, 'sawtooth', 0.14);
  }

  banner(): void {
    this.tone(146, 110, 0.85, 'triangle', 0.22);
    this.tone(220, 165, 0.9, 'sine', 0.16);
  }
}

export const sfx = new SoulsAudio();
