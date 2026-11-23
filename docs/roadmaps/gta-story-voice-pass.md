# Gnome Theft Auto: story, voices and mission comms (lane F)

Goal: every gnome that speaks in Gnome Theft Auto has its own procedural voice; the campaign introduces its people
properly and refers back to them; quests explain themselves with talking-head briefings and phone-style comms.

Three items from the user:

1. Distinct gnome voices for the story cast, side-quest strangers and ambient NPC barks, as data per character with a
   derived voice for anyone unlisted, in sync with the typewriter text, through the game's sound bus and sliders.
2. An editor pass on the story (findings in `docs/design/gnome-theft-auto/story-edit-pass.md`), then the text fixes.
3. A mission briefing / comms UI with a talking head, name and voiced typewriter text, and briefing text for the quests.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0. Foundation (planner) | contracts and stubs build: `VoiceSpec` + `output` in `@lawn/mutter`, `src/voice/speech.ts` (voice bus + Voices slider), `src/voice/voices.ts` stub, `src/briefing/briefing.ts` stub, `src/quests/comms.ts` (all briefing text), `onObjectiveStart` quest hook, director/cast/subtitles pass voices, `?briefing=<quest>[:step]` | planner |
| 1. Build | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/mutter`, the other mutter games type-check | 3 parallel issues |
| 2. Story edit (planner) | `story-edit-pass.md` written, scene and quest text fixed, `npm run cutscene-report` no new faults, `npm run lore` | planner |

The story edit is editorial judgement, so the planner does it directly (about 30 line edits across scene files) rather
than writing an issue per line. Online: voices and comms are local to each browser (text and sound only, nothing to
sync), so nothing goes over `@lawn/mp`.

## Foundation contracts (already in the code)

- `packages/mutter/src/index.ts`: `VoiceSpec` (hz, speed, wave, sub, formant, q, breath, wobble, range, glide, style,
  syllables, bright), `SayOptions` (`maxLetters`, `phone`, `gain`, `pan`), `MutterOptions.output`, `say(text, number |
  VoiceSpec, opts)`.
- `games/gnome-theft-auto/src/voice/speech.ts`: `speech()`, `speak()`, `speakAt(text, voice, x, z, maxDist)`,
  `voiceSpatial()`, `getVoiceVolume()` / `setVoiceVolume()` (saved `gta.vol.voices`), `unlockSpeech()`.
- `games/gnome-theft-auto/src/voice/voices.ts`: `VOICES`, `voiceFor(label, hz?)`, `playerVoice(look?)`.
- `games/gnome-theft-auto/src/briefing/briefing.ts`: `createBriefing(ui)`, `Briefing.show(lines, { mode, title, onDone })`,
  `hide()`, `active`, `update(dt)`, `BriefingCaller { key, name, look, voice }`.
- `games/gnome-theft-auto/src/quests/comms.ts`: `COMMS[questId][step]`, `commsFor`, `callerOf`, `briefingLines`.

## Epic 1 issues

~~~~text
Epic: 1. Build
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af768023d05183194 (a git worktree; work only
here, never cd elsewhere). Git Bash: export PATH="/c/Program Files/nodejs:$PATH" if node is missing. Dependencies are
installed. Other workers are editing other files of games/gnome-theft-auto at the same time. Do not commit.

## Goal
@lawn/mutter speaks every field of VoiceSpec, so two characters with different specs sound clearly different (pitch,
timbre, speed, mutter style, syllable set), and it can play through a phone filter, with per-line gain and pan.

## Read first
- packages/mutter/src/index.ts: the whole file. The VoiceSpec, SayOptions and MutterOptions.output contracts are already
  written (read their doc comments: they are the spec). say() currently uses only voice.hz (see the "Stub" comment);
  output routing (hostChain) already works, keep it.
- packages/mutter/src/index.test.ts and packages/mutter/README.md.

## Change
- packages/mutter/src/index.ts:
  - Normalise the voice once per say(): `const v = resolveVoice(voiceIn)` where `export function resolveVoice(voice:
    number | VoiceSpec): Required<Omit<VoiceSpec, 'syllables'>> & { syllables: string }` fills the defaults (speed 1,
    wave 'saw', sub 0.5, formant 1, q 5, breath 0, wobble 0, range 1, glide 0, style 'letters', syllables '', bright
    2600). Export it.
  - planMutter(text, maxLetters, style = 'letters', syllables = ''): keep today's output for style 'letters' with no
    syllables (existing tests must pass). 'syllables': one blip per run of vowels inside a word (consonants before it
    fold into it; a word with no vowel is one blip); blips get a `len` multiplier 1.6. 'words': one blip per word, `len`
    2.2, formants of the word's first vowel. Add `len: number` (default 1) to the blip token. When `syllables` is
    non-empty, split it on spaces; each blip takes the formants of syllable index (hash of the blip's letters) %
    count, using that syllable's first vowel (vowelFormants), so 'bo ba bu' voices sound like "bo ba bu".
  - durationOf(toks, speed): blip step = BLIP_STEP * len / speed, gaps / speed. estimate(text, opts?, voice?) gets an
    optional third parameter `voice?: number | VoiceSpec` (add it to the Mutter interface) so estimates match say().
  - blip(): use v.wave for the main oscillator type ('saw' -> 'sawtooth'), v.sub for the sub-octave square's gain,
    formants multiplied by v.formant, Q = v.q, blip length scaled by len / speed. breath > 0: also play a short noise
    burst (one shared white-noise AudioBuffer per context, made once) through the same formant bandpasses at gain
    breath * 0.6. wobble > 0: a sine LFO (5.5 Hz, depth wobble * 3% of pitch) on both oscillators' frequency plus extra
    random jitter of wobble * 4% per blip.
  - Pitch per blip: hz * (1 + (((code * 7) % 12) - 6) / 45 * v.range) * jitter * tok.mul * (1 + v.glide * 0.25 *
    (p - 0.5)) where p is the blip's position 0..1 across the line.
  - Each say() builds its own small chain: per-line gain (opts.gain ?? 1) -> StereoPannerNode (opts.pan ?? 0; skip if
    ctx.createStereoPanner is missing) -> a lowpass at v.bright -> master. opts.phone: insert a highpass 350 Hz, a
    lowpass 3200 Hz (instead of v.bright) and a WaveShaperNode soft clip (curve k = 4) before the panner.
  - Keep MAX_VOICES, stop(), the '#mute' check, and the old signature say(text, 88) working.
- packages/mutter/src/index.test.ts: add tests: resolveVoice(88) equals resolveVoice({ hz: 88 }); 'words' style gives one
  blip per word; 'syllables' gives fewer blips than 'letters' for "banana split"; estimate is shorter at speed 1.5 than
  at 0.7 for the same text; a syllable set changes the blips' formants but not their count.
- packages/mutter/README.md: document VoiceSpec (a table of the fields with their ranges), output, phone, gain, pan, and
  a two-voice example.

## Contract
Keep every existing export and signature (createMutter, planMutter's first two params, Mutter.say/estimate/stop/unlock,
Tok). New: resolveVoice export, Tok blip `len`, estimate's optional third param.

## Done when
- npm test -w packages/mutter passes.
- npx tsc --noEmit -p games/gnome-theft-auto, npx tsc --noEmit -p games/gnomeokemon, npx tsc --noEmit -p
  games/gnome-set-radio and npx tsc --noEmit -p games/nothing-left-to-collect all pass (they use @lawn/mutter).
- No browser or dev server needed.

## Out of scope
Everything under games/ (other workers own those files). Do not touch games/gnome-blackjack (it has its own copy).
~~~~

~~~~text
Epic: 1. Build
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af768023d05183194 (a git worktree; work only
here). Git Bash: export PATH="/c/Program Files/nodejs:$PATH" if node is missing. Other workers are editing
packages/mutter and games/gnome-theft-auto/src/voice/voices.ts + src/ambientGnomes.ts at the same time. Do not commit.
Repo rules: UI modules append their own container to #ui and never restyle #ui; every action works by touch (44 px
targets, no hover-only UI); fits a 390x844 portrait phone and an 844x390 landscape phone with safe-area insets.

## Goal
The mission comms panel exists: a talking-head portrait of the speaking gnome, their name, and their line typing out
letter by letter in their voice, at a quest's start ('briefing') and as phone-style calls ('call'), never pausing the game.

## Read first
- games/gnome-theft-auto/src/briefing/briefing.ts: the stub. Its exported types and createBriefing signature are the
  contract; replace the body.
- games/gnome-theft-auto/src/cutscene/subtitles.ts: the cutscene dialogue card. Copy its typing approach: text split
  into a typed span and a hidden rest span (the card keeps its size), and voicing one word as its first letter appears
  (voice.stop(); voice.say(word, voice, { maxLetters: 4 })), one word only when a reveal jumps more than 12 characters.
- games/gnome-theft-auto/src/voice/speech.ts: speech() is the shared Mutter, unlockSpeech() unlocks audio from a gesture.
- games/gnome-theft-auto/src/quests/comms.ts: the data that will be shown (callerOf, briefingLines, COMMS).
- games/gnome-theft-auto/src/hud.ts lines 1-100 (HUD CSS) and src/radio/player.ts lines 85-130: where the HUD, the
  minimap (top right), the toasts (top centre), the radio text and the touch buttons (bottom corners) sit at each size.

## Change
- games/gnome-theft-auto/src/briefing/portrait.ts (new): `export function portraitUrl(key: string, look: GnomeLook): string`
  returns a PNG data URL (cached per key + look) of the gnome's head and shoulders: one lazily created offscreen
  `new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })` at 128x128 (reuse it for
  every portrait), a scene with a hemisphere light + a directional key light, `createGnomeModel(look)` from
  '@lawn/gnome' (dispose its geometries/materials after rendering), a PerspectiveCamera (fov 30) framing the head (find
  the head height from `new THREE.Box3().setFromObject(model.object)`: aim at 80% of its height, about 3/4 view),
  renderer.render, `renderer.domElement.toDataURL('image/png')`. If WebGL is unavailable or anything throws, return a
  data URL drawn on a 2D canvas instead: a circle in look.skin, a pointed hat triangle in look.hat, a beard half-disc in
  look.beard (skip when null). Export `export function portraitElement(key: string, look: GnomeLook): HTMLImageElement`.
- games/gnome-theft-auto/src/briefing/briefing.ts: implement createBriefing(ui). Root `<div id="gta-briefing">` appended
  to ui, one injected <style id="gta-briefing-style">. Inside: a card with the portrait (64 px square, rounded, a
  coloured ring in the caller's hat colour; 52 px on phones), the caller's name (bold, #ffd23f), a mode tag ('BRIEFING'
  + the title for mode 'briefing', '📞 CALL' for 'call'), the typed text (15 px, phones 13 px), and two buttons, Next ▶
  (Done ▶ on the last line) and Skip ✕, each at least 44x44 px. A tap anywhere on the card = Next (finish typing first,
  then the next line), like subtitles.ts. pointerdown handlers call unlockSpeech() first and stopPropagation so the game
  does not also read the tap; the card has pointer-events:auto, the root none.
  - Typing: 40 characters a second, driven by update(dt) (no requestAnimationFrame of your own). After a line has fully
    typed, auto-advance after max(2.2, words / 3.5) seconds; the last line then closes the panel.
  - Voice: speech().say(word, caller.voice, { maxLetters: 4, phone: mode === 'call' }) per word as in subtitles.ts.
  - While typing, the portrait bobs (a CSS class toggled per word: transform translateY(-2px) scale(1.03) for 90 ms) so
    the head looks like it talks.
  - 'call' mode opens with a short ring: play2d('phone-ring') is NOT available; instead show '📞 Incoming: <name>' for
    0.6 s before the first line types.
  - show() replaces anything showing (call the old onDone first). hide() stops the voice (speech().stop()), hides the
    root and calls onDone once. `active` is true while shown.
  - Layout (one CSS block, position fixed, z-index 45, below cutscene overlays at 60): desktop: centred at the bottom,
    `bottom: calc(env(safe-area-inset-bottom) + 150px)`, width min(560px, 100vw - 24px). Phones in portrait
    (@media (max-width:700px)): `top: calc(env(safe-area-inset-top) + 150px)`, left/right
    max(8px, env(safe-area-inset-left/right)). Phones in landscape (@media (max-height:500px)): top
    calc(env(safe-area-inset-top) + 8px), centred, width min(440px, 52vw) so it clears the left stats column and the
    minimap. Check the screenshots below and adjust if it covers the minimap or the touch buttons.
- Nothing else: app.ts already calls createBriefing(ui), show() from the quest hook, update(dt) each frame and hide() when
  a cutscene starts; `?briefing=<questId>[:<step>]` shows a quest's comms 1.2 s after load.

## Contract
Keep the stub's exports exactly: BriefingCaller, BriefingLine, BriefingShowOptions, Briefing, createBriefing(ui).

## Done when
- npx tsc --noEmit -p games/gnome-theft-auto passes (other workers' files may be mid-edit; only your files must be clean).
- With the dev server on port 5306 (npm run dev -w games/gnome-theft-auto -- --port 5306 --strictPort, run in the
  background; you are the only worker using this port), headless Edge screenshots show the card with a real gnome
  portrait, name and text at 390x844, 844x390 and 1280x800:
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader
  --enable-unsafe-swiftshader --virtual-time-budget=9000 --window-size=390,844 --screenshot=<scratch path>.png
  "http://localhost:5306/?offline&no-intro&briefing=ch1-two-coat-tail"
  (also try briefing=ch3-salvage-raid:2 for a call). Look at each screenshot (Read the PNG) and fix overlaps.
- bash tools/smoke.sh "http://localhost:5306/?offline&no-intro&briefing=ch1-two-coat-tail" gta-briefing prints SMOKE OK.
- Stop the dev server when done.

## Out of scope
packages/mutter, src/voice/*, src/quests/*, src/app.ts, src/ambientGnomes.ts, src/cutscene/* (other owners).
~~~~

~~~~text
Epic: 1. Build
Depends on: none

## Environment
Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af768023d05183194 (a git worktree; work only
here). Git Bash: export PATH="/c/Program Files/nodejs:$PATH" if node is missing. Other workers are editing
packages/mutter and games/gnome-theft-auto/src/briefing/* at the same time. Do not commit. Do not start a dev server.

## Goal
Every speaking character in Gnome Theft Auto has a distinct voice as data, anyone unlisted gets a stable derived voice,
and the 26 ambient street gnomes say their bubble line out loud, in their own voice, when their bubble pops up.

## Read first
- games/gnome-theft-auto/src/voice/voices.ts: the stub (VOICES, voiceFor, playerVoice). Replace the bodies, keep the
  exported names and signatures.
- packages/mutter/src/index.ts, the `VoiceSpec` interface only (its doc comments give every field's range).
- games/gnome-theft-auto/src/cutscene/cast.ts: the CAST table (keys and their `hz`).
- games/gnome-theft-auto/src/ambientGnomes.ts: AMBIENT_GNOMES and createAmbientGnomes().update (the bubble pops up
  when `want` turns 1).
- games/gnome-theft-auto/src/voice/speech.ts: speakAt(text, voice, x, z, maxDist).

## Change
- games/gnome-theft-auto/src/voice/voices.ts:
  - VOICES: one hand-made VoiceSpec per CAST key (all 21: pip, tansy, vesper, granny, diggs, bracken, loam, bodega,
    juniper, reginald, sorrel, clara, brenda, 'big lou', mossley, burt, driftwood, cedric, bramble, shelldon, wally),
    `hz` equal to that CAST entry's hz, then the other fields chosen from the character notes below so that no two
    entries share the same (wave, style, rounded formant) combination. Also entries for: narrator (hz 130, triangle,
    speed 0.8, range 0.6, glide -0.3, bright 2200: a calm storyteller), 'mayor mulch' (hz 108, sing-song range 1.8,
    speed 1.2, wave square), 'mabel' (hz 140, wobble 0.4, speed 0.9, breath 0.1: an old taxi driver), 'turncoat cam'
    (hz 112, speed 1.15, range 0.5, breath 0.15: sly, quiet), 'bodyguard' (hz 70, style words, sub 1, formant 0.82),
    'burdock' (hz 92, speed 0.85, square, range 0.4: counts everything), 'thermos theo', 'rooster weatherby' (hz 150,
    speed 1.5, wobble 0.5: shouty), 'periwinkle', 'lugnut lulu', 'vinnie', 'dock', 'marigold', 'tattler'.
    Character notes: Pip fast and squeaky, eager (speed 1.35, glide +0.4, formant 1.15, range 1.4). Tansy dry and low,
    flat (speed 0.9, range 0.4, wave square, glide -0.3). Vesper soft, slow, smooth, never rushed (speed 0.72, wave sine,
    breath 0.12, range 0.5, q 3). Granny warm and wobbly (wobble 0.35, triangle, speed 0.85). Diggs gruff bark (style
    words, sub 0.9, formant 0.85). Bracken ancient and slow (speed 0.65, wobble 0.3, breath 0.2, formant 0.85). Loam
    preacher (range 1.6, syllables 'ah oh mm', speed 0.8). Bodega laconic (style syllables, speed 0.9). Juniper brisk
    and precise (speed 1.15, q 8, range 0.7). Reginald nasal clerk (q 9, wave square, range 0.3, speed 1.05). Sorrel
    gentle radio host (triangle, speed 0.85, breath 0.15, bright 2000). Clara porcelain, glassy (sine, formant 1.3,
    bright 3600, speed 0.8). Brenda grand (range 1.9, speed 0.95, glide +0.2). Big Lou one-word bouncer (style words, hz
    78, sub 1, speed 0.7). Mossley nervous whisper (breath 0.4, wobble 0.3, speed 1.3). Burt apologetic mumble (range
    0.5, glide -0.4, style syllables). Driftwood dreamy sailor (wobble 0.25, glide -0.2, syllables 'oo oh ah'). Cedric
    salesman (speed 1.4, range 1.7, wave square). Bramble slow farmhand (style syllables, speed 0.75). Shelldon paranoid
    (breath 0.3, speed 1.2, range 0.6). Wally radio-clipped (wave square, speed 1.2, q 7).
  - voiceFor(label, hz?): lower-case the label; exact key in VOICES, else the longest VOICES key that the label contains
    as a whole word sequence (so "Pip Potsworth" -> pip, "John Bodega" -> bodega, "Shelldon "No-Trail" Mucilage" ->
    shelldon, "Councilwoman Juniper Vance" -> juniper, "Burdock "Big Flag" Bellweather" -> burdock), else a derived
    voice. Return a copy with hz replaced when `hz` is given.
  - Derived voice: a 32-bit FNV-1a hash of the lower-cased label seeds a small PRNG (mulberry32). hz 82..150, speed
    0.85..1.25, wave from ['saw','square','triangle'], sub 0.2..0.9, formant 0.88..1.18, q 3..8, breath 0..0.2,
    wobble 0..0.25, range 0.6..1.5, glide -0.3..0.3, style 'letters' (70%) or 'syllables'. Family traits applied after
    the hash, matched on words in the label: 'hoa', 'auditor', 'enforcer', 'bailiff', 'welder', 'plow', 'inspector' ->
    range 0.3, wave 'square', q 8 (clerks); 'guard', 'bouncer', 'wrangler', 'bookie' -> style 'words', sub 0.9,
    formant 0.85 (heavies); 'refugee', 'porcelain' -> wave 'sine', formant 1.28, bright 3600 (porcelain ring);
    'reporter', 'judge', 'caddie', 'member', 'patron', 'biker' keep the hash.
  - playerVoice(look?): hz 96..124 and the other fields from a hash of JSON.stringify(look ?? {}), style 'letters', so
    each player gnome sounds a little different but always plain and neutral (range 0.8..1.1, breath 0, wobble 0).
- games/gnome-theft-auto/src/voice/voices.test.ts (new, vitest): every CAST key has a VOICES entry with the CAST hz;
  voiceFor('Pip Potsworth') equals VOICES.pip; voiceFor('Pip Potsworth', 150).hz === 150 and VOICES.pip.hz unchanged;
  voiceFor('Some Random Gnome') is stable across calls and differs from voiceFor('Another Random Gnome') in at least
  two fields; voiceFor('HOA Enforcer').range === 0.3; the 26 AMBIENT_GNOMES names give at least 20 distinct hz values.
- games/gnome-theft-auto/src/ambientGnomes.ts: add an optional `voice?: Partial<VoiceSpec>` to AmbientGnomeDef (none
  set; it overrides the derived voice when present). In createAmbientGnomes, compute each entry's voice once:
  `{ ...voiceFor(def.name), ...(def.voice ?? {}) }`. When an entry's bubble pops up (want goes from 0 to 1, i.e. it was
  hidden and is now shown; track a `spoken` flag that resets when the bubble has fully hidden, `vis < 0.03`), call
  `speakAt(def.bubble, voice, def.x, def.z, 16)` at most once per 20 s per gnome. Do nothing when px is 1e6 (the
  cutscene call passes 1e6 to hide bubbles). Imports: `import type { VoiceSpec } from '@lawn/mutter'`,
  `import { speakAt } from './voice/speech'`, `import { voiceFor } from './voice/voices'`.

## Contract
voices.ts keeps: `export const VOICES: Readonly<Record<string, VoiceSpec>>`, `export function voiceFor(label: string,
hz?: number): VoiceSpec`, `export function playerVoice(look?: GnomeLook | null): VoiceSpec`. voices.ts stays pure (no
audio, no DOM, no three.js imports).

## Done when
- npx vitest run src/voice/voices.test.ts (run inside games/gnome-theft-auto) passes.
- npx tsc --noEmit -p games/gnome-theft-auto passes (other workers' files may be mid-edit; your files must be clean).

## Out of scope
packages/mutter, src/briefing/*, src/quests/*, src/cutscene/*, src/app.ts.
~~~~
