# @lawn/music

Synthesized game music on Tone.js, shared by `games/sample-3d` (Lawn Gnome Panic) and `games/faster-than-lawn`. Everything is generated in code, so there are no assets to credit.

- **Sector themes** (`buildSectorTrack`): five chiptune themes in the manner of Ben Prunty's FTL score. Each has an explore and a battle arrangement that play in sync and crossfade when `opts.battle()` flips. Songs are arranged from per-theme pattern banks under fixed rules, so the notes are never random.
- **Jungle** (`buildRunTrack`, `buildMenuTheme`): a generated drum & bass track per seed, and a composed menu theme.
- **Golf ambient** (`buildGolfAmbient`): slow, relaxing generated golf music (soft pads, electric piano, a lazy bass, a flute melody, light brushed percussion) that loops forever. `games/gnome-golf` uses it.
- **Garden lullaby** (`buildGardenLullaby`): very light, peaceful, a touch more than ambient (a soft music-box arpeggio pulse, quiet pad, round bass, a small pentatonic bell tune, barely-there shaker; 76-84 bpm, major key, 16-bar loop). `games/gnome-sweet-gnome` uses it.
- **Tricky big beat** (`buildTrickyTrack`): an original big-beat / breakbeat track in the spirit of early-2000s snowboard games (hard funky break, sliding acid bass, brass stabs, vinyl scratches, a chopped formant "vocal" hook). It reacts to the game: `opts.air()` muffles the mix, `hooks.land()` slams it back with a crash, `hooks.scratch()` cuts a scratch in, `opts.boost()` opens the filter with a riser, `opts.hype()` adds layers. `games/aether-board` uses it.
- **Trance** (`buildTranceTrack`): classic uplifting trance (136-140 BPM, supersaw leads/stabs/pads, major arpeggios, sidechain pump, stereo chorus, dotted-8th ping-pong delay, build/breakdown/drop structure). `games/gnome-creator` uses it.
- **Club Gnome area music** (`buildClubGnomeTrack`, `clubGnomeTracks(area)`, `clubGnomeSong(seed, id)`): eight tracks, one or two per place (town folk and waltz, casino lounge and swing, arcade chiptune, park guitar and sea shanty). Each is a small `TrackSpec` (key, mode, chords per bar, voices, drum grid) run by one engine that also composes the melody from the seed. `games/club-gnome` uses it; render them with `npm run analyze -w packages/music -- --tracks clubGnome:<id>`.

- **Gnome Front** (`buildGnomeFrontMenu`, `buildGnomeFrontBattle`, `buildGnomeFrontTrack`): one score from three motifs (the call, the Red Caps' stomp, the Blue Caps' quickstep). The menu is a playful fanfare march in a major key. The battle theme is jungle-inspired but has no fixed form (4-bar cells whose phase, recon / skirmish / assault / combine, comes from `opts.intensity()`, `opts.lead()` and `opts.combine()`), and `hooks.flag(mine)` plays a stinger in its key. `games/gnome-front` uses both.
- **Underground set** (`buildUndergroundSet`, `UNDERGROUND_JOURNEY`): DJ Moleman's techno set for Gnome Theft Auto's Subsoil Radio. One never-restarting set (one tempo, one key, one chord loop that always ends on the tonic) that travels dub, drum, acid, drum, acid, drum, dub. Dub is chord stabs through a breathing filter, a long echo and a big room; drum is a heavy housey kit with key-tuned toms and a few stabs; acid is a tonic-pedal riff with slides and accents, answered by a ping on its own cycle (riffs and percussion loop at 10-15 steps against the 16-step bar, restarting on each 8-bar phrase). Modes blend over the last 8 bars of each cut: the next mode's percussion arrives first, harmony and the acid line cross later through their own filters, the bass swaps in one bar, the kick never stops. Energy is one continuous curve (`energyAt`), and the acid filter moves on three time scales (a whole cut, 1-8 bars, one note: see `acidCutoff`). `opts.onCut(index)` fires when a new cut is the one the ear follows; `opts.startAt` resumes on a cut. Render a cut with `npm run analyze -w packages/music -- --tracks underground-<cut>`.

Use it from a game:

```ts
import { playSong, setMuteKey, buildSectorTrack } from '@lawn/music';

setMuteKey('my-game-music-muted');
let battle = false;
playSong((T, keep, out) => buildSectorTrack(T, keep, out, seed, { battle: () => battle }));
```

Add `"@lawn/music": "*"` to the game's dependencies and run `npm install` from the repo root. Type-check with `npm run typecheck -w packages/music`.

## Voice timing

A one-note Tone voice (`Synth`, `MonoSynth`, `MembraneSynth`, `NoiseSynth`, ...) throws "Start time must be strictly greater than previous start time" if it is triggered twice at the same instant (a chord on a mono horn, a tuba doubling a bass note) or retriggered within about 50 ms (a flam): the song then dies minutes in, in the browser only. `captureNoteEvents(build, seconds, conflicts)` collects these, and a theme's test should assert the list is empty (see `themes/gnomeFront.test.ts`). Give a grace note, a chord or a doubling its own voice or a `PolySynth`.

## Mixing & Harmony Guidelines

- **Keep low end (`< ~220 Hz`) out of spatial & modulation FX**: Always high-pass **inputs** (not just outputs) of reverb, delay, chorus, phaser, and stereo-widening buses (`createFx`, `createAmbientFx`, and `createStereoBus` enforce `220 Hz` pre-FX high-passing by default). Letting sub/kick/bass fundamentals into reverb or modulation smears the envelope and muddies the mix.
- **Mono low end, high-passed layers**: Keep kick and sub/bass centered; high-pass pads, stabs, leads, and arps above `200–240 Hz` so they don't compete with the sub.
- **Consonant keys & progressions**: For bright/major tracks, stick to warm keys and progressions that avoid harsh diminished/tritone chords (e.g. `#iv°` in Lydian).
