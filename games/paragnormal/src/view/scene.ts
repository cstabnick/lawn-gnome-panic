import * as THREE from 'three';
import { buildPrefab, buildStaticPrefabs } from '@lawn/prefabs';
import type { Interactable, RoomDef, SimState } from '../sim/types';
import { createMonsterMesh, updateMonsterMesh, type MonsterMesh } from './monsters';
import { createLightBudget, OFF_ROOM_PENALTY, POINT_LIGHT_BUDGET } from './lightBudget';

export interface SceneView {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sync(state: SimState): void;
  resize(): void;
  dispose(): void;
}

interface InteractableVisual {
  item: Interactable;
  group: THREE.Group;
  light?: THREE.PointLight;
}

function buildRoomGeometry(
  scene: THREE.Scene,
  room: RoomDef,
  doorways: SimState['doorways'],
): void {
  const w = room.xMax - room.xMin;
  const d = room.zMax - room.zMin;
  const cx = (room.xMin + room.xMax) / 2;
  const cz = (room.zMin + room.zMax) / 2;
  const h = room.wallH;

  // Floor with giant floorboard planks
  const floorMat = new THREE.MeshLambertMaterial({ color: room.floorTint, flatShading: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  floor.receiveShadow = true;
  scene.add(floor);

  const plankMat = new THREE.MeshLambertMaterial({ color: 0x120d0a, flatShading: true });
  const plankCount = Math.floor(w / 1.1);
  for (let i = 1; i < plankCount; i++) {
    const px = room.xMin + (i * w) / plankCount;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, d), plankMat);
    seam.position.set(px, 0.005, cz);
    scene.add(seam);
  }

  // Ceiling
  const ceilMat = new THREE.MeshLambertMaterial({ color: 0x0c0d12, flatShading: true });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, h, cz);
  scene.add(ceil);

  // Side walls (West / East)
  const wallMat = new THREE.MeshLambertMaterial({ color: room.wallTint, flatShading: true });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x14100d, flatShading: true });

  const west = new THREE.Mesh(new THREE.BoxGeometry(0.24, h, d), wallMat);
  west.position.set(room.xMin - 0.12, h / 2, cz);
  west.receiveShadow = true;
  scene.add(west);

  const east = new THREE.Mesh(new THREE.BoxGeometry(0.24, h, d), wallMat);
  east.position.set(room.xMax + 0.12, h / 2, cz);
  east.receiveShadow = true;
  scene.add(east);

  // Giant baseboards along west & east walls (makes the player feel tiny)
  const baseW = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, d), trimMat);
  baseW.position.set(room.xMin + 0.04, 0.275, cz);
  const baseE = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, d), trimMat);
  baseE.position.set(room.xMax - 0.04, 0.275, cz);
  scene.add(baseW, baseE);

  // Helper to build North or South wall with optional doorway cutout
  const buildZWall = (zPos: number) => {
    const door = doorways.find((dw) => Math.abs(dw.z - zPos) < 0.1 && dw.roomB === room.id);
    // Only build the shared wall once (when room is roomB), plus outer north/south walls
    const isOuterNorth = room.id === 0 && Math.abs(zPos - room.zMin) < 0.1;
    const isOuterSouth = Math.abs(zPos - room.zMax) < 0.1 && !doorways.some((dw) => dw.roomA === room.id);
    if (!door && !isOuterNorth && !isOuterSouth) return;

    if (!door) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, h, 0.24), wallMat);
      wall.position.set(cx, h / 2, zPos);
      wall.receiveShadow = true;
      scene.add(wall);
      return;
    }

    const prev = room; // doorway spans overlap; build segments across full width of roomB
    const dLeft = door.x - door.width / 2;
    const dRight = door.x + door.width / 2;
    const doorH = 3.85;

    if (dLeft > prev.xMin + 0.05) {
      const lw = dLeft - prev.xMin;
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(lw, h, 0.28), wallMat);
      leftWall.position.set(prev.xMin + lw / 2, h / 2, zPos);
      leftWall.receiveShadow = true;
      scene.add(leftWall);
    }
    if (prev.xMax > dRight + 0.05) {
      const rw = prev.xMax - dRight;
      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(rw, h, 0.28), wallMat);
      rightWall.position.set(dRight + rw / 2, h / 2, zPos);
      rightWall.receiveShadow = true;
      scene.add(rightWall);
    }
    // Lintel above doorway
    const lintelH = h - doorH;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(door.width + 0.2, lintelH, 0.28), wallMat);
    lintel.position.set(door.x, doorH + lintelH / 2, zPos);
    scene.add(lintel);

    // Giant timber doorframe posts
    const postGeo = new THREE.BoxGeometry(0.22, doorH, 0.36);
    const leftPost = new THREE.Mesh(postGeo, trimMat);
    leftPost.position.set(dLeft, doorH / 2, zPos);
    const rightPost = new THREE.Mesh(postGeo, trimMat);
    rightPost.position.set(dRight, doorH / 2, zPos);
    scene.add(leftPost, rightPost);
  };

  buildZWall(room.zMin);
  buildZWall(room.zMax);
}

