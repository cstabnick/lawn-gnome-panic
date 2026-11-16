Epic: 2 Features
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\bowling-npcs` (a git worktree). Work only inside it. Game: `games/gnome-bowling` (TypeScript + Vite). In Git Bash, if node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Five other workers are editing other files in this same game at the same time. Change only the files listed under Change. Do not run `vite build` / `npm run build`, and do not run any git command that writes (commit, stash, checkout, reset).
- Type-check: `cd games/gnome-bowling && npx tsc --noEmit -p .` . An error in a file you do not own is another worker mid-edit: ignore it and mention it in your report.
- A dev server is already running at http://localhost:5291/ . Do not start or stop a server.
- Screenshot a cartoon frame (headless Edge, canvas 2D works fine):
  `bash /c/Users/cpsai/.claude/jobs/f4225e05/tmp/shot.sh "http://localhost:5291/#mute&preview=<cartoon-id>&at=<seconds>" "C:\Users\cpsai\.claude\jobs\f4225e05\tmp\2E-<cartoon-id>-<seconds>.png" 1500`
  then use the Read tool on that .png to look at it. `#preview=<id>` shows the cartoon over everything by "Gnorman", as the first kind in its `kinds` list (a 'turkey' preview has `info.streak` = 3, a 'hambone' preview 5); `&at=1.2` freezes it at t = 1.2 s.
- Rules: no external assets; everything is drawn in code.

## Goal
Two turkey cartoons in `src/cartoons/turkey.ts`: `turkey-on-turkey` (turkeys stack one on top of the other, one per strike in the streak) and `turkey-trot` (a turkey in bowling shoes struts across). They play on a vintage bowling-alley score monitor (a 160 x 120 pixel canvas, scaled up with crisp pixels) after three or more strikes in a row.

## Read first
- `games/gnome-bowling/src/cartoons/types.ts`: the `Cartoon` and `CartoonInfo` contract, `CRT_W` = 160, `CRT_H` = 120. `info.streak` = strikes in a row (3 for a turkey, 4+ for a hambone).
- `games/gnome-bowling/src/cartoons/crt.ts`: every drawing helper you should use (palette `PAL`, `clear`, `rect`, `circle`, `tri`, `star`, `sunburst`, `lane`, `text`, `slamText`, `headline`, `gnomePin`, `ball`, `pinRack`, `scanSweep`, and timing: `seg`, `lerp`, `easeIn/easeOut/easeInOut/easeBack`, `hop`, `stepT`, `rng`).
- `games/gnome-bowling/src/cartoons/strike.ts`: a working example cartoon (`bowled-over`). Copy its structure.
- `games/gnome-bowling/src/cartoons/turkey.ts`: the stub you replace.

## Change
- `games/gnome-bowling/src/cartoons/turkey.ts` only. End with `export const TURKEY_CARTOONS: Cartoon[] = [turkeyOnTurkey, turkeyTrot];`.

General: `info.duration` is about 3.95 s; finish each gag by ~3.3 s and hold the end pose. Start each draw with `const T = stepT(t, 10);` and use T for motion. Use `headline(info)` for the big word ('TURKEY!' or 'HAMBONE!'). Draw `info.name.toUpperCase()` (size 10, colour `info.color`) near the bottom once the headline is up. Call `scanSweep(g, t)` last. Randomness only from `rng(info.seed)`, created fresh inside draw (draw must not keep state between calls).

1. A private helper `function turkey(g: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number, hat: boolean): void` drawing a cartoon turkey standing with its feet at (x, y), about 26 px tall at s = 1: a fan tail behind (5 to 7 feathers as `tri`s or ellipses in PAL.red, PAL.orange, PAL.yellow, PAL.brown spread in a half circle above the body), a round PAL.brown body (`circle`), a small head (PAL.tan) on a neck, a PAL.orange beak `tri`, a PAL.red wattle, a black eye dot, two PAL.orange legs. `frame` (an integer) alternates the legs and tilts the head for walking/gobbling. `hat` adds a red gnome hat (`tri`, PAL.red) on the head. Use `g.save(); g.translate(x, y); g.scale(s, s); ... g.restore();`.
2. `turkeyOnTurkey`, id `'turkey-on-turkey'`, `kinds: ['turkey', 'hambone']`:
   - Background: `sunburst(g, 80, 70, T, PAL.brown, PAL.orange)`; a floor strip `rect(g, 0, 100, 160, 20, PAL.navy)`.
   - n = `Math.min(Math.max(info.streak, 3), 6)` turkeys. Turkey i (0 = bottom) drops from above the screen and lands at time 0.25 + i * 0.45 s on top of the stack (each turkey stands on the one below: feet y = 100 - i * 18 * scale; with n > 4 shrink the scale so the stack fits under y = 34). Fall with easeIn, land with a little squash of the turkey below (scale its y down ~15 % for 0.1 s).
   - On each landing a white speech bubble (`rect` + small `tri` tail) with 'GOBBLE!' (text size 7, PAL.black) pops beside the stack for 0.35 s, alternating left and right sides.
   - The top turkey wears the gnome hat. After the last lands, the whole stack sways gently (each turkey's x offset = sin(T * 4 + i) * i * 0.8).
   - After the last landing + 0.3 s: `slamText(g, headline(info), 80, 18, 20, PAL.yellow, T, tHead)`, and `${info.streak} IN A ROW!` (size 9, PAL.white) under it 0.3 s later. Name at the bottom.
3. `turkeyTrot`, id `'turkey-trot'`, `kinds: ['turkey']`:
   - Background: `clear(g, PAL.black)`, `lane(g, 40)`, the rack `pinRack(g, 80, 52, 0.5, 'scared')` at the back.
   - Three strike marks pop in at the top, one every 0.35 s from 0.2 s: each a 16 x 16 PAL.white box with a red 'X' (text size 12, PAL.red) at x = 56, 80, 104, y = 14, popping with `easeBack`.
   - From 0.6 s to 2.8 s a large turkey (s = 1.4) with the hat struts from x = -20 to x = 180 along y = 104, bobbing with `hop` every step (frame = Math.floor(T * 8)). Small white bowling shoes on its feet (2 `rect`s, PAL.white with a PAL.red stripe). As it passes x = 80, the rack's pins fall: from that moment draw the rack with all 10 in `down` and instead draw 10 tipped pins (`gnomePin` with rot = +/-1.4, face 'dizzy') lying at the back.
   - From 2.4 s: `slamText(g, headline(info), 80, 60, 24, PAL.orange, T, 2.4)` and 'GOBBLE GOBBLE!' (size 8, PAL.yellow) under it at 2.8 s. Name at the bottom.

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
Keep `export const TURKEY_CARTOONS: Cartoon[]` with that exact name and type; `cartoons/index.ts` imports it.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` has no errors in `src/cartoons/turkey.ts`.
- You took screenshots of `#preview=turkey-on-turkey` at at=0.5, 1.4, 2.6 and `#preview=turkey-trot` at at=0.5, 1.6, 3.0, looked at each, and they show what is described (turkeys clearly recognisable as turkeys, the stack sits on the floor and fits on screen, headline readable). Fix and re-shoot until they do. List the png paths in your report.

## Out of scope
Every other file. In particular `crt.ts`, `types.ts`, `index.ts`, `strike.ts`, `spare.ts`, `gutter.ts` and `celebrate.ts` belong to other people. If a helper you want is missing from crt.ts, write a small private function inside turkey.ts.
