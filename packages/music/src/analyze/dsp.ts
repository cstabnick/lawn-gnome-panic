/**
 * Pure-JS stereo audio DSP analyzer and 16-bit PCM WAV encoder for @lawn/music.
 * Runs on rendered Float32Array L/R buffers (from Tone.Offline or any WebAudio render)
 * to catch clipping, phase cancellation, excessive stereo width, mud, and reverb wash.
 */

export interface MixIssue {
  severity: 'error' | 'warn';
  code: string;
  message: string;
}

export interface SpectralBands {
  /** < 100 Hz relative to overall mono RMS (dB). */
  subDb: number;
  /** 100 - 400 Hz relative to overall mono RMS (dB). */
  lowMidDb: number;
  /** 400 - 4000 Hz relative to overall mono RMS (dB). */
  highMidDb: number;
  /** > 4000 Hz relative to overall mono RMS (dB). */
  airDb: number;
}

export interface MixReport {
  durationS: number;
  sampleRate: number;
  /** True when no 'error' issues are present. */
  ok: boolean;
  /** Maximum absolute sample level in dBFS. */
  peakDb: number;
  /** Integrated stereo RMS in dBFS. */
  rmsDb: number;
  /** Peak-to-RMS ratio (dB). */
  crestDb: number;
  /** Number of samples >= 0.999 in either channel. */
  clippingSamples: number;
  /** Mean DC offset across both channels. */
  dcOffset: number;
  /** L/R Pearson correlation (-1..+1). < 0.15 indicates severe phase/stereo issues. */
  correlation: number;
  /** Side RMS relative to Mid RMS (dB). > -2 dB indicates overly wide stereo. */
  sideToMidDb: number;
  /** Level change when summing stereo to mono (dB). Large negative = phase cancellation. */
  monoDropDb: number;
  /** Left RMS minus Right RMS (dB). */
  lrBalanceDb: number;
  /** 90th minus 10th percentile of 25ms RMS frames (dB). Low = flat/washed out. */
  dynamicSpreadDb: number;
  bands: SpectralBands;
  issues: MixIssue[];
}

export interface AnalyzeOpts {
  /** Skip leading silence / intro ramp (seconds). */
  skipStartS?: number;
  /** Expected minimum RMS (dBFS) for non-silent tracks. Default -38. */
  minRmsDb?: number;
  /** Minimum acceptable L/R correlation. Default 0.15. */
  minCorrelation?: number;
  /** Maximum acceptable Side-to-Mid ratio (dB). Default -1.5. */
  maxSideToMidDb?: number;
  /** Maximum acceptable mono sum drop (dB, negative number, e.g. -3.5). Default -3.5. */
  maxMonoDropDb?: number;
}

const EPS = 1e-12;
const toDb = (linear: number): number => 20 * Math.log10(Math.max(linear, EPS));

interface BiquadCoeffs {
  b0: number; b1: number; b2: number; a1: number; a2: number;
}

