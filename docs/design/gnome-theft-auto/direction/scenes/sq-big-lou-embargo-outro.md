# Director's notes: `sq-big-lou-embargo-outro`

Re-directed against [../bible.md](../bible.md) and the template in [../TEMPLATE.md](../TEMPLATE.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=sq-big-lou-embargo-outro`.

| | |
| --- | --- |
| Scene | `sq-big-lou-embargo-outro` in `src/cutscene/scenes/side/bigLou.ts` |
| Played by | quest `sq-big-lou-embargo` as its outro (the VIP car delivered to the rope) |
| Kind and length | `outro`, aim 15-45 s; now about 38 s at Normal text speed (was 66.4 s, 10 faults: over the 60 s limit) |
| Where, when | stage `gnomecino-door` (the rope and the VIP drop on the x = 60 road), dusk: `sky: 'golden'` |
| Before / after | before: the player drove the Zero-Turn across downtown (the second objective). After: the quest's done text, the bowler in the player's hand |

## 1. Purpose in the story

The VIP car must reach the Gnomecino without a smudge; Lou inspects it at the rope and decides. The payoff of the quest
is Lou's one sentence longer than two words, said as he hands over his own bowler: the dry-hat rule has bent for the
player. Everything else in the scene is short, dry and quick.

## 2. The player's feeling

- **In:** having driven the VIP car through the city without a mark on it, proud and a little wary of Lou.
- **Out:** the door is open, the bowler is theirs, and Lou's respect is hard-won and unsentimental.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Big Lou | to find a speck on the car, and to see the player keep it dry | the car is clean, so he has to choose | two-word verdicts, a long sentence only once | lets the player in, gives the bowler |
| The player | to be let in without argument | Lou's dryness, the car's dust | one short defence | is given the bowler |

## 4. Subtext

- Lou's "Dusty is a word for other people." is a dry joke about the car, and a confession: the player is not "other
  people". It is the only time Lou says more than two words.
- The bowler is Lou's own. Giving it is the rope lifted, without a rope moving.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | The VIP Zero-Turn rolls up the x = 60 road to the rope; the camera tracks it (a move). |
| 2 | 5-11 | Setup | Lou walks the flank; the caption "WHITE-GLOVE INSPECTION. ONE PASS." (the one caption). Lou, low, looks at the car: "Hm." "Not a speck." |
| 3 | 11-16 | Reply | The player, in the car: "It's a Zero-Turn. It was always going to have a speck." |
| 4 | 16-19 | Turn | Lou, low: "Dry." The player climbs out (2.2 s). |
| 5 | 19-25 | Payoff | The player at the rope; Lou, low, the one sentence longer than two words: "Dusty is a word for other people." |
| 6 | 25-31 | Hand-over | Lou holds the bowler; gives it to the player; the `triumph` stinger; "Keep it dry." |
| 7 | 31-38 | Button | Lou's bow (the rope lifted for the player); the camera pulls back on the two of them; a held beat. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` pos above(66.5, -36, 1.0) on `zt` | 38 | tracks the car | the Zero-Turn | the car is the hook |
| 2 | `face` Lou to the car, then `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | Lou's inspection, low and heroic |
| 3 | `TALK.single('you','mcu')` | 35 | locked | the player | the player's one defence |
| 4 | `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | "Dry." |
| 5 | `TALK.single('you','mcu')` | 35 | locked | the player | the player out of the car, reads the bowler |
| 6 | `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | the payoff sentence |
| 7 | `TALK.single('lou','mcu',{height:'low'})` | 35, low | locked | Lou | the hand-over |
| 8 | `dolly` from above(64.4, -23.6, 2.0) to above(66, -20, 4) on `you` | 40 | dolly, 5 s | the two of them | the pull-back for the button |

Sides of the line: Lou and the player on `coverage('lou','you', 1)` throughout (the car is not a second speaker).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lou | Hm. | kept: the inspection |
| Lou | Not a speck. | kept: the verdict |
| Player | It's a Zero-Turn. It was always going to have a speck. | kept: the one defence (12 words) |
| Lou | Dry. | was "Dusty is a word for other people." as the answer; now "Dry." (one word), the payoff moved to the rope |
| Lou | Dusty is a word for other people. | the payoff: Lou's one sentence longer than two words, said at the rope, not at the car |
| Lou | Keep it dry. | was "Lou's own. Keep it dry.": the ownership is in the hand-over itself; the line is now the hand-over's last word |
| ~~Mayor~~ | ~~Evening, Lou. Fresh coat. Ribbon-cutting at ten.~~ | cut: the Mayor's arrival was a second scene's worth of beats; the intro set his glaze and the rule already |
| ~~Lou~~ | ~~Dry head. Round the back for damp ones.~~ | cut: said the rule again; the intro says it |
| ~~Mayor~~ | ~~It's a different glaze.~~ | cut here (kept in the intro) |

Names checked: `npm run lore -- find "big lou"`, `npm run lore -- find "the-gnomecino"` (the bowler: a microfibre bowler,
Lou's own).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `heist` music, `night` ambience; the car's engine is the sound | the heist is over; the car is the last test |
| 31 | `triumph` stinger on the hand-over | the one stinger: the rope has lifted |
| 31-38 | the music carries under the bow | the scene ends on a win, not a reveal |

No held silence: the outro ends on the bow and the pull-back.

## 9. Blocking and vehicles

- The Zero-Turn drives from (62.5, -6) to (62.5, -30) on the x = 60 road (its approach path), with the player seated at
  seat 0.
- Lou walks from the rope (70, -30) to the car's flank (65, -33) and stands facing the car; then turns to the player.
- The player exits the car (2.2 s), walks to (64, -28.5) at the rope, facing Lou.
- Lou holds the bowler, gives it to the player, bows. The Mayor is no longer in this scene.

## 10. The button

Lou's bow at the rope, the player with the bowler, the camera drawing back on the two of them under the neon: the
rope has lifted, and nobody has to say it. It is the right last moment because it is the reward the whole embargo
built towards, and it is said in gesture.

## 11. Self-check

- [x] The scene has a want (the car clean, the player let in), an obstacle (the speck), and a turn (Lou's "Dry.") and a
      payoff (the bowler).
- [x] The hook lands in 0 s: the car rolling in, the camera tracking it.
- [x] Every line under 16 words (longest 12); no coordinates; the car is not described by the narrator.
- [x] Voices: Lou's lines are one or two words except the one payoff sentence, which is seven words; the player's lines
      are short.
- [x] Every speaker is framed close, low for Lou, and turned to the listener.
- [x] One side of the line for Lou and the player; no crossing.
- [x] Music has a reason; one stinger; no held silence.
- [x] Dusk: `sky: 'golden'`.
- [x] Report: OK at 37.9 s (was 66.4 s, 10 faults); the over-60 s fault is gone.
- [x] `direction.notes` in the scene points at this file.
