// Context actions: the nearest interactable with a label within its radius (xz) and |dy| < 2.5.
import type { Vec3 } from './types';

export interface Interactable { id: string; x: number; y: number; z: number; radius: number; label(): string | null; act(): void }
export interface Interact { add(i: Interactable): () => void; update(pos: Vec3): Interactable | null; current(): Interactable | null; trigger(): boolean }

export function createInteract(): Interact {
  const items: Interactable[] = [];
  let cur: Interactable | null = null;
  return {
    add(i) {
      items.push(i);
      return () => {
        const at = items.indexOf(i);
        if (at !== -1) items.splice(at, 1);
        if (cur === i) cur = null;
      };
    },
    update(pos) {
      let best: Interactable | null = null;
      let bestD = Infinity;
      for (const i of items) {
        if (Math.abs(i.y - pos.y) >= 2.5) continue;
        const d = Math.hypot(i.x - pos.x, i.z - pos.z);
        if (d > i.radius || d >= bestD) continue;
        if (i.label() === null) continue;
        best = i; bestD = d;
      }
      cur = best;
      return cur;
    },
    current: () => cur,
    trigger() {
      if (!cur || cur.label() === null) return false;
      cur.act();
      return true;
    },
  };
}
