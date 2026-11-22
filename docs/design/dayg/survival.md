# Survival: moving, the body, needs

## Moving and exploring (the DayG feel)

- **Third person by default, first person toggle.** The camera is low (gnome height), so grass blocks the view and
  headstones loom.
- **Momentum and weight.** Walk 2 gm/s, jog 4, sprint 6 (costs stamina, makes noise). Carried weight lowers top speed
  and stamina regeneration and raises the noise of every step. Over 120% of capacity you can only walk.
- **Stances.** Standing, crouched (half noise, smaller outline), prone in grass (almost invisible beyond 20 gm, very
  slow). Grass height per season changes how well prone works.
- **No mini-map, no quest markers by default.** You navigate with a paper map (`folded-map`) you find or buy, landmarks
  and a compass (a prefab to add). A map shows what its maker knew: NPC maps are out of date, and a faction's map
  shows its own territory well.
- **Climbing and vaulting.** Grave kerbs (1.6 gm), crates and fallen petals can be vaulted. Headstones (9–13 gm) and
  everything higher need a **route** (carved letters, ivy, a ladder, a rope) and take time, stamina and noise. Going up
  is the classic way to get away from a herd, because the Hatless can't climb. The height layers and routes are in
  [world.md](world.md#verticality).
- **Falls and gliding.** Past 6 gm a fall chips, past 12 cracks, past 25 can shatter. A `funeral-ribbon` lets you glide
  down from any high edge.
- **Doors and barricades** from Zomboid: open, close, lock, barricade with planks, break down (makes noise). Interiors
  (crypts, the shed, the columbarium) are where most loot is and where most deaths happen.
- **Footprints and trails.** You leave scent and visible tracks in wet ground. NPC trackers and Hatless both follow
  them.

### Controls

| Action | Desktop | Touch (portrait and landscape) |
|---|---|---|
| Move | WASD | left thumb stick (floating) |
| Look | mouse | drag on the right half |
| Sprint / crouch / prone | Shift / C / Z | stick pushed to the edge = sprint; stance button cycles |
| Context action (loot, open, talk, use) | E / hold E for the wheel | tap the target; hold for the action wheel |
| Attack / aim | LMB / RMB | attack button; hold to aim |
| Inventory | Tab | backpack button |
| Map | M | map button |

All targets at least 44 px, inside the safe-area insets. The action wheel replaces every keyboard-only verb.

## The gnome body

Gnomes are fired clay (core fact 2). They don't bleed, so the body system is about **cracks**, not wounds.

| Condition | Cause | Effect | Treatment |
|---|---|---|---|
| Chip | glancing hit, fall | cosmetic, small drop in that part's armour | none, or glaze to restore |
| Crack | strong hit, cold | the part works worse (a cracked leg limps, a cracked arm aims badly); cracks grow if you keep straining it | glue and splint, then rest |
| Deep crack | heavy hit, bad fall | as above, and the part can break off | must be glued and glazed (`glaze-pot`), needs skill |
| Moss in a crack | a Hatless bite or scratch, or a crack left open in moss country | **infection**: the moss spreads at a rate set by warmth and wetness | scrape and seal within hours (salt, spirit, fire); late on, nothing works |
| Shattered | the core breaks | death | none. You rise as a Hatless with your gear on |

- **Glaze** is the clay's skin. It soaks up wetness and cold. Worn glaze makes you lose heat faster and catch moss
  more easily. Re-glazing at a kiln is a service settlements sell.
- **Moss infection** is the Zomboid-style dread clock. A cracked bite is not certain death: scraping it out in time
  saves you, but costs a deep crack. NPCs know this too, so a bitten gnome becomes a social problem (do we let them
  in?).

## Needs

Each runs from 0 to 100. Below 30 it starts hurting performance; at 0 it starts doing damage.

| Need | Falls with | Restored by | Notes |
|---|---|---|---|
| Fullness | time, effort, cold | food | food spoils; stomach size limits how much you can eat at once |
| Water | time, heat, effort | clean water | dirty water risks Grit (sickness) unless boiled or filtered |
| Warmth | cold, wet, wind, worn glaze | clothes, fire, shelter, the Compost Heaps | the main winter killer |
| Rest | waking hours, effort | sleep in a safe place | sleeping outside without a watch is how loners die |
| Calm | danger, darkness, being alone too long, seeing gnomes turn | company, light, safety, music, routine | low calm = shaky aim, panic sprinting, mistakes |
| Belonging | being alone (for social gnomes) | company, trust, a group | the NPC drive that builds societies; players have it too, as a mild buff |

## Survivalist systems

Taken from survivalist practice and taken further: every one has a real trade-off, and NPCs follow the same rules.

- **Signature.** Everything you do has a **noise**, **light**, **smoke** and **scent** value. A fire warms you and
  cooks food, and its smoke can be seen for a kilometre by NPCs and its light at night by Hatless. Cook at dawn in
  a ditch to hide it. This one system drives most of the stealth game.
- **The Rule of Threes, gnome version**, on the sun clock ([world.md](world.md#time-two-clocks)): 3 sun-hours without
  warmth in a storm (15 real minutes), 3 sun-days without water (6 hours of play), 3 sun-weeks without food. The
  numbers are tuned so these are the order things kill you in. Shelter comes first, as in real life.
- **Wind** carries smoke and scent downwind ([crafting.md](crafting.md#fire-water-and-wind)). Camp downwind of danger.
- **Navigation without a map marker**: pace counting (the game counts your steps if you start a count), bearings from
  a `compass`, the Spire and other landmarks ([regions.md](regions.md#landmarks-to-see-from-far-away)), the sun's
  direction and, at night, the bell tower's lamp if the Kiln Sisters light it.
- **Water chain.** Find (pond, rain, dew, puddles) → carry (`tin-pail`, `clay-jar`, `watering-can`) → treat (boil,
  sand-and-charcoal filter, sun bottle) → store. Rain catchers on a base.
- **Food preservation.** Fresh food spoils in days. Dry it (rack, sun), salt it (`salt-pinch`), smoke it (costs smoke
  signature), pickle it (`pickled-slug`). Preserved food is what settlements trade and caravans carry.
- **Caches.** Bury a container anywhere (digging tool, takes time, leaves fresh earth for a day). Caches survive your
  death. NPCs dig up caches they see being made, and trackers find fresh earth.
- **Bug-out bag.** A pre-packed bag with a quick-equip slot. If a base falls, the gnome who grabs one bag keeps going.
- **Grey gnome.** Your look (hat colour, gear quality, visible weapons) changes how NPCs read you: well-armed reads
  as a threat to loners and a recruit to raiders; plain reads as harmless to everybody, and as prey to raiders.
  **The hat is who you are** (core fact 6): wearing a faction's hat colour lets you pass its patrols at a distance;
  up close, an NPC who knows the faction's members may see through it (chance by their memory). Going **hatless** makes
  every NPC wary: it is what the Hatless look like.
- **Group tools for players**, the same ones NPC groups use: a **watch rota** (set who is on watch while the others
  sleep; a sleeping gnome with a watcher rests at full rate), a **rally point** (marked for your group on everyone's
  map), **signals** (`clay-whistle` codes: come, danger, scatter, all clear; heard by your group as text, and by
  everyone else as a whistle), shared **caches** with a group key, and **dependants**: NPCs who join you and need
  feeding and guarding, and who tend your garden while you're away.
- **Navigation and knowledge.** Maps, a compass, the stars at night, landmarks. Knowledge is an item: a recipe card
  or a book (`red-book`, `recipe-card`) teaches a recipe; reading takes time and light.
- **Gardening (it is a lawn game).** Plant `clover-seed`, toadstools and acorn trees. Gardens are the base of a
  settlement's food, and they make a place worth defending (and worth raiding).
- **Traps.** Snares for food, noise lines (tin cans on string) for warning, pits and spike lines for Hatless.
- **Watches and rotations.** A group that sleeps in shifts is safe. NPC groups do this; for a solo player it is
  impossible, which is the strongest push toward finding company.
- **Medicine.** Petal poultice, salt wash, spirit (`stout-tankard` boiled down), glue, glaze. Medicine is the
  highest-value trade good.

## Skills

Learned by doing (Zomboid style), sped up by books and by being taught by an NPC who has the skill. No classes.

Foraging, Carpentry, Masonry, Glazing (medicine), Cooking, Trapping, Fishing, Gardening, Tracking, Stealth, Melee,
Ranged, Climbing, Bartering, Leadership (only grows while leading a group of NPCs).

Levels 0–10. XP per level `= 100 × 1.5^level`; each use gives XP by difficulty (an easy task 2, a hard one 10, a
failure half). A book gives ×2 XP for that skill for 2 sun-hours of reading; being taught by someone 3+ levels higher
gives ×3 while you work beside them. Rough pace: level 3 in one evening of focused play, level 6 in a few weeks, level
10 rare. Each level: −8% task time, −10% failure, and some recipes and actions need a level ([crafting.md](crafting.md)).

On death, skills are lost with the gnome. **Lineage:** a new gnome taught by a survivor (NPC or player) starts with
part of their skills, so social ties carry knowledge across deaths.
