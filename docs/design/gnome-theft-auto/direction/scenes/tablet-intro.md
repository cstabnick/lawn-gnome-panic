# Director's notes: `tablet-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=tablet-intro`.

| | |
| --- | --- |
| Scene | `tablet-intro` in `src/cutscene/scenes/story/ch2d.ts` |
| Played by | quest `ch2-unmowed-tablet` ("The Cracked Tablet") as its intro, given at the Unmowed Hollow |
| Kind and length | `intro`, aim 30-60 s; now 36 s at Normal text speed, no faults (E20 row 23 rewrite) |
| Where, when | stage `unmowed-hollow` only (dusk, `sky: 'golden'`, the standing-stone ring) with the insert; Sorrel stands in the hollow from the first frame (she brought Pip and the player west in row 22) |
| Before / after | before: the player was sent up the west highway by the radio bulletin. After: the drive back to Turfton for the Compost Heap welders (the chapter 2 crack objective) |

## 1. Purpose in the story

Chapter 2 asks whether the player will take Vesper's deal. This scene shows the other road: the old Fescue ways, and
the proof that Vesper's Grand Combine is a copy of something three thousand years old. It plants the Stopping Stone's
shape on the tablet (the finale rhymes with it), and it makes Pip the family embarrassment in front of the one
gnome who knows the Fescue name best (Bracken, calling Pip a Potsworth and naming cousin Wendel as regent). Bracken's
accusation is the first time Pip goes quiet.

The old scene was a briefing: a wide held for 11.7 s under narration, three lines of Bracken with his back to the
camera, a narrator stage direction, and a dead dolly that was replaced before anyone saw it.

## 2. The player's feeling

- **In:** tired of the highway, curious about the Mossy Wood Unmowed (a hidden place with a fire and a lot of judgement).
- **Out:** the job (clear the welders at the Compost Heap and bring their rig here), the stone's shape in their head, and
  a dry laugh from Sorrel on the way out. A small dread: the Combine is a copy of something old.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bracken | to shame the Potsworth out of Mossy Wood, and keep the Unmowed hidden | Pip's cheer, and Sorrel's wish for the job to be done | accusation as statement, a still staff, looking down | sends the player on the errand, unchanged |
