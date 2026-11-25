// Burrowfolk life on the surface at the Burrow Door (E17 issue B11): Nubbin waiting by the door, a mole peeking from a
// molehill now and then.
import type { Object3D } from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { registerHome, homeOf } from '../../homes/data';
import { heightAt } from '../../terrain';
import { BURROW_DOOR, SOCIETY_INTERIORS, type SocietyDeps, type SocietyPart } from '../config';

const TAU = Math.PI * 2;
const E_FACING = Math.PI / 2; // east
const NEAR = 60;
const HIDDEN_DROP = 0.75;  // how far below the ground a molehill mole sits when hidden
const PEEK_RISE = 0.35;    // how far it rises when it peeks out

/** Nubbin's home and Tumblesoil's home point at the Burrow Door (registered once, when the part is installed). */
function registerBurrowHomes(): void {
  const door: [number, number, number] = [BURROW_DOOR.door.x, BURROW_DOOR.door.z, BURROW_DOOR.door.yaw];
  for (const id of ['nubbin', 'tumblesoil']) {
    const home = homeOf(id);
    if (!home) continue;
    registerHome({ ...home, door, interiorId: SOCIETY_INTERIORS.loamdeep });
  }
}

export function installBurrowSurface(deps: SocietyDeps): SocietyPart {
  registerBurrowHomes();

  const nd = BURROW_DOOR.nubbin;
  const nubbin: Object3D | null = getPrefab('mole-nubbin')
    ? buildPrefab('mole-nubbin', { lights: false }) : null;
  let nubbinHead: Object3D | undefined;
  let nubbinBody: Object3D | undefined;
  let nubbinBaseY = 0;
  if (nubbin) {
    nubbin.position.set(nd.x, heightAt(nd.x, nd.z), nd.z);
    nubbin.rotation.y = nd.yaw;
    deps.scene.add(nubbin);
    nubbinHead = nubbin.getObjectByName('head');
    nubbinBody = nubbin.getObjectByName('body');
    nubbinBaseY = nubbinBody ? nubbinBody.position.y : 0;
  }

  // The peeking mole, in the first molehill.
  const hill = BURROW_DOOR.molehills[0];
  const groundY = heightAt(hill[0], hill[1]);
  const peek: Object3D | null = getPrefab('burrowfolk-mole')
    ? buildPrefab('burrowfolk-mole', { lights: false }) : null;
  let peekY = groundY - HIDDEN_DROP;
  let peekTarget = peekY;
  let peekUp = false;
  let peekTimer = 15 + Math.random() * 10;
  if (peek) {
    peek.position.set(hill[0], peekY, hill[1]);
    peek.rotation.y = E_FACING;
    deps.scene.add(peek);
  }

  return {
    update(dt: number, t: number): void {
      const px = deps.player.x - nd.x;
      const pz = deps.player.z - nd.z;
      if (px * px + pz * pz > NEAR * NEAR) return;

      if (nubbin && nubbinBody) {
        nubbinBody.position.y = nubbinBaseY + 0.015 * Math.sin(TAU * 1.1 * t);
      }
      if (nubbinHead) nubbinHead.rotation.y = 0.15 * Math.sin(TAU * 0.7 * t);

      if (peek) {
        peekTimer -= dt;
        if (peekTimer <= 0) {
          // Up for 3 s, then down again for 15-25 s.
          peekUp = !peekUp;
          peekTimer = peekUp ? 3 : 15 + Math.random() * 10;
          peekTarget = peekUp ? groundY - HIDDEN_DROP + PEEK_RISE : groundY - HIDDEN_DROP;
        }
        peekY += (peekTarget - peekY) * Math.min(1, dt * 6);
        peek.position.y = peekY;
      }
    },
  };
}
