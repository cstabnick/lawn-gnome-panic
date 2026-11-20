// Indoor Gnomerena 3D arena builder: hardwood court, @lawn/prefabs hoops,
// multi-tiered bleachers with an animated cheering gnome crowd, rafters, banners,
// spotlights, scorer's table, and a live-updating overhead Jumbotron!
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PRO_TEAMS } from './teams';
import type { ProTeam } from './types';

export const COURT_HALF_X = 11.5;
export const COURT_HALF_Z = 6.2;
export const HOOP_X = 10.1;
export const HOOP_Y = 3.05;
export const THREE_PT_RADIUS = 5.4;

export interface JumbotronData {
  homeAbbr: string;
  awayAbbr: string;
  homeHex: string;
  awayHex: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  clockSec: number;
  shotClock: number;
  onFireText?: string;
}

interface CrowdGnome {
  baseX: number;
  baseY: number;
  baseZ: number;
  rotY: number;
  phase: number;
  speed: number;
}

export interface Gnomerena {
  root: THREE.Group;
  leftHoop: THREE.Group;
  rightHoop: THREE.Group;
  update(dt: number, time: number, excitement: number): void;
  shakeRim(side: 'left' | 'right', strength: number): void;
  updateJumbotron(data: JumbotronData): void;
  setCourtTeams(home: ProTeam, away: ProTeam): void;
}

