# Equip audit: items left to adjust by hand

From the lane D character pass (`docs/roadmaps/gta-character-pass.md`). Every wearable and holdable `@lawn/prefabs`
item was worn through `look.equipment` / `buildGear()` and checked on a contact sheet
(`games/gnome-theft-auto/lab/equip.html` on the GTA dev server: `?slot=hand|head|back|neck&pose=rest|aim|both&ids=...`)
and by the tests `packages/gnome/src/hold-pose.test.ts` and `gear-clearance.test.ts`.

Totals: 231 checked (111 hand, 55 head, 26 back, 39 neck), 86 fixed (74 hand, 2 head, 5 back, 5 neck), 4 unresolved (below). The unresolved hand items
are `it.skip`ped in `hold-pose.test.ts` with an `// unresolved:` comment; remove the skip once fixed.

Screenshot of all four (arm at rest, seen from the gnome's right): `docs/roadmaps/gta-character-pass/equip-unresolved-hand.png`.

| Prefab id | Slot | What's wrong | What was tried |
| --- | --- | --- | --- |
| `golden-putter` | hand | Held by the top of its shaft, so the shaft hangs straight down from the hand and the head sinks about 0.13 into the ground at rest. | `wear.rot` [180,0,0] (forward: the head then trails), [90,0,0] (down), `wear.scale` 0.8. Needs a lower `grip` (mid-shaft) or a shorter shaft in `parts`. |
| `pitchfork` | hand | Long pole held near the middle: at rest the tines hang about 0.1 into the ground and the butt sticks far out behind the gnome. | `wear.rot` [180,0,0] with `scale` 0.8 (current), [90,0,0] (worse: -0.4). Needs the `grip` moved toward the butt end, or a carry angle (rot about x of roughly 150) picked by eye in the prefab editor. |
| `porcelain-lantern` | hand | Hangs from the hand by its ring, upright now, but its base sits about 0.04 below the ground and inside the right leg at rest. | `wear.rot` [90,0,0] (upright, current). Rotation and scale cannot lift it: needs `wear.at` (about y +0.06, x -0.05 outward) or a `grip` at the top ring. |
| `grave-lantern` | hand | Same as the porcelain lantern: upright now, base about 0.035 below the ground, against the leg. | Same as above. |

Not counted as unresolved (judged fine on the sheet): `bear-shades` (worn on its headband by design), the four
shields (now carried on edge at the side, facing out), `leaf-blower` (stands upright in the hand), drinks and potions
(upright in the fist).
