Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Two existing quests gain drop-offs at characters' homes, as proof that homes are quest stops (L58): the chapter-1 tail
of the Mayor posts a copy of the photos through his own letterbox, and Dot's Kerbside Rounds courier job drops Tattlers
at Juniper Vance's terrace and at Mabel's flat. Coordinates come from the homes table, not typed in.

## Read first
- `games/gnome-theft-auto/src/homes/data.ts`: `homeDoor(characterId): [number, number]` (the spot outside the door).
  Homes: `'mayor-mulch'` (the Mayor's red villa, Patio Heights, (80, -133.5)), `'juniper'` (Juniper Vance's narrow
  terrace on Kerb Row, (-90, 130.5)), `'mabel'` (Mabel Kerbstone's flat over the Kerbstone Cabs garage, (-138.5, 30)).
- `games/gnome-theft-auto/src/quests/chapter1.ts`: quest `ch1-two-coat-tail` (tail the Mayor to Patio Heights, witness
  the kickback, crack the bodyguards, deliver the photos to Juniper at City Hall).
- `games/gnome-theft-auto/src/quests/cityQuests.ts`: quest `city-kerbside-rounds` (four `visit` steps).
- `games/gnome-theft-auto/src/quests/comms.ts` and `games/gnome-theft-auto/src/quests/commsCity.ts`: mission comms
  lines keyed by quest id and objective index; and any `beats` / `hoaSteps` on those two quests (keyed by objective
  index). Inserting a step shifts later indexes: keep every keyed line on the step it was written for.
- `games/gnome-theft-auto/src/quests/types.ts`: the `visit` objective (`text`, `at`, `radius`, `hint`, `toastOnEnter`).

## Change
- `games/gnome-theft-auto/src/quests/chapter1.ts`, `ch1-two-coat-tail`: insert one `visit` after the crack step and
  before the City Hall delivery: text "Post a copy of the photos through Mayor Mulch's own letterbox at his red villa",
  `at: homeDoor('mayor-mulch')`, `radius: 4`, hint "The Mayor's Residence (Patio Heights)", `toastOnEnter`: a dry line
  (e.g. "Through the letterbox. Somewhere inside, a small dog and a large Mayor both start barking."). Import
  `homeDoor` from `../homes/data`.
- `games/gnome-theft-auto/src/quests/cityQuests.ts`, `city-kerbside-rounds`: replace the City Hall notice step's place
  with two home drop-offs and keep the notice idea: (a) "Drop the Tattler through Councilwoman Vance's letterbox on Kerb
  Row" at `homeDoor('juniper')` (toast: the notice for the zoning board goes in with it; she has a letterbox labelled
  "PAPERWORK" and one labelled "MORE PAPERWORK"); (b) a new step "Leave Mabel's copy at the Kerbstone Cabs garage
  (flat above)" at `homeDoor('mabel')` (toast in Mabel's voice: she pays for it in exact change before you ask). Keep the
  first two steps and the final "Report back to Dot" step. Radius 5 for both.
- `comms.ts` / `commsCity.ts`: shift or add lines so every comms line still belongs to the right step (add one short
  line for each new step only if those files give every step a line; follow what they do).

## Contract
Quest ids unchanged. `homeDoor` from homes/data.ts is the only source of home coordinates.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/quests src/questSim/coverage.test.ts` passes.
- `git diff --stat` shows only chapter1.ts, cityQuests.ts and the comms file(s) you had to touch.

## Out of scope
defs.ts, homeQuests.ts, questSim/plans.ts (another worker edits those), homes/*, home/*.
