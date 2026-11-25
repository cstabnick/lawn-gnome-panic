# Gnome Theft Auto: the sound design bible

Every new place and scene in E10-E22 follows this file. It sits beside the directing bible
([direction/bible.md](direction/bible.md) section 6 links here). Numbers are the code's numbers; when the code moves,
fix the table. Code lives in `games/gnome-theft-auto/src/`: `sound/` (world), `voice/` (speech), `radio/`,
`cutscene/cueAudio.ts`, `cutscene/cueBeds.ts`, `cutscene/cueFoley.ts`.

---

## 1. Principles

1. **Procedural only.** WebAudio synth and filtered noise. No audio files, no samples, no licences to track.
2. **A little too earnest.** The sounds take themselves seriously and the world does not. A civic bell tolls with full
   dignity over a gnome who is losing a fight with a hedge. Do not play a gag sound for a joke: play the dignified
   sound and let the picture be the joke.
3. **Silence is a cue.** A scene without music is normal. A scene with no bed at all needs a reason (a held breath, a
   reveal, a sincere beat). The ear notices what stops.
4. **Clay, not flesh.** Hits crack, clink, tink and thunk. Falls clatter. A repair is a glue squeak. Nothing squelches,
   splats or tears. Nothing gets wet in the lore's sense: water splashes, but nobody is soaked (house style).
5. **One thing leads.** At any moment one sound is the subject (a line, a stinger, a hit). Everything else sits under it.
6. **Cheap on a phone.** One-shots share a voice budget (`MAX_VOICES` 14 desktop, 8 on a coarse pointer). Bed layers
   stop their sources after 6 s at zero. Do not add a looping source without a sleep rule.

---

## 2. Loudness budget

The graph (all gains are linear; dB = 20 log10):

```
audio.ts master 0.5 (-6 dB)
  <- duck <- world (bus.ts)       one-shots: other vehicles, guns, critters, footsteps, events
          <- ambience (bus.ts)    region beds and their spot sounds
  <- voices (voice/speech.ts)     every spoken line
  <- cue (cutscene/cueAudio.ts)   cutscene music, beds, stingers, foley, scene engines
  <- music / radio (@lawn/music, Turfton FM)
  <- player sfx (audio.ts play)   horn, steal, squirt, shop and menu sounds
```

| Bus | Code gain | About | Notes |
| --- | --- | --- | --- |
| Master | `MASTER_LEVEL` 0.5 | -6 dB | The mute key sets it to 0. Everything sits under it. |
| Voices | `VOICE_LEVEL` 0.5 x Voices slider (`gta.vol.voices`, default 1) | -6 dB | "A little under the music": the Blackjack mutter at full scale is loud. Not ducked by cutscenes or shops. |
| World one-shots | bus `world` x World slider (`gta.vol.world`) | 0 dB at slider 1 | Each sound's own peak is at most 0.5 (recipes), then distance falloff. |
| Ambience beds + spots | bus `ambience` x Ambience slider (`gta.vol.ambience`) | 0 dB at slider 1 | Bed layers are tiny: 0.01-0.06 each (-40 to -24 dB). They are a floor, not a feature. |
| Cutscene cue (music, beds, stingers, foley) | `CUE_LEVEL` 0.9 | -0.9 dB | Music pads peak at `PAD_PEAK` 0.1. Cue sound is not ducked by the world duck. |
| Music / radio | `@lawn/music` volume 0..1 | 0 dB | Cutscenes set it with the `radio` step (below). |
| Player sfx and UI | straight to master | 0 dB | Not ducked. Menu and shop sounds are short and dry. |

### Ducking and muffling

