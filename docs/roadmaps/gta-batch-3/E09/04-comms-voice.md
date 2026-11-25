Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none
Worker: Haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first.

## Goal
L47 for the mission comms panel: calls sound like a radio (the speaker's own gnome voice with mutter `radio: true`), and
each comms line stays on screen a little longer before it auto-advances.

## Read first
- `games/gnome-theft-auto/src/briefing/briefing.ts`: constants `MIN_HOLD_SECONDS = 2.2`, `WORDS_PER_SECOND = 3.5`
  (~line 53), `holdSeconds(text)` (~124), the word-voicing code that calls
  `speech().say(word, caller.voice, { maxLetters: MAX_VOICE_LETTERS, phone: mode === 'call' })` (~241), and where the
  hold is used for auto-advance (search `holdSeconds(`).

## Change
- `src/briefing/briefing.ts` only:
  - `MIN_HOLD_SECONDS` 2.2 -> 3.0; `WORDS_PER_SECOND` 3.5 -> 3.0; add `const EXTRA_HOLD_SECONDS = 0.8;` added to every
    hold (`holdSeconds` returns `Math.max(MIN_HOLD_SECONDS, words / WORDS_PER_SECOND) + EXTRA_HOLD_SECONDS`). Comment:
    "L47: comms text stays a little longer".
  - Voice: calls use `{ maxLetters: MAX_VOICE_LETTERS, phone: true, radio: true }`; briefings (`mode === 'briefing'`)
    stay plain (`phone: false`, no radio). `SayOptions.radio` already exists in `@lawn/mutter`.

## Contract
No exported API change (`createBriefing`, `Briefing` unchanged).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/briefing` passes if there are tests there (there may be none).
- `git diff --stat` shows only `briefing.ts`, a few lines.

## Out of scope
Everything else (layout and mobile CSS belong to E07, already merged).
