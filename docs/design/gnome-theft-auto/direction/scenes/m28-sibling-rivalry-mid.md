# Director's notes: `m28-sibling-rivalry-mid`

Watch it at `?no-intro&cutscene=m28-sibling-rivalry-mid`.

| | |
| --- | --- |
| Scene | `m28-sibling-rivalry-mid` in `src/cutscene/scenes/story/m28-sibling-rivalry.ts` |
| Played by | quest `m28-sibling-rivalry` as its arrival beat, played as the pick-up step starts |
| Kind and length | `arrival`, aim 10-35 s; now 26.0 s at Normal text speed |
| Where, when | stage `thorne-tower-pickup` (the strip at the foot of Thorne Tower), day |
| Before / after | before: the two HOA watchers cracked; after: the passenger step starts with Reginald standing at the kerb and a Ride-On beside him |

## 1. Purpose in the story

Plants Reginald's voice (municipal code, numbers) and the one thing both Vances share: each predicts the other. "She told you not to say so. She always does." is the nearest thing to affection either allows. Sets up the seat that the banter measures all the way to the Tattler.

## 2. The player's feeling

- **In:** the player has just cleared the watchers; the HOA is a pressure, not a joke yet.
- **Out:** the player likes him against their will and is ready for a ride in which he disapproves of everything.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Reginald | to measure the seat | the player's arrival | calipers, not looking up | agrees to ride, stands at the kerb |
| The player | to take him to the Tattler | his pedantry | the straight man | gets a passenger |

## 4. Subtext

- Reginald knows exactly who sent them and what for; his deadpan is a performance.
- "I will ride. I will not enjoy it." is yes.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | click-click: the calipers across the Ride-On seat, an insert, then Reginald from above. |
| 2 | Setup | "Nineteen inches. Municipal maximum, eighteen and three quarters." The player: "Juniper sent me." |
| 3 | Turn | "She told you not to say so. She always does." The permits; "Hedda is a sensible woman." |
| 4 | Button | He shuts the calipers (latch), walks to the kerb: "The seat is an inch over. I will say so, at length." |

## 6. Shot list

The strip insert on the seat, Reginald ms high (looking down on him, the bible's rule outside enforcing), then `coverage('reginald','player',-1)` singles with a push-in on his deciding line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Reginald | Nineteen inches. Municipal maximum, eighteen and three quarters. | the code, the number |
| Player | Juniper sent me. She needs you. | |
| Reginald | She told you not to say so. She always does. | the love, unadmitted |
| Player | Hedda will not print her permits without your word. | |
| Reginald | Hedda is a sensible woman. I will ride. I will not enjoy it. | yes |
| Reginald | The seat is an inch over. I will say so, at length. | button: the complaint is the joke |

Names and canon: `npm run lore -- find` on Juniper, Reginald, Hedda, Frank, Thrift, Peony, the Kicked Board and Hedgeworth; nothing here contradicts those entries and nothing new is named.

## 8. Music and sound

`turfton` music, `street` ambience. Foley: taps (calipers), a latch.

## 9. Blocking and vehicles

Reginald measures at (31.4, -47.2); the Ride-On stands at (33.4, -48.6) and is kept for the ride; the player enters from (20.5, -48.5) to (27.6, -48.6); Reginald ends at the pick-up (28, -48), where the passenger step spawns him.

## 10. The button

He waits at the kerb with the calipers shut; the picture is a gnome who will correct a vehicle at length.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] The hook lands inside 3 s on a picture or a character; no opening narration.
- [x] Every line is 16 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices match the character bible: municipal code and numbers, "four-oh-four dash B" (Reginald); the player short.
- [x] Coverage on one side of the line per pair; the checker reports the scene OK (`npm run cutscene-report`), no waivers.
- [x] Lit and readable: day, or `golden` for dusk and dawn.
- [x] `direction.notes` in the scene points at this file.
