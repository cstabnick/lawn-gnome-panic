Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Chapter 3, "The Keep and the Ledger", is playable: the court, the Archive, the Queen, the Gutters wing with Clogmaw, Gnorwin's Ledger, and the Chapter 3 side quests.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 3 (all)
- `docs/design/gnomomia/places-and-people.md` §3 and §3a (people, the Gutters row)
- `docs/design/gnomomia/bestiary.md`, the Drainpipe Deeps table (Gutters rows); `items.md` (named drops: Clog-Gloves, Pipewright's Wrench; the Rose draught and Sky tonic)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; keep and deeps layouts)

## Change
`src/data/packs/ch3-keep.ts`, prefix `c3-`.
- **NPCs** (canonical, zone `keep`): `marigold potsworth inkcap ironsod ida sedgewick wren`.
  - Marigold stands in `throne-hall`, and also in the `archive` while `c3-queen-in-archive` is active (use `placements`).
  - Wren is at `robin-roost`; Inkcap in `archive`; Ida by `deeps-stairs`.
  - Sedgewick stands near the throne. He is polite, and says nothing of the ambush.
- **Shops:** a royal armoury smith in `pedestal-ward` (Cloverfield-tier gear is ch4's job; sell Thatchford-to-Keep ilvl 10-12 gear of all three types), and a herbalist selling `rose-draught` (heal 60) and `sky-tonic` (mana 60).
- **Enemies** (canonical, zone `deeps`, region `gutters`): `gutter-rat pipe-leech clogmaw`.
  - Clogmaw is a boss with moves Suction (pull, every 12) and Hairball (pool, rooted), plus a summon of slime blobs. Define the blob as `c3-slime-blob` (trivial soft).
  - Drops: `c3-clog-gloves`. A chest object in the Gutters gives `c3-pipewrights-wrench`.
- **Main quests:** `c3-an-audience`, `c3-three-accounts` (3 book objects in the `archive`), `c3-queen-in-archive`, `c3-into-the-gutters`, and `c3-ledger` (finale; gives `gnorwin-ledger`). `c3-an-audience` unlocks after `c2-letter-for-the-queen` is done.
- **Side quests:** `c3-idas-father` (a toolbox object in the Gutters gives `gromwell-notes`, a questItem), `c3-potsworths-errand`, `c3-letter-from-puddlemere` (turn in `mb-soggy-letter` to `ida`), and `c3-fifty-two-letters` (needs the ch2 `c2-postage-due` done).
- **Robin flight:** add to Wren a hub option `Fly me to the Verge` with `{ type: 'travel', zone: 'verge', x: 0, z: 70 }`, gated `when: { quest: { id: 'c7-wings-to-the-front', status: 'done' } }`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
Zone files, ch5/ch6 packs (they own the Cistern and Backflow).
