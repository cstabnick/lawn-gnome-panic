import * as THREE from 'three';
import type { ArchipelagoNode, ArchipelagoSilhouette } from '../data/archipelago';

export type DisposableTracker = <T extends { dispose(): void }>(x: T) => T;

function createBeaconBadge(
  node: ArchipelagoNode,
  yOffset: number,
  track: DisposableTracker,
): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 160;
  const g = c.getContext('2d')!;

  g.clearRect(0, 0, c.width, c.height);

  // Outer pill backdrop
  g.fillStyle = 'rgba(14, 7, 28, 0.88)';
  g.strokeStyle = node.color;
  g.lineWidth = 8;
  g.beginPath();
  g.roundRect(10, 14, c.width - 20, c.height - 28, 32);
  g.fill();
  g.stroke();

  // Accent bar on left
  g.fillStyle = node.color;
  g.beginPath();
  g.roundRect(24, 30, 14, c.height - 60, 7);
  g.fill();

  // Label text: AREA N · NAME · FREQ
  const text = `AREA ${node.areaNumber} · ${node.name.toUpperCase()} · ${node.frequency}`;
  g.fillStyle = '#ffffff';
  g.font = '900 38px system-ui, -apple-system, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, c.width * 0.5 + 8, c.height * 0.5 + 2, c.width - 96);

  const tex = track(new THREE.CanvasTexture(c));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const mat = track(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    }),
  );
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(36, 5.625, 1);
  sprite.position.set(0, yOffset, 0);
  sprite.renderOrder = 4;
  return sprite;
}

function addIslandBase(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): void {
  const cragGeo = track(new THREE.ConeGeometry(12, 16, 7));
  cragGeo.rotateX(Math.PI);
  const cragMat = track(
    new THREE.MeshStandardMaterial({ color: '#221535', roughness: 0.92 }),
  );
  const crag = new THREE.Mesh(cragGeo, cragMat);
  crag.position.y = -8.2;
  root.add(crag);

  const capGeo = track(new THREE.CylinderGeometry(12.2, 11.4, 1.5, 7));
  const capMat = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.32,
      roughness: 0.65,
    }),
  );
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.25;
  root.add(cap);

  const rimGeo = track(new THREE.TorusGeometry(12.5, 0.3, 8, 28));
  const rimMat = track(
    new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.72,
    }),
  );
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI * 0.5;
  rim.position.y = 0.8;
  root.add(rim);
}

function buildVinylSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const baseRing = new THREE.Mesh(
    track(new THREE.CylinderGeometry(7.2, 7.5, 1.4, 18)),
    track(new THREE.MeshStandardMaterial({ color: '#2b1942', roughness: 0.55 })),
  );
  baseRing.position.set(-1.2, 1.7, 0.4);
  root.add(baseRing);

  const dome = new THREE.Mesh(
    track(new THREE.SphereGeometry(6.8, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
    track(
      new THREE.MeshStandardMaterial({
        color: '#b8f2ff',
        emissive: node.color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.58,
        roughness: 0.15,
      }),
    ),
  );
  dome.position.set(-1.2, 2.35, 0.4);
  root.add(dome);

  const ribGeo = track(new THREE.TorusGeometry(6.95, 0.2, 6, 22, Math.PI));
  const ribMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffd740',
      emissive: '#ffd740',
      emissiveIntensity: 0.45,
    }),
  );
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.set(-1.2, 2.35, 0.4);
    rib.rotation.y = (i * Math.PI) / 3;
    root.add(rib);
  }

  // Tilted giant vinyl record disc
  const recordGroup = new THREE.Group();
  recordGroup.position.set(2.4, 11.4, -0.8);
  recordGroup.rotation.set(0.28, 0.15, 0.44);

  const disc = new THREE.Mesh(
    track(new THREE.CylinderGeometry(8.2, 8.2, 0.45, 30)),
    track(new THREE.MeshStandardMaterial({ color: '#110a1e', roughness: 0.28, metalness: 0.4 })),
  );
  recordGroup.add(disc);

  const label = new THREE.Mesh(
    track(new THREE.CylinderGeometry(2.6, 2.6, 0.58, 20)),
    track(
      new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.85,
      }),
    ),
  );
  recordGroup.add(label);

  const groove = new THREE.Mesh(
    track(new THREE.TorusGeometry(6.1, 0.18, 6, 30)),
    track(new THREE.MeshBasicMaterial({ color: node.color })),
  );
  groove.rotation.x = Math.PI * 0.5;
  groove.position.y = 0.24;
  recordGroup.add(groove);

  root.add(recordGroup);
  return 22.5;
}

function buildBongoSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const stoneMat = track(
    new THREE.MeshStandardMaterial({ color: '#38223d', roughness: 0.78 }),
  );
  const drumWoodMat = track(
    new THREE.MeshStandardMaterial({
      color: '#c95b1e',
      emissive: node.color,
      emissiveIntensity: 0.25,
      roughness: 0.45,
    }),
  );
  const headMat = track(
    new THREE.MeshStandardMaterial({
      color: '#fff4dc',
      emissive: '#ffd740',
      emissiveIntensity: 0.28,
      roughness: 0.4,
    }),
  );
  const rimMat = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.85,
    }),
  );

  // Viaduct arch & deck
  for (const sx of [-6.2, 6.2]) {
    const pier = new THREE.Mesh(track(new THREE.BoxGeometry(2.8, 5.8, 4.0)), stoneMat);
    pier.position.set(sx, 3.9, 0);
    root.add(pier);
  }
  const deck = new THREE.Mesh(track(new THREE.BoxGeometry(16.6, 1.35, 4.4)), stoneMat);
  deck.position.set(0, 7.5, 0);
  root.add(deck);

  const arch = new THREE.Mesh(
    track(new THREE.TorusGeometry(4.8, 0.42, 8, 22, Math.PI)),
    rimMat,
  );
  arch.position.set(0, 1.5, 0);
  root.add(arch);

  // Lower larger bongo
  const drumA = new THREE.Group();
  drumA.position.set(-2.5, 11.0, 0);
  drumA.add(new THREE.Mesh(track(new THREE.CylinderGeometry(3.8, 2.7, 5.2, 18)), drumWoodMat));
  const headA = new THREE.Mesh(track(new THREE.CylinderGeometry(3.85, 3.85, 0.35, 18)), headMat);
  headA.position.y = 2.72;
  drumA.add(headA);
  const rimA = new THREE.Mesh(track(new THREE.TorusGeometry(3.9, 0.24, 8, 22)), rimMat);
  rimA.rotation.x = Math.PI * 0.5;
  rimA.position.y = 2.65;
  drumA.add(rimA);
  root.add(drumA);

  // Upper stacked smaller bongo
  const drumB = new THREE.Group();
  drumB.position.set(2.9, 14.8, 0.3);
  drumB.rotation.z = -0.22;
  drumB.add(new THREE.Mesh(track(new THREE.CylinderGeometry(2.9, 2.0, 4.6, 18)), drumWoodMat));
  const headB = new THREE.Mesh(track(new THREE.CylinderGeometry(2.95, 2.95, 0.32, 18)), headMat);
  headB.position.y = 2.4;
  drumB.add(headB);
  const rimB = new THREE.Mesh(track(new THREE.TorusGeometry(3.0, 0.22, 8, 20)), rimMat);
  rimB.rotation.x = Math.PI * 0.5;
  rimB.position.y = 2.35;
  drumB.add(rimB);
  root.add(drumB);

  return 22.5;
}

function buildKilnSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const foundryMat = track(
    new THREE.MeshStandardMaterial({ color: '#261c24', roughness: 0.72, metalness: 0.35 }),
  );
  const stackMat = track(
    new THREE.MeshStandardMaterial({
      color: '#34242b',
      emissive: '#ff4f1f',
      emissiveIntensity: 0.25,
      metalness: 0.45,
      roughness: 0.4,
    }),
  );
  const moltenMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ff6d00',
      emissive: '#ff4f1f',
      emissiveIntensity: 1.0,
      roughness: 0.2,
    }),
  );
  const limeMat = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.9,
    }),
  );

  const hall = new THREE.Mesh(track(new THREE.BoxGeometry(12.8, 3.6, 8.2)), foundryMat);
  hall.position.set(0, 2.8, 0);
  root.add(hall);

  // Twin smokestacks
  for (const sx of [-3.9, 3.9]) {
    const stack = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.65, 2.45, 14.2, 14)),
      stackMat,
    );
    stack.position.set(sx, 11.7, 0);
    root.add(stack);

    const collar = new THREE.Mesh(track(new THREE.TorusGeometry(2.0, 0.28, 8, 18)), limeMat);
    collar.rotation.x = Math.PI * 0.5;
    collar.position.set(sx, 16.5, 0);
    root.add(collar);

    const emberCap = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.4, 1.75, 0.9, 12)),
      moltenMat,
    );
    emberCap.position.set(sx, 19.2, 0);
    root.add(emberCap);
  }

  // Glowing molten ring orbiting twin stacks
  const moltenRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(7.4, 0.62, 10, 30)),
    moltenMat,
  );
  moltenRing.position.set(0, 11.2, 0);
  moltenRing.rotation.set(Math.PI * 0.4, 0.22, 0);
  root.add(moltenRing);

  return 24.0;
}

function buildBirdbathSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const stoneMat = track(
    new THREE.MeshStandardMaterial({
      color: '#22345e',
      emissive: '#14234a',
      emissiveIntensity: 0.35,
      roughness: 0.4,
    }),
  );
  const neonMat = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    }),
  );

  const column = new THREE.Mesh(
    track(new THREE.CylinderGeometry(1.3, 2.2, 16.0, 14)),
    stoneMat,
  );
  column.position.y = 9.0;
  root.add(column);

  const tiers = [
    { y: 4.4, rTop: 8.4, rBot: 4.0, h: 2.2 },
    { y: 9.6, rTop: 5.9, rBot: 2.7, h: 1.9 },
    { y: 14.2, rTop: 3.7, rBot: 1.7, h: 1.6 },
  ];
  for (const t of tiers) {
    const bowl = new THREE.Mesh(
      track(new THREE.CylinderGeometry(t.rTop, t.rBot, t.h, 20)),
      stoneMat,
    );
    bowl.position.y = t.y;
    root.add(bowl);

    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(t.rTop + 0.08, 0.26, 8, 24)),
      neonMat,
    );
    rim.rotation.x = Math.PI * 0.5;
    rim.position.y = t.y + t.h * 0.5 + 0.05;
    root.add(rim);
  }

  const spire = new THREE.Mesh(track(new THREE.ConeGeometry(1.4, 6.2, 10)), neonMat);
  spire.position.y = 19.6;
  root.add(spire);

  const orb = new THREE.Mesh(track(new THREE.OctahedronGeometry(1.1)), neonMat);
  orb.position.y = 23.4;
  root.add(orb);

  return 27.5;
}

function buildArcadeSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const cabMat = track(
    new THREE.MeshStandardMaterial({ color: '#1b132b', roughness: 0.5, metalness: 0.3 }),
  );
  const screenRed = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.95,
    }),
  );
  const screenCyan = track(
    new THREE.MeshStandardMaterial({
      color: '#00e5ff',
      emissive: '#00e5ff',
      emissiveIntensity: 0.85,
    }),
  );
  const screenGold = track(
    new THREE.MeshStandardMaterial({
      color: '#ffd740',
      emissive: '#ffd740',
      emissiveIntensity: 0.9,
    }),
  );

  // Left CRT stack
  const crtL1 = new THREE.Mesh(track(new THREE.BoxGeometry(6.0, 5.8, 5.2)), cabMat);
  crtL1.position.set(-3.8, 3.9, 0.2);
  root.add(crtL1);

  const scrL1 = new THREE.Mesh(track(new THREE.BoxGeometry(4.6, 3.8, 0.3)), screenRed);
  scrL1.position.set(-3.8, 4.1, 2.95);
  root.add(scrL1);

  const crtL2 = new THREE.Mesh(track(new THREE.BoxGeometry(5.0, 4.6, 4.4)), cabMat);
  crtL2.position.set(-3.4, 9.2, 0.0);
  crtL2.rotation.y = 0.16;
  root.add(crtL2);

  const scrL2 = new THREE.Mesh(track(new THREE.BoxGeometry(3.8, 3.0, 0.3)), screenCyan);
  scrL2.position.set(-3.4, 9.3, 2.36);
  scrL2.rotation.y = 0.16;
  root.add(scrL2);

  // Right CRT stack
  const crtR1 = new THREE.Mesh(track(new THREE.BoxGeometry(5.8, 7.2, 5.0)), cabMat);
  crtR1.position.set(3.8, 4.6, -0.2);
  root.add(crtR1);

  const scrR1 = new THREE.Mesh(track(new THREE.BoxGeometry(4.4, 4.6, 0.3)), screenGold);
  scrR1.position.set(3.8, 5.0, 2.45);
  root.add(scrR1);

  const crtR2 = new THREE.Mesh(track(new THREE.BoxGeometry(4.8, 4.2, 4.2)), cabMat);
  crtR2.position.set(3.9, 10.4, -0.1);
  crtR2.rotation.y = -0.18;
  root.add(crtR2);

  const scrR2 = new THREE.Mesh(track(new THREE.BoxGeometry(3.6, 2.8, 0.3)), screenRed);
  scrR2.position.set(3.9, 10.5, 2.15);
  scrR2.rotation.y = -0.18;
  root.add(scrR2);

  // Overhead neon marquee
  const marquee = new THREE.Mesh(track(new THREE.BoxGeometry(14.8, 2.5, 1.3)), cabMat);
  marquee.position.set(0, 14.5, 1.1);
  root.add(marquee);

  const marqueeFace = new THREE.Mesh(track(new THREE.BoxGeometry(13.6, 1.5, 0.25)), screenRed);
  marqueeFace.position.set(0, 14.5, 1.88);
  root.add(marqueeFace);

  return 20.5;
}

function buildMallSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const atriumMat = track(
    new THREE.MeshStandardMaterial({ color: '#271e46', roughness: 0.55 }),
  );
  const tupperwareMat = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.56,
      roughness: 0.15,
    }),
  );
  const lidMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ff8a80',
      emissive: '#ff8a80',
      emissiveIntensity: 0.75,
      roughness: 0.3,
    }),
  );
  const coreMat = track(
    new THREE.MeshStandardMaterial({
      color: '#fff59d',
      emissive: '#fff59d',
      emissiveIntensity: 0.85,
    }),
  );

  // Atrium base
  const atrium = new THREE.Mesh(
    track(new THREE.CylinderGeometry(8.8, 9.6, 3.0, 8)),
    atriumMat,
  );
  atrium.position.y = 2.5;
  root.add(atrium);

  const trim = new THREE.Mesh(track(new THREE.TorusGeometry(9.2, 0.28, 8, 24)), lidMat);
  trim.rotation.x = Math.PI * 0.5;
  trim.position.y = 4.05;
  root.add(trim);

  // Interior glowing mall beacon inside bowl
  const core = new THREE.Mesh(track(new THREE.ConeGeometry(2.4, 8.8, 8)), coreMat);
  core.position.y = 8.6;
  root.add(core);

  // Translucent inverted Tupperware bowl dome
  const bowl = new THREE.Mesh(
    track(new THREE.CylinderGeometry(9.8, 5.2, 6.8, 20)),
    tupperwareMat,
  );
  bowl.position.y = 7.6;
  root.add(bowl);

  // Snap-lid flange on top
  const lid = new THREE.Mesh(
    track(new THREE.CylinderGeometry(10.6, 10.6, 0.9, 20)),
    lidMat,
  );
  lid.position.y = 11.5;
  root.add(lid);

  return 19.0;
}

