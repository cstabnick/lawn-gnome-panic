# DayG soundscape: gameplay and threat

> Status: design only. DayG has no audio yet. Scope: player foley, the noise mechanic, the Hatless, combat, items,
> crafting, building, farming, healing and death, NPC voices and trade and quest feedback. Ambient beds and music are
> other agents' work and are not covered here.
>
> Sources: [survival.md](../../survival.md), [hatless.md](../../hatless.md), [society.md](../../society.md),
> [quests.md](../../quests.md), [items.md](../../items.md), [crafting.md](../../crafting.md),
> [loot.md](../../loot.md), and the code in `games/dayg/src/game` (`config.ts` NOISE, `bus.ts` events, `player.ts`,
> `needs.ts`, `respawn.ts`, `camp.ts`, `simFeed.ts`, `scene/hatless.ts`).

## Principles

1. **Sound is the threat model.** The Hatless hunt by hearing first (hatless.md). Every noise the player makes is a
   decision, so the player must always be able to hear what they just did and whether something heard it.
2. **Synthesised, not sampled.** Every cue below is built in code with Web Audio (noise buffers, oscillators, filters,
   envelopes). No files, so nothing to credit (docs/assets.md). Tone.js is optional sugar; the helpers in section 2 are
   enough on their own.
3. **Clay sounds like clay.** Gnomes are fired clay (core fact 2). Impacts are short, dry, and chippy. Moss is soft and
   wet. There is no blood (house style: no gore), so no wet splatter layers.
4. **Calm is audible.** The player's Calm meter (below 30 = shaky aim, panic sprinting) is expressed in breath and
   heartbeat, so a player who is losing it hears it before the HUD tells them.
5. **Every audio cue that changes a decision has a visual twin** (for the UI agent): a Hatless noticing you, a noise you
   made. Phones may be on mute, and some players play with the sound off.

## Event table

Columns: the name is the cue's id (`sfx.<name>`). Trigger is the bus event or state read that fires it (see section 12 for
events that do not exist yet). Loudness is the **noise radius in gm** the sim uses (existing `NOISE` values in
`config.ts` are marked *code*; others are *proposed*). Variants is the number of recipes plus pitch range.

| Cue | Trigger (source) | Loudness / radius | Variants | Section |
|---|---|---|---|---|
| `foot.<surface>` | step cadence from `PlayerState.speed` and stance | walk 6, jog 12, sprint 25 (*code*); crouch ×0.5 | 3 per surface, pitch ±6% | 3 |
| `foot.carry` | carried weight (`carryRatio`) | adds to step radius ×(1 + 0.5 × ratio) (*code*) | 4 clink samples | 3 |
| `breath.panic` | Calm < 30 or stamina < 25 | none (silent to the sim) | breath loop, 2 rates | 3 |
| `heart` | Calm (BPM rises as Calm falls) | none | 1 synth, rate-driven | 3 |
| `noise.ring` | any `noise` event from the player | the event's own radius | 1 | 4 |
| `noise.heard` | a Hatless is drawn to a noise of yours | n/a (the answer) | 3 groans, 1 per 3 s | 4 |
| `noise.herd-far` | a herd's region pulled toward you (L1/L2) | n/a | 2 rumbles | 4 |
| `hatless.idle` | Hatless in view, state 0 | none | 4 murmurs, pitch per Hatless | 5 |
| `hatless.step` | Hatless state 1 (shamble) | 1.2 gm/s, a squelch at each footfall | 4 squelches | 5 |
| `hatless.lunge` | state 2 (lunge), 1.5 s | rasp burst at start | 3 | 5 |
| `hatless.detect` | a Hatless first sees you (sight cone) | none | 2 | 5 |
| `hatless.aggro` | a Hatless switches to hunting you | none | 2 stings | 5 |
| `herd.groan` | 20+ L0 Hatless within 15 gm (`nearCount`) | none | 4 long groans | 5 |
| `hatless.crumble` | `hatless-destroyed` or a Hatless goes to state 3 | none | 3 | 6 |
| `hit.melee.<type>` | a weapon strikes a Hatless (`strike` hits landed) | none | 3 per type | 6 |
| `hit.taken` | `player-hit` (scratch, strength 0..1) | none | 3 scale with strength | 6 |
| `crack.<level>` | `cracked` (chip, crack, deep crack) | none | 2 per level | 6 |
| `fall.<height>` | `fell` (height gm) | none (or 8 if > 6 gm) | 3 | 6 |
| `climb` | `climbed`, `route-placed`, rope and ladder moves | climb noise 8 (*code*) | 2 | 3 |
| `use.eat.<food>` | `ate` | none | 3 per food family | 7 |
| `use.drink.<clean/dirty>` | `drank` | none | 2 each | 7 |
| `use.hold / wear / stow / drop` | `UseAction` kinds | drop: 3 gm, on stone 6 | 2 each | 7 |
| `craft.rasp / hammer / anvil / stir / fire` | `recipe-done`, `busy` bar running | sawing 8, hammer 12, anvil 20 | 3 each | 8 |
| `craft.ok / fail` | `recipe-done` ok or not | none | 1 each | 8 |
| `build.place / damage / break / repair` | `piece-placed`, `piece-damaged`, `piece-broken`, `piece-repaired` | place 20 (*code*, `BUILD_NOISE`) | 2–3 each | 8 |
| `farm.plant / water / harvest` | farm actions (`harvested`) | none | 2 each | 9 |
| `fire.lit / crackle` | `campfire-lit`, camp fire | fire 30 every 3 s (*code*) | 2 | 9 |
| `dig` | DIG action, cache digging | 14 (proposed) | 3 | 8 |
| `pry` | PRY action on a sealed door | 60 (items.md, proposed to match) | 3 | 8 |
| `door.break` | forced door, barricade break | 40 (proposed) | 2 | 8 |
| `gun.shot` | ranged weapon fired (double-shotgun, ammo) | 60 (proposed) | 3 | 6 |
| `trap.alarm` | noise line tripped (`trap-sprung`) | 30 (proposed) | 2 | 8 |
| `can.drop` | a tin dropped on a hard surface | 10 (proposed) | 3 | 8 |
| `heal.treat / heal.mend` | `body.treat`, `body.mend`, scrape and seal, splint | none | 2 each | 9 |
| `infect.stage` | `infection` (stage 0–3) | none (a warm, dull pulse) | 1 per stage | 9 |
| `infect.cured` | `infection-cured` | none | 1 | 9 |
| `death.shatter` | `player-shattered` | 25 (proposed: clay breaking is loud) | 2 | 10 |
| `death.rise` | the shattered gnome rises as a Hatless (no bus event yet, section 12) | 14 (proposed) | 2 | 10 |
| `respawn.wake` | `respawned` | none | 2 | 10 |
| `npc.bark.<verb>` | `talked` (verb, ok) and NPC greet/refuse lines | none | 4 per verb per NPC | 11 |
| `trade.buy / sell / haggle-fail` | trade with an NPC | none | 3 coin clinks, 1 fail | 11 |
| `quest.take / done / fail` | `quest-taken`, `quest-done`, `quest-failed` | none | 1 each | 11 |
| `rank.up / join` | `rank-changed`, `joined-faction` | none | 1 each | 11 |
| `skill.up` | `skill-up` | none | 1 | 11 |
| `bell.ring` | `bell-rung` | the bell: 2 km pull (design, regions.md) | 2 | 6 |
| `mowing.rumble` | `mowing` (district, here) | low drone, radius per the mowing event | 1 | 5 |

