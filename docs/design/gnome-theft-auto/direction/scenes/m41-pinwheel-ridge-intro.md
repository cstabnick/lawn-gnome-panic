# Director's notes: `m41-pinwheel-ridge-intro`

Watch it at `?no-intro&cutscene=m41-pinwheel-ridge-intro`.

| | |
| --- | --- |
| Scene | `m41-pinwheel-ridge-intro` in `src/cutscene/scenes/story/m41-pinwheel-ridge.ts` |
| Played by | quest `m41-pinwheel-ridge` ("Pinwheel Ridge") as its intro, given by Ragwort at her control hut |
| Kind and length | `intro`, aim 30-60 s |
| Where, when | stage `pinwheel-hut` (the hut on the north flank of the ridge); dawn, `sky: 'golden'` |
| Before / after | before: the Capwood Run, Lulu clear of the HOA. After: the first cable at Old Spin (`m41-pinwheel-ridge-mid`) |

## 1. Purpose in the story

The first of the four Combine parts, power. The scene gives the act its first "friend at the edge": Ragwort Coilspring, who
explains in numbers and says "naturally" about everything that is not natural. It plants the ridge's picture (ten giant
pinwheels, wind blowing, nothing turning) so the mid and the outro have something to pay off, and it lets Lulu hand the
player on, which is what "Lulu and the Carburettors get their own scenes" means in practice: she is the one who found Ragwort.

## 2. The player's feeling

- **In:** arrived at the far edge of the map after a long drive, the crew broken, Lulu the one friend who still has wheels.
- **Out:** curious about Ragwort, sure of the job (cut the cable at Old Spin, crack the linemen at Sulks and Whirly Bob, spin
  the last one), a little amused by "mind the mood".

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Lulu | to deliver the player and get back to her crew | she will not climb: "low and loud" | easy and loud; a quick wave | drives off, the road held |
| Ragwort | to get three pinwheels freed | she cannot cut the HOA's cable alone (the linemen) | dry numbers, "naturally", gives her torque wrench | trusts the player with it |
| The player | to know the job | none | one dry question | takes the wrench |

## 4. Subtext

- Ragwort's "naturally" covers fear: she is afraid of the HOA linemen (characters.md) and says nothing about it.
- The wrench she gives away is her own. It is the first thing she has handed to anyone in a long while.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | a low dolly up the hill at the silent blades, wind, a lowrider's engine climbing the track |
| 2 | 4-15 | Setup | Lulu's drop-off: the job in one line, the player's question, her refusal to climb |
| 3 | 15-18 | Move | she loops the car and goes; the track camera follows her out |
| 4 | 18-30 | Turn | Ragwort's count, her card, the three names |
| 5 | 30-40 | Job | the cable-reel insert; the torque wrench passes hands |
| 6 | 40-45 | Button | the player walks up; the wind finds nothing to turn |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | dolly low, up the flank | 54 | slow dolly | the stalled blades of Sulks | the place before the person |
| 2 | still, outside the car on the player's side | 40 | locked | Lulu | she leans out of the window |
| 3 | `LP.single('player','mcu')` | 35 | locked | the player | the dry question |
| 4 | `track` | 50 | tracks | the lowrider leaving | her exit, under 3 s |
| 5 | `shot('ragwort','mcu')` | 35 | locked | Ragwort | her count |
| 6 | `RP.single` x3 | 35 | locked | Ragwort / the player | the names, the question, the job |
| 7 | dolly insert | 38 | slow dolly | the HOA cable reel | the thing we cut |
| 8 | dolly wide | 54 | slow dolly | the blades | button |

Sides of the line: Lulu and the player on `coverage('lulu','player',1)`; Ragwort and the player on `coverage('ragwort','player',-1)`.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lulu | Ridge. The Combine charges its cells up here. Ragwort's expecting you. | the "previously" in her breath; one place |
| Player | You're not coming up? | the straight man |
| Lulu | Heights? We are low and loud, remember. Go on. I will hold the road. | her running line from act II |
| Ragwort | Twenty-two knots. Ten pinwheels. Not one turning. Naturally. | the count; the picture says it too, but the numbers are her voice |
| Ragwort | HOA re-cabled three. Old Spin, Sulks, Whirly Bob. Naturally the hard ones. | her name list; voice line from characters.md |
| Player | What do I cut? | |
| Ragwort | The cable at the first. Then the linemen notice. Torque is a mood. | the job and her tic |
| Ragwort | Mind the mood. | button of the exchange; she hands the wrench |

Names checked: `npm run lore -- find "Ragwort"`, `"Pinwheel Ridge"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `frost` music, `wind` ambience | the far edge of the map, cold dawn |
| 0-4 | `creak` on the mast, `engine-rev` on the car | the ridge before the people |
| 4 | horn | the car arrives |
| 40 | `whoosh` | the wind with nothing to turn |

No stingers: the intro card has its own.

## 9. Blocking and vehicles

- The player starts at (852.6, -1252.4), where the lowrider stops; Ragwort at her door (857.2, -1241.8) facing north.
- Lulu's lowrider (`lulu-car`) drives down the service track from (850, -1290) to (850.4, -1254.4) and goes out in a loop.
- L95: a seized HOA cable reel with a clipboard notice by the hut, a bench with a mug for one.
- The player ends at the giver's exit (862.5, -1243).

## 10. The button

The player walks away from the camera up the hill under the blades, and the wind has nothing to turn. It is the right last
moment: the problem is the picture.

## 11. Self-check

- [x] Want, obstacle, turn: Lulu's drop, Ragwort's three names.
- [x] Hook in 3 s on a picture and a sound.
- [x] Lines under 16 words; nobody says the picture except Ragwort's count, which is her voice.
- [x] Intro card: Ragwort, on an mcu after her first line.
- [x] One side of the line per conversation.
- [x] Dawn, lit (`sky: 'golden'`).
- [x] `direction.notes` points here.
