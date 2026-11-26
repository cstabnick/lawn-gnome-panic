# Director's notes: `m52-the-test-cut-p1-intro`

| | |
| --- | --- |
| Scene | `m52-the-test-cut-p1-intro` in `src/cutscene/scenes/story/m52-the-test-cut.ts` |
| Played by | quest `m52-the-test-cut-p1` (Tee Time) as its intro |
| Kind and length | `intro`, aim 30-60 s; 48.6 s at Normal |
| Where, when | stage `m52-gala-terrace` (the Clubhouse terrace dressed for the gala), day, `sky: 'noon'` |
| Before / after | `m51-the-flock-stands-outro` (the Flock in a row outside Thrift's shed) / caddy the bag to the first tee |

## 1. Purpose in the story

Opens the act III turn on its last laugh: Vesper's backers are dining on Peony's terrace, and Peony, who will not say a
word against Vesper (#47), finds a way to help without saying one. Plants the loudspeakers the final will use ("every
loudspeaker") and the caddy's invisibility the p1 mid pays off.

## 2. The player's feeling

- **In:** just watched the Flock arrive on one leg; at Hedgeworth already (the Standing Lady is at Thrift's shed).
- **Out:** amused and quietly let in on a plan; knows the job (carry the Countess's bag, then listen).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Peony | put the player where they can hear Vesper | her own rule: not a word against him (the mortgage) | crisp orders, golf-club decorum, saying it by not saying it | from tenant who will say nothing to ally who arranges everything |
| Basil | keep his dignity as caddy master for backers | the bib, the bag, the backers | patronising "champ", superstition | none: comic relief, a step toward the p2 alliance |
| HOA Technician | test the horns | nothing | says "even" | none |
| Player | understand what Peony wants | Peony will not say it | dry questions | in the bib |

## 4. Subtext

Peony's fear (the mortgage) is under "My mortgage, with canapés." Her secret (she cannot stand to lose) is not touched.
"One wants nothing. One will say nothing." means the opposite of what it says.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | low on the HOA tech under a brass horn: "Testing. Even. Even. Even." |
| 2 | 3-14 | Setup | the terrace wide; Peony: loudspeakers, for a gala; whose; Vesper's backers, "my mortgage, with canapés" |
| 3 | 14-28 | The bib | Basil demoted to caddy master; Peony hands the player the nine; "It says six."; two-shot gag |
| 4 | 28-40 | Turn | push-in: "Caddies are furniture."; "You want me to listen."; "One will say nothing." |
| 5 | 40-48 | Button | Basil gives the job; the horn crackles "...Even."; Peony's eyes go to it and stay |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | ms low, tech toward Peony | 40 | locked | tech, horn above | a joke about the HOA, and the plant for the final |
| 2 | stage `terrace-wide` | 50 | locked | the gala | place |
| 3-5 | `coverage(peony, player, 1)` singles | 35 | locked | Peony / player | the exchange |
| 6 | ms Basil toward player | 40 | locked | Basil sulking | his entrance |
| 7 | insert on the player's hands | 30 | locked | the bib | the six |
| 8 | `BIB.two('ms')` | 40 | locked | both | the gag, locked off |
| 9 | push-in Peony mcu | 35 | push | Peony | the turn |
| 10 | cu Peony | 30 | locked | Peony | "One will say nothing." |
| 11 | ms low tech | 40 | locked | tech | the button's sound |
| 12 | mcu low Peony | 35 | locked | Peony | the look |

All Peony/player talk on side 1 of their line; Basil and the tech are shot from the same (south-east) side of their
lines to Peony.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| tech | Testing. Even. Even. Even. | the HOA's only word |
| Peony | They are bolting loudspeakers to my terrace, my dear. For a gala. | her outrage, in order |
| player | Whose gala? | |
| Peony | Mr Thorne's backers. My mortgage, with canapés. | the stake in five words |
| Basil | Champ. They've made me caddy master. For backers. | |
| Peony | And our new caddy wears the nine. Put it on, my dear. | |
| player | It says six. | the prop's own joke (caddy-bib examine text) |
| Peony | It is a nine, sewn on by a committee. Stand up straight. | |
| Peony | Caddies are furniture. Nobody lowers their voice for furniture. | the turn |
| player | You want me to listen. | |
| Peony | One wants nothing. One will say nothing. | outline comms 0, said in the scene |
| Basil | The Countess's bag, champ. First tee. Everything she owns is purple. | the objective |
| tech | ...Even. | button sound |
| ~~Basil~~ | ~~Nobody wears nine. Nine is bad luck.~~ | cut: one superstition line too many |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | ambience `garden`; sfx `static` | the horn wakes |
| 3 | sfx `clink` | the gala's teaspoons |
| 20 | sfx `cloth` | the bib |
| 45 | sfx `static` | the horn again; no music in the whole scene (stiff comedy plays dry) |

## 9. Blocking and vehicles

Peony at her terrace mark, Basil east of her with the purple bag, the player in the planter gap (the giver's spot). The
tech at the west horn post. No vehicles. The player ends at the planter gap, the bib in hand.

## 10. The button

The horn says "...Even." and Peony looks up at it and does not look away: the joke ends on the threat it was about.

## 11. Self-check

- [x] Want, obstacle, turn. - [x] Hook by 3 s, not narration. - [x] Lines under 16 words. - [x] Voices per bible.
- [x] Speakers framed. - [x] One side of each line. - [x] No music, no stinger: a dry comic scene. - [x] Plants the horns.
- [x] `npm run cutscene-report`: OK.