Units: "gm" is gnome metres, the same unit the sim uses. Audio distance also uses gm, so a radius of 25 is 25 gm in
both the sim and the mixer. The 2 km bell pull is outside gnome scale and is handled as a region-level event.

---

## 1. Shared toolkit

- **Noise buffers.** Generate once at start-up: 2 s of white, pink (Paul Kellet filter) and brown noise. Every noise
  layer plays from these with a random start offset, so no two plays are the same.
- **Envelope helper.** `pluck(freq, decay)`, `burst(filterType, freq, Q, attack, decay)`, `thud(freq, decay)`,
  `clink(freqs[], decay)` (inharmonic partials), `grains(n, minMs, maxMs)` (a train of tiny noise clicks for gravel,
  shards and rain).
- **Mixer buses.** `foley` (player), `threat` (Hatless and herds), `world` (impacts, crafting, farming), `voice` (NPC
  barks), `ui` (trade, quests, skill). Each bus has a compressor. `threat` ducks `ui` by 3 dB for 0.4 s on aggro so the
  sting is heard.
- **Voice limits.** Max concurrent per class: foley 4, threat 10 (the nearest 10 Hatless win), voice 2 (NPC barks never
  overlap), ui 3. A new cue that exceeds its class limit drops the quietest voice.
- **Distance model (all world sources).** Gain `= 1 / (1 + d / 2)` (d in gm, reference 2 gm), with a low-pass that
  closes from 9 kHz at 0 gm to 1.2 kHz at 25 gm. Past 30 gm a source is silent unless it is a herd (section 5).
  Indoors (`enter-building` / `left-building`), the low-pass is 40% closer and volume −3 dB, matching the sim's
  `muffle: 0.6` on noise that leaves a building.
- **Stereo.** Panner `equalpower`, pan from the source's bearing relative to the camera yaw.
- **Phones.** Nothing below 120 Hz except the bell and the mowing drone. Phone speakers cannot reproduce the sub, so
  those cues get a 2nd and 3rd harmonic to be heard.
- **Unlock.** The AudioContext is created and resumed on the first touch or key (`input.ts`). Until then, no cue plays
  and nothing queues up.

## 2. Variation rules (every cue)

- **Round-robin with a random pick.** Each cue keeps its last variant index and never plays the same one twice in a row.
- **Pitch and gain jitter.** Pitch ±3% for impacts, ±6% for foley, ±1.5% for voices; gain ±1.5 dB.
- **Recipe jitter.** Filter frequencies and decays vary ±10% per play, so even one variant sounds different each time.
- **Minimum gap.** Each cue has a cool-down: foot 0.12 s per foot, hatless.step 0.4 s per Hatless, noise.heard 3 s
  global, bark 1.5 s per NPC, detect 8 s per Hatless.
- **Seeded per gnome.** Hatless and NPC voices take pitch and formant from the gnome's `lookSeed` (or the Hatless id), so
  the same Hatless always sounds like itself and two Hatless sound different.

## 3. Player foley

### Footsteps by surface

The player is a gnome (~1.7 gm tall), so a step is a small, soft event. Cadence is driven by distance, not by time:
one step per stride. Strides (proposed): walk 1.0 gm, jog 1.5 gm, sprint 2.0 gm, crouch 0.8 gm. The sim already
emits step noise every 0.25 s while moving (`NOISE.everySec`). The audio layer uses its own stride counter and only
reads the speed.

The surface under the foot is a lookup at `(x, z)`. Zones already carry the ground type (world.md: gravel paths, grass,
grave plots, kerbs); moss is a region trait (`MOSSY`), and mud comes from `FLOODS` and rain. Until a `surfaceAt(x, z)`
query exists (section 12), a region trait fallback works: `MOSSY` = moss, `FLOODS` or wet weather = mud, otherwise grass.

