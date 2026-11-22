import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, onLooksChanged, resolveLook, type GnomeModel } from '@lawn/gnome';
import { Interp } from '@lawn/mp/interp';
import type { GsrLevelId } from '../levels/loader';
import type { GsrPeer } from '../net/protocol';
import type { TrickAnimKind } from '../sim/skater';

interface RemoteRiderEntry {
  peer: GsrPeer;
  root: THREE.Group;
  model: GnomeModel;
  wheels: THREE.Mesh[];
  label: THREE.Sprite;
  labelTex: THREE.CanvasTexture;
  labelMat: THREE.SpriteMaterial;
  interp: Interp;
  area: GsrLevelId | null;
  trickTimer: number;
  trickKind: TrickAnimKind | null;
  stridePhase: number;
}

export interface RemoteRidersSystem {
  addOrUpdatePeer(peer: GsrPeer): void;
  removePeer(id: number): void;
  pushPose(
    id: number,
    area: GsrLevelId,
    p: [number, number, number, number, number, number, number, number],
    sentAt: number,
  ): void;
  triggerTrick(id: number, area: GsrLevelId, kind: TrickAnimKind): void;
  update(currentArea: GsrLevelId, dt: number): void;
  clear(): void;
  dispose(): void;
}

function makeNameBadge(name: string, colorHex: number): {
  sprite: THREE.Sprite;
  tex: THREE.CanvasTexture;
  mat: THREE.SpriteMaterial;
} {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(18, 8, 34, 0.86)';
  g.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(8, 10, 240, 44, 14);
  g.fill();
  g.stroke();

  g.fillStyle = '#ffffff';
  g.font = '900 24px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name.slice(0, 16), 128, 33, 218);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 0.55, 1);
  sprite.position.set(0, 2.05, 0);
  sprite.renderOrder = 15;
  return { sprite, tex, mat };
}

function attachSkates(model: GnomeModel, accentColor: number): THREE.Mesh[] {
  const wheels: THREE.Mesh[] = [];
  if (!model.legs) return wheels;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.4, metalness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.85,
    roughness: 0.25,
  });
  const railGeo = new THREE.BoxGeometry(0.06, 0.04, 0.34);
  const wheelGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.035, 10);

  const makeSkate = () => {
    const g = new THREE.Group();
    g.position.set(0, -0.3, 0.02);
    const rail = new THREE.Mesh(railGeo, frameMat);
    rail.position.y = 0.03;
    g.add(rail);
    for (const wz of [-0.12, -0.04, 0.04, 0.12]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, -0.008, wz);
      g.add(w);
      wheels.push(w);
    }
    return g;
  };
  model.legs.left.add(makeSkate());
  model.legs.right.add(makeSkate());
  return wheels;
}

export function createRemoteRiders(scene: THREE.Scene): RemoteRidersSystem {
  const riders = new Map<number, RemoteRiderEntry>();
  const sampleOut = new Array<number>(8).fill(0);

  function buildModelForPeer(peer: GsrPeer): { model: GnomeModel; wheels: THREE.Mesh[] } {
    const resolved = resolveLook({
      id: peer.id,
      character: peer.character,
      userId: peer.userId,
    });
    const look = { ...(resolved ?? GNORMAN_LOOK), hat: peer.color };
    const model = createGnomeModel(look);
    model.object.position.y = 0.08;
    const wheels = attachSkates(model, peer.color);
    return { model, wheels };
  }

  function addOrUpdatePeer(peer: GsrPeer): void {
    const existing = riders.get(peer.id);
    if (existing) {
      existing.peer = peer;
      return;
    }
    const root = new THREE.Group();
    root.visible = false;
    const { model, wheels } = buildModelForPeer(peer);
    root.add(model.object);
    const badge = makeNameBadge(peer.name, peer.color);
    root.add(badge.sprite);
    scene.add(root);

    riders.set(peer.id, {
      peer,
      root,
      model,
      wheels,
      label: badge.sprite,
      labelTex: badge.tex,
      labelMat: badge.mat,
      interp: new Interp({
        angles: [3],
        steps: [7],
        pos: [0, 1, 2],
        snapDist: 16,
      }),
      area: null,
      trickTimer: -1,
      trickKind: null,
      stridePhase: Math.random() * Math.PI * 2,
    });
  }

  function removePeer(id: number): void {
    const entry = riders.get(id);
    if (!entry) return;
    scene.remove(entry.root);
    entry.labelTex.dispose();
    entry.labelMat.dispose();
    riders.delete(id);
  }

  const unsubLooks = onLooksChanged(() => {
    for (const entry of riders.values()) {
      entry.root.remove(entry.model.object);
      const rebuilt = buildModelForPeer(entry.peer);
      entry.model = rebuilt.model;
      entry.wheels = rebuilt.wheels;
      entry.root.add(entry.model.object);
    }
  });

  return {
    addOrUpdatePeer,
    removePeer,
    pushPose(id, area, p, sentAt) {
      const entry = riders.get(id);
      if (!entry) return;
      if (entry.area !== area) {
        entry.area = area;
        entry.interp.clear();
      }
      entry.interp.push(p, sentAt);
    },
    triggerTrick(id, area, kind) {
      const entry = riders.get(id);
      if (!entry || entry.area !== area) return;
      entry.trickKind = kind;
      entry.trickTimer = 0;
    },
    update(currentArea, dt) {
      const now = performance.now();
      for (const entry of riders.values()) {
        if (entry.area !== currentArea || !entry.interp.sample(sampleOut, now)) {
          entry.root.visible = false;
          continue;
        }
        entry.root.visible = true;
        const [x, y, z, yaw, vx, , vz, flags] = sampleOut as [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
        ];
        entry.root.position.set(x, y + 0.05, z);
        entry.root.rotation.order = 'YXZ';
        entry.root.rotation.y = yaw;

        const spd = Math.hypot(vx, vz);
        for (const w of entry.wheels) w.rotation.x += spd * dt * 12;

        const grinding = (flags & 2) !== 0;
        const grounded = (flags & 1) !== 0;
        if (entry.trickTimer >= 0) {
          entry.trickTimer += dt;
          const u = Math.min(1, entry.trickTimer / 0.42);
          entry.model.rig.rotation.x = entry.trickKind === 'frontflip' || entry.trickKind === 'cork' ? u * Math.PI * 2 : 0;
          entry.model.rig.rotation.y = entry.trickKind === 'spin360' || entry.trickKind === 'groundSpin' ? u * Math.PI * 2 : 0;
          if (u >= 1) {
            entry.trickTimer = -1;
            entry.trickKind = null;
            entry.model.rig.rotation.set(0, 0, 0);
          }
        } else if (grinding) {
          entry.model.rig.rotation.set(0.14, 0.6, 0);
        } else if (!grounded) {
          entry.model.rig.rotation.set(0, 0, 0);
        } else if (spd > 1.2) {
          entry.stridePhase += spd * dt * 0.6;
          const stride = Math.sin(entry.stridePhase) * 0.45;
          if (entry.model.legs) {
            entry.model.legs.left.rotation.x = stride;
            entry.model.legs.right.rotation.x = -stride;
          }
          entry.model.rig.rotation.set(0.18, 0, 0);
        } else {
          if (entry.model.legs) {
            entry.model.legs.left.rotation.x = 0;
            entry.model.legs.right.rotation.x = 0;
          }
          entry.model.rig.rotation.set(0, 0, 0);
        }
      }
    },
    clear() {
      for (const id of [...riders.keys()]) removePeer(id);
    },
    dispose() {
      unsubLooks();
      for (const id of [...riders.keys()]) removePeer(id);
    },
  };
}
