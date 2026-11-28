Epic: FX11 A (coast fixes, parallel) · Issue A15: the boardwalk deck, its lamps at night, the beach below (G3#6 boards, G3#12 lamps, G3#29, G3#23 tide table, FX06 hand-off)
Depends on: none · Agent: Sonnet · Dev port 5535

(The Environment section the lead gave you applies.)

## Goal
- G3#6 (D14, must): "The plank texture uses 1.2 m boards with very dark seams, so at eye height it reads as a ploughed field." Use thinner boards (about 0.3 m) with softer seams and some tone variation. (The deck was already narrowed to 30 m this epic; other workers dress it.)
- FX06 hand-off: "Boardwalk west end (x -210..-200): the ground rises above the deck and the planks sink in." Fix it.
- G3#12: "The lamp heads glow, but the deck stays black." Add warm light pools on the deck under the lamps at night.
- G3#29: "Four identical huts stand in a row. Each umbrella has a deckchair at the same +3/+3 offset and the same yaw (0.3 / 3.3), five times over. Each sandcastle has a bucket-and-spade at the same (+3, +1.5) offset and yaw, four times over." Fix: "Vary yaw, scale and offset per group, break the hut row (one hut set back, one with its door open and towels on a line), and group chairs in pairs and families."
- G3#23: "the tide table on a beach hut with '(approx.)' chalked under each line".

## Read first
- `games/gnome-theft-auto/src/coast/boardwalk.ts` (all: deck, south rail and stairs, lamps and benches, joke signs, beach dressing) and `src/coast/deckKit.ts` (`plankTexture(n, a, b, alongV)` and `MATS.woodA = deckMat(25, ...)`: the deck slabs are 30 m boxes along x, so 25 boards per slab = 1.2 m boards).
- `games/gnome-theft-auto/src/coast/config.ts` `COAST.boardwalk` (rect x -210..210, z 1102..1132; deckLift 0.22; lampStep 30), `COAST.lastTube` (keep x 132..168, z 1140..1180 clear).
- `games/gnome-theft-auto/src/coast/nightLights.ts` (`lightPool(x, y, z, r, color?, peak?)`: a flat additive disc on the decal layer, invisible by day; add the returned mesh to the scene).
- `games/gnome-theft-auto/src/coast/boardwalk.test.ts`.
- Prefabs (existing): `beach-hut` (door on +z, `tint` walls, `trim`), `beach-umbrella` (tint canopy), `deck-chair`, `sandcastle`, `bucket-and-spade` (tint), `picnic-blanket-spread`, `beach-ball`. Being added now in `gta-coast-beach.ts` (guard with `getPrefab`): `towel-line` (a washing line on two posts 1.4 apart along x, three striped towels, about 0.9 tall at scale 1), `windbreak` (striped canvas, 1.6 long along x, tint = stripes).

## Change: `src/coast/boardwalk.ts`, `src/coast/deckKit.ts`; in `src/coast/config.ts` ONLY `boardwalk.rect.minX` if step 2 needs it
1. Boards: in deckKit.ts make the boardwalk's plank texture read as real decking from eye height: about 0.3 m boards (so about 100 boards per 30 m slab: the canvas is 1024 px, about 10 px a board; raise the canvas size if needed), seams thin and only a little darker than the boards (not `#3b2a1a` black), 3-4 board tones with a subtle random variation (deterministic: a fixed seed), maybe a faint grain line. Keep the pier's own plank materials (`pierWood`, `pierWoodZ`) as they are unless they share the function's defaults (another worker is reworking the pier; do not change how those keys look). Set the texture's `anisotropy` to 4 so it does not shimmer at a glancing angle.
2. West end: measure `heightAt(x, z)` along all four edges of the deck rect (every 2 m) and find where the ground is above `deckTop - 0.05`. Fix it so no plank sinks: either trim `COAST.boardwalk.rect.minX` to where the ground stays below the deck (and say the new value in your report), or add a short ramp/step-down at the west end. Add a test in `boardwalk.test.ts`: "the ground stays below the deck top along every edge".
3. Light pools: one `lightPool(x, deckTop, z, 4.2)` under each lamp (positions from `boardwalkLamps()` in boardwalk.ts), added to the scene. Keep them on the deck (clip the radius at the deck edge if a lamp is near it: use a smaller radius there).
4. Beach dressing (z 1145..1185 for x -300..230; leave x 132..168 clear for the Last Tube): rewrite the placement as hand-placed groups, each with its own yaw, scale (+-10%) and offsets:
   - Huts: break the row of four: different spacing and a little yaw each, one set back about 4 m, one with its door open (a dark `flatLayer` door gap is a decal you may NOT use: instead turn that hut a little and put a `towel-line` beside it with towels drying), different tints (keep the bright palette).
   - Umbrellas and chairs: in pairs and small families (an umbrella with two chairs facing the sea at slightly different angles; one family with a windbreak, a `picnic-blanket-spread` and a beach ball; one lone chair turned to the sun), never the same offset twice.
   - Sandcastles: each with its bucket-and-spade at a different offset and yaw, one with two buckets, one knocked over (a tilted bucket).
   - The tide table (G3#23): a small sign fixed flat on the west wall of one hut (`signAt` with `post: 0`, mounted 0.03 m proud of the wall, facing out), text `"TIDE TABLE\nHigh 06:12 (approx.)\nLow 12:30 (approx.)\nHigh 18:40 (approx.)"`.
   Residents stand at (-105.5, 1171) Burnt Ned and (-66, 1177.5) Bev Nell (lean-back on chairs) and Lookout Lenny at the lifeguard chair (56.5, 1172.5): keep a chair under each of the first two.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Shots (port 5535): `bwmid:0,1108,0 bweast:150,1120,1.6 bwwest:-200,1118,1.4 huts:-250,1195,3.14159 beach:-60,1192,3.0` by day, `bwN:0,1108,0` with `?time=night`, and `bwP:0,1108,0 --size 390x844`. Compare the editors' `a02-bwmid.png`, `a03-bweast.png`, `a04-bwwest.png`, `b06-huts.png`, `c01-night-bw.png`, `p01-phone-bw.png`. Iterate until the deck reads as boards, not a ploughed field, and the beach looks placed by hand.
- `npm run zfight -- "http://localhost:5535/?at=0,1115,0"` reports nothing new (if it times out, say so).

## Out of scope
`pier.ts`, `stalls.ts`, `promenade.ts` (other workers dress the deck), `life.ts`, the stalls and their signs.
