# E12 contracts: winter sports (Snowdrop Slope, Pail Pond, the polar bears)

What E12 gives later epics (E18 activities, E21 act III quests #37 m37-snowdrop-slope and #38 m38-pail-pond, E14
Capwood next door). Code under `games/gnome-theft-auto/src/`. World: +x east, +z south; yaw 0 faces +z.

## Places (`winter/types.ts`)

| What | Where | Notes |
|---|---|---|
| Snowdrop Slope | E01 site `ski-hill`, x -460..-240, z -1300..-1000 | top ~60 m (north), foot ~4 m (south); painted snow (landform `snowfield` feature) |
| The Woolly Sock Lodge | `LODGE` (-449, -1020), door faces east | porch spots `SKI_RACK`, `COCOA_HATCH`, `SLED_STACK` (x -437); Gentian's home door registered (`homeOf('gentian')`) |
| The Bootlace Tow | `TOW.base` (-300, -1028) -> `TOW.top` (-325, -1270), 8 m/s | pulls skis and sleds; push forward at the base to grab |
| The Wool Run | `WOOL_RUN`: start line z -1255, six gates, finish z -1045 | missed gate +3 s; clean <= `BLACK_DIAMOND_S` = Black Diamond |
| The Tea-Tray Run | `TEA_TRAY_RUN`: start z -1250 at x -405, finish z -1040 | sled lane, no gates |
| Pail Pond | E01 site `ice-lake`, ice within `PAIL_POND.r` 62 of (-640, -1060) | painted ice (landform `pond` feature); Theo's shanty `SHANTY` (-612, -1040) |
| Polar bears | 5 on the Fells deck (330, -640) + `SNOWCAP_BEARS` (4) | all `'polar-bear'` critters, script mode, never hurt |

## Hooks for story quests (`winter/runtime.ts`)

```ts
import { winterApi } from '../winter/runtime';
winterApi()?.startRun('wool-run' | 'tea-tray-run'): string | null   // puts the player on the run's ride at its start (free)
winterApi()?.isOnSlope(x, z): boolean                              // on Snowdrop Slope's snow
winterApi()?.onFinish((r: RunResult) => ...): () => void           // { id, seconds, missed, clean, ride }
```

- Quest probes (`city/probes.ts`, read from the save, so the quest sim can solve them): `winter-sled-runs`,
  `winter-ski-runs`, `ice-holes`, `ice-catches`. E04's planned objective kind `ski-run` can be a `probe` on
  `winter-ski-runs` / `winter-sled-runs` (fallback `checkpoints` along `WOOL_RUN.gates`).
- m37 "ski (or sled) down Snowdrop Slope to lose the HOA salt-plows": `startRun('wool-run')` at the top, then a probe.
- m38 Pail Pond: `fishing/waterKind.ts iceHoleNear`, `winter/iceFishing.ts` holes; a quest can count `ice-catches`.

## Vehicles

`'tea-tray-sled'` and `'snow-skis'` (config.ts VEHICLES, appended to `net.ts VEHICLE_CODES`; skis `spec.stand: true`).
Only the winter runtime steps them (`winter.drives(v)`); anywhere else they are ordinary parked vehicles. Untracked by the
parked-vehicle ledger, silent engines, no drive grips.

## Fishing

- `FishWater` gains `'ice'`; `fishing/waterKind.ts`: `IceHole`, `setIceHoleSource(fn)`, `iceHoleNear(x, z, reach)`,
  `ICE_REACH`. `SimEnv.snap()` drops the cast into a hole in reach. `FishingDeps.onCatch(water, id)`; `Fishing.lendRod()`.
- Species (`waters: ['ice']`, Snowcap Rise and the Fells): `fish-pail-perch`, `fish-woolly-minnow`,
  `fish-lantern-burbot`, `fish-frostjaw-char`.

## Save, items, apps, map

- `gta-winter-v1` (`winter/save.ts`, in `GTA_SAVE_KEYS` and cloud MERGES, newer side wins).
- Item `hot-cocoa` (snack, heals 0.35, 6 Acorns; sold at the lodge hatch and by Crumbs & Co.).
- Gnomlet app `ski-runs` ("Snowdrop", group fun).
- Map place kinds `ski`, `bears`, `icefish` (`mapIcons.ts` PLACE_STYLE + glyphs; `Blip.kind`).

## Achievements

`gta-tea-tray-run` (Bobble Beanie, head), `gta-first-tracks` (Ear-Flap Hat, head), `gta-black-diamond` (Crossed Skis,
back), `gta-ice-station` (3 ice catches; Woolly Sock Scarf, neck), `gta-bear-hug` (9 bears; Cocoa Mug, hand).

## Lore

R-186 (winter sports), R-187 (Pail Pond ice fishing, the pail's handle), R-188 (the nine bears, the Bear Deck); entries
`bootlace-tow`, `wool-run`, `tea-tray-run`; Snowdrop Slope, the Woolly Sock Lodge, Pail Pond, Fells Polar Bears, Thermos
Theo and Gentian Bootlace updated.

## Online

Rides relay as vehicles (others see you slide). Runs, best times, holes, catches and bears are local. Ice fishing uses
the existing rod sync (the bobber sits in the hole).