| Pip | to be useful and loud | Bracken's history (cousin Wendel) | none: he takes it | slumps, says nothing (the first time he goes quiet) |
| Sorrel | to keep the broadcast and the peace | Bracken's temper; her schedule | calm measured warmth, a dry aside | stands in, shows the tablet, gives the job's deadline |
| The player | (not in frame: the audience's seat) | | | takes the job |

## 4. Subtext

- Bracken is not angry at Pip; he is afraid of the same thing Pip is (the Mower, the old soil going). He never says it.
- Sorrel refuses the word "mower". She says "the one in the Shed": her line is a boundary, not a joke.
- Pip's silence is the arc (bible, chapter 2): the first time he has nothing to say.
- The tablet and the Stopping Stone show the same shape on purpose: the finale's key.

## 5. Beat sheet

Timings at Normal text speed (from the checker, 36.2 s total).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3.9 | Hook | Bracken rises on a low MCU facing the camera, staff in hand: "A Potsworth in Mossy Wood, reeking of Black Dew!" |
| 2 | 3.9-5.1 | Reaction | Pip, MCU: he slumps. Silence (the `pause` beat). |
| 3 | 5.1-11.3 | Setup (the accusation) | Bracken, low MCU: "Your cousin Wendel is regent of Fescue." Then "You traded the old soil for Stink-Gro and engines." |
| 4 | 11.3-12.5 | Turn | Sorrel, already in the hollow, steps between them: a cut to her MCU. |
| 5 | 12.5-17.5 | Turn (Sorrel) | Sorrel MCU: "Steady, Elder. Show them the tablet." The insert: the tablet and the Stopping Stone beside it, a slow dolly in (2.6 s). |
| 6 | 17.5-31.7 | Want and obstacle | Sorrel: the copy of Fescue's original, "the one in the Shed, three thousand years old." Bracken, MS low: only a Fescue Stopping Stone can jam it; clear the welders at the Compost Heap, bring the rig here. |
| 7 | 31.7-36.0 | Button | Sorrel, close: "Go carefully. It is heavier than it looks." (the plates and the tablet; no gag) |

The turn is at about 60% (the tablet insert, 11-17 s, is the scene's picture-turn; Sorrel's arrival). The button is the
dry schedule line in the last 5 s on her CU.

## 6. Shot list

| # | Shot (size, `frame`/`cut`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `BP.single('bracken','mcu',{height:'low'})` | 35, low | locked | Bracken | the accusation is shot from below: he stands higher than the others |
| 2 | `BP.single('pip','mcu')` | 35, eye | locked | Pip | reaction: the slump |
| 3 | `BP.single('bracken','mcu',{height:'low'})` | 35, low | locked | Bracken | the two Wendel lines, one shot |
| 5 | `BS.single('sorrel','mcu')` | 35 | locked | Sorrel | she steps in and speaks: the eyeline to Bracken |
| 6 | `dolly` on the tablet and the stone, from (-348.5, 30.5, 2.2) | 42 | slow in, 2.6 s | the insert | the shape is shown before it is explained |
| 7 | `BS.single('sorrel','mcu')` | 35 | locked | Sorrel | the copy and the three thousand years |
| 8 | `BS.single('bracken','ms',{height:'low'})` | 40, low | locked | Bracken | the jam; `ms` because the two lines run 7.3 s |
| 9 | `BS.single('sorrel','cu')` | 30 | locked | Sorrel | the button, a dry aside on her close shot |

Sides of the line: Bracken and Pip on `coverage('bracken','pip', 1)`; Bracken and Sorrel on `coverage('bracken','sorrel', 1)`.
No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Bracken | A Potsworth in Mossy Wood, reeking of Black Dew! | kept: the hook line, on a low MCU facing the camera |
| Pip | (nothing) | `slump`: the first time he goes quiet |
| Bracken | Your cousin Wendel is regent of Fescue. | split from the old 17-word line |
| Bracken | You traded the old soil for Stink-Gro and engines. | split from the old 17-word line |
| ~~Narrator~~ | ~~Sorrel Tillbrook, mid-broadcast, pulls off her headphones.~~ | cut: described the picture. She is in the hollow from the first frame |
| Sorrel | Steady, Elder. Show them the tablet. | kept |
| Sorrel | Vesper's Grand Combine is copied from Fescue's original. | split from the old 17-word line (9 words) |
| Sorrel | The one in the Shed, three thousand years old. | Sorrel never says "mower" |
| Bracken | Only a Fescue Stopping Stone can jam it. | kept |
| Bracken | Clear his welders at the Compost Heap. Bring their rig here. | split from the old 19-word line; one place name |
| Sorrel | Go carefully. It is heavier than it looks. | the button, gentle, no gag (the old rain-on-terracotta aside is cut: the rain was played in row 22) |
| Bracken | (intro card) | Bracken's first story appearance: the card after his first line, 2.8 s (L105); Sorrel's card is in `m22-off-air-intro` |

Names checked: `npm run lore -- find "Stopping Stone"` (the Fescue relic, R-071 and the finale), `Grand Combine`
(Vesper's machine), `Shed` (the Fescue original; Sorrel's euphemism). The Compost Heap welders are the chapter 2 crack
objective (`quests/chapter2.ts`).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `forest` ambience, `fescue` music | Mossy Wood's folk; the first line is a hook, not narration |
| 3.9 | the `intro` stinger on Bracken's card | L105: first story appearance |

No stingers: the scene is a briefing with a turn, not a reveal. The tablet insert (14.9 s, a slow dolly with a 2.6 s
wait) runs with no line under it.

## 9. Blocking and vehicles

- Bracken at his ring mark (-364, 40), facing the fire (-352, 36); `held: null` so the Stopping Stone lies by the
  tablet, not in his hand. Camera for his accusation is on Pip's side of their line, low.
- Pip at (-341, 41), facing Bracken. Slumps in place.
- Sorrel: at the hollow mark (-346, 44) from the first frame, facing Bracken (no booth, no teleport).
- Tablet (`stone-plaque`) at (-355, 39), Stopping Stone (`stopping-stone`, size 0.6) at (-352.6, 38.2), both hidden
  until the insert.
- The player is hidden at (-344, 38): the scene does not show them (the quest's exit is (-345, 34) as before).
- No vehicles.

## 10. The button

Sorrel's gentle line on her close shot: "Go carefully. It is heavier than it looks." It is the right last moment because
the quest is sincere (tension 8) and the line is a character's care, not a gag; it also sets up the heavy outro.

## 11. Self-check

- [x] The scene has a want (Bracken's shame, Sorrel's peace), an obstacle and a turn (Sorrel steps in, the tablet);
      it is not a briefing.
- [x] The hook lands in 0 s on a character (Bracken rising, accusing); no narration.
- [x] Every line under 16 words (longest 11: "After this..." and "Clear his welders..."); no coordinates;
      no waypoint read-out (the HUD shows the Compost Heap).
- [x] Voices: Bracken archaic and low (hz 76), Sorrel calm (hz 122), Pip silent.
- [x] Every speaker MS or closer and facing the camera (the `frame` shots); the slump reaction after the hook.
- [x] One side of each line: Bracken and Pip; Bracken and Sorrel.
- [x] Music: `fescue` once; no stingers; no silence (the scene is talk plus one reaction).
- [x] Running jokes: none planted or paid here (Pip's "Okay, hear me out" stays out).
- [x] Day/dusk scene: the hollow is `dusk` on its stage; `sky` not needed (the stage's own time).
- [x] `npm run cutscene-report` and the baseline: the planner removes the id.
- [x] `direction.notes` points here.
