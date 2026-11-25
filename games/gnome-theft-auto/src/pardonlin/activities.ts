// Pardonlin's side activities (E30): small town jobs that pull the player round the districts. Not journal quests (they
// never count against the side-quest offer caps): each has its own giver spot in town and its own little state.
// The state machines live in activityLogic.ts; this file places the spots and markers and reports the toasts.
import * as THREE from 'three';
import { addInteractSpot } from '../interactables';
import { heightAt } from '../terrain';
import { districtAt, DISTRICTS } from './layout';
import {
  QUEUE_POINTS, ROUND_DROPS, deliverAt, parseVisited, roundComplete, roundReward, startPortrait, startQueue, startRound,
  stepPortrait, stepQueue, tickRound, visitDistrict, type PortraitState, type QueueState, type RoundState,
} from './activityLogic';

export interface PardonlinActivityDeps {
  scene: THREE.Scene;
  toast(text: string, ms?: number): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  earn(acorns: number, why: string): void;
}

export interface PlayerView {
  x: number;
  z: number;
  /** The kind of vehicle the player drives or rides (VehicleKind), or null on foot. */
  vehicle: string | null;
}

export interface PardonlinActivities {
  update(dt: number, p: PlayerView): void;
}

const CENTRE = { x: -1600, z: 100 } as const;
const NEAR_M = 1500;
const BRIGITTE_SPOT = { x: -1520.5, z: 128.5 } as const;
const ODILE_SPOT = { x: -1540, z: -270 } as const;
const FLANEUR_KEY = 'gta-pl-flaneur-v1';
const QUEUE_KEY = 'gta-pl-queue-v1';
const QUEUE_LOOK_BASE_Y = 1.2;
const BAGUETTE_Y = 1.5;

function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the activity still works, it just forgets */
  }
}