/** The room whose x/z box holds the point, if any. */
function roomAt(rooms: readonly RoomDef[], x: number, z: number): RoomDef | undefined {
  return rooms.find((r) => x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax);
}

function createInteractableVisual(item: Interactable): InteractableVisual {
  const group = new THREE.Group();
  group.position.set(item.x, item.y, item.z);
  let light: THREE.PointLight | undefined;

  switch (item.kind) {
    case 'glaze_shard': {
      const shard = buildPrefab('tall-eye-shard', { scale: 2.6, lights: false });
      shard.position.y = -0.06;
      group.add(shard);
      light = new THREE.PointLight(0x5ef2ff, 0.9, 4.2, 2);
      group.add(light);
      break;
    }
    case 'kiln_ward': {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 3.6, 0.16),
        new THREE.MeshBasicMaterial({ color: 0x45d4ff, transparent: true, opacity: 0.32 }),
      );
      frame.position.y = 1.0;
      group.add(frame);
      const rune = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.07, 6, 14),
        new THREE.MeshBasicMaterial({ color: 0x9bf4ff }),
      );
      rune.position.y = 0.55;
      group.add(rune);
      light = new THREE.PointLight(0x45d4ff, 1.4, 6.5, 2);
      light.position.y = 0.6;
      group.add(light);
      break;
    }
    case 'heavy_acorn': {
      const acorn = buildPrefab('acorn', { scale: 2.8, lights: false });
      acorn.position.y = -0.22;
      group.add(acorn);
      light = new THREE.PointLight(0xffb85c, 0.85, 4.0, 2);
      group.add(light);
      break;
    }
    case 'snare_bridge': {
      // Giant wooden base + raised brass jaw bar (drops flat when sprung!). The prefab sits 0.32 below the group
      // origin, so its jaw pivot is in the prefab's own frame: 0.67 raised, 0.18 sprung.
      const snare = buildPrefab('snare-bridge', { lights: false });
      snare.position.y = -0.32;
      group.add(snare);
      light = new THREE.PointLight(0xff9b3d, 1.1, 5.5, 2);
      group.add(light);
      break;
    }
    case 'soul_bell': {
      const bell = buildPrefab('soul-bell', { lights: false });
      bell.position.y = -0.5;
      group.add(bell);
      light = new THREE.PointLight(0xa78bfa, 1.0, 5.0, 2);
      light.position.y = 0.35;
      group.add(light);
      break;
    }
    case 'exit_door': {
      // Giant Garden Pet-Door with moonlit frame
      const door = buildPrefab('pet-door', { lights: false });
      door.position.y = -0.6;
      // The game recolours the flap when the bells are cleared, so it gets its own material, not the shared one.
      const flap = door.getObjectByName('flap') as THREE.Mesh;
      flap.material = new THREE.MeshBasicMaterial({ color: 0x1b2638 });
      group.add(door);
      light = new THREE.PointLight(0x7dd3fc, 0.7, 7.0, 2);
      light.position.y = 0.5;
      group.add(light);
      break;
    }
  }

  return { item, group, light };
}

