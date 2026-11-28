# E09 contracts: character intros, cutscene sound, variety toolkit, radio voice, ambience, anim variants

For E10-E22 (new places, new scenes, the story). Paths are under `games/gnome-theft-auto/src/`. The sound rules every
new place and scene follows are in `docs/design/gnome-theft-auto/sound-design.md`; the camera and intro rules in
`docs/design/gnome-theft-auto/direction/bible.md` sections 5, 6 and 6a.

## Character intros (L105; E20-E22 place them)

In a scene script (`cutscene/script.ts`):

```ts
cut(shot('tansy', 'mcu')),
{ do: 'say', who: 'tansy', text: 'Side-Valve Motors. If it rolls, I sold it twice.' },
{ do: 'intro', who: 'tansy' },                                   // card from CAST_INTROS['tansy'], 3.2 s, waits
{ do: 'intro', who: 'stranger', name: 'Wren Ashby', role: 'Courier', line: 'Delivers anything. Asks nothing.', s: 2.8 },
{ do: 'intro', who: 'pip', freeze: false },                      // no flash-freeze, card only
```

- `who` is an actor id; the card text comes from `cutscene/castIntros.ts CAST_INTROS[<actor preset or who>]`
  (`{ name, role, line, accent }`, every CAST key plus 'mayor mulch' and 'turncoat cam'); `name` / `role` / `line`
  override it. `s` defaults to `INTRO_SECONDS` (3.2). The step blocks like a `wait`; `async: true` lets the scene go on
  under it.
- What plays: a camera-shutter flash, the canvas desaturates ("freeze-frame"), the `'intro'` stinger, and a name card
  (accent stripe, NAME, ROLE, one line) at the top-left under the letterbox. Skip hides it.
- Outside cutscenes (a quest start, a phone call): `showCharacterIntro(introFor('granny'), { seconds?, freeze?, parent? })`
  from `cutscene/introCard.ts` returns a Promise that resolves when the card has gone.
- New characters: add a `CAST_INTROS` row (role <= 28 chars, line <= 70 chars, no spoilers past first meeting);
  `castIntros.test.ts` checks every CAST key has one.
- Pacing: an intro counts as "something happening" for the dead-air check. Use one per character, at their first
  story appearance, after their first line or action, on an mcu or ms of them.

## Cutscene sound (L46)

- `CueSfx` gains `FoleySfx` (`cutscene/script.ts FOLEY_SFX`): cloth, paper, pour, clink, chair, keys, zip, bell, crunch,
  creak, thunder, gulp, tap, pop, clatter, latch, squeak, shovel, flutter, static, snap, rustle. Use as `{ do: 'sfx', id:
  'clink', at: 'pip' }` or `say.sfx`. Synths in `cutscene/cueFoley.ts`.
- `AmbienceBed` gains `ExtraBed` (`EXTRA_BEDS`): snow, shore, cave, market, meadow, storm, office, garden (builders in
  `cutscene/cueBeds.ts`, which get a `BedKit`). Region -> bed table in the sound bible.
- `Stinger` gains `'intro'`. Helpers shared by cutscene sound live in `cutscene/cueSynth.ts`.
- Adding more: append an id to the union and its `*_SFX` / `*_BEDS` list, add the synth / builder; the tests require
  one per id.

## Shot variety (L73; `cutscene/direct.ts`)

```ts
pickAngle(seed, size, side?)            // { side, height }: same side of the line, varied swing and height
varied(who, size, seed, { toward, side, handheld })
pushIn(who, from, s, { to?, toward?, side?, height? })   // frame shot with push: { to, s }
pullOut(who, from, s, { ... })
insert(who, { toward?, side? })         // cu, high, on the hands / what they hold
cutaway(who, { size?, toward?, hold? }) // Step[]: cut + beat
coverage(a, b, side, angle).two(size?)  // two-shot on the same side of the line
vary(steps, seed)                       // variety pass: breaks runs of 3+ identical frame set-ups
```

- `CamShot` 'frame' takes `push?: { to: ShotSize; s: number }` (a push-in / pull-out by size).
- `npm run cutscene-report -w games/gnome-theft-auto` prints per scene a shot tally (sizes, heights, moves, longest
  identical run, `MONOTONE`) and its sound cues, then the lists `=== Variety ===` (monotone scenes) and `=== Sound ===`
  (scenes with fewer than 2 sfx/stingers). New scenes should appear in neither (`pacing.ts tallyShots`).

## Radio and comms voice (L47)

- `radio/radioVoice.ts`: `speakRadio(line, hostKey, { gain?, pan? })` returns spoken seconds;
  `stopRadio()`; `getRadioVoice()` / `setRadioVoice(on)` (Options > Sound "Radio voice", key `gta.radioVoice`, event
  `gta:radio-voice`); `setRadioVoiceBusy(fn)` to keep the radio quiet while something else talks; `radioCut(text)`.
  Talk, caller, traffic and bulletin text is spoken by the host's gnome voice over `@lawn/mutter` `{ radio: true }`;
  text types at the Text speed option and holds `max(remaining + 1.5, spoken + 1.0)` s. New radio lines (E10-E19) need
  no code: put them in `radio/content.ts` with a `who` that `voice/voices.ts voiceFor` knows (or gets a derived voice).
- `@lawn/mutter` `SayOptions.radio` (additive): phone band, narrower, plus a static crackle. Comms calls use it.

## World ambience (L64, E06 weather)

- `sound/ambience.ts`: `AmbienceFrame.weather` / `.region` (fed by app.ts); a `rain` layer; pure `weatherMix`,
  `regionMix`, `pickRegionSpot`. A new region adds its row to `regionMix` and `pickRegionSpot`.
- `sound/ids.ts REGION_SOUNDS` (+ `recipes/regions.ts`): surf-wash, buoy-bell, snow-creak, icicle-tink, cafe-clink,
  chapel-chime, grass-hiss, thunder-far, campus-bell, sprinkler-tick (`playAt(id, pos, { bus: 'ambience' })`).

## Animation variants (L63)

- `anim/types.ts VARIANT_IDS` (rows in `anim/variants.ts`, not emotes, nothing on the wire): walk-easy, walk-brisk,
  walk-amble, run-cover-head, run-look-back, run-arms-up, idle-weight-shift, idle-hat-adjust, idle-look-back,
  startle-hop, startle-spin, fist-wave-both, stomp-off, cheer-jump, cheer-whistle.
- `anim/persona.ts`: `gaitFor(id, persona)` -> `{ style, speedMul }` (stable per gnome), `fleeStyleFor()`,
  `startleFor(persona)`, `angerFor()`, `cheerFor(trait)`. Use these for new crowds instead of hard-coding one row.
