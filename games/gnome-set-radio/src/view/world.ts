import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { groundHeightAt } from '../levels/loader';
import type { GsrAmbientNpc, GsrBillboard, GsrBuilding, GsrInteractive, GsrLevelDoc } from '../levels/schema';
import { buildPerimeterAds, getBrandAdTexture } from './ads';
import { createGangCrew, type GangCrewSystem } from './gangCrew';
import { createRegionalSkybox } from './skybox';
import { getFacadeTexture, getGroundTexture, getToonGradientMap } from './toon';

const BUILDING_PREFAB_BY_ARCH: Partial<Record<NonNullable<GsrBuilding['arch']>, string>> = {
  'conservatory-hall': 'gsr-bldg-conservatory',
  'vinyl-tower': 'gsr-bldg-vinyl-tower',
  'cafe-terrace': 'gsr-bldg-cafe-rotunda',
  'rotunda-dome': 'gsr-bldg-cafe-rotunda',
  'diner-stop': 'gsr-bldg-acorn-diner',
  'drum-silo': 'gsr-bldg-drum-silo',
  'smelter-furnace': 'gsr-bldg-kiln-smelter',
  'foundry-hall': 'gsr-bldg-kiln-smelter',
  'kiln-chimney': 'gsr-bldg-kiln-chimney',
  'resort-terrace': 'gsr-bldg-neon-pavilion',
  'glass-pavilion': 'gsr-bldg-neon-pavilion',
  'fountain-basin': 'gsr-bldg-neon-pavilion',
  'lighthouse-spire': 'gsr-bldg-neon-pavilion',
};

const ROUND_BUILDING_PREFABS = new Set([
  'gsr-bldg-vinyl-tower',
  'gsr-bldg-cafe-rotunda',
  'gsr-bldg-drum-silo',
  'gsr-bldg-kiln-chimney',
]);

export interface WorldVisuals {
  group: THREE.Group;
  billboardMeshes: Map<string, { panel: THREE.Mesh; tagged: boolean; def: GsrBillboard }>;
  interactiveMeshes: Map<string, { root: THREE.Object3D; def: GsrInteractive; consumed: boolean }>;
  pluckNpc: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number; surge: number } | null;
  sentries: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number; tagged: boolean }[];
  ambientNpcs: { root: THREE.Object3D; def: GsrAmbientNpc; baseY: number; talkedAt: number }[];
  bossActor: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number; hits: number } | null;
  gangCrew: GangCrewSystem;
  markBillboardTagged(id: string, texture?: THREE.Texture): void;
  markInteractiveDone(id: string): void;
  showSpeechBubble(targetId: string, speaker: string, text: string, ttl?: number): void;
  triggerBossHit(): void;
  setFlowVisible(v: boolean): void;
  update(t: number, beatPulse: number, bossActive: boolean, bossWavePhase: number, hype?: number): void;
  dispose(): void;
}

