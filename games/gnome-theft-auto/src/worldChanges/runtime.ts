// World changes at runtime (E18, L68): shows each change's group (rows/*.ts builders) while defs.ts says it is on, and
// sends its Turfton FM bulletin when it turns on during play. STUB: E18 issue W0 writes the body.
import type * as THREE from 'three';
import type { QuestSave } from '../quests/types';
import { activeWorldChanges, endingOf, worldBulletinKey, worldChangeDef } from './defs';
import { worldChangeBuilder, type WorldChangeBuilt } from './registry';
import './rows';

export interface WorldChangesDeps {
  scene: THREE.Scene;
  /** The live quest saves (quests.getJournal().saves). */
  saves(): Record<string, QuestSave>;
  /** Turfton FM news (app.ts reportNews): a key of radio/content.ts EVENT_BULLETINS. */
  news(key: string): void;
  /** 0 by day .. 1 at night. */
  night(): number;
  /** Ground height (terrain.ts heightAt). */
  groundY(x: number, z: number): number;
}

export interface WorldChanges {
  /** Per frame: re-checks the saves (at most twice a second), shows/hides groups, runs shown groups' update. */
  update(dt: number): void;
  /** The ids on now (for the debug list and tests). */
  active(): string[];
}

const CHECK_EVERY = 0.5;

/** `?worldchange=W03,W08`: ids forced on for screenshots and checks. Never sent as news. */
function forcedIds(): Set<string> {
  try {
    const raw = new URLSearchParams(location.search).get('worldchange') ?? '';
    return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function installWorldChanges(deps: WorldChangesDeps): WorldChanges {
  const forced = forcedIds();
  const ctx = {
    scene: deps.scene,
    groundY: deps.groundY,
    night: deps.night,
    ending: () => endingOf(deps.saves()),
  };

  const built = new Map<string, WorldChangeBuilt>();
  const broken = new Set<string>();
  const shown = new Map<string, number>(); // id -> seconds since shown
  const announced = new Set<string>();
  let on = new Set<string>();
  let started = false;
  let acc = CHECK_EVERY; // so the first update checks at once

  function effectiveOn(): string[] {
    const ids = activeWorldChanges(deps.saves());
    for (const id of forced) if (!ids.includes(id)) ids.push(id);
    return ids;
  }

  function buildOnce(id: string): WorldChangeBuilt | undefined {
    const existing = built.get(id);
    if (existing || broken.has(id)) return existing;
    const build = worldChangeBuilder(id);
    if (!build) return undefined;
    try {
      const b = build(ctx);
      built.set(id, b);
      return b;
    } catch (err) {
      broken.add(id);
      console.warn(`world change ${id} failed to build; skipped`, err);
      return undefined;
    }
  }

  function announce(id: string): void {
    const ending = endingOf(deps.saves());
    const def = worldChangeDef(id);
    const text = ending === 'B' && def?.bulletinB ? def.bulletinB : def?.bulletin;
    if (!text || announced.has(id)) return;
    announced.add(id);
    deps.news(worldBulletinKey(id, ending));
  }

  function check(): void {
    const nowOn = new Set(effectiveOn());
    const first = !started;
    started = true;
    for (const id of nowOn) {
      // Ids already on at the first check were earned before this session: no news for them.
      if (!first && !on.has(id) && !forced.has(id)) announce(id);
      if (!shown.has(id)) {
        const b = buildOnce(id);
        if (b) {
          deps.scene.add(b.root);
          shown.set(id, 0);
        }
      }
    }
    for (const id of [...shown.keys()]) {
      if (!nowOn.has(id)) {
        const b = built.get(id);
        if (b) {
          deps.scene.remove(b.root);
          b.hide?.();
        }
        shown.delete(id);
      }
    }
    on = nowOn;
  }

  return {
    update(dt: number) {
      acc += dt;
      if (acc >= CHECK_EVERY) {
        acc = 0;
        check();
      }
      for (const id of shown.keys()) {
        const t = (shown.get(id) ?? 0) + dt;
        shown.set(id, t);
        built.get(id)?.update?.(dt, t);
      }
    },
    active: () => [...on],
  };
}
