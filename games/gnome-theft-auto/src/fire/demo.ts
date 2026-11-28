// E25 fire system dev demo: ?firedemo lights a few fires of each kind ahead of the player (and a fuel point to spread
// to); ?firedemo=douse puts them out over a few seconds. For screenshots and checking fire/view.ts. Does nothing
// without the URL parameter.
import type * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Fx, Player } from '../types';
import { heightAt } from '../terrain';
import { createFireView } from './view';
import { createFireField, douse, fuelPoint, ignite, stepFires } from './sim';

export interface FireDemo {
  update(dt: number): void;
}

const LIGHT_AT = 2;
const DOUSE_AT = 8;

export function installFireDemo(scene: THREE.Scene, fx: Fx, player: Player): FireDemo {
  const params = new URLSearchParams(location.search);
  if (!params.has('firedemo')) return { update() {} };
  const dousing = params.get('firedemo') === 'douse';
  const field = createFireField();
  const view = createFireView(scene, fx);
  const fuel: ReturnType<typeof fuelPoint>[] = [];
  let t = 0;
  let lit = false;

  function prefabAt(id: string, x: number, y: number, z: number) {
    if (!getPrefab(id)) return;
    const o = buildPrefab(id, { lights: false });
    o.position.set(x, y, z);
    scene.add(o);
  }

  function light() {
    const dx = Math.sin(player.yaw);
    const dz = Math.cos(player.yaw);
    const at = (ahead: number, side: number) => {
      const x = player.x + dx * ahead - dz * side;
      const z = player.z + dz * ahead + dx * side;
      return { x, z, y: heightAt(x, z) };
    };
    const bin = at(10, -4);
    const shed = at(13, 0);
    const bbq = at(11, 4);
    const toad = at(16, 6);
    prefabAt('garden-shed', shed.x, shed.y, shed.z);
    prefabAt('fire-bbq-grill', bbq.x, bbq.y, bbq.z);
    prefabAt('giant-spotted-toadstool', toad.x, toad.y, toad.z);
    ignite(field, bin.x, bin.y + 0.9, bin.z, { r: 0.5, kind: 'bin', fuel: 60 });
    ignite(field, shed.x, shed.y, shed.z, { r: 1.4, kind: 'shed', fuel: 90 });
    ignite(field, bbq.x, bbq.y + 0.8, bbq.z, { r: 0.6, kind: 'bbq', fuel: 60 });
    ignite(field, toad.x, toad.y, toad.z, { r: 0.9, kind: 'toadstool', fuel: 60 });
    const beside = at(13, 3);
    fuel.push(fuelPoint(beside.x, beside.y, beside.z, 0.8, 'generic', 60));
  }

  return {
    update(dt) {
      t += dt;
      if (!lit && t >= LIGHT_AT) { lit = true; light(); }
      if (dousing && t >= DOUSE_AT) {
        for (const f of field.fires) {
          if (f.state !== 'burning') continue;
          douse(field, f.x, f.z, f.r, 2 * dt);
          if (Math.random() < dt * 6) view.steam(f.x, f.y + 0.5, f.z);
        }
      }
      stepFires(field, dt, fuel);
      view.update(dt, field, player.x, player.z);
    },
  };
}
