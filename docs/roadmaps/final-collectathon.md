# The Final Collectathon roadmap

Goal: a 15-20 minute, four-chapter, single-player 3D satire of collectathons that is itself a mega collectathon.
It opens with a secretary saying "Hello." in the reception of an office building on the edge of Club Gnome's square,
where the player gnome has come for a job interview. Four floors of escalating collecting follow (an interview, or a
dream about one: nobody is sure) until the collecting swallows everything and turns pointless. Back in reception, the
player tells the secretary they are not taking the job, walks out, and flies into the sky to Shellshore, the beach
planet, to live out the rest of their days.

Game folder: `games/final-collectathon` (title "The Final Collectathon", port 5205).

## Decisions

| Question | Decision | Why |
|---|---|---|
| Engine | **three.js** (Vite + TypeScript), not Phaser | `docs/stack.md` sends 3D ideas to `three`. Collectathons are a 3D genre, and the three packages this game leans on are 3D: `@lawn/gnome` (`createGnomeModel`: the player gnome, walking and flying), `@lawn/prefabs` (`createDrop`: hovering, turning pickups; the office furniture already exists as prefabs) and `@lawn/party` (slices need a Three.js view). Scaffold with `npm run new -- final-collectathon` as asked, then swap Phaser for three (`games/giant-pup` is the layout to copy). |
| Camera and controls | Fixed-yaw third-person follow camera (looking toward -z), no camera rotation | One stick plus two buttons on a phone. Screen right is +x, screen down is +z. |
| Online | **No**, single-player | It is a solo narrative with one secretary, one interviewer and one ending. A shared office would double the game and make the story beats (locked dialogue, scripted flight) per-player anyway. Recorded here and in the PR. |
| Party slice | **Yes**: `hoard-rush` | A 30 s "four gnomes, one office floor, the ceiling rains office supplies, most collected wins" round fits the size rules (one verb: move; four at once; small JSON state) and is built from the game's own pure modules (`collect.ts`, `walk.ts`, `office.ts`). Last content epic. |
| Lore setting | **`apocrypha`** | The game is a fourth-wall parody (a narrator, fake achievements, "you are free to play the game"). The core house style bans fourth-wall jokes except in apocrypha. The building is "said to stand at the edge of Club Gnome's square"; Club Gnome itself does not have to show it. |
| Music | Three new themes in `@lawn/music` (Tone.js, generated in code, nothing to credit) | The repo's convention for game music; each theme is one file a worker owns, with the package's existing graph and note-conflict tests. |
| Player gnome | Yes: `loadMyGnome()` / `getMyGnome()?.look` through `createGnomeModel` | The player walks, jumps and flies. |
| Mobile | Joystick (left half drag), Jump and Interact buttons (64 px), tap-to-advance dialogue, 44 px choice buttons, safe-area insets | Portrait camera pulls back (x1.45). |
| Saving | localStorage `final-collectathon.save.v1`: chapter reached, eggs found, finished | Resume from the start of a chapter. `?chapter=<id>` jumps for testing; `?fast` shortens every wait and line. |

## The frame: interview or dream

Nothing says which. The clues point both ways and the game never settles it (a loose thread in the lore).

- Every wall clock in the building says 9:00, on every floor, and in reception at the end. "Interviews are always at nine."
- The Interviewer is only ever a voice "in the ceiling". His speaker label drifts each chapter: *The Interviewer* →
  *The Interviewer (probably)* → *The Narrator* → *You, possibly* → back to *The Interviewer* in the ending.
- The floors are numbered 1, 2, 2½, ∞. The lift panel also has a B.
- Coworkers on Floor 2½ are asleep at their desks. "Don't wake them. They're on their break. Since nine."
- In the ending the secretary asks: "Was it the interview? Or did you nod off in the chair? It's a very comfortable chair."
- After the credits, on the beach, a faint intercom: "...Hello?"

## Names (lore)

Checked with `npm run lore -- find` (office, club, secretary, beach, planet, interview, dream, job): none of these
exist, so they are new `apocrypha` entries. House style: plant first names, household/soil/tool surnames, one pun.

| Thing | Name | Kind |
|---|---|---|
| The building | **the Annex** (the Club Gnome Annex) | place |
| The company | **Bucketworth & Sons, Collectors** ("collecting since before there was anything to collect") | faction |
| The secretary | **Primrose Paperweight**, Reception | person |
| The narrator | **the Interviewer**, a voice in the ceiling, never seen | person |
| Water-cooler coworker | **Sorrel Gluepot** | person |
| The beach planet | **Shellshore** | place |
| The turning point | **the Pointlessness** | event |

