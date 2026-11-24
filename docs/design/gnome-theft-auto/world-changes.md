# Gnome Theft Auto: world changes (L68)

## What a world change is

A world change is a visible change that appears once a series of main quests is done, so Turfton feels like it is
developing as the story moves. Examples: a lit window, a new stall, a crowd, a banner, a mown line.

How it is applied:

- Each change has an id (W01-W17) and an `after` list of main-quest ids. It is on when every id in `after` is finished.
- The state is **derived from the quest save** (finished quest ids). No new save key. Old saves therefore get every
  change they have earned the first time they load; nothing needs a migration. For an extended quest the id in `after`
  is the final part (the row id), as the spine records it.
- A change is a **separate toggled group** of props, NPCs, signs and shop stalls, built next to the baked static
  batches, never an edit of them (static batches are baked once). Switching a group on or off must not rebuild the
  baked cells.
- A change **never removes something a quest still needs**: it hides dressing only (hoardings, signs, banners); it never
  blocks a door, a road or a spot that a quest stage uses. If a later quest needs the earlier state (for example the
  Side-Valve bay in #35), the later change is built so the stage still works.
- Changes are visual and local to each player (nothing is synced online). Every change also has a radio line: one line
  in a **Turfton FM** news bulletin, played the first time the player is in a car after the change turns on.

## The table

Stage ids for places that are new in batch 3 (`saucer-court`, `double-pot`, `founders-green`, `fort-sandpit`,
`dust-flats-overlook`, `new-puddle`) are proposals; E18 maps each to the real stage or E01 site id when it builds.

Series are written `#N id .. #M id`: the run of main quests the change caps. "Reverts" is "stays" unless stated.

| id | after quest series | what changes | where | visible as | engine support needed | reverts? | radio line (Turfton FM news) |
|---|---|---|---|---|---|---|---|
| W01 | #2 m02-roof-on-credit .. #2 m02-roof-on-credit | The player's name is on the Saucer Court buzzer panel (one brass plate, "3B"). From dusk the flat 3B window is lit warm; on the other windows the curtains are drawn. | Saucer Court, flat 3B (player apartment block, E10; stage id `saucer-court`) | sign (buzzer plate), prop (lit window) | Toggled group on the E10 apartment block; the window light follows the day clock (night only). | Stays | "Turfton FM news: a new tenant at Saucer Court, flat 3B. The neighbours are said to have noticed." |
| W02 | #3 first-contract .. #7 m07-even-estates | Pale-blue Levelright Construction hoardings go up round each fringe site, with a crane over one of them and three beige show-homes behind the boards (identical, flat-roofed, a neat lawn each). Hoarding signs read "THORNE EVEN-ESTATES: A HEIGHT FOR EVERYONE". One worker NPC at each gate holds a clipboard. | Turfton fringe: E01 sites `construction-1`, `construction-2`, `construction-3` | prop (hoardings, crane, show-homes), npc (gate worker), sign | Toggled prop group per site plus one NPC spawn per site; keep the site's night-watch spawn points clear for #7 and #15 p2. | Stays until W17 (hoardings only, see W17) | "Turfton FM news: building starts on three fringe sites. The homes will all be the same height, the developer says, on purpose." |
| W03 | #8 ch1-tax-break-in .. #15 ch1-founders-boot | Founders' Green opens: a red ribbon on the grass, a crowd of about eight gnomes with flags, a small bandstand with a brass trio, and every HOA "CONDEMNED" sign is gone from the three blocks. The two repaved street segments carry a green banner. | Downtown park blocks (Gnorwin Statue Park (-30,30), (-90,30), (-30,90); E01 downtown park; stage id `founders-green`) | npc (crowd, band), prop (bandstand, ribbon), sign (banner), the condemned signs removed | Toggled group on the park; hides the existing "condemned" sign props via the same group's off state; crowd NPCs ambient only, not blocking the road. | Stays | "Turfton FM news: Founders' Green is open. The ribbon was cut with the wrong scissors and no one minded." |
| W04 | #16 ch2-dew-run .. #20 ch2-vespers-offer | The HOA foreclosure signs on Granny's lanes are torn down (stakes still in the ground, a few scraps of paper). The barn has a new roof of fresh red tin. A hand-painted "Gnertrude's: open" board hangs on the gate. Also: at the Route South welcome sign, Fence-Post Frank has propped a new sign "PIE, 3 MILES". | Cloverfield, Granny Gnertrude's barn (stage id `granny-barn`); south highway welcome sign | sign (torn, new board, pie sign), prop (new roof) | Toggled group: hide foreclosure sign props, swap the barn roof mesh for a roof prefab. Check the barn interior and sprinkler gauntlet (#18) are untouched. | Stays | "Turfton FM news: the foreclosure notices in Cloverfield have blown away. Nobody is saying who helped the wind." |
| W05 | #21 m21-penthouse-viewing .. #21 m21-penthouse-viewing | The Double Pot tops out: the crane over it is gone, a long Thorne banner hangs down its face ("EVEN IS BETTER"), and the Even-Estates sales floor windows are lit in neat rows. A beige-vested valet stands at the Patio Gate with a "Thorne residents" sign. | Downtown mega block (90,-90) + (150,-90), road x=120 tunnel (stage id `double-pot`); Patio Gate (stage id `patio-gate`) | skyline (banner, lit windows, crane gone), sign, npc (valet) | Toggled group: remove crane prop, add banner and window-light emissive pass; valet NPC spawn at the Patio Gate. Must keep the tunnel and rooftop walkable (E05). | Stays | "Turfton FM news: the Double Pot is finished. It has two floors more than the plan and no one remembers asking." |
| W06 | #22 m22-off-air .. #24 m24-the-burrow-door | A small lantern with a green flame hangs by the Burrow Door. At the west edge of Mossy Wood stands Sorrel's hand-painted board: "MOLES ARE NEIGHBOURS". A young mole peeks from a molehill by the sign now and then. | Mossy Wood west edge, the Burrow Door (E01 site `mole-entrance`, (-1000,360)) | prop (lantern), sign (board), npc (peeking mole, ambient) | Toggled group; the mole peek is a simple timed ambient NPC, no quest hook. | Stays | "Turfton FM news: Sorrel Tillbrook has put up a sign at the edge of Mossy Wood. She reads it out on air twice." |
| W07 | #25 m25-one-leg-to-stand-on .. #34 m34-forty-seven-wrenches | Side-Valve Salvage gets party bunting along the bay door and a printed poster on the door: "THE GREEN IS REZONED. FORTY-SEVEN WRENCHES, THANK YOU." Gnome-sized bunting flags in crew colours. | Side-Valve Salvage bay (stage id `side-valve-bay`) | prop (bunting), sign (poster) | Toggled group on the bay front; hidden again by W08 (see reverts). | Superseded by W08 (props hidden, not removed from the save logic) | "Turfton FM news: Side-Valve Salvage threw a party. Forty-seven wrenches were present; one more was reported." |
| W08 | #35 ch3-salvage-raid .. #35 ch3-salvage-raid | Side-Valve Salvage is seized: the bay door is boarded, a large HOA seal is nailed across it, and a red "SEIZED" banner hangs on the front. The bunting from W07 is gone. Two HOA guards stand outside in beige vests. | Side-Valve Salvage bay (stage id `side-valve-bay`) | prop (boards, seal), sign ("SEIZED" banner), npc (two guards) | Toggled group that hides the W07 group and the bay's open-door state; guard NPCs ambient and non-hostile; the interior stays loadable for stage reuse. | Reverts at W17 (the only revert of the batch) | "Turfton FM news: the HOA has seized a salvage yard downtown. The owner could not be reached for comment." |
| W09 | #36 ch3-kiln-resin-ice .. #39 m39-couch-surfing | Saucer Court flat 3B now has Pip's red toolbox by the door and a hammock slung across the window (visible from outside). On the door of flat 3A across the landing, Hyssop Doormat's note reads "NO LODGERS". | Saucer Court, flats 3A and 3B (E10 apartment; stage id `saucer-court`) | prop (toolbox, hammock), sign (note) | Toggled group on the apartment interior and door; the hammock mesh also shows from the street. | Stays | "Turfton FM news: a tenant at Saucer Court reports a second tenant. The neighbour reports it again." |
| W10 | #37 m37-snowdrop-slope .. #41 m41-pinwheel-ridge | The pinwheels of Pinwheel Ridge spin again (blades animate, a low whirr). Turfton's neon is brighter at night and the street lamps hold steady. Also: Capwood Run start has a chalked "WINNER: LULU" board, and the lodge at Snowdrop Slope has its string lights on. | Pinwheel Ridge (E01 site `wind-farm`, (850,-1180)); Turfton downtown and Gnomecino strips; Capwood start (E01 site `rally-route`); Woolly Sock Lodge (E01 site `ski-hill`) | prop (spinning pinwheels, string lights), skyline (brighter neon), sign | Toggled group: switch the ridge pinwheel animation on, raise neon emissive scale one step, enable lodge lights. Needs a global "power on" scalar in the lighting pass. | Stays | "Turfton FM news: the lights are steady again. The Pinwheel Ridge engineers say the wind was always willing." |
| W11 | #43 m43-saltbucket-boardwalk .. #44 m44-the-bathtub-queen | Driftwood's tube hut opens on Saltbucket Boardwalk: stacked tubes, a painted board "TUBES: THEY FLOAT". The Bathtub Queen flies a flag in the crew's colours at the masthead. Also: the HOA charter banners at the Lost & Found Speedway and the Rutbottom Dirt Bowl are cut down and replaced by Carburettor pennants. | Saltbucket Boardwalk (E01 site `coast`, (0,1140)); the Bathtub Queen (site `pirate-ship`, (240,1290)); Speedway; Rutbottom Dirt Bowl (site `dirt-track`) | shop (tube hut), prop (flag, pennants), sign | Toggled group: stall prop with a shop hook (Driftwood's tube rental, E11); ship flag mesh; banner swap at the two race sites. | Stays | "Turfton FM news: a tube hut has opened on the Saltwater. The Carburettors have also reopened their track, loudly." |
| W12 | #45 m45-rootwell-admissions .. #46 m46-starfall-at-the-anthill | The Anthill Observatory dome is open and empty: the shutter is back, the lens mount is bare. On the Rootwell quad, students hold a protest of about ten with banners ("THE LINE WAS NEVER LEVEL", "KEEP OUR STARS"). The ants watch from the mound. | The Anthill and Anthill Observatory (E01 site `observatory-mound`, (1240,140)); Rootwell University quad (site `campus`, (1130,-180)) | skyline (open dome), npc (protesters), sign (banners) | Toggled group: swap the dome shutter to the open state; ambient protest NPCs. The Anthill ramp (Dean's Leap) stays clear. | Stays | "Turfton FM news: the Rootwell observatory is open to the sky and empty of equipment. Students are marching about it." |
| W13 | #47 m47-hedgeworth-links .. #49 m49-loamdeep | A Burrowfolk root stall opens beside Bodega & Sons: a low cart of roots and pale mushrooms with a mole behind it, for sale to anyone. Along the Mossy Wood edge and on Tallgrass Commons, moles walk and dig molehills in plain sight, and gnomes nod to them. | Bodega & Sons front (stage id `bodega-front`); Mossy Wood edge near the Burrow Door (site `mole-entrance`); Tallgrass Commons | shop (root stall), npc (moles, ambient) | Toggled group; a stall prop with a small buy hook (E08 inventory) and ambient mole NPCs. Do not block Bodega's door or the road. | Stays | "Turfton FM news: a root stall has opened on Bodega's street. The roots are, the buyers say, excellent." |
| W14 | #50 m50-trellisdown-tasting .. #52 m52-the-test-cut | Hedgeworth Links gets one dead-straight mown scar across the course, a clean lane through hedge and green, ending at the broken hedge. Also: at Wader's Rest the Flock stand in a line on one leg, all facing the scar's direction; the loch shore beside them is quiet. | Hedgeworth Links (E01 site `golf-yard`, (-1180,620)); Wader's Rest (site `cult-camp`, (-1130,-640)); Loch Moss shore | prop (mown strip decal, cut hedge), npc (Flock standing), sign | Toggled group: a flat mown-strip layer (flatLayer, no z-fight) and a cut-hedge mesh; Flock NPC pose set. Keep the ninth green and the clubhouse door usable. | Stays | "Turfton FM news: a clean stripe has appeared across Hedgeworth. Groundskeepers there describe it as 'a little too clean'." |
| W15 | #58 m58-the-reeves-barn .. #60 m60-the-moles-dig | Fort Sandpit's gate shows coalition colours: a patchwork flag in every faction's cap colour over the arch. Spade Guard patrols walk the walls and wave at the player. At Pebblewick, the water tower flies a small coalition pennant. | Fort Sandpit gate (Dust Flats; stage id `fort-sandpit`); Pebblewick water tower (stage id `pebblewick`) | prop (flags), npc (friendly patrols), sign | Toggled group; Spade Guard friendly-patrol flag set on the guard NPCs (also used after #59). Gate stays passable for stages. | Stays | "Turfton FM news: the Spade Guard has taken to flying a flag of many colours. The Commander has no comment, and a medal." |
| W16 | #61 m61-diggs-medal .. #64 m64-all-hats | The Dust Flats overlook becomes the coalition camp: a ring of tents each in a faction colour (Carburettors, Underspanners, the Unmowed, the Burrowfolk, the Spade Guard, the Flock, Granny's pie table), with a long table in the middle and everybody's hat on one hook-rail. Also: the Bathtub Queen is moored at New Puddle, flying the crew's colours. | Dust Flats overlook (stage id `dust-flats-overlook`); New Puddle marina (canal; stage id `new-puddle`) | prop (tents, table, hat rail, moored ship), npc (faction gnomes, ambient) | Toggled group; ambient faction NPCs only (the quest `-p`/final stages spawn the speaking ones). | Stays | "Turfton FM news: a great many hats are seen on the Dust Flats. Observers say they all appear to be friends." |
| W17 | #65 m65-the-countess-relents .. #70 ch5-even-cut | After the finale: Side-Valve Salvage reopens (boards, seal and banner gone; the bay door is open and the crew's flag flies). The Even-Estates hoardings come down and the show-homes are left standing, empty. The downtown scar left by the Grand Combine changes: wild clover (Ending A) or a neon grid (Ending B). Also: at Trellisdown, the Countess's vines get a ribbon of fresh green on the trellis; the Standing Lady stands in the open at Wader's Rest. | Side-Valve bay; Turfton fringe sites; the downtown meridian scar; Trellisdown Vineyard (site `vineyard`); Wader's Rest | skyline (scar), prop (clover or neon grid, open bay, flag), npc (crew, ambient), radio line | Toggled group with two variants chosen by the saved ending choice; hides W08 and the W02 hoardings; shows the scar variant along the road line the Combine took. | W17 reverts W08 and the W02 hoardings | Ending A: "Turfton FM news: clover is growing on the meridian. The grass is, the council says, uneven. The council says it fondly." Ending B: "Turfton FM news: the meridian now lights up at night in a grid. The council is calling it a feature." |

Notes on the rows:

- W08 is the only change that is reverted (by W17). W07 is superseded by W08 (its props are hidden while W08 is on);
  W17 restores the open bay with the crew flag, not the old bunting.
- Secondary "Also:" places are additional toggled props under the same id, so a region is not left unchanged.

## Coverage check

Act turns (the extended-quest turns #15, #35, #52, #70) and every region the story uses. Regions that only have a
secondary prop are marked (also).

| act turn or region | world change ids |
|---|---|
| Act turn #15 (I to II) | W03 |
| Act turn #35 (II to III) | W08 (W07 sets it up) |
| Act turn #52 (III to IV) | W14 |
| Act turn #70 (finale) | W17 |
| `downtown` | W03, W05, W07, W08, W09, W01, W17 |
| `patio-heights` | W05 (valet at the Patio Gate, also) |
| `turfton-fringe` | W02, W17 |
| `underspan` | W10 (neon and lamps, also: Underspan lamps brighten) |
| `canal` | W16 (the Bathtub Queen at New Puddle, also) |
| `south-highway` | W04 (also: the Frank sign) |
| `cloverfield` | W04 |
| `mossy-wood` | W06, W13 |
| `loch-moss` | W14 (also: the loch shore) |
| `tallgrass-commons` | W13 (also: molehills) |
| `frostbite-fells` | W10 (also: the Capwood start board and lodge route lights) |
| `dust-flats` | W15, W16 |
| `pebblewick` | W15 (also: water-tower pennant) |
| `speedway` | W11 (also: charter banner swap) |
| `saltbucket-shore` | W11 |
| `rootwell` | W12 |
| `rutbottom` | W11 (also: charter banner swap) |
| `snowcap-rise` | W10 (also: Woolly Sock Lodge string lights) |
| `capwood` | W10 (also: the Capwood Run start board) |
| `pinwheel-ridge` | W10 |
| `trellisdown` | W17 (also: ribbon of green on the trellis) |
| `waders-rest` | W14 (also: the Flock facing the scar), W17 |
| `loamdeep` | W13 (the Burrowfolk reach the surface; no interior change) |
| `hedgeworth` | W14 |

Gap: Loamdeep and Trellisdown are inside spaces or have a late hook only; their regions get no early change because
the spine has 17 ids and no row for them before act III. The "also" props above are the plan; if E10 or E21 want a
fuller Loamdeep or Trellisdown change they can add a W18+ row (the engine takes any number of rows).

## Ending variants (W17)

W17 turns on after #70. The two variants differ only by the downtown scar and its mood; the rest of W17 is shared
(Side-Valve reopened, hoardings down, Trellisdown ribbon, the Standing Lady in the open).

| item | Ending A (wild) | Ending B (neon) |
|---|---|---|
| The downtown scar | A long strip of wild clover, daisies and unmown tufts along the road the Combine took, uneven on purpose, with bees and one gnome sitting in it. | A glowing grid of neon tiles set into the road line, evenly spaced, soft cyan and amber, brightest at night. |
| Skyline and mood | The Even-Estates show-homes sit empty and overgrown; the Double Pot banner is a plain "TO LET". | The show-homes and the Double Pot get a tidy neon trim; the banner reads "OPEN LATE". |
| People | Ambient crowd picnicking, children running through the clover. | Ambient crowd in neat lines under the lights, a stall or two selling glowing snacks. |
| Radio line | "Turfton FM news: clover is growing on the meridian. The grass is, the council says, uneven. The council says it fondly." | "Turfton FM news: the meridian now lights up at night in a grid. The council is calling it a feature." |
| Engine | Variant "A" of the W17 group | Variant "B" of the W17 group |

Both variants keep the Side-Valve bay open. The player may drive over the scar in both; it is dressing, not an obstacle.
If neither ending has been recorded (for example a save finished before the choice existed), W17 uses Ending A.
