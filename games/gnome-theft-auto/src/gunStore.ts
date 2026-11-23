// Ammu-Gnation, Turfton's gun-mod store: the walk-in storefront on the east edge of town (prefab building + collision
// boxes), the counter prompt, and the back-room display stage far off the map where the shop shows the modded gun big on
// a turntable while the sheet (gunShop.ts) is open. The stage is built on the first open (see glazeStage.ts for the same idea).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { ShowroomTarget } from './camera';
import type { Economy } from './economy';
import { buildModdedGun } from './gunRig';
import { moddedGun, type GunLoadout } from './gunMods';
import { createGunShop, type GunFit, type GunShop } from './gunShop';
import { playGunShot } from './gunSounds';
import { heightAt } from './terrain';
import type { Box, GunKind, Hud, Player, Sfx } from './types';

/** Where the store stands: centre (x, z), its open front faces -x (toward the road at x = 180), drawn at `scale`. */
export const GUN_STORE = { x: 200, z: -30, yaw: -Math.PI / 2, scale: 3 } as const;
/** Map blip colour (olive with a safety-orange rim reads on the city grey). */
export const GUN_STORE_BLIP = '#ff7a1a';

/** The back-room display stage: far outside the map (the Pay 'n' Glaze stage is at 4000, 0). */
const STAGE = { x: 4000, z: 900 } as const;
/** Height of the display gun's centre above the stage floor. */
const DISPLAY_Y = 1.75;
/** How far the counter's serve point sits from the store's origin, in prefab units. */
const SERVE_RANGE = 2.4;

export interface GunStoreDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  play(sfx: Sfx): void;
  /** The weapon the player holds now: the shop opens on it. */
  currentGun(): GunKind;
  /** Hat Watch heat now: the store will not serve a wanted gnome (heat >= 1). */
  heat(): number;
  /** The shop opened (a target for chase.showroom: the display gun) or closed (null). The game hides the HUD and holds the controls. */
  showroom(target: ShowroomTarget | null): void;
  /** An order went through (after gunModStore saved it). */
  onFit(info: GunFit): void;
}

export interface GunStore {
  /** The storefront's collision boxes in world coordinates. The game pushes them into world.boxes once. */
  readonly boxes: readonly Box[];
  /** Where the map pin goes. */
  readonly blip: { x: number; z: number; color: string };
  /** 'Shop mods at Ammu-Gnation' while the player stands on foot at the counter, else null. */
  prompt(player: Player): string | null;
  /** Open the shop (E or the touch button at the counter). A wanted gnome gets a toast instead. */
  interact(player: Player): void;
  isOpen(): boolean;
  close(): void;
  /** Every frame (turns the display while open). */
  update(dt: number): void;
}

/** A store-local point (prefab units, before the store's scale and turn) in world x/z. */
function localToWorld(lx: number, lz: number): { x: number; z: number } {
  const S = GUN_STORE.scale;
  const c = Math.cos(GUN_STORE.yaw);
  const s = Math.sin(GUN_STORE.yaw);
  return {
    x: GUN_STORE.x + S * (lx * c + lz * s),
    z: GUN_STORE.z + S * (-lx * s + lz * c),
  };
}

/** The storefront's collision boxes: prefab-local rectangles [minX, maxX, minZ, maxZ, height] turned into world AABBs. */
function storefrontBoxes(y0: number): Box[] {
  const rects: [number, number, number, number, number][] = [
    [-2.2, -1.9, -1.8, 1.8, 2.16], // left wall
    [1.9, 2.2, -1.8, 1.8, 2.16], // right wall
    [-1.92, 1.92, -1.79, -1.49, 2.0], // back wall
    [-1.3, 1.3, -0.94, -0.46, 0.44], // counter
  ];
  return rects.map(([minX, maxX, minZ, maxZ, height]) => {
    const corners = [localToWorld(minX, minZ), localToWorld(maxX, minZ), localToWorld(minX, maxZ), localToWorld(maxX, maxZ)];
    return {
      minX: Math.min(...corners.map((p) => p.x)),
      maxX: Math.max(...corners.map((p) => p.x)),
      minZ: Math.min(...corners.map((p) => p.z)),
      maxZ: Math.max(...corners.map((p) => p.z)),
      h: y0 + height * GUN_STORE.scale,
    };
  });
}

/** The name plate: "AMMU-GNATION" painted on a plane fixed to the building's front (prefab-local). Null without a DOM. */
function nameplate(): THREE.Mesh | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.font = 'bold 96px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#1a1008';
  ctx.strokeText('AMMU-GNATION', 512, 66);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AMMU-GNATION', 512, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = flatLayer(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), LAYER.decal);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.36), mat);
  m.position.set(0.25, 2.45, 1.99);
  return m;
}