| Rule | Level | Where |
| --- | --- | --- |
| Cutscene runs: world + ambience duck | 0.3 (-10.5 dB), fade 0.35 s in, 0.6 s out | `sound/index.ts` `duck('cutscene', 0.3)` |
| Shop open: world + ambience duck, shop bell in, door creak out | 0.45 (-6.9 dB) | `duck('shop', 0.45)` |
| Several ducks at once | the deepest wins (`duckLevel` takes the minimum) | `sound/spatial.ts` |
| Not ducked | voices, cutscene cue, music and radio, player sfx | by design: the duck is on world + ambience only |
| Radio during a scene | `script.radio` or 0.25 (-12 dB) by default; `{ do: 'radio', level }` changes it; `stopAll` puts it back to 1 | `cutscene/director.ts`, `cue.radio()` |
| Radio news bulletin outside a vehicle | lowpass 1200 Hz (3800 Hz in a vehicle): the bulletin is heard through a wall | `radio/bulletinAudio.ts` |
| Radio host lines | `radio: true, phone: true` voice chain: band-limited with a little static | `@lawn/mutter` |

### Footsteps

| Who | Level | Rule |
| --- | --- | --- |
| Player | `STEP_LEVEL` 0.7 of the old level (about -3 dB), capped at 0.21 peak, scaled by walk/run `param` | L31: steps sit under the world |
| NPCs | `playAt(step-*, ..., { gain: 0.4 })` (-8 dB) | `sound/watchLife.ts` |
| Same-surface repeat gap | `STEP_GAP` 0.09 s | `sound/bus.ts` |
| Pitch variation | +-12% from `info.rand` | `recipes/world.ts` |

Rules of thumb: a new one-shot peaks at 0.5 or less and is quieter than a vehicle crash. A new bed layer is at most 0.06.
A new cutscene foley is quieter than a line of dialogue; give it `gain` 0.4-0.8 in the cue.

---

## 3. Palette per region

One row per region. `bed` is the world ambience layer mix (`DAY` in `sound/ambience.ts`: wind, hum, leaves, water). The
**cutscene bed** is the `AmbienceBed` to use in a scene set there. Spot sounds are one-shots on the ambience bus; ids
come from `sound/ids.ts`. Region spots marked (R) are `REGION_SOUNDS`, fired by region (`regionAt`) in
`AmbienceFrame.region`. Music is the `MusicTrack` the story uses there (bible section 6 has the "never for" column).

### The 13 regions

| Region (biome) | World bed (day gains) | Spot sounds | Cutscene bed | Music |
| --- | --- | --- | --- | --- |
| Turfton (city) | hum 0.035, wind 0.01; crowd rises with people near, up to 0.05 in a district | `horn-car` (far, 0.4), `crowd-murmur`, `bell-toll` at Noon, far `gun-pistol` on Neon Night | `street` | `turfton`, `turfton-dusk` |
| Dust Flats (desert) | wind 0.03 (lowpass 300 Hz) | `cicada` day, `cricket` night, `wind-gust` | `wind` | none; `heist` for jobs |
| Mossy Wood (forest) | leaves 0.03, wind 0.015 | `bird-song`, `bird-chirp`, `crow`; `owl`, `cricket` at night | `forest` | `fescue` |
| Frostbite Fells (tundra) | wind 0.06 (lowpass 700 Hz) | `wind-gust`, `crow`, `snow-creak` (R), `icicle-tink` (R) | `snow` | `frost` |
| Cloverfield Farms (farmland) | wind 0.018, leaves 0.01 | `bird-chirp`, `moo` (0.5), `crow`; `cricket`, `frog` at night | `meadow` day, `night` after dark | `warm` at Granny's |
| Loch Moss (loch) | wind 0.02, water 0.035 | `water-lap`, `gull`; `frog` at night | `water` | none |
| Tallgrass Commons (parkland) | leaves 0.02, wind 0.012 | `bird-song`, `bird-chirp`, `crow`; `owl`, `cricket` at night | `forest` | `turfton` |
| North Highlands (highland) | wind 0.05 | `wind-gust`, `snow-creak` (R), `icicle-tink` (R) | `snow` (Snowcap Rise), `wind` (open moor) | `frost` on Snowcap Rise |
| South Shore (coast) | wind 0.03, water 0.04 | `gull`, `surf-wash` (R), `buoy-bell` (R), `water-lap` | `shore` | none |
| East Campus (campus) | hum 0.015, leaves 0.015, wind 0.01 | `bird-chirp`, `campus-bell` (R) on the hour | `forest` outdoors, `office` in the halls | none |
| West Estates (estate) | leaves 0.02, wind 0.012 | `bird-song`, `sprinkler-tick` (R) | `garden` | none; `warm` for neighbours |
| Pardonlin (continental) | hum 0.025, water 0.015, leaves 0.01 | `crowd-murmur`, `cafe-clink` (R), `chapel-chime` (R) | `market` | none (a quiet scene gets `warm`) |
| The Unmown (preserve) | leaves 0.035, wind 0.02, water 0.01 | `grass-hiss` (R), `bird-chirp`; `owl`, `cricket` at night | `meadow` | `fescue` |

