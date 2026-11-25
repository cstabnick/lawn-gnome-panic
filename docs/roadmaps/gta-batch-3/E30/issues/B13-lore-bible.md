Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Other workers are writing the
town's code and two other lore entries (`radio-adagio.md`, `ottavio-lento.md`) right now; do not create those two.

## Goal
Every new named place and person in Pardonlin has a lore entry, the town's satire has its rulings, the Pardonlin entry
lists what is now built, and the story bible knows the Pardonlin residents.

## Read first
- `docs/lore/README.md` (entry schema), `docs/lore/canon.md` (house rules), `docs/lore/entries/apocrypha/pardonlin.md`
  and `the-wickets.md` (the voice and the format), the end of `docs/lore/rulings.md` (latest ruling number: add yours
  after the last one, numbered on), `docs/lore/settings.md` (Pardonlin's row, if any).
- `docs/design/gnome-theft-auto/characters.md` (skim: how a character row/section is written).

## The town (fixed facts to write from)
Districts: **the Old Town** (east bank, north of the Hatwheel: the Bean Tower, the Grand Platz, the Rue Haute),
**Teacup Row and the Quays** (south of the Hatwheel: the café lane, the east quay, Place du Pot), **the Left Bank**
(west bank: Radio Adagio in the Opera Hall, the Beetle Market, artists' terraces, the backyards), **the Jardin and the
Basin** (the formal garden north of town, the Little Gardens allotments, Basin Quay).
Places: **the Bean Tower** (a giant Tall-One bean-pole wigwam, 30 m, runner beans climbing it; the town's landmark;
admission one acorn, exit two; the queue for it has its own queue), **the Grand Platz** (the main square: fountain,
bandstand, the Unknown Pigeon statue, boules, café terraces), **the Unknown Pigeon** (a statue of a pigeon nobody can
identify; the real pigeons hold committee meetings on its plinth), **Teacup Row** (a pedestrian café lane),
**Café Pardon** (a walk-in café on Teacup Row; its waiter Hector Disdain never takes an order), **the Beetle Market**
(covered market hall and stalls, cheese aged by argument), **the Jardin** (the formal parterre, clipped with nail
scissors), **the Little Gardens** (allotments; the marrow war), **Basin Quay** (the harbour on Pardonlin Basin; a
retired swan pedalo). Radio Adagio (96.1, classical, from the Opera Hall) has its own entry by another worker: link to
id `radio-adagio`.
People (all Continentals): Marcel Muet (the Grand Platz mime, stuck in an invisible box, never speaks), Odile Easelby
(painter; paints everything, including you, as a croissant), Gaston Plonque and the other Gaston (boules; have been
measuring the same throw for years), Fifi Haricot (the Bean Tower's guide, with a flag), Brigitte Levain (the baker;
the Baguette Round), Jean-Pot and Sabine Sip (café philosophers on one espresso since Tuesday), Hector Disdain (the
waiter), Anatole Bellows (accordion on the quay), Prudence Spine (riverside bookseller), Roquette Fromage (cheesemonger),
Sartorius Gloom (existential poet), Greta Clothespeg (backyard laundry, feud over a garden wall), Aurèle Clippe (the
Jardin's head gardener), Wilhelmina Marrow (allotment champion), Captain Anchois (Basin Quay harbourmaster). Maestro
Ottavio Lento has his own entry by another worker (id `ottavio-lento`).
Activities: queueing for nothing on the Grand Platz, the Baguette Round, sitting for Odile's portrait, the Flâneur walk.

## Change
- New entries in `docs/lore/entries/apocrypha/` (tier apocrypha, status draft, games [gnome-theft-auto], sources
  pointing at `games/gnome-theft-auto/src/pardonlin/` files and the rulings you add): one per place above (the Bean
  Tower, the Grand Platz, the Unknown Pigeon, Teacup Row, Café Pardon, the Beetle Market, the Jardin, the Little
  Gardens, Basin Quay) and one per person above (16), or group minor people sensibly if the schema has a group/kind
  for it (e.g. "the Gastons" as one entry). Each with "What gnomes say" (two quotes), "The truth", "In the games"
  (where: world coordinates are fine), "Loose threads" where something is left open.
- `docs/lore/rulings.md`: 2-3 new rulings: the rules of Pardonlin's satire (a Paris, London and Berlin mash, no real
  nationality named, affectionate, never mean; queues, lunches, strikes, bread as the town's four seasons); the
  Continentals and the HOA (Pardonlin is not an HOA town: its rules are older and politer and nobody enforces them);
  Radio Adagio's place on the dial (a bonus station heard only in and near Pardonlin on foot, on any car radio).
- `docs/lore/entries/apocrypha/pardonlin.md`: replace "Reserved for later, named here but not yet built" with what is
  now built (the four districts, the places, the people, Radio Adagio), add related ids.
- `docs/lore/settings.md`: if Pardonlin has a row, update it; if not, add one in the same format.
- `docs/design/gnome-theft-auto/characters.md`: a "Pardonlin (the Continentals)" section listing the residents with a
  line each (who, where, what they want, how they talk), Maestro Ottavio Lento included. They are not in the 70-quest
  outline yet; say they are available for later quests (E20-E22 may use them).
- Tone: gentle continental satire in the game's voice; nothing wet, soaked, dripping or bloody; no real places,
  composers, brands or nationalities.

## Done when
- `npm run lore -- check` passes at the repo root (do NOT run plain `npm run lore`: it rewrites the shared INDEX.md;
  links to `radio-adagio` / `ottavio-lento` may be reported missing until the other worker's files land: if those are
  the only errors, say so).
- Report the list of new entry ids and the ruling numbers.

## Out of scope
Code, `docs/lore/INDEX.md`, `radio-adagio.md`, `ottavio-lento.md`.