export function createSceneView(canvas: HTMLCanvasElement, initialState: SimState): SceneView {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050a);
  scene.fog = new THREE.FogExp2(0x04050a, 0.082);

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 65);
  scene.add(camera);

  // Dark moody ambient + cool moonlight hemisphere
  scene.add(new THREE.AmbientLight(0x232d47, 0.48));
  scene.add(new THREE.HemisphereLight(0x3a4a6e, 0x100d0b, 0.52));

  // Player ceramic lantern attached to camera
  const lanternSpot = new THREE.SpotLight(0xffdfb0, 4.4, 19, Math.PI * 0.32, 0.65, 1.35);
  lanternSpot.position.set(0.12, -0.04, 0.05);
  lanternSpot.castShadow = true;
  lanternSpot.shadow.mapSize.set(512, 512);
  const lanternTarget = new THREE.Object3D();
  lanternTarget.position.set(0, -0.08, -4);
  camera.add(lanternSpot, lanternTarget);
  lanternSpot.target = lanternTarget;

  const lanternFill = new THREE.PointLight(0xffcf96, 0.55, 4.2, 2);
  lanternFill.position.set(0, 0, 0.1);
  camera.add(lanternFill);

  // Every PointLight that the fixed budget chooses between (lanternFill and lanternSpot are not in it)
  const budgetLights: THREE.PointLight[] = [];

  // Build rooms
  for (const room of initialState.rooms) {
    buildRoomGeometry(scene, room, initialState.doorways);
    if (room.hearthX !== undefined && room.hearthZ !== undefined) {
      const hearthLight = new THREE.PointLight(0xff6b2b, 1.6, 11, 1.8);
      hearthLight.position.set(room.hearthX + 0.6, 1.2, room.hearthZ);
      scene.add(hearthLight);
      budgetLights.push(hearthLight);
    }
  }

  // Build giant furniture from @lawn/prefabs as a pre-baked static batch
  scene.add(buildStaticPrefabs(
    initialState.furniture.map((f) => ({
      id: f.prefabId,
      x: f.x,
      z: f.z,
      yaw: f.rotY,
      scale: f.scale,
      tint: f.tint,
    })),
    { shadows: true, name: 'room-furniture' },
  ));

  // Build interactables & obstacles
  const interactableVisuals = initialState.interactables.map((item) => {
    const v = createInteractableVisual(item);
    scene.add(v.group);
    if (v.light) budgetLights.push(v.light);
    return v;
  });

  // Build giant Gnome-Soul monsters
  const monsterMeshes = new Map<number, MonsterMesh>();
  for (const m of initialState.monsters) {
    const mm = createMonsterMesh(m);
    scene.add(mm.root);
    monsterMeshes.set(m.id, mm);
    budgetLights.push(mm.auraLight);
  }

  // Lights nearest the player, in view, in the player's room or a neighbouring one stay on
  let playerRoomId = -1;
  const budget = createLightBudget(budgetLights, POINT_LIGHT_BUDGET);
  const roomPenalty = (_light: THREE.PointLight, worldPos: THREE.Vector3): number => {
    const room = roomAt(initialState.rooms, worldPos.x, worldPos.z);
    if (!room || room.id === playerRoomId) return 0;
    const neighbour = initialState.doorways.some(
      (dw) =>
        (dw.roomA === playerRoomId && dw.roomB === room.id) || (dw.roomB === playerRoomId && dw.roomA === room.id),
    );
    return neighbour ? 0 : OFF_ROOM_PENALTY;
  };

  return {
    renderer,
    scene,
    camera,

    sync(state: SimState): void {
      const p = state.player;
      // Subtle headbob reduced during Dream Drag to prevent motion sickness
      const speed = Math.hypot(p.vx, p.vz);
      const bobScale = Math.min(1, speed / 2.2) * (1 - state.director.dreamDrag * 0.55);
      const bobY = Math.sin(p.stepPhase * 2) * 0.024 * bobScale;
      const bobX = Math.cos(p.stepPhase) * 0.012 * bobScale;

      camera.position.set(p.x + bobX, p.y + bobY, p.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = p.yaw;
      camera.rotation.x = p.pitch;
      camera.rotation.z = Math.sin(state.time * 2.2) * state.director.dreamDrag * 0.022;

      // Slight FOV pull during Dream Drag peak
      const targetFov = 72 - state.director.dreamDrag * 8;
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov += (targetFov - camera.fov) * 0.12;
        camera.updateProjectionMatrix();
      }

      // Lantern: off, gutted, sputtering back on, or lit (flickering when the house is tense or the wick is worn)
      let lanternLevel = 0;
      if (!p.lanternOn) {
        lanternLevel = 0;
      } else if (!p.lanternLit) {
        lanternLevel = p.relightTimer > 0 && Math.sin(state.time * 53) > 0.1 ? 0.12 : 0.02;
      } else {
        const tensionFlicker = state.director.tension > 0.65 && Math.sin(state.time * 37) > 0.78 ? 0.35 : 1.0;
        const wearFlicker = p.wickWear > 0.35 && Math.sin(state.time * 23 + 1.3) > 0.94 ? 0.55 : 1.0;
        lanternLevel = tensionFlicker * wearFlicker;
      }
      lanternSpot.intensity = 4.4 * lanternLevel;
      lanternFill.intensity = 0.85 * lanternLevel;

      // Sync interactables
      for (const v of interactableVisuals) {
        const item = state.interactables.find((i) => i.id === v.item.id);
        if (!item) continue;

        if (item.kind === 'glaze_shard' || item.kind === 'heavy_acorn') {
          v.group.visible = !item.collected;
          v.group.rotation.y = state.time * 1.6;
          v.group.position.y = item.y + Math.sin(state.time * 2.5) * 0.05;
        } else if (item.kind === 'kiln_ward') {
          v.group.visible = !item.activated;
        } else if (item.kind === 'snare_bridge') {
          const jaw = v.group.getObjectByName('jaw');
          if (jaw) jaw.position.y = item.activated ? 0.18 : 0.67;
          if (v.light) v.light.color.setHex(item.activated ? 0x4ade80 : 0xff9b3d);
        } else if (item.kind === 'soul_bell') {
          if (item.activated) {
            v.group.rotation.z = Math.sin(state.time * 8) * 0.08;
            if (v.light) v.light.color.setHex(0x4ade80);
          }
        } else if (item.kind === 'exit_door') {
          const flap = v.group.getObjectByName('flap') as THREE.Mesh | undefined;
          if (flap && state.obstacleStatus.bellsCleared) {
            (flap.material as THREE.MeshBasicMaterial).color.setHex(0x7dd3fc);
            if (v.light) v.light.intensity = 2.2;
          }
        }
      }

      // Sync monsters
      for (const m of state.monsters) {
        const mm = monsterMeshes.get(m.id);
        if (mm) updateMonsterMesh(mm, m, state.time);
      }

      // Light budget: after the camera and the moving lights are placed, before the frame is drawn
      playerRoomId = roomAt(initialState.rooms, p.x, p.z)?.id ?? -1;
      budget.update(camera, roomPenalty);

      renderer.render(scene, camera);
    },

    resize(): void {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },

    dispose(): void {
      renderer.dispose();
    },
  };
}
