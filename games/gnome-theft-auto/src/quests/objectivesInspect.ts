// Objective runner for 'inspect' (E20): walk to each point on foot and press, or hold, the action button there
// (photograph a permit, read a barometer, look through a knot-hole). Input: E / Space or the on-screen button; the quest
// sim sends the same thing as a window `gta:inspect-action` event ({ detail: { down: boolean } }), see INSPECT_EVENT.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { SCENES } from '../cutscene/scenes';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import { trackBeam } from '../questMarkerPrefs';
import type { Blip } from '../types';
import { interiorById, interiorToWorld } from '../interiors/registry';
import { currentInterior } from '../interiors/runtime';
import type { InspectPoint, ObjectiveDef, QuestDeps, Run } from './types';

/** The quest sim's way to press the action: a window event with `detail.down` true (press / hold) or false (let go). */
export const INSPECT_EVENT = 'gta:inspect-action';

const DEFAULT_RADIUS = 3;
const COLOR = 0x7fe3ff;
const BLIP_COLOR = '#ff7a00';
const BTN_SIZE = 96;

type Spec = Extract<ObjectiveDef, { kind: 'inspect' }>;

/** Pure: 0..1 fill of the hold ring. No hold time (absent or 0) is a press: full once anything is held. */
export function holdProgress(held: number, holdSeconds: number | undefined): number {
  if (!holdSeconds || holdSeconds <= 0) return held > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, held / holdSeconds));
}

/** Pure: indices of the points the player may do now: all pending, or only the first pending when `ordered`. */
export function pendingPoints(done: readonly boolean[], ordered: boolean | undefined): number[] {
  const out: number[] = [];
  for (let i = 0; i < done.length; i++) {
    if (done[i]) continue;
    out.push(i);
    if (ordered) break;
  }
  return out;
}

/** Pure: the open point nearest (px, pz) within its radius, or -1. `pos` holds world positions. */
export function nextPoint(
  points: readonly { pos: [number, number]; radius?: number }[],
  done: readonly boolean[],
  ordered: boolean | undefined,
  px: number,
  pz: number,
): number {
  let best = -1;
  let bd = Infinity;
  for (const i of pendingPoints(done, ordered)) {
    const p = points[i];
    const d = Math.hypot(px - p.pos[0], pz - p.pos[1]);
    if (d <= (p.radius ?? DEFAULT_RADIUS) && d < bd) { bd = d; best = i; }
  }
  return best;
}

function disposeTree(scene: THREE.Scene, m: THREE.Object3D): void {
  scene.remove(m);
  m.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

interface Marker { group: THREE.Group; prop: THREE.Object3D | null }

function buildMarker(scene: THREE.Scene, p: InspectPoint, x: number, z: number): Marker {
  const group = new THREE.Group();
  const ground = p.interior ? 0 : heightAt(x, z);
  const r = p.radius ?? DEFAULT_RADIUS;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(0.5, r - 0.45), r, 28),
    flatLayer(new THREE.MeshBasicMaterial({ color: COLOR, side: THREE.DoubleSide, transparent: true, opacity: 0.5, depthWrite: false }), LAYER.marker),
  );
  ring.rotation.x = -Math.PI / 2;
  placeOnGround(ring, x, z, 0.08, true);
  group.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 30, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: COLOR, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.position.set(x, ground + 15, z);
  trackBeam(beam, ground, 30);
  group.add(beam);
  scene.add(group);
  let prop: THREE.Object3D | null = null;
  if (p.prop) {
    try {
      prop = buildPrefab(p.prop, { lights: false });
      prop.position.set(x, ground, z);
      scene.add(prop);
    } catch (e) {
      console.warn(`[inspect] prefab ${p.prop}:`, e);
    }
  }
  return { group, prop };
}

