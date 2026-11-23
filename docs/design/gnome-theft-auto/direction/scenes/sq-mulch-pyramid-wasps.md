# Director's notes: `sq-mulch-pyramid-wasps`

| | |
| --- | --- |
| Scene | `sq-mulch-pyramid-wasps` in `src/cutscene/scenes/side/mulchPyramid.ts` |
| Played by | quest `sq-mulch-pyramid` as its arrival at the patio gate (visit objective, the beat at the gate) |
| Kind and length | `arrival`, aim 10-35 s; now 23.6 s at Normal text speed (was 21.3 s, 6 faults) |
| Where, when | stage `patio-gate` (Patio Heights), dawn held at `sky: 'golden'`; the rig is the player's spreader |
| Before / after | before: the drive up to the gate with the spreader. After: the rig leaves through the gap (the horn), then the quest goes on |

## 1. Purpose in the story

The beat of the scheme going wrong: the wasps that Cedric promised ("NOW WITH 40% MORE WASPS") swarm the spreader at the
gate, and the gate guard (Gary) shuts the rig out. It gives the player a reason to leave fast, and it pays off the
wasps line from the intro.

## 2. The player's feeling

- **In:** tired, a bit proud of the rig, already regretting the job.
- **Out:** in a hurry. The rig has to move now, and there are wasps in the seat.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Gate-Guard Gary | to keep unlicensed rigs off the Patio Heights drive | a glitter-purple rig with wasps | bureaucratic: colours, approved lists, "Dispatch, you will want a net." | from a binder to an alarm |
| The player | to get the rig out of the gate | the wasps and Gary | flat: one observation, then an order | leaves at speed |

## 4. Subtext

- Gary's list is his whole life: a glitter-purple rig is a crime he can name. He does not understand the wasps; he
  reports them.
- The player's line about glitter in the ears is the sincere discomfort under the gag: the job is already costing them.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | a locked wide of the rig from the gate side, three wasps spawn and circle (parallel tracks, about 2.7 s) |
| 2 | 3-6 | Setup | the player climbs out of the rig; "Glitter. It is in the wheels, the seat, and I think my ears." |
| 3 | 6-11 | Gary wakes | a wide of Gary walking to the gap, the alarm sfx, two seconds of the walk |
| 4 | 11-17 | The turn | Gary's "Unlicensed mulch rig. Glitter-purple is not on the approved list." (medium, low), the shake, then "Wasps in attendance. Dispatch, you will want a net." (close, low, `comic` stinger) |
| 5 | 17-21 | Reaction | the `danger` stinger; the player: "We need to move the rig. Now." |
| 6 | 21-24 | Button | the rig's horn; Gary's flinch as a wasp lands on his hat |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` wide from above (152, -134, 3.5), `fov 46` | 46 | locked | the rig | the hook: the swarm, with the rig in full |
| 2 | `exit` the player, 1.5 s, then `shot('you','ms',{toward:'gary',side:-30})` | 40 | locked | the player | the line, framed on foot (see the note below) |
| 3 | wide `cut` above (152, -118, 1.6) on Gary, `fov 36`, Gary walks, 2 s hold | 36 | locked | Gary | establishing his walk to the gap |
| 4 | `GATE_TALK.single('gary','mcu',{height:'low'})` | 40 | locked | Gary | the enforcement, from low |
| 5 | `GATE_TALK.single('gary','cu',{height:'low'})` | 40 | locked | Gary | the wasps line, closer for the punch |
| 6 | `GATE_TALK.single('you','mcu')`-equivalent `shot('you','ms',{toward:'gary',side:-30})` | 40 | locked | the player | the order |
| 7 | `shot('gary','ms',{toward:'you',side:60,height:'low'})` | 40 | locked | Gary | the button: a flinch from the street side |

Side of the line: `coverage('gary','you',1)` (`GATE_TALK`) for the singles, so the camera stays on one side; the player's
ms uses `side: -30` to match the opposite sign of the same coverage.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| You | Glitter. It is in the wheels, the seat, and I think my ears. | the straight man's complaint; 14 words |
| Gary | Unlicensed mulch rig. Glitter-purple is not on the approved list. | the enforcer's list (bible: numbers, "approved") |
| Gary | Wasps in attendance. Dispatch, you will want a net. | the one `comic` stinger, on the wasps |
| You | We need to move the rig. Now. | the order: the button's setup |
| ~~Gary~~ | ~~Hat Watch, come in.~~ | cut: the radio call is a second voice with no actor; one fewer line keeps the gate clear |

Names checked: `npm run lore -- find "patio heights"`, `find cedric` (the Mulch-Spreader is Cedric's rig: cast-rides).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `tension` music, `street` ambience, `sky: 'golden'` | the dawn gate is tense before the swarm |
| 0.0-2.7 | wasps spawned in three tracks | the hook |
| 6-9 | `alarm` sfx at Gary | the guard sees the rig |
| 11 | `shake` 0.12 for 1.2 s | Gary's enforcement lands |
| 12 | `comic` stinger on the wasps line | the one physical gag |
| 16 | `danger` stinger | the turn |

## 9. Blocking and vehicles

- The rig is parked on its spot at (146, -141); the wasps spawn at their own marks and fly round it.
- The player starts in the rig, climbs out (`exit`) before the first line and stands beside it. The rig is the player's
  (`from: 'player'`), so the horn is the player's to sound.
- Gary starts at his mark, walks GARY_PACE to the gap, points at the rig, and flinches at the end.
- Lighting: the golden sky frames Gary against the sky where the trees allow; his navy coat reads on the orange horizon.

## 10. The button

Gary's flinch as the rig's horn sounds and a wasp lands on his hat: the last image is the enforcer losing his composure
to a gag. It is right because it is the only physical gag in the scene and it lands after the player's order.

## 11. Self-check

- [x] Want, obstacle, turn (Gary's list against the swarm); not a briefing.
- [x] Hook in 3 s (the wasps spawn in the first second).
- [x] Every line under 16 words (longest 13); nothing describes the picture.
- [x] Gary and the player each sound like their bible entry (Gary: a list; the player: flat questions).
- [x] Every speaker framed medium or closer, facing the camera (exchangeLooks between Gary and the player first).
- [x] One side of the line (`coverage('gary','you',1)`).
- [x] Music has a reason at each change; two stingers (`comic` and `danger`), each on a beat; no held silence.
- [x] The wasps line from the intro is paid off here.
- [x] Dawn held at golden; the gate is lit by the sky, not shot into a shadow.
- [x] `npm run cutscene-report` shows the scene OK (0 faults; was 6); the id is still in `pacing.baseline.ts` until the planner removes it.
- [x] `npx vitest run ... -t "sq-mulch-pyramid"` passes (line of sight).
- [x] Watched at 960x600 and 390x844; fixes made (the seated player was hidden by the rig body, so the player climbs out
      first; the wasps were too small to read, so they are 0.7 scale; the wide moved closer so the swarm is in shot).
- [x] `direction.notes` points here.

**Known limit:** the wasps are small props at arrival distance; at a phone width they read as a few specks, not a
swarm. Accepted: the gag lands on Gary's reaction, not on the bees.
