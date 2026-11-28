Epic: E09 step 1 (sound, voice, animation, direction)
Depends on: none (other E09 issues fill the code at the same time; describe the contracts below, which are fixed)
Worker: Sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E09/_env.md` first. Docs only: no code changes.

## Goal
L64 "start exploring the sonic design some more. build sound design bible": a sound design bible that E10-E22 follow for
every new place and scene, plus the direction bible's camera and sound sections updated for this epic's toolkit (L73
variety helpers, L105 character intros, L46 cue grammar).

## Read first (skim; the code is the source of truth for numbers)
- `games/gnome-theft-auto/src/sound/bus.ts` (bus levels, `STEP_GAP`, voice budget), `src/sound/ambience.ts` (`DAY`
  table per biome, layers), `src/sound/ids.ts` (all world sound ids incl. `REGION_SOUNDS`), `src/voice/speech.ts`
  (`VOICE_LEVEL 0.5`, Voices slider), `src/cutscene/cueAudio.ts` (`CUE_LEVEL 0.9`, music tracks, beds, stingers).
- `games/gnome-theft-auto/src/cutscene/script.ts`: `MusicTrack`, `AmbienceBed` + `ExtraBed`, `Stinger` (incl. 'intro'),
  `CueSfx` + `FoleySfx` doc comments, the 'intro' step doc.
- `docs/design/gnome-theft-auto/direction/bible.md` sections 5 "Camera language", 6 "Sound and music", 8, 9.
- `docs/design/gnome-theft-auto/direction/batch-3-notes.md` (E04's notes) and `docs/design/gnome-theft-auto/characters.md`
  headings (voice notes per character, if any).
- `docs/lore/settings.md` rows for Snowcap Rise, Saltbucket Shore, Rootwell, Trellisdown, Pardonlin, the Unmown (or
  `npm run lore -- find <name>`).

## Change
- New `docs/design/gnome-theft-auto/sound-design.md` (aim 250-400 lines, plain and concrete, tables over prose):
  1. Principles (procedural only; the satirical charm: sounds are a little too earnest; silence is a cue; clay not
     flesh: hits crack and clink, nothing squelches).
  2. Loudness budget: a table per bus (voices, world, ambience, music/radio, ui, cutscene cue) with the code's gain and
     an approximate dB, and the ducking rules (cutscene duck, shop duck, radio muffle under talk). Footsteps: L31 lowered
     to 0.7 of the old level (about -3 dB), NPC steps at 0.4.
  3. Palette per region/biome: for every region (the 13 old ones by biome and the six batch-3 places: Snowcap Rise,
     Saltbucket Shore, Rootwell, Trellisdown, Pardonlin, the Unmown) the world bed mix, spot sounds (ids from
     `ids.ts` incl. `REGION_SOUNDS`), the cutscene bed to use (`AmbienceBed`), and the music theme if any.
  4. Weather: rain bed, wind up in rain, snow muffles everything but the wind, far thunder in heavy rain, cutscene
     'rain' / 'storm' / 'snow' beds; weather is local (not on the wire).
  5. Voices: mutter per cast key (`voice/voices.ts`), comms calls over `radio: true`, radio hosts in their own voice
     (`radio/radioVoice.ts speakRadio`, option "Radio voice"), the SamJs voice only for the "News bulletin" sting;
     text speed and holds (radio text holds `max(remaining + 1.5, spoken + 1.0)`; comms holds +0.8 s).
  6. Cutscene cue grammar: when to use music vs ambience vs foley vs stinger; at most two stingers a scene; sfx a beat
     before the reaction; ambience changes on the cut; every scene has a bed (or a reason for silence) and at least two
     foley or sfx cues tied to on-screen action; the `FoleySfx` table with one usage line each; `ExtraBed` table.
  7. Character intro sound: the 'intro' stinger (shutter snap + flourish), never under dialogue.
  8. Missing sounds: a table of sounds later epics will need, each with a proposed id, where it goes (`CueSfx` /
     `REGION_SOUNDS` / a recipe file) and the epic likely to add it (e.g. ferris-wheel creak E11, ski edges E12, golf
     club E15, skateboard roll E19, tractor E16, mole tunnels E17).
  9. How to add a sound (checklist: id, recipe, test, the bible row).
- `docs/design/gnome-theft-auto/direction/bible.md`:
  - Section 5 (Camera language): add a "Variety without changing intent" subsection: the `direct.ts` helpers
    `pickAngle(seed, size, side)`, `varied(who, size, seed, opts)`, `pushIn(who, from, s, opts)`, `pullOut(...)`,
    `insert(who)`, `cutaway(who, opts)`, `coverage(...).two(size)`, `vary(steps, seed)` (what each is for, one line each);
    the rule "never the same set-up three times running" (the cutscene report flags `MONOTONE`), and that variation
    never flips the side of the line.
  - Section 6 (Sound and music): link `sound-design.md`, add the foley and new beds in one short paragraph and the
    "every scene: a bed and two foley cues" rule.
  - A new short section "Character intros" (after section 6, without renumbering later sections; call it 6a): what the
    `{ do: 'intro', who }` step does (flash-freeze, 'intro' stinger, name / role / line card from
    `cutscene/castIntros.ts`, default 3.2 s, `freeze: false`), when to use it (a main character's first on-screen
    appearance in the story, once per character, after their first line or action, never mid-sentence, on an mcu or ms
    of them), and `showCharacterIntro(card)` for quests outside cutscenes.
- `AGENT_INDEX.md` is updated by the lead; do not edit it.

## Done when
- Both docs read cleanly; every id named exists in `script.ts` / `ids.ts` (grep each).
- `npm run lore` (worktree root) passes (you touch no lore files).

## Out of scope
All code, `docs/lore/`, `characters.md`, scene notes.