| Surface | Recipe (synth) | Length | Level (rel) | Notes |
|---|---|---|---|---|
| **Gravel** (paths) | 6–10 `grains` (3–8 ms clicks) in a 1.5–4 kHz band-pass, plus a 60 ms pink-noise body (low-pass 2.5 kHz) | 90 ms | 0 dB | the loudest natural surface; the sound most likely to draw a Hatless |
| **Grass** | 80 ms pink noise, band-pass 800–2.5 kHz, Q 0.8, slow attack 15 ms | 120 ms | −10 dB | "swish". At prone (crawl), no step cue; a rustle loop at 0.5 gm/s instead |
| **Moss** | 60 ms brown noise low-pass 400 Hz, a sine thud at 90 Hz (decay 60 ms), 2–3 wet bubble pops (sine 300–600 Hz, 15 ms) | 140 ms | −6 dB | soft, dead. The moss takes the sound out of the step |
| **Mud** (wet ground) | a sweep of brown noise (low-pass 800 → 300 Hz over 180 ms), then a `burst` bubble cluster | 200 ms | −2 dB | the sucking sound when you pull a foot out; a second pull cue on the lift |
| **Stone** (kerb, flags, crypt) | a sine click at 2.4 kHz (decay 25 ms) plus a short high-band noise tick and a 40 ms reverb tail (`ECHO` regions double it) | 60 ms | −3 dB | rings in crypts and drains (ECHO) |
| **Wood** (boards, route ledges, the shed) | a sine knock at 180 Hz (decay 40 ms) plus a 1.5 kHz noise click | 80 ms | −2 dB | a hollow "tok" that carries under floors |

