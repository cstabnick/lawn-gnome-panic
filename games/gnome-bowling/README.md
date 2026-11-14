# Gnome Bowling

Ten-pin bowling in a neon gnome alley, played by gnomes with bowl cuts. Step and aim, then swipe up to bowl, like swinging a motion controller: a faster swipe throws a faster ball, and curling the swipe hooks it into the pocket. 1-4 players take turns on one device, or 2-4 bowl together online. The gnomes shout on every hit and miss, and every strike, spare, split and gutter ball gets its own silly result screen.

The question it answers: does a swipe-to-bowl gesture on a phone feel as good as swinging a motion controller?

## Run

```
npm install                          # once, from the repo root
npm run dev -w games/gnome-bowling   # http://localhost:5185 (also on your LAN, for a phone)
npm run build -w games/gnome-bowling
npm test -w games/gnome-bowling      # scoring and physics tests
```

Online needs the shared server: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws). See `packages/mp/README.md`.

Debug: `#play` in the URL starts a two-player local game at once. `#mute` mutes the sound. `window.bowl` is the game state.

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
