import * as THREE from 'three';
import { buildPrefab, buildPrefabInstances } from '@lawn/prefabs';
import { PORTALS, SHED_STATIONS } from './shared/catalog';
import { createGnomeJesusMesh } from './models';
import type { ZoneId } from './shared/types';

export interface ZoneSceneData {
  root: THREE.Group;
  skyGod?: THREE.Group;
  shrineJesus?: THREE.Group;
  leverArm?: THREE.Mesh;
  ambient: THREE.AmbientLight;
  dirLight?: THREE.DirectionalLight;
}

function makePortalRing(x: number, z: number, color: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 8, 24),
    new THREE.MeshBasicMaterial({ color }),
  );
  ring.position.y = 1.3;
  g.add(ring);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 20),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
  );
  glow.position.y = 1.3;
  g.add(glow);
  return g;
}

function makeRitualCircle(x: number, z: number, color: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0.03, z);

  const outer = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 2.8, 32),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
  );
  outer.rotation.x = -Math.PI / 2;
  g.add(outer);

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.55, 5),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
  );
  inner.rotation.x = -Math.PI / 2;
  g.add(inner);

  // 5 candles around the circle
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const candle = buildPrefab('candle', { scale: 2.2 });
    candle.position.set(Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7);
    g.add(candle);
  }
  return g;
}

export function buildAllZones(): Record<ZoneId, ZoneSceneData> {
  return {
    shed: buildShedZone(),
    yard: buildYardZone(),
    deku: buildDekuZone(),
    house: buildHouseZone(),
  };
}

function buildShedZone(): ZoneSceneData {
  const root = new THREE.Group();
  const ambient = new THREE.AmbientLight(0xffeedd, 0.75);
  root.add(ambient);

  const bulb = new THREE.PointLight(0xffdd88, 22, 16);
  bulb.position.set(0, 3.6, 0);
  root.add(bulb);

  // Wood plank floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 9.2),
    new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6b4c35, roughness: 0.85 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.2, 0.3), wallMat);
  backWall.position.set(0, 2.1, -4.5);
  root.add(backWall);

  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.2, 0.3), wallMat);
  frontWall.position.set(0, 2.1, 4.5);
  root.add(frontWall);

  for (const sx of [-4.5, 4.5]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 9.2), wallMat);
    side.position.set(sx, 2.1, 0);
    root.add(side);
  }

  // Corrugated tin roof
  const roof = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 9.4),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, side: THREE.DoubleSide }),
  );
  roof.rotation.x = Math.PI / 2;
  roof.position.y = 4.2;
  root.add(roof);

  // Stained-glass Gnome Window on back wall
  const windowPane = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 16),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.45 }),
  );
  windowPane.position.set(0, 2.9, -4.32);
  root.add(windowPane);

  // Gnome Jesus Shrine (flowerpot altar + glowing Gnome Jesus!)
  const altar = buildPrefab('altar');
  altar.position.set(SHED_STATIONS.shrine.x, 0, SHED_STATIONS.shrine.z);
  root.add(altar);

  const shrineJesus = createGnomeJesusMesh(false);
  shrineJesus.scale.setScalar(0.65);
  // The altar prefab's top is at y = 1.0 (stone slab, 0.1 thick, on a 0.9 block).
  shrineJesus.position.set(SHED_STATIONS.shrine.x, 1.0, SHED_STATIONS.shrine.z);
  root.add(shrineJesus);

  // Tithe Crate
  const titheCrate = buildPrefab('wooden-chest', { scale: 2.0 });
  titheCrate.position.set(SHED_STATIONS.tithe.x, 0, SHED_STATIONS.tithe.z);
  root.add(titheCrate);

  // Shop Counter
  const shopCounter = buildPrefab('counter', { scale: 1.4 });
  shopCounter.position.set(SHED_STATIONS.shop.x, 0, SHED_STATIONS.shop.z);
  root.add(shopCounter);

  // Sacred Departure Lever
  const lever = buildPrefab('departure-lever');
  lever.position.set(SHED_STATIONS.lever.x, 0, SHED_STATIONS.lever.z);
  root.add(lever);

  // Exit Door to Yard
  root.add(makePortalRing(PORTALS.shedToYard.x, PORTALS.shedToYard.z, 0x4ade80));

  return { root, shrineJesus, ambient };
}

