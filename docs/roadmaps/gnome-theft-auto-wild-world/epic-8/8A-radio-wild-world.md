Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files
of `games/gnome-theft-auto` at the same time (app.ts, npcs.ts, errands.ts, config.ts, tessie.ts): do not touch them.
Lore rule R-021: nothing on air gets wet, soaked, dripping or bloody (a test enforces the words `wet`, `wetter`,
`wetness`, `soak*`, `drip*`, `blood*`, `gore`, `bleed*`). Write "on the water", "afloat", "the loch", never "wet".
House style: plain, dry, gently absurd; gnomes are fired clay (they crack and are glued back); animals never die.

## Goal
Turfton FM talks about the wild world: a bulletin pair for each of the nine wildlife events, boat and marina adverts,
and traffic reports for the five river bridges.

## Read first
- `games/gnome-theft-auto/src/radio/content.ts`: `Line`, `ADS`, `EVENT_BULLETINS` (keys are event ids, each value is
  two `{ who: 'BULLETIN', text }` lines; see the existing `'tessie-surfaced'` entry for tone), `trafficLine`, `allLines`.
- `games/gnome-theft-auto/src/radio/schedule.ts` lines 1-65: `TRAFFIC_POOL` (built from `PLACES` by weight) and how
  the `'traffic'` segment picks from it.
- `games/gnome-theft-auto/src/radio/schedule.test.ts`: the content checks (no-wet rule, every pool non-empty).

## Change
- `src/radio/content.ts`:
  - Add nine `EVENT_BULLETINS` entries, two lines each, `who: 'BULLETIN'`, keyed exactly:
    - `'cow-tipped'`: a gnome on foot ran into a standing cow in Cloverfield Farms and tipped it over; it got up and
      wandered off, unbothered.
    - `'herd-herded'`: a Combine or Mulch Spreader drove a whole herd (cows, sheep, pigs) across the farm like a
      sheepdog; Farmer Bramble is unsure whether to thank them.
    - `'drey-raid'`: the Drey Gang (Cloverfield's squirrels, who den in the hedgerows and an old silo) mobbed a gnome on
      foot, pinched Acorns and pelted acorns from cover.
    - `'drey-mower-stolen'`: two squirrels of the Drey Gang drove off with a parked mower to another den.
    - `'drey-scattered'`: someone fired on a Drey Gang den and the squirrels scattered; they will regroup.
    - `'snowman-smashed'`: a snowman in Frostbite Fells was smashed; it will be rebuilt overnight (by whom, nobody says).
    - `'bear-shrug'`: write this one as a WEATHER REPORT from the Fells: the polar bears (who lounge in deck chairs in
      sunglasses and never get angry) were shot at or rammed and only shrugged; "conditions: chill".
    - `'hive-knocked'`: a straw hive in Tallgrass Commons (grass taller than a gnome) was knocked over; the bees are out.
    - `'swarm-escaped'`: a gnome outran a bee swarm in the Commons; the bees went home.
  - Append four lines to the shared `ADS` (`who: 'AD'`): Walnut Dinghy rentals at New Puddle Marina (half a walnut
    shell, lolly-stick oars, the first boat any gnome learns to row); the Gravy Boat (white porcelain speedboat with a
    spout, the fastest thing afloat); the Watering-Can Steamer, the Loch Moss ferry from the Loch Moss dock (a green tin
    watering can with paddle wheels); the Clog Cruiser (a big yellow wooden clog, four seats, "the family boat").
  - Add `export const BRIDGE_TRAFFIC: readonly Line[]` with exactly five lines, `who: 'TRAFFIC'`, one per bridge, each
    text containing the bridge's name verbatim:
    - `Fellsmelt Bridge`: upper river under Ring Road North-West, below the Frostbite Fells.
    - `Ravine Bridge`: the Mossy Wood ravine under Highway West.
    - `Bracken Bridge`: the ravine river under Ring Road South-West.
    - `Culvert Bridge`: the Southern Drainage Canal under Highway South.
    - `Clover Bridge`: the farm river under Ring Road South-East.
    Typical content: a slow Combine on the deck, a boat passing underneath, a Clog Cruiser asking for the bridge to be
    "a bit higher, please".
  - `allLines()`: also include `...BRIDGE_TRAFFIC`.
- `src/radio/schedule.ts`: import `BRIDGE_TRAFFIC` and append it to `TRAFFIC_POOL`, each bridge line repeated twice
  (`BRIDGE_TRAFFIC.flatMap((l) => [l, l])`), so bridges come up about as often as a mid-weight place.
- `src/radio/schedule.test.ts`: add a test that every id in
  `['cow-tipped','herd-herded','drey-raid','drey-mower-stolen','drey-scattered','snowman-smashed','bear-shrug','hive-knocked','swarm-escaped']`
  has at least two lines in `EVENT_BULLETINS`, and that `BRIDGE_TRAFFIC` has five lines naming the five bridges above.

## Contract
`export const BRIDGE_TRAFFIC: readonly Line[]` in `src/radio/content.ts`. Event ids exactly as above (the wildlife
runtime already calls `reportNews(id)` when `EVENT_BULLETINS` has the id; nothing else to wire).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/radio` passes (includes the no-wet test).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (errors in files you did not touch, from other workers mid-edit,
  are not yours: say so in your report).

## Out of scope
Every file outside `src/radio/`. No new stations, no change to bulletin timing, no audio.