export function buildWorldVisuals(doc: GsrLevelDoc): WorldVisuals {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  // 1. Regional Skybox + Floating Vista Landmarks
  const skybox = createRegionalSkybox(doc);
  group.add(skybox.group);
  disposables.push(skybox);

  // 2. Floating Island Ground + Under-Skirt
  const w = doc.bounds.w;
  const d = doc.bounds.d;
  const gGeo = track(new THREE.PlaneGeometry(w, d, 48, 48));
  gGeo.rotateX(-Math.PI / 2);
  const posAttr = gGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(doc, x, z));
  }
  gGeo.computeVertexNormals();
  const toonMap = getToonGradientMap();
  const gMat = track(
    flatLayer(
      new THREE.MeshToonMaterial({
        color: '#ffffff',
        map: getGroundTexture(doc.data.groundColor, doc.data.accentColor),
        gradientMap: toonMap,
      }),
      LAYER.ground,
    ),
  );
  const ground = new THREE.Mesh(gGeo, gMat);
  ground.receiveShadow = true;
  ground.userData.sprayable = true;
  group.add(ground);

  // Island cliff skirt underneath (offset slightly below y=0 to avoid coplanar face)
  const skirtGeo = track(new THREE.CylinderGeometry(w * 0.52, w * 0.22, 18, 12));
  const skirtMat = track(new THREE.MeshStandardMaterial({ color: '#1b122b', roughness: 0.95 }));
  const skirt = new THREE.Mesh(skirtGeo, skirtMat);
  skirt.position.set(0, -9.2, 0);
  group.add(skirt);

  // 3. Road paths (using @lawn/depth LAYER.road + pathIdx stagger so crossing roads never z-fight!)
  const roadMat = track(flatLayer(new THREE.MeshStandardMaterial({ color: '#191b26', roughness: 0.75 }), LAYER.road));
  const stripeMat = track(
    flatLayer(new THREE.MeshStandardMaterial({ color: doc.data.accentColor, emissive: doc.data.accentColor, emissiveIntensity: 0.35 }), LAYER.marking),
  );
  for (let pathIdx = 0; pathIdx < doc.paths.length; pathIdx++) {
    const p = doc.paths[pathIdx]!;
    if (p.points.length < 2) continue;
    const roadY = 0.04 + pathIdx * 0.012;
    const stripeY = 0.068 + pathIdx * 0.012;
    for (let i = 0; i < p.points.length - 1; i++) {
      const [ax, az] = p.points[i];
      const [bx, bz] = p.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const pw = p.width ?? 6;
      const segGeo = track(new THREE.PlaneGeometry(pw, len));
      segGeo.rotateX(-Math.PI / 2);
      const seg = new THREE.Mesh(segGeo, roadMat);
      seg.position.set((ax + bx) * 0.5, roadY, (az + bz) * 0.5);
      seg.rotation.y = Math.atan2(bx - ax, bz - az);
      group.add(seg);

      const lineGeo = track(new THREE.PlaneGeometry(0.28, len));
      lineGeo.rotateX(-Math.PI / 2);
      const line = new THREE.Mesh(lineGeo, stripeMat);
      line.position.set((ax + bx) * 0.5, stripeY, (az + bz) * 0.5);
      line.rotation.y = seg.rotation.y;
      group.add(line);
    }
  }

  // 4. Multi-tier Buildings (story-spirited building prefabs + skateable rooftops)
  const animatedSpinners: THREE.Object3D[] = [];
  for (const b of doc.data.buildings) {
    const gapBottom = b.yBase > 0 ? 0.08 : 0;
    const h = Math.max(0.4, b.h - gapBottom - 0.08);
    const prefabId = b.prefab ?? (b.arch ? BUILDING_PREFAB_BY_ARCH[b.arch] : undefined);
    const prefabObj = prefabId ? buildPrefab(prefabId, { scale: 1 }) : null;
    if (prefabObj) {
      const box = new THREE.Box3().setFromObject(prefabObj);
      const size = box.getSize(new THREE.Vector3());
      const sx = size.x > 0.01 ? b.w / size.x : 1;
      const sy = size.y > 0.01 ? Math.max(0.3, h - 0.12) / size.y : 1;
      const sz = size.z > 0.01 ? b.d / size.z : 1;
      prefabObj.scale.set(sx, sy, sz);
      prefabObj.position.set(b.x, b.yBase + gapBottom - box.min.y * sy, b.z);
      prefabObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.sprayable = true;
        }
      });
      group.add(prefabObj);
    } else {
      const bodyGeo = track(new THREE.BoxGeometry(b.w, h, b.d));
      const bodyMat = track(
        new THREE.MeshToonMaterial({
          color: '#ffffff',
          map: getFacadeTexture(b.color, b.accentColor ?? doc.data.accentColor),
          gradientMap: toonMap,
        }),
      );
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(b.x, b.yBase + gapBottom + h * 0.5, b.z);
      body.castShadow = true;
      body.receiveShadow = true;
      body.userData.sprayable = true;
      group.add(body);
    }

    // Distinct proud rooftop pad (0.16m thick, sitting cleanly above body top)
    const isRound = !!prefabId && ROUND_BUILDING_PREFABS.has(prefabId);
    const roundR = Math.max(b.w, b.d) * 0.5;
    const roofGeo = track(
      isRound
        ? new THREE.CylinderGeometry(roundR + 0.2, roundR + 0.2, 0.16, 16)
        : new THREE.BoxGeometry(b.w + 0.4, 0.16, b.d + 0.4),
    );
    const roofMat = track(new THREE.MeshToonMaterial({ color: b.roofColor, gradientMap: toonMap }));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(b.x, b.yBase + b.h - 0.08, b.z);
    roof.userData.sprayable = true;
    group.add(roof);

    if (b.accentColor) {
      const trimGeo = track(
        isRound
          ? new THREE.CylinderGeometry(roundR + 0.3, roundR + 0.3, 0.16, 16)
          : new THREE.BoxGeometry(b.w + 0.6, 0.16, b.d + 0.6),
      );
      const trimMat = track(
        new THREE.MeshStandardMaterial({
          color: b.accentColor,
          emissive: b.accentColor,
          emissiveIntensity: 0.45,
          roughness: 0.3,
        }),
      );
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(b.x, b.yBase + b.h - 0.36, b.z);
      group.add(trim);
    }

    decorateBuilding(b, group, track, animatedSpinners);
  }

  // 5. Sloped Skate Ramps
  for (const r of doc.data.ramps) {
    const dy = r.yTop - r.yBottom;
    const slopeLen = Math.hypot(r.length, dy);
    const pitch = Math.atan2(dy, r.length);
    const rampGeo = track(new THREE.BoxGeometry(r.w, 0.24, slopeLen));
    const rampMat = track(
      new THREE.MeshToonMaterial({
        color: r.color,
        emissive: r.color,
        emissiveIntensity: 0.22,
        gradientMap: toonMap,
      }),
    );
    const mesh = new THREE.Mesh(rampGeo, rampMat);
    mesh.position.set(r.x, (r.yBottom + r.yTop) * 0.5 - 0.08, r.z);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = r.yaw;
    mesh.rotation.x = -pitch;
    mesh.userData.sprayable = true;
    group.add(mesh);
  }

  // 6. Glowing 3D Ley-Line Grind Rails + Animated Energy Beads
  const railMats: THREE.MeshStandardMaterial[] = [];
  const railBeads: { curve: THREE.CatmullRomCurve3; mesh: THREE.Mesh; offset: number; speed: number }[] = [];
  const beadGeo = track(new THREE.SphereGeometry(0.24, 8, 8));
  for (const rail of doc.data.rails) {
    const pts = rail.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
    const tubeGeo = track(new THREE.TubeGeometry(curve, 24, 0.14, 8, false));
    const tubeMat = track(
      new THREE.MeshStandardMaterial({
        color: rail.color,
        emissive: rail.glowColor,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      }),
    );
    railMats.push(tubeMat);
    group.add(new THREE.Mesh(tubeGeo, tubeMat));

    const beadMat = track(new THREE.MeshBasicMaterial({ color: rail.glowColor }));
    for (let bIdx = 0; bIdx < 2; bIdx++) {
      const bead = new THREE.Mesh(beadGeo, beadMat);
      group.add(bead);
      railBeads.push({ curve, mesh: bead, offset: bIdx * 0.5, speed: 0.28 * (rail.speedBoost ?? 1.2) });
    }

    // Support pylons at endpoints
    const postMat = track(new THREE.MeshStandardMaterial({ color: '#222633', metalness: 0.6, roughness: 0.4 }));
    for (const p of [rail.points[0], rail.points[rail.points.length - 1]]) {
      const gY = groundHeightAt(doc, p[0], p[2]);
      const ph = Math.max(0.4, p[1] - gY);
      const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.14, ph, 8)), postMat);
      post.position.set(p[0], gY + ph * 0.5, p[2]);
      group.add(post);
    }
  }

  // 7. Spray-Taggable Gang & Brand Billboards
  const billboardMeshes = new Map<string, { panel: THREE.Mesh; tagged: boolean; def: GsrBillboard }>();
  const frameMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', roughness: 0.5 }));
  let bbIdx = 0;
  for (const bb of doc.data.billboards) {
    const holder = new THREE.Group();
    holder.position.set(bb.x, bb.y + bb.h * 0.5 + 0.6, bb.z);
    holder.rotation.y = bb.yaw;

    const frame = new THREE.Mesh(track(new THREE.BoxGeometry(bb.w + 0.3, bb.h + 0.3, 0.22)), frameMat);
    holder.add(frame);

    const adTex = getBrandAdTexture(undefined, doc.data.areaNumber * 5 + bbIdx++);
    const panelMat = track(
      new THREE.MeshStandardMaterial({
        map: adTex,
        emissiveMap: adTex,
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 0.26,
        roughness: 0.4,
      }),
    );
    const panel = new THREE.Mesh(track(new THREE.BoxGeometry(bb.w, bb.h, 0.36)), panelMat);
    panel.userData.sprayable = true;
    holder.add(panel);

    const legH = 0.6;
    const legGeo = track(new THREE.CylinderGeometry(0.1, 0.1, legH, 8));
    for (const lx of [-bb.w * 0.35, bb.w * 0.35]) {
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.position.set(lx, -bb.h * 0.5 - legH * 0.5, 0);
      holder.add(leg);
    }

    group.add(holder);
    billboardMeshes.set(bb.id, { panel, tagged: false, def: bb });
  }

  // 7b. Perimeter Brand Ads (pulling GTA Turfton brands + Archipelago originals)
  buildPerimeterAds(doc, group, track);

  // 8. Static @lawn/prefabs props
  for (const prop of doc.props) {
    const built = buildPrefab(prop.prefab, { scale: prop.scale ?? 1 });
    if (built) {
      built.position.set(prop.x, groundHeightAt(doc, prop.x, prop.z), prop.z);
      built.rotation.y = prop.rot ?? 0;
      built.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) c.userData.sprayable = true;
      });
      group.add(built);
    }
  }

  // 9. Interactive World Toys (Bongo pads, hydrants, boomboxes, dishes, acorns, rings, pickups)
  const interactiveMeshes = new Map<string, { root: THREE.Object3D; def: GsrInteractive; consumed: boolean }>();
  for (const item of doc.data.interactives) {
    let obj: THREE.Object3D | null = null;
    if (item.prefab) {
      obj = buildPrefab(item.prefab, { scale: item.kind === 'spray-pickup' ? 1.5 : 1.25 });
    }
    if (!obj) {
      if (item.kind === 'aerial-ring') {
        const ringMat = track(
          new THREE.MeshStandardMaterial({ color: '#69f0ae', emissive: '#69f0ae', emissiveIntensity: 0.9 }),
        );
        obj = new THREE.Mesh(track(new THREE.TorusGeometry(1.7, 0.16, 10, 24)), ringMat);
      } else {
        const acornMat = track(
          new THREE.MeshStandardMaterial({ color: '#ffd740', emissive: '#ff9100', emissiveIntensity: 0.7 }),
        );
        obj = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.55)), acornMat);
      }
    }
    obj.position.set(item.x, item.y, item.z);
    group.add(obj);
    interactiveMeshes.set(item.id, { root: obj, def: item, consumed: false });
  }

  // 10. Woken NPCs (Chase, Bosses, Sentries) & Speech Bubble Targets
  const speechTargets = new Map<string, { root: THREE.Object3D; height: number }>();
  let pluckNpc: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number; surge: number } | null = null;
  const sentries: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number; tagged: boolean }[] = [];
  let bossActor: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number; hits: number } | null = null;

  for (const ev of doc.data.events) {
    const npc = buildPrefab(ev.characterPrefab, { scale: ev.kind === 'boss' ? 2.1 : 1.45 });
    if (npc) {
      npc.position.set(ev.x, ev.y, ev.z);
      group.add(npc);
      speechTargets.set(ev.id, { root: npc, height: ev.kind === 'boss' ? 3.5 : 2.5 });
      if (ev.objectiveType === 'chase') {
        pluckNpc = { root: npc, baseX: ev.x, baseY: ev.y, baseZ: ev.z, surge: 0 };
        speechTargets.set('pluck', { root: npc, height: 2.6 });
      } else if (ev.kind === 'boss') {
        const ringGeo = track(new THREE.RingGeometry(1.4, 2.2, 28));
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = track(
          flatLayer(
            new THREE.MeshBasicMaterial({ color: '#ff4ecd', side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
            LAYER.marker,
          ),
        );
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(ev.x, ev.y + 0.12, ev.z);
        ring.visible = false;
        group.add(ring);
        bossActor = { root: npc, ring, baseX: ev.x, baseY: ev.y, baseZ: ev.z, hits: 0 };
        speechTargets.set('boss', { root: npc, height: 3.5 });
      }
    }

    if (ev.objectiveType === 'sentries') {
      const sRingGeo = track(new THREE.RingGeometry(0.9, 1.3, 20));
      sRingGeo.rotateX(-Math.PI / 2);
      for (let i = 0; i < 3; i++) {
        const sObj = buildPrefab(ev.characterPrefab || 'gsr-bongo-stack', { scale: 1.15 });
        if (sObj) {
          const sx = ev.x - 18 + i * 18;
          const sz = ev.z;
          sObj.position.set(sx, ev.y, sz);
          group.add(sObj);
          const sRingMat = track(
            flatLayer(
              new THREE.MeshBasicMaterial({ color: '#ff9100', side: THREE.DoubleSide, transparent: true, opacity: 0.55 }),
              LAYER.marker,
            ),
          );
          const sRing = new THREE.Mesh(sRingGeo, sRingMat);
          sRing.position.set(sx, ev.y + 0.1, sz);
          group.add(sRing);
          sentries.push({ root: sObj, ring: sRing, baseX: sx, baseY: ev.y, baseZ: sz, phase: i * 2.1, tagged: false });
        }
      }
    }
  }

  // Optional Flow Visualizer (?flow=1 or V key): dotted arcs along rails & ramp launches
  const flowGroup = new THREE.Group();
  flowGroup.visible = false;
  const dotGeo = track(new THREE.SphereGeometry(0.24, 6, 6));
  const dotMat = track(new THREE.MeshBasicMaterial({ color: '#69f0ae', transparent: true, opacity: 0.85 }));
  for (const rail of doc.data.rails) {
    for (let i = 0; i < rail.points.length - 1; i++) {
      const a = rail.points[i]!;
      const b = rail.points[i + 1]!;
      for (let s = 0; s <= 4; s++) {
        const u = s / 4;
        const d = new THREE.Mesh(dotGeo, dotMat);
        d.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + 0.45, a[2] + (b[2] - a[2]) * u);
        flowGroup.add(d);
      }
    }
  }
  for (const r of doc.data.ramps) {
    const fwdX = Math.sin(r.yaw);
    const fwdZ = Math.cos(r.yaw);
    for (let s = -1; s <= 1; s++) {
      const u = s * (r.length * 0.45);
      const d = new THREE.Mesh(dotGeo, dotMat);
      d.position.set(r.x + fwdX * u, (r.yBottom + r.yTop) * 0.5 + (s * (r.yTop - r.yBottom)) * 0.45 + 0.5, r.z + fwdZ * u);
      flowGroup.add(d);
    }
  }
  group.add(flowGroup);

  // 11. Ambient Spectator Gnomes & Woken Fans
  const ambientNpcs: { root: THREE.Object3D; def: GsrAmbientNpc; baseY: number; talkedAt: number }[] = [];
  for (const npcDef of doc.data.ambientNpcs ?? []) {
    let root: THREE.Object3D | null = null;
    if (npcDef.kind === 'gnome') {
      const m = createGnomeModel({
        ...GNORMAN_LOOK,
        hat: Number.parseInt((npcDef.hatColor ?? '#ff4ecd').replace('#', ''), 16) || 0xff4ecd,
        shirt: Number.parseInt((npcDef.shirtColor ?? '#00e5ff').replace('#', ''), 16) || 0x00e5ff,
      });
      root = m.object;
    } else if (npcDef.prefab) {
      root = buildPrefab(npcDef.prefab, { scale: 1.15 });
    }
    if (root) {
      root.position.set(npcDef.x, npcDef.y, npcDef.z);
      root.rotation.y = npcDef.yaw ?? 0;
      group.add(root);
      ambientNpcs.push({ root, def: npcDef, baseY: npcDef.y, talkedAt: -99 });
      speechTargets.set(npcDef.id, { root, height: npcDef.kind === 'gnome' ? 2.1 : 2.3 });
    }
  }

  // 12. World Details (EQ floor strips, neon arches, cable spans, fountains, walkways, placed props)
  const eqStrips: THREE.Mesh[] = [];
  const fountainJets: THREE.Mesh[] = [];
  for (const det of doc.data.details ?? []) {
    if (det.kind === 'eq-strip') {
      const sc = det.scale ?? 1;
      for (let i = -2; i <= 2; i++) {
        const barGeo = track(new THREE.PlaneGeometry(1.2 * sc, 2.2 * sc));
        barGeo.rotateX(-Math.PI / 2);
        const barMat = track(
          flatLayer(
            new THREE.MeshBasicMaterial({ color: det.color, transparent: true, opacity: 0.72 }),
            LAYER.marking,
          ),
        );
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(det.x + i * 1.6 * sc, det.y + 0.03, det.z);
        bar.rotation.y = det.yaw ?? 0;
        group.add(bar);
        eqStrips.push(bar);
      }
    } else if (det.kind === 'neon-arch') {
      const sc = det.scale ?? 1;
      const archGeo = track(new THREE.TorusGeometry(4.2 * sc, 0.16 * sc, 8, 24, Math.PI));
      const archMat = track(
        new THREE.MeshStandardMaterial({ color: det.color, emissive: det.color, emissiveIntensity: 0.9, roughness: 0.2 }),
      );
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(det.x, det.y, det.z);
      arch.rotation.y = det.yaw ?? 0;
      group.add(arch);
    } else if (det.kind === 'cable-span' && det.x2 !== undefined && det.y2 !== undefined && det.z2 !== undefined) {
      const p0 = new THREE.Vector3(det.x, det.y, det.z);
      const p2 = new THREE.Vector3(det.x2, det.y2, det.z2);
      const mid = p0.clone().lerp(p2, 0.5);
      mid.y -= 1.2;
      const curve = new THREE.CatmullRomCurve3([p0, mid, p2]);
      const cableGeo = track(new THREE.TubeGeometry(curve, 16, 0.07, 6, false));
      const cableMat = track(
        new THREE.MeshStandardMaterial({ color: det.color, emissive: det.color, emissiveIntensity: 0.65 }),
      );
      group.add(new THREE.Mesh(cableGeo, cableMat));
    } else if (det.kind === 'fountain-plaza') {
      const sc = det.scale ?? 1;
      const basinMat = track(new THREE.MeshStandardMaterial({ color: '#d8d2e8', roughness: 0.65 }));
      const basin = new THREE.Mesh(track(new THREE.CylinderGeometry(3.4 * sc, 3.8 * sc, 0.5, 20)), basinMat);
      basin.position.set(det.x, det.y + 0.2, det.z);
      group.add(basin);

      const waterGeo = track(new THREE.CircleGeometry(3.1 * sc, 20));
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = track(
        flatLayer(
          new THREE.MeshBasicMaterial({ color: det.color, transparent: true, opacity: 0.85 }),
          LAYER.marking,
        ),
      );
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(det.x, det.y + 0.47, det.z);
      group.add(water);

      const spout = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42 * sc, 0.62 * sc, 1.5 * sc, 12)), basinMat);
      spout.position.set(det.x, det.y + 0.9 * sc, det.z);
      group.add(spout);

      const jetMat = track(
        new THREE.MeshStandardMaterial({
          color: det.accentColor ?? '#ff4ecd',
          emissive: det.accentColor ?? '#ff4ecd',
          emissiveIntensity: 0.9,
          roughness: 0.2,
        }),
      );
      for (let j = 0; j < 4; j++) {
        const ang = (j * Math.PI) / 2;
        const jet = new THREE.Mesh(track(new THREE.SphereGeometry(0.28 * sc, 8, 8)), jetMat);
        jet.position.set(det.x + Math.cos(ang) * 1.1 * sc, det.y + 1.1 * sc, det.z + Math.sin(ang) * 1.1 * sc);
        jet.userData.baseY = det.y + 1.0 * sc;
        jet.userData.phase = j * 1.4;
        group.add(jet);
        fountainJets.push(jet);
      }
    } else if (det.kind === 'banner-arch') {
      const sc = det.scale ?? 1;
      const poleMat = track(new THREE.MeshStandardMaterial({ color: '#2b2d3c', metalness: 0.5, roughness: 0.4 }));
      const poleGeo = track(new THREE.CylinderGeometry(0.14 * sc, 0.18 * sc, 4.6 * sc, 8));
      for (const side of [-1, 1]) {
        const px = det.x + Math.cos(det.yaw ?? 0) * side * 4.4 * sc;
        const pz = det.z - Math.sin(det.yaw ?? 0) * side * 4.4 * sc;
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(px, det.y + 2.2 * sc, pz);
        group.add(pole);
      }
      const barGeo = track(new THREE.TorusGeometry(4.4 * sc, 0.14 * sc, 8, 22, Math.PI));
      const barMat = track(
        new THREE.MeshStandardMaterial({ color: det.color, emissive: det.color, emissiveIntensity: 0.85, roughness: 0.25 }),
      );
      const arch = new THREE.Mesh(barGeo, barMat);
      arch.position.set(det.x, det.y + 4.2 * sc, det.z);
      arch.rotation.y = det.yaw ?? 0;
      group.add(arch);

      const flagMat = track(
        new THREE.MeshStandardMaterial({
          color: det.accentColor ?? '#ffd740',
          emissive: det.accentColor ?? '#ffd740',
          emissiveIntensity: 0.45,
          roughness: 0.4,
        }),
      );
      const flagGeo = track(new THREE.ConeGeometry(0.45 * sc, 0.85 * sc, 4));
      flagGeo.rotateX(Math.PI);
      for (let f = -2; f <= 2; f++) {
        const flag = new THREE.Mesh(flagGeo, flagMat);
        const offset = f * 1.5 * sc;
        flag.position.set(
          det.x + Math.cos(det.yaw ?? 0) * offset,
          det.y + (4.2 + Math.cos(f * 0.4) * 2.8) * sc,
          det.z - Math.sin(det.yaw ?? 0) * offset,
        );
        group.add(flag);
      }
    } else if (det.kind === 'piano-walkway') {
      const keys = Math.max(4, Math.round((det.d ?? 18) / 2.2));
      const kw = det.w ?? 5.2;
      const whiteMat = track(flatLayer(new THREE.MeshBasicMaterial({ color: '#f3eefc' }), LAYER.marking));
      const blackMat = track(flatLayer(new THREE.MeshBasicMaterial({ color: det.color }), LAYER.marking));
      const keyGeo = track(new THREE.PlaneGeometry(kw, 1.5));
      keyGeo.rotateX(-Math.PI / 2);
      const startZ = det.z - (keys - 1) * 1.0;
      for (let k = 0; k < keys; k++) {
        const key = new THREE.Mesh(keyGeo, k % 2 === 0 ? whiteMat : blackMat);
        key.position.set(det.x, det.y + 0.09, startZ + k * 2.0);
        key.rotation.y = det.yaw ?? 0;
        group.add(key);
      }
    } else if (det.kind === 'highway-chevron') {
      const sc = det.scale ?? 1;
      const chevMat = track(
        flatLayer(
          new THREE.MeshBasicMaterial({ color: det.color, transparent: true, opacity: 0.85 }),
          LAYER.marking,
        ),
      );
      const barGeo = track(new THREE.PlaneGeometry(2.6 * sc, 0.7 * sc));
      barGeo.rotateX(-Math.PI / 2);
      for (let c = -1; c <= 1; c++) {
        const bar = new THREE.Mesh(barGeo, chevMat);
        bar.position.set(det.x + Math.sin(det.yaw ?? 0) * c * 2.4 * sc, det.y + 0.09, det.z + Math.cos(det.yaw ?? 0) * c * 2.4 * sc);
        bar.rotation.y = det.yaw ?? 0;
        group.add(bar);
      }
    } else if (det.kind === 'molten-channel') {
      const cw = det.w ?? 6;
      const cd = det.d ?? 54;
      const chanGeo = track(new THREE.PlaneGeometry(cw, cd));
      chanGeo.rotateX(-Math.PI / 2);
      const chanMat = track(
        flatLayer(
          new THREE.MeshBasicMaterial({ color: det.color, transparent: true, opacity: 0.9 }),
          LAYER.marking,
        ),
      );
      const chan = new THREE.Mesh(chanGeo, chanMat);
      chan.position.set(det.x, det.y + 0.08, det.z);
      chan.rotation.y = det.yaw ?? 0;
      group.add(chan);

      const grateMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d24', metalness: 0.7, roughness: 0.4 }));
      const grateGeo = track(new THREE.BoxGeometry(cw + 0.6, 0.16, 0.9));
      const count = Math.max(3, Math.floor(cd / 7));
      for (let g = 0; g < count; g++) {
        const gz = det.z - cd * 0.42 + (g * cd * 0.84) / Math.max(1, count - 1);
        const grate = new THREE.Mesh(grateGeo, grateMat);
        grate.position.set(det.x, det.y + 0.14, gz);
        group.add(grate);
      }
    } else if (det.kind === 'mist-pool') {
      const rad = (det.w ?? 18) * 0.5;
      const poolGeo = track(new THREE.CircleGeometry(rad, 28));
      poolGeo.rotateX(-Math.PI / 2);
      const poolMat = track(
        flatLayer(
          new THREE.MeshBasicMaterial({ color: det.color, transparent: true, opacity: 0.72 }),
          LAYER.marking,
        ),
      );
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.position.set(det.x, det.y + 0.08, det.z);
      group.add(pool);

      const rimGeo = track(new THREE.TorusGeometry(rad, 0.28, 8, 28));
      rimGeo.rotateX(Math.PI / 2);
      const rimMat = track(
        new THREE.MeshStandardMaterial({
          color: det.accentColor ?? '#00e5ff',
          emissive: det.accentColor ?? '#00e5ff',
          emissiveIntensity: 0.55,
          roughness: 0.3,
        }),
      );
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(det.x, det.y + 0.16, det.z);
      group.add(rim);
    } else if (det.kind === 'placed-prop' && det.prefab) {
      const propObj = buildPrefab(det.prefab, { scale: det.scale ?? 1 });
      if (propObj) {
        propObj.position.set(det.x, det.y, det.z);
        propObj.rotation.y = det.yaw ?? 0;
        group.add(propObj);
      }
    }
  }

  const gangCrew = createGangCrew(doc, group, bossActor, speechTargets);
  disposables.push(gangCrew);

  const activeBubbles = new Map<string, { sprite: THREE.Sprite; tex: THREE.Texture; mat: THREE.SpriteMaterial; target: { root: THREE.Object3D; height: number }; expiresAt: number }>();
  let lastT = 0;
  let bossHitFlash = 0;

  return {
    group,
    billboardMeshes,
    interactiveMeshes,
    pluckNpc,
    sentries,
    ambientNpcs,
    bossActor,
    gangCrew,
    triggerBossHit() {
      bossHitFlash = 0.35;
    },
    showSpeechBubble(targetId, speaker, text, ttl = 4.5) {
      const target = speechTargets.get(targetId);
      if (!target) return;
      const prev = activeBubbles.get(targetId);
      if (prev) {
        group.remove(prev.sprite);
        prev.tex.dispose();
        prev.mat.dispose();
        activeBubbles.delete(targetId);
      }
      const { sprite, tex, mat } = createSpeechBubbleSprite(speaker, text, doc.data.accentColor);
      sprite.position.set(target.root.position.x, target.root.position.y + target.height, target.root.position.z);
      group.add(sprite);
      activeBubbles.set(targetId, { sprite, tex, mat, target, expiresAt: lastT + ttl });
    },
    setFlowVisible(v) {
      flowGroup.visible = v;
    },
    markBillboardTagged(id, texture) {
      const entry = billboardMeshes.get(id);
      if (!entry) return;
      entry.tagged = true;
      const mat = entry.panel.material as THREE.MeshStandardMaterial;
      if (texture) {
        mat.map = texture;
        mat.color.set('#ffffff');
        mat.emissive.set('#ffffff');
        mat.emissiveMap = texture;
        mat.emissiveIntensity = 0.55;
        mat.needsUpdate = true;
      } else {
        mat.color.set('#00e5ff');
        mat.emissive.set('#00e5ff');
        mat.emissiveIntensity = 0.85;
      }
    },
    markInteractiveDone(id) {
      const entry = interactiveMeshes.get(id);
      if (!entry) return;
      entry.consumed = true;
      if (
        entry.def.kind === 'spray-pickup' ||
        entry.def.kind === 'tempo-acorn' ||
        entry.def.kind === 'aerial-ring'
      ) {
        entry.root.visible = false;
      } else {
        entry.root.scale.setScalar(1.35);
      }
    },
    update(t, beatPulse, bossActive, bossWavePhase, hype = 0.3) {
      const dt = lastT > 0 ? Math.min(0.05, Math.max(0.001, t - lastT)) : 0.016;
      lastT = t;
      gangCrew.update(t, dt, beatPulse);
      skybox.update(t, beatPulse, hype);
      const bounce = 1 + beatPulse * 0.08;
      for (const rm of railMats) {
        rm.emissiveIntensity = 0.72 + beatPulse * 0.45 + hype * 0.25;
      }
      for (const rb of railBeads) {
        const u = (t * rb.speed + rb.offset) % 1;
        rb.curve.getPointAt(u, rb.mesh.position);
      }
      for (const item of interactiveMeshes.values()) {
        if (!item.root.visible) continue;
        if (item.def.kind === 'spray-pickup' || item.def.kind === 'tempo-acorn') {
          item.root.rotation.y = t * 2.2;
          item.root.position.y = item.def.y + Math.sin(t * 3.5) * 0.22;
        } else if (item.def.kind === 'aerial-ring') {
          item.root.rotation.y = t * 1.5;
        } else if (item.def.kind === 'bongo-pad' || item.def.kind === 'boombox' || item.def.kind === 'updraft-vent') {
          item.root.scale.set(bounce, 1 + beatPulse * 0.14, bounce);
        }
      }
      for (let i = 0; i < eqStrips.length; i++) {
        const bar = eqStrips[i]!;
        bar.scale.y = 0.7 + beatPulse * 0.65 + Math.sin(t * 5 + i * 1.3) * 0.25;
      }
      for (const sp of animatedSpinners) {
        sp.rotation.z = t * (1.2 + hype * 1.1);
      }
      for (const jet of fountainJets) {
        const baseY = (jet.userData.baseY as number) ?? 1.0;
        const phase = (jet.userData.phase as number) ?? 0;
        jet.position.y = baseY + Math.abs(Math.sin(t * 4.2 + phase)) * (0.75 + beatPulse * 0.5);
      }
      for (let i = 0; i < ambientNpcs.length; i++) {
        const npc = ambientNpcs[i]!;
        npc.root.position.y = npc.baseY + Math.abs(Math.sin(t * 3.6 + i)) * 0.14 * (0.5 + beatPulse);
      }
      if (pluckNpc) {
        pluckNpc.surge = Math.max(0, pluckNpc.surge - 0.016);
        const speedMul = 1 + pluckNpc.surge * 0.65;
        const phase = t * 0.75 * speedMul;
        const nextX = pluckNpc.baseX * 0.2 + Math.sin(phase) * 24;
        const nextZ = pluckNpc.baseZ * 0.35 + Math.sin(phase * 2) * 14;
        pluckNpc.root.rotation.y = Math.atan2(nextX - pluckNpc.root.position.x, nextZ - pluckNpc.root.position.z);
        pluckNpc.root.position.x = nextX;
        pluckNpc.root.position.z = nextZ;
        pluckNpc.root.position.y = pluckNpc.baseY + Math.abs(Math.sin(t * 5.2)) * 0.75;
      }
      for (const se of sentries) {
        if (se.tagged) {
          se.root.visible = false;
          se.ring.visible = false;
          continue;
        }
        se.root.position.x = se.baseX + Math.sin(t * 1.4 + se.phase) * 7;
        se.root.position.y = se.baseY + Math.abs(Math.sin(t * 3.8 + se.phase)) * 0.25;
        se.ring.position.x = se.root.position.x;
        se.ring.position.z = se.root.position.z;
        const pulse = (t * 0.8 + se.phase) % 1;
        se.ring.scale.setScalar(1 + pulse * 2.4);
        (se.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.06, 0.65 - pulse * 0.6);
      }
      if (bossActor) {
        bossHitFlash = Math.max(0, bossHitFlash - dt);
        const shiftX = bossActor.hits === 0 ? 0 : bossActor.hits === 1 ? -4.5 : 4.5;
        const shiftZ = bossActor.hits === 0 ? 0 : 2.5;
        bossActor.root.position.x += (bossActor.baseX + shiftX - bossActor.root.position.x) * 0.08;
        bossActor.root.position.z += (bossActor.baseZ + shiftZ - bossActor.root.position.z) * 0.08;
        const hitPop = bossHitFlash > 0 ? Math.sin((bossHitFlash / 0.35) * Math.PI) * 0.55 : 0;
        bossActor.root.position.y = bossActor.baseY + Math.abs(Math.sin(t * 3.2)) * 0.35 + hitPop;
        bossActor.root.scale.setScalar(1 + hitPop * 0.35);
        bossActor.root.rotation.y = Math.sin(t * 0.9) * 0.5 + (bossHitFlash > 0 ? bossHitFlash * 6 : 0);
        bossActor.ring.visible = bossActive;
        if (bossActive) {
          bossActor.ring.position.x = bossActor.root.position.x;
          bossActor.ring.position.z = bossActor.root.position.z;
          const rScale = 1 + (bossWavePhase % 1) * 5.2;
          bossActor.ring.scale.setScalar(rScale);
          (bossActor.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.8 - (bossWavePhase % 1) * 0.75);
        }
      }
      for (const [id, b] of activeBubbles) {
        if (t >= b.expiresAt) {
          group.remove(b.sprite);
          b.tex.dispose();
          b.mat.dispose();
          activeBubbles.delete(id);
        } else {
          b.sprite.position.set(
            b.target.root.position.x,
            b.target.root.position.y + b.target.height + Math.sin(t * 4) * 0.08,
            b.target.root.position.z,
          );
        }
      }
    },
    dispose() {
      for (const b of activeBubbles.values()) {
        b.tex.dispose();
        b.mat.dispose();
      }
      activeBubbles.clear();
      for (const d of disposables) d.dispose();
    },
  };
}

