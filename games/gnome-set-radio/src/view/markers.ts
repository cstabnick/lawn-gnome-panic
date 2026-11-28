import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { LevelSession } from '../game/events';
import type { GsrLevelDoc } from '../levels/schema';

export interface EtherealMarker {
  root: THREE.Group;
  pillar: THREE.Mesh;
  ringA: THREE.Mesh;
  ringB: THREE.Mesh;
  crystal: THREE.Mesh;
  badge: THREE.Sprite;
  baseY: number;
  dispose(): void;
}

export interface MarkerTarget {
  id: string;
  eventId: string;
  label: string;
  kind: 'story' | 'boss' | 'side';
  marker: EtherealMarker;
  getPos(): { x: number; y: number; z: number };
  isDone(session: LevelSession): boolean;
}

export interface MarkerSystem {
  update(t: number, beatPulse: number, session: LevelSession): void;
  nearestTarget(
    x: number,
    y: number,
    z: number,
    session: LevelSession,
  ): { label: string; kind: 'story' | 'boss' | 'side'; x: number; y: number; z: number; dist: number } | null;
  dispose(): void;
}

const badgeTexCache = new Map<string, THREE.CanvasTexture>();

function getBadgeTexture(text: string, colorHex: string): THREE.CanvasTexture {
  const key = `${text}:${colorHex}`;
  const existing = badgeTexCache.get(key);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 160, 64);

  g.fillStyle = 'rgba(18, 8, 34, 0.9)';
  g.strokeStyle = colorHex;
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(6, 8, 148, 48, 16);
  g.fill();
  g.stroke();

  g.font = '900 22px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.fillText(text, 80, 33);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  badgeTexCache.set(key, tex);
  return tex;
}

