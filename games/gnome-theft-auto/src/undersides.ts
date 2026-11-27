// Undersides (D58, GR8): faces that look down (a tunnel roof, a skyway deck, a cave ceiling) get only the hemisphere
// light's dark ground colour and no sun, so they read as a black-green void. Their materials take a small emissive
// floor in their own colour: bright enough by day to read as concrete or earth, low at night so lamps carry them.
import * as THREE from 'three';

/** Emissive intensity (times the material's own colour) by day and at full night. */
export const UNDERSIDE_GLOW = { day: 0.3, night: 0.05 } as const;

const mats: THREE.MeshStandardMaterial[] = [];

/**
 * A MeshStandardMaterial for slabs, decks and ceilings seen from below: `color` lit as usual, plus an emissive floor of
 * the same colour (updateUndersides scales it with the night). Extra parameters pass through (roughness, side, ...).
 */
export function undersideMat(color: number, params: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.95, ...params, color });
  m.emissive.setHex(color);
  m.emissiveIntensity = UNDERSIDE_GLOW.day;
  mats.push(m);
  return m;
}

/** The emissive intensity for a night factor (0 day .. 1 night). Pure. */
export function undersideGlow(night: number): number {
  const t = Math.min(1, Math.max(0, night));
  return UNDERSIDE_GLOW.day + (UNDERSIDE_GLOW.night - UNDERSIDE_GLOW.day) * t;
}

/** Every frame (app.ts, beside updateHomeWindows): dim every underside material's glow with the night. */
export function updateUndersides(night: number): void {
  const g = undersideGlow(night);
  for (const m of mats) m.emissiveIntensity = g;
}
