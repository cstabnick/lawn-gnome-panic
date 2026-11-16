Epic: 2 Features
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\bowling-npcs` (a git worktree). Work only inside it. Game: `games/gnome-bowling` (TypeScript + Vite). In Git Bash, if node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Five other workers are editing other files in this same game at the same time. Change only the files listed under Change. Do not run `vite build` / `npm run build`, and do not run any git command that writes (commit, stash, checkout, reset).
- Type-check: `cd games/gnome-bowling && npx tsc --noEmit -p .` . An error in a file you do not own is another worker mid-edit: ignore it and mention it in your report.
- A dev server is already running at http://localhost:5291/ . Do not start or stop a server.
- Screenshot a cartoon frame (headless Edge, canvas 2D works fine):
  `bash /c/Users/cpsai/.claude/jobs/f4225e05/tmp/shot.sh "http://localhost:5291/#mute&preview=<cartoon-id>&at=<seconds>" "C:\Users\cpsai\.claude\jobs\f4225e05\tmp\2F-<cartoon-id>-<seconds>.png" 1500`
  then use the Read tool on that .png to look at it. `#preview=<id>` shows the cartoon over everything by "Gnorman", as the first kind in its `kinds` list (count 0 for 'gutter'/'miss', else 10); `&at=1.2` freezes it at t = 1.2 s.
- Rules: no external assets; everything is drawn in code.

## Goal
Two spare cartoons (`last-gnome-standing`, `clean-sweep`) in `src/cartoons/spare.ts` and one gutter cartoon (`gutter-gator`) in `src/cartoons/gutter.ts`. They play on a vintage bowling-alley score monitor (a 160 x 120 pixel canvas, scaled up with crisp pixels).

## Read first
- `games/gnome-bowling/src/cartoons/types.ts`: the `Cartoon` and `CartoonInfo` contract, `CRT_W` = 160, `CRT_H` = 120.
- `games/gnome-bowling/src/cartoons/crt.ts`: every drawing helper you should use (palette `PAL`, `clear`, `rect`, `circle`, `tri`, `star`, `sunburst`, `lane`, `text`, `slamText`, `headline`, `gnomePin`, `ball`, `pinRack`, `scanSweep`, and timing: `seg`, `lerp`, `easeIn/easeOut/easeInOut/easeBack`, `hop`, `stepT`, `rng`).
- `games/gnome-bowling/src/cartoons/strike.ts`: a working example cartoon (`bowled-over`). Copy its structure.
- `games/gnome-bowling/src/cartoons/spare.ts` and `gutter.ts`: the stubs you replace.

## Change
- `games/gnome-bowling/src/cartoons/spare.ts`: end with `export const SPARE_CARTOONS: Cartoon[] = [lastGnomeStanding, cleanSweep];`
- `games/gnome-bowling/src/cartoons/gutter.ts`: end with `export const GUTTER_CARTOONS: Cartoon[] = [gutterGator];`

General: `info.duration` is about 3.95 s; finish each gag by ~3.2 s and hold the end pose. Start each draw with `const T = stepT(t, 12);` and use T for motion. Use `headline(info)` for the big word ('SPARE!', 'GUTTER BALL' or 'MISS!'). Draw `info.name.toUpperCase()` (size 10, colour `info.color`) near the bottom (y about 104) once the headline is up. Call `scanSweep(g, t)` last. Randomness only from `rng(info.seed)`, created fresh inside draw (draw must not keep state between calls).

1. `lastGnomeStanding`, id `'last-gnome-standing'`, `kinds: ['spare']`:
   - `clear(g, PAL.black)`, `lane(g, 40)`. One gnome pin alone at (80, 58), scale 1.1, face `'sweat'`, looking left and right (`flip` toggles every 0.3 s) and trembling (x +/- 1 px every frame) from 0 to 1.2 s. '1 LEFT...' (size 9, PAL.white) at the top from 0.2 to 1.1 s.
   - At 1.0 s the face becomes `'scared'`; at 1.1 to 1.3 s a ball (`ball(..., PAL.pink, true)`, r 8) shoots in from the left edge (x -10) to the pin with 3 white speed lines (`rect` 20 x 1) trailing behind it.
   - 1.3 s: hit. Three `star`s burst at the pin; the pin flies up and off the top right, spinning (`rot` grows, face 'dizzy'), gone by 1.8 s; the ball continues off the right edge. At 2.0 s a twinkle (`star`, PAL.white, growing then shrinking over 0.3 s) where it left the screen (about x 150, y 4).
   - From 1.6 s: `slamText(g, headline(info), 80, 30, 24, PAL.cyan, T, 1.6)`. Name from 2.1 s.
