import * as THREE from 'three';
import { Mountain } from './mountain';
import { ClimbingController, InputState, PitonAnchor } from './climbing';
import { SoundEngine } from './audio';
import { createFirstPersonHands, RemoteClimberAvatar } from './playerModel';
import { NetClient } from './net/client';
import { PitonNetData, RemotePlayerState } from './net/protocol';
import { GameUI } from './ui';
import { TouchControls } from './touch';
import { clamp } from './math';

interface ActivePing {
  mesh: THREE.Group;
  ttl: number;
}

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#8ec5eb');
scene.fog = new THREE.FogExp2('#9fd0f0', 0.0052);

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 350);
scene.add(camera);

const hemiLight = new THREE.HemisphereLight('#d8f0ff', '#5c5346', 0.85);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight('#fff5e0', 1.6);
sunLight.position.set(45, 110, 65);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 260;
sunLight.shadow.camera.left = -65;
sunLight.shadow.camera.right = 65;
sunLight.shadow.camera.top = 95;
sunLight.shadow.camera.bottom = -65;
scene.add(sunLight);

const hands = createFirstPersonHands();
camera.add(hands.group);

const sound = new SoundEngine();
const net = new NetClient();
const touch = new TouchControls(uiRoot, {
  onLook: (dx, dy) => {
    if (!inGame || !controller) return;
    const sens = 0.0045;
    controller.yaw -= dx * sens;
    controller.pitch = clamp(controller.pitch - dy * sens, -1.48, 1.48);
  },
  onPing: () => triggerPing(),
  onPiton: () => triggerPiton(),
  onDance: () => controller?.toggleDance(),
  onWave: () => controller?.toggleWave(),
  onRevive: () => triggerRevive(),
});

let mountain: Mountain | null = new Mountain(424242);
scene.add(mountain.group);
let controller: ClimbingController | null = null;
let myPlayerId = 'local';
let myRoomCode: string | null = null;
let inGame = false;
let summitAnnounced = false;

const pitons: PitonAnchor[] = [];
const pitonMeshes = new THREE.Group();
scene.add(pitonMeshes);

const activePings: ActivePing[] = [];
const pingMeshes = new THREE.Group();
scene.add(pingMeshes);

const remoteAvatars = new Map<string, RemoteClimberAvatar>();
let latestRemoteStates: RemotePlayerState[] = [];
const remoteGroup = new THREE.Group();
scene.add(remoteGroup);

const input: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
  grab: false,
};

function clearWorld(): void {
  if (mountain) {
    scene.remove(mountain.group);
    mountain = null;
  }
  controller = null;
  pitons.length = 0;
  pitonMeshes.clear();
  activePings.length = 0;
  pingMeshes.clear();
  remoteAvatars.clear();
  remoteGroup.clear();
  latestRemoteStates = [];
  summitAnnounced = false;
}

function addPitonVisual(p: PitonAnchor): void {
  pitons.push(p);
  const g = new THREE.Group();
  g.position.set(p.x, p.y, p.z);
  const spike = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.02, 0.45, 6),
    new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.45 })
  );
  spike.rotation.x = Math.PI / 2;
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.48, 16),
    new THREE.MeshBasicMaterial({ color: '#ffe66d', side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
  );
  aura.position.set(p.nx * 0.15, p.ny * 0.15, p.nz * 0.15);
  aura.lookAt(p.x + p.nx, p.y + p.ny, p.z + p.nz);
  g.add(spike, aura);
  pitonMeshes.add(g);
}

function addPingVisual(x: number, y: number, z: number, color: string, label: string): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshBasicMaterial({ color })
  );
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  beam.position.y = 4;
  g.add(orb, beam);
  pingMeshes.add(g);
  activePings.push({ mesh: g, ttl: 12 });
  sound.playPing();
  ui.showToast(`${label} pinged a route!`, 2.0);
}

