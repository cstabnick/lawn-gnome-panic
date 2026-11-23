# DayG soundscape: world ambience

> Status: design only. Scope: the **world** layer of the sound. That is the beds under the player (wind, birds,
> water, machines), the time of day and weather, the underground, and the sounds that come from the simulated world
> at a distance (a horde across the map, a herd in the next row, the bell, the Mowing). Out of scope: music, UI
> sounds, and combat or gameplay sounds (footsteps, shots, melee, the player's own voice). Those belong to other
> agents. Hatless steps that happen in the player's own bubble are also left to them.

Mossgrave is quiet by design. Sound is information here: a herd you can hear before you see, a bell that gives away
where you are, a fire that carries at night. So the ambience has two jobs. It makes the cemetery feel alive (the
birds, the wind, the drip), and it quietly reports the state of the world (the far-off horde, the weather you can't
see from inside a crypt). Every layer below is driven by a value the game already has, so the sound follows the
simulation and nothing is scripted.

## 1. Layer table

| ID | Layer | Kind | Driven by (game variable) | Synthesis (no files) |
|---|---|---|---|---|
| **A** | District bed | loop, always on | player's region's district; region traits (`ECHO`, `HUSH`, `OPEN`...) | filtered noise + sparse sine/FM events, per district |
| **B1** | Wind | loop | `weather.wind` (0–1), `weather.windDir`, `weather.kind` | brown noise, lowpass, gust LFO |
| **B2** | Dawn and day birds | scheduled events | `clock.light`, `clock.hourOfDay`, `weather.kind`, `clock.season` | FM chirp phrases, Poisson timing |
| **B3** | Night insects and owls | scheduled + loop | `clock.night`, `clock.light`, `clock.season`, `weather.kind` | AM sine trains (crickets), sine glide (owl) |
| **C1** | Rain | loop | `weather.kind` (drizzle / rain / storm), `weather.wind` | pink-noise hiss + droplet clicks |
| **C2** | Storm thunder and lightning | one-shot | `weather.kind === 'storm'`, sky flash (`sky.ts`) | brown-noise rumble with delayed onset |
| **C3** | Fog | filter only | `weather.kind === 'fog'` | global lowpass + shorter reverb |
| **C4** | Frost | loop + events | `weather.kind === 'frost'`, `weather.tempC` | high ice ticks, stem creak |
| **D** | Season colour | loop + events | `clock.season`, `clock.hourOfDay` | leaf skitter, insect drone, frogs, silence |
| **E** | Region traits | modifiers on A | `HUSH`, `ECHO`, `DARK`, `FLOODS`, `WARM`, `NEST`, `PIT`, `HIGH`, `SACRED` | filter and reverb settings, extra beds |
| **F** | Underground | bed + reverb send | player in a `DEEP` region; `FLOODS`; region depth; spring rain | convolver tail, drips, distant water, low hum |
| **G** | Far horde field | loop, panned | `horde.density` summed over nearby regions, weighted by hop distance | brown-noise roar with a slow sub swell |
| **H** | Herd on the move | moving one-shot | `herd-moved` event (`from`, `to`, `size`) | dry clack swarm and shuffle, panned along the route |
| **I** | Noise ripples | one-shot | `addNoise` calls (`horde.noise` deltas, player noise events from others) | short muffled thud or knock, delayed by hop count |
| **J** | The bell | one-shot, map-wide | `bell` event (`region`), `tuning.bell.hops` | additive inharmonic bell, distance lowpass and delay |
| **K** | The Mowing | rumble, then drone | `mowing-soon` (`district`, `inTicks`), `mowing` event | sub sine pulse; sawtooth-through-lowpass drone |
| **L** | Far pack | loop, panned | NPC `group` members in nearby regions, `group-formed` / `group-split` | band-passed murmur from formant-like noise bursts, very low |
| **M** | Machines | loop | Shed and Mower Yard region; `Digger's Rest`; `fuel` in region | sub pulse train, metallic ticks |

Layers A through F are **the bed** the player lives in. G through L are **the distance**: sounds that come from the
simulation, not from the scenery. M is a district accent that belongs to the Shed.

---

## 2. Engine and budget

### 2.1 Stack

- **Plain Web Audio, no Tone.js.** Everything here is a noise buffer, an oscillator, a biquad filter, a gain and a
  convolver. Tone.js adds weight without buying anything this design needs. (If the music agent picks Tone.js, the
  ambience can still sit on the same `AudioContext` through `Tone.getContext()`.)
- **One context, created on the first user gesture** (phones block audio until a tap). The game shows the audio
  toggle in the existing settings menu and starts ambience on the first tap of the game's start button.
- **Module location:** `games/dayg/src/audio/`. Split in two so the mapping can be tested headless:
  - `params.ts`: a **pure** function `ambienceParams(state): AmbienceParams`. It reads the clock, the weather, the
    player's region and the sim's event list, and returns numbers (gains, cutoffs, rates, pan, reverb). No Web Audio
    here. This keeps the design testable like the rest of `src/sim`.
  - `synth.ts` and `layers.ts`: the Web Audio side. They take `AmbienceParams` and set nodes. Math.random is fine here
    (client only, like `sky.ts`). Nothing in `src/sim` may call it.
- **Update rate:** params are computed at about 10 Hz, not every frame. Node parameters are changed with
  `setTargetAtTime` (time constant 0.4–1.5 s, see section 8). One-shot events are scheduled on the audio clock.

### 2.2 Shared building blocks

| Block | Recipe | Used by |
|---|---|---|
| **Noise buffers** | generate once: 4 s white, pink (Paul Kellet filter), brown (leaky integrator); loop them | A, B1, C1, C2, F, G, K |
| **Filter chain per layer** | `BiquadFilter` (lowpass, highpass or bandpass) then `GainNode`, then the layer bus | every loop |
| **Reverb send** | `ConvolverNode` with a generated impulse (exponential noise, decay set per region: 0.6 s open, 2.5 s `ECHO`, 4 s `DEEP`) | A, E, F, J |
| **Bell** | additive: 7 partials at ratios 0.5, 1.0, 1.19, 1.56, 2.0, 2.52, 3.0 (weights 0.5, 1, 0.6, 0.5, 0.4, 0.25, 0.15), each a sine with its own decay (T60 6–18 s, the hum partial longest). A 6 ms bandpassed noise click (2–4 kHz) gives the strike | J, and the bell tower sounds in A (Bell Chapel) |
| **Chirp** | sine carrier 2–6 kHz with FM modulator at ratio 1.5–2.5; envelope attack 8 ms, decay 40–90 ms; phrases of 2–5 notes with ±300 Hz pitch glide | B2, D (spring) |
| **Droplet** | 2–4 ms sine click, 3–8 kHz, random pitch | C1, F, E (`FLOODS`) |
| **Sub pulse** | 18–35 Hz sine at 2–4 Hz amplitude pulses, with a second sawtooth at double frequency through a lowpass at 120 Hz | K, M |

Node budget: at most about **18 live nodes per layer** and **about 60 in total** on a phone, with the reverb convolver
shared (one for each of the three reverb settings, not one per layer). One-shots are pooled and stop themselves.

### 2.3 Mixing bus and priority

Relative gains (the bed is the reference, 1.0):

| Bus | Gain | Ducked by |
|---|---|---|
| Bed (A, E) | 1.0 | underground (F) cuts it to 0.2; a bell (J) ducks it by 0.5 for 3 s |
| Weather and sky (B1, C1–C4) | 0.4–0.9 | underground cuts to 0.1 |
| Life (B2, B3, D) | 0.2–0.5 | storm (C2) cuts birds to 0.0 for the storm's length |
| Distance (G–I, K–L) | max 0.25 | never louder than the bed; ducked by the bell and by the player's own nearby sounds |
| Events (J, C2) | up to 0.9 (bell peak) | — |

Distance layers are **capped** so that a horde of 4,000 across the map can't drown the wind. The cap is the point: the
player should read the far sounds as a difference in the bed, not as a second voice.

---

## 3. The variables that drive the audio

All values come from the game's existing state. Nothing here needs a new sim field, except where marked.

| Variable | Where | Used for |
|---|---|---|
| `clock.light` (0–1), `clock.night`, `clock.hourOfDay` | `game/clock.ts` (Clock) | day/night blend, birds vs insects, dawn chorus window |
| `clock.season` | Clock | season colour (D), insects, leaves, frost |
| `weather.kind` | `sim/types.ts` WeatherState | rain, storm, fog, frost, overcast (fewer birds) |
| `weather.wind` (0–1), `weather.windDir` (radians) | WeatherState | wind bed level; storm wind 0.8–1; the direction sets which stereo side the gusts favour |
| `weather.tempC` | WeatherState | frost ticks (below 0 °C), a hint of breath in the Compost bays, cricket cut-off in cold nights |
| player's region, district | region rects in `sim/regionsFull.ts` (`rect`), `district` | A, E: which bed, which traits |
| region `traits` | `RegionDef.traits` | E: filters and reverb |
| `horde.density[region]` | `HordeState` | G: the far field; also whether a region is a "nest" (bins, the Pile) |
| `horde.herds[]` (`region`, `size`, `target`) | HordeState | G and H |
| `herd-moved` events | `SimEvent` | H: a moving sound from `from` to `to` |
| `addNoise` (`horde.noise` delta, or a `noise` action) | `horde.noise`, actions.ts | I: ripples |
| `bell` event, `bellTick`, `tuning.bell` | `SimEvent`, WorldState | J |
| `mowing-soon`, `mowing`, `mownUntil` | `sim/mowing.ts` | K |
| `group-formed`, `group-split`, group `members` and `region` | `SimEvent`, `Group` | L: where a pack is, and how big |
| `promoted.hatless`, the player's bubble `hatless` | WorldState, Bubble | nearby Hatless count; used only to set the far field's level, not to make steps |
| `game/needs` (warmth) | game | optional: the player's breath and teeth-chatter in frost are not ambience; leave them to the gameplay agent |

Two timing facts shape the design:

- **Sim ticks are slow.** At L2 the sim ticks once per sun-hour (24 per sun-day, `tuning.clock.ticksPerDay`). The
  horde noise field decays by half each tick (`noiseDecay` 0.5). So the audio **cannot poll** `horde.noise` and expect
  a ripple. It has to listen for the `addNoise` calls and the events. L1 regions tick at 1 Hz and L0 at 20 Hz, which is
  where the audio's own smoothing runs.
- **A herd event arrives every few real minutes** (one sun-hour is 5 real minutes at L2). So H stretches each
  `herd-moved` into a 15–25 s moving sound. The route is interpolated along the region centres, not replayed from the
  sim.

---

## 4. The bed by district

Each district has a base bed (A) and one or two accents. Region traits (E) change them further. The "bed" is what you
hear when you stand in it on a quiet day. Gains are relative to the bed (section 2.3).

| District | Bed (A) | Accent (what makes it this place) | Default reverb |
|---|---|---|---|
| **The Lychgate** | wind through timber (bandpass 280–620 Hz, Q 4, a slow creak LFO 0.05–0.15 Hz, 1–3 s creaks), very low noise at the gate roof | a small fire crackle (short random impulses through a highpass at 900 Hz) when the Waystation is lit (haven flag); noticeboard paper flutter (short 3–4 kHz noise bursts, irregular) | open 0.6 s |
| **The Old Rows** | wind through arches: a comb filter (delay 4–9 ms, feedback 0.5) on pink noise, so the wind has a hollow, pitched whistle | ivy rustle (bandpass 1.5 kHz, slow amplitude random walk); crow calls (sawtooth formant at 450–700 Hz, glide down 150 Hz, 2–3 caws); `ECHO` on everything | 2.5 s |
| **Wreathwood** | quiet and muffled: a global lowpass at 900 Hz on the bed | wire chimes (short inharmonic bell with 0.5 s decay, pitched 2–4 kHz, triggered by wind gusts); ribbon flutter (highpass noise, 6–9 Hz amplitude wobble); `HUSH` | 0.8 s |
| **The Compost Heaps** | warm fermenting bed: brown noise, lowpass 300 Hz, plus slow bubbling (sine glide 120→300 Hz, 0.1–0.3 s, irregular, density by `WARM`) | a faint hiss of steam (highpass noise, very low gain) in cold weather; the Warm Bays' `NEST` shuffle (broad noise, 80–400 Hz, random) when `horde.density` is high | 1.2 s |
| **The Gnome Garden** | wind-driven windchimes: the bed is wind (B1) plus chimes struck on gust peaks (inharmonic bell, 1.5–3 kHz, short decay) | the Pile: a 55 Hz hum that rises in level after dusk (`clock.night`), and a dry settling tick (clay on clay, 2–5 kHz click, sparse) | 1.5 s |
| **The Columbarium** | the walkway's echo: a long reverb (3 s) on any sound, with the bed kept low | pigeon wing flaps (noise bursts 80–120 ms, 2 Hz clusters) and cooing (sine 380–480 Hz, FM wobble); the Lantern Keepers' city hums at night (a steady 110 Hz tone, very low) | 3.0 s |
| **The Bell Chapel** | the chapel's own bed is an absence: the nave reverb (3.5 s) with a low pulse of breath-like noise for the Kiln Sisters' kiln | the chapel bell (J) rings for its own region whenever it sounds; the Catacombs drip (see F) | 3.5 s |
| **Mausoleum Hill** | `DARK` bed: sparse, a low wind over stone (brown noise 150 Hz lowpass, gust LFO) | iron door creak (bandpass 200 Hz, pitch glide 180→240 Hz, very rare); the crypts' stained glass has no sound | 2.0 s |
| **The Lawn Section** | open wind with almost no reverb (`OPEN`): the bed is raw wind (B1) and distance | sprinklers (`Sprinkler Field`: timed hiss, 40 s on-off cycle, bandpass 3 kHz), the bench line's silence (no insects, no wind lift: a dead patch that tells you a sniper perch is near) | 0.4 s |
| **The Drowned Corner** | water: a lily pond with sparse water blips (sine 300–800 Hz, downward glide, 1–3 per minute) and a reed hiss (highpass noise, `HUSH`) | the willow's leaf rustle; frogs in spring (see D); the drain mouth's gurgle (F, below) | 1.0 s |
| **The Yew Walk and the Tap** | the Tap: a standpipe drip (sine 700–1100 Hz, 1–2 Hz, pitched drops with 0.8 s decay); the Yews: leaves (bandpass 2 kHz, wind-driven) | the Walk: gravel steps from traders and patrols (a gameplay concern, not in this layer); crows in the yews (as Old Rows) | 1.2 s |
| **The Shed and the Mower Yard** | the Shed's inside: metal tools swinging on shelves (sparse 1–3 kHz clinks, from wind through the door), sacks settling | the Mower Yard: a dead machine: a single slow tick of cooling metal every 6–10 s, and the mower's oil drip (M) | 2.0 s |

The bed is picked by the player's region, and the bed fades over **2.5 s** when the region changes. A player walking a
row sees the change happen as a sound.

---

## 5. Region traits as modifiers (E)

These apply on top of any district bed. They are stacked, so an `ECHO` `HUSH` region gets both.

| Trait | Audio change |
|---|---|
| `ECHO` | reverb send up (+6 dB on the convolver), decay 2.5 s |
| `HUSH` | bed lowpass at 1.2 kHz; reverb down; ambient bird count halved |
| `COVER` | bed lowpass at 1.6 kHz (the grass takes the high end); only birds from the near field |
| `OPEN` | reverb 0.4 s; wind gains up 2 dB |
| `DARK` | birds off; insects only in summer; an extra low-pass drone at 60 Hz (the dark's hum) |
| `FLOODS` | a water hiss (highpass noise, very low) when rain is on or it is spring; drips (droplet, 0.2 Hz) |
| `WARM` | bubbling (Compost) and insects in summer, all at a low gain |
| `NEST` | the crowd shuffle: broad noise 80–400 Hz, density scaled from `horde.density[region]` (cap at 0.2 gain) |
| `PIT` | a deep hollow echo on distant sounds (reverb with a 150 ms pre-delay and 4 s tail) |
| `HIGH` | wind up 3 dB; the far field is quieter (higher means less ground noise) |
| `SACRED` | birds stay on; no drones or pads (music is out of scope). The Child Graves get a windchime at 0.5 gain |
| `MOSSY` | a soft, wet bed (lowpass 600 Hz) and a low murmur of wet sponge sounds (very low gain) |
| `DEEP` | switches to layer F, below |

---

## 6. Time of day (B2, B3)

All of this uses `clock.light` (0–1, a 2-hour smooth ramp at dawn and dusk, from `game/clock.ts`), so the transition is
continuous and not a switch.

### 6.1 Dawn and day birds (B2)

- **Level:** `birds = clock.light * (1 - rain) * (1 - storm) * seasonBirds`, where `seasonBirds` is spring 1.0,
  summer 0.7, autumn 0.5, winter 0.2. `overcast` halves it; `fog` takes it to 0.3; `frost` keeps 0.2.
- **Dawn chorus** (hour 6–8.5 by `clock.hourOfDay`): a phrase every 2–5 s, 2–5 chirps per phrase, a random pair of
  species (two pitch bands, low-chirp 2–3 kHz and high-trill 4–6 kHz).
- **Day** (8.5–20): a phrase every 6–20 s with fewer chirps, quieter. Birds sit in `HIGH` and `COVER` zones more
  often: the rate is multiplied by 1.4 in a `HIGH` region and 0.6 in a `DARK` one.
- **Yews, Old Rows, Columbarium:** the rate is up (+30%), because those are the bird places.
- Each phrase picks a random spatial position (the stereo pan from −0.7 to 0.7, distance by the region's `HIGH` flag).

### 6.2 Night insects and owls (B3)

- **Crickets** (summer and autumn, `clock.night`, not `rain`, `tempC` above 6 °C): AM sine at 4.2–4.8 kHz pulsed
  at 25 Hz, in trains of 3 pulses every 1–2 s. Level `night * (1 - rain) * (season summer 1.0, autumn 0.5)`. Cut by
  2 dB per degree below 6 °C, and gone below 2 °C.
- **Owl** (any season except frost): a two-note hoot every 60–180 s in the dark of a `HIGH` or `OPEN` region, sine glide
  500 → 420 Hz over 0.8 s, then a second hoot 1.2 s later at 0.8 the pitch. Probability per minute is 0.1 in a `DARK`
  region, 0.02 elsewhere. It never plays in a storm.
- **Night quiet:** from 2 to 5 hours after dusk, birds are off completely and the bed drops by 3 dB. Night is audibly
  emptier, and the Hatless are the only other thing out there.

---

## 7. Weather (C1–C4)

Weather is a seeded Markov chain per district (`weather.kind`, `sim/weather.ts`). The audio follows the kind and
blends over about 4 s. The `kind` values are the same ones `sky.ts` uses, so the sky and the sound agree.

### 7.1 Wind (B1), always present

- **Source:** brown noise, looped, lowpass at 420 Hz (or 300 Hz indoors, a 6 dB cut from the crypt and shed `ECHO`).
- **Level:** `wind * 0.35` (so `wind` 0 is near silent, `wind` 1 is loud). `storm` sets wind 0.8–1, so a storm is
  always windy.
- **Gusts:** an LFO at 0.03–0.12 Hz, amplitude ±40%, plus a random bandpass sweep (200–900 Hz, Q 2, one sweep every
  8–15 s) that gives the gust a voice.
- **Direction:** `windDir` sets the gust's stereo side (`pan = 0.6 * sin(windDir − listenerYaw)`), so wind is audibly
  coming from the south-west when `windDir` is there. It's a cue, not a true direction.
- **Wind through objects (E):** a comb filter (section 4, Old Rows) and a whistle at 300–500 Hz when `wind > 0.6` in
  an `ECHO` region, the gate timbers' creak in the Lychgate. These are the chimes and the wind's accents.

### 7.2 Rain (C1), `drizzle`, `rain`, `storm`

- **Hiss:** pink noise, bandpass 2–6 kHz (Q 0.7), gain `drizzle 0.15`, `rain 0.4`, `storm 0.55`.
- **Droplets:** Poisson clicks at 30 (drizzle), 120 (rain), 200 (storm) per second; each a droplet (section 2.2) with
  random pitch in 3–8 kHz, panned randomly. On stone (`ECHO`, `DEEP`) the clicks ring with the reverb's tail, on grass
  (`COVER`, `HUSH`) they are short and softer.
- **Gutter and tap (`FLOODS` regions):** the water hiss rises (a highpass noise, gain 0.3) and the drips come in
  bunches.
- **Rain hides the rest:** while it rains, the far field (G) and the pack (L) drop by 6 dB, and the birds (B2) stop.
  This matches the design: rain hides noise and smells (world.md). In the sound it means a horde can walk past in the
  rain and you hear it less.

### 7.3 Storm: thunder and lightning (C2)

- **Lightning flash:** `sky.ts` already runs a flash timer (8–20 s between flashes in a storm). The audio does **not**
  generate its own timer. It reads the same value (the flash state, a new field to expose from `createSky` or the
  flash start time) and schedules the thunder from it. This keeps sight and sound together.
- **Thunder:** brown noise 4 s, lowpass sweeping 420 Hz → 80 Hz over the first 1.5 s, envelope attack 0.3 s, decay 3 s.
  The delay is the distance: `delay = 0.5 + rng(0, 3.5) s`. A near strike (under 1 s) adds the 6 ms bandpass click.
- **Storm bed:** birds off, rain (C1) at storm gain, wind (B1) up, the far field (G) muffled to a lowpass at 400 Hz.

### 7.4 Fog (C3)

- **Fog is a filter, not a loop.** A global lowpass on the whole world bus (cutoff 3.5 kHz, Q 0.5), reverb tail
  shortened to 0.5 s, and far sounds (G, H, I, J, K, L) drop 4 dB. Birds keep only their near phrases (distance
  under 3 gm, i.e., a chirp right next to you). In fog a sound is close or it is nothing, which matches the sight rule.

### 7.5 Frost (C4)

- **Frost ticks:** high clicks (sine 6–9 kHz, 1–3 ms) at 0.5–2 per second, the ice of the grass cracking.
- **Stem creak:** a sawtooth at 90–140 Hz, pitch wobble by ±5 Hz, a very low gain, only in `OPEN` regions (grass
  bends and holds). Cut under `DARK` and `NEST`.
- **Cold colour:** the bed's lowpass moves up (the air is crisp) by 500 Hz; the far field (G) rises in brightness
  slightly (the sim's `frost` speeds the Hatless up in spring and slows them in frost, so the far field's tempo drops).

## 8. Seasons (D)

`clock.season` is seeded per world and switches over 7 sun-days (`daysPerSeason` in tuning). The change is a 60 s
crossfade of the season colour, never a jump.

| Season | Colour | Level and recipe |
|---|---|---|
| **Spring** | frogs, thaw water, returning birds | frogs at the Drowned Corner and the Tap's drain: a ratchet of 10–20 Hz clicks from a sawtooth at 180–260 Hz through a bandpass at 500 Hz, in choruses every 20–40 s, at night and after rain. Water (F) is the spring's big sound: `FLOODS` regions get a louder hiss. Birds at 1.0. |
| **Summer** | insects, long light | insect drone: three sines at 3.5–5 kHz, an AM at 4 Hz, very low, in `WARM`, `COVER` and `HUSH` regions. Crickets at night (B3). Birds at 0.7. |
| **Autumn** | leaves | leaf skitter: bandpass noise 1.5–4 kHz, 10–30 ms bursts, Poisson at 0.2–2 per second, rate by `wind`. It is loudest in the Yew Walk and the Old Rows (ivy). Crickets at 0.5. |
| **Winter** | near silence, frost creaks | the bed drops 4 dB, birds at 0.2, the frost layer (C4) comes in on cold nights, and the Compost (`WARM`) gets a relative swell as the only warm sound in the cold. |

The **Mowing** (K) is not a season layer. It happens in a district, so it is in section 9.

---

## 9. Distance: sounds from the simulated world (G–L)

These are the layers the player hears from places they cannot see. Each one has a **hearing radius** in hops
(`graph.neighbours`, the region graph), usually 2, and each is capped below the bed (section 2.3). Positions come from
region centres (`rect` midpoints), so a sound has a direction and a distance without a 3D model.

### 9.1 The far horde field (G)

The loop that tells you the map is alive.

- **Input:** `F = Σ over regions r within 3 hops of density[r] * 0.5^hops(r)`, using `horde.density` and the region
  graph. Also add the player's own bubble `hatless` (the L0 Hatless are not in `density` while promoted, so add them in).
- **Level:** `gain = 0.22 * (1 − exp(−F / 120))`. So ten Hatless close by are barely there, and a hundred is a clear
  presence. The curve flattens at about 400.
- **Recipe:** brown noise lowpassed at 180 Hz (the roar of a crowd heard through a wall), plus a sub sine at 36–48 Hz
  with a 0.05 Hz swell (the slow breath of the horde). A third layer is the shuffle of many small feet: bandpass noise
  at 600–1 kHz with random 20–60 ms clicks, rate scaled by `F`. No voices. The Hatless are silent; what you hear is
  the bodies moving, which is what a herd sounds like.
- **Pan:** the centroid of the weighted density, relative to the player's facing. A herd west of you pulls the field
  left.
- **Night:** the field rises by 3 dB after dusk (`clock.night`), because the Hatless rise at night (world.md, and the
  Pile rises at night).
- **Rain and fog:** rain drops it 6 dB; fog 4 dB (section 7).

### 9.2 Herd on the move (H)

- **Trigger:** a `herd-moved` event `{ from, to, size }`. Only for `from` or `to` within 2 hops of the player.
- **Recipe:** a swarm of dry clacks (short 1–3 kHz bandpass noise, 5–15 ms, density ∝ `size`, capped at 40/s) plus
  shuffles (section 9.1's shuffle layer, louder). The sound travels: a `StereoPannerNode` and a lowpass that sweeps from
  the `from` centre to the `to` centre over 15–25 s. The gain follows the distance to the herd, not the time.
- **Size cue:** `size` sets the clack density and the loudness. A 10-Hatless herd is a patter; 200 is a crowd.
- **Limit:** one moving herd sound at a time per side (left and right), so two herds don't make a crowd of sounds.

### 9.3 Noise ripples (I)

The sim's `addNoise` (the bell, a broken barricade, a shot from an NPC, a player's door break) lands on regions.
Ripples are the audio of those.

- **Trigger:** each `addNoise(region, amount)` call that the game is allowed to pass to the audio bus (the game
  wraps it; the sim doesn't play sound).
- **Recipe:** a muffled thud: lowpass 350 Hz noise burst, 80–250 ms, with gain `amount` mapped to 0.05–0.25. Delay
  `hops * 0.35 s` so a noise two regions away arrives later and softer. If the region is an `ECHO` one, add the
  reverb tail.
- **Not a gunshot.** Shots and melee belong to the combat agent. Ripples are the world's own noises: a fallen
  barricade, a door in the next row, a crate dropped in the Shed.

### 9.4 The bell (J)

- **Trigger:** `bell` event for `region`. Range: `tuning.bell.hops` (the spire rings the herds for 2 km).
- **Recipe:** the chapel bell, with the additive recipe in section 2.2 at base 330 Hz, 8–14 s
  decay, strike click 6 ms. Mapped to the listener by hops: `gain = 0.9 * 0.6^hops`, lowpass `(6 kHz − 1.2 kHz × hops)`,
  delay `0.4 * hops s` (sound takes a moment to cross the map).
- **Ducking:** the bed (A) drops to 0.5 for 3 s, birds stop, and the far horde (G) jumps 4 dB for 20 s. The bell is
  the one sound that tells the herds where you are, and the audio should say so too.
- **Within the Bell Chapel:** the bell is a close-up sound, with a stronger strike click, and the bed is the nave's
  reverb (3.5 s).

### 9.5 The Mowing (K)

The Mowing is never seen (world.md, core fact 3). It is heard, first as a rumble and then as a night of quiet grass.

- **`mowing-soon`** (`district`, `inTicks`): a sub rumble in the district's bed, starting at `inTicks` minus 1 sun-hour
  (5 real minutes) and building over that time. Recipe: a 22–30 Hz sine pulsing at 3.5 Hz, gain rising from 0 to 0.35,
  with a faint sawtooth at 70 Hz through a 150 Hz lowpass. The rumble is heard in **every** district within 4 hops,
  louder in the district that is cut, so the player can guess which one (the seed's schedule is what the factions try
  to predict).
- **`mowing`** (the cut): the rumble ends. For one sun-hour a drone of a far mower plays in the cut district, as a
  sawtooth through a lowpass at 260 Hz with a 2.5 Hz amplitude pulse (a single-cylinder engine heard at a distance).
  Then the bed of that district (A) gets its `mownUntil` flag: no insects, no leaves, and the birds leave. The silence
  is the record of the cut.

### 9.6 Far pack (L)

A pack in the next row is a murmur, not speech. The sound does not carry words.

- **Input:** NPC groups (`Group.members`, `Group.region`) in regions within 2 hops; the size of the group is the
  member count. Only groups in a state of activity (a forage, a talk, a fight, a move) make sound.
- **Recipe:** formant-like noise: a pink noise burst through two bandpasses (500 Hz and 1.5 kHz, Q 6) gated by a random
  envelope at 2–4 Hz, with a random pitch wobble (±15%) on the bandpass centres. Several of these at once make a murmur.
  Lowpass the whole thing at 900 Hz. Gain by group size: `0.04 * sqrt(size)`, capped at 0.15.
- **Events:** `group-formed` plays a short laugh-like murmur burst (louder); `group-split` a sharp cut (two bursts
  apart); `group-dissolved` a fade-out of the murmur over 3 s.
- **Not voices:** no speech, no words, and no synthesized vowels that could be read as language. A pack reads as "people
  are over there", which is all the player needs.

### 9.7 Machines (M)

- **Shed and Mower Yard:** a dead machine. Metal ticks of cooling (1–3 kHz clicks every 6–10 s, random), the mower's
  oil drip (a sine at 600 Hz with a 0.3 s decay, every 2–4 s), and a faint sub hum of a stopped engine that is only
  heard when `fuel` is in the region (a fuel-can rattle, 2–3 Hz). Not a working engine, because nothing in the Yard
  works.
- **Digger's Rest** (New Hill's mini digger, a Tall-size parked machine): a tick and a hiss of an idle engine at 18 Hz
  pulses, present only when a mechanic (an NPC group in the region) is working. The group's `region` drives it.
- **The Kiln Sisters' kiln** (Bell Chapel): brown noise bandpassed at 90–300 Hz with a `woomph` (a 0.4 s noise burst
  with a 60 Hz sine) every 20–40 s when the haven's kiln is lit (haven flag).

---

## 10. The underground (F)

Sound carries underground. The Deep layer is where the sounds of the Catacombs, the Wormways, the storm drain and the
irrigation pipes come from. It is also where the surface stops reaching, so the audio should change completely.

### 10.1 Entering and leaving

- **Trigger:** the player's region has `DEEP` (`Catacombs`, `Wormways`, `Drain Mouth`, `The Irrigation`, `Back Stair`,
  `The Sinks`, and `Digger's Rest` shaft if added). The change is a **1.5 s crossfade**. The surface beds drop to
  their underground levels (section 2.3: bed 0.2, weather 0.1, life 0, distance 0.4 of its normal).
- **Ceiling filter:** surface sounds that reach you from above go through a lowpass at 900 Hz, so the sky is a muffled
  hush. Sounds from the same level (another tunnel, a drip) are not filtered.
- **Reverb:** the `DEEP` reverb is the longest on the map: a 4 s convolver with a 120 ms pre-delay. Every sound in
  the Deep is reverberant, which is the acoustic signature of underground.

### 10.2 The underground beds

| Place | Bed | Accents |
|---|---|---|
| **Catacombs** (the Bell Chapel, `DEEP` `DARK` `ECHO` `FLOODS`) | a low hum at 52 Hz, with brown noise lowpass at 200 Hz (the sound of stone under weight); thousands of Hatless sleeping: the far-field shuffle at 0.2 of its usual gain, slow | drips (droplet, 0.1–0.3 Hz, pitched 1.2–2.2 kHz, long reverb), distant running water under the stone (bandpass 400 Hz noise, low gain) |
| **Wormways** (Compost, `DEEP` `DARK` `WARM`) | soft, wet: the bubbling (compost) at a low gain, with a warmer bed | worm-tunnel scrape (bandpass 2 kHz noise, rare) |
| **Drain Mouth** (Drowned Corner, `DEEP` `DARK` `FLOODS` `GATE`) | the water flows: brown noise 180 Hz bandpass, with the gurgle of a culvert (sine glide 150→300 Hz, 0.3 s, irregular) | a rain-fed surge (F gets a louder water layer after rain for 10 sun-hours) |
| **Irrigation** (Lawn Section, `DEEP` `DARK` `ECHO`) | a pipe hum at 60 Hz with harmonics; the valve boxes click (2–4 kHz, short) when the sprinklers start | sprinkler water in the pipes (a long hiss) |
| **The Sinks** (Old Rows, `PIT` `DEEP` `FLOODS`) | a trapped horde: the far field's shuffle at full gain, but echoing: `PIT` reverb (150 ms pre-delay, 4 s tail) | the scrabble of trapped Hatless at 1.5–3 kHz (sparse, random, as if at the bottom of a shaft) |
| **Back Stair** (Mausoleum Hill, `DEEP` `CHOKE`) | the stone steps; a steady air draught (brown noise 250 Hz bandpass) | none |

### 10.3 Depth

The depth below the surface is not a number in the sim (regions have a `floorY`, `sim/regionsFull.ts`). Use it: the
bed's lowpass moves down by 150 Hz for each 10 gm under the surface, down to 200 Hz at −40 gm (the deepest layer in
world.md). The deeper it is, the more the sound is a hum with almost no air in it.

