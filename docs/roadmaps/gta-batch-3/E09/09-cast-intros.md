Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
L105 ("add main character intros ... so players know who they are and what they are doing. keep it fairly short but
enough to intro them"): `CAST_INTROS` holds an intro card for every main and side cast member, written from the cast
bible, so story scenes can write `{ do: 'intro', who: 'tansy' }` and get the right card.

## Read first
- `games/gnome-theft-auto/src/cutscene/castIntros.ts`: `CharacterIntro { name; role; line; accent? }`, the empty
  `CAST_INTROS`, `introFor(who, over)`.
- `docs/design/gnome-theft-auto/characters.md` sections "Main cast (existing)" (line ~87) and "Side cast (existing)"
  (~285): each `### Name ("nickname") (`key`)` entry. Use the full name with nickname as written there, and the role and
  personality lines it gives. Do not invent facts that contradict it.
- `games/gnome-theft-auto/src/cutscene/cast.ts`: `CAST` keys and each one's `look.hat` colour (use it as `accent`).
  Keys: pip tansy vesper granny diggs bracken loam bodega juniper reginald sorrel clara brenda 'big lou' mossley burt
  driftwood cedric bramble shelldon wally dot hedda nina grout mabel.
- `docs/lore/canon.md` (skim the house style).

## Change
- `src/cutscene/castIntros.ts`: fill `CAST_INTROS` with one entry per CAST key above (26), keyed exactly like CAST
  (lower case, 'big lou' with a space). Also add 'mayor mulch' and 'turncoat cam' (speakers without a cast preset;
  accent 0xffd23f). Rules: `name` the display name from characters.md (e.g. 'Pip "Two-Stroke" Potsworth'); `role` at
  most 28 characters (e.g. 'Fixer. Your neighbour.'); `line` at most 70 characters, one dry, specific sentence about
  who they are and what they want, in the game's tone; `accent` the CAST `look.hat` colour. No spoilers of late-story
  twists (Turncoat Cam's betrayal, Vesper's endgame): say what the player sees at first meeting.
- New `src/cutscene/castIntros.test.ts`: every CAST key (import `CAST` from `./cast`) has an entry; every role <= 28 and
  line <= 70 characters and non-empty; `introFor('PIP')` finds pip; `introFor('nobody', { role: 'x' })` gives name
  'Nobody' and role 'x'. Note `cast.ts` imports voices and config: if the import fails in node, install the fake DOM
  first like `src/cutscene/pacing.test.ts` does (`installFakeDom()` from `../testing/fakeDom`, then a dynamic import).

## Contract
`CAST_INTROS: Readonly<Record<string, CharacterIntro>>`, `introFor(who, over?)` unchanged.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/cutscene/castIntros.test.ts` passes.
- `npx tsc --noEmit -p .` passes.
- `npm run lore` (from the worktree root) still passes (you change no lore files; it should be untouched).

## Out of scope
`introCard.ts` (issue 08), `director.ts`, `characters.md`, any lore file.