export function createPardonlinActivities(deps: PardonlinActivityDeps): PardonlinActivities {
  const { scene, toast, unlock, increment, earn } = deps;
  let clock = 0;
  let lastVehicle: string | null = null;

  // ---- Queued for Nothing ----
  let queue: QueueState | null = null;
  let queueRewarded = readStore(QUEUE_KEY) === '1';
  const queueMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc33 }),
  );
  queueMarker.rotation.x = Math.PI; // apex down
  queueMarker.visible = false;
  scene.add(queueMarker);

  addInteractSpot({
    x: QUEUE_POINTS[0][0],
    z: QUEUE_POINTS[0][1],
    prompt: 'Join the queue',
    run() {
      if (queue?.active) {
        toast('You are already in the queue. Stay put.');
        return true;
      }
      queue = startQueue();
      queueMarker.visible = true;
      toast('You join the queue. It is long. It is not moving yet.');
      return true;
    },
  });

  function endQueue(): void {
    queue = null;
    queueMarker.visible = false;
  }

  // ---- The Baguette Round ----
  let round: RoundState | null = null;
  const roundGroup = new THREE.Group();
  scene.add(roundGroup);
  const baguetteGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.6, 8);
  const baguetteMat = new THREE.MeshBasicMaterial({ color: 0xc98a3c });
  const dropPivots: THREE.Group[] = ROUND_DROPS.map((d) => {
    const pivot = new THREE.Group();
    pivot.position.set(d.x, heightAt(d.x, d.z) + BAGUETTE_Y, d.z);
    const loaf = new THREE.Mesh(baguetteGeo, baguetteMat);
    loaf.rotation.z = Math.PI / 2; // lying along x
    pivot.add(loaf);
    roundGroup.add(pivot);
    return pivot;
  });
  roundGroup.visible = false;

  function showDrops(r: RoundState | null): void {
    roundGroup.visible = r !== null;
    if (!r) return;
    dropPivots.forEach((p, i) => (p.visible = !r.done[i]));
  }

  function endRound(): void {
    round = null;
    showDrops(null);
  }

  addInteractSpot({
    x: BRIGITTE_SPOT.x,
    z: BRIGITTE_SPOT.z,
    prompt: 'Talk to Brigitte',
    run() {
      if (round && !round.over) {
        toast('Brigitte: Still bread in the basket. Go on.');
        return true;
      }
      round = startRound();
      showDrops(round);
      toast('Brigitte: Five baguettes, five doors, before the bread gets ideas. Four minutes.');
      return true;
    },
  });

  // ---- Portrait of a Croissant ----
  let portrait: PortraitState | null = null;
  addInteractSpot({
    x: ODILE_SPOT.x,
    z: ODILE_SPOT.z,
    prompt: 'Sit for a portrait',
    run() {
      if (portrait && !portrait.done) {
        toast('Odile: Sit. Do not wave at the pigeons.');
        return true;
      }
      if (lastVehicle) {
        toast('Odile: Get out of that thing. I cannot paint a moving gnome.');
        return true;
      }
      portrait = startPortrait();
      toast('Odile: Stand there. Do not blink. Do not breathe, unless you must.');
      return true;
    },
  });

  // ---- Flaneur ----
  let visited = parseVisited(readStore(FLANEUR_KEY));

  return {
    update(dt: number, p: PlayerView): void {
      lastVehicle = p.vehicle;
      clock += dt;
      if (Math.hypot(p.x - CENTRE.x, p.z - CENTRE.z) > NEAR_M) return;
      const onFoot = p.vehicle === null;

      // Queue
      if (queue?.active) {
        for (const e of stepQueue(queue, dt, p.x, p.z)) {
          if (e.kind === 'lost') {
            toast('You have lost your place. Pardon.');
            endQueue();
          } else if (e.kind === 'shuffle') {
            toast(e.line);
          } else {
            toast('You reach the front. There is nothing at the front. Well queued.');
            if (!queueRewarded) {
              queueRewarded = true;
              writeStore(QUEUE_KEY, '1');
              earn(40, 'Queued for Nothing');
            }
            unlock('gta-pl-queue');
            endQueue();
          }
        }
        if (queue) {
          const [qx, qz] = QUEUE_POINTS[queue.index];
          queueMarker.position.set(qx, heightAt(qx, qz) + QUEUE_LOOK_BASE_Y + Math.sin(clock * 4) * 0.15, qz);
        }
      }

      // Baguette Round
      if (round && !round.over) {
        const ev = tickRound(round, dt);
        if (ev === 'warn') toast('Brigitte: One minute left. The bread is cooling its heels.');
        if (ev === 'fail') {
          toast('Brigitte: The bread has gone stale with disappointment.');
          endRound();
        }
      }
      if (round && !round.over) {
        const i = deliverAt(round, p.x, p.z, p.vehicle);
        if (i >= 0) {
          toast(ROUND_DROPS[i].line);
          showDrops(round);
        }
        if (roundComplete(round)) {
          const reward = roundReward(round);
          earn(reward, 'Baguette Round');
          unlock('gta-pl-baguette-round');
          toast(`Brigitte: Five doors, five bakes. Here is your ${reward} acorns and a bad joke about rolls.`);
          endRound();
        }
      }
      if (round) {
        dropPivots.forEach((pv, i) => {
          if (pv.visible) pv.rotation.y = clock * 2 + i;
        });
      }

      // Portrait of a Croissant
      if (portrait && !portrait.done) {
        const inPlace = onFoot && Math.hypot(p.x - ODILE_SPOT.x, p.z - ODILE_SPOT.z) <= 1.0;
        for (const e of stepPortrait(portrait, dt, inPlace)) {
          if (e.kind === 'moved') toast('Odile: You moved. I must begin again. With a sigh.');
          else if (e.kind === 'progress') {
            if (e.at === 5) toast('Odile: Good. Hold the chin up.');
            else if (e.at === 10) toast('She is doing the nose. She has decided you have a croissant for a nose.');
            else toast('Odile: The hat is taking longer than I thought. Still.');
          } else {
            toast('Odile shows you the canvas. It is a croissant. \'It is you,\' she says. It is a croissant.');
            earn(30, 'Portrait');
            unlock('gta-pl-portrait');
          }
        }
      }

      // Flaneur
      if (onFoot) {
        const d = districtAt(p.x, p.z);
        if (d) {
          const next = visitDistrict(visited, d);
          if (next) {
            visited = next;
            writeStore(FLANEUR_KEY, JSON.stringify(visited));
            increment('gta-pl-flaneur', 1);
            const name = DISTRICTS.find((x) => x.id === d)?.name ?? d;
            toast(`Flâneur: ${name} (${visited.length}/${DISTRICTS.length})`);
          }
        }
      }
    },
  };
}