function startClimbWorld(seed: number, roomCode: string | null, existingPitons: PitonNetData[] = []): void {
  clearWorld();
  myRoomCode = roomCode;
  mountain = new Mountain(seed);
  scene.add(mountain.group);
  controller = new ClimbingController(mountain, sound);
  for (const p of existingPitons) addPitonVisual(p);
  inGame = true;
  ui.showHud(seed, roomCode);
  touch.setVisible(true);
  if (!touch.isTouchDevice) {
    canvas.requestPointerLock?.();
  }
}

const ui = new GameUI(uiRoot, {
  onPlaySolo: (_name, seed) => {
    net.disconnect();
    const s = seed ?? Math.floor(Math.random() * 899999) + 100000;
    startClimbWorld(s, null);
  },
  onHostRoom: (name, seed) => {
    net.connect(
      { type: 'create_room', name, seed },
      makeNetCallbacks()
    );
  },
  onJoinRoom: (name, code) => {
    net.connect(
      { type: 'join_room', name, code },
      makeNetCallbacks()
    );
  },
  onQuickJoin: (name, seed) => {
    net.connect(
      { type: 'quick_join', name, seed },
      makeNetCallbacks()
    );
  },
  onRespawn: () => {
    controller?.respawnAtCheckpoint();
    canvas.requestPointerLock?.();
  },
  onBackToMenu: () => {
    inGame = false;
    net.disconnect();
    clearWorld();
    touch.setVisible(false);
    document.exitPointerLock?.();
    ui.showLobby();
  },
  onToggleMute: () => {
    const next = !sound.isMuted();
    sound.setMuted(next);
    return next;
  },
});

function makeNetCallbacks() {
  return {
    onWelcome: (playerId: string, code: string, seed: number, players: RemotePlayerState[], serverPitons: PitonNetData[]) => {
      myPlayerId = playerId;
      startClimbWorld(seed, code, serverPitons);
      syncRemotePlayers(players);
      ui.showToast(`Joined Room ${code}`, 2.5);
    },
    onSnapshot: (players: RemotePlayerState[]) => {
      syncRemotePlayers(players);
    },
    onPlayerLeft: (playerId: string) => {
      const av = remoteAvatars.get(playerId);
      if (av) {
        remoteGroup.remove(av.group);
        remoteAvatars.delete(playerId);
      }
      latestRemoteStates = latestRemoteStates.filter((p) => p.id !== playerId);
    },
    onPing: (msg: { playerId: string; name: string; color: string; x: number; y: number; z: number }) => {
      addPingVisual(msg.x, msg.y, msg.z, msg.color, msg.name);
    },
    onPiton: (piton: PitonNetData) => {
      if (!pitons.some((p) => p.id === piton.id)) {
        addPitonVisual(piton);
        sound.playPiton();
      }
    },
    onRevive: (byName: string) => {
      if (controller && controller.mode === 'downed') {
        controller.revive();
        ui.showToast(`Revived by ${byName}!`, 2.5);
      }
    },
    onSummit: (name: string, timeSec: number) => {
      const m = Math.floor(timeSec / 60);
      const s = Math.floor(timeSec % 60);
      ui.showToast(`${name} reached the SUMMIT in ${m}:${s.toString().padStart(2, '0')}!`, 4.5);
    },
    onError: (message: string) => {
      ui.setLobbyError(message);
    },
    onDisconnect: () => {
      if (inGame && myRoomCode) {
        ui.showToast('Disconnected from multiplayer server', 3.0);
      }
    },
  };
}

function syncRemotePlayers(players: RemotePlayerState[]): void {
  latestRemoteStates = players;
  for (const p of players) {
    if (p.id === myPlayerId) continue;
    let av = remoteAvatars.get(p.id);
    if (!av) {
      av = new RemoteClimberAvatar(p.name, p.color);
      remoteAvatars.set(p.id, av);
      remoteGroup.add(av.group);
    }
    av.targetPos.set(p.x, p.y, p.z);
    av.targetYaw = p.yaw;
    av.mode = p.mode;
    av.hp = p.hp;
  }
}