function buildYardZone(): ZoneSceneData {
  const root = new THREE.Group();
  const ambient = new THREE.AmbientLight(0x64748b, 0.55);
  root.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 0.9);
  dirLight.position.set(18, 30, 14);
  root.add(dirLight);

  // Lawn grass
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({ color: 0x1e4620, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);

  // White Picket Fence perimeter: 32 sections per side, between the old post positions (-40 .. 40, step 2.5)
  const FENCE_SCALE = 2.5;
  const fenceUp = new THREE.Quaternion();
  const fenceScale = new THREE.Vector3(FENCE_SCALE, FENCE_SCALE, FENCE_SCALE);
  const fenceMatrices: THREE.Matrix4[] = [];
  for (let i = -40; i < 40; i += 2.5) {
    const mid = i + 1.25;
    for (const z of [-40.5, 40.5]) {
      // Sections along x: the prefab already runs along x, so no turn.
      fenceUp.setFromEuler(new THREE.Euler(0, 0, 0));
      fenceMatrices.push(new THREE.Matrix4().compose(new THREE.Vector3(mid, 0, z), fenceUp, fenceScale));
    }
    for (const x of [-40.5, 40.5]) {
      // Sections along z: turn a quarter turn about y.
      fenceUp.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
      fenceMatrices.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, mid), fenceUp, fenceScale));
    }
  }
  root.add(buildPrefabInstances('picket-fence', fenceMatrices));

  // Garden Shed Exterior at (0, 0, 29), door turned to face the yard
  const shed = buildPrefab('garden-shed', { scale: 4 });
  shed.rotation.y = Math.PI;
  shed.position.set(0, 0, 29);
  root.add(shed);

  root.add(makePortalRing(PORTALS.yardToShed.x, PORTALS.yardToShed.z, 0xfde047));

  // GREAT DEKU OAK at (-22, 0, -18)
  const dekuGroup = new THREE.Group();
  dekuGroup.position.set(-22, 0, -18);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 5.8, 13, 12),
    new THREE.MeshStandardMaterial({ color: 0x3f2a1d, roughness: 0.95 }),
  );
  trunk.position.y = 6.5;
  dekuGroup.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.DodecahedronGeometry(8.5, 1),
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 }),
  );
  canopy.position.y = 14.5;
  dekuGroup.add(canopy);

  // Glowing Deku Eyes above mouth!
  const dekuEyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (const ex of [-1.7, 1.7]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), dekuEyeMat);
    eye.position.set(ex, 6.2, 4.4);
    dekuGroup.add(eye);
  }
  // Yawning bark-mouth
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 3.4, 1.2),
    new THREE.MeshBasicMaterial({ color: 0x050505 }),
  );
  mouth.position.set(0, 1.7, 4.9);
  dekuGroup.add(mouth);
  root.add(dekuGroup);

  root.add(makePortalRing(PORTALS.yardToDeku.x, PORTALS.yardToDeku.z, 0x34d399));

  // CURSED SUBURBAN HOUSE at (22, 0, -20)
  const houseGroup = new THREE.Group();
  houseGroup.position.set(22, 0, -20);
  const houseBody = new THREE.Mesh(
    new THREE.BoxGeometry(11, 7.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 }),
  );
  houseBody.position.y = 3.75;
  houseGroup.add(houseBody);

  const houseRoof = new THREE.Mesh(
    new THREE.ConeGeometry(8.8, 4.2, 4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b }),
  );
  houseRoof.rotation.y = Math.PI / 4;
  houseRoof.position.y = 9.6;
  houseGroup.add(houseRoof);

  // Creepy lit windows
  const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  for (const wx of [-3.2, 3.2]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), winMat);
    w.position.set(wx, 4.6, 5.05);
    houseGroup.add(w);
  }
  const frontDoor = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 3.4, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d }),
  );
  frontDoor.position.set(0, 1.7, 5.05);
  houseGroup.add(frontDoor);
  root.add(houseGroup);

  root.add(makePortalRing(PORTALS.yardToHouse.x, PORTALS.yardToHouse.z, 0xf87171));

  // Scattered spooky yard props (crooked tombstones)
  for (const [tx, tz] of [
    [-8, 6],
    [10, 4],
    [-12, -2],
    [7, -10],
    [-4, -22],
  ]) {
    const stone = buildPrefab('gravestone', { scale: 2.8 });
    stone.position.set(tx, 0, tz);
    stone.rotation.z = (Math.random() - 0.5) * 0.25;
    root.add(stone);
  }

  // OMNIPRESENT GNOME JESUS IN THE SKY!
  const skyGod = createGnomeJesusMesh(true);
  skyGod.scale.setScalar(8.5);
  skyGod.position.set(0, 26, -34);
  root.add(skyGod);

  return { root, skyGod, ambient, dirLight };
}

