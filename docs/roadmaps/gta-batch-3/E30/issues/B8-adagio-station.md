Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Other workers edit other files at
the same time (the station's music in `songs/adagio.ts`; Pardonlin's other lore entries); touch only your files.

## Goal
96.1 Radio Adagio talks: a pompous, lovable host, idents, banter, ads and listener calls, written in the game's radio
voice; and the station and its host have lore entries.

## Read first
- `games/gnome-theft-auto/src/radio/content.ts`: the other stations (The Blade, Fescue Public, Compliance Beats,
  Subsoil): read two of them closely for the voice, length and the rules in the header (nothing wet, soaked, dripping
  or bloody; clay cracks and is glued back). Calls are one Line with the whole exchange: "CALLER: ... — MAESTRO: ...".
- `games/gnome-theft-auto/src/radio/adagioStation.ts`: your file (station shell with one banter line).
- `games/gnome-theft-auto/src/radio/schedule.test.ts` "gives every station enough to say": banter >= 12, calls >= 2,
  station ads + shared ads >= 8 (shared ADS already has 17, so 2-3 own ads is plenty).
- `docs/lore/entries/apocrypha/pardonlin.md` and `docs/lore/entries/apocrypha/turfton-fm.md` (or the nearest radio
  entry: `npm run lore -- find radio`), `docs/lore/README.md` (entry schema).

## Change
- `games/gnome-theft-auto/src/radio/adagioStation.ts`: keep `id`, `name` ('96.1 Radio Adagio'), `label`, `freq`
  ('96.1'), `theme: 'classical'`, `bonus: true`, `songs` exactly as they are. Write:
  - `sign`: the station ident in the host's voice (who 'MAESTRO').
  - `banter`: 16-20 lines. The host is **Maestro Ottavio Lento**: a pompous, kind, deeply slow conductor who runs Radio
    Adagio from the Opera Hall on Pardonlin's Left Bank; he believes everything should be played slower, including
    traffic; he introduces pieces at enormous length, mispronounces Turfton on purpose, adores the Thymes Quartet,
    despises the Blade (he calls it "the loud one"), has a running feud with the pigeons who sit on the Opera Hall roof
    during rests, keeps announcing strikes by the brass section, reads the Pardonlin weather (it drizzles; he is
    pleased), and gives driving advice (indicate, then wait a bar). Pardonlin places to mention: the Bean Tower, the
    Grand Platz, Teacup Row, the Beetle Market, the Thymes, the Hatwheel roundabout, the Wickets, Café Pardon, the
    Jardin, the Little Gardens, Basin Quay. Pardonlin people (fixed names): Marcel Muet the mime, Odile Easelby the
    painter, Brigitte Levain the baker, Hector Disdain the waiter, Fifi Haricot the Bean Tower guide, Roquette Fromage
    the cheesemonger, Anatole Bellows (accordion), Captain Anchois (Basin Quay). 3-4 lines are idents/station
    identifications ("You are listening to Radio Adagio, ninety-six point one. Please lower your engine.").
  - `ads`: 3 station ads (who 'AD' or 'MAESTRO'): Pardonlin businesses (Café Pardon, the Beetle Market, Brigitte's
    bakery, Opera Hall season tickets: "seats not provided").
  - `calls`: 3-4 listener calls (a Turfton caller who wants something faster; Fifi Haricot calling from the tower;
    Rooster, the game's barometer-shouting recurring caller, if it fits: see how other stations write him).
  Gentle continental satire, never mean, no real places, composers, brands or nationalities.
- New lore entries (schema from `docs/lore/README.md`, like `pardonlin.md`, `tier: apocrypha`, `status: draft`,
  `games: [gnome-theft-auto]`):
  - `docs/lore/entries/apocrypha/radio-adagio.md` (kind: organisation or place, whichever the schema uses for a
    station): 96.1, broadcasts from the Opera Hall on the Left Bank, classical only, the horn speaker in its forecourt
    and the town's gramophones, its programmes; related: pardonlin, ottavio-lento, turfton-fm (if that id exists).
  - `docs/lore/entries/apocrypha/ottavio-lento.md` (kind: person): Maestro Ottavio Lento.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/radio/schedule.test.ts` passes (the "every song gets played" case
  needs >= 8 songs, which another worker is adding right now; if only that case fails, say so and it is fine).
- `npm run lore -- check` at the repo root passes (do NOT run plain `npm run lore`: it rewrites the shared INDEX.md).
- Report the ident line and three favourite banter lines.

## Out of scope
`content.ts`, `songs/*.ts`, `schedule.ts`, other lore entries, `docs/lore/INDEX.md`.
