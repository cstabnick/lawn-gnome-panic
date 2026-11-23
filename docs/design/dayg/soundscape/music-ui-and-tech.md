# DayG soundscape: music, UI sound and audio tech

> Status: design only. No code. Covers the music plan, the UI sound set, the audio tech and a phased build.
> Ambient beds, world events and threat sounds are owned by the other soundscape agents and are only referenced here.
> Related: [README](../README.md), [survival.md](../survival.md) (Calm), [history.md](../history.md) (eras),
> [regions.md](../regions.md) (districts, zone traits), [ui/design.md](../ui/design.md), [hatless.md](../hatless.md).

## 0. What exists today (checked in the code)

- DayG has **no audio**. `games/dayg/src` has no sound code and no `localStorage` settings. The only `localStorage`
  use is the base save (`src/base/save.ts`), which is guarded.
- The **Calm** need is `needs.state.calm` (0..100, 100 = fine) in `src/game/needs.ts`. Its inputs are already computed in
  `src/main.ts`: `hatlessNear: hatless.nearCount(player.pos, 15)`, `night`, `inHaven`, `nearFire`.
- The **bus** (`src/game/bus.ts`) is a typed event bus on the main thread. It already carries what the music and UI
  need: `dusk`, `dawn`, `haven`, `player-hit`, `fell`, `noise` (source step/attack/fire/climb), `infection`, `cracked`,
  `bell-rung`, `player-shattered`, `respawned`, `quest-taken/done/failed`, `joined-faction`, `rank-changed`,
  `skill-up`, `base-claimed`, `lantern-lit`, `container-opened`, `item-taken`, `talked`, `board-opened`,
  `entered-building`, `hatless-destroyed`. Audio subscribes to these and adds nothing to the sim.
- The **sim runs in a Web Worker** (`src/net/simWorker.ts`, `src/net/simHost.ts`). The main thread holds a replica of
  `world`, refreshed after each tick. Audio samples that replica at 4 Hz. It never calls into `src/sim` or `src/net`.
- **UI** is built into `#ui` by `ui/*.ts` (`touch.ts`, `hud.ts` with `toast()`, `inventoryPanel.ts`, `talkPanel.ts`,
  `boardPanel.ts`, `ledgerPanel.ts`, `roomPanel.ts`, `recap.ts`) and `base/buildUi.ts`. `inventoryPanel.ts` **has drag and drop in the
  working tree** (uncommitted, not from this doc: `pointerdown`, then a move past 6 px drags a stack, and the drop lands
  on the cell under the pointer). The `grab`, `drop` and `stack` sounds can hook into that code. Re-check the file before
  wiring, since it is still changing.
- **Achievements** unlock through `unlock(id)` in `src/game/achievements.ts`. That is the hook for the achievement sound.
- **Zone traits** (`regions.md`, Keys): `ECHO`, `HUSH`, `DARK`, `FLOODS`, `WARM`, `MOSSY`, `NEST`, `HAVEN`, `SACRED`,
  `DEEP`. These are the audio-relevant tags for music timbre and for the ambient agent.
