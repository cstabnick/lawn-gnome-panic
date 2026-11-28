# E17 Underground societies
Wave: 6 · Depends on: E01 (cult camp, mole entrance and highway-underside sites), E05 (interiors), E04 (story bible) · Kind: Content

Source items:
- L28 "build a society underneath the highway. give a quest or two. make them a bit crazy and radical but brilliant"
- L40 "add a cult somewhere."
- L50 "add an underground society. this will have a small mini-questline for moles and doing mole jobs. amke them fun innocent little fellas that are rather cute but misunderstood broadly by gnomes and tall ones. make dj moleman make an appearnace."

## Goal
Three distinct hidden communities, each with its own look, tone and quests:
1. **Under the Skyway:** a radical, brilliant society living in the shadow of the elevated roads (engineers, inventors, contraptions).
2. **A cult** somewhere in the countryside (a camp with a ritual site and a leader), a quest that is funny and a little ominous but ends gently.
3. **The moles:** an underground society reached by a mole entrance, cute and innocent, misunderstood by gnomes and Tall Ones, with a small questline of mole jobs and a DJ Moleman appearance.

## Scope
In:
- Skyway society: a district built into the underside of one existing skyway (columns, scaffolds, hung platforms, workshops), 1 or 2 quests, an interior (a workshop) via E05.
- Cult: a camp (tents, a ritual circle, banners, a shrine), leader and followers, 1 or 2 quests, humour first.
- Moles: an entrance on the surface (a mound or burrow), an underground space (E05 interior or a separate level-like cell), 3 to 5 mole jobs (delivery of roots and worms, tunnel patrol, sorting, light-keeping), a cute mole cast, DJ Moleman's cameo in his burrow.
- Achievements with cosmetic rewards, map markers, ambient gnomes and creatures for each place.

Out: main-story act quests that use these places (E21); a general player-owned burrow; the E16 fauna epic's wild moles on the surface (keep wild moles untouched).

