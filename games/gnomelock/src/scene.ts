// Three.js 3D renderer for Gnomelock (The Bramble District):
// - Terrain, flatLayer markings (@lawn/depth), non-flush parkour walls & towers (no z-fighting!)
// - Player gnomes via @lawn/gnome + @lawn/prefabs held weapons
// - Creeps with execute-pip HP bars, Soul Acorn Orbs, 5-min Gilded Relic, tracers, clay shatter particles, and 3rd-person camera.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import {
  createGnomeModel,
  getMyGnome,
  GNORMAN_LOOK,
  onLooksChanged,
  resolveLook,
  type GnomeLook,
  type GnomeModel,
} from '@lawn/gnome';
import { buildHeld } from '@lawn/prefabs';
import { TEAM_COLORS, type Team } from './sim/config';
import { HEROES } from './sim/heroes';
import {
  FOUNTAINS,
  groundHeightAt,
  MAP_BOUNDS,
  MAP_WALLS,
  RELIC_ALTAR,
  SHOPS,
  STRUCTURES,
} from './sim/map';
import type { HeroEntity, MatchState, SimEvent } from './sim/world';

interface Tracer {
  line: THREE.Line;
  ttl: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  ttl: number;
}

interface TowerVisual {
  group: THREE.Group;
  shieldMesh: THREE.Mesh;
  beamLine: THREE.Line;
  hpBarFill: THREE.Mesh;
}