/** The back room's sky: olive overhead, orange at the horizon, dark below. Plain colours without a DOM. */
function stageBackdrop(): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false });
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#1d2410');
      grad.addColorStop(0.35, '#4b5d2a');
      grad.addColorStop(0.5, '#ff7a1a');
      grad.addColorStop(0.52, '#2a2a24');
      grad.addColorStop(1, '#2a2a24');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
    }
  } else {
    mat.color.set(0x4b5d2a);
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

/** A prefab placed on the stage floor (skipped when the prefab is not registered). */
function stageProp(group: THREE.Group, id: string, x: number, z: number, scale: number, yaw: number): void {
  if (!getPrefab(id)) return;
  const g = buildPrefab(id);
  g.scale.setScalar(scale);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  group.add(g);
}

interface Stage {
  /** The whole back room; hidden until the shop opens. */
  group: THREE.Group;
  /** The turntable's top: the display gun's frame, at DISPLAY_Y above the floor. */
  display: THREE.Group;
  /** The gun on the display now, or null. */
  gun: THREE.Object3D | null;
}

export function createGunStore(deps: GunStoreDeps): GunStore {
  const y0 = heightAt(GUN_STORE.x, GUN_STORE.z);

  // Storefront: the building, the name plate, and the collision boxes (returned even without the prefab).
  const boxes = storefrontBoxes(y0);
  if (getPrefab('gta-ammu-gnation')) {
    const building = buildPrefab('gta-ammu-gnation');
    building.scale.setScalar(GUN_STORE.scale);
    building.rotation.y = GUN_STORE.yaw;
    building.position.set(GUN_STORE.x, y0, GUN_STORE.z);
    building.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    const plate = nameplate();
    if (plate) building.add(plate);
    deps.scene.add(building);
  }

  // The back room: a group far off the map, added once, hidden until the shop opens.
  const stageY = heightAt(STAGE.x, STAGE.z);
  const stageGroup = new THREE.Group();
  stageGroup.position.set(STAGE.x, stageY, STAGE.z);
  stageGroup.visible = false;
  deps.scene.add(stageGroup);
  let stage: Stage | null = null;
  let shop: GunShop | null = null;
  let time = 0;

  /** Build the back room's contents on first use. */
  function ensureStage(): Stage {
    if (stage) return stage;
    const group = stageGroup;

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 40),
      flatLayer(new THREE.MeshStandardMaterial({ color: 0x5a5a55, roughness: 1 }), LAYER.ground),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.02;
    group.add(floor);
    group.add(stageBackdrop());

    stageProp(group, 'ammu-stage-pegboard', 0, -5, 2.5, 0);
    stageProp(group, 'ammu-stage-counter', -3.2, -1.5, 2, 0.5);
    stageProp(group, 'ammu-stage-turntable', 0, 0, 2.5, 0);

    // A warm pool over the turntable, an orange kick from the back left.
    const warm = new THREE.PointLight(0xffe2b0, 80, 40, 1.6);
    warm.position.set(0, 6, 3);
    const kick = new THREE.PointLight(0xff7a1a, 40, 30, 1.6);
    kick.position.set(2.5, 2, -3);
    group.add(warm, kick);

    const display = new THREE.Group();
    display.position.set(0, DISPLAY_Y, 0);
    group.add(display);

    stage = { group, display, gun: null };
    return stage;
  }

  /** Show `gun` with `loadout` lying on the turntable, big, its centre on the display point. */
  function preview(gun: GunKind, loadout: GunLoadout): void {
    const st = ensureStage();
    if (st.gun) st.display.remove(st.gun);
    const gunObj = buildModdedGun(gun, loadout, { scale: 7 });
    gunObj.rotation.x = Math.PI / 2; // barrel toward +z, underside down
    st.display.rotation.y = Math.PI / 2; // barrel toward +x
    st.display.add(gunObj);
    // Centre it in display space: measure its box with the world matrices fresh, then shift by the box centre.
    st.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(gunObj);
    const centre = st.display.worldToLocal(box.getCenter(new THREE.Vector3()));
    gunObj.position.sub(centre);
    st.gun = gunObj;
  }

  /** The shop sheet, made on first open (it needs the page). */
  function ensureShop(): GunShop {
    if (shop) return shop;
    shop = createGunShop(deps.ui, deps.hud, {
      acorns: () => deps.economy.state().acorns,
      spend: (n, r) => deps.economy.spend(n, r),
      play: deps.play,
      preview,
      testFire: (g, l) => playGunShot(g, moddedGun(g, l).sound),
      onFit: deps.onFit,
      onClose: () => {
        if (stage) stage.group.visible = false;
        deps.showroom(null);
      },
    });
    return shop;
  }

  const isOpen = (): boolean => shop?.isOpen() ?? false;

  /** The counter's serve point in world coordinates (prefab-local (0, -0.1)). */
  const serve = localToWorld(0, -0.1);

  /** 'Shop mods at Ammu-Gnation' while the player stands on foot at the counter with the shop shut, else null. */
  function prompt(player: Player): string | null {
    if (player.vehicle || player.airborne || isOpen()) return null;
    if (Math.hypot(player.x - serve.x, player.z - serve.z) > SERVE_RANGE) return null;
    return 'Shop mods at Ammu-Gnation';
  }

  function open(): void {
    const st = ensureStage();
    st.group.visible = true;
    ensureShop().open(deps.currentGun());
    deps.showroom({
      x: STAGE.x,
      y: stageY + DISPLAY_Y - 0.55 * 1.2,
      z: STAGE.z,
      radius: 1.2,
      distance: 5.5,
    });
  }

  return {
    boxes,
    blip: { x: GUN_STORE.x, z: GUN_STORE.z, color: GUN_STORE_BLIP },
    prompt,
    interact(player: Player): void {
      if (prompt(player) === null) return;
      if (deps.heat() >= 1) {
        deps.hud.toast('Ammu-Gnation: "Not with the Hat Watch on your tail, pal. Come back clean."');
        deps.play('alarm');
        return;
      }
      open();
    },
    isOpen,
    close(): void {
      shop?.close();
    },
    update(dt: number): void {
      if (!stage || !isOpen()) return;
      time += dt;
      stage.display.position.y = DISPLAY_Y + 0.05 * Math.sin(time * 1.6);
    },
  };
}
