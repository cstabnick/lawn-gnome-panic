# Gnome Theft Auto: render performance pass and profiler backend (lane H)

Goal: Gnome Theft Auto reports to the hitch profiler (`@lawn/profiler`, platform `ProfileService`, viewer
`games/admin-profiler`) with render stats (draw calls, triangles, GPU time) and periodic frame-health samples, has an
on-screen `?perf` overlay, and draws far less per frame: culling that works, fewer shadow casters, and an adaptive
quality tier.

## Measured baseline (phone viewport 390x844 @2x, `node tools/gta-perf.mjs`, before this pass)

| leg | draw calls avg/max | triangles avg |
| --- | --- | --- |
| Turfton | 833 / 897 | 2.0 M |
| Frostbite Fells | 548 / 770 | 1.4 M |
| Loch Moss | 207 / 524 | 0.9 M |
| Mossy Wood | 386 / 691 | 1.0 M |
| Tallgrass Commons | 154 / 510 | 1.8 M |
| Cloverfield Farms | 334 / 708 | 2.1 M |
| Dust Flats | 643 / 1255 | 2.5 M |
| Turfton (back) | 1112 / 1507 | 2.7 M |

Census at (60, -60) in Turfton: 948 draw calls and 2.6 M triangles with shadows, 253 calls and 1.2 M without: the
shadow pass is three quarters of the draw calls and half the triangles. Causes found:

1. The sun's shadow camera covers 280 x 280 m and every prop casts, so about 1 000 props are drawn a second time.
2. The biome scenery (`forest-scenery`, `tundra-scenery`, `desert-scenery`, `farm-scenery`), the stage sets and the
   Speedway dressing are each one merged mesh per material spanning the whole region (bounding radius 550-880 m, up to
   390 k triangles). Frustum culling cannot drop them, so they are drawn in full, twice (main and shadow pass), from
   anywhere on the map.
3. No distance culling: the camera far plane is 900 m and nothing hides at range.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Profiler backend, viewer, overlay (workers) + culling, shadows, quality tier (planner) | `go test ./...`, `npm run build -w games/admin-profiler`, `npm test -w packages/profiler`, `npm run build -w games/gnome-theft-auto` | 3 worker issues; the planner does the rest |

The planner owns `packages/profiler`, the proto and its generated code, `games/gnome-theft-auto/src/app.ts`,
`src/cull.ts`, `src/perf.ts`, `src/quality.ts` and the scenery edits. Workers own exactly the files in their issue.

## Epic 1

### 1A. Server: store render stats and frame samples

~~~~text
Epic: 1 Profiler backend
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a8075f8501c80e3d2 (a git worktree; never
commit). Go is installed (`go` on PATH, else "C:\Program Files\Go\bin\go.exe"). Work in packages/platform-server.
Other workers are editing games/admin-profiler and games/gnome-theft-auto at the same time; do not touch those.
The proto (proto/gnome/profile/v1/profile.proto) and the generated Go code
(packages/platform-server/gen/gnome/profile/v1/profile.pb.go) are ALREADY updated. Never edit generated files.

## Goal
ReportHitches accepts and stores two new optional fields on each Hitch (render stats and frame stats) and a new kind
"sample"; GetSession returns them; samples are kept apart from the hitch totals; HitchSeries reports per-bucket
frame health from the samples.

## Read first
- proto/gnome/profile/v1/profile.proto: messages RenderStats, FrameStats, Hitch (fields render = 7, frames = 8),
  SessionSummary.sample_count, SeriesBucket fields samples, frame_p50_ms, frame_p95_ms, draw_calls, triangles.
- packages/platform-server/gen/gnome/profile/v1/profile.pb.go: the Go names (RenderStats{DrawCalls, Triangles
  float64; Geometries, Textures, Programs int32; GpuMs float64; PixelRatio float32}, FrameStats{Frames int32; P50Ms,
  P95Ms, MaxMs, CpuMs float64}, Hitch.Render, Hitch.Frames, SessionSummary.SampleCount, SeriesBucket.Samples,
  FrameP50Ms, FrameP95Ms, DrawCalls, Triangles). Grep for them; do not read the whole file.
- packages/platform-server/internal/store/hitch.go, hitch_postgres.go, hitch_test.go
- packages/platform-server/internal/store/postgres.go: the `migrations` slice (append only)
- packages/platform-server/internal/service/profile.go, profile_test.go

