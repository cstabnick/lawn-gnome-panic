# Crossover portals (design)

The ask: the Gnomecino in Gnome Theft Auto (GTA) is the same building as the Gnomecino in Club Gnome. Players from
both games walk into the same instance, seamlessly. Walking out returns you to the game you came from, and what you
gained inside is recorded. It is a stack, because more crossover buildings will follow.

Package: `packages/portal` (`@lawn/portal`). Plan and issues: [docs/roadmaps/crossover-portals.md](../roadmaps/crossover-portals.md).

## 1. How the games boot, and how a player gets into another game's building

What exists:

- Every game is its own Vite app (`games/<name>/`, its own dev port in `vite.config.ts`: GTA 5198, Club Gnome 5197).
  On the built site they are sibling folders (`../<game>/`) on **one origin**, so they share `localStorage` and
  `sessionStorage` (the Oakcount `oakcount.v1`, the gnome `@lawn/gnome`, achievements `gnome.achievements.v1` are all
  already site-wide). On dev servers each port is its own origin and shares nothing.
- Club Gnome already opens other games framed over the town (`games/club-gnome/src/overlay.ts`: a full-screen
  `<iframe>` with a 48 px "← Back" bar; the town keeps running underneath, the gnome shows as busy). Its Gnomecino is
  one of its maps (`MapId 'gnomecino'`), with the Cashier, the Prize Counter, blackjack tables and slots.
- GTA is one big three.js page (`src/app.ts`, ~2200 lines, a long load: world build and shader warm-up).

Options:

| Option | Seamless | Cost | Mobile | Online |
|---|---|---|---|---|
| (a) Navigate to the other game with a handoff token and back | Poor: two full page loads, GTA's load is long, audio and the GTA world state lost (would need a full save/restore) | Low code, high play cost | OK | Leaves and rejoins the GTA room |
| (b) A shared `@lawn/gnomecino` interior package both games mount in their own renderer | Best (no frame) | Very high: Club Gnome's world, avatars, net, shops and panels (~3000 lines) would move into a package, and GTA would host a second scene and a second net client in its loop | OK | The instance room still has to be one game's room |
| (c) Frame the host game's interior over the origin game (`<iframe>`), handoff in the query string, results by `postMessage` | Good: the origin page stays loaded (no reload, keeps its world, its audio context, its gnome); a fade covers the interior's 1-3 s load | Low: one runtime in `@lawn/portal`, a visitor mode in the host game, a door in the visiting game | OK: the frame is full screen; Club Gnome is already touch-first | The visitor joins the host game's own room: the instance is literally the same code and room |

**Decision: (c), a framed portal, with the hand-off and return in `@lawn/portal`.** It gives one implementation of
the interior (Club Gnome's own Gnomecino, so it gets better whenever Club Gnome does, the same rule Gnome Party uses
for slices), one shared instance, and no GTA reload. (b) stays possible later for a building small enough to be a
package; the stack and ledger do not change if it is. (a) is the fallback for a page that cannot frame (not needed now).

Costs we accept: two WebGL contexts while inside (GTA stops rendering, so GPU load is one scene), the host page's load
time on the first entry (covered by a "Walking into The Gnomecino…" card; the browser cache makes later entries fast),
and on dev servers the two pages are different origins (the ledger handles that, below).

## 2. Multiplayer across games

- `@lawn/mp`: one relay server; every game has its own queues and rooms (`GAMES` in `packages/mp/src/protocol.ts`);
  rooms of different games never mix. Club Gnome: 1-40 per room, everyone in one room walks the whole town and
  `peerMap` says which map each player is on. GTA: 1-16, free roam.
- **The instance is the host game's room.** A GTA visitor's framed Club Gnome page connects as an ordinary Club Gnome
  player (`club-gnome` game, the public room, or the room code of the GTA room they came from), and walks only the
  Gnomecino map. Club Gnome natives in the Gnomecino see them, chat with them, sit with them; nothing in `@lawn/mp` or
  the server changes. A full public room opens a new one, exactly as for natives.
- **The visitor stays in both rooms.** The GTA page keeps its connection and keeps relaying a pose: the gnome stands
  parked inside the building's walls (so to GTA players it walked in through the door and is hidden by the building),
  and GTA's world sync keeps ticking so nothing they own vanishes. No host election changes: GTA's host stays GTA's
  host (GTA ranks players for its own world; a visitor that is host just leads nothing near the door for a while),
  Club Gnome has no host.
