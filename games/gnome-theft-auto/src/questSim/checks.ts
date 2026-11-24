// Quest sim: static checks that need no play. Every place a quest sends the player must be legal (on the world, out of
// buildings, on water only for a boat objective), every scene and giver a quest names must exist, and every quest must
// be offered from some save. Pure: reads quest data and the built world, runs no session.
import { VEHICLES } from '../config';
import { pushOutOfBoxes } from '../collide';
import { SCENES } from '../cutscene/scenes';
import { GIVERS } from '../quests/defs';
import type { QuestDef } from '../quests/types';
import type { World } from '../types';
import { waterAt } from '../terrain';
import { neverOffered } from './prereqs';
import { expectedScenes } from './runner';
import type { Finding } from './types';

/** One position a quest uses. `what` names it ('visit.at', 'steal-deliver.spawnAt', ...); `water` = expected on water. */
export interface Spot {
  step: number;
  what: string;
  x: number;
  z: number;
  r: number;
  water: boolean;
}

/** Spots that must be on dry land (unless the objective is a boat one): the player stands there on foot or at a drop. */
const mustBeDry = (what: string): boolean => /^visit\.|^choice\.|\.dropAt$|\.spawnAt$/.test(what);

/**
 * A survive-derby arena is a ring centre, not a spot anyone stands on: the spot checked is a point on the ring at half
 * radius. Eight angles (0, 45, ... deg): the first one clear of buildings (with `world`), else the first one.
 */
function arenaEdgeSpot(arena: [number, number], radius: number, world?: World): [number, number] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    pts.push([arena[0] + Math.cos(a) * radius / 2, arena[1] + Math.sin(a) * radius / 2]);
  }
  const clear = world ? pts.find(([x, z]) => !pushOutOfBoxes(x, z, 1, world.boxes, 0).hit) : undefined;
  return clear ?? pts[0];
}

/** Every position a quest uses, per objective kind. Crack targets snap to walk points, so only their off-world check applies. */
export function spotsOf(q: QuestDef, world?: World): Spot[] {
  const out: Spot[] = [];
  const add = (step: number, what: string, x: number, z: number, r: number, water = false): void => {
    out.push({ step, what, x, z, r, water });
  };
  q.objectives.forEach((o, step) => {
    switch (o.kind) {
      case 'crack':
        for (const t of o.targets) add(step, `crack.${t.id}`, t.near[0], t.near[1], 0);
        break;
      case 'visit':
        add(step, 'visit.at', o.at[0], o.at[1], 1);
        break;
      case 'steal-deliver': {
        const boat = VEHICLES[o.vehicleKind].boat === true;
        add(step, 'steal-deliver.spawnAt', o.spawnAt[0], o.spawnAt[1], 1.8, boat);
        add(step, 'steal-deliver.dropAt', o.dropAt[0], o.dropAt[1], 2, boat);
        break;
      }
      case 'chase-follow':
        o.waypoints.forEach((p, i) => add(step, `chase-follow.waypoint${i}`, p[0], p[1], 1));
        break;
      case 'convoy-ambush':
        o.route.forEach((p, i) => add(step, `convoy-ambush.route${i}`, p[0], p[1], 1));
        add(step, 'convoy-ambush.dropAt', o.dropAt[0], o.dropAt[1], 2);
        break;
      case 'air-drop':
        if (o.planeAt) add(step, 'air-drop.planeAt', o.planeAt[0], o.planeAt[1], 1);
        add(step, 'air-drop.dropZone', o.dropZone[0], o.dropZone[2], 1);
        break;
      case 'survive-derby':
        {
          const [x, z] = arenaEdgeSpot(o.arena, o.radius, world);
          add(step, 'survive-derby.arena-edge', x, z, 1);
        }
        break;
      case 'boss-combine':
        add(step, 'boss-combine.start', 0, o.startZ, 1);
        add(step, 'boss-combine.end', 0, o.endZ, 1);
        break;
      case 'choice':
        add(step, 'choice.optionA', o.optionA.at[0], o.optionA.at[1], 1);
        add(step, 'choice.optionB', o.optionB.at[0], o.optionB.at[1], 1);
        break;
      case 'tessie-sightings':
        o.points.forEach((p, i) => add(step, `tessie-sightings.point${i}`, p[0], p[1], o.radius, true));
        break;
      case 'tessie-buoys':
        o.points.forEach((p, i) => add(step, `tessie-buoys.point${i}`, p[0], p[1], o.radius, true));
        break;
      case 'tessie-escort':
        o.route.forEach((p, i) => add(step, `tessie-escort.route${i}`, p[0], p[1], 1, true));
        add(step, 'tessie-escort.nest', o.nest[0], o.nest[1], 0); // the nest is on an island: land or water
        add(step, 'tessie-escort.dredgerAt', o.dredgerAt[0], o.dredgerAt[1], 1, true);
        break;
      case 'tessie-ride':
        add(step, 'tessie-ride.spawnAt', o.spawnAt[0], o.spawnAt[1], 1.8, true);
        add(step, 'tessie-ride.to', o.to[0], o.to[1], o.radius, true);
        break;
      case 'checkpoints':
        // A gate hung at a height (a Skyway deck, a rooftop) is not a ground spot.
        o.points.forEach((p, i) => {
          if (p.height === undefined) add(step, `checkpoints.gate${i}`, p.at[0], p.at[1], 1);
        });
        break;
      case 'probe':
        if (o.at) add(step, 'probe.at', o.at[0], o.at[1], 1);
        break;
      default:
        // 'race' has no positions of its own (its grid and track come from races.ts).
        break;
    }
  });
  return out;
}