Variation: 3 variants per surface, each with its own filter and decay. Pitch jitter ±6%. Left and right feet take
opposite pan offsets of ±0.1 (small, so you don't feel a stereo wobble).

Transitions: a step that changes surface (moss → gravel) plays the new surface only. No transition layer.

### Carrying weight

The sim: `carryRatio` raises the step radius by up to 50% (`NOISE.weightMul = 0.5`) and caps top speed. The audio
says the same thing.

- **Clink layer.** For each step, if `carryRatio > 0.25`, a metal clink plays at a random offset of 40–90 ms after the
  step. Its chance is `min(1, (carryRatio − 0.25) × 2)` per step. Sources: metal items in hands or pack (`iron-bar`,
  `tin-pail`, `iron-trowel`). Four clink samples from `clink([2100, 3300, 4700], 80 ms)` with random detune.
- **Pack creak.** Above `carryRatio` 0.6, a leather creak (band-pass 500 Hz, Q 3, 150 ms, −12 dB) on each step.
- **Overloaded** (over 1.2, walk-only): every step is heavy (+3 dB, `thud` 110 Hz, 120 ms) and you hear a short
  strained breath every 2 s.
- **Cloth rustle** from worn gear is a constant quiet bed (`burst` 2–4 kHz, very quiet) that rises with `carryRatio`.

### Sprint, stamina and panic

- **Sprint** (`player.sprinting`): step cadence ×1.5 (stride 2.0 gm). Breath starts after 1.5 s of sprint.
- **Stamina** (`player.stamina`, 0..100): breath loop, faster and louder as stamina falls.
  - stamina 100–50: no breath.
  - 50–25: a soft breath every 1.8 s after a sprint, volume −18 dB.
  - below 25: breath loop, rate 0.8 s (sprint) or 1.3 s (walk), volume −10 dB.
  - at 0 (falling back to walk-only): a gasp (band-pass noise 900 Hz, 300 ms) and the breath loop at 1.0 s.
- **Calm** (`needs.state.calm`, 0..100; below `lowThreshold` 30 it hurts):
  - BPM = `60 + 90 × (1 − calm / 100)`. A heartbeat synth (a sine 60 Hz thump with a 45 ms decay plus a quiet 120 Hz
    tick) plays at that rate. Volume only, it is not sent to the sim.
  - Calm below 30: breath loop on, at the rate in the stamina rules above, and step gain +2 dB ("panic sprinting").
    The steps also get less spaced: stride ×0.85 while sprinting under 30 calm, which matches the sprint-panic feel.
  - Calm below 15: a high, very quiet tinnitus (a sine at 6 kHz, −30 dB, slow wobble). Off in the accessibility
    settings. Aim shake (`aimShake`) is shown by the HUD and by a soft wobble of the crosshair's ticking cue (see below).
- **Aim shake cue.** When `aimShake > 0.2`, a small wobbling tick plays on each shot attempt, pitch depending on the
  shake amount, so a shaky aim is heard as well as seen.

### Climb and fall

- **Climb** (`climbed` / route movement): a quiet scrape plus a grip knock every 0.6 s on route, a rope creak for
  ropes (saw-tooth 220 Hz through a band-pass, slow LFO), a rung clack for ladders. Climb noise is 8 gm (*code*), so
  these cues are the same for the mixer and the sim.
- **Fall** (`fell`, height h gm): `fall.<h>` is a sine body whose pitch drops from 180 to 80 Hz over 200 ms, plus a
  grit burst. Light falls (h 2–6) are a thud; 6–12 add a chip (clay tick); 12+ add a crack cue (see section 6) and a
  stunned breath.

---

## 4. The noise mechanic

Noise is the sim's main stealth system. A noise is an event with a position and a **radius in gm**. Anything in the
Hatless's hearing range (inside the radius, not already hunting) is drawn to the noise (`hatless.ts`, DRAWN_REACHED 1 gm).
The sim keeps the noise, but the audio layer owns the player's read on it.

### Sources and loudness

| Source | Radius (gm) | Status | Notes |
|---|---|---|---|
| Walk step | 6 | *code* (`NOISE.walk`) | halved when crouched; +50% at full weight |
| Jog step | 12 | *code* | |
| Sprint step | 25 | *code* | the big one: a sprint across a row is heard by most of a row |
| Climb | 8 | *code* | route, rope and ladder |
| Attack swing | 10 | *code* (`NOISE.attack`, emitted from `main.ts`) | a swing is noisier than a step |
| Fire | 30 every 3 s | *code* (`FIRE.noiseEverySec`) | the campfire is never silent |
| Pry a sealed door | 60 | proposed | items.md "Pry open (noise 60)" |
| Dig (cache, grave, pit) | 14 | proposed | a long, rhythmic scrape: each 1 s stroke is a 14 gm pulse |
| Chop or saw (`SAW`, `CUT` on wood) | 8 per stroke | proposed | rhythmic; the saw is quieter than a hammer |
| Hammer (`HAMMER`, build) | 12 per stroke | proposed | a build with 10 strokes is 10 pulses (see the drumming rule below) |
| Build a piece | 20 | *code* (`BUILD_NOISE` in `base/config.ts`, emitted by `base/build.ts`) | the hammer strokes are the proposed 12 each |
| Break a door or barricade | 40 | proposed | `items.md` says "makes noise"; a forced door is heard across a region |
| Gunshot (slingshot 4, shotgun 60) | 4 / 60 | proposed | the shotgun is "very rare, very loud" (items.md) |
| Alarm: noise line tripped | 30 | proposed (`trap-sprung` is typed on the bus but has no emitter yet) | the trap is the alarm, so it is loud on purpose |
| A tin dropped on hard ground | 10 | proposed | `drop` action on stone, gravel or wood; 3 on grass or moss |
| Bell rung (Spire) | 2 km | design (regions.md) | a region-scale pull; see section 6 |
| Shattered gnome | 25 | proposed | clay breaking |

**Drumming rule.** Repeated strokes (saw, hammer, dig) emit one noise event per stroke, not per second, so the sim
sees a rhythm. The audio layer plays the matching rhythm. A player who keeps hammering is found by everything in range;
a player who stops is quiet within a beat.

**Weather.** Rain hides noise (world.md: rain hides noise, from the weather chain). The audio layer lowers every noise's
volume by 4 dB in rain and drizzle (not the radius; that stays for the sim). The player hears that rain is hiding them
because the cue is quieter, so they learn it.

**Crouch.** Crouching halves the step radius (`NOISE.crouchMul`). Audio: a crouched step is −8 dB and the "tok" of a
stone or wood step loses its ring (low-pass 1.5 kHz). Crouched steps sound like someone trying to be quiet.

### How the player hears they were heard

The player must be able to tell, without a HUD, that a noise reached something. Three cues, in order of distance:

1. **Ring** (`noise.ring`): when you make a noise of radius R, a faint echo plays from your own position: a comb filter
   (delay ~ R / 340 s, scaled to gm, 2–3 repeats) at −20 dB. Louder noises ring longer. A sprint of 25 gm rings for
   ~0.5 s; a walk ring is almost nothing. This is the "I was loud" signal.
2. **Answer** (`noise.heard`): when a Hatless that could hear the noise switches to drawn (section 5), play a low groan
   from that Hatless's bearing, at the Hatless's distance (3 variants). Rate limit 1 per 3 s globally. The first answer
   is what teaches the player that the sim is listening.
3. **Pull** (`noise.herd-far`): a herd token drawn toward you from an adjacent region (the sim's `noise` accumulates per
   region in `simFeed.ts`, flushed every 10 s) is heard as a far rumble: a low-passed groan (1.1 kHz low-pass, −12 dB
   at 40 gm), panned toward the herd's bearing. It rises in volume over ~3 s as the herd approaches. This needs the
   region-level event in section 12.

Visual twin: the UI agent should show the same three in the HUD (a ring on the compass, an arc for a herd). The audio is
the primary cue, but a muted phone still needs something.

---

## 5. The Hatless

### What they are, sonically

Clay with moss in it. Their voice is not a voice: it is wet clay, air through a cracked throat, and moss bubbling. Each
Hatless has its own pitch (from its id) and its own formant (`hatless.idle` murmur), so a crowd sounds like several
different things.

| Cue | Recipe | Trigger | Distance behaviour |
|---|---|---|---|
| `hatless.idle` | a sway: a slow (2–4 s) murmur of brown noise through a formant pair (400 Hz and 1.1 kHz, Q 4), pitch 90–140 Hz, with a 1–2 gm pitch glide | state 0, any distance | silent beyond 25 gm; at 5–25 gm a quiet tick every 4–8 s |
| `hatless.step` | a squelch: brown-noise low-pass 500 Hz, 110 ms, plus a bubble pop; 40% of the time a dry clay tick | state 1 (shamble, 1.2 gm/s) | per footfall; footfalls are 0.6 s apart |
| `hatless.lunge` | an air rasp: a band-passed noise burst at 2.2 kHz with a 90 ms attack, then the same squelch | state 2 (lunge), start and end | at the start only |
| `hatless.grab` | a wet slap plus a clay knock (sine 200 Hz, 30 ms) | within `grabRange` 1.0 gm | the closest, most intimate cue |
| `hatless.crumble` | dry clatter: 8–14 `grains` of shard clicks, a dust puff (brown noise, 600 Hz, 400 ms) | state 3, or `hatless-destroyed` | the death of a Hatless is quiet and dusty |

**Variation.** Each Hatless picks a voice seed (pitch 90–140 Hz, formant ±15%) from its id. Its "tone" changes with its
moss state: a fresh Hatless is clearer (higher formant), an old one (crumbling) is dull and quiet. A Hatless that was
a raider (armour) gets a faint clank layer on steps, from the gear it carries; a Hatless that was a farmer gets a rake
scrape. The gear comes from the Hatless's source gnome, so the sound matches the variant rules in hatless.md.

### Detection, aggro and the sting

- **Detection** (`hatless.detect`): a Hatless that is not yet hunting first sees you (you enter its sight cone,
  `sightRange` 25 gm, `sightHalfAngle` 0.5 rad). Cue: a soft wet tick (sine 1.2 kHz, 25 ms) and a quick rising
  squelch, panned to the Hatless. Once per Hatless per 8 s.
- **Aggro sting** (`hatless.aggro`): the Hatless switches to hunting you (or to a lunge). A short, sharp sting: a
  rising 2-note figure of two clay clicks (1.6 kHz, then 2.1 kHz, 60 ms each) plus a rasp burst. It ducks the `ui`
  bus by 3 dB, and the sting is always panned to the Hatless. Two variants.
- **Lunge** (`hatless.lunge`): its start is the audible warning. Give the player 0.3 s between the lunge rasp and
  arrival at 4 gm/s, so a lunge from 4 gm arrives about 1 s after the cue. The cue is the player's chance to step
  away.

### Herd groan (the herd as a sound)

Far from players the Hatless are a field (hatless.md), but close to a player they are individuals (L0). The herd
groan is what a crowd of L0 Hatless sounds like:

- Trigger: `nearCount(pos, 15)` ≥ 20. Pick the count into 3 levels: 20–39 (murmur), 40–79 (groan), 80+ (roar).
- Recipe: a bed of the same brown-noise formant as `hatless.idle`, but summed across 6–12 detuned voices (each
  pitch 90–140 Hz, detune ±20 cents), with a slow 0.2 Hz amplitude wobble. Count sets the number of voices. Gain
  rises with count (not with distance: the crowd is heard as one).
- Duck: the herd groan ducks the foley bus by 4 dB (you can hear the herd over your own feet). It never ducks the
  aggro sting.
- Rate: changes slowly. Crossfade the level over 1.5 s. Never a sudden switch.

### Distance layers (how the sound changes as they get closer)

| Layer | Distance (gm) | What you hear | Low-pass | Gain |
|---|---|---|---|---|
| Far | 25–40 | nothing from one Hatless. Herd groan only, very low | 1.2 kHz | −18 dB |
| Mid | 10–25 | idle murmurs (occasional), step squelches | 2.5 kHz | −9 dB |
| Near | 4–10 | steps and murmurs clear, wet clay ticks | 6 kHz | −3 dB |
| Lunge | 1–4 | rasp at start, then steps, close breathing | 9 kHz | 0 dB |
| Grab | under 1 | slap and knock, the squelch of a body against you | 9 kHz | +2 dB |

Stereo: the Hatless panner uses the same equal-power pan as the foley, so a row of Hatless in front of you spreads
across the stereo field. A pile (hatless.md "they pile") is one source with 3 extra layers stacked at +0.6 gm each.

### Scratch and moss bite

`player-hit` (strength 0..1): a scratch. A sharp clay tick plus a damp "hiss" (high-passed noise, 3 kHz, 80 ms) that
scales with strength. A bite that puts moss in a crack (section 6) has the same hit plus a soft crinkle layer. The
hiss is the one cue that means "moss in you".

## 6. Combat, damage, and the dead

### Melee hits (`strike`)

Melee damage is a tag (BLUNT / PIERCE / SLASH, items.md). Each has a distinct recipe:

| Type | Recipe | Used for |
|---|---|---|
| Swing (any) | a whoosh: band-pass noise 1.5–3 kHz, sweep 800 → 2.5 kHz over 120 ms | all melee swings, a faint whoosh even on a miss |
| BLUNT | a wood thock (sine 160 Hz, 60 ms) plus a clay chip click (3 kHz, 15 ms) | acorn club, mallet, garden mallet |
| PIERCE | a short tick (sine 3.5 kHz, 12 ms) and a dull thunk (sine 240 Hz, 40 ms) | spear, dagger, thorn |
| SLASH | a bright ring (sine 2.8 kHz, decay 120 ms) plus a grit burst | sword, shears |

Variation: 3 per type, pitch ±3% and a random 0–15 ms offset on the second layer.

On a hit that lands on a Hatless core: add the crack layer (below). On a hit on a Hatless limb: the same impact without
the crack.

### Cracks, falls and damage to the player

`cracked` (chip, crack, deep crack, from hit, fall, cold or scrape):

- **Chip**: a single clay tick (3.5 kHz, 10 ms) plus a grit burst (50 ms). Small, sharp.
- **Crack**: a crack: 2 quick ticks, then a band-passed noise "snap" (1–4 kHz, 150 ms), and a low thump.
- **Deep crack**: a long crack (250 ms), a falling pitch (700 → 300 Hz) and a grit cloud (400 ms). Use only once per
  body part per fall.
- **Cold crack** (`cause: cold`): a glassy tick at 5 kHz with a faint frost whistle. A distinct sound so the cold is
  heard.
- **Scrape** (moss-related): a dry scratch (band-pass 2.5 kHz, Q 5, 200 ms) with the crinkle layer.

`fell` is in section 3. The shattered death is in section 10.

### Gunshots

Gunfire is the loudest thing in DayG, and the design makes it rare (`double-shotgun` is very rare, very loud).

- Slingshot: a snap (band-pass 3 kHz, 15 ms) and a pebble whistle. 4 gm radius (quiet).
- Shotgun: a bang: a low sine (70 Hz, 180 ms), a noise burst (1 kHz, 300 ms) with a 2 ms click on top; a short
  ring. 60 gm radius. The ring is long (tail 1.2 s), and a `noise.ring` of 60 gm plays after it.
- Gunshots play on the `threat` bus at full level, with pitch jitter capped at ±2%, so each shot sounds the same.

### Bell and mowing (world-scale threat)

- **Bell** (`bell-rung`): the Spire bell, 5 partials (1, 2.0, 2.4, 3.0, 4.2 times the fundamental) decaying over 6 s,
  with a long reverb tail, plus a low strike at 55 Hz (heard on speakers, felt on phones through its 2nd harmonic). The
  bell draws every herd for 2 km, so the bell itself is a threat cue: `threat` bus, un-ducked. `survived` (bell-rung
  event) picks a short coda (a tired clang) or a full clang.
- **Mowing** (`mowing`): the district's lawn mower rumble, a low drone (60 Hz saw, low-pass 180 Hz, with a 2nd
  harmonic and a slow 0.15 Hz LFO), `here` true = close (louder), false = a rumble through walls. One voice per district.

