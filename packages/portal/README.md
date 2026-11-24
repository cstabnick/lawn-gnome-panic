# @lawn/portal: crossover buildings

A building more than one game can walk into. A door in game A opens game B's interior page in a full-screen frame
over game A (no reload: A stays loaded underneath, frozen), the player joins B's own online room there (the shared
**instance**), and walking out puts them back where they came from, in A, with what they gained recorded once.

First use: **the Gnomecino**. Club Gnome runs the interior (its `gnomecino` map); Gnome Theft Auto's velvet rope on
the Greenhouse Strip in Turfton walks into it. Design and tradeoffs: [docs/design/crossover-portals.md](../../docs/design/crossover-portals.md).

## The rules

1. **One interior, one instance.** The building runs in its host game only. Visitors join the host game's own mp room
   (public, or the room code they came with), so natives and visitors share the same tables and chat.
2. **The stack.** Walking in pushes a `PortalFrame` (who, from which game, where to put them back); walking out pops
   it. The exit always returns to the game you came from. Each page keeps the frames it pushed (sessionStorage
   `lawn.portal.stack.v1:<game>`); a door inside a visit is a frame inside a frame (depth + 1, at most 8).
3. **The ledger.** Everything gained or spent inside is sent to the origin page the moment it happens and saved there
   as pending (localStorage `lawn.portal.ledger.v1:<game>`). `settle()` applies each entry once by id and saves in
   the same step; a closed tab settles on the next load (`resume()`).
4. **Never twice.** An entry's `store` is the origin whose storage already holds the effect. On the built site every
   game is one origin, so the shared Oakcount, gnome and achievements already hold it: settle only records it. On
   dev servers (one origin per port) the origin game's adapter applies it.
5. **Native doors push nothing.** The host game's own door is just its own map change.
6. **Dormant by default.** A door costs one cheap distance check a frame; the visiting game renders and simulates
   nothing while inside (it only keeps its online pose relayed).
7. **Canon:** chips stay chips. Ledger entries are never converted into another game's currency without a ruling in
   `docs/lore/rulings.md`.

## Adding a building

1. Register it in `src/portals.ts`:

   ```ts
   export const MULCH_CLUB = registerPortal({
     id: 'mulch-club', building: 'The Mulch Club',
     host: { game: 'gnome-theft-auto', devPort: 5198, query: '', title: 'The Mulch Club' },
     doors: [
       { game: 'gnome-theft-auto', mode: 'native', label: 'Enter the Mulch Club' },
       { game: 'club-gnome', mode: 'visit', label: 'Visit the Mulch Club' },
     ],
   });
   ```

2. **Host game** (runs the interior): at startup `const visit = joinPortalVisit()`; when `visit?.info.portal` is
   yours, start inside, call `visit.ready()` after the first render, `visit.record(kind, ...)` for each gain,
   `visit.presence(n)` with the player count, and `visit.exit('door')` from the exit door instead of going outside.
   See `games/club-gnome/src/portalVisit.ts` and the `visit` branches in `games/club-gnome/src/main.ts`.
3. **Visiting game** (has a door): one `createPortalHost({ game, ui, apply, returnLabel, onExit })`; a door prompt
   that calls `host.enter(id, returnPose, { room, name, look })`; freeze the world while `host.active`; put the
   player at `frame.ret` in `onExit`; call `host.resume()` once at boot. See
   `games/gnome-theft-auto/src/portal/gnomecinoDoor.ts`.

## API

```ts
import { createPortalHost, joinPortalVisit, registerPortal, getPortal, doorsFor, PortalStack, settle } from '@lawn/portal';

// Origin side
const host = createPortalHost({ game: 'gnome-theft-auto', ui, returnLabel: 'Back to Turfton',
  apply: { chips: (d) => ..., achievement: (id) => tracker.unlock(id) },
  onExit: (frame, settled, summary) => player.respawn(frame.ret.x, frame.ret.z, frame.ret.yaw) });
host.enter('gnomecino', { x, y, z, yaw }, { room, name, look });
host.active; host.exit(); host.resume(); host.insideCount('gnomecino');

// Host side
const visit = joinPortalVisit(); // null on a normal load
visit?.record('chips', { amount: 25 }); visit?.ready(); visit?.presence(3); visit?.exit('door');
```

The hand-off: the host page's URL gets `portal`, `visit`, `from`, `depth`, `shell=0`, `name`, `look` (the
`@lawn/gnome` look code), `room`, plus the origin's `mp`, `platform` and `debug`. Messages back are `postMessage`
`{ t: 'lawn-portal', kind: 'ready' | 'ledger' | 'presence' | 'exit', visit, ... }`, accepted only from the frame the
origin opened and for the open visit. `?portalBase=<url>` on the origin page overrides where the host page is
loaded from (tests).

### Ledger entry

```ts
{ id: `${visit}:${seq}`, visit, portal, kind: 'chips' | 'acorns' | 'item' | 'achievement' | 'note',
  amount?: number /* signed int */, ref?: string /* item or achievement id */, text?: string, at: number, store: string /* origin */ }
```

## Checks

`npm test -w packages/portal` (stack, registry, ledger idempotence, protocol). Two clients, one in each game:
`node tools/portal-e2e.mjs` (needs the mp relay and both dev servers; see the script's header).
