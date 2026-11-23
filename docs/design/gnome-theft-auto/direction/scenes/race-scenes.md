# Director's notes: the Fizz Cup race scenes (`race-*-intro`, `race-*-podium`)

Eight scenes from two functions: `raceIntro` and `racePodium` in `src/cutscene/scenes/speedway.ts`. The staging is
shared; each race's rival, stakes and turn are data (`RACE_INTROS`, `RACE_PODIUMS` in `src/quests/races.ts`). Watch with
`?no-intro&cutscene=race-<id>-intro`, or play one for real with `?race=1..4`.

| | |
| --- | --- |
| Scenes | `race-rookie-mowdown-intro/-podium`, `race-lowrider-derby-intro/-podium`, `race-snail-endurance-intro/-podium`, `race-fizz-cup-final-intro/-podium` |
| Played by | the four Fizz Cup quests (`quests/races.ts`): the intro when the race is taken at Burdock's race desk, the podium as the quest's payoff after a win |
| Kind and length | `race-intro`, aim 15-30 s: now 26-30 s (was 29-43 s, 4-14 faults each). `race-podium`, aim 10-22 s: now 17-18 s (was 22-24 s, 3-4 faults each) |
| Where, when | the Lost & Found Speedway grid and pit lane (`raceTrack/track.ts`: `gridSlot`, `PODIUM`); the player's sky |
| Before / after | intro: the race desk, then the race itself (the player is put in the last grid slot). Podium: the finish line, then the reward banner |

## 1. Purpose in the story

The Fizz Cup is the game's sports subplot: four rungs of a ladder (rookies, the Carburettors, a snail, the Final), each
won by a different kind of gnome. The scenes exist to make each race feel like a grudge match rather than a menu item:
who you are racing, why they care, and one laugh, in under half a minute, because the player came here to drive.
Ties to the main story, one per race: Burdock's Hat Watch past (rookie), the Carburettors against Vesper's silent carts
(derby), Snail-Mail Express and Shelldon's gravel (endurance), Dock Hoewright as Pip's cousin (the Final).

The old scenes opened on a 6.5 s crane with nothing happening, played Burdock's lines on a wide from behind his hat,
read the player their grid slot in a caption, and put Burdock off screen on every podium.

## 2. The player's feeling

- **In:** keen to race; has just walked up to the desk (intro) or crossed the line first (podium).
- **Out:** intro: "I want to beat that one", and a smile. Podium: a win, and the runner-up's face.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Burdock "Big Flag" Bellweather | a clean race and a full grandstand | rivals who heckle, a rookie who asks about the towel | ritual (he counts the grid twice, out loud), commentator's patter, the tea towel | starts the race |
| The race's rival | to rattle the rookie before the lights | the rookie's flat calm | taunt, brag, a show of their machine (engine, horn) | promises to beat you |
| The player | to get in the car | everybody talking | one dry question | walks to the last slot |

## 4. Subtext

- Burdock takes his job more seriously than anyone has ever taken a tea towel; the comedy is that he is right to.
- Each rival is afraid of losing to a nobody (Vinnie most of all); the taunt is the fear.

## 5. Beat sheet (intro, shared)

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3.4 | Hook | A short crane from over the grandstand onto the grid; the pole car's engine barks at once. Burdock sets off down the grid; the rivals pose by their cars. |
| 2 | 3.4-8 | Setup | Burdock, walking, counts the grid out loud (his quirk) on a medium that backs away in front of him. |
| 3 | 8-20 | Stakes and rival | Burdock low (the race director) gives the stakes; the rival's engine revs and they taunt the player on a close single. |
| 4 | ~60% | Turn | race by race: the player's tea-towel question (rookie), the player answers the Carburettor (derby), Shelldon walks off the paving onto the gravel and Doris turns out to be the snail (endurance), Dock is Pip's cousin (the Final). |
| 5 | last 3 s | Button | Burdock's last line, close (the towel; "Nobody honks at my flag."; "Engines."), then every engine on the grid starts as the player walks to their car. |

