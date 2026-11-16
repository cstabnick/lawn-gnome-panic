# Recording demos

`tools/record-demo.mjs` plays a scripted timeline of key presses into a running game in headless Chrome or Edge, and saves the result as an MP4, or a GIF with `--gif`. Use it for clips to attach to PRs.

## Record one

```sh
npm run dev -w games/sample-3d                                   # terminal 1: the game must be running
npm run demo -- games/sample-3d/demos/double-jump.json           # terminal 2: writes demos/out/double-jump.mp4
npm run demo -- games/sample-3d/demos/double-jump.json --gif     # GIF instead
```

Output goes to `games/<name>/demos/out/`, which is gitignored. To use another port or file, pass `--url http://localhost:5180/` or `--out path.mp4`. If Chrome or Edge is installed somewhere unusual, set `DEMO_BROWSER` to its path.

The clips have no sound.

## Put a demo in a PR description

```sh
npm run demo -- games/sample-3d/demos/double-jump.json --pr 12 --title "Double jump with front flip"
```

`--pr <n>` records a GIF and commits it to a `demo-assets` branch of the repo the PR comes from (your fork, or the main repo), creating that branch if needed. It then adds the GIF to a `## Demo` section of the PR description with `gh pr edit`. It needs the `gh` CLI, logged in with push access to the PR's source repo.

- **Re-running is safe.** Each demo gets its own marked block (`<!-- demo:<name> -->`), so recording the same demo again replaces it in place. A different demo is added below the existing ones.
- **The target repo** is the `origin` remote. Pass `--repo owner/name` to override it.
- **The caption** is `--title`, else the demo file's `"title"`, else the file name.
- **Why a GIF:** GitHub only plays a video in a PR if it was uploaded through the web editor, which needs a logged-in browser and isn't possible with `gh`. Images from any URL display inline. Keep clips to about 3–5 s: a GIF runs about 1 MB per second at 640×400, and the tool warns when one passes 8 MB.
- **Full-quality video:** record an MP4 and drag it into a PR comment by hand. GitHub turns it into a `user-attachments` link with a player.

## Write one

A demo is a JSON file in `games/<name>/demos/`:

```json
{
  "setup": { "autostart": "solo", "sandbox": true, "nohud": true, "at": "0,0", "time": 0.25, "cam": "side" },
  "warmup": 2.5,
  "duration": 4,
  "steps": [
    { "t": 0.4, "press": "jump" },
    { "t": 0.67, "press": "jump" },
    { "t": 1.5, "hold": "forward", "for": 1.0 }
  ]
}
```

| Field | Meaning |
|---|---|
| `setup` | Becomes the page's query string. `true` adds a bare flag; `false` or `null` leaves the key out. |
| `url` | The page to load. The default is `http://localhost:5174/`. |
| `title` | Caption used by `--pr`. |
| `warmup` | Seconds to wait after the page loads before recording starts. Default 2.5. |
| `duration` | Seconds to record. The default is the end of the last step plus 1. |
| `size`, `fps` | Frame size and rate. The MP4 default is `[960, 600]` at 30; the GIF default is `[640, 400]` at 25. |
| `steps` | `t` is in seconds from the start of recording. `press` taps a key for 60 ms; `hold` holds it down `for` seconds. |

The actions are `jump`, `forward`, `back`, `left`, `right`, `sprint`, `turnLeft` and `turnRight`. You can also give any `KeyboardEvent.code`, such as `"KeyF"`. Movement is relative to the camera, so with `cam: side`, `forward` walks across the screen away from the camera.

## Setup options in the 3D game (`games/sample-3d`)

| Param | Effect |
|---|---|
| `autostart=solo` | Skips the lobby. Required for the other options below. |
| `sandbox` | Empty lawn: no mowers, waves or boss. |
| `nohud` | Hides the HUD and buttons. |
| `cam=back\|side\|front\|top\|first` or `cam=<deg>` | Camera position around the gnome. |
| `facing=<deg>` | The gnome's heading. |
| `at=x,z` | Start position. |
| `time=0..1` | Time of day: 0 is sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight. |
| `character=<id>` | Which gnome to play. |

## Tips

- In the 3D game a double jump peaks after about 0.33 s, so a second `press` about 0.27 s after the first lands near the top of the jump.
- If the recorder warns about low fps, the browser couldn't keep up and the clip will stutter. Use a smaller `size` or close other apps.
- The page must not log errors. The recorder fails the run if it does, so a demo also works as a smoke test.