/** Static problems in one quest: spots, scenes and giver. All content findings (the quest data is what is wrong). */
export function staticFindings(q: QuestDef, world: World): Finding[] {
  const out: Finding[] = [];
  const add = (check: string, detail: string, step?: number): void => {
    out.push({ questId: q.id, ...(step === undefined ? {} : { step }), check, class: 'content', detail });
  };

  for (const s of spotsOf(q, world)) {
    const at = `${s.what} at (${s.x}, ${s.z}) r=${s.r}`;
    if (Math.abs(s.x) > world.half || Math.abs(s.z) > world.half) add('spot-off-world', `${at} is outside half=${world.half}`, s.step);
    if (s.r > 0 && pushOutOfBoxes(s.x, s.z, s.r, world.boxes, 0).hit) add('spot-in-collider', `${at} is inside a building`, s.step);
    const wet = waterAt(s.x, s.z) !== null;
    if (!s.water && mustBeDry(s.what) && wet) add('spot-on-water', `${at} is on water`, s.step);
    if (s.water && !wet) add('spot-dry', `${at} is on dry land (a boat spot)`, s.step);
  }

  const scenes = new Set([...expectedScenes(q, 'A'), ...expectedScenes(q, 'B')]);
  for (const id of scenes) if (!SCENES[id]) add('scene-missing', `scene ${id} is not in SCENES`);
  q.objectives.forEach((o, step) => {
    if (o.kind !== 'race') return;
    const id = `race-${o.raceId}-podium`;
    if (!SCENES[id]) add('scene-missing', `scene ${id} is not in SCENES`, step);
  });

  const giver = GIVERS[q.giver];
  if (!giver) {
    add('giver-missing', `giver ${q.giver} is not in GIVERS`);
  } else if (pushOutOfBoxes(giver.x, giver.z, 0.8, world.boxes, 0).hit) {
    add('spot-in-collider', `giver ${q.giver} at (${giver.x}, ${giver.z}) is inside a building`);
  }
  return out;
}

/** Problems across the whole quest table: quests that can never be offered from an empty save. */
export function tableFindings(quests: readonly QuestDef[]): Finding[] {
  return neverOffered(quests).map((id) => ({
    questId: id,
    check: 'unlock-unreachable',
    class: 'content',
    detail: 'never offered in a play-through of the quest table',
  }));
}

/** The identity of a finding for the baseline: the same problem is the same key across runs. */
export const findingKey = (f: Finding): string => `${f.questId}|${f.step ?? ''}|${f.check}|${f.detail}`;
