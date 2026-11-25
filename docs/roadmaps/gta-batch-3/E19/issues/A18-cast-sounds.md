Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/sports/sounds.ts` and `sports/sounds.test.ts`, and additions to `src/cutscene/cast.ts`,
`src/voice/voices.ts`, `src/cutscene/castIntros.ts`. Others edit other files.

## Goal
The seven Founders' Green regulars become cutscene cast with voices and intro cards, and every basketball and
skateboard sound id has a procedural recipe.

## Read first
- `games/gnome-theft-auto/src/sports/types.ts`: `SPORTS_CAST` (keys `cardoon`, `lintel`, `pansy`, `burdock`,
  `fennel`, `moss`, `pebble`: look, hz, held).
- `games/gnome-theft-auto/src/court/types.ts` `CourtSoundId` and `src/skate/types.ts` `SkateSoundId` (the ids).
- `games/gnome-theft-auto/src/cutscene/cast.ts` (the `peony`/`basil`/`thrift` rows built from `HEDGEWORTH_CAST`),
  `src/voice/voices.ts` (their voice rows and the comment on unique (wave, style, formant) combinations) and
  `voices.test.ts`, `src/cutscene/castIntros.ts` (their intro rows) and `castIntros.test.ts` (limits).
- `games/gnome-theft-auto/src/golf/sounds.ts` and `golf/sounds.test.ts`: the model for a sound module
  (`registerSound`/`hasSound` from `../sound/bus`, `burst`/`tone` from `../sound/synth`, `Recipe`, `SoundInfo`).

## Change
- `src/cutscene/cast.ts` `CAST`: rows for the seven keys from `SPORTS_CAST` (import from `../sports/types`): `look`,
  `hz`, `held` when set, scale 1.44 (pebble 1.25, burdock 1.4).
- `src/voice/voices.ts`: a voice row each, unique per the test: `cardoon` (smooth hustler, quick: hz 118, speed 1.2,
  range 1.2), `lintel` (fast, sly, lots of glide: hz 136, speed 1.35, glide 0.2), `pansy` (bright, firm: hz 150,
  speed 1.1), `burdock` (slow, creaky, opinionated: hz 78, speed 0.75, breath 0.2), `fennel` (laid-back drawl: hz 124,
  speed 0.85, range 0.8), `moss` (flat, patient: hz 96, speed 0.9, range 0.5), `pebble` (excited, high: hz 168,
  speed 1.3, range 1.5). Adjust formants/waves only as needed to keep the uniqueness test green.
- `src/cutscene/castIntros.ts` `CAST_INTROS` (respect the test's role/line length limits):
  - cardoon { 'Cardoon "Swish" Trowelly', 'Drainpipe Court regular.', 'Wins bets for a living. Gives the stake back if you ask properly.', 0xe0702a }
  - lintel { 'Lintel Crossover', 'Swish\'s partner.', 'All fakes, no shot. Somehow it works.', 0x6a3fa0 }
  - pansy { 'Pansy Rebound', 'Your teammate.', 'Gets every rebound. Gives every rebound back to you, grudgingly.', 0x2f8f5a }
  - burdock { 'Old Burdock Benchley', 'Keeps the score.', 'His bench is older than the court. So are his opinions.', 0x5a5a5a }
  - fennel { 'Fennel Gripwax', 'Gutter Bowls skater.', 'Lives under the deck. Feeds the strays. Keeps a list of lines.', 0x3a7ac0 }
  - moss { 'Moss Squeegee', 'Dries the bowls.', 'A bowl is a roof on the ground. Roofs need looking after.', 0x4a7a3a }
  - pebble { 'Pebble Nollie', 'Films everything.', 'Has never stood on a board. Has seen every trick.', 0xf07aa0 }
- `src/sports/sounds.ts`, `registerSportsSounds(): void`: one recipe per id of `CourtSoundId` and `SkateSoundId`,
  registered once (guard with `hasSound`), peaks <= 0.25, in golf/sounds.ts's style:
  `jam-bounce` (a rubber ball on concrete: a short hollow thump with a ping), `jam-swish` (a ball through a netless
  rim: a soft whoosh, no net rustle, then a clunk down the drainpipe), `jam-clang` (ball off a metal rim: a bright
  clang with a wobble), `jam-dunk` (a hand on the rim, the drainpipe groaning), `jam-whistle` (a short referee
  whistle), `jam-cheer` (three or four small voices: a quick "ooh"), `jam-drainpipe` (a ball rattling down a long
  drainpipe: falling tinny clunks), `skate-roll` (wheels rolling on concrete: a short grainy rumble, about 0.4 s; the
  runtime replays it while riding; info.param = speed 0..1), `skate-pop` (an ollie: tail snapping on concrete), `skate-land`
  (four wheels landing: a clack and a thud; info.param = impact), `skate-grind` (metal scrape, about 0.5 s), `skate-bail`
  (a board clattering away and a gnome "oof"), `skate-push` (a foot scuffing concrete).
- New `src/sports/sounds.test.ts`: after `registerSportsSounds()` every id is registered (`hasSound`), and a second
  call does not throw.

## Contract
CAST keys exactly the seven `SportsCastKey`s; `registerSportsSounds(): void`; sound ids exactly `CourtSoundId` and
`SkateSoundId`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/sports/sounds.test.ts src/cutscene/castIntros.test.ts src/voice` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
court/, skate/, sports/save.ts (other workers).
