Epic: E17 wave 2 (quests)
Depends on: none (the places, jobs and probes are wired by other workers; quests only reference ids and points)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (who the Burrowfolk and DJ Moleman are).

## Goal
Loamdeep's mini-questline of mole jobs exists as three side quests: Nubbin's "Sorting the Post", Old Mother
Tumblesoil's "Lamplighters", and "The Under-Chorus", in which the player carries the family's invitation down the Long
Tunnel and DJ Moleman comes up to play for the Burrowfolk. Cute, polite, misunderstood moles; funny and warm.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`SOCIETY_QUESTS`, `SOCIETY_PROBES`, `SOCIETY_INTERIORS`,
  `LOAMDEEP.spots`, `LOAMDEEP.halls`, `MOLEMAN_BURROW`, `BURROW_DOOR`, `SOCIETY_CAST`, `MOLE_JOBS` lives in
  `loamdeep/jobs.ts`)
- `games/gnome-theft-auto/src/quests/types.ts` lines 50-110 and 195-300 (`DialogueLine`, `CutsceneSpec`,
  `ObjectiveDef` kinds 'visit' with `interior`, and 'probe'; `QuestDef`)
- `games/gnome-theft-auto/src/quests/rootwellQuests.ts` (a complete side-quest file: copy its shape)
- `docs/design/gnome-theft-auto/characters.md` sections "Nubbin" and "Old Mother Tumblesoil" (voices)
- `games/gnome-theft-auto/src/quests/loamdeepQuests.ts` (yours: the stub, already registered in `quests/defs.ts`; the
  givers 'nubbin' (surface, Burrow Door) and 'tumblesoil' (interior, the Mother's Hall) and the unlock rows exist)

## Change
- `games/gnome-theft-auto/src/quests/loamdeepQuests.ts`: fill `LOAMDEEP_QUESTS` with three `QuestDef`s. Interior visit
  points are LOCAL coordinates with `interior: SOCIETY_INTERIORS.loamdeep` (or `.moleman`). Dialogue uses `room:
  'street'`; moles have no gnome look, so give their lines no `look` (or a grey one: `{ hat: 0x8a8c92, shirt: 0x8a8c92,
  beard: null }`). `hoa: 'off'` on all three.
  1. `SOCIETY_QUESTS.burrowPost` "Sorting the Post", giver 'nubbin', reward 300. Intro (Nubbin, tiny and formal: "If you
     please, the post is late. I am sorry for it."): the Postern sorting has fallen behind since he got lost up top, and
     Mister Sift is too polite to complain. Objectives: visit Postern Hall at `spots.sortingDesk` (radius 2.5, interior
     loamdeep, hint 'Postern Hall, Loamdeep (the Burrow Door)', toastOnEnter Mister Sift's thanks); probe
     `SOCIETY_PROBES.molePost` count 1 ("Sort the post at the pigeonholes", `at` none, hint 'Postern Hall'); visit the
     Mother's Hall at `spots.tumblesoilFront` (radius 2.5, "Take Ma'am her letter"); visit Hearth Hall at
     `spots.rootDrops.hearth` (radius 3, "Auntie Crumb's letter", toast: she offers grub bread; you politely decline;
     she is not offended, only sad). Outro: Nubbin: "Oh. Most kind. I shall carry the next one with care."; Tumblesoil
     (by letter): "Dear one. Come and see me." doneText.
  2. `SOCIETY_QUESTS.lamps` "Lamplighters", giver 'tumblesoil', prereq burrowPost, reward 400. Intro (Tumblesoil, slow,
     grandmotherly: "Sit. Mind the lamp. It is older than your hat."): the lamps down the tunnels have burned low and
     Mistress Delve's knees are not what they were. Objectives: visit Lamplight Hall at `spots.taper` (radius 2.5,
     toast Delve hands you a taper "Light them as if they were asleep. Gently."); probe `SOCIETY_PROBES.moleLamps` count 3
     ("Light the lamps down three tunnels (Lamplighter x3)", hint 'Lamplight Hall: take a taper'); visit the Mother's
     Hall `spots.tumblesoilFront`. Outro: Tumblesoil: "We dig where we are asked, dear one. Nobody has ever asked." and
     a hint of the next: the Under-Chorus has had no music since the cousin moved out.
  3. `SOCIETY_QUESTS.underChorus` "The Under-Chorus", giver 'tumblesoil', prereq lamps, reward 500. Intro: Tumblesoil
     wants the family together for one supper; DJ Moleman lives at the bottom of the Long Tunnel and "has been home for
     supper every night for eleven years, just further down". Objectives: probe `SOCIETY_PROBES.moleRoots` count 1
     ("Roots for the welcome supper (a Root Run)", hint 'Rootway Hall'); visit `MOLEMAN_BURROW.moleman` + 1.6 m south
     (i.e. `[moleman[0], moleman[1] + 1.6]`, radius 2.5, interior `SOCIETY_INTERIORS.moleman`, text "Take the invitation
     down the Long Tunnel", hint 'Under-Chorus Hall: the Long Tunnel', toastOnEnter: DJ Moleman lifts one headphone,
     reads the invitation, says "Seat." and starts packing a crate of records); visit Under-Chorus Hall at
     `spots.danceFloor` (radius 4, interior loamdeep, "Back up to the Under-Chorus", toast "The floor starts to hum.").
     Outro (dialogue): DJ Moleman: "Evening, Ma'am. I brought the floor." / Tumblesoil: "The Hall's heartbeat. Welcome
     home, cousin." / Nubbin: "Is it always this loud?" / DJ Moleman: "Only where it matters. Seat." doneText: "DJ
     Moleman is playing the Under-Chorus. The moles say it is the first time the halls have danced since the dry summer."
     (do not explain his transmitter; the Under-Chorus achievement fires on its own when the player stands there).
- `games/gnome-theft-auto/src/quests/loamdeepQuests.test.ts` (new): three quests with the ids above; every interior
  visit names a defined interior id from `SOCIETY_INTERIORS`; the chain of prereqs is burrowPost -> lamps -> underChorus;
  every probe objective uses an id from `SOCIETY_PROBES`.

## Contract
`LOAMDEEP_QUESTS` with the three ids from `SOCIETY_QUESTS` (other modules read quest 3's 'done' state).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests/loamdeepQuests.test.ts src/quests/unlocks.test.ts` passes
  (unlocks.test may fail only on `sq-underspan-*` / `sq-flock-*` ids, which another worker is adding right now: say so).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (societyQuests.ts is another worker's; defs.ts and unlocks.ts are the lead's).
