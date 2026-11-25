// Drainpipe Court's life (E19 A4): the four regulars at their spots (Swish at his free throws, Lintel's crossover, Pansy
// stretching, Old Burdock on his bench), vignettes that tell a story with props, signs and posters with jokes, and the
// court's sounds. Prefabs are looked up by id and skipped while missing (getPrefab). Nothing is placed on the painted court.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { DEFAULT_LOOK } from '../config';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { SPORTS_CAST } from '../sports/types';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { BALL_CAGE, COURT, COURT_PEOPLE, OLD_BENCH, SCOREBOARD } from './types';

export interface CourtLife {
  boxes: Box[];
  /** t = seconds since start; px, pz = the player. gameOn: a pickup game is being played (court/render draws the
   *  players then): hide Cardoon, Lintel and Pansy and stop the free-throw loop; Old Burdock stays on his bench. */
  update(dt: number, t: number, px: number, pz: number, gameOn: boolean): void;
  /** Make Old Burdock react (arms up and a line) when the player scores in a game. */
  cheer(): void;
}

const HALF_PI = Math.PI / 2;
const PLATE_BG = 0xf2e8c8;
/** Past this distance from the court nothing animates. */
const FAR = 200;
/** Sounds play only this close to the player. */
const SOUND_RANGE = 40;
/** Seconds per free throw. */
const THROW_S = 6;

const ground = (x: number, z: number): number => heightAt(x, z);
const firstOf = (ids: readonly string[]): string | null => ids.find((id) => getPrefab(id)) ?? null;

interface PutOpts { yaw?: number; scale?: number; y?: number; pitch?: number; roll?: number }

/** One prefab stood on the ground (first id that exists); null when none does. */
function put(parent: THREE.Object3D, ids: readonly string[], x: number, z: number, o: PutOpts = {}): THREE.Object3D | null {
  const id = firstOf(ids);
  if (!id) return null;
  const obj = buildPrefab(id, { lights: false });
  obj.rotation.x = o.pitch ?? 0;
  obj.rotation.z = o.roll ?? 0;
  const grp = new THREE.Group();
  grp.add(obj);
  grp.position.set(x, ground(x, z) + (o.y ?? 0), z);
  grp.rotation.y = o.yaw ?? 0;
  grp.scale.setScalar(o.scale ?? 1);
  grp.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
  parent.add(grp);
  return grp;
}

function vignette(life: THREE.Group, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  life.add(g);
  return g;
}

/** A plate in front of a standing piece (its yaw looks the way the plate does), `y` above the ground. */
function plateAt(parent: THREE.Object3D, text: string, x: number, z: number, yaw: number, y: number, w: number, h: number, d = 0.12): void {
  const px = x + Math.sin(yaw) * d, pz = z + Math.cos(yaw) * d;
  parent.add(textPlate(text, px, ground(px, pz) + y, pz, yaw, { w, h, bg: PLATE_BG }));
}

/** Front depth of a prefab (local +z), for hanging a plate on it. */
const frontOf = (id: string | null): number => (id ? Math.max(0.1, prefabBox(id).max.z) + 0.05 : 0.12);

const inPainted = (x: number, z: number): boolean => Math.abs(x - COURT.x) <= COURT.halfX && Math.abs(z - COURT.z) <= COURT.halfZ;