Night: layers `night` (0.012 x night) is added in every biome except city and tundra (crickets and tree hush);
hum shrinks 40% at full night. Airborne: wind x1.8, everything else x0.25.

### The six batch-3 places

Each place is a part of a region above. The row says what makes it sound like itself. Lore:
`npm run lore -- find <name>`; the setting rows are in `docs/lore/settings.md`.

| Place | Sits in | The sound of it | Bed (cutscene) | Spots | Music |
| --- | --- | --- | --- | --- | --- |
| Snowcap Rise | North Highlands | Hush. Wind is the only big sound; steps are `step-snow` creaks; ice ticks as it warms. Silence between gusts is part of the palette. | `snow` | `snow-creak`, `icicle-tink`, `wind-gust` | `frost` (sparse: one bell phrase, not the whole loop) |
| Saltbucket Shore | South Shore | Surf wash on a slow cycle, a buoy bell that does not keep time, gulls with opinions. | `shore` | `surf-wash`, `buoy-bell`, `gull`, `water-lap` | none |
| Rootwell University | East Campus | A fluorescent hum in the halls, a bell on the hour, earnest footsteps on stone (`step-asphalt`). | `office` inside, `forest` on the lawn | `campus-bell`, `bird-chirp` | none |
| Trellisdown | West Estates | Garden sounds at the correct volume: sprinklers on a timer, a distant mower, birds on a schedule. | `garden` | `sprinkler-tick`, `bird-song` | none |
| Pardonlin | Pardonlin | A café square: murmur, cups, a chapel chime that apologises. Everyone is sorry in a low voice. | `market` | `cafe-clink`, `chapel-chime`, `crowd-murmur` | none; `warm` at a table scene |
| The Unmown | The Unmown | Tall grass hiss, insects, no hum of any kind (no mower, no engine: that is the point). Engines sound loud and rude here; leave them. | `meadow` | `grass-hiss`, `cricket`, `owl` | `fescue` |

Cellars, tunnels and Loamdeep (E17) use the `cave` bed; offices and clinics use `office`.

---

## 4. Weather

Weather is **local**: each player hears their own (`weather/index.ts getWeather`, passed in `AmbienceFrame.weather`,
null indoors or with weather off). It is not on the wire and never changes what other players hear.

| Weather | World ambience | Spot sounds | Cutscene bed |
| --- | --- | --- | --- |
| Clear, cloud | the region bed as in section 3 | as in section 3 | the region bed |
| Mist | region bed, spots a little less often; hush, no new layer | as region | the region bed |
| Rain | a rain bed layer (broadband noise, highpassed) rising with `intensity`; the **wind layer rises with it**; bird spots thin out; the hum and crowd beds stay | `thunder-far` (R) in heavy rain, never in light rain | `rain`; `storm` for heavy rain with gusts and far thunder |
| Snow | everything is muffled (lowpass on the bed layers) **except the wind**, which stays and gets lonelier; steps use `step-snow` | none but `snow-creak`, `icicle-tink` | `snow` |