function buildCitadelSilhouette(
  root: THREE.Group,
  _node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const hedgeMat = track(
    new THREE.MeshStandardMaterial({
      color: '#2e7d32',
      emissive: '#1b5e20',
      emissiveIntensity: 0.35,
      roughness: 0.85,
    }),
  );
  const whiteMat = track(
    new THREE.MeshStandardMaterial({
      color: '#f8f8f4',
      emissive: '#ffffff',
      emissiveIntensity: 0.25,
      roughness: 0.35,
    }),
  );
  const goldMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffd740',
      emissive: '#ffd740',
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.25,
    }),
  );

  // Three green hedge terraces
  const terraces = [
    { y: 2.0, r: 9.8, h: 2.0 },
    { y: 4.1, r: 7.4, h: 2.0 },
    { y: 6.1, r: 5.1, h: 1.9 },
  ];
  for (const t of terraces) {
    const hedge = new THREE.Mesh(
      track(new THREE.CylinderGeometry(t.r, t.r + 0.25, t.h, 8)),
      hedgeMat,
    );
    hedge.position.y = t.y;
    root.add(hedge);
  }

  // White gazebo
  const pillarGeo = track(new THREE.CylinderGeometry(0.24, 0.24, 3.8, 8));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pillar = new THREE.Mesh(pillarGeo, whiteMat);
    pillar.position.set(Math.cos(a) * 3.4, 9.0, Math.sin(a) * 3.4);
    root.add(pillar);
  }
  const roof = new THREE.Mesh(track(new THREE.ConeGeometry(4.4, 2.8, 8)), whiteMat);
  roof.position.y = 12.4;
  root.add(roof);

  // Gold megaphone spire
  const mast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.32, 0.42, 3.8, 8)), goldMat);
  mast.position.y = 15.6;
  root.add(mast);

  const megaphone = new THREE.Mesh(
    track(new THREE.CylinderGeometry(2.5, 0.65, 3.8, 14)),
    goldMat,
  );
  megaphone.position.set(0.8, 18.0, 0);
  megaphone.rotation.z = -Math.PI * 0.42;
  root.add(megaphone);

  return 24.0;
}

function buildSubsoilSilhouette(
  root: THREE.Group,
  node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const metalMat = track(
    new THREE.MeshStandardMaterial({ color: '#1b1136', metalness: 0.55, roughness: 0.35 }),
  );
  const pulseMat = track(
    new THREE.MeshStandardMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    }),
  );
  const amberMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffab40',
      emissive: '#ffab40',
      emissiveIntensity: 0.85,
    }),
  );

  const base = new THREE.Mesh(track(new THREE.CylinderGeometry(5.2, 6.6, 3.0, 8)), metalMat);
  base.position.y = 2.5;
  root.add(base);

  // Colossal tuning-fork antenna
  const stem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.95, 1.25, 6.0, 10)), metalMat);
  stem.position.y = 7.0;
  root.add(stem);

  const yoke = new THREE.Mesh(track(new THREE.BoxGeometry(7.6, 1.35, 1.35)), metalMat);
  yoke.position.y = 10.6;
  root.add(yoke);

  for (const sx of [-3.2, 3.2]) {
    const tine = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 10.4, 1.1)), metalMat);
    tine.position.set(sx, 16.5, 0);
    root.add(tine);

    const tip = new THREE.Mesh(track(new THREE.SphereGeometry(0.95, 12, 10)), pulseMat);
    tip.position.set(sx, 22.1, 0);
    root.add(tip);
  }

  // Parabolic dishes
  const dishSpecs = [
    { x: -5.8, y: 6.8, z: 2.2, rz: 0.65, ry: 0.35 },
    { x: 5.8, y: 7.4, z: -2.0, rz: -0.65, ry: -0.35 },
  ];
  for (const d of dishSpecs) {
    const dishGroup = new THREE.Group();
    dishGroup.position.set(d.x, d.y, d.z);
    dishGroup.rotation.set(0.25, d.ry, d.rz);

    const dish = new THREE.Mesh(
      track(new THREE.CylinderGeometry(3.8, 0.75, 1.6, 16)),
      metalMat,
    );
    dishGroup.add(dish);

    const feed = new THREE.Mesh(track(new THREE.CylinderGeometry(0.22, 0.22, 2.8, 8)), amberMat);
    feed.position.y = 1.6;
    dishGroup.add(feed);

    const dishRim = new THREE.Mesh(track(new THREE.TorusGeometry(3.85, 0.18, 6, 18)), pulseMat);
    dishRim.rotation.x = Math.PI * 0.5;
    dishRim.position.y = 0.8;
    dishGroup.add(dishRim);

    root.add(dishGroup);
  }

  return 26.5;
}

