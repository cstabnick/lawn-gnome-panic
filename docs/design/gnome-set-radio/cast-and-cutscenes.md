# Gnom Set Radio — Cast, Gang Variations, Jingles & Cutscene Bible

> **Setting:** `the-aether` (The Broadcast Archipelago, Upper Aether)
> **Code Sources:** `games/gnome-set-radio/src/data/cast.ts`, `src/data/cutscenes.ts`, `src/audio/jingles.ts`, `src/view/gangCrew.ts`

---

## Status Overview

| Areas | Status | What Is Included |
|---|---|---|
| **Areas 1–4** (`velvet-keys`, `bongo-basin`, `chrome-kiln`, `neon-birdbath`) | **Built & Live** | Stylized 3D Leaders (halo/crown), 2 Sidekicks flanking boss stage, 3 skating Crew Gnomes per area with proximity shoutouts, Web Audio Leader Jingles, 3D-directed Cutscenes (Game Intro, Level Intro, Boss Intro, Boss Defeat/Transition) |
| **Areas 5–8** (`mulch-alley`, `tupperware-mall`, `hoa-citadel`, `subsoil-relay`) | **Written & Ready for Level Build** | Full cast definitions, `@lawn/prefabs` crew gear loadouts, synthesized Leader Jingles (playable in Codex), and full Level Intro / Boss Intro / Boss Defeat cutscene scripts |
| **Area 9** (`zero-hz-zenith`, Secret Finale) | **Written & Ready for Finale Build** | Special 5-cutscene finale arc, The Original Needle + 2 Sidekicks + 2 Crew Variations, and synthesized E Dorian Harmonic Awakening jingle |

**Totals:** 9 Leaders (8 main + 9th finale) · 18 Sidekicks (16 + 2) · 18 Crew Gnome Variations (16 + 2) · 9 Synthesized Leader Jingles · 30 Cutscenes (1 Game Intro + 24 Area 1–8 + 5 Area 9 Finale).

---

## Cast, Crew & Jingles by Area

### Area 1 — Velvet Keys Plaza *(Built & Live)*
- **Gang:** The Ivory Syndicate
- **Leader:** **Maestro Upright** (`gsr-upright-piano`, `#ff4ecd` / `#ffd740`) — Lacquered upright piano crowned with a neon magenta Dorian halo.
- **Jingle:** *Ivory Syndicate Turnaround* (162 BPM, D Dorian)
- **Sidekicks:**
  1. **Pluck** (Woken `gsr-upright-bass`) — Upright Bass Runner
  2. **Saxy Sal** (Woken `gsr-saxophone-woken`) — Plaza Alto Busker
- **Low-Level Crew Gnome Variations (3 skating patrols in-level):**
  1. **Ivory Tuner** — `head: wiseguy-fedora`, `neck: gsr-vinyl-chain`
  2. **Dorian Busker** — `head: brick-beret`, `hand: gsr-aether-can`

### Area 2 — Bongo Basin Overpass *(Built & Live)*
- **Gang:** The Rip-Skin Collective
- **Leader:** **Conga King Kora** (`gsr-bongo-stack`, `#ff9100` / `#ffd740`) — Crowned twin-drum hover-bonga rig.
- **Jingle:** *Rip-Skin Polyrhythm Roll* (132 BPM, A Mixolydian)
- **Sidekicks:**
  1. **Rimshot Rizzo** (Gnome: `head: aviator-cap`, `back: gsr-spray-pack`, `neck: tire-tread-collar`) — Viaduct Pace-Setter
  2. **Timbale Tobe** (Woken `gsr-bongo-stack`) — Toll-Gate Percussionist
- **Low-Level Crew Gnome Variations (3 skating patrols in-level):**
  1. **Viaduct Drifter** — `neck: tire-tread-collar`, `hand: gsr-aether-can`
  2. **Chili-Run Skater** — `head: gba-headband`, `back: rough-satchel`

### Area 3 — Chrome Kiln Foundry *(Built & Live)*
- **Gang:** The Glaze Grinders
- **Leader:** **Furnace Vera** (`gsr-anvil-cymbal`, `#76ff03` / `#ff6d00`) — Forged iron anvil-cymbal glowing with acid-funk heat.
- **Jingle:** *Crucible 303 Acid Riff* (138 BPM, E Phrygian Dominant)
- **Sidekicks:**
  1. **Trundle** (Woken `gsr-glaze-trolley`) — Molten Glaze Hauler
  2. **Slaghammer Salvo** (Gnome: `head: gsr-kiln-visor`, `back: salvage-wrench-pack`, `hand: garden-mallet`) — Union Shop Steward
- **Low-Level Crew Gnome Variations (3 skating patrols in-level):**
  1. **Kiln Welder** — `head: gsr-kiln-visor`, `hand: brass-calipers`
  2. **Smelter Rigger** — `head: foreman-hard-hat`, `back: salvage-wrench-pack`

### Area 4 — Neon Birdbath Spire *(Built & Live)*
- **Gang:** The Splash-Back Skaters
- **Leader:** **Fountainhead Finn** (`gsr-neon-fountain`, `#00e5ff` / `#ff4ecd`) — Tiered neon-glass birdbath.
- **Jingle:** *Lydian Mist Shimmer* (170 BPM, G Lydian)
- **Sidekicks:**
  1. **Gus** (Woken `gsr-upright-bass`) — Lydian Mist Bassist
  2. **Vapor Vesper** (Gnome: `head: gsr-dj-headphones`, `back: gsr-mist-wings`, `neck: vip-towel-scarf`) — Spire Aerial Guide
