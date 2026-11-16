Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 06, "The Forty", is playable: tracing the lost Pipewrights through the Deeps and beyond, ending with the Forty Stone.

## Read first
- `docs/design/gnomomia/storylines/06-the-forty.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; deeps, thatchford, hedgewood and keep layouts)

## Change
`src/data/packs/s06-the-forty.ts`, prefix `s06-`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c3-letter-from-puddlemere` (ch3 side quest) is done and flag `c2-forty-list` is set.
- **Gating:** steps in the Cistern need `c5-valve-maps` active or done (use `questAtLeast`). Steps in the Backflow need `c6-down-the-drains` active or done.
- **Givers:** `puddleby` and `ida` are canon. Use `topics`/`greetingsFirst`/`extraNodes`.
- **Objects:**
  - Name-tag objects in each wing.
  - The Gutters north grate at (0,95).
  - Burnet Tallow's grave in the Hedgewood at (-30,-40).
  - The valve wheels that free the drowned echoes.
  - The **Forty Stone**: a `stone` object at keep (-30,22), shown only after the final quest is done.
- **Pipewright Hob Mattock** is also named by storyline 02. Mention him on the stone text, but don't define him.
- **Items:** Woad's Plumbline (Sprouted, ilvl 19) and Speedwell's Caulk Tin (Blooming, ilvl 25).
- **Choice:** the storyline's grave choice gets a flag `s06-burnet` with the two values from the doc.
- **Rule:** don't reveal Potsworth's guilt.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch3/ch5/ch6 packs.
