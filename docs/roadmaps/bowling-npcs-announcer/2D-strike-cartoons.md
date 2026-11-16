Epic: 2 Features
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\bowling-npcs` (a git worktree). Work only inside it. Game: `games/gnome-bowling` (TypeScript + Vite). In Git Bash, if node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Five other workers are editing other files in this same game at the same time. Change only the files listed under Change. Do not run `vite build` / `npm run build`, and do not run any git command that writes (commit, stash, checkout, reset).
- Type-check: `cd games/gnome-bowling && npx tsc --noEmit -p .` . An error in a file you do not own is another worker mid-edit: ignore it and mention it in your report.
- A dev server is already running at http://localhost:5291/ . Do not start or stop a server.
- Screenshot a cartoon frame (headless Edge, canvas 2D works fine):
  `bash /c/Users/cpsai/.claude/jobs/f4225e05/tmp/shot.sh "http://localhost:5291/#mute&preview=<cartoon-id>&at=<seconds>" "C:\Users\cpsai\.claude\jobs\f4225e05\tmp\2D-<cartoon-id>-<seconds>.png" 1500`
  then use the Read tool on that .png to look at it. `#preview=<id>` shows the cartoon over everything as a strike by "Gnorman"; `&at=1.2` freezes it at t = 1.2 s.
- Rules: no external assets; everything is drawn in code.

## Goal
Two more strike cartoons, `kaboom` and `panic-run`, in `src/cartoons/strike.ts`, next to the existing `bowled-over`. They play on a vintage bowling-alley score monitor (a 160 x 120 pixel canvas, scaled up with crisp pixels) after a strike or a double.

## Read first
- `games/gnome-bowling/src/cartoons/types.ts`: the `Cartoon` and `CartoonInfo` contract, `CRT_W` = 160, `CRT_H` = 120.
- `games/gnome-bowling/src/cartoons/crt.ts`: every drawing helper you should use (palette `PAL`, `clear`, `rect`, `circle`, `tri`, `star`, `sunburst`, `lane`, `text`, `slamText`, `headline`, `gnomePin`, `ball`, `pinRack`, `scanSweep`, and timing: `seg`, `lerp`, `easeIn/easeOut/easeInOut/easeBack`, `hop`, `stepT`, `rng`).
- `games/gnome-bowling/src/cartoons/strike.ts`: the working example `bowled-over`. Copy its structure.

## Change
- `games/gnome-bowling/src/cartoons/strike.ts` only. Add two `const` cartoons and append them: `export const STRIKE_CARTOONS: Cartoon[] = [bowledOver, kaboom, panicRun];`. Do not change `bowledOver`.

Both: `kinds: ['strike', 'double']`. Total length: `info.duration` is about 3.95 s; finish each gag by ~3.2 s and hold the end pose. Start each draw with `const T = stepT(t, 12);` (choppy vintage frame rate) and use T for motion. Use `headline(info)` for the big word (it is 'STRIKE!' or 'DOUBLE!'), and draw `info.name.toUpperCase()` near the bottom (y about 104, size 10, colour `info.color`) once the headline is up. Call `scanSweep(g, t)` last. Randomness only from `rng(info.seed)`, created fresh inside draw (draw must not keep state between calls).

1. `kaboom` ("Ka-Boom"):
   - 0 to 0.9 s: `clear` + `lane(g, 40)`; the rack `pinRack(g, 80, 52, 0.55, 'sweat')` (faces turn `'scared'` after 0.5 s). A black ball (`ball(g, x, y, r, rot, PAL.black)`) with a fuse: a short brown line on top and a flickering spark (`star` in yellow/orange, alternating every frame) rolls up the lane from (80, 122, r 14) to (80, 50, r 5).
   - 0.9 to 1.0 s: full-screen white flash (`clear(g, PAL.white)` and nothing else).
   - 1.0 to 1.7 s: an explosion at (80, 48): 4 to 6 filled circles in PAL.white, PAL.yellow, PAL.orange, PAL.red with radii growing from 0 to 30-60 over the time, drawn largest/darkest first; `slamText(g, 'KA-BOOM!', 80, 60, 22, PAL.orange, T, 1.0)` until 1.8 s.
   - 1.6 s onward: the ten gnome pins fall from the top of the screen (start y about -10, staggered by rng, falling with easeIn) onto a messy pile at the lane's end (x 50..110, y 56..64), rotated at random angles (`rot` between -1.6 and 1.6), face `'dizzy'`, with grey smoke puffs (`circle`, PAL.grey) drifting upward.
   - From 1.9 s: `slamText(g, headline(info), 80, 24, 24, PAL.yellow, T, 1.9)`, name from 2.4 s.
2. `panicRun` ("Panic Run"), id `'panic-run'`:
   - 0 to 0.6 s: `lane(g, 40)`; the ten pins (use the same SPOTS layout as bowledOver: x = 80 + sx * 5.5, y = 52 - row * 3, scale 0.55) are calm, face `'happy'`.
   - 0.6 to 1.0 s: a yellow `'!'` (`text(..., 10, PAL.yellow)`) pops above every pin's hat; faces `'scared'`; a huge ball face (`ball(..., PAL.blue, true)`) appears at the bottom (80, 130, r 26) and starts rolling up.
   - 1.0 to 2.2 s: pins run sideways off screen: pins with sx < 0 run left, sx > 0 run right (pin 0 and pin 4 have sx 0: they do not escape). Running = x moves at 60-90 px/s (rng per pin), a little hop (`hop`), and two tiny leg rects (2 x 3 px, PAL.black) under the base alternating every frame. The ball rolls up to (80, 56, r 10) by 1.6 s and pin 0 and pin 4 get flattened: `squash` goes from 1 to 0.25 with face `'dizzy'`.
   - From 2.0 s: `slamText(g, headline(info), 80, 24, 24, PAL.yellow, T, 2.0)`; the two flat pins wobble back up a little (squash 0.25 to 0.5, bounce) at 2.8-3.2 s. Name from 2.5 s.

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
Keep `export const STRIKE_CARTOONS: Cartoon[]` with that exact name and type; `cartoons/index.ts` imports it.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` has no errors in `src/cartoons/strike.ts`.
- You took screenshots of `#preview=kaboom` at at=0.5, 1.2, 2.5 and `#preview=panic-run` at at=0.4, 1.4, 2.6, looked at each, and they show what is described (pins visible and recognisable, headline readable, nothing drawn off in a corner by mistake). Fix and re-shoot until they do. List the png paths in your report.
- `#preview=bowled-over&at=1.1` still looks as before (pins flying).

## Out of scope
Every other file. In particular `crt.ts`, `types.ts`, `index.ts`, `turkey.ts`, `spare.ts`, `gutter.ts` and `celebrate.ts` belong to other people. If a helper you want is missing from crt.ts, write a small private function inside strike.ts.
