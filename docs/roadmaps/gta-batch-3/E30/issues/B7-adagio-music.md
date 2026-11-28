Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Other workers edit other files of
`games/gnome-theft-auto` at the same time (another writes the station's talk in `src/radio/adagioStation.ts`).

## Goal
96.1 Radio Adagio, Pardonlin's classical station, has at least 12 original pieces (SongSpecs) that sound like a small
chamber orchestra playing pompous, lovely, slightly silly classical music, and they pass the composer's theory tests.

## Read first
- `games/gnome-theft-auto/src/radio/music/spec.ts`: what a SongSpec is (every field documented). New voices for this
  station already exist: chord 'harpsichord', bass 'cello', leads 'violin' and 'oboe' (synth code in `build.ts`).
- `games/gnome-theft-auto/src/radio/music/songs/fpr.ts`: a slow station's songs, for the format.
- `games/gnome-theft-auto/src/radio/music/compose.ts` (skim `checkSpec`: what is refused) and
  `games/gnome-theft-auto/src/radio/music/compose.test.ts` (the station rules: the `adagio` identity row allows chords
  strings / harpsichord / piano / musicBox, kit 'none' only, 50..126 bpm; at least 12 songs, unique titles across all
  stations; tempo spread >= 20, at least 5 different keys (tonic % 12), 3+ modes, 5+ chord/lead/bass sets, every
  song's progressions different).
- `games/gnome-theft-auto/src/radio/music/songs/adagio.ts`: your file (one placeholder song to keep or replace).

## Change
- `games/gnome-theft-auto/src/radio/music/songs/adagio.ts`: `ADAGIO_SONGS` with 12-14 SongSpecs. Make it sound
  classical within what the composer can do:
  - Forms: minuets and waltzes in 3/4 (meter 3), stately 4/4 largos and andantes, a quick allegro (110-126 bpm), a
    nocturne for piano and cello, a harpsichord "invention" (comp arp, short notes), a string serenade, an oboe
    pastorale, a music-box lullaby. kit 'none' always, swing 0, texture 'vinyl' or 'air' or 'none', pump 0, reverb
    3..6 (a hall), echo '4n' or '4n.'.
  - Harmony that reads as classical: I-IV-V-I cadences, ii-V-I, vi-IV-I-V, circle-of-fifths walks (vi-ii-V-I), a
    harmonic-minor piece ('harmonic' mode: mind checkSpec's refusal of augmented/diminished chords), a lydian or
    dorian outlier. Big endings (energy curve rising to 0.7-0.8 in the middle, `up: true` on a climax part, then down
    to 0.15-0.25 at the end; last part's last chord is the tonic 0).
  - Bass: 'cello' (bowed, longer notes) or 'upright' (pizzicato: short notes on beats). Leads: 'violin', 'oboe',
    'flute', 'clarinet', 'bell'; one or two pieces with lead 'none' (a chorale of strings).
  - Titles and artists in the town's voice: affectionate parody of classical titles, gnome-scale, Pardonlin names, no
    real composers, people or places. Examples of the register (write your own): "Overture to a Long Lunch" (keep it),
    "Minuet for a Queue That Does Not Move", "Concerto for Cello and Pigeon in B-flat", "Nocturne (Closed Until
    Further Notice)", "Air on a Bean String", "Waltz of the Little Car That Parks Anywhere", "Requiem for a Croissant
    (Second Croissant)", "Serenade for Strings and One Strike". Artists: the Pardonlin Municipal Chamber Orchestra,
    the Thymes Quartet, Maestro Ottavio Lento (conducting, loudly), the Grand Platz Bandstand Ensemble, the Opera Hall
    Chorus (Without the Chorus), Odile Easelby (harpsichord, reluctantly).
  - Update the file header comment if your mix changes.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/radio/music/compose.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your file.
- Report: the titles, with bpm, meter, mode and instrument set for each.

## Out of scope
`build.ts`, `spec.ts`, `compose.ts`, the tests, other stations' songs, `adagioStation.ts`, `content.ts`.
