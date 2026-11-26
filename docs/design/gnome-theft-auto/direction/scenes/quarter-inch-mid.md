# Director's notes: `quarter-inch-mid`

| | |
| --- | --- |
| Scene | `quarter-inch-mid` in `src/cutscene/scenes/story/m12-*.ts` (m12-quarter-inch-at-home.ts) |
| Played by | quest `m12-quarter-inch-at-home` (arrival at the back fence, after the swap) |
| Kind and length | `arrival`, 35 s (aim 10-35, max 45) at Normal text speed |
| Where, when | stage `townhouse-back-fence`; day, sky noon (the outline's interior scene is staged here: a cutscene cannot play inside an interior pocket) |
| Before / after | after: the swap and the photograph inside 404 (inspect toasts). Before: the outro at the doorframe |

## 1. Purpose in the story
Reginald, using the swapped calipers on his fence, reads everything a quarter-inch over. Funny (the fence was exact at breakfast; ajar is a legal state), then the photograph, played straight: music out, no stinger, one held silence on the player's face, no gag on it. His last line is a man coping, and lets the player go.

## 2. The player's feeling
In: caught. Out: quiet, and sorry for him.

## 3. Beats
Calipers tick; "The fence was exact at breakfast."; the ajar door; "Did you look at the photograph?" / "Yes."; music out; "Eight and ten. She held the ruler. I held the pencil."; silence on the player; "It hangs level. I check it every morning."; he goes back to the post.

## 4. Shots
FENCE_TALK coverage; Reginald shot from above (he is crouched: the bible's high angle); push-in on the question; the silence is a held mcu of the player.

## 5. Music and sound
turfton, garden; music null for the photograph, turfton-dusk back after. No stinger. tap x2.

## 6. The button
Reginald, ms: "The back fence is a quarter-inch low. I will be here a while." and a tap.

## 7. Self-check
- [x] Hook within 3 s on a sound or a character; no narration.
- [x] Every line under 16 words; no coordinates; one side of the line per conversation (`coverage`).
- [x] Voices follow bible section 2; the player's lines are short questions.
- [x] `npm run cutscene-report`: no fault; the line-of-sight check passes (scenes.test.ts).
