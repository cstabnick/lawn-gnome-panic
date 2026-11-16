# Shared rules for the lore content issues (E2-3 to E2-7)

Every lore issue follows all of this file. Your own issue file says which pack file, id prefix, zones and quotas are yours.

## Environment

- Worktree root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore`. Work only inside it. The game is `games/gnomes-of-gnomomia`.
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time (other lore packs, other zone files, `src/interiors.ts`, `src/objects.ts`, `src/ui/book.ts`, `src/ui/panels.ts`). Touch only the files your issue names.
- Do not start a dev server, do not run `vite build` or `npm run build`, do not run git commands.

## What you are writing

Readable lore for Gnomes of Gnomomia, an old-school gnome RPG set in a back garden seen from gnome height. Types (from `games/gnomes-of-gnomomia/src/config.ts`, do not edit it):

```ts
export interface BookDef {
  id: string; title: string;
  author?: string;                          // as written on it; omit when unknown
  kind: 'book' | 'note' | 'letter' | 'plaque' | 'journal' | 'scroll';
  /** Each string is one page (plain text; blank lines separate paragraphs). Keep a page under ~600 characters. */
  pages: readonly string[];
  /** May turn up on any generated bookshelf or lectern. With `where`, only in interiors of those zones. */
  common?: boolean;
  where?: readonly OutdoorZoneId[];   // 'mossbottom' | 'thatchford' | 'keep' | 'deeps' | 'cloverfield' | 'hedgewood' | 'rockery' | 'verge'
}

export interface WorldObjectDef {
  id: string; zone: ZoneId; name: string; x: number; z: number;
  model: 'valve' | 'statue' | 'book' | 'cart' | 'chest' | 'sign' | 'stone' | 'grave' | 'post' | 'trough' | 'generic'
    | 'bookshelf' | 'lectern' | 'scroll' | 'plaque';
  color?: number; scale?: number;
  yaw?: number;                 // radians; 0 faces +z (south, toward an interior's door)
  book?: string;                // BOOKS id: using the object opens it in the reader
  verb: string;                 // right-click label: 'Read' for readables
  examine: string;              // one line shown on Examine
  when?: Condition;             // omit for lore
}

