# Director's notes: `under-the-span-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=under-the-span-mid`.

| | |
| --- | --- |
| Scene | `under-the-span-mid` in `src/cutscene/scenes/story/m10-under-the-span.ts` |
| Played by | quest `m10-under-the-span`, objective 1 (a visit: plays on arrival at the Underspan) |
| Kind and length | `arrival`, aim 10-35 s; 40.1 s at Normal text speed (two intro cards take 6.4 s of it; max 45) |
| Where, when | stage `hogweed` (the yard under the Unfinished Span, E17); day |
| Before / after | before: three scrap-bin searches downtown. After: the jammer in hand, the drive back to Side-Valve Salvage |

## 1. Purpose in the story

The first look at the Underspan and its inventor, and three plants: the Dewdrop rolls past with a gnome running in it
(`sq-dewdrop-1`), Hogweed's citation for "unauthorised verticality" is pinned up by Local 404's boss (his Whirligig
thread, rows 33, 56, 57), and Hogweed asks about Fescue (Pip's dodge, rows 14 and 26). Both new characters get their cards.

## 2. The player's feeling

- **In:** carrying three bits of scrap into a place they have never seen, under a road that stops in mid-air.
- **Out:** delighted by Hogweed, a little alarmed by the ball, and holding the jammer.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Hogweed | to swap a jammer for parts and keep working | the ball, the citation | three ideas at once, a spanner for punctuation | frames the citation |
| The player | to trade and go | nothing | holds out the parts | leaves with the jammer |
| Tester | to stop the Dewdrop | no brake | shouts | rolls off |
| Grout | to put a citation on the post | Hogweed's cheer | arrives, says one line, leaves it | pins it and leaves it |

## 4. Subtext

- Hogweed's "ask Pip about Fescue" is a friendly dig: everyone in the coalition's circle knows something about Pip.
- Grout's one line is a union boss's way of saying the Underspan's ladders offend him; Hogweed treats it as a trophy.
- The tester's question and Hogweed's answer ("Run slower!") are the same joke: the Dewdrop has no brake and nobody minds.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A slow dolly beneath the Span, looking up at the concrete deck |
| 2 | 3-13 | Setup | Hogweed: "Parts! ..."; his card |
| 3 | 13-19 | Trade | Parts over, jammer back; "It jams radios. Mostly. Ask Pip about Fescue for me." |
| 4 | 20-30 | Turn | The Dewdrop rolls past with a gnome inside; "How do you STOP it?" "Run slower!" |
| 5 | 30-40 | Button | Grout walks in: "Local 404 says: unauthorised verticality." His card; the citation goes on the post; "Third one this week. I am framing it." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` low, looking up at the deck | 58 | 2.8 s | the Span | the area's signature shot: the Skyway as a roof |
| 2 | `HOG_TALK.single('hogweed','ms')` | 40 | locked | Hogweed | first appearance, then his card |
| 3 | `HOG_TALK.two('ms')` | 40 | locked | both | the trade |
| 4 | `HOG_TALK.single('hogweed','mcu')` | 35 | locked | Hogweed | the jammer line |
| 5 | `reaction('player','mcu')` | 35 | locked | the player | the pause |
| 6 | `track` the Dewdrop | 52 | tracks | the Dewdrop | the turn |
| 7 | `shot('tester','ms')` | 40 | rolls with him | the tester | the shout |
| 8 | `HOG_TALK.single('hogweed','mcu')` | 35 | locked | Hogweed | "Run slower!" |
| 9 | `track` Grout | 50 | tracks | Grout | his walk in |
| 10 | `GROUT_TALK.single('grout','mcu',low)` | 35 | locked | Grout | the line; low for the union boss |
| 11 | `cut` on the citation | 36 | locked | the citation | 1.4 s insert (batch notes 6, item 11) |
| 12 | `GROUT_TALK.single('hogweed','mcu')` | 35 | locked | Hogweed | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Hogweed | Parts! Springs, bolts, panels! Oh you wonderful, is that a bolt? | breathless, three ideas |
| Hogweed | It jams radios. Mostly. Ask Pip about Fescue for me. He changes subjects beautifully. | plants Pip's dodge |
| Tester | How do you STOP it? | a gnome in a ball |
| Hogweed | Run slower! | the answer that is not one |
| Grout | Local 404 says: unauthorised verticality. | his tic; the citation |
| Hogweed | Lovely! Third one this week. I am framing it. | lore: "Framed it." |

Names checked: `npm run lore -- find "Hogweed"`, `"Local 404"`, `"verticality"`, `"Dewdrop"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton` music, `wind` bed | traffic thumping over the Span |
| 0-3 | `static` at Hogweed | his bench radio |
| 14 | `clatter` | the parts change hands |
| 19 | `whoosh` | the Dewdrop |
| 33 | `knock` | the citation goes on the post |

## 9. Blocking and vehicles

- The player at (578, -18) facing Hogweed at (580, -18). The Dewdrop (a `bubble-mobile`, tester seated) drives
  (563, -30) to (598, -30), 12 m from the pair, flat out. Grout enters from (567, -12) to (575.5, -14.5) and stops short of Hogweed. The citation prop appears at (579, -21.2).

## 10. The button

Hogweed pleased at his own citation, in mcu, with the pink slip behind him. The last image is the one thing Local 404
cannot stop: he likes it.

## 11. Self-check

- [x] A want, an obstacle, a turn (the ball), a button.
- [x] Hook in 3 s: a dolly under the deck with the wind bed.
- [x] Lines under 16 words (longest 14).
- [x] Hogweed breathless; Grout "Local 404 says".
- [x] Speakers at MS or closer; the tester on an `ms` shot that rolls with him.
- [x] One side of the line per pair.
- [x] Music `turfton`, no stinger beyond the cards.
- [x] Intro cards: `hogweed`, `grout`, once each.
- [x] Day scene.
- [x] `npm run cutscene-report`: OK. Length 40.1 s is over the arrival aim (35) and under the max (45) because of the two cards.
- [x] `direction.notes` points here.
