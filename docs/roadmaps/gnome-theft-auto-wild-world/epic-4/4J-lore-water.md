Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- Two other planning sessions add lore (wildlife, landforms) at the same time, including rulings. Append with small
  Edit-tool edits; never rewrite `docs/lore/rulings.md` or an existing entry whole.

## Goal
Gnome Theft Auto's water gets its lore: a ruling on what happens to clay gnomes and mowers in deep water, a fact-sheet
for each boat and for the waterworks, and the canal entry updated for its new locks and bridge.

## Read first
- `docs/lore/README.md` (entry format, front matter fields, how `npm run lore` checks) and `docs/lore/canon.md`.
- `docs/lore/rulings.md`: the format of the last rulings (R-047, R-048: Question / Ruling / Applies to + Date / Why).
- `docs/lore/entries/apocrypha/ride-on-mower.md` (a vehicle entry), `southern-drainage-canal.md`, `loch-moss.md`,
  `the-puddle-sea.md`, `the-everspring.md`, `driftwood-castaway.md`, `hoa.md`.
- Setting rule for Gnome Theft Auto (`apocrypha`, ruling R-021): fired clay cracks and is glued back; nothing bleeds;
  **nothing gets wet, soaked or dripping**. The Tall Ones are never seen or explained; garden objects are never named
  for what they really are by a gnome (a hose nozzle is "the Brass Horn", the pond is a loch).

## Change
1. Search first: `npm run lore -- find water`, `-- find boat`, `-- find float`, `-- find sink`, `-- find canal`, and
   each boat name below. Reuse what exists; do not contradict it.
2. **Ruling** in `docs/lore/rulings.md`: right before writing, read the end of the file and take the next free number
   (the last one was R-049 when this issue was written, but others may have added more; never reuse a number). Append:
   - Question: what happens to a fired-clay gnome, and to a mower, in deep water, given that nothing gets wet (R-021)?
   - Ruling: fired clay gnomes are hollow, so in deep water a gnome bobs upright like a fishing float and paddles
     slowly; it cannot aim or fire while bobbing (both hands paddle), and climbs out where the bed rises. Shallow
     water (the canal floor, river edges, fords) is waded. A mower that drives into deep water conks out and sinks;
     the gnome bobs up beside it; a day later the mower turns up again where it was parked, "fished out" by somebody
     nobody ever sees (leave who as a loose thread). Water never soaks anything: it only floats, sinks or slows.
   - Applies to: apocrypha, gnome-theft-auto. Date: 2026-11-22. Why: one short line.
3. **New entries** in `docs/lore/entries/apocrypha/` (front matter like `ride-on-mower.md`, `kind: vehicle` or
   `place`/`thing` as fits, `tier: apocrypha`, `setting: apocrypha`, `status: draft`, `games: [gnome-theft-auto]`, a
   short intro, "Field Notes & Tales", "What gnomes say", "Loose threads"), one per named thing:
   - `walnut-dinghy.md` (Walnut Dinghy: half a walnut shell, rowed, two seats; Loch Moss and the canal),
   - `gravy-boat.md` (Gravy Boat: a white porcelain speedboat with a spout at the bow; fastest on the water),
   - `clog-cruiser.md` (Clog Cruiser: a yellow wooden clog, four seats; the New Puddle marina),
   - `watering-can-steamer.md` (Watering-Can Steamer: the Loch Moss ferry, a green tin can with a funnel spout and
     paddle wheels; it never leaves the loch because of the weir),
   - `hoa-patrol-boat.md` (HOA Patrol Boat: the Hat Watch on water, sent at three hats; beige with a light bar),
   - `turfton-waterworks.md` (the gnome waterworks: the canal's two sponsored locks, the Loch Moss weir that holds
     the loch level, the Cloverfield field sluices, the Mossy Wood waterwheel sawmill, the docks and wharves, the road
     bridges sized for mowers; and the quiet oddities: the Brass Horn at the Everspring, the black rubber rim of Loch
     Moss, the concrete lips along the canal, the toppled stone heron; gnomes have theories, never the answer).
   Sponsors fit Turfton (e.g. "Pay-n-Glaze Lock No. 1"): use brands that already exist in the lore (`npm run lore --
   find pay-n-glaze`), do not invent companies.
4. **Update** `southern-drainage-canal.md` (small edits): the canal is now a channel with a shallow, wadeable floor,
   two locks where it steps down, two wharves (Old Brick at the west, Industrial at the east), and a road bridge at the
   south highway; link the new entries in `related`. Add the new entries to `related` of `loch-moss.md` and
   `the-puddle-sea.md` where they fit.
5. If `docs/lore/INDEX.md` is generated or checked by `npm run lore`, follow what the README says (regenerate it with
   the documented command, or add rows by hand in the same format).

## Contract
Entry ids (file names) exactly: `walnut-dinghy`, `gravy-boat`, `clog-cruiser`, `watering-can-steamer`,
`hoa-patrol-boat`, `turfton-waterworks`.

## Done when
- `npm run lore` passes.
- `npm run lore -- find bob` finds the new ruling; `npm run lore -- find "Gravy Boat"` finds its entry.

## Out of scope
Any file outside `docs/lore/`. Other entries beyond the small `related` / canal edits above.