## 7. Eating, drinking and item use

| Action | Recipe | Variants |
|---|---|---|
| `ate` (bread, cheese, seed cake) | 2–3 soft bites: a short band-pass 1.8 kHz burst (40 ms) + a crumb hiss; then a swallow (low-pass noise 300 Hz, 150 ms) | 3 |
| `ate` (berries, mushrooms, slug) | a wet squish (brown noise, 500 Hz low-pass, 140 ms) plus a skin pop | 3 |
| `ate` (stew, pickles, tea) | a slurp (a rising band-pass sweep 400 → 1.2 kHz, 200 ms) | 2 |
| `drank` clean | a gulp: 2 low pulses (sine 220 Hz down to 140 Hz) with a water-trickle noise, 350 ms | 2 |
| `drank` dirty | the same gulp with 3–4 bubble pops (sine 500–900 Hz, 20 ms) and a grit crunch, which hints at the cramp | 2 |
| `hold` / `wear` | a cloth rustle (band-pass 2 kHz, 180 ms), a buckle clink for worn gear | 2 |
| `stow` | the same rustle reversed in pitch, shorter | 2 |
| `drop` | a thump (sine 120 Hz, 60 ms) on the surface's material (section 3) | 2 |
| `recipe` pick | a paper or wooden tap (click at 1.5 kHz, 10 ms) | 1 |

