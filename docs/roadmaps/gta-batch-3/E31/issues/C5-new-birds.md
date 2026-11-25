Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
Eight new bird species fly in Gnome Theft Auto's birding system (spotted through the binoculars, logged in the journal,
with calls), and every outer region (the bands added in batch 3) has a richer, region-appropriate set of birds.

## Read first
- `games/gnome-theft-auto/src/birding/types.ts` (`BirdSpecies`, `CallRecipe`, `FlightStyle`, `PerchKind`, `CallKind`,
  the time constants DAY / NIGHT / TWILIGHT / ALWAYS, the wind constants)
- `games/gnome-theft-auto/src/birding/species.ts` (the 28 species: copy their shape and voice)
- `games/gnome-theft-auto/src/birding/species.test.ts`
- `games/gnome-theft-auto/src/levels.ts` (the `RegionId` union): 'turfton', 'frostbite-fells', 'loch-moss',
  'mossy-wood', 'tallgrass-commons', 'cloverfield-farms', 'dust-flats', 'north-highlands' (Snowcap Rise),
  'south-shore' (Saltbucket Shore), 'east-campus' (Rootwell), 'west-estates' (Trellisdown), 'pardonlin' (the European
  town on the river Thymes), 'the-unmown' (the nature preserve: Reedmere marsh, the Long Meadow, Oldroot Wood).

## Change
- `games/gnome-theft-auto/src/birding/species.ts`: append these eight species (ids exactly), reusing EXISTING bird
  prefabs with their own `tint`/`trim`/`scale` (prefab ids available: 'bird-songbird', 'bird-robin', 'bird-pigeon',
  'bird-gull', 'bird-wader', 'bird-flamingo', 'bird-raptor', 'bird-owl', 'bird-puffin', 'bird-swan', 'bird-runner',
  'bird-longtail'):
  1. `reedmere-bittern` "Reedmere Bittern" — group 'wader', rarity 'rare', regions { 'the-unmown': 2.5, 'loch-moss': 0.5 },
     TWILIGHT, still wind, 'bird-wader' streaky buff/brown, `call` a deep booming 'croak' (hz ~110, 1-2 notes, long),
     perches shore/water, flock [1,1], very shy. The boom of the marsh.
  2. `marsh-harrier` "Marsh Harrier" — 'raptor', 'uncommon', { 'the-unmown': 2, 'west-estates': 1, 'loch-moss': 0.8 },
     DAY, gusty, 'bird-raptor' brown with a cream head, flight 'glide', low altitude (~6).
  3. `meadow-cuckoo` "Meadow Cuckoo" — 'songbird', 'uncommon', { 'the-unmown': 2, 'west-estates': 1, 'tallgrass-commons': 0.8 },
     { Dawn: 1, Morning: 1.2 }, any wind, 'bird-longtail' grey barred, two-note 'whistle' call (hz ~650, slide 0.8, notes 2).
  4. `thymes-kingfisher` "Thymes Kingfisher" — 'songbird', 'rare', { pardonlin: 1.5, 'the-unmown': 1, 'mossy-wood': 0.5 },
     DAY, still, 'bird-songbird' electric blue tint + orange trim, small scale, flight 'flap' fast, perches water/tree/shore.
  5. `pond-mallard` "Pond Mallard" — 'waterfowl', 'common', { 'loch-moss': 2, pardonlin: 2, 'the-unmown': 1.5, turfton: 0.8,
     'west-estates': 0.8 }, ALWAYS, any wind, 'bird-swan' green-head tint + brown trim at scale ~0.6, 'quack' call,
     flock [2, 6], perches water/shore.
  6. `shore-cormorant` "Shore Cormorant" — 'seabird', 'common', { 'south-shore': 2.5, 'loch-moss': 0.6 }, DAY, any wind,
     'bird-wader' or 'bird-puffin' near-black at a larger scale, perches water/shore, croaky call. Stands with its wings out
     to dry like a coat on a hanger.
  7. `snowcap-eagle` "Snowcap Eagle" — 'raptor', 'rare', { 'north-highlands': 2, 'frostbite-fells': 0.6 }, DAY, gusty,
     'bird-raptor' dark brown with golden trim, scale ~1.8, flight 'soar', altitude high (~30), screech call.
  8. `tarn-diver` "High Tarn Diver" — 'waterfowl', 'rare', { 'north-highlands': 1.5 }, { Dawn: 1, Morning: 1, Dusk: 0.8 },
     still, 'bird-swan' at scale ~0.7 tinted charcoal with white trim, 'whistle' wailing call (slide 1.5), flock [1, 2],
     perches water. Haunting call over the High Tarn.
  Give each a `hint` (where and when, < 200 chars) and a funny `blurb` (< 200 chars) in the existing voice.
  Groups: do NOT add any 'owl' or 'mythic' species (the tests and the Night Owl achievement count those).
- Same file: widen the region weights of EXISTING species so the batch-3 regions feel alive (add keys, never remove):
  pigeons in 'south-shore' and 'east-campus'; 'loch-gull' already covers 'south-shore' — add 'pardonlin' 0.5;
  'reed-heron' add 'west-estates' 0.4 and 'south-shore' 0.4; 'fells-buzzard' add 'west-estates' 0.6; 'verge-kestrel' add
  'north-highlands' 0.8, 'west-estates' 1, 'south-shore' 0.6; 'commons-starling' add 'west-estates' 1, 'south-shore' 1;
  'barn-owl' add 'the-unmown' 1; 'tawny-owl' add 'the-unmown' 1.5 and 'pardonlin' 0.5; 'acorn-tit' add 'the-unmown' 1.
- `games/gnome-theft-auto/src/birding/species.test.ts`: the count becomes 36; add a test that the eight ids above exist
  and that 'the-unmown' has at least 10 species and every region at least 5.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/birding` passes (all birding tests, including sounds and spawner).
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other birding files (flock, spawner, sounds are data-driven from BIRDS), prefabs, achievements.
