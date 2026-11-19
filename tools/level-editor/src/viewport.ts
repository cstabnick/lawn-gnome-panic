// The 3D view of the level editor: renderer, orbit camera, terrain meshed in chunks from the game's own Terrain, a water
// plane, ground picking and re-meshing after edits. Nothing here reads or writes level data; main.ts and the tools do.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TUNING, WORLD, type ZoneDef, type ZoneId } from '@gnomomia/config';
import type { Terrain } from '@gnomomia/terrainCore';
import type { Rect } from '@lawn/level';
import type { GroundHit, Viewport } from './context';
import { marchToTerrain } from './march';

export interface ViewportDeps {
  terrain: Terrain;
  zones: Record<ZoneId, ZoneDef>;
}

/** Vertices per chunk side: 33 gives a 2 m grid over a 64 m chunk, the same resolution as the game's near chunks. */
const VERTS = 33;
/** Chunks built per animation frame at start-up, so the page stays responsive while the terrain fills in. */
const BUILD_PER_FRAME = 12;
/** Refresh grows an edited box by this much, so a chunk whose border heights changed is rebuilt too. */
const REFRESH_MARGIN = 2;

/** Creates the renderer, camera, orbit controls and terrain meshes inside `container`, and starts the render loop. */
export function createViewport(container: HTMLElement, deps: ViewportDeps): Viewport {
  const { terrain, zones } = deps;
  const C = WORLD.chunk;
  const STEP = C / (VERTS - 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd0f0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x446644, 1.1));
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.8);
  sun.position.set(200, 400, 150);
  scene.add(sun);

  const overlay = new THREE.Group();
  scene.add(overlay);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 4000);
  camera.position.set(0, 120, 120);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 5;
  controls.maxDistance = 1500;
  const setLeftOrbit = (on: boolean): void => {
    controls.mouseButtons = on
      ? { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }
      : { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
  };
  setLeftOrbit(true);

  // ---- which chunks are meshed: every chunk overlapping an outdoor zone's square grown by the blend distance.
  const keyOf = (ci: number, cj: number): string => `${ci},${cj}`;
  const wanted = new Map<string, [number, number]>();
  for (const def of Object.values(zones)) {
    if (def.indoor) continue;
    const o = def.origin ?? { x: 0, z: 0 };
    const m = def.half + WORLD.blend;
    for (let ci = Math.floor((o.x - m) / C); ci <= Math.floor((o.x + m) / C); ci++) {
      for (let cj = Math.floor((o.z - m) / C); cj <= Math.floor((o.z + m) / C); cj++) {
        wanted.set(keyOf(ci, cj), [ci, cj]);
      }
    }
  }

  const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const meshes = new Map<string, THREE.Mesh>();
  const colour = new THREE.Color();

  function buildChunk(ci: number, cj: number): void {
    const key = keyOf(ci, cj);
    const old = meshes.get(key);
    if (old) {
      scene.remove(old);
      old.geometry.dispose();
    }
    const x0 = ci * C, z0 = cj * C;
    const positions = new Float32Array(VERTS * VERTS * 3);
    const colours = new Float32Array(VERTS * VERTS * 3);
    for (let j = 0; j < VERTS; j++) {
      for (let i = 0; i < VERTS; i++) {
        const x = x0 + i * STEP, z = z0 + j * STEP;
        const v = (j * VERTS + i) * 3;
        positions[v] = x;
        positions[v + 1] = terrain.heightAt(x, z);
        positions[v + 2] = z;
        colour.setHex(terrain.groundColourAt(x, z));
        colours[v] = colour.r;
        colours[v + 1] = colour.g;
        colours[v + 2] = colour.b;
      }
    }
    // Two triangles per cell, wound so the normal points up (x east, z south).
    const index: number[] = [];
    for (let j = 0; j < VERTS - 1; j++) {
      for (let i = 0; i < VERTS - 1; i++) {
        const a = j * VERTS + i, b = a + 1, c = a + VERTS, d = c + 1;
        index.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, terrainMat);
    scene.add(mesh);
    meshes.set(key, mesh);
  }

  // ---- water: one flat translucent plane over every meshed chunk.
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
  for (const [ci, cj] of wanted.values()) {
    bx0 = Math.min(bx0, ci * C);
    bx1 = Math.max(bx1, (ci + 1) * C);
    bz0 = Math.min(bz0, cj * C);
    bz1 = Math.max(bz1, (cj + 1) * C);
  }
  if (!Number.isFinite(bx0)) { bx0 = 0; bx1 = C; bz0 = 0; bz1 = C; }
  const waterGeo = new THREE.PlaneGeometry(bx1 - bx0 + 2 * C, bz1 - bz0 + 2 * C);
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x3a7bd5, transparent: true, opacity: 0.55, depthWrite: false });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set((bx0 + bx1) / 2, TUNING.waterLevel, (bz0 + bz1) / 2);
  scene.add(water);

  // ---- start-up queue: every wanted chunk, built a few per frame by the loop below.
  const queue: [number, number][] = [...wanted.values()];

  // ---- size
  const resize = (): void => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => resize());
  ro.observe(container);
  resize();

  // ---- loop
  const frameFns = new Set<(dt: number) => void>();
  let raf = 0;
  let alive = true;
  let last = performance.now();
  function frame(now: number): void {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    let built = 0;
    while (built < BUILD_PER_FRAME && queue.length > 0) {
      const [ci, cj] = queue.shift()!;
      if (meshes.has(keyOf(ci, cj))) continue;
      buildChunk(ci, cj);
      built++;
    }
    controls.update();
    for (const fn of frameFns) fn(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // ---- picking
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(ev: PointerEvent | MouseEvent): GroundHit | null {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const o = raycaster.ray.origin, d = raycaster.ray.direction;
    return marchToTerrain(o.x, o.y, o.z, d.x, d.y, d.z, (x, z) => terrain.heightAt(x, z), 3000, 1);
  }

  function refresh(rect?: Rect): void {
    if (!rect) {
      for (const [ci, cj] of wanted.values()) buildChunk(ci, cj);
      queue.length = 0;
      return;
    }
    const i0 = Math.floor((rect.minX - REFRESH_MARGIN) / C), i1 = Math.floor((rect.maxX + REFRESH_MARGIN) / C);
    const j0 = Math.floor((rect.minZ - REFRESH_MARGIN) / C), j1 = Math.floor((rect.maxZ + REFRESH_MARGIN) / C);
    for (let ci = i0; ci <= i1; ci++) {
      for (let cj = j0; cj <= j1; cj++) {
        if (wanted.has(keyOf(ci, cj))) buildChunk(ci, cj);
      }
    }
  }

  function focus(x: number, z: number, distance?: number): void {
    const y = terrain.heightAt(x, z);
    if (distance === undefined) {
      // Keep the current viewing direction and distance: move target and camera by the same amount.
      const offset = camera.position.clone().sub(controls.target);
      controls.target.set(x, y, z);
      camera.position.copy(controls.target).add(offset);
    } else {
      controls.target.set(x, y, z);
      camera.position.set(x, y + 0.62 * distance, z + 0.78 * distance);
    }
    controls.update();
  }

  function onFrame(fn: (dt: number) => void): () => void {
    frameFns.add(fn);
    return () => { frameFns.delete(fn); };
  }

  function dispose(): void {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    for (const mesh of meshes.values()) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }
    meshes.clear();
    terrainMat.dispose();
    scene.remove(water);
    waterGeo.dispose();
    waterMat.dispose();
    frameFns.clear();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    scene,
    camera,
    dom: renderer.domElement,
    overlay,
    pick,
    refresh,
    setLeftOrbit,
    focus,
    onFrame,
    dispose,
  };
}
