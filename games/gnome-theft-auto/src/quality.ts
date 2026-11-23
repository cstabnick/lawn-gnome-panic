// Render quality tiers and the adaptive step between them, driven by measured frame time.
//
// A tier sets the pixel ratio, the sun's shadow map size and the area it covers, and how far the culler (cull.ts)
// draws and casts. Phones start on 'medium', desktops on 'high'. When frames stay slow the
// governor drops a tier; when they stay fast it climbs back, never above the starting tier.
//   ?quality=min|low|medium|high   fix the tier (no adaptive steps); 'min' is only reached when 'low' is still slow
//   ?quality=auto              adaptive from the default tier (the default)
// Pure logic here (stepTier) plus a small governor; app.ts applies a tier to the renderer, the sun and the camera.

export type Tier = 'min' | 'low' | 'medium' | 'high';
export const TIERS: Tier[] = ['min', 'low', 'medium', 'high'];

export interface QualitySettings {
  /** Upper bound on the device pixel ratio. */
  maxPixelRatio: number;
  /** Sun shadow map, px per side. */
  shadowMap: number;
  /** Half the side of the sun's shadow box, m. */
  shadowExtent: number;
  /** Multiplier on the culler's draw distances. */
  view: number;
  /** Multiplier on the culler's shadow distances. */
  shadow: number;
  /**
   * The sun's shadow map is re-rendered every this many frames (1 = every frame). In between, the last map is kept with
   * the light matrix it was rendered with, so shadows stay put; only moving things' shadows step at the lower rate.
   */
  shadowEvery: number;
}

export const QUALITY: Record<Tier, QualitySettings> = {
  /** Last resort for a phone still slow on 'low': fewer pixels, a small shadow box, shorter draw distances. */
  min: { maxPixelRatio: 0.8, shadowMap: 512, shadowExtent: 35, view: 0.45, shadow: 0.35, shadowEvery: 3 },
  low: { maxPixelRatio: 1, shadowMap: 1024, shadowExtent: 45, view: 0.6, shadow: 0.5, shadowEvery: 2 },
  medium: { maxPixelRatio: 1.5, shadowMap: 1024, shadowExtent: 65, view: 0.8, shadow: 0.75, shadowEvery: 1 },
  high: { maxPixelRatio: 2, shadowMap: 2048, shadowExtent: 90, view: 1, shadow: 1, shadowEvery: 1 },
};

/** Frame-time rules of the governor (ms between frames, smoothed). */
export const GOVERNOR = {
  /** Slower than this for `downAfterS` drops a tier (about 40 fps). */
  slowMs: 25,
  downAfterS: 2.5,
  /** Faster than this for `upAfterS` climbs a tier (about 70 fps: a 60 Hz screen never climbs, so no ping-pong). */
  fastMs: 14,
  upAfterS: 12,
  /** No step within this long of the last one. */
  cooldownS: 6,
  /** Smoothing of the frame time (per frame). */
  ema: 0.05,
};

export interface GovernorState {
  tier: Tier;
  /** The highest tier this session may use (the starting tier). */
  ceiling: Tier;
  emaMs: number;
  slowS: number;
  fastS: number;
  sinceStepS: number;
}

export function initialTier(search: string, coarse: boolean): { tier: Tier; adaptive: boolean } {
  const q = new URLSearchParams(search).get('quality');
  if (q === 'min' || q === 'low' || q === 'medium' || q === 'high') return { tier: q, adaptive: false };
  return { tier: coarse ? 'medium' : 'high', adaptive: true };
}

/** One frame of the governor: returns the new state (tier changes at most one step per call). */
export function stepTier(s: GovernorState, frameMs: number): GovernorState {
  // A hitch (a tab switch, a level load) is not a frame rate.
  const ms = Math.min(frameMs, 100);
  const dt = ms / 1000;
  const emaMs = s.emaMs === 0 ? ms : s.emaMs + (ms - s.emaMs) * GOVERNOR.ema;
  let { slowS, fastS } = s;
  slowS = emaMs > GOVERNOR.slowMs ? slowS + dt : 0;
  fastS = emaMs < GOVERNOR.fastMs ? fastS + dt : 0;
  const sinceStepS = s.sinceStepS + dt;
  const i = TIERS.indexOf(s.tier);
  if (sinceStepS >= GOVERNOR.cooldownS) {
    if (slowS >= GOVERNOR.downAfterS && i > 0) {
      return { ...s, tier: TIERS[i - 1], emaMs, slowS: 0, fastS: 0, sinceStepS: 0 };
    }
    if (fastS >= GOVERNOR.upAfterS && i < TIERS.indexOf(s.ceiling)) {
      return { ...s, tier: TIERS[i + 1], emaMs, slowS: 0, fastS: 0, sinceStepS: 0 };
    }
  }
  return { ...s, emaMs, slowS, fastS, sinceStepS };
}

/** Whether frame number `frame` re-renders the shadow map at a refresh of every `every` frames. Pure; tested. */
export function shadowFrame(frame: number, every: number): boolean {
  return every <= 1 || frame % Math.round(every) === 0;
}

export interface QualityGovernor {
  readonly tier: Tier;
  readonly settings: QualitySettings;
  /** Call once per frame with the time since the last frame (ms). Calls `apply` when the tier changes. */
  update(frameMs: number): void;
}

export function createQualityGovernor(start: Tier, adaptive: boolean, apply: (tier: Tier, s: QualitySettings) => void): QualityGovernor {
  let state: GovernorState = { tier: start, ceiling: start, emaMs: 0, slowS: 0, fastS: 0, sinceStepS: 0 };
  apply(start, QUALITY[start]);
  return {
    get tier() {
      return state.tier;
    },
    get settings() {
      return QUALITY[state.tier];
    },
    update(frameMs) {
      if (!adaptive) return;
      const before = state.tier;
      state = stepTier(state, frameMs);
      if (state.tier !== before) apply(state.tier, QUALITY[state.tier]);
    },
  };
}
