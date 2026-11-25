Epic: E07 step 1 · Issue 06 talking-head pop-ups on phones (L89)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, rules).

## Goal
The comms / talking-head card (`#gta-briefing`) leaves at least 60 percent of the view free on a phone. Portrait
(390x844): a compact strip at most 28 percent of the viewport height, scrollable text, icon Skip/Next buttons of 44 px.
Landscape phone (844x390): a short strip as well. Desktop unchanged. Also: the typing speed follows the Options
"Text speed" setting instead of the hard-coded 40 chars/s.

## Read first
- `games/gnome-theft-auto/src/briefing/briefing.ts` (353 lines): `STYLE` (~line 56-96): desktop card at
  `bottom: 150px`, `@media (max-width:700px)` puts it at `top: 300px` below the minimap with a 56 px ring, 13 px text
  and `min-height: 4.2em`; `@media (max-height:500px)` is the landscape variant (`width: min(440px, 52vw)`). The card
  is title row (ring + portrait 62 px + tag + name) + `.gb-text` + `.gb-actions` (Skip / Next buttons). `const
  CHARS_PER_SECOND = 40;` (~line 44) is used at ~line 340 (`acc += dt * CHARS_PER_SECOND`).
- `games/gnome-theft-auto/src/cutscene/textSpeed.ts`: `getTextSpeed(): TextSpeed` and
  `CHARS_PER_SECOND: Record<TextSpeed, number>` (slow 22, normal 40, fast 75, instant Infinity).

## Change (only `games/gnome-theft-auto/src/briefing/briefing.ts`)
- Typing: replace the constant with `CHARS_PER_SECOND[getTextSpeed()]` read when a line starts (import from
  `../cutscene/textSpeed`; rename the local constant away to avoid the clash). `Infinity` must show the whole line at
  once (check the loop handles it: no NaN, no endless loop).
- Portrait phones `@media (max-width:700px) and (orientation:portrait)`: one compact strip under the minimap: the
  ring 40 px (portrait 36 px) on the left, tag + name on one line beside it, text below at 13 px (never smaller),
  `max-height: 28vh` on the card with the text block `overflow-y:auto` (`touch-action: pan-y` on it, since `#ui *`
  sets `touch-action:none`), Skip and Next as 44x44 round icon buttons (`⏭` skip, `›` next; keep their
  `aria-label`s and existing click handlers; text labels can be visually hidden). Keep it below the minimap (the top
  offset the file uses now, adjust so the card top sits just below the minimap: `top: calc(env(safe-area-inset-top,0px)
  + max(18px,4vw) + var(--gta-map,128px) + 60px)` matches where the HUD buttons end) and full width minus 8 px gutters
  with safe-area insets.
- Landscape phones `@media (max-height:500px)`: keep top-centre, but cap at `max-height: 40vh`, ring 36 px, text
  scrollable, same icon buttons.
- If the existing JS sets button text, use a span for the label so CSS can hide it on phones; do not change behaviour.

## Done when
- From games/gnome-theft-auto: `npx tsc --noEmit -p .` and `npx vitest run src/briefing src/cutscene` pass.
- Browser check (your own port, see _env.md): open `http://localhost:<port>/?briefing=<quest>:<step>` (see app.ts
  ~line 2521: `const [bq, bs] = (startParams.get('briefing') ?? '').split(':')`; read it for a working value) at
  390x844 and 844x390 (e.g. Edge devtools or a puppeteer-core script with `page.setViewport({width:390,height:844,
  isMobile:true,hasTouch:true})`, Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`): the card's
  `getBoundingClientRect().height` is at most 28 % (portrait) / 40 % (landscape) of the viewport height. Report the
  numbers.

## Out of scope
Every file except `src/briefing/briefing.ts`. Comms line lengths in quest data stay as they are.