export class GnomelockScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private heroModels = new Map<number, { model: GnomeModel; weaponName: string; team: Team; shieldRing: THREE.Mesh }>();
  private creepMeshes = new Map<number, { group: THREE.Group; hpFill: THREE.Mesh; execPip: THREE.Mesh }>();
  private orbMeshes = new Map<number, THREE.Group>();
  private turretMeshes = new Map<number, THREE.Group>();
  private zoneMeshes = new Map<number, THREE.Mesh>();
  private towerVisuals = new Map<string, TowerVisual>();
  private relicGroup: THREE.Group;
  private relicCrystal: THREE.Mesh;
  private tracers: Tracer[] = [];
  private particles: Particle[] = [];
  private currentFov = 74;
  private camPos = new THREE.Vector3(0, 6, -120);
  private camLook = new THREE.Vector3(0, 3, -100);
  private lastHeroMeta = new Map<number, { userId?: string; characterCode?: string; team: Team }>();
  private recoilTimers = new Map<number, number>();
  private muzzleLight: THREE.PointLight;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b2236);
    this.scene.fog = new THREE.Fog(0x1b2236, 75, 195);

    this.camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.15, 260);

    // Lighting: twilight garden + warm Amber Hearth & cool Sapphire Well accents
    const hemi = new THREE.HemisphereLight(0xaec6ff, 0x3b4d2b, 1.05);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe6c2, 1.35);
    sun.position.set(42, 68, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 190;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 130;
    sun.shadow.camera.bottom = -130;
    this.scene.add(sun);

    const amberLight = new THREE.PointLight(0xff6b35, 3.5, 45);
    amberLight.position.set(0, 7, -110);
    this.scene.add(amberLight);

    const sapphireLight = new THREE.PointLight(0x3a86ff, 3.5, 45);
    sapphireLight.position.set(0, 7, 110);
    this.scene.add(sapphireLight);

    this.muzzleLight = new THREE.PointLight(0xffd54f, 0, 12);
    this.scene.add(this.muzzleLight);

    this.buildArena();
    const relic = this.buildRelicAltar();
    this.relicGroup = relic.group;
    this.relicCrystal = relic.crystal;

    window.addEventListener('resize', this.onResize);
    onLooksChanged(() => {
      // Rebuild remote hero models when prefetchLooks resolves gear
      for (const [slot] of this.heroModels) {
        if (slot !== 0) this.removeHeroModel(slot);
      }
    });
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private buildArena(): void {
    // 1. Deformed terrain mesh matching groundHeightAt(x, z)
    const w = MAP_BOUNDS.maxX - MAP_BOUNDS.minX;
    const d = MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ;
    const geo = new THREE.PlaneGeometry(w, d, 38, 122);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = groundHeightAt(x, z);
      pos.setY(i, y);

      if (Math.abs(x) < 6.5) {
        c.setHex(0x4b4a46); // Cobble lane
      } else if (Math.abs(x) > 19 && Math.abs(z) < 46) {
        c.setHex(0x3c6b37); // Elevated garden terrace grass
      } else {
        c.setHex(0x2f542d); // Turf
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const groundMat = flatLayer(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }), LAYER.ground);
    const ground = new THREE.Mesh(geo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Center courtyard ring & lane stripes using @lawn/depth
    const ringGeo = new THREE.RingGeometry(7.2, 8.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.7 }), LAYER.marking);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, groundHeightAt(0, 0) + 0.02, 0);
    this.scene.add(ring);

    // Fountain pads
    for (const team of [0, 1] as const) {
      const f = FOUNTAINS[team];
      const fGeo = new THREE.CircleGeometry(f.radius, 24);
      fGeo.rotateX(-Math.PI / 2);
      const fMat = flatLayer(
        new THREE.MeshStandardMaterial({ color: team === 0 ? 0x6b2824 : 0x1e3f6b, roughness: 0.6 }),
        LAYER.area,
      );
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(f.x, groundHeightAt(f.x, f.z) + 0.02, f.z);
      this.scene.add(fMesh);
    }

    // 3. Parkour walls & garden sheds (non-flush trims so zero z-fighting!)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7a6958, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4f6d3a, roughness: 0.8 });
    const shedMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });

    for (const wb of MAP_WALLS) {
      const grp = new THREE.Group();
      grp.position.set(wb.x, wb.y, wb.z);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(wb.w, wb.h, wb.d),
        wb.kind === 'shed' ? shedMat : wallMat,
      );
      box.position.y = wb.h * 0.5;
      box.castShadow = true;
      box.receiveShadow = true;
      grp.add(box);

      // Proud top cap (+0.14m wider & +0.18m taller, never flush!)
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(wb.w + 0.24, 0.28, wb.d + 0.24),
        trimMat,
      );
      cap.position.y = wb.h + 0.14;
      cap.castShadow = true;
      grp.add(cap);
      this.scene.add(grp);
    }

    // Shop lanterns
    for (const s of SHOPS) {
      const sy = groundHeightAt(s.x, s.z);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 2.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3b3d42 }),
      );
      post.position.set(s.x, sy + 1.4, s.z);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      );
      lamp.position.set(s.x, sy + 2.95, s.z);
      this.scene.add(post, lamp);
    }

    // 4. Structures (T1-T3 + Ancient Ceramic Patron)
    for (const st of STRUCTURES) {
      const grp = new THREE.Group();
      const sy = groundHeightAt(st.x, st.z);
      grp.position.set(st.x, sy, st.z);

      const teamCol = TEAM_COLORS[st.team];
      const baseH = st.tier === 4 ? 4.4 : 2.6 + st.tier * 0.65;
      const baseR = st.radius * 0.72;

      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(baseR * 0.85, baseR, baseH, 10),
        new THREE.MeshStandardMaterial({ color: 0xd9cbb8, roughness: 0.7 }),
      );
      plinth.position.y = baseH * 0.5;
      plinth.castShadow = true;
      grp.add(plinth);

      // Team ceramic hat cap (proud of plinth)
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(baseR * 1.15, st.tier === 4 ? 2.4 : 1.5, 10),
        new THREE.MeshStandardMaterial({ color: teamCol, roughness: 0.55 }),
      );
      cap.position.y = baseH + (st.tier === 4 ? 1.2 : 0.75);
      cap.castShadow = true;
      grp.add(cap);

      // Glowing core orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(baseR * 0.45, 10, 10),
        new THREE.MeshBasicMaterial({ color: st.team === 0 ? 0xff9f43 : 0x54a0ff }),
      );
      orb.position.y = baseH + (st.tier === 4 ? 2.6 : 1.7);
      grp.add(orb);

      // Translucent invulnerability shield
      const shieldMesh = new THREE.Mesh(
        new THREE.SphereGeometry(st.radius * 1.45, 14, 12),
        new THREE.MeshBasicMaterial({ color: teamCol, transparent: true, opacity: 0.22, wireframe: true }),
      );
      shieldMesh.position.y = baseH * 0.6;
      grp.add(shieldMesh);

      // Range ring on ground using @lawn/depth
      const rRingGeo = new THREE.RingGeometry(st.range - 0.22, st.range, 36);
      rRingGeo.rotateX(-Math.PI / 2);
      const rRing = new THREE.Mesh(
        rRingGeo,
        flatLayer(new THREE.MeshBasicMaterial({ color: teamCol, transparent: true, opacity: 0.25 }), LAYER.marker),
      );
      rRing.position.y = 0.03;
      grp.add(rRing);

      // Floating HP bar
      const hpBg = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.34),
        new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
      );
      hpBg.position.y = baseH + 3.1;
      const hpBarFill = new THREE.Mesh(
        new THREE.PlaneGeometry(3.04, 0.22),
        new THREE.MeshBasicMaterial({ color: teamCol, side: THREE.DoubleSide }),
      );
      hpBarFill.position.set(0, baseH + 3.1, 0.04);
      grp.add(hpBg, hpBarFill);

      // Tower laser beam
      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, baseH + 1.5, 0),
        new THREE.Vector3(0, baseH + 1.5, 0),
      ]);
      const beamLine = new THREE.Line(
        beamGeo,
        new THREE.LineBasicMaterial({ color: st.team === 0 ? 0xff7a1a : 0x4fd8ff }),
      );
      beamLine.visible = false;
      this.scene.add(beamLine);

      this.scene.add(grp);
      this.towerVisuals.set(st.id, { group: grp, shieldMesh, beamLine, hpBarFill });
    }
  }

  private buildRelicAltar(): { group: THREE.Group; crystal: THREE.Mesh } {
    const group = new THREE.Group();
    const gy = groundHeightAt(RELIC_ALTAR.x, RELIC_ALTAR.z);
    group.position.set(RELIC_ALTAR.x, gy, RELIC_ALTAR.z);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.8, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: 0x5c574f, roughness: 0.8 }),
    );
    ped.position.y = 0.45;
    group.add(ped);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xb8860b, emissiveIntensity: 0.7, roughness: 0.25 }),
    );
    crystal.position.y = 2.3;
    crystal.visible = false;
    group.add(crystal);

    this.scene.add(group);
    return { group, crystal };
  }

  private removeHeroModel(slot: number): void {
    const entry = this.heroModels.get(slot);
    if (!entry) return;
    this.scene.remove(entry.model.object);
    this.heroModels.delete(slot);
  }

  private ensureHeroModel(h: HeroEntity, localSlot: number): { model: GnomeModel; shieldRing: THREE.Mesh } {
    const prev = this.lastHeroMeta.get(h.slot);
    if (
      prev &&
      (prev.userId !== h.userId || prev.characterCode !== h.characterCode || prev.team !== h.team)
    ) {
      this.removeHeroModel(h.slot);
    }

    let entry = this.heroModels.get(h.slot);
    if (!entry) {
      let baseLook: GnomeLook | null = null;
      if (h.slot === localSlot) {
        baseLook = getMyGnome()?.look ?? null;
      } else if (h.characterCode) {
        baseLook = resolveLook({ id: h.slot, character: h.characterCode, userId: h.userId });
      }
      const look: GnomeLook = {
        ...(baseLook ?? GNORMAN_LOOK),
        hat: TEAM_COLORS[h.team],
      };
      const model = createGnomeModel(look, { overrideEquipment: ['hand'] });
      const weaponId = HEROES[h.heroId].weapon.prefabId;
      const held = buildHeld(weaponId);
      held.rotation.x = Math.PI / 2;
      held.position.set(0, -0.22, 0.04);
      model.arms.right.add(held);

      const shieldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.05, 8, 18),
        new THREE.MeshBasicMaterial({ color: 0xffb347 }),
      );
      shieldRing.rotation.x = Math.PI / 2;
      shieldRing.position.y = 0.6;
      shieldRing.visible = false;
      model.object.add(shieldRing);

      this.scene.add(model.object);
      entry = { model, weaponName: weaponId, team: h.team, shieldRing };
      this.heroModels.set(h.slot, entry);
      this.lastHeroMeta.set(h.slot, { userId: h.userId, characterCode: h.characterCode, team: h.team });
    }
    return entry;
  }

  spawnEvents(events: readonly SimEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'shot') {
        this.recoilTimers.set(ev.slot, 0.11);
        this.muzzleLight.position.set(ev.ox, ev.oy + 0.15, ev.oz);
        this.muzzleLight.intensity = 2.8;
        const pts = [new THREE.Vector3(ev.ox, ev.oy, ev.oz), new THREE.Vector3(ev.tx, ev.ty, ev.tz)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const col = ev.team === 0 ? 0xffb347 : 0x5cc8ff;
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col }));
        this.scene.add(line);
        this.tracers.push({ line, ttl: 0.07 });
      } else if (ev.type === 'orbConfirm' || ev.type === 'orbDeny' || ev.type === 'heroKill') {
        const col = ev.type === 'orbConfirm' ? 0xffd54f : ev.type === 'orbDeny' ? 0xff4d6d : 0xd9814f;
        const count = ev.type === 'heroKill' ? 14 : 7;
        for (let i = 0; i < count; i++) {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.14, 0.14),
            new THREE.MeshBasicMaterial({ color: col }),
          );
          m.position.set(ev.x, ev.y, ev.z);
          this.scene.add(m);
          this.particles.push({
            mesh: m,
            vx: (Math.random() - 0.5) * 8,
            vy: 2 + Math.random() * 6,
            vz: (Math.random() - 0.5) * 8,
            ttl: 0.55,
          });
        }
      } else if (ev.type === 'ability') {
        const pts = [new THREE.Vector3(ev.x, ev.y, ev.z), new THREE.Vector3(ev.tx, ev.ty, ev.tz)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xa65cff }));
        this.scene.add(line);
        this.tracers.push({ line, ttl: 0.18 });
      }
    }
  }

  sync(state: MatchState, localSlot: number, ads: boolean, dt: number): void {
    // 1. Update Heroes
    for (const h of state.heroes) {
      const entry = this.ensureHeroModel(h, localSlot);
      const { model, shieldRing } = entry;
      model.object.visible = h.alive && !(h.stealthTimer > 0 && h.team !== state.heroes[localSlot]?.team);
      if (h.alive) {
        model.update(
          {
            position: new THREE.Vector3(h.move.pos.x, h.move.pos.y, h.move.pos.z),
            velocity: new THREE.Vector3(h.move.vel.x, h.move.vel.y, h.move.vel.z),
            facing: h.yaw + Math.PI, // gnome model faces +Z, gameplay yaw=0 faces -Z
            grounded: h.move.grounded,
            jumpsUsed: h.move.flipTimer > 0 ? 2 : h.move.grounded ? 0 : 1,
          },
          dt,
        );
        // Slide tilt visual + weapon recoil kickback
        model.object.rotation.x = h.move.sliding ? -0.45 : 0;
        const rec = this.recoilTimers.get(h.slot) ?? 0;
        if (rec > 0) {
          this.recoilTimers.set(h.slot, Math.max(0, rec - dt));
          model.arms.right.rotation.x = -Math.PI * 0.42 - rec * 3.2;
        }
        shieldRing.visible = h.shield > 0;
      }
    }
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 28);

    // 2. Sync Creeps
    const activeCreepIds = new Set<number>();
    for (const cr of state.creeps) {
      activeCreepIds.add(cr.id);
      let cEntry = this.creepMeshes.get(cr.id);
      if (!cEntry) {
        const group = new THREE.Group();
        const scale = cr.kind === 'super' ? 1.35 : cr.kind === 'ranged' ? 0.9 : 1.0;
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24 * scale, 0.3 * scale, 0.65 * scale, 8),
          new THREE.MeshStandardMaterial({ color: 0xd9cbb8, roughness: 0.8 }),
        );
        body.position.y = 0.32 * scale;
        const hat = new THREE.Mesh(
          new THREE.ConeGeometry(0.32 * scale, 0.45 * scale, 8),
          new THREE.MeshStandardMaterial({ color: TEAM_COLORS[cr.team] }),
        );
        hat.position.y = 0.85 * scale;
        const hpBg = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 0.12),
          new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
        );
        hpBg.position.y = 1.35 * scale;
        const hpFill = new THREE.Mesh(
          new THREE.PlaneGeometry(0.84, 0.08),
          new THREE.MeshBasicMaterial({ color: cr.team === 0 ? 0xff5a5a : 0x4fd8ff, side: THREE.DoubleSide }),
        );
        hpFill.position.set(0, 1.35 * scale, 0.02);
        const execPip = new THREE.Mesh(
          new THREE.PlaneGeometry(0.14, 0.14),
          new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide }),
        );
        execPip.position.set(0, 1.55 * scale, 0.02);
        execPip.visible = false;
        group.add(body, hat, hpBg, hpFill, execPip);
        this.scene.add(group);
        cEntry = { group, hpFill, execPip };
        this.creepMeshes.set(cr.id, cEntry);
      }
      cEntry.group.position.set(cr.x, cr.y, cr.z);
      const frac = Math.max(0.01, cr.hp / cr.maxHp);
      cEntry.hpFill.scale.x = frac;
      cEntry.hpFill.quaternion.copy(this.camera.quaternion);
      cEntry.execPip.visible = cr.hp <= 65; // Last-hit execute indicator!
    }
    for (const [id, entry] of this.creepMeshes) {
      if (!activeCreepIds.has(id)) {
        this.scene.remove(entry.group);
        this.creepMeshes.delete(id);
      }
    }

    // 3. Sync Soul Acorn Orbs
    const activeOrbIds = new Set<number>();
    const localTeam = state.heroes[localSlot]?.team ?? 0;
    for (const orb of state.orbs) {
      activeOrbIds.add(orb.id);
      let grp = this.orbMeshes.get(orb.id);
      if (!grp) {
        grp = new THREE.Group();
        const isOwn = orb.team === localTeam;
        const col = isOwn ? 0xffd54f : 0xff4d6d;
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 10, 10),
          new THREE.MeshBasicMaterial({ color: col }),
        );
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.45, 0.04, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        halo.rotation.x = Math.PI / 2;
        grp.add(sphere, halo);
        this.scene.add(grp);
        this.orbMeshes.set(orb.id, grp);
      }
      grp.position.set(orb.x, orb.y, orb.z);
      grp.rotation.y += dt * 4.5;
    }
    for (const [id, grp] of this.orbMeshes) {
      if (!activeOrbIds.has(id)) {
        this.scene.remove(grp);
        this.orbMeshes.delete(id);
      }
    }

    // 4. Sync Structures & Beams
    for (const st of state.structures) {
      const vis = this.towerVisuals.get(st.id);
      if (!vis) continue;
      vis.group.visible = st.hp > 0;
      vis.shieldMesh.visible = st.invulnerable && st.hp > 0;
      vis.hpBarFill.scale.x = Math.max(0.01, st.hp / st.maxHp);
      vis.beamLine.visible = false;
      if (st.hp > 0 && st.targetId) {
        let tx = st.x;
        let ty = st.y + 1;
        let tz = st.z;
        if (st.targetId.startsWith('hero:')) {
          const slot = Number(st.targetId.split(':')[1]);
          const th = state.heroes[slot];
          if (th && th.alive) {
            tx = th.move.pos.x;
            ty = th.move.pos.y + 0.8;
            tz = th.move.pos.z;
            vis.beamLine.visible = true;
          }
        } else if (st.targetId.startsWith('creep:')) {
          const cid = Number(st.targetId.split(':')[1]);
          const tc = state.creeps.find((c) => c.id === cid);
          if (tc) {
            tx = tc.x;
            ty = tc.y + 0.5;
            tz = tc.z;
            vis.beamLine.visible = true;
          }
        }
        if (vis.beamLine.visible) {
          const posAttr = vis.beamLine.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(1, tx, ty, tz);
          posAttr.needsUpdate = true;
        }
      }
    }

    // 5. Relic
    this.relicCrystal.visible = state.relic.alive;
    if (state.relic.alive) {
      this.relicCrystal.rotation.y += dt * 1.4;
      this.relicCrystal.position.y = 2.3 + Math.sin(state.timeS * 2.5) * 0.25;
    }

    // 6. Turrets & Zones
    const activeTurrets = new Set<number>();
    for (const tu of state.turrets) {
      activeTurrets.add(tu.id);
      let m = this.turretMeshes.get(tu.id);
      if (!m) {
        m = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.45, 0.55, 8),
          new THREE.MeshStandardMaterial({ color: 0x9a958c }),
        );
        base.position.y = 0.27;
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 8, 8),
          new THREE.MeshStandardMaterial({ color: TEAM_COLORS[tu.team] }),
        );
        head.position.y = 0.7;
        m.add(base, head);
        this.scene.add(m);
        this.turretMeshes.set(tu.id, m);
      }
      m.position.set(tu.x, tu.y, tu.z);
    }
    for (const [id, m] of this.turretMeshes) {
      if (!activeTurrets.has(id)) {
        this.scene.remove(m);
        this.turretMeshes.delete(id);
      }
    }

    const activeZones = new Set<number>();
    for (const zn of state.zones) {
      activeZones.add(zn.id);
      let m = this.zoneMeshes.get(zn.id);
      if (!m) {
        const zGeo = new THREE.CircleGeometry(zn.radius, 24);
        zGeo.rotateX(-Math.PI / 2);
        const col = zn.kind === 'root' ? 0x4f9a3c : zn.kind === 'sap' ? 0xff9f43 : 0xe0245e;
        m = new THREE.Mesh(
          zGeo,
          flatLayer(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }), LAYER.decal),
        );
        this.scene.add(m);
        this.zoneMeshes.set(zn.id, m);
      }
      m.position.set(zn.x, zn.y + 0.04, zn.z);
    }
    for (const [id, m] of this.zoneMeshes) {
      if (!activeZones.has(id)) {
        this.scene.remove(m);
        this.zoneMeshes.delete(id);
      }
    }

    // 7. Tracers & Particles
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].ttl -= dt;
      if (this.tracers[i].ttl <= 0) {
        this.scene.remove(this.tracers[i].line);
        this.tracers[i].line.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.ttl -= dt;
      p.vy -= 18 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.ttl <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 8. Over-the-shoulder 3rd-person camera with dynamic FOV kick
    const local = state.heroes[localSlot];
    if (local) {
      const spd = Math.hypot(local.move.vel.x, local.move.vel.z);
      const targetFov = ads ? 54 : 74 + Math.min(10, Math.max(0, spd - 9) * 1.1) + (local.move.flowTier === 3 ? 4 : 0);
      this.currentFov += (targetFov - this.currentFov) * Math.min(1, 10 * dt);
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();

      const sinY = Math.sin(local.yaw);
      const cosY = Math.cos(local.yaw);
      const fwdX = -sinY;
      const fwdZ = -cosY;
      const rightX = cosY;
      const rightZ = -sinY;

      const backDist = ads ? 2.4 : 4.2;
      const sideOff = ads ? 0.65 : 0.85;
      const shoulderY = local.move.pos.y + (local.move.sliding ? 1.35 : 1.85) - Math.sin(local.pitch) * 1.6;

      let cx = local.move.pos.x - fwdX * backDist + rightX * sideOff;
      let cz = local.move.pos.z - fwdZ * backDist + rightZ * sideOff;
      cx = Math.max(MAP_BOUNDS.minX + 0.6, Math.min(MAP_BOUNDS.maxX - 0.6, cx));
      cz = Math.max(MAP_BOUNDS.minZ + 0.6, Math.min(MAP_BOUNDS.maxZ - 0.6, cz));
      const cy = Math.max(groundHeightAt(cx, cz) + 0.6, shoulderY);

      this.camPos.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, 22 * dt));
      const lx = local.move.pos.x + fwdX * 14 + rightX * 0.25;
      const ly = local.move.pos.y + 1.1 + Math.sin(local.pitch) * 12;
      const lz = local.move.pos.z + fwdZ * 14 + rightZ * 0.25;
      this.camLook.lerp(new THREE.Vector3(lx, ly, lz), Math.min(1, 26 * dt));

      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
    }

    this.renderer.render(this.scene, this.camera);
  }

  projectToScreen(x: number, y: number, z: number): { sx: number; sy: number; visible: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const visible = v.z >= -1 && v.z <= 1;
    return {
      sx: (v.x * 0.5 + 0.5) * window.innerWidth,
      sy: (-v.y * 0.5 + 0.5) * window.innerHeight,
      visible,
    };
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    for (const [slot] of this.heroModels) this.removeHeroModel(slot);
    this.renderer.dispose();
  }
}