- Rain starts and stops by fading over a second or two (the bed time constant is 1.2 s), never a click.
- Indoors the weather bed is gone: the cutscene or interior supplies its own (a soft `rain` behind a window is allowed).
- In a cutscene the director picks the bed; it need not match the live weather. Match it when the scene has a window or
  a wide shot of the sky. A `storm` bed pairs with the `thunder` foley on the beat of a flash.
- Rain never makes anything "wet" in dialogue or text (house style); gnomes are "rained on" and "cross about it".

---

## 5. Voices

Speech is `@lawn/mutter` through `voice/speech.ts`: one engine, one Voices slider, `VOICE_LEVEL` 0.5. Cutscene dialogue
(`director.ts`), the comms panel (`briefing/`), ambient gnome barks and the radio all speak through it.

| Speaker | Voice | Where defined |
| --- | --- | --- |
| A main or side character | the `VoiceSpec` for their lower-case cast key (`pip`, `big lou`, `mayor mulch`, `narrator`, ...) | `voice/voices.ts` `VOICES` |
| Anyone unlisted | a voice derived from the name (hash seeds pitch, speed, formant) | `voice/voices.ts` |
| A phone or comms call | the caller's own voice with `radio: true` (band-limited, a hiss) | `briefing/` |
| Turfton FM hosts | their own gnome voice via `speakRadio(line, hostKey, opts)`; Options > Audio "Radio voice" (default on) turns it off | `radio/radioVoice.ts` |
| The news bulletin | SamJs, saying only "News bulletin", through the broadcast EQ: the one non-mutter voice | `radio/bulletinAudio.ts` |

Rules for a new character voice:
- Pick `hz` to match the character's `cutscene/cast.ts` entry. No two voices share (wave, style, rounded formant) (see the header of
  `voice/voices.ts`; `voice/voices.test.ts` covers the voices).
- Big and slow for authority (Bracken, Big Lou, Grout: 70-80 Hz, speed 0.6-0.7); bright and quick for nerves (Pip,
  Nina, Tattler). A villain is calm and low (Vesper: 92 Hz, speed 0.72), never loud.
- A voice is a gag in itself: give one trait (a wobble, a glide, `syllables`, `words`) and keep it.

Text speed and holds:

| What | Rule |
| --- | --- |
| Cutscene subtitles | typed at the Options > Dialogue speed: slow 22, normal 40, fast 75 chars/s, or instant; reading hold 238 wpm with a 1.5 s floor (`cutscene/textSpeed.ts`) |
| Comms panel | hold = `max(3.0 s, words / 3.0 per s)` + 0.8 s after the type-out ends (`briefing/briefing.ts`) |
| Radio text card | reads for `readSeconds(text)`: 16 chars/s, min 4 s, max 10 s (`radio/schedule.ts`); the card holds `max(remaining + 1.5, spoken + 1.0)` seconds so it never vanishes under a line still being spoken |
| Radio spoken text | cut to 160 characters at a word break (`radioCut`) |

A line is never cut off by the next line: the next speaker waits for the speech to end.

---

## 6. Cutscene cue grammar

Four kinds of cue, each with one job.

| Kind | Job | Step | Rule |
| --- | --- | --- | --- |
| Music | the mood of a stretch | `{ do: 'music', track, fade }` or `music:` on a `say` | one track per beat; never stack; drop it (`null`, 0.4-0.8 s) before a reveal or sincere moment |
| Ambience | where we are | `{ do: 'ambience', bed, fade }` | the floor of every scene; change it **on the cut** to a new place |
| Foley / sfx | what just happened | `{ do: 'sfx', id, at?, gain? }` or `sfx:` on a `say` | tied to an on-screen action; lands **a beat before** the reaction shot |
| Stinger | a punctuation mark | `{ do: 'stinger', id }` | at most **two a scene**; never under dialogue |

