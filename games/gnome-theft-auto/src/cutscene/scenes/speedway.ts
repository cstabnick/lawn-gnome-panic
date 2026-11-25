// The Fizz Cup's scenes at the Lost & Found Speedway, built from each race's data (quests/races.ts: RACE_INTROS,
// RACE_PODIUMS) so the four races share one staging and differ in rival, stakes and turn. Director's notes:
// docs/design/gnome-theft-auto/direction/scenes/race-scenes.md.
// - Intro: an engine barks under a short crane down onto the grid; Burdock walks down the grid counting it (twice, out
//   loud, as he always does) to the player at the back; the race's beats on close singles; the button is Burdock's last
//   line, then every engine starts as the player walks to their car in the last slot.
// - Podium: the winner's car rolls into the pit lane, a cut to the steps, Burdock's call and the runner-up's answer.
import { BURDOCK_LOOK, BURDOCK_NAME, RACE_INTROS, RACE_PODIUMS, RACE_QUESTS, type RaceBeat } from '../../quests/races';
import type { ObjectiveDef, RaceRival } from '../../quests/types';
import { heightAt } from '../../terrain';
import { PODIUM, gridSlot, trackFrame, trackLength } from '../../raceTrack/track';
import { beat, coverage, cut, shot } from '../direct';
import type { CamShot, Gesture, SceneScript, Step, Vec2, Vec3 } from '../script';

type Race = Extract<ObjectiveDef, { kind: 'race' }>;

const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/race-scenes.md';
const POSES: Gesture[] = ['crossArms', 'lean', 'nod', 'wave'];

/** A point `lat` m left of the centre line at distance `s` (wrapped), at height `y` above the ground there (a camera). */
function cam(s: number, lat: number, y: number): Vec3 {
  const f = trackFrame(s, lat);
  return [f.x, heightAt(f.x, f.z) + y, f.z];
}
const flat = (s: number, lat: number): Vec2 => { const f = trackFrame(s, lat); return [f.x, f.z]; };
const rivalId = (i: number): string => `rival${i}`;

