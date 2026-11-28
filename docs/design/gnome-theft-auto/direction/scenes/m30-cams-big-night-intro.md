# Director's notes: `m30-cams-big-night-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m30-cams-big-night-intro`.

| | |
| --- | --- |
| Scene | `m30-cams-big-night-intro` in `src/cutscene/scenes/story/m30-cams-big-night.ts` |
| Played by | quest `m30-cams-big-night` ("Cam's Big Night") as its intro, given at Side-Valve Salvage |
| Kind and length | `intro`, aim 30-60 s; now 28.3 s at Normal text speed (a connective quest's short intro) |
| Where, when | stage `side-valve-apron` (the apron in front of the bay), dusk, `sky: 'golden'` |
| Before / after | before: Tansy's bay after the Kicked Board; after: the pick-up of Cam at the apron (the passenger step) |

## 1. Purpose in the story

Cam wants one thing for himself and has never asked anyone for anything. This scene plants the Speedway night, the entry
slip he saved six weeks of tips for, and the line that explains the whole of his arc: nobody has ever come to watch him.
It also carries Tansy's bench warning by name (she is on comms only), keeps the broom thread (it ends in his hand and is
going to a race), and plants the want that the envelope in the outro will answer.

## 2. The player's feeling

- **In:** a hired hand at Side-Valve who is used to Cam sweeping in the background and never speaking.
- **Out:** mildly touched and slightly amused; sure of the job (collect Cam, drive the support stint at the Speedway).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Cam | a pit crew for one race | he has nobody to ask and cannot look at the person he is asking | flat, short, eyes on the bay; the slip as a prop; the broom as a joke he does not tell | asks, and brings the broom |
| The player | to know what is being asked | Cam's economy of speech | one dry question each | agrees by turning up |

## 4. Subtext

- Cam's "Nobody has ever come to watch me" is the whole of his want (bible: a charter, to be someone) said as a fact. It is the one sincere beat, with no joke on it; the broom gag comes after the objective, not on top.
- "She says do not bet the bench" is Tansy's trust in him and her worry, passed on without comment.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The broom on the concrete; Cam sweeps up to his mark, not looking up. |
| 2 | 4-12 | Setup | "Speedway. One race. I saved up for it." The slip comes out; an insert on it. |
| 3 | 12-20 | Complication | "You? Racing?" "I need a pit crew. Someone who drives." The player's shrug. |
| 4 | 20-24 | Comedy | "Does Tansy know?" "She says do not bet the bench." |
| 5 | 24-30 | Turn | The push-in: "Nobody has ever come to watch me." The ride and where he waits. |
| 6 | 30-38 | Button | "You are bringing the broom?" "It has never seen a race." |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | `spot(apron-wide)`, walk in | Cam | establishing: the apron, the bay lit on the left, Cam sweeping in |
| 2 | `ASK.single('cam','mcu')` | Cam | the ask |
| 3 | `insert('cam')` | the slip in his hand | the prop |
| 4 | `ASK.single('player','mcu')`, `ASK.single('cam','mcu')` | the exchange | straight man, then the answer |
| 5 | reaction `player` (shrug) | the player | the audience's look |
| 6 | `pushIn('cam','mcu',3.6)` | Cam | the sincere line, a slow push |
| 7 | `ASK.single('player','ms')`, `ASK.single('cam','ms')` | the pair | the broom button on medium shots, the widest the gag needs |

One side of the line for the whole scene (`coverage('cam','player',1)`); no crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Cam | Speedway. One race. I saved up for it. | the hook: three clipped sentences, no hello |
| Player | You? Racing? | the straight man |
| Cam | I need a pit crew. Someone who drives. | the ask |
| Player | Does Tansy know? | |
| Cam | She says do not bet the bench. | Tansy by proxy, one gag |
| Cam | Nobody has ever come to watch me. | the sincere beat |
| Cam | Bring a ride round. I will wait here. | the objective, in his voice |
| Player | You are bringing the broom? | |
| Cam | It has never seen a race. | the button |

Names checked: `npm run lore -- find "Speedway"`, `"Carburettors"`; Cam's voice from bible section 2 (almost none; short, flat).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton-dusk` music, `street` ambience, broom `crunch` | the apron at dusk; the broom on concrete is the first sound |
| 8 | `paper` foley | the slip |
| 33 | `clatter` | the broom taken up from the wall |

No stinger: the scene has no reveal.

## 9. Blocking and vehicles

Cam enters from (-159.4, 65.4), sweeps to his mark (-154.6, 66.4), faces the player at (-150.8, 66.4). The broom prop leans at (-156.4, 67.6) while he holds the slip, and is taken up again at the button. No vehicles: the player's ride is theirs, and the objective brings them back to the apron. The player ends where they stand.

## 10. The button

Cam on a medium shot with the broom upright in his fist: "It has never seen a race." It is the last laugh the scene has, and it is a character joke (he is bringing the one thing he owns).

## 11. Self-check

- [x] A want (a pit crew), an obstacle (nobody to ask), a turn (the sincere line), a button (the broom).
- [x] Hook in 3 s on a sound and a movement; no narration.
- [x] Every line under 12 words; nobody says what the picture shows.
- [x] Cam sounds like his bible entry: short, flat, no flourishes.
- [x] Every speaker framed MCU or MS, facing the camera.
- [x] One side of the line.
- [x] Music has one change (none); no stinger.
- [x] Running jokes: the broom (in his hand), Tansy's bench. Plant: the want the envelope answers.
- [x] Dusk (`golden`), lit.
- [x] `npm run cutscene-report` shows OK.
- [x] `direction.notes` points here.
