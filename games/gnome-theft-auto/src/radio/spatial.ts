// Spatial acoustics for vehicle radio speakers heard on foot or in the air.
export const SPEAKER_MAX_DIST = 36;
export const SPEAKER_NEAR_DIST = 2.5;
export const SPEAKER_MAX_GAIN = 0.44;

export interface SpeakerAcoustics {
  readonly audible: boolean;
  readonly gain: number;
  readonly pan: number;
  readonly cutoffHz: number;
  readonly reverbWet: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function computeSpeakerAcoustics(
  listener: { x: number; y: number; z: number; yaw: number },
  source: { x: number; y: number; z: number },
): SpeakerAcoustics {
  const dx = source.x - listener.x;
  const dy = source.y - listener.y;
  const dz = source.z - listener.z;
  const dist = Math.hypot(dx, dy, dz);

  if (dist >= SPEAKER_MAX_DIST) {
    return { audible: false, gain: 0, pan: 0, cutoffHz: 480, reverbWet: 0.55 };
  }

  const t = clamp(1 - Math.max(0, dist - SPEAKER_NEAR_DIST) / (SPEAKER_MAX_DIST - SPEAKER_NEAR_DIST), 0, 1);
  const gain = Math.pow(t, 1.65) * SPEAKER_MAX_GAIN;
  const cutoffHz = 480 + (1350 - 480) * t;
  const reverbWet = 0.55 - (0.55 - 0.25) * t;

  const rightX = -Math.cos(listener.yaw);
  const rightZ = Math.sin(listener.yaw);
  const horiz = Math.hypot(dx, dz);
  const pan = clamp((dx * rightX + dz * rightZ) / Math.max(3, horiz), -0.85, 0.85);

  return {
    audible: gain > 0.004,
    gain,
    pan,
    cutoffHz,
    reverbWet,
  };
}
