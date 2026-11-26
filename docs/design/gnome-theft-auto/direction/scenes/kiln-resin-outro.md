# Director's notes: `kiln-resin-outro`

| | |
| --- | --- |
| Scene | `kiln-resin-outro` in `src/cutscene/scenes/story/ch3b.ts` |
| Played by | quest `ch3-kiln-resin-ice` (story row 36) as its outro: the player collects the scroll at Theo's barrel (stage `theo-camp`) after the derby |
| Kind and length | `outro`, aim 15-45 s (max 60); 49.0 s at Normal text speed, no faults |
| Where, when | stage `theo-camp` (Thermos Theo's barrel, north highway); night, `sky: 'night'` |
| Before / after | before: the derby on the ice, the arm glued. After: row 37 (`m37-snowdrop-slope`), the road north to Snowcap Rise |

## 1. Purpose in the story

The first answer to "can the crew survive losing everything": Pip's arm holds. It is a SINCERE beat (bible law 5): no
jokes during the cure, music out, one held silence. The jokes come back only from Pip, once he is coping. Then the
scroll: Tansy writes that Vesper builds the Combine in parts, out at the edges, and the crew must find friends there
(the old Dust Flats line is gone: it moved to `tundra-outro`). Last, a plow's headlamps sweep Theo's bend: the plows know
the camp, so the road north is next. Thermos Theo gets his intro card here. Shelldon is not on screen (his snail is), so
his card goes with the first scene he is in.

## 2. The player's feeling

- **In:** tired and cold, having held the basin.
- **Out:** relief, a warm flicker, and a new purpose with a hard edge: friends at the edges, and the road north.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to know the arm holds and that the player did not leave him | his fear of being left | plain statements, then pride | reads the scroll aloud, takes "friends out there" badly, then well |
| The player | to say the thing that needs saying | their own dryness | a flat answer ("Wasn't going to.", "We have Theo.") | none needed |
| Thermos Theo | to hand over the post and the tea; to warn them | the snail is slow, the plow is close | gossip, tea, a dry joke | points them north |
| Tansy (off screen) | to be found, and to send them on | distance | a short note in her own voice | not seen |

## 4. Subtext

- "You didn't leave me on the apron" is the question; "Wasn't going to" is the answer.
- Tansy's note says "find friends" because she is asking for help, which she never does out loud.
- Theo's "You have a barrel. Which is more than most." is a welcome, from a man who owns a barrel.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | Wide of the barrel under a torch; Theo pours; his card |
| 2 | 6-22 | Sincere | Pip flexes; music out; "It holds." "Wasn't going to."; the silence |
| 3 | 22-34 | Post | The snail; the scroll; Tansy's note as the only caption |
| 4 | 34-44 | Turn | Pip reads it aloud; "We have Theo."; a plow's headlamps sweep the bend |
| 5 | 44-49 | Button | Theo points north; Pip: "North, then. I'll bring the arm." |

## 6. Shot list

Wide `theo-camp` spot, Theo mcu; Pip mcu single; the sincere beat in `coverage('pip', 'player', 1)` singles on one
side (the same coverage carries Pip's reading and the button); snail insert from a low cut; Theo mcu from the other
side; the plow as a cut from the barrel toward the road; Theo turns north.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Theo | Acorn-broth. Burns the throat, warms the soul. | |
| Pip | It holds. / You didn't leave me on the apron. | the sincere beat |
| Player | Wasn't going to. | |
| Theo | Post's here. Shelldon's best, and slowest. | |
| Caption | Vesper builds the Combine in parts, out at the edges. Find friends there. - T. | the scroll, only caption |
| Pip | 'Parts. Out at the edges. Find friends there.' Friends. Out there. | reading aloud |
| Player | We have Theo. | |
| Theo | You have a barrel. Which is more than most. | |
| Theo | They know my bend. Not safe past morning. North's the road, up Snowcap Rise. | the hand-off to row 37 |
| Pip | North, then. I'll bring the arm. It's the warmest thing I own. | |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | wind bed, `warm`; pour and clink | the barrel |
| 11 | music out | the sincere beat |
| 24 | `warm` back, `mystery` stinger, a small bell | the snail |
| 38 | engine rev at the plow, `danger` stinger | the HOA knows the bend |

## 9. Blocking and vehicles

`theo-camp` marks: Theo at the barrel, the player on the snow, Pip to the east. Snail prop at the verge. An HOA plow
(cutscene only, headlamps on) drives the ring road past the bend and does not stop. The player ends beside the barrel.

## 10. The button

Pip's last line, on a mcu, with the cold dark behind him. It lands on the thaw: he is coping, and he is coming north.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; the sincere beat has no gag on top.
- [x] Every line is under 16 words; nobody says what the picture shows.
- [x] One side of the line per conversation; night is lit by the torch.
- [x] `npm run cutscene-report` shows the scene OK.
- [x] `direction.notes` in the scene points at this file.
