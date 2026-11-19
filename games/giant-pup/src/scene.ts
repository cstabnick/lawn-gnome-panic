// The yard (lights, lawn, fence, doghouse, bowls, scenery) and the player's gnome.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, DEFAULT_LOOK, toModelLook } from '@lawn/gnome';
import type { GnomeModel, PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { YARD_HALF, GNOME_POS, FOOD_BOWL_POS, WATER_BOWL_POS, DOGHOUSE_POS } from './config';

export interface Yard {
  scene: THREE.Scene;
  /** The lawn mesh (raycast target for tapping the ground). */
  ground: THREE.Mesh;
  /** Show or hide the kibble in the food bowl and the water in the water bowl. */
  setBowls(food: boolean, water: boolean): void;
  /** The player's gnome, standing at GNOME_POS. */
  gnome: GnomeModel;
  gnomeState: PlayerState;
  /** Per frame: idle sway of trees/flowers, gnome model update. */
  update(t: number, dt: number): void;
}

/** Small seeded RNG so the scenery is the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw and discard n numbers, so a prefab that replaced a hand-built piece leaves the rest of the seeded layout alone. */
function skipRand(rand: () => number, n: number): void {
  for (let k = 0; k < n; k++) rand();
}

function shadowed<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
}

export function createYard(): Yard {
  const rand = mulberry32(20240611);
  const H = YARD_HALF;
  const SPAN = 2 * H;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd3f0);
  scene.fog = new THREE.Fog(0x9fd3f0, 40, 90);

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a7d3a, 1.2));
  const sun = new THREE.DirectionalLight(0xfff4d6, 2.2);
  sun.position.set(12, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -22;
  sc.right = 22;
  sc.top = 22;
  sc.bottom = -22;
  sc.near = 1;
  sc.far = 60;
  sc.updateProjectionMatrix();
  scene.add(sun, sun.target);

  // Lawn with faint mown stripes running along z (bands vary across x).
  const stripeCanvas = document.createElement('canvas');
  stripeCanvas.width = 64;
  stripeCanvas.height = 64;
  const sctx = stripeCanvas.getContext('2d');
  if (sctx) {
    sctx.fillStyle = '#ffffff';
    sctx.fillRect(0, 0, 64, 64);
    sctx.fillStyle = '#e3f0d6';
    sctx.fillRect(0, 0, 32, 64);
  }
  const stripes = new THREE.CanvasTexture(stripeCanvas);
  stripes.wrapS = THREE.RepeatWrapping;
  stripes.wrapT = THREE.RepeatWrapping;
  stripes.repeat.set(20, 1);
  stripes.colorSpace = THREE.SRGBColorSpace;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x6cbf4f, roughness: 1, map: stripes }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Picket fence, all four sides: picket-fence prefab sections laid end to end, each sized to fit the yard edge.
  const fence = new THREE.Group();
  const sections = Math.round(SPAN / 2.5);
  const sectionLen = SPAN / sections;
  const addFenceSide = (alongX: boolean, fixed: number) => {
    for (let i = 0; i < sections; i++) {
      const section = buildPrefab('picket-fence', { scale: sectionLen });
      const t = -H + (i + 0.5) * sectionLen;
      section.position.set(alongX ? t : fixed, 0, alongX ? fixed : t);
      if (!alongX) section.rotation.y = Math.PI / 2;
      fence.add(section);
    }
  };
  addFenceSide(true, H);
  addFenceSide(true, -H);
  addFenceSide(false, H);
  addFenceSide(false, -H);
  scene.add(shadowed(fence));

  // Doghouse at DOGHOUSE_POS, door on the +z face. The doghouse prefab is built at ten times its catalogue size.
  const doghouse = buildPrefab('doghouse', { scale: 10 });
  doghouse.position.set(DOGHOUSE_POS.x, 0, DOGHOUSE_POS.z);
  scene.add(shadowed(doghouse));

  // Bowls: open cylinders with kibble (food) and water (water) inside.
  const bowlSideGeo = new THREE.CylinderGeometry(0.8, 0.72, 0.35, 20, 1, true);
  const bowlFloorGeo = new THREE.CircleGeometry(0.72, 20);
  bowlFloorGeo.rotateX(-Math.PI / 2);
  const kibbleGeo = new THREE.SphereGeometry(0.12, 8, 6);
  const kibbleMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
  const waterGeo = new THREE.CircleGeometry(0.72, 20);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa, transparent: true, opacity: 0.8, roughness: 0.2,
  });

  const makeKibble = (): THREE.Group => {
    const mound = new THREE.Group();
    mound.position.y = 0.05;
    for (let i = 0; i < 14; i++) {
      const r = rand() * 0.45;
      const a = rand() * Math.PI * 2;
      const k = new THREE.Mesh(kibbleGeo, kibbleMat);
      k.position.set(Math.cos(a) * r, 0.1 * (1 - r / 0.45) + rand() * 0.06, Math.sin(a) * r);
      k.scale.setScalar(0.8 + rand() * 0.4);
      mound.add(k);
    }
    return mound;
  };

  const bowlsGroup = new THREE.Group();
  const foodKibble = makeKibble();
  const waterDisc = new THREE.Mesh(waterGeo, waterMat);
  waterDisc.position.y = 0.28;
  const addBowl = (pos: { x: number; z: number }, color: number): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(pos.x, 0, pos.z);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, side: THREE.DoubleSide });
    const side = new THREE.Mesh(bowlSideGeo, mat);
    side.position.y = 0.175;
    g.add(side);
    const floor = new THREE.Mesh(bowlFloorGeo, mat);
    floor.position.y = 0.02;
    g.add(floor);
    bowlsGroup.add(g);
    return g;
  };
  const foodBowl = addBowl(FOOD_BOWL_POS, 0xdc2626);
  foodBowl.add(foodKibble);
  const waterBowl = addBowl(WATER_BOWL_POS, 0x2563eb);
  waterBowl.add(waterDisc);
  scene.add(shadowed(bowlsGroup));

  // Scenery outside the fence: trees and bushes. Sample until clear of the yard.
  const outside = (): { x: number; z: number } => {
    for (;;) {
      const x = (rand() * 2 - 1) * 36;
      const z = (rand() * 2 - 1) * 36;
      if (Math.max(Math.abs(x), Math.abs(z)) > H + 3) return { x, z };
    }
  };

  const swayers: { obj: THREE.Object3D; phase: number }[] = [];
  const canopyColours = [0x3f8f3a, 0x4ca54a, 0x357d33];
  for (let i = 0; i < 9; i++) {
    const p = outside();
    const treeScale = 0.8 + rand() * 0.5;
    skipRand(rand, 12); // the old hand-built canopy drew these; keep drawing them so the rest of the layout holds
    // broadleaf-tree is a tenth of its course size: 5.8x puts its trunk and canopy where the old tree had them.
    const tree = buildPrefab('broadleaf-tree', { scale: 5.8 * treeScale, tint: canopyColours[i % canopyColours.length] });
    tree.position.set(p.x, 0, p.z);
    scene.add(shadowed(tree));
    swayers.push({ obj: tree, phase: rand() * Math.PI * 2 });
  }

  for (let i = 0; i < 12; i++) {
    const p = outside();
    skipRand(rand, 9); // the old hand-built clump drew these; keep drawing them so the rest of the layout holds
    // round-bush is three leafy balls; at scale 1.4 it is the old clump's size.
    const bush = buildPrefab('round-bush', { scale: 1.4 });
    bush.position.set(p.x, 0, p.z);
    scene.add(shadowed(bush));
  }

  // Flower clumps along the inside of the fence (within 1.5 of it, never near the middle).
  const petalColours = [0xf472b6, 0xfacc15, 0xffffff, 0xa78bfa, 0xfb923c];
  for (let i = 0; i < 70; i++) {
    const side = Math.floor(rand() * 4);
    const t = (rand() * 2 - 1) * (H - 0.5);
    const d = 0.7 + rand() * 0.8;
    const sign = side % 2 === 0 ? 1 : -1;
    const x = side < 2 ? t : sign * (H - d);
    const z = side < 2 ? sign * (H - d) : t;
    // giant-flower at half size is the old stem and head; its tint is the petal colour.
    const flower = buildPrefab('giant-flower', {
      scale: 0.5,
      tint: petalColours[Math.floor(rand() * petalColours.length)],
    });
    flower.position.set(x, 0, z);
    scene.add(flower);
    swayers.push({ obj: flower, phase: rand() * Math.PI * 2 });
  }

  // The player's gnome, at GNOME_POS.
  const look = getMyGnome()?.look ?? toModelLook(DEFAULT_LOOK);
  const gnome = createGnomeModel(look);
  scene.add(shadowed(gnome.object));
  const gnomeState: PlayerState = {
    position: new THREE.Vector3(GNOME_POS.x, 0, GNOME_POS.z),
    velocity: new THREE.Vector3(),
    facing: Math.PI,
    grounded: true,
    jumpsUsed: 0,
  };

  return {
    scene,
    ground,
    setBowls(food: boolean, water: boolean) {
      foodKibble.visible = food;
      waterDisc.visible = water;
    },
    gnome,
    gnomeState,
    update(t: number, dt: number) {
      gnome.update(gnomeState, dt);
      for (const s of swayers) s.obj.rotation.z = Math.sin(t + s.phase) * 0.03;
    },
  };
}
