# Director's notes: `sq-hose-revolt-intro`

Re-directed against [../bible.md](../bible.md). Watch it at `?no-intro&cutscene=sq-hose-revolt-intro`.

| | |
| --- | --- |
| Scene | `sq-hose-revolt-intro` in `src/cutscene/scenes/side/hoseRevolt.ts` |
| Played by | quest `sq-hose-revolt` ("The Great Hose-Pipe Tax Revolt") as its intro, given by the Strangers at the canal |
| Kind and length | `intro`, aim 30-60 s; was 49.4 s with 16 faults, now about 50 s (see the report) |
| Where, when | stage `brenda-throne` (Cloverfield, the north canal bank), day, `sky: 'noon'` |
| Before / after | before: the player is in Cloverfield, given the job. After: the drive to the canal's hose taps, then `sq-hose-revolt-club` at Vesper's putting green |

## 1. Purpose in the story

The Baroness makes her revolt official and sends the player to kink four hoses, the last at Vesper's club. It plants
the club (the quest's last hose) and the Turf-Code medal. It also shows that the revolt is a farce with real teeth:
Brenda has an unanswered tax (Auntie) on her own side.

## 2. The player's feeling

- **In:** curious, a little amused, after a long drive north past the flamingos.
- **Out:** clear on the job (four hoses, the last at Vesper's club, flood the eighteenth), and amused by a monarch who
  takes herself perfectly seriously.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Brenda | sovereignty, the hoses kinked in her name | her own gang (Auntie) | royal "we", proclamations, the sceptre raised | has overruled dissent; sends the player out |
| Biker b4 | to protect his auntie | Brenda's decree | plain objection, polite | overruled, still on the bike |
| The player | to know what the job is | the proclamation's length | one dry question, one dry line | takes the job |
| Pink gang (b1-b3) | to ride the parade | no one | the lap, the horn | (background) |

## 4. Subtext

- Brenda's grip on New Puddle is a bike-and-bunting thing. Auntie is the first crack: she is a tax Brenda cannot
  abolish, and Brenda knows it (she overrules before she explains).
- The player is the only person in the scene who asks what anything means. That is the joke, and it stays unspoken.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A tracking shot on the lead pink bike as the gang rides off the bank loop; the horn. |
| 2 | 3-6 | Title | `DECREE THE FIRST` over the parade, music `triumph` already in. |
| 3 | 6-17 | Setup | Brenda, low on her throne: the decree; the sceptre up; "Mostly." The player's flat "What hose tax?" |
| 4 | 17-27 | Explanation | Brenda explains the Tall-One hoses; pause. |
| 5 | 27-38 | Turn | Biker b4 objects ("my auntie"); Brenda overrules him ("a tax with a cardigan"); the four hoses, and the last at Vesper's club. |
| 6 | 38-44 | Job | The player: "Four hoses. Then the club." Brenda: the Turf-Code medal. |
| 7 | 44-50 | Button | The horn, "Now go and be illegal." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on g1 from above(-70,202,2.2) | 45 | tracks the bike | pink lead bike | movement is the hook |
| 2 | title card | none | none | none | the parade's name |
| 3 | `frame` brenda `mcu`, `height: 'low'` | 40 | locked | Brenda | royalty is shot from below |
| 4 | `frame` you `mcu` | 35 | locked | the player | the straight man's question |
| 5 | `frame` brenda `mcu`, low | 40 | locked | Brenda | back to the throne |
| 6 | `frame` b4 `mcu`, toward Brenda | 35 | locked | b4 | the objection gets its own face |
| 7 | `frame` brenda `mcu`, low | 40 | locked | Brenda | the overrule |
| 8 | `frame` you `mcu` | 35 | locked | the player | the job's reply |
| 9 | `frame` brenda `mcu`, low | 40 | locked | Brenda | the medal and the button |

Sides of the line: Brenda and the player on `coverage('brenda','you', 1)` throughout. b4 is shot straight on (he is not
in the two-hander). No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Brenda | Subjects of the Sovereign Republic of New Puddle, hear your Baroness! | the proclamation, 12 words |
| Brenda | By decree, the Hose-Pipe Tax is abolished. Forever. Mostly. | "Mostly" is the joke: a ladder she will climb down later |
| You | What hose tax? | the straight man |
| Brenda | The Tall-One hoses. Lovely, pressurised, and taxed by the metre. | the tax, in her voice |
| Biker b4 | Majesty, the committee is my auntie. Can we not? | the turn: a subject objects |
| Brenda | Overruled. Auntie is a tax with a cardigan. | the overrule, one notch above the objection |
| Brenda | Four hoses shall be kinked in my name, starting with the Greenhouse Strip. | the job, one place named |
| Brenda | And the last, at Vesper's country club. Flood the eighteenth. | the last hose, the date |
| You | Four hoses. Then the club. | the player repeats the job, dry |
| Brenda | Kink them all and you shall receive the Turf-Code violation medal. | the reward |
| Brenda | Now go and be illegal. | the button |

Lore: Brenda, Vesper and the Tall Ones are as the bible and lore define them. Tall-One hoses and the Turf-Code are
existing scene and quest terms; no new canon is needed for this scene.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | ambience `crowd`, music `triumph` | the decree's march |
| 0 | horn on g1 | the gang starts the parade |
| 2.5 | title card | the title is the parade's name; the music holds |
| 27 | none (the triumph bed continues) | the turn is a line, not a sting |
| 44 | horn on the bike | the send-off |

## 9. Blocking and vehicles

- Brenda sits on her throne at her mark (`BRENDA_AT`, beside the throne box). Her gang rides the bank loop (`gang-run`)
  from x -84 toward x -10 at 5.5 m/s; the lead bike is tracked.
- The objecting biker b4 stands at his mark (the biker mark, near the throne).
- The player stands at the throne's mark and ends there (the quest's exit: the drive north to the taps).
- Parked push-bikes (Brenda's own bike, the gang's bikes) stay where the stage puts them; the frame shots are chosen
  on the lounger's side to keep them clear.

## 10. The button

"Now go and be illegal," over the horn, Brenda's hand still up. A monarch's order to break the law is the right last
note for a revolt that is a parade.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; it is not a briefing.
- [x] The hook lands in 3 s (a moving bike, a horn); the first thing is not narration.
- [x] Every line is under 16 words; nobody says what the picture shows; the club is named once as a place.
- [x] Brenda sounds like her bible entry (royal "we" in the decree, proclamations, the sceptre); the player's lines are short.
- [x] Every speaker is framed MCU, low, facing the camera, for their line.
- [x] One side of the line for the two-hander; no crossings.
- [x] Music has a reason at each change; no stingers in this scene.
- [x] Running jokes climb a rung: "Mostly" is the first, Auntie the second.
- [x] `direction.notes` in the scene points at this file.