Use of the action wheel is silent (UI); the player hears the result, not the menu.

Eating and drinking do not make noise in the sim (the NOISE table has no entry), so these cues are not `noise` events.
That is a design choice: a meal should not draw a herd. If playtests show it is too quiet to be a risk, add a small
radius (3 gm) to `eat`, not a large one.

## 8. Crafting, building, digging and locks

### Crafting

The crafting system runs a timed `busy` bar (`UseApi.busy()`). The cue is a loop that runs for the whole action,
and a finish stinger on `recipe-done`:

| Station (`Station`) | Loop during `busy` | Finish (`ok`) | Fail (`!ok`) |
|---|---|---|---|
| Hand (cord, rag, splint) | a soft cloth or string stroke every 0.8 s (band-pass 2 kHz, 80 ms) | a small "tuk" (sine 900 Hz, 40 ms) | a limp rustle |
| Fire (boil, cook, glue) | a fire crackle (granular, see section 9 `fire`) plus a bubbling pot (brown noise + bubble pops every 0.3 s) | a pot lid tap (sine 700 Hz, 60 ms) | a hiss (steam, high-passed noise 4 kHz) |
| Workbench (plank, ladder) | saw: a rasp stroke every 0.5 s (band-pass 2.5 kHz, Q 2) | a wood clack (sine 260 Hz, 60 ms) | a scraped crack |
| Anvil (nails, blade, iron trowel) | a hammer on iron every 0.6 s, sine 1.4 kHz, 80 ms ring, pitch varies ±4% per stroke | a bright ring (sine 2.1 kHz, 300 ms) | a dull clunk |
| Kiln (glaze, clay jar) | a low furnace roar (brown noise, 200 Hz low-pass, very quiet) | a bell tap | a cracked pot (short tick + noise) |

Variation: every stroke picks from 3 per-material variants and jitters ±4%. A long action (10 min kiln) loops a
recording-free bed (the roar) and does not repeat the stroke cue.

### Building and damage

- **`piece-placed`**: a wood set-down (a `thud` of 80 Hz for wood, 120 Hz for stone), plus a wood clack (sine 260 Hz,
  60 ms). Two variants.
- **`piece-damaged`** (from pushing Hatless or weapons, `DamageCause`): a creak (band-pass 600 Hz, Q 4, 300 ms,
  rising in pitch as HP falls) and a chip (grit burst) at the piece's position. At HP under 25% the creak repeats
  every 2 s, so you hear the wall tiring.
- **`piece-broken`**: a collapse: a wood crack (150 ms) then 2–4 falling clatters (sine 180 Hz, 80 ms each, 200 ms apart)
  and a dust cloud. Stone walls: a deep thud (60 Hz, 400 ms) plus grit.
- **`piece-repaired`**: the hammer loop of section 8 (short, 4 strokes) plus a "set" tap.

### Digging, prying and forcing

- **Dig** (`DIG`): a scoop (brown noise, 600 Hz band-pass, 120 ms) every 1.0 s. Soil and gravel change the pitch: soil
  low, gravel high. Each stroke is a 14 gm noise pulse (section 4).
- **Pry** (`PRY`, sealed doors): a metal lever groan (saw-tooth 110 Hz, 1.5 kHz band-pass, rising), then a snap at the
  end. 60 gm radius per stroke: the heaviest cue for a solo player.
- **Door break** (barricade or a locked door forced): a split wood crack (150 ms), then a crash of boards (2–3 clatters,
  100 ms apart). 40 gm radius.
- **Trap alarm** (`trap-sprung`): a tin rattle (6 short clinks at 2.8 kHz, randomised 40–80 ms apart) and a bark of
  wood. The noise is loud on purpose: the trap tells the player "something is here". 30 gm radius.
- **Dropped tin** (`can.drop`): a tin clang (metal: sine 1.9 kHz + 2.8 kHz partials, 180 ms, with a 300 ms ring) on
  hard ground. On grass or moss, a muffled clink. 10 gm on hard ground, 3 gm on soft.

## 9. Farming, fire and healing

### Farming

