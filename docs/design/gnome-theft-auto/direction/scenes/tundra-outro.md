# Director's notes: `tundra-outro`

Copy this file to `scenes/<scene-id>.md`, fill every section, then re-direct the scene against it. Rules and numbers:
[bible.md](../bible.md). Worked example: [scenes/mowers-keepers-intro.md](mowers-keepers-intro.md).

| | |
| --- | --- |
| Scene | `tundra-outro` in `src/cutscene/scenes/story/ch3c.ts` |
| Played by | quest `ch3-tundra-drift-run` as its outro (spotters cleared at the Dust Flats Overlook) |
| Kind and length | `chapter-close`, aim 50-75 s (bible section 4) |
| Where, when | stage `dust-safehouse` (east.ts), golden hour, `warm` then `villain` |
| Before / after | the spotters cleared on the ridge / END OF CHAPTER 3; chapter 4 opens on the Desert Airfield plan |

## 1. Purpose in the story

Chapter 3 asked: can the crew survive losing everything? The reunion answers it: Tansy comes out of hiding for Pip,
and the first hug she has ever given anyone is sincere. The chapter closes on the threat: Vesper's Grand Combine
fires with the acorn, and the crew has the Whirligig in sight. The closer ends on the threat, not on a gag (bible 3).

## 2. The player's feeling

- **In:** they just cleared the spotters; they are tired, and they have a debt to a crew they like.
- **Out:** the crew is whole, and the city is in danger from a machine they cannot outdrive. Dread, then a plan.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | get the stone to the crew, and get Pip back in one piece | her own rule about touching people | dry, short, three clauses; works while she talks | she hugs Pip, and she admits it is a plan |
| Pip | show off the arm, and stop running | the fear of the Combine | jokes through it, then points east | he decides: "Then we don't drive." |
| Player | learn the plan | the size of the threat | a flat question | takes the job |

## 4. Subtext

- Tansy's "Don't tell anyone" is the cost of the hug: she has never let anyone close, and she is afraid of it.
- Pip's shiny arm is what he is proud of, and what he is scared he will lose.
- The Combine is Vesper's: his one machine, the acorn in its belly. The city's fate is in it.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | Tansy at the map table turns to the player. "You're late." Pip answers: "We were cracked. Partially." |
| 2 | 6-14 | The arm | Tansy's MCU on Pip's arm: "Pip. Your arm is... shiny." Pip: "Kiln-Resin. Shinier, even." |
| 3 | 14-30 | The hug | Music out. Tansy walks to Pip (the walk is the picture). Side-on locked two-shot; both `hug` for 2.5 s; a held silence. A stunned CU on Pip. Tansy, dry: "Don't tell anyone." |
| 4 | 30-42 | The plan | Music back under `warm`. Tansy lifts the Stopping Stone: "Bracken lent us the Stopping Stone. He wants it back uncracked." The player asks, she answers. |
| 5 | 42-52 | The turn | A machine horn over the dunes; alarm sfx, a short shake. Everyone turns north-west. Cut to the Grand Combine, 2.5 s, no line. `villain` stinger and music. |
| 6 | 52-66 | Back | Tansy: "He's put the acorn in it. We can't outdrive that." Pip points east: "Then we don't drive." Tansy looks east: "Fort Sandpit has a Whirligig." |
| 7 | 66-75 | Button | Pip cheers; cut back to the Grand Combine, closer now, a slow low push-in with its engine under `villain`. `END OF CHAPTER 3`. (Planner review: the fort push-in ended on an empty road; a closer ends on the threat.) |

## 6. Shot list

| # | Shot (size, kind) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `coverage('tansy','player')` single, MCU | 40 | locked | Tansy, then the player | the hook |
| 2 | `shot('pip','ms', side 30)` | 40 | locked | Pip | his line |
| 3 | `coverage('tansy','pip')` singles, MCU | 40 | locked | Tansy, Pip | the arm |
| 4 | `shot('tansy','ms')` walking to Pip | 40 | follows her | Tansy | the walk, the first touch coming |
| 5 | locked cut beside them, `up(...)` look, fov 40 | 40 | locked | Tansy and Pip | the hug, side-on, held through the silence |
| 6 | reaction CU on Pip, 1.1 s | 40 | locked | Pip | stunned |
| 7 | `coverage('tansy','player')` MCU | 40 | locked | Tansy | the plan |
| 8 | cut to the Grand Combine, fov 56 | 56 | locked | the Combine | the threat, the picture first |
| 9 | `shot('pip','ms', side 30)` | 40 | locked | Pip | "Then we don't drive." |
| 10 | low `dolly` on the Combine, fov 54, 6 s | 54 | slow push-in | the Grand Combine | the button: the threat |

