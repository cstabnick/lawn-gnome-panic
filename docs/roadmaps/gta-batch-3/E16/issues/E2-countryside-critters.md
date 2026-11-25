Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/critters/countryside.ts` puts six red-deer herds and two goat flocks into the countryside:
deer graze in herds (a stag standing a little apart, hinds, fawns), bolt together from a gnome on foot, a vehicle or a
gunshot, and get up offended when knocked over; goats potter about on the hills. A test checks the spawns.

## Read first
- `games/gnome-theft-auto/src/critters.ts`: `CritterKind` (now includes 'deer', 'stag', 'fawn', 'goat'),
  `CRITTER_SPECS` (their specs are set: scareFoot/scareVehicle make the runtime scare them on its own),
  `Critter` (mode, group, homeX/homeZ, leash, data), `CritterCtx` (incl. the new optional `ammo`: rounds in the
  player's magazine; a drop since last frame means a shot), `RegionLife`, `CritterRuntime` (`spawn`, `scare`,
  `inGroup`, `nearest`, `list`), `openSpot(x, z, r, region, world)`.
- `games/gnome-theft-auto/src/critters/snowcap.ts`: a finished RegionLife with its own spawns in `init` and per-runtime
  state in a `WeakMap<CritterRuntime, State>`.
- `games/gnome-theft-auto/src/critters/cloverfield.ts`: herds (`groups`, `HERDABLE`), how a flee direction is shared.
- `games/gnome-theft-auto/src/critters/countryside.ts`: the stub you replace (keep its exports and signatures).
- `games/gnome-theft-auto/src/country/types.ts`: `HerdDef`, `MAX_HERD`.
- `games/gnome-theft-auto/src/critters.test.ts`: how critters are tested (fake world, `createCritters`).

## Change
`src/critters/countryside.ts`:
- `HERDS: readonly HerdDef[]` (world points checked as open, empty ground away from roads and sites; `openSpot` nudges
  them): deer `herd-west-estates` (-1290, -640) count 5; `herd-highlands-west` (-840, -1190) 5; `herd-highlands-east`
  (560, -1090) 5; `herd-rootwell-meadow` (1060, 810) 5; `herd-cloverfield` (360, 560) 5; `herd-loch-moss` (-490, -790) 5;
  goats `goats-highland-spine` (-140, -1140) 5; `goats-fells-north` (210, -990) 4. Leash 45 for deer, 30 for goats.
- `spawnHerd(rt, kind, x, z, n, group, leash = 40): Critter[]`: for kind 'deer': member 0 is a 'stag' placed ~8 m off
  the centre (leash 0.6 of the herd's), then hinds ('deer') and one 'fawn' per three members (the last ones); for any
  other kind, `n` of that kind. Members start within 6 m of the centre at `openSpot(..., c.spec.radius + 1, region,
  rt.world)` points (skip a member if null), random yaw, `{ group, leash }`. Region: `regionAt(x, z)` from `../levels`.
  Never more than `MAX_HERD` members.
- `countrysideLife: RegionLife` (`id: 'countryside'`, `groups: []`):
  - `init(rt)`: spawns every HERDS entry with `spawnHerd` (group = the herd id) and remembers the runtime (module-level
    `let last: CritterRuntime | null`) for `deerWithin`.
  - `update(rt, ctx)`: per runtime state in a WeakMap: (1) a herd flees as one: when any member of a deer herd is in mode
    'flee', every other calm member of that herd is `rt.scare`d from the same point (`c.fromX`, `c.fromZ`) for the same
    time (use `CRITTERS.fleeSeconds` default by passing no seconds); (2) gunfire: when `ctx.ammo` is a number and is
    lower than last frame's, every deer/stag/fawn within 80 m of the player is scared from the player's position
    (goats ignore it); (3) grazing: calm deer stop now and then (set mode 'idle' with `modeT` 3-8 s, at most one change
    per member per 4 s) so a herd looks like it is grazing rather than marching. Keep it cheap: skip herds whose centre
    is more than 250 m from the player.
  - `onHit`: return false (the default knock-over is right: a puff, they lie down, get up and run).
- `deerWithin(x, z, r): number[]`: ids of 'deer'/'stag'/'fawn' critters in `last.list` within r of (x, z) whose mode is
  'idle' or 'wander'.

New test `src/critters/countryside.test.ts` (copy the setup of `critters.test.ts`): after `createCritters` with
`[countrysideLife]`, there are 30 deer-family critters (6 x 5) or fewer only where a spot was blocked (assert >= 24),
each herd has exactly one stag, at least 8 goats; no critter stands in water (`waterAt`) or within 8 m of a highway
centre line (`roadDistance` from `critters.ts`); `deerWithin` near a herd centre returns ids; a fleeing hind makes its
herd-mates flee within one update.

## Contract
Exports exactly as the stub: `HERDS`, `spawnHerd(rt, kind, x, z, n, group, leash = 40): Critter[]`,
`deerWithin(x, z, r): number[]`, `countrysideLife`. `critters/index.ts` already lists `countrysideLife`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/critters/countryside.test.ts src/critters.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`src/critters.ts`, `src/critters/index.ts`, `src/hunting/*` (another worker adds deer as a hunting quarry), every other
file.
