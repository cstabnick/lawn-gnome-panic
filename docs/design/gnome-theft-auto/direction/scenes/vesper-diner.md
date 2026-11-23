# Director's notes: `vesper-diner`

Re-directed against [../bible.md](../bible.md). Watch it at `http://localhost:5310/?no-intro&cutscene=vesper-diner`.

| | |
| --- | --- |
| Scene | `vesper-diner` in `src/cutscene/scenes/story/ch2b.ts` |
| Played by | quest `ch2-vespers-offer` as its arrival: the player reaches the South Highway diner, then the Porcelain guards fight |
| Kind and length | `arrival`, aim 10-35 s, fault above 45 s; now 35 s at Normal text speed (was 38 s, 11 faults) |
| Where, when | stage `south-highway-diner` (the Flats, the blockade on the road); dusk, `sky: 'golden'` |
| Before / after | before: the player drove down the south highway to the diner. After: the player fights three Porcelain guards on the road (the quest's ambush) |

## 1. Purpose in the story

Chapter 2's centrepiece: the reasonable man makes his offer. Vesper does not threaten; he buys. The acorn, a debt wiped,
a penthouse, insurance. The player refuses in four words, and Vesper is not surprised. The scene turns the chapter from
a job into a betrayal: he never meant to trade.

It pays off the chapter 1 setups (the lien on Tansy's bay, the acorn) and the hat ladder's escalation: there is no hat
line here at all, because the offer is the next rung.

The old scene was a single wide held 25 s with five lines in it, Vesper at 12% of the frame, and the hat threat repeated
word for word from `two-coat-handover`.

## 2. The player's feeling

- **In:** cautious, having been told "Come alone" by an invitation they know is a trap.
- **Out:** the dread of a man who has been polite to you and is now going to be impolite. The player sees the offer,
  turns it down, and is in a fight.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper "The Glazier" Thorne | to buy the Golden Acorn | the player's pride | a reasonable offer, itemised; patience | to sending the guards: "Porcelain does not negotiate twice" |
| The player | to keep the acorn | Vesper's offer, which is good | a short refusal | in a fight |
| Fence-Post Frank | to wave the traffic through | nothing | background | (unseen) |
| Porcelain guards | to close the road | the player | none (they step in) | (in the fight) |

## 4. Subtext

- Vesper wants the acorn for the Grand Combine; the offer is a hook, and the penthouse is his real pitch.
- Vesper's fear (cracking) is under every "Order over chaos": he cannot bear anything that could break, so he buys
  everything that might.
- The guards are a precaution he had planned before the player arrived: the van was waiting behind the blockade.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | The player's MCU: the player crosses their arms at the booth (`crossArms`), a beat. |
| 2 | 1.3-8.1 | Setup | Vesper, low, alone in frame: "Please sit, friend. The Glazier would like to make you an offer." The villain stinger. "Hand over the Golden Acorn." |
| 3 | 8.1-10.5 | Reaction | The player's MCU: a shrug, a beat of silence. The player's line: "Go on." |
| 4 | 10.5-19.4 | The offer | Vesper, a low single: "Tansy's lien vanishes. A Patio Heights penthouse, astro-turf included." "Full Kiln-Shield coverage. Zero-millimetre uniformity." "Order over chaos, friend." |
| 5 | 19.4-22.6 | Turn | Music out. The player's MCU after a pause: "I'll keep the acorn." (about 60%) |
| 6 | 22.6-25.5 | The answer | Vesper, low, unsurprised: "A pity. Porcelain does not negotiate twice." The danger stinger; the chase music. |
| 7 | 25.5-30.2 | The van | A wide of the road: the van rolls up to the blockade, its door, three guards step into the road. |
| 8 | 30.2-31.4 | Vesper leaves | The track on the pearl Lowrider: Vesper is already in it (nobody is driving), lights on, horn, it leaves past the diner. |
| 9 | 31.4-34.7 | Button | The wide: the guards closing on the diner, the player inside the frame. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('player','mcu')` | 35 | locked | the player | the hook: the arms cross |
| 2 | `BOOTH.single('vesper','mcu',{height:'low'})` | 35, low | locked | Vesper | the first offer line, alone in frame |
| 3 | `BOOTH.single('player','mcu')` | 35 | locked | the player | the reaction to the ask, with a shrug |
| 4 | `BOOTH.single('vesper','ms',{height:'low'})` | 40, low | locked | Vesper | the itemised offer, one shot, three lines |
| 5 | `BOOTH.single('player','mcu')` | 35 | locked | the player | the silence before the refusal |
| 6 | `BOOTH.single('vesper','mcu',{height:'low'})` | 35, low | locked | Vesper | the turn, unhurried |
| 7 | `spot('south-highway-diner','arrival')` | 52, stage spot | locked | the van and the road | the blockade is a place, held 5 s while the van drives in |
| 8 | `track` on the Lowrider (`ride`) | 50 | moving | the car | Vesper's exit: the car leaves, nobody driving |
| 9 | `spot('south-highway-diner','wide')` | 52, stage spot | locked | the guards and the player | the button: the trap closes in one picture |

Sides of the line: Vesper and the player on `coverage('vesper','player', -1)` (`BOOTH`), every shot of their exchange
on one side. The dolly push-in in the first draft was dropped: it sat on the other side of the line from the booth
singles (a `crosses-line` fault on the refusal) and put the camera inside the cafe table, so the threat is a locked low
single. Slow push-in is still the bible's move for threats; it is a follow-up for the review pass.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper | Please sit, friend. The Glazier would like to make you an offer. | new: his first line, so the player sits down to the offer; no contraction |
| Vesper | Hand over the Golden Acorn. | the ask, short |
| Player | Go on. | new: the player's dry opening; it gives Vesper's next three lines their own run, not a fourth in a row |
| Vesper | Tansy's lien vanishes. A Patio Heights penthouse, astro-turf included. | the offer, with a payoff from chapter 1 |
| Vesper | Full Kiln-Shield coverage. Zero-millimetre uniformity. | the insurance, itemised |
| Vesper | Order over chaos, friend. | the motto: the line he believes |
| Player | I'll keep the acorn. | four words, dry |
| Vesper | A pity. Porcelain does not negotiate twice. | the turn; the danger stinger |
| ~~Vesper~~ | ~~Nice hat. Shame if it cracked.~~ | cut: the full hat threat was used in `tax-break-in-intro` (the one time); the ladder's rung here is the buy, not the threat |
| ~~Player~~ | ~~Order is overrated. I'll keep my acorn, thanks.~~ | cut: too long (9 words) for a dry refusal; "I'll keep the acorn." carries it |
| ~~Vesper~~ | ~~Hand over the Golden Acorn. Tansy's lien vanishes. A Patio Heights penthouse, astro-turf included.~~ | split across the reaction; each line now on its own beat |

Names checked: `npm run lore -- find Glazier`, `find Kiln-Shield` (Kiln-Shield Insurance).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` ambience, `villain` music (his scene) | the Flats at dusk |
| 1.3 | `villain` stinger on Vesper's first line | his arrival in frame |
| 8.1 | music stays `villain` through the offer | his theme under his pitch |
| 19.4 | music out (fade 0.6) before the refusal | the silence makes the refusal land |
| 22.6 | `danger` stinger and `chase` music on "Porcelain does not negotiate twice" | the trap is sprung |
| 25.5 | `door` sfx on the van | the sound tells the cut the guards arrive |

## 9. Blocking and vehicles

- Booth: Vesper seated at his mark (20, 262) facing the player; the player standing at (25, 265), facing him.
- The van: spawns at the head of the diner approach (-2.5, 180) and drives south to (-2.5, 236) at 12 m/s; its door
  opens there. Three guards spawn at (-2.5, 236) and run to their ambush marks: (-6, 240), (6, 240), (0, 252).
- The Lowrider: parked at (26, 248); Vesper despawns into it (nobody is driving) and it leaves north-east round the
  diner and west down the highway to (-6.7, 270), with lights and horn, `arrive: false`.
- The player is not moved: they stay at the booth (25, 265) as the guards close in, which is where the fight starts.

## 10. The button

The wide of the diner: the Porcelain guards in the road closing on the diner, and the player still at the booth in
frame. It is the right last moment because it is the trap in one picture: the offer was never a choice.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; it is not a briefing.
- [x] The hook lands in 3 s: the arms cross on the player's face; no narration.
- [x] Every line under 16 words (longest 12); no coordinates; no narrator line.
- [x] Voices: Vesper complete sentences, no contractions, no exclamation marks; no hat line.
- [x] Every speaker MCU/MS or closer, and alone in Vesper's own shots; reactions after the big lines.
- [x] One side of the line per conversation (`BOOTH`); no crossings.
- [x] Music: `villain` is his; one `villain` stinger, one `danger` stinger; a silence before the refusal.
- [x] Ladder: the hat line is not repeated; the rung is the buy, then the trap.
- [x] Dusk: `sky: 'golden'`.
- [x] `SCENES=vesper-diner TIMELINE=1 npx vitest run src/cutscene/scenecheck.dev.test.ts`: OK, all shots pass, zero faults; 34.7 s.
- [x] `direction.notes` in the scene points at this file.
- [ ] Watched in the browser at 960x600 and 390x844: not done here (the review pass is the planner's).

## Review pass (planner)

Watched at 960x600 and 390x844. Vesper's Lowrider is parked at the diner from the start (it was hidden and never spawned, so it drove off invisible). The button is the player's face as the guards close in, not the far stage wide where the guards were specks.
