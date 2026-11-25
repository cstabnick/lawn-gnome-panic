# E30 roadmap: Pardonlin, the European town

Brief: [../E30-pardonlin-town.md](../E30-pardonlin-town.md). Lead: Opus. Branch `epic/E30-pardonlin`.

| epic | what | done when | issues |
|---|---|---|---|
| A (lead) | foundation: `src/pardonlin/layout.ts` (districts, clearance, `frontage`), `plan.ts` (plan types, `keepClear`), `plans.ts`, `town.ts` (static cells, colliders, sign-text atlases, `setEuroZone`), `layout.test.ts` (AC counts), district stubs, `life/sound/activities/interiors/speakers.ts` stubs, radio scaffolding (`'adagio'` station id, DIAL, STATION_CODES, harpsichord/cello/violin/oboe voices, `adagioStation.ts`, `songs/adagio.ts`), prefab catalog stubs registered, `world.ts` + `app.ts` wiring | tsc passes; layout helpers tested | (lead) |
| B | content, all parallel | build + tests + layout AC test pass | 13 |
| C (lead) | integration: fix-ups, Adagio listening achievement, screenshots, smoke, zfight, perf, screens.md, AGENT_INDEX | all checks | (lead) |

Epic B issues (full text in `issues/`; districts share [_district-common.md](_district-common.md)):

| id | file | owner files | agent |
|---|---|---|---|
| B1 | [issues/B1-old-town.md](issues/B1-old-town.md) | `districts/oldTown.ts` | Sonnet |
| B2 | [issues/B2-teacup-quays.md](issues/B2-teacup-quays.md) | `districts/teacupQuays.ts` | Sonnet |
| B3 | [issues/B3-left-bank.md](issues/B3-left-bank.md) | `districts/leftBank.ts` | Sonnet |
| B4 | [issues/B4-gardens.md](issues/B4-gardens.md) | `districts/gardens.ts` | Sonnet |
| B5 | [issues/B5-props.md](issues/B5-props.md) | `packages/prefabs/.../gta-pardonlin-props.ts` | Haiku |
| B6 | [issues/B6-landmarks-gear-achievements.md](issues/B6-landmarks-gear-achievements.md) | `gta-pardonlin-gear.ts`, `packages/achievements/src/catalog.ts` | Haiku |
| B7 | [issues/B7-adagio-music.md](issues/B7-adagio-music.md) | `radio/music/songs/adagio.ts` | Sonnet |
| B8 | [issues/B8-adagio-station.md](issues/B8-adagio-station.md) | `radio/adagioStation.ts`, 2 lore entries | Sonnet |
| B9 | [issues/B9-life.md](issues/B9-life.md) | `pardonlin/life.ts`, `life.test.ts` | Haiku |
| B10 | [issues/B10-sound.md](issues/B10-sound.md) | `pardonlin/sound.ts`, `sounds.recipes.ts`, `sound.test.ts` | Haiku |
| B11 | [issues/B11-interiors.md](issues/B11-interiors.md) | `pardonlin/interiors.ts` | Sonnet |
| B12 | [issues/B12-activities.md](issues/B12-activities.md) | `pardonlin/activities.ts`, `activityLogic.ts`, test | Haiku |
| B13 | [issues/B13-lore-bible.md](issues/B13-lore-bible.md) | `docs/lore/...`, `characters.md` | Sonnet |

Cross-issue fixed points (written into the issues that share them): Café Pardon (corner café at (-1532,140), door
spot (-1527.8,139)); the bakery (-1515.2,130) and Brigitte's spot (-1520.5,128.5); the Grand Platz queue line
(x -1488.2, z -196..-232, posts at x -1486.8); Odile's sitter spot (-1540,-270); the Opera Hall (-1668,-100) facing west,
door spot (-1680,-100), horn speaker (-1684,-106); town speakers (`speakers.ts`); bandstand at (-1500,-235); the Beetle
Market radio (-1733,170).

Online: the town is local decoration; the only wire change is the appended station code. Mobile: activities use the
interact button. Party slice: none (a town is not a 20-60 s round; backlog unchanged).

## Result

Done: all 13 B issues, plus two lead fix-ups (the Grand Platz centre was bare; the Bean Tower's beans split into
`pl-bean-vines-1..4` because the catalog caps a prefab at 40 parts). Screens and AC: [screens.md](screens.md).

Deferred / known:
- `npm test -w packages/gnome` fails on this branch before E30 (neck-gear clearance and hold-pose checks for many
  existing items, e.g. `riviera-scarf`); the new `queue-ticket-lanyard`, `flaneur-cravat`, `daily-baguette`,
  `pl-accordion`, `pl-baguette`, `pl-tour-flag` fail the same checks. Needs a pass over those gnome-package rules.
- Not checked on a real phone; checks were desktop headless Edge. Activities use the touch action button.
- Town residents, pigeons and activities are local per browser (online: only the Radio Adagio station code is new).
- The Left Bank and the Old Town are very dense (848 and 435 buildings); `?perf` at the Platz is on par with downtown
  Turfton on a desktop GPU, but a low-end phone run (`node tools/gta-perf.mjs --cpu 4`) was not done.
- Paving tiles in the Old Town use 1.5 scale on a 3 m grid (large slabs); a finer grid would cost more placements.
