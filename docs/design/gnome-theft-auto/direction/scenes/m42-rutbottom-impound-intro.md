# Director's notes: `m42-rutbottom-impound-intro`

Watch it at `?no-intro&cutscene=m42-rutbottom-impound-intro`.

| | |
| --- | --- |
| Scene | `m42-rutbottom-impound-intro` in `src/cutscene/scenes/story/m42-rutbottom-impound.ts` |
| Played by | quest `m42-rutbottom-impound` as its intro, given by Lulu at the Dirt Bowl gate |
| Kind and length | `intro`, aim 30-60 s |
| Where, when | stage `bowl-impound` (the pits); golden hour, `sky: 'golden'` |
| Before / after | before: Pinwheel Ridge, power cut. After: three laps against the HOA riders |

## 1. Purpose in the story

Lulu and the Carburettors get their own scene. Six of her crew's rides taped up in an impound pen is the stake; Clary
Mudguard, the bored marshal who goes by the book, is the obstacle that turns into a race.

## 2. The player's feeling

- **In:** a long drive east, the Combine two parts closer, Lulu waiting.
- **Out:** sure of the job (win three laps, drive a ride out of the yard), amused by Clary and the HOA's joyless riders.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Lulu | to get her crew's rides back | she cannot race: "conflict of interest" | deadpan, easy, teases Clary | hands the race to the player |
| Clary | a clean start and a fair finish | she will not break the book | flat bark, "go on, then" | accepts the player's entry |
| The player | to know the stakes | none | dry one-liners | takes the bike |
| Hemline | the HOA's entry | enthusiasm | clipboard, flat | the button |

## 4. Subtext

Clary fears an HOA permit more than she dislikes the Carburettors; "bowl rule four" is the loophole she found.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | the pen in gold dust, beige tape fluttering over six wrapped rides |
| 2 | 4-14 | Setup | Lulu's joke; the player: just cut it? Lulu: the yard is Clary's |
| 3 | 14-26 | Turn | Clary, card, rule four; the HOA entered three riders |
| 4 | 26-38 | Resolve | Lulu cannot race; the player takes the bike |
| 5 | 38-43 | Button | three clipboards: "Enthusiasm is discouraged on the oval." |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | dolly low | 52 | slow | the taped rides | the stakes |
| 2 | `LC.single('lulu','mcu')` | 35 | locked | Lulu | the joke |
| 3 | `PC.single('player','mcu')` | 35 | locked | the player | the question |
| 4 | `LC.single('clary','mcu')` | 35 | locked | Clary | card; rule four |
| 5 | `shot('hemline','ms')` | 40 | locked | the HOA riders | the button |

Sides of the line: Lulu and Clary on `coverage('lulu','clary',-1)`; the player and Clary on `coverage('player','clary',1)`.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lulu | Six of ours. Taped up like parcels. Beige tape, as if beige were a colour. | the hook line, a joke |
| Player | Just cut it off? | |
| Lulu | The tape is not the lock. The yard is Clary's, and Clary goes by the book. | introduces Clary |
| Clary | Bowl rule four. A held entry goes free when beaten. | her card lands after it |
| Clary | HOA entered three riders. Beat them. Three laps. Go on, then. | her tic |
| Lulu | I would beat them blind. She calls that a conflict of interest. | |
| Clary | It is one. Dirt bike on the grid. The berm remembers. | her tag from characters.md |
| Player | I'll take the bike. | |
| Hemline | Enthusiasm is discouraged on the oval. | the HOA, joyless |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `sandpit` march, `wind` | the Bowl, heat and dust |
| 0-4 | `flutter` on the tape, a distant `engine-rev` | the place |
| 30 | `paper` | the clipboards |
| 40 | `bell` | the Bowl's signature: a bell at the flag |

## 9. Blocking and vehicles

The player at (1007, -668), Lulu at (1011, -672), Clary at (1014.4, -667.8), three HOA riders in a row at (1031, -661.5..-668.5) beside beige dirt bikes. Six lowriders in two rows in the pen. No driving.

## 10. The button

Three clipboards raised as one, and "Enthusiasm is discouraged on the oval." The HOA has been there the whole time.

## 11. Self-check

- [x] Want, obstacle, turn: the rides, the book, the race.
- [x] Hook in 3 s on a picture.
- [x] Lines under 16 words.
- [x] Intro card: Clary, on an mcu after her first line.
- [x] Lit, golden hour.
- [x] `direction.notes` points here.
