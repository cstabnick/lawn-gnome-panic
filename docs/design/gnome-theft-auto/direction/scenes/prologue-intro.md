# Director's notes: `prologue-intro`

The game's first minute. Watch it at `http://localhost:5310/?no-intro&cutscene=prologue-intro`.

| | |
| --- | --- |
| Scene | `prologue-intro` in `src/cutscene/scenes/story/ch1.ts` |
| Played by | quest `prologue-fresh-kiln` ("Fresh Out the Kiln") as its intro, at the downtown snail-coach stop |
| Kind and length | `chapter-open`, aim 45-80 s; now 53 s at Normal text speed (was 60.5 s, 9 faults) |
| Where, when | stage `bus-stop` (the x = 0 road), a cut to `bodega-front`; day, `sky: 'noon'` |
| Before / after | before: nothing (the title screen). After: the chase behind Pip's bike to Side-Valve Salvage in the Ride-On from the kerb, then `prologue-outro` |

## 1. Purpose in the story

The prologue asks "who are these people?" In one minute: the player is a mass-produced gnome in debt (the noir voice
says it twice, the only narration in the scene), Turfton is a city where crime is ordinary (a Hat Watch whistle before
lunch), and Pip is the friend who drags you into it. Plants: Asphalt's bottlecap (the town barometer, rung 0: she bats
it, all is normal) and the humming crate (the Golden Acorn, paid off in the outro).

The old scene had three narrator lines (one described the picture), Pip's first two lines on a wide at 16% of the frame,
the player's only line from behind, and John Bodega reading stage directions ("Asphalt bats a bottlecap off the
counter").

## 2. The player's feeling

