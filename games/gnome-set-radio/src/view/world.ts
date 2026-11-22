import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { groundHeightAt } from '../levels/loader';
import type { GsrBillboard, GsrInteractive, GsrLevelDoc } from '../levels/schema';

export interface WorldVisuals {
  group: THREE.Group;
  billboardMeshes: Map<string, { panel: THREE.Mesh; tagged: boolean; def: GsrBillboard }>;
  interactiveMeshes: Map<string, { root: THREE.Object3D; def: GsrInteractive; consumed: boolean }>;
  eventBeacons: Map<string, THREE.Mesh>;
  pluckNpc: { root: THREE.Object3D; t: number } | null;
  sentries: { root: THREE.Object3D; baseX: number; baseZ: number; phase: number; tagged: boolean }[];
  bossActor: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number } | null;
  markBillboardTagged(id: string): void;
  markInteractiveDone(id: string): void;
  update(t: number, beatPulse: number, bossActive: boolean, bossWavePhase: number): void;
  dispose(): void;
}

export function buildWorldVisuals(doc: GsrLevelDoc): WorldVisuals {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  // 1. Gradient Sky Dome
  const skyGeo = track(new THREE.SphereGeometry(320, 24, 16));
  const skyMat = track(
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(doc.data.skyTop) },
        botColor: { value: new THREE.Color(doc.data.skyBottom) },
      },
      vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 topColor; uniform vec3 botColor; varying vec3 vPos; void main(){ float h = clamp((vPos.y + 40.0)/220.0, 0.0, 1.0); gl_FragColor = vec4(mix(botColor, topColor, h), 1.0); }`,
    }),
  );
  group.add(new THREE.Mesh(skyGeo, skyMat));

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
    group.add(body);

    // Distinct proud rooftop pad (0.16m thick, sitting cleanly above body top)
    const roofGeo = track(new THREE.BoxGeometry(b.w + 0.4, 0.16, b.d + 0.4));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: b.roofColor, roughness: 0.55 }));
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(b.x, b.yBase + b.h - 0.08, b.z);
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

  // 10. Event Beacons + Woken NPCs (Pluck, Bosses, Conga Sentries)
  const eventBeacons = new Map<string, THREE.Mesh>();
  let pluckNpc: { root: THREE.Object3D; t: number } | null = null;
  const sentries: { root: THREE.Object3D; baseX: number; baseZ: number; phase: number; tagged: boolean }[] = [];
  let bossActor: { root: THREE.Object3D; ring: THREE.Mesh; baseX: number; baseY: number; baseZ: number } | null = null;

  for (const ev of doc.data.events) {
    const npc = buildPrefab(ev.characterPrefab, { scale: ev.kind === 'boss' ? 2.1 : 1.45 });
    if (npc) {
      npc.position.set(ev.x, ev.y, ev.z);
      group.add(npc);
      if (ev.objectiveType === 'chase') {
        pluckNpc = { root: npc, t: 0 };
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
        const sObj = buildPrefab('gsr-bongo-stack', { scale: 1.15 });
        if (sObj) {
          const sx = -20 + i * 20;
          const sz = 0;
          sObj.position.set(sx, 4.0, sz);
          group.add(sObj);
          sentries.push({ root: sObj, baseX: sx, baseZ: sz, phase: i * 2.1, tagged: false });
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

  return {
    group,
    billboardMeshes,
    interactiveMeshes,
    eventBeacons,
    pluckNpc,
    sentries,
    bossActor,
    markBillboardTagged(id) {
      const entry = billboardMeshes.get(id);
      if (!entry || entry.tagged) return;
      entry.tagged = true;
      const mat = entry.panel.material as THREE.MeshStandardMaterial;
      mat.color.set('#00e5ff');
      mat.emissive.set('#00e5ff');
      mat.emissiveIntensity = 0.85;
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
    update(t, beatPulse, bossActive, bossWavePhase) {
      const bounce = 1 + beatPulse * 0.08;
      for (const item of interactiveMeshes.values()) {
        if (!item.root.visible) continue;
        if (item.def.kind === 'spray-pickup' || item.def.kind === 'tempo-acorn') {
          item.root.rotation.y = t * 2.2;
          item.root.position.y = item.def.y + Math.sin(t * 3.5) * 0.22;
        } else if (item.def.kind === 'aerial-ring') {
          item.root.rotation.y = t * 1.5;
        } else if (item.def.kind === 'bongo-pad' || item.def.kind === 'boombox') {
          item.root.scale.set(bounce, 1 + beatPulse * 0.14, bounce);
        }
      }
      if (pluckNpc) {
        pluckNpc.t = t;
        pluckNpc.root.position.x = Math.sin(t * 0.7) * 22;
        pluckNpc.root.position.z = 16 + Math.cos(t * 0.9) * 10;
        pluckNpc.root.position.y = Math.abs(Math.sin(t * 4.5)) * 0.6;
        pluckNpc.root.rotation.y = Math.atan2(Math.cos(t * 0.7) * 22 * 0.7, -Math.sin(t * 0.9) * 10 * 0.9);
      }
      for (const se of sentries) {
        if (se.tagged) {
          se.root.visible = false;
          continue;
        }
        se.root.position.x = se.baseX + Math.sin(t * 1.4 + se.phase) * 7;
        se.root.position.y = 4.0 + Math.abs(Math.sin(t * 3.8 + se.phase)) * 0.25;
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