| Action | Recipe | Variants |
|---|---|---|
| Plant (`clover-seed`, spores, cuttings) | a soil scoop (brown noise 600 Hz, 120 ms) then a press (a soft thud 90 Hz, 80 ms) | 2 |
| Water (`watering-can`, `tin-pail`) | a pour: a band-pass water trickle (1.5–3 kHz, 600 ms) with splash pops at the end | 2 |
| Harvest | a stalk snap (band-pass 3 kHz, 40 ms) and a rustle (grass band 800 Hz, 200 ms) | 3 |
| Weeding | a rip (band-pass 1.5 kHz, Q 2, 150 ms) | 2 |
| Compost (`compost-bin`) | a wet fold (brown noise low-pass 400 Hz, 300 ms) | 1 |

`harvested` gets the harvest cue. A bed that is trampled by Hatless (hatless.md) plays a trample squash (a low thud
with a squelch) at the bed's position, once per trample event.

### Fire and light

- **Campfire** (`campfire-lit`): a whoosh of tinder (band-pass 1.8 kHz, 300 ms) and the first crack. After lit, the
  **crackle** is the fire's loop: granular pops (2–6 ms clicks, 10–30 per second, random density), a low hum (brown
  noise, 180 Hz low-pass, quiet), and a 3 s noise pulse that the sim receives as `fire` (30 gm, *code*).
- **Rain on the fire**: a hiss (high-passed noise 3 kHz) and the crackle drops out in 1.5 s, matching the sim's
  put-out rule (2 sun-minutes, about 10 real seconds, in crafting.md).
- **Lantern** (`lantern-lit`): a match strike then a soft glass hum (sine 300 Hz, very quiet).

### Healing and infection

| Event | Recipe | Notes |
|---|---|---|
| `heal.treat` (salt wash, spirit, poultice) | a wet pat (brown noise, 300 Hz, 150 ms) and a soft squelch | 2 |
| `heal.mend` (glue, splint, re-glaze) | a sticky press (low-pass 500 Hz, 120 ms) then a snap-set tick (sine 1.1 kHz, 25 ms) | 2 |
| `infect.stage` 0 (exposed) | nothing; a faint tick under the heartbeat | |
| `infect.stage` 1 (rooting) | a low warm pulse (sine 70 Hz, 800 ms, slow), every 6 s | 1 |
| `infect.stage` 2 (spreading) | the pulse every 3 s, a dry grit layer under it | 1 |
| `infect.stage` 3 (taking) | a continuous low hum (brown noise 90 Hz, quiet), a dry crackle at 0.5 Hz | 1 |
| `infect.cured` | a clean pop and a soft bell (sine 1.5 kHz, 400 ms) | 1 |

The infection cues are the one place in the design where the player hears their body turning. They never play
bells in stage 0–2, so the stage-3 hum is the most alarming sound in the game.

## 10. Death and respawn

### Shattering (`player-shattered`)

The death is loud, short and fair to listen to. Sequence (total ~2.5 s):

1. **Impact** (0 ms): a deep clay crack, `death.shatter` part 1: a low sine (70 Hz, 250 ms) plus a bright crack
   (band-pass 3 kHz, 40 ms), 25 gm radius.
2. **Shards** (50–600 ms): 14–20 `grains` (shard clicks at 3–8 kHz, 2–6 ms), a shower that thins out over 500 ms, plus
   a few tinkles (sine 3–5 kHz, 80 ms, random pan).
3. **Silence** (600–1100 ms): nothing. The silence is the moment.
4. **Moss bloom** (1100–2000 ms): a slow crackle of granular noise rising in pitch (band-pass 600 → 1.6 kHz over 0.9 s),
   a low hum, and a single soft cough from the gnome (formant pair 500 Hz and 1.2 kHz, pitched 200 Hz) at the end.

The bloom is the one place a sound turns into the Hatless's voice. It is the first note of the Hatless choir for that
player.

### Rising (the gnome becomes a Hatless)

A shattered player rises as a Hatless still wearing gear (survival.md, hatless.md). It is shown in the death recap
(crafting.md) and it is a **world event**: the rising is heard by nearby NPCs and Hatless. `death.rise`: a wet
clay-pull (brown noise sweep 200 → 600 Hz, 800 ms) and a clank from the worn gear (metal clink from the body, section
3). Radius 14 gm (proposed), which draws the local herd. Two variants.

This is the only sound in DayG that creates a threat. Rising near a player's own base is the cost of dying there.

### Respawn

- `respawned` (at a haven): the player wakes in the haven. A calm inhale (formant breath, 1.2 s, low), a soft
  lantern-hum that fades in over 2 s, and the heartbeat resetting to the calm rate. `taught: true` adds a short,
  warm two-note (a lineage hint: someone taught you). Two variants.
- The haven's ambient bed is other agents' work; respawn only plays the wake cues.

## 11. NPC voices, barks and feedback

### NPC voices

NPC voices are **synthetic**: no speech, no recordings. Each NPC has a voice seed from `lookSeed`, so the same gnome
always sounds the same, and a Hatless made from an NPC keeps some of its voice (a quiet throwback to who it was).

Recipe, per syllable (a 'word' is 2–4 syllables; each bark is a few words):

- **Source.** A sawtooth at the NPC's base pitch: 190–300 Hz (traits: a bold, loud NPC sits higher; an empathetic
  one, lower and softer).
- **Formants.** Two band-pass filters on the source, at the vowel's F1 and F2 (open vowel: 700 / 1200 Hz, close vowel:
  300 / 2300 Hz, mid: 500 / 1500 Hz). The vowel for each syllable is chosen at random from these three.
- **Consonants.** A burst of 10–25 ms noise (high-pass 2 kHz for "s/sh", a click at 1.5 kHz for "t/k", a short voiced hum
  for "m/n") before the vowel.
- **Envelope.** Each syllable 80–140 ms, attack 15 ms, with pitch contour per bark: a falling tail for a statement, a
  rise on the last syllable for a question.

