Epic: FX11 A (coast fixes, parallel) · Issue A14: the coast sounds like a seaside (G3#24)
Depends on: none · Agent: Sonnet · Dev port 5534

(The Environment section the lead gave you applies.)

## Goal
Editor (G3#24): "Each surf tick picks one of three spots (x -400, 0, 400) at random and plays only if that spot is within 120 m. Standing at one spot, you hear surf about every 40 s, and gulls about as rarely. The bell plays only near two buoys. There is no boardwalk crowd or organ, no wheel creak, no rigging or creak on the ship." Fix: "A continuous surf bed scaled by distance to `COAST.shoreZ`. A boardwalk murmur loop with a fairground organ near the wheel, a wheel creak, rigging and halyard ticks near the Queen." (The cabin's own bed is another worker's.)

## Read first
- `games/gnome-theft-auto/src/coast/ambience.ts` (a stub this epic made: `installCoastAmbience(deps): CoastPart` returning `{}`; coast/index.ts already calls it and runs its `update(dt)` every frame).
- `games/gnome-theft-auto/src/coast/life.ts` `installCoastLife` (the `surfT` / `bellT` / `gullT` timers at the bottom: you replace them) and `src/coast/config.ts` `COAST` (`shoreZ` 1190, `soundSpots`, the boardwalk rect x -210..210 z 1102..1132, the Spokewheel (-260, 1100), the ship (300, 1268)).
- `games/gnome-theft-auto/src/sound/bus.ts`: `busOut()` returns `{ ctx, world, ambience }` (or null without audio: tests, before the first click), `playAt(id, { x, z }, { gain, maxDist, param, bus: 'ambience' })`, `getListener()`, `getAmbienceVolume()`, `registerSound(id, recipe)`; `src/sound/synth.ts` (`noise(ctx)` buffer, `tone`, `env`, `burst`); `src/sound/ids.ts` (`surf-wash`, `buoy-bell`, `gull`, `crowd-murmur`, `door-creak`, `water-lap`, `wind-gust`, ...); `src/sound/loops.ts` and `src/sound/ambience.ts` (how the game builds looping noise beds: a looping noise buffer -> filter -> gain into the ambience bus; copy that pattern).
- `games/gnome-theft-auto/src/interiors/index.ts` (`currentInterior()`: non-null while inside a building; go quiet then).
- `games/gnome-theft-auto/src/coast/spokewheel.ts` `spokewheelAngle(waveTime())` (the wheel turns continuously) and `src/coast/nightLights.ts` `coastNight()` (0 day .. 1 night).

## Change: `src/coast/ambience.ts` (+ a test), and in `src/coast/life.ts` ONLY remove the old surf/bell/gull timers and the `playAt` import if unused
1. Surf bed: one looping noise source -> lowpass/bandpass (around 400-900 Hz) -> a gain that swells slowly (two LFOs at about 0.11 and 0.07 Hz, so it breathes like waves) -> the ambience bus. Its level follows the listener's distance to the shore: full within 25 m of `z = COAST.shoreZ` (and on the pier / ship), fading to zero 220 m inland; zero far from the coast region (x outside -1400..1400 or z < 950) and inside interiors. Smooth gain changes (`setTargetAtTime`). Plus an occasional `surf-wash` one-shot (every 6-12 s) at the shore point nearest the listener (x = listener x, z = shoreZ) when within 80 m, so waves land near you.
2. Boardwalk murmur: a soft crowd bed (a second noise loop, band-passed around 300-1500 Hz with slow random gain wobble, or periodic `crowd-murmur` one-shots every 4-7 s at a random point on the deck near the listener) when the listener is within 60 m of the deck rect, quieter at night (x (1 - 0.6 night)).
3. Fairground organ near the wheel: register a small `coast-organ` recipe with `registerSound` (a 2-3 s jaunty calliope phrase: square/triangle tones in a major key, 6-10 notes, with a slight vibrato) and play it at the Spokewheel (-260, 1100) on a loop (each phrase as it ends, with a 1-2 s gap; pick one of 3 phrases), audible within about 90 m (`maxDist`), on the ambience bus, gain modest.
4. Wheel creak: a `door-creak` (low `param`) at the hub every 5-9 s within 60 m.
5. The Queen: rigging and halyard ticks (a short high `tone` tick, or `metal-clang` at very low gain and high param; a registered `coast-halyard` recipe is fine) every 1.5-4 s and a timber creak (`door-creak`) every 6-10 s within 50 m of (300, 1268); `buoy-bell` at the two `COAST.soundSpots.buoyBell` spots every 10-20 s within 150 m.
6. Gulls: `gull` at a random point within 40 m of the listener every 10-20 s when within 150 m of the shore (more by day: skip at night 70% of the time).
7. Everything stops (gains to 0, no one-shots) inside an interior and when `busOut()` is null. No per-frame allocation. All tunables in one `const AMB = { ... }` at the top.
8. Test (`src/coast/ambience.test.ts`): export the pure level functions (e.g. `surfLevel(x, z)`, `murmurLevel(x, z, night)`) and test: surfLevel is 1 at (0, 1185), 0 at (0, 900), between at (0, 1080); murmurLevel is 0 at (0, 1300) and > 0 at (0, 1117).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Listen if you can (dev server port 5534; Edge with sound): stand on the boardwalk, at the wheel, by the Queen. If you cannot hear in this environment, check in the browser console that no audio errors occur (`bash tools/smoke.sh http://localhost:5534/ "#ui" canvas` reports no console errors), and say so.

## Out of scope
`src/sound/*` (read only; register your recipes from ambience.ts), the cabin interior's ambience (pirateShip.ts, another worker), the rest of life.ts.
