Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. Dev server port for your browser check: 5312
(`cd games/gnome-theft-auto && npx vite --port 5312 --strictPort`, background; stop it after).

## Goal
L105: the character intro card looks finished. When a cutscene runs an `intro` step (or a quest calls
`showCharacterIntro`), the frame "freezes" (a white camera flash, then the game canvas goes desaturated and contrasty),
and a name card slides in: an accent stripe, the NAME big, the role in small caps, one line of who they are. It holds,
then slides out and the colour comes back. Short, charming, readable on a phone.

## Read first
- `games/gnome-theft-auto/src/cutscene/introCard.ts`: the stub. Keep the exported `IntroCard`, `createIntroCard(parent)`
  and `showCharacterIntro(card, opts)` signatures.
- `games/gnome-theft-auto/src/cutscene/castIntros.ts`: `CharacterIntro { name; role; line; accent?: number }`.
- `games/gnome-theft-auto/src/cutscene/director.ts` lines ~116-150 (overlay: letterbox bars 11vh top and bottom, title
  pill, caption, Skip button top-right) and the `'intro'` case in `fire()`: it calls
  `introCard.show(card, { seconds: ts.dur, freeze: st.freeze !== false })`, then `hide()` when the step ends or the
  scene is skipped. The subtitles card sits at the bottom (do not cover it).
- `games/gnome-theft-auto/src/cutscene/cueAudio.ts`: `createCueAudio()` returns `{ stinger(id) }`; the 'intro' stinger
  exists (issue 05 gives it its sound).

## Change
- `src/cutscene/introCard.ts` only:
  - Inject one `<style id="gta-intro-card-style">` once. Root `el`: `position:absolute; inset:0; pointer-events:none;`
    holding (a) a flash layer (white, opacity 0, animates 0 -> 0.85 -> 0 over 0.18 s on show when `freeze`), (b) a
    vignette layer (radial gradient to rgba(0,0,0,.45) at the edges, fades in over 0.2 s when `freeze`), (c) the card.
  - Card: left side, `left: max(16px, env(safe-area-inset-left))`, `top: calc(11vh + 20px)` (under the top letterbox),
    `max-width: min(440px, calc(100vw - 32px))`, dark panel rgba(10,12,16,.82), a 6 px left stripe in the accent colour
    (`#${(accent ?? 0xffd23f).toString(16).padStart(6, '0')}`), padding 10px 16px. Name: 800 weight, 28 px (22 px under
    480 px width), uppercase, letter-spacing .04em, white. Role: 12 px, uppercase, letter-spacing .14em, the accent
    colour. Line: 15 px italic, #e8e8e8, max two lines. Empty role or line: that row is hidden.
  - Motion: the card slides in from -24 px with opacity 0 -> 1 over 0.35 s (start 0.15 s after the flash); `hide()`
    slides it out to the left over 0.3 s and fades the vignette; `seconds` is only used to set a CSS variable for a thin
    progress bar under the card (width 100% -> 0 over `seconds`). Respect `prefers-reduced-motion: reduce` (no slide,
    no flash; fade only).
  - Freeze look: when `freeze`, set `document.body.dataset.introFreeze = 'on'` and the injected style has
    `body[data-intro-freeze="on"] canvas { filter: saturate(.2) contrast(1.15) brightness(1.04); transition: filter .15s; }`.
    `hide()` and `destroy()` delete the attribute.
  - `showCharacterIntro(card, opts)`: create the card in `opts.parent ?? document.getElementById('ui') ??
    document.body`, play the stinger once (`createCueAudio()` made lazily at first call and reused:
    `cue.stinger('intro')`), show for `opts.seconds ?? 3.2` s, hide, wait 0.35 s, destroy, resolve.
  - Text goes in with `textContent` (never innerHTML).
- No other file.

## Contract
```ts
export interface IntroCard { readonly el: HTMLElement; show(card: CharacterIntro, opts?: { seconds?: number; freeze?: boolean }): void; hide(): void; destroy(): void }
export function createIntroCard(parent: HTMLElement): IntroCard;
export function showCharacterIntro(card: CharacterIntro, opts?: { seconds?: number; freeze?: boolean; parent?: HTMLElement }): Promise<void>;
```

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- Browser check on port 5312: open `http://localhost:5312/?debug` and in the console run
  `import('/src/cutscene/introCard.ts').then(m => m.showCharacterIntro({ name: 'Pip Potsworth', role: 'Your neighbour',
  line: 'Knows a guy. Is usually the guy.', accent: 0xc82828 }))`; the card shows, the canvas greys, both go after ~3 s.
  Check at 390x844 and 844x390 (no overflow, no overlap with the Skip button area at top-right).

## Out of scope
`director.ts` (already wired), `castIntros.ts` (issue 09), `cueFoley.ts` (issue 05).