function buildZenithSilhouette(
  root: THREE.Group,
  _node: ArchipelagoNode,
  track: DisposableTracker,
): number {
  const pearlMat = track(
    new THREE.MeshStandardMaterial({
      color: '#faf8f2',
      emissive: '#dcd6f7',
      emissiveIntensity: 0.35,
      roughness: 0.25,
    }),
  );
  const goldMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffd740',
      emissive: '#ffd740',
      emissiveIntensity: 0.85,
      metalness: 0.65,
      roughness: 0.2,
    }),
  );

  const plinth = new THREE.Mesh(
    track(new THREE.CylinderGeometry(6.8, 8.2, 2.2, 16)),
    pearlMat,
  );
  plinth.position.y = 2.1;
  root.add(plinth);

  // Tilted white-gold vinyl cosmos
  const cosmos = new THREE.Group();
  cosmos.position.set(-0.8, 9.6, 0);
  cosmos.rotation.set(0.38, 0.1, -0.32);

  const whiteVinyl = new THREE.Mesh(
    track(new THREE.CylinderGeometry(8.8, 8.8, 0.5, 32)),
    pearlMat,
  );
  cosmos.add(whiteVinyl);

  const goldLabel = new THREE.Mesh(
    track(new THREE.CylinderGeometry(2.8, 2.8, 0.64, 22)),
    goldMat,
  );
  cosmos.add(goldLabel);

  const orbitA = new THREE.Mesh(track(new THREE.TorusGeometry(10.6, 0.28, 8, 32)), goldMat);
  orbitA.rotation.x = Math.PI * 0.5 + 0.35;
  cosmos.add(orbitA);

  const orbitB = new THREE.Mesh(track(new THREE.TorusGeometry(12.2, 0.2, 8, 32)), pearlMat);
  orbitB.rotation.set(Math.PI * 0.5 - 0.42, 0.5, 0);
  cosmos.add(orbitB);

  root.add(cosmos);

  // Flared gramophone horn
  const hornNeck = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.45, 0.6, 4.2, 10)),
    goldMat,
  );
  hornNeck.position.set(1.2, 12.2, 0.4);
  root.add(hornNeck);

  const hornBell = new THREE.Mesh(
    track(new THREE.CylinderGeometry(4.4, 0.75, 6.8, 20)),
    goldMat,
  );
  hornBell.position.set(3.2, 16.5, 0.4);
  hornBell.rotation.z = -0.62;
  root.add(hornBell);

  return 24.5;
}

const SILHOUETTE_BUILDERS: Record<
  ArchipelagoSilhouette,
  (root: THREE.Group, node: ArchipelagoNode, track: DisposableTracker) => number
> = {
  vinyl: buildVinylSilhouette,
  bongo: buildBongoSilhouette,
  kiln: buildKilnSilhouette,
  birdbath: buildBirdbathSilhouette,
  arcade: buildArcadeSilhouette,
  mall: buildMallSilhouette,
  citadel: buildCitadelSilhouette,
  subsoil: buildSubsoilSilhouette,
  zenith: buildZenithSilhouette,
};

export function buildDistantWorldDiorama(
  node: ArchipelagoNode,
  track: DisposableTracker,
): THREE.Group {
  const root = new THREE.Group();
  addIslandBase(root, node, track);

  const buildSilhouette = SILHOUETTE_BUILDERS[node.silhouette];
  const badgeY = buildSilhouette(root, node, track);

  const badge = createBeaconBadge(node, badgeY, track);
  root.add(badge);

  return root;
}