export function createEtherealMarker(opts: {
  color: string;
  label: string;
  height?: number;
  scale?: number;
}): EtherealMarker {
  const h = opts.height ?? 11;
  const sc = opts.scale ?? 1;
  const root = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  // Translucent vertical light pillar
  const pillarGeo = track(new THREE.CylinderGeometry(0.14 * sc, 0.7 * sc, h, 12, 1, true));
  const pillarMat = track(
    new THREE.MeshBasicMaterial({
      color: opts.color,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = h * 0.5;
  root.add(pillar);

  // Ground halo ring
  const groundGeo = track(new THREE.RingGeometry(1.1 * sc, 1.55 * sc, 24));
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = track(
    flatLayer(
      new THREE.MeshBasicMaterial({
        color: opts.color,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      LAYER.marker,
    ),
  );
  const groundRing = new THREE.Mesh(groundGeo, groundMat);
  groundRing.position.y = 0.08;
  root.add(groundRing);

  // Dual counter-rotating orbiting halo rings
  const ringMat = track(
    new THREE.MeshBasicMaterial({
      color: opts.color,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const ringA = new THREE.Mesh(track(new THREE.TorusGeometry(0.95 * sc, 0.055 * sc, 8, 24)), ringMat);
  ringA.position.y = 2.6 * sc;
  ringA.rotation.x = 0.9;
  root.add(ringA);

  const ringB = new THREE.Mesh(track(new THREE.TorusGeometry(0.72 * sc, 0.045 * sc, 8, 24)), ringMat);
  ringB.position.y = 2.6 * sc;
  ringB.rotation.y = 0.8;
  root.add(ringB);

  // Bobbing crystal chevron
  const crystalGeo = track(new THREE.OctahedronGeometry(0.45 * sc));
  const crystalMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: opts.color,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    }),
  );
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.scale.set(0.65, 1.1, 0.65);
  crystal.position.y = 3.2 * sc;
  root.add(crystal);

  // Floating badge sprite
  const spriteMat = track(
    new THREE.SpriteMaterial({
      map: getBadgeTexture(opts.label, opts.color),
      transparent: true,
      depthWrite: false,
    }),
  );
  const badge = new THREE.Sprite(spriteMat);
  badge.scale.set(2.5 * sc, 1.0 * sc, 1);
  badge.position.y = 4.4 * sc;
  root.add(badge);

  return {
    root,
    pillar,
    ringA,
    ringB,
    crystal,
    badge,
    baseY: 0,
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

export function createMarkerSystem(
  scene: THREE.Object3D,
  doc: GsrLevelDoc,
  refs: {
    getBillboardDone: (id: string) => boolean;
    getInteractiveDone: (id: string) => boolean;
    getChasePos: () => { x: number; y: number; z: number } | null;
    getSentryStates: () => { x: number; y: number; z: number; tagged: boolean }[];
    getBossPos: () => { x: number; y: number; z: number } | null;
  },
): MarkerSystem {
  const group = new THREE.Group();
  scene.add(group);
  const targets: MarkerTarget[] = [];

  const addTarget = (
    id: string,
    eventId: string,
    label: string,
    kind: 'story' | 'boss' | 'side',
    color: string,
    height: number,
    scale: number,
    getPos: () => { x: number; y: number; z: number },
    isDone: (session: LevelSession) => boolean,
  ): void => {
    const marker = createEtherealMarker({ color, label, height, scale });
    const p = getPos();
    marker.root.position.set(p.x, p.y, p.z);
    group.add(marker.root);
    targets.push({ id, eventId, label, kind, marker, getPos, isDone });
  };

  // Billboards
  for (const bb of doc.data.billboards) {
    if (!bb.eventId) continue;
    addTarget(
      bb.id,
      bb.eventId,
      'TAG',
      'story',
      '#ff4ecd',
      11,
      1.0,
      () => ({ x: bb.x, y: bb.y, z: bb.z }),
      (sess) => refs.getBillboardDone(bb.id) || (sess.events.get(bb.eventId!)?.completed ?? false),
    );
  }

  // Interactives tied to events
  for (const it of doc.data.interactives) {
    if (!it.eventId) continue;
    const ev = doc.data.events.find((e) => e.id === it.eventId);
    const kind = ev?.kind ?? 'story';
    const isSide = kind === 'side';
    const color = isSide ? '#00e5ff' : it.kind === 'bongo-pad' ? '#ff9100' : it.kind === 'aerial-ring' ? '#69f0ae' : '#ffd740';
    const label =
      it.kind === 'relay-dish' || it.kind === 'speaker-stack'
        ? 'TUNE'
        : it.kind === 'bongo-pad'
        ? 'BOUNCE'
        : it.kind === 'aerial-ring'
        ? 'RING'
        : it.kind === 'tempo-acorn'
        ? 'ACORN'
        : 'OBJECT';
    addTarget(
      it.id,
      it.eventId,
      label,
      kind,
      color,
      isSide ? 8 : 11,
      isSide ? 0.85 : 0.95,
      () => ({ x: it.x, y: it.y, z: it.z }),
      (sess) => refs.getInteractiveDone(it.id) || (sess.events.get(it.eventId!)?.completed ?? false),
    );
  }

  // Chase, Sentries, Side-Story NPCs, Boss
  for (const ev of doc.data.events) {
    if (ev.objectiveType === 'chase') {
      addTarget(
        ev.id,
        ev.id,
        'CHASE',
        'story',
        '#ff4ecd',
        14,
        1.1,
        () => refs.getChasePos() ?? { x: ev.x, y: ev.y, z: ev.z },
        (sess) => sess.events.get(ev.id)?.completed ?? false,
      );
    } else if (ev.objectiveType === 'sentries') {
      for (let i = 0; i < 3; i++) {
        const idx = i;
        addTarget(
          `${ev.id}-${idx}`,
          ev.id,
          'SENTRY',
          'story',
          '#ff9100',
          10,
          0.95,
          () => {
            const st = refs.getSentryStates()[idx];
            return st ? { x: st.x, y: st.y, z: st.z } : { x: ev.x, y: ev.y, z: ev.z };
          },
          (sess) => (refs.getSentryStates()[idx]?.tagged ?? false) || (sess.events.get(ev.id)?.completed ?? false),
        );
      }
    } else if (ev.kind === 'boss') {
      addTarget(
        ev.id,
        ev.id,
        'BOSS',
        'boss',
        '#ff5252',
        24,
        1.45,
        () => refs.getBossPos() ?? { x: ev.x, y: ev.y, z: ev.z },
        (sess) => !sess.bossUnlocked || (sess.events.get(ev.id)?.completed ?? false),
      );
    } else if (ev.kind === 'side' && ev.objectiveType === 'rail-combo') {
      addTarget(
        ev.id,
        ev.id,
        'COMBO',
        'side',
        '#00e5ff',
        9,
        0.9,
        () => ({ x: ev.x, y: ev.y, z: ev.z }),
        (sess) => sess.events.get(ev.id)?.completed ?? false,
      );
    }
  }

  const isTargetVisible = (tgt: MarkerTarget, session: LevelSession): boolean => {
    const ev = session.events.get(tgt.eventId);
    if (!ev || ev.completed) return false;
    if (tgt.kind === 'boss' || ev.def.kind === 'boss') {
      if (!session.bossUnlocked || !ev.active) return false;
    } else if (!ev.active) {
      return false;
    }
    return !tgt.isDone(session);
  };

  return {
    update(t, beatPulse, session) {
      for (let i = 0; i < targets.length; i++) {
        const tgt = targets[i]!;
        const visible = isTargetVisible(tgt, session);
        tgt.marker.root.visible = visible;
        if (!visible) continue;

        const p = tgt.getPos();
        tgt.marker.root.position.set(p.x, p.y, p.z);
        tgt.marker.ringA.rotation.y = t * 1.9 + i;
        tgt.marker.ringA.rotation.z = Math.sin(t * 1.2 + i) * 0.45;
        tgt.marker.ringB.rotation.x = -t * 2.3 + i;
        tgt.marker.crystal.rotation.y = t * 2.8;
        tgt.marker.crystal.position.y = 3.2 + Math.sin(t * 3.4 + i) * 0.35;
        tgt.marker.badge.position.y = 4.45 + Math.sin(t * 3.4 + i) * 0.28;

        const pMat = tgt.marker.pillar.material as THREE.MeshBasicMaterial;
        pMat.opacity = 0.16 + beatPulse * 0.16;
        const pulseScale = 1 + beatPulse * 0.15;
        tgt.marker.pillar.scale.set(pulseScale, 1, pulseScale);
      }
    },
    nearestTarget(x, y, z, session) {
      let best: { label: string; kind: 'story' | 'boss' | 'side'; x: number; y: number; z: number; dist: number } | null = null;
      for (const tgt of targets) {
        if (!isTargetVisible(tgt, session)) continue;
        const p = tgt.getPos();
        const dist = Math.hypot(p.x - x, p.y - y, p.z - z);
        if (!best || (tgt.kind === 'boss' && best.kind !== 'boss') || (tgt.kind === best.kind && dist < best.dist)) {
          best = { label: tgt.label, kind: tgt.kind, x: p.x, y: p.y, z: p.z, dist };
        }
      }
      return best;
    },
    dispose() {
      scene.remove(group);
      for (const tgt of targets) tgt.marker.dispose();
    },
  };
}
