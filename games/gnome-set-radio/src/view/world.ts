import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { groundHeightAt } from '../levels/loader';
import type { GsrAmbientNpc, GsrBillboard, GsrInteractive, GsrLevelDoc } from '../levels/schema';
import { createRegionalSkybox } from './skybox';

export interface WorldVisuals {
  group: THREE.Group;
  billboardMeshes: Map<string, { panel: THREE.Mesh; tagged: boolean; def: GsrBillboard }>;
  interactiveMeshes: Map<string, { root: THREE.Object3D; def: GsrInteractive; consumed: boolean }>;
  eventBeacons: Map<string, THREE.Mesh>;
  pluckNpc: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number } | null;
  sentries: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number; phase: number; tagged: boolean }[];
  ambientNpcs: { root: THREE.Object3D; def: GsrAmbientNpc; baseY: number; talkedAt: number }[];
  bossActor: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number } | null;
  markBillboardTagged(id: string, texture?: THREE.Texture): void;
  markInteractiveDone(id: string): void;
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
  const gMat = track(flatLayer(new THREE.MeshStandardMaterial({ color: doc.data.groundColor, roughness: 0.85 }), LAYER.ground));
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

  // 3. Road paths (using @lawn/depth LAYER.road so zero z-fighting!)
  const roadMat = track(flatLayer(new THREE.MeshStandardMaterial({ color: '#191b26', roughness: 0.75 }), LAYER.road));
  const stripeMat = track(
    flatLayer(new THREE.MeshStandardMaterial({ color: doc.data.accentColor, emissive: doc.data.accentColor, emissiveIntensity: 0.35 }), LAYER.marking),
  );
  for (const p of doc.paths) {
    if (p.points.length < 2) continue;
    for (let i = 0; i < p.points.length - 1; i++) {
      const [ax, az] = p.points[i];
      const [bx, bz] = p.points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const pw = p.width ?? 6;
      const segGeo = track(new THREE.PlaneGeometry(pw, len));
      segGeo.rotateX(-Math.PI / 2);
      const seg = new THREE.Mesh(segGeo, roadMat);
      seg.position.set((ax + bx) * 0.5, 0.04, (az + bz) * 0.5);
      seg.rotation.y = Math.atan2(bx - ax, bz - az);
      group.add(seg);

      const lineGeo = track(new THREE.PlaneGeometry(0.28, len));
      lineGeo.rotateX(-Math.PI / 2);
      const line = new THREE.Mesh(lineGeo, stripeMat);
      line.position.set((ax + bx) * 0.5, 0.06, (az + bz) * 0.5);
      line.rotation.y = seg.rotation.y;
      group.add(line);
    }
  }

  // 4. Multi-tier Buildings (non-coplanar trims & stacked clearance)
  for (const b of doc.data.buildings) {
    const gapBottom = b.yBase > 0 ? 0.08 : 0;
    const h = Math.max(0.4, b.h - gapBottom - 0.08);
    const bodyGeo = track(new THREE.BoxGeometry(b.w, h, b.d));
    const bodyMat = track(new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.75 }));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(b.x, b.yBase + gapBottom + h * 0.5, b.z);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.sprayable = true;
    group.add(body);

    // Distinct proud rooftop pad (0.16m thick, sitting cleanly above body top)
    const roofGeo = track(new THREE.BoxGeometry(b.w + 0.4, 0.16, b.d + 0.4));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: b.roofColor, roughness: 0.55 }));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(b.x, b.yBase + b.h - 0.08, b.z);
    roof.userData.sprayable = true;
    group.add(roof);

    if (b.accentColor) {
      const trimGeo = track(new THREE.BoxGeometry(b.w + 0.6, 0.16, b.d + 0.6));
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
  }

  // 5. Sloped Skate Ramps
  for (const r of doc.data.ramps) {
    const dy = r.yTop - r.yBottom;
    const slopeLen = Math.hypot(r.length, dy);
    const pitch = Math.atan2(dy, r.length);
    const rampGeo = track(new THREE.BoxGeometry(r.w, 0.24, slopeLen));
    const rampMat = track(
      new THREE.MeshStandardMaterial({
        color: r.color,
        emissive: r.color,
        emissiveIntensity: 0.22,
        roughness: 0.45,
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

  // 6. Glowing 3D Ley-Line Grind Rails
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
    group.add(new THREE.Mesh(tubeGeo, tubeMat));

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

  // 7. Spray-Taggable Gang Billboards
  const billboardMeshes = new Map<string, { panel: THREE.Mesh; tagged: boolean; def: GsrBillboard }>();
  const frameMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', roughness: 0.5 }));
  for (const bb of doc.data.billboards) {
    const holder = new THREE.Group();
    holder.position.set(bb.x, bb.y + bb.h * 0.5 + 0.6, bb.z);
    holder.rotation.y = bb.yaw;

    const frame = new THREE.Mesh(track(new THREE.BoxGeometry(bb.w + 0.3, bb.h + 0.3, 0.22)), frameMat);
    holder.add(frame);

    const panelMat = track(
      new THREE.MeshStandardMaterial({
        color: bb.color,
        emissive: bb.color,
        emissiveIntensity: 0.2,
        roughness: 0.4,
      }),
    );
    const panel = new THREE.Mesh(track(new THREE.BoxGeometry(bb.w, bb.h, 0.36)), panelMat);
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

  // 8. Static @lawn/prefabs props
  for (const prop of doc.props) {
    const built = buildPrefab(prop.prefab, { scale: prop.scale ?? 1 });
    if (built) {
      built.position.set(prop.x, groundHeightAt(doc, prop.x, prop.z), prop.z);
      built.rotation.y = prop.rot ?? 0;
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

  // 10. Event Beacons + Woken NPCs (Chase, Bosses, Sentries)
  const eventBeacons = new Map<string, THREE.Mesh>();
  let pluckNpc: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number } | null = null;
  const sentries: { root: THREE.Object3D; baseX: number; baseY: number; baseZ: number; phase: number; tagged: boolean }[] = [];
  let bossActor: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number } | null = null;

  for (const ev of doc.data.events) {
    const npc = buildPrefab(ev.characterPrefab, { scale: ev.kind === 'boss' ? 2.1 : 1.45 });
    if (npc) {
      npc.position.set(ev.x, ev.y, ev.z);
      group.add(npc);
      if (ev.objectiveType === 'chase') {
        pluckNpc = { root: npc, baseX: ev.x, baseY: ev.y, baseZ: ev.z };
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
        bossActor = { root: npc, ring, baseX: ev.x, baseY: ev.y, baseZ: ev.z };
      }
    }

    if (ev.objectiveType === 'sentries') {
      for (let i = 0; i < 3; i++) {
        const sObj = buildPrefab(ev.characterPrefab || 'gsr-bongo-stack', { scale: 1.15 });
        if (sObj) {
          const sx = ev.x - 18 + i * 18;
          const sz = ev.z;
          sObj.position.set(sx, ev.y, sz);
          group.add(sObj);
          sentries.push({ root: sObj, baseX: sx, baseY: ev.y, baseZ: sz, phase: i * 2.1, tagged: false });
        }
      }
    }

    const beaconColor = ev.kind === 'boss' ? '#ff5252' : ev.kind === 'side' ? '#00e5ff' : '#ffd740';
    const beaconGeo = track(new THREE.RingGeometry(1.1, 1.5, 24));
    beaconGeo.rotateX(-Math.PI / 2);
    const beaconMat = track(
      flatLayer(
        new THREE.MeshBasicMaterial({ color: beaconColor, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
        LAYER.marker,
      ),
    );
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(ev.x, ev.y + 0.1, ev.z);
    group.add(beacon);
    eventBeacons.set(ev.id, beacon);
  }

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
    }
  }

  // 12. World Details (EQ floor strips, neon arches, overhead cable spans)
  const eqStrips: THREE.Mesh[] = [];
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
    }
  }

  return {
    group,
    billboardMeshes,
    interactiveMeshes,
    eventBeacons,
    pluckNpc,
    sentries,
    ambientNpcs,
    bossActor,
    markBillboardTagged(id, texture) {
      const entry = billboardMeshes.get(id);
      if (!entry || entry.tagged) return;
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
      skybox.update(t, beatPulse, hype);
      const bounce = 1 + beatPulse * 0.08;
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
      for (let i = 0; i < ambientNpcs.length; i++) {
        const npc = ambientNpcs[i]!;
        npc.root.position.y = npc.baseY + Math.abs(Math.sin(t * 3.6 + i)) * 0.14 * (0.5 + beatPulse);
      }
      if (pluckNpc) {
        pluckNpc.root.position.x = pluckNpc.baseX * 0.2 + Math.sin(t * 0.7) * 22;
        pluckNpc.root.position.z = pluckNpc.baseZ * 0.4 + Math.cos(t * 0.9) * 12;
        pluckNpc.root.position.y = pluckNpc.baseY + Math.abs(Math.sin(t * 4.5)) * 0.6;
        pluckNpc.root.rotation.y = Math.atan2(Math.cos(t * 0.7) * 22 * 0.7, -Math.sin(t * 0.9) * 12 * 0.9);
      }
      for (const se of sentries) {
        if (se.tagged) {
          se.root.visible = false;
          continue;
        }
        se.root.position.x = se.baseX + Math.sin(t * 1.4 + se.phase) * 7;
        se.root.position.y = se.baseY + Math.abs(Math.sin(t * 3.8 + se.phase)) * 0.25;
      }
      if (bossActor) {
        bossActor.root.position.y = bossActor.baseY + Math.abs(Math.sin(t * 3.2)) * 0.35;
        bossActor.root.rotation.y = Math.sin(t * 0.9) * 0.5;
        bossActor.ring.visible = bossActive;
        if (bossActive) {
          const rScale = 1 + (bossWavePhase % 1) * 5.2;
          bossActor.ring.scale.setScalar(rScale);
          (bossActor.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.8 - (bossWavePhase % 1) * 0.75);
        }
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
