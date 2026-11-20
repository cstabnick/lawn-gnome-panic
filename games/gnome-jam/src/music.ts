// Procedural 90s Golden-Era Hip-Hop Chop-Sample Beat Engine (WebAudio).
// Synthesizes MPC-swung boom-bap drums, warm low-passed Rhodes jazz-funk chord chops
// with monophonic choke groups, round Moog/upright bass, muted clav/wah stabs,
// classic brass hits, and evolving 4/8-bar song sections (Intro -> Groove A -> Groove B -> Breakdown).

export type BeatMode = 'chill' | 'court' | 'fire';

interface ChordChop {
  /** MIDI notes for the warm Rhodes / jazz-funk chord voicing. */
  notes: readonly number[];
  /** Bass root MIDI note. */
  bass: number;
  /** Optional funky stab/horn top note. */
  stab?: readonly number[];
}

interface BeatTrack {
  name: string;
  bpm: number;
  swing: number; // 0..0.28 (fraction of a 16th-note pushed on odd 16ths)
  chops: readonly ChordChop[]; // 4-bar harmonic palette
  /** 16-step kick pattern (0..1 velocity). */
  kickA: readonly number[];
  kickB: readonly number[];
  /** 16-step snare pattern (0..1 velocity; <0.45 = ghost snare). */
  snareA: readonly number[];
  snareB: readonly number[];
  /** 16-step hi-hat pattern (0 = off, 1 = closed soft, 2 = closed accent, 3 = open hat). */
  hatA: readonly number[];
  hatB: readonly number[];
  /** 16-step sample-chop trigger map (-1 = silent, 0..3 = chop index offset, 4 = re-trigger stutter). */
  chopPatternA: readonly number[];
  chopPatternB: readonly number[];
  /** 16-step bass rhythm (0 = rest, 1 = root, 2 = fifth/octave bounce, 3 = passing tone). */
  bassPattern: readonly number[];
}

