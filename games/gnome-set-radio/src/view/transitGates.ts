import * as THREE from 'three';
import { getArchipelagoNode, type ArchipelagoLink } from '../data/archipelago';
import type { GsrLevelId } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export function getNeighborIslandPos(link: ArchipelagoLink): THREE.Vector3 {
  const dist = 144;
  return new THREE.Vector3(
    Math.cos(link.vistaBearing) * dist,
    Math.max(4, 18 + link.vistaElevationOffset),
    Math.sin(link.vistaBearing) * dist,
  );
}

export function buildTransitCableCurve(link: ArchipelagoLink): THREE.CatmullRomCurve3 {
  const gPos = new THREE.Vector3(link.gatePos[0], link.gatePos[1] + 3.2, link.gatePos[2]);
  const nPos = getNeighborIslandPos(link);
  const tPos = new THREE.Vector3(nPos.x, nPos.y + 1.5, nPos.z);
  const mid = gPos.clone().lerp(tPos, 0.5);
  mid.y += Math.max(10, Math.abs(nPos.y - gPos.y) * 0.45);
  return new THREE.CatmullRomCurve3([gPos, mid, tPos]);
}

export interface TransitGateEntry {
  link: ArchipelagoLink;
  root: THREE.Group;
  ring: THREE.Mesh;
}

export interface TransitGatesSystem {
  gates: TransitGateEntry[];
  update(t: number, beatPulse: number): void;
  dispose(): void;
}

function makeGateSign(link: ArchipelagoLink): {
  sprite: THREE.Sprite;
  tex: THREE.CanvasTexture;
  mat: THREE.SpriteMaterial;
} {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;

  g.fillStyle = '#140824';
  g.strokeStyle = link.color;
  g.lineWidth = 8;
  g.beginPath();
  g.roundRect(8, 8, 496, 112, 20);
  g.fill();
  g.stroke();

  const badge =
    link.transitType === 'pink-gondola'
      ? 'EXPRESS GONDOLA'
      : link.transitType === 'subsoil-lift'
      ? 'SUBSOIL 108.0 LIFT'
      : link.direction === 'north'
      ? 'NEXT RUNG ↑'
      : 'PREV RUNG ↓';

  g.fillStyle = link.color;
  g.font = '900 22px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText(badge, 256, 44, 460);

  g.fillStyle = '#ffffff';
  g.font = '800 24px system-ui, sans-serif';
  g.fillText(link.label, 256, 86, 468);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6.4, 1.6, 1);
  sprite.position.set(0, 5.4, 0);
  sprite.renderOrder = 18;
  return { sprite, tex, mat };
}

export function buildTransitGates(
  doc: GsrLevelDoc,
  group: THREE.Group,
  track: <T extends { dispose(): void }>(x: T) => T,
): TransitGatesSystem {
  const node = getArchipelagoNode(doc.id as GsrLevelId);
  const gates: TransitGateEntry[] = [];
  const signDisposables: { dispose(): void }[] = [];

  const postMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', metalness: 0.6, roughness: 0.35 }));
  const postGeo = track(new THREE.CylinderGeometry(0.24, 0.32, 3.6, 10));
  const archGeo = track(new THREE.TorusGeometry(2.4, 0.18, 8, 22, Math.PI));
  const portalRingGeo = track(new THREE.TorusGeometry(1.35, 0.1, 8, 20));

  for (const link of node.links) {
    const holder = new THREE.Group();
    holder.position.set(link.gatePos[0], link.gatePos[1], link.gatePos[2]);
    holder.rotation.y = link.gateYaw;

    const glowMat = track(
      new THREE.MeshStandardMaterial({
        color: link.color,
        emissive: link.color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      }),
    );

    for (const sx of [-2.4, 2.4]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(sx, 1.8, 0);
      holder.add(post);
    }

    const arch = new THREE.Mesh(archGeo, glowMat);
    arch.position.set(0, 3.4, 0);
    holder.add(arch);

    const ring = new THREE.Mesh(portalRingGeo, glowMat);
    ring.position.set(0, 2.2, 0);
    holder.add(ring);

    const sign = makeGateSign(link);
    holder.add(sign.sprite);
    signDisposables.push(sign.tex, sign.mat);

    group.add(holder);
    gates.push({ link, root: holder, ring });
  }

  return {
    gates,
    update(t, beatPulse) {
      for (const g of gates) {
        g.ring.rotation.y = t * 1.6;
        g.ring.scale.setScalar(1 + beatPulse * 0.12);
      }
    },
    dispose() {
      for (const d of signDisposables) d.dispose();
    },
  };
}