/** The intro on the grid for one race. */
export function raceIntro(title: string, race: Race): SceneScript {
  const L = trackLength();
  const n = race.rivals.length;
  const mine = gridSlot(n);
  const talk = RACE_INTROS[race.raceId] ?? { count: 'One, two, three, four. And again.', beats: [] };
  // Distance along the lap of grid slot k (gridSlot's own formula), and which side of the centre line it is on.
  const sOf = (slot: number): number => L - 8 - Math.floor(slot / 2) * 9 - (slot % 2) * 4.5;
  const sideOf = (slot: number): number => (slot % 2 === 0 ? 1 : -1);
  // Rivals stand on the inside of their car (between it and the centre line), so a single on them has their machine behind.
  const rivalAt = (k: number): Vec2 => flat(sOf(k) + 0.4, sideOf(k) * 1.35);
  // The player waits at the back of the grid, in front of their car; Burdock walks down the centre line to them.
  const youS = sOf(n) + 3;
  const you = flat(youS, 0.4);
  const burdockStart = trackFrame(L - 4, 0);
  const burdockEnd = flat(youS + 2.6, -0.5);
  const yawTo = (from: Vec2, to: Vec2): number => Math.atan2(to[0] - from[0], to[1] - from[1]);

  const BY = coverage('burdock', 'you', 1);
  const pair = (k: number) => coverage(rivalId(k), 'you', 1);
  let last: RaceBeat['who'] | null = null;
  const shotFor = (b: RaceBeat): CamShot => {
    const size = b.size ?? 'mcu';
    if (b.who === 'burdock') return BY.single('burdock', size, { height: 'low' });
    if (typeof b.who === 'number') return pair(b.who).single(rivalId(b.who), size);
    // The player answers whoever spoke last, on that conversation's side of the line.
    if (typeof last === 'number') return pair(last).single('you', size);
    return BY.single('you', size);
  };

  const gravel = talk.beats.find((b) => b.toGravel && typeof b.who === 'number');
  const gravelK = gravel && typeof gravel.who === 'number' ? gravel.who : -1;
  const steps: Step[] = [
    { do: 'title', text: title },
    // 1. Hook: the pole car's engine barks under a short crane from over the grandstand down onto the grid.
    { do: 'cam', shot: { kind: 'dolly', from: cam(L - 58, 5, 20), to: cam(L - 30, 1, 5), look: cam(L - 12, 0, 1.5), lookTo: cam(L - 16, 0, 0.8), s: 3.8, fov: 54 } },
    { do: 'sfx', id: 'engine-rev', at: 'car0', async: true },
    { do: 'walk', who: 'burdock', path: [flat(L - 9, 0), burdockEnd], speed: 1.7, async: true },
    ...race.rivals.map((r: RaceRival, i): Step => ({ do: 'gesture', who: rivalId(i), name: POSES[(i + Math.round(r.aggression * 3)) % POSES.length], s: 2.4, async: true })),
    { do: 'wait', s: 3.4 },
    // 2. Burdock counts the grid as he walks it: a medium shot that backs away in front of him.
    cut(shot('burdock', 'ms', { toward: 'you', side: 18 })),
  ];
  if (gravelK >= 0) {
    // Shelldon will not stand on paving: he sets off for the run-off while Burdock is still counting.
    steps.push({ do: 'walk', who: rivalId(gravelK), path: [flat(sOf(gravelK) + 2.6, sideOf(gravelK) * 1.6), flat(sOf(gravelK) + 2.6, sideOf(gravelK) * 9.6)], speed: 1.9, async: true });
  }
  steps.push(
    { do: 'say', who: 'burdock', text: talk.count },
    { do: 'face', who: 'burdock', at: 'you', s: 0.3, async: true },
    { do: 'face', who: 'you', at: 'burdock', s: 0.3 },
  );
  let music = false;
  for (const b of talk.beats) {
    const id = b.who === 'burdock' ? 'burdock' : b.who === 'you' ? 'you' : rivalId(b.who as number);
    if (b.toGravel && typeof b.who === 'number') {
      // The gag, locked off and wide enough to read: a gnome on a gravel strip, alone, by choice.
      steps.push(
        cut({ kind: 'cut', pos: cam(sOf(b.who) + 7.5, sideOf(b.who) * 4.5, 1.3), look: id, fov: 46 }),
        { do: 'stinger', id: 'comic', async: true },
        beat('pause'),
        { do: 'face', who: id, at: 'you', s: 0.4 },
      );
    }
    if (typeof b.who === 'number') steps.push({ do: 'face', who: id, at: 'you', s: 0.25, async: true });
    if (b.who === 'you' && typeof last === 'number') steps.push({ do: 'face', who: 'you', at: rivalId(last), s: 0.25, async: true });
    if (b.who === 'burdock' && typeof last === 'number') steps.push({ do: 'face', who: 'you', at: 'burdock', s: 0.25, async: true });
    if (b.sfx === 'horns') {
      race.rivals.forEach((_, i) => steps.push({ do: 'horn', vehicle: `car${i}`, async: true }));
    } else if (b.sfx === 'engine-rev' && typeof b.who === 'number') {
      steps.push({ do: 'sfx', id: 'engine-rev', at: `car${b.who}`, async: true });
    }
    steps.push(cut(shotFor(b)));
    if (b.gesture) steps.push({ do: 'gesture', who: id, name: b.gesture, s: 1.3, async: true });
    if (!music && typeof b.who === 'number') {
      // The stakes go up when the rival opens their mouth.
      steps.push({ do: 'music', track: 'tension', fade: 0.6 });
      music = true;
    }
    steps.push({ do: 'say', who: id, text: b.text, ...(b.hz ? { hz: b.hz } : {}) });
    last = b.who;
  }
  steps.push(
    // 3. The tail of the button: every engine on the grid starts as the player walks to the last slot.
    { do: 'walk', who: 'you', path: [flat(sOf(n) + 1.2, -1.9)], speed: 1.6, async: true },
    { do: 'music', track: 'chase', fade: 0.4 },
    cut({ kind: 'cut', pos: cam(sOf(n) - 7, -7.5, 1.4), look: 'mine', fov: 50 }),
    ...race.rivals.map((_, i): Step => ({ do: 'sfx', id: 'engine-rev', at: `car${i}`, async: true })),
    { do: 'wait', s: 2.4 },
    { do: 'call', name: 'speedway-intro-done', arg: race.raceId },
  );

  return {
    id: `race-${race.raceId}-intro`,
    direction: { notes: NOTES, kind: 'race-intro' },
    stage: { kind: 'world' },
    title,
    ambience: 'crowd',
    actors: [
      { id: 'burdock', name: BURDOCK_NAME, look: BURDOCK_LOOK, hz: 150, held: 'speedway-tea-towel', at: [burdockStart.x, burdockStart.z], yaw: burdockStart.yaw + Math.PI },
      { id: 'you', player: true, name: 'You', at: you, yaw: yawTo(you, [burdockStart.x, burdockStart.z]) },
      ...race.rivals.map((r: RaceRival, i) => {
        const at = rivalAt(i);
        return { id: rivalId(i), name: r.name, look: r.look, at, yaw: yawTo(at, you) };
      }),
    ],
    vehicles: [
      ...race.rivals.map((r, i) => {
        const g = gridSlot(i);
        return { id: `car${i}`, kind: r.kind ?? race.vehicle, at: [g.x, g.z] as Vec2, yaw: g.yaw, tint: r.tint };
      }),
      { id: 'mine', kind: race.vehicle, at: [mine.x, mine.z], yaw: mine.yaw, tint: race.tint },
    ],
    steps,
  };
}

