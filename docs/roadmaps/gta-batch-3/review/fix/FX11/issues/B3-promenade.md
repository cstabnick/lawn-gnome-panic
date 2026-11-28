Epic: FX11 B (placement, parallel) · Issue B3: the promenade's south row, bunting and strollers (G3#6 D14 must; G3#12 bunting bulbs)
Depends on: epic A · Agent: Sonnet · Dev port 5543

(The Environment section the lead gave you applies.)

## Goal
Decision D14 (final): "rather than filling all 46 m of the deck, narrow the promenade rect to about 24-30 m, give the strip back to sand, and dress what remains (kiosks, bunting, strollers)." The rect is already narrowed to z 1102..1132 and the stalls line its north edge. Editor's G3#6 fix list for the rest: "a second row of kiosks or rides on the south side (a small carousel, a helter-skelter, coin-op telescopes facing the sea, a Punch-and-Judy-style booth), bunting strung between the lamps, bins, a deckchair stack, and 4-6 strolling gnomes." G3#12: "bunting bulbs between the lamps" lit at night. You fill `src/coast/promenade.ts` (a stub: `buildPromenade(scene, boxes, deckTop)` is already called by boardwalk.ts; `PROMENADE_FOLK` is added to the residents by life.ts).

## Read first
- `games/gnome-theft-auto/src/coast/promenade.ts` (stub), `src/coast/boardwalk.ts` (`boardwalkLamps()` gives lamp x positions every 30 m from -195 and the two rows z 1104.6 and 1129.2; stairs at x -120, 0, 120 (4 m wide) on the south edge; benches at z 1129.8 at x -180, -60, 60, 180; the south rail at z 1131.3), `src/coast/deckKit.ts` (`place`, `placeAt`, `solid`, `signAt`, `Bins`), `src/coast/config.ts`.
- `src/coast/stalls.ts` (the north row: kiosks at z 1105.5, Tin Shy's tins at (-40, 1110.1), Sal's cart at (-145, 1110.5); their keepers stand on the walkway in front).
- `src/coast/life.ts` `COAST_VIGNETTES` boardwalk entries (keep their spots clear: candyfloss at about (-120, 1122), Tin Shy's sulk at x -34..-19, z 1118..1123, lost property at x 149..151.5, z 1107..1108) and its residents.
- `packages/prefabs/src/catalog/gta-coast-fair.ts` (new: `mini-carousel`, `helter-skelter`, `punch-booth`, `coin-telescope`, `deckchair-stack`, `rope-stanchion`, `seaside-bin`, `ice-cream-kiosk`, `shell-grotto-booth`: read each `about:` for its size). Existing: `bunting-span` (gta-street-kit-b.ts: two poles with a sagging string of flags, 15.2 m wide as built), `glaze-extra-bunting`, `litter-bin`, `park-bench`.
- `src/coast/nightLights.ts` (`nightGlowMat(color, peak?)`, `lightPool(...)`, `onCoastNight(fn)`).
- `src/ambientGnomes.ts` `AmbientGnomeDef` (`surface: 'rooftop'` to stand on the deck; idle ids as used in life.ts).

## Change: `src/coast/promenade.ts` (+ `src/coast/promenade.test.ts`)
1. South row (z about 1122-1128, scale about 2.2-2.6): between the benches and the stairs, a rhythm of 5-7 pieces along x -200..200: the `mini-carousel` (the centrepiece, near x -90 or 30), the `helter-skelter` (a tall landmark, towards an end), a `punch-booth` with a few gnomes watching, an `ice-cream-kiosk`, the `shell-grotto-booth`. Leave 4 m clear round each stair gap and 2 m in front of each bench (they face the sea). Each solid piece gets a collider (`solid(boxes, obj)`); keep the walkway z 1108..1121 open the whole length.
2. Coin telescopes (`coin-telescope`, facing the sea, yaw 0) at the rail by 3-4 of the benches; `seaside-bin`s every 40-60 m; one `deckchair-stack` by the stairs at x 0.
3. Bunting: strings between consecutive lamps along both rows (lamp globes at about deckTop + 5.0): a sagging catenary of small triangle flags in 4-5 colours. Build it as game geometry merged per material (flags are a pattern of triangles, cheap; one merged mesh per 60 m chunk), or reuse `bunting-span` stretched if it fits better. Add a string of small bulbs along each catenary (radius about 0.08 m, every 1.2 m) merged into one mesh with `nightGlowMat(0xfff1c4, 2)`, so the promenade glows at night. Also one or two strings across the walkway at the entrance (x 0).
4. `PROMENADE_FOLK`: 5-6 gnomes on the deck (`surface: 'rooftop'`, ids `coast-prom-*`), in little scenes: a couple at a telescope, a child and parent at the carousel, two watching the punch booth, one queueing at the ice-cream kiosk. Give each a name and one dry bubble line in the coast voice (no line repeating a sign next to them); varied looks.
5. Test: no piece blocks a stair gap or the walkway (z 1108..1121), every folk position is on the deck rect and not inside a collider you pushed.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Shots (port 5543): `bwmid:0,1108,0 bweast:150,1115,1.6 bwwest:-190,1115,-1.6 south:-60,1119,0.2` by day, `bwN:0,1108,0 bwN2:-150,1114,1.4` with `?time=night`, `bwP:0,1108,0 --size 390x844` and `bwL:0,1108,0 --size 844x390`. Compare the editors' `a02-bwmid.png`, `a03-bweast.png`, `c01-night-bw.png`, `p01-phone-bw.png`. It must read as a lively seaside promenade, not a plank field, and glow at night. Iterate.
- Perf (GR9): `node tools/gta-perf.mjs http://localhost:5543/ --cpu 4 --legs '[["boardwalk",[[-200,1117],[200,1117]]]]'`; report the numbers.
- `npm run zfight -- "http://localhost:5543/?at=0,1115,0"` (say so if it times out).

## Out of scope
`boardwalk.ts`, `stalls.ts`, `life.ts`, `deckKit.ts`, the prefab catalog.
