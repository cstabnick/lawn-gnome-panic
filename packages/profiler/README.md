# @lawn/profiler

An opt-in hitch profiler for any game. **Off by default**: nothing is observed, logged or sent, `timed()` is a plain
function call and the other calls are one boolean check. Turn it on from the URL when you need to see a freeze.

Generalised from Gnomomia's `?hitches` profiler, which found the 1-2 s freezes in #196 (spike: #197).

## Turning it on

| URL | What it does |
| --- | --- |
| `?profile` | On for this page load; reports frames and long tasks of 80 ms or more |
| `?profile=50` | Same, 50 ms threshold |
| `?profile=upload` | Also sends the reports to the platform service, to view at `/admin/profiler/` (combine: `?profile=50,upload`) |
| `?profile=keep` | Remembers the setting on this device, for every game and every load (`?profile=50,upload,keep`) |
| `?profile=off` | Off, and forgets a kept setting |
| `?hitches[=ms]` | Old Gnomomia flag, same as `?profile[=ms]` |

To profile one player who reports stutter, send them a link with `?profile=upload,keep`: their next sessions report
until they open one with `?profile=off`.

## What you get

- A console warning per hitch: `[hitch] frame 1650ms: updateCompanions 1643ms, render 4ms [zone=mossbottom]`.
  Kinds: `frame` (an instrumented frame, with its systems), `longtask` (a long task outside such a frame: timers,
  network messages, promise callbacks), `gap` (a gap between animation frames, used only on browsers without longtask
  timing, such as Safari, and only for games that do not time their own frames), `mark` (one-off work you measured).
- In the console: `__lawnProfile.summary()` tables the worst systems across this load, `copy(__lawnProfile.json())`
  copies every report to paste into an issue.
- With `upload`: reports go to the platform service's `gnome.profile.v1.ProfileService/ReportHitches`
  (`proto/gnome/profile/v1/profile.proto`), stored in Postgres (`hitch_sessions`, `hitches`; kept 30 days), and shown
  by the viewer at **`/admin/profiler/`** (`games/admin-profiler`, sign-in required): a time series of hitch time by
  system, the worst sessions and systems, a session timeline and a per-frame Gantt of the timed systems. Each frame
  report carries every `timed()` call in order with its start in the frame (at most 64), so the Gantt shows what ran
  when. Anonymous: a random id per page load, the game, the build (`VITE_BUILD_ID`), the device class (GPU, cores,
  memory, touch, window size, user agent); no names, account ids or typed text. At most 300 reports per page load,
  batched every 10 s; the server rate-limits per address and keeps at most 500 per session. Needs a build with the
  platform service (`VITE_PLATFORM_URL`, `?platform=`, or localhost:8090).

## Adding it to a game

Nothing is required: a game that never imports this package is unaffected. To profile one:

```ts
import { beginFrame, endFrame, initProfiler, measure, timed } from '@lawn/profiler';

// Once, at the top of main.ts. The context getter only runs when a hitch is reported.
initProfiler('my-game', { context: () => ({ level: state.level }) });

function frame(): void {
  beginFrame();
  timed('physics', () => stepPhysics(dt));
  timed('render', () => renderer.render(scene, camera));
  endFrame();
}

// One-off work outside the frame:
measure('level load', () => buildLevel(data));
```

`initProfiler` alone (no `timed` calls) already reports long tasks and frame gaps, so one line is enough to start.
Wrap systems only when you need to know which one froze.

### Sections, render stats, samples and an overlay

```ts
import { createGpuTimer, liveStats, section, setLive, setRenderStats } from '@lawn/profiler';

// A long linear frame: name each part instead of wrapping it; endFrame closes the last one.
section('traffic'); traffic.update(dt);
section('render'); renderer.render(scene, camera);

// Renderer counters, read once per frame at endFrame (only while profiling or live).
const gpu = createGpuTimer(renderer.getContext()); // EXT_disjoint_timer_query_webgl2; lastMs stays 0 without it
setRenderStats(() => ({ drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
  geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
  programs: renderer.info.programs?.length ?? 0, gpuMs: gpu.lastMs, pixelRatio: renderer.getPixelRatio() }));

// An on-screen overlay without reporting anything: setLive(true), then read liveStats() (fps, frame / CPU ms, p95,
// ms per system, render counters for the last second).
```

While profiling is on, every 5 s the profiler also sends a `sample` report (kind `sample`, not a hitch): the window's
frame time p50 / p95 / max, mean CPU ms, the mean ms per frame of each system, and the mean render counters. A hitch
frame carries that frame's render counters. The viewer shows the samples as **Frame health** (frame p50 / p95 and draw
calls over time) and a **Samples** table per session. Server side they are stored apart from the hitch totals (at most
720 per session). Gnome Theft Auto wires all of this in `games/gnome-theft-auto/src/perf.ts` (`?perf` overlay).

Tests: `npm test -w packages/profiler`.

## Not done yet

- Remote targeting (sample N% of sessions, switch on a player from the server). Today it is the URL or `keep`.
- A role check on the viewer (today any signed-in account can view; `ProfileService.viewer` in
  `packages/platform-server/internal/service/profile.go` is the one place to add it).
- JS self-profiling (`Profiler` API) samples on a hitch for a stack-level breakdown.