/** Procedural polished hardwood basketball court texture. */
function makeCourtTexture(homeHex = '#228b22', awayHex = '#d92b2b'): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Warm maple hardwood planks
  ctx.fillStyle = '#d49a5a';
  ctx.fillRect(0, 0, w, h);
  const plankH = 16;
  for (let y = 0; y < h; y += plankH) {
    for (let x = 0; x < w; x += 64) {
      const shade = ((x * 7 + y * 13) % 24) - 12;
      const r = Math.min(255, Math.max(0, 214 + shade));
      const g = Math.min(255, Math.max(0, 156 + shade));
      const b = Math.min(255, Math.max(0, 92 + Math.floor(shade * 0.7)));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 64, plankH - 1);
    }
  }

  // Painted apron border
  const padX = 48;
  const padY = 38;
  ctx.fillStyle = '#181a2c';
  ctx.fillRect(0, 0, w, padY);
  ctx.fillRect(0, h - padY, w, padY);
  ctx.fillRect(0, 0, padX, h);
  ctx.fillRect(w - padX, 0, padX, h);

  // Inner court lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.strokeRect(padX, padY, w - padX * 2, h - padY * 2);

  // Half-court line
  ctx.beginPath();
  ctx.moveTo(w / 2, padY);
  ctx.lineTo(w / 2, h - padY);
  ctx.stroke();

  // Center circle + GBA logo
  ctx.fillStyle = homeHex;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffd21f';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GBA', w / 2, h / 2 - 12);
  ctx.fillStyle = '#ffd21f';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText('GJAM', w / 2, h / 2 + 18);

  // Left & Right painted keys (free-throw lanes)
  const keyW = 165;
  const keyH = 156;
  ctx.fillStyle = homeHex;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(padX, h / 2 - keyH / 2, keyW, keyH);
  ctx.fillStyle = awayHex;
  ctx.fillRect(w - padX - keyW, h / 2 - keyH / 2, keyW, keyH);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(padX, h / 2 - keyH / 2, keyW, keyH);
  ctx.strokeRect(w - padX - keyW, h / 2 - keyH / 2, keyW, keyH);

  // Free throw circles
  ctx.beginPath();
  ctx.arc(padX + keyW, h / 2, keyH / 2 - 20, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w - padX - keyW, h / 2, keyH / 2 - 20, Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();

  // 3-point arcs (scaled to match THREE_PT_RADIUS / COURT_HALF_X)
  const threeR = (THREE_PT_RADIUS / (COURT_HALF_X * 2)) * (w - padX * 2) * 0.96;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(padX + 44, h / 2, threeR, -Math.PI * 0.43, Math.PI * 0.43);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w - padX - 44, h / 2, threeR, Math.PI * 0.57, Math.PI * 1.43);
  ctx.stroke();

  // Sideline text
  ctx.fillStyle = '#ffd21f';
  ctx.font = '800 18px system-ui, sans-serif';
  ctx.fillText('GNOMERENA  •  GNOME BASKETBALL ASSOCIATION', w / 2, padY / 2 + 2);
  ctx.fillText('GBA GJAM  •  2-ON-2 ARCADE HOOPS', w / 2, h - padY / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeBannerTexture(team: ProTeam): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = team.primaryHex;
  ctx.fillRect(0, 0, 128, 192);
  ctx.strokeStyle = team.secondaryHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 112, 176);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(team.emblem, 64, 72);
  ctx.font = '900 28px system-ui, sans-serif';
  ctx.fillText(team.abbr, 64, 124);
  ctx.fillStyle = team.secondaryHex;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(team.name.toUpperCase(), 64, 154);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildGnomerena(): Gnomerena {
  const root = new THREE.Group();

  // 1. Hardwood court floor
  const courtMat = new THREE.MeshStandardMaterial({
    map: makeCourtTexture(),
    roughness: 0.35,
    metalness: 0.08,
  });
  const courtGeo = new THREE.PlaneGeometry(COURT_HALF_X * 2 + 2.4, COURT_HALF_Z * 2 + 2.2);
  const courtMesh = new THREE.Mesh(courtGeo, courtMat);
  courtMesh.rotation.x = -Math.PI / 2;
  courtMesh.receiveShadow = true;
  root.add(courtMesh);

  // Dark outer arena floor
  const outerFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 44),
    new THREE.MeshStandardMaterial({ color: 0x121320, roughness: 0.9 }),
  );
  outerFloor.rotation.x = -Math.PI / 2;
  outerFloor.position.y = -0.02;
  root.add(outerFloor);

  // 2. Two Gnomerena Hoops from @lawn/prefabs!
  // Prefab hoop faces +z with rim at local [0, 3.05, 0.36].
  // Left hoop stands at x = -(HOOP_X + 0.36) rotated +90 deg so its rim sits at x = -HOOP_X!
  const leftHoop = buildPrefab('gba-hoop', { tint: 'red', trim: 'white' });
  leftHoop.position.set(-(HOOP_X + 0.36), 0, 0);
  leftHoop.rotation.y = Math.PI / 2;
  root.add(leftHoop);

  const rightHoop = buildPrefab('gba-hoop', { tint: 'blue', trim: 'white' });
  rightHoop.position.set(HOOP_X + 0.36, 0, 0);
  rightHoop.rotation.y = -Math.PI / 2;
  root.add(rightHoop);

  // 3. Scorer's table & team benches on the far sideline (-z)
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.85, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1c2038, roughness: 0.6 }),
  );
  table.position.set(0, 0.425, -(COURT_HALF_Z + 1.45));
  root.add(table);

  // Golden Acorn Trophy on display at scorer's table!
  const trophyDisplay = buildPrefab('gba-trophy', { scale: 1.35 });
  trophyDisplay.position.set(0, 0.85, -(COURT_HALF_Z + 1.45));
  root.add(trophyDisplay);

  const benchMat = new THREE.MeshStandardMaterial({ color: 0x2d334d, roughness: 0.7 });
  for (const side of [-1, 1]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 0.75), benchMat);
    bench.position.set(side * 6.2, 0.225, -(COURT_HALF_Z + 1.55));
    root.add(bench);
  }

  // 4. Multi-tiered Indoor Stadium Bleachers (back wall + left & right baselines)
  const tierMat = new THREE.MeshStandardMaterial({ color: 0x21243a, roughness: 0.85 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x3a4066, roughness: 0.5, metalness: 0.3 });
  const crowdSpots: CrowdGnome[] = [];
  const rows = 5;

  // Far sideline stands (-z)
  for (let r = 0; r < rows; r++) {
    const y = 0.65 + r * 0.85;
    const z = -(COURT_HALF_Z + 2.9 + r * 1.15);
    const step = new THREE.Mesh(new THREE.BoxGeometry(27.5, 0.85, 1.15), tierMat);
    step.position.set(0, y - 0.425, z);
    root.add(step);

    const cols = 22;
    for (let c = 0; c < cols; c++) {
      if ((c + r) % 7 === 0) continue; // natural aisles
      const x = -12.6 + (c / (cols - 1)) * 25.2 + (Math.random() - 0.5) * 0.28;
      crowdSpots.push({
        baseX: x,
        baseY: y,
        baseZ: z + (Math.random() - 0.5) * 0.15,
        rotY: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: 3.5 + Math.random() * 2.5,
      });
    }
  }

  // Left & Right baseline stands (±x)
  for (const side of [-1, 1]) {
    for (let r = 0; r < 4; r++) {
      const y = 0.7 + r * 0.85;
      const x = side * (COURT_HALF_X + 3.4 + r * 1.15);
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 13.5), tierMat);
      step.position.set(x, y - 0.425, -0.5);
      root.add(step);

      for (let c = 0; c < 10; c++) {
        const z = -6.0 + (c / 9) * 11.2 + (Math.random() - 0.5) * 0.25;
        crowdSpots.push({
          baseX: x,
          baseY: y,
          baseZ: z,
          rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2,
          phase: Math.random() * Math.PI * 2,
          speed: 3.5 + Math.random() * 2.5,
        });
      }
    }
  }

  // 5. Instanced Cheering Gnome Crowd! (Bodies + Heads + Pointed Gnome Hats)
  const count = crowdSpots.length;
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.52, 7);
  const headGeo = new THREE.SphereGeometry(0.16, 7, 6);
  const hatGeo = new THREE.ConeGeometry(0.18, 0.42, 7);

  const crowdMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
  const bodies = new THREE.InstancedMesh(bodyGeo, crowdMat, count);
  const heads = new THREE.InstancedMesh(headGeo, crowdMat, count);
  const hats = new THREE.InstancedMesh(hatGeo, crowdMat, count);

  const teamColors = PRO_TEAMS.map((t) => new THREE.Color(t.primary));
  const skinColors = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524].map((h) => new THREE.Color(h));

  for (let i = 0; i < count; i++) {
    const teamCol = teamColors[i % teamColors.length];
    const hatCol = teamColors[(i * 3 + 1) % teamColors.length];
    bodies.setColorAt(i, teamCol);
    heads.setColorAt(i, skinColors[i % skinColors.length]);
    hats.setColorAt(i, hatCol);
  }
  bodies.instanceColor!.needsUpdate = true;
  heads.instanceColor!.needsUpdate = true;
  hats.instanceColor!.needsUpdate = true;

  root.add(bodies, heads, hats);

  // 6. Indoor Gnomerena Walls, Ceiling Rafters & Hanging 8-Team Banners
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x14172a, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 14, 0.5), wallMat);
  backWall.position.set(0, 7, -(COURT_HALF_Z + 9.2));
  root.add(backWall);

  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 14, 28), wallMat);
    sideWall.position.set(side * (COURT_HALF_X + 8.6), 7, -1);
    root.add(sideWall);
  }

  // Ceiling steel rafters
  for (let x = -16; x <= 16; x += 4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 24), railMat);
    beam.position.set(x, 11.4, -2);
    root.add(beam);
  }

  // Hanging championship banners for all 8 GBA teams!
  PRO_TEAMS.forEach((team, idx) => {
    const bx = -10.5 + idx * 3.0;
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 2.2),
      new THREE.MeshBasicMaterial({ map: makeBannerTexture(team), side: THREE.DoubleSide }),
    );
    banner.position.set(bx, 8.8, -(COURT_HALF_Z + 8.4));
    root.add(banner);
  });

  // Glowing arena floodlights along the rafters
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
  for (const lx of [-8, 0, 8]) {
    for (const lz of [-4, 2]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.6), lampMat);
      lamp.position.set(lx, 11.1, lz);
      root.add(lamp);
    }
  }

  // 7. Live Overhead Jumbotron Scoreboard
  const jumboCanvas = document.createElement('canvas');
  jumboCanvas.width = 512;
  jumboCanvas.height = 192;
  const jumboCtx = jumboCanvas.getContext('2d')!;
  const jumboTex = new THREE.CanvasTexture(jumboCanvas);
  jumboTex.colorSpace = THREE.SRGBColorSpace;

  const jumboGroup = new THREE.Group();
  jumboGroup.position.set(0, 8.3, -1.8);
  const jumboHousing = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 2.1, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x111422, roughness: 0.4, metalness: 0.5 }),
  );
  jumboGroup.add(jumboHousing);

  const screenMat = new THREE.MeshBasicMaterial({ map: jumboTex });
  const frontScreen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.85), screenMat);
  frontScreen.position.z = 1.12;
  jumboGroup.add(frontScreen);

  // Suspension cables to rafters
  for (const sx of [-2.2, 2.2]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 6), railMat);
    cable.position.set(sx, 2.5, 0);
    jumboGroup.add(cable);
  }
  root.add(jumboGroup);

  const drawJumbotron = (d: JumbotronData): void => {
    const ctx = jumboCtx;
    ctx.fillStyle = '#090b16';
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = d.onFireText ? '#ff6a00' : '#ffd21f';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 184);

    // Home panel
    ctx.fillStyle = d.homeHex;
    ctx.fillRect(16, 18, 152, 108);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.homeAbbr, 92, 52);
    ctx.font = '900 54px monospace';
    ctx.fillText(String(d.homeScore).padStart(2, '0'), 92, 110);

    // Away panel
    ctx.fillStyle = d.awayHex;
    ctx.fillRect(344, 18, 152, 108);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px system-ui, sans-serif';
    ctx.fillText(d.awayAbbr, 420, 52);
    ctx.font = '900 54px monospace';
    ctx.fillText(String(d.awayScore).padStart(2, '0'), 420, 110);

    // Center Clock & Quarter
    const mins = Math.floor(Math.max(0, d.clockSec) / 60);
    const secs = Math.floor(Math.max(0, d.clockSec) % 60);
    ctx.fillStyle = '#ffd21f';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillText(d.quarter > 4 ? 'OT' : `Q${d.quarter}`, 256, 46);
    ctx.fillStyle = '#ff4b4b';
    ctx.font = '900 42px monospace';
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 256, 94);
    ctx.fillStyle = '#9aa8c7';
    ctx.font = '700 18px monospace';
    ctx.fillText(`SHOT ${Math.ceil(Math.max(0, d.shotClock))}`, 256, 124);

    // Ticker bar
    ctx.fillStyle = d.onFireText ? '#ff5500' : '#181e38';
    ctx.fillRect(16, 140, 480, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(d.onFireText || 'GNOMERENA LIVE  •  GBA GJAM 2v2', 256, 165);
    jumboTex.needsUpdate = true;
  };

  drawJumbotron({
    homeAbbr: 'MOS', awayAbbr: 'RED', homeHex: '#228b22', awayHex: '#d92b2b',
    homeScore: 0, awayScore: 0, quarter: 1, clockSec: 60, shotClock: 24,
  });

  // Rim shake timers
  let leftShake = 0;
  let rightShake = 0;
  const dummy = new THREE.Object3D();

  return {
    root,
    leftHoop,
    rightHoop,
    shakeRim(side, strength) {
      if (side === 'left') leftShake = Math.max(leftShake, strength);
      else rightShake = Math.max(rightShake, strength);
    },
    updateJumbotron: drawJumbotron,
    setCourtTeams(home, away) {
      const old = courtMat.map;
      courtMat.map = makeCourtTexture(home.primaryHex, away.primaryHex);
      courtMat.needsUpdate = true;
      old?.dispose();
    },
    update(dt, time, excitement) {
      // Animate rim shudder after dunks
      if (leftShake > 0) {
        leftShake = Math.max(0, leftShake - dt * 2.4);
        leftHoop.rotation.z = Math.sin(time * 52) * 0.08 * leftShake;
      } else {
        leftHoop.rotation.z = 0;
      }
      if (rightShake > 0) {
        rightShake = Math.max(0, rightShake - dt * 2.4);
        rightHoop.rotation.z = Math.sin(time * 52) * 0.08 * rightShake;
      } else {
        rightHoop.rotation.z = 0;
      }

      // Spin the showcase trophy gently
      trophyDisplay.rotation.y = time * 0.8;

      // Animate cheering gnome crowd!
      const hopAmp = 0.045 + excitement * 0.32;
      const speedMul = 1 + excitement * 2.4;
      for (let i = 0; i < count; i++) {
        const g = crowdSpots[i];
        const hop = Math.abs(Math.sin(time * g.speed * speedMul + g.phase)) * hopAmp;
        const y = g.baseY + hop;

        dummy.position.set(g.baseX, y + 0.26, g.baseZ);
        dummy.rotation.set(0, g.rotY, Math.sin(time * 4 + g.phase) * 0.08 * (0.4 + excitement));
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bodies.setMatrixAt(i, dummy.matrix);

        dummy.position.set(g.baseX, y + 0.64, g.baseZ);
        dummy.updateMatrix();
        heads.setMatrixAt(i, dummy.matrix);

        dummy.position.set(g.baseX, y + 0.94, g.baseZ);
        dummy.updateMatrix();
        hats.setMatrixAt(i, dummy.matrix);
      }
      bodies.instanceMatrix.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true;
      hats.instanceMatrix.needsUpdate = true;
    },
  };
}