function decorateBuilding(
  b: GsrBuilding,
  group: THREE.Group,
  track: <T extends { dispose(): void }>(x: T) => T,
  animatedSpinners: THREE.Object3D[],
): void {
  const arch = b.arch;
  if (!arch) return;
  const roofTop = b.yBase + b.h;
  const accent = b.accentColor ?? '#00e5ff';
  const darkMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', roughness: 0.65 }));
  const lightMat = track(new THREE.MeshStandardMaterial({ color: '#f3eefc', roughness: 0.45 }));
  const glowMat = track(
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.8, roughness: 0.25 }),
  );

  const addCornerPosts = (radiusTop: number, radiusBot: number, height: number, mat: THREE.Material) => {
    const geo = track(new THREE.CylinderGeometry(radiusTop, radiusBot, height, 8));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(b.x + sx * (b.w * 0.5 - 0.55), roofTop - 0.15 + height * 0.5, b.z + sz * (b.d * 0.5 - 0.55));
        group.add(m);
      }
    }
  };

  if (arch === 'conservatory-hall') {
    const winGeo = track(new THREE.BoxGeometry(2.2, Math.max(0.8, b.h * 0.52), 0.36));
    const slots = b.w >= 20 ? [-6.5, 0, 6.5] : [-3.5, 3.5];
    for (const ox of slots) {
      for (const sz of [-1, 1]) {
        const wMesh = new THREE.Mesh(winGeo, glowMat);
        wMesh.position.set(b.x + ox, b.yBase + b.h * 0.5, b.z + sz * (b.d * 0.5));
        group.add(wMesh);
      }
    }
    const keyCount = Math.max(4, Math.floor(b.w / 2.2));
    const keyGeo = track(new THREE.BoxGeometry(1.1, 0.42, 0.38));
    for (let k = 0; k < keyCount; k++) {
      const kx = b.x - b.w * 0.42 + (k * b.w * 0.84) / Math.max(1, keyCount - 1);
      const km = new THREE.Mesh(keyGeo, k % 2 === 0 ? lightMat : darkMat);
      km.position.set(kx, b.yBase + 0.32, b.z + b.d * 0.5);
      group.add(km);
    }
    addCornerPosts(0.12, 0.24, 1.4, glowMat);
  } else if (arch === 'rotunda-dome') {
    const colGeo = track(new THREE.CylinderGeometry(0.32, 0.38, Math.max(1, b.h - 0.4), 10));
    const count = 8;
    const rx = b.w * 0.5 + 0.35;
    const rz = b.d * 0.5 + 0.35;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.PI / 8;
      const col = new THREE.Mesh(colGeo, lightMat);
      col.position.set(b.x + Math.cos(ang) * rx, b.yBase + b.h * 0.5 - 0.1, b.z + Math.sin(ang) * rz);
      group.add(col);
    }
    const ringGeo = track(new THREE.TorusGeometry(Math.min(b.w, b.d) * 0.42, 0.22, 8, 24));
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, glowMat);
    ring.position.set(b.x, roofTop + 0.15, b.z);
    group.add(ring);
  } else if (arch === 'cafe-terrace') {
    const awnMat = track(new THREE.MeshStandardMaterial({ color: '#ff4ecd', roughness: 0.45 }));
    const awnGeo = track(new THREE.BoxGeometry(b.w * 0.86, 0.22, 1.8));
    for (const sz of [-1, 1]) {
      const awn = new THREE.Mesh(awnGeo, awnMat);
      awn.position.set(b.x, b.yBase + b.h * 0.62, b.z + sz * (b.d * 0.5 + 0.72));
      awn.rotation.x = sz * 0.25;
      group.add(awn);
    }
    const winGeo = track(new THREE.BoxGeometry(b.w * 0.72, 0.9, 0.36));
    const win = new THREE.Mesh(winGeo, glowMat);
    win.position.set(b.x, b.yBase + b.h * 0.36, b.z + b.d * 0.5);
    group.add(win);
    addCornerPosts(0.14, 0.16, 1.8, darkMat);
  } else if (arch === 'vinyl-tower') {
    const discGroup = new THREE.Group();
    discGroup.position.set(b.x, b.yBase + b.h * 0.56, b.z + b.d * 0.5 + 0.32);
    const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(2.6, 2.6, 0.28, 24)), darkMat);
    disc.rotation.x = Math.PI / 2;
    discGroup.add(disc);
    const label = new THREE.Mesh(track(new THREE.CylinderGeometry(0.9, 0.9, 0.34, 16)), glowMat);
    label.rotation.x = Math.PI / 2;
    discGroup.add(label);
    group.add(discGroup);
    animatedSpinners.push(discGroup);
    addCornerPosts(0.08, 0.14, 2.8, glowMat);
  } else if (arch === 'overpass-deck') {
    const pierGeo = track(new THREE.CylinderGeometry(0.9, 1.3, Math.max(1, b.h - 0.3), 8));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pier = new THREE.Mesh(pierGeo, darkMat);
        pier.position.set(b.x + sx * (b.w * 0.42), b.yBase + b.h * 0.48, b.z + sz * (b.d * 0.48));
        group.add(pier);
      }
    }
    const railGeo = track(new THREE.BoxGeometry(b.w * 0.32, 0.55, 0.72));
    for (const sx of [-1, 1]) {
      const barrier = new THREE.Mesh(railGeo, glowMat);
      barrier.position.set(b.x + sx * (b.w * 0.32), roofTop + 0.18, b.z + b.d * 0.5);
      group.add(barrier);
    }
  } else if (arch === 'drum-silo') {
    const cylRad = Math.min(b.w, b.d) * 0.48;
    const cylMat = track(new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.6 }));
    const cyl = new THREE.Mesh(track(new THREE.CylinderGeometry(cylRad, cylRad * 1.04, b.h - 0.2, 18)), cylMat);
    cyl.position.set(b.x, b.yBase + b.h * 0.5, b.z);
    group.add(cyl);

    const hoopGeo = track(new THREE.TorusGeometry(cylRad + 0.22, 0.18, 8, 24));
    hoopGeo.rotateX(Math.PI / 2);
    for (const f of [0.35, 0.72]) {
      const hoop = new THREE.Mesh(hoopGeo, glowMat);
      hoop.position.set(b.x, b.yBase + b.h * f, b.z);
      group.add(hoop);
    }
  } else if (arch === 'diner-stop') {
    const visorMat = track(new THREE.MeshStandardMaterial({ color: '#c3cbd3', metalness: 0.6, roughness: 0.3 }));
    const visor = new THREE.Mesh(track(new THREE.BoxGeometry(b.w + 1.6, 0.28, 2.4)), visorMat);
    visor.position.set(b.x, b.yBase + b.h * 0.68, b.z + b.d * 0.5 + 0.8);
    group.add(visor);
    const band = new THREE.Mesh(track(new THREE.BoxGeometry(b.w + 0.44, 0.65, b.d + 0.44)), glowMat);
    band.position.set(b.x, b.yBase + b.h * 0.42, b.z);
    group.add(band);
    const fin = new THREE.Mesh(track(new THREE.BoxGeometry(0.35, 1.8, b.d * 0.45)), glowMat);
    fin.position.set(b.x, roofTop + 0.75, b.z);
    group.add(fin);
  } else if (arch === 'smelter-furnace') {
    const stackGeo = track(new THREE.CylinderGeometry(0.95, 1.25, 4.2, 12));
    for (const sx of [-1, 1]) {
      const stack = new THREE.Mesh(stackGeo, darkMat);
      stack.position.set(b.x + sx * (b.w * 0.34), roofTop + 1.9, b.z - b.d * 0.34);
      group.add(stack);
      const rim = new THREE.Mesh(track(new THREE.TorusGeometry(1.0, 0.16, 8, 16)), glowMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(stack.position.x, roofTop + 4.0, stack.position.z);
      group.add(rim);
    }
    const ventGeo = track(new THREE.BoxGeometry(2.6, 1.4, 0.42));
    for (const ox of [-b.w * 0.24, b.w * 0.24]) {
      const vent = new THREE.Mesh(ventGeo, glowMat);
      vent.position.set(b.x + ox, b.yBase + b.h * 0.38, b.z + b.d * 0.5);
      group.add(vent);
    }
  } else if (arch === 'kiln-chimney') {
    for (const f of [0.28, 0.56, 0.82]) {
      const collar = new THREE.Mesh(track(new THREE.BoxGeometry(b.w + 0.72, 0.42, b.d + 0.72)), glowMat);
      collar.position.set(b.x, b.yBase + b.h * f, b.z);
      group.add(collar);
    }
    addCornerPosts(0.28, 0.34, 2.2, darkMat);
  } else if (arch === 'foundry-hall') {
    const ribGeo = track(new THREE.BoxGeometry(0.65, b.h - 0.4, 0.7));
    for (const ox of [-b.w * 0.35, 0, b.w * 0.35]) {
      for (const sz of [-1, 1]) {
        const rib = new THREE.Mesh(ribGeo, darkMat);
        rib.position.set(b.x + ox, b.yBase + b.h * 0.48, b.z + sz * (b.d * 0.5 + 0.15));
        group.add(rib);
      }
    }
    const skyStrip = new THREE.Mesh(track(new THREE.BoxGeometry(b.w * 0.75, 0.32, 1.4)), glowMat);
    skyStrip.position.set(b.x, roofTop + 0.08, b.z);
    group.add(skyStrip);
  } else if (arch === 'fountain-basin') {
    const waterRim = new THREE.Mesh(track(new THREE.BoxGeometry(b.w + 0.76, 0.46, b.d + 0.76)), glowMat);
    waterRim.position.set(b.x, b.yBase + b.h * 0.74, b.z);
    group.add(waterRim);
    const finGeo = track(new THREE.BoxGeometry(0.9, b.h - 0.5, 0.9));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const fin = new THREE.Mesh(finGeo, lightMat);
        fin.position.set(b.x + sx * (b.w * 0.5 + 0.12), b.yBase + b.h * 0.46, b.z + sz * (b.d * 0.5 + 0.12));
        group.add(fin);
      }
    }
  } else if (arch === 'glass-pavilion') {
    const glassMat = track(
      new THREE.MeshStandardMaterial({
        color: '#80f5ff',
        emissive: accent,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.52,
        roughness: 0.15,
      }),
    );
    const panelGeo = track(new THREE.BoxGeometry(b.w * 0.7, b.h * 0.64, 0.38));
    for (const sz of [-1, 1]) {
      const panel = new THREE.Mesh(panelGeo, glassMat);
      panel.position.set(b.x, b.yBase + b.h * 0.48, b.z + sz * (b.d * 0.5));
      group.add(panel);
    }
    const halo = new THREE.Mesh(track(new THREE.TorusGeometry(Math.min(b.w, b.d) * 0.46, 0.18, 8, 24)), glowMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(b.x, roofTop + 1.2, b.z);
    group.add(halo);
    addCornerPosts(0.15, 0.18, 1.35, glowMat);
  } else if (arch === 'lighthouse-spire') {
    for (const f of [0.3, 0.65, 0.98]) {
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(Math.min(b.w, b.d) * 0.56, 0.22, 8, 24)), glowMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(b.x, b.yBase + b.h * f, b.z);
      group.add(ring);
    }
    addCornerPosts(0.1, 0.18, 2.4, glowMat);
  } else if (arch === 'resort-terrace') {
    const band = new THREE.Mesh(track(new THREE.BoxGeometry(b.w + 0.74, 0.38, b.d + 0.74)), glowMat);
    band.position.set(b.x, b.yBase + b.h * 0.55, b.z);
    group.add(band);
    addCornerPosts(0.18, 0.14, 1.6, glowMat);
  }
}

