import * as THREE from 'three';
import { soundEngine } from './audio';
import {
  animateEnemyMesh,
  createAcornProjectileMesh,
  createEnemyMesh,
  createGnomeMesh,
  createItemMesh,
} from './models';
import { GameNetClient } from './net';
import { PORTALS, SHED_STATIONS, ZONE_BOUNDS } from './shared/catalog';
import type { WorldSnapshot, ZoneId } from './shared/types';
import { GameUI } from './ui';
import { buildAllZones } from './zones';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b101b);
const fog = new THREE.FogExp2(0x0b101b, 0.028);
scene.fog = fog;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 140);
scene.add(camera);

// Player Flashlight attached to camera
const flashlight = new THREE.SpotLight(0xfffbeb, 0, 26, Math.PI / 5.2, 0.45, 1.3);
flashlight.position.set(0.2, -0.15, 0);
const flashTarget = new THREE.Object3D();
flashTarget.position.set(0, -0.1, -10);
camera.add(flashlight);
camera.add(flashTarget);
flashlight.target = flashTarget;

const zones = buildAllZones();
for (const z of Object.values(zones)) {
  z.root.visible = false;
  scene.add(z.root);
}

const dynamicGroup = new THREE.Group();
scene.add(dynamicGroup);

const playerMeshes = new Map<string, THREE.Group>();
const itemMeshes = new Map<string, THREE.Group>();
const enemyMeshes = new Map<string, THREE.Group>();
const projMeshes = new Map<string, THREE.Mesh>();

let snapshot: WorldSnapshot | null = null;
let myId = '';
let activeZone: ZoneId = 'shed';
let lastSeenZone: ZoneId | null = null;
let lastSoundSeq = 0;

// Local FPS state
const localPos = new THREE.Vector3(0, 0, 0.5);
let localVelY = 0;
let localYaw = Math.PI;
let localPitch = 0;
let localStamina = 100;
let localFlashlight = false;
let isGrounded = true;

const keys = new Set<string>();

const net = new GameNetClient({
  onJoined: (pid, _code, snap) => {
    myId = pid;
    snapshot = snap;
    const me = snap.players[pid];
    if (me) {
      localPos.set(me.x, me.y, me.z);
      localYaw = me.yaw;
      lastSeenZone = me.zone;
      activeZone = me.zone;
    }
    ui.showGame();
  },
  onSnapshot: (snap) => {
    const prevPhase = snapshot?.phase;
    snapshot = snap;
    const me = snap.players[myId];
    if (me) {
      if (lastSeenZone !== me.zone || (prevPhase !== snap.phase && snap.phase !== 'yard')) {
        localPos.set(me.x, me.y, me.z);
        lastSeenZone = me.zone;
        activeZone = me.zone;
      }
    }
    for (const s of snap.recentSounds) {
      if (s.seq > lastSoundSeq) {
        lastSoundSeq = s.seq;
        if (s.zone === activeZone || s.kind === 'sermon' || s.kind === 'bell') {
          soundEngine.play(s.kind);
        }
      }
    }
  },
  onChat: (msg) => ui.addChat(msg),
  onError: (err) => ui.showError(err),
  onOpenShop: () => {
    if (snapshot) ui.setShopOpen(true, snapshot);
  },
});

const ui = new GameUI({
  onSolo: (name, color) => {
    soundEngine.unlock();
    net.startSolo(name, color);
  },
  onCreateRoom: (name, color) => {
    soundEngine.unlock();
    net.connectMultiplayer({ type: 'create_room', name, color });
  },
  onJoinRoom: (code, name, color) => {
    soundEngine.unlock();
    net.connectMultiplayer({ type: 'join_room', code, name, color });
  },
  onQuickJoin: (name, color) => {
    soundEngine.unlock();
    net.connectMultiplayer({ type: 'quick_join', name, color });
  },
  onBuyTool: (kind) => net.buyTool(kind),
  onSendChat: (text) => net.sendChat(text),
  onPullLever: () => net.pullLever(),
  onToggleMute: () => soundEngine.toggleMute(),
});

