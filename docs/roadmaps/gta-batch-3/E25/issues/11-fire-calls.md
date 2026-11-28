Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Pure logic and writing, no three.js, no DOM.

## Goal
`firefighter/calls.ts`: fire calls with character (what burns, the scene's props, the fires and the fuel that can
catch, who phoned it in and what they said, sometimes someone stuck up high), and a score for how a call went.

## Read first
- `games/gnome-theft-auto/src/workplaces/firefighter/types.ts`: `CallKind`, `CallPlace`, `CallProp`, `CallFire`,
  `CallRescue`, `FireCall`, `CallOutcome`, `CallScore` (every field's meaning is in its comment).
- `games/gnome-theft-auto/src/workplaces/firefighter/calls.ts`: the stub (`FOREST_PLACES`, `makeCall`, `scoreCall`).
- `docs/lore/entries/apocrypha/asphalt-the-cat.md` (Asphalt the cat, for the cat rescue).
- Prefab ids you may use in props (all exist or are being made now; use exactly these): `gta-wheelie-bin` (tint),
  `bin-bag`, `garden-shed`, `fire-bbq-grill`, `fire-deckchair`, `giant-spotted-toadstool`, `capwood-toadstool-cluster`,
  `fire-callbox`, `park-bench`, `litter-bin`, `street-lamp` (grep `packages/prefabs/src/catalog` for a lamp post id and
  use the real one).

## Change
- `games/gnome-theft-auto/src/workplaces/firefighter/calls.ts`:
  - `FOREST_PLACES`: 6 Mossy Wood clearings (area 'forest'), names like "the Mossy Wood picnic clearing": use world
    points around (-380, -20), (-430, 40), (-350, 60), (-470, -40), (-410, 110), (-330, -60) (the runtime moves the
    call to clear ground nearby).
  - `makeCall(level, seed, places, id)`: seeded, deterministic. Pick a place from `places` (any area). Kind: forest
    place -> 'toadstool'; otherwise by level: level 1 'bin'; level 2 adds 'bbq'; level 3+ adds 'shed' (weights bin 3,
    bbq 2, shed 2). Build the scene in local offsets (metres from the call centre, the centre on clear ground):
    - bin: one `gta-wheelie-bin` (fire on top: y 0.9, r 0.45, fuel 70), 1-2 `bin-bag`s beside it as spread fuel
      (y 0.2, r 0.3, fuel 40).
    - bbq: `fire-bbq-grill` (fire y 0.85 r 0.5 fuel 80), a `fire-deckchair` 1.6 m away (spread fuel), a second deckchair
      or a `park-bench` further (spread fuel).
    - shed: `garden-shed` (2-3 fires on it: base and roof, r 0.9-1.3, fuel 150) and a hedge or a bin as spread fuel.
    - toadstool: 2-4 toadstools (`giant-spotted-toadstool` / `capwood-toadstool-cluster`) 3-5 m apart, one or two lit
      (fire at the cap: y about 1.6, r 0.9, fuel 110), the rest spread fuel.
    - Rescue (level >= 3, 40% of shed calls; 30% of bin calls become a cat rescue): shed: a gnome on the shed roof
      (who 'gnome', a name from a seeded list of gnome names that fit canon, y 2.4, band about [0.55, 0.7] narrowing
      with level); cat: Asphalt on a lamp post next to the bin (add the lamp prop; who 'cat', name 'Asphalt', y 3.2,
      band [0.75, 0.88]). Thanks lines, dry ("I was supervising.", Asphalt: "...").
    - `title`: "<Kind> fire: <place name>" ("Bin fire", "Barbecue fire", "Shed fire", "Toadstool fire").
    - `caller` + `line`: seeded from a list per kind, 6+ each, specific and funny (bbq: "I was told it needed more
      lighter fluid. By me."; toadstool: "The toadstool started it."; shed: "There was nothing flammable in there except
      the shed.").
  - `scoreCall(call, o)`: score 100 - 50 * burnt - max(0, seconds - 90) * 0.3 - (rescued === false ? 30 : 0) +
    (rescued ? 10 : 0), stars by `starsForScore` from '../../jobs/workDefs'. Lines: "Arrived and out in N s",
    "<what burned> mostly saved" / "half gone" / "a shed-shaped memory", "Water used: N l", rescue line. Quote from
    Chief Hydra Pumpwell by stars (5: "Wet is best. You were wettest."; 1: "We do not let it finish. That is the job.").
- `games/gnome-theft-auto/src/workplaces/firefighter/calls.test.ts` (new): deterministic per seed; level 1 only 'bin';
  forest places only 'toadstool'; every call has >= 1 fire and every prefab in props is a non-empty string; rescues
  only at level >= 3 and bands inside 0..1 with lo < hi; scoreCall stars rise with less burnt and fall with a failed
  rescue.

## Contract
`FOREST_PLACES`, `makeCall(level, seed, places, id?)`, `scoreCall(call, outcome)` with the stub signatures.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/firefighter/calls.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`firefighter/types.ts`, every other file.
