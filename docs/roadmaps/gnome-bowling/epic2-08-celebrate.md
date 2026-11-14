Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/celebrate.ts` shows a big, silly, animated full-screen result card after every ball, in the spirit of a TV bowling show: STRIKE!, DOUBLE!, TURKEY!, HAMBONE!, SPARE!, GUTTER BALL, SPLIT!, and so on. This is the most visible fun of the game: make each one feel different.

## Read first
- `games/gnome-bowling/src/config.ts`: `ResultKind`, `BallResult`, `ROUND`, `GameState`, `Player`
- `games/gnome-bowling/src/game.ts`: `currentPlayer`

## Change
- `games/gnome-bowling/src/celebrate.ts`: `createCelebrate(ctx): System`. Container `#bx-root` in `ctx.ui` (absolutely positioned, inset 0, pointer-events none). All CSS (one `<style>` tag with `@keyframes`) selectors start with `#bx-`.

## Behaviour
- When `state.phase === 'result'` and `state.result.serial` differs from the last one shown, build the card for `state.result.kind`; remove it (fade 0.25 s) when the phase leaves 'result'. Nothing in other phases.
- The bowler's name (`state.players[result.player].name`) and colour appear small under the headline on every card.
- Cards (headline text, sub-line, animation, decoration). Use CSS animations and DOM elements only (no canvas needed); keep ≤ 150 elements:
  - **strike**: "STRIKE!" huge (min(18vw, 140px)), italic 900, gold with a thick dark-purple text outline (`-webkit-text-stroke` + layered `text-shadow`), slams in from scale 3 → 1 with a bounce and a screen-shake of the container; a burst of 60 confetti pieces (small coloured rectangles flying outward from the centre with random rotation, falling with gravity via keyframes using CSS variables per piece); radiating sunburst rays behind (a rotating `repeating-conic-gradient` circle, pink/gold). Sub-line: "ALL TEN GNOMES DOWN".
  - **double**: "DOUBLE!" with two little strike "X" badges popping in one after the other, cyan/gold. Sub: "Two in a row!".
  - **turkey**: "TURKEY!" plus a turkey made of emoji (🦃) that struts across the bottom of the screen and a gobble wobble on the text; confetti in autumn colours. Sub: "Three strikes! Gobble gobble!".
  - **hambone**: "HAMBONE!!" with 🍖 raining down (20 falling emoji), rainbow-cycling text (`hue-rotate` animation). Sub: "<n> strikes in a row" where n = number of trailing strikes: count 'X' marks from the end of `frameMarks(players[result.player].rolls).flat()` (import `frameMarks` from './scoring').
  - **spare**: "SPARE!" sweeps in from the left with a speed-line trail, a big cyan "/" slash draws across behind it (animate a rotated bar's width). Sub: "Cleaned up!".
  - **gutter**: "GUTTER BALL" drops in and droops (rotate 8° and sag, desaturated grey-blue), a sad 🙈 gnome-face emoji slides up from the bottom, a little rain of 💧. Sub picked at random from: "The gutter gnomes thank you", "Into the drain!", "Nice try, pal".
  - **miss**: "MISS!" shakes side to side; sub: "Not a single gnome flinched".
  - **split**: "SPLIT!" — the text splits in two halves that slide apart left and right (two copies clipped with `clip-path: inset(...)`), with a crack line; sub: "Good luck with that…".
  - **nine**: "9 PINS!" — "So close!" with one wobbling pin emoji 🎳 that refuses to fall.
  - **pins**: smaller, quick: "<count> PINS" (or "1 PIN") pops in then out, no full-screen overlay; for count 0 on a second ball that is not a gutter use the miss card.
- A semi-transparent radial vignette behind big cards (strike kinds, spare, gutter, split) so text reads over the 3D view; small cards (pins, nine) have no vignette.
- Must look right on 390x844 portrait and 844x390 landscape (use vw/vh/min() for sizes). Use `prefers-reduced-motion: reduce` to drop the shake and confetti.

## Contract
`export function createCelebrate(ctx: Ctx): System`. Nothing else exported. Sounds and voices for results are played by audio.ts, not here.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in celebrate.ts
- Each ResultKind shows its own animated card during 'result' and clears afterwards.

## Out of scope
hud.ts (scoreboard, banners), audio. Do not edit any other file.