function createSpeechBubbleSprite(
  speaker: string,
  text: string,
  accentColor: string,
): { sprite: THREE.Sprite; tex: THREE.CanvasTexture; mat: THREE.SpriteMaterial } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const g = c.getContext('2d')!;

  // Comic speech bubble body + pointer tail
  g.fillStyle = '#180b2e';
  g.strokeStyle = accentColor || '#ffd740';
  g.lineWidth = 8;
  g.beginPath();
  g.roundRect(14, 10, 484, 144, 24);
  g.fill();
  g.stroke();

  g.beginPath();
  g.moveTo(234, 152);
  g.lineTo(256, 184);
  g.lineTo(278, 152);
  g.closePath();
  g.fill();
  g.stroke();

  // Speaker header
  g.fillStyle = '#ffd740';
  g.font = '900 22px system-ui, sans-serif';
  g.textAlign = 'left';
  g.fillText(speaker.toUpperCase(), 34, 44, 444);

  // Wrapped body text (max 3 lines)
  g.fillStyle = '#ffffff';
  g.font = '700 21px system-ui, sans-serif';
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (g.measureText(cand).width <= 444) cur = cand;
    else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= 2) break;
    }
  }
  if (cur && lines.length < 3) lines.push(cur);
  lines.forEach((ln, i) => g.fillText(ln, 34, 78 + i * 28, 444));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4.8, 1.8, 1);
  sprite.renderOrder = 20;
  return { sprite, tex, mat };
}
