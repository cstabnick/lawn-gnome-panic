# Gnom Set Radio — Music Bible

All music is 100% synthesized in `@lawn/music` (`packages/music/src/themes/gnomeSetRadio.ts`) on Tone.js—no samples anywhere. Every track shares a reactive mix engine (`GsrMusicOptions`: `grinding`, `air`, `boss`, `hype`) and keeps low-end fundamentals (`< 220 Hz`) out of reverb and modulation buses.

---

## Track Roster (10 Tracks)

### 0. Pirate Radio Hub (`pirate-radio-hub`)
- **Area / Context:** Title Screen & Broadcast Hub
- **Style:** Laid-back Pirate Radio Funk-Hop
- **BPM / Key / Mode:** 104 BPM · F Mixolydian (`F7 - Eb9 - Bbmaj7 - C9sus4`)
- **Motif & Beat:** Warm Rhodes seventh chords, walking upright bass pocket, crisp Funky Drummer ghost-snare shuffle, and vibraphone call-and-response hooks.

### 1. Velvet Keys Plaza (`ivory-jungle-jazz`) — *Playable Level 1*
- **Gang:** The Ivory Syndicate (Maestro Upright & Pluck)
- **Style:** **Funky Jungle-Jazz Fusion**
- **BPM / Key / Mode:** 162 BPM · D Dorian (`Dm9 - G13 - Cmaj9 - A7alt` / diatonic `i7 - IV7 - bVII7 - v7`)
- **Theory & Arrangement:**
  - **Upright Bass:** Walking jazz quarters/eighths locking with a sub-clean root pulse.
  - **Felt Piano & Rhodes:** Syncopated voice-led ii7–V–I–vi jazz comping stabs (`voiceLead` + `chordTones`).
  - **Jungle Breaks:** Chopped **Amen** and **Funky Drummer** 16th-note breaks (`chopBar` + `transitionFill` every 4/8 bars).
  - **Vibraphone & French Horn:** Call-and-answer Dorian motif; `boss` / high `hype` brings in horn countermelodies; `grinding` lifts crisp 16th hats; `air` sweeps the master low-pass filter.

### 2. Bongo Basin Overpass (`bongo-rip-mix`) — *Playable Level 2*
- **Gang:** The Rip-Skin Collective (Conga King Kora)
- **Style:** **Full Percussion Bongo Rip Mix**
- **BPM / Key / Mode:** 132 BPM · A Mixolydian (`A7 - Gmaj7 - D9 - E7sus4`)
- **Theory & Arrangement:**
  - **Full Bongo Rip (`createBongoKit`):** Relentless 16th-note polyrhythmic *low / high / slap / tap / shaker* tumbao & rip patterns with dedicated 4-bar bongo rip fills (syncopated slap-high-low rolls).
  - **Breakbeat Layer:** **Apache** & **Funky Drummer** breaks interlocked with the bongos.
  - **Bass & Horns:** Slap-style octave funk bass + punchy Mixolydian horn stabs (`I7 - bVII - IV - V`) and Rhodes percussive comping.

### 3. Chrome Kiln Foundry (`chrome-kiln-funk`) — *Teased after Level 2*
- **Gang:** The Glaze Grinders (Furnace Vera)
- **Style:** Acid-Funk Breakbeat
- **BPM / Key / Mode:** 138 BPM · E Phrygian Dominant (`E - Fmaj7 - Dm7 - E`)
- **Motif & Beat:** Driving **Think** break, squelchy resonant acid bassline, metallic vibraphone hits, and tense Phrygian Dominant horn calls.

### 4. Neon Birdbath Spire (`neon-birdbath-liquid`)
- **Gang:** The Splash-Back Skaters (Fountainhead Finn)
- **Style:** Liquid Jazz-DnB
- **BPM / Key / Mode:** 170 BPM · G Lydian (`Gmaj9 - A/G - F#m7 - Bm7`)
- **Motif & Beat:** Fast rolling **Amen** + shaker liquid break, shimmering harp arpeggios, Rhodes 9th pads, and soaring Lydian (`#4`) vibraphone melody.

### 5. Mulch Alley Arcade (`mulch-alley-chiptune-funk`)
- **Gang:** The Token Sharks (Quarter-Slot Quinn)
- **Style:** Chiptune Funk-Hop
- **BPM / Key / Mode:** 118 BPM · C Minor / Aeolian (`Cm7 - Abmaj7 - Fm7 - G7`)
- **Motif & Beat:** Punchy **Funky Drummer** break, bouncy synth-funk bass, 8-bit-bright square/triangle arps, and playful coin-flip vibraphone stings.

### 6. Tupperware Sky-Mall (`sky-mall-future-funk`)
- **Gang:** The Clearance Crew (Barcode Betty)
- **Style:** Future-Funk Disco-House
- **BPM / Key / Mode:** 126 BPM · Bb Ionian (`Bbmaj7 - Gm7 - Cm7 - F9`)
- **Motif & Beat:** Four-on-the-floor kick with crisp open-hat lifts, octave-jumping disco bass, lush Rhodes & felt-piano stabs, and upbeat horn fanfares.

### 7. HOA Citadel Terrace (`hoa-bylaw-brass-step`)
- **Gang:** The Bylaw Brass (Inspector Vance-Bot)
- **Style:** Big-Beat Brass Dub-Funk
- **BPM / Key / Mode:** 112 BPM · F# Harmonic Minor (`F#m - Dmaj7 - Bm7 - C#7`)
- **Motif & Beat:** Heavy stomping **Apache** half-time break, pompous French horn & brass-march stabs, upright bass ostinato, and dub-echoed chord chops.

### 8. Subsoil Relay Tower (`subsoil-relay-jungle`)
- **Gang:** The Deep-Cut Syndicate (Static-Crown Sol)
- **Style:** Dark Dub-Jungle Jazz-Horn
- **BPM / Key / Mode:** 166 BPM · C Phrygian (`Cm7 - DbMaj7 - Bbm7 - Cm7`)
- **Motif & Beat:** Rolling **Amen** + **Think** dual-chop break, deep sub-bass pulse, nocturnal dub Rhodes echoes, and moody horn swells.

### 9. [SECRET] The Silent Frequency (`zero-hz-zenith`)
- **Gang:** The Unfired Choir (The Original Needle)
- **Style:** Grand Symphonic Jungle-Jazz-Bongo Finale
- **BPM / Key / Mode:** 158 BPM · E Dorian (`Em9 - A13 - Dmaj9 - Bm7`)
- **Motif & Beat:** Unites every signature voice of the Archipelago—felt piano, walking upright bass, full bongo rip percussion, French horn fanfare, harp cascades, and chopped Amen breaks—in one triumphant finale.