/** The podium after a win: the winner's car rolls into the pit lane, then the top three on the steps. */
export function racePodium(title: string, race: Race): SceneScript {
  const [second, third] = race.rivals;
  const talk = RACE_PODIUMS[race.raceId] ?? { beats: [{ who: 'burdock', text: 'A winner!' }] };
  const P = PODIUM;
  // The podium stands on the pan, which is not at sea level: the steps' tops are absolute heights.
  const ground = heightAt(P.x, P.z);
  const steps: Step[] = [
    { do: 'title', text: title },
    // 1. Hook: the horn as the winner rolls down the pit lane past the garages.
    { do: 'cam', shot: { kind: 'track', pos: [P.x + 9, ground + 2.4, -380.5], who: 'car', fov: 50 } },
    { do: 'horn', vehicle: 'car', async: true },
    { do: 'drive', vehicle: 'car', path: [[722, -386], [741, -386.5]], speed: 9 },
    { do: 'exit', who: 'you' },
    // 2. The steps: winner on top, the crowd goes up.
    { do: 'fade', to: 1, s: 0.4 },
    { do: 'spawn', id: 'you', at: [P.x, ground + 1.5, P.z], yaw: 0 },
    ...(talk.emptySecond ? [] : [{ do: 'spawn', id: 'second', at: [P.x - 2, ground + 1.0, P.z], yaw: 0 } as Step]),
    { do: 'spawn', id: 'third', at: [P.x + 2, ground + 0.7, P.z], yaw: 0 },
    { do: 'cam', shot: { kind: 'cut', pos: [P.x, ground + 2.6, P.z + 7.5], look: [P.x, ground + 2.2, P.z], fov: 48 } },
    { do: 'fade', to: 0, s: 0.4 },
    { do: 'music', track: 'triumph', fade: 0.3 },
    { do: 'stinger', id: 'triumph', async: true },
    // The tea towel waves, the cups clink: the crowd's part, before anyone speaks.
    { do: 'sfx', id: 'flutter', at: 'burdock', async: true },
    { do: 'sfx', id: 'clink', async: true, gain: 0.8 },
    { do: 'gesture', who: 'you', name: 'cheer', s: 2.2, async: true },
    ...(talk.emptySecond ? [] : [{ do: 'gesture', who: 'second', name: 'wave', s: 2, async: true } as Step]),
    { do: 'gesture', who: 'third', name: race.mustPlace === 1 ? 'crossArms' : 'cheer', s: 2, async: true },
    { do: 'wait', s: 1.6 },
  ];
  let shownEmpty = false;
  for (const b of talk.beats) {
    const id = b.who === 'burdock' ? 'burdock' : b.who === 'you' ? 'you' : String(b.who);
    if (talk.emptySecond && !shownEmpty && b.who !== 'burdock') {
      // The runner-up's step, empty: he will not stand on paving. Held long enough to read.
      steps.push(cut({ kind: 'cut', pos: [P.x - 2.4, ground + 1.6, P.z + 3.2], look: [P.x - 2, ground + 1.2, P.z], fov: 40 }), beat('pause'));
      shownEmpty = true;
    }
    const size = b.size ?? 'mcu';
    // Burdock calls it to the winner from the foot of the steps (shot low: the race director); the others answer him.
    steps.push(cut(b.who === 'burdock' ? shot('burdock', size, { toward: 'you', side: -20, height: 'low' }) : shot(id, size, { toward: 'burdock', side: 20 })));
    if (b.gesture) steps.push({ do: 'gesture', who: id, name: b.gesture, s: 1.3, async: true });
    steps.push({ do: 'say', who: id, text: b.text, ...(b.hz ? { hz: b.hz } : {}) });
  }
  if (race.raceId === 'fizz-cup-final') {
    // The button: the cup goes up.
    steps.push(
      { do: 'hold', who: 'you', prop: 'speedway-fizz-cup' },
      { do: 'cam', shot: { kind: 'dolly', from: [P.x + 1.2, ground + 2.5, P.z + 4.2], to: [P.x + 0.8, ground + 2.6, P.z + 3.2], look: 'you', s: 2.6 } },
      { do: 'sfx', id: 'cash', async: true },
      { do: 'gesture', who: 'you', name: 'cheer', s: 2.4 },
    );
  } else {
    steps.push(beat('pause'));
  }
  steps.push({ do: 'call', name: 'speedway-podium-done', arg: race.raceId });
  return {
    id: `race-${race.raceId}-podium`,
    direction: { notes: NOTES, kind: 'race-podium' },
    stage: { kind: 'world' },
    title,
    music: 'warm',
    ambience: 'crowd',
    actors: [
      { id: 'you', player: true, name: 'You', seatedIn: 'car', seat: 0, at: [0, 0] },
      { id: 'burdock', name: BURDOCK_NAME, look: BURDOCK_LOOK, hz: 150, held: 'speedway-tea-towel', at: [P.x + 3.2, P.z + 3.2], yaw: Math.atan2(-3.2, -3.2) },
      { id: 'second', name: second.name, look: second.look, at: [P.x - 4.5, P.z + 3], yaw: 0, hidden: true },
      { id: 'third', name: third.name, look: third.look, at: [P.x + 4.5, P.z + 3], yaw: 0, hidden: true },
    ],
    vehicles: [
      // Whatever the player crossed the line in, brought to the pit lane entry.
      { id: 'car', kind: race.vehicle, from: 'player', at: [705, -380], yaw: Math.atan2(22, -16), tint: race.tint },
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
