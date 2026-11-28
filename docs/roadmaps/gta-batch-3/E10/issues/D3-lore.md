Epic: E10-A (homes, parallel wave)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
The lore knowledge base records the homes E10 builds: Saucer Court as built, the new named places (Kerb Row, the
Mayor's Residence, townhouse 404, Sorrel's cottage, Diggs' bungalow, Frank's shack), and a ruling for how homes work.

## Read first
- `docs/lore/README.md` (entry format, front matter fields, how rulings are written) and `docs/lore/canon.md` (tone).
- Existing entries to extend: `docs/lore/entries/apocrypha/saucer-court.md`, `hyssop-doormat.md`, `juniper-vance.md`,
  `kerbstone-cabs.md`, `mabel-kerbstone.md`, `first-kiln-bank.md`, `parsley-inkpot.md`; and look up Reginald, Mayor Mulch,
  Sorrel, Diggs and Frank with `npm run lore -- find <word>` (run from the worktree root) to get their entry ids.
- `docs/lore/rulings.md`: the last ruling number in this branch is R-179; use **R-180** and up (other epics add
  rulings in parallel; the lead renumbers at merge if they collide).
- What was built (facts to record, do not invent beyond them): Saucer Court is three low wings of flats round the saucer
  courtyard, open to the street on the south; the stairwell door to 3A and 3B is on the north wing with a buzzer panel
  ("3A H. DOORMAT / 3B (YOU)") and Hyssop's posted stairwell rules (wipe feet, no running, no lodgers, I am watching);
  nobody sweeps the courtyard; the saucer is dry. Flat 3B is signed for in quest #2 "A Roof on Credit" at the First Kiln
  Bank counter with Parsley Inkpot (1,500 Acorns on the ledger beside the Kiln-Debt, R-169); the player furnishes it
  with furniture bought from **Gnome & Garden Furnishings** (delivery to Saucer Court, stairs extra, free), paints the
  walls, and sleeps in their own bed (time passes; the game is saved). Homes: Juniper Vance's narrow terrace on **Kerb
  Row** (home plate "J. VANCE"; a council bike with a ticket from her own council); **the Mayor's Residence**, a glossy
  red villa in Patio Heights ("CAMPAIGN DONATIONS: SIDE DOOR"); **townhouse 404**, Reginald Vance's beige townhouse in
  Patio Heights, walk-in (a dining table laid for two, one chair knocked over; a measured carpet; "SHOES OFF. SOCKS:
  BEIGE."); Mabel's flat over the **Kerbstone Cabs** garage ("CASH ONLY. CORRECT CHANGE NOT REQUIRED: I HAVE IT");
  **Sorrel's cottage** behind her radio booth in Mossy Wood ("LISTENER-SUPPORTED HOUSE"); **Diggs' bungalow**, a tin
  Nissen hut south of Pebblewick, walk-in ("FINDERS KEEPERS. LOSERS: HOA."); **Frank's shack** behind the south welcome
  sign ("NO SOLICITORS. NO SOLICITING EITHER").

## Change
- `docs/lore/rulings.md`: append **R-180** "Where does everybody live?": every named gnome has a home; some are known
  places (doors, plates, a lit window), some are never shown (a cot, a back room) and stay unacknowledged; homes are
  private: in the online game nobody visits another player's flat (each player's Flat 3B is their own); gnomes put their
  names on plates, not on maps, so a home only goes on the player's map once they have stood at its door. Append
  **R-181** for Gnome & Garden Furnishings (who they are, one joke) if no entry or brand already covers furniture sellers
  (check `docs/design/gnome-theft-auto/brands.md` and `npm run lore -- find furnish`).
- New entries under `docs/lore/entries/apocrypha/` (front matter like `saucer-court.md`; `status: draft`;
  `games: [gnome-theft-auto]`; `sources:` the rulings you cite and `docs/design/gnome-theft-auto/characters.md`):
  `kerb-row.md`, `mayors-residence.md`, `townhouse-404.md`, `sorrels-cottage.md`, `diggs-bungalow.md`,
  `franks-shack.md`, and `gnome-and-garden-furnishings.md` (if R-181). Each: one-paragraph description, "What gnomes
  say" (two sayings), "In the games" (what is built, which quest uses it: Kerb Row and the Mayor's Residence are stops in
  `city-kerbside-rounds` and `ch1-two-coat-tail`), "Loose threads" (one).
- Update `saucer-court.md` ("In the games": built by E10 as described above; Flat 3B is furnished by the player) and
  `hyssop-doormat.md` (she is placed: at her window by the stairwell door; her rules notice). Add `related:` links both
  ways where you add a new entry (e.g. juniper-vance ↔ kerb-row).
- If `docs/lore/INDEX.md` lists entries by hand, add the new ones there (read its header).

## Done when
- `npm run lore` (from the worktree root) passes.
- `git diff --stat` shows only files under `docs/lore/`.

## Out of scope
Everything outside `docs/lore/`.
