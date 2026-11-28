# Director's notes: `m34-forty-seven-wrenches-mid`

| | |
| --- | --- |
| Scene | `m34-forty-seven-wrenches-mid` in `src/cutscene/scenes/story/m34-forty-seven-wrenches.ts` |
| Played by | quest `m34-forty-seven-wrenches`, the final `visit` at the bay (`scene:`), after the third guest is dropped |
| Kind and length | `arrival`, aim 10-35 s, max 45; now about 43 s: the act's warm high point earns the extra |
| Where, when | stage `side-valve-bay` at the wrench wall and the bench; dusk, `sky: 'golden'` |
| Before / after | before: three passenger runs, each guest dropped at the apron. After: the night outro, Cam's call |

## 1. Purpose in the story

The one party in the game. Tansy counts her forty-seven wrenches aloud with the cigar box in shot and tells the story of the
empty hook, and stops short of the forty-eighth: the brass wrench stays boxed (the bible ladder). Cam sweeps in the corner
and looks at the box. The cost of the act is coming and nobody at the party knows.

## 2. The player's feeling

- **In:** pleased with themself: three guests delivered, the bay hung with bunting.
- **Out:** warm, and a little uneasy: a sentence stopped halfway, and the sweeper looking at a box.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | a speech from Tansy | Tansy | volume, "Speech!" | gets a toast instead |
| Tansy | to be thanked without saying thank-you | her own habit of giving inventories | counts, dry, then a story, then food | stops the story, eats pie |
| Juniper | to be exact | nothing | one dry observation | spots the empty hook |
| Granny | to feed everyone | the silence | "sugar", pie | breaks the silence |
| Bodega | to price the pie | nobody asked | flat tic | the laugh after the sincere beat |
| Cam | to look at the box | being seen | broom, stillness | the button |

## 4. Subtext

Tansy's secret is the brass forty-eighth, and whether the Clayfoot name is hers. "That one is for the day we..." is what she
cannot finish. Cam's stillness is the planted motive: he knows what is in the box, and the call is already arranged.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The dolly across the apron under the bunting, the party full of clinks. |
| 2 | 4-8 | Setup | Pip: "Speech, Tansy! Speech!" |
| 3 | 8-14 | Count | Tansy counts the wall aloud: "Forty-five. Forty-six. Forty-seven. All present." Juniper spots the extra hook. |
| 4 | 14-30 | The story | Music drops. Gnorwin hung them in size order, one for every job. The player asks about the last hook: brass, biggest of all. Dolly to the shut cigar box. "That one is for the day we..." and silence. |
| 5 | 30-38 | Release | "Eat your pie." Granny: "Hush now, sugar." Bodega: "Pie. Not for sale. Six acorns." Pip: "To the Green!" |
| 6 | 38-43 | Button | Under the cheer, Cam's broom stops. He looks at the cigar box. |

## 6. Shot list

| # | Shot | Move | On | Motivation |
| --- | --- | --- | --- | --- |
| 1 | dolly across the apron | slow | the bay and the bunting | establishing |
| 2-4 | `TALK.single` of Pip, Tansy (ms) | locked | the speech request, the count | the rack is behind Tansy |
| 5-7 | `JT.single` of Juniper and Tansy; `TP.single` of the player and Tansy (mcu) | locked | the story | sincere, still |
| 8 | dolly onto the cigar box | slow push | the box | the held look |
| 9 | `TP.single('tansy','cu')` | locked | the stopped sentence | the held silence |
| 10-12 | `GT`, `GB`, `BP` singles | locked | Granny, Bodega, Pip | the release |
| 13 | `shot('turncoat','ms')` | locked | Cam | the button |

Sides: each pair on its own `coverage`, one side per pair, so the checker reports no crossings.

## 7. Dialogue pass

All lines are under 16 words; Tansy's voice is short and dry, Granny says "sugar" once, Bodega states a price for a thing that
is not for sale. Names checked: `npm run lore -- find "Gnorwin"`, `"Clayfoot"`. The forty-eighth is never named a heist object.

## 8. Music and sound

`warm` and a `crowd` bed; clinks at the hook and the toast; `mystery` under the story; a tap on the box; `warm` returns on
"Eat your pie."

## 9. Blocking and vehicles

Tansy at (-155, 73.6) facing the party, the rack behind her at (-157.6, 74.2) and the cigar box on the bench at
(-156.9, 76.1); Pip (-148.8, 72.2), Granny with a pie tin (-151, 74.8), Juniper (-148.4, 75), John with a broom (-145.6, 73.2);
Cam at the storeroom mark. Bunting spans along the front and across the apron; a table of pie at (-140, 76). The W07
world change puts the same props in the open world afterwards.

## 10. The button

Cam's broom stops. No line: the only picture that says "something is wrong" in the whole party.

## 11. Self-check

- [x] The sincere beat has no gag on top; Bodega's tic comes after the silence is broken.
- [x] The cigar box is in shot and shut; the forty-eighth is never shown.
- [x] Checker: zero faults; length over the aim by 8 s, under the max.
- [x] `direction.notes` points here.