Podium: (1) the horn as the winner rolls into the pit lane (track shot, 5 s); (2) a fade-cut to the steps, triumph, the
crowd; (3) Burdock's call on a low single; (4) the runner-up's answer as the button (Pebble to her mum, Lugnut's
invitation, Shelldon's empty step then Doris's owner, Vinnie's recount and Burdock's "I counted twice." then the cup).

## 6. Shot list (intro)

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | crane `dolly` from 20 m over the main straight to 5 m, onto the grid | 54 | 3.8 s, eases | the grid | place and scale, with a sound under it |
| 2 | `shot('burdock','ms',{toward:'you'})` | 40 | leads him as he walks | Burdock | the count is a ritual in motion |
| 3 | `coverage('burdock','you').single('burdock', size, {height:'low'})` | 35 / 30 | locked | Burdock | officials are shot from below |
| 4 | `coverage(rival,'you').single(rival)` | 35 | locked | the rival | the taunt is aimed at the player |
| 5 | the player's single on whichever pair spoke last | 35 | locked | the player | the straight man's question |
| 6 | (endurance only) a locked `cut` from ahead of the grid onto Shelldon alone on the gravel | 46 | locked | Shelldon | the physical gag, held 1.2 s, one `comic` stinger |
| 7 | low `cut` behind the player's car in the last slot | 50 | locked | the car, the player walking in | the race is next |

Sides: Burdock and the player on `coverage('burdock','you', 1)`; each rival and the player on `coverage(rival,'you', 1)`.
Rivals stand on the inside of their cars so their machine is behind them in their single.

## 7. Dialogue pass

| Race | Who | Line | Note |
| --- | --- | --- | --- |
| Rookie | Burdock | Four on the grid. One, two, three, four. And again. | his lore quirk: he counts the grid twice |
| | Burdock | Rookie Mow-Down. Two laps. Make the podium and you get the fast stuff. | was 25 words |
| | Marigold | A rookie on a Ride-On. Eat my clippings, sweetheart. | the rival, given a line at last |
| | You | Is that a tea towel? | the straight man |
| | Burdock | I left the Hat Watch over this tea towel. | the lore's loose thread: said here and never again |
| | Burdock | It is a very serious tea towel. | button (his catchphrase, the one time) |
| | ~~Burdock~~ | ~~Welcome to the Lost & Found Speedway! Everything you can see fell out of the sky...~~ | cut: 22 words of exposition; the crane shows the heap |
| | ~~caption~~ | ~~Your Ride-On Mower waits in the last slot. Get in and watch the lights.~~ | cut: the last shot shows it |
| Derby | Burdock | Four lowriders. One, two, three, four. Nobody hop yet. | |
| | Burdock | Low & Loud Derby. The Carburettors do not lose to tourists. | |
| | Lugnut Lulu | Vesper's lot drive silent carts. We drive noise. Which are you? | ties the Carburettors to the main story |
| | You | Loud, apparently. | |
| | Lugnut Lulu | Then prove it on the Rake-Handle. Win, or walk home. | |
| | Burdock | Nobody honks at my flag. | button: the three horns, his flinch |
| Endurance | Burdock | Three snails, one rookie. One, two, three... Where is he going? | Shelldon walks off as he counts |
| | Shelldon | Paving is a government trap. I race on the gravel. | on the run-off, alone |
| | Burdock | Snail-Mail Express entered him. He has conditions. | |
| | Auntie Periwinkle | This is Doris. Doris does not get overtaken, dear. | |
| | You | Which one is Doris? | |
| | Auntie Periwinkle | The snail, dear. | |
| | Burdock | Win this one and the Final is yours. Watch the lights. | |
| Final | Burdock | The Final. One, two, three, four. Counting twice tonight. | |
| | Burdock | Three laps, and the whole yard listening on Turfton FM. | |
| | Vinnie | Three-time champion! Four after today. Keep my exhaust in sight, kid. | was 16 words |
| | Dock Hoewright | My cousin Pip says you're all right. I checked my seat bolt anyway. | Dock is Pip's cousin (lore: dock-hoewright) |
| | You | Pip's cousin? | |
| | Dock Hoewright | Twice. One, two, Blade. | his on-air sign-off |
| | Burdock | One, two, three, four. Engines. | button: the count, then every engine |
| Podiums | Burdock / Pebble | A podium on your first go! Half the crowd is chanting your name. / Mum! Mum, I'm on a box! | |
| | Burdock / Lugnut | The Carburettors are speechless. That has never happened. / Midnight derby. You're in. Nobody will tell you where. | |
| | Burdock / Periwinkle | Shelldon refuses the podium. It is paved. His medal goes by snail. / Doris would like a word, dear. | the second step is empty on screen |
| | Burdock / Vinnie / Burdock | Ladies and gnomes, your Fizz Cup champion! / Recount! I demand a recount! / I counted twice. | then the cup goes up |

