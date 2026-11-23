// The Fizz Cup's scenes at the Lost & Found Speedway, built from each race's data (quests/races.ts) so the four races
// share one staging: an intro on the grid (a crane shot down from over the grandstands, the rivals posing by their
// cars, Burdock with his tea towel, the player's car waiting in the last slot) and a podium payoff after a win (the
// winning car rolls down the pit lane, the top three take the podium, the crowd goes up).
import { VEHICLES } from '../../config';
import { BURDOCK_LOOK, BURDOCK_NAME, PODIUM_TALK, RACE_QUESTS, RACE_TALK } from '../../quests/races';
import type { ObjectiveDef, RaceRival } from '../../quests/types';
import { heightAt } from '../../terrain';
import { PODIUM, gridSlot, trackFrame, trackLength } from '../../raceTrack/track';
import type { Gesture, SceneScript, Step, Vec3 } from '../script';

type Race = Extract<ObjectiveDef, { kind: 'race' }>;

const POSES: Gesture[] = ['crossArms', 'cheer', 'lean', 'wave'];

/** A point `lat` m left of the centre line at distance `s` (wrapped), at height `y` above the ground there (a camera). */
function cam(s: number, lat: number, y: number): Vec3 {
  const f = trackFrame(s, lat);
  return [f.x, heightAt(f.x, f.z) + y, f.z];
}

/** Where rival i stands: beside its car, on the outside of its column, facing across the track. */
function standBy(slot: number): { at: [number, number]; yaw: number; side: number } {
  const g = gridSlot(slot);
  const side = slot % 2 === 0 ? 1 : -1;
  // +n (the left normal) is (-cos yaw, sin yaw).
  const nx = -Math.cos(g.yaw), nz = Math.sin(g.yaw);
  return { at: [g.x + nx * side * 2.6, g.z + nz * side * 2.6], yaw: Math.atan2(-nx * side, -nz * side), side };
}

const rivalId = (i: number): string => `rival${i}`;

/** The intro on the grid for one race. */
export function raceIntro(title: string, race: Race): SceneScript {
  const L = trackLength();
  const n = race.rivals.length;
  const mine = gridSlot(n);
  const byName = new Map<string, number>(race.rivals.map((r, i) => [r.name, i]));
  const sOf = (slot: number): number => L - 8 - Math.floor(slot / 2) * 9 - (slot % 2) * 4.5;
  const burdockAt = trackFrame(L - 2, 0);
  const youAt = trackFrame(sOf(n) + 3, 0.4);

  const steps: Step[] = [
    { do: 'title', text: title },
    // The crane: high over the main straight, looking at the crowd in the grandstands, then down onto the grid.
    {
      do: 'cam', wait: true,
      shot: { kind: 'dolly', from: cam(L - 75, -2, 30), to: cam(L - 40, -1, 9), look: cam(12, 13, 7), lookTo: cam(L - 14, 0, 1), s: 6.5 },
    },
    { do: 'sfx', id: 'engine-rev', at: 'car0', async: true },
    // The pack poses: a slow pan down the grid while every rival strikes a pose.
    {
      do: 'parallel',
      tracks: [
        [{ do: 'cam', shot: { kind: 'dolly', from: cam(L - 1, -4.5, 2.4), to: cam(sOf(n) - 2, -4.5, 2.2), look: cam(L - 10, 1, 1.2), lookTo: cam(sOf(n), 1, 1), s: 5 }, wait: true }],
        race.rivals.map((r, i): Step => ({ do: 'gesture', who: rivalId(i), name: POSES[(i + Math.round(r.aggression * 3)) % POSES.length], s: 2.5, async: true })),
      ],
    },
  ];
  for (const line of RACE_TALK[race.raceId] ?? []) {
    const k = byName.get(line.speaker);
    if (k === undefined) {
      // Burdock, in front of the pole car with his tea towel, looking back down the grid.
      steps.push({ do: 'cam', shot: { kind: 'cut', pos: cam(5, 2.5, 1.6), look: 'burdock', fov: 44 } });
      steps.push({ do: 'gesture', who: 'burdock', name: 'point', s: 1.2, async: true });
      steps.push({ do: 'say', who: 'burdock', text: line.text });
    } else {
      const st = standBy(k);
      // In front of the rival and a little inward: the rival, their car and the grid behind.
      const camS = sOf(k) + 3.5;
      steps.push({ do: 'cam', shot: { kind: 'cut', pos: cam(camS, st.side * 5, 1.55), look: rivalId(k), fov: 44 } });
      steps.push({ do: 'gesture', who: rivalId(k), name: race.rivals[k].aggression > 0.5 ? 'crossArms' : 'nod', s: 1.4, async: true });
      steps.push({ do: 'say', who: rivalId(k), text: line.text });
    }
  }
  const vehicleName = VEHICLES[race.vehicle].name;
  steps.push(
    // The player's car in the last slot, the gantry beyond.
    { do: 'cam', shot: { kind: 'dolly', from: cam(sOf(n) - 9, -6, 2.6), to: cam(sOf(n) - 6, -5, 2), look: 'mine', s: 4 } },
    { do: 'face', who: 'you', at: 'mine', s: 0.4, async: true },
    { do: 'caption', text: `Your ${vehicleName} waits in the last slot. Get in and watch the lights.` },
    { do: 'wait', s: 2.5 },
    { do: 'caption', text: null },
    { do: 'call', name: 'speedway-intro-done', arg: race.raceId },
  );

  return {
    id: `race-${race.raceId}-intro`,
    stage: { kind: 'world' },
    title,
    music: 'tension',
    ambience: 'crowd',
    actors: [
      { id: 'burdock', name: BURDOCK_NAME, look: BURDOCK_LOOK, hz: 150, held: null, at: [burdockAt.x, burdockAt.z], yaw: burdockAt.yaw + Math.PI },
      { id: 'you', player: true, name: 'You', at: [youAt.x, youAt.z], yaw: youAt.yaw },
      ...race.rivals.map((r: RaceRival, i) => {
        const st = standBy(i);
        return { id: rivalId(i), name: r.name, look: r.look, at: st.at, yaw: st.yaw };
      }),
    ],
    vehicles: [
      ...race.rivals.map((r, i) => {
        const g = gridSlot(i);
        return { id: `car${i}`, kind: r.kind ?? race.vehicle, at: [g.x, g.z] as [number, number], yaw: g.yaw, tint: r.tint };
      }),
      { id: 'mine', kind: race.vehicle, at: [mine.x, mine.z], yaw: mine.yaw, tint: race.tint },
    ],
    steps,
  };
}