---

## 11. Mobile, performance, and tests

- **Phones.** Audio resumes only after a user gesture. A sound on/off button in the existing UI (inside `#ui`, 44 px
  target). Suspend the context when the page is hidden. Phones get the reduced set: no owl, no frog choruses, a 2 s
  convolver tail, one far-field voice instead of three.
- **Battery.** Schedulers run at 10 Hz on a timer, not per frame. Silent loops are stopped, not left at gain 0.
- **Tests.** `params.ts` gets headless tests for the curves that are easy to get wrong: the far-field curve, the bell's
  distance rule, the weather gains, the depth lowpass. `?sound=debug` lists live layers with the variables driving them.

## 12. Open questions

1. **Sim to client.** L2 events (`herd-moved`, `bell`, `mowing`) must reach the audio through the sim feed
   (`game/simFeed.ts`). Confirm before building H, J and K.
2. **Lightning.** `sky.ts` keeps its flash timer private. The thunder needs a read-only flash time from it.
3. **Two bells.** The chapel bell is the only bell so far. A Lantern Keepers' or hand bell needs its own timbre.
4. **Voices.** Packs and herds are silent by design. Speech would need its own decision and a rule against naming factions.
5. **Loudness.** All gains are relative. The first real pass must be done on a phone speaker.

## 13. Build order (for the decompose skill)

1. `params.ts` (pure mapping) with its test.
2. `synth.ts`: noise buffers, bell, chirp, droplet, impulses, plus the debug page.
3. `layers.ts`: bed (A, E), wind, rain, birds, crickets, owl. The first playable ambience. Do this first.
4. Underground (F) with the ceiling filter and crossfade.
5. Distance: far field (G), herd (H), ripples (I), bell (J), Mowing (K), pack (L), machines (M).
6. Phone pass: budget, toggle, suspend and resume.