const TRACKS: readonly BeatTrack[] = [
  {
    // Warm D Dorian / Pete Rock & ATCQ style Rhodes soul chop
    name: 'Gnomerena Soul',
    bpm: 93,
    swing: 0.22,
    chops: [
      { notes: [62, 65, 69, 72, 76], bass: 38, stab: [69, 74, 77] }, // Dm9
      { notes: [62, 65, 67, 71, 76], bass: 43, stab: [71, 74, 79] }, // G13
      { notes: [60, 64, 67, 71, 74], bass: 36, stab: [67, 71, 76] }, // Cmaj9
      { notes: [61, 64, 67, 70, 76], bass: 45, stab: [67, 70, 76] }, // A7b9/alt
    ],
    kickA:  [1, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0.9, 0, 0, 0, 0.45, 0],
    kickB:  [1, 0, 0, 0.55, 0, 0, 0, 0.75, 0, 0, 0.92, 0, 0, 0.45, 0, 0],
    snareA: [0, 0, 0, 0, 0.95, 0, 0, 0.25, 0, 0.22, 0, 0, 1, 0, 0, 0.28],
    snareB: [0, 0, 0, 0, 0.95, 0, 0, 0.3, 0, 0.28, 0, 0, 1, 0, 0.32, 0],
    hatA:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1],
    hatB:   [2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 2, 1, 3, 1],
    chopPatternA: [0, -1, -1, 0, -1, -1, 1, -1, -1, -1, 0, -1, -1, -1, 1, -1],
    chopPatternB: [0, -1, 0, -1, -1, -1, 1, -1, 0, -1, -1, 1, -1, -1, 4, -1],
    bassPattern:  [1, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 0],
  },
  {
    // Funky F minor / 90s East Coast bounce with crisp breakbeat pocket
    name: 'Hardwood Bounce',
    bpm: 96,
    swing: 0.24,
    chops: [
      { notes: [60, 63, 67, 70, 72], bass: 41, stab: [68, 72, 75] }, // Fm9
      { notes: [62, 65, 68, 70, 74], bass: 46, stab: [70, 74, 77] }, // Bb13
      { notes: [60, 63, 65, 68, 72], bass: 37, stab: [68, 72, 77] }, // Dbmaj9
      { notes: [60, 64, 67, 70, 75], bass: 36, stab: [67, 70, 75] }, // C7#9
    ],
    kickA:  [1, 0, 0, 0, 0, 0, 0.65, 0, 0, 0.85, 0.9, 0, 0, 0, 0, 0],
    kickB:  [1, 0, 0.45, 0, 0, 0, 0.7, 0, 0, 0.85, 0, 0.65, 0, 0, 0.5, 0],
    snareA: [0, 0, 0, 0, 1, 0, 0, 0.24, 0, 0, 0, 0.22, 0.95, 0, 0, 0.3],
    snareB: [0, 0, 0, 0, 1, 0, 0, 0.3, 0, 0.26, 0, 0, 1, 0, 0.35, 0.25],
    hatA:   [2, 0, 2, 1, 2, 1, 2, 0, 2, 1, 2, 1, 2, 0, 3, 1],
    hatB:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1],
    chopPatternA: [0, -1, -1, -1, -1, -1, 0, -1, -1, 1, -1, -1, -1, -1, 1, -1],
    chopPatternB: [0, -1, -1, 1, -1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 4, -1],
    bassPattern:  [1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 1, 0, 0, 0, 3, 0],
  },
  {
    // Laid-back E minor / classic 90s jazz-hop lounge chop
    name: 'Downtown Smooth',
    bpm: 90,
    swing: 0.2,
    chops: [
      { notes: [62, 64, 67, 71, 74], bass: 40, stab: [71, 74, 78] }, // Em9
      { notes: [61, 64, 67, 71, 73], bass: 45, stab: [69, 73, 76] }, // A13
      { notes: [60, 64, 67, 71, 74], bass: 36, stab: [67, 71, 76] }, // Cmaj9
      { notes: [62, 66, 69, 71, 75], bass: 35, stab: [69, 71, 75] }, // B7#5/9
    ],
    kickA:  [1, 0, 0, 0, 0, 0, 0, 0.72, 0, 0, 0.85, 0, 0, 0.5, 0, 0],
    kickB:  [1, 0, 0, 0, 0, 0, 0.55, 0.75, 0, 0, 0.9, 0, 0, 0, 0.5, 0],
    snareA: [0, 0, 0, 0, 0.92, 0, 0, 0.2, 0, 0.2, 0, 0, 0.95, 0, 0, 0.24],
    snareB: [0, 0, 0, 0, 0.92, 0, 0, 0.25, 0, 0.22, 0, 0, 0.95, 0, 0.28, 0],
    hatA:   [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 3, 1],
    hatB:   [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1],
    chopPatternA: [0, -1, -1, 0, -1, -1, -1, 1, -1, -1, 0, -1, -1, -1, -1, -1],
    chopPatternB: [0, -1, -1, 0, -1, 1, -1, -1, 0, -1, -1, 1, -1, -1, 4, -1],
    bassPattern:  [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 3, 0, 0],
  },
];

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Soft-clip saturation curve for warm MPC/vinyl bus glue. */
function makeWarmCurve(amount = 16): Float32Array<ArrayBuffer> {
  const n = 512;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((1 + amount * 0.08) * x) / (1 + amount * 0.08 * Math.abs(x));
  }
  return curve;
}

export class HipHopBeatEngine {
  private ctx: AudioContext | null = null;
  private getGain: () => number;
  private masterGain: GainNode | null = null;
  private busFilter: BiquadFilterNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;
  private vinylGain: GainNode | null = null;

  /** Active monophonic chop voice (choked cleanly when the next chop hits!). */
  private activeChopGain: GainNode | null = null;
  private activeHatGain: GainNode | null = null;

  private timerId: number | null = null;
  private running = false;
  private nextStepTime = 0;
  private stepInBar = 0; // 0..15
  private barIndex = 0;  // increments every 16 steps
  private trackIndex = 0;
  private mode: BeatMode = 'chill';

  constructor(getGain: () => number) {
    this.getGain = getGain;
  }