Pitch drift per syllable ±3%. The result sounds like a pleasant mumble of speech without meaning anything, which keeps
the text (the subtitle) as the content and the sound as the voice.

### Barks (`talked` and NPC lines)

Verbs from quests.md: Greet, Ask about, Trade, Offer help, Ask for help, Recruit, Join, Threaten, Rob, Share food,
Warn. Their barks differ in contour and length, so the player hears the verb before reading it:

| Verb | Contour | Length | Notes |
|---|---|---|---|
| Greet | short, rising 2nd syllable | 2 syllables | friendly; a higher base |
| Ask about | rising on the last syllable | 3–4 syllables | a question |
| Trade | level, even | 2–3 syllables | a flat, businesslike tone |
| Offer help / Share food | falling, warm (low formant) | 3 syllables | low, soft |
| Ask for help | rising then falling | 3–4 syllables | higher pitch, a bit of breath |
| Recruit / Join | rising, bright | 3 | a higher base |
| Threaten | low, harsh (add a rasp layer, band-pass 1.5 kHz) | 2–3 syllables | the one harsh voice |
| Rob | sharp clip, short | 1–2 syllables | a sudden quiet cut |
| Warn | fast, short rises | 2 syllables | quick repeat |

`talked` with `ok: false` (refused): the bark plays with a falling contour and a short dull tap after it.

Variation: each NPC has 4 variants per verb (contour and vowels picked at random). Barks never overlap (`voice` bus limit
2, and each NPC bark waits for the last to end). Each NPC keeps a 1.5 s cool-down so the player does not hear the same
gnome bark twice in a row.

### Trade feedback

| Cue | Recipe | Trigger |
|---|---|---|
| `trade.buy` | two or three acorn-coin clinks (`clink([2800, 3900], 60 ms)`, random detune ±3%), with a small paper slide | an item moves to the player for coin |
| `trade.sell` | a lower double clink (2200 Hz, 60 ms), no paper | an item leaves the player |
| `trade.haggle-fail` | a dull tap (sine 260 Hz, 80 ms) and the refused bark | the NPC refuses the price |

### Quest and faction feedback

| Cue | Recipe | Trigger |
|---|---|---|
| `quest.take` | a paper unfold (band-pass 3 kHz, 250 ms, slow attack) and a two-note up (600 Hz then 900 Hz, 90 ms each) | `quest-taken` |
| `quest.done` | a rising three-note figure, pentatonic (600, 800, 1000 Hz, 120 ms each, sine with a soft pad) | `quest-done` |
| `quest.fail` | a falling two-note (420 Hz, 300 Hz), a little detune | `quest-failed` |
| `rank.up` | a warm bell (partials 1, 2.7, 4.2, decay 1.2 s) with a low drone under it | `rank-changed` |
| `join` | a chord of 3 sines (C, E, G at 262 / 330 / 392 Hz), 800 ms | `joined-faction` |
| `skill.up` | a short bright pluck (sine 1.1 kHz, decay 200 ms) | `skill-up` |
| `board.open` | a paper rustle (3 kHz band-pass, 200 ms) | `board-opened` |

Quest sounds are the one set in DayG that is pleasant on purpose. Every other cue is clay and moss; a quest is the
world saying something good, so it gets pitched notes instead of noise.

## 12. Events the bus does not emit yet (for the code agent)

These are gaps between this design and the current code. Each needs a single new event or query. None requires the audio
layer to read the sim directly.

| Need | Suggested hook | Why |
|---|---|---|
| Footstep surface | `surfaceAt(x, z): 'gravel' \| 'grass' \| 'moss' \| 'mud' \| 'stone' \| 'wood'` on the collider or world | footsteps by surface (section 3) |
| Sprint and stamina state | read `PlayerState.sprinting`, `stamina`, `speed` each frame (no event) | cadence, breath |
| Calm and aim shake | read `HudState.needs.calm` and `needsEffects().aimShake` each frame | heartbeat, panic |
| Emitters for typed events | `trap-sprung`, `harvested`, `bell-rung`, `mowing` are on the bus but nothing emits them yet (checked by grep) | trap alarm, harvest, bell, mowing cues |
| Per-Hatless state change | an event `hatless-state` `{ id, from, to, pos }` from `scene/hatless.ts` | detection, aggro sting, lunge cue |
| Hatless noticed the noise | an event `hatless-drawn` `{ id, pos }` when a Hatless is drawn to a noise | the answer cue (`noise.heard`) |
| Herd pull from a region | an event `herd-drawn` `{ region, from, count }` from the sim (or `simFeed`) | the far-herd rumble |
| Drumming strokes | each saw, hammer, dig stroke already runs through `busy`; add `stroke` `{ kind }` events | rhythm for drumming noise |
| Gunfire | a new `shot` event `{ weapon, x, z, radius }` | gunshot cue, radius |
| Trap alarm | `trap-sprung` already exists; the payload needs a position | the alarm's 3D position |
| Dropped tin | a `dropped` event `{ def, surface }` from the item drop action | the can clang |

## 13. Tuning and checks

- **Loudness.** Play each cue at the sim's radius in a fixed scene and check: at the radius's edge the cue should be
  just audible at the sound's own gain. Set reference levels at the foley bus of −18 dBFS RMS for a step.
- **Phone.** Every threat cue must be audible through a phone speaker at 50% volume. Check the aggro sting and the
  lunge cue especially.
- **Regression.** A new cue that fires more than 4 times a second in a stable scene is a bug (cool-down missing).
- **Balance with the sim.** The noise radii are the sim's numbers. If a playtest says a cue is "too loud" but the
  sim's radius is right, lower the gain, never the radius, so the player's audio and the sim's noise agree.
- **Accessibility.** Tinnitus cue, herd groan and detection can each be turned off. The aggro sting and the lunge cue
  cannot, since they are the threat.