Collectibles (gnomes rename office things): Acorns, Golden Acorns, **Clips** ("small silver squiggles"), **Sticky
Squares**, Gold Buttons (buttons are money in the core), **Tokens of Appreciation**, **Stars of Recognition**,
**Collector's Badges**, and on the top floor **Everything** (the furniture itself).

## The four chapters (about 19 minutes)

Each chapter is one floor of the Annex and one script file. The director shows the title card; the chapter ends by
riding the lift to the next floor. Every chapter adds a counter row to the HUD, and the HUD gets busier until Chapter
4 breaks it.

### Prologue: Reception (about 1 minute, floor `lobby`, music Hold Music)

- Fade in on reception. Primrose behind the desk: **"Hello."** The player chooses *Hello.* / *...* / *Is this the
  interview?* Saying hello back unlocks **Hello.**
- She explains: the position is Collector; take the lift to Floor 1; "help yourself to anything that glows. That's
  sort of the job."
- Eggs: **The Shortest Interview** (walk back out of the front door before taking the lift: a fake THE END, then "You
  came back. Everyone comes back.") and **Still Primrose** (examine her nameplate four times).

### Chapter 1: Orientation (about 3 minutes, Floor 1, Hold Music)

A parody of the collectathon tutorial.

- A trail of 20 acorns "leading somewhere, as is tradition". The Interviewer counts them with growing praise.
- 5 Golden Acorns on top of the filing cabinets: the jump lesson.
- A "Skip Tutorial" button sits in the HUD the whole chapter. It does nothing. Pressing it 10 times turns it into
  "Skip Skip Tutorial" (egg **Skip Skip Tutorial**).
- One display acorn on a plinth behind rope: "not for collecting". Collecting it is egg **The One You Were Told Not To**.
- 25 more acorns across the open-plan floor. "That's every acorn on Floor 1. You are now oriented."

### Chapter 2: Onboarding (about 4.5 minutes, Floor 2, Synergy Loop at low intensity)

The genre's second act: more kinds, respawns, an economy.

- **Clips** (120 scattered, respawning: "That's called retention"), then **Sticky Squares** ("collect enough and they
  form a sentence. The sentence is 'collect more Sticky Squares'"), then **Gold Buttons** hidden in corners and on desks.
- An upgrade kiosk (a vending machine): spend Gold Buttons on a Bigger Magnet or Double Clips. "You spent collectibles
  to collect collectibles faster."
- Free "Overtime" multipliers at 200 and 500 Clips. Goal: 1,000 Clips (achievement **Clip Art**).
- Eggs: **Water Cooler Gossip** (talk to Sorrel Gluepot three times: "nobody's ever finished the interview. You just
  sort of... stop.") and **Two of You** (use the photocopier: "Collected: You (2)").
- "Floor 2: 100%." Three seconds later: "Floor 2: 104%. We round up."

### Chapter 3: Synergy (about 5 minutes, Floor 2½, Synergy Loop rising to full intensity and tempo)

Meta-collectibles and the achievement treadmill. The dream leans in.

- Collectibles rain from the ceiling. Every 100 of anything becomes a Token of Appreciation; every 10 Tokens a Star of
  Recognition; every 5 Stars a Collector's Badge. Each conversion drops at your feet, to be collected again.
- A fake in-game achievement toast every 6 seconds ("Walked a Bit", "Achievement Hunter Hunter", "Completionist (12%)",
  "Number Go Up"). Each toast and each Star counts toward **Employee of the Month** (50 Recognitions, a real achievement).
- The multiplier doubles every 45 seconds; counters go into scientific notation. The music speeds up. "That's not me.
  That's the economy."
- The Narrator tires: "I used to have a script. It's in a filing cabinet. I collected it."
- Egg: **The Answer Is Always Gnome** (the break-room arcade cabinet runs a five-letter word game; the answer is GNOME).
- Ends at 2 Badges or 5 minutes: "There's one more floor. The top one. It has everything."

### Chapter 4: Everything (about 4 minutes, Floor ∞, Synergy Loop → silence → Shellshore)

- **Everything is collectible.** The furniture turns into pickups one piece at a time; office supplies rain; the
  multiplier goes x10 every 15 seconds; toasts every second; the HUD overflows and slides off the screen.
- The counter hits ∞. "Infinity and one. Infinity and two."
- **The Pointlessness.** Everything stops. Music cuts. The HUD empties to one line: "Collected: everything. Left to
  collect: nothing." Achievement **The Point**.
- "So. You're free. You are finally free to play the game." Silence; nothing happens. "...The game was the
  collecting. I'm sorry. I thought you knew." Shellshore's pads start, very quietly.
- A window glows: Shellshore hangs in the sky. "Nobody collects anything there. They just... sit." The lift only goes
  to L.

### Ending: Reception (about 2 minutes, lobby then sky)

- The clock says 9:00. Primrose: **"Hello."** Choices *Hello.* / *I'm not taking the job.* Each *Hello.* gets a new
  line; after three, only *I'm not taking the job.* is left.
- "Oh. Nobody ever says that." "Was it the interview? Or did you nod off in the chair?" "Mind the step. And don't
  collect anything on your way out." Achievement **I'm Not Taking the Job**.
- The front doors open onto white light. The gnome walks out and **flies** up past the Annex roof and the clouds,
  Shellshore growing ahead. Acorns float along the way, labelled "(Optional)". "You don't have to collect those."
  ... "You never did."
- Landing on Shellshore's beach (palm trees, a beach ball, shells). Credits roll: "Starring: You", "Primrose Paperweight
  as Herself", "The Interviewer as the Ceiling", the final total, "Kept: nothing", "Thank you for not taking the job."
- Free roam on the beach forever, with no goals. Twenty seconds later, a faint intercom: "...Hello?"

## Easter eggs (8, achievement "Collector of Secrets")

| Id | Name | Where | How |
|---|---|---|---|
| `shortest-interview` | The Shortest Interview | Lobby, prologue | Walk out of the front door before taking the lift |
| `nameplate` | Still Primrose | Lobby, prologue | Examine the desk nameplate 4 times |
| `skip-tutorial` | Skip Skip Tutorial | Floor 1 | Press "Skip Tutorial" 10 times |
| `do-not-collect` | The One You Were Told Not To | Floor 1 | Collect the display acorn on the plinth |
| `water-cooler` | Water Cooler Gossip | Floor 2 | Talk to Sorrel Gluepot 3 times |
| `photocopier` | Two of You | Floor 2 | Use the photocopier |
| `arcade-cabinet` | The Answer Is Always Gnome | Floor 2½ break room | Play the word game on the arcade cabinet |
| `basement` | Floor B | Any lift ride | Press B on the lift panel |

Non-counted gags: the clock is always 9:00; the narrator's drifting label; the "104%"; the window onto Shellshore; the
post-credits "...Hello?".

## Soundtracks (3, in `packages/music/src/themes/`)

All take `(T, keep, out, seed, opts?: FcMusicOptions)` and return `FcMusicHooks` (`pickup()`: one note of a climbing
pickup scale in the track's key, the classic collectathon combo; resets after 1.2 s without a pickup).

| Track | File / builder | Mood | Tempo, key | Instruments | Where it plays | Reacts to |
|---|---|---|---|---|---|---|
| **Hold Music** | `fcHoldMusic.ts` / `buildFcHoldMusic` | Smooth bossa-lounge office muzak: polite, a little too pleased with itself | 96 bpm, D major, ii-V-I with maj7/m7/dom7 colour, 16-bar loop | Rhodes-like comp, nylon pluck bass, soft flute/vibes melody, rim + brush bossa pattern, shaker | Prologue, Chapter 1, every lift ride (muffled), the ending's reception dialogue | `pickup()`: vibraphone note up the major pentatonic |
| **Synergy Loop** | `fcSynergyLoop.ts` / `buildFcSynergyLoop` | Bouncy corporate-funk collectathon: marimba ostinato, slap bass, pizzicato, claps; escalates into absurdity | 116 bpm at intensity 0, ramps to 150 at intensity 1; F major I-vi-IV-V; a semitone key change every 16 bars above intensity 0.9 | Marimba, slap/pluck bass, drum kit, pizzicato, brass stabs, an over-the-top lead | Chapters 2-3 and the first phase of Chapter 4 | `opts.intensity()`: layers (0 marimba + bass, 0.33 drums, 0.66 pizz + brass + claps, 0.9 lead + key changes) and tempo; `pickup()`: pluck up the scale |
| **Shellshore** | `fcShellshore.ts` / `buildFcShellshore` | Dreamy island lullaby: warm, slow, free | 72 bpm, A♭ major with a lydian #4 colour, 16-bar loop | Steel-drum-like FM bell, ukulele-like pluck strum, warm pad, ocean noise (filtered pink noise, slow swell), soft shaker, round bass | Chapter 4 after the Pointlessness (intensity 0: pads + ocean only), then the flight and the beach (intensity 1: everything) | `opts.intensity()`: 0 pads + ocean, 0.5 + steel drum melody, 1 + strum, bass, shaker; `pickup()`: soft bell |

## Achievements (6, in `packages/achievements/src/catalog.ts`)

Every one rewards a new `@lawn/prefabs` cosmetic (every existing head, back and neck item is already granted).

| Id | Title | How | Reward (slot, new prefab) |
|---|---|---|---|
| `collectathon-hello` | Hello. | Say hello back to the secretary | neck `fc-visitor-lanyard` Visitor Lanyard |
| `collectathon-clip-art` | Clip Art | Collect 1,000 Clips on Floor 2 | hand `fc-giant-paperclip` Giant Paperclip |
| `collectathon-employee-of-the-month` | Employee of the Month | Earn 50 Recognitions on Floor 2½ (target 50) | head `fc-employee-cap` Employee of the Month Cap |
| `collectathon-the-point` | The Point | Collect everything there is to collect | back `fc-bottomless-sack` Bottomless Sack |
| `collectathon-not-taking-it` | I'm Not Taking the Job | Tell the secretary, and leave | head `fc-sun-hat` Shellshore Sun Hat (RARE) |
| `collectathon-easter-eggs` | Collector of Secrets | Find all 8 easter eggs (target 8) | neck `fc-shell-necklace` Shell Necklace (RARE) |

New non-cosmetic prefabs: `fc-paperclip`, `fc-sticky-note`, `fc-appreciation-token`, `fc-collector-badge`
(collectibles), `fc-water-cooler`, `fc-photocopier`, `fc-nameplate` (props). Existing ones reused: `acorn`, `button`,
`party-star`, `reception-desk`, `office-desk`, `filing-cabinet`, `chair`, `couch`, `wall-clock`, `spiky-potted-plant`,
`vending-machine`, `arcade-cabinet`, `bookshelf`, `crate`, `flower-pot`, `trophy-cup`, `palm-tree`, `beach-ball`,
`snail-shell`. Walls, floors, the lift doors, the front doors, the sky and the planet are architecture and terrain
built in the game (`office.ts`, `sky.ts`): the PR says so.

## Code layout (`games/final-collectathon/src/`)

| File | Owner | What |
|---|---|---|
| `main.ts` | 1A, then 3F | Entry: `loadMyGnome()`, then `app` (3F adds the `#minigame` branch) |
| `app.ts` | 1A | Wiring: renderer, scene, camera, floor swap, frame loop, `window.fc` debug handle |
| `types.ts`, `config.ts` | 1A | Every shared type and constant (the contract) |
| `collect.ts` (+ test) | 2A | Pure collecting sim: items, magnet, multiplier, counts, rain, `formatCount` |
| `items.ts` | 2B | Pickup visuals (`createDrop`), pickup bursts |
| `walk.ts`, `player.ts`, `camera.ts` | 2C | Pure walker physics; the player gnome (walk, jump, fly, scripted moves); follow camera |
| `input.ts` | 2D | Keyboard + touch joystick + Jump / Interact buttons |
| `hud.ts` | 2E | Counters, goal, dialogue, choices, toasts, title cards, fades, credits, overflow, Skip button, mute |
| `director.ts` | 2F | Implements `ChapterCtx`: runs chapters, waits, interactions, the lift, eggs, saving |
| `office.ts`, `floors/lobby.ts` | 2G | Floor builder (walls, windows, lift, front door, props, NPCs, lights) and the reception layout |
| `sfx.ts`, `music.ts` | 2H | WebAudio blips + `@lawn/mutter` voices; the music controller over the three themes |
| `save.ts` | 1A | localStorage save |
| `chapters/prologue.ts`, `chapters/ch1.ts`, `floors/f1.ts` | 3A | Prologue + Chapter 1 and Floor 1 |
| `chapters/ch2.ts`, `floors/f2.ts` | 3B | Chapter 2 and Floor 2 |
| `chapters/ch3.ts`, `floors/f3.ts` | 3C | Chapter 3 and Floor 2½ |
| `chapters/ch4.ts`, `floors/f4.ts` | 3D | Chapter 4 and Floor ∞ |
| `chapters/ending.ts`, `sky.ts` | 3E | The ending, the flight and Shellshore |
| `minigames/*` | 3F | The `hoard-rush` party slice |

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Setup (planner) | `npm install` at the repo root (this worktree has no `node_modules` yet) | none |
| 1 Foundation | scaffold, contract (`types.ts`, `config.ts`), `app.ts`, stubs for every module, music theme stubs; new prefabs + achievement defs. `npm run build -w games/final-collectathon`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm test -w packages/gnome` pass. Planner then runs `npm install` again (registers the new workspace in the lockfile). | 2 in parallel |
| 2 Systems | every module filled; the three themes; lore and docs. Build passes; `npm test -w games/final-collectathon`, `npm test -w packages/music`, `npm run lore` pass; smoke check of the stub chapters | 12 in parallel |
| 3 Content | prologue, four chapters, ending, the party slice. Build, `npm test -w games/final-collectathon`, smoke at desktop and 390x844, `npm run zfight` | 6 in parallel |
| 4 Demo and check | demo script, thumbnail, README pass, full `?fast` run-through | 1 |

Dependencies are only between epics: each epic starts from the previous one's working build. Within an epic every
issue owns its own files (see the owner column above; the per-issue "Out of scope" lists the rest).

Online: skipped (see Decisions). Party slice: `hoard-rush` (issue 3F); its backlog row is added in 2L.

## Issues

Each issue is one file under `docs/roadmaps/final-collectathon/`, written to be pasted whole into a `haiku-worker`
prompt (this follows the per-issue-file layout of `docs/roadmaps/giant-pup/` and `gnome-sweet-gnome/`).

Epic 1:
- `1A-foundation.md`: scaffold, contract, `app.ts`, all stubs, music theme stubs + exports
- `1B-prefabs-achievements.md`: `packages/prefabs/src/catalog/final-collectathon.ts`, achievement defs, `docs/cosmetics.md`

Epic 2:
- `2A-collect-sim.md`: `src/collect.ts`, `src/collect.test.ts`
- `2B-items-view.md`: `src/items.ts`
- `2C-player-camera.md`: `src/walk.ts`, `src/player.ts`, `src/camera.ts`
- `2D-input.md`: `src/input.ts`
- `2E-hud.md`: `src/hud.ts`
- `2F-director.md`: `src/director.ts`
- `2G-office-lobby.md`: `src/office.ts`, `src/floors/lobby.ts`
- `2H-audio.md`: `src/sfx.ts`, `src/music.ts`
- `2I-music-hold.md`: `packages/music/src/themes/fcHoldMusic.ts` (+ test)
- `2J-music-synergy.md`: `packages/music/src/themes/fcSynergyLoop.ts` (+ test)
- `2K-music-shellshore.md`: `packages/music/src/themes/fcShellshore.ts` (+ test)
- `2L-lore-docs.md`: lore entries, settings row, ruling, party backlog row, AGENT_INDEX row, game README + CREDITS

Epic 3:
- `3A-prologue-ch1.md`: `src/chapters/prologue.ts`, `src/chapters/ch1.ts`, `src/floors/f1.ts`
- `3B-ch2.md`: `src/chapters/ch2.ts`, `src/floors/f2.ts`
- `3C-ch3.md`: `src/chapters/ch3.ts`, `src/floors/f3.ts`
- `3D-ch4.md`: `src/chapters/ch4.ts`, `src/floors/f4.ts`
- `3E-ending-sky.md`: `src/chapters/ending.ts`, `src/sky.ts`
- `3F-party-slice.md`: `src/minigames/*`, `src/main.ts`

Epic 4:
- `4A-demo-check.md`: `demos/*.json`, thumbnail, README pass

## Checks at the end (planner)

- `npm run build -w games/final-collectathon`, `npm test -w games/final-collectathon`
- `npm test -w packages/music`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm test -w packages/gnome`, `npm run lore`
- `npm run dev -w games/final-collectathon`, then `bash tools/smoke.sh http://localhost:5205/ fc-hud fc-touch fc-dialog`
  and `bash tools/smoke.sh "http://localhost:5205/?chapter=ch3&fast" fc-hud fc-counters`
- `npm run zfight -- http://localhost:5205/?chapter=ch2`
- `#minigame=hoard-rush` plays; Gnome Party picks it up
- Phone viewport 390x844 (portrait and landscape) via the demo recorder
- PR: no online (why), slice added, prefab exemptions (architecture), demo GIF uploaded through the media-upload MCP
