# E09 Sound, voice, animation and direction
Wave: 3 · Depends on: nothing (E04's direction/bible updates are read, not required) · Kind: Polish
Source items:
- L31 ake footsteps a little quieter
- L46 try and add more sound in cutscenes
- L47 add charactger voices using the shared voice pack. kind of implemented but could be better. maybe make it so radio text is read out at text speed and a little bit more on the screen. don't actually read it using the `news bulletin` voice just the gnome voice, but more radio sounding.
- L63 add more varitions to existing high-usage animations
- L64 start exploring the sonic deisgn some more. build sound design bible. start adding more sound content.
- L73 I really like the intent and angles with the directed shots, but review them and add a bit more variation. I like what we are expressing, but want a bit more variety.

## Goal
The game sounds and moves like it was directed: quieter feet, richer cutscene audio, radio and comms spoken in each
speaker's own gnome voice with a radio filter, the high-use animations no longer identical every time, a written sound
design bible the later epics follow, and a review of the directed shots that adds variety without changing the
established intent.

## Scope
In:
- Footstep level (L31) and a light variety pass on step recipes.
- Cutscene sound pass (L46): more SFX, ambience layers and foley cues on existing scenes; new `CueSfx` ids as needed.
- Voices (L47): radio/comms text spoken in the speaker's voice with `phone: true`, timed to text speed, text held longer.
- Animation variation for the top high-use animations (L63).
- `docs/design/gnome-theft-auto/sound-design.md` (L64) plus the first batch of new sound content it names.
- Directed-shot review and a variation toolkit in `cutscene/direct.ts` (L73).

Out: engine/vehicle sounds (done in `gta-engine-sounds`); new cutscenes for the new story (E20-E22 use this epic's
toolkit); the music tracks themselves unless the bible calls for one (stay procedural).

## Code pointers (confirmed)
- Footsteps (L31): recipes `src/sound/recipes/world.ts`: `level(info, base)` = `min(0.3, base * (0.6 + 0.6 * info.param))`
  with per-surface bases ~0.15-0.2 (`stepAsphalt`, `stepIce`, `stepSnow`, `stepSand`, `stepMud`, `stepGrass`, ...);
  `pitch(info, f, spread = 0.12)`. Player steps: `src/sound/watchLife.ts playerFeet` (~line 102: `strideSteps`, up to 2
  per frame, `param` 1 sprint / 0.5 walk); NPC steps `gnomeStep` (`gain: 0.5`, nearest two gnomes only). Rate limit
  `STEP_GAP = 0.09` in `src/sound/bus.ts:29,125`. Easiest, safest cut: lower the `level` cap and multiplier (about -3 dB)
  and the footstep gain on the world bus, not the master; `src/sound/recipes/recipes.test.ts` pins recipes, update it.
  Footsteps sit on the World slider (`sound/volumeUi.ts`), so do not add a new slider; the user wants a default drop.
- Cutscene audio: `src/cutscene/cueAudio.ts` (832 lines) `createCueAudio()` returns `CueAudio` with `music`, `ambience`,
  `sfx(id)`, `stinger(id)`, `radio(level)`; `TRACKS: Record<MusicTrack, TrackSpec>` (line ~176); `CueSfx` =
  `Sfx | 'footsteps' | 'door-creak' | 'whoosh' | 'punch' | 'thud' | 'skid' | 'engine-rev' | 'glass' | 'cash' | 'phone' |
  'knock'` (`cutscene/script.ts:123`); ambience beds (`AmbienceBed`); a chirp timer for the forest bed (~line 430-485).
  Scripts reach audio through steps with `cue`/`sfx` in `cutscene/scenes/**`; the bible's rules are in
  `docs/design/gnome-theft-auto/direction/bible.md` section 6 ("Sound and music": theme table, silence is a cue, at most
  two stingers a scene, sfx a beat before the reaction, ambience changes on the cut).
- Voices: `src/voice/speech.ts` (`speech()`, `speak`, `speakAt`, `voiceSpatial`, Voices slider key `gta.vol.voices`,
  `VOICE_LEVEL 0.5`) over `@lawn/mutter` (`packages/mutter/src/index.ts`; `VoiceSpec`, `SayOptions.phone?: boolean`
  "350..3200 Hz band and a little grit", `say()` returns duration). Voice data `src/voice/voices.ts` (`VOICES` by cast
  key, `voiceFor(key, look)`, derived voice for anyone unlisted). Comms: `src/briefing/briefing.ts` already speaks each
  revealed word through `speech().say(word, caller.voice, {maxLetters: 4, phone: mode === 'call'})` and times text
  with its own `CHARS_PER_SECOND = 40`, `MIN_HOLD_SECONDS 2.2`, `WORDS_PER_SECOND 3.5`.
- Radio: Turfton FM text is `src/radio/player.ts` (`#gta-radio` floating text, `getRadioText()` from `radio/prefs.ts`;
  `textLeft = slot.remainingSec` at ~line 302, `SONG_CREDIT_SECONDS`; bulletin intro `playBulletinIntro` at line 327).
  The only spoken radio today is `src/radio/bulletinAudio.ts`: a SamJs "News bulletin" PCM through a broadcast EQ
  (the voice the user does not want for ordinary lines). Lines and hosts are data in `src/radio/content.ts` (`Line` has
  `who`, `text`; segment kinds include talk, caller, ad, bulletin; `HEAT_BULLETINS`).
- Text speed: `src/cutscene/textSpeed.ts`: `CHARS_PER_SECOND` slow 22 / normal 40 / fast 75 / instant, `holdSeconds(text)`
  = words at 238 wpm, min 1.5 s, `lineTiming()`. Cutscene dialogue voice goes through `cutscene/director.ts` and
  `cutscene/subtitles.ts`.
- Animation: library in `src/anim/` (`index.ts` `ANIMS`: emotes, dances, idles, styles, bits, social, jobs, work, hunt,
  ride, drive, reacts; ~2950 lines), played by `animator.ts` (`BLEND 0.2`, `applyPose`, additive `onMove` overlays),
  personality and picks in `anim/persona.ts` (`PERSONAS`, `walkStyleFor`, `idleFor`, `pairFor`), the player's fidget
  `anim/playerIdle.ts` (`IDLE_DELAY 8`, `IDLE_GAP 6`, `pickFidget`). The base walk/run cycle, jump, front flip, sit and
  dead poses are NOT here: they live in the shared package (`packages/gnome` `model.update`, see
  `docs/roadmaps/gta-gnome-animations.md` inventory). Decision: do not edit `packages/gnome`'s walk cycle (shared by every
  game); add variation game-side through `walk-*` / `run-*` / `idle-*` overlay rows, per-gnome seeded stride length,
  cadence and arm swing multipliers, and more idle/fidget picks. Row ids need types in `anim/types.ts`;
  `anim/anim.test.ts` and `round3.test.ts` enumerate rows.