  currentTrackName(): string {
    return TRACKS[this.trackIndex % TRACKS.length].name;
  }

  setMode(mode: BeatMode): void {
    this.mode = mode;
    if (this.ctx && this.busFilter) {
      const targetHz = mode === 'chill' ? 2400 : mode === 'fire' ? 7200 : 5200;
      this.busFilter.frequency.setTargetAtTime(targetHz, this.ctx.currentTime, 0.25);
    }
  }

  nextTrack(): void {
    this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
    this.barIndex = 0;
    this.stepInBar = 0;
  }

  start(ctx: AudioContext, mode: BeatMode = 'court'): void {
    this.ctx = ctx;
    this.mode = mode;
    this.ensureGraph(ctx);
    this.setMode(mode);

    if (this.running) return;
    this.running = true;
    this.nextStepTime = ctx.currentTime + 0.06;
    this.stepInBar = 0;
    this.barIndex = 0;
    this.startVinylDust(ctx);

    this.timerId = window.setInterval(() => this.scheduler(), 35);
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.stopVinylDust();
  }

  private ensureGraph(ctx: AudioContext): void {
    if (this.masterGain) return;

    this.busFilter = ctx.createBiquadFilter();
    this.busFilter.type = 'lowpass';
    this.busFilter.frequency.value = 4800;
    this.busFilter.Q.value = 0.7;

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeWarmCurve(14);
    shaper.oversample = 'none';

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.getGain();

    this.busFilter.connect(shaper);
    shaper.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // Pre-generate 1.5s white noise buffer for snares & hi-hats
    const len = Math.floor(ctx.sampleRate * 1.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  private startVinylDust(ctx: AudioContext): void {
    if (this.vinylNode || !this.masterGain) return;
    const dur = 3.0;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // Soft hiss + rare gentle crackle pops
      let s = (Math.random() * 2 - 1) * 0.015;
      if (Math.random() < 0.00055) s += (Math.random() * 2 - 1) * 0.28;
      data[i] = s;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 3200;
    hp.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.value = 0.14;

    src.connect(hp).connect(g).connect(this.masterGain);
    src.start();
    this.vinylNode = src;
    this.vinylGain = g;
  }

  private stopVinylDust(): void {
    if (this.vinylNode) {
      try {
        this.vinylNode.stop();
        this.vinylNode.disconnect();
      } catch {
        // ignore
      }
      this.vinylNode = null;
    }
    this.vinylGain?.disconnect();
    this.vinylGain = null;
  }

  private scheduler(): void {
    if (!this.running || !this.ctx || !this.masterGain) return;
    const vol = this.getGain();
    this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    if (vol <= 0.001) {
      // Keep clock synced without scheduling silent notes
      this.nextStepTime = Math.max(this.nextStepTime, this.ctx.currentTime + 0.05);
      return;
    }

    const track = TRACKS[this.trackIndex % TRACKS.length];
    const base16th = 60 / track.bpm / 4;
    const lookahead = 0.14;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      // MPC swing: push odd 16th notes forward for authentic golden-era head-nod pocket
      const swingOffset = this.stepInBar % 2 === 1 ? base16th * track.swing : 0;
      const playTime = this.nextStepTime + swingOffset;

      this.scheduleStep(track, this.barIndex, this.stepInBar, playTime, base16th);

      this.nextStepTime += base16th;
      this.stepInBar++;
      if (this.stepInBar >= 16) {
        this.stepInBar = 0;
        this.barIndex++;
        // Smoothly rotate to the next 90s beat after a full 24-bar arrangement!
        if (this.barIndex >= 24) {
          this.barIndex = 0;
          this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
        }
      }
    }
  }

  private scheduleStep(
    track: BeatTrack,
    bar: number,
    step: number,
    time: number,
    stepDur: number,
  ): void {
    if (!this.ctx || !this.busFilter) return;

    // 24-bar procedural arrangement shape:
    //   Bars  0.. 3: INTRO (warm Rhodes chops + soft hats, beat drops on bar 4!)
    //   Bars  4..11: GROOVE A (classic boom-bap pocket)
    //   Bars 12..19: GROOVE B (funky stabs + livelier drum variation + chop fills)
    //   Bars 20..23: BREAKDOWN (2 bars drums out, 2 bars snare/chop build back into top!)
    const section =
      bar < 4 ? 'intro' : bar < 12 ? 'grooveA' : bar < 20 ? 'grooveB' : 'breakdown';

    const chordIdx = bar % track.chops.length;
    const chop = track.chops[chordIdx];
    const nextChop = track.chops[(chordIdx + 1) % track.chops.length];

    const isTurnaroundBar = bar % 4 === 3;
    const useB = section === 'grooveB' || (section === 'grooveA' && bar % 2 === 1);

    // 1. SAMPLE CHOPS (Warm Rhodes electric piano chords with monophonic MPC choke!)
    const chopPat = useB ? track.chopPatternB : track.chopPatternA;
    const chopCode = chopPat[step];
    if (chopCode >= 0) {
      if (chopCode === 4 && isTurnaroundBar) {
        // Classic 90s MPC stutter turnaround on bar 4/8!
        this.playRhodesChop(time, nextChop.notes, stepDur * 1.4, 0.16);
      } else {
        const chosen = chopCode === 1 ? nextChop : chop;
        const holdDur = section === 'intro' || section === 'breakdown' ? stepDur * 4.5 : stepDur * 3.1;
        this.playRhodesChop(time, chosen.notes, holdDur, 0.17);
      }
    }

    // 2. WARM MOOG / UPRIGHT BASS
    const bassCode = track.bassPattern[step];
    if (bassCode > 0 && (section !== 'intro' || bar >= 2)) {
      let note = chop.bass;
      if (bassCode === 2) note += 7; // fifth bounce
      else if (bassCode === 3) note += 3; // minor 3rd passing tone
      this.playBass(time, note, stepDur * (bassCode === 1 ? 2.6 : 1.5), section === 'breakdown' ? 0.24 : 0.3);
    }

    // 3. FUNKY 90s BRASS / CLAVINET ANSWER STABS (in Groove B or ON FIRE!)
    if (chop.stab && (section === 'grooveB' || this.mode === 'fire')) {
      const stabHit =
        (step === 0 && bar % 2 === 0) ||
        (step === 10 && isTurnaroundBar) ||
        (this.mode === 'fire' && step === 6);
      if (stabHit) {
        this.playFunkStab(time, chop.stab, stepDur * 1.6, this.mode === 'fire' ? 0.12 : 0.085);
      }
    }

    // 4. BOOM-BAP DRUMS
    const drumsDropOut = section === 'intro' || (section === 'breakdown' && bar < 22);
    if (!drumsDropOut) {
      const kickVel = (useB ? track.kickB : track.kickA)[step];
      if (kickVel > 0) this.playKick(time, kickVel * 0.48);

      const snareVel = (useB ? track.snareB : track.snareA)[step];
      if (snareVel > 0) this.playSnare(time, snareVel * 0.36);
    } else if (section === 'breakdown' && bar === 21 && step >= 12) {
      // Classic 16th-note ghost snare fill leading back into the drop!
      const ramp = 0.22 + ((step - 12) / 4) * 0.55;
      this.playSnare(time, ramp * 0.34);
    }

    // Swung hi-hats (keep light hats in intro & breakdown so groove stays alive)
    const hatCode = (useB ? track.hatB : track.hatA)[step];
    if (hatCode > 0) {
      const hatMul = section === 'intro' ? 0.55 : section === 'breakdown' && bar < 22 ? 0.45 : 1.0;
      const isOpen = hatCode === 3 && !drumsDropOut;
      const vel = (hatCode === 2 ? 0.14 : hatCode === 3 ? 0.16 : 0.075) * hatMul;
      this.playHiHat(time, isOpen, vel);
    }
  }

  /** Monophonic MPC-style Rhodes / jazz-funk chord chop with warm low-pass envelope. */
  private playRhodesChop(time: number, midiNotes: readonly number[], dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;

    // Choke previous sample chop cleanly (classic MPC mono-pad feel!)
    if (this.activeChopGain) {
      try {
        this.activeChopGain.gain.cancelScheduledValues(time);
        this.activeChopGain.gain.setTargetAtTime(0.0001, time, 0.012);
      } catch {
        // ignore
      }
    }

    const chopGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2100, time);
    filter.frequency.exponentialRampToValueAtTime(780, time + dur);
    filter.Q.value = 1.2;

    chopGain.gain.setValueAtTime(0.0001, time);
    chopGain.gain.linearRampToValueAtTime(vol, time + 0.012);
    chopGain.gain.exponentialRampToValueAtTime(vol * 0.45, time + dur * 0.55);
    chopGain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.04);