## Change
- internal/store/hitch.go:
  - Add
    ```go
    // HitchRender is what the renderer drew (the frame, or a sample window's means).
    type HitchRender struct {
        DrawCalls  float64 `json:"dc"`
        Triangles  float64 `json:"tri"`
        Geometries int32   `json:"geo,omitempty"`
        Textures   int32   `json:"tex,omitempty"`
        Programs   int32   `json:"prog,omitempty"`
        GpuMS      float64 `json:"gpu,omitempty"`
        PixelRatio float32 `json:"pr,omitempty"`
    }
    // HitchFrames is frame-time health over a sample window.
    type HitchFrames struct {
        Frames int32   `json:"n"`
        P50MS  float64 `json:"p50"`
        P95MS  float64 `json:"p95"`
        MaxMS  float64 `json:"max"`
        CPUMS  float64 `json:"cpu"`
    }
    ```
  - Hitch gets `Render *HitchRender` and `Frames *HitchFrames`. HitchSessionSummary gets `SampleCount int32`.
  - `const MaxSamplesPerSession = 720` and `const SampleKind = "sample"`.
  - AddHitches (interface doc and MemoryHitches): a hitch with Kind == SampleKind is a sample: it is stored while the
    session has fewer than MaxSamplesPerSession samples and increments SampleCount only. Every other kind is stored
    while HitchCount < MaxHitchesPerSession and updates HitchCount, WorstMS and TotalMS as today. The return value is
    the number stored of both. (Today MemoryHitches caps by len(m.hitches[id]); change it to count per kind.)
- internal/store/postgres.go: append ONE new migration string at the end of `migrations`:
  `ALTER TABLE hitches ADD COLUMN render jsonb; ALTER TABLE hitches ADD COLUMN frames jsonb; ALTER TABLE hitch_sessions ADD COLUMN sample_count integer NOT NULL DEFAULT 0;`
  with a one-line comment above it like the others.
- internal/store/hitch_postgres.go: hitchCols adds `render, frames`; scanHitches scans them into `[]byte` (NULL gives
  nil) and json.Unmarshals into a new *HitchRender / *HitchFrames only when non-nil. INSERT writes them as NULL when
  the pointer is nil (pass `nil` of type []byte), else the JSON. hitchSessionCols and scanHitchSession add
  sample_count. AddHitches: the upsert `RETURNING hitch_count, sample_count`; split the batch into samples and hitches,
  cap each by its own room; the final UPDATE adds `sample_count = sample_count + $5` (samples count) and only the
  non-sample hitches go into hitch_count, worst_ms, total_ms.
- internal/service/profile.go:
  - hitchKinds adds "sample".
  - In ReportHitches, for each hitch copy h.Render into store.HitchRender when non-nil, after checking every float with
    `finite` (DrawCalls 0..1e6, Triangles 0..1e9, GpuMs 0..maxHitchMS, PixelRatio 0..16) and the ints clamped to
    0..1e6 with max/min; a non-finite or out-of-range float returns invalid("bad render"). Same for h.Frames
    (Frames clamped 0..100000; P50Ms, P95Ms, MaxMs, CpuMs each finite 0..maxHitchMS, else invalid("bad frames")).
  - toHitch sets Render and Frames back (nil stays nil). toSessionSummary sets SampleCount.
  - buildSeries: samples (Kind == store.SampleKind) are skipped for everything that exists today (totals, systems,
    Hitches, Sessions, p50/p95/max). Per bucket, over its samples: Samples = count; FrameP50Ms and FrameP95Ms = mean
    of Frames.P50MS / P95MS over samples with Frames != nil; DrawCalls and Triangles = mean over samples with
    Render != nil. All stay 0 when there are none.
- internal/store/hitch_test.go: extend the shared store test (it runs for memory, and for Postgres when
  PLATFORM_TEST_DATABASE_URL is set) with: a batch of 2 hitches + 3 samples with Render/Frames set returns 5 stored,
  HitchCount 2, SampleCount 3, WorstMS/TotalMS from the 2 hitches only; GetHitchSession returns the Render and Frames
  values round-tripped (and nil for a hitch without them); MaxHitchesPerSession hitches do not stop samples.
- internal/service/profile_test.go: a test that reports a "sample" with render {drawCalls 300, triangles 1e6} and
  frames {p50 16.7, p95 33}, then GetSession returns them and HitchSeries has a bucket with Samples 1, DrawCalls 300,
  FrameP50Ms 16.7 and Hitches 0; and one that a render with DrawCalls NaN-free but -1 is rejected (CodeInvalidArgument).

## Contract
JSON keys in the jsonb columns are exactly the struct tags above. Kind "sample" is the only new kind.

## Done when
- `cd packages/platform-server && go build ./... && go vet ./... && go test ./...` pass.
- There is no Docker on this machine, so the Postgres store tests (they need PLATFORM_TEST_DATABASE_URL) cannot run
  here: CI runs them. Make the Postgres code compile and mirror the memory store exactly, and say in your report that
  the Postgres path was not run.
