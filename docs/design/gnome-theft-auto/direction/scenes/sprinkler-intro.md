# Director's notes: `sprinkler-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=sprinkler-intro`.

| | |
| --- | --- |
| Scene | `sprinkler-intro` in `src/cutscene/scenes/story/ch2c.ts` |
| Played by | quest `ch2-sprinkler-gauntlet` as its intro (the cutscene before the gauntlet, from the cloverfield barn giver) |
| Kind and length | `intro`, aim 30-60 s, fault above 75; now 29.2 s (was 32.5 s, 7 faults). A touch under the aim on purpose: the gag, the prophecy and the van take the time they need |
| Where, when | stage `granny-barn` (the yard and porch) with the windmill of `rooster-windmill` behind Rooster; day (stage `cloverfield`), no `sky` override |
| Before / after | before: the player's run-up to the gauntlet, the Dew run done. After: the gauntlet's sprinkler drive to the south barn drop (`sprinkler-outro` is its outro) |

## 1. Purpose in the story

Set the gauntlet: the silo is under foreclosure, Reginald Vance's squad is taking it, and the way out runs through
oscillating sprinklers. Rooster's prophecy is the hook and it comes true on screen, so the gauntlet's danger reads
as real before the player drives into it. Plants: the acorn silo (the outro's delivery and the later silo haul); Pip's
horror of thermal shock on kiln glaze (his character, a joke for the gauntlet's ticking sprinklers); Rooster's
"THEY ALWAYS KNOW" (a running joke: the sprinklers are right, and they keep being right).

## 2. The player's feeling

- **In:** just cleared the Dew run; wants a rest and a new job.
- **Out:** a little dread (the sprinklers know), a laugh (Pip, and Rooster's certainty), and a clear job: get the silo
  to the drop, keep the sprinklers off the pumpkins.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Rooster Weatherby | to be believed | everyone ignores the windmill | shout, all caps, hands up | proved right by the van and the hiss |
| Granny Gnertrude | to keep the silo; to send the player on | the foreclosure; Vance's squad | homely metaphor, a plan | hands the player the job |
| Pip Potsworth | to stop the tow | the physics of glaze | panic, run-on, exclamations | still panicking; now on the hook |
| Surveyors Peel and Tine (background) | to walk the van up the road | none | walk beside the van | the van arrives |
| The player | (not heard) | | | sees the squad coming |

## 4. Subtext

- Granny is not afraid of Vance; she is afraid of losing the one thing her late husband built the silo to hold (not
  said; the foreclosure line carries it as a plain fact).
- Rooster is not mad. He is the only character who has been right about the weather, and the sprinklers are the proof
  he keeps repeating.
- Pip's kiln-glaze panic is a cover for how much he wants to help.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length). Hook by 3 s, turn at about 60%, button in the
last 3 s.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-5.7 | Hook | Rooster, low and close, hands up, the windmill behind him; "THE BAROMETER IS DROPPING!" then "THE SPRINKLERS KNOW!" |
| 2 | 5.7-11.7 | Setup | Granny, MCU, the foreclosure in one line |
| 3 | 11.7-17.2 | Setup | Pip, MCU, the glaze panic |
| 4 | 17.2-25.2 | Turn | A sprinkler hisses on (`squirt`) as the Reginald van crawls up the farm road on a `track`, the surveyors walking beside it |
| 5 | 25.2-29.2 | Button | Granny, MCU: "Then drive fast, sugar. Keep the sprinklers off my pumpkins." |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('rooster','mcu',{height:'low'})` | 35 | locked | Rooster, windmill behind | the hook: a prophet looking up at him |
| 2 | `shot('granny','mcu')` | 35 | locked | Granny on the porch | she sits on the stakes |
| 3 | `shot('pip','mcu')` | 35 | locked | Pip | the panic |
| 4 | `track` on `reg-van` | 50 | pans with the van | the van and the surveyors | the prophecy comes true, in motion |
| 5 | `shot('granny','mcu')` | 35 | locked | Granny | the objective, the button |

Rooster stands on the far side of the windmill, facing away from it, so his MCU has the windmill behind him. Granny and
Pip are single shots; no two-hander, so no line to cross.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Rooster | THE BAROMETER IS DROPPING! VESPERS IN THE CLOUDS! | kept: the prophecy, all caps (8 words) |
| Rooster | THE SPRINKLERS KNOW! THEY ALWAYS KNOW! | kept (5 words); the running joke's first rung |
| ~~Granny~~ | ~~Reginald Vance's laser-level squad wants my back-forty acorn silo. Foreclosure, sugar.~~ | cut: too long (two sentences of exposition) and a second "sugar" |
| Granny | Reginald Vance's laser squad wants my acorn silo. Foreclosure, like a soufflé in a draft. | new: homely metaphor for a crime; 15 words, the one long line in the scene |
| Pip | Towing a silo through oscillating sprinklers?! Thermal shock ruins kiln glaze! Ruins it! | the joke kept, shortened from 16 words; run-on, exclamations |
| Granny | Then drive fast, sugar. Keep the sprinklers off my pumpkins. | kept: the objective, the button; the scene's one "sugar" |

Names checked: `npm run lore -- find Rooster` (the windmill entry), `Vesper` (the Glazier). Rooster is `rooster` (quests/stages.ts), the
windmill `rooster-windmill` (quests/stages/cloverfield.ts).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `tension` music, `wind` ambience | the windmill's warning |
| 17.2 | `squirt` sfx, a sprinkler hisses on | Rooster's prophecy comes true |
| 0.0-29.2 | `tension` (kept) | a sense of threat under the whole scene |

## 9. Blocking and vehicles

- Rooster stands at (4, 396) facing away from the windmill at (4, 405), so the windmill is behind him (yaw PI).
- Granny sits in her porch chair at the `granny-barn` mark (-64, 334); Pip stands at (-52, 344).
- Reginald van (`reg-van`, from `reginald`) drives from (0, 260) to (-24, 296) at 4.5 m/s; surveyors Peel and Tine walk
  beside it, from (-1, 250) to (-4, 262) and from (5, 252) to (2, 262).
- The player starts at (-21, 327) and is not seen in the scene; the gauntlet begins from there after the scene.

## 10. The button

Granny, close, with her objective: "Then drive fast, sugar. Keep the sprinklers off my pumpkins." The job is the last
thing said, in her voice, the sprinklers still hissing.

## 11. Self-check

- [x] The scene has a want (save the silo), an obstacle (Vance's squad, the sprinklers) and a turn (the van, the hiss);
      it is not a briefing.
- [x] The hook lands in 0 s on a character (Rooster, shouting); no narration.
- [x] Every line is under 16 words (the longest is 15); nobody says what the picture shows; no coordinates.
- [x] Voices: Rooster all caps and certain; Granny warm, one "sugar"; Pip fast, exclamations.
- [x] Every speaker is framed MCU, facing the camera (`frame`, no `toward`).
- [x] No two-hander, so no coverage needed; no crossing.
- [x] Music changes: none needed; one sfx for the turn; no stingers.
- [x] Running jokes: "THEY ALWAYS KNOW" climbs (proved on screen); the glaze joke kept.
- [x] Day scene.
- [x] scene checker (`scenecheck.dev.test.ts`): OK, all shots pass, zero faults.
- [x] `direction.notes` in the scene points at this file.
