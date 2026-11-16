// src/soldierLook.ts: swaps the gnome a soldier wears, to a player's saved look or back to its bot look.
// Kept apart from soldiers.ts and net/ so both can import it without a cycle.
import * as THREE from 'three';
import { TEAM_COLORS, type Soldier } from './config';
import type { GnomeLook } from './models/config';
import { createGnomeModel } from './models/gnome';

/** Puts `look` on the soldier (hat in its team colour), or its bot look when `look` is null. No-op if already worn. */
export function setSoldierLook(scene: THREE.Scene, s: Soldier, look: GnomeLook | null): void {
  const next = look ? { ...look, hat: TEAM_COLORS[s.team] } : s.botLook;
  // Keyed by the look's contents, so the same look is not rebuilt every time the roster changes.
  const key = look ? JSON.stringify(next) : '';
  if (key === s.lookKey) return;

  const old = s.model.object;
  scene.remove(old);
  old.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) mat.dispose();
  });

  s.model = createGnomeModel(next);
  scene.add(s.model.object);
  s.model.object.position.copy(s.pos);
  s.model.setDead(!s.alive);
  s.lookKey = key;
}