- `gofmt -l internal` prints nothing.

## Out of scope
proto/, gen/, packages/platform/, games/, packages/profiler. No other services.
~~~~

### 1B. Viewer: draw calls, triangles and frame health next to frame time

~~~~text
Epic: 1 Profiler backend
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a8075f8501c80e3d2 (a git worktree; never
commit). Node: `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash. Work only in games/admin-profiler/src.
Other workers edit packages/platform-server and games/gnome-theft-auto at the same time. Do not start a dev server.

## Goal
The /admin/profiler/ viewer shows the new render stats and frame-health samples: a frame-health chart under the
hitch time series (frame time p50/p95 with draw calls and triangles), a samples table for the selected session, and
draw calls / triangles / GPU ms on a selected frame hitch. Demo mode (?demo) fakes them too.

## Read first
- packages/platform/src/gen/gnome/profile/v1/profile_pb.ts: grep for `RenderStats`, `FrameStats`, `render?:`,
  `frames?:`, `sampleCount`, `frameP50Ms`, `drawCalls`. TS shapes (already generated):
  Hitch.render?: { drawCalls: number; triangles: number; geometries: number; textures: number; programs: number;
  gpuMs: number; pixelRatio: number }; Hitch.frames?: { frames: number; p50Ms: number; p95Ms: number; maxMs: number;
  cpuMs: number }; SessionSummary.sampleCount: number; SeriesBucket.samples, frameP50Ms, frameP95Ms, drawCalls,
  triangles: number.
- games/admin-profiler/src/data.ts (view types and liveSource), demo.ts (made-up data and `aggregate`),
  main.ts (layout, `panel`, `table`), series.ts (the time-series chart: how it uses `surface` from canvas.ts and the
  tooltip), canvas.ts (helpers `surface`, `fmtMs`, `fmtTime`, `niceStep`).

## Change
- data.ts:
  - ViewHitch gets `render?: { drawCalls: number; triangles: number; gpuMs: number; programs: number; pixelRatio: number }`
    and `frames?: { p50: number; p95: number; max: number; cpu: number; n: number }`. fromHitch fills them when
    h.render / h.frames are set.
  - ViewSession gets `samples: number` (from s.sampleCount).
  - ViewBucket gets `samples: number; frameP50: number; frameP95: number; drawCalls: number; triangles: number`; the
    live series maps them from b.samples, b.frameP50Ms, b.frameP95Ms, b.drawCalls, b.triangles.
  - Export `isSample(h: ViewHitch): boolean` (h.kind === 'sample').
- demo.ts: each demo session also gets a "sample" ViewHitch every 5 s of its span (kind 'sample', ms = p50, spans =
  a few systems with start 0, ctx with a region, render with drawCalls 150-1200 and triangles 0.3-2.5 M, frames with
  p50 14-40 and p95 a bit higher); `aggregate` skips samples for the hitch fields and fills the new bucket fields as
  means over the bucket's samples (0 when none); sessions' `samples` counts them.
- New file src/health.ts: `export function createHealthChart(host: HTMLElement, tip: HTMLElement): { set(buckets: ViewBucket[], bucketMs: number): void }`.
  A canvas chart (use `surface` from canvas.ts like series.ts does) over the same buckets as the series chart: two
  lines for frame p50 and p95 ms on the left axis, and draw calls as a third line on its own right-hand axis; buckets
  with samples 0 are gaps. Hover tooltip (same `tip` element style as series.ts) lists: time, samples, frame p50,
  p95, draw calls, triangles (formatted "1.2 M" / "640 k"). An empty state text "No frame samples in this range" when
  every bucket has samples 0.
- main.ts:
  - Add a panel "Frame health" right under the time-series panel, holding the health chart; call its `set` wherever
    the series chart gets new data.
  - The session timeline and every hitch list/table must ignore samples (filter with `!isSample(h)`), so nothing that
    exists today changes.
  - In the selected session, add a "Samples" panel (only when the session has samples): a `table` of its samples
    with columns time (fmtClock of `at`), region/context (join ctx values), frame p50, p95, CPU ms, draw calls,
    triangles, GPU ms (blank when 0), and the top 3 systems from spans ("traffic 2.1, render 4.0").
  - Where a selected frame hitch is shown (the frame Gantt panel title or its header), append
    "· N draw calls · T triangles" (and "· G ms GPU" when gpuMs > 0) when the hitch has render.
  - The sessions table gets a "Samples" column.
- viewer.test.ts: add tests that `aggregate` keeps samples out of hitches/p50 and that a bucket with two samples
  (drawCalls 100 and 300) gets drawCalls 200; and that fromHitch maps render and frames.

## Contract
Only games/admin-profiler/src/{data,demo,main,health,viewer.test}.ts change (health.ts is new). The generated
types above are fixed; do not edit packages/platform.

## Done when
- `npm run build -w games/admin-profiler` and `npm test -w games/admin-profiler` pass.
- With ?demo the page shows the Frame health chart and a Samples panel for a selected session (check by reading your
  code paths; there is no browser check required).

## Out of scope
packages/platform, packages/platform-server, packages/profiler, games/gnome-theft-auto.
~~~~

### 1C. Gnome Theft Auto `?perf` overlay

~~~~text
Epic: 1 Profiler backend
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a8075f8501c80e3d2 (a git worktree; never
commit). Node: `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash. Other workers and the planner edit other
files in games/gnome-theft-auto (app.ts, perf.ts, cull.ts, quality.ts) at the same time: create ONLY the file below.
Repo rule: UI modules append their own container to the shared `#ui` element; never restyle or hide `#ui`. Every game
plays on a phone: touch targets at least 44 px, safe-area insets.

