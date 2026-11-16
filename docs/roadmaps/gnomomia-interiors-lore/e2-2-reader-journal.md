Epic: 2 Content and polish
Depends on: none

## Environment
- Worktree root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore`; game: `games/gnomes-of-gnomomia` (TypeScript, plain DOM UI). Work only inside the worktree.
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers edit other files of this game at the same time (lore packs, zone files, `src/interiors.ts`, `src/objects.ts`). Do not start a dev server, do not run `vite build`/`npm run build`, no git commands.
- Repo rule: UI modules get the shared `#ui` element as a parent: append your own container to it, never restyle or hide `#ui` itself.

## Goal
Reading a bookshelf, lectern, note or plaque opens a proper reader panel, and a new **Lore** tab in the side panel lists everything the player has read, so any piece can be re-read.

## Read first
- `games/gnomes-of-gnomomia/src/ui/book.ts`: the stub you replace (keep its three exports).
- `games/gnomes-of-gnomomia/src/ui/dialogue.ts`: copy its overlay pattern (a `div` appended to the root with `pointerEvents: 'auto'`, styled with the `UI` palette, its `keydown` listener).
- `games/gnomes-of-gnomomia/src/ui/panels.ts`: `TabId`, `TABS`, the tab bar, `render()` (it caches by innerHTML, so attach click handlers with `onclick` on elements you build each render, as the other tabs do), `make()`.
- `games/gnomes-of-gnomomia/src/config.ts`: `BookDef` and `UI` (read only).
- In `src/state.ts` (read only): `state.booksRead: string[]` (BOOKS ids in the order first read) and `readBook()`, which pushes to it, emits `bus.emit('book-open', { book, first })` and then `'changed'`.

The data: `import { BOOKS } from '../content'` (`Record<string, BookDef>`):
```ts
export interface BookDef {
  id: string; title: string; author?: string;
  kind: 'book' | 'note' | 'letter' | 'plaque' | 'journal' | 'scroll';
  pages: readonly string[];   // plain text; blank lines ("\n\n") separate paragraphs
  common?: boolean; where?: readonly string[];
}
```

## Change
1. `src/ui/book.ts`: the reader.
   - `createBookReader(ui)` builds one hidden container (`id = 'book-reader'`) appended to `ui`, and subscribes `bus.on('book-open', ({ book, first }) => open(book, first))`. Unknown ids are ignored.
   - Centered panel about 460 × 520 px (max 92vw × 80vh, scroll inside if needed), above the game. Header: title (bold), author line in italics when present, a ✕ close button. Body: the current page, each paragraph a `<p>` built with `textContent` (never innerHTML from content). Footer: `◀ Prev` · `Page n of N` · `Next ▶` (hidden when N = 1).
   - Look by `kind`: `book` parchment (#f2e6c8 background, dark brown text, serif), `journal` the same with faint ruled lines (a repeating-linear-gradient), `note` a small pale-yellow slip, `letter` cream paper with the author as a signature line at the bottom of the last page, `scroll` parchment with darker rolled ends top and bottom, `plaque` grey stone (#8d9097) with light engraved-looking centred text (text-shadow). Frame it with `UI.border` / `UI.borderLight` like the other panels.
   - Keys while open: ArrowLeft/ArrowRight turn pages, Escape closes (call `e.stopPropagation()` for keys you handle). Ignore keys when the focus is in an input or textarea.
   - When `first` is true: `say(`New lore added to your journal: ${title}`, UI.gold)` (import `say` from '../events'). Do not print the page text to chat any more.
   - `isBookOpen()` returns whether it is open; `closeBook()` hides it.
2. `src/ui/panels.ts`: a seventh tab.
   - `TabId` gains `'lore'`; `TABS` gains `{ id: 'lore', icon: '📖', name: 'Lore', key: 'l' }`. Make sure seven tab buttons still fit the bar (shrink the button width or let the bar wrap evenly).
   - `render()` gets `case 'lore': wrap.append(buildLore()); break;`.
   - `buildLore()`: a line `Lore found: X of Y` (X = `state.booksRead.length`, Y = `Object.keys(BOOKS).length`), then the read items grouped by kind in this order with a small heading each: Books, Journals, Letters, Notes, Scrolls, Plaques. Each row shows the title (and the author dimmed) and on click emits `bus.emit('book-open', { book: id, first: false })`. Rows look clickable (cursor pointer, hover highlight with `UI.borderLight`). Skip ids not in BOOKS. Empty state: `Nothing read yet. Bookshelves, lecterns, notes and plaques around Fescue fill this journal.`
   - The panel redraws on `'changed'` already (check how; reading a new book emits it).

## Contract (keep exactly)
- `src/ui/book.ts` exports `createBookReader(ui: HTMLElement): void`, `isBookOpen(): boolean`, `closeBook(): void`.
- Event `'book-open': { book: string; first: boolean }` (defined in src/events.ts; do not change events.ts).
- `main.ts` already calls `createBookReader(ui)` after `createShop(ui)`; do not edit main.ts.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` reports no error in `src/ui/book.ts` or `src/ui/panels.ts`.
- Reading opens the panel; ◀/▶ and arrow keys turn pages; Escape and ✕ close it; the Lore tab (key L) lists read items and re-opens them.

## Out of scope
`src/state.ts`, `src/events.ts`, `src/main.ts`, `src/objects.ts`, `src/content.ts`, `src/data/**`, every other ui file.
