Epic: E06-2 Fill (Sky, weather and time), issue 2C weather achievements and their reward prefabs
Depends on: none (the foundation is in place)
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`. Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of the game at the same time. Only touch the files listed under Change. Do not commit. Keep LF line endings.

## Goal
Two Gnome Theft Auto achievements for weather, each with a cosmetic reward prefab: "Caught in the Rain" (2 minutes out in
the rain, reward a head `umbrella-hat`) and "Glazed Over" (1 minute out in falling snow, reward a neck `frost-glaze-muffler`).
The game-side tracker counts the time.

## Read first
- `packages/achievements/README.md`: the `AchievementDef` shape and reward rules.
- `packages/achievements/src/catalog.ts` around the `gta-showboat` / `gta-party-up` entries (about line 576): copy the GTA entry style: `{ id, game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title, description, reward: { slot, prefabId, label } }`.
- `packages/prefabs/README.md` and `docs/roadmaps/prefab-library/_common.md`: the PrefabDef rules (parts, sizes, the `wear-head` / `wear-neck` uses).
- `packages/prefabs/src/catalog/gta-wild-life.ts` around the `icicle-scarf` entry (line ~140): a neck item to model the muffler on; find one `wear-head` hat in `packages/prefabs/src/catalog/cosmetics-head-b.ts` to model the umbrella hat on.
- `games/gnome-theft-auto/src/weather/achievements.ts` (the stub) and `games/gnome-theft-auto/src/weather/config.ts` (`WEATHER.rainAchievementS` 120, `snowAchievementS` 60, `achievementMinIntensity` 0.3).

## Change
- New `packages/prefabs/src/catalog/gta-weather-gear.ts` exporting the two PrefabDefs (follow the export style of the other catalog files), and register it in `packages/prefabs/src/catalog/index.ts` the same way the others are:
  - `umbrella-hat`: name 'Umbrella Hat', a small striped garden umbrella on a headband (canopy cone or flattened dome in two alternating colours, a thin pole, a little finial), `uses: ['wear-head']`, sized like other hats.
  - `frost-glaze-muffler`: name 'Frost-Glaze Muffler', a pale icy-blue knitted muffler with a couple of glossy white "glaze" drips, `uses: ['wear-neck']`.
- `packages/achievements/src/catalog.ts`: append two entries next to the other GTA ones:
  - `gta-caught-in-rain`: title 'Caught in the Rain', description 'Spend two minutes out in the rain. Glazed gnomes are waterproof; that is not the point.', reward `{ slot: 'head', prefabId: 'umbrella-hat', label: 'Umbrella Hat' }`.
  - `gta-glazed-over`: title 'Glazed Over', description 'Stand out in the falling snow for a full minute. The Fells folk insist it is frost glaze.', reward `{ slot: 'neck', prefabId: 'frost-glaze-muffler', label: 'Frost-Glaze Muffler' }`.
- `games/gnome-theft-auto/src/weather/achievements.ts`: implement `createWeatherAchievements(deps)`: two second-counters (not saved; a session counts). Each `update(f)`: if `!f.enabled || !f.exposed` do nothing; if `f.weather.kind === 'rain'` and intensity >= `WEATHER.achievementMinIntensity`, add `f.dt` to the rain counter, and when it first reaches `WEATHER.rainAchievementS` call `deps.unlock('gta-caught-in-rain')` once; the same for 'snow' with `snowAchievementS` and `'gta-glazed-over'`. Keep the exported types and signature exactly.
- New `games/gnome-theft-auto/src/weather/achievements.test.ts`: 121 s of 1 s rain frames unlocks `gta-caught-in-rain` exactly once; not exposed or disabled counts nothing; light rain (0.2) counts nothing; 61 s of snow unlocks `gta-glazed-over`.

## Contract
```ts
export interface WeatherAchievementDeps { unlock(id: string): unknown }
export interface WeatherAchievementFrame { dt: number; weather: WeatherState; enabled: boolean; exposed: boolean }
export interface WeatherAchievements { update(f: WeatherAchievementFrame): void }
export function createWeatherAchievements(deps: WeatherAchievementDeps): WeatherAchievements
```
Achievement ids exactly `gta-caught-in-rain` and `gta-glazed-over`. `app.ts` already calls it every frame; do not edit app.ts.

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass (run from the repo root).
- `cd games/gnome-theft-auto && npx tsc --noEmit -p . && npx vitest run src/weather/achievements.test.ts` pass.

## Out of scope
Every other prefab catalog file except `index.ts`; `app.ts`; other weather files.
