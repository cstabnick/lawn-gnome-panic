# Director's notes: `all-hats-p1-intro`

| | |
| --- | --- |
| Scene | `all-hats-p1-intro` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p1` (By Water) as its intro |
| Kind and length | `intro`, aim 30-60 s; 49 s at Normal |
| Where, when | stage `m64a-overlook-rail` (the east lip of the Dust Flats overlook, over the highway bend), dawn, `sky: golden` |
| Before / after | before: m63 Four Taps (the Don's four taps); after: the drive to the Vinyl Lounge |

## 1. Purpose in the story

Opens All Hats, the high of act IV. Pays off Tansy's act IV change (she lets Pip run a plan: she reaches for the sock and hands it back, "Ask the planner") and plants the four crosses (water, air, road, root) that each part ticks off. The sock-map thread from #38-39: this is the other sock.

## 2. The player's feeling

- **In:** back after the Don's taps; the overlook at first light.
- **Out:** the plan is Pip's, four ways to one table, water first: Brenda must open New Puddle. A laugh on Pip's arithmetic.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to hand the coalition plan to Pip | her habit of running everything | three dry clauses, then a gesture instead of an order | gives the plan away |
| Pip | to be useful, out loud | nobody has ever let him finish | speed, exclamation marks, a sock | finds out he is the planner, and is not ready |
| The player | to know the job | the plan is on a sock | short, dry questions | knows the first stop |

## 4. Subtext

- Tansy fears losing what she built; giving Pip the plan is trust, not fatigue. Nobody says so.
- Pip's "rounding" is the family embarrassment he fears, turned into a joke by himself.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Dawn wide of the rail, the sock snapping, Pip hopping. |
| 2 | 3-20 | Setup | The previously (the Don's taps); four ways to one table; "On a sock." Insert of the crosses. |
| 3 | 20-33 | Setup | Water first: the Queen up the dune cut; Brenda tolls anything that floats. |
| 4 | 33-40 | Turn | Push-in on Tansy; she hands the sock to Pip: "Ask the planner." Pip CU, a gulp. |
| 5 | 40-49 | Button | "Bring spark plugs." "She takes four." "Then bring five. Rounding!" Tansy folds her arms. |

## 6. Shot list

Stage `wide` (54) to open; `coverage(tansy, player, -1)` singles for Tansy and the player, `coverage(pip, tansy, 1)` for Pip; `insert(tansy)` on the sock; `pushIn(tansy)` on the turn; Pip CU for the realisation; `PIP_TALK.two(ms)` locked off for the gag; Tansy MCU for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | The Don tapped four times. His crews are in. | previously, in one breath |
| Tansy | Now everybody else. Pip? | gives the floor away |
| Pip | Four ways to one table! By water, by air, by road, by root! | the plan |
| You | On a sock. | |
| Pip | The other sock! The first one found the Combine. This one finds us. | sock-map thread |
| Tansy | Water first. Captain Bilge brings the Queen up the dune cut. | |
| Pip | Through New Puddle! Brenda tolls anything that floats and has opinions! | Brenda's own definition, #32 |
| You | Will she open it? | |
| Tansy | Ask the planner. | the turn |
| Pip | ...I'm the planner. | |
| Pip | Okay! Be nice to her. Bring spark plugs. | |
| You | She takes four. | the player remembers #32 |
| Pip | Then bring five. Rounding! | bad at numbers |

No "Okay, hear me out" (spent in #54 and #57).

## 8. Music and sound

`wind` bed, `turfton` (the crew's world). Foley: `flutter` (sock), `cloth` (insert), `gulp` (Pip), `tap` (Tansy). No stinger.

## 9. Blocking and vehicles

Tansy at the rail (286.6, 35.4) holding the `sock-map`, Pip at her elbow (285.8, 38.6), the player in from the map table (283.2, 36.4). Scene props: a `split-rail-fence` along the lip, a crate and a pen pail. The player ends on foot where they stand.

## 10. The button

Tansy's folded arms over Pip's "Rounding!": the old boss letting it go. A laugh, then the road.

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
