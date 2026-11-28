# Director's notes: `m39-couch-surfing-intro`

Watch it at `?no-intro&cutscene=m39-couch-surfing-intro`.

| | |
| --- | --- |
| Scene | `m39-couch-surfing-intro` in `src/cutscene/scenes/story/m39-couch-surfing.ts` |
| Played by | quest `m39-couch-surfing` as its intro, given by Pip's call on the Woolly Sock Lodge porch (giver `pip-call-lodge`) |
| Kind and length | `intro`, aim 30-60 s; 26.8 s at Normal text speed (a phone call: short on purpose) |
| Where, when | stage `bus-stop-bin` (the Central Bus Stop, a dumpster by the shelter); night (batch-3 notes section 7: "back into Turfton in disguise") |
| Before / after | before: row 38, the radio's four parts and Pip's sock-map at the lodge. After: the ride south with a plain cap over the hat |

## 1. Purpose in the story

Act III needs the crew back in Turfton, unseen, and Pip needs a roof. This scene says both in one gag: Pip is already in
town, hiding behind a bin, and an HOA watcher gives the bin a sticker. It plants Hyssop (the stairs) and the NO LODGERS
note without naming either, and it shows the player the cost of being spotted before they ever ride in.

## 2. The player's feeling

- **In:** warm and safe at the lodge; a phone rings.
- **Out:** amused, and sure of the job: ride in quietly, pick Pip up at the stop, give him a couch.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | a couch (the player's), without being seen | two HOA watchers strolling past; his own volume | whispers, bargains for both ends of the call | thrilled at a sticker: "I passed an inspection" |
| HOA watcher (w1) | to confirm Turfton is compliant | nothing; he finds what he came for | flat monotone, a clipboard | leaves content |
| The player | (off screen: only Pip's face hears them) | | | |

## 4. Subtext

- Pip is frightened and covers it with talk; his lines get shorter as the watchers get closer.
- "My hammock is evidence" says the bay has been seized and he has lost his bed in one breath.
- The watcher's "Compliant" is the HOA's whole world view in one word; the sticker is the joke and the threat.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Night, the lit shelter, two beige watchers walking in step; footsteps and a clipboard. |
| 2 | 3-6 | Setup | Ground-level look at a very small boot beside a dumpster; a rustle. |
| 3 | 6-17 | The call | Pip, ms then mcu then cu: "I am a bin", the seized bay, the ask. |
| 4 | 17-24 | Turn | The first watcher stops at the bin: "Lid shut. Bin upright. Compliant." The sticker lands (insert, comic stinger). |
| 5 | 24-27 | Button | Pip, delighted; a wide of the watchers leaving in step, the sticker on the lid. |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | cut, stage `wide` | the stop, lit; watchers walking in | establishes place, the danger and the joke space |
| 2 | cut, stage `bin-low` | the boot and the dumpster | the hidden hero, at his height |
| 3 | frame ms | Pip | the whole kneeling gnome beside the bin: the picture before the words |
| 4 | frame mcu | Pip | the bad news, said fast |
| 5 | frame mcu (cutaway) | the watcher, tapping his clipboard | the threat, on the same side of the line (`coverage('pip','w1',-1)`) |
| 6 | frame cu | Pip | the ask, close and quiet |
| 7 | frame mcu | the watcher | "Compliant." |
| 8 | cut, stage `sticker` | the dumpster flank | the insert: the sticker |
| 9 | frame mcu, then the stage `wide` | Pip, then the whole stop | the button |

One side of the line for the whole scene. No crossing.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Do not say my name. I am a bin. | first words are a joke and an instruction |
| Pip | Side-Valve is chained. My hammock is evidence. Tansy says edges. I say roof. | the previously-line, in his voice |
| Pip | So. A couch. Yours. And please do not get spotted. | the ask; the quest's objective in his voice |
| Watcher | Lid shut. Bin upright. Compliant. | the turn |
| Pip | Tell Tansy I passed an inspection. | the button |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | music `tension` (low), ambience `street` | a stealth scene |
| 0-3 | footsteps (placed on the watcher) | the hook |
| 4 | foley `rustle` on Pip | the bin moves |
| 17 | music `mystery` | the watcher stops: nothing is safe |
| 18-20 | foley `tap`, `paper`, comic stinger | the clipboard, the sticker, the laugh |

## 9. Blocking and vehicles

Pip kneels behind the dumpster at (-12, 21.8) with a tin-can phone. The watchers walk south down the pavement (x -7.5) from
z 2 and z -1 and stop at the bin; after the sticker they leave south. No player actor: the player is on the lodge porch and
is never heard, so Pip's face does the listening. No vehicles. Cutscene-only dumpster and sticker (L95).

## 10. The button

The watchers walk away in step down the pavement, a beige COMPLIANT slip stuck on a dumpster, and the sound of a gnome
trying not to giggle in it.

## 11. Self-check

- [x] A want (a couch), an obstacle (the watchers) and a turn (the sticker); not a briefing.
- [x] Hook by 3 s on a picture; lines under 16 words; nobody says what the picture shows.
- [x] Pip sounds like Pip, with the second sentence that undoes the first.
- [x] One side of the line; reactions are cutaways, not repeats.
- [x] Night scene lit by the shelter and the lamp.
- [x] `npm run cutscene-report`: OK.
