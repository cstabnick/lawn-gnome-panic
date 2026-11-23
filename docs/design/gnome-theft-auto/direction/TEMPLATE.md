# Director's notes: `<scene-id>`

Copy this file to `scenes/<scene-id>.md`, fill every section, then re-direct the scene against it. Rules and numbers:
[bible.md](bible.md). Worked example: [scenes/mowers-keepers-intro.md](scenes/mowers-keepers-intro.md).

| | |
| --- | --- |
| Scene | `<scene-id>` in `src/cutscene/scenes/<file>.ts` |
| Played by | quest `<quest-id>` as its intro / outro / arrival (visit objective, beat) |
| Kind and length | `<intro|outro|arrival|chapter-open|chapter-close|race-intro|race-podium>`, aim `<n-m>` s (bible section 4) |
| Where, when | stage `<stage-id>` (environments.md), time of day, `sky` |
| Before / after | the scene the player saw last / the gameplay or scene that follows |

## 1. Purpose in the story

One or two sentences: what this scene changes. Which chapter question it serves (bible section 3), which setup it plants
or which payoff it delivers (running-joke ladders, setups to plant).

## 2. The player's feeling

- **In:** how the player arrives (just won a fight, just driven ten minutes, first time here).
- **Out:** what they should feel and know when it fades (the job, the stake, the laugh, the dread).

## 3. Characters: objective, obstacle, tactic

One row per speaking character. Objective = what they want from the other people in this scene (a verb). Obstacle = who
or what is in the way. Tactic = how they play it (charm, bully, deflect, plead, joke).

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| | | | | |

## 4. Subtext

What is not said. Which fears and secrets (bible section 2) are under the lines. One line each.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length). Hook by 3 s, turn at about 60%, button in the last
3 s.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | |
| 2 | | Setup | |
| 3 | | Turn | |
| 4 | | Button | |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |

Which side of the line each conversation is shot from (`coverage(a, b, side)`), and any deliberate crossing.

## 7. Dialogue pass

The lines as they will be, each under 16 words (aim 12), each with who says it and why. Mark cut lines with ~~strike~~
and say why (said elsewhere, describes the picture, waypoint read-out, repeats a running joke without escalating it).
Check names and facts: `npm run lore -- find <word>`.

| Who | Line | Note |
| --- | --- | --- |
| | | |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| | ambience / music / stinger / sfx / silence | |

## 9. Blocking and vehicles

Where each actor starts, moves and ends (marks or coordinates), who faces whom when, what each vehicle does, where the
player actor must end (the quest's exit for an intro; the scene's end spot otherwise).

## 10. The button

The last image and the last sound, in one sentence. Why it is the right last moment.

## 11. Self-check

- [ ] The scene has a want, an obstacle and a turn; it is not a briefing.
- [ ] The hook lands in 3 s; the first thing is not narration.
- [ ] Every line is under 16 words; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [ ] Each character sounds like their bible entry (rhythm, tics); the player's lines are short.
- [ ] Every speaker is framed MS or closer, facing the camera, for their line; reactions follow the big lines.
- [ ] One side of the line per conversation; crossings are motivated and waived.
- [ ] Music has a reason at each change; at most two stingers; one held silence at most.
- [ ] Running jokes climb a rung; setups this scene owes are planted.
- [ ] Night scenes are lit (`sky`, practical lights).
- [ ] `npm run cutscene-report -w games/gnome-theft-auto` shows the scene OK (or only waived faults, each with a reason),
      and its id is gone from `src/cutscene/pacing.baseline.ts`.
- [ ] `npm test -w games/gnome-theft-auto` passes (line of sight included); the scene was watched at
      `?no-intro&cutscene=<id>` on a desktop and a phone-sized window.
- [ ] `direction.notes` in the scene points at this file.