- **Districts** in `regions.md` have almost no audio notes: only the Lychgate has a `**Music:**` line ("wind in the gate
  timbers"). The timbre table in section 1.4 is therefore new design, built from the layer and trait notes.

## 1. The music plan

### 1.1 Principles

1. **One score, many moods.** A single key, tempo and chord loop per district or per night, so transitions are
   crossfades inside one Transport, never a hard cut to a new song. `playSong` tears the Transport down, so it is only
   used for true scene changes (title, haven, shatter).
2. **Music reads what the player can sense**, not the sim's truth. The threat input is `hatlessNear` within 15 gm, and
   the "horde near" stage is set off the sound and dust the player could hear first (the DayZ-veteran feedback asks for
   30 s of warning before herd contact). Hatless beyond sight never change the music.
3. **Music never changes a number.** The Calm meter is the player's need, and `survival.md` lists music as one of the
   things that restore it. This design makes the music *readable* (it tells the player how calm they are). Whether a
   track also restores Calm is a tuning decision for the sim team: add a `music` factor to `calmHavenPerHour` only after
   the audio exists to test it.
4. **Quiet is the default.** The base music level sits under the world sound, and fights add layers, not volume.
5. **Local only.** Music and UI sound are per client. Nothing audio is sent over `@lawn/mp`.

### 1.2 What plays when

| State | Source of truth | Music | Notes |
|---|---|---|---|
| Title and room panel | menu | **Lantern Hymn** (new theme, see 1.3); until it exists, `buildGardenLullaby` | Quiet, major, the Lantern Night tune hummed by NPCs (`history.md`) |
| Exploration, day, Calm high (>70), no Hatless near | `dawn`/`dusk` events, `clock.night`, calm | **Mossgrave Day**: pad, glass tune, a slow pizzicato line, a 3/4 lilt (new theme, shares the hymn's motif) | Sits under footsteps, so it stays sparse |
| Dusk | `dusk` event | 8-bar crossfade from day to night set, with a bell stinger on bar 1 | Day and night share the chord loop, so the change is only timbre and tempo |
| Night outside | `clock.night && !inHaven` | **Night Vigil** = reuse `buildTwilightNocturne` (82-94 bpm, 4/4) as the base, with the tension layers below | Night is the main stress setting. Calm drops here by tuning |
| Horde near (threat 1) | `hatlessNear` >= 1 in 15 gm, or the herd warning from the hatless system | Layer L1 (soft pulse) and the pad detunes slightly | Cooldown 60 s after the last horde stage so it does not nag |
| Fight | `player-hit` or `noise` with source `attack` within 8 s | Layer L3 (drums, low stabs). Stabs answer hits in the song key | Pattern from `buildGnomeFrontBattle`: 4-bar cells whose phase comes from an intensity value |
| Safe haven (inside) | `haven` event with `inside: true` | **Gnome Sweet Lullaby** = reuse `buildGardenLullaby` (76-84 bpm, major, 16-bar loop) | Calm rises here, so this is the reward track. Leaving the haven crossfades back over 8 bars |
| Underground (DEEP zones, catacombs, storm drain) | zone trait `DEEP`, or `entered-building` for crypts | Night set, with `setSongSpatial({ cutoffHz: 1100, reverbWet: 0.5 })` so it sounds far away and enclosed | The engine's spatial call is reused, so no new DSP is needed |
| Player shattered | `player-shattered` | `fadeMusic(4)` (new, see 1.5), then silence, then the title theme after the recap | Silence is the point |
| Low Calm (<30), no threat | calm | The layer stack stays as it was but the pad goes to a minor colour and detunes by up to 12 cents | Dread without a threat, so the player feels the Calm meter |

### 1.3 Adaptive layering

Tension is one number, computed at 4 Hz from inputs the main thread already has:

```
threat = clamp01(hatlessNear / 3)                 // 0..1, from main.ts env
fear   = clamp01((100 - calm) / 60)               // calm 40 -> 1.0, calm 100 -> 0
fight  = 1 while a hit or attack happened in the last 8 s, else 0
target = max(0.9 * threat, 0.6 * fear, fight)
```

`target` maps to four levels with hysteresis, so a flicker does not swap layers:

| Level | Enter at | Leave below | Layers on |
|---|---|---|---|
| 0 Calm | (start) | | pad, glass tune, the day or night line |
| 1 Uneasy | 0.20 | 0.12 | + L1 soft pulse (60 bpm, sub-heavy, under 120 Hz) |
| 2 Tense | 0.45 | 0.37 | + L2 plucked bass ostinato and a muted string |
| 3 Danger | 0.70 | 0.62 | + L3 drums and low stabs; fight stabs answer `player-hit` |

Rules: a level change happens on the next 2-bar boundary; attack 2 s, release 8 s; a level holds at least 6 s. The layers
are gains on one set of Tone nodes that ramp (`setLayer`, below). Nothing is created or destroyed during play.

The layer design follows `undergroundSet.ts` (`levelsOf(weights, energy)`, one gain per layer, all in one song), which
is the closest existing pattern. It is generalized into the engine (1.5).

### 1.4 District timbre

Districts change the timbre of the same night or day score, not the key. Traits set the colour:

| Where | Traits | Timbre |
|---|---|---|
| Lychgate, Yew Walk, Tap | `WARM` or open | Glass tune, wind-like pad (high-passed noise), lightest layers |
| Old Rows, Columbarium, Bell Chapel | `ECHO` | The same pad through the long reverb (`createAmbientFx`), echo on the tune |
| Wreathwood, Lawn Section | `HUSH` | Pad only, no drums, lowest level ceiling (L2 max) |
| Compost Heaps, Gnome Garden, Drowned Corner | `MOSSY`, `FLOODS` | Detuned pad, dripping percussion from the mix (short pitched clicks, no samples) |
| Mausoleum Hill, Shed | `HIGH`, `DARK` | Thinner, sparser, more space; the drone is a fifth above the pad |
| Any `DEEP` zone | `DEEP` | The underground call above |
| Any `SACRED` zone | `SACRED` | The dusk bell interval at the start of the phrase, no drums even at Level 3 |

### 1.5 Stingers

Stingers are one-shots in the score's key, quantized to the next bar (`scheduleOnce` on the Transport). They duck the
music (1.7). Cooldown per stinger type stops repeats.

| Moment | Event | Stinger | Cooldown |
|---|---|---|---|
| Dusk | `dusk` | 4-bar rising bell phrase, then the night crossfade | 1 game day |
| Dawn | `dawn` | short warm chord (major, one bar) | 1 game day |
| First hit this encounter | `player-hit` | low string thud and three heartbeats; L3 entry if not already there | 20 s |
| Infection stage | `infection` | two notes a semitone apart, detuned, one per stage | per stage |
| Chapel bell | `bell-rung` | full bell: inharmonic partials (1, 2.0, 2.76, 4.07 times the fundamental), 6 s; `survived` resolves to major, else to minor | never repeats in a session |
| Shattered | `player-shattered` | 5-note descent, then `fadeMusic` | once |
| Respawn | `respawned` | soft wake chord | per respawn |
| Haven entered | `haven` (inside) | none: the lullaby crossfade is the cue | |
| Horde warning | hatless system (other agent) | low distant drum roll in key | 60 s |
| Quest taken / done / failed | `quest-*` | 2 notes up / 3 notes up / 2 notes down (minor 2nd) | 3 s |
| Faction joined / rank change | `joined-faction`, `rank-changed` | 2-bar horn-like fanfare (triangle + vibrato); higher rank adds a note | 10 s |
| Base claimed | `base-claimed` | hammer-bell, 2 bars | per claim |
| Lantern lit | `lantern-lit` | single chime | 2 s |
| Achievement | achievement `unlock` | 1 s arpeggio in key | per unlock |

### 1.6 Where the new music work goes

- **Reuse as is:** `buildGardenLullaby` (haven), `buildTwilightNocturne` (night), `buildGnomeFrontBattle` pattern (fight
  phase), `setSongSpatial` (underground).
- **New theme, one file:** `packages/music/src/themes/dayg.ts` with `buildDaygScore(T, keep, out, seed, opts)` that
  returns layer and stinger hooks. Two arrangements per score: day and night, each with the same chord loop. It has a
  `dayg.test.ts` that calls `captureNoteEvents` (`packages/music/README.md`, voice timing) and asserts an empty list.
- **New theme, title:** the Lantern Hymn, using the same motif as the Mossgrave Day score. It may be a second
  `buildDaygTitle` in the same file.
- **Not reused:** `buildUndergroundSet` (techno) and `buildTranceTrack` do not fit the Calm-first tone. Only the
  underground *spatial* call is borrowed.

### 1.7 Music ducking inside the mix

- Voices (NPC talk) duck music by 6 dB and ambience by 4 dB (see 3.3).
- Bell and shatter stingers duck music by 12 dB for their length.
- An open talk, board or ledger panel ducks music by 6 dB, so NPC text is readable on a phone.

### 1.8 Engine work this needs (packages/music)

| # | Piece | Why | Size |
|---|---|---|---|
| E1 | `playLayered(build)` plus `setLayer(name, gain, rampS)`: named layer gains on one song, ramped | Level changes without a rebuild (1.3) | small: a map of gain nodes in `engine.ts` |
| E2 | `scheduleStinger(fn, quantBars)`: runs `fn` on the next bar boundary | Stingers in key and on the beat | small: `Transport.scheduleOnce` wrapper |
| E3 | `fadeMusic(seconds)` and `restoreMusic()` | `setMusicVolume` is instant; shatter needs a fade | small: a ramp on `outVolume` |
| E4 | `setMusicDuck(db, rampS)`: a transient dB term, separate from `setMusicBoost` | Ducking must not overwrite the game's boost | small: one more term in `applyOutput` |
| E5 | `getAudioContext()` exported from `engine.ts` | SFX must share the music engine's `AudioContext`. Today `gnome-front` keeps its own, which is two contexts and two unlocks on iOS | tiny |

E1 to E5 are shared-package changes and need their own tests in `packages/music`. They are not game code.

## 2. The UI sound set

### 2.1 Rules

- **No hover sounds.** The game is touch first; hover is not in the design.
- Every UI sound is short (under 300 ms, except the achievement at 1 s), quiet (UI bus at -14 dB), and uses the clay
  palette: a short wooden or clay click, a soft glass chime. No harsh buzz, no gore-coded sounds (house style: no gore).
- A sound plays only on a *completed* action. A tap that does nothing plays `error` (a dull double-pulse), so the
  player always hears a reply.
- Synthesized with Web Audio (`OscillatorNode`, `BiquadFilterNode`, short noise buffer), not Tone, so UI clicks do not
  wait for the Tone chunk.

### 2.2 The set

| Kind | Trigger | Sound (synthesis) | Length |
|---|---|---|---|
| `tap` | any button or list row that acts | triangle 1.3 kHz, 8 ms decay, lowpass 3.5 kHz | 25 ms |
| `open` | a panel opens (inventory, talk, board, ledger, build, room) | noise 1.5-2.5 kHz bandpass sweeps up (paper slide), plus a 330 to 440 Hz sine | 120 ms |
| `close` | a panel closes | the same slide, downward | 100 ms |
| `select` | tab or chip changes | 40 ms soft tick, sine 900 Hz | 40 ms |
| `grab` | inventory drag starts (the move past 6 px in `inventoryPanel.ts`) | 60 ms noise burst, bandpass 1.8 kHz (cloth) | 60 ms |
| `drop` | item put down or placed | sine 180 Hz with a 40 ms decay, plus the noise tail | 60 ms |
| `stack` | items merged | two small clinks, 2.4 and 3.1 kHz | 80 ms |
| `error` | action refused (full, too heavy, not allowed, no room) | two 150 Hz pulses, 180 ms total, lowpassed | 180 ms |
| `toast` | `hud.toast(...)` | glass chime, partials 1.2 and 1.8 kHz, decay 0.6 s | 300 ms |
| `quest` | `quest-taken` / `quest-done` / `quest-failed` | the stinger set in 1.5 (short) | 300-600 ms |
| `achievement` | achievement unlock | sparkle, 1 s, in key | 1 s |
| `craft` | recipe done (`recipe-done`) | tap-tap-clay knock | 120 ms |
| `save` | room save or base save confirmed | two rising glass notes | 150 ms |

Every UI sound has a `ui-sound` bus event (below). Sounds are generated once and cached.

### 2.3 Hooks

- Add one bus event: `'ui-sound': { kind: UiSoundKind }` in `src/game/bus.ts`. UI modules emit it on a completed action.
  The audio module subscribes. This keeps `ui/*.ts` free of audio imports, and a UI module can be tested without audio.
- Where the calls go: `touch.ts` (no sound on the stick itself), every panel's open and close in `inventoryPanel.ts`,
  `talkPanel.ts`, `boardPanel.ts`, `ledgerPanel.ts`, `buildPanel.ts`, `roomPanel.ts`; `hud.ts` `toast()`; `buildUi.ts`
  for build confirm and cancel; `chestUi.ts` for `open` and `stack`.
- Tap sounds: put the tap call in the shared button helper if there is one, otherwise on `pointerup` of buttons inside
  `#ui` (a capture listener on `#ui`, not on each button). This matches the mobile rule that targets are at least 44 px and
  need no hover.
- Never restyle or hide `#ui` itself (repo rule). Audio adds no DOM to `#ui` except the audio settings panel, which is a
  child container.

### 2.4 Settings panel

One audio panel, opened from the HUD or the room panel. It is a child of `#ui`, with 44 px rows:

- Master (0-100), Music (0-100), Sound (0-100, world sfx and ambience), Voices (0-100), UI (0-100), Mute all (a toggle).
- A **Test** button for music, the UI click, and the `toast` chime.
- Phone layout: a single column, the panel scrolls, safe-area insets applied, same as `boardPanel.ts`.

## 3. Audio tech

### 3.1 Module layout (games/dayg/src/audio)

Pure logic is separate from the Web Audio code, so it unit-tests with vitest (the repo's `npm test` runs vitest for DayG).

| File | What | Pure? |
|---|---|---|
| `audio/index.ts` | `createAudio(deps)`: the only integration point. `main.ts` calls it once and calls `audio.tick(now)` from the frame loop | no |
| `audio/settings.ts` | load and save the settings object (try/catch around `localStorage`), clamp values, defaults | yes |
| `audio/buses.ts` | the gain tree (3.2), ducking envelopes | no |
| `audio/tension.ts` | `target` from threat, fear and fight; the hysteresis state machine (1.3) | yes |
| `audio/voices.ts` | the voice budget and steal rules (3.5) | yes |
| `audio/sfx.ts` | offline render of SFX buffers, one-shot playback with a voice budget and panning | no |
| `audio/uiSounds.ts` | the UI sound recipes (2.2), rendered to buffers | no |
| `audio/eventSfx.ts` | bus events to SFX kinds, with the cooldowns | yes (table) |
| `audio/music.ts` | the controller: chooses the score state (day, night, haven, underground, fight) and drives E1 to E4 | no |
| `audio/stingers.ts` | bus events to stingers (1.5) | yes (table) |
| `audio/unlock.ts` | first-gesture unlock and iOS resume (wraps the engine's unlock, see 3.4) | no |
| `ui/audioPanel.ts` | the settings panel (2.4) | no |

Tests: `tension.test.ts` (hysteresis, hold and attack times), `voices.test.ts` (steal order, caps), `eventSfx.test.ts`
(cooldowns), `settings.test.ts` (bad storage does not throw). A `dayg.test.ts` in `packages/music` covers the score (1.6).

### 3.2 Bus layout and mix levels

Gains are relative to 0 dBFS at the master. The music engine's own `MUSIC_DB` is -12 dB; DayG leaves its boost at 0.

```
sources
  Music (engine, -12 dB shared level)  --+
  Stingers (into the music bus)       --+-> Music bus  -(duck E4)-> Master
  Ambience beds (other agent)         ----> Ambience bus -18 dB -> Master
  World SFX (footsteps, hits, doors)  ----> SFX bus    -10 dB -> Master
  Voices (NPC speech)                 ----> Voices bus  -8 dB -> Master
  UI                                  ----> UI bus     -14 dB -> Master
Master: user volume (settings) -> glue compressor (-20 dB threshold, 2.5:1, as the engine) -> limiter at -1 dB
```

| Bus | Level | Per-event peak target | Notes |
|---|---|---|---|
| Music | -12 dB (engine) | -18 dBFS average under the lullaby, -14 at Level 3 | Ducks as 1.7 |
| Ambience | -18 dB | -24 dBFS | Owned by the ambient agent |
| SFX | -10 dB | -12 dBFS peak per event | Footsteps quieter when sneaking (see the sim's noise values) |
| Voices | -8 dB | -10 dBFS | The most important non-UI bus |
| UI | -14 dB | -16 dBFS peak | Never ducked |

The master limiter guarantees the output stays under 0 dBFS when many things hit at once. Keep one shared master
(`engine.ts` already has the limiter and the glue for music; DayG's SFX join after it, via E5).

### 3.3 Ducking rules

| Source | Ducks | Amount | Attack / release |
|---|---|---|---|
| Voices playing | Music, Ambience | -6 dB, -4 dB | 80 ms / 400 ms |
| Bell or shatter stinger | Music | -12 dB | 50 ms / hold for the stinger's length, then 1 s |
| Talk, board or ledger open | Music | -6 dB | 200 ms / 300 ms |
| Anything else | nothing | | |

Ducking never pumps on footsteps or hits: only voices and the two big stingers duck. This keeps the mix steady during a
fight.

### 3.4 Mobile audio unlock

- The engine already creates its `AudioContext` before Tone loads and unlocks on `pointerup`, `touchend`, `click` and
  `keydown` (not `pointerdown` alone, which is not a user activation on touch). It also re-arms after iOS interruptions
  and on `visibilitychange`.
- DayG adds one thing: the first `touchend` or `pointerup` **inside `#ui` or on the touch stick** calls
  `audio.unlock()`, so a player whose first touch is the stick still gets sound. The unlock must run inside the gesture,
  so it is called synchronously, not after an `await`.
- Silent switch on iOS: the engine sets the `playback` audio session. Decision: game audio plays through the ringer
  switch, same as the music engine, and the settings panel says so. It can be changed later without new code.
- The title screen works before the first tap (the engine starts the song, and it sounds once the gesture arrives).
- Context suspended by a call, lock or app switch: the engine re-arms; SFX and UI check `context.state` before each play
  and call `resume()` inside the next gesture if needed.

### 3.5 Budgets (voices and CPU)

| Item | Budget | How it is held |
|---|---|---|
| Simultaneous one-shot voices (all SFX, voices, UI) | 16 total | Per-kind caps: UI 3, SFX 8, Voices 2, stingers 1 each. When full, steal the lowest-priority, oldest voice. Priority: voices > UI > stingers > SFX |
| Footsteps | 3 at once | Only the player and the 2 nearest remote or NPC gnomes make a footstep sound. Others are silent in play |
| Music nodes | under about 60 Tone nodes per song | One shared hall reverb (`createAmbientFx`), one echo. Layers are gains, not new voices |
| Music voices | under about 24 live notes | Layers only play what their level needs |
| Main-thread audio work per frame | under 0.5 ms on average | Level and tension sampled at 4 Hz, not per frame. No node creation in the frame loop |
| SFX memory | under 3 MB | Mono, 44.1 kHz, buffers under 1.5 s. Rendered by `OfflineAudioContext` |
| Boot cost | no more than a few hundred ms, off the first frame | Renders are queued in idle time after the first unlock, not at load. Test sounds first, then the rest |
| Sim | 0 ms | No audio code in `src/sim` or `src/net`. The worker never sees audio |

Measure on a mid-range Android at 390x844 in Chrome devtools (Performance panel, scripting time over 60 s of play)
and on an iPhone in Safari. Record the numbers in the PR. If the Tone reverb generation is a visible stall at song
start, build the score during the fade from the previous one (the engine's `playSong` is the place to change).

### 3.6 Settings storage

- Audio settings are **per device**: `localStorage` key `dayg.audio.v1` (JSON: `master`, `music`, `sfx`, `voices`, `ui`,
  `muted`). Every read and write is in try/catch, and bad values fall back to defaults. This matches the engine's
  per-viewer convention.
- The music mute stays on the engine's key: `setMuteKey('dayg-music-muted')`, called once in `audio/index.ts`, so the
  engine's own mute and the DayG settings agree.
- Settings are **not** in the room or cloud save (`multiplayer.md`). The cloud save is world state and must not change
  because a player turned music down.
- Defaults: master 80, music 70, sfx 90, voices 90, UI 80, not muted.

### 3.7 Multiplayer

- Local only. Remote players' footsteps and voices are positioned from the replica's `players` positions and count
  against the same voice budget (3.5).
- The room host sends nothing audio-related. Peers hear each other's voices only if the voice system (other agent)
  adds it, and it must not change sim state.

## 4. Phased build

Each phase ends in a playable, audible build, checked with `bash tools/smoke.sh` (repo rule) and at 390x844.

### Phase 1: first sound (ambience and footsteps, plus UI)

Goal: the game is no longer silent.

1. `audio/` skeleton: `createAudio`, the bus tree (3.2), settings (3.6), first-gesture unlock (3.4). The Master and
   UI buses first.
2. `ui-sound` bus event and the UI set (2.2) on the panels and `hud.toast`. `error` and `toast` first, since they
   carry the most feedback.
3. Footsteps: `noise` events with source `step` play a surface-appropriate step (grass, gravel, clay, wood). Cap at
   3 voices (3.5). The surface comes from the region's traits (`MOSSY`, `FLOODS`, `DEEP`), not from the sim.
4. Ambience: the ambient agent's beds plug into the Ambience bus. Phase 1 needs one bed per district family so the
   game is not silent in the open. Anything more is their work.
5. Settings panel (2.4) and the Test button.

Exit: a 10-minute phone session with music muted still has footsteps, UI clicks and a bed. Smoke test passes, and the
panel reads well at 390x844.

### Phase 2: music

Goal: the score carries the mood.

1. Engine work E1 to E5 in `packages/music`, with their tests.
2. `audio/tension.ts` and `audio/music.ts`: day, dusk, night, haven and underground states, with the crossfades. Reuse
   the lullaby, the nocturne and the spatial call (1.6).
3. The Mossgrave Day score (`buildDaygScore`), day and night arrangements, with `dayg.test.ts`.
4. Stingers for dusk, dawn, first hit, bell, shatter and respawn (1.5).
5. Ducking (3.3).

Exit: walk from the Lychgate to a haven and back, through a night and a crypt. Music changes at each step, and a shot
and a bell both read clearly.

### Phase 3: the rest

Goal: the full soundscape and the polish.

1. Layers L1 to L3 and the fight arrangement (1.3), with the horde warning stinger.
2. District timbres for all 12 districts (1.4), with the zone traits.
3. The Lantern Hymn title theme.
4. Quest, faction, base, lantern and achievement stingers (1.5). The remaining UI sounds (`grab`, `drop`, `stack`
   once the inventory drag is merged; `craft`, `save`).
5. Event SFX for the rest of the bus: `cracked`, `fell`, `container-opened`, `item-taken`, `ate`/`drank`,
   `piece-*`, `harvested`, `trap-sprung`, `mowing`. Each one has a cooldown in `eventSfx.ts`.
6. Performance pass (3.5), a phone test log, and a short sound review on a real device.

## 5. Decisions and open points

- **Decided:** Tone for music, Web Audio for UI and SFX, one shared context via E5, the threat input is `hatlessNear`,
  settings per device in `dayg.audio.v1`, no audio in the sim.
- **For the sim team:** whether music restores Calm (1.1, point 3). Needs phase 2 to test.
- **For the ambient agent:** the bed names per district family and the Ambience bus level (-18 dB).
- **For the hatless agent:** a horde-proximity value and its radius, so the horde warning uses a sound-based distance
  (30 gm) and not the 15 gm `hatlessNear`.
- **Open:** whether DayG keeps the "plays through the ringer switch" default on iOS (3.4). Default is yes.
- **Not in this doc:** the sound of each creature, each weapon and each surface in detail. Those belong to the other
  agents' docs.
