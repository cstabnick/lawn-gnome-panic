Epic: FX11 A (coast fixes, parallel) · Issue A2: Saltbucket Boardwalk fair prefabs (rides, booths, promenade kit)
Depends on: none · Agent: Sonnet (modelling taste) · No dev server needed (gallery optional: `npm run dev -w games/prefab-gallery -- --port 5522 --strictPort`)

(The Environment section the lead gave you applies.)

## Goal
Add the promenade's rides and kit to `packages/prefabs/src/catalog/gta-coast-fair.ts` (exists with an empty `GTA_COAST_FAIR` array, already registered in the catalog index). Another worker will place them on the boardwalk's south side by these exact ids, at about scale 2-2.4 (a gnome is 1 unit tall; the boardwalk's stalls are `boardwalk-stall` at scale 2.4, about 3.8 m wide and 4.4 m tall in the world).

## Read first
- `packages/prefabs/src/types.ts`, `packages/prefabs/src/palette.ts`, `docs/roadmaps/prefab-library/_common.md` (format, colours, modelling rules: lowest point y = 0 +-0.03, centred, front +z, `at` is the centre, `rot` in degrees, 40 parts max).
- `packages/prefabs/src/catalog/gta-coast-kit.ts` (`boardwalk-stall`, `boardwalk-lamp`, `candyfloss-cart`, `tin-shy`: the same seaside look, stripes in red/white/blue/yellow; copy the examine voice: five lines, a look line, a saying, a "Tip:", a "Joke:", an odd detail).

## Change: `packages/prefabs/src/catalog/gta-coast-fair.ts`
Add (category `'prop'`, `uses: ['place']`, tags include `'saltbucket'`, `'boardwalk'`, `'gta'`, `emoji: []`, `about:` with the built size and origin, five examine lines):

1. `mini-carousel` (tint = canopy stripes, trim = second stripe): a small gallopers carousel about 1.6 across, 1.5 tall: round platform, centre pole, striped conical canopy (alternating tint/trim wedges or cone + ring bands), 6 little seats on poles round the edge (alternate: a gull, a deckchair, a teacup, a duck; simple shapes), a scalloped valance ring.
2. `helter-skelter`: a tall striped tower about 2.6 tall, 0.9 across at the base, with a spiral slide going round it (8-12 tilted boxes stepping round and down), a little door at the bottom on +z and a pointed cap with a flag.
3. `punch-booth`: a Punch-and-Judy style puppet booth, about 0.9 wide, 1.6 tall, 0.5 deep: striped cloth body (tint), a stage opening near the top on +z with a small red curtain each side, two simple puppet heads in the opening (a gnome with a pointy hat, and a gull), a little sign board on the top.
4. `coin-telescope`: a coin-op seaside telescope on a pedestal, about 0.9 tall: a short green iron post, a box head with a coin slot, two eyepieces facing -z, a tube pointing +z (the front faces the sea when yaw 0 means +z).
5. `deckchair-stack`: about 8 folded deckchairs leaning in a stack against a little rack, striped canvas in alternating colours, about 0.9 tall.
6. `rope-stanchion`: a pair of brass queue posts with a thick red rope sagging between them (posts 0.5 apart along x, 0.45 tall, round feet, the rope as 3-4 boxes making a sag). Lowest point y 0.
7. `seaside-bin`: a round litter bin on a post with a little roof, painted green with a gull sticker, about 0.6 tall.
8. `ice-cream-kiosk`: a small round kiosk about 1.2 across, 1.6 tall, with a big fibreglass cone (cone + scoop ball) on the roof, a serving hatch on +z.
9. `shell-grotto-booth`: a "Grotto of Shells" fortune booth: a small hut 1.0 wide, 1.3 tall, covered in shell bumps (squashed balls), a dark doorway curtain on +z, a crescent-moon sign.

## Contract
The 9 ids above, exactly; each on y = 0 at its origin, centred, front +z; built size in `about:`.

## Done when
- `npm test -w packages/prefabs` passes.
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in `packages/prefabs`.

## Out of scope
Every other catalog file and `index.ts`; the game code.
