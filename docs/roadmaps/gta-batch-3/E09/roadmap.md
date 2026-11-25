# E09 roadmap: sound, voice, animation, direction (+ L105 character intros)

Brief: [../E09-sound-voice-animation-direction.md](../E09-sound-voice-animation-direction.md), extended with L105 (the
character intro mechanism; E20 places the intros) and E06's deferred weather sound beds. Contracts for later epics:
[contracts.md](contracts.md). Environment for every issue: [_env.md](_env.md).

## Shape

| Step | What | Done when | Issues |
|---|---|---|---|
| 0 (lead) | Foundation: `intro` scene step (script/timeline/director/pacing), `introCard.ts` + `castIntros.ts` stubs, `cueSynth.ts` split out of cueAudio, `FoleySfx` / `ExtraBed` / 'intro' stinger ids with `cueFoley.ts` / `cueBeds.ts` stubs, `REGION_SOUNDS` ids + `recipes/regions.ts` stub, weather + region on the ambience frame (app.ts, sound/index.ts), anim `VARIANT_IDS` + `variants.ts` stub, `frame` shot `push`, mutter `SayOptions.radio` (typed) | tsc + cutscene/sound/anim tests | commit `db262180` |
| 1 | Everything that fills the foundation, in parallel | `npm run build`, `npm test`, cutscene-report | 14 issues below |
| 2 | Apply: cutscene sound pass (L46) and shot variety (L73) on the existing scenes, using the step-1 audit; an intro demo scene | build, tests, cutscene-report clean, `?cutscene=` smoke | 4 Sonnet issues (written after step 1, from the audit) |

Step 1 issues (each owns its files; no file is under two issues):

| Issue | Items | Worker | Owns |
|---|---|---|---|
| [01-footsteps.md](01-footsteps.md) | L31 | Haiku | `src/sound/recipes/world.ts`, `src/sound/watchLife.ts` |
| [02-mutter-radio.md](02-mutter-radio.md) | L47 | Haiku | `packages/mutter/src/index.ts`, `index.test.ts` |
| [03-radio-voice.md](03-radio-voice.md) | L47 | Sonnet | new `src/radio/radioVoice.ts` (+test), `src/radio/player.ts` |
| [04-comms-voice.md](04-comms-voice.md) | L47 | Haiku | `src/briefing/briefing.ts` |
| [05-cue-foley.md](05-cue-foley.md) | L46 | Haiku | `src/cutscene/cueFoley.ts` (+test) |
| [06-cue-beds.md](06-cue-beds.md) | L46, L64 | Haiku | `src/cutscene/cueBeds.ts` (+test) |
| [07-world-ambience.md](07-world-ambience.md) | L64, E06 weather | Haiku | `src/sound/ambience.ts` (+test), `src/sound/recipes/regions.ts` |
| [08-intro-card.md](08-intro-card.md) | L105 | Haiku | `src/cutscene/introCard.ts` |
| [09-cast-intros.md](09-cast-intros.md) | L105 | Haiku | `src/cutscene/castIntros.ts` (+test) |
| [10-anim-variants.md](10-anim-variants.md) | L63 | Haiku | `src/anim/variants.ts`, `src/anim/anim.test.ts` |
| [11-anim-pickers.md](11-anim-pickers.md) | L63 | Haiku | `src/anim/persona.ts`, `src/anim/playerIdle.ts`, `src/npcs.ts`, new `src/anim/variety.test.ts` |
| [12-direct-helpers.md](12-direct-helpers.md) | L73 | Haiku | `src/cutscene/direct.ts`, new `direct.test.ts` |
| [13-shot-audit.md](13-shot-audit.md) | L73, L46 | Haiku | `src/cutscene/pacing.ts`, `pacing.test.ts` |
| [14-sound-bible.md](14-sound-bible.md) | L64, L73, L105 | Sonnet | new `docs/design/gnome-theft-auto/sound-design.md`, `direction/bible.md` |

Animation scope (brief: "pick the five most visible, three variants each, and stop"): plain walk, panicked run, the
player's standing fidget, horn startle / near-miss anger, spectator cheer. Deferred: enter/exit vehicle, shoot/aim and
jump/land variants (they live in `mount.ts` and the shared `packages/gnome` model, which this epic does not edit).

Online: nothing new on the wire (sound, voice and animation choice are local; new anim rows are not emotes; radio stays
on the deterministic broadcast clock). Mobile: radio voice caps synthesis (160 characters, one line at a time); the
intro card and comms are checked at 390x844 and 844x390. Achievements, prefabs: none.