function butterworthLowpass(fc: number, fs: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / Math.SQRT2;
  const a0 = 1 + alpha;
  return {
    b0: ((1 - cos) / 2) / a0,
    b1: (1 - cos) / a0,
    b2: ((1 - cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

function butterworthHighpass(fc: number, fs: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / Math.SQRT2;
  const a0 = 1 + alpha;
  return {
    b0: ((1 + cos) / 2) / a0,
    b1: (-(1 + cos)) / a0,
    b2: ((1 + cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

function runBiquad(input: Float32Array, c: BiquadCoeffs): Float32Array {
  const out = new Float32Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    out[i] = y0;
    x2 = x1; x1 = x0;
    y2 = y1; y1 = y0;
  }
  return out;
}

function rmsOf(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / Math.max(1, buf.length));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

export function analyzeBuffer(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  opts: AnalyzeOpts = {},
): MixReport {
  const startIdx = Math.min(left.length, Math.max(0, Math.floor((opts.skipStartS ?? 0) * sampleRate)));
  const n = Math.max(1, left.length - startIdx);
  const lSlice = left.subarray(startIdx);
  const rSlice = right.subarray(startIdx);

  let peak = 0;
  let clippingSamples = 0;
  let sumL = 0, sumR = 0;
  let sumL2 = 0, sumR2 = 0, sumLR = 0;
  let sumMid2 = 0, sumSide2 = 0;

  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const l = lSlice[i];
    const r = rSlice[i];
    const al = Math.abs(l);
    const ar = Math.abs(r);
    if (al > peak) peak = al;
    if (ar > peak) peak = ar;
    if (al >= 0.999) clippingSamples++;
    if (ar >= 0.999) clippingSamples++;

    sumL += l;
    sumR += r;
    sumL2 += l * l;
    sumR2 += r * r;
    sumLR += l * r;

    const m = 0.5 * (l + r);
    const s = 0.5 * (l - r);
    mono[i] = m;
    sumMid2 += m * m;
    sumSide2 += s * s;
  }

  const lRms = Math.sqrt(sumL2 / n);
  const rRms = Math.sqrt(sumR2 / n);
  const stereoRms = Math.sqrt((sumL2 + sumR2) / (2 * n));
  const midRms = Math.sqrt(sumMid2 / n);
  const sideRms = Math.sqrt(sumSide2 / n);

  const peakDb = toDb(peak);
  const rmsDb = toDb(stereoRms);
  const crestDb = peakDb - rmsDb;
  const dcOffset = (sumL + sumR) / (2 * n);

  const denom = Math.sqrt(sumL2 * sumR2);
  const correlation = denom > EPS ? sumLR / denom : 1;
  const sideToMidDb = toDb(sideRms / Math.max(midRms, EPS));
  const monoDropDb = toDb(midRms) - rmsDb;
  const lrBalanceDb = toDb(lRms / Math.max(rRms, EPS));

  // 4-band spectral balance on mono sum
  const monoDb = toDb(midRms);
  const sub = runBiquad(mono, butterworthLowpass(100, sampleRate));
  const lowMid = runBiquad(runBiquad(mono, butterworthHighpass(100, sampleRate)), butterworthLowpass(400, sampleRate));
  const highMid = runBiquad(runBiquad(mono, butterworthHighpass(400, sampleRate)), butterworthLowpass(4000, sampleRate));
  const air = runBiquad(mono, butterworthHighpass(4000, sampleRate));

  const bands: SpectralBands = {
    subDb: toDb(rmsOf(sub)) - monoDb,
    lowMidDb: toDb(rmsOf(lowMid)) - monoDb,
    highMidDb: toDb(rmsOf(highMid)) - monoDb,
    airDb: toDb(rmsOf(air)) - monoDb,
  };

  // Short-term 25 ms RMS frames for dynamic spread (punch vs reverb wash)
  const frameSize = Math.max(64, Math.floor(sampleRate * 0.025));
  const frameDbs: number[] = [];
  for (let i = 0; i + frameSize <= n; i += frameSize) {
    let s2 = 0;
    for (let j = 0; j < frameSize; j++) {
      const idx = i + j;
      s2 += 0.5 * (lSlice[idx] * lSlice[idx] + rSlice[idx] * rSlice[idx]);
    }
    const fDb = toDb(Math.sqrt(s2 / frameSize));
    if (fDb > -70) frameDbs.push(fDb);
  }
  frameDbs.sort((a, b) => a - b);
  const dynamicSpreadDb = frameDbs.length >= 4
    ? percentile(frameDbs, 0.9) - percentile(frameDbs, 0.1)
    : 0;

  const issues: MixIssue[] = [];
  const minRmsDb = opts.minRmsDb ?? -38;
  const minCorrelation = opts.minCorrelation ?? 0.15;
  const maxSideToMidDb = opts.maxSideToMidDb ?? -1.5;
  const maxMonoDropDb = opts.maxMonoDropDb ?? -3.5;

  if (clippingSamples > 0 || peakDb >= -0.1) {
    issues.push({
      severity: 'error',
      code: 'clipping',
      message: `Signal clips (${clippingSamples} samples >= 0.999, peak ${peakDb.toFixed(1)} dBFS)`,
    });
  }
  if (rmsDb < minRmsDb) {
    issues.push({
      severity: 'error',
      code: 'too-quiet',
      message: `Overall RMS is too quiet (${rmsDb.toFixed(1)} dBFS < ${minRmsDb} dBFS)`,
    });
  }
  if (correlation < minCorrelation) {
    issues.push({
      severity: 'error',
      code: 'phase-correlation',
      message: `L/R correlation too low (${correlation.toFixed(2)} < ${minCorrelation}); stereo phase cancellation risk`,
    });
  }
  if (sideToMidDb > maxSideToMidDb) {
    issues.push({
      severity: 'error',
      code: 'excessive-side',
      message: `Side-to-Mid ratio too high (${sideToMidDb.toFixed(1)} dB > ${maxSideToMidDb} dB); stereo widener too hot`,
    });
  }
  if (monoDropDb < maxMonoDropDb) {
    issues.push({
      severity: 'error',
      code: 'mono-collapse',
      message: `Mono sum loses ${Math.abs(monoDropDb).toFixed(1)} dB (threshold ${Math.abs(maxMonoDropDb)} dB)`,
    });
  }
  if (Math.abs(lrBalanceDb) > 3.0) {
    issues.push({
      severity: 'warn',
      code: 'lr-imbalance',
      message: `Stereo image is lopsided (L/R balance ${lrBalanceDb >= 0 ? '+' : ''}${lrBalanceDb.toFixed(1)} dB)`,
    });
  }
  if (bands.lowMidDb - bands.highMidDb > 13.0) {
    issues.push({
      severity: 'warn',
      code: 'muddy-low-mids',
      message: `Low-mids (100-400 Hz) exceed high-mids (400-4k Hz) by ${(bands.lowMidDb - bands.highMidDb).toFixed(1)} dB`,
    });
  }
  if (bands.highMidDb < -22) {
    issues.push({
      severity: 'warn',
      code: 'buried-presence',
      message: `High-mid presence (400-4k Hz) is very quiet (${bands.highMidDb.toFixed(1)} dB rel. to mono RMS)`,
    });
  }
  if (crestDb < 4.0) {
    issues.push({
      severity: 'warn',
      code: 'over-compressed',
      message: `Crest factor is very low (${crestDb.toFixed(1)} dB); mix may be squashed`,
    });
  }
  if (Math.abs(dcOffset) > 0.02) {
    issues.push({
      severity: 'warn',
      code: 'dc-offset',
      message: `Noticeable DC offset (${dcOffset.toFixed(4)})`,
    });
  }

  return {
    durationS: n / sampleRate,
    sampleRate,
    ok: issues.every((i) => i.severity !== 'error'),
    peakDb,
    rmsDb,
    crestDb,
    clippingSamples,
    dcOffset,
    correlation,
    sideToMidDb,
    monoDropDb,
    lrBalanceDb,
    dynamicSpreadDb,
    bands,
    issues,
  };
}

/** Encodes stereo Float32Array [-1..1] buffers into a 16-bit PCM WAV file. */
export function encodeWav(left: Float32Array, right: Float32Array, sampleRate: number): Uint8Array {
  const numSamples = Math.min(left.length, right.length);
  const dataBytes = numSamples * 4;
  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 2, true);  // stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true); // byte rate
  view.setUint16(32, 4, true);  // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 4;
  }

  return new Uint8Array(buf);
}
