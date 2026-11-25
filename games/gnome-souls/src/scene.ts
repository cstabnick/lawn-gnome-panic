// Semi-horror 3D scene for Gnome Souls: moonlit Sunken Spigot culvert, Kiln-Ember Shrine,
// articulated 18-segment hose boss (Slink), two-handed greatsword swings, lock-on & impact feedback.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import { createGnomeModel, GNORMAN_LOOK, resolveLook, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { buildHeld, buildPrefab } from '@lawn/prefabs';
import { BOSS, GREATSWORD_MOVES, PILLARS, PLAYER, WORLD } from './sim/config';
import type { BossEntity, EnemyEntity, PlayerEntity, WorldState } from './sim/types';

const HOLLOW_LOOK: GnomeLook = {
  hat: 0x3b2a2a,
  shirt: 0x26292e,
  pants: 0x1e2024,
  skin: 0x6e685f,
  boots: 0x161618,
  beard: 0x45423d,
  hair: null,
  freckles: false,
  dress: false,
  glasses: false,
};

const WARDEN_LOOK: GnomeLook = {
  ...HOLLOW_LOOK,
  hat: 0x4b2420,
  shirt: 0x3a261f,
  beard: 0x2e2a26,
};

interface PlayerRig {
  model: GnomeModel;
  sword: THREE.Object3D;
  slashRibbon: THREE.Mesh;
  lantern: THREE.PointLight | null;
  lastAction: string;
}

interface EnemyRig {
  group: THREE.Group;
  model: GnomeModel;
  hpBg: THREE.Mesh;
  hpFill: THREE.Mesh;
}

