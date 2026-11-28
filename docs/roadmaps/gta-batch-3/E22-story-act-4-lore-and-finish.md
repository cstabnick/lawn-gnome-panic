# E22 Story act IV (quests 54-70), lore and finish
Wave: 9 · Depends on: everything (E01 to E21; E20 and E21 provide the layout, quests 1 to 53 and the CAST) · Kind: Story + Finish
Source items: L84 quests 54-70 with the extended pivotal quests, L86 (final lore pass), the batch finish (checks, demos, PR)

- L84 add more quests to the main questline. I think we need some more character development. write out the docs, write out the direction, the characters, then start developing. I'm looking for 70 main quests, with a few extended quests at pivotal moments.
- L86 take another pass writing out menial lore for the new extended world.

## Goal
Three jobs, in this order: (1) build the final act, quests 54 to 70, ending in the finale (`ch5-even-cut`, variants A/B,
id unchanged, now the last main quest); (2) the final lore pass over everything the batch added (L86); (3) the batch finish:
full checks on the merged branch, demos, and the rewritten PR description. Build protocol, layout and per-quest
checklist are those of E20 (`docs/roadmaps/gta-batch-3/E20-story-acts-1-2.md`) and E21 (`E21-story-act-3.md`); this
brief lists what differs.

## Scope
In: quests 54 to 70 (17 quests): the existing quests the outline places here (likely the Dust Flats chapter 4 trio:
`ch4-runway-flares`, `ch4-sandpit-drop`, `ch4-spade-truce`, and `ch5-even-cut` as the finale), new quests, **all remaining
extended pivotal quests, including the finale's multi-part sequence**, with cutscenes, comms, stages, voices, homes and
workplaces for the cast's last arcs (reunions and drop-offs: L58), the epilogue state (world changes from the full
`world-changes.md` list that fire on the finale), final-act achievements and rewards; the lore pass; checks; demos; PR text.
Out: new places or engine work (any gap found at the end is listed in the PR as deferred, not built here); quests 1 to 53.

## Code pointers (confirmed)
- All E20 pointers; the finale today is `src/quests/chapter5.ts` (70 lines, id `ch5-even-cut`, achievement `gta-even-cut`,
  `QUEST_PLANS` row has `variants: ['A','B']`), scenes `src/cutscene/scenes/story/ch5.ts`, and `ch4*.ts` for the Dust Flats
  setpieces (Fort Sandpit, airfield, `air-drop`, `convoy-ambush`). Stages `src/quests/stages/east.ts` / `speedway.ts` / `wilds.ts`.
