import * as THREE from 'three';
import { ENTITY_ANCHORS } from '../sim/apartment';
import type { SimState } from '../sim/types';
import {
  drawHorseHockeyTv,
  drawMicrowaveDisplay,
  makeDisplayCanvas,
  makeMeatConeTexture,
  makeStickyNoteTexture,
  makeWallTexture,
  makeWoodFloorTexture,
} from './textures';

export interface SceneView {
  render: (sim: SimState, dt: number) => void;
  resize: () => void;
  dispose: () => void;
}

export function createSceneView(canvas: HTMLCanvasElement, initialSim: SimState): SceneView {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040407);
  scene.fog = new THREE.FogExp2(0x050509, 0.085);

  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 45);
  camera.rotation.order = 'YXZ';

  // Ambient moonlight / fridge hum fill
  const ambient = new THREE.AmbientLight(0x282d3a, 0.55);
  scene.add(ambient);

  // Flashlight attached to camera
  const flashlight = new THREE.SpotLight(0xfff1d6, 3.8, 16, Math.PI / 4.8, 0.45, 1.4);
  const flashTarget = new THREE.Object3D();
  flashTarget.position.set(0, 0, -5);
  camera.add(flashlight);
  camera.add(flashTarget);
  flashlight.target = flashTarget;
  scene.add(camera);

  // Floor & Ceiling
  const floorMat = new THREE.MeshStandardMaterial({ map: makeWoodFloorTexture(), roughness: 0.85 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 11),
    new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.95 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.1;
  scene.add(ceiling);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ map: makeWallTexture(), roughness: 0.9 });
  const addWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z);
    m.receiveShadow = true;
    scene.add(m);
  };
  addWall(13, 3.1, 0.2, 0, 1.55, -5.5); // North
  addWall(13, 3.1, 0.2, 0, 1.55, 5.5);  // South
  addWall(0.2, 3.1, 11, -6.5, 1.55, 0); // West
  addWall(0.2, 3.1, 11, 6.5, 1.55, 0);  // East
  // Hallway partition wall
  addWall(0.35, 3.1, 4.3, 1.5, 1.55, -3.35);

  // --- THE ROTATING DONER KEBAB CONE ---
  const coneGroup = new THREE.Group();
  coneGroup.position.set(ENTITY_ANCHORS.cone.x, 0, ENTITY_ANCHORS.cone.z);
  scene.add(coneGroup);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 0.85, 16),
    new THREE.MeshStandardMaterial({ color: 0x2a272b, metalness: 0.4, roughness: 0.6 }),
  );
  pedestal.position.y = 0.425;
  coneGroup.add(pedestal);

  const altarPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.28, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c7, roughness: 0.3 }),
  );
  altarPlate.position.set(0, 0.87, 0.48);
  coneGroup.add(altarPlate);

  const spitPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x999ea6, metalness: 0.85, roughness: 0.2 }),
  );
  spitPole.position.y = 1.6;
  coneGroup.add(spitPole);

  const meatCone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.19, 1.05, 20),
    new THREE.MeshStandardMaterial({ map: makeMeatConeTexture(), roughness: 0.55 }),
  );
  meatCone.position.y = 1.55;
  coneGroup.add(meatCone);

  const coneGlow = new THREE.PointLight(0xff6b2b, 2.2, 7.5);
  coneGlow.position.set(0, 1.6, 0.3);
  coneGroup.add(coneGlow);

  // --- THE FRIDGE ---
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(ENTITY_ANCHORS.fridge.x, 0, ENTITY_ANCHORS.fridge.z);
  scene.add(fridgeGroup);

  const fridgeBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 2.15, 1.05),
    new THREE.MeshStandardMaterial({ color: 0x8e969d, metalness: 0.3, roughness: 0.45 }),
  );
  fridgeBody.position.y = 1.075;
  fridgeGroup.add(fridgeBody);

  const fridgeSeam = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 1.9),
    new THREE.MeshBasicMaterial({ color: 0x6be0ff }),
  );
  fridgeSeam.position.set(0.54, 1.05, 0);
  fridgeSeam.rotation.y = Math.PI / 2;
  fridgeGroup.add(fridgeSeam);

  const stickyNote = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.24),
    new THREE.MeshBasicMaterial({ map: makeStickyNoteTexture('the water') }),
  );
  stickyNote.position.set(0.535, 1.55, 0.15);
  stickyNote.rotation.y = Math.PI / 2;
  fridgeGroup.add(stickyNote);

  const fridgeLight = new THREE.PointLight(0x6be0ff, 0.8, 5);
  fridgeLight.position.set(0.9, 1.2, 0);
  fridgeGroup.add(fridgeLight);

  // --- KITCHEN COUNTER + MICROWAVE + BURRITO + TOASTER ---
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.92, 1.05),
    new THREE.MeshStandardMaterial({ color: 0x2d2825, roughness: 0.8 }),
  );
  counter.position.set(-1.35, 0.46, -4.65);
  scene.add(counter);

  const microBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.44, 0.48),
    new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.4, roughness: 0.5 }),
  );
  microBody.position.set(-2.45, 1.14, -4.65);
  scene.add(microBody);

  const microDisplay = makeDisplayCanvas();
  drawMicrowaveDisplay(microDisplay.ctx, microDisplay.tex, '0:00', '#ff5533');
  const microScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.12),
    new THREE.MeshBasicMaterial({ map: microDisplay.tex }),
  );
  microScreen.position.set(-2.45, 1.18, -4.405);
  scene.add(microScreen);

  const microLight = new THREE.PointLight(0xff3824, 0.9, 4.5);
  microLight.position.set(-2.45, 1.25, -4.1);
  scene.add(microLight);

  // Dish towel covering microwave when calmed
  const dishTowel = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.48, 0.52),
    new THREE.MeshStandardMaterial({ color: 0x9aa49e, roughness: 0.95 }),
  );
  dishTowel.position.copy(microBody.position);
  dishTowel.visible = false;
  scene.add(dishTowel);

  // Counter Burrito thawing "the natural way"
  const burrito = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.06, 0.18, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xd5ba8a, roughness: 0.85 }),
  );
  burrito.rotation.z = Math.PI / 2;
  burrito.position.set(-1.65, 0.98, -4.45);
  scene.add(burrito);

  // Toaster
  const toasterBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.24, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: 0.7, roughness: 0.3 }),
  );
  toasterBody.position.set(ENTITY_ANCHORS.toaster.x, 1.04, -4.6);
  scene.add(toasterBody);

  // --- PRINTER & SCAM LEDGER DESK ---
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.8, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x33271e, roughness: 0.8 }),
  );
  desk.position.set(ENTITY_ANCHORS.printer.x, 0.4, -4.45);
  scene.add(desk);

  const printerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.34, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xd6d3cc, roughness: 0.5 }),
  );
  printerBody.position.set(ENTITY_ANCHORS.printer.x, 0.97, -4.45);
  scene.add(printerBody);

  const printerLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x44ff77 }),
  );
  printerLed.position.set(ENTITY_ANCHORS.printer.x + 0.2, 1.05, -4.2);
  scene.add(printerLed);

  const printerLight = new THREE.PointLight(0x44ff77, 0.7, 4.5);
  printerLight.position.set(ENTITY_ANCHORS.printer.x, 1.25, -4.0);
  scene.add(printerLight);

  // --- SMOKE DETECTOR (CEILING) ---
  const smokeBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0xd8d5ce, roughness: 0.6 }),
  );
  smokeBody.position.set(ENTITY_ANCHORS.smoke_detector.x, 3.04, ENTITY_ANCHORS.smoke_detector.z);
  scene.add(smokeBody);

  const smokeLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  );
  smokeLed.position.set(ENTITY_ANCHORS.smoke_detector.x, 2.98, ENTITY_ANCHORS.smoke_detector.z);
  scene.add(smokeLed);

  const smokeLight = new THREE.PointLight(0xff1a1a, 0.5, 5);
  smokeLight.position.set(ENTITY_ANCHORS.smoke_detector.x, 2.85, ENTITY_ANCHORS.smoke_detector.z);
  scene.add(smokeLight);

  // --- HORSE HOCKEY TV & COUCH ---
  const couch = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.75, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x3a2c2b, roughness: 0.95 }),
  );
  couch.position.set(-2.8, 0.375, 4.5);
  scene.add(couch);

  const tvStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.65, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x201c1a, roughness: 0.8 }),
  );
  tvStand.position.set(-5.7, 0.325, 2.2);
  scene.add(tvStand);

  const tvBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.7, 0.95),
    new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.6 }),
  );
  tvBox.position.set(-5.7, 1.0, 2.2);
  scene.add(tvBox);

  const tvCanvas = makeDisplayCanvas();
  drawHorseHockeyTv(tvCanvas.ctx, tvCanvas.tex, 0);
  const tvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.55),
    new THREE.MeshBasicMaterial({ map: tvCanvas.tex }),
  );
  tvScreen.position.set(-5.39, 1.0, 2.2);
  tvScreen.rotation.y = Math.PI / 2;
  scene.add(tvScreen);

  // Dynamic pickups pool
  const pickupMeshes = new Map<number, THREE.Mesh>();

  let lastMicroText = '';
  let tvTick = 0;

  function syncPickups(sim: SimState): void {
    const activeIds = new Set(sim.pickups.map((p) => p.uid));
    for (const [uid, mesh] of pickupMeshes) {
      if (!activeIds.has(uid)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        pickupMeshes.delete(uid);
      }
    }
    for (const p of sim.pickups) {
      let mesh = pickupMeshes.get(p.uid);
      if (!mesh) {
        const geo = new THREE.BoxGeometry(0.22, 0.16, 0.22);
        const mat = new THREE.MeshStandardMaterial({
          color: p.color,
          emissive: p.color,
          emissiveIntensity: 0.25,
          roughness: 0.4,
        });
        mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        pickupMeshes.set(p.uid, mesh);
      }
      mesh.position.set(p.x, p.y + Math.sin(sim.timeSeconds * 2.4 + p.uid) * 0.04, p.z);
      mesh.rotation.y = sim.timeSeconds * 0.8 + p.uid;
    }
  }

  function render(sim: SimState, dt: number): void {
    // Camera position + walk bob + nod animation
    const bobOffset = sim.player.isMoving ? Math.sin(sim.player.walkBob) * 0.035 : 0;
    const nodPitch = sim.player.nodAnimTimer > 0 ? -Math.sin((sim.player.nodAnimTimer / 0.35) * Math.PI) * 0.22 : 0;
    camera.position.set(sim.player.x, 1.62 + bobOffset, sim.player.z);
    camera.rotation.y = sim.player.yaw;
    camera.rotation.x = sim.player.pitch + nodPitch;

    flashlight.intensity = sim.player.flashlightOn ? 4.2 : 0;

    // Cone rotation & glow
    meatCone.rotation.y = sim.cone.angle;
    coneGlow.intensity = sim.cone.pausedTimer > 0 ? 0.35 : 2.0 + Math.sin(sim.timeSeconds * 3) * 0.25;

    // Fridge glow
    fridgeLight.intensity = 0.5 + sim.fridge.pulseIntensity * 2.2;
    fridgeSeam.visible = sim.fridge.phase !== 'idle' || Math.sin(sim.timeSeconds * 1.5) > 0;

    // Microwave display & towel
    dishTowel.visible = sim.microwave.towelTimer > 0;
    const microText = sim.microwave.towelTimer > 0 ? '----' : sim.microwave.display;
    const microColor = sim.microwave.phase === 'threat' || sim.microwave.phase === 'morse' ? '#ff2a2a' : '#ff8c3a';
    if (microText !== lastMicroText) {
      drawMicrowaveDisplay(microDisplay.ctx, microDisplay.tex, microText, microColor);
      lastMicroText = microText;
    }
    microLight.intensity = sim.microwave.towelTimer > 0 ? 0.05 : sim.microwave.phase === 'idle' ? 0.2 : 1.1 + Math.sin(sim.timeSeconds * 6) * 0.5;

    // Printer LED
    const jamColor = sim.printer.jammed ? 0xff2b2b : 0x33ee77;
    (printerLed.material as THREE.MeshBasicMaterial).color.setHex(jamColor);
    printerLight.color.setHex(jamColor);
    printerLight.intensity = sim.printer.jammed ? 1.4 + Math.sin(sim.timeSeconds * 8) * 0.6 : 0.45;

    // Smoke Detector LED
    const blinkCycle = sim.smokeDetector.ledFlashTimer % 1.8;
    const ledOn =
      sim.smokeDetector.blinks === 3 ||
      (sim.smokeDetector.blinks === 2 && (blinkCycle < 0.14 || (blinkCycle > 0.28 && blinkCycle < 0.42))) ||
      (sim.smokeDetector.blinks === 1 && blinkCycle < 0.12);
    smokeLed.visible = ledOn;
    smokeLight.intensity = ledOn ? (sim.smokeDetector.blinks >= 2 ? 2.5 : 0.9) : 0;

    // TV scanline tick
    tvTick += dt * 10;
    if (Math.floor(tvTick) % 3 === 0) {
      drawHorseHockeyTv(tvCanvas.ctx, tvCanvas.tex, Math.floor(tvTick));
    }

    syncPickups(sim);
    renderer.render(scene, camera);
  }

  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function dispose(): void {
    renderer.dispose();
  }

  // Initial frame
  render(initialSim, 0);

  return { render, resize, dispose };
}
