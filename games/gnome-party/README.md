# Gnome Party

A board party for 4 gnomes. Roll, hop around the loop, land on blue (+3 coins) or red (-3), and buy the star for 20 coins when you pass it. After every round all four play one minigame, and the places pay coins. Most stars, then coins, after the last round wins. Online (quick match or room code) with CPUs in empty seats, or solo against 3 CPUs.

The minigames are **party slices** that other games surface from their own code (see `packages/party/README.md`). Gnome Party finds them by itself: a game that adds `src/minigames/` shows up here with no change to this folder.

Run: `npm run dev -w games/gnome-party` → http://localhost:5191. Online needs the server: `npm run dev -w packages/mp-server`.

Dev hashes: `#mini=<id>` plays one slice against 3 CPUs in a loop, `#rounds=<n>`, `#cpu` (4 CPUs, watch). `window.party` is the current party state.

Plan: `docs/roadmaps/gnome-party.md`.
