Epic: E20-3 act II quests (wave B)
Depends on: E20-1 (CAST presets and intro cards exist)

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout. Keep LF
line endings. Seven other workers edit other files of this game at the same time: touch only the files below.

## Goal
L105 ("main character intros at appropriate timings"): the kept story scenes show each main character's intro card at
their first story appearance, and the dew-run outro says the Kiln-Debt is clear but the flat's loan is not.

## The card (E09 contract)
In a scene's `steps`, after the character's first line or action, on an mcu/ms of them:
`{ do: 'intro', who: '<actor id>' }` (blocks ~3.2 s like a wait; card text from `CAST_INTROS[<actor's preset or id>]` in
`src/cutscene/castIntros.ts`). The actor must have `preset: '<CAST key>'` (add the preset field to the actor if it only
has `look`/`name`; keep its name). One card per character, ever. Do not place a card in the middle of a line exchange
that would break a joke's timing: after the beat is better.

## Cards to place (scene id -> who; file)
- `prologue-intro` (`src/cutscene/scenes/story/ch1.ts`): Pip (`pip`) after "I'm Pip! Grab that Ride-On and follow me!";
  John Bodega (`bodega`) after his Asphalt line.
- `prologue-outro` (ch1.ts): Tansy (`tansy`) after her first line; Turncoat Cam (`turncoat cam`, the actor `turncoat`:
  give it `preset: 'turncoat cam'`) when he is first framed with his broom.
- `first-contract-intro` (ch1.ts): Don Compost (`don compost`) after his first tap; Big Lou (`big lou`) after his first line.
- `two-coat-intro` (`ch1b.ts`): Juniper (`juniper`); Mabel only if she has no card already from `roof-on-credit-*`
  scenes (grep `src/cutscene/scenes/story/m02-roof-on-credit.ts` for `'intro'`; if Mabel's card is there, skip her).
- `two-coat-handover` (ch1b.ts): Mayor Mulch (`mayor mulch`), Vesper (`vesper`) after "Nice hat."
- `two-coat-outro` (ch1b.ts): Reginald (`reginald`).
- `dew-run-intro` (`ch2.ts`): Granny (`granny`), Bramble (`bramble`).
- `sprinkler-outro` (`ch2c.ts`): Driftwood (`driftwood`), timed so the card lands right after "That's Driftwood.
  Ignore him." (the card is the joke's punchline).
If a scene does not contain the character (or the actor id differs), find the right moment in that scene; if they are
not in it at all, skip and report.

## Dew-run outro line
In `dew-run-outro` (ch2.ts) add one short exchange (Granny or Pip, in voice, at most 16 words a line) saying the
Kiln-Debt is clear but the flat's loan is still the player's. Keep the scene's pacing: add a `cut`/`shot` for it.

## Read first
- `docs/roadmaps/gta-batch-3/E09/contracts.md` (intro cards), `docs/design/gnome-theft-auto/direction/bible.md` section
  6a, `src/cutscene/castIntros.ts`, `src/cutscene/script.ts` (the 'intro' step), the four scene files.

## Change
`src/cutscene/scenes/story/ch1.ts`, `ch1b.ts`, `ch2.ts`, `ch2c.ts`; append one line about each card to the matching
`docs/design/gnome-theft-auto/direction/scenes/<scene>.md`.

## Done when
- `npx tsc --noEmit` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/cutscene/scenes/scenes.test.ts src/cutscene/castIntros.test.ts src/cutscene/intro.test.ts src/cutscene/pacing.test.ts` pass.
- `npm run cutscene-report` shows no new fault for these scenes (an intro counts as "something happening").

## Out of scope
Every other file, in particular `ch1d.ts`, `ch2d.ts`, `ch3*.ts` and every `story/m*.ts` (other workers).
