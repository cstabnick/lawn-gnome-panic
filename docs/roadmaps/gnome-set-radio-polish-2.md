# Roadmap: Gnom Set Radio — Polish, World-Building, Music, Skybox Visualizers & Diverse Arenas

> **Status:** Active (`QMasterMoo/gnome-set-radio-polish-2`)
> **Scope:** `games/gnome-set-radio/`, `packages/music/src/themes/gnomeSetRadio*`, `docs/roadmaps/gnome-set-radio-polish-2.md`

---

## Design Goals

1. **Core Feel & Audio Clarity:** Fix the 180° wall-ride orientation bug so the skater's wheels plant on the wall; make every gang billboard and perimeter ad grindable; soften whoosh/grind SFX and airborne muffle so the music shines through; de-spam HUD popups, trick slams, and patrol shoutouts.
2. **Distinct Regional Music & Gameplay Reactivity:** Give Areas 5–9 distinct synthesis flavors (`chiptune`, `mallsoft`, `skaBrass`, `darkJungle`, and multi-genre `finale`), and add dynamic gameplay-reactive music hooks (`wallRiding`, `comboTier`, `speedNorm`, `trickPulse`).
3. **Fresh-Player World-Building & Sequential Quests:** Rewrite `GAME_INTRO_CUTSCENE` to clearly explain the Broadcast Archipelago, the Woken, the Frequency Ladder, the gangs, and core controls; convert story quests from an all-at-once dump into sequential handoffs with brief gang-handoff cutscenes per area.
4. **Multi-World Sky Vista & Music-Synced Visualizers:** Display the next 3 upcoming worlds rising ahead along the Frequency Ladder with distinct architectural dioramas and connecting ley-line cables; add music-synced floating skybox speakers, a 20-bar 3D horizon equalizer, and combo-escalating sky motifs.
5. **Diverse Arena Shapes & Edge Abstract Office Buildings:** Give each of the 9 levels a distinct `arenaShape` with matching shaped ground/skirt/curb geometry and 4 perimeter abstract office buildings (`abstract-office-slab`, `cantilever-tower`, `stepped-monolith`) linked by grindable edge rail circuits.

---

## Shape Table

| Epic | Focus | Done When |
|---|---|---|
| **Epic 0** | Setup & Roadmap Doc | `npm install` + baseline `npm test` pass; roadmap written |
| **Epic 1** | Wall-ride fix, grindable billboards, audio mix & music diversity, HUD de-spam | `skater.test.ts` & `gnomeSetRadio.test.ts` pass; `tsc --noEmit` passes |
| **Epic 2** | Sequential quests, fresh-player intro, gang handoff cutscenes, `app.ts` wiring | `cutscenes.test.ts` passes; `tsc --noEmit` passes |
| **Epic 3** | Next-3-worlds sky vista & music-synced skybox visualizers | `tsc --noEmit` & `vite build` pass |
| **Epic 4** | Diverse arena shapes & edge abstract office buildings across all 9 levels | `flow.test.ts` & `npm test -w games/gnome-set-radio` pass |
| **Epic 5** | Full verification, smoke/z-fight checks, `AGENT_INDEX.md`, mergeable PR | `build`, `smoke.sh`, `zfight`, and PR opened |

---

## Pass 3: Guided Open World, Cartoon Backdrops, Post-Boss Competitions & Unique Bosses/Cutscenes

- **Guided Open-World Interconnectivity (`archipelago.ts`, `title.ts`, `hud.ts`, `app.ts`):** Added bidirectional Express Transit Gates (`chrome-kiln ↔ mulch-alley`, `tupperware-mall ↔ velvet-keys`, `hoa-citadel ↔ bongo-basin`), a `"🛹 Free Roam & Competitions"` post-boss button in `showAreaClearSummary`, and a Guided Free-Roam objective hint.
- **High-Energy Cartoon Backdrops (`skybox.ts`, `cartoonBackdrop.ts`):** Upgraded `SKY_FRAG` with animated comic speed-ray sunburst, halftone dot banding, and beat-reactive zig-zag horizon; added cel-shaded comic clouds with ink outlines, orbiting pop-art onomatopoeia panels, and speed-arcs.
- **Fun World Bits & Post-Boss Competitions (`data/competitions.ts`, `game/competitions.ts`, `worldBits.ts`, `app.ts`, `hud.ts`):** Added 2 Turntable Scratch Launch Pads per district, an Encore Trophy Booth, and 9 unique replayable post-boss Encore Competitions with Bronze/Silver/Gold medals persisted in `ProgressState.competitionMedals`.
- **Unique Boss Animations & Expanded Cutscenes (`bossAnim.ts`, `cutscene.ts`, `cutscenes.ts`):** Added per-boss 3D stage aura/animations + hit recoil for all 9 bosses, 2 dramatic boss camera cues (`boss-dramatic-low`, `boss-spiral-reveal`), and expanded all `levelIntro` (5 beats), `bossIntro` (4 beats), and `bossDefeat` (3–4 beats) cutscenes.
