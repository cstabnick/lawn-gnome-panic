# Gnome Bowling

Ten-pin bowling in a neon gnome alley, played by gnomes with bowl cuts. Step and aim, then swipe up to bowl, like swinging a motion controller: a faster swipe throws a faster ball, and curling the swipe hooks it into the pocket. 1-4 players take turns on one device, or 2-4 bowl together online. The gnomes shout on every hit and miss, and every strike, spare, split and gutter ball gets its own silly result screen.

Add CPU bowlers to a local game (+ ADD CPU): Big Lou, Granny Gnertrude, Robo-Gnome 3000 and Gnome Chad each have their own skill, style and trash talk. A robot PA announcer calls the big moments with air horns, organ and a sad trombone (toggle it on the title screen). Some strikes, turkeys, spares and gutter balls play a cartoon on a vintage alley score monitor instead of the result card.

The question it answers: does a swipe-to-bowl gesture on a phone feel as good as swinging a motion controller?

## Run

```
npm install                          # once, from the repo root
npm run dev -w games/gnome-bowling   # http://localhost:5185 (also on your LAN, for a phone)
npm run build -w games/gnome-bowling
npm test -w games/gnome-bowling      # scoring and physics tests
```

Online needs the shared server: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws). See `packages/mp/README.md`.

Debug: `#play` in the URL starts a two-player local game at once; `#cpu` starts a CPU-vs-CPU game to watch. `#mute` mutes the sound. `window.bowl` is the game state. `#cartoon=<id>` plays that cartoon whenever it fits the result; `#preview=<id>` loops one cartoon over everything (`&at=1.5` freezes it at 1.5 s, for screenshots).

## Adding things

- A CPU bowler: a `NpcId` and an outfit in `LOOKS` (`src/config.ts`), then an entry in `NPCS` and lines in the quip table (`src/npc.ts`).
- A cartoon: write a `Cartoon` (`src/cartoons/types.ts`) with the helpers in `src/cartoons/crt.ts`, and add it to a pack list (`strike.ts`, `turkey.ts`, `spare.ts`, `gutter.ts`, or a new pack added to `ALL_CARTOONS` in `src/cartoons/index.ts`). How often each result kind plays a cartoon is `CARTOON_CHANCE` in `src/config.ts`.
- Announcer lines and stingers: `src/announcer.ts`.

## Voices

Speech uses the browser's speech synthesis (the Microsoft voices on Windows), so its sound cannot be run through WebAudio effects. The announcer's "effects" are made from the speech itself (deep pitch, slow rate, stretched words, quieter echo repeats) and WebAudio stingers around it.

## Controls

| | Phone | Keyboard |
|---|---|---|
| Step left/right | ◀ ▶ (hold) | ← → |
| Turn the aim | ↺ ↻ (hold) | Shift + ← →, or A / D |
| Hook | SPIN strip, or curl the swipe | Q / E |
| Bowl | Swipe up (faster = faster ball) | Hold Space, release |

## Not done yet

- Lane oil patterns, ball weights, and left-handed bowlers.
- Online: nobody can join a game after it starts, and a game does not survive a dropped connection.