2. `cleanSweep`, id `'clean-sweep'`, `kinds: ['spare']`:
   - `clear(g, PAL.black)`, `lane(g, 40)`. n = 2 + floor(rng * 3) leftover pins (scale 0.8, face `'smug'`) at x positions spread between 50 and 110, y 60.
   - 0.4 to 2.2 s: a giant broom sweeps from the right edge to past the left edge: a long PAL.brown handle (`rect` 4 x 70, slightly tilted with g.rotate) and a PAL.yellow bristle head (`rect` 30 x 14 with darker PAL.orange stripes) at the bottom, at y about 50-64. Each pin, when the broom reaches it, is pushed along in front of the bristles (x = broom x - 18 - i * 4), tilting (rot -0.6) with face `'scared'`, and leaves the screen with the broom. Grey dust clouds (`circle`, PAL.grey, 3 to 6 px, fading by shrinking) puff behind the broom.
   - From 2.0 s: `slamText(g, headline(info), 80, 30, 24, PAL.cyan, T, 2.0)`, 'CLEAN SWEEP!' (size 9, PAL.yellow) under it at 2.4 s. Name at the bottom.
3. `gutterGator`, id `'gutter-gator'`, `kinds: ['gutter', 'miss']`:
   - Side view. `clear(g, PAL.navy)`; the lane is a horizontal PAL.tan strip `rect(g, 0, 70, 160, 8, PAL.tan)`; the gutter a dark channel `rect(g, 0, 78, 160, 10, PAL.black)` below it with a PAL.grey rim line. At the right end (x 130-150) three gnome pins stand on the lane (scale 0.7, face 'happy').
   - 0 to 1.0 s: a ball (`ball(..., PAL.blue, true)`, r 6) rolls in from the left along the lane top (y 64), wobbling, and at 0.6 s drops down into the gutter channel (y 82), now with a worried look: draw it without the face (`face` false) and with a small PAL.cyan sweat drop.
   - 1.0 to 1.4 s: an alligator rises out of the gutter at x about 95: a long PAL.green head with two triangle jaws (upper jaw rotates open up to ~0.8 rad), white zig-zag teeth (`tri`s), two eyes on top (white circle, black dot). At 1.4 s the jaws snap shut on the ball ('CHOMP!' size 12, PAL.white with PAL.green outline is not available: use `text(g, 'CHOMP!', 95, 50, 12, PAL.white)`). The ball is gone.
   - 1.8 s: the gator sinks back into the gutter; 'BURP!' (size 8, PAL.yellow) floats up from it at 2.0 to 2.6 s.
   - From 1.6 s: the pins bounce with laughter (`hop` every 0.25 s) and from 2.2 s: `slamText(g, headline(info), 80, 24, 18, PAL.grey, T, 2.2)`. Name at the bottom.

## Contract
Unchanged, from `types.ts`:
```ts
export interface Cartoon {
  id: string;
  kinds: readonly ResultKind[];
  weight?: number;
  draw(g: CanvasRenderingContext2D, t: number, info: CartoonInfo): void;
}
```
Keep `export const SPARE_CARTOONS: Cartoon[]` and `export const GUTTER_CARTOONS: Cartoon[]` with those exact names and types; `cartoons/index.ts` imports them.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` has no errors in `src/cartoons/spare.ts` or `src/cartoons/gutter.ts`.
- You took screenshots of `#preview=last-gnome-standing` at at=0.5, 1.4, 2.5, `#preview=clean-sweep` at at=0.3, 1.2, 2.6, and `#preview=gutter-gator` at at=0.8, 1.4, 2.6, looked at each, and they show what is described (pins, broom, gator clearly recognisable, headline readable). Fix and re-shoot until they do. List the png paths in your report.

## Out of scope
Every other file. In particular `crt.ts`, `types.ts`, `index.ts`, `strike.ts`, `turkey.ts` and `celebrate.ts` belong to other people. If a helper you want is missing from crt.ts, write a small private function inside your own file.
