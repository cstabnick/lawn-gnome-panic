Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, how to report). This issue only edits markdown under `docs/lore/`. You own: `docs/lore/entries/apocrypha/pay-n-glaze.md` (edit), `docs/lore/entries/apocrypha/pay-n-glaze-garage.md` (edit), new files `docs/lore/entries/apocrypha/pay-n-glaze-*.md` listed below, and an appended ruling at the end of `docs/lore/rulings.md`. `docs/lore/INDEX.md` is generated: let `npm run lore` rewrite it (do not hand-edit).

## Goal
Lore for Pay 'n' Glaze's new services so the shop's names and blurbs have a home: what the shop sells, how a gnome-sized mower can have rims, wheels, paint and a hood ornament, and why a freshly painted fender confuses the Hat Watch.

## Read first
- `docs/lore/README.md` (entry schema, tiers) and `docs/lore/canon.md` (house style, the facts). `docs/lore/entries/apocrypha/pay-n-glaze.md`, `pay-n-glaze-garage.md`, `ride-on-lowrider.md` (examples of the format and voice) and the last ruling in `docs/lore/rulings.md` (R-051; yours is R-052).
- `packages/glaze/src/catalog.ts`: every product name and blurb the shop sells (finishes, sprays, tyres, rims, steering wheels, lamps, spoilers, seats, ornaments, extras, underglow). Use these names exactly.
- Run `npm run lore -- find glaze` and `npm run lore -- find spray` to see what exists.

## Change
- Edit `pay-n-glaze.md`: keep its front matter (add `pay-n-glaze-sprays`, `pay-n-glaze-wheel-shop`, `pay-n-glaze-trimmings` to `related`) and its existing sections; add a section `## The Custom Shop` (4 to 7 short sentences): since the new management, Pay 'n' Glaze sells more than a coat: sprays, wheels, lamps, seats and "little extras", all bolted on in the roll-up bays; a coat is still five seconds; the chrome-and-hot-pink house style; the "Signature Series" idea (the shop's work follows a gnome's mower: the shop files the VIN off every time and re-stamps it with the owner's loyalty number; the Hat Watch sees only the loyalty number). Add one line to `## Loose threads`: who fits the wheels, because the mower's tyres have never been seen to come off.
- Edit `pay-n-glaze-garage.md`: read it first, then add (only if it fits) a short mention that the garage also has the Custom Shop counter. Do not break its front matter.
- New entries (each `kind: object` or `kind: concept`, `tier: apocrypha`, `setting: apocrypha`, `era: now`, `status: draft`, `games: [gnome-theft-auto]`, `sources: [packages/glaze/src/catalog.ts]`, `related: [pay-n-glaze]`, a 1-sentence summary, one or two short sections, a quotable line under `## What gnomes say`, and a `## Loose threads` with one open question), written in the house style (short plain sentences, gnomes never say what a Tall One object really is, nothing bleeds and nothing gets wet):
  - `pay-n-glaze-sprays.md` (name: Pay 'n' Glaze Sprays): the ten sprays (Flame-Job Aerosol, Twin Racing Stripes, Chequered Chaser, Starry Mulch, Mulch Camo, Thunder-Bolt Stencil, Lucky Number, Hat Repeat, Daisy Chain, Glaze Drip) and the seven finishes (Kiln Gloss, Dust-Bowl Matte, Mica-Flake Metallic, Snail-Trail Pearl, Candy-Apple Lacquer, Chameleon Beetle-Shift, Primer Grey VIN Off). Gnome reading: the "aerosol" is a bellows can of pressurised enamel; the pearl is harvested from snail trails at dawn.
  - `pay-n-glaze-wheel-shop.md` (name: Pay 'n' Glaze Wheel Shop): tyres (Pudgy Puffers, Skinny Sprinters, Whitewall Wafers, Mud-Grub Knobbies, Wagon-Spoke Hoops, Flying Saucers), rims (Five-Spoke Stars, Chicken-Wire Mesh, Deep-Dish Buckets, Spinner Spinners, Flower-Power Rims, Acorn-Cap Hubcaps, Turbofan Rims), camber ("leaning the wheels" is a courtesy among gnomes: tops in is respect, tops out is a dare) and ride height ("slammed" and "lifted": a mower is lowered by letting the air out of the cushion springs, or lifted on stacked acorn cups).
  - `pay-n-glaze-trimmings.md` (name: Pay 'n' Glaze Trimmings): headlights (Bug-Eye Rounds, Square Dealers, Halo Rings, Pop-Up Peepers, Barn Lanterns, Light-Bar Blaster, Acorn Lamps; beams Candle Yellow, Ice-Blue Xenon, Fog Amber, Rose Blush, Firefly Green, Dusk Violet; underglow Glow-Worm Green, Moth Blue, Bramble Pink, Marigold, Violet Hour, Ember Red: glow-worms in jars), spoilers (Duck-Tail, Picket Wing, Barn-Door Wing, Trellis GT, Biplane Wing, Dorsal Fin, Giant Leaf Lip), seats (Quilted Bench, Racing Bucket, Cowhide Saddle, Bean-Bag Lounger, Garden Throne, Tractor Springer, Tea-Cosy Cushion), steering wheels (Racing Dish, Banjo Sprig, Chunky Donut, Daisy Wheel, Pretzel Wheel), hood ornaments (Mini Gnome Hat, Golden Acorn, Chrome Snail, Lawn Flamingo, Dragonfly Pilot, Trowel Standard, Weathervane Rooster, Fly-Agaric Knob, Tiny Hood Gnome) and extras (Fuzzy Dice, Whip-Antenna Flag, Stovepipe Exhausts, Mudflap Gnomes, Parade Bunting, Vanity Plate, Hedge-Bar Bumper, Bicycle Bell). Keep it a list with one line of flavour each, grouped by heading.
- Append to `docs/lore/rulings.md`, after R-051 and in its exact format (Question / Ruling / Applies to / Date / Why), **R-052**: "Gnome Theft Auto's Pay 'n' Glaze now sells wheels, paint finishes, sprays, lamps, seats, hood ornaments and ride height. How can a gnome's mower have chrome rims and a lowered body, and does a fresh paint job change who owns it?" Ruling: the mowers are clay and iron, so everything is bolted or glued on in the bay; tuning is by cushion springs and acorn-cup stacks; every job files the VIN off and re-stamps the owner's loyalty number, so the Hat Watch tracks the loyalty number, not the mower; nothing the shop sells makes a mower wet, bloody or alive; the "Tall One" reading of the wheels and rims (cast-off bike wheels and bottle caps) is a hint for writers and is never said in game. Applies to: `apocrypha, gnome-theft-auto`. Date: 2026-11-22.

## Contract
Entry ids (file names without `.md`): `pay-n-glaze-sprays`, `pay-n-glaze-wheel-shop`, `pay-n-glaze-trimmings`. Ruling id R-052. All entries valid per `docs/lore/README.md`.

## Done when
- `npm run lore` passes (it validates the schema and links and rewrites `docs/lore/INDEX.md`; leave that rewrite in place).
- `npm run lore -- find "Chrome Snail"` finds the trimmings entry.

## Out of scope
Everything outside `docs/lore/`.
