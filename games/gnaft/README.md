# Gnaft

A gnome adrift on a little patch of floating grass. Fish junk out of the sea, grow and mow your lawn-boat to
expand it, and use a telescope to find islands with better mower tech.

Run: `npm run dev -w games/gnaft` (http://localhost:5183). Build: `npm run build -w games/gnaft`.

## Controls

| Key | Action |
|---|---|
| WASD / mouse | Move / look (click to capture the mouse) |
| Space | Jump (twice for a flip) |
| Shift / mouse wheel | Sprint / zoom |
| F | Bonk the lawn shark or a seagull |
| M | Music on/off |
| Left mouse | Hold to charge, release to throw the hook; hold again to reel in |
| E | Grab floating junk within reach (from the raft or while swimming); otherwise cut the grass tile under you by hand; open crates on islands |
| Q | Cycle owned mowers |
| B | Build mode: left click places, right click removes a piece (half refund), R cycles turf / seeded dirt / plank floor / plank wall / plank roof / sprinkler / lawn flamingo / rubber duck / garden gnome. Walls snap to the tile edge you aim nearest; roofs need a wall or a roofed neighbour |
| Tab | Craft menu |
| T | Telescope (once crafted): aim at the horizon to spot islands |
| C | In the telescope: chart a course to the aimed island. Docked: cast off |

Walk off the edge to swim. Swim back into the raft or any island to climb out. Drift too far and you are hauled back aboard on the safety rope.

## Co-op

On the title screen, **Play together**: type a name and a room code and press *Start / join raft*. The first player
in a room code hosts (their raft and save are the world); friends who type the same code drop into the running raft.
Everyone shares the inventory and the raft; seagulls, the shark and the weather run on the host. If the host leaves,
the next player takes over. It uses the shared matchmaking server (`packages/mp-server`, see `packages/mp/README.md`):
run `npm run dev -w packages/mp-server` locally, or open the game with `?mp=wss://host/ws`.

## Phones and tablets

Touch controls appear automatically on touch screens (force them with `?touch=1`): a joystick on the left half,
drag anywhere else to look, pinch to zoom, and buttons for the current mode (Fish / Grab / Jump / Build / Craft /
Scope / Cast off; Place / Remove / Next / Done in build mode).

## Progression

Grass clumps → turf tiles → (after 3 tiles) dirt + seed → telescope → Scrapyard Isle (scrap: push mower) →
Fuel Depot Key (fuel: gas mower) → Mower Graveyard (parts: riding mower).

## Also in the game

- Planks float by from the start: build plank floors, walls and roofs for a little shed on your lawn.
- Fun junk: old boots, rubber ducks, barrels, beach balls, treasure chests, garden gnome statues and (after Scrapyard Isle) toilet seats, each with its own loot. Ducks and gnome statues can be placed as decorations.
- Islands are solid: drifting into one docks there, and casting off points the raft away from it.
- Day/night cycle with stars, moon and moonlight; mower headlights at night.
- Rain showers double grass growth (rain streaks, rain sound, thunder flashes).
- Sprinklers double growth around them; lawn flamingos are just pretty.
- Seagulls land and eat your tallest grass: walk at them or press F (they drop a seed).
- The lawn shark circles and chews edge tiles: get to the red ring and press F, or lose the tile.
- Messages in bottles reveal an island. Mowing sometimes turns up a grass seed.
- Minimap (top right) with island markers, a 12-step goal tracker and a victory screen.
- Generative sea-shanty music (minor key in the rain, quieter at night).
- Autosave to localStorage every 10 s; Continue or New raft on the title screen.
- Mowing stripes on fresh-cut tiles, daisies on fully grown ones, foam at the raft edges, grass puffs when running.

## Debug

- `http://localhost:5183/#selftest`: scripted playthrough; logs `SELFTEST OK` (check with `bash tools/smoke.sh "http://localhost:5183/#selftest" rg-selftest-ok`).
- `bash games/gnaft/snap.sh <scenario> out.png`: headless screenshot (scenarios: raft, island, mower, build, telescope, big, props, night, rain, shed, swim).
- `bash games/gnaft/cooptest.sh [game-port] [ws-url]`: two headless browsers join one room through a running matchmaking server; the host and the guest each check they see the other's building.
- `snap.sh` takes `[WxH] [query]` too: `bash games/gnaft/snap.sh raft phone.png 5183 844,390 touch=1`.
- `window.raft` in the console is the live game state.
