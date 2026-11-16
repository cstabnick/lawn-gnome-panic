# Gnomomia: building interiors and lore books

Goal: every house in Fescue can be entered. Interiors come from a few room templates shared by all common buildings, with seeded per-house variation (palette, mirrored plan, furniture picks, clutter, a family name) and optional per-house overrides (`HouseDef.interior`: template, name, palette, add/remove furniture, own books). Readable lore (books, notes, letters, plaques, journals, scrolls) sits on shelves, lecterns and plaques, opens in a reader, and collects in a Lore journal tab.

## Design (epic 1, written directly)

- An interior is a generated indoor zone with id `<zone>/<house id>` (`ZoneId` is `OutdoorZoneId | \`${OutdoorZoneId}/${string}\``), so saves, the MMO zone sync, the HUD, `?zone=` and the content linter treat it like any map. Players in the same house see each other.
- `src/data/interiors.ts`: `TEMPLATES` (cottage, mushroom-home, hall, workshop, chapel, tent, tavern, library, shop), `STYLE_TEMPLATE`, `layoutInterior()` (seeded), `FURNITURE_RADIUS`, `doorSpots()`.
- `src/content.ts` pass 3: one interior per house; door exits both ways (`ZoneExit.door`, drawn as doormats); doors facing a neighbour/lake/wall are turned to a clear side; bookshelves and lecterns become objects (`<zone>#shelf<n>`, `<zone>#lectern<n>`) holding the house's own books first, then seeded `common` books.
- Door exits only fire when the player stops on the mat or walks to it, never when passing by.
- `src/world.ts`: interior branch (flat floor, warm light, colliders), `src/interiors.ts` builds the room meshes and hides the walls between camera and room.
- Books: `ContentPack.books` → `BOOKS`; `WorldObjectDef.book`; `readBook()` in state.ts records `state.booksRead` and emits `'book-open'`.
- Lint (`scripts/lint-content.mjs`): interior bounds and furniture, doormats, unknown books, empty pages.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (direct) | build + lint pass, interiors enterable with placeholder furniture | 0 (written directly) |
| 2 Content and polish | build + lint pass, smoke OK on a town and an interior | 7 parallel |

Issues of epic 2 (full text in `docs/roadmaps/gnomomia-interiors-lore/`; the five lore issues share `_content.md`):

- `e2-1-furniture-models.md`: furniture meshes per kind and the bookshelf/lectern/scroll/plaque object models (`src/interiors.ts`, `src/objects.ts`).
- `e2-2-reader-journal.md`: the reader panel and the Lore tab (`src/ui/book.ts`, `src/ui/panels.ts`).
- `e2-3-lore-common.md`: world-wide shelf books (`packs/lore-common.ts`).
- `e2-4-lore-mossbottom-thatchford.md`, `e2-5-lore-keep-deeps.md`, `e2-6-lore-cloverfield-hedgewood.md`, `e2-7-lore-rockery-verge.md`: each owns one lore pack and its two zone files (named buildings, local books, placed readables).

No dependencies inside epic 2: every issue owns its files, the pack stubs and `content.ts` imports exist from epic 1.
