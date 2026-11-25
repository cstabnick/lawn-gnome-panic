Epic: E17 wave 2 (living parts)
Depends on: wave 1 mole prefabs (done)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section; who DJ Moleman is).

## Goal
DJ Moleman's own burrow exists: a small hidden interior at the bottom of Loamdeep's Long Tunnel, where he plays one long
record through speakers dug into the soil. The player can stand at his decks and listen; he says a line; and they can
go back up the Long Tunnel.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`MOLEMAN_BURROW`, `SOCIETY_INTERIORS`, `LOAMDEEP.door/exit`)
- `docs/lore/entries/apocrypha/dj-moleman.md` and `subsoil-radio.md` (his voice; quirk: says "seat" instead of "kick
  drum"; the transmitter is never explained)
- `games/gnome-theft-auto/src/radio/content.ts` lines 170-200 (his station lines, MOLEMAN quotes to reuse the voice)
- `games/gnome-theft-auto/src/societies/loamdeep/interior.ts` (`markLongTunnelArrival()`: call it before going back)
- `games/gnome-theft-auto/src/golf/clubhouse.ts` (a defineInterior example)
- `games/gnome-theft-auto/src/societies/loamdeep/moleman.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/moleman.ts`: at import time `defineInterior({ id:
  SOCIETY_INTERIORS.moleman, name: "DJ Moleman's Burrow", door: LOAMDEEP.door, exit: LOAMDEEP.exit, size:
  MOLEMAN_BURROW.size, theme: <custom: floor packed dark earth, walls deep brown with a warm glow, trim brass, ceiling
  black, light deep amber>, ambience: 'silent', hiddenDoor: true, build(kit) {...} })` (hiddenDoor: no world door; the
  door/exit are only used if he is somehow left).
  - `kit.room()`; spawn at `MOLEMAN_BURROW.arrive` facing north (`kit.spawn(x, z, Math.PI)`).
  - `moleman-decks` at `MOLEMAN_BURROW.decks` facing south; `dj-moleman` at `MOLEMAN_BURROW.moleman` facing south
    (`solid: false`); two `dug-speaker`s in the north corners; crates of records (any record/crate prefab: grep
    'record\|vinyl\|crate' in packages/prefabs/src/catalog; else `root-crate`); a moss rug; a thick cable running up
    into the ceiling with a small sign on it "NOT THE TRANSMITTER"; a `mole-lamp-lit` on each side wall at y 1.8.
  - Signs: "THE FLOOR YOU ARE STANDING ON IS THE SPEAKER"; a framed card "TO CRESS, FROM BELOW" (do not explain);
    "PLEASE DO NOT SAY 'MOWER' AND 'KICK DRUM' IN THE SAME BREATH. SAY 'SEAT'."
  - A spot 1.6 m south of the decks, prompt 'Listen at the decks': `updateSocietySave((s) => { s.molemanMet++; })`
    (import from '../save'), and a `gta:interior-say` line from 'DJ Moleman', cycling through 5 lines in his voice
    (e.g. "Seat. Hear it? That's your heart, catching up.", "The family wants me home for supper. The family always wants
    me home for supper. I am home. It's just further down.", "A tunnel has no gaps in it, so the set has none either.").
  - A spot at `MOLEMAN_BURROW.stairsBack`, prompt 'Back up the Long Tunnel': `markLongTunnelArrival();
    enterInterior(SOCIETY_INTERIORS.loamdeep);` (from './interior' and '../../interiors').
  - `onEnter`: a one-line toast via `gta:interior-say` from 'DJ Moleman': "Oh. A visitor. Mind the cable."
- `games/gnome-theft-auto/src/societies/loamdeep/moleman.test.ts` (new): the interior is defined, `hiddenDoor` true; with
  `createKit` (see `src/interiors/kit.test.ts`) building gives the spots 'Listen at the decks' and 'Back up the Long
  Tunnel'.

## Contract
Interior id `SOCIETY_INTERIORS.moleman` ('moleman-burrow'); the listen spot prompt exactly 'Listen at the decks' (a
quest step points at `MOLEMAN_BURROW.moleman` + 1.6 m south).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/moleman.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
