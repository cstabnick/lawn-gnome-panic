# Gnome Front

A gnome-scale conquest FPS where Red Caps and Blue Caps (12 a side, you plus bots) fight over five lawn landmarks. Holding more flags drains the enemy's tickets. Ride the green, yellow and red riding mowers or THE COMBINE from Lawn Gnome Panic to get around fast and run gnomes over.

## Controls

- WASD: move
- Mouse: aim
- Click: fire
- R: reload
- G: throw a pinecone grenade
- Space: jump
- Shift: sprint
- E: ride or hop off a vehicle
- Tab: scoreboard
- M: mute music

### Phones and tablets

Play in landscape. Left thumb anywhere on the left half: move (push all the way up to sprint). Right thumb: look. Hold FIRE and drag to aim while shooting. RIDE gets on or off a mower; GREN, JUMP and RELOAD do what they say; SCORES (top left) shows the scoreboard. The controls live in `src/ui/touch.ts` and write into the same input state as the keyboard.

## Run and build

- Dev server: `npm run dev -w games/gnome-front` (port 5182)
- Type-check and build: `npm run build -w games/gnome-front`
- Add `?autoplay=1` to the URL to skip the Play click

## Tuning

Numbers live in `src/config.ts`: `TUNING`, `RIFLE`, `GRENADE`, `VEHICLES`, `FLAGS`, `VEHICLE_SLOTS`.

## Reused from Lawn Gnome Panic

- Gnome and mower models are copied unchanged into `src/models/`.
- The terrain is adapted from Lawn Gnome Panic.
- Music comes from the shared `@lawn/music` package (`packages/music`).

## Not done yet

- Bots fight and capture, but they do not use cover or work as squads.
- No ragdolls, no destructible cover, one weapon plus grenades.
- Offline only: you plus 23 bots.
