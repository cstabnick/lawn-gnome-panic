# Director's notes: `sq-porcelain-blues-ledger`

| | |
| --- | --- |
| Scene | `sq-porcelain-blues-ledger` in `src/cutscene/scenes/side/porcelainBlues.ts` |
| Played by | quest `sq-porcelain-blues` as beat 1 (after the third scavenger is cracked, before the return to Clara) |
| Kind and length | `arrival` (a mid-quest beat), aim 10-35 s; now 21.2 s (was 17.6 s, 8 faults) |
| Where, when | stage `glaze-tax-office` (the foot of Thorne Tower), `sky: 'noon'` |
| Before / after | before: the third scavenger cracked on the Mossy Wood trail. After: the drive back to the porch, `sq-porcelain-blues-outro` |

## 1. Purpose in the story

A meanwhile that ties the side quest to the main villain: Vesper has been told, and he is not worried. It escalates the
quest's stakes (the player is now on Vesper's books) without a fight, and it gives the payoff's knock a second meaning:
the house is not the only thing watching the porch.

## 2. The player's feeling

- **In:** pleased, three lanterns in the boot.
- **Out:** a chill: the win was noticed, and the man who noticed it collects porcelain.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| HOA Auditor | to be told what to do | Vesper does not raise his voice or his eyes | a report, then a suggestion | sent away with calipers |
| Vesper Thorne | to have the porch, in time | nothing he admits | stillness; complete sentences; a compliment-shaped threat | says the one line he means |

## 4. Subtext

- "Then the porch will be lit tonight." He knows what the lanterns are for, and that he would rather it were dark.
- "Porcelain belongs on a shelf." About Clara, and about himself (his secret: the Tall House).

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-1.6 | Hook | A ledger shuts (`thud`) on a low MS of Vesper; the `villain` theme; the clerk walks behind. |
| 2 | 1.6-13.0 | Setup | The auditor, shot high, reports; Vesper, shot low, answers after a beat; "Shall I send the van, sir?" |
| 3 | 13.0-17.0 | Turn | "Send the calipers. Vans are for things that can be dragged." |
| 4 | 17.0-21.2 | Button | Slow push-in on Vesper; a pause; "Porcelain belongs on a shelf."; `villain` sting. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('vesper','ms',{toward:'auditor',side:30,height:'low'})` | 40 | locked | Vesper | the threat is shot low, alone, with the tower behind |
| 2, 4 | `LEDGER_TALK.single('auditor','mcu',{height:'high'})` | 35 | locked | auditor | the underling, looked down on |
| 3, 5 | `LEDGER_TALK.single('vesper','mcu',{height:'low'})` | 35 | locked | Vesper | matched low singles |
| 6 | dolly on Vesper's eyeline, low, 2.2 m to 1.5 m | 32 | slow push-in | Vesper | the threat, no cut while he talks |

`coverage('vesper','auditor',1)`: one side of the line (the old scene jumped it on the auditor's line).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Auditor | All three scavengers cracked, sir. The lanterns are going back to the porch. | new: the news, said by the one who has to say it |
| Vesper | Then the porch will be lit tonight. | new: calm, and he knows what it means |
| Auditor | Shall I send the van, sir? | kept |
| Vesper | Send the calipers. Vans are for things that can be dragged. | kept: his best line |
| Vesper | Porcelain belongs on a shelf. | kept, now on the push-in, alone |
| ~~Vesper~~ | ~~A scavenger's report. Three lanterns, two porch hooks, one trail...~~ | cut: read the quest's objectives back to the player |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` ambience; `thud` (the ledger); `villain` in (0.6) | Vesper on screen: his theme (bible section 6) |
| 20.0 | `villain` stinger | his entrance sting, once, on the line he means |

## 9. Blocking and vehicles

Vesper on his mark (25, -46) facing the auditor at (21.2, -47.4); the clerk walks the counter behind them. Vesper's
pearl Lowrider parked on its mark. No player actor (a meanwhile: the player stays where they are).

## 10. The button

Vesper's still, low face on "Porcelain belongs on a shelf.", the organ sting under it. Right because it is the only
thing he cares about in the scene, and it reframes the payoff's knock.

## 11. Self-check

- [x] Want, obstacle, turn: the report, the van refused, the shelf.
- [x] Hook (the ledger shuts) at 0 s.
- [x] Lines under 16 words; no waypoint read-out.
- [x] Vesper: complete sentences, no contractions, still, low, alone; no hat line (not his ladder's scene).
- [x] Speakers MCU or MS and facing the camera.
- [x] One side of the line.
- [x] `villain` music and one `villain` sting.
- [x] Day scene.
- [x] Report OK; out of the baseline.
- [x] `npm test` passes; watched at desktop size.
- [x] `direction.notes` points here.
