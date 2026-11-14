Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/audio.ts` makes the alley sound alive, all generated in code: the ball rumbling down the lane, the pin crash, gutter clunks, and **gnome voices** that shout on every hit and miss ("STRIKE!", "Oh no, gutter!", "Ow!" from the pins…).

## Read first
- `games/gnome-bowling/src/audio.ts`: the stub (keep every export and signature: `SfxName`, `startAudio`, `sfx`, `createAudio`)
- `games/gnome-bowling/src/config.ts`: `SimResult`, `SimEvent` (kinds 'release' | 'gutter' | 'ballPin' | 'pinPin' | 'pinFall' | 'pit', strength 0..1), `ResultKind`, `BallResult` (serial), `GameState`, `Player`
- `games/gnome-golf/src/audio.ts`: an existing WebAudio sfx module in this repo (noise buffers, envelopes, `startAudio` unlock pattern). Copy its helper style; do not import from it.

## Change
- `games/gnome-bowling/src/audio.ts`: fill in the stub.

## Sound effects (WebAudio, one shared `AudioContext` created lazily in `startAudio()`; every function is a no-op until then; master gain 0.8)
- `sfx('click')` short tick, `sfx('tick')` softer higher tick, `sfx('swoosh')` filtered noise sweep (the swing), `sfx('thud')` low thump (ball landing on the lane).
- **Release**: at the 'approach' → 'roll' transition play `thud`.
- **Rolling**: during 'roll', a looping low rumble (brown noise through a lowpass ~180 Hz plus a slight 30-60 Hz sine whose pitch follows ball speed). Compute ball speed from consecutive `sim.ball` samples at index `floor(rollTime / sampleDt)`; gain ∝ speed/10, fade out when the ball is in the pit or after the last sample. In the gutter (`'gutter'` event passed): a higher, hollower, rattly rumble.
- **Collision events**: each frame play every `sim.events` entry whose `t` is in (lastRollTime, rollTime]: 'ballPin' → a bright wooden "tock" (short noise burst through a bandpass ~1.8 kHz + a 600 Hz damped sine), volume by strength; 'pinPin' → lighter clack (~2.5 kHz, quieter); 'pinFall' → a dull thunk on the deck; the first 'ballPin' with strength > 0.5 also triggers a big **crash** (layered noise, 0.6 s decay) — the sound of the rack exploding. Cap simultaneous one-shots at ~12 (skip extras).
- **Pinsetter**: when phase goes 'result' → 'aim' or 'intro', a mechanical whirr + clunk.
- Crowd: on strike kinds a short crowd cheer (filtered noise swell with a few random "whoo" sine glides); on gutter a crowd "awww" (descending band-passed noise).

## Gnome voices (the important part)
Two layers, so it works everywhere:
1. **Speech** with the Web Speech API: `speechSynthesis.speak(new SpeechSynthesisUtterance(text))` with `pitch` 1.6-2.0 (gnomes are squeaky) and `rate` 1.15-1.3, `volume` 1. Pick an English voice if one exists (`speechSynthesis.getVoices()`, prefer `lang.startsWith('en')`; voices may load late, listen to `voiceschanged`). Each player gets a stable voice variation: pitch = 1.5 + (player index * 0.17) % 0.5. Cancel any line still speaking before a new one (`speechSynthesis.cancel()`). Guard everything with `'speechSynthesis' in window` and try/catch.
2. **Gnome gibberish** (always, under the speech, or alone if speech is missing): a 0.3-0.8 s burst of 3-6 "syllables": a sawtooth/triangle oscillator at 280-520 Hz through two bandpass formant filters (vowel-like: pick per syllable from a/e/o/u formant pairs, e.g. a = 800/1200 Hz, o = 500/900, u = 350/800, e = 500/1900), each syllable with an attack/decay envelope and pitch glide; excited lines go up in pitch, sad lines glide down.

Voice lines (pick at random, never the same line twice in a row for a kind), spoken when a new `state.result.serial` appears (phase 'result' starts), 0.15 s after it starts:
- strike: "Strike!", "Steee-rike!", "Gnome-tastic!", "All the gnomes are down!", "Bowl-cut power!"
- double: "Double!", "Two in a row!", "Double trouble!"
- turkey: "Turkey!", "Gobble gobble, turkey!", "Three strikes, baby!"
- hambone: "Hambone!", "Somebody stop this gnome!", "On fire!"
- spare: "Spare!", "Picked it up!", "Clean-up crew!", "Nice spare!"
- gutter: "Gutter ball!", "Oh no!", "Into the ditch!", "Ugh, gutter!", "My beard is ashamed."
- miss: "Missed!", "Not even one?", "Whoopsie!"
- split: "Split!", "Ooh, a split!", "That's a big gap!"
- nine: "So close!", "Nine! Argh!", "One stubborn gnome!"
- pins: "<count>!" for count ≥ 7 with "Nice!", e.g. "Eight! Nice!"; for 1-6: "<count>.", "Meh.", "Okay…".

**Pin yelps (hits)**: on the first few 'ballPin' / 'pinFall' events of a throw (max 4 per throw, at least 0.08 s apart), the pins yelp in tiny gibberish voices: very short (0.12-0.2 s) high-pitched (700-1100 Hz) single-syllable "oof!/ow!/eep!" from the gibberish synth. Do not use speech for these (too slow).

**Release grunt**: at the 'approach' → 'roll' transition, the bowler goes "Hup!" (gibberish one syllable, low-mid pitch).

Optional `#mute` in the URL hash mutes everything; also export nothing new (keep the stub's exports).

## Contract
Keep exactly: `export type SfxName = 'click' | 'tick' | 'swoosh' | 'thud'`, `export function startAudio(): void`, `export function sfx(name: SfxName, volume = 1): void`, `export function createAudio(ctx: Ctx): System`. Other files call `startAudio()` from their first pointerdown/keydown; also call it yourself from a one-time `pointerdown`/`keydown` listener on `window`.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in audio.ts
- After a first tap, throws rumble and crash, pins yelp, and the gnome voice shouts the result line for each ResultKind.

## Out of scope
Music. Every other file.
