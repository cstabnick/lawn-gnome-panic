# Director's notes: `dew-run-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=dew-run-intro`.

| | |
| --- | --- |
| Scene | `dew-run-intro` in `src/cutscene/scenes/story/ch2.ts` |
| Played by | quest `ch2-dew-run` ("Black Dew & Greenbacks") as its cutscene, the chapter 2 opener, with the `chapter` title card |
| Kind and length | `chapter-open`, aim 45-80 s; now 55.5 s at Normal text speed (was 40.1 s, 8 faults) |
| Where, when | stages `granny-barn` (the arrival spot, the porch) and the south highway (the `dew-approach` path); the stage's own golden-hour light, so no `sky` override |
| Before / after | before: the chapter 1 payoff (the player has the Kiln-Debt still owing, the Ride-On is theirs for the run). After: the player is free in Cloverfield with the job; the Combine blockade and the Dew-Hauler run follow, then `dew-run-outro` |

## 1. Purpose in the story

Chapter 2 asks whether the player will take Vesper's deal. This opener puts the stakes in a picture: the Black Dew convoy
leaves the farm with Granny's Dew, the one thing Cloverfield has, and the player is the one Granny sends to stop it. The
turn is Granny's own: a Dew-Well coughs dry, and she answers the sound with the job. Plants: Pip's "I can drive that!"
(a want, and the first time he asks to be useful in the Combine's own cab, which the blockade in the quest uses);
Granny's "load-bearing" pumpkins (the button, and the chapter's first laugh that is not a threat).

Chapter tension starts at 4. The title card and the first picture carry the chapter; the briefing is the warm part.

## 2. The player's feeling

- **In:** the Ride-On is loud and the highway is empty, then a convoy roars past the other way with its horn going.
- **Out:** clear on the job (borrow the Combine, block the South Highway by Fence-Post Frank's sign, bring the Dew-Hauler
  to the barn), a little uneasy that the Dew is leaving, and amused by the pumpkins.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny Gnertrude | to have her Dew-Wells kept and her crew sent out | the drained wells; her own age (she does not get up) | a recipe's rhythm, one instruction at a time; answers a sound with a plan | the job is given; the pumpkins are the last word |
| The player | to know what the Dew is worth and why it is theirs to fix | Granny's indirection | one short question, twice | takes the job (the nod is implied by walking in) |
| Pip | to be given the Combine | Granny's pace; the plan not yet made | pitch, volume, "Please?" | not answered on screen; he still wants the wheel |
| Farmer Bramble | (background) to keep his combine running | none in this scene | leans on the combine; his tease is in the outro | (none here) |

## 4. Subtext

- Granny is frightened of foreclosure (bible: her fear); the dry well is the sound of it. She does not say so: she says
  "dry as a biscuit" and gets on with the plan.
- The player's "What's it worth?" is the straight man's question about the Dew: it is worth the farm to her and a
  mob's profit to Vesper.
- Pip's "I love this place already!" is a boy who has found a town that does not mind him. Never said as such.

## 5. Beat sheet

Timings from the checker's TIMELINE at Normal text speed.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | Track on the convoy at road level: the HOA van and the orange tanker, northbound in the other lane, come past the camera. The Ride-On comes south through them. The tanker's horn at 1.2 s. |
| 2 | 3.0-5.5 | Title | `chapter` stinger; "CHAPTER 2 — BLACK DEW & GREENBACKS" over the road. The question is already on screen (the Dew is leaving). |
| 3 | 5.5-15.4 | Setup (the place) | Follow shot behind the Ride-On down the highway into Cloverfield. The one narrator line, over the road: "Cloverfield Farms. Forty acres of gold..." |
| 4 | 15.4-20.2 | Arrival | Wide of the gate (`arrival` spot): the Ride-On pulls up, the player and Pip climb out and turn to Granny (`face`). `warm` music in at 2 s. |
| 5 | 20.2-31.0 | Briefing, first half | Granny: the wells are drained. Player: "What's it worth?" Granny: "Pure 87-octane, 100% unlicensed." Pip: "Unlicensed! I love this place already!" |
| 6 | 31.0-35.1 | Turn | A Dew-Well coughs dry (`thud`), one beat of silence; Granny: "Dry as a biscuit. So here's the plan." Then the Combine and the blockade, on her close-up. |
| 7 | 38.8-44.3 | Pip's pitch | Pip: "A Buck-Iron Combine? I can drive that! Please?" Granny: the Combine parked by Fence-Post Frank's sign. Player: "Why me?" |
| 8 | 46.0-54.3 | Button | Granny answers with the hauler and the barn; the pumpkins; "They're load-bearing, sugar." on her close-up; Pip flinches; held pause. |