function buildDekuZone(): ZoneSceneData {
  const root = new THREE.Group();
  const ambient = new THREE.AmbientLight(0x134e4a, 0.45);
  root.add(ambient);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 24),
    new THREE.MeshStandardMaterial({ color: 0x271c15, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);

  // Hollow bark dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x3b2314,
      roughness: 0.95,
      side: THREE.BackSide,
    }),
  );
  root.add(dome);

  // Bioluminescent mushrooms & root pillars
  const mushMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = 10 + (i % 2) * 3;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;

    const rootPillar = buildPrefab('deku-root-pillar', { scale: 3.1 });
    rootPillar.position.set(x, 0, z);
    root.add(rootPillar);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.45, 10), mushMat);
    cap.position.set(x * 0.85, 0.55, z * 0.85);
    root.add(cap);
  }

  // Forest Ritual Circle
  root.add(makeRitualCircle(0, -6, 0x34d399));

  // Exit portal back to Yard
  root.add(makePortalRing(PORTALS.dekuToYard.x, PORTALS.dekuToYard.z, 0x4ade80));

  return { root, ambient };
}

function buildHouseZone(): ZoneSceneData {
  const root = new THREE.Group();
  const ambient = new THREE.AmbientLight(0x312e81, 0.35);
  root.add(ambient);

  const flicker = new THREE.PointLight(0xff7744, 6, 18);
  flicker.position.set(0, 3.8, -4);
  root.add(flicker);

  // Checkered spooky floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(31, 31),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3f2e3e, roughness: 0.9 });
  for (const [wx, wz, bw, bd] of [
    [0, -15, 31, 0.4],
    [0, 15, 31, 0.4],
    [-15, 0, 0.4, 31],
    [15, 0, 0.4, 31],
  ]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(bw, 4.6, bd), wallMat);
    w.position.set(wx, 2.3, wz);
    root.add(w);
  }

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(31, 31),
    new THREE.MeshStandardMaterial({ color: 0x111827, side: THREE.DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4.6;
  root.add(ceiling);

  // Creepy suburban furniture
  const couch = buildPrefab('bench', { tint: 'red', scale: 2.4 });
  couch.position.set(-8, 0, -2);
  root.add(couch);

  const table = buildPrefab('table', { scale: 2.2 });
  table.position.set(8, 0, -3);
  root.add(table);

  // Salt-Chalk Pentagram Ritual Circle
  root.add(makeRitualCircle(0, -4, 0xef4444));

  // Exit front door back to Yard
  root.add(makePortalRing(PORTALS.houseToYard.x, PORTALS.houseToYard.z, 0xf87171));

  return { root, ambient };
}
