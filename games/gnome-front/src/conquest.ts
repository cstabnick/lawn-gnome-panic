// src/conquest.ts: flags, capturing, tickets, spawn points, win condition.
import * as THREE from 'three';
import {
  BASES,
  FLAGS,
  NEUTRAL_COLOR,
  TEAM_COLORS,
  TUNING,
  type FlagDef,
  type FlagState,
  type Game,
  type Team,
} from './config';
import { heightAt } from './terrain';

interface FlagVisual {
  group: THREE.Group;
  cloth: THREE.Mesh;
  clothMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshBasicMaterial;
  phase: number;
}

const visuals = new Map<FlagDef['id'], FlagVisual>();
let clock = 0;       // seconds of play, for waving and pulsing
let bleedAcc = 0;    // seconds the team with fewer flags has been bleeding
const scratchColor = new THREE.Color();
const leadColor = new THREE.Color();

function letterSprite(letter: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#222222';
    ctx.strokeText(letter, 64, 68);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(letter, 64, 68);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 1.6, 1);
  return sprite;
}

/** Creates the neutral flags and their visuals (pole, cloth, ground ring). */
export function createFlags(scene: THREE.Scene): FlagState[] {
  visuals.clear();
  clock = 0;
  bleedAcc = 0;
  const flags: FlagState[] = [];

  for (const def of FLAGS) {
    const group = new THREE.Group();
    group.position.set(def.x, heightAt(def.x, def.z), def.z);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 6, 8).translate(0, 3, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    );
    pole.castShadow = true;
    group.add(pole);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd54a, metalness: 0.6, roughness: 0.3 }),
    );
    ball.position.y = 6.1;
    group.add(ball);

    // Cloth is offset so its left edge sits on the pole; its pivot is the pole.
    const clothMat = new THREE.MeshStandardMaterial({ color: NEUTRAL_COLOR, side: THREE.DoubleSide });
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1).translate(0.9, 0, 0), clothMat);
    cloth.position.y = 1.6;
    cloth.castShadow = true;
    group.add(cloth);

    const ringMat = new THREE.MeshBasicMaterial({
      color: NEUTRAL_COLOR,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(TUNING.captureRadius - 0.35, TUNING.captureRadius, 48).rotateX(-Math.PI / 2),
      ringMat,
    );
    ring.position.y = 0.06;
    group.add(ring);

    const label = letterSprite(def.id);
    label.position.y = 7.4;
    group.add(label);

    scene.add(group);
    visuals.set(def.id, { group, cloth, clothMat, ringMat, phase: def.x * 0.05 });
    flags.push({ def, owner: null, progress: 0, contested: false });
  }
  return flags;
}

/** Where a team may spawn: its HQ first, then each flag it owns. yaw faces the middle of the map. */
export function spawnPoints(game: Game, team: Team): { x: number; z: number; yaw: number }[] {
  const points: { x: number; z: number; yaw: number }[] = [{ ...BASES[team] }];
  for (const f of game.flags) {
    if (f.owner === team) points.push({ x: f.def.x, z: f.def.z, yaw: BASES[team].yaw });
  }
  return points;
}

/** Capture progress, ownership changes, ticket bleed, flag visuals and the end of the match. */
export function updateConquest(game: Game, dt: number): void {
  clock += dt;
  const r2 = TUNING.captureRadius * TUNING.captureRadius;

  // Capture progress and ownership.
  for (const f of game.flags) {
    let n0 = 0;
    let n1 = 0;
    for (const s of game.soldiers) {
      if (!s.alive) continue;
      const dx = s.pos.x - f.def.x;
      const dz = s.pos.z - f.def.z;
      if (dx * dx + dz * dz > r2) continue;
      if (s.team === 0) n0++;
      else n1++;
    }
    f.contested = n0 > 0 && n1 > 0;

    const diff = n0 - n1;
    if (diff !== 0) {
      const rate = Math.sign(diff) * Math.min(Math.abs(diff), TUNING.maxCaptureAdvantage) * TUNING.captureRatePerS;
      f.progress = Math.max(-1, Math.min(1, f.progress + rate * dt));
    }

    if (f.owner === 0 && f.progress <= 0) {
      f.owner = null;
      game.emit({ type: 'flagLost', flag: f, team: 0 });
    } else if (f.owner === 1 && f.progress >= 0) {
      f.owner = null;
      game.emit({ type: 'flagLost', flag: f, team: 1 });
    } else if (f.owner === null) {
      if (f.progress >= 1) {
        f.owner = 0;
        game.emit({ type: 'flagCaptured', flag: f, team: 0 });
      } else if (f.progress <= -1) {
        f.owner = 1;
        game.emit({ type: 'flagCaptured', flag: f, team: 1 });
      }
    }
  }

  // Ticket bleed: the team holding fewer flags loses one ticket per interval.
  const owned: [number, number] = [0, 0];
  for (const f of game.flags) {
    if (f.owner !== null) owned[f.owner]++;
  }
  if (owned[0] === owned[1]) {
    bleedAcc = 0;
  } else {
    bleedAcc += dt;
    if (bleedAcc >= TUNING.bleedIntervalS) {
      bleedAcc -= TUNING.bleedIntervalS;
      const loser: Team = owned[0] < owned[1] ? 0 : 1;
      game.tickets[loser] = Math.max(0, game.tickets[loser] - 1);
    }
  }

  // End of match.
  if (!game.over) {
    if (game.tickets[0] <= 0) {
      const winner: Team = 1;
      game.over = true;
      game.winner = winner;
      game.emit({ type: 'gameOver', winner });
    } else if (game.tickets[1] <= 0) {
      const winner: Team = 0;
      game.over = true;
      game.winner = winner;
      game.emit({ type: 'gameOver', winner });
    }
  }

  // Visuals.
  for (const f of game.flags) {
    const v = visuals.get(f.def.id);
    if (!v) continue;
    if (f.owner !== null) {
      scratchColor.setHex(TEAM_COLORS[f.owner]);
    } else {
      const lead: Team = f.progress >= 0 ? 0 : 1;
      scratchColor
        .setHex(NEUTRAL_COLOR)
        .lerp(leadColor.setHex(TEAM_COLORS[lead]), Math.abs(f.progress));
    }
    v.clothMat.color.copy(scratchColor);
    v.ringMat.color.copy(scratchColor);

    v.cloth.position.y = 1.6 + 4 * Math.abs(f.progress);
    v.cloth.rotation.y = 0.15 * Math.sin(clock * 3 + v.phase);

    v.ringMat.opacity = f.contested ? 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(clock * 8)) : 0.6;
  }
}
