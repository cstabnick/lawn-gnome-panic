// The interior runtime (E05): door prompts, entering and leaving (fade + teleport), building the room on entry and
// disposing it on leaving, in-room spots, indoor light, ambience and the change listeners.
import * as THREE from 'three';
import { addInteractSpot } from '../interactables';
import { setAmbienceOverride } from '../sound/bus';
import { createKit, disposeGroup } from './kit';
import { interiorById, onInteriorDefined } from './registry';
import type { Hud, Player, Sfx, World } from '../types';

export interface InteriorDeps {
  scene: THREE.Scene;
  /** The shared #ui element: the fade overlay appends its own child to it. */
  ui: HTMLElement;
  world: World;
  player: Player;
  hud: Hud;
  /** Put the player on foot at (x, z) facing yaw, standing at height y when given (else on the ground). Keeps health. */
  teleport(x: number, z: number, yaw: number, y?: number): void;
  /** The Hat Watch level: doors stay shut while it is >= 1. */
  heat(): number;
  /** 0 day .. 1 night (atmosphere.nightFactor()). */
  night(): number;
  play(sfx: Sfx): void;
  unlock(id: string): void;
}

export interface Interiors {
  /** Enter interior `id` (fade, build, teleport). False when locked, wanted, in a vehicle, unknown or already moving. */
  enter(id: string): boolean;
  /** Leave the current interior to its exit (or to `to`, a world point: the Double Pot lift). */
  leave(to?: { x: number; y: number; z: number; yaw: number }): void;
  current(): string | null;
  /** While inside: where the world should think the player is (the exit point, y = ground there). Null outside. */
  home(): { x: number; y: number; z: number; yaw: number } | null;
  /** Every frame, after atmosphere.update (re-applies the indoor light while inside). */
  update(dt: number): void;
  onChange(cb: (id: string | null) => void): () => void;
  /** E10: rebuild the current room in place (a changed furniture layout): new meshes and colliders, the player stays put. */
  refresh(): void;
  /** E10: the current room's group (its children are in local coordinates), or null outside. */
  group(): THREE.Group | null;
}

let active: Interiors | null = null;
/** Change listeners live at module level, so content can subscribe at import time (before createInteriors). */
const changeListeners: ((id: string | null) => void)[] = [];
/** Call every change listener (the runtime calls this after entering and after leaving). */
export function emitInteriorChange(id: string | null): void {
  for (const cb of changeListeners.slice()) cb(id);
}