    filter.connect(chopGain).connect(this.busFilter);
    this.activeChopGain = chopGain;

    const perVoice = 1 / Math.sqrt(midiNotes.length);
    for (let i = 0; i < midiNotes.length; i++) {
      const hz = midiToHz(midiNotes[i]);
      const osc = ctx.createOscillator();
      // Triangle + subtle detune gives warm electric-piano / sampled vinyl character
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(hz, time);
      osc.detune.setValueAtTime((i - 2) * 3.5, time);

      const vg = ctx.createGain();
      vg.gain.value = perVoice;
      osc.connect(vg).connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.06);
    }
  }

  /** Round 90s Moog / upright-style sub-bass. */
  private playBass(time: number, midi: number, dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;
    const hz = midiToHz(midi);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(hz * 1.015, time);
    osc.frequency.exponentialRampToValueAtTime(hz, time + 0.025);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(hz, time);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(520, time);
    lp.frequency.exponentialRampToValueAtTime(210, time + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(lp);
    sub.connect(lp);
    lp.connect(g).connect(this.busFilter);

    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.02);
    sub.stop(time + dur + 0.02);
  }

  /** Funky 90s muted brass / clavinet stab (classic Pete Rock horn-hit vibe). */
  private playFunkStab(time: number, notes: readonly number[], dur: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, time);
    filter.frequency.exponentialRampToValueAtTime(900, time + dur);
    filter.Q.value = 1.6;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    filter.connect(g).connect(this.busFilter);

    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(midiToHz(notes[i]), time);
      osc.detune.setValueAtTime((i - 1) * 6, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    }
  }

  /** Punchy 90s boom-bap vinyl kick. */
  private playKick(time: number, vol: number): void {
    if (!this.ctx || !this.busFilter) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(148, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.085);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(g).connect(this.busFilter);
    osc.start(time);
    osc.stop(time + 0.24);
  }

  /** Crisp 90s dusty snare (body + bandpass noise snap). */
  private playSnare(time: number, vol: number): void {
    if (!this.ctx || !this.busFilter || !this.noiseBuf) return;
    const ctx = this.ctx;

    // Drum body
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(205, time);
    body.frequency.exponentialRampToValueAtTime(125, time + 0.06);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(vol * 0.65, time);
    bg.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    body.connect(bg).connect(this.busFilter);
    body.start(time);
    body.stop(time + 0.12);

    // Filtered snare wire snap
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2100, time);
    bp.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.9, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(bp).connect(ng).connect(this.busFilter);
    noise.start(time, Math.random() * 0.4, 0.16);
  }

  /** Swung closed / open vinyl hi-hat with open-hat choke. */
  private playHiHat(time: number, open: boolean, vol: number): void {
    if (!this.ctx || !this.busFilter || !this.noiseBuf) return;
    const ctx = this.ctx;

    if (!open && this.activeHatGain) {
      try {
        this.activeHatGain.gain.cancelScheduledValues(time);
        this.activeHatGain.gain.setTargetAtTime(0.0001, time, 0.008);
      } catch {
        // ignore
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(6800, time);

    const dur = open ? 0.24 : 0.048;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + dur);

    noise.connect(hp).connect(g).connect(this.busFilter);
    noise.start(time, Math.random() * 0.5, dur + 0.02);
    if (open) this.activeHatGain = g;
  }
}
