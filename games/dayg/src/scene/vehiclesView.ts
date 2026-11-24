// 3D modular vehicles with visible mounted engines/wheels/belts, scavengeable part crates, and driving physics.
import * as THREE from 'three';
import { PLAYER_HEIGHT, PLAYER_RADIUS, STEP_UP } from '../config';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { HatlessSystem, InputState, PlayerState } from '../game/types';
import type { Collider } from '../world/collide';
import {
  PART_CATALOG,
  VEHICLE_DEFS,
  evaluateVehicle,
  getPart,
  loadVehicleStore,
  saveVehicleStore,
  type VehicleInstance,
  type VehicleStore,
} from '../vehicles/model';

export interface VehicleSystem {
  store: VehicleStore;
  isDriving(): boolean;
  enterVehicle(id: string): boolean;
  exitVehicle(): void;
  rebuild(id: string): void;
  giveAllParts(): void;
  update(dt: number, inp: InputState): void;
}

export function createVehicleSystem(deps: {
  scene: THREE.Scene;
  collider: Collider;
  interact: Interact;
  bus: Bus;
  hatless: HatlessSystem;
  getPlayer: () => PlayerState;
  onInspect: (v: VehicleInstance) => void;
  onToast: (t: string) => void;
}): VehicleSystem {
  const { scene, collider, interact, bus, hatless, getPlayer, onInspect, onToast } = deps;
  const store = loadVehicleStore();
  const meshes = new Map<string, THREE.Group>();
  let activeId: string | null = null;
  let speed = 0;
  let noiseTimer = 0;
  const tmp = { x: 0, y: 0, z: 0 };

  function buildVehicleMesh(v: VehicleInstance): THREE.Group {
    const g = new THREE.Group();
    const def = VEHICLE_DEFS[v.kind];
    const stats = evaluateVehicle(v);
    const bodyMat = new THREE.MeshStandardMaterial({ color: def.baseColor, roughness: 0.75 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 0.7, roughness: 0.3 });

    // Chassis per vehicle kind
    if (v.kind === 'scrap-bike') {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 1.4), bodyMat);
      frame.position.y = 0.52;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 6), chromeMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 0.95, 0.52);
      g.add(frame, bar);
    } else if (v.kind === 'mower-kart') {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 1.5), bodyMat);
      deck.position.y = 0.36;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.5), darkMat);
      seat.position.set(0, 0.65, -0.35);
      g.add(deck, seat);
    } else if (v.kind === 'barrow-trike') {
      const tub = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.2), bodyMat);
      tub.position.set(0, 0.55, 0.35);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), darkMat);
      seat.position.set(0, 0.6, -0.5);
      g.add(tub, seat);
    } else {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.65, 1.4), bodyMat);
      hood.position.set(0, 0.68, 0.45);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 1.0), darkMat);
      cab.position.set(0, 0.85, -0.55);
      g.add(hood, cab);
    }

    // Visible mounted Engine (scales & sticks out visibly for goofy Franken-Builds!)
    const eng = getPart(v.parts.engine);
    if (eng) {
      const engMat = new THREE.MeshStandardMaterial({
        color: eng.color,
        emissive: stats.synergies.some((s) => s.includes('Rocket')) ? 0xaa3800 : 0x000000,
        roughness: 0.5,
        metalness: 0.4,
      });
      const sc = eng.size === 'large' ? 1.35 : eng.size === 'medium' ? 1.0 : 0.72;
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.48 * sc, 0.44 * sc, 0.56 * sc), engMat);
      block.position.set(0, v.kind === 'scrap-bike' ? 0.82 : 0.92, v.kind === 'utility-tractor' ? 0.55 : 0.28);
      g.add(block);
      if (eng.size === 'large' || eng.size === 'medium') {
        for (const sx of [-0.18 * sc, 0.18 * sc]) {
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.55 * sc, 6), chromeMat);
          pipe.position.set(sx, block.position.y + 0.32 * sc, block.position.z - 0.1);
          pipe.rotation.x = -0.25;
          g.add(pipe);
        }
      }
    }

    // Visible Belt strip
    const belt = getPart(v.parts.belt);
    if (belt) {
      const beltMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.14, 0.85),
        new THREE.MeshStandardMaterial({ color: belt.color, roughness: 0.85 }),
      );
      beltMesh.position.set(0.32, 0.55, 0);
      g.add(beltMesh);
    }

    // Visible Wheels (sized by Wheel part!)
    const whl = getPart(v.parts.wheels);
    if (whl) {
      const r = whl.id === 'whl-monster' ? 0.52 : whl.id === 'whl-bike' ? 0.38 : whl.id === 'whl-barrow' ? 0.32 : 0.28;
      const w = whl.id === 'whl-monster' ? 0.36 : whl.id === 'whl-bike' ? 0.09 : 0.18;
      const wGeo = new THREE.CylinderGeometry(r, r, w, 14);
      wGeo.rotateZ(Math.PI / 2);
      const wMat = new THREE.MeshStandardMaterial({ color: whl.color, roughness: 0.9 });
      const coords: [number, number, number][] = v.kind === 'scrap-bike'
        ? [[0, r, 0.62], [0, r, -0.62]]
        : v.kind === 'barrow-trike'
          ? [[0, r, 0.72], [-0.55, r, -0.52], [0.55, r, -0.52]]
          : [[-0.65, r, 0.55], [0.65, r, 0.55], [-0.65, r, -0.55], [0.65, r, -0.55]];
      for (const [wx, wy, wz] of coords) {
        const wm = new THREE.Mesh(wGeo, wMat);
        wm.position.set(wx, wy, wz);
        wm.castShadow = true;
        g.add(wm);
      }
    }

    return g;
  }

  function rebuild(id: string): void {
    const v = store.vehicles.find((x) => x.id === id);
    if (!v) return;
    const old = meshes.get(id);
    if (old) scene.remove(old);
    const next = buildVehicleMesh(v);
    v.y = collider.groundAt(v.x, v.z, v.y + 2);
    next.position.set(v.x, v.y, v.z);
    next.rotation.y = v.yaw;
    scene.add(next);
    meshes.set(id, next);
  }

  for (const v of store.vehicles) {
    rebuild(v.id);
    interact.add({
      id: `vehicle:${v.id}`,
      x: v.x, y: v.y, z: v.z,
      radius: 2.6,
      label: () => (activeId ? null : `Inspect / Drive ${VEHICLE_DEFS[v.kind].name}`),
      act: () => onInspect(v),
    });
  }

  // Scavengeable Vehicle Part Crates in the world
  const partCrates: [string, number, number, string][] = [
    ['crate-v8', 325, 430, 'eng-v8-tractor'],
    ['crate-monster', 295, 420, 'whl-monster'],
    ['crate-nitro', 350, 405, 'oil-nitro'],
    ['crate-v6', 250, 350, 'eng-v6-blower'],
  ];
  for (const [id, x, z, partId] of partCrates) {
    if (!collider.inBounds(x, z)) continue;
    const y = collider.groundAt(x, z, 6);
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.6, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x7a5c38, roughness: 0.85 }),
    );
    crate.position.set(x, y + 0.3, z);
    scene.add(crate);
    let looted = false;
    const part = getPart(partId);
    interact.add({
      id: `vpart:${id}`,
      x, y, z,
      radius: 2.0,
      label: () => (looted ? null : `Salvage Vehicle Part (${part?.name ?? partId})`),
      act: () => {
        if (looted) return;
        looted = true;
        scene.remove(crate);
        store.stash.push(partId);
        saveVehicleStore(store);
        onToast(`🔧 Salvaged ${part?.name ?? partId}!`);
      },
    });
  }

  function enterVehicle(id: string): boolean {
    const v = store.vehicles.find((x) => x.id === id);
    if (!v) return false;
    const st = evaluateVehicle(v);
    if (!st.runnable) {
      onToast(`Missing parts: ${st.missing.join(', ')}`);
      return false;
    }
    activeId = id;
    speed = 0;
    onToast(`Driving ${VEHICLE_DEFS[v.kind].name} (WASD drive · Space exit)`);
    return true;
  }

  function exitVehicle(): void {
    if (!activeId) return;
    const v = store.vehicles.find((x) => x.id === activeId);
    activeId = null;
    speed = 0;
    if (v) {
      const p = getPlayer();
      p.pos.set(v.x + Math.cos(v.yaw) * 1.4, collider.groundAt(v.x + Math.cos(v.yaw) * 1.4, v.z - Math.sin(v.yaw) * 1.4, v.y + 2), v.z - Math.sin(v.yaw) * 1.4);
      saveVehicleStore(store);
    }
  }

  return {
    store,
    isDriving: () => activeId !== null,
    enterVehicle,
    exitVehicle,
    rebuild,
    giveAllParts() {
      for (const p of PART_CATALOG) store.stash.push(p.id);
      saveVehicleStore(store);
      onToast('Added 1 of every vehicle part to your garage stash!');
    },
    update(dt: number, inp: InputState) {
      if (!activeId) return;
      const v = store.vehicles.find((x) => x.id === activeId);
      if (!v) { activeId = null; return; }
      if (inp.climb) { exitVehicle(); return; }

      const st = evaluateVehicle(v);
      const accelInput = inp.moveZ;
      if (Math.abs(accelInput) > 0.05) {
        speed += accelInput * st.accel * dt;
      } else {
        speed *= Math.max(0, 1 - 3.5 * dt);
      }
      speed = Math.max(-st.topSpeed * 0.45, Math.min(st.topSpeed, speed));

      if (Math.abs(speed) > 0.25) {
        const steer = -inp.moveX * st.handling * dt * (speed >= 0 ? 1 : -1);
        v.yaw += steer;
      }

      const dx = Math.sin(v.yaw) * speed * dt;
      const dz = Math.cos(v.yaw) * speed * dt;
      collider.move({ x: v.x, y: v.y, z: v.z }, dx, dz, PLAYER_RADIUS * 1.3, PLAYER_HEIGHT, STEP_UP, tmp);
      v.x = tmp.x;
      v.z = tmp.z;
      v.y = collider.groundAt(v.x, v.z, v.y + 1.5);

      const m = meshes.get(v.id);
      if (m) {
        m.position.set(v.x, v.y, v.z);
        m.rotation.y = v.yaw;
      }

      const p = getPlayer();
      p.pos.set(v.x, v.y + 0.55, v.z);
      p.facing = v.yaw;
      p.speed = Math.abs(speed);
      p.region = collider.regionAt(v.x, v.z);

      // Engine noise & ramming Hatless
      noiseTimer += dt;
      if (Math.abs(speed) > 0.5 && noiseTimer >= 0.4) {
        noiseTimer = 0;
        bus.emit('noise', { x: v.x, z: v.z, radius: st.noise, source: 'step' });
      }
      if (Math.abs(speed) >= 4) {
        hatless.strike({ x: v.x, y: v.y, z: v.z }, v.yaw, 2.2, st.ramDamage);
      }
    },
  };
}
