// 3D modular vehicles (5 vehicles, visible engines/exhausts/bumpers/spinning wheels), exhaust particles, horn/lights & mobile pedals.
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
  getPositions(): { x: number; z: number; label: string }[];
  update(dt: number, inp: InputState): void;
}

interface VehicleMeshRef {
  root: THREE.Group;
  wheels: THREE.Object3D[];
  headlight?: THREE.SpotLight | THREE.PointLight;
  wobblePhase: number;
}

interface ExhaustPuff {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
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
  const meshes = new Map<string, VehicleMeshRef>();
  const puffs: ExhaustPuff[] = [];
  let activeId: string | null = null;
  let speed = 0;
  let noiseTimer = 0;
  let puffTimer = 0;
  let lightsOn = true;
  const tmp = { x: 0, y: 0, z: 0 };

  // Mobile / touch driving HUD (only visible while driving)
  const driveHud = document.createElement('div');
  driveHud.id = 'dayg-drive-hud';
  driveHud.style.cssText = 'position:fixed;bottom:calc(16px + env(safe-area-inset-bottom));left:16px;right:16px;z-index:45;' +
    'display:none;justify-content:space-between;align-items:flex-end;pointer-events:none';
  let touchThrottle = 0;
  const mkPadBtn = (label: string, bg: string, onDown: () => void, onUp?: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = `min-width:60px;min-height:52px;padding:8px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.4);` +
      `background:${bg};color:#fff;font:700 13px var(--dg-font);pointer-events:auto;touch-action:manipulation;cursor:pointer`;
    b.addEventListener('pointerdown', (e) => { e.stopPropagation(); onDown(); });
    if (onUp) {
      b.addEventListener('pointerup', (e) => { e.stopPropagation(); onUp(); });
      b.addEventListener('pointercancel', () => onUp());
    }
    return b;
  };
  const leftPads = document.createElement('div');
  leftPads.style.cssText = 'display:flex;gap:8px';
  leftPads.append(
    mkPadBtn('HORN', 'rgba(60,55,28,0.85)', () => triggerHorn()),
    mkPadBtn('LIGHTS', 'rgba(40,48,38,0.85)', () => toggleLights()),
    mkPadBtn('EXIT', 'rgba(130,48,40,0.85)', () => exitVehicle()),
  );
  const rightPads = document.createElement('div');
  rightPads.style.cssText = 'display:flex;gap:8px';
  rightPads.append(
    mkPadBtn('BRAKE', 'rgba(110,45,38,0.85)', () => { touchThrottle = -1; }, () => { touchThrottle = 0; }),
    mkPadBtn('GAS', 'rgba(65,105,52,0.9)', () => { touchThrottle = 1; }, () => { touchThrottle = 0; }),
  );
  const telemetryPill = document.createElement('div');
  telemetryPill.style.cssText = 'padding:8px 14px;border-radius:10px;background:rgba(14,18,13,0.86);border:1px solid var(--dg-border);' +
    'color:var(--dg-text);font:600 12px var(--dg-font);text-align:center;pointer-events:none;white-space:nowrap';
  driveHud.append(leftPads, telemetryPill, rightPads);
  if (typeof document !== 'undefined') document.getElementById('ui')?.appendChild(driveHud);

  function triggerHorn(): void {
    if (!activeId) return;
    const v = store.vehicles.find((x) => x.id === activeId);
    if (!v) return;
    bus.emit('noise', { x: v.x, z: v.z, radius: 36, source: 'attack' });
    onToast('📯 HONK! (Drew nearby Hatless)');
  }

