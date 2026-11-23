Epic: 1 Modules (Hangar Two and the Mossbank Boathouse, Gnome Theft Auto)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash; use absolute paths). If node/npx is
not found: export PATH="/c/Program Files/nodejs:$PATH". Other workers (and other planners) edit other files at the same
time, including other lore entries: touch ONLY the files listed under Change. Do not commit, push, stash, switch
branches, or start a dev server. Do not edit AGENT_INDEX.md. `npm run lore` rewrites docs/lore/INDEX.md: that is
expected and fine.

## Goal
Lore for Gnome Theft Auto's two buyable garages: Hangar Two (Desert Airfield) and the Mossbank Boathouse (Loch Moss),
plus a ruling that keeps them apart from places already in the lore.

## Read first
- docs/lore/README.md: entry format and front matter.
- docs/lore/entries/apocrypha/side-valve-lock-up.md: the sister entry (copy its shape and tone; same tier/setting).
- docs/lore/entries/apocrypha/desert-airfield.md, wind-sock-wally.md, loch-moss.md, driftwood-castaway.md,
  watering-can-steamer.md, tansy-clayfoot.md: the facts you must not contradict. Run `npm run lore -- find hangar`,
  `npm run lore -- find boathouse` and `npm run lore -- find Driftwood` to check.
- docs/lore/rulings.md: the ruling format (append at the end).

## Facts (from the game code; write them in, do not change them)
- Hangar Two: a long corrugated-tin hangar, 24 m wide, 14 deep, 9 tall, standing east of the old airfield hangar on the
  same line, its door facing the runway; the roller door is kept rolled up. Sold by Wind-Sock Wally for 1200 Acorns
  (he keeps the clipboard; the paperwork is a seed-tin lid with "2" scratched on it - invent small details like this
  in the same spirit). Three bays, aircraft only (Hedge-Hopper, Crop Duster, Sycamore Copter, Dandelion Drifter, the
  Whirligig). A concrete floor and apron and its own windsock.
- The Mossbank Boathouse: a wooden boathouse on the south shore of Loch Moss, about 25 m east of the dock where
  Driftwood keeps the loch (check what the Driftwood entry calls the dock and its keeper), its back wall on the shore and
  its open front over the loch. A slip between two walkways, a back door to the shore. Let by Driftwood for 800 Acorns.
  Three slips, boats only. It will not take Tessie (Tessie belongs to the loch) nor the HOA patrol boat.
- Tansy Clayfoot's Sling-Lift (see side-valve-lock-up.md) also fetches from the hangar and the boathouse, from a gnome's
  phone: rotor craft and the Dandelion Drifter are lowered on clear flat ground near the gnome; fixed-wing aircraft are
  set down at the start of a long clear strip (about 60 m) facing down it, and if there is none nearby they are taken
  back to the Desert Airfield instead; boats are lowered onto open water at least a gnome's height deep (1 m) near the
  gnome, and if there is no open water nearby the Sling-Lift will not fly. Fees: 80 Acorns for an aircraft, 60 for a
  boat (40 for a mower, as before).
- Achievements: Landed Gnome (own both; the Harbourmaster Cap), Full Hangar (three aircraft; the Windsock Quiver),
  Harbour Full (three boats; the Cork Key Float).

## Change
- docs/lore/entries/apocrypha/hangar-two.md (new): id hangar-two, kind place, tier apocrypha, setting apocrypha, era now,
  status draft, games [gnome-theft-auto], aliases [Hangar 2, Wally's spare hangar], sources
  [games/gnome-theft-auto/src/lockup/config.ts, games/gnome-theft-auto/src/lockup/runtime.ts], related
  [desert-airfield, wind-sock-wally, side-valve-lock-up, tansy-clayfoot] (only ids that exist). Sections like the
  Lock-Up entry: an opening paragraph, ## How it works, ## What gnomes say (2 quotes), ## Loose threads (1).
- docs/lore/entries/apocrypha/mossbank-boathouse.md (new): same shape; aliases [The Boathouse (south shore)]; related
  [loch-moss, driftwood-castaway (if that is Driftwood's id), watering-can-steamer, side-valve-lock-up].
- docs/lore/rulings.md: append one ruling (in the file's format): the Watering-Can Steamer's boathouse on Loch Moss's
  east shore is not for sale and is not the Mossbank Boathouse; the Mossbank Boathouse is a separate private boathouse
  on the south shore. And that the Sling-Lift carries aircraft and boats as well as mowers (it never lands; it lowers
  boats onto open water).
- docs/lore/entries/apocrypha/side-valve-lock-up.md: add `hangar-two` and `mossbank-boathouse` to `related`, and one
  sentence at the end of "## The Sling-Lift" saying it also fetches from Hangar Two and the Mossbank Boathouse.

## Done when
- `npm run lore` (from the repo root) passes.
- `npm run lore -- find "Hangar Two"` and `npm run lore -- find Mossbank` list the new entries.

## Out of scope
Every game file, other lore entries (besides side-valve-lock-up.md), docs/lore/settings.md.
