// E31 living world: the per-frame side. The people of the Unmown, the hamlets and the High Tarn; the Unmown checklist;
// the watches behind the six achievements; the sounds; map pins. app.ts creates it once and updates it every frame.
// Everything here is local to this browser (critters, birds and people are, too).
import type * as THREE from 'three';
import { createAmbientGnomes } from '../ambientGnomes';
import { BIRD_KEY, parseBirdSave } from '../birding/birdSave';
import type { CritterKind } from '../critters';
import { regionAt } from '../levels';
import type { Blip, VehicleKind } from '../types';
import { createChecklistStore, sightings, CHECKLIST } from '../unmown/checklist';
import { registerChecklistApp } from '../unmown/checklistApp';
import { unmownPeople } from '../unmown/vignettes';
import { HAMLETS, HIGH_TARN, LIVING_ACH, NEW_BIRD_IDS, STATION, UNMOWN_HIDES } from './config';
import { dunelowPeople } from './hamletDunelow';
import { espalierPeople } from './hamletEspalier';
import { mittenholtPeople } from './hamletMittenholt';
import { highTarnPeople } from './highTarn';
import { createLivingSound } from './sound';
import { createBoardwalkWalk, createLivingProgress, hideAt, isNewRide, placeAt } from './watches';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

export interface LivingDeps {
  scene: THREE.Scene;
  toast(text: string, ms?: number): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** The live critters (critters.list): the checklist ticks animals seen nearby. */
  critters(): readonly { kind: CritterKind; x: number; z: number }[];
  storage: Store | null;
}

export interface LivingWorld {
  /** px, pz: the player (1e6 during a cutscene's hide). onFoot: not in a vehicle. inside: in an interior. */
  update(dt: number, px: number, pz: number, onFoot: boolean, night: number, inside: boolean): void;
  /** The player got into a vehicle. */
  onRideEnter(kind: VehicleKind): void;
  blips(): Blip[];
}

/** Seconds between the checklist / place / bird checks. */
const CHECK_EVERY = 0.5;

export function createLivingWorld(deps: LivingDeps): LivingWorld {
  const people = createAmbientGnomes(deps.scene, [
    ...unmownPeople(), ...espalierPeople(), ...mittenholtPeople(), ...dunelowPeople(), ...highTarnPeople(),
  ]);
  const sound = createLivingSound();
  const checklist = createChecklistStore(deps.storage);
  registerChecklistApp(checklist);
  const progress = createLivingProgress(deps.storage);
  const walk = createBoardwalkWalk();
  let checkT = 0;

  const birdSeen = (): Readonly<Record<string, unknown>> => {
    try { return parseBirdSave(deps.storage?.getItem(BIRD_KEY) ?? null).seen; } catch { return {}; }
  };

  function check(px: number, pz: number, onFoot: boolean): void {
    const seen = birdSeen();
    // The checklist.
    const inUnmown = regionAt(px, pz) === 'the-unmown';
    for (const id of sightings(px, pz, inUnmown, deps.critters(), (b) => b in seen, checklist.seen())) {
      if (!checklist.mark(id)) continue;
      const e = CHECKLIST.find((c) => c.id === id);
      deps.toast(`Unmown checklist: ${e?.name ?? id} ticked (${checklist.seen().size}/${CHECKLIST.length}).`, 3500);
      if (checklist.complete()) deps.unlock(LIVING_ACH.checklist);
    }
    // Fresh Feathers: new species in the journal.
    for (const b of NEW_BIRD_IDS) if (b in seen && progress.add('birds', b)) deps.increment(LIVING_ACH.freshFeathers);
    // Hide and Seek.
    const hide = onFoot ? hideAt(px, pz) : null;
    if (hide && progress.add('hides', hide)) {
      deps.increment(LIVING_ACH.hides);
      deps.toast(`${UNMOWN_HIDES.find((h) => h.id === hide)?.name ?? 'Hide'}: quiet now. The birds are watching you back.`, 3500);
    }
    // Off the Beaten Lane.
    const place = placeAt(px, pz);
    if (place && progress.add('places', place)) {
      deps.increment(LIVING_ACH.offBeaten);
      const p = [...HAMLETS, HIGH_TARN].find((h) => h.id === place);
      if (p) deps.toast(`You found ${p.name}.`, 3000);
    }
  }

  return {
    update(dt, px, pz, onFoot, night, inside) {
      people.update(dt, px, pz);
      sound.update(dt, px, pz, night, inside);
      if (walk.step(px, pz, onFoot)) {
        deps.unlock(LIVING_ACH.dryFeet);
        deps.toast('Dry Feet: the whole Reedmere boardwalk, and not one wet sock.', 3500);
      }
      checkT -= dt;
      if (checkT <= 0 && px < 1e5) { checkT = CHECK_EVERY; check(px, pz, onFoot); }
    },
    onRideEnter(kind) {
      if (isNewRide(kind) && progress.add('rides', kind)) deps.increment(LIVING_ACH.weekendAway);
    },
    blips() {
      const pin = (x: number, z: number, label: string): Blip => ({ x, z, color: '#5a8f3c', label });
      return [
        pin(STATION.door.x, STATION.door.z, 'Unmown Ranger Station'),
        ...UNMOWN_HIDES.map((h) => pin(h.x, h.z, h.name)),
        pin(-1150, -1690, 'Reedmere boardwalk'),
        ...HAMLETS.map((h) => pin(h.x, h.z, h.name)),
        pin(HIGH_TARN.x, HIGH_TARN.z, 'The High Tarn'),
      ];
    },
  };
}