Side of the line: the Tansy/Pip singles and the Tansy/player singles are each one side of their own line. Lines
go between the two pairs without a crossing, because the player stands on the far side of Tansy from Pip.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | You're late. | the hook; dry |
| Pip | We were cracked. Partially. | the joke that undercuts a sincere arrival |
| Tansy | Pip. Your arm is... shiny. | the reaction, then the first touch |
| Pip | Kiln-Resin. Shinier, even. | his pride; the coping joke comes after the cure |
| Tansy | Don't tell anyone. | after the hug; dry again |
| Tansy | Bracken lent us the Stopping Stone. He wants it back uncracked. | the plan, the obstacle |
| Player | What's it for? | the straight man |
| Tansy | Jamming things that shouldn't run. | the one-line answer |
| Tansy | He's put the acorn in it. We can't outdrive that. | the threat, in her voice |
| Pip | Then we don't drive. | the decision |
| Tansy | Fort Sandpit has a Whirligig. | the button line; the plan |

Cut: the three narrator lines ("She hugs him, carefully..." is shown, not said), Burt's phone call (an errand in a
closer), "Got the Stopping Stone off Bracken's tablet" (the tablet is in tablet-outro; the lend is the new fact),
"Fort Sandpit's walls glow gold across the dunes." (the picture says it).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | music `warm`, ambience `wind` | the reunion's warmth |
| 6-14 | none | the arm line lands in its own space |
| 14 | music null, 0.6 s fade | silence for the hug (sincere beat, law 5) |
| 22-24 | `silence` held 2 s | one held silence, after the hug |
| 30 | music `warm` back, 1.5 s | the plan, comes in soft |
| 42 | sfx `alarm` gain 0.3, shake 0.05 for 1.5 s | the horn rolls over the dunes |
| 46 | stinger `villain`, music `villain` | Vesper's machine; one stinger, once (bible: `villain` is his) |
| 66-75 | `villain` under the dolly, title card | the chapter's threat is the last image |

## 9. Blocking and vehicles

- Tansy starts at the map table holding the stone, faces the player when she hears them, then puts the stone down
  and walks to 0.45 m in front of Pip, facing him. Pip stands at his mark and faces her.
- The hug is side-on, from a locked camera to the right of them, eye level, look point 1.2 m over the middle of the two.
- The player walks to (275, 42) during the Combine cut, ending on foot near the overlook.
- The Whirligig (`carMark('dust-safehouse','safehouse-whirligig')`) stays parked; it is in the background of the
  plan shots, not in any face's line of sight.
- The Grand Combine is a hidden prop at (0, -200), spawned for its cut only.

## 10. The button

The Grand Combine, closer than the first time we saw it, the camera creeping in under the `villain` theme and its
engine, with END OF CHAPTER 3 on top. The plan (the Whirligig) is said; the last image is what the plan is up against.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; it is not a briefing.
- [x] The hook lands in 3 s (Tansy turns; "You're late.").
- [x] Every line is under 16 words; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Each character sounds like their bible entry (Tansy dry and short; Pip two clauses, undoing himself).
- [x] Every speaker is framed MS or closer, facing the camera, for their line; reactions follow the big lines.
- [x] One side of the line per conversation; the two pairs sit on different sides of the crew.
- [x] Music has a reason at each change; one stinger (`villain`), one held silence (2 s), no reveal stinger.
- [x] Running jokes: the hat ladder is not used here; "Then we don't drive." is Pip's, said once; the Whirligig is named.
- [x] No narration: the closer's threat is shown, not said.
- [x] `npm run cutscene-report` shows the scene OK (0 faults; `[baseline]` stays until the planner removes it).
- [x] The line-of-sight test passes for the scene (`scenes.test.ts -t tundra`).
- [x] Watched at 960x600 (the hug two-shot, the Combine cut, the title). Phone-size watch not repeated after the last
      fixes; see the Report back section.
- [x] `direction.notes` in the scene points at this file.