## Code pointers (confirmed)
- Skyways: `games/gnome-theft-auto/src/highways/skyways.ts` (`SKYWAYS`: `turfton-skyway` x -219..550 at z -60, `beltway-north`, `beltway-south`, `unfinished-span`, `site-*` ramps; `SKYWAY` tuning: `solidBelow` 4, `bentSpacing` 24, `columnSize` 1.2, `slab` 1; `SKYWAY_SITES`: `airfield-works`, `beltway-works` yards), `highways/sites.ts` (`buildSkywaySites`: a deterministic prefab yard dressing with colliders; the model for building a society under a deck), `highways/deck.ts` (`deckContactsAt`, `deckSamples`), `highways/install.ts` (`blockedBySkyway`, `installSkyways`), `highways/deck.test.ts` rules: nothing in `world.boxes` stands inside a solid stretch or pokes into a viaduct underside, so anything under a viaduct must clear `deck.slab` and live below it. Columns stand just outside rails every 24 m: use them as supports.
- Underground and quest hooks: no code exists yet for underground (grep for mole, cult, underground in `src/` found only radio, fauna and quest strings). Entering a space is E05's API; `src/lockup/` (snapshot) and `src/cityScenery/` are patterns for self-contained built areas.
- Cult and camp dressing: `src/parks/kit.ts` (`put`, `perimeter`, `patch`, `dressAt`, `gnome`, `noticeboard`) and `src/fringe/` (shacks and tents are L72 in E16: share if available) as layout kits; `src/flora/` scatter.
- NPCs: `src/npcs.ts`, `src/vibeNpcs.ts`, `src/ambientGnomes.ts` (a table of ambient types; `amb-fells-skater` is an example row), `src/city/cityCast.ts`. Quests: `quests/sideQuests.ts`, `quests/newcomerQuests.ts` (`NEWCOMER_QUESTS`), `quests/types.ts` (`QuestDef`, `ObjectiveDef`, `CutsceneSpec`), `quests/stages/` for staged sets, `cutscene/scenes/side/` (e.g. `tessie.ts`) for side cutscenes. Jobs: `src/jobs/` (`defs.ts`, `board.ts`, `gen.ts`, `places.ts`, `career.ts`) for repeatable work; mole jobs are a new job family on the phone Jobs app.
- DJ Moleman exists: lore `docs/lore/entries/apocrypha/dj-moleman.md` (canon: a mole in no costume, hat on the antenna, "108.0 Subsoil Radio", burrow under Turfton, transmitter under the Hat Watch's blind spot near Cress; quirks: says "seat", tunes to the Dew-Wells under Cloverfield), `subsoil-radio.md`, `turfton-fm.md`; GTA radio `src/radio/content.ts`; `packages/music/src/themes/undergroundSet.ts`; `games/gnome-set-radio` level `subsoil-relay.level.json` and `src/data/cast.ts` (his set-radio cast and prefabs in `packages/prefabs/src/catalog/gnome-set-radio.ts`). Reuse his look and quotes; do not rewrite him.
- Mole lore: `the-dry-summer`, `first-rumble` (the moles' deep way, Dowager Mudtooth grudge against the Pipewrights), `mole-clans` is referenced in related lists but has no entry file: this epic creates it. Prefabs: `mole-claw` (weapon), `mole-crown` (trinket).
- Achievements: `packages/achievements/src/catalog.ts` (about 124 `gta-*` rows).

## Contracts this epic provides
- Site content for `skyway-society`, `cult-camp`, `mole-entrance` (positions exported as constants for E21 act III).
- A `moles` job family and `MOLE_*` constants; mole NPC cast and look (a mole `ambient` row usable by E16).
- Entry/exit hooks for underground spaces layered on E05 (one `enterMoleHall()` etc.).
- Achievements and cosmetics; lore entries (`mole-clans`, society names, leaders); a `settings.md` row.

## Contracts this epic consumes
- E01: three site slots (a footprint under a chosen viaduct stretch with clear ground, a countryside cult camp, a surface mound for the mole entrance) and their region ids.
- E05: interiors for the workshop, the cult's inner shrine, and the mole halls; if the API cannot do a large underground cell, the moles' level becomes a few linked interiors.
- E04: character names, tone, relationships (who among existing cast knows the moles; whether the Skyway society is Local 404-adjacent) and which main quests it ties to.

## Online / mobile / achievements / prefabs / lore notes
- Online: the places and NPCs are static data every client builds from the same seed; quest state is per player (`questSave.ts`). Mole job pickups follow the `jobs/runtime` pattern; no new sync system. Others simply see the player enter an interior (E05's concern).
- Mobile: all prompts use the existing interact button; no new hold controls. Ensure the underground UI fits a portrait phone.
- Achievements: first mole job, meet DJ Moleman, join (and leave) the cult, build the Skyway society's contraption; cosmetic rewards: `head` mole crown (prefab exists), goggles, cult hood.
- Prefabs: reuse `mole-crown`, `mole-claw`; add mole furniture, tunnel segments, banners, ritual circle, contraptions, hammocks. `flatLayer` for floor decals; `npm run zfight -- <url>`.
- Lore: required reading `npm run lore -- find moleman`, `find mole`, `find cult` (the Cursed House cultist is an unrelated Evil Shadow Gnome Cultist; keep distinct), `find skyway`. Record rulings: moles are small, gentle and misread; gnomes treat them as pests; Tall Ones are not home. Add entries for each named person and place; `npm run lore` must pass.

## Risks and open questions (decision taken)
- "Underground" in a heightmap world. Decision: underground is an E05 interior reached from a surface mound; the surface above stays solid terrain. No terrain tunnelling.
- Space under a viaduct is shallow (deck 7.5 m high on the main Skyway). Decision: use the Beltway or Skyway stretch where deck height is highest, build scaffolds and hung pods between columns, and keep drive-under clearance for cars (a lane stays open).
- Cult tone. Decision: a harmless cult of a minor lawn deity with absurd rules; no real-world religion and no violence; the quest resolves with a joke and a cosmetic.
- DJ Moleman cameo scope. Decision: one scene in his burrow plus his radio on the mole hall speakers; his full music behaviour stays with the radio system.
- Overlap with E16 (fringe shacks, fauna incl. wild moles) and E14 (toadstool forest): decide ground use through E01 sites; share the fringe kit, do not duplicate it.

## Done when
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto` (include `highways/deck.test.ts`), `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`.
- Tests: quest defs, job generator for mole jobs, site colliders do not break `deck.test.ts`, entrance and exit positions are walkable.
- Dev server: `bash tools/smoke.sh <url> <dom-marker>...`, `npm run zfight -- <url>`; manual: visit all three places at desktop and 390x844, finish the first quest of each.
