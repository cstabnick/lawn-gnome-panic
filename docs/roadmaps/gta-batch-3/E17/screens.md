# E17 screenshot pass and storytelling AC

`node tools/gta-shots.mjs http://localhost:5317/ docs/roadmaps/gta-batch-3/E17/screens <name>:<x>,<z>,<yaw> ... --size 800x500`;
interiors with `http://localhost:5317/?interior=<id>`.

| Place | Shots |
|---|---|
| The Underspan | `underspan-road` (manifesto boards from the road), `underspan-roost` (the scaffold towers and the Roost), `underspan-shed` (Hogweed and the workshop door); inside: `interior-underspan-workshop` |
| Wader's Rest | `waders-gate`, `waders-circle` (the one-leg stones, the Standing Lady on her mound), `waders-camp` (tents, washing, rota); inside: `interior-flock-tent` |
| The Burrow Door / Loamdeep | `burrow-door`, `burrow-signs` (the HOA pest notice and the moles' polite reply), `burrow-mound`; inside: `interior-loamdeep` (the entry tunnel), `interior-moleman-burrow` |

Storytelling AC per place:

| | Underspan | Wader's Rest | Loamdeep (+ Burrow Door) |
|---|---|---|---|
| (a) 3 vignettes | glider with blueprints blowing away; pedal generator beside the last test's dent; Local 404 hard hat and two cups left by the road | tipped stool and spilled tea (sat on a Tuesday); one pink sock pegged apart; one-footed footprints from circle to urn | chair laid "for when the gnomes visit"; letters "TO: THE SURFACE" + "NO SUCH BURROW"; spade "found in our ceiling"; Moleman's kept supper; tiny dance footprints; spade in a molehill with a note; Nubbin's picnic |
| (b) signs | manifesto posters, citation post, "THE ROOST. NO STAIRS.", HOA "NOT A STRUCTURE" | rota, "PINK IS FOR THE LADY ONLY", HOA ornament permit + "She is standing." | "GRUBS, NOT ROOTS", "LOANED, NOT EATEN", HOA pest notice + "Kind regards." |
| (c) residents doing place things | Hogweed, Burdock pedalling, Nettle in a hammock, chalker, citation sweeper; Teasel welding and Vetch drafting inside | Saxifrage and the Flock on one leg, tea, washing, rota | Tamp sorting roots, Delve, Sift, Crumb, walkers on errands, the Tunnel twins, Moleman's set once he visits |
| (d) sound and life | weld crackle, pedal whirr | reed rustle, flock hum, Tuesday toast | mole squeaks, drips, Subsoil Radio through the dug-in speakers |

Checks at the end of the epic: smoke OK at the three surface places and the four interiors (`gta-gnomlet`); z-fight scans
at the same seven spots: no E17 pair left (fixed: Roost deck vs tower tops, two buried hall signs, the Under-Chorus cable).
Not done: a real phone; the 390 x 844 layouts of the sorting, dig and sermon overlays were not looked at in a browser.