- Direction: `src/cutscene/direct.ts` (71 lines: `BEATS`, `beat`, `shot(who, size, opts)`, `cut`, `coverage(a, b, side,
  angle)` with `.single/.ots`, `reaction`, `exchangeLooks`), shot kinds in `cutscene/script.ts:141-165` (`cut`, `dolly`,
  `orbit`, `follow`, `track`, `frame` with `ShotSize` cu/mcu/ms/fs/ws, `height` eye/low/high, `handheld`), the checker
  `src/cutscene/pacing.ts` (`PACING` numbers: `lineWordsTarget 12`, `lineWordsMax 16`, `linesPerShotMax 3`, `speakerRunMax 3`;
  waivers) run by `npm run cutscene-report -w games/gnome-theft-auto`. Direction docs: `docs/design/gnome-theft-auto/direction/`
  (`bible.md` sections 5 "Camera language", 6, 8 "Common faults", 9 vocabulary; `lanes.md`; per-scene notes in `scenes/`).
  `cutscene/scenes/**` holds the shots (city, side, story/ch1-ch5).

## Contracts this epic provides
- `docs/design/gnome-theft-auto/sound-design.md`: palette per region/biome, loudness budget (a dB table per bus:
  voices, world, ambience, music, ui), footstep/foley rules, cutscene cue grammar, a list of missing sounds with ids.
  E10-E19 and E20-E22 follow it for every new place and scene.
- `src/radio/radioVoice.ts`: `speakRadio(line, hostKey)` (mutter `phone: true`, voice from `voiceFor(who)`), returns the
  spoken seconds so `player.ts` can set `textLeft = max(remainingSec, spoken + hold)`.
