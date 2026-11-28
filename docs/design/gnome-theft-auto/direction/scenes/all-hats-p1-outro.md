# Director's notes: `all-hats-p1-outro`

| | |
| --- | --- |
| Scene | `all-hats-p1-outro` in `games/gnome-theft-auto/src/cutscene/scenes/story/m64a-all-hats.ts` |
| Played by | quest `m64-all-hats-p1` as its outro |
| Kind and length | `outro`, aim 15-45 s; 24 s |
| Where, when | stage `m64a-marina` (New Puddle Marina, the east dock), noon |
| Before / after | before: the lead across the Puddle Sea; after: By Air |

## 1. Purpose in the story

"The Queen moored at Brenda's Vinyl Lounge, Samphire saluting": the Vinyl Lounge comes to the Queen (a deck chair between two flamingos on the dock). Baroness and captain admire each other; #44's "everything is a lie except the smuggling" pays off as citizenship. W16 keeps the Queen at this marina afterwards.

## 2. The player's feeling

- **In:** the Queen tied up; the first cross.
- **Out:** water is done, warmly, with a flag that is a flamingo.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Brenda | to make the Queen hers | the Queen belongs to nobody | a decree | gets a smuggler citizen |
| Samphire | to be honest once, theatrically | she is a lie | a bow | salutes a flamingo |

## 4. Subtext

- Two sovereigns of nothing recognising each other.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Wide: the Queen off the dock end, the throne, a bell. |
| 2 | 3-13 | Setup | Citizen, by decree; "Only a lie"; "Then a smuggler." The player nods. |
| 3 | 13-19 | Turn | The biker leans off the dock end; a flamingo on the bow. "Is that a flamingo?" "That is a flag." |
| 4 | 19-24 | Button | Broadside: Samphire salutes, Brenda raises the duster; triumph stinger, bell. |

## 6. Shot list

Stage `wide`; `coverage(brenda, samphire, 1)` singles (Brenda low); biker MS; stage `broadside` for the salute.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Brenda | By decree: the Bathtub Queen is a citizen of New Puddle. | |
| Samphire | Majesty! The Queen has never been a citizen. Only a lie. | #44 |
| Brenda | Then a smuggler. The Republic adores a smuggler. | no "we" (spent in the toll) |
| Samphire | Is that a flamingo? | |
| Brenda | That is a flag. | |

## 8. Music and sound

`water` bed, `turfton`; `triumph` stinger on the salute (the row's music is triumph). Foley: `bell`, `creak`, `squeak` (flamingo).

## 9. Blocking and vehicles

On the dock top (y -4.74): Brenda seated mid-dock (640, 776.6), Samphire stepped off onto the dock end (640, 780.8), the biker at the end corner. The Queen prop off the end (640, 786.4); the player's dinghy (`from: player`) tied alongside; the player ends ashore at the dock root (645.4, 765).

## 10. The button

A salute and a feather duster along a dock, and a flamingo on a toy bow.

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