- **Low-Level Crew Gnome Variations (3 skating patrols in-level):**
  1. **Lagoon Glider** — `back: gsr-mist-wings`, `neck: visitor-lanyard`
  2. **Spire Mist-Rat** — `head: flight-goggles`, `hand: super-soaker`

### Area 5 — Mulch Alley Arcade *(Written)*
- **Gang:** The Token Sharks
- **Leader:** **Quarter-Slot Quinn** (`#ff5252` / `#ffd740`) — High-Score Arcade Boss
- **Jingle:** *Token Shark 8-Bit Coin-Up* (118 BPM, C Minor)
- **Sidekicks:** **Pixel Pip** (`head: dealer-visor`, `hand: pocket-transistor`) & **Bootleg Bramble** (Woken `gsr-cassette-deck`)
- **Crew Variations:** **Token Hustler** (`head: dealer-visor`, `neck: time-card-clip`) & **CRT Scavenger** (`head: gsr-dj-headphones`, `hand: pocket-transistor`)

### Area 6 — Tupperware Sky-Mall *(Written)*
- **Gang:** The Clearance Crew
- **Leader:** **Barcode Betty** (`#4dd0e1` / `#ff8a80`) — Clearance Checkout Sovereign
- **Jingle:** *Sky-Mall PA Chime & Disco Pop* (126 BPM, Bb Ionian)
- **Sidekicks:** **Cartwheel Carl** (Woken `gsr-glaze-trolley`) & **Coupon Cora** (`head: golf-visor`, `back: disco-pack`)
- **Crew Variations:** **Clearance Clerk** (`neck: name-tag`, `back: disco-pack`) & **Food-Court Loiterer** (`head: golf-visor`, `hand: martini-glass`)

### Area 7 — HOA Citadel Terrace *(Written)*
- **Gang:** The Bylaw Brass
- **Leader:** **Inspector Vance-Bot** (`#ffd740` / `#2e7d32`) — 100 MHz Compliance Jammer
- **Jingle:** *Bylaw Brass Citation March* (112 BPM, F# Harmonic Minor)
- **Sidekicks:** **Clipboard Clive** (`head: megaphone-cap`, `hand: ruler-stick`) & **Beige-Swatch Bertha** (`head: microfiber-bowler`, `neck: gba-whistle`)
- **Crew Variations:** **Citation Warden** (`head: megaphone-cap`, `neck: gba-whistle`) & **Hedge Inspector** (`head: microfiber-bowler`, `hand: ruler-stick`)

### Area 8 — Subsoil Relay Tower *(Written)*
- **Gang:** The Deep-Cut Syndicate
- **Leader:** **Static-Crown Sol** (`#7c4dff` / `#ffab40`) — 108.0 Keeper of the Fork
- **Jingle:** *108.0 Deep-Cut Dub Swell* (166 BPM, C Phrygian)
- **Sidekicks:** **Reel-to-Reel Rex** (Woken `gsr-cassette-deck`) & **Sub-Bass Sable** (`head: tinfoil-brim`, `back: explorer-pack`)
- **Crew Variations:** **Static Listener** (`head: tinfoil-brim`, `neck: tin-can-phone`) & **Tape Archivist** (`back: explorer-pack`, `hand: porcelain-lantern`)

### Area 9 — Zero-Hz Zenith *(Written — Special 5-Cutscene Finale)*
- **Gang:** The Unfired Choir
- **Leader:** **The Original Needle** (`#ffffff` / `#ffd740`) — Apex of the Silent Frequency
- **Jingle:** *Zero-Hz Harmonic Awakening* (158 BPM, E Dorian)
- **Sidekicks:** **Dead-Wax Echo** (`head: letter-crown`, `neck: stopping-stone-charm`) & **Mute Metronome** (Woken `gsr-metronome`)
- **Crew Variations:** **Unfired Acolyte** (`head: chalk-cap`, `neck: stopping-stone-charm`) & **Groove Phantom** (`head: letter-crown`, `back: picnic-cape`)

---

## Cutscene Index (30 Total)

1. **`game-intro`**: DJ Broadcast introduces the Broadcast Archipelago, leaked Turfton pirate radio, Woken objects, Aether Rollerblades, and the 8-rung Frequency Ladder.
2. **Areas 1–8 (24 cutscenes)**: Each area has `area-<n>-level-intro` (world hook + leader jingle + sidekicks), `area-<n>-boss-intro` (boss unlock + jingle + title card), and `area-<n>-boss-defeat` (ladder rung retuned + transition to next area).
3. **Area 9 Special Finale (5 cutscenes)**:
   - `area-9-awakening`: Eighth-band convergence tears open the upper void.
   - `area-9-level-intro`: Arrival in the monochrome vinyl spiral (`zero-hz-zenith` jingle).
   - `area-9-mid-encore`: All 8 former gang leaders skate up the ladder to back the player.
   - `area-9-boss-intro`: Final showdown at the Turntable Crown (`zero-hz-zenith` jingle).
   - `area-9-ending`: Grand Finale & Archipelago Epilogue where all 9 frequencies harmonize forever.
