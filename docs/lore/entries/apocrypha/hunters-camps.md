---
id: hunters-camps
name: Hunters' Camps
kind: place
tier: apocrypha
setting: apocrypha
era: now
status: draft
games: [gnome-theft-auto]
aliases: [Teasel's Tent, The Thermos Stand, Damp Socks Camp, Cutback Hide, Cutback Hide Social Club, Wet Boots Rack, Frost Pocket Rack, Tuft Drying Yard, Hay Bale Hide, Dry Spell Camp, Last Cup Camp, Late Lecture Camp, Quackless Blind, Reedy Blind, Tide Table Blind, The Long Wait, The Patient Stand, The Gutter Stand]
sources: [docs/lore/rulings.md#r-207, docs/lore/rulings.md#r-141, games/gnome-theft-auto/src/country/types.ts, games/gnome-theft-auto/src/country/camps.ts]
related: [tuft-and-tally-lodge, hazel-mattock, red-deer]
---

Twenty-six small camps in the empty country of every outer region, kept by Tuft & Tally licence holders: tents, shared camps round a fire, shacks, deer stands, duck blinds on loch and coast shores and tuft-drying racks. Each leaves a tin of acorns or a snack for the next walker.

## What gnomes say

"You leave the tin full for the next gnome. Nobody says so; everybody does."

"Never take the Thermos Stand's tea before noon. Teasel counts."

"The Long Wait is the best camp in the north. Nobody has ever seen it do anything."

## The truth

The custom is older than the licence. Hazel Mattock's lodge only noticed the habit (R-214). Some camps have a hunter asleep by the fire; nobody wakes them, and the tin is refilled later. Names are the hunters' own, and most are jokes about weather, socks or the HOA's quiet hours.

The twenty-six, by region (`country/camps.ts`; kind in brackets, positions in world metres):
- **West estates:** The Thermos Stand (deer stand, -1340, -740); Teasel's Tent (tent, a sleeper, -1340, 110); Wet Boots Rack (drying rack, -1340, 360).
- **North highlands:** Old Burdock's Shack (-1340, -1140); Cutback Hide Social Club (shared camp, a sleeper, -1090, -1290); Cutback Hide (stand, -840, -1240); Damp Socks Camp (a tent, -40, -1390); Comfrey's Shack (260, -1440); The Long Wait (shared camp, a sleeper, 760, -1540); Frost Pocket Rack (drying rack, 1160, -1090); Mallow's Tent (1360, -1340).
- **Loch Moss:** Quackless Blind (duck blind, -840, -440); The Patient Stand (stand, -490, -740).
- **Tallgrass Commons:** Yarrow's Tent (-840, 560); Tuft Drying Yard (drying rack, -640, 660).
- **Cloverfield:** Hay Bale Hide (drying rack, -390, 560); Wicker's Shack (410, 460).
- **Dust Flats:** Dry Spell Camp (shared camp, 760, 560); Last Cup Camp (shared camp, 860, 210).
- **East campus:** Plantain's Tent (910, -640); The Gutter Stand (stand, 1310, -840); Late Lecture Camp (shared camp, 1360, 310).
- **South shore:** Reedy Blind (duck blind, -1090, 1035); Old Pellitory's Shack (-440, 1060); Tide Table Blind (blind, 610, 960); Thimble's Tent (1210, 1060).

The camps are named for a hunter (Teasel, Mallow, Yarrow, Plantain, Thimble, Wicker, Comfrey, Old Burdock, Old Pellitory), a joke about socks and weather (Damp Socks, Wet Boots, Dry Spell, Frost Pocket, Tide Table), or the long business of waiting (The Long Wait, The Patient Stand, Last Cup). The Damp Socks Camp is a tent with a washing line and no luck; the Thermos Stand is a deer stand with one very good flask.

## In the games

Scattered through the outer regions of `games/gnome-theft-auto` (`country/camps.ts`, built by `country/campsBuild.ts`). Each camp has a search prompt ("Check the thermos", "Look in the pack", "Lift the bedroll") that gives acorns (5 to 25), a seed cake, a cheese wedge or a crab apple, once. A sleeping hunter does not wake.

## Everyday

- **Shops and stalls:** Nobody sells anything. A camp offers a tin by the fire: a seed cake, a wedge of cheese, a crab apple, a few Acorns. You take one thing and leave the tin shut. "Pay it forward" is on no sign; it is on a very small spoon.
- **Notices:** Pinned to the tent poles: "Quiet hours begin when the deer say." "Boots: left rack. Damp socks: no rack. We are sorry." "The Thermos is for everyone after noon." Scratched on a stand: "Gone for a minute. (Spring.)"
- **Sayings and habits:** "Wait, then wait more." "Never wake the one by the fire, but do put a blanket on him." A visiting hunter leaves a little pile of kindling at each camp, one stick more than they took.

## Loose threads

Who fills the tin when the hunter is asleep. Why Cutback Hide has both a stand and a social club 250 m apart.
