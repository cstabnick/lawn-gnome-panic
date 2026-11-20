# Settings

A setting is a world that one or more games share. Each `## \`id\`` heading below is a setting id the entries use
(`npm run lore` reads them from here). Every game folder appears in exactly one setting.

| Setting | Games |
|---|---|
| `core` | none directly: the facts every setting starts from |
| `fescue` | gnomes-of-gnomomia, gnomeokemon |
| `the-yard` | sample-3d (Lawn Gnome Panic), lawn-prix, gnome-front, gnome-golf, gnome-bowling, gnome-blackjack, gnome-party, gnomylpics, music-room, faster-than-lawn, mower-chain, gnaft, club-gnome, incregnomtal, cooking-gnoma, gnome-billiards, gba-gjam, wordle-gnome |
| `the-tall-house` | paragnormal |
| `the-aether` | aether-board |
| `unplaced` | peak-climb, gnome-sweet-gnome, water-flow |
| `apocrypha` | gnome-company, giant-pup, tribute-schedule, gnome-theft-auto |
| `none` | gnome-creator, prefab-gallery, sample-dodge, me |

## `core` Core

The facts every gnome game starts from. Written up in [canon.md](canon.md), with fact-sheets in `entries/core/`.

## `fescue` Fescue

The first world of Gnomomia: a back garden walled in by the Fence, under a 3,000-year-old jammed Mower.

- **Games:** `games/gnomes-of-gnomomia`; `games/gnomeokemon` (Gnomokemon Snap: a photo safari of creatures themed on Fescue, menus in the Fescue Field Lab).
- **Source of truth:** [docs/design/gnomomia/](../design/gnomomia/README.md). Its [lore-rules.md](../design/gnomomia/lore-rules.md)
  is this setting's rulebook and is stricter than the core. Entries here summarise and point at it; when they
  disagree, the design doc wins and the entry gets fixed.
- **Tone:** cozy on top, one honest sad note per region.
- **Departures from the core:**
  - There is exactly **one** mower, the Mower, and it is the only machine that runs by itself. Gnomes never ride,
    build or race mowers here (see the core's mower fact).
  - Gnomes don't know what any yard object is for (the core only asks that they rename them).
  - Time is told in three layers: the Planting, the Charters, the Rumbling.
- **Later worlds** (Bluegrass, Ryegrass, Zoysia, Bermuda: other lawns beyond the Fence) will be settings of their own
  that share Fescue's myths.

## `the-yard` The Yard

The shared back yard of the arcade games. The games happen next door to each other: Lawn Prix's courses run past the
Panic yard, the Front's Red Cap and Blue Cap battle and the Island Links golf course, and their vehicles cross the road.

- **Games:** sample-3d (Lawn Gnome Panic), lawn-prix, gnome-front, gnome-golf, gnome-bowling, gnome-blackjack,
  gnome-party, gnomylpics, music-room, faster-than-lawn, mower-chain, gnaft (the sea past Gnome Golf's island;
  see [rulings.md](rulings.md) R-007), club-gnome (the town square whose doors open the other games; R-011),
  incregnomtal (the Bare Patch behind the Panic Yard fence; R-012), gnome-billiards (the pool table in the Gnomecino;
  the Gnomecino is the casino, see the club-gnome entry), gba-gjam (the indoor Gnomerena where the 8-team GBA plays; R-018), wordle-gnome (the yard's word game; the answer is always gnome).
- **Source of truth:** each game's README and source; `games/lawn-prix` is where the games meet.
- **Tone:** silly, sporty, loud. Trash talk, air horns, silly result screens.
- **Departures from the core:**
  - Mowers are everywhere and gnomes ride, race, tame and fight them. Runaway mowers are still the classic danger.
  - Gnomes play sports, run pubs and bowling alleys, and fight acorn-gun wars (Gnome Front): no gore, nobody
    shatters for good, they respawn.

## `the-tall-house` The Tall House

Inside a dark house at night, as a garden gnome sees it: towering furniture, giant Gnome-Souls, a moonlit pet-door
back to the garden.

- **Games:** `games/paragnormal`.
- **Source of truth:** `games/paragnormal/README.md` and `src/`.
- **Tone:** horror. The core's no-gore rule still holds: things crack and shatter.
- **Departures from the core:** gnomes are porcelain, not earthenware (still fired clay); the gnome can be shattered
  for good (a run ends). The giant Gnome-Souls are on screen, but they are not Tall Ones (R-008).
- "The Tall House" is the knowledge base's name for the setting; the game itself only says "the house".

## `the-aether` The Aether

The ethereal plane: floating islands, glowing ley-lines, a gnome on a snowboard.

- **Games:** `games/aether-board`.
- **Source of truth:** `games/aether-board/README.md`, `docs/roadmaps/aether-board.md`.
- **Departures from the core:** not a garden. How a gnome gets here is a loose thread.

## `unplaced` Unplaced

Games with gnomes that don't belong to a setting yet. They follow the core; give them a setting when a second game
wants to share their world.

- **Games:** `games/peak-climb` (Mt. Gnome), `games/gnome-sweet-gnome` (a match-3 with its own three gnome homes: Mossy Lane, Oakwood Treehouse, Shell Cove).
- **Games (no gnomes):** `games/water-flow`, a water-simulation tech demo.

## `apocrypha` Apocrypha

Parodies and one-offs. Their lore is theirs; no other game has to agree with it, and none of it becomes core.

- **Games:** `games/gnome-company` (Chapel of Mulch, a *Lethal Company* parody with Omnipresent Gnome Jesus);
  `games/giant-pup` (raise Gnome Company's Giant Goofy Fetch Dog); `games/tribute-schedule` (apartment horror built
  from chat-bot logs); `games/gnome-theft-auto` (Turfton open-world crime parody with real parody guns, Hat Watch,
  Fort Sandpit, the Whirligig, and Crop Duster planes; R-015, R-016).

## `none` No setting

Tools and samples with no story: `games/me` (account page), `games/gnome-creator` (although the gnome you make there is the player's gnome in
every setting), `games/prefab-gallery`, `games/sample-dodge`.
