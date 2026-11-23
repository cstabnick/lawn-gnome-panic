# Common text for the epic-3 prefab issues (3D to 3I)

Read `docs/roadmaps/pay-n-glaze/_common.md`, then `docs/roadmaps/pay-n-glaze/_prefabs.md` (frames, rules, checks, examine voice; its last section "Epic 3 slots" covers the new slots), then `docs/roadmaps/prefab-library/_common.md`.

- The catalogue (`packages/glaze/src/catalog.ts`) already lists every product: the prefab `name` is the product's `name`, the prefab `id` is `glaze-<slot>-<id>`, and the look is described in your issue. Read the existing prefabs in your file(s) first and match their style: chunky and flat-shaded, 4 to 30 parts (hard maximum 40), `seg` 4 to 12, `category: 'prop'`, `uses: ['place']`, `emoji: []`, `tags` include `'glaze'` and the slot word, `about`, 5 `examine` lines (9 to 160 characters, all different) in the Gnomes of Gnomomia voice (gnomes never know what an object really is; Pay 'n' Glaze is a hot-pink-and-chrome custom paint franchise).
- Append your prefabs to the array in your file(s); keep every existing prefab and the export name and import line.
- Check: `npx tsc --noEmit -p packages/prefabs` (no error in your file), then `npx vitest run packages/prefabs/src/catalog.test.ts -t "<regex of your ids>"` (every test for your ids passes: they build, stand on y = 0 within 0.03, are centred and gnome-sized). When a test says "bottom near y=0", compute the lowest point of every part (centre y minus half height or radius, mind `scale` and `rot`) and fix `at`.
- Read your finished file once top to bottom. Do not commit.