Names checked: `npm run lore -- find burdock`, `dock-hoewright`, `vinnie`, `carburettors`, `fizz cup`, `book stack`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `crowd` ambience, no music; `engine-rev` at the pole car | a race track is its noise |
| rival's first line | `tension` in (0.6 s) | the stakes rise when the rival opens their mouth |
| endurance gravel shot | `comic` stinger | the one physical gag |
| derby / Final button | every rival's horn, or every engine | the grid answers Burdock |
| last shot | `chase` in, every engine revs | the race is next |
| podium fade-in | `triumph` music and stinger, `cash` on the Final's cup | the win |

## 9. Blocking and vehicles

- Grid: rivals' cars on `gridSlot(0..2)`, the player's car on `gridSlot(3)` (the last slot). Each rival stands on the
  inside of their car (1.35 m off the centre line), facing the player. The player waits on the centre line 3 m ahead of
  their car. Burdock starts in front of the pole (4 m short of the line), walks down the centre line to stand 2.6 m in
  front of the player, and faces them. Shelldon (endurance) walks forward past his car's nose and out to the gravel
  run-off (9.6 m off the line). The player ends walking to their car.
- Podium: the player's car (whatever they finished in) rolls from the pit lane entry to the podium's foot; a fade puts the
  top three on the steps (the second step stays empty in the endurance race). Burdock stands at the foot of the steps
  with his tea towel (prefab `speedway-tea-towel`).

## 10. The button

Intro: Burdock's last line close, then the whole grid's engines starting over a low shot of the player's car in the
last slot: the scene ends where the race begins. Podium: the runner-up's face (or the Fizz Cup going up), because the
win means more with a loser in it.

## 11. Self-check

- [x] Want, obstacle, turn per race (see the beat sheet); not a briefing.
- [x] Hook in 3 s (the engine under the crane, the horn in the pit lane); no narration, no caption.
- [x] Every line under 16 words (longest 14); no grid-slot read-out.
- [x] Burdock's patter and quirk, each rival their own voice; the player's lines 2-5 words.
- [x] Every speaker MCU/CU and facing the camera.
- [x] One side of the line per pair; no crossings (the report's `crosses-line` is clean).
- [x] Music changes with reasons; at most two stingers.
- [x] Running joke: the count, ending in "I counted twice." on the Final's podium.
- [x] Lit (the player's sky; the Speedway is open country).
- [x] Report OK for all eight; removed from `pacing.baseline.ts`.
- [x] `npm test` passes (line of sight, against the Speedway's own colliders); watched at 960x600 and 390x844: the
      gravel gag shot was inside the pole car and the last-slot shot filled a phone screen with a seat back, both moved.
- [x] `direction.notes` points here (set by `raceIntro` / `racePodium`).
