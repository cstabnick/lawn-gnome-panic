# E17 contracts: underground societies

What E17 gives later epics (E18 Dewdrop, E20/E21 story acts, E16 fauna, R1 review). Code: `games/gnome-theft-auto/src/societies/`
(world.ts calls `buildSocieties`, app.ts calls `installSocieties`). Every place, id and name is in `societies/config.ts`;
import from `'../societies'` or `'../societies/config'` (pure data, safe in tests).

## Places (world coordinates; +x east, +z south)

| Place | Constant | Where | Walk-in |
|---|---|---|---|
| The Underspan | `UNDERSPAN` | site `skyway-under` x 560..600, z -51..-1, beside the Unfinished Span (never under the deck) | Hogweed's Workshop `underspan-workshop` (door `UNDERSPAN.workshopDoor` (584.5, -14)); the Roost rooftop `underspan-roost` (y 6) |
| Wader's Rest | `WADERS_REST` | site `cult-camp` centre (-1130, -640); the Standing Lady at (-1130, -668) facing west; ritual circle (-1130, -645) r 8 | the Big Tent `flock-tent` (door (-1130, -618.5)) |
| The Burrow Door | `BURROW_DOOR` | site `mole-entrance` (-1000, 300); door on the mound's east face (-993.5, 300) | Loamdeep `loamdeep` (one 104 x 90 m cell) |
| Loamdeep | `LOAMDEEP` | local: six halls (`halls`), tunnels (`tunnels`), job and story points (`spots`), 12 lamps (`lamps`) | DJ Moleman's Burrow `moleman-burrow` (hidden; `kit.stairsTo` from `spots.longTunnel`) |

- E21 act III / E22: these are the places of `m10-under-the-span`, `m24-the-burrow-door`, `m25-one-leg-to-stand-on`,
  `m33`, `m49-loamdeep`, `m51-the-flock-stands`, `m56`, `m60-the-moles-dig`, `m64`. Quest `visit` steps can point at any
  `LOAMDEEP.spots` point with `interior: 'loamdeep'`. `markLongTunnelArrival()` (loamdeep/interior.ts) before
  `enterInterior('loamdeep')` spawns the player at the Long Tunnel's mouth.
- E18 Dewdrop: the empty `dewdrop-cradle` stands in the workshop at `WORKSHOP_ROOM.dewdropCradle`; Hogweed is the
  giver 'hogweed' (quests/defs.ts GIVERS) at `UNDERSPAN.hogweed`.
- E16 fauna: wild moles on the surface are untouched; Burrowfolk figures are prefabs `burrowfolk-mole`, `mole-pup`,
  `mole-nubbin`, `mole-tumblesoil`, `dj-moleman` (pivots `body`, `head`, `arm-l`, `arm-r`) for any "moles in plain
  sight" world change (W13).

## Givers, quests, unlocks

- Givers: `nubbin` (Burrow Door), `tumblesoil` (interior, the Mother's Hall), `hogweed` (Underspan), `saxifrage` (Wader's
  Rest). Homes registered (`registerHome`) with door + interior for hogweed, saxifrage, nubbin, tumblesoil.
- Side quests (`SOCIETY_QUESTS`): `sq-burrow-post` -> `sq-loamdeep-lamps` -> `sq-loamdeep-under-chorus`;
  `sq-underspan-verticality` -> `sq-underspan-scrap-run`; `sq-flock-errands` -> `sq-flock-vigil`. Temporary unlock rows
  in `quests/unlocks.ts` (after existing chapter quests); E20/E21 move them to the spine rows named there.
- `sq-loamdeep-under-chorus` done => `SocietySave.molemanVisits` (set by `societies/achievements.ts`): DJ Moleman plays
  the Under-Chorus decks from then on and Loamdeep's dug-in speakers play Subsoil Radio ('under') through
  `societies.speaker()` in app.ts.

## Probes (`SOCIETY_PROBES`, city/probes.ts) for quest `probe` steps

`mole-job-roots`, `mole-job-lamps`, `mole-job-post`, `mole-job-dig`, `mole-job-any` (finished shifts), `moleman-met`
(listened at his decks), `underspan-updraft` (Roost arrivals), `flock-sermon-stood` (sermons stood on one leg). Each
is a running total from `gta-societies-v1`; use `count: n` for "n more".

## Mole jobs

`loamdeep/jobs.ts` (pure rules: `MOLE_JOBS`, `startShift`, `takeRoots`, `dropRoots`, `lightLamp`, `recordSorting`,
`recordNook`, `shiftStars`, `shiftPay`), `loamdeep/runtime.ts` (spots, HUD strip, pay via `economy.earn(.., 'Loamdeep')`,
E24's shift card). Not a `WorkJobId` (no career XP): a later epic can fold them into `jobs/career.ts`. Event
`gta:mole-job-done` `{ job, stars, pay }`.

## Save, events, achievements, sound, anim

- Save key `gta-societies-v1` (`societies/save.ts`, in saveIO + cloud merge: counts take the larger side).
- Window events (`SOCIETY_EVENTS`): `gta:mole-job-done`, `gta:underspan-updraft`, `gta:flock-sermon`.
- Achievements (`SOCIETY_ACH`): `gta-honest-dirt` (post-satchel), `gta-every-hall` (loamdeep-lamp-cap),
  `gta-seat` (subsoil-headphones), `gta-unauthorised-verticality` (underspan-goggles), `gta-birds-of-a-feather`
  (flock-hood, quest), `gta-sat-down` (reed-tea-cup, vigil choice B).
- Sounds (REGION_SOUNDS): `weld-crackle`, `pedal-whirr`, `reed-rustle`, `flock-hum`, `soil-crumble`, `lamp-whoomp`,
  `mole-squeak`, `burrow-drip`. Idle anim `'one-leg'` (any gnome).
- Prefab catalog files: `gta-moles.ts`, `gta-loamdeep.ts`, `gta-loamdeep-home.ts`, `gta-underspan.ts`, `gta-flock.ts`,
  `gta-societies-gear.ts`.
- Lore: rulings R-207..R-211; entries for every named person and place (see `npm run lore -- find loamdeep`).