- **In:** curious, nothing known.
- **Out:** amused, a little implicated (Pip's bike is obviously stolen and they are now standing next to it), with a job
  (follow Pip in that Ride-On) and the title on screen as the engine starts.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to get the player on board before the Hat Watch arrives | the player's look; the whistle | over-explain, change the subject, point at a vehicle | gets his partner |
| The player | to know what they are walking into | Pip will not answer the question | one dry question | follows anyway |
| John Bodega | (none: the chorus) to say what kind of day it is | | dry understatement | |

## 4. Subtext

- Pip defends himself before anyone accuses him: he knows it is stolen. He answers "why is the whistle for you" with the
  owner's Acorn-Cola (a question nobody asked): his tic, and his guilt.
- John's line is the city's shrug: the Hat Watch whistling is a weekday thing. Asphalt batting the cap says the same.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-5.3 | Hook | The crane down out of the towers; the coach's horn at once; "Every gnome thinks they are limited edition." |
| 2 | 5.3-13 | Setup | The coach pulls in; "Then you step off the snail-coach, five thousand Acorns in Kiln-Debt." The door, the player steps down. A whistle two blocks off; the player's face. |
| 3 | 13-19 | Entrance | Pip tears in on a borrowed bike, horn, skid, runs up. The theme starts with him. |
| 4 | 19-38 | The exchange (turn at about 24) | Pip defends himself unasked; the player: "Is that whistle for you?" A beat: Pip answers a different question. The player's look. "Grab that Ride-On and follow me!" Insert on the Ride-On. The crate that hums. |
| 5 | 38-43 | Meanwhile | Bodega & Sons: Asphalt and her bottlecap (two taps of the cap, a distant whistle). John: "Whistles before lunch, Asphalt. Must be Tuesday." |
| 6 | 43-52.6 | Button | "Okay. Go go go!" Pip mounts and tears off; low wide of the player at the Ride-On as the title slams in. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` from the towers to the stop | 54 | crane down | the city, the coach | the city first; the noir voice over a picture of scale |
| 2 | `track` the coach | 50 | pan | the coach | the arrival |
| 3 | `shot('player','ms',{side:30})` | 40 | follows the step down | the player | the hero, first sight |
| 4 | `reaction('player', mcu)` | 35 | locked | the player | the whistle lands on a face |
| 5 | `track` the bike | 50 | pan | Pip | energy: Pip enters at speed |
| 6-12 | `STOP = coverage('pip','player',1)` singles, MCU | 35 | locked | Pip / the player | the exchange, one side of the line, a look after the deflection |
| 9 | `dolly` insert on the Ride-On | 44 | slow push | the Ride-On | the thing the player is about to borrow |
| 13 | `dolly` low on Asphalt | 40 | slow push | the cat and the cap | show the barometer instead of saying it |
| 14 | `shot('john','mcu',{toward:'cat'})` | 35 | locked | John | his one line |
| 15 | `STOP.single('pip', handheld 0.03)` | 35 | handheld | Pip | the go |
| 16 | `cut` low wide beside the Ride-On | 52 | locked | the player, the Ride-On, Pip leaving | the title card's picture |

Side of the line: Pip and the player on `coverage('pip','player', 1)` throughout; no crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Narrator | Every gnome thinks they are limited edition. | kept: the noir opener (narration 1 of 2) |
| Narrator | Then you step off the snail-coach, five thousand Acorns in Kiln-Debt. | was 17 words; trimmed (narration 2 of 2) |
| ~~Narrator~~ | ~~And half the block was cast from the same garden-centre mould.~~ | cut: third narration; the player's mould is the player's own gnome, already on screen |
| Pip | Don't look at me like that! It's not stealing if the key's in it. | tightened; the guilt before the accusation |
| Player | Is that whistle for you? | the straight man |
| Pip | He went inside a flowerpot for an Acorn-Cola. That's basically a gift. | moved after the question: now it is the answer to a question nobody asked |
| Pip | Grab that Ride-On and follow me! | split from a 17-word line |
| Pip | Side-Valve Salvage. Tansy's got a crate that hums. | the hook for the outro (one place name) |
| ~~Pip~~ | ~~It smells faintly of Chirp & Crumb. Don't ask. I didn't.~~ | cut: Tansy says the smell in the outro, on the picture of the acorn |
| ~~John~~ | ~~Bodega & Sons, late morning. Asphalt bats a bottlecap off the counter...~~ | cut: stage directions; the shot shows the cat and the cap |
| John | Whistles before lunch, Asphalt. Must be Tuesday. | new: one dry line of town commentary |
| Pip | Okay. Go go go! | the button line, now on a close shot |

Names checked: `npm run lore -- find "Bodega"`, `Asphalt`, `Kiln-Debt`, `snail-coach`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience, no music; the coach horn | the deadpan cold open: the city before the theme |
| 10.5 | `whistle` (far) | the Hat Watch, heard not seen |
| 13.0 | `turfton` in (fade 0.4) as Pip's bike tears in | the crew's world arrives with Pip |
| 38.7 | `knock` x2 on the cat (the cap), a far whistle | the barometer: batting it means a normal day |
| 46.7 | `chapter` stinger, title, shake | the game's title |

One stinger (the chapter card). No silence: this is a 3-to-5 tension opener.

## 9. Blocking and vehicles

- The coach drives in along x = 2.5 to z 21, stops, drives on north. The player spawns at the door (-6.6, 18.5), walks
  to (-7, 16), faces north at the whistle.
- Pip's bike comes down from z 70 to (-4.2, 18); Pip runs to his mark (-10, 18), faces the player. At the end he
  re-mounts and drives off north (the chase's first leg).
- The kerb Ride-On at (-7.6, 27) is `keep: true`: the player ends at (-8.6, 22.6) beside it, which is where the chase
  starts.
- Bodega & Sons: John at (-79.5, 87) with his broom, facing Asphalt (`asphalt-cat` prop, new in `@lawn/prefabs`) at
  (-78.3, 88.4).

## 10. The button

A low wide of the player beside the borrowed Ride-On as Pip's bike skids away and GNOME THEFT AUTO slams in. The game's
promise in one picture: a vehicle that is not yours, a friend who is already leaving, go.

## 11. Self-check

- [x] Want (Pip: a partner), obstacle (the whistle, the player's look), turn (he answers the wrong question), job.
- [x] Hook by 1 s (the horn under the crane); the first line is narration but not the first thing that happens.
- [x] Every line under 16 words (longest 14); no coordinates.
- [x] Pip run-on and deflecting; the player five words; John one dry line.
- [x] Every speaker MCU and facing the camera; a reaction after the whistle and after the deflection.
- [x] One side of the line.
- [x] One music change, one stinger, no silence (opener).
- [x] Plants: Asphalt's bottlecap (barometer: normal), the humming crate.
- [x] Day scene.
- [x] Report OK; removed from `pacing.baseline.ts`.
- [x] `npm test` passes (line of sight included); watched at desktop and phone size.
- [x] `direction.notes` points here.
