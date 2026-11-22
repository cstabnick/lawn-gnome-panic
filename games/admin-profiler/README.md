# Hitch Profiler (admin viewer)

The viewer for the hitch reports games upload with `@lawn/profiler` (`?profile=upload`). Not a game: it is unlisted,
has no arcade overlay and is served at **`/admin/profiler/`** (`"lawn": { "unlisted": true, "path": "admin/profiler" }`
in package.json, handled by `tools/build-site.mjs`).

Sign-in is required (Keycloak through `@lawn/platform`, the same session as `/me/`). Any signed-in account can view
for now; the role check goes in `ProfileService.viewer` in `packages/platform-server/internal/service/profile.go`.

## What it shows

- **Summary**: hitches, total frozen time, typical p95, worst hitch, top system for the game and range.
- **Hitches over time**: hitch time per bucket stacked by system, and hitch duration (p50 / p95 / max) over hitch
  counts with the threshold. Drag across it to zoom into a window; double-click resets. Legend entries toggle systems.
- **Sessions** (worst first) and **Worst systems** (time spent inside hitches), sortable.
- **Session timeline**: one page load's hitches on its own clock: a frame-time spike lane, the zone (context) lane and
  one lane per kind (frames, long tasks, gaps, marks). Wheel / pinch zoom, drag pan, W S A D, F or double-click fits.
- **Frame breakdown**: the selected hitch's timed systems as a Gantt on the frame clock, nested calls stacked, with
  60 fps / 30 fps / threshold guides, plus the per-system table. J / K step through the session's hitches.

The game, range, zoom window, session and hitch live in the URL hash, so a view can be linked.

## Run

```bash
npm run dev -w games/admin-profiler        # http://localhost:5205/?demo  (made-up data, no sign-in)
```

Live data needs the platform service (`packages/platform-server/README.md`, port 8090) and a signed-in session.
Keycloak's `gnome-web` client must list the viewer's URL as a redirect URI to sign in from this page; on the site it
shares the origin with `/me/`, so signing in there works too.

Tests: `npm test -w games/admin-profiler` (span layout, series aggregation, device labels).
Mobile: the layout stacks to one column, tables scroll inside their panels, the timelines take touch pan and pinch.
Not online (a viewer) and no player gnome or achievements (a tool, not a game).
