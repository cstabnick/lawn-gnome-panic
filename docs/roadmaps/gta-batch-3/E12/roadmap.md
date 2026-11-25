# E12 Winter sports: roadmap

Brief: [../E12-winter-sports.md](../E12-winter-sports.md) (L38 polar bears really chill, L42 sledding, L43 ski hill and
skiing, L44 ice fishing), adjusted to the merged contracts: E01 sites `ski-hill` (Snowdrop Slope, natural ground, about
60 m at the top) and `ice-lake` (Pail Pond, flat), E04 names (the Woolly Sock Lodge, Gentian Bootlace, Thermos Theo),
E06 weather (`getWeather()` snow gives "fresh powder"), E07 Gnomlet apps, E08 inventory (Hot Cocoa snack), E10
`registerHome` (Gentian's lodge door). Contracts this epic gives later epics: [contracts.md](contracts.md).

## Decisions

- **Rides are vehicles.** The tea-tray sled and the skis are two new vehicle kinds (`tea-tray-sled`, `snow-skis`;
  `VEHICLE_CODES` appended), stepped by `winter/runtime.ts` through the same slot tubing uses (`winter.drives(v)` /
  `stepRider`). So get-in/out, the chase camera, the touch driving controls and online relay come for free: other players
  see you sliding on your sled or skis. This replaces the brief's "append a mode to actSync" (nothing new on the wire).
  Skis set `spec.stand` so the gnome stands (player.ts `state.sitting = !v.spec.stand`).
- **One slide body** (`winter/slideRider.ts`, pure): gravity along the slope from three height samples, Coulomb friction
  by surface (snow / ice / anything else brakes hard), drag, carve with lateral grip, snowplough, pole push, hop, flight off
  lips, landing with a bounce for the sled, air spins, sub-stepped at 60 Hz, speed clamp 60 m/s. `SKI` and `SLED` tunings.
- **The slope is painted snow.** Snowdrop Slope only had snow above 32 m; a `snowfield` landform feature (new kind, code 11)
  in `north-highlands.level.json` paints the whole run snow, and a `pond` feature paints Pail Pond ice. The JS landform
  and the AssemblyScript kernel (`assembly/kernel.ts`, rebuilt `kernelBytes.ts`) both read them; the parity test is green.
- **Ice fishing fakes the water** (as the brief decided): `fishing/waterKind.ts` gains an ice-hole source; a hole is
  'ice' water, the cast snaps into a hole in reach (`SimEnv.snap`), four cold-water species bite there. Holes are flat
  decals (`flatLayer`), drilled with an auger (E on ice, 1.6 s), at most four open.
- **Course length:** the slot's slope is about 280 m long, so a run is ~20-30 s, not the brief's 60-80 s (the site was
  not raised: the run is quick and repeatable, with a rope tow back up and a "Ride again" button).
- **Bears:** the five deck bears are unchanged (`fells.test.ts`); four more on Snowcap Rise (asleep on the ice, in a tube
  on the ice, fishing a hole, mug on the lodge bench). Bear Deck sign + map blip. The bear call is now a yawn.
- **Side quests:** `sq-snowdrop-sled-trials` (Gentian) and `sq-pail-pond-lines` (Theo) unlock after `ch3-tundra-drift-run`
  until E21 builds m38/m39 (then re-time them there). `sq-capwood-cap-count` stays with Capwood's epic (E14).
- **Online:** rides relay as vehicles; runs, best times, holes and bears are local (like other activities); ice fishing
  reuses the rod sync. **Mobile:** the vehicle touch stick steers/brakes/pushes; the winter HUD adds Hop, Let go, Grab tow
  and Ride again buttons (44 px).
- Lore: R-182 (winter sports), R-183 (Pail Pond ice fishing), R-184 (the nine bears). If another epic merged rulings with
  these numbers first, renumber at merge.

## Shape

| Epic | Issues | Done when |
|---|---|---|
| E12-0 foundation (lead) | `winter/types.ts`; stubs for every winter module; vehicle kinds + `spec.stand`; map kinds `ski`/`bears`/`icefish`; save key `gta-winter-v1`; `FishWater 'ice'`, ice-hole source, `fishing.lendRod/onCatch`; snow + ice paint (JS + kernel); prefab catalog stubs; app.ts wiring | tsc |
| E12-A parallel (13) | A1 slide rider, A2 course + tow, A3 save + probes, A4 ice species + snap, A5 ride prefabs, A6 lodge/pond prefabs, A7 rewards + achievements, A8 Snowcap bears + yawn, A9 lore, A10 Snowdrop scenery, A11 Pail Pond scenery, A12 ice holes, A13 Snowdrop app + Hot Cocoa | per-issue tests |
| E12-B (2) | B1 runtime (rentals, riding, tow, runs, HUD, achievements, API), B2 side quests + quest sim | winter tests, quest sim |
| E12-C integration (lead) | tuning, screenshots, smoke, zfight, contracts, AGENT_INDEX | all checks |

Issue files (each is the full text a worker got) are in [issues/](issues/); shared environment: issues/_env.md.

## AC evidence

- Storytelling and 3-spot screenshot pass: [screenshot-pass.md](screenshot-pass.md), images in [screens/](screens/).