function findNearbyDownedTeammate(): RemotePlayerState | null {
  if (!controller) return null;
  for (const p of latestRemoteStates) {
    if (p.id === myPlayerId || p.mode !== 'downed') continue;
    const d = Math.hypot(controller.pos.x - p.x, controller.pos.y - p.y, controller.pos.z - p.z);
    if (d < 3.0) return p;
  }
  return null;
}

function triggerRevive(): void {
  const target = findNearbyDownedTeammate();
  if (target && net.isConnected()) {
    net.sendRevive(target.id);
    ui.showToast(`Revived ${target.name}!`, 2.0);
  }
}

// Input listeners
canvas.addEventListener('click', () => {
  if (inGame && !touch.isTouchDevice && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock?.();
  }
});

window.addEventListener('mousemove', (e) => {
  if (!inGame || !controller || document.pointerLockElement !== canvas) return;
  const sens = 0.0022;
  controller.yaw -= e.movementX * sens;
  controller.pitch = clamp(controller.pitch - e.movementY * sens, -1.48, 1.48);
});

window.addEventListener('mousedown', (e) => {
  if (!inGame || document.pointerLockElement !== canvas) return;
  if (e.button === 0) input.grab = true;
  if (e.button === 1 && controller && mountain) {
    e.preventDefault();
    triggerPing();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) input.grab = false;
});

function triggerPing(): void {
  if (!controller || !mountain) return;
  const hit = mountain.raycast(controller.getEyePosition(), controller.getLookDirection(), 70);
  if (!hit.hit) return;
  if (net.isConnected()) {
    net.sendPing(hit.point.x, hit.point.y, hit.point.z);
  } else {
    addPingVisual(hit.point.x, hit.point.y, hit.point.z, '#ffd166', 'You');
  }
}

function triggerPiton(): void {
  if (!controller || !mountain || controller.pitonsLeft <= 0) return;
  const hit = mountain.raycast(controller.getEyePosition(), controller.getLookDirection(), 3.2);
  if (!hit.hit) {
    ui.showToast('Look at nearby rock to place a Piton!', 1.5);
    return;
  }
  controller.pitonsLeft -= 1;
  const data: PitonNetData = {
    id: `local-${Date.now()}`,
    playerId: myPlayerId,
    x: hit.point.x,
    y: hit.point.y,
    z: hit.point.z,
    nx: hit.normal.x,
    ny: hit.normal.y,
    nz: hit.normal.z,
  };
  addPitonVisual(data);
  sound.playPiton();
  if (net.isConnected()) {
    net.sendPiton(data.x, data.y, data.z, data.nx, data.ny, data.nz);
  }
  ui.showToast('Piton placed! Reduced stamina drain nearby.', 2.0);
}