/** The podium after a win: the winner's car rolls down the pit lane and the top three take the steps. */
export function racePodium(title: string, race: Race): SceneScript {
  const [second, third] = race.rivals;
  const P = PODIUM;
  // The podium stands on the pan, which is not at sea level: the steps' tops are absolute heights.
  const ground = heightAt(P.x, P.z);
  const steps: Step[] = [
    { do: 'title', text: title },
    // The car comes down the pit lane past the garages.
    { do: 'cam', shot: { kind: 'track', pos: [P.x + 9, ground + 2.4, -380.5], who: 'car', fov: 50 } },
    { do: 'drive', vehicle: 'car', path: [[712, -385], [728, -386], [741, -386.5]], speed: 7 },
    { do: 'horn', vehicle: 'car', async: true },
    { do: 'exit', who: 'you' },
    { do: 'walk', who: 'you', path: [[P.x - 0.5, -392], [P.x, -397.8]] },
    { do: 'fade', to: 1, s: 0.5 },
    { do: 'spawn', id: 'you', at: [P.x, ground + 1.5, P.z], yaw: 0 },
    { do: 'spawn', id: 'second', at: [P.x - 2, ground + 1.0, P.z], yaw: 0 },
    { do: 'spawn', id: 'third', at: [P.x + 2, ground + 0.7, P.z], yaw: 0 },
    { do: 'cam', shot: { kind: 'cut', pos: [P.x, ground + 2.7, P.z + 8.5], look: [P.x, ground + 2.3, P.z], fov: 50 } },
    { do: 'fade', to: 0, s: 0.5 },
    { do: 'music', track: 'triumph' },
    { do: 'stinger', id: 'triumph', async: true },
    { do: 'sfx', id: 'cash', async: true },
    { do: 'gesture', who: 'you', name: 'cheer', s: 2.4, async: true },
    { do: 'gesture', who: 'second', name: 'wave', s: 2, async: true },
    { do: 'gesture', who: 'third', name: race.mustPlace === 1 ? 'crossArms' : 'cheer', s: 2, async: true },
    { do: 'cam', shot: { kind: 'orbit', around: 'you', radius: 7, height: 0.4, fromYaw: -0.6, toYaw: 0.6, s: 7 } },
    { do: 'say', who: 'burdock', text: PODIUM_TALK[race.raceId] ?? 'A winner!' },
  ];
  if (race.raceId === 'fizz-cup-final') {
    steps.push(
      { do: 'hold', who: 'you', prop: 'speedway-fizz-cup' },
      { do: 'cam', shot: { kind: 'dolly', from: [P.x + 1.2, ground + 2.5, P.z + 4.2], to: [P.x + 0.8, ground + 2.6, P.z + 3.2], look: 'you', s: 3 } },
      { do: 'gesture', who: 'you', name: 'cheer', s: 2.4 },
    );
  }
  steps.push({ do: 'call', name: 'speedway-podium-done', arg: race.raceId });
  return {
    id: `race-${race.raceId}-podium`,
    stage: { kind: 'world' },
    title,
    music: 'warm',
    ambience: 'crowd',
    actors: [
      { id: 'you', player: true, name: 'You', seatedIn: 'car', seat: 0, at: [0, 0] },
      { id: 'burdock', name: BURDOCK_NAME, look: BURDOCK_LOOK, hz: 150, at: [P.x + 5.5, P.z + 3.5], yaw: -2.2 },
      { id: 'second', name: second.name, look: second.look, at: [P.x - 4.5, P.z + 3], yaw: 0, hidden: true },
      { id: 'third', name: third.name, look: third.look, at: [P.x + 4.5, P.z + 3], yaw: 0, hidden: true },
    ],
    vehicles: [
      // Whatever the player crossed the line in, brought to the pit lane entry.
      { id: 'car', kind: race.vehicle, from: 'player', at: [699, -376], yaw: Math.atan2(22, -16), tint: race.tint },
    ],
    steps,
  };
}

/** Every race's intro and podium scene, by scene id. */
export const SPEEDWAY_SCENES: Record<string, SceneScript> = Object.fromEntries(
  RACE_QUESTS.flatMap((q) => {
    const race = q.objectives.find((o): o is Race => o.kind === 'race');
    if (!race) return [];
    return [[`race-${race.raceId}-intro`, raceIntro(q.title, race)], [`race-${race.raceId}-podium`, racePodium(q.title, race)]];
  }),
);
