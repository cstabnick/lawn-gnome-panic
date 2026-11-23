# Club Gnome

A shared online town of gnomes, in the spirit of Club Penguin. Your own gnome (from the Gnome Creator) walks around one
public town with everyone else who is on. Tap or click the ground to walk, chat (bubbles over heads), send emotes, and
step into buildings to play the arcade's games. The required building is the **Gnomecino**, the town casino: sit at a
table to play Gnome Blackjack.

- Run: `npm run dev -w games/club-gnome` (port 5197). For online play locally, also `npm run dev -w packages/mp-server`.
  The games the town opens run on their own dev servers (`npm run dev -w games/gnome-blackjack`, port 5194, and so on);
  on the built site they are sibling folders and need nothing.
- `?room=CODE`: a private town for friends. `?offline`: walk around alone.
- Online by default: `@lawn/mp` game `club-gnome` (up to 40 per room, opens at once, anyone drops in). No host: each
  player relays their own gnome. Chat goes through the server (censored there) and is heard on your map only.
- Accounts: guests play everything. A guest gets a one-time card per visit ("nothing is saved without an account") with
  Sign in with Google; the 👤 button opens it again, or your account page once signed in.

## Places

| Map | What is there |
|---|---|
| Town Square | Fountain plaza; Chicory Waymark the guide by the fountain; Gnomecino and Arcade (doors), Bowling alley (Gnome Bowling), Music Hall (Music Room), Party pavilion (Gnome Party), Gnome Creator statue; four benches to sit on; path east to Links Park, path south to Acorn Row |
| The Gnomecino | Two blackjack tables (public, and High Rollers with room code `HIGHROLL`), a pool table (Gnome Billiards), slot machines (open Gnome Blackjack, which has the slots), bar (bar stools to sit on), cocktail tables with stools; the Cashier (Clary Tillbox: acorns to chips) and the Prize Counter (Fennel Brassbell: 6 cosmetics for chips, 6 more "coming soon") |
| Acorn Row | The shopping street: Gnome Market, Gnome Salon, Dovetail Furniture (coming soon), two benches |
| The Gnome Market | Marjoram Crate's counter (6 items for acorns) and Poppy Thimble's dressing room (the gnome studio: colours, features, gear) |
| The Gnome Salon | Lavender Shearwell's chair: buy hair styles for acorns and change hair and beard on the spot (the gnome studio, salon mode); two salon chairs to sit in |
| The Arcade | Cabinets: Lawn Prix, Mower Chain, Lawn Gnome Panic, Gnome Sweet Gnome, Faster Than Lawn, Aether Board |
| Links Park | Golf tee (Gnome Golf), dock (Gnaft), the Front's camp (Gnome Front), kennel (Giant Pup), the Fence (Gnomes of Gnomomia), two picnic tables to sit at |

A game opens full screen over the town in a frame with a "← Back" bar; your gnome stays put and shows 🎮 to the others.
🗺️ Map jumps to any place.

## Acorns: the Oakcount

Every gnome has an Oakcount (`@lawn/oakcount`), one acorn account shared by every game on the site: localStorage,
plus a cloud copy for signed-in players. The pill under the map name shows 🌰 acorns and 🪙 chips.

- **Earn**: a welcome gift of 100 acorns, 25 for the first visit each day, and 5 for each acorn lying under the trees
  and bushes outdoors (6 per outdoor place, a new set every 2 hours).
- **Spend**: the Gnome Market (gear) and the Gnome Salon (hair styles) take acorns. The Gnomecino Cashier turns acorns
  into chips (1 acorn = 10 chips, one way), and chips buy prizes at the Prize Counter.
- A bought cosmetic is unlocked through its achievement (`club-buy-*` in `packages/achievements`), so it can be worn
  in every game and equipped in the Gnome Creator or the dressing room. Bought hair styles are Oakcount items
  `hair:<style>` and live in the look as `hairStyle`.
- Gnome Blackjack (the Gnomecino's tables and slot machines) plays with the same Oakcount chips: what you win there
  can buy prizes here.

The dressing room and the salon open `createGnomeStudio` from `@lawn/gnome-editor`, the same code the Gnome Creator
runs, so there is one way to edit and save a gnome.

## People

Chicory Waymark (the guide: where am I, how to play, acorns; also the ❓ Help button), six shopkeepers behind their
counters and seven townsfolk strolling about (`npcData.ts`). They are computer gnomes on a shared clock: everyone online
sees them in the same place without any network traffic. Tap one to hear a line, or a shopkeeper to open their shop.
Lore: `docs/lore/entries/the-yard/` (acorn-row, oakcount, chicory-waymark, the shopkeepers).

## Music

Each place has its own generated music (`@lawn/music`, `packages/music/src/themes/clubGnome.ts`; no assets). Walking
into another place switches the song, and coming back to a place plays its other track.

| Place | Tracks |
|---|---|
| Town Square | "Meet You at the Fountain" (ukulele folk), "Lamplight Waltz" (evening waltz) |
| The Gnomecino | "Cards and Candlelight" (the Gnome Blackjack lounge jazz), "High Rollers" (slow smoky swing) |
| The Arcade | "Insert Coin" (bright chiptune), "High Score Rush" (fast minor chiptune) |
| Links Park | "Fairway Breeze" (fingerpicked guitar and flute), "Dockside Shanty" (6/8 squeezebox) |
| Acorn Row and its shops | The Town Square's tracks (no songs of their own yet) |

Music starts on your first tap or key press, stops while a game is open over the town, and resumes after. The Volume
button (under the map name) has sliders; N mutes music, M mutes everything. `#mute` in the URL keeps it silent.
`npm run analyze -w packages/music -- --tracks clubGnome:high-rollers,... --wav samples/club` renders them to WAV.

## Controls

- Walk: tap/click the ground, or WASD / arrow keys. Tap a building, cabinet or table to walk there and use it.
- Action button (or E / Space) when you stand at something. Enter to chat (or tap the input), 😀 for emotes.
- Animated emotes: the 😀 row shows your up-to-4 equipped emotes (equip them in Gnome Creator; 🎨 Edit opens it); keys 1-4 on desktop. Walking stops a dance.
- Sit down: walk to a bench, stool or picnic-table seat and use the action button ("Sit on the bench"). Any walking,
  or the action button again ("Stand up"), gets you up. Sitting is only shown on your own screen for now; others see
  you standing.

## Code

`config.ts` (types, maps ids, game links, tuning), `maps.ts` (the seven maps as data), `walk.ts` (pure walking rules),
`world.ts` (three.js scene and camera), `avatars.ts` (gnome models, name tags, bubbles), `net.ts` (online),
`hud.ts` (DOM interface), `account.ts` (sign-in and the guest card), `overlay.ts` (games in a frame),
`achievements.ts`, `music.ts` (area music), `panel.ts` (the modal every counter opens), `shops/` (catalog,
Cashier, Prize Counter, Market, furniture window), `studioRoom.ts` (dressing room and salon), `guide.ts`, `npcs.ts` +
`npcData.ts`, `pickups.ts`, `walletHud.ts`, `main.ts` (wiring). Plans: `docs/roadmaps/club-gnome.md`,
`docs/roadmaps/club-gnome-oakcount.md`.

Buildings and walls are built in `world.ts` (they are terrain, far bigger than a prefab); everything you can see on
the ground is a `@lawn/prefabs` prop, including the new `blackjack-table`.