Scene rules:
1. **Every scene has a bed** (or a stated reason for silence). **At least two foley or sfx cues** tied to on-screen
   action (a door, a cup, a paper, a step on gravel). A talking-heads scene still has a chair and a cup.
2. The sfx comes a beat (0.2-0.4 s) before the reaction, so the cut is told what to look at.
3. Ambience changes on the cut. Fade 2 s by default; 0.4 s for a hard scene change.
4. Music enters after a silence more often than over a line. Under dialogue, music is `warm` or `mystery` at most.
5. No stinger under dialogue. `villain` once when Vesper enters. `reveal` on the picture. `comic` once, on a physical
   gag. `chapter` only on a chapter title card. `intro` only with a character intro (section 7).
6. Radio: ducked to 0.25 by default. Bring it up only when the scene is about the radio.

### Stingers

| Id | Use |
| --- | --- |
| `reveal` | the picture shows the thing |
| `danger` | a threat arrives |
| `comic` | a physical gag lands (once) |
| `sad` | a loss, quietly |
| `triumph` | a win |
| `mystery` | a question |
| `villain` | Vesper walks in |
| `chapter` | the chapter card |
| `intro` | a character intro card (shutter snap + flourish) |

### `FoleySfx` (`cutscene/cueFoley.ts`)

| Id | Use it for |
| --- | --- |
| `cloth` | a coat rustle: someone turns, sits, shrugs |
| `paper` | a page or map handled |
| `pour` | a drink poured |
| `clink` | cups touching, a toast |
| `chair` | a chair scraped back: someone stands to leave |
| `keys` | a jingle of keys: a handover, a getaway |
| `zip` | a bag zipped: the loot is packed |
| `bell` | a small shop or bike bell |
| `crunch` | a bite, or gravel underfoot |
| `creak` | a wooden board or a branch under weight |
| `thunder` | a far rumble: the weather or a mood |
| `gulp` | a nervous swallow before a bad answer |
| `tap` | fingers drumming: impatience |
| `pop` | a cork or lid |
| `clatter` | small things falling |
| `latch` | a gate or case clicking shut |
| `squeak` | a clay gnome's squeak: a joint, a glue repair |
| `shovel` | a spade into soil |
| `flutter` | wings or flapping paper |
| `static` | a radio crackle: a call starts or dies |
| `snap` | a camera shutter (the character intro freeze) |
| `rustle` | a bush or hedge moving: someone is in it |

Older cue sfx still work: `footsteps`, `door-creak`, `whoosh`, `punch`, `thud`, `skid`, `engine-rev`, `glass`, `cash`,
`phone`, `knock`, plus every game sfx from `audio.ts` (`handbrake`, `smash`, `shutter`, ...).

### `ExtraBed` (`cutscene/cueBeds.ts`)

| Bed | Sound | Place |
| --- | --- | --- |
| `snow` | hushed, muffled wind | Snowcap Rise, Frostbite Fells |
| `shore` | surf wash | Saltbucket Shore |
| `cave` | a roomy drip | tunnels, Loamdeep, cellars |
| `market` | café-square murmur with cup clinks | Pardonlin |
| `meadow` | tall-grass hiss and insects | the Unmown, Cloverfield by day |
| `storm` | heavy rain, gusts, far thunder | any heavy-weather scene |
| `office` | fluorescent hum | Rootwell halls, offices, clinics |
| `garden` | a trickling fountain and birds | Trellisdown, Hedgeworth |

The older beds stay: `room`, `street`, `forest`, `wind`, `night`, `crowd`, `water`, `rain`.

---

## 7. Character intro sound

The `{ do: 'intro', who }` step (bible section 6a) plays one sound: the `intro` stinger, a camera **shutter snap**
(`snap` foley) followed by a short flourish. It marks the freeze.

- It goes on a silent beat: no line is speaking, no other stinger is playing. The step waits for it, so it never lands
  under dialogue.
