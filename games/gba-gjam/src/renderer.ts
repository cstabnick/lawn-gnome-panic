// Three.js renderer for GBA GJAM: Indoor Gnomerena, @lawn/gnome players with custom
// basketball & dunk animations, @lawn/prefabs basketball, particles, and broadcast camera.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { buildGnomerena, type Gnomerena, type JumbotronData } from './arena';
import type { JamSimulation, SimPlayer } from './sim';
import type { ProTeam } from './types';

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class JamRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly arena: Gnomerena;

  private playerModels: GnomeModel[] = [];
  private playerRings: THREE.Mesh[] = [];
  private ballMesh: THREE.Group;
  private ballShadow: THREE.Mesh;
  private previewGnome: GnomeModel | null = null;
  private previewGroup: THREE.Group;
  private particles: Particle[] = [];
  private particleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);

  private camTarget = new THREE.Vector3(0, 1.4, 0);
  private camPos = new THREE.Vector3(0, 8.8, 13.8);
  private shake = 0;
  private elapsed = 0;
  private mode: 'attract' | 'preview' | 'match' = 'attract';
  private bigHead = false;
  private bigHeadOverlays = new WeakMap<GnomeModel, THREE.Group>();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0f20);
    this.scene.fog = new THREE.Fog(0x0d0f20, 26, 52);

    this.camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.2, 80);
    this.camera.position.copy(this.camPos);

    // Warm indoor Gnomerena stadium lighting
    const hemi = new THREE.HemisphereLight(0xfff5e4, 0x262945, 0.95);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff8ea, 1.35);
    key.position.set(6, 16, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 36;
    key.shadow.camera.left = -15;
    key.shadow.camera.right = 15;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    this.scene.add(key);

    const rimLight = new THREE.DirectionalLight(0x6699ff, 0.55);
    rimLight.position.set(-10, 10, -8);
    this.scene.add(rimLight);

    // Indoor Gnomerena!
    this.arena = buildGnomerena();
    this.scene.add(this.arena.root);

    // Regulation GBA Basketball from @lawn/prefabs
    this.ballMesh = buildPrefab('gba-basketball', { scale: 1.35 });
    this.ballMesh.visible = false;
    this.scene.add(this.ballMesh);

    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.26, 14),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 }),
    );
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.02;
    this.ballShadow.visible = false;
    this.scene.add(this.ballShadow);

    // Pedestal group for Custom Character Creator / Team Select 3D gnome preview
    this.previewGroup = new THREE.Group();
    this.previewGroup.position.set(0, 0, 2.2);
    this.scene.add(this.previewGroup);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  setMode(mode: 'attract' | 'preview' | 'match'): void {
    this.mode = mode;
    this.ballMesh.visible = mode === 'match';
    this.ballShadow.visible = mode === 'match';
    this.previewGroup.visible = mode === 'preview';
    for (const m of this.playerModels) m.object.visible = mode === 'match';
    for (const r of this.playerRings) r.visible = mode === 'match';
  }

  isBigHead(): boolean {
    return this.bigHead;
  }

  setBigHead(enabled: boolean): void {
    this.bigHead = enabled;
    for (const m of this.playerModels) {
      this.applyBigHeadToModel(m);
    }
    if (this.previewGnome) {
      this.applyBigHeadToModel(this.previewGnome);
    }
  }

  private applyBigHeadToModel(model: GnomeModel, look?: GnomeLook): void {
    const hat = model.hat;
    const parent = hat?.parent ?? model.object;
    let overlay = this.bigHeadOverlays.get(model);
    if (!this.bigHead) {
      if (overlay) overlay.visible = false;
      if (hat) {
        hat.scale.setScalar(1);
        hat.position.set(0, 1.12, -0.02);
      }
      return;
    }

    if (!overlay) {
      overlay = new THREE.Group();
      const skinColor = look?.skin ?? 0xf1c27d;
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.41, 18, 14),
        new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.72 }),
      );
      headMesh.position.set(0, 0.94, 0);
      headMesh.castShadow = true;

      const eyeGeo = new THREE.SphereGeometry(0.055, 10, 8);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.14, 0.98, 0.36);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.14, 0.98, 0.36);

      const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xe68a7c, roughness: 0.65 }),
      );
      nose.position.set(0, 0.9, 0.41);

      overlay.add(headMesh, leftEye, rightEye, nose);

      if (look?.beard !== null && look?.beard !== undefined) {
        const beard = new THREE.Mesh(
          new THREE.ConeGeometry(0.32, 0.44, 12),
          new THREE.MeshStandardMaterial({ color: look.beard, roughness: 0.88 }),
        );
        beard.rotation.x = Math.PI - 0.15;
        beard.position.set(0, 0.66, 0.25);
        overlay.add(beard);
      }

      parent.add(overlay);
      this.bigHeadOverlays.set(model, overlay);
    }

    overlay.visible = true;
    if (hat) {
      hat.scale.setScalar(2.1);
      hat.position.set(0, 1.56, -0.04);
    }
  }

  showPreviewGnome(look: GnomeLook): void {
    if (this.previewGnome) {
      this.previewGroup.remove(this.previewGnome.object);
      this.previewGnome = null;
    }
    const model = createGnomeModel(look);
    model.object.scale.setScalar(1.8);
    this.previewGroup.add(model.object);
    this.previewGnome = model;
    this.applyBigHeadToModel(model, look);
  }

  refreshPlayerLooks(sim: JamSimulation): void {
    for (let idx = 0; idx < sim.players.length; idx++) {
      const oldModel = this.playerModels[idx];
      if (!oldModel) continue;
      this.scene.remove(oldModel.object);
      const newModel = createGnomeModel(sim.players[idx].profile.look, { overrideEquipment: ['hand'] });
      newModel.object.scale.setScalar(1.25);
      newModel.object.visible = this.mode === 'match';
      this.scene.add(newModel.object);
      this.playerModels[idx] = newModel;
      this.applyBigHeadToModel(newModel, sim.players[idx].profile.look);
    }
  }

  mountMatch(sim: JamSimulation, home: ProTeam, away: ProTeam): void {
    // Clear previous models
    for (const m of this.playerModels) this.scene.remove(m.object);
    for (const r of this.playerRings) this.scene.remove(r);
    this.playerModels = [];
    this.playerRings = [];

    this.arena.setCourtTeams(home, away);

    sim.players.forEach((p, idx) => {
      const model = createGnomeModel(p.profile.look, { overrideEquipment: ['hand'] });
      model.object.scale.setScalar(1.25);
      this.scene.add(model.object);
      this.playerModels.push(model);
      this.applyBigHeadToModel(model, p.profile.look);

      const ringColor = p.team === 0 ? home.primary : away.primary;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.62, 20),
        new THREE.MeshBasicMaterial({ color: ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      this.scene.add(ring);
      this.playerRings.push(ring);
      void idx;
    });

    this.setMode('match');
  }

  punchCamera(strength: number): void {
    this.shake = Math.min(1.4, this.shake + strength);
  }

  spawnBurst(pos: THREE.Vector3, kind: 'fire' | 'confetti' | 'dust', color?: number): void {
    const count = kind === 'confetti' ? 24 : kind === 'fire' ? 18 : 10;
    const palette =
      kind === 'fire'
        ? [0xff3300, 0xff8800, 0xffee33]
        : kind === 'confetti'
          ? [0xffd21f, 0xff3366, 0x33ddff, 0x44ff77, 0xffffff]
          : [0xdcc79a, 0xc8b288];

    for (let i = 0; i < count; i++) {
      const c = color ?? palette[i % palette.length];
      const mat = new THREE.MeshBasicMaterial({ color: c });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.copy(pos);
      const speed = kind === 'confetti' ? 5.5 : 3.5;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * speed * 1.4,
        1.5 + Math.random() * speed,
        (Math.random() - 0.5) * speed * 1.4,
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0, maxLife: 0.45 + Math.random() * 0.45 });
    }
  }

  updateJumbotron(data: JumbotronData): void {
    this.arena.updateJumbotron(data);
  }

  render(dt: number, sim: JamSimulation | null): void {
    this.elapsed += dt;
    const excitement = sim ? sim.excitement : 0.25;
    this.arena.update(dt, this.elapsed, excitement);
    this.stepParticles(dt);

    if (this.mode === 'attract') {
      // Sweeping broadcast pan across the indoor Gnomerena!
      const angle = Math.sin(this.elapsed * 0.28) * 0.45;
      this.camera.position.set(Math.sin(angle) * 14, 7.6 + Math.sin(this.elapsed * 0.4) * 0.6, 14.5);
      this.camera.lookAt(0, 1.8, -1.5);
    } else if (this.mode === 'preview') {
      if (this.previewGnome) {
        this.previewGnome.object.rotation.y = this.elapsed * 1.1;
      }
      this.camera.position.set(0, 2.1, 6.2);
      this.camera.lookAt(0, 1.15, 2.2);
    } else if (this.mode === 'match' && sim) {
      this.syncMatchVisuals(sim, dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private syncMatchVisuals(sim: JamSimulation, dt: number): void {
    let activeDunker: SimPlayer | null = null;

    sim.players.forEach((p, idx) => {
      const model = this.playerModels[idx];
      const ring = this.playerRings[idx];
      if (!model || !ring) return;

      const state: PlayerState = {
        position: p.pos,
        velocity: p.vel,
        facing: p.facing,
        grounded: p.grounded,
        jumpsUsed: p.grounded ? 0 : 1,
      };
      model.update(state, dt);

      // Reset custom rig rotations before applying basketball pose overlays
      model.rig.rotation.set(0, 0, 0);

      if (p.dunk) {
        activeDunker = p;
        const u = Math.min(1, p.dunk.t / p.dunk.duration);
        if (p.dunk.style === 'frontflip' || p.dunk.style === 'meteor') {
          const turns = p.dunk.style === 'meteor' ? 2 : 1;
          model.rig.rotation.x = u * Math.PI * 2 * turns;
          model.arms.left.rotation.x = -2.8;
          model.arms.right.rotation.x = -2.8;
        } else if (p.dunk.style === 'spin720') {
          model.rig.rotation.y = u * Math.PI * 4;
          model.rig.rotation.z = Math.sin(u * Math.PI) * 0.28;
          model.arms.left.rotation.x = -2.3;
          model.arms.right.rotation.x = -2.8;
          if (Math.random() < 0.45) {
            this.spawnBurst(p.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), 'confetti');
          }
        } else if (p.dunk.style === 'partnerLaunch') {
          model.rig.rotation.x = u * Math.PI * 2;
          model.rig.rotation.y = u * Math.PI * 2;
          model.arms.left.rotation.x = -3.0;
          model.arms.right.rotation.x = -3.0;
          if (Math.random() < 0.5) {
            this.spawnBurst(p.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 'confetti');
          }
        } else if (p.dunk.style === 'alleyOop' || p.dunk.style === 'backboard') {
          model.rig.rotation.x = -0.35 + u * 0.55;
          model.arms.left.rotation.x = u < 0.72 ? -3.0 : -1.2;
          model.arms.right.rotation.x = u < 0.72 ? -3.0 : -1.2;
        } else if (p.dunk.style === 'helicopter360') {
          model.rig.rotation.y = u * Math.PI * 2;
          model.arms.left.rotation.x = -2.6;
          model.arms.right.rotation.x = -2.6;
        } else if (p.dunk.style === 'windmill') {
          model.arms.right.rotation.x = -u * Math.PI * 2.4;
          model.arms.left.rotation.x = -1.2;
        } else {
          // Tomahawk windup & hammer
          model.arms.right.rotation.x = u < 0.7 ? -3.0 : -1.1;
          model.arms.left.rotation.x = -1.6;
        }
      } else if (sim.players.some((o) => o.dunk?.style === 'partnerLaunch' && o.dunk.launcherIdx === idx && o.dunk.t < 0.4)) {
        // Partner boost/launch pose!
        model.arms.left.rotation.x = -2.95;
        model.arms.right.rotation.x = -2.95;
      } else if (p.stunTimer > 0) {
        // Knocked backward on clay back!
        model.rig.rotation.x = -1.25;
      } else if (p.shoveTimer > 0) {
        // Two-arm shove lunge!
        model.arms.left.rotation.x = -1.5;
        model.arms.right.rotation.x = -1.5;
      } else if (p.isShooting) {
        // Jump shot form!
        model.arms.right.rotation.x = -2.65;
        model.arms.left.rotation.x = -2.25;
      } else if (sim.ball.carrier === idx && p.grounded) {
        // Right arm dribbling pump!
        model.arms.right.rotation.x = -0.65 - Math.abs(Math.sin(sim.dribbleTick)) * 0.45;
      }

      // ON FIRE flame trail particles!
      if (p.onFire && Math.random() < 0.35) {
        this.spawnBurst(p.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), 'fire');
      }

      // Ground indicator ring (bright gold for P1, cyan for P2, subtle for AI)
      ring.position.set(p.pos.x, 0.03, p.pos.z);
      const isP1 = idx === sim.p1ControlIdx;
      const isP2 = (sim.config.opponentMode === 'local2p' || sim.config.opponentMode === 'online') && idx === sim.p2ControlIdx;
      const ringMat = ring.material as THREE.MeshBasicMaterial;
      if (isP1) {
        ringMat.color.setHex(0xffd21f);
        ringMat.opacity = 0.95;
        ring.scale.setScalar(1.18 + Math.sin(this.elapsed * 8) * 0.06);
      } else if (isP2) {
        ringMat.color.setHex(0x33eeff);
        ringMat.opacity = 0.95;
        ring.scale.setScalar(1.18 + Math.sin(this.elapsed * 8) * 0.06);
      } else {
        ringMat.color.setHex(p.team === 0 ? 0xffffff : 0xff6666);
        ringMat.opacity = sim.ball.carrier === idx ? 0.75 : 0.3;
        ring.scale.setScalar(0.95);
      }
    });

    // Sync ball prefab & shadow
    this.ballMesh.position.copy(sim.ball.pos);
    this.ballMesh.position.y -= 0.14; // prefab origin is bottom of sphere
    this.ballMesh.rotation.x = sim.ball.spin;
    this.ballMesh.rotation.z = sim.ball.spin * 0.6;
    this.ballShadow.position.set(sim.ball.pos.x, 0.025, sim.ball.pos.z);
    const shadowScale = Math.max(0.35, 1 - sim.ball.pos.y * 0.14);
    this.ballShadow.scale.setScalar(shadowScale);

    if (sim.ball.onFire && Math.random() < 0.55) {
      this.spawnBurst(sim.ball.pos.clone(), 'fire');
    }

    // Classic NBA Jam broadcast sideline camera!
    const focusX = THREE.MathUtils.clamp(sim.ball.pos.x * 0.62, -6.2, 6.2);
    const focusZ = THREE.MathUtils.clamp(sim.ball.pos.z * 0.22, -1.5, 1.5);
    const portrait = this.camera.aspect < 0.85;
    const baseDistZ = portrait ? 18.5 : 13.4;
    const baseY = portrait ? 10.2 : 8.2;

    const dunkZoom = activeDunker ? 0.78 : 1.0;
    const desiredPos = new THREE.Vector3(focusX, baseY * dunkZoom, baseDistZ * dunkZoom + focusZ);
    const desiredTarget = new THREE.Vector3(focusX * 1.08, activeDunker ? 2.1 : 1.35, focusZ);

    const k = 1 - Math.exp(-7 * dt);
    this.camPos.lerp(desiredPos, k);
    this.camTarget.lerp(desiredTarget, k);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.8);
      const s = this.shake * 0.35;
      this.camera.position.set(
        this.camPos.x + (Math.random() - 0.5) * s,
        this.camPos.y + (Math.random() - 0.5) * s,
        this.camPos.z + (Math.random() - 0.5) * s,
      );
    } else {
      this.camera.position.copy(this.camPos);
    }
    this.camera.lookAt(this.camTarget);
  }

  private stepParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        this.scene.remove(pt.mesh);
        (pt.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      pt.vel.y -= 10 * dt;
      pt.mesh.position.addScaledVector(pt.vel, dt);
      pt.mesh.rotation.x += dt * 8;
      pt.mesh.rotation.y += dt * 6;
      const s = 1 - pt.life / pt.maxLife;
      pt.mesh.scale.setScalar(s);
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
