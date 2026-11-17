# Mt. Gnome

A procedural, first-person co-op mountain climbing prototype inspired by *PEAK*.

## Running

From the repo root:

1. Install dependencies (once): `npm install`
2. Start the multiplayer room server: `npm run dev -w games/peak-climb/server`
3. Start the client: `npm run dev -w games/peak-climb`

Open `http://localhost:5175` in two or more browser tabs to test multiplayer (host a room and join with the 4-letter code), or click **Play Solo** to climb offline.

## Controls

- **WASD**: Walk / Climb along rock face
- **Mouse**: Look (click viewport to lock pointer)
- **Hold Left Click** or **E**: Grab & Climb rock
- **Space**: Jump / Wall Lunge (dyno) while climbing
- **Shift**: Sprint (on ground)
- **Q**: Ping a route marker on the cliff
- **R**: Place a Piton anchor (reduces stamina drain nearby)
- **F**: Revive a downed teammate
