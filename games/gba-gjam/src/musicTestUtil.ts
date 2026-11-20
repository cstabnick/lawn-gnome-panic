// Music testing utilities for stereo->mono fold-down and mix headroom/phase checks.

export interface StereoMonoAnalysis {
  peakStereo: number;
  peakMono: number;
  rmsStereo: number;
  rmsMono: number;
  /** Pearson correlation between L and R (-1 = out of phase, +1 = identical mono). */
  correlation: number;
  /** Level change in dB when folding stereo down to mono (0.5 * (L + R)). */
  monoLossDb: number;
  clipped: boolean;
}

/**
 * Standard -6 dB stereo-to-mono downmix: 0.5 * (L + R).
 * Matches WebAudio's speaker-interpretation mono downmix law.
 */
export function stereoToMonoSamples(left: Float32Array, right: Float32Array): Float32Array {
  const len = Math.min(left.length, right.length);
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    mono[i] = 0.5 * (left[i] + right[i]);
  }
  return mono;
}

/**
 * Downmixes a multi-channel AudioBuffer into a single-channel mono AudioBuffer.
 */
export function downmixAudioBufferToMono(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
): AudioBuffer {
  const out = ctx.createBuffer(1, buffer.length, buffer.sampleRate);
  const dst = out.getChannelData(0);

  if (buffer.numberOfChannels <= 1) {
    if (buffer.numberOfChannels === 1) {
      dst.set(buffer.getChannelData(0));
    }
    return out;
  }

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  dst.set(stereoToMonoSamples(left, right));
  return out;
}

/**
 * Creates a WebAudio GainNode configured to fold stereo input down to mono
 * using standard speaker downmix rules (0.5 * (L + R)).
 */
export function createStereoToMonoNode(ctx: BaseAudioContext): GainNode {
  const node = ctx.createGain();
  node.channelCount = 1;
  node.channelCountMode = 'explicit';
  node.channelInterpretation = 'speakers';
  return node;
}

/**
 * Toggles an existing GainNode between stereo pass-through and mono fold-down.
 */
export function setNodeMonoFoldDown(node: GainNode, mono: boolean): void {
  if (mono) {
    node.channelCount = 1;
    node.channelCountMode = 'explicit';
  } else {
    node.channelCount = 2;
    node.channelCountMode = 'max';
  }
  node.channelInterpretation = 'speakers';
}

/**
 * Analyzes stereo vs mono fold-down compatibility, phase correlation, and clipping.
 */
export function analyzeStereoMonoMix(
  left: Float32Array,
  right: Float32Array,
): StereoMonoAnalysis {
  const len = Math.min(left.length, right.length);
  if (len === 0) {
    return {
      peakStereo: 0,
      peakMono: 0,
      rmsStereo: 0,
      rmsMono: 0,
      correlation: 1,
      monoLossDb: 0,
      clipped: false,
    };
  }

  let peakStereo = 0;
  let peakMono = 0;
  let sumL2 = 0;
  let sumR2 = 0;
  let sumLR = 0;
  let sumM2 = 0;

  for (let i = 0; i < len; i++) {
    const l = left[i];
    const r = right[i];
    const m = 0.5 * (l + r);

    const absL = Math.abs(l);
    const absR = Math.abs(r);
    const absM = Math.abs(m);
    if (absL > peakStereo) peakStereo = absL;
    if (absR > peakStereo) peakStereo = absR;
    if (absM > peakMono) peakMono = absM;

    sumL2 += l * l;
    sumR2 += r * r;
    sumLR += l * r;
    sumM2 += m * m;
  }

  const rmsStereo = Math.sqrt((sumL2 + sumR2) / (2 * len));
  const rmsMono = Math.sqrt(sumM2 / len);
  const denom = Math.sqrt(sumL2 * sumR2);
  const correlation = denom > 1e-12 ? Math.max(-1, Math.min(1, sumLR / denom)) : 1;

  const monoLossDb =
    rmsStereo > 1e-12 && rmsMono > 1e-12
      ? 20 * Math.log10(rmsMono / rmsStereo)
      : 0;

  return {
    peakStereo,
    peakMono,
    rmsStereo,
    rmsMono,
    correlation,
    monoLossDb,
    clipped: peakStereo >= 0.999 || peakMono >= 0.999,
  };
}
