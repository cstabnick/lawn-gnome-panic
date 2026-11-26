# Director's notes: `parade-permits-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=parade-permits-intro`.

| | |
| --- | --- |
| Scene | `parade-permits-intro` in `src/cutscene/scenes/story/m15-founders-boot.ts` |
| Played by | quest `ch1-founders-boot-p1` (Parade Permits) as its intro, taken at Side-Valve |
| Kind and length | `intro`, aim 30-60 s; 36.3 s, no faults |
| Where, when | stages `side-valve-bay`, then `tattler-parade-desk` (the Kiln-Shield kerb across the z = -60 road from the Amphitheater); morning, `sky: 'noon'` |
| Before / after | before: Drainpipe Court (row 14, Pip's sincere bench). After: the parade office behind City Hall (visit, 1 hat), the search, the keys to the bay |

## 1. Purpose in the story

Opens the act I turn. Founder's Boot starts as a small comic errand: find the float's keys. It introduces Hedda Galley
(first story appearance, intro card) and plants the tribunal: a bailiff is taping the banner up across the road. Hedda
pays Juniper's favour and names her price, the front page: the press is now on the crew's side, which the final's outro
pays off with her headline.

## 2. The player's feeling

- **In:** warm and a little quiet after Pip's bench. The tone climbs back to comedy at once.
- **Out:** a clear job (parade office, the Mayor's cigar box), a new ally with a price, and the tribunal on the way.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | get the Boot's keys without asking City Hall | nobody at City Hall knows | three short clauses, a name | hands the job over |
| Hedda | the front page | the bailiff across the road, her own rule against corrections | telegrams; never stops walking | has her exclusive |
| Player | the keys | Hedda talks in headlines | two words, a question | has the place and the deal |
| Bailiff | the banner up, the crowd barred | being watched by the press | a stare, crossed arms | has noticed them (the tribunal knows the press is coming) |

## 4. Subtext

Hedda's line about the tribunal is a headline because she already knows how the week will end. She is paying a debt to
Juniper and buying a story with the same sentence. Tansy says "City Hall can't find the keys": she does not trust the
Council either, yet.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-9 | Hook | Tansy with the Trim Day programme (paper rustle): the lost keys; a low ms: Hedda's name and who she owes |
| 2 | 9-15 | Place | The parade desk wide, the player walking up; Hedda's view across the road: the bailiff taping the banner |
| 3 | 15-23 | Setup | Hedda reads her own headline; her intro card on an mcu |
| 4 | 23-29 | The ask | "The Boot float's keys?" / "Parade office. Behind City Hall. Mayor's cigar box." / "Juniper's favour. Paid in full." |
| 5 | 29-33 | Turn | The bailiff turns and crosses his arms at them; push-in on Hedda: "One condition. The front page is mine." "Deal." |
| 6 | 33-36 | Button | Hedda already walking away, writing: "Boot. Tribunal. Exclusive. Go." |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `frame` mcu Tansy toward the player, side -25 | 35 | locked | Tansy and the programme | the problem, in her face |
| 2 | `frame` ms Tansy low, side -40 | 40 | locked | Tansy | the name; a new size so the hold stays under 7 s |
| 3 | `spot` desk-wide | 52 | locked | the desk, kiosk, the player walking in | establishing the place |
| 4 | `spot` across | 40 | locked | the bailiff taping the banner | the tribunal is being built (L95 moment) |
| 5-6 | `coverage(hedda, player)` ms, then mcu + intro card | 35-40 | locked | Hedda | her first line, then her card |
| 7-8 | coverage singles player / Hedda | 35 | locked | the exchange | one side of their line |
| 9 | `frame` ms bailiff toward Hedda | 40 | locked | the stare | the turn: they are noticed |
| 10 | `pushIn` Hedda mcu -> cu | 35 | push | Hedda's price | a decision |
| 11 | coverage single player | 35 | locked | "Deal." | the player's short line |
| 12 | `frame` ms Hedda walking | 40 | locked | the button | she never stops walking |

Hedda and the player are shot from one side (`coverage('hedda', 'player', 1)`); the bailiff is a separate set-up.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | Parade's Saturday. Nobody at City Hall can find the Boot's keys. | who, what, why now |
| Tansy | Hedda Galley edits the Tattler. She owes Juniper. She finds things. | names Hedda and her relation (context rule) |
| Hedda | Tribunal. Trim Day. Crowd barred. Headline writes itself. | first line: a headline, present tense, no verbs to speak of |
| You | The Boot float's keys? | the straight man's question |
| Hedda | Parade office. Behind City Hall. Mayor's cigar box. | the objective, one place name |
| Hedda | Juniper's favour. Paid in full. | the debt the outline names |
| Hedda | One condition. The front page is mine. | the turn: her want |
| You | Deal. | |
| Hedda | Boot. Tribunal. Exclusive. Go. | the button, a telegram |

Lore checked: `npm run lore -- find Tattler`, `find Hedda`, `find parade`. The Tattler Building's block is Founders'
Green now (world.ts builds no tower on park blocks), so Hedda works parade week from a street desk; reported to the lead.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton`, `street` bed; `paper` at Tansy | the crew's world; the programme |
| 9-12 | `tap` x2 at the bailiff | the banner being taped up, heard before it is seen close |
| 15 | `paper` at Hedda | her proof |
| 33 | the intro stinger is the card's own | no other stinger |

## 9. Blocking and vehicles

Player starts at the bay (-148.5, 70.5) facing Tansy, then is re-spawned on the road at (-96, -55.5) and walks to the desk
mark (-96, -51.2): the quest leaves the player at the Tattler desk. Hedda paces behind the desk (-94.4 then -97.2, -46.2).
The bailiff stands across the road at (-93.5, -65.6) by the banner prop (-95.6, -66.4). No vehicles.

## 10. The button

Hedda walking off mid-telegram, not looking back: "Boot. Tribunal. Exclusive. Go." The job and the deal in four words.

## 11. Self-check

- [x] Want (keys), obstacle (nobody knows; the bailiff), turn (the stare and Hedda's price).
- [x] Hook at 0 s: a sound and Tansy's line; no narration.
- [x] Lines under 16 words; one place name per answer; no coordinates.
- [x] Hedda's telegrams; the player's lines are two words or fewer than five.
- [x] Speakers framed ms or closer; one side of the Hedda-player line.
- [x] One intro card (Hedda), after her first line, on an mcu.
- [x] Checker: 36.3 s, 0 faults; scenes.test line of sight passes.
