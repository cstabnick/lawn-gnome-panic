Epic: E16-B (countryside, second parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): placement judgement and names

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/camps.ts` lists 26 hunter camps (L72: "little random hunter shacks and tents and other
stuff in the more sparse parts of the map so they are less sparse"), spread over the empty country of every outer
region, each on open dry ground near wildlife, with a name, a kind, a facing and a little loot; `camps.test.ts` proves
none sits in water, on a road, in a reserved site or on a collider.

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `CampDef`, `CampKind`, `CampLoot`, `MAX_CAMPS`.
- `games/gnome-theft-auto/src/hunting/species.ts`: `HUNT_SPOTS` (where quarry lives: put several camps 40-120 m from
  these, never on top of them).
- `games/gnome-theft-auto/src/critters/countryside.ts` (`HERDS`, if already filled by another worker; else these deer
  herd centres: (-1290, -640), (-840, -1190), (560, -1090), (1060, 810), (360, 560), (-490, -790); goats (-140, -1140),
  (210, -990)): a few camps near herds (60-150 m off).
- `games/gnome-theft-auto/src/propsOffRoad.test.ts`: how a test builds the real world (`installFakeDom`, `buildWorld`)
  and mocks audio; `src/sites.ts` `reservedRects()`; `src/critters.ts` `roadDistance(x, z)`; `src/terrain.ts`
  `waterAt`, `heightAt`; `src/levels.ts` `regionAt`.
- `games/gnome-theft-auto/src/inventory.ts` `ITEMS` (valid loot item ids, e.g. 'crab-apple', 'seed-cake',
  'cheese-wedge').

## How to pick spots (the lead's probe found these, all >= 30 m from a road, no collider within 8 m, no water within
14 m, outside reserved sites, slope < 0.25; check each again in the test)
Candidates by region (x, z): west-estates (-1340,-740) (-1290,-890) (-1240,-840) (-990,-890) (-1340,110) (-1340,360)
(-1190,360); north-highlands (-1340,-1140) (-1090,-1290) (-840,-1240) (-790,-1140) (-140,-1690) (-40,-1390) (60,-1590)
(260,-1440) (460,-1240) (660,-1440) (760,-1540) (1160,-1090) (1260,-1240) (1360,-1340); loch-moss (-840,-440) (-640,-390)
(-490,-740) (-390,-890); tallgrass-commons (-840,560) (-740,760) (-640,660) (-540,660); cloverfield-farms (-390,560)
(310,510) (410,460) (560,610); dust-flats (760,560) (810,710) (860,210); east-campus (910,-640) (1010,-490) (1110,460)
(1160,-440) (1310,-840) (1360,310) (1060,810 is a deer herd: keep 60 m off); south-shore (-1090,960) (-690,960) (-440,1060)
(610,960) (960,1010) (1210,1060); frostbite-fells and mossy-wood have a few too (run your own probe with the test's
helpers if you want more). Keep clear of: the Unmown and Pardonlin (other epics own them), the hamlets of another epic
at Espalier End (-1080, -420), Mittenholt (550, -1375), Dunelow (-560, 965) and the High Tarn (1000, -1600) (150 m),
and the cult camp site Wader's Rest (x -1220..-1040, z -730..-550). Spread them: no two camps closer than 120 m; every
outer region gets at least 2.

## Change
- `src/country/camps.ts`: `export const CAMPS: readonly CampDef[] = [...]` (26 entries; keep the import of `CampDef`):
  - kinds roughly: 6 `tent` (one tent, a fire, a stool), 5 `camp` (two tents round a fire with a kettle tripod: the
    hunters' social club), 4 `shack`, 4 `stand` (a deer stand at a field or wood edge, nearest the deer), 3 `blind`
    (duck blinds: put these 15-25 m from water on loch, tarn or coast shores: they are allowed to be near water but the
    camp point itself must be dry: `waterAt` null within 6 m), 4 `drying` (a drying rack of tufts and a bedroll).
  - `id` `camp-<region-short>-<n>`; `name`: short and lived-in ("Cutback Hide", "Old Burdock's Shack", "The Thermos Stand",
    "Teasel's Tent", "Damp Socks Camp"); a few names mention a hunter (first names in the gnome style of the lore:
    plants, tools, household things).
  - `yaw`: the camp's front faces open ground or the view (not a cliff).
  - `loot`: acorns 5-25 or a snack item (`crab-apple`, `seed-cake`, `cheese-wedge`, or any `kind: 'snack'` in `ITEMS`,
    n 1-2), with a `prompt` starting with a verb ("Check the biscuit tin", "Look in the pack", "Lift the tea cosy").
  - `sleeper: true` on about 8 of the tent/camp/shack ones.
- New `src/country/camps.test.ts`: builds the real world once (as `propsOffRoad.test.ts`; allow a long timeout, e.g.
  120000 ms) and checks every camp: inside the fence (|x|, |z| <= 1700), `regionAt` is not 'the-unmown', 'pardonlin' or
  'downtown'; no water within 6 m (8 directions); `roadDistance >= 20`; outside every `reservedRects()` rectangle by 10 m;
  no `world.boxes` collider within 6 m (the camps' own colliders are added later by another worker inside
  `buildCountryside`, which also runs in `buildWorld`: so ignore boxes within 6 m of a camp centre that came from the
  camp itself by testing against a world built BEFORE camps exist: simplest is to filter out boxes whose centre is
  within 7 m of ANY camp centre only if `CAMPS` builds are present; if that is awkward, check against
  `world.boxes` minus the boxes added by `buildCamps` by calling `buildCamps` yourself into a separate array and
  comparing); no two camps closer than 120 m; ids unique; `CAMPS.length <= MAX_CAMPS`; every loot item id exists in
  `ITEMS`.

## Contract
`CAMPS: readonly CampDef[]` (other modules and later story quests reference camps by `id`).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/country/camps.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
`src/country/types.ts`, `src/country/campsBuild.ts` (another worker builds the camps from your data), every other file.
