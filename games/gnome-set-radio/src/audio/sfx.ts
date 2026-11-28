import type { VolumeStore } from '@arcade/volume';
import type { SkaterState } from '../sim/skater';

export interface GsrSfx {
  unlock(): void;
  update(s: SkaterState, dt: number): void;
  silence(): void;
  jump(): void;
  airJump(): void;
  airDash(): void;
  land(impactSpeed: number): void;
  grindStart(): void;
  wallRideStart(): void;
  trick(mult: number): void;
  spray(isTarget: boolean): void;
  tagSwitch(): void;
  boostStart(): void;
  bounce(kind: 'bongo-pad' | 'updraft-vent' | 'hydrant'): void;
  pickup(kind: 'spray-pickup' | 'tempo-acorn' | 'aerial-ring'): void;
  bankScore(points: number): void;
  bump(): void;
  eventComplete(): void;
  bossUnlock(): void;
  bossHit(): void;
  wallKick(): void;
  onBeat(): void;
  rankFanfare(): void;
  dancePop(): void;
  levelClear(): void;
  dispose(): void;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

function makeNoiseBuffer(c: AudioContext): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function createGsrSfx(volume: VolumeStore): GsrSfx {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;

  let rollGain: GainNode | null = null;
  let rollFilter: BiquadFilterNode | null = null;
  let rollBearingOsc: OscillatorNode | null = null;
  let rollBearingGain: GainNode | null = null;
  let scrubGain: GainNode | null = null;
  let lastStrideStep = -1;
  let grindGain: GainNode | null = null;
  let wallGain: GainNode | null = null;
  let boostGain: GainNode | null = null;
  let airWindGain: GainNode | null = null;
  let airWindFilter: BiquadFilterNode | null = null;
  let lastBumpAt = -1;

  const getVol = (): number => volume.effective('sounds');

  const unsub = volume.subscribe(() => {
    if (ctx && master) {
      master.gain.setTargetAtTime(getVol(), ctx.currentTime, 0.03);
    }
  });

  function ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = getVol();
      master.connect(ctx.destination);
      noiseBuf = makeNoiseBuffer(ctx);

      const loopSrc = ctx.createBufferSource();
      loopSrc.buffer = noiseBuf;
      loopSrc.loop = true;
      loopSrc.start();

      // 1. Inline urethane wheel bearing hum + tight carve/brake scrub (not snowboard snow hiss)
      rollFilter = ctx.createBiquadFilter();
      rollFilter.type = 'bandpass';
      rollFilter.frequency.value = 340;
      rollFilter.Q.value = 2.6;
      rollGain = ctx.createGain();
      rollGain.gain.value = 0;
      loopSrc.connect(rollFilter).connect(rollGain).connect(master);

      rollBearingOsc = ctx.createOscillator();
      rollBearingOsc.type = 'triangle';
      rollBearingOsc.frequency.value = 85;
      const bearingLp = ctx.createBiquadFilter();
      bearingLp.type = 'lowpass';
      bearingLp.frequency.value = 260;
      rollBearingGain = ctx.createGain();
      rollBearingGain.gain.value = 0;
      rollBearingOsc.connect(bearingLp).connect(rollBearingGain).connect(master);
      rollBearingOsc.start();

      const scrubBp = ctx.createBiquadFilter();
      scrubBp.type = 'bandpass';
      scrubBp.frequency.value = 2100;
      scrubBp.Q.value = 4.5;
      scrubGain = ctx.createGain();
      scrubGain.gain.value = 0;
      loopSrc.connect(scrubBp).connect(scrubGain).connect(master);

      // 2. Rail grind metallic sizzle + ley-line hum
      grindGain = ctx.createGain();
      grindGain.gain.value = 0;
      grindGain.connect(master);
      const grindBp = ctx.createBiquadFilter();
      grindBp.type = 'bandpass';
      grindBp.frequency.value = 3400;
      grindBp.Q.value = 3.2;
      loopSrc.connect(grindBp).connect(grindGain);
      const grindOsc = ctx.createOscillator();
      grindOsc.type = 'sawtooth';
      grindOsc.frequency.value = 148;
      const grindOscLp = ctx.createBiquadFilter();
      grindOscLp.type = 'lowpass';
      grindOscLp.frequency.value = 620;
      const grindOscGain = ctx.createGain();
      grindOscGain.gain.value = 0.42;
      grindOsc.connect(grindOscLp).connect(grindOscGain).connect(grindGain);
      grindOsc.start();

      // 3. Wall-ride scrape
      const wallBp = ctx.createBiquadFilter();
      wallBp.type = 'bandpass';
      wallBp.frequency.value = 1500;
      wallBp.Q.value = 1.8;
      wallGain = ctx.createGain();
      wallGain.gain.value = 0;
      loopSrc.connect(wallBp).connect(wallGain).connect(master);

      // 4. Boost wind jet
      const boostHp = ctx.createBiquadFilter();
      boostHp.type = 'bandpass';
      boostHp.frequency.value = 720;
      boostHp.Q.value = 0.7;
      boostGain = ctx.createGain();
      boostGain.gain.value = 0;
      loopSrc.connect(boostHp).connect(boostGain).connect(master);

      // 5. Airborne wind rush (gradual swell when airborne so overall noise floor stays full)
      airWindFilter = ctx.createBiquadFilter();
      airWindFilter.type = 'bandpass';
      airWindFilter.frequency.value = 1100;
      airWindFilter.Q.value = 0.65;
      airWindGain = ctx.createGain();
      airWindGain.gain.value = 0;
      loopSrc.connect(airWindFilter).connect(airWindGain).connect(master);
    }
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return ctx;
  }

  function tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    gainPeak: number,
    delayS = 0,
  ): void {
    const c = ensureCtx();
    if (!c || !master) return;
    const t = c.currentTime + delayS;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 !== f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gainPeak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noiseBurst(
    filterType: BiquadFilterType,
    f0: number,
    f1: number,
    q: number,
    dur: number,
    gainPeak: number,
    delayS = 0,
  ): void {
    const c = ensureCtx();
    if (!c || !master || !noiseBuf) return;
    const t = c.currentTime + delayS;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const flt = c.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    flt.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gainPeak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  return {
    unlock() {
      ensureCtx();
    },
    update(s) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const spd = Math.hypot(s.vx, s.vz);
      const speedNorm = clamp01(spd / 26);

      if (rollGain && rollFilter && rollBearingOsc && rollBearingGain && scrubGain) {
        const rolling = s.grounded && !s.grinding && !s.danceMove;
        rollGain.gain.setTargetAtTime(rolling ? speedNorm * 0.024 : 0, t, 0.05);
        rollFilter.frequency.setTargetAtTime(260 + speedNorm * 220, t, 0.05);
        rollBearingGain.gain.setTargetAtTime(rolling && spd > 0.6 ? 0.015 + speedNorm * 0.032 : 0, t, 0.05);
        rollBearingOsc.frequency.setTargetAtTime(75 + speedNorm * 90, t, 0.05);
        const carving = Math.abs(s.carveSlip) > 0.22 || (s.braking && spd > 1.5);
        scrubGain.gain.setTargetAtTime(rolling && carving ? (s.braking ? 0.042 : Math.min(0.038, Math.abs(s.carveSlip) * 0.09)) : 0, t, 0.04);
        if (rolling && spd > 2.5 && !s.braking) {
          const stepIdx = Math.floor(s.stridePhase / Math.PI);
          if (stepIdx !== lastStrideStep) {
            lastStrideStep = stepIdx;
            tone('triangle', 175, 110, 0.025, 0.03);
          }
        }
      }
      if (grindGain) {
        grindGain.gain.setTargetAtTime(s.grinding ? 0.052 : 0, t, 0.03);
      }
      if (wallGain) {
        wallGain.gain.setTargetAtTime(s.wallRiding ? 0.045 : 0, t, 0.04);
      }
      if (boostGain) {
        boostGain.gain.setTargetAtTime(s.boosting ? 0.042 : 0, t, 0.05);
      }
      if (airWindGain && airWindFilter) {
        const airborne = !s.grounded && !s.grinding;
        airWindGain.gain.setTargetAtTime(airborne ? 0.008 + speedNorm * 0.014 : 0, t, 0.22);
        airWindFilter.frequency.setTargetAtTime(900 + speedNorm * 1200 + Math.abs(s.vy) * 40, t, 0.22);
      }
    },
    silence() {
      if (!ctx) return;
      const t = ctx.currentTime;
      rollGain?.gain.setTargetAtTime(0, t, 0.04);
      rollBearingGain?.gain.setTargetAtTime(0, t, 0.04);
      scrubGain?.gain.setTargetAtTime(0, t, 0.04);
      grindGain?.gain.setTargetAtTime(0, t, 0.04);
      wallGain?.gain.setTargetAtTime(0, t, 0.04);
      boostGain?.gain.setTargetAtTime(0, t, 0.04);
      airWindGain?.gain.setTargetAtTime(0, t, 0.04);
    },
    jump() {
      tone('triangle', 190, 520, 0.13, 0.2);
      noiseBurst('highpass', 1800, 3400, 1.0, 0.07, 0.09);
    },
    airJump() {
      tone('sine', 420, 980, 0.18, 0.18);
      tone('triangle', 640, 1280, 0.16, 0.12, 0.03);
      noiseBurst('bandpass', 2400, 5200, 1.4, 0.14, 0.08);
    },
    airDash() {
      tone('sawtooth', 260, 780, 0.14, 0.12);
      tone('triangle', 520, 1180, 0.16, 0.11, 0.02);
      noiseBurst('bandpass', 900, 3600, 1.1, 0.18, 0.09);
    },
    land(impactSpeed) {
      const amt = clamp01(impactSpeed / 18);
      tone('sine', 120 + amt * 40, 42, 0.14, 0.16 + amt * 0.16);
      noiseBurst('lowpass', 900, 260, 0.8, 0.09, 0.08 + amt * 0.1);
    },
    grindStart() {
      tone('square', 920, 1480, 0.07, 0.055);
      tone('triangle', 1420, 2100, 0.1, 0.065, 0.02);
      noiseBurst('bandpass', 3800, 2200, 3.0, 0.09, 0.05);
    },
    wallRideStart() {
      tone('triangle', 260, 180, 0.09, 0.14);
      noiseBurst('bandpass', 1400, 900, 1.6, 0.1, 0.05);
    },
    trick(mult) {
      const semitones = Math.min(12, Math.max(0, mult - 1) * 2);
      const root = 440 * Math.pow(2, semitones / 12);
      tone('triangle', root, root * 1.5, 0.12, 0.16);
      tone('sine', root * 1.5, root * 2, 0.14, 0.12, 0.045);
    },
    spray(isTarget) {
      // Can rattle + aerosol hiss
      tone('triangle', 1800, 2400, 0.03, 0.08);
      noiseBurst('bandpass', 3800, 5400, 1.3, 0.2, 0.18, 0.02);
      if (isTarget) {
        tone('triangle', 523.25, 659.25, 0.12, 0.14, 0.05);
        tone('triangle', 783.99, 1046.5, 0.16, 0.12, 0.1);
      }
    },
    tagSwitch() {
      tone('sine', 1200, 1650, 0.035, 0.09);
    },
    boostStart() {
      tone('sawtooth', 160, 480, 0.22, 0.11);
      noiseBurst('bandpass', 600, 2400, 0.9, 0.24, 0.055);
    },
    bounce(kind) {
      if (kind === 'bongo-pad') {
        tone('sine', 150, 390, 0.22, 0.24);
        tone('triangle', 310, 560, 0.16, 0.14, 0.03);
      } else if (kind === 'hydrant') {
        tone('triangle', 220, 680, 0.24, 0.16);
        noiseBurst('bandpass', 1600, 4200, 1.1, 0.28, 0.16);
      } else {
        tone('sine', 240, 740, 0.28, 0.16);
        noiseBurst('bandpass', 800, 2800, 0.8, 0.3, 0.14);
      }
    },
    pickup(kind) {
      if (kind === 'spray-pickup') {
        tone('triangle', 587.33, 880, 0.11, 0.14);
        tone('sine', 880, 1174.66, 0.14, 0.12, 0.05);
      } else if (kind === 'tempo-acorn') {
        tone('sine', 659.25, 659.25, 0.09, 0.14);
        tone('sine', 987.77, 1318.5, 0.16, 0.14, 0.06);
      } else {
        tone('triangle', 523.25, 523.25, 0.08, 0.13);
        tone('triangle', 659.25, 659.25, 0.08, 0.13, 0.05);
        tone('triangle', 1046.5, 1046.5, 0.16, 0.14, 0.1);
      }
    },
    bankScore(points) {
      const notes = points >= 1200 ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
      notes.forEach((n, i) => tone('triangle', n, n, 0.18, 0.12, i * 0.045));
    },
    bump() {
      const c = ensureCtx();
      if (!c) return;
      if (lastBumpAt >= 0 && c.currentTime - lastBumpAt < 0.32) return;
      lastBumpAt = c.currentTime;
      tone('triangle', 95, 48, 0.075, 0.11);
    },
    eventComplete() {
      [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => tone('triangle', n, n, 0.2, 0.14, i * 0.06));
    },
    bossUnlock() {
      [220, 277.18, 329.63, 440].forEach((n, i) => tone('sawtooth', n, n * 1.02, 0.28, 0.1, i * 0.08));
    },
    bossHit() {
      tone('sawtooth', 320, 95, 0.18, 0.18);
      tone('triangle', 660, 1120, 0.14, 0.14, 0.03);
      noiseBurst('bandpass', 2400, 900, 1.8, 0.16, 0.16);
    },
    wallKick() {
      tone('triangle', 260, 680, 0.14, 0.2);
      noiseBurst('highpass', 1400, 3200, 1.1, 0.09, 0.11);
    },
    onBeat() {
      tone('sine', 880, 1318.5, 0.09, 0.12);
      tone('triangle', 1760, 1760, 0.07, 0.08, 0.02);
    },
    rankFanfare() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((n, i) =>
        tone('triangle', n, n * 1.01, 0.3, 0.14, i * 0.075),
      );
    },
    dancePop() {
      tone('sine', 240, 620, 0.11, 0.18);
      tone('triangle', 660, 990, 0.12, 0.14, 0.04);
    },
    levelClear() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((n, i) => tone('triangle', n, n, 0.26, 0.15, i * 0.07));
    },
    dispose() {
      unsub();
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
