# Director's notes: `mowers-keepers-outro`

The payoff of `mowers-keepers-intro`: Tansy's "Not my bay, not my problem." comes back on her own door. Re-directed
against [../bible.md](../bible.md). Watch it at `http://localhost:5310/?no-intro&cutscene=mowers-keepers-outro`.

| | |
| --- | --- |
| Scene | `mowers-keepers-outro` in `src/cutscene/scenes/story/ch1c.ts` |
| Played by | quest `ch1-mowers-keepers` ("Mower's Keepers") as its outro, at Side-Valve Salvage, after the bikes are delivered |
| Kind and length | `outro`, aim 15-45 s; now 30.1 s at Normal text speed (was 43.5 s, 10 faults) |
| Where, when | stage `side-valve-bay` (the apron and the z = 60 road); day, no `sky` |
| Before / after | before: the player unclamped the Cloverfield bikes and brought them to the bay. After: the next quest, `ch1-two-coat-tail` (Mayor Mulch); Vesper's threat comes in `tax-break-in-intro` |

## 1. Purpose in the story

Chapter 1 asks whether the player can pay their way out. This outro says the HOA is not only squeezing farmers: it has
reached Tansy's bay, and the man behind it is Vesper, who "files" rather than knocks. It pays off the intro's line
"Not my bay, not my problem" (the eviction notice is taped to her door) and makes Vesper's first appearance on screen
in the pearl Lowrider with nobody driving, the first `villain` cue of the chapter.

The old scene opened on a narrator describing the lavender, cut the same pair of Tansy and Pip across the line four
times, and ended on a wide shot of the car with the player walking off.

## 2. The player's feeling

- **In:** pleased with the bikes, a little smug about the HOA's boot ticket.
- **Out:** Tansy's tone has changed (she is now a target too), and a cold itch: someone is watching the bay, and he does
  not need to be seen.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to keep her bay and stay out of the war | the notice on her own door; Vesper | reads it flat, a dry "Exactly." to Pip's naivety | knows the fight has reached her |
| Pip | to be useful and not to be the one who gets blamed | the notice does not make sense to him | a blurt ("We don't even pay rent.") | quiet, watching the car |
| Vesper (off screen, then in the car) | to be felt, not seen | none; he files | a drive-by with nobody at the wheel | the threat is delivered without a word |
| The player | (not in the scene) | | | |

## 4. Subtext

- "Exactly." is Tansy agreeing that the bay is not theirs to lose, which is a lie she has just found out about.
- The car with no driver says that Vesper does not need to be in the room. "Nobody's driving it. That's worse." is her
  admitting that she is afraid of the paperwork, not the car.
- Pip's "We don't even pay rent." is the joke he does not know he is making: the eviction is absurd, and it still works.

## 5. Beat sheet

