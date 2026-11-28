# Director's notes: `diggs-medal-intro`

| | |
| --- | --- |
| Scene | `diggs-medal-intro` in `src/cutscene/scenes/story/m61-diggs-medal.ts` |
| Played by | quest `m61-diggs-medal` (Diggs's Medal) as its intro, when the player takes it from the giver `diggs-bungalow` at the lane in front of Diggs's yard gate |
| Kind and length | `intro`, aim 30-60 s; about 42 s at Normal text speed |
| Where, when | stage `diggs-yard` (Commander Diggs's yard, Pebblewick), dusk (`sky: 'golden'`) |
| Before / after | before: row 60 (the moles open the armory from below; Diggs salutes a mole); after: the player steps into the bungalow (interior visit), then the clerks at the lost-property shed |

## 1. Purpose in the story

The first of act IV's two sincere beats in Diggs's life, and the one that sets the second up. The hardliner who held a fort for fifteen
years lets the player into his yard and shows the one thing in it that is out of place: fifteen years of guard rosters and one empty
nail. He does not explain. He says what hung on it and that the Association logged it as lost property, and that he cannot go and fetch
it himself (a commander at the hatch is an incident; a stranger is a Tuesday: Cam's running word, used here for the first time as an
ordinary one). The "previously" is carried by the comms briefing; the scene itself is the mood: dusk, tin, wind, a man at attention.

## 2. The player's feeling

- **In:** the Guard is theirs, the armory is open, the moles have just been saluted. A call to a bungalow, not the fort, is strange.
- **Out:** quiet. They know what is missing, where it is, why they are the one to fetch it, and that it matters more than the plan.
  The tension curve has dipped to 4; nothing in here raises it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Diggs | to get his medal back without asking for anything | his own rank; he cannot be seen at the lost-property hatch | formality: minutes, orders, "tea first"; lets the wall do the asking | for the first time orders someone to his tea |
| The player | to understand what is being asked | a man who will not say it | short questions: "What hung on the nail?", "Where did it go?" | takes the job |

## 4. Subtext

- "Four minutes late. I will allow it." is the warmest thing he can say to a visitor.
- "The fort is a duty. This is a house." He has never invited anybody to the house (two mugs on the stove in the interior; one never used).
- "I did not lose it." The only line with weight in it; everything else is numbers (bible: Diggs, clipped military, no contractions, no adjectives).
- "You are a Tuesday." is dry, not a gag: he has found a word for the thing he needs and the player is it.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | A gate latch, boots on gravel. Wide, low, through the gate gap: a tin hut at dusk, two lit windows, a figure at attention at the door. |
| 2 | 5-14 | Setup | "Four minutes late. I will allow it." / "You said the bungalow. Not the fort." / "The fort is a duty. This is a house." |
| 3 | 14-24 | Turn | His eyes go to the wall. A slow dolly across the board of rosters to the one empty nail; music out; paper stirs in the wind. |
| 4 | 24-36 | The ask | "Fifteen years of rosters. Every sheet signed." / "What hung on the nail?" / "A medal. The Association logged it as lost property. I did not lose it." / "Where did it go?" / "A shed outside the fort gate. A commander at that hatch is an incident." / "You are a Tuesday." |
| 5 | 36-42 | Button | "Tea first. Then the shed. Orders." Music back, soft; a slow dolly in on the door as the player turns to go in. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `gate-wide` | 46 | locked, low from the road through the gate gap | hut, door, Diggs | hook, and the whole yard in one picture |
| 2 | `TALK.single('diggs','mcu',{height:'low'})` | 35 | locked, low | Diggs | power, shot low as in the bible |
| 3 | `TALK.single('player','mcu')` | 35 | locked | the player | the question |
| 4 | dolly from the yard to the nail | 40 | 3.6 s move, then held | the roster board, then the nail | the reveal |
| 5 | `TALK.single('diggs','mcu')` | 35 | locked | Diggs | the explanation |
| 6 | `TALK.single('diggs','mcu',{height:'low'})` | 35 | locked | Diggs | "I did not lose it." |
| 7 | `TALK.two('fs')` | 45 | locked | both | "You are a Tuesday." and the shrug |
| 8 | dolly in from the road | 46 | 3.2 s | the door | the button |

Diggs and the player share `coverage('diggs','player',1)`: one side of the line throughout.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Diggs | Four minutes late. I will allow it. | no contractions; a count |
| Player | You said the bungalow. Not the fort. | short |
| Diggs | The fort is a duty. This is a house. | the quiet start of his turn |
| Diggs | Fifteen years of rosters. Every sheet signed. | the wall, said while looking at the player |
| Player | What hung on the nail? | |
| Diggs | A medal. The Association logged it as lost property. | "Association" is the HOA's own word |
| Diggs | I did not lose it. | the one sentence with weight |
| Player | Where did it go? | not "Where is it now?" (used in sq-biscuit-hotdog-intro) |
| Diggs | A shed outside the fort gate. A commander at that hatch is an incident. | |
| Diggs | You are a Tuesday. | a word of Cam's, turned to a compliment |
| Diggs | Tea first. Then the shed. Orders. | the objective, in his voice |

Names checked: `npm run lore -- find "Diggs"`, `"Fort Sandpit"`. No new facts needing a ruling beyond the medal (see 9).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` bed, `sandpit` music (the fort's march), `latch`, `crunch` | the gate and the walk up the yard |
| 14 | `paper` on the board | rosters stirring in the wind |
| 15 | music out (1.2 s fade) | the nail |
| 35 | `turfton-dusk` in (2.5 s fade), `cloth` | the shrug, then the warmth of the button |

No stingers. The silence at the nail is two seconds of wind only.

## 9. Blocking and vehicles

Diggs at his door at (615, 217.4) facing the gate (north, yaw pi). The player walks in from the gate at (615, 209.8) to (615, 213.2).
Scene prop: `roster-wall` on the hut's long wall at (613.1, 218.4), board bent to the wall at 1.2 m wide, left of the door; its
empty nail is at 1.2 m. The E10 yard (fence, hole, spade, deck chair) is the real world. No vehicles. The player actor is hidden by the
scene's end; the real player is still at the giver.
New fact for the lead (no ruling made): the medal is a tin star on a faded green ribbon (prefab `diggs-medal`) with an HOA tag on it;
what hung on the nail is the only thing in the lore that Diggs calls "mine".

## 10. The button

A man at attention at a door with a long shadow and a wall behind him with one thing missing from it; the music coming back low. "Orders" is
the only word he has for asking.

## 11. Self-check

- [x] Want (the medal), obstacle (his rank), turn (the nail).
- [x] Hook in 3 s: latch and a figure at a door.
- [x] Every line 14 words or fewer; no coordinates; nobody explains the nail.
- [x] Diggs: clipped, numbers, no contractions, no adjectives; the player short.
- [x] Speakers MCU (the player and Diggs, facing the lens); one fs two-shot on purpose.
- [x] One side of the line.
- [x] One music change out and in; no stingers; no held silence beyond the nail.
- [x] Dusk: `sky: 'golden'`, lit windows.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