// A house on a zone map. You may only ADD `id` and `interior` to existing entries.
export interface HouseDef {
  x: number; z: number; r: number; yaw: number; style: 'mushroom' | 'thatch' | 'stone' | 'log' | 'tent' | 'pot';
  id?: string;                  // interior zone id becomes `<zone>/<id>`; default `h<index in the list>`
  interior?: InteriorSpec | false;
}
export interface InteriorSpec {
  template?: 'cottage' | 'mushroom-home' | 'hall' | 'workshop' | 'chapel' | 'tent' | 'tavern' | 'library' | 'shop';
  name?: string;                // shown on arrival, e.g. 'The Tipsy Toadstool'
  seed?: number;
  palette?: { floor?: number; wall?: number; trim?: number };
  add?: readonly FurniturePlacement[];   // { kind, x, z, yaw?, color?, scale? } in room coordinates
  remove?: readonly FurnitureKind[];
  books?: readonly string[];    // BOOKS ids put on this room's bookshelves and lecterns first, in order
}
```

Your pack file already exists as a stub exporting `PACK: ContentPack` with `id`, `books: {}` and `objects: {}`. Fill `books` and `objects`; keep the `id` and the export name. Import types with `import type { ContentPack } from '../../config';`. Each record key must equal the def's `id`.

## How readables reach the player

1. **On shelves, automatically.** A book with `common: true` (and optionally `where: [...]`) can turn up on any generated bookshelf or lectern in those zones' houses (all zones when `where` is omitted). Every house has 0-3 shelves; there are 144 houses. Use this for ordinary books a gnome family would own.
2. **In a named building.** Give an existing house entry in your zone file an `id` (kebab-case, unique in the zone) and an `interior` override with a `name`, a fitting `template` and `books: [...]`. Those books go on that room's shelves and lecterns first. Templates with guaranteed reading furniture: `library` (6-8 shelves and a lectern), `chapel` (a lectern). `hall` and `cottage` usually have 1-2 shelves. If a room has fewer shelves than books, add one: `add: [{ kind: 'bookshelf', x: ..., z: ..., yaw: ... }]` or `{ kind: 'lectern', ... }` (added bookshelves and lecterns become readable too).
3. **Placed by hand.** A `WorldObjectDef` with `book` and `verb: 'Read'`: outdoors (a plaque on a statue base, an epitaph on a grave, a note pinned to a post, a scroll on a cart) or inside an interior (`zone: '<zone>/<house id>'`, coordinates in room space).

Do not change a house's x, z, r, yaw or style, and never reorder, add or delete houses (unnamed houses are identified by their index). Pick a house that sits in or next to the region the building belongs to (zone files list regions with x, z, r; houses list x, z).

### Room coordinates (for objects or `add` inside an interior)

(0, 0) is the room centre, the door is in the middle of the +z wall. Half sizes (half-width x, half-depth z) by template: cottage 5×4, mushroom-home 4.5×4.5, hall 7×6, workshop 6×5, chapel 5×6, tent 3.5×3.5, tavern 7×6, library 6×6, shop 5×5. Keep hand-placed things within |x| ≤ hw − 0.8 and |z| ≤ hd − 0.8, and out of the door lane (|x| < 1.2 and z > hd − 2.5). Generated furniture moves out of the way of objects you place (it stays 1 m clear), so you do not need to know the layout. A yaw of 0 faces the door; `Math.PI` faces the back wall; `Math.PI / 2` faces +x; `-Math.PI / 2` faces −x. A bookshelf against the west wall: `x: -(hw - 0.6)`, `yaw: Math.PI / 2`.

## Writing rules (from docs/design/gnomomia/lore-rules.md: read it in full first)

- Everything is garden-sized and gnomes never recognise garden objects: the Hose (river), the Spigot, the Birdbath (the Keep), the Shed (Dark House), the Mower (the Turning Blade, Old Rumble), Black Dew (petrol), the Heartspark, the Waking Rope, tall-eyes (marbles). No gnome ever writes "hose", "mower", "birdbath" knowing what it is.
- The Tall Ones (Gardeners) are never seen or explained. Traces only.
- History in three layers: the Planting (~3,000 years, myth: songs, rhymes, prayers, contradictory), the Charters (~300 years, written history: factions disagree on why), the Rumbling (~30 years, memory: diaries, letters, grudges). Books are the natural home of the Charters layer; songs and rhymes of the Planting; journals, letters and notes of the Rumbling. Layers never fully agree; leave the gaps.
- Gnomes are fired clay: they crack, are glued and re-glazed; shattered is death. No blood. No births: gnomes are made by kilnwrights.
- Names: places = two plain garden words; gnome first names are plants, surnames are soil/tools/household things; at most one pun per name.
- Magic is Sun, Rain and Bloom only. No engines but the Mower; no gunpowder, steam or anything that roars.
- Tone: cozy and dry on top, understated jokes, no pop-culture or fourth-wall jokes. One honest sad note per region, played straight.
- Factions lean on three ideas: Tend it (Crown, towns), Let it grow (Wildlings; Ferals went too far), Cut it all (Order of the Even Cut).
- Leave loose threads loose: never answer where the player came from, who lit the Kiln, whether the Tall Ones return, what is beyond the Fence. Do not explain the designer's truths in history.md (the "Designer's truth" boxes): characters may hint, never state.
- Do not contradict quest dialogue or give quest solutions; canon NPCs may be authors or mentioned, but match what places-and-people.md says about them.
- Prose: plain English, short sentences, British spelling as in the docs. Variety of voices: a primer for young gnomes, a farmer's almanac, a sermon, a ledger, a love letter, a guard's duty note, a recipe, a song with verses, an epitaph, a complaint to the Reeve. 1-4 pages each; most 2-3. Each page 250-600 characters.

## Checks

- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` passes (errors in files you do not own are other workers' mid-edit state: ignore them only if none of them is in your files).
- From the worktree root: `node games/gnomes-of-gnomomia/scripts/lint-content.mjs` prints no ERROR line that names your pack id, one of your zones (`zone:<zone>` or `zone:<zone>/<house>`), or one of your ids. Fix every such error. It checks unknown book ids, empty pages, objects placed off-map, in houses, lakes, furniture or outside rooms, and doormats.
- The linter bundles every pack, so a half-written file from another worker can make it print `LOAD ERROR` or a build error naming a file that is not yours. Then run it again a little later (up to a few times); never edit their file. If it still fails only because of someone else's file, report that and finish on `tsc` for your files.
- Re-read three of your books against the writing rules before finishing.

## Report

List the books you wrote (id, kind, title, where it lives), the houses you named (zone id, template, name), and the hand-placed objects.
