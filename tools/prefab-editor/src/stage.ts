// The 3D view: a gnome built by @lawn/gnome wearing the edited prefab through the same buildGear() every game uses,
// orbit camera, a gizmo, part picking, and the head/face spheres the clearance check measures against.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import {
  anchorMatrix, buildGear, createGnomeModel, FACE, HEAD,
  type EquipSlot, type GnomeLook, type GnomeModel, type PlayerState,
} from '@lawn/gnome';
import { buildPrefab, type Part, type PrefabDef, type Swatch } from '@lawn/prefabs';

export type Pose = 'idle' | 'walk' | 'jump' | 'sit';
/** A gnome slot, or 'model': the prefab on its own on the ground (any prefab), with the gnome beside it for scale. */
export type ViewSlot = EquipSlot | 'model';
/** What the gizmo moves: a part, the whole item's worn offset, the grip, or nothing. */
export type GizmoTarget = 'part' | 'wear' | 'grip' | 'off';
export type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface GizmoChange {
  target: Exclude<GizmoTarget, 'off'>;
  at: [number, number, number];
  rot: [number, number, number]; // degrees
  scale: [number, number, number];
}

export interface StageOptions {
  onPick(partIndex: number | null): void;
  onGizmo(change: GizmoChange, done: boolean): void;
}

const DEG = Math.PI / 180;
const PICK_LAYER = 1;
const r4 = (n: number): number => Math.round(n * 10000) / 10000;

export class Stage {
  readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
  private readonly orbit: OrbitControls;
  private readonly gizmo: TransformControls;
  private readonly raycaster = new THREE.Raycaster();

  private model: GnomeModel | null = null;
  private gear: THREE.Object3D | null = null;
  private slot: ViewSlot = 'head';
  private def: PrefabDef | null = null;
  private tint: Swatch | number | undefined;
  private selected: number | null = null;

  /** Follows the prefab's own coordinates (where `parts[].at` and `grip` live). */
  private readonly partSpace = new THREE.Group();
  /** Follows the slot anchor, before the `wear` offset (where `wear` lives). */
  private readonly anchorSpace = new THREE.Group();
  private readonly handle = new THREE.Object3D();
  private readonly overlay = new THREE.Group();
  private readonly proxies = new THREE.Group();
  private readonly spheres = new THREE.Group();
  private readonly anchorAxes = new THREE.AxesHelper(0.12);
  private readonly highlight = new THREE.MeshBasicMaterial({
    color: 0xffd23f, wireframe: true, transparent: true, opacity: 0.9, depthTest: false,
  });

  private target: GizmoTarget = 'part';
  private dragging = false;
  private pose: Pose = 'idle';
  private turntable = false;
  private yaw = 0;
  private readonly state: PlayerState = {
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0,
  };

