# Director's notes: `vespers-offer-intro`

Re-directed against [../bible.md](../bible.md). Watch it at `http://localhost:5310/?no-intro&cutscene=vespers-offer-intro`.

| | |
| --- | --- |
| Scene | `vespers-offer-intro` in `src/cutscene/scenes/story/ch2b.ts` |
| Played by | quest `ch2-vespers-offer` as its intro, given by Granny Gnertrude at Cloverfield Barn |
| Kind and length | `intro`, aim 30-60 s; now 47 s at Normal text speed (was 62 s, 7 faults) |
| Where, when | stages `granny-barn` (yard, porch) and `south-highway-diner` (Vesper's booth, seen for one shot); golden evening, `sky: 'golden'` |
| Before / after | before: the player is on the farm, no job yet. After: the player is at the gate (-20, 331) holding Granny's shotgun, the quest exit; then `vesper-diner` on arrival at the diner |

## 1. Purpose in the story

Chapter 2 opens with Vesper's first direct move: an invitation delivered by a chauffeur to the one farmer the HOA has
not yet squeezed. The scene plants the trap (Granny knows it is one and sends the player anyway), shows Vesper for the
first time (still, at his booth, two miles south), and arms the player with the shotgun Granny lends them.

The old scene was a set of wides under narration: a 20 s wide held with nothing happening, a narrator describing the
diner, Granny at 14% of the frame. It played the invitation with the camera on the scenery.

## 2. The player's feeling

- **In:** a farm gnome in the golden light, bored, expecting a quiet evening.
- **Out:** uneasy and armed. Vesper is real, patient and very polite; the player knows it is a trap and goes anyway.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny Gnertrude | to protect the player and still get them to go | her own yard, her age | dry wit, a plain warning, a loan | lends the shotgun |
| HOA Chauffeur | to deliver the letter and leave | Granny's porch, the run | none (a courier) | gone |
| Vesper "The Glazier" Thorne | to have the player at his booth | nothing: he is already there | stillness, patience, complete sentences | waiting, unhurried |
| The player | to know what this is about | Granny's indirection | silence; a question is not needed | takes the shotgun, heads for the gate |

## 4. Subtext

- Granny has seen the pearl Lowrider before and knows what it means: she sends the player on purpose, to see the Glazier
  with her own eyes ("Hear what he wants").
- Vesper's patience is the threat. He is never late, which is a rule he sets himself and enforces on everyone else.
- The hat is the running joke's next rung in the diner scene (Vesper buys instead of threatening); here it is only an
  instruction ("Wear the hat"), which is what he expects.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | The pearl Lowrider on the farm track, tracking shot up the yard, the horn. Granny's line lands at 1.0 s on her face. |
| 2 | 1.0-7.6 | Setup | Granny: "Pearl paint on a farm track. Somebody's lost, or somebody's rich." The chauffeur steps out and runs up the yard. |
| 3 | 7.6-18.1 | The letter | Track on the chauffeur running; the handover, wide enough to see the envelope change hands; Granny's face as the voice reads the invitation. |
| 4 | 18.1-26.2 | Turn | Vesper's voice: "Come alone. Wear the hat." Granny leans in: "It's a trap. Go anyway." She knows, and sends the player. (about 50%) |
| 5 | 26.2-29.1 | Vesper | Cut to the diner, a low single on Vesper at his booth, still. The villain stinger. "Patience, friend. The Glazier is never late." |
| 6 | 29.1-39.6 | Arming | Back in the yard. Track on Granny running down to the player with the shotgun. The hand-over, the player cheers. |
| 7 | 39.6-46.9 | Button | Granny's close-up: "Shoot for the hat, sugar. Not the gnome under it." Then the player's look, held 1.2 s. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on `ride` | 50, behind and above | moving | the Lowrider | the hook: a car on a farm track is the question |
| 2 | `shot('granny','mcu')` | 35 | locked | Granny | the pearl-paint line is hers |
| 3 | `track` on `chauffeur` | 50, behind | moving | the chauffeur | a run is a chase: 8 s, under the moving limit |
| 4 | `spot('granny-barn','two-shot')` | 52 (stage spot) | locked | the handover | a 1.2 s handover needs the letter in the picture |
| 5 | `shot('granny','mcu')` | 35 | locked | Granny | the invitation read over her face (Vesper off screen) |
| 6 | `shot('granny','cu')` | 30 | locked | Granny | "It's a trap" is the turn: close |
| 7 | `shot('vesper','mcu',{height:'low', side:-40})` | 35, low | locked | Vesper | a still threat; `side` keeps the camera off the table |
| 8 | `track` on `granny` | 50, ahead | moving | Granny running | she comes down the yard at the player |
| 9 | `shot('player','ms',{toward:'granny'})` | 40 | locked | the player and Granny | the handover in one picture |
| 10 | `shot('granny','mcu')` | 35 | locked | Granny | the button line |
| 11 | `reaction('player', pause)` | 35 | locked | the player | the look: the last image |

Sides of the line: Granny and the player are shot from the yard side (their default). There is no two-shot with Vesper:
he only appears alone, in his own low single.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Granny | Pearl paint on a farm track. Somebody's lost, or somebody's rich. | kept; she is framed for it now (was off screen) |
| Vesper Thorne (off screen) | Meet me at the South Highway diner. Come alone. Wear the hat. | kept; the voice of the invitation |
| Granny | It's a trap. Go anyway. Hear what he wants. | kept; "sugar" removed here so it lands once, on the shotgun line |
| Vesper | Patience, friend. The Glazier is never late. | kept; no contraction, no exclamation mark |
| Granny | Shoot for the hat, sugar. Not the gnome under it. | kept; the only "sugar" of the scene |
| ~~Narrator~~ | ~~Two miles south, Vesper Thorne stirs his tea. Fence-Post Frank waves the traffic through.~~ | cut: described the picture; the diner shot shows Vesper instead. Frank waves in the background |

Names checked: `npm run lore -- find Glazier` (Vesper "The Glazier" Thorne), `find Lowrider`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` ambience, `villain` music (his scene) | the Flats at dusk; the car is his |
| 0.0 | horn (`horn` on the Lowrider) | the hook is a sound |
| 26.2 | `villain` stinger on Vesper's first appearance | the one stinger of the scene: he arrives in frame |
| 26.2 | `wind` ambience holds across the cut | the ear stays on the Flats while the eye goes to the diner |

## 9. Blocking and vehicles

- Yard: Granny on her porch chair at her mark (-64, 334), facing east; the shotgun in her hands (`hold`). The chauffeur
  starts seated in the Lowrider, exits at the gate (-25, 330), runs to (-58, 333) and hands her the sealed letter.
- The Lowrider drives the dew-approach path from the north to the gate and stops there (Vesper's car: nobody is driving
  it, and it leaves the yard with the scene).
- Diner: Vesper spawns at his booth mark (20, 262) facing east, sitting. Frank walks his sign route in the background.
- The player: spawns at the gate (-20, 331), hidden until the handover, then appears there. Granny runs from the porch
  to (-22, 335) and gives the shotgun; the player ends at the gate, at (-20, 331), which is the quest exit.

## 10. The button

Granny's close-up: "Shoot for the hat, sugar. Not the gnome under it." Then the player's look, still, holding the
shotgun. It is the right last moment because it is a threat and a gift in one line, and the player's stillness answers
it. There is no walk-off.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; it is not a briefing.
- [x] The hook lands in 3 s: a car on a track and a horn; the first line is at 1.0 s and is not narration.
- [x] Every line under 16 words; no coordinates or waypoint read-outs; the narrator line is gone.
- [x] Voices: Vesper complete sentences, no contractions, no exclamation marks; Granny dry and short.
- [x] Every speaker framed MCU or closer for their line; Vesper alone in his frame, never in a two-shot.
- [x] One side of the line per conversation; no crossings.
- [x] One `villain` stinger on Vesper's first appearance; `music` is his scene.
- [x] Ladder: the hat line, the invitation, Vesper's patience (the next rung is the diner, where he buys).
- [x] Golden hour: `sky: 'golden'`.
- [x] `SCENES=vespers-offer-intro TIMELINE=1 npx vitest run src/cutscene/scenecheck.dev.test.ts`: OK, all shots pass, zero faults.
- [x] `direction.notes` in the scene points at this file.
- [ ] Watched in the browser at 960x600 and 390x844: not done here (the review pass is the planner's).