Turn at 31 s of 55 s (56%): the dry well. Button in the last 3 s: Pip's flinch on the pumpkin gag.

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` the convoy (`up(9, 214, 1.6)`) | 50, road level | fixed, turns to the van | the HOA van and the tanker | the question in a picture, from the verge |
| 2 | `follow` the Ride-On (default offset, behind) | default | moves with the car | the Ride-On into the farm | the road carries us to the place |
| 3 | `spot(YARD, 'arrival')` | 46 | locked | the gate | the arrival, held short enough to stay under the wide limit |
| 4 | `frame` Granny MCU, facing the player | 35 | locked | Granny | her line; the player on the far side of the line |
| 5 | `frame` the player MCU (`BRIEF.single('player')`) | 35 | locked | the player | the straight man's question |
| 6 | `frame` Granny MCU, then CU for the Combine line | 35 / 30 | locked | Granny | the new angle breaks the long hold on her |
| 7 | `frame` Pip MCU (`BRIEF_PIP.single('pip')`) | 35 | locked | Pip | his pitch, on the player's side of the line |
| 8 | `frame` player MCU | 35 | locked | the player | "Why me?" |
| 9 | `frame` Granny MCU, then CU | 35 / 30 | locked | Granny | the job and the button |

Sides: Granny and the player on `coverage('granny', 'player', 1)`; Pip on `coverage('granny', 'pip', 1)`, the same side
(both stand east of Granny at the gate). No crossings. The player and Pip are turned to Granny with `face` after the exits,
so each single shows a front, not a back.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~A Black Dew convoy rumbles up the highway behind them. Nobody waves.~~ | cut: the picture shows it (the convoy passes in shot 1) |
| Narrator | Cloverfield Farms. Forty acres of gold, and every one of them is for sale. | kept, the one narrator line; not the first line (the horn and the convoy come first) |
| Granny | Vesper's boys are draining my Dew-Wells dry. | 8 words; the question's first half |
| Player | What's it worth? | the straight man; a question |
| Granny | Pure 87-octane, 100% unlicensed. Just how I like it. | 9 words; the answer to the player, and her voice |
| Pip | Unlicensed! I love this place already! | a want (to belong here) under the delight |
| Granny | Dry as a biscuit. So here's the plan. | the turn: she answers the dry-well sound with the plan |
| Granny | Borrow a Buck-Iron Combine and block the South Highway. | 11 words; the first half of the objective |
| Pip | A Buck-Iron Combine? I can drive that! Please? | the interruption; Pip's want |
| Granny | Park it by Fence-Post Frank's sign. | the second half, with a `point` gesture |
| Player | Why me? | the straight man's second question |
| Granny | You've got the Dew-Hauler. Bring it to my barn. | answers "why me" with the job; 10 words |
| Granny | Try not to splatter my prize pumpkins. | 7 words |
| Granny | They're load-bearing, sugar. | the button line on her close-up; "sugar" once in the scene |
| ~~Granny~~ | ~~Vesper's boys are draining my Dew-Wells dry. Pure 87-octane...~~ | split into the two lines above, each under 16 words |

Names checked: `docs/lore/entries/apocrypha/` (`cloverfield-dew-wells`, `buck-iron`, `fence-post-frank`, `black-dew-brand`,
`highway-south`, `granny-gnertrudes-farmhouse`).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `turfton` (the scene's music), `wind` ambience | the crew's road music from the first frame; the convoy's rumble is the hook |
| 0.0 | the convoy and the Ride-On drive (engine sound) | a sound hit by 3 s |
| 1.2 | `horn` on the tanker | the picture's sound: the Dew is leaving |
| 3.0 | `chapter` stinger and the title card | the only stinger in the scene |
| 15.4 | `warm` in, fade 2 | Granny's farm; the bed changes with the place |
| 31.0 | `thud` sfx (the Dew-Well coughs dry), then a 1.2 s pause | the turn is a sound, not a line |

## 9. Blocking and vehicles

- The convoy's HOA van starts at (2.5, 236) and the orange tanker at (2.5, 262), both facing north (away from the farm),
  driving to (2.5, 120) in the other lane. The Ride-On starts at (-2.5, 196), facing south, on the approach path
  (`dew-approach`) to Granny's pull-up at (-25, 330).
- Granny stays on her mark (-64, 334), facing east, in the porch chair; `sit` at the start.
- The player and Pip stay in the Ride-On until it stops; they exit, then face Granny (`face` to granny). The player's
  end spot is (-20, 326): the player walks there (async) after "Why me?", while Granny's last three lines play.
- Bramble stays at his mark (-48, 352), leaning on his combine; he has no line here.
- The Ride-On is the player's own vehicle (`from: 'player'`), not a kept vehicle; it is left at the gate.

## 10. The button

Granny's close-up, "They're load-bearing, sugar.", then Pip's flinch and a held pause on him. It is the right last moment
because the sincere part is over (the dry well is the only sad beat) and the joke is a physical one: the cut to Pip is
his reaction, and the audience is in on the pumpkins.

## 11. Self-check

- [x] Want, obstacle, turn: Granny's drained wells; the player's questions; the dry well, answered with the job.
- [x] Hook in 3 s: the convoy and the horn (no narration first).
- [x] Every line under 16 words (longest 11); the picture is not described; one narrator line; no coordinates or road
      readouts (the one place name, Fence-Post Frank's sign, is part of the objective).
- [x] Voices: Granny warm and homely, "sugar" once; the player's short questions; Pip's delight and "Please?".
- [x] Every speaker MCU or closer, facing the camera; a CU on Granny for the button line.
- [x] One side of the line per conversation (`coverage` granny/player, granny/pip, same side).
- [x] Music changes with reasons; one stinger; no held silence beyond the 1.2 s pause.
- [x] Setups: the convoy is the chapter's question; Pip's want for the Combine; Granny's pumpkins for the button.
- [x] Golden-hour stage; no night scene.
- [x] Checker: 55.5 s, all shots pass, no faults (`scenecheck.dev.test.ts`).
- [x] `direction.notes` points here.

## Review pass (planner)

Watched at 960x600. Granny's singles are taken from a high angle: at eye level her rocking chair's arm crossed her face. The opening track now sits south of the convoy (z 186) on the tanker, so the chapter card plays over the farm road, not over downtown.