- `direct.ts` additions: variation helpers (e.g. `pickAngle(seed, size)` that rotates between low/high/side/dutch-free
  alternatives per scene seed, `insert(target)`, `pushIn`, `cutaway`, `ots` variants) and the bible's updated section 5.
- New `CueSfx` ids and ambience beds registered in `cueAudio.ts` and `cutscene/script.ts` (append only).
- Anim ids appended in `anim/types.ts` and a seeded `gaitFor(npcId)` in `persona.ts`.

## Contracts consumed
- E04's bible/story-outline (the direction docs) for character voice notes; E06's weather/time (rain/wind beds when it
  lands; coordinate ids `rain`, `wind` with the bible's existing beds).
- E07's Options registry: a "Radio voice: on/off" row and nothing else new (voice volume is the existing slider).

## Online / mobile / achievements / prefabs / lore notes
- Online: sound, voice and animation choice are local. Remote players' gnomes already animate from `online/actSync.ts`
  emote ids; new anim ids that are emotes must be appended to the wire table in `online/protocol.ts` (check it before
  adding emote ids; append only). Radio is a deterministic broadcast clock (`radio/broadcast.ts`), so every peer hears the
  same line at the same time without messages.
- Mobile: mutter synthesis cost for long radio lines on phones: cap voiced letters (`maxLetters`) and speak at most one
  line at a time; audio only after the first gesture (`unlockSpeech`). Text on screen must remain readable on a phone
  (see E07's comms layout).
- Achievements: none needed.
- Prefabs: none (audio and animation). New props in scenes follow the prefab rule as usual.
- Lore: radio and comms text is existing lore data; do not rewrite lines. If you add radio lines for the new areas
  (only the sound bible's examples), `npm run lore` must pass.

## Risks and open questions (decisions taken)
- "Radio text read out at text speed": decision: voice runs through mutter at the line's natural speed, while the on-screen
  text types at the Options text speed (`getTextSpeed()`) and then holds `max(holdSeconds, spoken + 1.0 s)`, so the voice
  and the text finish together; a "Radio voice" option (default on) skips synthesis. Talk/caller segments only; ads and
  songs keep their treatment; the news bulletin keeps its chime but its spoken words use the host's gnome voice
  instead of SamJs "News bulletin" for the body (the intro phrase "News bulletin" may stay).
- "A little bit more on the screen": radio text currently lives exactly `remainingSec`; extend by +1.5 s, never past the next segment's start.
- Radio filter: mutter `phone` is a 350-3200 Hz band; the radio needs a touch more crackle and a duck of the radio music
  under the voice. Decision: add a `radio` flavour to `SayOptions` only if a mutter test stays green and the Gnome Party
  or other mutter users are unaffected (additive, optional); otherwise reuse `phone` plus a game-side `BiquadFilter`.
  `packages/mutter` is shared: additive changes only, `npm test -w packages/mutter` green.
- Quieter footsteps vs the engine sounds: do not touch vehicle buses. Check the World slider default and `ambience`
  mix after the change so steps are not drowned in a crowd.
- Animation variation scope creep: "high-usage" means walk, run, idle/fidget, enter/exit vehicle, shoot/aim, and the
  jump/land. Pick the five most visible, three variants each, and stop; list the rest as deferred.
- Directed-shot review: do not rewrite scenes. Decision: audit the 47 stage scenes and ch1-ch5 with a script that tallies
  shot size, height and move per scene (new `cutscene-report` columns), then change only scenes whose tally is
  monotone (same angle three times running), keeping `pacing.test.ts` green and the `docs/.../direction/scenes/*.md`
  notes in sync.
- Cutscene sound pass can collide with E20-E22's scene edits: land the toolkit and the audit first, apply to existing scenes in this epic only.

## Done when
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` (recipes, anim, pacing, cutscenes,
  voices tests), `npm test -w packages/mutter` if touched, `npm run cutscene-report -w games/gnome-theft-auto` clean.
- `npm run lore` if any radio/comms text changed.
- Smoke: `bash tools/smoke.sh <url> <markers>`; listen check recorded in the PR (footsteps lower, a radio line spoken in
  a gnome voice with text staying longer, a scene with added foley), with the sound bible linked.
- `AGENT_INDEX.md` row for the new doc and files updated.
