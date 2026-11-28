# Director's notes: `all-hats-p1-toll`

| | |
| --- | --- |
| Scene | `all-hats-p1-toll` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p1`, the `scene` of its first visit (the Vinyl Lounge) |
| Kind and length | `arrival`, aim 10-35 s; 33 s |
| Where, when | stage `brenda-throne` (the Vinyl Lounge on the drainage canal), noon |
| Before / after | before: the intro; after: the call to the dune cut |

## 1. Purpose in the story

Brenda opens New Puddle to the Queen for one day (her arc lands, #64 p1), her royal "we" twice. The gag at the toll climbs from #11 (fifty acorns) and #32 (the toll is still four spark plugs): now she charges for waiving the toll. She remembers the player by what they paid.

## 2. The player's feeling

- **In:** a drive across town to ask a favour.
- **Out:** New Puddle is open; the Republic stays the Republic; a kazoo horn.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Brenda | to be recognised as a nation | a vessel asking for something | proclamation, low and still | melts at Bilge's name, then taxes the melting |
| The player | an open canal | her decrees | plain asks, a shrug, a purse | gets it at the usual price |

## 4. Subtext

- She fears an HOA fine for excessive leisure; opening the canal to a smuggler is defiance as hospitality.
- "We adore Captain Bilge": mutual admiration (characters.md).

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Wide of the bank, a bike bell, a biker folding his arms. |
| 2 | 3-14 | Setup | "The Republic remembers you"; "Not since the Hose Revolt". The biker shrugs. |
| 3 | 14-22 | Turn | "It's the Bathtub Queen." Push-in: "We adore Captain Bilge." Decree: open, toll waived. |
| 4 | 22-29 | Gag | "The waiver is four spark plugs." Two-shot: a shrug, a purse, a clink. |
| 5 | 29-33 | Button | Wide: the bunting gone off the water; the gold bike's kazoo horn. |

## 6. Shot list

Stage `wide`; `coverage(brenda, player, -1)` with Brenda always low (royalty); biker reaction; `pushIn` on the turn; `two(ms)` locked off for the gag; stage `wide` for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Brenda | Halt, vessel! The Republic remembers you. Fifty acorns, then four spark plugs. | remembers #11 and #32 |
| You | A ship needs New Puddle. For one day. | |
| Brenda | Not since the Hose Revolt have we opened New Puddle to anyone. | "we" 1 |
| You | It's the Bathtub Queen. | |
| Brenda | Captain Bilge? We adore Captain Bilge. | "we" 2 |
| Brenda | By decree: New Puddle is open. One day. The toll is waived. | |
| Brenda | The waiver is four spark plugs. | the gag at the toll |

## 8. Music and sound

`water` bed, `triumph` (her proclamations, as in m32). Foley: `bell`, `creak` (throne), `clink` (purse), `whoosh` (bunting down), the gold bike's horn.

## 9. Blocking and vehicles

Brenda beside the throne (-44.8, 218), the player on the bank (-40, 214), two pink bikers; the gold bike on its mark; a `bunting-span` across the canal at x -30 (cutscene-only). The player ends on foot on the bank.

## 10. The button

The empty water where the bunting was, and a kazoo: the Republic says yes in its own voice.

## 11. Self-check

- [x] Want, obstacle and turn; not a briefing.
- [x] Hook in 3 s on a picture and a sound, not narration.
- [x] Every line under 16 words; no coordinates; nobody describes the picture.
- [x] Voices per bible section 2 and characters.md.
- [x] Speakers MCU/MS on the eyeline; reactions after the big lines.
- [x] One side of the line per pair (`coverage`), no crossing faults.
- [x] Music changes have reasons; at most one stinger; no held silence (not a sincere scene).
- [x] Running jokes climb a rung (section 1).
- [x] Day scene: no lighting problem.
- [x] `npm run cutscene-report`: OK, not in Variety or Sound; `scenes.test.ts` (line of sight) passes.
- [x] `direction.notes` points here.
