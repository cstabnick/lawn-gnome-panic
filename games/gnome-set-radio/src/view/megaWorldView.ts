import * as THREE from 'three';
import { getLevelDoc, LEVEL_ORDER, type GsrLevelId } from '../levels/loader';
import { MEGA_SKY_RAILS, MEGA_WORLD_OFFSETS } from '../levels/megaWorld';
import { createCartoonBackdrop } from './cartoonBackdrop';
import { createRegionalSkybox } from './skybox';
import { createSkyVisualizer } from './skyVisualizer';
import { buildWorldVisuals, type WorldVisuals } from './world';

export interface MegaWorldView {
  group: THREE.Group;
  islands: Map<GsrLevelId, WorldVisuals>;
  setFlowVisible(v: boolean): void;
  update(
    activeId: GsrLevelId,
    t: number,
    beatPulse: number,
    bossActive: boolean,
    bossWavePhase: number,
    hype: number,
    comboMult: number,
    bossPosOverride?: { x: number; y: number; z: number },
  ): void;
  dispose(): void;
}

export function buildMegaWorldView(initialId: GsrLevelId): MegaWorldView {
  const group = new THREE.Group();
  const islands = new Map<GsrLevelId, WorldVisuals>();
  const disposables: { dispose(): void }[] = [];

  for (const id of LEVEL_ORDER) {
    const doc = getLevelDoc(id);
    const w = buildWorldVisuals(doc, { megaMode: true });
    const [ox, oy, oz] = MEGA_WORLD_OFFSETS[id];
    w.group.position.set(ox, oy, oz);
    group.add(w.group);
    islands.set(id, w);
  }

  // Shared Skybox, Visualizer & Cartoon Backdrop anchored to active island (swaps per district)
  let currentSkyId: GsrLevelId = initialId;
  const initDoc = getLevelDoc(initialId);
  const skyGroup = new THREE.Group();
  const [ix, iy, iz] = MEGA_WORLD_OFFSETS[initialId];
  skyGroup.position.set(ix, iy, iz);
  let skybox = createRegionalSkybox(initDoc);
  let skyVis = createSkyVisualizer(initDoc);
  let cartoonBackdrop = createCartoonBackdrop(initDoc);
  skyGroup.add(skybox.group, skyVis.group, cartoonBackdrop.group);
  group.add(skyGroup);

  // Inter-Island Sky Ley-Line Grind Rails
  const skyBeads: { curve: THREE.CatmullRomCurve3; mesh: THREE.Mesh; offset: number; speed: number }[] = [];
  const beadGeo = new THREE.SphereGeometry(0.35, 8, 8);
  disposables.push(beadGeo);

  for (const sr of MEGA_SKY_RAILS) {
    const pts = sr.rail.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.18, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: sr.rail.color,
      emissive: sr.rail.color,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    });
    const beadMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    disposables.push(tubeGeo, tubeMat, beadMat);
    group.add(new THREE.Mesh(tubeGeo, tubeMat));

    for (let i = 0; i < 3; i++) {
      const bead = new THREE.Mesh(beadGeo, beadMat);
      group.add(bead);
      skyBeads.push({ curve, mesh: bead, offset: i / 3, speed: 0.14 });
    }
  }

  let frameCounter = 0;

  return {
    group,
    islands,
    setFlowVisible(v) {
      for (const w of islands.values()) w.setFlowVisible(v);
    },
    update(activeId, t, beatPulse, bossActive, bossWavePhase, hype, comboMult, bossPosOverride) {
      frameCounter++;
      const [ax, ay, az] = MEGA_WORLD_OFFSETS[activeId];
      if (activeId !== currentSkyId) {
        currentSkyId = activeId;
        skyGroup.remove(skybox.group, skyVis.group, cartoonBackdrop.group);
        skybox.dispose();
        skyVis.dispose();
        cartoonBackdrop.dispose();
        const nextDoc = getLevelDoc(activeId);
        skybox = createRegionalSkybox(nextDoc);
        skyVis = createSkyVisualizer(nextDoc);
        cartoonBackdrop = createCartoonBackdrop(nextDoc);
        skyGroup.add(skybox.group, skyVis.group, cartoonBackdrop.group);
        skyGroup.position.set(ax, ay, az);
      } else {
        skyGroup.position.x += (ax - skyGroup.position.x) * 0.08;
        skyGroup.position.y += (ay - skyGroup.position.y) * 0.08;
        skyGroup.position.z += (az - skyGroup.position.z) * 0.08;
      }

      skybox.update(t, beatPulse, hype);
      skyVis.update(t, beatPulse, hype, comboMult);
      cartoonBackdrop.update(t, beatPulse, hype, comboMult);

      for (const sb of skyBeads) {
        const u = (t * sb.speed + sb.offset) % 1;
        sb.curve.getPointAt(u, sb.mesh.position);
      }

      for (const [id, w] of islands) {
        if (id === activeId) {
          w.update(t, beatPulse, bossActive, bossWavePhase, hype, comboMult, bossPosOverride);
        } else if (frameCounter % 6 === 0) {
          w.update(t, beatPulse, false, 0, 0.3, 1);
        }
      }
    },
    dispose() {
      skybox.dispose();
      skyVis.dispose();
      cartoonBackdrop.dispose();
      for (const w of islands.values()) w.dispose();
      for (const d of disposables) d.dispose();
    },
  };
}