  function toggleLights(): void {
    lightsOn = !lightsOn;
    if (activeId) {
      const ref = meshes.get(activeId);
      if (ref?.headlight) ref.headlight.intensity = lightsOn ? 2.2 : 0;
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (!activeId) return;
      if (e.code === 'KeyH' && !e.repeat) triggerHorn();
      if (e.code === 'KeyL' && !e.repeat) toggleLights();
    });
  }

  function buildVehicleMesh(v: VehicleInstance): VehicleMeshRef {
    const g = new THREE.Group();
    const def = VEHICLE_DEFS[v.kind];
    const stats = evaluateVehicle(v);
    const bodyMat = new THREE.MeshStandardMaterial({ color: def.baseColor, roughness: 0.72 });
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
    } else if (v.kind === 'hearse-buggy') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.65, 2.2), bodyMat);
      body.position.set(0, 0.62, 0);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.55, 1.45), darkMat);
      roof.position.set(0, 1.22, -0.28);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.08, 1.48), new THREE.MeshStandardMaterial({ color: 0x8b6b3a }));
      trim.position.set(0, 1.52, -0.28);
      g.add(body, roof, trim);
    } else {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.65, 1.4), bodyMat);
      hood.position.set(0, 0.68, 0.45);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 1.0), darkMat);
      cab.position.set(0, 0.85, -0.55);
      g.add(hood, cab);
    }

    // Visible mounted Engine
    const eng = getPart(v.parts.engine);
    if (eng) {
      const engMat = new THREE.MeshStandardMaterial({
        color: eng.color,
        emissive: stats.synergies.some((s) => s.includes('Rocket') || s.includes('Dragster')) ? 0xaa3800 : 0x000000,
        roughness: 0.5,
        metalness: 0.4,
      });
      const sc = eng.size === 'large' ? 1.35 : eng.size === 'medium' ? 1.0 : 0.72;
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.48 * sc, 0.44 * sc, 0.56 * sc), engMat);
      block.position.set(0, v.kind === 'scrap-bike' ? 0.82 : 0.95, v.kind === 'utility-tractor' || v.kind === 'hearse-buggy' ? 0.58 : 0.28);
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

    // Visible Exhaust
    const exh = getPart(v.parts.exhaust);
    if (exh) {
      const eMat = new THREE.MeshStandardMaterial({ color: exh.color, metalness: 0.6, roughness: 0.35 });
      if (exh.id === 'exh-twin-stacks' || exh.id === 'exh-flamethrower') {
        for (const sx of [-0.36, 0.36]) {
          const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.95, 8), eMat);
          stack.position.set(sx, 1.05, -0.7);
          stack.rotation.x = -0.2;
          g.add(stack);
        }
      } else {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.65, 8), eMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(0.28, 0.42, -0.92);
        g.add(pipe);
      }
    }

    // Visible Bumper
    const bmp = getPart(v.parts.bumper);
    if (bmp) {
      const bMat = new THREE.MeshStandardMaterial({ color: bmp.color, roughness: 0.65, metalness: 0.35 });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.28, 0.25), bMat);
      bar.position.set(0, 0.42, 1.12);
      g.add(bar);
      if (bmp.id === 'bmp-spiked-plow') {
        for (let i = -2; i <= 2; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 6), chromeMat);
          spike.rotation.x = Math.PI / 2;
          spike.position.set(i * 0.26, 0.42, 1.34);
          g.add(spike);
        }
      }
    }

    // Headlight
    const headlight = new THREE.PointLight(0xffe6a3, lightsOn ? 1.8 : 0, 14, 1.8);
    headlight.position.set(0, 0.8, 1.25);
    g.add(headlight);

    // Visible Spinning Wheels
    const wheelMeshes: THREE.Object3D[] = [];
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
          : [[-0.65, r, 0.62], [0.65, r, 0.62], [-0.65, r, -0.62], [0.65, r, -0.62]];
      for (const [wx, wy, wz] of coords) {
        const wm = new THREE.Mesh(wGeo, wMat);
        wm.position.set(wx, wy, wz);
        wm.castShadow = true;
        g.add(wm);
        wheelMeshes.push(wm);
      }
    }

    return { root: g, wheels: wheelMeshes, headlight, wobblePhase: 0 };
  }

  function rebuild(id: string): void {
    const v = store.vehicles.find((x) => x.id === id);
    if (!v) return;
    const old = meshes.get(id);
    if (old) scene.remove(old.root);
    const next = buildVehicleMesh(v);
    v.y = collider.groundAt(v.x, v.z, v.y + 2);
    next.root.position.set(v.x, v.y, v.z);
    next.root.rotation.y = v.yaw;
    scene.add(next.root);
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
    ['crate-plow', 305, 310, 'bmp-spiked-plow'],
    ['crate-flame', 360, 270, 'exh-flamethrower'],
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
    driveHud.style.display = 'flex';
    onToast(`Driving ${VEHICLE_DEFS[v.kind].name} (WASD · H horn · L lights · Space exit)`);
    return true;
  }

  function exitVehicle(): void {
    if (!activeId) return;
    const v = store.vehicles.find((x) => x.id === activeId);
    activeId = null;
    speed = 0;
    touchThrottle = 0;
    driveHud.style.display = 'none';
    if (v) {
      const p = getPlayer();
      p.pos.set(v.x + Math.cos(v.yaw) * 1.4, collider.groundAt(v.x + Math.cos(v.yaw) * 1.4, v.z - Math.sin(v.yaw) * 1.4, v.y + 2), v.z - Math.sin(v.yaw) * 1.4);
      saveVehicleStore(store);
    }
  }

  function spawnExhaustPuff(v: VehicleInstance, flame: boolean): void {
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const mat = new THREE.MeshBasicMaterial({ color: flame ? 0xff7b29 : 0x9aa0a6, transparent: true, opacity: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(v.x - Math.sin(v.yaw) * 0.9, v.y + 0.7, v.z - Math.cos(v.yaw) * 0.9);
    scene.add(mesh);
    puffs.push({ mesh, vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6), life: 0.45 });
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
    getPositions() {
      return store.vehicles.map((v) => ({ x: v.x, z: v.z, label: VEHICLE_DEFS[v.kind].name }));
    },
    update(dt: number, inp: InputState) {
      for (let i = puffs.length - 1; i >= 0; i--) {
        const pf = puffs[i];
        pf.life -= dt;
        pf.mesh.position.addScaledVector(pf.vel, dt);
        (pf.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, pf.life / 0.45) * 0.7;
        if (pf.life <= 0) {
          scene.remove(pf.mesh);
          pf.mesh.geometry.dispose();
          (pf.mesh.material as THREE.Material).dispose();
          puffs.splice(i, 1);
        }
      }

      if (!activeId) return;
      const v = store.vehicles.find((x) => x.id === activeId);
      if (!v) { activeId = null; driveHud.style.display = 'none'; return; }
      if (inp.climb) { exitVehicle(); return; }

      const st = evaluateVehicle(v);
      const isPedal = v.parts.engine === 'eng-pedal-crank';
      const curFuel = v.fuel ?? 100;
      const outOfFuel = !isPedal && curFuel <= 0;
      const accelInput = touchThrottle !== 0 ? touchThrottle : inp.moveZ;
      if (Math.abs(accelInput) > 0.05 && !outOfFuel) {
        speed += accelInput * st.accel * dt;
        if (!isPedal) v.fuel = Math.max(0, curFuel - dt * 0.65);
      } else {
        speed *= Math.max(0, 1 - 3.5 * dt);
      }
      const cap = outOfFuel ? 1.5 : st.topSpeed;
      speed = Math.max(-cap * 0.45, Math.min(cap, speed));

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
        m.root.position.set(v.x, v.y, v.z);
        m.root.rotation.y = v.yaw;
        m.wobblePhase += dt * (4 + Math.abs(speed));
        m.root.rotation.z = st.wobble > 0 && Math.abs(speed) > 0.5 ? Math.sin(m.wobblePhase) * st.wobble * 0.22 : 0;
        for (const w of m.wheels) w.rotation.x += speed * dt * 2.4;
      }

      const synTag = st.synergies.length > 0 ? ` · ${st.synergies[0].split('(')[0].trim()}` : '';
      telemetryPill.textContent = `${Math.abs(speed).toFixed(1)} gm/s · Fuel ${isPedal ? '∞' : `${Math.round(v.fuel ?? 100)}%`} · HP ${Math.round(v.hp ?? 100)}${synTag}`;

      const p = getPlayer();
      p.pos.set(v.x, v.y + 0.55, v.z);
      p.facing = v.yaw;
      p.speed = Math.abs(speed);
      p.region = collider.regionAt(v.x, v.z);

      noiseTimer += dt;
      if (Math.abs(speed) > 0.5 && noiseTimer >= 0.4) {
        noiseTimer = 0;
        bus.emit('noise', { x: v.x, z: v.z, radius: st.noise, source: 'step' });
      }
      puffTimer += dt;
      if (Math.abs(speed) > 1.2 && puffTimer >= 0.14) {
        puffTimer = 0;
        const flame = v.parts.exhaust === 'exh-flamethrower' || st.synergies.some((s) => s.includes('Rocket') || s.includes('Moonshine'));
        spawnExhaustPuff(v, flame);
      }
      if (Math.abs(speed) >= 4) {
        const hits = hatless.strike({ x: v.x, y: v.y, z: v.z }, v.yaw, 2.2, st.ramDamage);
        if (hits > 0) {
          const wear = v.parts.bumper === 'bmp-spiked-plow' || v.parts.bumper === 'bmp-cowcatcher' ? 0.4 : 1.5;
          v.hp = Math.max(10, (v.hp ?? 100) - wear);
        }
      }
    },
  };
}
