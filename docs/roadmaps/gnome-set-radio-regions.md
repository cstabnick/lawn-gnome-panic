# Roadmap: Gnom Set Radio — Regions 5–9 Expansion

> **Status:** Areas 1–4 (`velvet-keys`, `bongo-basin`, `chrome-kiln`, `neon-birdbath`) are live with unique architectural silhouettes, environmental props, and regional writing. This roadmap specifies the implementation plan for **Areas 5–9** so each upcoming district ships with the same level of distinct layout, architecture, and voice.
> **Lore & Design Reference:** [docs/design/gnome-set-radio/regions-architecture.md](../design/gnome-set-radio/regions-architecture.md)

---

## Shared Technical Foundation (Already Built in Areas 1–4)

- `GsrBuildingArch` in `games/gnome-set-radio/src/levels/schema.ts` + `decorateBuilding()` in `src/view/world.ts`
- `GsrWorldDetail` (`fountain-plaza`, `banner-arch`, `piano-walkway`, `highway-chevron`, `molten-channel`, `mist-pool`, `placed-prop`)
- `@lawn/prefabs` catalog (`packages/prefabs/src/catalog/gnome-set-radio.ts`)

---

## Epic 1: Area 5 — Mulch Alley Arcade (`mulch-alley`)
- **Theme & Music:** 128 BPM Chiptune Funk-Hop (`mulch-alley-chiptune`, already in `@lawn/music`).
- **Topology:** Narrow vertical back-alley canyon with crisscrossing neon sign bridges, fire-escape switchback ramps, and stacked CRT rooftops.
- **4–5 Unique Buildings & New `GsrBuildingArch` Variants:**
  1. `token-drop-corner` (`arcade-marquee`) — Blinking pixel-marquees and coin-slot facade.
  2. `crt-repair-loft` (`alley-tenement`) — Fire-escape exterior stairs and stacked CRT monitors.
  3. `bootleg-tape-vault` (`mulch-club-annex`) — Drawn velvet curtains and Don Compost's Mulch Club neon crest.
  4. `pinball-mezzanine` (`arcade-marquee`) — Slanted flipper-bumper roof trim.
  5. `quinns-marquee-tower` (`arcade-marquee` + `crt-spire`) — Quarter-Slot Quinn's boss tower.
- **New Prefabs Needed:** `gsr-arcade-cabinet` (Woken CRT cabinet), `gsr-token-changer`, `gsr-neon-alley-sign`.
- **Interactive Hook:** High-score CRT bumper pads that chain combo multipliers.
- **Writing Beat:** Retro-arcade hustler banter & bootleg-tape nostalgia.

## Epic 2: Area 6 — Tupperware Sky-Mall (`tupperware-mall`)
- **Theme & Music:** 118 BPM Mallsoft Vapor-Funk.
- **Topology:** Multi-tiered circular atrium beneath an inverted translucent Tall-One Tupperware lid, linked by crisscrossing escalator ramps.
- **4–5 Unique Buildings & New `GsrBuildingArch` Variants:**
  1. `food-court-island` (`mall-kiosk`) — Pastel awning kiosks and acorn-smoothie stand.
  2. `clay-mart-wing` (`storefront-wing`) — Giant price-tag banners and glass display bays.
  3. `escalator-hub` (`atrium-bridge`) — Twin angled escalator decks.
  4. `clearance-mezzanine` (`storefront-wing`) — Stacked bargain-bin terraces.
  5. `checkout-tower` (`register-spire`) — Barcode Betty's scanner-beam boss deck.
- **New Prefabs Needed:** `gsr-shopping-cart-woken`, `gsr-mall-fern`, `gsr-clearance-rack`.
- **Interactive Hook:** Moving escalator ramps + scanner-laser dodge waves.
- **Writing Beat:** Deadpan 90s mall-rat & PA-announcement consumer satire.

## Epic 3: Area 7 — HOA Citadel Terrace (`hoa-citadel`)
- **Theme & Music:** 134 BPM Brass-March Ska-Punk.
- **Topology:** Hyper-symmetrical manicured sky-gardens, trimmed hedge corridors, and citation-gate arches around a central Gazebo Tribunal.
- **4–5 Unique Buildings & New `GsrBuildingArch` Variants:**
  1. `permit-office` (`hoa-manor`) — Brick-and-stucco trim with regulation shutters.
  2. `hedge-depot` (`topiary-pavilion`) — Sculpted hedge walls and lawn-ornament pedestals.
  3. `beige-archive` (`hoa-manor`) — Monochrome approved-swatches facade.
  4. `gazebo-tribunal` (`rotunda-dome`) — White lattice gazebo with brass bell roof.
  5. `vance-megaphone-spire` (`megaphone-tower`) — Inspector Vance-Bot's 100 MHz Compliance Jammer.
- **New Prefabs Needed:** `gsr-citation-gate`, `gsr-topiary-hedge`, `gsr-megaphone-statue`.
- **Interactive Hook:** Grinding "NO GRINDING" bylaw signs awards bonus defiance points.
- **Writing Beat:** Passive-aggressive suburban bylaw bureaucracy vs. rebel lawn-care satire.

## Epic 4: Area 8 — Subsoil Relay Tower (`subsoil-relay`)
- **Theme & Music:** 145 BPM Deep-Cut Subterranean Dub-Techno.
- **Topology:** Vertical dish-scaffolding spire descending/ascending around a colossal central tuning-fork antenna.
- **4–5 Unique Buildings & New `GsrBuildingArch` Variants:**
  1. `subsoil-bunker` (`relay-bunker`) — Reinforced concrete and glowing amber tape-reel windows.
  2. `cassette-archive` (`reel-vault`) — Giant spinning tape-spool facade.
  3. `echo-chamber` (`acoustic-dish`) — Parabolic dish walls aimed inward.
  4. `scaffolding-ring` (`antenna-rig`) — Open steel lattice and cable bridges.
  5. `tuning-fork-apex` (`tuning-spire`) — Static-Crown Sol's boss platform.
- **New Prefabs Needed:** `gsr-tape-bank`, `gsr-tuning-fork-pylon`.
- **Interactive Hook:** Frequency-switch dishes that flip rail polarity mid-run.
- **Writing Beat:** Late-night conspiracy-radio noir & subterranean folklore.

## Epic 5: Area 9 — Zero-Hz Zenith (`zero-hz-zenith`, Secret Finale)
- **Theme & Music:** Multi-genre Medley Encore (160 BPM, weaving all 8 regional motifs).
- **Topology:** Inverted vinyl-groove spiral floating in an anti-sound cosmos.
- **4–5 Unique Buildings:** *Dead-Wax Gate*, *Four-Track Monolith*, *Unfired Choir Amphitheater*, *Echo-Null Pedestal*, *The Original Needle's Turntable Crown*.
- **Interactive Hook:** Painting surfaces restores color and music stems to silent mono-zones.
- **Writing Beat:** Hushed, mythic ensemble finale where all 8 regional voices harmonize.
