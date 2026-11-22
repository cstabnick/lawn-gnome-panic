# Gnom Set Radio

Cel-shaded inline rollerblade action-music game set in the **Broadcast Archipelago** of the Upper Aether (`the-aether`), where glowing ley-lines intersect with leaked pirate broadcasts from Turfton.

## Run & Test

- Dev server: `npm run dev -w games/gnome-set-radio` (port `5204`)
- Type-check & build: `npm run build -w games/gnome-set-radio`
- Tests: `npm test -w games/gnome-set-radio`
- URL flags: `?autostart=1`, `?level=velvet-keys|bongo-basin`, `?explorer=1`, `?cutscene=<id>` (plays one cutscene, e.g. `area-3-boss-intro`; every id is in `src/data/cutscenes.ts`, or watch them all in the 📖 Lore & Ladder codex's Cutscene Theater)

## Controls

- **Move / Carve:** WASD or Arrow keys (mobile: left virtual thumbstick; gamepad: left stick)
- **Jump / Wall-Kick:** Space (mobile: JUMP button; gamepad: A)
- **Grind / Trick:** E or Q / R in air (mobile: GRIND / TRICK button; gamepad: X / Y)
- **Spray / Talk / Interact:** F or Enter (mobile: SPRAY button; gamepad: B)
- **Boost:** Shift (mobile: BOOST button; gamepad: RT)
- **Music Explorer:** M (or `🎵 Music` HUD button)
