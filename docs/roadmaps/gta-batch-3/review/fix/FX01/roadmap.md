# FX01 roadmap: signs, plates, particles, water and undersides (shared render)

Brief: [../FX01-signs-particles-undersides.md](../FX01-signs-particles-undersides.md). Findings: G1#5, G1#17, G2#11,
G2#12, G2#30, G3#10, G3#11, G3#28, G4#3, G6#2, G6#13, G6#26, G6#29, G9#26 (D58, GR8).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| A (lead) | Foundation: `textPlate` wraps words to the plate aspect, 512/1024 px canvases, min glyph 18 px, texture cache, `back`/`backing`; `signBoard()` + `BOARD_FACES`; `addNoticeSpot()` (`homes/notices.ts`); `undersideMat()` (`undersides.ts`) wired in app.ts; rain overcast floor (`weatherOvercast`, weather/config.ts) wired in app.ts; `homes/plates.test.ts` | tsc + plates test | written by the lead |
| B | The sweep: every shared render fix applied, in parallel, disjoint files | build, tests, smoke, zfight, shots | 9 |

All B issues are independent (disjoint files); the common environment and contracts are in
[issues/_common.md](issues/_common.md), pasted into every worker prompt.

| # | Issue | Files | Worker |
|---|---|---|---|
| 01 | [Pardonlin sign atlas, two-faced boards, Radio Adagio banner](issues/01-pardonlin-sign-atlas.md) | pardonlin/town.ts, pardonlin/districts/leftBank.ts (Opera Hall lines) | Sonnet |
| 02 | [Snow near-fade and size cap; rain streaks on phones](issues/02-snow-rain-particles.md) | weather/render.ts (+test) | Haiku |
| 03 | [Mote sprites (petal, leaf, fluff, firefly glow); overcast softens shadows](issues/03-motes-sprites-overcast-shadow.md) | atmosphere.ts (+test) | Sonnet |
| 04 | [Sea colour, white crests, shore fade, lit varied foam](issues/04-sea-colour-and-foam.md) | config.ts (WATER.bodies saltwater), waterMesh.ts, waveShader.ts, waves.ts | Sonnet |
| 05 | [Undersides and the Double Pot tunnel](issues/05-undersides-and-double-pot-tunnel.md) | city/megaBlock.ts, highways/mesh.ts, prefabs gta-street-kit.ts | Sonnet |
| 06 | [Vineyard and Bottom Garden signs on boards](issues/06-vineyard-and-garden-signs.md) | country/trellisLife.ts, golf/bottomGarden.ts (+test) | Haiku |
| 07 | [Dunelow and Espalier End notice boards](issues/07-hamlet-notice-boards.md) | living/hamletDunelow.ts, living/hamletEspalier.ts | Haiku |
| 08 | [Underspan manifesto posters](issues/08-underspan-manifesto.md) | societies/underspan/build.ts | Haiku |
| 09 | [Saucer Court and town-home plates](issues/09-saucer-court-and-town-home-plates.md) | homes/saucerCourt.ts, homes/townHomes.ts | Haiku |

After B: the lead re-shoots every finding's spot with `tools/gta-shots.mjs` on port 5501 (960x600 and 390x844),
iterates on what still reads badly, and writes [result.md](result.md).

Online: none (render only). Mobile: legibility judged at 390x844; notice spots use the shared interact button.
Party slices: `src/minigames/` untouched; `npm test -w games/gnome-theft-auto` keeps them green.
