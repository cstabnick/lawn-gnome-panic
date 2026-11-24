// Park life (docs/roadmaps/gta-parks-and-fringe.md): park townsgnomes (ambientGnomes.ts), ducks paddling on the ponds,
// benches to sit on (the sit-bench emote, through app.ts's 'gta:emote' listener) and wishing fountains (1 Acorn: a
// fortune, a splash of Glaze, or now and then five Acorns back). All local: nothing is sent online.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { createAmbientGnomes } from '../ambientGnomes';
import { registerCull } from '../cull';
import { addInteractSpot } from '../interactables';
import { heightAt } from '../terrain';
import type { DressPlan, UseSpot } from '../cityScenery/types';

export interface ParkLife { update(dt: number, px: number, pz: number): void }

const MAX_DUCKS = 8;
const DUCK_RANGE = 120;
const WISH_COOLDOWN = 20;

const FORTUNES: readonly string[] = [
  'Your hat will stay on in a strong wind. Once.',
  'A mower you never locked will still be there. This time.',
  'City Hall will lose your parking ticket.',
  'The Hat Watch will look the other way for exactly one second.',
  'A stranger will lend you a spark plug and never ask for it back.',
  'Your glaze will shine in the rain. Mind the puddles.',
  'The Long Grass League will name a verge after you.',
  'Somebody downtown is saying nice things about your beard.',
  'An Acorn saved is an Acorn you will spend at the Bodega.',
  'The next traffic cone you see is meant for you. Leave it.',
  'You will find the way out of the rose maze. Eventually.',
  'Today the pigeons are on your side.',
];

interface Duck { obj: THREE.Object3D; r: number; speed: number; phase: number; a: number }
interface Pond { x: number; z: number; y: number; group: THREE.Group; ducks: Duck[] }

export function createParkLife(scene: THREE.Scene, plan: DressPlan): ParkLife {
  const gnomes = plan.gnomes.length > 0 ? createAmbientGnomes(scene, plan.gnomes) : null;

  // Ducks: one group per pond.
  const ponds: Pond[] = [];
  let left = MAX_DUCKS;
  for (const d of plan.ducks) {
    const n = Math.min(d.n, left);
    if (n <= 0) break;
    left -= n;
    const group = new THREE.Group();
    group.name = 'park-ducks';
    const pond: Pond = { x: d.x, z: d.z, y: heightAt(d.x, d.z), group, ducks: [] };
    for (let k = 0; k < n; k++) {
      const obj = buildPrefab('hunt-mallard', { lights: false });
      obj.traverse((o) => { o.castShadow = false; });
      const duck: Duck = { obj, r: d.r * (0.55 + (0.45 * k) / n), speed: 0.18 + 0.05 * k, phase: k * 2.1, a: k * 2.1 };
      group.add(obj);
      pond.ducks.push(duck);
    }
    scene.add(group);
    ponds.push(pond);
    poseDucks(pond, 0);
    registerCull(group, 'prop', { moves: true });
  }

  function poseDucks(p: Pond, t: number): void {
    for (const d of p.ducks) {
      d.obj.position.set(p.x + Math.cos(d.a) * d.r, p.y + 0.03 + 0.02 * Math.sin(2 * t + d.phase), p.z + Math.sin(d.a) * d.r);
      // Heading along the circle (counter-clockwise in x, z): velocity (-sin a, cos a); yaw = atan2(vx, vz).
      d.obj.rotation.y = Math.atan2(-Math.sin(d.a), Math.cos(d.a));
    }
  }

  // Benches and wishing fountains, through the interact prompt.
  for (const u of plan.uses) {
    if (u.kind === 'bench') addBench(u);
    else addWish(u);
  }

  let t = 0;
  return {
    update(dt, px, pz) {
      t += dt;
      gnomes?.update(dt, px, pz);
      for (const p of ponds) {
        const dx = px - p.x, dz = pz - p.z;
        if (dx * dx + dz * dz > DUCK_RANGE * DUCK_RANGE) continue;
        for (const d of p.ducks) d.a += d.speed * dt;
        poseDucks(p, t);
      }
    },
  };
}

function addBench(u: UseSpot): void {
  addInteractSpot({
    x: u.x, z: u.z, prompt: 'Sit on the bench',
    run(player) {
      player.x = u.x;
      player.z = u.z;
      player.yaw = u.yaw;
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gta:emote', { detail: 'sit-bench' }));
      return true;
    },
  });
}

let fortune = 0;
function addWish(u: UseSpot): void {
  let readyAt = -Infinity;
  addInteractSpot({
    x: u.x, z: u.z, prompt: 'Toss an Acorn in the fountain (1 Acorn)',
    run(player, { hud, economy, fx, play }) {
      const now = performance.now() / 1000;
      if (now < readyAt) {
        hud.toast('The water is still rippling. Give it a moment.', 3000);
        return false;
      }
      if (!economy.spend(1, 'Wish')) {
        hud.toast('You need an Acorn to make a wish.', 3000);
        return false;
      }
      readyAt = now + WISH_COOLDOWN;
      fx.spark(u.x, 0.8, u.z);
      play('splash');
      const roll = Math.random();
      if (roll < 0.1) {
        economy.earn(5, 'Wish');
        hud.toast('The fountain coughs up five Acorns. Lucky gnome.', 4000);
      } else if (roll < 0.35) {
        player.health = Math.min(1, player.health + 0.15);
        hud.toast('A cool splash. +15% Glaze.', 4000);
      } else {
        hud.toast(FORTUNES[fortune % FORTUNES.length], 4000);
        fortune++;
      }
      return true;
    },
  });
}