- The bed keeps running under it; the world duck is already on. Music, if any, stays at its level.
- Do not add a `sfx` of your own around it. If a scene wants a second flourish, it is the wrong scene for an intro.
- It counts as one of the scene's two stingers.

---

## 8. Missing sounds

Sounds later epics will need. None exists yet. Propose the id here, add it per section 9, and tick the row.

| Sound | Proposed id | Goes in | Likely epic |
| --- | --- | --- | --- |
| Ferris-wheel creak and clunk | `wheel-creak` | `WORLD_SOUNDS` + `recipes/world.ts` | E11 |
| Carnival call and ticket punch | `ticket-punch` | `CueSfx` (foley) | E11 |
| Ski edges on snow, a hiss and carve | `ski-carve` | `REGION_SOUNDS` + `recipes/regions.ts` | E12 |
| Chairlift cable rattle | `lift-rattle` | `REGION_SOUNDS` | E12 |
| Golf club strike (a clay tock) | `golf-tock` | `WORLD_SOUNDS` | E15 |
| Ball dropping in the cup | `cup-drop` | `WORLD_SOUNDS` | E15 |
| Tractor idle and putter | `tractor-putter` | a loop in `sound/loops.ts` | E16 |
| Hay bale thump | `hay-thump` | `CueSfx` (foley) | E16 |
| Mole tunnel scrabble and dirt fall | `tunnel-scrabble` | `REGION_SOUNDS` | E17 |
| Roots creaking in a tunnel | `root-creak` | `REGION_SOUNDS` | E17 |
| Skateboard roll on pavement | `board-roll` | a loop in `sound/loops.ts` | E19 |
| Skateboard ollie clack | `board-clack` | `WORLD_SOUNDS` | E19 |
| Lectern bell, a lecture hall murmur | `lecture-murmur` | `ExtraBed` or a spot | E20 |
| Sprinkler head popping up | `sprinkler-pop` | `REGION_SOUNDS` | E21 |
| Church bell for a wedding (long peal) | `peal` | `REGION_SOUNDS` | E22 |
| Page turn of a ledger | `ledger-turn` | `CueSfx` (foley) | any |

If an id already exists when you get there (grep `ids.ts` and `script.ts`), use it and strike the row.

---

## 9. How to add a sound

1. **Pick the home.** In-world, positional or on the bus: an id in `sound/ids.ts` (`WORLD_SOUNDS`, `CRITTER_SOUNDS`,
   `REGION_SOUNDS` ...). In a cutscene only: a `FoleySfx` in `cutscene/script.ts` (and `FOLEY_SFX`). A bed: an
   `ExtraBed` (and `EXTRA_BEDS`). A stinger: `Stinger`.
2. **Name it.** Short, lower-case, hyphenated, a noun or a noun-verb (`surf-wash`, `snow-creak`). Not `sfx-3`.
3. **Write the recipe.** World ids: a `Recipe` in `sound/recipes/<file>.ts` (peak 0.5 at most; stop every source by
   `t + returned seconds`; vary pitch with `info.rand`). Cutscene foley: a synth in `cutscene/cueFoley.ts`. Beds: a
   builder in `cutscene/cueBeds.ts`. Procedural only.
4. **Set range and gap** for a world id: `MAX_DIST` and `MIN_GAP` in `sound/bus.ts` if the 60 m default or the 0.04 s
   gap is wrong.
5. **Wire the trigger.** A spot sound: add it to a region or biome in the ambience picker. A scripted one: a `sfx`
   step. A game event: `playAt` / `play2d`.
6. **Test.** `npm run test -w games/gnome-theft-auto -- sound` (ids all have recipes; recipes return a duration and
   stop their nodes). Run the single test file while working: `npx vitest run src/sound/<file>.test.ts`.
7. **Update this file.** Add the row to the table in section 3, 6 or 8 (and strike it from section 8). A sound the
   bible does not mention does not exist for the next scene writer.
8. **Check the mix.** Listen at phone volume and at full: the new sound must not cover a line or a vehicle.