  constructor(private readonly opts: StageOptions) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'stage';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    const s = this.scene;
    s.background = new THREE.Color(0x8fc7e0);
    s.add(new THREE.HemisphereLight(0xffffff, 0x6a8f4a, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(2, 5, 3);
    sun.castShadow = true;
    s.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(2, 48), new THREE.MeshStandardMaterial({ color: 0x5fae4e }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    s.add(ground);
    const grid = new THREE.GridHelper(2, 20, 0x2f5a2a, 0x4a7d40);
    grid.position.y = 0.001;
    s.add(grid);

    for (const g of [this.partSpace, this.anchorSpace]) {
      g.matrixAutoUpdate = false;
      s.add(g);
    }
    this.partSpace.add(this.overlay, this.proxies);
    this.anchorSpace.add(this.anchorAxes);
    (this.anchorAxes.material as THREE.Material).depthTest = false;
    this.anchorAxes.renderOrder = 10;

    this.camera.position.set(0.9, 1.2, 1.6);
    this.orbit = new OrbitControls(this.camera, this.canvas);
    this.orbit.target.set(0, 0.8, 0);
    this.orbit.enableDamping = true;
    this.orbit.update();

    this.gizmo = new TransformControls(this.camera, this.canvas);
    this.gizmo.setSize(0.8);
    this.gizmo.setSpace('local');
    s.add(this.gizmo.getHelper());
    this.gizmo.addEventListener('dragging-changed', (e) => {
      this.dragging = !!e.value;
      this.orbit.enabled = !e.value;
      if (!e.value) this.emitGizmo(true);
    });
    this.gizmo.addEventListener('objectChange', () => this.emitGizmo(false));

    this.raycaster.layers.set(PICK_LAYER);
    let down: { x: number; y: number } | null = null;
    this.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down || this.dragging) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < 5) this.pick(e);
    });

    new ResizeObserver(() => this.resize()).observe(this.canvas);
    let last = performance.now();
    const loop = (now: number): void => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.tick(dt);
    };
    requestAnimationFrame(loop);
  }

  private resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- what is shown

  setLook(look: GnomeLook): void {
    if (this.model) {
      this.spheres.removeFromParent();
      this.scene.remove(this.model.object);
      disposeGnome(this.model.object);
    }
    this.model = createGnomeModel({ ...look, equipment: {} });
    this.model.rig.add(this.spheres);
    this.scene.add(this.model.object);
    this.gear = null;
    this.rebuildGear();
  }

  setGear(slot: ViewSlot, def: PrefabDef | null, tint?: Swatch | number): void {
    this.slot = slot;
    this.def = def;
    this.tint = tint;
    this.rebuildGear();
  }

  /** Rebuilds the worn item from the current def (after every edit). */
  rebuildGear(): void {
    const m = this.model;
    if (!m) return;
    if (this.gear) this.gear.removeFromParent();
    this.gear = null;
    if (m.hat) m.hat.visible = !(this.def && this.slot === 'head');
    // Model mode: the gnome steps aside and the prefab stands at the origin, as buildPrefab() makes it.
    this.state.position.x = this.slot === 'model' ? -0.7 : 0;
    if (this.def && this.slot === 'model') {
      this.gear = buildPrefab(this.def, { tint: this.tint });
      this.scene.add(this.gear);
    } else if (this.def && this.slot !== 'model') {
      this.gear = buildGear(this.slot, this.def, { tint: this.tint });
      (this.slot === 'hand' ? m.arms.right : m.rig).add(this.gear);
    }
    this.rebuildPartHelpers();
    // Mid-drag the handle must stay attached and the spaces frozen (moving the grip moves its own space).
    if (this.dragging) return;
    this.updateSpaces(true);
    this.placeHandle();
  }

  select(index: number | null): void {
    this.selected = index;
    this.rebuildPartHelpers();
    this.placeHandle();
  }

  setGizmo(target: GizmoTarget, mode?: GizmoMode): void {
    this.target = target;
    if (mode) this.gizmo.setMode(mode);
    this.placeHandle();
  }

  setPose(p: Pose): void {
    this.pose = p;
  }

  setTurntable(on: boolean): void {
    this.turntable = on;
    if (!on) this.yaw = 0;
  }

  setSpheres(on: boolean): void {
    this.spheres.clear();
    if (!on) return;
    const mat = new THREE.MeshBasicMaterial({ color: 0xff3355, wireframe: true, transparent: true, opacity: 0.35 });
    for (const s of [{ center: HEAD.center, radius: HEAD.radius }, ...FACE]) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(s.radius, 16, 12), mat);
      mesh.position.set(...s.center);
      this.spheres.add(mesh);
    }
  }

  /** Points the camera at the worn item, or the whole gnome. */
  frame(what: 'item' | 'gnome'): void {
    this.updateSpaces(true);
    const box = new THREE.Box3();
    if (what === 'item' && this.gear) box.expandByObject(this.gear, true);
    else if (this.model) box.expandByObject(this.model.object);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dir = this.camera.position.clone().sub(this.orbit.target).normalize();
    const dist = Math.max(this.slot === 'model' ? 0.6 : 0.9, sphere.radius / Math.sin((this.camera.fov / 2) * DEG)) * 1.1;
    this.orbit.target.copy(sphere.center);
    this.camera.position.copy(sphere.center).addScaledVector(dir, dist);
    this.orbit.update();
  }

  /** Camera from straight ahead, a side, behind or above, keeping the current distance and target. */
  view(from: 'front' | 'side' | 'back' | 'top'): void {
    const t = this.orbit.target;
    const d = this.camera.position.distanceTo(t);
    const dir = { front: [0, 0, 1], side: [1, 0, 0], back: [0, 0, -1], top: [0, 1, 0.001] }[from];
    this.camera.position.set(t.x + dir[0] * d, t.y + dir[1] * d, t.z + dir[2] * d);
    this.orbit.update();
  }

  // ---------------------------------------------------------------- helpers in prefab space

  private singlePart(p: Part): THREE.Object3D | null {
    if (!this.def) return null;
    const { name: _n, group: _g, ...plain } = p;
    return buildPrefab(
      { ...this.def, id: `${this.def.id}#part`, parts: [plain], lights: undefined, pivots: undefined },
      { tint: this.tint, shadows: false, lights: false },
    );
  }

  private rebuildPartHelpers(): void {
    this.overlay.clear();
    this.proxies.clear();
    if (!this.def) return;
    this.def.parts.forEach((p, i) => {
      const proxy = this.singlePart(p);
      if (!proxy) return;
      proxy.userData.partIndex = i;
      proxy.traverse((o) => o.layers.set(PICK_LAYER));
      this.proxies.add(proxy);
    });
    if (this.selected !== null && this.def.parts[this.selected]) {
      const sel = this.singlePart(this.def.parts[this.selected]);
      if (sel) {
        sel.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.material = this.highlight;
            o.renderOrder = 20;
          }
        });
        this.overlay.add(sel);
      }
    }
  }

  private pick(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.proxies, true)[0];
    let o: THREE.Object3D | null = hit?.object ?? null;
    while (o && o.userData.partIndex === undefined) o = o.parent;
    this.opts.onPick(o ? (o.userData.partIndex as number) : null);
  }

  // ---------------------------------------------------------------- gizmo

  private placeHandle(): void {
    this.handle.removeFromParent();
    this.gizmo.detach();
    const def = this.def;
    if (!def || this.target === 'off') return;
    const h = this.handle;
    h.position.set(0, 0, 0);
    h.rotation.set(0, 0, 0);
    h.scale.set(1, 1, 1);
    if (this.target === 'part') {
      const p = this.selected !== null ? def.parts[this.selected] : undefined;
      if (!p) return;
      h.position.set(...(p.at ?? [0, 0, 0]));
      const rot = p.rot ?? [0, 0, 0];
      h.rotation.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'XYZ');
      h.scale.set(...(p.scale ?? [1, 1, 1]));
      this.partSpace.add(h);
    } else if (this.target === 'wear') {
      if (this.slot === 'model') return;
      const w = def.wear ?? {};
      h.position.set(...(w.at ?? [0, 0, 0]));
      const rot = w.rot ?? [0, 0, 0];
      h.rotation.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'XYZ');
      h.scale.setScalar(w.scale ?? 1);
      this.anchorSpace.add(h);
    } else {
      if (this.slot !== 'model' && (this.slot !== 'hand' || !def.uses.includes('hold'))) return;
      h.position.set(...(def.grip ?? [0, 0, 0]));
      this.partSpace.add(h);
    }
    this.gizmo.attach(h);
    this.gizmo.showX = this.gizmo.showY = this.gizmo.showZ = true;
  }

  private emitGizmo(done: boolean): void {
    if (this.target === 'off') return;
    const h = this.handle;
    const s = this.target === 'wear'
      ? (() => { const u = r4((h.scale.x + h.scale.y + h.scale.z) / 3); return [u, u, u] as [number, number, number]; })()
      : [r4(h.scale.x), r4(h.scale.y), r4(h.scale.z)] as [number, number, number];
    this.opts.onGizmo({
      target: this.target,
      at: [r4(h.position.x), r4(h.position.y), r4(h.position.z)],
      rot: [r4(h.rotation.x / DEG), r4(h.rotation.y / DEG), r4(h.rotation.z / DEG)],
      scale: s,
    }, done);
  }

  // ---------------------------------------------------------------- per frame

  private updateSpaces(force = false): void {
    const m = this.model;
    if (!m || (this.dragging && !force)) return;
    m.object.updateMatrixWorld(true);
    const gear = this.gear;
    this.anchorAxes.visible = this.slot !== 'model';
    if (this.slot === 'model') {
      gear?.updateMatrixWorld(true);
      if (gear) this.partSpace.matrix.copy(gear.matrixWorld);
      else this.partSpace.matrix.identity();
      this.anchorSpace.matrix.identity();
    } else if (gear) {
      // Parts live in the prefab root; a held item's root is the grip holder's child.
      const local = gear.userData.prefab ? gear : gear.children[0] ?? gear;
      this.partSpace.matrix.copy(local.matrixWorld);
      const parent = gear.parent!;
      this.anchorSpace.matrix.multiplyMatrices(parent.matrixWorld, anchorMatrix(this.slot));
    } else {
      const parent = this.slot === 'hand' ? m.arms.right : m.rig;
      this.anchorSpace.matrix.multiplyMatrices(parent.matrixWorld, anchorMatrix(this.slot));
      this.partSpace.matrix.copy(this.anchorSpace.matrix);
    }
    this.partSpace.matrixWorldNeedsUpdate = true;
    this.anchorSpace.matrixWorldNeedsUpdate = true;
  }

  private tick(dt: number): void {
    const m = this.model;
    if (m) {
      const st = this.state;
      const p = this.dragging ? 'idle' : this.pose;
      st.velocity.set(0, p === 'jump' ? 2 : 0, p === 'walk' ? 3 : 0);
      st.grounded = p !== 'jump';
      st.sitting = p === 'sit';
      if (this.turntable) this.yaw += dt * 0.6;
      st.facing = this.yaw;
      m.update(st, dt);
      // Gear on the hand follows the arm; keep the hand still when not walking so it is easy to work on.
      if (p === 'idle') {
        m.arms.right.rotation.x = 0;
        m.arms.left.rotation.x = 0;
      }
    }
    this.updateSpaces();
    this.orbit.update();
    this.renderer.render(this.scene, this.camera);
  }
}

/** Frees the gnome's own geometry and materials; prefab meshes are shared caches and are skipped. */
function disposeGnome(obj: THREE.Object3D): void {
  if (obj.userData.prefab) return;
  const mesh = obj as THREE.Mesh;
  if (mesh.isMesh) {
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) mat?.dispose();
  }
  for (const c of obj.children) disposeGnome(c);
}
