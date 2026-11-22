# @lawn/profiler

An opt-in hitch profiler for any game. **Off by default**: nothing is observed, logged or sent, `timed()` is a plain
function call and the other calls are one boolean check. Turn it on from the URL when you need to see a freeze.

Generalised from Gnomomia's `?hitches` profiler, which found the 1-2 s freezes in #196 (spike: #197).

## Turning it on

| URL | What it does |
| --- | --- |
| `?profile` | On for this page load; reports frames and long tasks of 80 ms or more |
| `?profile=50` | Same, 50 ms threshold |
| `?profile=upload` | Also sends the reports to the mp-server (combine: `?profile=50,upload`) |
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
- With `upload`: each report becomes an anonymous `hitch` event on the mp-server's telemetry intake (`POST /t`, see
  `packages/mp/src/protocol.ts`), so it lands in the server's log and OTLP export with everything else. Fields: `game`,
  `kind`, `ms`, `top` (systems and ms), `where` (the context), `gpu`, `touch`, `cores`, `mem`. The ids are random per
  page load; no names, account ids or typed text. At most 60 reports per page load, batched every 15 s; the server
  rate-limits per address. Needs a build with an mp-server (`VITE_MP_URL`, `?mp=`, or localhost).

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

Tests: `npm test -w packages/profiler`.

## Not done yet

- Remote targeting (sample N% of sessions, switch on a player from the server). Today it is the URL or `keep`.
- A query or view of the worst systems across all players; for now, filter the server log for `event.name=hitch`.
- JS self-profiling (`Profiler` API) samples on a hitch for a stack-level breakdown.
