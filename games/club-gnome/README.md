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
| Town Square | Fountain plaza; Gnomecino and Arcade (doors), Bowling alley (Gnome Bowling), Music Hall (Music Room), Party pavilion (Gnome Party), Gnome Creator statue; path east to Links Park |
| The Gnomecino | Two blackjack tables (public, and High Rollers with room code `HIGHROLL`), slot machines (open Gnome Blackjack, which has the slots), bar |
| The Arcade | Cabinets: Lawn Prix, Mower Chain, Lawn Gnome Panic, Gnome Sweet Gnome, Faster Than Lawn, Aether Board |
| Links Park | Golf tee (Gnome Golf), dock (Gnaft), the Front's camp (Gnome Front), kennel (Giant Pup), the Fence (Gnomes of Gnomomia) |

A game opens full screen over the town in a frame with a "← Back" bar; your gnome stays put and shows 🎮 to the others.
🗺️ Map jumps to any place.

## Music

Each place has its own generated music (`@lawn/music`, `packages/music/src/themes/clubGnome.ts`; no assets). Walking
into another place switches the song, and coming back to a place plays its other track.

| Place | Tracks |
|---|---|
| Town Square | "Meet You at the Fountain" (ukulele folk), "Lamplight Waltz" (evening waltz) |
| The Gnomecino | "Cards and Candlelight" (the Gnome Blackjack lounge jazz), "High Rollers" (slow smoky swing) |
| The Arcade | "Insert Coin" (bright chiptune), "High Score Rush" (fast minor chiptune) |
| Links Park | "Fairway Breeze" (fingerpicked guitar and flute), "Dockside Shanty" (6/8 squeezebox) |

Music starts on your first tap or key press, stops while a game is open over the town, and resumes after. The Volume
button (under the map name) has sliders; N mutes music, M mutes everything. `#mute` in the URL keeps it silent.
`npm run analyze -w packages/music -- --tracks clubGnome:high-rollers,... --wav samples/club` renders them to WAV.

## Controls

- Walk: tap/click the ground, or WASD / arrow keys. Tap a building, cabinet or table to walk there and use it.
- Action button (or E / Space) when you stand at something. Enter to chat (or tap the input), 😀 for emotes.
- Animated emotes: the 😀 row shows your up-to-4 equipped emotes (equip them in Gnome Creator; 🎨 Edit opens it); keys 1-4 on desktop. Walking stops a dance.

## Code

`config.ts` (types, maps ids, game links, tuning), `maps.ts` (the four maps as data), `walk.ts` (pure walking rules),
`world.ts` (three.js scene and camera), `avatars.ts` (gnome models, name tags, bubbles), `net.ts` (online),
`hud.ts` (DOM interface), `account.ts` (sign-in and the guest card), `overlay.ts` (games in a frame),
`achievements.ts`, `music.ts` (area music), `main.ts` (wiring). Plan: `docs/roadmaps/club-gnome.md`.

Buildings and walls are built in `world.ts` (they are terrain, far bigger than a prefab); everything you can see on
the ground is a `@lawn/prefabs` prop, including the new `blackjack-table`.