export class SoulsScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private playerRigs = new Map<number, PlayerRig>();
  private enemyRigs = new Map<number, EnemyRig>();
  private fogWall: THREE.Mesh;
  private hoseSegments: THREE.Mesh[] = [];
  private hoseJoints: THREE.Mesh[] = [];
  private nozzleGroup: THREE.Group;
  private nozzleCoreMat: THREE.MeshStandardMaterial;
  private waterBeam: THREE.Mesh;
  private telegraphCircle: THREE.Mesh;
  private telegraphBeam: THREE.Mesh;
  private emberLights: THREE.PointLight[] = [];

  private camTarget = new THREE.Vector3(0, 1.0, 40);
  private shakeTime = 0;
  private shakeIntensity = 0;
  private hitstopTimer = 0;
  private lockedEnemyId: number | null = null; // 999 = boss

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.fog = new THREE.FogExp2(0x080a10, 0.036);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.15, 160);

    const resize = () => {
      this.renderer.setSize(innerWidth, innerHeight, false);
      this.camera.aspect = innerWidth / Math.max(1, innerHeight);
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();

    // Lighting: eerie moonlit garden culvert
    const hemi = new THREE.HemisphereLight(0x4b5f8c, 0x161a24, 1.05);
    this.scene.add(hemi);

    const moon = new THREE.DirectionalLight(0x9cbcf5, 1.25);
    moon.position.set(16, 28, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.near = 2;
    moon.shadow.camera.far = 90;
    const d = 32;
    moon.shadow.camera.left = -d;
    moon.shadow.camera.right = d;
    moon.shadow.camera.top = d;
    moon.shadow.camera.bottom = -d;
    this.scene.add(moon);

    this.buildEnvironment();

    // Mist Curtain at z = -6
    const fogGeo = new THREE.PlaneGeometry(WORLD.corridorHalfW * 2 - 0.1, 4.6);
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0xaec2de,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.fogWall = new THREE.Mesh(fogGeo, fogMat);
    this.fogWall.position.set(0, 2.3, WORLD.fogGateZ);
    this.scene.add(this.fogWall);

    // Boss: Slink, the Uncoiled Hose (18 articulated segments + brass nozzle)
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0x1d4728, roughness: 0.55, metalness: 0.1 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8f7438, roughness: 0.4, metalness: 0.75 });
    const segGeo = new THREE.CylinderGeometry(BOSS.segmentRadius * 0.92, BOSS.segmentRadius, 1, 10);
    const jointGeo = new THREE.SphereGeometry(BOSS.segmentRadius * 0.98, 10, 8);
    const ringGeo = new THREE.TorusGeometry(BOSS.segmentRadius * 0.96, 0.06, 6, 12);

    for (let i = 0; i < BOSS.segmentCount - 1; i++) {
      const m = new THREE.Mesh(segGeo, hoseMat);
      m.castShadow = true;
      this.scene.add(m);
      this.hoseSegments.push(m);

      const j = new THREE.Mesh(jointGeo, i % 3 === 0 ? ringMat : hoseMat);
      j.castShadow = true;
      if (i % 3 === 0) {
        const r = new THREE.Mesh(ringGeo, ringMat);
        r.rotation.x = Math.PI / 2;
        j.add(r);
      }
      this.scene.add(j);
      this.hoseJoints.push(j);
    }

    // Brass Nozzle Head
    this.nozzleGroup = new THREE.Group();
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb8903a, roughness: 0.35, metalness: 0.82 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.5, metalness: 0.8 });
    this.nozzleCoreMat = new THREE.MeshStandardMaterial({
      color: 0xff8822,
      emissive: 0xff6600,
      emissiveIntensity: 0.8,
      roughness: 0.25,
    });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.52, 0.55, 12), brassMat);
    collar.rotation.x = Math.PI / 2;
    this.nozzleGroup.add(collar);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.60, 0.85, 12), darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.72;
    this.nozzleGroup.add(barrel);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), this.nozzleCoreMat);
    tip.position.z = 1.15;
    this.nozzleGroup.add(tip);
    const nozzleGlow = new THREE.PointLight(0xff7722, 2.4, 16, 1.4);
    nozzleGlow.position.set(0, 0.4, 1.2);
    this.nozzleGroup.add(nozzleGlow);
    this.nozzleGroup.castShadow = true;
    this.scene.add(this.nozzleGroup);

    // Water jet beam
    const beamGeo = new THREE.CylinderGeometry(0.35, 0.65, 18, 10);
    beamGeo.translate(0, 9, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x7ae8ff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.waterBeam = new THREE.Mesh(beamGeo, beamMat);
    this.waterBeam.visible = false;
    this.scene.add(this.waterBeam);

    // Ground telegraphs (using @lawn/depth LAYER.marker to avoid z-fighting)
    const tCircleMat = flatLayer(
      new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.35, depthWrite: false }),
      LAYER.marker,
    );
    this.telegraphCircle = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.0, 32), tCircleMat);
    this.telegraphCircle.rotation.x = -Math.PI / 2;
    this.telegraphCircle.position.y = 0.03;
    this.telegraphCircle.visible = false;
    this.scene.add(this.telegraphCircle);

    const tBeamMat = flatLayer(
      new THREE.MeshBasicMaterial({ color: 0x4cd8ff, transparent: true, opacity: 0.32, depthWrite: false }),
      LAYER.marker,
    );
    const tBeamGeo = new THREE.PlaneGeometry(1.4, 18);
    tBeamGeo.translate(0, 9, 0);
    tBeamGeo.rotateX(-Math.PI / 2);
    this.telegraphBeam = new THREE.Mesh(tBeamGeo, tBeamMat);
    this.telegraphBeam.position.y = 0.04;
    this.telegraphBeam.visible = false;
    this.scene.add(this.telegraphBeam);
  }

  private buildEnvironment(): void {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x262b34, roughness: 0.92, metalness: 0.05 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x191d24, roughness: 0.95, metalness: 0.05 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b1e26, roughness: 0.95 });
    const mossMat = flatLayer(
      new THREE.MeshStandardMaterial({ color: 0x1c2c22, roughness: 0.92 }),
      LAYER.area,
    );
    const puddleMat = flatLayer(
      new THREE.MeshStandardMaterial({ color: 0x111a26, roughness: 0.12, metalness: 0.65 }),
      LAYER.marking,
    );

    // Damp Walk floor
    const corridorFloor = new THREE.Mesh(new THREE.BoxGeometry(WORLD.corridorHalfW * 2, 0.4, 52), stoneMat);
    corridorFloor.position.set(0, -0.2, 19);
    corridorFloor.receiveShadow = true;
    this.scene.add(corridorFloor);

    // Sunken Spigot Basin circular floor (slightly inset/distinct plane with flatLayer)
    const basinFloor = new THREE.Mesh(new THREE.CylinderGeometry(WORLD.basinRadius + 0.5, WORLD.basinRadius + 0.5, 0.4, 36), darkStoneMat);
    basinFloor.position.set(WORLD.basinCenter.x, -0.22, WORLD.basinCenter.z);
    basinFloor.receiveShadow = true;
    this.scene.add(basinFloor);

    // Moss & puddles (flatLayer, zero z-fighting)
    const puddleOffsets: [number, number, number][] = [
      [-2.1, 31, 2.0], [1.8, 19, 2.3], [-1.5, 6, 1.9],
      [-5, -24, 3.8], [6, -32, 4.2], [0, -21, 3.2],
    ];
    for (const [px, pz, pr] of puddleOffsets) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(pr, 18), puddleMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(px, 0.01, pz);
      this.scene.add(m);
    }

    const mossRing = new THREE.Mesh(new THREE.RingGeometry(10, 17.5, 32), mossMat);
    mossRing.rotation.x = -Math.PI / 2;
    mossRing.position.set(WORLD.basinCenter.x, 0.005, WORLD.basinCenter.z);
    this.scene.add(mossRing);

    // Corridor walls (leave non-flush margins)
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.2, 52), wallMat);
      wall.position.set(side * (WORLD.corridorHalfW + 0.72), 2.5, 19);
      wall.receiveShadow = true;
      this.scene.add(wall);
    }
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(WORLD.corridorHalfW * 2 + 2.8, 5.2, 1.4), wallMat);
    backWall.position.set(0, 2.5, WORLD.corridorMaxZ + 0.72);
    this.scene.add(backWall);

    // Basin perimeter wall segments (open at doorway z = -10)
    const segs = 22;
    for (let i = 0; i < segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const wx = Math.cos(ang) * (WORLD.basinRadius + 0.75);
      const wz = WORLD.basinCenter.z + Math.sin(ang) * (WORLD.basinRadius + 0.75);
      if (wz > -12 && Math.abs(wx) < 5.6) continue;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.4, 1.4), wallMat);
      seg.position.set(wx, 2.6, wz);
      seg.rotation.y = -ang + Math.PI / 2;
      seg.receiveShadow = true;
      this.scene.add(seg);
    }

    // Pillars
    for (const pil of PILLARS) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(pil.r * 0.92, pil.r, pil.h, 10), stoneMat);
      col.position.set(pil.x, pil.h / 2, pil.z);
      col.castShadow = true;
      col.receiveShadow = true;
      this.scene.add(col);
    }

    // Giant Wall Spigot at (0, 2.2, -45.5)
    const spigotBrass = new THREE.MeshStandardMaterial({ color: 0x7e6836, roughness: 0.45, metalness: 0.75 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 12), spigotBrass);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 2.2, -46.2);
    this.scene.add(pipe);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.16, 8, 16), spigotBrass);
    wheel.position.set(0, 4.1, -45.5);
    this.scene.add(wheel);

    // Kiln-Ember Shrine brazier + warm flickering lights
    const shrine = buildPrefab('kiln-brazier', { scale: 1.25 });
    shrine.position.set(WORLD.shrinePos.x, 0, WORLD.shrinePos.z);
    this.scene.add(shrine);

    const lightSpots: [number, number, number, number][] = [
      [WORLD.shrinePos.x, 1.2, WORLD.shrinePos.z, 2.8],
      [-4.6, 2.1, 26, 1.5],
      [4.6, 2.1, 8, 1.5],
      [-11, 2.4, -22, 1.4],
      [11, 2.4, -34, 1.4],
    ];
    for (const [lx, ly, lz, intensity] of lightSpots) {
      const pl = new THREE.PointLight(0xff7d28, intensity, 15, 1.6);
      pl.position.set(lx, ly, lz);
      this.scene.add(pl);
      this.emberLights.push(pl);
    }
  }

  addShake(intensity: number, duration = 0.2): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  addHitstop(duration: number): void {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  consumeHitstop(dt: number): boolean {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return true;
    }
    return false;
  }

  toggleLockOn(state: WorldState, localId: number): number | null {
    if (this.lockedEnemyId !== null) {
      this.lockedEnemyId = null;
      return null;
    }
    const me = state.players.find((p) => p.id === localId);
    if (!me) return null;

    let bestId: number | null = null;
    let bestD = 24;
    for (const e of state.enemies) {
      if (e.state === 'dead') continue;
      const d = Math.hypot(e.x - me.x, e.z - me.z);
      if (d < bestD) {
        bestD = d;
        bestId = e.id;
      }
    }
    if (state.boss.active && state.boss.alive) {
      const nozzle = state.boss.segments[state.boss.segments.length - 1];
      const d = Math.hypot(nozzle.x - me.x, nozzle.z - me.z);
      if (d < 28 && d <= bestD + 4) {
        bestId = 999;
      }
    }
    this.lockedEnemyId = bestId;
    return bestId;
  }

  getLockWorldPos(state: WorldState): THREE.Vector3 | null {
    if (this.lockedEnemyId === null) return null;
    if (this.lockedEnemyId === 999) {
      if (!state.boss.active || !state.boss.alive) {
        this.lockedEnemyId = null;
        return null;
      }
      const n = state.boss.segments[state.boss.segments.length - 1];
      return new THREE.Vector3(n.x, n.y, n.z);
    }
    const e = state.enemies.find((x) => x.id === this.lockedEnemyId && x.state !== 'dead');
    if (!e) {
      this.lockedEnemyId = null;
      return null;
    }
    return new THREE.Vector3(e.x, 0.8, e.z);
  }

  rebuildPlayerLooks(): void {
    for (const rig of this.playerRigs.values()) {
      this.scene.remove(rig.model.object);
    }
    this.playerRigs.clear();
  }

  private ensurePlayerRig(p: PlayerEntity, isLocal: boolean): PlayerRig {
    let rig = this.playerRigs.get(p.id);
    if (rig) return rig;

    const baseLook = resolveLook({ id: p.id, character: p.character, userId: p.userId }) ?? GNORMAN_LOOK;
    const look: GnomeLook = isLocal ? baseLook : { ...baseLook, hat: p.color };
    const model = createGnomeModel(look, { overrideEquipment: ['hand'] });
    model.object.castShadow = true;

    const sword = buildHeld('kiln-breaker-greatsword');
    sword.scale.setScalar(1.25);
    model.arms.right.add(sword);

    const ribbonGeo = new THREE.RingGeometry(1.1, 2.35, 24, 1, -Math.PI * 0.45, Math.PI * 0.9);
    ribbonGeo.rotateX(-Math.PI / 2);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0xffb866,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slashRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    slashRibbon.position.y = 0.65;
    slashRibbon.visible = false;
    model.object.add(slashRibbon);

    let lantern: THREE.PointLight | null = null;
    if (isLocal) {
      lantern = new THREE.PointLight(0xffb46b, 1.9, 13, 1.5);
      lantern.position.set(0, 1.25, 0.15);
      model.object.add(lantern);
    }

    this.scene.add(model.object);
    rig = { model, sword, slashRibbon, lantern, lastAction: 'idle' };
    this.playerRigs.set(p.id, rig);
    return rig;
  }

  private ensureEnemyRig(e: EnemyEntity): EnemyRig {
    let rig = this.enemyRigs.get(e.id);
    if (rig) return rig;

    const group = new THREE.Group();
    const look = e.kind === 'shovel-warden' ? WARDEN_LOOK : HOLLOW_LOOK;
    const model = createGnomeModel(look, { overrideEquipment: ['hand'] });
    if (e.kind === 'shovel-warden') model.object.scale.setScalar(1.42);
    const weapon = buildHeld(e.kind === 'shovel-warden' ? 'iron-trowel' : 'old-trowel');
    if (e.kind === 'shovel-warden') weapon.scale.setScalar(1.65);
    model.arms.right.add(weapon);
    group.add(model.object);

    // Eerie glowing eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: e.kind === 'shovel-warden' ? 0xff4d2a : 0xffb84d });
    for (const sx of [-0.07, 0.07]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), eyeMat);
      eye.position.set(sx, e.kind === 'shovel-warden' ? 0.96 : 0.68, e.kind === 'shovel-warden' ? 0.25 : 0.18);
      group.add(eye);
    }

    // Floating enemy HP bar
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.09),
      new THREE.MeshBasicMaterial({ color: 0x111216, side: THREE.DoubleSide }),
    );
    hpBg.position.y = e.kind === 'shovel-warden' ? 1.85 : 1.4;
    group.add(hpBg);
    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xb82929, side: THREE.DoubleSide }),
    );
    hpFill.position.z = 0.01;
    hpBg.add(hpFill);

    this.scene.add(group);
    rig = { group, model, hpBg, hpFill };
    this.enemyRigs.set(e.id, rig);
    return rig;
  }

  sync(state: WorldState, localId: number, camYaw: number, camPitch: number, dt: number): void {
    // Flicker shrine/culvert lights
    for (let i = 0; i < this.emberLights.length; i++) {
      this.emberLights[i].intensity = (i === 0 ? 2.8 : 1.45) + Math.sin(state.time * 8 + i * 2.1) * 0.25;
    }

    this.fogWall.visible = !state.fogOpen;
    if (!state.fogOpen) {
      (this.fogWall.material as THREE.MeshBasicMaterial).opacity = 0.36 + Math.sin(state.time * 2.2) * 0.08;
    }

    // Players
    const activeIds = new Set(state.players.map((p) => p.id));
    for (const [id, rig] of this.playerRigs) {
      if (!activeIds.has(id)) {
        this.scene.remove(rig.model.object);
        this.playerRigs.delete(id);
      }
    }

    for (const p of state.players) {
      const rig = this.ensurePlayerRig(p, p.id === localId);
      const pos = new THREE.Vector3(p.x, p.y, p.z);
      const vel = new THREE.Vector3(p.vx, 0, p.vz);
      rig.model.setDead(p.action === 'dead');
      rig.model.update(
        { position: pos, velocity: vel, facing: p.facing, grounded: true, jumpsUsed: 0 },
        dt,
      );

      // Two-handed greatsword pose + roll somersault
      rig.model.rig.rotation.x = 0;
      rig.model.rig.rotation.y = 0;
      rig.slashRibbon.visible = false;

      if (p.action === 'roll') {
        const u = Math.min(1, p.actionTimer / PLAYER.rollDuration);
        rig.model.rig.rotation.x = u * Math.PI * 2;
      } else if (p.action === 'attack' && p.attackId) {
        const spec = GREATSWORD_MOVES[p.attackId];
        const total = spec.startup + spec.active + spec.recovery;
        const u = Math.min(1, p.actionTimer / total);
        const swingProg = Math.min(1, Math.max(0, (p.actionTimer - spec.startup * 0.5) / (spec.active + spec.startup * 0.5)));
        const dir = p.attackId === 'r1_2' ? -1 : 1;
        if (p.attackId === 'r1_3' || p.attackId === 'r2') {
          rig.model.arms.right.rotation.x = -2.2 + swingProg * 2.6;
          rig.model.arms.left.rotation.x = -2.0 + swingProg * 2.4;
        } else {
          rig.model.rig.rotation.y = dir * (-0.8 + swingProg * 1.6);
          rig.model.arms.right.rotation.x = -1.25;
          rig.model.arms.left.rotation.x = -1.1;
          rig.model.arms.right.rotation.z = dir * (-0.9 + swingProg * 1.8);
        }
        if (p.actionTimer >= spec.startup && p.actionTimer <= spec.startup + spec.active) {
          rig.slashRibbon.visible = true;
          rig.slashRibbon.rotation.y = dir * (u * 1.5);
        }
      } else if (p.action === 'guard') {
        rig.model.arms.right.rotation.x = -1.15;
        rig.model.arms.left.rotation.x = -1.15;
        rig.model.arms.right.rotation.z = 0.35;
      } else if (p.action === 'flask') {
        rig.model.arms.right.rotation.x = -1.9;
        rig.model.arms.left.rotation.x = -0.5;
      } else {
        // Resting two-handed carry
        rig.model.arms.right.rotation.x = -0.65;
        rig.model.arms.left.rotation.x = -0.75;
        rig.model.arms.right.rotation.z = 0.18;
      }
    }

    // Enemies
    for (const e of state.enemies) {
      const rig = this.ensureEnemyRig(e);
      if (e.state === 'dead') {
        rig.group.visible = false;
        continue;
      }
      rig.group.visible = true;
      rig.group.position.set(e.x, 0, e.z);
      rig.model.update(
        {
          position: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3(0, 0, e.state === 'chase' ? 3 : 0),
          facing: e.facing,
          grounded: true,
          jumpsUsed: 0,
        },
        dt,
      );
      if (e.state === 'windup') {
        rig.model.arms.right.rotation.x = -2.2;
      } else if (e.state === 'active') {
        rig.model.arms.right.rotation.x = 0.4;
      } else if (e.state === 'stagger') {
        rig.model.rig.rotation.x = 0.35;
      } else {
        rig.model.rig.rotation.x = 0;
      }
      rig.hpBg.visible = e.hp < e.maxHp;
      rig.hpBg.lookAt(this.camera.position);
      const frac = Math.max(0.01, e.hp / e.maxHp);
      rig.hpFill.scale.x = frac;
      rig.hpFill.position.x = -0.43 * (1 - frac);
    }

    // Boss (Slink)
    this.syncBoss(state.boss);

    // Camera (with lock-on or free orbit)
    const me = state.players.find((p) => p.id === localId);
    if (me) {
      const desiredTarget = new THREE.Vector3(me.x, 1.15, me.z);
      this.camTarget.lerp(desiredTarget, Math.min(1, dt * 14));

      let useYaw = camYaw;
      const lockPos = this.getLockWorldPos(state);
      if (lockPos) {
        useYaw = Math.atan2(me.x - lockPos.x, me.z - lockPos.z);
      }

      const dist = 5.4;
      const horiz = Math.cos(camPitch) * dist;
      const vert = Math.sin(camPitch) * dist + 1.1;
      let cx = this.camTarget.x + Math.sin(useYaw) * horiz;
      let cz = this.camTarget.z + Math.cos(useYaw) * horiz;
      const cy = Math.max(0.6, this.camTarget.y + vert);

      // Keep camera inside corridor walls
      if (cz > WORLD.fogGateZ) {
        cx = Math.max(-WORLD.corridorHalfW + 0.4, Math.min(WORLD.corridorHalfW - 0.4, cx));
      }

      if (this.shakeTime > 0) {
        this.shakeTime = Math.max(0, this.shakeTime - dt);
        cx += (Math.random() - 0.5) * this.shakeIntensity;
        cz += (Math.random() - 0.5) * this.shakeIntensity;
      } else {
        this.shakeIntensity = 0;
      }

      this.camera.position.set(cx, cy, cz);
      if (lockPos) {
        const mid = new THREE.Vector3().lerpVectors(this.camTarget, lockPos, 0.35);
        this.camera.lookAt(mid);
      } else {
        this.camera.lookAt(this.camTarget);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private syncBoss(boss: BossEntity): void {
    const pts = boss.segments;
    if (pts.length < 2) return;
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < this.hoseSegments.length; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const segMesh = this.hoseSegments[i];
      const jointMesh = this.hoseJoints[i];
      const va = new THREE.Vector3(a.x, a.y, a.z);
      const vb = new THREE.Vector3(b.x, b.y, b.z);
      const dir = new THREE.Vector3().subVectors(vb, va);
      const len = Math.max(0.05, dir.length());

      segMesh.position.lerpVectors(va, vb, 0.5);
      segMesh.scale.set(1, len, 1);
      segMesh.quaternion.setFromUnitVectors(up, dir.normalize());
      jointMesh.position.copy(va);
    }

    const prev = pts[pts.length - 2];
    const head = pts[pts.length - 1];
    this.nozzleGroup.position.set(head.x, head.y, head.z);
    this.nozzleGroup.lookAt(head.x + (head.x - prev.x), head.y + (head.y - prev.y) * 0.4, head.z + (head.z - prev.z));

    const isWindup =
      boss.attack === 'whip_left' ||
      boss.attack === 'whip_right' ||
      boss.attack === 'nozzle_slam' ||
      boss.attack === 'water_jet' ||
      boss.attack === 'frenzy_combo';
    if (boss.phase === 2) {
      this.nozzleCoreMat.color.setHex(0x66e8ff);
      this.nozzleCoreMat.emissive.setHex(0x28b8ff);
      this.nozzleCoreMat.emissiveIntensity = isWindup ? 1.8 : 0.9;
    } else {
      this.nozzleCoreMat.color.setHex(0xff8822);
      this.nozzleCoreMat.emissive.setHex(0xff5500);
      this.nozzleCoreMat.emissiveIntensity = isWindup ? 1.6 : 0.6;
    }

    // Telegraphs & Water Jet Beam
    this.telegraphCircle.visible = false;
    this.telegraphBeam.visible = false;
    this.waterBeam.visible = false;

    if (boss.telegraph) {
      if (boss.telegraph.kind === 'circle') {
        this.telegraphCircle.visible = true;
        this.telegraphCircle.position.set(boss.telegraph.x, 0.03, boss.telegraph.z);
        this.telegraphCircle.scale.setScalar(boss.telegraph.radius);
        (this.telegraphCircle.material as THREE.MeshBasicMaterial).opacity = 0.25 + boss.telegraph.alpha * 0.45;
      } else if (boss.telegraph.kind === 'beam') {
        if (boss.attack === 'water_jet' && boss.timer * 1.15 >= 1.0 && boss.timer * 1.15 < 2.2) {
          this.waterBeam.visible = true;
          this.waterBeam.position.set(head.x, head.y, head.z);
          this.waterBeam.rotation.y = boss.telegraph.angle;
        } else {
          this.telegraphBeam.visible = true;
          this.telegraphBeam.position.set(boss.telegraph.x, 0.04, boss.telegraph.z);
          this.telegraphBeam.rotation.y = boss.telegraph.angle;
        }
      }
    }
  }

  projectToScreen(pos: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const v = pos.clone().project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * innerWidth,
      y: (-v.y * 0.5 + 0.5) * innerHeight,
      visible: v.z < 1,
    };
  }
}