window.addEventListener('keydown', (e) => {
  if (!inGame || !controller) return;
  switch (e.code) {
    case 'KeyW': input.forward = true; break;
    case 'KeyS': input.backward = true; break;
    case 'KeyA': input.left = true; break;
    case 'KeyD': input.right = true; break;
    case 'Space': input.jump = true; break;
    case 'ShiftLeft':
    case 'ShiftRight': input.sprint = true; break;
    case 'KeyE': input.grab = true; break;
    case 'KeyQ': triggerPing(); break;
    case 'KeyR': triggerPiton(); break;
    case 'KeyC': controller.respawnAtCheckpoint(); break;
    case 'KeyG': controller.toggleDance(); break;
    case 'KeyH': controller.toggleWave(); break;
    case 'KeyF': triggerRevive(); break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': input.forward = false; break;
    case 'KeyS': input.backward = false; break;
    case 'KeyA': input.left = false; break;
    case 'KeyD': input.right = false; break;
    case 'Space': input.jump = false; break;
    case 'ShiftLeft':
    case 'ShiftRight': input.sprint = false; break;
    case 'KeyE': input.grab = false; break;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Main loop
let lastTime = performance.now();

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (inGame && controller) {
    const prevCp = controller.activeCheckpoint;
    const mergedInput: InputState = {
      forward: input.forward || touch.forward,
      backward: input.backward || touch.backward,
      left: input.left || touch.left,
      right: input.right || touch.right,
      jump: input.jump || touch.jump,
      sprint: input.sprint || touch.sprint,
      grab: input.grab || touch.grab,
    };
    controller.update(dt, mergedInput, pitons);

    if (controller.activeCheckpoint > prevCp) {
      ui.showToast(`Campfire Checkpoint ${controller.activeCheckpoint} reached! (+1 Piton)`, 2.5);
    }

    if (controller.hasSummited && !summitAnnounced) {
      summitAnnounced = true;
      const m = Math.floor(controller.climbTimeSec / 60);
      const s = Math.floor(controller.climbTimeSec % 60);
      ui.showToast(`SUMMIT REACHED in ${m}:${s.toString().padStart(2, '0')}!`, 5.0);
      if (net.isConnected()) {
        net.sendSummit(controller.climbTimeSec);
      }
    }

    // Update camera transform
    const eye = controller.getEyePosition();
    if (controller.mode === 'dancing') {
      eye.y += Math.abs(Math.sin(controller.dancePhase * 2)) * 0.1;
    }
    if (controller.cameraShake > 0) {
      eye.x += (Math.random() - 0.5) * controller.cameraShake * 0.2;
      eye.y += (Math.random() - 0.5) * controller.cameraShake * 0.2;
    }
    camera.position.copy(eye);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = controller.yaw;
    camera.rotation.x = controller.pitch;
    camera.rotation.z = controller.mode === 'downed' ? 0.35 : controller.mode === 'dancing' ? Math.sin(controller.dancePhase) * 0.06 : 0;

    hands.update(controller.mode, controller.canGrabTarget !== null, controller.handBob, controller.stamina, controller.dancePhase);

    // Update remote avatars
    for (const av of remoteAvatars.values()) {
      av.update(dt);
    }

    // Update pings
    for (let i = activePings.length - 1; i >= 0; i--) {
      activePings[i].ttl -= dt;
      activePings[i].mesh.rotation.y += dt * 2.5;
      if (activePings[i].ttl <= 0) {
        pingMeshes.remove(activePings[i].mesh);
        activePings.splice(i, 1);
      }
    }

    // Network sync
    net.sendState(dt, {
      x: controller.pos.x,
      y: controller.pos.y,
      z: controller.pos.z,
      yaw: controller.yaw,
      pitch: controller.pitch,
      mode: controller.mode,
      stamina: controller.stamina,
      hp: controller.hp,
    });

    const reviveTarget = findNearbyDownedTeammate();
    touch.setReviveAvailable(reviveTarget !== null);
    ui.update(dt, {
      altitude: controller.pos.y - 0.5,
      timeSec: controller.climbTimeSec,
      stamina: (controller.stamina / controller.maxStamina) * 100,
      hp: controller.hp,
      pitonsLeft: controller.pitonsLeft,
      mode: controller.mode,
      canGrab: controller.canGrabTarget !== null,
      nearPiton: controller.nearPiton,
      nearCampfire: controller.nearCampfire,
      reviveTargetName: reviveTarget ? reviveTarget.name : null,
      pointerLocked: document.pointerLockElement === canvas,
      isTouchDevice: touch.isTouchDevice,
      remotePlayers: latestRemoteStates,
    });
  } else {
    // Gentle camera orbit on lobby screen
    const t = now * 0.0002;
    camera.position.set(Math.sin(t) * 18, 22, 42);
    camera.lookAt(0, 55, -20);
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