- Presence: GTA's door prompt reads "Enter The Gnomecino (N inside)": N = GTA players parked inside the footprint,
  or, once you have been in, the last count the interior reported (`presence` message, under 60 s old). Club Gnome's
  status line already counts everyone on the map, visitors included.
- Disconnect inside: the framed page reconnects on its own (Club Gnome's net retry). Closing the tab: both sockets
  close; the ledger already holds everything (below).

## 3. Gear and progress: what "recorded" means

What is already shared: the gnome (`@lawn/gnome`), the Oakcount wallet (`@lawn/oakcount`: acorns, Gnomecino chips,
owned items) and achievements (`@lawn/achievements`, whose rewards are the cosmetic gear every game wears). On the
built site they are one storage, so a prize bought inside is on the gnome in GTA at once.

The **portal ledger** records every gain or spend inside, per visit, and applies it to the origin game once:

- Kinds: `chips` and `acorns` (signed Oakcount deltas), `item` (an Oakcount item id), `achievement` (an id),
  `note` (a line for the toast or journal).
- The host page sends each entry to the origin page the moment it happens (`postMessage`), and the origin page saves
  it as pending in `localStorage` (`lawn.portal.ledger.v1:<game>`). A closed tab therefore loses nothing.
- `settle()` applies pending entries and moves their ids to `applied`, saved in the same synchronous task: applied
  once, never twice. Leftover pending entries settle on the next load (`resume()`).
- Each entry carries `store`, the origin (`location.origin`) whose storage already holds the effect. If that is the
  origin page's own origin (the built site), only the record and the summary are kept; on another origin (dev
  servers) the effect is applied through the game's adapter (`winChips`, `tracker.unlock`, ...).
- **Currency rule (canon):** chips never turn back into acorns (Oakcount entry, Clary Tillbox). GTA's own acorns
  (`gta-economy-v1`, Kiln-Debt) are a separate street wallet. So winnings stay Oakcount chips (spend them at the Prize
  Counter, in either game's Gnomecino) and are **not** converted into GTA acorns. Ruling recorded in
  `docs/lore/rulings.md`. If GTA later wants a payout, add a GTA-specific adapter rule; the ledger already has the
  entries.

## 4. The stack

- `PortalStack` holds `PortalFrame`s: `{ visit, portal, from, to, depth, enteredAt, ret: { x, y, z, yaw, extra }, room }`.
  Entering pushes; walking out pops and returns to `ret` in the game in `from`.
- Each page keeps the frames **it** pushed (`sessionStorage`, `lawn.portal.stack.v1:<game>`). A visit opened from
  inside a visit is a frame inside a frame with its own stack (depth + 1), so popping always returns to the page one
  level down. `MAX_DEPTH` 8.
- The exit door always returns you to the game you entered from: a GTA visitor's Gnomecino exit closes the frame
  (back to Turfton at the velvet rope); a Club Gnome native's exit is Club Gnome's own door to the town square (native
  doors push nothing).
- Registry: `registerPortal({ id, building, host: { game, devPort, query, title }, doors: [{ game, mode, label }] })`
  in `packages/portal/src/portals.ts`. `doorsFor(game)` lists a game's doors.

Edge cases, decided:

| Case | Rule |
|---|---|
| Room full | Club Gnome's own rule: a full public room opens a new one. With a room code, the code's room. |
| Host leaves | No change: Club Gnome has no host; GTA's server-picked host moves on as usual. |
| Disconnect inside | The framed page retries on its own; the ledger is unaffected. |
| Reload inside | `resume()` at boot pops the frame and settles the ledger: you are back at the door outside. |
| Quit (tab closed) inside | Pending entries settle on the next load. |
| Wanted (heat > 0) | Big Lou keeps you out: "No heat past the rope." |
| In a vehicle, airborne, ragdolling, dead, in a cutscene or the intro tour | No door prompt (on foot only). The vehicle you left stays parked outside; the world is frozen while you are in. |
| Party | Party members are not pulled in; they can walk in through the same door and land in the same room (same room code). Offering to follow is open. |
| Back / Escape | The bar's "← Back to Turfton" button (44 px) or the Gnomecino's exit door. The browser Back button is not hooked (open). |
| Trainer | Not blocked; it opens over the world, which is frozen. |

## 5. Performance

Away from the door GTA does one squared-distance check a frame (cheaper than a vending machine prompt). While inside
GTA renders nothing and simulates nothing: its frame loop only keeps the pose and the world sync relayed. The world
audio is faded out through GTA's master gain and restored on the way out.
