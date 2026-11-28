# Roadmap: Gnom Set Radio — Mega World, Movement, Bosses, Music Theory, Lore & Shop

> **Branch:** `QMasterMoo/gnome-radio-mega-world`
> **Scope:** `games/gnome-set-radio/`, `packages/music/src/themes/gnomeSetRadio*`, `packages/prefabs/src/catalog/gnome-set-radio.ts`, `docs/roadmaps/gnome-set-radio-mega-world.md`

---

## Goals (16 Tasks)

1. **Mega World:** Combine all 9 districts into one unified 3D Broadcast Archipelago connected by physical sky ley-line grind rails (plus map fast-travel).
2. **Music Theory & Progression Pass:** Audit all 10 `@lawn/music` tracks to eliminate sour clashes, fix mode/chord mismatches, and enforce `clashRatio < 0.08`.
3. **Map-Wide Unique Bosses:** Each boss has unique multi-phase mechanics across 3–5 map-wide waypoints instead of staying on one top stage.
4. **Larger Bosses:** Fix the scale-overwrite bug in `world.ts` and scale bosses up to imposing `3.8×` landmark size.
5. **Finer-Grain Hitboxes:** Exact polygon perimeter collision (`collision.ts`), cylindrical round buildings, multi-tier monolith/cantilever colliders, billboard OBBs, and per-prefab prop radii.
6. **Wall-Bump Audio Fix:** Add impact-speed & cooldown gating in `skater.ts` plus a `0.32s` audio throttle in `sfx.ts` so wall rubs never muffle music.
7. **Epic Aether & Under-World Grinds:** High-skill grind rails arcing over the Aether and diving underneath island skirts, gated behind rooftop climbs.
8. **Reachable Billboards & Void Prevention:** Polygon-aligned perimeter ads, floating satellite mini-islands for outer billboards, and an Aether Updraft void rescue net.
9. **Air Dash:** Boosting in mid-air dashes in the movement direction, capping forward speed (`34 m/s`) while leaving sideways speed uncapped.
10. **Speed Mode (Tuck):** `Alt` / `Z` / `LB` / mobile `TUCK` leans the gnome forward into a ball to preserve momentum with reduced steering and smooth decay on exit; jumps/walls/grinds preserve speed.
11. **Expanded Worlds & Lore Areas:** Expand all 9 levels ~30–40% and add 2–3 prefab-detailed lore micro-areas per level while keeping the abstract ethereal Aether vibe.
12. **Spray Art Variety:** Keep the 27 regional titles and add 8 distinct graffiti silhouette shapes, halftone dots, and richer motif art.
13. **Score Brightness/Saturation & Beat Screen Shake:** Subtle screen brightening/saturation with unmultiplied score and rhythmic beat/speed micro-shake.
14. **Gradual Combo Scale-Down:** Smooth 1.5-beat scale-down envelope after banking a big combo instead of an instant drop.
15. **Thematic Boost Particles:** Radio-wave chevrons, musical-note/paint-splatter sprites, and pulsing bass rings matching the equipped cosmetic trail.
16. **In-Game Shop & NPCs:** A Shop NPC in each world selling 9 unique in-game cosmetic trails & skates, plus **The Aether Board** unlocked for beating Tier 9.

---

## Shape Table

| Epic | Focus | Done When |
|---|---|---|
| **Epic 0** | Foundation & shared contracts | `npx tsc --noEmit -p games/gnome-set-radio` passes |
| **Epic 1** | Hitboxes, bump fix, Air Dash, Speed Mode, VFX, camera/HUD feel, music theory | `npm test -w packages/music && npm test -w games/gnome-set-radio` pass |
| **Epic 2** | Prefabs, spray variety, polygon-aligned ads & all 9 level expansions | `npm test -w packages/prefabs && npm test -w games/gnome-set-radio` pass |
| **Epic 3** | Mega World spatial layout, map-wide larger bosses, shop & MP integration | `npm test -w games/gnome-set-radio && npm run build -w games/gnome-set-radio` pass |
| **Epic 4** | Full verification, smoke/z-fight checks, `AGENT_INDEX.md`, mergeable PR | `build`, `smoke.sh`, `zfight`, and PR opened |