- Act layout files created by E20/E21 (`src/quests/story/actIV.ts` is E22's, created in its setup issue).
- Lore: `docs/lore/` (`npm run lore`, `npm run lore -- find <word>`), `docs/lore/settings.md`, `rulings.md`, `entries/apocrypha/`,
  E04's first-pass entries; design docs `docs/design/gnome-theft-auto/*.md` (update `story.md` so section 6/9 matches the 70-quest story).
- Demos: `docs/demos.md`, `npm run demo -- <demo.json> --gif` (NEVER `--pr`; user rule: do not use the `demo-assets` branch).
  Upload the GIF/MP4/screenshots with the media-upload MCP (`mcp__plugin_media-upload_media-upload-mcp-prod__*`; load via
  ToolSearch, `list_allowed_types` then `request_upload`) and put the returned URLs in the PR description with `gh pr edit`.
- Checks: `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm run quest-sim:suites -w games/gnome-theft-auto`,
  `npm run cutscene-report -w games/gnome-theft-auto`, `?cutscenecheck`, `npm test -w packages/<each package touched in the batch>`
  (prefabs, achievements, mp, shared minigame packages and the source games: gba-gjam, aether-board, gnome-golf, cooking-gnoma),
  `npm run lore`, `bash tools/smoke.sh <url> <dom-marker>...`, `npm run zfight -- <url>` with the dev server up; phone viewport 390x844 pass.
- PR: branch `gta-batch-3`, repo `cstabnick/lawn-gnome-panic` only (`--repo cstabnick/lawn-gnome-panic`; never QMasterMoo/lawn-gnome-panic).

## Contracts this epic provides
- The complete 70-quest story and a lore set (entries, rulings, settings, design docs, `AGENT_INDEX.md` row) consistent with it.
- A finale that works from a save at quest 53 and from an old save already past quest 17 (the finale id is unchanged and its prereq chain is satisfied).
- Final demo assets and the rewritten PR description covering all 22 epics (what changed, how to run, tested, not tested, mobile and online per game feature).

## Contracts this epic consumes
- E20 and E21 layout, aggregators, CAST and voices; E04 outline rows 54 to 70 and the pivotal list; everything E01 to E19 for
  callbacks (a place the finale revisits, a world change that must show); E18's world-change mechanism.

## How to split (E22 has three parts)
Part A: build quests 54 to 70. The lead runs a setup issue (aggregator `actIV.ts`, registrations, `QUEST_PLANS` stubs, the
`unlocks.ts` story-order comment), then 4 to 5 sub-epics of 3 to 4 quests grouped by region/arc (Dust Flats and the military
setpieces; the return through the earlier regions for farewells and drop-offs; the extended finale as its own sub-epic of
multi-part scenes, one worker per part pair). At most 2 quests per worker; the finale's parts are 2 per worker. The lead
alone assembles the extended quests and edits hot files.
Part B: lore pass, as sub-epic of read-only checks then writes: (1) one worker per area/character group greps the batch's
diff for names (`git diff main --stat`, then `npm run lore -- find`) and writes missing entries; (2) reconcile dialog, signs,
radio text, item names against entries (a mismatch gets fixed in the game text if it's cheap, otherwise in the entry);
(3) menial lore (L86): signage, shop menus, radio ads, graffiti, journal flavour for each new area, one worker per 2 areas,
each limited to data and text files; (4) rulings for any new canon; update `settings.md`, `INDEX`; `npm run lore` passes.
Part C: finish (lead only, with at most 2 helper workers): run the full checks on the merged branch, fix what breaks or
list it; record 4 to 6 demos (the new story's first scene, a new area, an extended quest scene, a mobile-viewport clip) with
`npm run demo -- <demo.json> --gif`, upload via media-upload MCP, rewrite the PR description via `gh pr edit`.

## Per-quest checklist
The ten E20 points plus the E21 additions, and for the extended finale: each part has its own scene; the player cannot get
stuck between parts (a save inside a multi-part quest resumes at the right part: test by reload); both variants of the
ending (A/B) remain reachable and the sim runs both; the epilogue state persists after the finale and Free Roam works afterwards.

## Online / mobile / achievements / prefabs / lore notes
- Single-player story. Achievements: act IV set including a "saw the whole story" one (cosmetic reward via an existing prefab; `npm test -w packages/achievements`).
- Mobile: phone-viewport run of the first and last quest of the act; choice prompts must have 44 px targets.
- Prefabs for unique finale objects through `@lawn/prefabs`. Lore: Part B above; `npm run lore` must pass at the end.

## Risks and open questions (with the decision taken)
- Last in the chain, so it absorbs earlier slippage: decision, if earlier epics left gaps, the lead lists them in the PR
  under "deferred" and keeps the story consistent by trimming beats, not by building places.
- Merge-state failures from 20 epics: decision, Part C starts with the full build and test run; failures caused by one
  epic are fixed minimally by the lead or reported to the orchestrator; no big rewrites here.
- Size of the PR description and demos: demos upload through the MCP only; if the upload tool is unavailable, state that in the PR and leave placeholders; do not push to `demo-assets`.
- Demo recording needs a running game and headless Edge; if it fails on this machine, record fewer clips and list what is not shown.
- Finale variants and old saves: a save past the old finale (all 17 done) is offered the new quests as catch-up, per E04's rule; the finale's `done` flag is not cleared.
- The lore pass can drift into rewriting existing lore: decision, additions and fixes only; no deletion of existing entries.

## Done when
- Quests 54 to 70 play in order after 53; the finale ends the story with the epilogue state; sim passes (or documented known failures).
- `npm run lore` passes with entries for every new named thing; `story.md` and `AGENT_INDEX.md` describe the 70-quest story.
- Whole-batch checks (list above) pass on the merged `gta-batch-3` branch, a phone-viewport check is done, demos are uploaded
  via the media-upload MCP and linked in the rewritten PR description (never via `--pr`), and the lead's 30-line report
  lists deferred items. The lead commits on its own branch and does not push; the orchestrator merges and pushes.
