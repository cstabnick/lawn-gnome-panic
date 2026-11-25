Epic: E17 wave 1 (writing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first. Lore lives in `docs/lore/` (see `docs/lore/README.md` for the
entry format and front matter; `npm run lore -- find <word>` searches; `npm run lore` validates). Edit only files under
`docs/lore/`.

## Goal
The lore knows everything E17 builds: the people of the three places, Loamdeep's halls and jobs, the Underspan's
contraptions, the Flock's camp, DJ Moleman's visit, and the epic's rulings.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (every name, place and id: `SOCIETY_CAST`, `HALL_NAMES`,
  `MOLE_JOB_NAMES`, `UNDERSPAN`, `WADERS_REST`, `LOAMDEEP`, `MOLEMAN_BURROW`, `SOCIETY_QUESTS`)
- `docs/lore/canon.md`, `docs/lore/rulings.md` (the last rulings, R-202..R-206, for the format and the next number)
- Existing entries (apocrypha): `loamdeep.md`, `the-burrowfolk.md`, `the-burrow-door.md`, `nubbin.md`,
  `old-mother-tumblesoil.md`, `dj-moleman.md`, `subsoil-radio.md`, `the-underspan.md`, `the-underspanners.md`,
  `hogweed-sprocket.md`, `waders-rest.md`, `flock-of-the-one-leg.md`, `saxifrage-wader.md`, `the-standing-lady.md`;
  and `docs/lore/entries/fescue/mole-clans.md`.

## Change
- New entries in `docs/lore/entries/apocrypha/` (same front matter style as the neighbours; draft status like them),
  one per named thing, 60-150 words each, "What gnomes say" / "The truth" / "In the games" sections where they fit:
  - Underspanners: `teasel-gimbal.md`, `burdock-flywheel.md`, `vetch-cantilever.md`, `nettle-rivet.md` (roles in
    config.ts comments), `the-updraft.md` (the hose-and-umbrella lift in Hogweed's workshop that shoots a gnome up onto
    the Roost; HOA citation "unauthorised verticality"), `the-roost.md` (the scaffold deck above the Underspan, with
    the Chute back down).
  - The Flock: `sister-sedge.md`, `brother-bulrush.md`, `sister-plover.md`, `brother-godwit.md`, `novice-pipit.md`,
    `the-long-vigil.md` (the Flock's night vigil on one leg; sitting down at it is how a gnome leaves the Flock, and
    they forgive you with a cup of reed tea).
  - The Burrowfolk: `old-tamp.md`, `mistress-delve.md`, `mister-sift.md`, `auntie-crumb.md`, `pim-and-pod.md` (the
    Tunnel twins), `mole-jobs.md` (Root Run, Lamplighter, Post Sorting, Dig a Nook: what each is, that the Burrowfolk
    pay in Acorns they find in the soil), `under-chorus-hall.md`, `the-long-tunnel.md` (from Under-Chorus Hall down to
    DJ Moleman's own burrow under Turfton; how long it is, nobody agrees), `molemans-burrow.md`.
- Update "In the games" in the existing entries above to say what E17 built (places, quests by title and id from
  `SOCIETY_QUESTS`, achievements from `SOCIETY_ACH`). `dj-moleman.md`: he comes up the Long Tunnel and plays the
  Under-Chorus once the lamps are lit (quest `sq-loamdeep-under-chorus`): the family's wish that he would visit comes
  true; keep his transmitter unexplained. `the-burrowfolk.md`: add a sentence linking to `mole-clans` as a maybe
  (do not settle it).
- `docs/lore/rulings.md`: append rulings R-207 onward (same format as R-206), at least:
  - R-207: the Burrowfolk are small (about knee-high to a gnome), gentle and misread; gnomes treat them as pests and the
    Tall Ones blame them for lumps; neither is home in Loamdeep; moles wear no hats except Moleman's antenna hat.
  - R-208: Loamdeep is one big hall-and-tunnel interior under the Burrow Door, six halls; mole jobs pay Acorns.
  - R-209: DJ Moleman's look in Gnome Theft Auto (antenna with a trilby on top, headphones round his neck, no costume)
    and that he does visit Loamdeep after `sq-loamdeep-under-chorus`.
  - R-210: Wader's Rest layout (the Lady faces west on her sand mound; the big tent faces her; grey everything; her
    likeness on the shrine is white because pink is for her only).
  - R-211: the Underspan stays inside its site beside the Unfinished Span and never under the deck; the Roost is the
    only way "up" and it is not allowed.
- Any other file under `docs/lore/` the validator needs updated for new entries (an index, if `npm run lore` asks).

## Done when
- `npm run lore` passes (from the repo root).
- `npm run lore -- find moleman`, `find nubbin`, `find underspan`, `find flock` each list the new entries.

## Out of scope
Everything outside `docs/lore/`.
