# Music Room

A multiplayer jam room. Pick the drums, the keyboard or the cowbell and play it from your computer keyboard (or tap the
pads). Everyone in the room hears everyone else. Every sound is synthesized in code; there are no assets.

Run: `npm run dev -w games/music-room` (http://localhost:5192). Build: `npm run build -w games/music-room`.
Online play needs the shared server: `npm run dev -w packages/mp-server` (the page uses ws://localhost:8787/ws on
localhost, or `?mp=ws://host/ws`). Without it you can still play solo.

## Controls

| Key | Action |
|---|---|
| 1 / 2 / 3 | Drums / Keyboard / Cowbell (or click a station's header) |
| Drums | A kick, S snare, D hi-hat, F open hat, J low tom, K high tom, L crash, Space kick |
| Keyboard | A W S E D F T G Y H U J K: one octave from C, piano layout (W E T Y U are the black keys) |
| Z / X | Keyboard octave down / up (-2..+2) |
| Cowbell | Space cowbell, F low, J high, B muted |

## Online

Join puts you in the public room; type a room code (4-8 letters or digits) to jam with friends privately. Rooms open at
once, hold 16 players, and people can drop in any time. There is no host: each note is relayed to everyone
(`{ k: 'note', i, n }`) and each player's instrument is announced every 2 s (`{ k: 'here', i }`), which also keeps the
connection alive. Latency is whatever the network gives; nothing is quantized.

Two-player check (both servers running): `node games/music-room/jamtest.mjs "$(pwd)" http://localhost:5192/ ws://localhost:8787/ws "$TMPDIR/jamprof"`.

## Files

- `src/config.ts`: instruments, key maps, relay messages, shared types.
- `src/main.ts`: wiring and keyboard input.
- `src/audio.ts`: Web Audio synth voices.
- `src/net.ts`: room connection over `@lawn/mp`.
- `src/stage.ts`: the three instrument stations.
- `src/lobby.ts`: name, room code, join / leave, status.
