# Director's notes: `m50-trellisdown-tasting-intro`

| | |
| --- | --- |
| Scene | `m50-trellisdown-tasting-intro` in `src/cutscene/scenes/story/m50-trellisdown-tasting.ts` |
| Played by | quest `m50-trellisdown-tasting` (Trellisdown Tasting), as its `cutscene`, when the player answers Juniper's call (giver `juniper-call`, the grass by the Burrow Door) |
| Kind and length | `intro`, aim 30-60 s; about 27 s at Normal text speed (a short call, on purpose) |
| Where, when | stage `juniper-terrace-dusk` (Kerb Row, her front step turned into a desk), dusk (`sky: 'golden'`) |
| Before / after | before: Loamdeep and the Burrowfolk (#49); after: the drive west to Trellisdown |

## 1. Purpose in the story

Juniper is a voice on the phone in act III (characters.md): she has found who pays for the money part of the Combine
and she wants a photograph of a signature. The scene sets the quest's costume joke (a seventh waiter, no pie) and
plants Vesper in the room before the player has to be in it. The previously-line: Granny's stolen-back Dew went west
in #17 and the Countess was only glimpsed.

## 2. The player's feeling

- **In:** warm from Loamdeep; the call is a surprise at a mole door.
- **Out:** amused and nervous: a costume job with the villain among the guests. Tension 5.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | to get a signature photographed | she is known, and a councillor is never served | brisk, formal, devastating one-liners; answers the questions we cannot hear | hands the job over, with a warning |

One-sided on purpose: the player is the other end of the line and the camera.

## 4. Subtext

- "Keep your face quiet" is the cost of the job: she knows who will be at the tasting, and what he does with faces.
- She is drawing the ledger on a blotter, not reading a report: she has been through this page in her head already.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | A pencil stops mid-line; a phone rings twice before she lets it. |
| 2 | 5-12 | Setup | "Vance. You sound underground. Good. I have found who pays for the Combine." The blotter, close. |
| 3 | 12-20 | Turn | "A tasting at Brassknock Manor. Combine backers, thimble glasses, her ledger on show." "The caterer wants six waiters. Be the seventh. There will not be pie." |
| 4 | 20-27 | Button | The signature is circled; "Photograph the signed page. Vesper will be there. Keep your face quiet." Click. The terrace in the last gold. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `step` | 50 | locked | Juniper at her blotter | hook |
| 2 | `shot('juniper','mcu')` | 35 | locked | Juniper | the call opens |
| 3 | `shot('juniper','cu',{height:'high',side:30})` | 30 | locked, looking down | the blotter and her pencil | the sketch |
| 4 | `shot('juniper','ms',{height:'low'})` | 40 | locked, low | Juniper | the tasting |
| 5 | `shot('juniper','mcu',{side:-25})` | 35 | locked | Juniper | the costume |
| 6 | the high `cu` again | 30 | locked | the pencil circling | the button line |
| 7 | stage camera `wide` | 50 | locked | the terrace front | final |

She is alone on the step; no line to cross. Waived: `speaker-run` (four lines by Juniper), because a call has one speaker
on screen and the other is the camera.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Vance. You sound underground. Good. I have found who pays for the Combine. | brisk; she never says hello |
| Juniper | A tasting at Brassknock Manor. Combine backers, thimble glasses, her ledger on show. | |
| Juniper | The caterer wants six waiters. Be the seventh. There will not be pie. | answers a question nobody asked |
| Juniper | Photograph the signed page. Vesper will be there. Keep your face quiet. | the objective, in her voice |

Names checked: `npm run lore -- find "Brassknock"`, `"grape-dew"`, `"Juniper"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `street` bed, `turfton-dusk` music | the end of a council day |
| 1, 3 | `phone` twice | two rings before she answers |
| 8, 15 | `paper` | the pencil on the blotter |
| 24 | `phone` (the line closes) | the button |

## 9. Blocking and vehicles

Juniper on her step at (-88.4, 127.6) with a dispatch radio in hand as the handset; a side table with a blotter (`folded-map`)
and a candle (scene props). The player is a hidden actor: no one is on the other side of the table.

## 10. The button

She circles the signature twice, ends the call the way hers always end, and the camera pulls to the quiet terrace at the
last gold. The only thing left on the street is a pencil mark and a parking citation.

## 11. Self-check

- [x] Want (a photograph of a signature), obstacle (she is known), turn (the costume).
- [x] Hook in 3 s: a phone and a stopped pencil; not narration.
- [x] Every line 16 words or fewer; no coordinates.
- [x] Juniper brisk and formal; one one-liner per beat.
- [x] Speaker MCU or closer, facing the lens.
- [x] The four-line run is waived, with the reason above.
- [x] One track, no stingers.
- [x] Vesper planted as a guest.
- [x] Dusk is golden, her blue hat is bright.
- [x] `npm run cutscene-report` OK (1 waived); line of sight passes.
- [x] `direction.notes` points here.