Timings at Normal text speed (checker, 30.1 s).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-4.8 | Hook | Wide of the bay. Tansy walks to the door, takes the notice down (`despawn` notice, `hold` sealed-letter), facepalm. No narration. |
| 2 | 4.8-12.9 | Setup | Tansy's line, Pip stands and answers: "Eviction? We don't even pay rent." Tansy: "Exactly." |
| 3 | 14.6-19.6 | Turn | The Lowrider slides past on the road (`track`, 5 s), `villain` in with one stinger. Nobody drives it. |
| 4 | 19.6-25.3 | Escalation | Tansy: "He doesn't knock. He files." Pip: "Nobody's driving that." Tansy: "Nobody's driving it. That's worse." |
| 5 | 25.3-30.1 | Button | Music out. CU of Tansy holding the notice, the engine fading. Held. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('side-valve-bay','wide')` | 52, high | locked (the walk is the picture) | Tansy at the door | establish the place and the notice |
| 2 | `CREW.single('tansy','mcu')` | 35 | locked | Tansy | the line; the notice in her hand |
| 3 | `CREW.single('pip','mcu')` | 35 | locked (Pip stands, async) | Pip | the answer |
| 4 | `CREW.single('tansy','mcu')` | 35 | locked | Tansy | "Exactly." |
| 5 | `track` on `vesper-car` from (-150, 50, 3) | 50 | tracks the car | the Lowrider | the drive-by; `villain` in on the cut |
| 6 | `CREW.single('tansy','mcu')` | 35 | locked | Tansy | the line |
| 7 | `CREW.single('pip','mcu')` | 35 | locked | Pip | "Nobody's driving that." |
| 8 | `CREW.single('tansy','mcu')` | 35 | locked, held into the button | Tansy with the notice | the held look |

Sides of the line: every exchange between Tansy and Pip is on `coverage('tansy','pip', 1)` (`CREW`), one side for the
whole scene. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| ~~Narrator~~ | ~~The process server is lying in the lavender. The eviction notice is still taped to the bay door.~~ | cut: opened on narration, and the picture shows it (the walk to the door) |
| Tansy | Eviction notice. Taped to my bay door. Who sends an eviction to a salvage yard? | the payoff of the intro's "Not my problem"; 15 words |
| Pip | Eviction? We don't even pay rent. | kept (the bible's bit); he stands to say it |
| Tansy | Exactly. | kept: the one word that says she has changed her mind |
| Tansy | Vesper Thorne. He doesn't knock. He files. | the first name; his rung of the threat ladder is "files", not a hat line |
| Pip | Is anyone driving that? Nobody's driving that. | kept |
| Tansy | Nobody's driving it. That's worse. | the button line |

Names checked: `npm run lore -- find vesper` (Vesper "The Glazier" Thorne); the eviction plant is in the intro's
"Not my bay, not my problem".

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, `turfton` music at scene start | the bay is the crew's world; the walk is the hook |
| 14.6 | `villain` music in (fade 1.2), `villain` stinger on the car | Vesper's first appearance, a stinger on his car (one per scene) |
| 25.3 | `music` out (fade 1.2) | the button goes quiet; the engine is ambience only |

## 9. Blocking and vehicles

- Tansy walks from her mark (-143, 73) to (-142.5, 68.5) at the door, the notice despawns, she holds the `sealed-letter`.
  She stays there; the button is her held look.
- Pip sits on his crate at (-135.5, 74), stands in place (no walk, so the parked Zero-Turn at (-141, 70) stays out of the lens).
- The `vesper-car` (pearl Lowrider, `rideOf('vesper')`) starts at (-120, 57.5) on the z = 57.5 road, drives west to
  (-190, 57.5) at 9 m/s, nobody at the wheel. Its engine is the only sound it has in the shot.
- Turncoat Cam is not an actor here: he sweeps the apron on his stage walk, as in the intro.
- The player actor stays on its mark (-156, 70) off to the side and is never framed (the quest takes them on from the bay).

## 10. The button

Tansy's held look at the notice, with the Lowrider's engine going away and the music gone. It is the right last moment
because it is the payoff the intro set up: the eviction is on her door, and she is now the one who has to hold it.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn: the eviction on her door, then the car with nobody driving.
- [x] The hook lands in 3 s (the walk to the door); the first thing is not narration.
- [x] Every line under 16 words (longest 15: the eviction line); no coordinates or waypoint read-outs.
- [x] Tansy is dry and short; Pip is blurting; Vesper is only a car.
- [x] Every speaker framed MCU, facing the camera; every Tansy/Pip line on one coverage.
- [x] One side of the line for the whole scene; no crossings.
- [x] Music has a reason at each change; one stinger; no held silence beyond the button.
- [x] Ladders: "not my problem" is paid off here; "files" is Vesper's first rung on the threat ladder.
- [x] Day scene (no `sky` needed).
- [ ] `npm run cutscene-report` / `pacing.baseline.ts`: left to the planner (out of scope for this issue).
- [ ] `npm test` and a watched run in the browser: not done in this issue (no dev server, per the common rules).
- [x] `direction.notes` in the scene points at this file.

## Review pass (planner)

Watched at 960x600. The hook is no longer the stage wide (Tansy was a speck): a still shot beside the bay door as she walks in and takes the notice down. She turns to Pip before her first line, so her singles see her face instead of a three-quarter back.