/** Create the runtime (app.ts, once). Also makes the module functions below work. */
export function createInteriors(deps: InteriorDeps): Interiors {
  const hasDom = typeof document !== 'undefined';
  let current: string | null = null;
  let group: THREE.Group | null = null;
  let windows: THREE.Mesh[] = [];
  let removers: (() => void)[] = [];
  /** The collider boxes each interior pushed into world.boxes (replaced on every build, so a changed layout collides). */
  const boxed = new Map<string, World['boxes']>();
  let phase: 'idle' | 'out' | 'in' = 'idle';
  let fadeT = 0;
  let swap: (() => void) | null = null;
  let fadeEl: HTMLDivElement | null = null;
  const tint = new THREE.Color();
  const dayCol = new THREE.Color(0xbfe3ff);
  const nightCol = new THREE.Color(0xffb860);
  const hemiCol = new THREE.Color();
  const hemiGround = new THREE.Color();

  if (hasDom) {
    fadeEl = document.createElement('div');
    fadeEl.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:none;z-index:30';
    deps.ui.appendChild(fadeEl);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('gta:interior-say', (e) => {
      const d = (e as CustomEvent<{ name?: string; line: string }>).detail;
      if (!d) return;
      deps.hud.toast(d.name ? `${d.name}: "${d.line}"` : d.line, 4000);
    });
  }

  const transition = (fn: () => void): void => {
    if (!hasDom) { fn(); return; }
    phase = 'out';
    fadeT = 0;
    swap = fn;
  };

  const doEnter = (id: string, stay = false): void => {
    const p = interiorById(id);
    if (!p) return;
    const { def, origin } = p;
    const { kit, build } = createKit(p);
    def.build(kit);
    kit.group.position.set(origin.x, 0, origin.z);
    deps.scene.add(kit.group);
    group = kit.group;
    windows = build.windows;
    const old = boxed.get(id);
    if (old) {
      for (const b of old) {
        const i = deps.world.boxes.indexOf(b);
        if (i >= 0) deps.world.boxes.splice(i, 1);
      }
    }
    const mine: World['boxes'] = build.boxes.map((b) => ({ ...b, minX: b.minX + origin.x, maxX: b.maxX + origin.x, minZ: b.minZ + origin.z, maxZ: b.maxZ + origin.z }));
    for (const b of mine) deps.world.boxes.push(b);
    boxed.set(id, mine);
    for (const s of build.spots) {
      removers.push(addInteractSpot({ x: origin.x + s.x, z: origin.z + s.z, prompt: s.prompt, run: () => { s.run(); return true; } }));
    }
    if (!stay) {
      const sp = build.spawn ?? { x: 0, z: 0, yaw: 0 };
      deps.teleport(origin.x + sp.x, origin.z + sp.z, sp.yaw);
    }
    setAmbienceOverride(def.ambience ?? 'silent');
    current = id;
    if (stay) return;
    def.onEnter?.();
    deps.unlock('gta-home-sweet-hovel');
    emitInteriorChange(id);
  };

  /** Tear the current room down and build it again where it is (no fade, no teleport, no change events). */
  const refresh = (): void => {
    const id = current;
    if (id === null || phase === 'out') return;
    for (const r of removers) r();
    removers = [];
    if (group) {
      deps.scene.remove(group);
      disposeGroup(group);
    }
    group = null;
    windows = [];
    current = null;
    doEnter(id, true);
  };

  const enter = (id: string): boolean => {
    const p = interiorById(id);
    if (!p || current !== null || phase !== 'idle') return false;
    if (deps.player.vehicle) return false;
    if (deps.heat() >= 1) {
      deps.hud.toast('The door stays shut with the Hat Watch on your tail.');
      return false;
    }
    const why = p.def.locked?.();
    if (typeof why === 'string') {
      deps.hud.toast(why);
      return false;
    }
    deps.play('door');
    transition(() => doEnter(id));
    return true;
  };

  const doLeave = (to?: { x: number; y: number; z: number; yaw: number }): void => {
    const def = current ? interiorById(current)?.def : undefined;
    for (const r of removers) r();
    removers = [];
    if (group) {
      deps.scene.remove(group);
      disposeGroup(group);
    }
    group = null;
    windows = [];
    setAmbienceOverride(null);
    if (def) {
      if (to) deps.teleport(to.x, to.z, to.yaw, to.y);
      else deps.teleport(def.exit.x, def.exit.z, def.exit.yaw);
    }
    current = null;
    def?.onLeave?.();
    emitInteriorChange(null);
  };

  const leave = (to?: { x: number; y: number; z: number; yaw: number }): void => {
    if (current === null || phase !== 'idle') return;
    deps.play('door');
    transition(() => doLeave(to));
  };

  const it: Interiors = {
    enter,
    leave,
    current: () => current,
    home() {
      const def = current ? interiorById(current)?.def : undefined;
      return def ? { x: def.exit.x, y: 0, z: def.exit.z, yaw: def.exit.yaw } : null;
    },
    update(dt) {
      if (phase === 'out') {
        fadeT += dt / 0.25;
        if (fadeEl) fadeEl.style.opacity = String(Math.min(1, fadeT));
        if (fadeT >= 1) {
          const fn = swap;
          swap = null;
          fn?.();
          phase = 'in';
          fadeT = 0;
        }
      } else if (phase === 'in') {
        fadeT += dt / 0.3;
        if (fadeEl) fadeEl.style.opacity = String(Math.max(0, 1 - fadeT));
        if (fadeT >= 1) {
          phase = 'idle';
          if (fadeEl) fadeEl.style.opacity = '0';
        }
      }
      if (current === null || phase === 'out') return;
      const p = interiorById(current);
      if (!p) return;
      const w = deps.world;
      if (w.hemi) {
        w.hemi.color.copy(hemiCol.setHex(p.theme.light));
        w.hemi.groundColor.copy(hemiGround.setHex(p.theme.floor));
        w.hemi.intensity = 1.25;
      }
      if (w.sun) w.sun.intensity = Math.min(w.sun.intensity, 0.45);
      tint.copy(dayCol).lerp(nightCol, deps.night());
      for (const m of windows) {
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.color?.copy(tint);
      }
    },
    onChange: onInteriorChange,
    refresh,
    group: () => group,
  };
  active = it;
  onInteriorDefined((p) => {
    const def = p.def;
    if (def.hiddenDoor) return;
    addInteractSpot({ x: def.door.x, z: def.door.z, prompt: def.prompt ?? 'Enter ' + def.name, run: () => { enter(def.id); return true; } });
  });
  return it;
}

export function enterInterior(id: string): boolean { return active?.enter(id) ?? false; }
export function leaveInterior(to?: { x: number; y: number; z: number; yaw: number }): void { active?.leave(to); }
export function currentInterior(): string | null { return active?.current() ?? null; }
/** E10: rebuild the current interior in place (meshes, colliders, spots), e.g. after its furniture layout changed. */
export function refreshInterior(): void { active?.refresh(); }
/** E10: the current interior's room group (children in local coordinates), or null outside. */
export function currentInteriorGroup(): THREE.Group | null { return active?.group() ?? null; }
export function onInteriorChange(cb: (id: string | null) => void): () => void {
  changeListeners.push(cb);
  return () => {
    const i = changeListeners.indexOf(cb);
    if (i >= 0) changeListeners.splice(i, 1);
  };
}
