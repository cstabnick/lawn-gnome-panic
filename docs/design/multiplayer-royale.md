# Multiplayer plan: Lawn Gnome Royale

Status: **first online version built** (see `docs/roadmaps/sample-3d-online.md`). It differs from the plan below in one way: instead of WebRTC with public signalling, a small WebSocket server (now shared by every game: `packages/mp-server`, protocol and client in `packages/mp`) does public matchmaking, room codes and relaying, because public matchmaking needs a server anyway and WebSockets work behind every NAT. The host-authoritative split is as planned. Hosting: `docs/hosting.md`.

## The mode

- 20 gnomes drop into the 500x500 yard. Everyone fights the same mowers; there is no direct gnome-vs-gnome damage at first (the mowers and the zone do the killing, which keeps it friendly and cheap to network).
- **THE MOW ZONE**: a safe circle shrinks in stages (wait, shrink, wait, shrink...) toward a random final spot. Outside it, you lose a heart every 2 s. It forces everyone together, which is where the drama is.
- Kill feed: "xX_MulchLord_Xx got mowed by a Red Mower (the fast one)". A big "GNOMES REMAINING" counter. Last gnome standing wins: "#1 LAST GNOME STANDING".
- Results show placement (#7 of 20); acorns bank as in solo, plus a placement bonus later.
- Later options: gnome-vs-gnome weapons (opt-in "Spicy Lobby"), squads of 3, a supply-drop compost bin falling from the sky, spectating the gnome that outlived you.

## Architecture

The game already separates **who decides** from **what happens**:

```
InputState  ->  updatePlayer(p, input, yaw, obstacles, stats, dt)  ->  PlayerState
   ^                                                                       |
   |  local: keyboard/gamepad (input.ts)                                   v
   |  bot:   br/bots.ts synthesises InputState                        gnome model
   |  later: network peer sends InputState
```

Bots drive the exact same `updatePlayer` physics with a synthesised `InputState`. A network peer is just a third source of `InputState`. Everything else (mowers, zone, drops) is simulation the host runs.

### Recommended: host-authoritative, peer-to-peer over WebRTC

- One player's browser is the **host**: it runs the whole simulation (mowers, zone, bots filling empty slots, damage, deaths) exactly as the bot demo does today.
- Each client sends its `InputState` (about 30 bytes) 20-30 times a second, and renders snapshots from the host: contestant positions/facing/hearts, mower positions/headings/hp, drops, zone state. With ~40 mowers and 20 gnomes, a snapshot is ~2-3 KB; at 15 Hz that is ~40 KB/s per client, fine for WebRTC data channels.
- Clients run their own gnome locally (client-side prediction) and correct toward the host's position, so movement feels instant.
- Weapons stay client-side visuals, but the **host** applies damage: a client's weapons report hits as `{ enemyId, amount }` messages, and the host validates them (range, rate) before applying.
- Transport: **PeerJS** (WebRTC with a free public signalling server) or **Trystero** (WebRTC using public BitTorrent/Nostr/MQTT relays for signalling: no server of ours at all). Both are static-site friendly, so this still deploys to GitHub Pages.
- Joining: the host gets a short room code ("MULCH-42"); friends type it in the lobby. A room fills empty slots with bots, so a 3-friend game still has 20 gnomes.

### Alternative: a small authoritative server

- **Colyseus** (Node) on a free/cheap tier (Fly.io, Render, Railway). More robust against cheating and host disconnects, but it is a backend to run and pay for, and the current requirement is "no real backend". Keep it as the upgrade path if public matchmaking becomes a goal.

### Things the host must own (already structured this way)

| System | Today | Networked |
|---|---|---|
| Mowers (`MowerSystem`) | Steers at the nearest of `targets` (player + bots) | Same, targets = all contestants |
| Zone (`ZoneSystem`) | Deterministic from the match clock | Host sends `elapsedS`; clients compute the same circle |
| Contestants | `Contestant { id, name, pos, alive }` from bots | Same type for remote players |
| Deaths | `KillEvent { victim, cause }` from bots | Host broadcasts KillEvents |
| Drops and items | Local | Host-owned; clients ask to collect, host confirms |

## Steps after the bot demo

1. **Abstract the controller**: a `ContestantController` interface (`read(dt): InputState`) with keyboard, bot and remote implementations; move the player into the same contestant list as bots.
2. **Snapshot + apply**: serialise/deserialise the host state (start with JSON, move to a packed binary format if needed).
3. **Transport**: Trystero or PeerJS room join/leave, with a lobby "HOST / JOIN CODE" panel.
4. **Prediction and interpolation**: local gnome predicted; remote gnomes and mowers interpolated 100 ms behind.
5. **Host migration** (stretch): if the host leaves, the next peer takes over from the last snapshot.
