---
id: dust-flats
name: The Dust Flats
kind: place
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Dust Flats]
sources: [docs/design/gnome-theft-auto/world-lore.md, games/gnome-theft-auto/src/config.ts]
related: [fort-sandpit, desert-airfield, wind-sock-wally, turfton, lost-and-found-speedway, the-great-spill, dust-flats-overlook, pebblewick, coalition-camp, spade-guard, the-heist-board, lost-property-shed]
---

Sun-baked eastern desert biome (`x > 215`), home to Fort Sandpit, the Desert Airfield, giant plastic buckets, and scorching alkali dunes.

## Field Notes & Tales

Long before the Spade Guard arrived, Turfton gnomes treated the Dust Flats as a cursed wasteland where cheap glaze peeled off in the dry wind. Today it is a dusty frontier of sandbag walls, oil drums, and wide-open throttle. Pilots swear that out past the eastern dunes lies a half-buried, chrome-plated Old Combine that hums softly to itself at 3:00 AM.

## What gnomes say

"Bring water, bring spare tires, and don't wave at the watchtowers."

## In the games

- The alkali pan north-east of the airfield is the Lost & Found Speedway, a 1.2 km circuit built from the Great Spill's
  heap (`raceTrack/track.ts`). Reached by a dirt road north from the east-outer highway.
- Pebblewick, the adobe town at the far east of the Flats (x 580..730, z 10..200), where Route East runs out towards the
  fence (`outskirts/town.ts`). The Old Chrome Combine, half buried in the eastern dunes, is real: it hums at three in the
  morning (the pilots' story is true).

- Act IV (the Dust Flats are the last act's stage): the Overlook safehouse (`dust-flats-overlook`) where Tansy pins the heist, Fort Sandpit and the Spade Guard (`fort-sandpit`, `spade-guard`), the Desert Airfield (`desert-airfield`), Pebblewick's square, water tower and hay barn (`pebblewick-square`, `pebblewick-water-tower`, `pebblewick-hay-barn`), and, on the rise beside the Overlook, the coalition camp (`coalition-camp`, W16). Rows 54, 55, 57, 59, 60 and 64 play out here; the finale starts from it.

## Look and motifs

The Flats build in clay because clay is what there is. Roads run between low adobe walls with rounded
tops, yards are rock gardens with cacti instead of lawns, and palms stand by the houses for the shade. The houses are
flat-roofed adobe, some of them two storeys with a ladder to the roof.

- Motifs: adobe walls, rock gardens, barrel and tall cacti, palms, flat-roofed adobe houses.
- Palette: clay and sand walls, clay roofs, red and orange flowers.
- In the game: theme `dust-flats` in `src/data/regionThemes.json`.

## Everyday

- **Shops:** Pebblewick's store sells Dust Biscuits (4 Acorns), Cactus Water (8) and souvenirs; its diner, the Dry Spoon, sells Bottomless Dust Coffee (3), Prickly Pear Pie (9) and The Spoon Special (18). Ratchet's mower shed does a Full Repair for 35.
- **Notices:** "Bring water, bring spare tires, and don't wave at the watchtowers." The notice board in Pebblewick, the "Lost: one hum" card and the Fort's lost-property desk by the gate.
- **Habits:** doors stay shut until the sun goes down; walkers carry a spoon; the pilots check the wind by their beards. Everybody in the east calls the road "the highway" and the dunes "the front lawn".
- **Sayings:** "Hot is a place, not a feeling." "Pebblewick has a bell, a bus and a reeve."
- **Feud:** the Spade Guard against the Pebblewick bus over who has the right of way on Route East. The bus has never lost.

## Loose threads

What lies buried beneath the deepest sand drift east of the airfield runway.
