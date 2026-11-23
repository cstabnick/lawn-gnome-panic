# Director's notes: `sq-hose-revolt-club`

Re-directed against [../bible.md](../bible.md). Watch it at `?no-intro&cutscene=sq-hose-revolt-club`.

| | |
| --- | --- |
| Scene | `sq-hose-revolt-club` in `src/cutscene/scenes/side/hoseRevolt.ts` |
| Played by | quest `sq-hose-revolt` as its arrival at Vesper's club ("meanwhile"; no player actor) |
| Kind and length | `arrival`, aim 10-35 s; was 30.0 s with 8 faults, now about 25 s |
| Where, when | stage `putting-green` (Vesper's Putting-Green Country Club, Turfton), day, `sky: 'noon'` |
| Before / after | before: the intro sent Brenda's last hose here. After: the flood, `sq-hose-revolt-outro` back at the throne |

## 1. Purpose in the story

Vesper is told about the sprinklers and then the pipes. He does not run and he does not raise his voice: the first real
sign that the revolt has reached him. The scene plants the flood and his cold, measured reply to it.

## 2. The player's feeling

- **In:** not present (meanwhile). The audience has just heard Brenda send the last hose here.
- **Out:** a chill: Vesper knows, and is calm about it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper | an even, unbrushed-free green | the pipes that groan | stillness, a precise order | has heard the threat; orders the measurement |
| Member m1 | to be told it is the sprinklers | Vesper's stare | a shrug, a lean | learns it is not the sprinklers |
| Caddie (Sedge) | to report the kinked hose | Vesper's manner | an earnest report | reports; is sent to measure |

## 4. Subtext

- Vesper's fear is cracking. A groan in the pipes is the first crack he has heard on his own green.
- Vesper never says the revolt's name; he calls the problem "the pipes", as if it is his fault they groan.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A sprinkler ticks; the wide holds the club from the road; the caddie walks his path. |
| 2 | 3-7 | Setup | Vesper turns to m1 in a low single; the villain motif comes in with him; "unbrushing it." |
| 3 | 7-12 | Dodge | m1 shrugs, "Probably the sprinklers." A groan in the pipe. |
| 4 | 12-20 | Turn | Vesper, low, does not turn: "Pipes do not groan on my green." The caddie's report: the Strip's hose has been kinked again. |
| 5 | 20-25 | Button | Vesper, low and still: "Measure the slope, Sedge. Two hair-widths. Write it down." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `sfx squirt` at the sprinkler | none | none | none | the hook is a sound |
| 2 | `stageCut('putting-green','wide')` | 52-60 | locked | the club from the road | place, pins, members |
| 3 | `coverage('vesper','m1',1).single('vesper','mcu',{height:'low'})` | 40 | locked | Vesper | still and low: the threat's shot |
| 4 | `coverage('vesper','m1',1).single('m1','mcu')` | 35 | locked | m1 | the shrug, given a face |
| 5 | `coverage('vesper','caddie',1).single('vesper','mcu',{height:'low'})` | 40 | locked | Vesper | the groan lands on him |
| 6 | `coverage('vesper','caddie',1).single('caddie','mcu')` | 35 | locked | the caddie | the report, given a face |
| 7 | `coverage('vesper','caddie',1).single('vesper','mcu',{height:'low'})` | 40 | locked | Vesper | the order, last |

Sides of the line: Vesper with m1 and with the caddie on side 1 (the same side of each pair). No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper | The grass is brushed to the millimetre every dawn. Somebody has been unbrushing it. | his voice, complete sentences, no contractions |
| Member m1 | Probably the sprinklers, Vesper. | the dodge |
| Vesper | Pipes do not groan on my green. | the turn: he does not turn to look |
| Caddie | Sir, the Strip's hose has been kinked again. | the report, the Strip is named as a place once |
| Vesper | Measure the slope, Sedge. Two hair-widths. Write it down. | the button; the caddie is called Sedge, as in the existing scene |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | ambience `water`, music `tension` | the club's unease |
| 0 | sfx `squirt` | the sprinkler is the hook |
| 3 | music `villain` (fade 0.6) | Vesper enters the scene: the motif is his alone, once |
| 9 | sfx `squirt` | the groan in the pipes, the cue for the turn |

## 9. Blocking and vehicles

- Vesper stands at his mark (196,-196) and does not move. The members and the caddie keep their routines: the caddie
  walks his path, m1 leans on his putter.
- No player actor (meanwhile). No vehicles are placed in this scene.

## 10. The button

Vesper, still, low, giving an order. The last word is "down": he writes it down, which is what a threat looks like
from him.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn.
- [x] The hook is a sound in the first second.
- [x] Every line is under 16 words; no line describes the picture.
- [x] Vesper never runs, is shot low and still, and has the villain motif once.
- [x] Every speaker is framed MCU, facing the camera, for their line.
- [x] One side of the line per pair.
- [x] `direction.notes` in the scene points at this file.
