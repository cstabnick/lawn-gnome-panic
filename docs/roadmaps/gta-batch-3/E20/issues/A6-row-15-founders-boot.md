Epic: E20-2 act I quests (wave A)
Depends on: E20-1 (the passenger/inspect kinds, cast presets, props and achievements exist)

**First read `docs/roadmaps/gta-batch-3/E20/issues/_quest-common.md` in full: it is the contract (files you own, the StoryFile shape, the objective kinds, the writing and scene rules, the checks, the report).**

## Goal
Rows 15 of the story outline are playable, directed quests in the one-file-per-row layout.

## Your files
- src/quests/story/15-founders-boot.ts, src/cutscene/scenes/story/m15-founders-boot.ts, src/quests/stages/story/s15-founders-boot.ts
- src/quests/chapter1.ts (remove the `ch1-founders-boot` def only; it moves to your story file)
- src/cutscene/scenes/story/ch1d.ts (the existing founders-boot-intro and founders-boot-outro: you may extend the outro)
- direction notes for your new scenes and the outro's note

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 15 | ch1-founders-boot | p1 Parade Permits, p2 Dress Rehearsal, final Founder's Boot & The Kangaroo Court | I -> II |

Extended parts:

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
|---|---|---|---|---|---|---|
| ch1-founders-boot-p1 | 15 | Parade Permits | visit the Tattler Building; probe the parade office for the float keys; steal-deliver the keys to Side-Valve Salvage | intro: parade-permits-intro (day) Hedda Galley at her desk, pencil behind her ear, tells the keys are in the parade office | hedda, tansy, juniper | prereq m14-drainpipe-court; reward 300 acorns; Hedda is introduced by name in Tansy's call (Hedda Galley, Tattler, owes Juniper); heat 1 on entering the office |
| ch1-founders-boot-p2 | 15 | Dress Rehearsal | steal-deliver the Boot float onto the Even-Estates site at night; checkpoints (vehicle boot-float, damage limit) through the show-homes with the night watch chasing | intro: dress-rehearsal-intro (night) Chard Levelright on the site, torch, a clipboard; outro: dress-rehearsal-outro (night) the float parked beside the bay | chard, tansy, pip | prereq ch1-founders-boot-p1; reward 500 acorns; Chard first speaks here as foreman; fallback for the chase: chase-follow with the night-watch cart; mobile: none new |
| ch1-founders-boot | 15 | Founder's Boot & The Kangaroo Court | the existing three objectives (hijack the float and crash the Amphitheater tribunal; scatter Reginald and the bailiffs; escape the 4-Hat pursuit in the getaway Combine) | intro: founders-boot-intro (day) existing; outro: founders-boot-outro (dusk) existing, extended with Juniper's rezoning and Vesper at the window | tansy, pip, juniper, reginald, vesper, hedda | prereq ch1-founders-boot-p2; reward 700 acorns; keeps the id so old saves stay finished; new outro runs 30 to 45 seconds, last image is Vesper |

Achievement candidates (already built under the ids below):

| ch1-founders-boot-p2 | 15 | Dress Rehearsal | steal-deliver the Boot float onto the Even-Estates site at night; checkpoints (vehicle boot-float, damage limit) through the show-homes with the night watch chasing | intro: dress-rehearsal-intro (night) Chard Levelright on the site, torch, a clipboard; outro: dress-rehearsal-outro (night) the float parked beside the bay | chard, tansy, pip | prereq ch1-founders-boot-p1; reward 500 acorns; Chard first speaks here as foreman; fallback for the chase: chase-follow with the night-watch cart; mobile: none new |
| ch1-founders-boot | 15 | Founder's Boot & The Kangaroo Court | the existing three objectives (hijack the float and crash the Amphitheater tribunal; scatter Reginald and the bailiffs; escape the 4-Hat pursuit in the getaway Combine) | intro: founders-boot-intro (day) existing; outro: founders-boot-outro (dusk) existing, extended with Juniper's rezoning and Vesper at the window | tansy, pip, juniper, reginald, vesper, hedda | prereq ch1-founders-boot-p2; reward 700 acorns; keeps the id so old saves stay finished; new outro runs 30 to 45 seconds, last image is Vesper |
| ch1-founders-boot-p2 | Dress Rehearsal Clean | finish the night run through the site with no fence collisions | back: prefab needed: parade-banner-cape |
| ch1-founders-boot | Greener Than the Grass | complete all three parts of Founder's Boot without being cracked | head: prefab needed: founders-green-laurel |