// Pointer lock & input
canvas.addEventListener('click', () => {
  soundEngine.unlock();
  if (!snapshot || ui.shopOpen || ui.chatFocused) return;
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock?.();
  } else {
    // Use held item!
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(localPitch, localYaw, 0, 'YXZ'));
    const me = snapshot.players[myId];
    const held = me?.heldItemId ? snapshot.items[me.heldItemId] : null;
    if (held?.kind === 'flashlight') {
      localFlashlight = !localFlashlight;
    }
    net.useItem(dir.x, dir.y, dir.z);
  }
});

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== canvas) return;
  localYaw -= e.movementX * 0.0024;
  localPitch = Math.max(-1.45, Math.min(1.45, localPitch - e.movementY * 0.0024));
});

window.addEventListener('keydown', (e) => {
  if (ui.chatFocused) return;
  const k = e.key.toLowerCase();
  keys.add(k);

  if (!snapshot) return;

  if (k === 'enter') {
    e.preventDefault();
    ui.openChat();
    return;
  }
  if (k === 'b' && activeZone === 'shed') {
    ui.setShopOpen(!ui.shopOpen, snapshot);
    return;
  }
  if (k === 'escape' && ui.shopOpen) {
    ui.setShopOpen(false);
    return;
  }
  if (k === 'e') {
    if (
      activeZone === 'shed' &&
      Math.hypot(localPos.x - SHED_STATIONS.shop.x, localPos.z - SHED_STATIONS.shop.z) < 2.3
    ) {
      ui.setShopOpen(true, snapshot);
    } else {
      net.interact();
    }
  } else if (k === 'g') {
    net.dropItem();
  } else if (k === 'p') {
    net.pray();
  } else if (k === 'f') {
    localFlashlight = !localFlashlight;
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function computeContextPrompt(): string | null {
  if (!snapshot) return null;
  const me = snapshot.players[myId];
  if (!me || !me.alive) return null;

  if (activeZone === 'shed') {
    if (Math.hypot(localPos.x - SHED_STATIONS.shrine.x, localPos.z - SHED_STATIONS.shrine.z) < 2.3) {
      return '[E] Pray at Gnome Jesus Shrine (+Speed Blessing)';
    }
    if (Math.hypot(localPos.x - SHED_STATIONS.tithe.x, localPos.z - SHED_STATIONS.tithe.z) < 2.4) {
      return me.heldItemId ? '[E] Tithe Held Loot to Gnome Jesus' : 'Tithe Altar (Bring Loot Here!)';
    }
    if (Math.hypot(localPos.x - SHED_STATIONS.shop.x, localPos.z - SHED_STATIONS.shop.z) < 2.3) {
      return '[E] Open Shed Miracle Shop';
    }
    if (Math.hypot(localPos.x - SHED_STATIONS.lever.x, localPos.z - SHED_STATIONS.lever.z) < 2.3) {
      return snapshot.phase === 'lobby'
        ? '[E] Pull Sacred Lever (Start Day!)'
        : '[E] Pull Sacred Lever (End Day & Return)';
    }
  }

  for (const portal of Object.values(PORTALS)) {
    if (portal.zone === activeZone && Math.hypot(localPos.x - portal.x, localPos.z - portal.z) < 2.6) {
      return `[E] ${portal.label}`;
    }
  }

  if (!me.heldItemId) {
    for (const item of Object.values(snapshot.items)) {
      if (item.zone === activeZone && item.holderId === null && !item.tithed) {
        if (Math.hypot(localPos.x - item.x, localPos.z - item.z) < 2.5) {
          const val = item.category === 'loot' ? ` ($${item.value})` : '';
          return `[E] Pick up ${item.name}${val}`;
        }
      }
    }
  }

  return null;
}

function syncDynamicEntities(t: number): void {
  if (!snapshot) return;

  // Players
  const seenPlayers = new Set<string>();
  for (const p of Object.values(snapshot.players)) {
    if (p.id === myId || p.zone !== activeZone || !p.alive) continue;
    seenPlayers.add(p.id);
    let mesh = playerMeshes.get(p.id);
    if (!mesh) {
      mesh = createGnomeMesh(p.color);
      playerMeshes.set(p.id, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(p.x, p.y, p.z);
    mesh.rotation.y = p.yaw + Math.PI;
    const halo = mesh.getObjectByName('halo');
    if (halo) halo.visible = p.prayTimer > 0 || p.blessingTimer > 0;
  }
  for (const [id, mesh] of playerMeshes.entries()) {
    if (!seenPlayers.has(id)) {
      dynamicGroup.remove(mesh);
      playerMeshes.delete(id);
    }
  }

  // Items
  const seenItems = new Set<string>();
  for (const item of Object.values(snapshot.items)) {
    if (item.zone !== activeZone || item.holderId !== null || item.tithed) continue;
    seenItems.add(item.id);
    let mesh = itemMeshes.get(item.id);
    if (!mesh) {
      mesh = createItemMesh(item);
      itemMeshes.set(item.id, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(item.x, item.y - 0.25 + Math.sin(t * 2.5 + item.x) * 0.06, item.z);
    mesh.rotation.y = t * 1.1;
  }
  for (const [id, mesh] of itemMeshes.entries()) {
    if (!seenItems.has(id)) {
      dynamicGroup.remove(mesh);
      itemMeshes.delete(id);
    }
  }

  // Enemies
  const seenMobs = new Set<string>();
  for (const mob of Object.values(snapshot.enemies)) {
    if (mob.zone !== activeZone) continue;
    seenMobs.add(mob.id);
    let mesh = enemyMeshes.get(mob.id);
    if (!mesh) {
      mesh = createEnemyMesh(mob.kind);
      enemyMeshes.set(mob.id, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(mob.x, mob.y, mob.z);
    mesh.rotation.y = mob.yaw;
    animateEnemyMesh(mesh, mob, t);
  }
  for (const [id, mesh] of enemyMeshes.entries()) {
    if (!seenMobs.has(id)) {
      dynamicGroup.remove(mesh);
      enemyMeshes.delete(id);
    }
  }

  // Projectiles
  const seenProj = new Set<string>();
  for (const proj of Object.values(snapshot.projectiles)) {
    if (proj.zone !== activeZone) continue;
    seenProj.add(proj.id);
    let mesh = projMeshes.get(proj.id);
    if (!mesh) {
      mesh = createAcornProjectileMesh();
      projMeshes.set(proj.id, mesh);
      dynamicGroup.add(mesh);
    }
    mesh.position.set(proj.x, proj.y, proj.z);
  }
  for (const [id, mesh] of projMeshes.entries()) {
    if (!seenProj.has(id)) {
      dynamicGroup.remove(mesh);
      projMeshes.delete(id);
    }
  }
}

let lastFrame = performance.now();
let lastNetSend = 0;

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const t = now / 1000;

  // Show only active zone
  for (const [zId, zData] of Object.entries(zones)) {
    zData.root.visible = zId === activeZone;
  }

  // Animate Gnome Jesus & Sky God
  if (zones.shed.shrineJesus) {
    zones.shed.shrineJesus.position.y = 0.96 + Math.sin(t * 2.2) * 0.08;
    zones.shed.shrineJesus.rotation.y = Math.sin(t * 0.8) * 0.35;
  }
  if (zones.yard.skyGod) {
    zones.yard.skyGod.position.y = 26 + Math.sin(t * 0.9) * 1.4;
    zones.yard.skyGod.rotation.y = Math.sin(t * 0.3) * 0.25;
  }

  // Atmosphere & Fog per zone & time of day
  if (activeZone === 'shed') {
    scene.background = new THREE.Color(0x1a1412);
    fog.color.setHex(0x1a1412);
    fog.density = 0.025;
  } else if (activeZone === 'yard') {
    const dayT = snapshot?.dayTime ?? 0;
    const darkness = Math.min(1, dayT * 1.15);
    const skyCol = new THREE.Color(0x3b4d6b).lerp(new THREE.Color(0x05070d), darkness);
    scene.background = skyCol;
    fog.color.copy(skyCol);
    fog.density = 0.022 + darkness * 0.032;
    if (zones.yard.dirLight) {
      zones.yard.dirLight.intensity = Math.max(0.15, 0.95 - darkness * 0.8);
    }
  } else if (activeZone === 'deku') {
    scene.background = new THREE.Color(0x061a17);
    fog.color.setHex(0x061a17);
    fog.density = 0.065;
  } else {
    scene.background = new THREE.Color(0x0b0714);
    fog.color.setHex(0x0b0714);
    fog.density = 0.075;
  }

  // Local player movement
  const me = snapshot?.players[myId];
  if (snapshot && me && me.alive && !ui.shopOpen && !ui.chatFocused) {
    const crouching = keys.has('c');
    const sprinting = keys.has('shift') && !crouching && localStamina > 4;
    const blessed = me.blessingTimer > 0 ? 1.35 : 1.0;

    let fwd = 0;
    let strafe = 0;
    if (keys.has('w') || keys.has('arrowup')) fwd += 1;
    if (keys.has('s') || keys.has('arrowdown')) fwd -= 1;
    if (keys.has('a') || keys.has('arrowleft')) strafe -= 1;
    if (keys.has('d') || keys.has('arrowright')) strafe += 1;

    if (sprinting && (fwd !== 0 || strafe !== 0)) {
      localStamina = Math.max(0, localStamina - 28 * dt);
    } else {
      localStamina = Math.min(100, localStamina + 18 * dt);
    }

    const baseSpeed = crouching ? 3.2 : sprinting ? 8.6 : 5.4;
    const speed = baseSpeed * blessed;

    const sinY = Math.sin(localYaw);
    const cosY = Math.cos(localYaw);
    let moveX = -sinY * fwd + cosY * strafe;
    let moveZ = -cosY * fwd - sinY * strafe;
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX = (moveX / len) * speed * dt;
      moveZ = (moveZ / len) * speed * dt;
    }

    const bounds = ZONE_BOUNDS[activeZone];
    localPos.x = Math.max(bounds.minX, Math.min(bounds.maxX, localPos.x + moveX));
    localPos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, localPos.z + moveZ));

    if (keys.has(' ') && isGrounded) {
      localVelY = 6.5;
      isGrounded = false;
    }
    localVelY -= 18 * dt;
    localPos.y += localVelY * dt;
    if (localPos.y <= 0) {
      localPos.y = 0;
      localVelY = 0;
      isGrounded = true;
    }

    const eyeH = crouching ? 0.72 : 1.18;
    camera.position.set(localPos.x, localPos.y + eyeH, localPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = localYaw;
    camera.rotation.x = localPitch;

    const hasFlashlight =
      localFlashlight &&
      me.heldItemId !== null &&
      snapshot.items[me.heldItemId]?.kind === 'flashlight';
    flashlight.intensity = hasFlashlight ? 42 : 0;

    if (now - lastNetSend > 45) {
      lastNetSend = now;
      net.sendInput({
        zone: activeZone,
        x: localPos.x,
        y: localPos.y,
        z: localPos.z,
        yaw: localYaw,
        pitch: localPitch,
        crouching,
        flashlightOn: hasFlashlight,
      });
    }
  } else if (me && !me.alive) {
    // Spectate slightly above death spot
    camera.position.set(localPos.x, 3.5, localPos.z + 3);
    camera.lookAt(localPos.x, 0.5, localPos.z);
    flashlight.intensity = 0;
  }

  if (snapshot) {
    syncDynamicEntities(t);
    ui.setPrompt(computeContextPrompt());
    ui.update(snapshot, myId, localStamina);
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
