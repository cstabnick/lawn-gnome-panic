# FX03 result: touch activity mode, holstering and activity HUDs

Branch `fix/FX03`. One epic: lead foundation (`activityMode.ts`, `input.ts`, `app.ts` hideGun block, `types.ts` Input,
`ui/enterLabel.ts`, comedy holster) plus 7 parallel workers (court HUD, skate HUD, golf HUD, golf club and swing,
winter rides, shift panel and bins, fire brigade). Re-shots under `review/shots/FX03/` (git-ignored), taken with the new
`tools/gta-touch-check.mjs` (touch emulation, fails on overlapping button rects); every shot below reports
`overlaps: none` and no console errors.

| Finding | Status | Evidence |
|---|---|---|
| G1#12 (must, D30) guns in the flat | fixed | `activityHidesGun()` true in the 9 `PEACEFUL_INTERIORS`; gun hidden, no fire/aim, Guns/Reload/Aim/Fire gone, the context button (Leave / Decorate / Sleep) takes the Fire slot. `i-flat-phone.png` (shot in the Bodega: Flat 3B is locked until the loan quest); `activityMode.test.ts`. |
| G4#11 (should) desktop key card on sleds | fixed (toast queue → G9) | The vehicle key card (`.gta-vhint`) hides in activity mode and while holstered; region banner quiet for 8 s at run start. Global toast queue left to FX19/G9 as the editor proposed. `sledP-5.png`. |
| G6#25 (should) golf strip across the line of play | partly | Strip is a two-line bar in the activity slot under the top row, short club names (PW, 7I), Card/Quit inside it; the fairway and horizon show below. Tee-marker nudge in `swingPose.ts`. Raising the tee camera (`golf/view.ts`, FX16's file) carried over. `golfP2-6.png`, `golf5-phone.png`. |
| G8#1 (must) activity buttons over the cluster | fixed | `input.setActivity` / `setTouchActivity`: court and hose/lift show no cluster, skate/sled/skis/golf keep only Exit/the context button. Overlap check clean at 390x844 for court, skate, sled, ski, golf, bins, fire. Fishing's touch mode carried over (`fishing/` not owned). `courtP2-8.png`, `skateP-5.png`, `sledP-5.png`, `golfP2-6.png`, `courtD2-14.png`, `skateD-5.png`. |
| G8#2 (must, D30) pistol at golf and on stage | fixed | Holstered for golf, comedy, court, skate, winter, every shift and workplace panel; weapon block hidden. Golf holds `golf-club` (buildGear) with address / backswing-with-meter / follow-through pose (`golf/swingPose.ts` + test). Farm work has no running state (one-tap tasks): carried over. `golfD2-10.png`, `golfL-6.png`, `comC-35.png`. |
| G8#3 (must) shift panel covers toasts, money, minimap | fixed | Shift panel in the activity slot; toasts move below any slot panel (`--gta-act-bottom`); phone: full width under the top row, 2 lines; caller's line in the panel for 6 s; one Tank figure; region banner quiet 8 s. The "Entering Mossy Wood" district toast is hud.ts's (G8#25, FX19). `binD-4.png`, `fireD-4.png`, `binP-12.png`, `fireP-12.png`. |
| G8#11 (must, D58) Pumper inside the station | fixed | Engine spawns on the apron (x ≥ -216.5) facing out; station back wall (box + collider, no shared faces). No camera-snap hook exists; the start spot alone puts the camera outside. zfight at the station: no station pairs. `fireD-15.png`, `fireP-12.png`. |
| G8#14 (should) skate HUD keyboard-first | fixed | Key chips only for keyboard/pad; glyph sub-labels on OLLIE/FLIP/GRAB; speed pill in the slot, hidden below 4 km/h, no "best combo 0". `skateD-5.png`, `skateP-5.png`. |
| G8#15 (should) golf buttons crowd | fixed | 8 px gaps, 2x2 block on phones, SWING left of the context button, Card/Quit in the strip, telescope/dock hidden in activity mode. `golfL-6.png`, `golfD2-10.png`. |
| G8#16 (should) hose keyboard hints | fixed | Space / L chips for keyboard, stick hidden for keyboard players, first-time hint "WASD aim · Space spray · L ladder"; Space already sprayed (now preventDefault). |
| G8#19 (could) achievement toasts over panels | fixed | While a workplace panel or a slot panel is up, `#la-toast-stack` moves bottom-left (CSS in activityMode.ts). Not re-shot (needs an unlock mid-shift). |
| G8#26 (should) sled/skis as vehicles | fixed | Stick + Hop + Exit only. `sledP-5.png`. |
| G8#33 (should) court phone scoreboard | partly | Score bar in the slot with QUIT inside, buttons in a bottom-right arc, meters moved clear. Camera pull-in (`court/view.ts`, not owned) carried over. `courtP2-8.png`. |
| G8#34 (could) debug-looking HUD text | fixed | Skate zero state hidden, bin round shows "First bin: N m" until the first bin, one Tank figure, a spread toast once per call. |

Counts: 12 fixed, 2 partly, 0 carried over whole. Carried over (outside FX03's files): court camera pull-in, golf tee
camera in portrait, fishing touch mode, a farm-work activity state, the global toast queue, the duplicate vehicle-name
toast and the "Entering Mossy Wood" district toast.

Checks: `npm run build -w games/gnome-theft-auto` ok; `npm test -w games/gnome-theft-auto` 518 files / 5345 tests pass;
`bash tools/smoke.sh <url> gta-gnomlet` SMOKE OK; `npm run zfight` at the fire station: no pairs from the station (45
pre-existing elsewhere). No lore, prefab, scene or density change (no perf pass needed).
