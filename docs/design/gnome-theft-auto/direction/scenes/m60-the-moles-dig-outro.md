# Director's notes: `m60-the-moles-dig-outro`

| | |
| --- | --- |
| Scene | `m60-the-moles-dig-outro` in `src/cutscene/scenes/story/m60-the-moles-dig.ts` |
| Played by | quest `m60-the-moles-dig` (The Moles Dig) as its outro, when the player reaches the armory |
| Kind and length | `outro`, aim 15-45 s; about 35 s at Normal text speed |
| Where, when | stage `m60-armory-night`: the armory yard inside Fort Sandpit, night (`sky: 'night'`) |
| Before / after | before: `m60-the-moles-dig-mid` (the floor opens) and the walk through the gate; after: W15 (coalition colours on the gate) and the road back |

## 1. Purpose in the story

Commander Diggs salutes a mole. It is the turn of his arc from hardliner to ally: he has been asked to accept something from someone
with no rank, no hat and no gun, and what moves him is that the mole does the one thing the whole Spade Guard has never done
right. It pays off the intro ("A bow is not a salute." "I shall practise, sir.") and the act's mole ladder, and gives the Guard
the comedy beat: the mole is the only one in the fort who salutes correctly.

## 2. The player's feeling

- **In:** up through the gate in the dark, tired, ready to see an open armory.
- **Out:** moved, and amused to be moved: a friend has been promoted and a commander has been softened.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Nubbin | to report in correctly | the whole of the surface | courtesy, a rehearsed salute | made Corporal; protests; is told "Corporal." |
| Commander Diggs | to keep the fort in order | the Guard's salutes, the surprise of a mole in his floor | clipped orders; a held gesture | returns the salute: the turn |
| Spade Guard (two) | to salute | they cannot | a late tip of a hat, a wave | copy the mole, right hand, at the end |
| The player | to see it | none | silent: a nod | |

## 4. Subtext

- "Fifteen years, and nobody did it correctly" is the loneliest line Diggs has: he has been alone with a standard no one met.
- A salute from someone with no rank is the first proof that the standard was worth keeping.
- Nubbin is only the post: his refusal of the rank is the politest possible way of accepting it.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Ground level at the mound: a paw on the rim, then a head, then the rest of him, coming up out of the floor. |
| 2 | 3-6 | Setup | Nubbin dusts his satchel: "Pardon the floor, sir." Diggs, low and still. |
| 3 | 6-12 | The salute | Nubbin stands as straight as a mole can: "Nubbin, post runner. Reporting for digging, sir. I practised." A perfect salute, held. |
| 4 | 12-18 | The gag | The Guard, behind the Commander: one tips late, one waves. "Spade Guard. Observe. That is a salute." "Fifteen years, and nobody did it correctly." |
| 5 | 18-22 | Turn | The `sandpit` march comes in. Diggs's hand rises into frame from above and holds, at a mole's eye line, in near silence. |
| 6 | 22-29 | Resolution | "Effective immediately: Corporal." "Most kind. But I am only the post, sir." "Corporal." |
| 7 | 29-35 | Button | The diggers file up behind him with pickaxes at their brows; the Guard copies, right hand this time; the bolts slide from inside and the tool wall lights. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `floor` | 40, ground level | locked | the mound; the mole climbing out | hook, at the mole's eye line |
| 2 | `MOLE_UP.single('nubbin','mcu')`, then `single('diggs','mcu',{height:'low'})` | 35 | locked | the apology; Diggs | setup |
| 3 | `pushIn('nubbin','mcu',4.2,{to:'cu'})` | 35 -> 30 | slow push | Nubbin saluting | the salute |
| 4 | a locked wide from the yard's south side | 46 | locked | the two Guard, one tipping, one waving | a held reaction: the gag |
| 5 | `MOLE_UP.single('diggs','mcu'/'cu',{height:'low'})` | 35 / 30, low | locked | Diggs | "Observe", "fifteen years" |
| 6 | `shot('diggs','mcu',{toward:'nubbin',side:12,height:'low'})` | 35, low | locked, held 3 s | Diggs's salute coming from above | the turn |
| 7 | `MOLE_UP.single('diggs'/'nubbin',...)` | 35 / 30 | locked | the rank; the protest | resolution |
| 8 | stage camera `yard`, then a reaction on the player | 50 / 35 | locked | the diggers, the Guard, the lit tool wall; the player | button |

Nubbin and Diggs share `coverage('nubbin','diggs',1)`. Moles at their own eye line; the salute from above, then held.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Nubbin | Pardon the floor, sir. | the post's polite apology |
| Nubbin | Nubbin, post runner. Reporting for digging, sir. I practised. | the setup paid off |
| Diggs | Spade Guard. Observe. That is a salute. | orders, no adjectives; says it without turning |
| Diggs | Fifteen years, and nobody did it correctly. | the sincere line, no gag on it |
| Diggs | Effective immediately: Corporal. | the rank |
| Nubbin | Most kind. But I am only the post, sir. | refuses and accepts |
| Diggs | Corporal. | the final word |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `mystery` music, `night` bed; `shovel`, `rustle` | the floor giving up a mole |
| 10.4 | `cloth` | the two Guard fumbling their salutes |
| 18.5 | music to `sandpit` (1.6 s crossfade) | the Guard's own march, warm for the first time; the salute |
| 28.8 | `rustle` (the diggers) | the file up out of the floor |
| 31-32 | `latch`, `door` | the bolts slide from inside |

## 9. Blocking and vehicles

Hole at (375, 9). Nubbin climbs out (a rising walk from just under the mound) to (375, 11.6) facing Diggs; Diggs stands at (375, 14.4)
facing the hole, hands empty; the Guard at (371.4, 15) and (378.6, 15.2); the diggers surface later at (372.8, 11.8) and (377.2, 12);
the player at (378.6, 19.6). The set is scene props: container, notice, pegboard with three spades, lanterns, sandbags, the mound, and
a lantern post that is spawned at the end to light the tool wall. No vehicles.

## 10. The button

A line of tiny salutes and two big ones in a lit yard, a bolt sliding back inside a steel box, and a commander who has just learned
that the standard he held alone was held by someone else as well. The last sound is the bolt: the armory is open.

## 11. Self-check

- [x] Want (report in correctly / keep order), obstacle (surprise; the Guard), turn (the returned salute).
- [x] Hook in 3 s.
- [x] Every line 11 words or fewer; no gag on "Fifteen years".
- [x] Nubbin soft and formal; Diggs clipped, no contractions.
- [x] Speakers MCU or closer; one side of the line; moles at eye level; no looking down on a mole in a two-shot.
- [x] Music change has a reason; no stinger; no held silence beyond the 3 s salute.
- [x] Night scene is lit: lanterns and a lit tool wall.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
