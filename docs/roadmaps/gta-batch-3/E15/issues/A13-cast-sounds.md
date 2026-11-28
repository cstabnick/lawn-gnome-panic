Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
Peony, Basil and Thrift exist as cutscene cast (look, voice, intro card) for quests and later story epics, and
Hedgeworth's seven sounds are registered on the world sound bus.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `HEDGEWORTH_CAST` (looks, held items, hz) and `GOLF_SOUNDS`.
- `games/gnome-theft-auto/src/cutscene/cast.ts` lines 1-60: `CastPreset`, `CAST` rows (look, hz, held, scale).
- `games/gnome-theft-auto/src/voice/voices.ts`: the `VoiceSpec` rows per cast key (fields hz, speed, wave, formant,
  breath, wobble, range, glide, style, sub, q, bright).
- `games/gnome-theft-auto/src/cutscene/castIntros.ts` and `castIntros.test.ts` (every CAST key needs an intro).
- `games/gnome-theft-auto/src/fishing/sounds.ts` (a module that registers procedural recipes: `registerSound`,
  `burst`, `tone`, `voiced` from `../sound/synth`, `Recipe`, `SoundInfo`) and `src/sound/synth.ts` exports.
- `games/gnome-theft-auto/src/golf/sounds.ts`: the stub you replace.

## Change
- `src/cutscene/cast.ts` `CAST`: rows `peony`, `basil`, `thrift` built from `HEDGEWORTH_CAST` (import it from
  `../golf/types`): `look`, `hz`, `held`, scale 1.44 / 1.42 / 1.5.
- `src/voice/voices.ts`: voice rows for `peony` (crisp, clipped, aristocratic: hz ~104, speed 1.05, range 0.7,
  formant 1.1, glide -0.1), `basil` (smooth, showy: hz ~128, speed 1.25, range 1.4, wave 'triangle', formant 1.0),
  `thrift` (gruff, slow, tender: hz ~74, speed 0.7, breath 0.25, style 'words', formant 0.85). Put them with the cast
  rows (not the "without a cast preset" block). If `voices.test.ts` checks something per row, keep it passing.
- `src/cutscene/castIntros.ts` `CAST_INTROS`: `peony` { name 'Dame Peony Gravelrake', role 'Owner, Hedgeworth Links.',
  line 'Runs the neighbour\'s course by the card. Vesper holds her mortgage.', accent 0x3f6b3a }, `basil` { 'Basil Divot',
  'Club pro. Superstitious.', 'Plays every round to win and blames every bad lie on a mole.', 0xc0282d }, `thrift`
  { 'Thrift Hosepipe', 'Groundskeeper.', 'Talks to the grass, waters the ninth green and keeps its secrets.', 0x6b4a2e }
  (role <= 28 chars, line <= 70 chars: check the test's limits).
- `src/golf/sounds.ts`, `registerGolfSounds()`: one procedural recipe per `GOLF_SOUNDS` id, registered once (guard
  with `hasSound` if the bus exports it, as birding/sounds.ts does), peaks <= 0.25, in fishing/sounds.ts's style:
  `golf-tock` (a club striking a ball: a short hollow clay "tock", a woody body tone with a fast decay; info.param =
  strike strength), `golf-putt` (a soft tick), `golf-cup` (the ball rattling into the cup: two or three quick hollow
  plinks), `golf-splash-reed` (a plop into a reedy pond), `board-crack` (a fence board snapping: a sharp wood crack plus
  a clatter of planks), `hedge-rustle` (a long leafy rustle as a cart pushes through a giant plant), `sprinkler-hiss`
  (a tick-tick-tick-hiss of a lawn sprinkler, about 1.2 s).
- New `src/golf/sounds.test.ts`: after `registerGolfSounds()` every `GOLF_SOUNDS` id is registered (use the bus's
  `hasSound`, or whatever fishing's sound test checks) and calling it twice does not throw.

## Contract
CAST keys `peony`, `basil`, `thrift`; `registerGolfSounds(): void`; sound ids exactly `GOLF_SOUNDS`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/sounds.test.ts src/cutscene/castIntros.test.ts src/voice` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (types.ts is the lead's).
