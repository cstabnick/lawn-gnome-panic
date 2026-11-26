# Director's notes: `m28-sibling-rivalry-intro`

Watch it at `?no-intro&cutscene=m28-sibling-rivalry-intro`.

| | |
| --- | --- |
| Scene | `m28-sibling-rivalry-intro` in `src/cutscene/scenes/story/m28-sibling-rivalry.ts` |
| Played by | quest `m28-sibling-rivalry` as its intro, given at City Hall |
| Kind and length | `intro`, aim 30-60 s; now 29.0 s at Normal text speed |
| Where, when | stage `city-hall-steps` (the forecourt and the lectern), day, `sky: 'noon'` |
| Before / after | before: the Even-Estates run and the Heap of Trouble convoy; after: the HOA watchers outside Thorne Tower (crack), then the mid scene at the kerb |

## 1. Purpose in the story

Row 28 is the act's laugh after the Heap and before the farm. It sets the Vance double act (they never look at each other while insulting each other) and gives the errand: Hedda prints the Even-Estates permits only when Reginald confirms them, and Juniper will not ask him. It plants the cola can she crushes, and the Thorne Tower look at the end sends the player there.

## 2. The player's feeling

- **In:** the player has just watched convoys leave the Compost Heap and is still wound up.
- **Out:** amused, sure of the errand (fetch Reginald from Thorne Tower, say nothing about who asked) and braced for a double act.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Juniper | to get Reginald's word without asking him | her own pride; the permits need him | deadpan, never looks at the player, rule-quoting | sends the player, still not looking |
| The player | to learn what is missing | Juniper's brisk non-answers | one dry question at a time | takes the errand |

## 4. Subtext

- Juniper is afraid of needing her brother, and hides it behind quarterly overrulings.
- "He has never been wrong. It is his only hobby" is as near to praise as she can say aloud.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook (0-4 s) | Paper on the lectern; "Eleven permits. Ten signatures. One brother." |
| 2 | Setup | Reginald is the missing signature; Hedda prints nothing without it. "Then ask him." |
| 3 | Turn | The cola can at close range; she does not ask Reginald, she overrules him. |
| 4 | Errand | A push-in: fetch him from Thorne Tower; do not say who asked. The player: "He will know." |
| 5 | Button | "It is his only hobby." The can is crushed; a held look up at the tower. |

## 6. Shot list

Singles on both sides of one line (`coverage('juniper','player',1)`): Juniper mcu (hook), player mcu, Juniper mcu, insert on the cola can, Juniper ms low, push-in on Juniper, player reaction, Juniper mcu; the last shot is a still looking up Thorne Tower from the forecourt (a silent beat, 2.6 s).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Eleven permits. Ten signatures. One brother. | the hook; the arithmetic is the joke |
| Player | Reginald? | one word |
| Juniper | Hedda prints nothing until he confirms them. | the stake |
| Player | Then ask him. | the straight man |
| Juniper | I do not ask Reginald things. I overrule him, quarterly. | agrees with the world, insults him by procedure |
| Juniper | Fetch him from Thorne Tower. Do not say I asked. | the objective, one place name |
| Player | He will know. | reaction |
| Juniper | Naturally. He has never been wrong. It is his only hobby. | the bible's "agrees with him" insult |

Names and canon: `npm run lore -- find` on Juniper, Reginald, Hedda, Frank, Thrift, Peony, the Kicked Board and Hedgeworth; nothing here contradicts those entries and nothing new is named.

## 8. Music and sound

`turfton` music, `street` ambience, radio ducked. Foley: paper, a can pop and a gulp, a clink on the crushing, a creak under the tower. No stinger: the scene is a comic opener.

## 9. Blocking and vehicles

Juniper behind the lectern at (16.8, -68.4) facing south down the forecourt; the player walks in from (9.6, -67.4) to (13.2, -67.4) and stays there. She never turns.

## 10. The button

The tower from the steps, silent, with a creak: it is where he is, and the picture tells the player where to go.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] The hook lands inside 3 s on a picture or a character; no opening narration.
- [x] Every line is 16 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices match the character bible: brisk, formal, full sentences, a devastating one-liner (Juniper); the player two words at most.
- [x] Coverage on one side of the line per pair; the checker reports the scene OK (`npm run cutscene-report`), no waivers.
- [x] Lit and readable: day, or `golden` for dusk and dawn.
- [x] `direction.notes` in the scene points at this file.