export function inspectRun(obj: Spec, deps: QuestDeps, changed: () => void, say: (t: string) => void): Run {
  const n = obj.points.length;
  const pts = obj.points.map((p) => ({
    ...p,
    pos: (p.interior ? interiorToWorld(p.interior, p.at[0], p.at[1]) : p.at) as [number, number],
  }));
  const done: boolean[] = obj.points.map(() => false);
  const markers = new Map<number, Marker>();
  const hold = obj.holdSeconds && obj.holdSeconds > 0 ? obj.holdSeconds : 0;
  let doneFlag = false;
  let sceneOn = false;
  let down = false;
  let held = 0;
  let t = 0;
  let px = 0;
  let pz = 0;
  let near = -1;

  // The button: its own container under the shared #ui, never restyling #ui.
  let box: HTMLElement | null = null;
  let btn: HTMLButtonElement | null = null;
  let fill: HTMLElement | null = null;
  const doc = typeof document !== 'undefined' ? document : null;
  if (doc) {
    const ui = doc.getElementById('ui') ?? doc.body;
    box = doc.createElement('div');
    box.id = 'gta-inspect';
    Object.assign(box.style, {
      position: 'fixed', right: 'calc(env(safe-area-inset-right) + 18px)', bottom: 'calc(env(safe-area-inset-bottom) + 150px)',
      zIndex: '40', display: 'none', pointerEvents: 'none',
    });
    btn = doc.createElement('button');
    btn.type = 'button';
    btn.textContent = obj.verb;
    btn.setAttribute('aria-label', obj.verb);
    Object.assign(btn.style, {
      position: 'relative', overflow: 'hidden', width: `${BTN_SIZE}px`, height: `${BTN_SIZE}px`, minWidth: '44px', minHeight: '44px',
      borderRadius: '50%', border: '3px solid rgba(255,255,255,0.6)', background: 'rgba(30,70,90,0.85)', color: '#fff',
      font: '800 16px system-ui, sans-serif', touchAction: 'none', userSelect: 'none', cursor: 'pointer', pointerEvents: 'auto',
    });
    fill = doc.createElement('div');
    Object.assign(fill.style, { position: 'absolute', left: '0', bottom: '0', width: '100%', height: '0%', background: 'rgba(127,227,255,0.45)', pointerEvents: 'none' });
    btn.appendChild(fill);
    box.appendChild(btn);
    ui.appendChild(box);
  }

  const onFoot = (): boolean => !deps.player?.vehicle;

  const dropMarker = (i: number): void => {
    const m = markers.get(i);
    if (!m) return;
    disposeTree(deps.scene, m.group);
    if (m.prop) disposeTree(deps.scene, m.prop);
    markers.delete(i);
  };

  const finishAll = (): void => {
    const script = obj.scene ? SCENES[obj.scene] : undefined;
    if (obj.scene && !script) console.warn(`[cutscene] inspect: unknown scene ${obj.scene}`);
    if (script && !deps.cutscene.active) {
      sceneOn = true;
      deps.cutscene.play({ kind: 'script', script }, () => {
        sceneOn = false;
        doneFlag = true;
        changed();
      }, { onTrigger: (name, arg) => window.dispatchEvent(new CustomEvent('gta:cutscene-trigger', { detail: { name, arg, quest: null } })) });
      return;
    }
    doneFlag = true;
    changed();
  };

  const finishPoint = (i: number): void => {
    done[i] = true;
    held = 0;
    down = false;
    dropMarker(i);
    const p = obj.points[i];
    say(p.note ?? p.label);
    if (obj.verb === 'Photograph') deps.play('shutter');
    if (done.every(Boolean)) finishAll();
  };

  const press = (): void => {
    if (doneFlag || sceneOn || down) return;
    near = nextPoint(pts, done, obj.ordered, px, pz);
    if (near < 0 || !onFoot()) return;
    if (!hold) finishPoint(near);
    else down = true;
  };
  const release = (): void => {
    down = false;
    held = 0;
  };

  const isKey = (e: KeyboardEvent): boolean => e.code === 'KeyE' || e.code === 'Space';
  const onKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (!isKey(e) || e.repeat || tag === 'INPUT' || tag === 'TEXTAREA') return;
    press();
  };
  const onKeyUp = (e: KeyboardEvent): void => { if (isKey(e)) release(); };
  const onSim = (e: Event): void => {
    if ((e as CustomEvent<{ down: boolean }>).detail?.down) press();
    else release();
  };
  const onBtnDown = (e: Event): void => { e.preventDefault(); e.stopPropagation(); press(); };
  const onBtnUp = (): void => release();
  const onCtx = (e: Event): void => e.preventDefault();
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener(INSPECT_EVENT, onSim);
  }
  if (btn) {
    btn.addEventListener('pointerdown', onBtnDown);
    btn.addEventListener('pointerup', onBtnUp);
    btn.addEventListener('pointercancel', onBtnUp);
    btn.addEventListener('pointerleave', onBtnUp);
    btn.addEventListener('contextmenu', onCtx);
  }

  const syncMarkers = (): void => {
    const open = new Set(pendingPoints(done, obj.ordered));
    for (const i of open) {
      if (!markers.has(i)) markers.set(i, buildMarker(deps.scene, obj.points[i], pts[i].pos[0], pts[i].pos[1]));
    }
    for (const i of [...markers.keys()]) if (!open.has(i)) dropMarker(i);
  };

  const count = (): number => done.filter(Boolean).length;

  return {
    lines: () => {
      if (doneFlag) return [obj.text];
      const i = pendingPoints(done, obj.ordered)[0] ?? 0;
      return [obj.text, `${count()}/${n}: next ${obj.points[i].label}`];
    },
    done: () => doneFlag,
    update(dt, x, z) {
      t += dt;
      px = x;
      pz = z;
      if (doneFlag) return;
      syncMarkers();
      const cand = sceneOn ? -1 : nextPoint(pts, done, obj.ordered, x, z);
      const ready = cand >= 0 && onFoot();
      if (down) {
        // Letting go, stepping out of range, or a different point resets the ring.
        if (!ready || cand !== near) release();
        else {
          held += dt;
          if (held >= hold) { finishPoint(near); return; }
        }
      }
      if (box && fill) {
        box.style.display = ready ? 'block' : 'none';
        fill.style.height = `${(holdProgress(held, hold) * 100).toFixed(1)}%`;
      }
      void t;
    },
    onCracked() {},
    blips: (): Blip[] => {
      if (doneFlag) return [];
      return pendingPoints(done, obj.ordered).map((i): Blip => {
        const p = obj.points[i];
        if (p.interior && currentInterior() !== p.interior) {
          const d = interiorById(p.interior)?.def.door;
          if (d) return { x: d.x, z: d.z, color: BLIP_COLOR, quest: p.label };
        }
        return { x: pts[i].pos[0], z: pts[i].pos[1], color: BLIP_COLOR, quest: p.label };
      });
    },
    cracked: () => [],
    cleanup() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener(INSPECT_EVENT, onSim);
      }
      for (const i of [...markers.keys()]) dropMarker(i);
      box?.remove();
      box = null;
      btn = null;
      fill = null;
    },
  };
}
