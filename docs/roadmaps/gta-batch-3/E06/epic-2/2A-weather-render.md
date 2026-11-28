Epic: E06-2 Fill (Sky, weather and time), issue 2A weather render
Depends on: none (the foundation is in place)
Worker: Sonnet (visual tuning)

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto` (three.js 0.187, Vite, TypeScript). Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the file listed under Change. Do not commit.
- Keep LF line endings.

## Goal
`src/weather/render.ts` draws the weather round the camera: rain streaks, snow flakes (the Fells call them frost glaze), a
cloud layer, all cheap enough for a phone, inside one group that leaves the scene when weather is hidden.

## Read first
- `games/gnome-theft-auto/src/weather/render.ts`: the stub; its exported types and `createWeatherView(scene)` signature are final.
- `games/gnome-theft-auto/src/weather/config.ts`: `WEATHER_TIERS` (particle and cloud budgets per tier: high rain 1600 / snow 1100 / clouds 14; medium 640 / 440 / 8; low 360 / 260 / 0; min 200 / 150 / 0).
- `games/gnome-theft-auto/src/weather/types.ts`: `WeatherState { kind: 'clear'|'cloud'|'mist'|'rain'|'snow'; intensity: 0..1 }`.
- `games/gnome-theft-auto/src/atmosphere.ts`: how the pooled motes are built and wrapped round the focus (`wrapCoord`, `THREE.Points`, `PointsMaterial`, `depthWrite: false`, `frustumCulled = false`). Copy that pattern.
- `games/gnome-theft-auto/src/config.ts`: `VIEW = { fogNear: 150, fogFar: 420, cameraFar: 900 }`.

## Change
- `games/gnome-theft-auto/src/weather/render.ts` only. Fill in `createWeatherView(scene)`:
  - `root` (a `THREE.Group`, name 'weather') holds everything. In `update`, when `f.visible` is false or the weather is 'clear' with no clouds to show, `root.removeFromParent()` (nothing of the weather is in the scene); when it should show, `scene.add(root)` if `root.parent !== scene`.
  - Allocate every buffer once, at the 'high' budget, in `createWeatherView`. Per frame only write into existing typed arrays and use `geometry.setDrawRange(0, n)` to draw fewer. No `new` in `update` (no Vector3, no arrays, no materials).
  - Rain: `THREE.LineSegments` with 2 vertices per drop (top and bottom, about 0.9 m apart, slanted a little by a fixed wind of about (1.5, 0, 0.8) m/s), in a box round the camera of 60 m x 60 m wide and 30 m tall (centred on the camera x/z, from camera.y - 12 to camera.y + 18). Drops fall at about 24 m/s and wrap back to the top (and round x/z as the camera moves, like the motes' `wrapCoord`). `LineBasicMaterial({ color: 0xaecbe6, transparent: true, opacity, depthWrite: false, fog: true })`. Drawn count = `Math.round(WEATHER_TIERS[f.tier].rain * w.intensity)` while kind is 'rain', else 0. Opacity about 0.35 + 0.25 * intensity, a bit darker (lerp the colour toward 0x5d6f86) by `f.night`.
  - Snow: `THREE.Points` with a soft round canvas texture made once (a 32 x 32 canvas with a white radial gradient, `THREE.CanvasTexture`), `PointsMaterial({ size: 0.22, map, transparent: true, depthWrite: false, color: 0xf4f8ff })`, same box, fall about 1.4 m/s with a per-flake sideways sway (`Math.sin(time * 1.3 + seed) * 0.6` m/s), count from `WEATHER_TIERS[f.tier].snow * w.intensity` while kind is 'snow'. Guard `document` (tests run in node: if `typeof document === 'undefined'`, skip the map).
  - Clouds: `WEATHER_TIERS[f.tier].clouds` sprites (`THREE.Sprite` with one shared soft-puff canvas texture, `SpriteMaterial({ transparent: true, depthWrite: false, fog: false })`, one material per sprite so opacity can differ, or one shared material if all share an opacity), scattered once in a ring 120..380 m round the camera at 110..160 m above the camera's ground (`camera.position.y + 90..140` is fine), scaled 60..130 m wide by 25..45 m tall, drifting slowly with the wind and wrapped round the camera within 400 m. Cloud opacity by kind at intensity 1: clear 0.22 (only the first third of the sprites: fair-weather puffs), cloud 0.75, mist 0.4, rain 0.85, snow 0.7; multiply by `0.35 + 0.65 * intensity` (clear uses its fixed value). Tint toward grey 0x7d8590 by the overcast of the kind (rain most) and toward 0x2a3048 by `f.night`. With `clouds = 0` for the tier (low, min) no sprite is visible.
  - Mist has no particles (the atmosphere pulls the fog in); only clouds.
  - Every mesh: `frustumCulled = false`, `renderOrder` above the motes is fine, `castShadow = receiveShadow = false`. Nothing lies flat on a surface (no puddles, no snow cover: those would need `flatLayer`, out of scope).
  - Ease intensity changes are already done by the caller; just draw what `w` says.
  - `dispose()`: remove from parent, dispose geometries, materials, textures.

## Contract
Keep exactly (from the stub):
```ts
export interface WeatherViewFrame { night: number; tier: Tier; visible: boolean }
export interface WeatherView {
  readonly root: THREE.Group;
  update(dt: number, camera: THREE.Camera, w: WeatherState, f: WeatherViewFrame): void;
  dispose(): void;
}
export function createWeatherView(scene: THREE.Scene): WeatherView
```
`app.ts` already calls `createWeatherView(scene)` once and `update(dt, camera, getWeather(), { night, tier, visible })` every frame (also during cutscenes). Do not edit app.ts.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- Add `games/gnome-theft-auto/src/weather/render.test.ts`: in node (no DOM) `createWeatherView(new THREE.Scene())`, call `update` with rain at intensity 1 on tier 'high' and `visible: true`: root is in the scene and the rain geometry's draw range count is 3200 (1600 drops x 2 vertices); with `visible: false` root has no parent; tier 'medium' snow intensity 0.5 draws 220 points. `npx vitest run src/weather/render.test.ts` passes.
- Visual check (do it): start the dev server on port 5311 (`cd games/gnome-theft-auto && npx vite --port 5311 --strictPort`, in the background), then take headless screenshots and look at them with the Read tool:
  `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=390,844 --virtual-time-budget=20000 --screenshot=<scratch>/rain-phone.png "http://localhost:5311/?weather=rain&quality=medium"` and the same with `--window-size=1280,720` and `?weather=snow`, `?weather=cloud`. (The `?weather=` param is filled by a parallel issue; until it lands you can force weather temporarily by calling `forceWeather('rain', 1, true)` from `./index` at the bottom of render.ts during your check, and remove it after.) Rain should read as thin slanted streaks, not a grey wall; snow as soft flakes; clouds as soft puffs high up, not blocking the view. Tune counts/opacity in render.ts only. Stop the server when done.

## Out of scope
`app.ts`, `atmosphere.ts`, `weather/index.ts`, `weather/config.ts` (you may suggest number changes in your report), `weather/options.ts`, anything else.
