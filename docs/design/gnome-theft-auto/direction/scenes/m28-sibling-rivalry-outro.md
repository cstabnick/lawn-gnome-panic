# Director's notes: `m28-sibling-rivalry-outro`

Watch it at `?no-intro&cutscene=m28-sibling-rivalry-outro`.

| | |
| --- | --- |
| Scene | `m28-sibling-rivalry-outro` in `src/cutscene/scenes/story/m28-sibling-rivalry.ts` |
| Played by | quest `m28-sibling-rivalry` as its outro, at the Tattler's desk |
| Kind and length | `outro`, aim 15-45 s; now 39.9 s at Normal text speed |
| Where, when | stage `tattler-front` (the Tattler's street desk at the north gate of Founders' Green; the Tattler Building's block became the park, L92), dusk, `sky: 'golden'` |
| Before / after | before: the ride from Thorne Tower; after: the CONTRACT COMPLETE banner and the reward |

## 1. Purpose in the story

The act's first laugh and the doubt planted in Reginald (act II: Reginald corrects a spelling instead of confirming it). Juniper laughs for the first time. Reginald's "I corrected it. I did not confirm it" is the seed for the finale's "...It's uneven."; it is not resolved. Hedda, who has never printed a correction, prints a corrected permit.

## 2. The player's feeling

- **In:** a ride and a double act.
- **Out:** warmed by the laugh, uneasy at the quiet beat after it, and sure the permits will print.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Hedda | the story, spelled right | a stalemate | headlines, no verbs | prints |
| Juniper | to have the permits confirmed | her brother | eyes front, one-liners | laughs |
| Reginald | to not be the one to confirm | his doubt | corrects the spelling instead | says what he did and did not do |

## 4. Subtext

- He fixes her name because it is the one thing he is certain about; she hears that.
- "I corrected it. I did not confirm it" is a man who has seen the permits' small print and cannot say why it troubles him.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | the desk, the printer clearing its throat; Hedda: "Permits. Eleven. Councilwoman present. Inspector present. Confirm." |
| 2 | Setup | They address each other through Hedda: "Tell my brother...", "Tell my sister...". |
| 3 | Turn | The permit lands; "Read. Now." The calipers walk down the page and stop on a name: "Junipar." |
| 4 | Gag | "Confirmed?" "Corrected." "The Tattler prints no corrections." "Then print it correctly." The laugh, music out. |
| 5 | Button | The quiet line, then "Printing." and a locked wide of the desk, the printer chattering. |

## 6. Shot list

Three pairs of coverage (`hedda`/`player`, `juniper`/`hedda`, `reginald`/`hedda`) so each speaker has an eyeline to Hedda and the siblings are never in one frame facing each other. Reginald is shot from above; the insert is on the calipers. The laugh is one close single with the music out.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Hedda | Permits. Eleven. Councilwoman present. Inspector present. Confirm. | headline voice |
| Juniper | Tell my brother the permits are in order. | |
| Reginald | Tell my sister I have not read them. | |
| Hedda | Read. Now. | |
| Reginald | "Junipar." There is no a. There is an e. | the correction |
| Juniper | ...Is there. | |
| Hedda | Confirmed? | |
| Reginald | Corrected. | |
| Hedda | The Tattler prints no corrections. | the running gag |
| Reginald | Then print it correctly. | |
| Juniper | Ha! ...Ha. | the first laugh |
| Reginald | I corrected it. I did not confirm it. | the doubt, not resolved |
| Juniper | No. You did not. | |
| Hedda | Printing. | |

Names and canon: `npm run lore -- find` on Juniper, Reginald, Hedda, Frank, Thrift, Peony, the Kicked Board and Hedgeworth; nothing here contradicts those entries and nothing new is named.

## 8. Music and sound

`turfton-dusk` music (out for the laugh and the quiet line, back for the button), `street` ambience. Foley: a printer, paper, taps, cloth.

## 9. Blocking and vehicles

Hedda behind the desk in the gate (-90, 9.6); Juniper at the left end (-94.4, 6.4), Reginald at the right end (-85.6, 6.4); the player in front (-90, 5.6). Juniper's Ride-On at the kerb behind her. The permit appears on the desk with the paper sound.

## 10. The button

The printer starts, the desk in a locked wide: the picture says the permits are going out and nobody says what they just saw.

## 11. Self-check

- [x] Want, obstacle and a turn; not a briefing.
- [x] The hook lands inside 3 s on a picture or a character; no opening narration.
- [x] Every line is 16 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices match the character bible: headline voice with no verbs (Hedda); municipal code (Reginald); one devastating line, one laugh (Juniper).
- [x] Coverage on one side of the line per pair; the checker reports the scene OK (`npm run cutscene-report`), no waivers.
- [x] Lit and readable: day, or `golden` for dusk and dawn.
- [x] `direction.notes` in the scene points at this file.