export function buildCourtLife(scene: THREE.Scene): CourtLife {
  const life = new THREE.Group();
  life.name = 'court-life';
  const pieces: HomePiece[] = [];
  const plates = new THREE.Group();
  plates.name = 'court-signs';
  life.add(plates);

  // ---- Signs and posters ---------------------------------------------------------------------------------------------
  const rulesId = firstOf(['court-rules-sign', 'signpost']);
  if (rulesId) pieces.push({ prefab: rulesId, x: -104.5, z: 27.5, yaw: HALF_PI, solid: false });
  plateAt(plates, 'COURT RULES\n1. Winner keeps the court.\n2. Loser fetches the ball\nfrom the drainpipe.\n3. Swish calls his own fouls.\n4. The drainpipe is not a warranty.',
    -104.5, 27.5, HALF_PI, 1.45, 1.9, 1.0, frontOf(rulesId) + 0.02);

  const launId = firstOf(['laundrette-sign', 'signpost']);
  if (launId) pieces.push({ prefab: launId, x: -76, z: 41, yaw: Math.PI, solid: false });
  plateAt(plates, 'LATHER & LINT\nKit washed while you lose.\nSocks returned in pairs,\neventually.', -76, 41, Math.PI, 1.5, 1.5, 0.75, frontOf(launId) + 0.02);

  const posterId = firstOf(['signpost']);
  if (posterId) pieces.push({ prefab: posterId, x: -108, z: 35, yaw: HALF_PI, solid: false });
  plateAt(plates, 'PICKUP 2v2\nFIRST TO 11\nBRING A SPARE', -108, 35, HALF_PI, 1.6, 1.3, 0.7, frontOf(posterId));

  // The chalked IOU on the scoreboard's east side (the scoreboard faces north: its local x runs west).
  const sbId = firstOf(['chalk-scoreboard']);
  const sbEast = sbId ? SCOREBOARD.x - prefabBox(sbId).min.x + 0.03 : SCOREBOARD.x + 0.6;
  plates.add(textPlate('I.O.U. ONE TOOLBOX - P.', sbEast, ground(sbEast, SCOREBOARD.z) + 0.7, SCOREBOARD.z, HALF_PI,
    { w: 0.5, h: 0.2, bg: 0x2f3a33, fg: 0xf2f2e8 }));

  // ---- Vignettes -----------------------------------------------------------------------------------------------------
  // 1. Pip's red toolbox on the end of the old bench, a duster laid neatly on its lid.
  const toolbox = vignette(life, 'vignette-court-toolbox');
  const benchId = firstOf(['old-court-bench']);
  const benchEnd = OLD_BENCH.x + (benchId ? Math.max(0.5, prefabBox(benchId).max.x - 0.3) : 0.9);
  const seatY = 0.45;
  put(toolbox, ['glaze-extra-toolbox'], benchEnd, OLD_BENCH.z, { yaw: 0.1, y: seatY });
  const boxId = firstOf(['glaze-extra-toolbox']);
  put(toolbox, ['feather-duster'], benchEnd, OLD_BENCH.z, { yaw: 1.57, pitch: -1.5, y: seatY + (boxId ? prefabBox(boxId).max.y : 0.2) + 0.02 });

  // 2. A ball in the drain, a second ball and a long stick: someone's failed fishing trip.
  const drain = vignette(life, 'vignette-court-drain');
  put(drain, ['lost-ball-drain'], -106, 42, {});
  put(drain, ['gba-basketball'], -104.6, 41.2, { y: 0.1 });
  put(drain, ['stick'], -105.4, 42.9, { yaw: 0.35, pitch: -1.5, y: 0.08, scale: 1.4 });

  // 3. Tiny trainers tied together over the north lamp's arm (the nearest park lamp north of the court).
  const lampX = -96, lampZ = 11.5;
  const trainers = vignette(life, 'vignette-court-trainers');
  const lampId = firstOf(['mushroom-lamp']);
  const hangY = lampId ? prefabBox(lampId).max.y * 1.4 * 0.78 : 2.4;
  [[-0.32, 0.3], [0.32, -0.3]].forEach(([dx, roll]) => {
    put(trainers, ['court-boots'], lampX + dx, lampZ, { pitch: Math.PI, roll, y: hangY - 0.55, scale: 0.4 });
  });

  // 4. By the ball cage: a flat ball, a puncture-repair tin and (if there were a pump) a pump.
  const cage = vignette(life, 'vignette-court-puncture');
  const flat = put(cage, ['gba-basketball'], BALL_CAGE.x - 1.6, BALL_CAGE.z - 1.4, { y: 0.03 });
  if (flat) flat.scale.set(1.1, 0.35, 1.1);
  put(cage, ['sardine-tin', 'tin-pail'], BALL_CAGE.x - 2.1, BALL_CAGE.z - 1.0, { scale: 0.7, yaw: 0.6 });
  put(cage, ['bicycle-pump', 'tire-pump'], BALL_CAGE.x - 1.2, BALL_CAGE.z - 1.9, { yaw: 1.0, pitch: -1.5, y: 0.08 });

  const boxes = buildPieces(scene, pieces, 'court-life');

  // ---- The regulars --------------------------------------------------------------------------------------------------
  const person = (key: 'cardoon' | 'lintel' | 'pansy' | 'benchley') => {
    const cast = SPORTS_CAST[key];
    const look = { ...DEFAULT_LOOK, ...cast.look, equipment: { ...cast.look.equipment } };
    const eq = look.equipment as Record<string, string>;
    for (const slot of Object.keys(eq)) if (!getPrefab(eq[slot])) delete eq[slot];
    const model = makeGnome(life, look);
    model.object.name = `court-${key}`;
    const s = COURT_PEOPLE[key].spot;
    model.object.position.set(s.x, ground(s.x, s.z), s.z);
    model.object.rotation.y = s.yaw;
    return { model, spot: s };
  };
  const cardoon = person('cardoon');
  const lintel = person('lintel');
  const pansy = person('pansy');
  const burdock = person('benchley');

  // Colliders for those standing off the painted court (Swish stands on it: nothing is placed there).
  const roundBox = (x: number, z: number): Box => ({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35, h: 1, shape: 'round' });
  const peopleBoxes: { box: Box; home: Box; who: 'lintel' | 'pansy' | 'benchley' }[] = [];
  for (const [who, p] of [['lintel', lintel], ['pansy', pansy], ['benchley', burdock]] as const) {
    if (inPainted(p.spot.x, p.spot.z)) continue;
    const home = roundBox(p.spot.x, p.spot.z);
    boxes.push(home);
    peopleBoxes.push({ box: home, home: { ...home }, who });
  }

  // The balls: Swish's free-throw ball and Lintel's dribble ball.
  const ballId = firstOf(['gba-basketball']);
  const makeBall = (name: string): THREE.Object3D | null => {
    if (!ballId) return null;
    const b = buildPrefab(ballId, { lights: false });
    b.name = name;
    b.traverse((m) => { if ((m as THREE.Mesh).isMesh) m.castShadow = true; });
    life.add(b);
    return b;
  };
  const throwBall = makeBall('court-throw-ball');
  const dribbleBall = makeBall('court-dribble-ball');

  // Old Burdock's cheer line, a small plate above his head turned to the player.
  const lineMesh = textPlate('THAT\'S MY BOY!', 0, 0, 0, 0, { w: 0.9, h: 0.24, bg: PLATE_BG });
  lineMesh.visible = false;
  life.add(lineMesh);

  scene.add(life);

  let cheerT = 0;
  let burdockCue = 6 + Math.random() * 8;
  let handT = 0;
  let bounceT = 4 + Math.random() * 4;
  let lastCycle = -1;
  let flightSound = false;
  let landSound = false;

  const setPeople = (shown: boolean): void => {
    cardoon.model.object.visible = shown;
    lintel.model.object.visible = shown;
    pansy.model.object.visible = shown;
    if (throwBall) throwBall.visible = shown;
    if (dribbleBall) dribbleBall.visible = shown;
    for (const pb of peopleBoxes) {
      const src = pb.who === 'benchley' || shown ? pb.home : { minX: 1e9, maxX: 1e9, minZ: 1e9, maxZ: 1e9 };
      pb.box.minX = src.minX; pb.box.maxX = src.maxX; pb.box.minZ = src.minZ; pb.box.maxZ = src.maxZ;
    }
  };

  return {
    boxes,
    cheer() { cheerT = 2.6; },
    update(dt, t, px, pz, gameOn) {
      if (Math.hypot(px - COURT.x, pz - COURT.z) > FAR) return;
      const near = Math.hypot(px - COURT.x, pz - COURT.z) <= SOUND_RANGE + 12;
      setPeople(!gameOn);

      // Old Burdock: sits, now and then raises a hand at a shot; cheers on a score.
      {
        const s = burdock.spot;
        burdock.model.update(gnomeState(s.x, ground(s.x, s.z), s.z, s.yaw, 0, true), dt);
        burdockCue -= dt;
        if (burdockCue <= 0) { burdockCue = 8 + Math.random() * 10; handT = 1.4; }
        if (handT > 0) { handT -= dt; burdock.model.arms.right.rotation.x = -2.5 + Math.sin(t * 7) * 0.12; }
        if (cheerT > 0) {
          cheerT -= dt;
          burdock.model.arms.right.rotation.x = -2.8 + Math.sin(t * 12) * 0.2;
          burdock.model.arms.left.rotation.x = -2.8 + Math.sin(t * 12 + 1) * 0.2;
          lineMesh.visible = true;
          lineMesh.position.set(s.x, ground(s.x, s.z) + 1.7, s.z);
          lineMesh.rotation.y = Math.atan2(px - s.x, pz - s.z);
        } else lineMesh.visible = false;
      }

      if (gameOn) return;

      // Swish: free throws at the east hoop on a six-second loop, every third one clangs off.
      {
        const s = cardoon.spot;
        const gy = ground(s.x, s.z);
        cardoon.model.update(gnomeState(s.x, gy, s.z, s.yaw, 0), dt);
        const cycle = Math.floor(t / THROW_S);
        const ph = t % THROW_S;
        const miss = cycle % 3 === 2;
        if (cycle !== lastCycle) { lastCycle = cycle; flightSound = false; landSound = false; }
        const rim = COURT.hoops[1];
        const rimY = ground(rim.x, rim.z) + COURT.hoopY;
        const hand = { x: s.x + Math.sin(s.yaw) * 0.3, y: gy + 1.3, z: s.z + Math.cos(s.yaw) * 0.3 };
        // 0..1.2 s set and raise, 1.2..2.4 flight, 2.4..2.9 drop or deflect, 2.9..5.3 bounces back, then the catch.
        const raise = ph < 1.2 ? Math.sin((ph / 1.2) * Math.PI) : 0;
        cardoon.model.arms.right.rotation.x = -0.8 - raise * 1.4;
        cardoon.model.arms.left.rotation.x = -0.8 - raise * 1.4;
        if (throwBall) {
          const b = throwBall.position;
          if (ph < 1.2) b.set(hand.x, hand.y + raise * 0.5, hand.z);
          else if (ph < 2.4) {
            const f = (ph - 1.2) / 1.2;
            b.set(hand.x + (rim.x - hand.x) * f, hand.y + 0.5 + (rimY - hand.y - 0.5) * f + 1.6 * 4 * f * (1 - f), hand.z + (rim.z - hand.z) * f);
          } else if (ph < 2.9) {
            const f = (ph - 2.4) / 0.5;
            const side = miss ? 0.9 * f : 0;
            const sx = miss ? -0.6 * f : 0;
            b.set(rim.x + sx, rimY - (rimY - ground(rim.x, rim.z) - 0.12) * f * f, rim.z + side);
            if (!flightSound && near && Math.hypot(px - rim.x, pz - rim.z) < SOUND_RANGE) {
              flightSound = true;
              playAt(miss ? 'jam-clang' : 'jam-swish', rim, { bus: 'ambience' });
            }
          } else if (ph < 5.3) {
            const f = (ph - 2.9) / 2.4;
            const x0 = rim.x + (miss ? -0.6 : 0), z0 = rim.z + (miss ? 0.9 : 0);
            const bx = x0 + (hand.x - x0) * f, bz = z0 + (hand.z - z0) * f;
            const hop = Math.abs(Math.sin(f * Math.PI * 4)) * 0.45 * (1 - f);
            b.set(bx, ground(bx, bz) + 0.12 + hop, bz);
            if (!landSound && Math.hypot(px - bx, pz - bz) < SOUND_RANGE) { landSound = true; playAt('jam-bounce', { x: bx, z: bz }, { bus: 'ambience' }); }
          } else b.set(hand.x, hand.y - (ph - 5.3) * 0.2, hand.z);
        }
      }

      // Lintel: a side-to-side shimmy, the ball bouncing hand to hand.
      {
        const s = lintel.spot;
        const sway = Math.sin(t * 3.2) * 0.45;
        const x = s.x + sway, z = s.z;
        lintel.model.update(gnomeState(x, ground(x, z), z, s.yaw + Math.sin(t * 1.6) * 0.35, 0), dt);
        const phase = Math.sin(t * 3.2);
        lintel.model.arms.right.rotation.x = -0.9 + phase * 0.5;
        lintel.model.arms.left.rotation.x = -0.9 - phase * 0.5;
        if (dribbleBall) {
          const bx = x + Math.cos(s.yaw) * phase * 0.4, bz = z - Math.sin(s.yaw) * phase * 0.4;
          dribbleBall.position.set(bx, ground(bx, bz) + 0.12 + Math.abs(Math.sin(t * 6.4)) * 0.6, bz);
        }
      }

      // Pansy: arms overhead, then a crouch with the arms forward (a 10 s loop).
      {
        const s = pansy.spot;
        const ph = t % 10;
        const crouch = ph >= 5 && ph < 8;
        pansy.model.update(gnomeState(s.x, ground(s.x, s.z), s.z, s.yaw, 0, crouch), dt);
        if (ph < 4) {
          pansy.model.arms.right.rotation.x = -2.8 + Math.sin(t * 2) * 0.1;
          pansy.model.arms.left.rotation.x = -2.8 + Math.sin(t * 2) * 0.1;
        } else if (crouch) {
          pansy.model.arms.right.rotation.x = -1.2;
          pansy.model.arms.left.rotation.x = -1.2;
        }
      }

      // Ambient: a distant bounce every few seconds when the player is near.
      if (Math.hypot(px - COURT.x, pz - COURT.z) <= SOUND_RANGE) {
        bounceT -= dt;
        if (bounceT <= 0) {
          bounceT = 3 + Math.random() * 3;
          playAt('jam-bounce', { x: COURT.x + (Math.random() - 0.5) * 16, z: COURT.z + (Math.random() - 0.5) * 8 }, { bus: 'ambience' });
        }
      }
    },
  };
}