## Goal
A small on-screen performance overlay module that the planner mounts when the URL has `?perf`.

## Read first
- packages/profiler/src/core.ts: the `LiveStats` and `RenderStats` interfaces (fps, frameMs, cpuMs, p95Ms,
  systems: [name, msPerFrame][], render: { drawCalls, triangles, geometries, textures, programs, gpuMs, pixelRatio } | null).
- games/gnome-theft-auto/src/hud.ts: only to see how this game builds DOM (document.createElement, inline styles or a
  <style> element); do not edit it.

## Change
- New file games/gnome-theft-auto/src/perfOverlay.ts exporting exactly:
  ```ts
  import type { LiveStats } from '@lawn/profiler';
  export interface PerfOverlay { destroy(): void }
  /** Mounts the ?perf overlay in `ui`. `read` gives the live stats (null until the first second); `extra` adds lines
   *  such as the quality tier or region (label -> value). Refreshes twice a second, not every frame. */
  export function mountPerfOverlay(ui: HTMLElement, read: () => LiveStats | null, extra?: () => Record<string, string | number>): PerfOverlay;
  ```
  - A container div id `gta-perf` appended to `ui`: position fixed, top `calc(env(safe-area-inset-top) + 64px)`,
    left `calc(env(safe-area-inset-left) + 8px)`, z-index 50, monospace 11px, light text on rgba(0,0,0,0.6), border
    radius 6px, padding 6px 8px, max-width min(260px, 70vw), pointer-events auto.
  - Lines: "FPS 58 · 17.2 ms (p95 24.0)", "CPU 6.1 ms · GPU 3.2 ms" (GPU only when render.gpuMs > 0),
    "Draws 412 · Tris 1.24 M", "Geo 380 · Tex 17 · Prog 23 · DPR 1.5", then each `extra` entry "label value", then
    the top 6 systems as rows "name  2.1" with a thin bar whose width is proportional to its ms (max of the 6 = full
    width). Number formatting: triangles as "640 k" below 1 M, else "1.24 M"; ms with one decimal.
  - FPS text colour: green at 50+, yellow 30-49, red under 30.
  - Tapping the overlay (a click listener on the container, which is at least 44 px tall) toggles a compact mode that
    shows only the first line.
  - setInterval 500 ms to refresh; destroy() clears it and removes the element. Build the system rows by reusing DOM
    nodes (keep 6 row elements and update their text and width), so a refresh does not create elements.
  - Before the first stats arrive show "perf: measuring...".

## Contract
The signature above, verbatim. No other file changes; the planner wires it from src/perf.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (errors in other files that you did not touch, from parallel
  work, are not yours; report them).

## Out of scope
Every other file in games/gnome-theft-auto, packages/profiler.
~~~~

## Planner work in epic 1 (not issues)

- `@lawn/profiler`: `section()`, `setRenderStats()`, 'sample' reports every 5 s, `setLive()` / `liveStats()`,
  `createGpuTimer()`; upload of render and frames.
- Proto, generated code, migration plan.
- GTA: `src/perf.ts` (initProfiler with region, vehicle, quest, quality context; renderer.info stats; GPU timer; the
  overlay), frame sections in `app.ts`, `measure()` around world build.
- GTA: `src/cull.ts` (distance culling by class, static props frozen, shadow casters by distance, cell-split static
  batches), `src/quality.ts` (tiers and the adaptive step), sun shadow camera follows tighter, scenery split per cell.