## Act context

## Act 1: Fresh Glaze (rows 1-15)

The player arrives fired and owing: a Ride-On, a glowing crate and a Kiln-Debt. Act I answers one question, "Can the player pay their way out, and where do they live?" The answer is a loan, a flat at Saucer Court (3B, next to a neighbour who watches the stairs) and a string of errands for people who each want one small thing. Vesper Thorne starts as a rumour with a lien (a name on an eviction notice) and ends as the man who closes the act with a threat. Tension runs 3 (rows 1-2), 4 (3-5), 5 (6-8), 3 (9-11 light relief), 4 (12-13), 4 (14, the sincere beat), 6 (15). Comedy density is high through row 13; row 14 is the one sincere scene and gets no gag on top; row 15 closes on Vesper, never on a gag.
What the player wants: clear the debt, keep their head down. What they learn: the crew is the only home on offer, Vesper's money flows through the median leases, the Even-Estates and the Grand Combine, and every friendly face (Cam, Reginald, Pip) has something they are not saying.
Who changes: Pip goes from liability to someone who tells the truth about Fescue (row 14). Tansy goes from "not my problem" to a crew that takes sides in public (row 15). Cam is planted as the envious sweeper (rows 5, 8). Reginald shows a crack (row 12). Juniper goes from a client to an ally who rezones Vesper's blocks (row 15). Setups planted for later acts: the Dewdrop and the Whirligig citation (row 10), Granny Gnertrude's name (row 13), the Carburettors (row 5), the Mulch Club's war with the HOA (row 11), Hedda Galley and the Tattler (row 15), the four parts of the Combine are not named yet (the blueprint in row 8 shows one drawing, no parts list).
Regions visited: downtown, wilds (the first contract's tour), underspan, patio-heights, turfton-fringe, canal, south-highway.
Rows keep their old ids where kept; old saves that finished a kept quest stay finished, and rows 2, 5, 7, 9-14 appear as catch-up quests.

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

This is the extended pivotal quest that turns act I into act II. Take the time to make it excellent.
- Three QuestDefs in play order in your `STORY.quests`: `ch1-founders-boot-p1` (Parade Permits), `ch1-founders-boot-p2` (Dress Rehearsal), `ch1-founders-boot` (the final part: keeps its id so old saves stay finished). Chain: p1.prereq `m14-drainpipe-court`, p2.prereq p1, final.prereq p2. All `chapter: 1`. Rewards 300 / 500 / 700.
- Final part: move the existing def from `src/quests/chapter1.ts` (keep its three objectives, `hoaSteps`, `achievement: 'gta-boot-legger'`, intro `founders-boot-intro`; keep objective count/order so saves mid-quest resume). Remove it from chapter1.ts. Its comms in `src/quests/comms.ts` (`'ch1-founders-boot'`) stay as they are unless you put new ones in your file (your file wins). Extend `founders-boot-outro` in ch1d.ts per the row: Juniper at the Amphitheater rezones Vesper's three condemned blocks as Founders' Green (ribbon, crowd), and the last image is Vesper at a window: "Then we stop asking." 30-45 s, ends on Vesper, never a gag. W03 (Founders' Green opens) turns on by itself when the final completes.
- p1: giver `side-valve`; `visit` the Tattler Building (Hedda Galley at her desk: `parade-permits-intro`, day; intro card `hedda` if no earlier scene of yours or a city contract gave her one: she has a CAST preset and intro), `inspect` verb 'Search' in the parade office for the float keys (heat 1 on entering: put `heatOnEnter` on a preceding visit or use `hoaSteps`), `visit` Side-Valve to deliver the keys.
- p2: `dress-rehearsal-intro` (night, Chard Levelright on the site with a torch and a clipboard; he speaks here as foreman; no new card: his card was row 7), then `checkpoints` with `vehicle: { kind: 'boot-float', at: ... }` and `requireVehicle: 'boot-float'`, `maxDamage`, through the Even-Estates show-homes on the ring-road site (E16 sites; same site as row 7 if possible) at night with the night watch chasing (scene-only chaser carts are enough; or a `chase-follow` fallback), `dress-rehearsal-outro` (night, the float parked by the bay). `achievement: 'gta-dress-rehearsal'` on p2.
- Comms for each part per the rows. Plans for all three ids. Every id on a stage (`USES` for existing stages like the Amphitheater's).
