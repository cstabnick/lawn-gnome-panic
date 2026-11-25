Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. This is a comedy WRITING issue. It must be funny to watch.

## Goal
`workplaces/comedy/material.ts` holds five stand-up sets for the comedy job, the heckles, the hecklers, the Double Down
lines and the booker's verdicts. The joke of the whole job: the player's gnome performs a painfully UNfunny set in Le
Petit Groan, a cellar club in Pardonlin (a satirical continental town where everyone is a critic and disdain is an art
form), and the crowd grills it. The comedy is in how bad the material is and how the room reacts, not in good jokes.

## Read first
- `games/gnome-theft-auto/src/workplaces/comedy/types.ts`: `Beat` (line, anim, s, react, heckle), `ComedySet`,
  `Heckler`, `CrowdReaction`, `CLUB.seats` (10 seats, index 0..9).
- `games/gnome-theft-auto/src/workplaces/comedy/material.ts`: the stub; keep every export and `setFor` as is.
- `games/gnome-theft-auto/src/anim/types.ts` lines 21-100: the animation ids usable as `anim` (EMOTE_IDS such as
  'shrug', 'point', 'bow', 'facepalm', 'laugh', 'taunt', 'flex'; EMOTE_B_IDS 'air-guitar', 'slow-clap', 'nope',
  'chicken', 'tantrum'; IDLE_IDS 'scratch-head', 'tap-foot', 'think', 'cross-arms'; BIT_IDS 'hiccups', 'sweat-heat',
  'pat-pockets', 'check-watch', 'sip-drink'; DANCE_IDS 'dance-robot'; REACT_IDS 'flinch'). Only use ids that exist.
- `games/gnome-theft-auto/src/pardonlin/interiors.ts` (Hector Disdain's lines: the Pardonlin voice) and
  `docs/lore/entries/apocrypha/pardonlin.md`.

## Change
- `games/gnome-theft-auto/src/workplaces/comedy/material.ts`:
  - `SETS`: five sets, `level` 1..5, ids `set-<slug>`. Lengths: level 1 = 7 beats, then 8, 9, 10, 12. Each set has a
    hopeless theme a Turfton gnome thinks is gold: e.g. 1 "Hedges: What Is the Deal" (observational, the "what's the
    deal with..." that never lands), 2 "My Mower and Me" (a long story about a ride-on that goes nowhere), 3 "Acorn
    Economics" (puns about Acorns and interest that need explaining), 4 "An Evening of Prop Comedy" (a rubber trowel,
    a hat that is also a smaller hat), 5 "The Tall Ones Are Weird, Right?" (the bit everyone has heard 900 times,
    performed with total confidence and a song at the end). Mix: anti-climaxes, a pun that the gnome then explains,
    a callback to an earlier joke that also didn't work, a long pause, a premise abandoned halfway ("Anyway."), a
    "Is this thing on?", reading a joke off a note card, laughing at their own joke alone. `s` 2.5..6 per line.
  - Reactions: most beats 'silence', 'cricket', 'cough', 'groan', 'sigh'; some 'heckle' (with a specific `heckle`
    text when it is a direct answer to the line); per set: level 1 has one 'tomato', level 3+ two, level 5 three; one
    'walkout' from level 3; exactly one 'pity-clap' per set (a single gnome claps once, then stops). Escalate: later
    sets get worse reactions.
  - `intro` per set: Mireille Sans-Rire (the booker, who has never laughed) introduces the act with flat contempt
    ("Our next act has been told many times not to come. Here they are.").
  - `closer` per set: the gnome's sign-off ("You've been great. Statistically, someone was.").
  - `HECKLES`: 24 Pardonlin-style heckles: precise, cultured, withering, never crude ("I have seen sadder things. In a
    museum. On purpose.", "Is there an interval? Can it be now?", "My grandmother laughed once. She was wrong too.").
  - `HECKLERS`: 8 named regulars with seats 0..9 (e.g. "Professor Grimace" in the front row, "Odette Who Has Seen It
    All", "The Man Eating Soup Loudly", "a critic from Le Moniteur"). Unique seats.
  - `DOUBLE_DOWN_LINES`: 12 lines where the gnome refuses to let a dead joke go: explains it, says it louder, does it
    again slower, adds a voice ("No, no, because HEDGES. Hedges! Get it? Because they... edge."). 
  - `VERDICTS`: five lines from Mireille by stars (1..5): all low-key insults; five stars is still not praise
    ("You stayed until the end. Nobody else did. Including me.").
- Keep every string <= 120 characters (captions on a phone). No swearing, nothing mean about real groups: the target is
  the gnome's own terrible craft and the snobbish room.

## Contract
Exports exactly as in the stub: `SETS`, `HECKLES`, `HECKLERS`, `DOUBLE_DOWN_LINES`, `VERDICTS`, `setFor`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/comedy/material.ts`.
- New `games/gnome-theft-auto/src/workplaces/comedy/material.test.ts`: five sets with levels 1..5 and the beat counts
  above; every `anim` is in the union of the anim id lists from `../../anim/types` (import `EMOTE_IDS`, `EMOTE_B_IDS`,
  `IDLE_IDS`, `BIT_IDS`, `DANCE_IDS`, `REACT_IDS`); every string <= 120 chars; hecklers' seats unique and in 0..9;
  `setFor(1, 0)` is the level-1 set. `cd games/gnome-theft-auto && npx vitest run src/workplaces/comedy/material.test.ts` passes.

## Out of scope
`comedy/types.ts` (do not change), every other file.
