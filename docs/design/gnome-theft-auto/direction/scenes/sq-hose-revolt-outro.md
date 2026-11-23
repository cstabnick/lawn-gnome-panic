# Director's notes: `sq-hose-revolt-outro`

Re-directed against [../bible.md](../bible.md). Watch it at `?no-intro&cutscene=sq-hose-revolt-outro`.

| | |
| --- | --- |
| Scene | `sq-hose-revolt-outro` in `src/cutscene/scenes/side/hoseRevolt.ts` |
| Played by | quest `sq-hose-revolt` as its outro ("meanwhile"; no player actor) |
| Kind and length | `outro`, aim 15-45 s; was 25.4 s with 6 faults, now about 25 s |
| Where, when | stages `putting-green` (the flood) and `brenda-throne` (the decree), day, `sky: 'noon'` |
| Before / after | before: the player has flooded the club. After: the credits roll on the republic's holiday |

## 1. Purpose in the story

The payoff of the revolt. The club is flooded, Vesper is calm about it, and Brenda hears the news on her throne and
declares a national holiday in her own name. The decree is the button.

## 2. The player's feeling

- **In:** the job is done somewhere they cannot see.
- **Out:** delighted at the mess and at Brenda's vanity; a little uneasy about Vesper's calm.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Members m1, m2 | to get off the green | the flood | run, flee | off the green |
| Vesper | to keep his composure | the bog | stillness, a line about the monocle | unmoved, still composed |
| Brenda | to be celebrated, and named after | nothing | royal "we", the sceptre raised, a decree | a national holiday in her name |
| Bikers b1, b2 | to cheer their Baroness | none | cheer | (background) |

## 4. Subtext

- Vesper's calm is the thing that scares: he does not run, and the monocle does not move. He is not beaten yet.
- Brenda is delighted for the wrong reason (she wants the holiday, not the hoses).

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A splash and a rumble: the green shakes; a close shot on m1's face, then m2's, both at FS. |
| 2 | 3-6 | Flood | m1 and m2 run off the green; their faces tell it; the flood is implied, not shown wide. |
| 3 | 6-12 | Vesper | Low, still: "Calm. Calm. The turf is a bog, and I am calm." Fade out. |
| 4 | 12-18 | Throne | A wide of the republic; fade in; Brenda's news and her triumph, the bikers cheer. |
| 5 | 18-25 | Button | Brenda, low: "A national holiday! Name it after me. Name everything after me." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `sfx splash` + `shake` (async) | none | shake | the green | the sound is the hook |
| 2 | `frame` m1 `fs`, side 20 | 45 | m1 runs off in frame | m1's face | a reaction that reads at phone size |
| 3 | `frame` m2 `fs`, side -20 | 45 | m2 runs | m2's face | the second reaction, the other way |
| 4 | `coverage('vesper','m1').single('vesper','mcu',{height:'low'})` | 40 | locked | Vesper | the still point |
| 5 | `stageCut('brenda-throne','wide')` | 52-60 | locked | the republic | the place, after the fade |
| 6 | `frame` brenda `mcu`, low | 40 | locked | Brenda | the news, the holiday |

Sides of the line: Vesper on `coverage('vesper','m1',1)`. Brenda is shot alone (no two-hander).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper | Calm. Calm. The turf is a bog, and I am calm. | the composure line |
| Vesper | The monocle does not move. Neither do I. | the monocle: a single small joke with no stinger |
| Brenda | The club is a bog! The hoses have spoken! | the news and the decree; the one `triumph` stinger |
| Brenda | A national holiday! Name it after me. Name everything after me. | the button: vanity, deadpan, royal |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | sfx `splash`, shake | the flood is the hook |
| 0 | music `triumph` | the decree's march, carried through |
| 6-12 | fade to black, then up | the scene cut between the club and the republic |
| 15 | stinger `triumph` on Brenda's news | the decree is the payoff |
| 22 | horn on g1 | the holiday's noise |

## 9. Blocking and vehicles

- The members run off the green along their paths (`run: true`). Vesper stands at his mark.
- Brenda is at her throne mark; her bikers cheer from their seats. The one parked push-bike (g1) is at the bank.
- No player actor (meanwhile).

## 10. The button

Brenda, low and proud: "Name everything after me." The vanity is the joke and it is said without a wink.

## 11. Self-check

- [x] The flood is shown at a size where people read: FS on the members' faces, reacting.
- [x] The hook is a sound in the first second.
- [x] Every line is under 16 words; no line describes the picture.
- [x] Vesper is shot low and still and never runs; the monocle line has no stinger.
- [x] Brenda's decree is the button; one `triumph` stinger, on the news.
- [x] `direction.notes` in the scene points at this file.
