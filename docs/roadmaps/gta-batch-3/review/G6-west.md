# G6 The west and the wild: editorial review, round 1

Editor: Opus (R1). Inspected on `gta-batch-3` at 6d217da8 through the dev server (port 5406): about 50 screenshots,
desktop 960 x 600 and phone 390 x 844, saved under [shots/G6/](shots/G6/) (file names are cited below as `shots/G6/<name>`).
I also read the code and data for each place, the lore entries, and the E15/E16/E17/E31/E32 screenshot passes.

## Verdict

The set pieces are funny and on-tone. The Flock is gentle and absurd, the moles are kind and misunderstood, the sign
jokes land, and the HOA is the butt of every joke. The cult stays harmless and the moles stay cute; I found nothing
against the spirit in the writing. The problem is the **places themselves**. Too often they don't look like what their
names, lore and jokes promise:

- **The Unmown is mown.** The Long Meadow is not waist-high, Oldroot Wood is not a wood, and Wader's Rest is not reedy.
- The best jokes are on signs nobody can read, because long lines shrink to a few pixels.
- "Round the back" (said three times) leads to a blank back wall with an invisible door.
- Hedgeworth's rough is a rash of identical mud-and-bulrush mounds.
- Several interiors are bare boxes: the moles' rooms, the Flock's tent and the tasting hall.

Between the set pieces, the west is a very large, flat, freshly mown lawn. This is the region the user called "the
wild". It should feel the least mown and the most hand-placed in the game, and right now it feels the most generic.

The fixes below are mostly dressing and data (density, placement, wrapping text, a few prefab parts), not new systems.
They are well suited to one or two fix epics. Counts are at the end.

## Findings

### Blockers

**1. The Unmown is a mown lawn.**
- **What:** The preserve whose whole identity is "the corner the Tall One stopped mowing" (lore: "the opposite of the
  Even Cut", "the Long Meadow (waist-high grass)", "where the grass takes things") is short, bright meadow paint with a
  few ankle-high tufts. The Long Meadow at (-600, -1640) is indistinguishable from Cloverfield. So is the ground round
  the ranger station and every hide.
- **Where:** `shots/G6/meadow`, `station`, `wood`, `reedmere-hide`; `landforms/theUnmown.ts` (paint only, no cover), `unmown/vignettes.ts`.
- **Why it matters:** It breaks the place's premise and its jokes. Vignette 2, "the mower that tried" (a ride-on
  mower with a 1 m mown stripe behind it at (-600, -1590)), only reads if everything round the stripe is tall, and here
  it isn't. The HUD/lore promise "keep to the path", but there is nothing to get lost in.
- **Proposed fix:**
  - Fill the Long Meadow rectangle (x -780..-340, z -1760..-1520) and the preserve's margins with a dense instanced
    tall-grass field: `ornamental-grass`, `giant-grass-blade` and seed heads at 1.2–2 m, culled per cell like the
    golf grass.
  - Keep a mown 2 m strip only along the trails, so the paths read as the only cut ground.
  - Darken and warm the preserve's ground paint (straw / olive) so it reads differently from the Commons even at a distance.
  - Re-check the mower vignette and the HOA-survey vignette against the new height.
- **Severity:** blocker · **Type:** craft (it contradicts its own lore and design brief)

**2. Long single-line signs are unreadable: the jokes don't reach the player.**
- **What:** `textPlate` draws on a 256 px canvas, puts each `\n` line on one row, and shrinks the font until the widest
  line fits. A 50–80 character line ends up at about 5–7 px of canvas, which is a grey smear even from 2 m
  (`shots/G6/sign-pickers`: the PICKERS sign read from beside it).
- **Where:**
  - Vineyard and manor (`country/trellisLife.ts` SIGNS):
    - "PICKERS: ONE GRAPE FOR THE BASKET, NONE FOR THE MOUTH"
    - "THE FIRST VINE: DO NOT TOUCH, PRUNE, ADMIRE OR LEAN"
    - "DELIVERIES: ROUND THE BACK. EVERYONE: ROUND THE BACK"
    - "HOA PAMPHLETS: TAKE ONE. THE HOA THANKS YOU."
  - Wader's Rest: the HOA permit "NOTICE: ORNAMENTS OVER 2 M REQUIRE A PERMIT (HOA 9-f)" (`shots/G6/waders-gate`, left sign).
  - Hedgeworth: "NON-MEMBERS: PLEASE USE THE OTHER SIDE OF THE FENCE".
  - Espalier End notice board: three long lines on a 1.3 m plate (`living/hamletEspalier.ts:185`).
  - Moleman's burrow: "PLEASE DO NOT SAY 'MOWER' AND 'KICK DRUM' IN THE SAME BREATH. SAY 'SEAT'."
    (`societies/loamdeep/moleman.ts:80`).
- **Why it matters:** Signage with jokes is acceptance criterion (b), and it is where most of this region's humour
  lives. Right now the best lines are invisible.
- **Proposed fix:**
  - In `homes/pieces.ts` `textPlate`, word-wrap each line to the plate's aspect before sizing, raise the canvas to 512
    (1024 for plates over 1.5 m wide), and set a minimum font size.
  - Add a test that fails when any plate's computed font is below the minimum.
  - Then sweep every caller in the group for plates that need more height.
- **Severity:** blocker · **Type:** craft

**3. Speech bubbles fill the whole screen when the camera is inside the Flock's ring.**
- **What:** Ambient bubbles are world sprites at a fixed 3.4 x 1.18 m, drawn with `depthTest: false` and render order 20.
  At Wader's Rest, the five ring members stand 6 m round the circle centre. Stand in the circle (which is exactly what
  the sermon hold and m25/m51 ask you to do) and the camera passes through a bubble. The screen turns into a giant
  blurred "...lamingo. I was t... did not look at m..." over a dark slab (`shots/G6/waders-circle`).
- **Where:** `ambientGnomes.ts:382` (`makeBubbleSprite`, used by every ambient gnome), `societies/flock/life.ts`
  RING_FIVE (Sister Spoonbill at angle 0 sits on the south approach).
- **Why it matters:** It is a full-screen glitch at the centre of two story quests and a side quest. It will also
  happen anywhere ambient gnomes stand close together.
- **Proposed fix:**
  - Fade and hide a bubble when the camera is within about 3 m of it, or clamp its screen size: scale by camera
    distance with a maximum.
  - Show at most one or two bubbles at a time in a crowd (the nearest one the player faces).
  - Move Spoonbill off the south entry line.
- **Severity:** blocker · **Type:** craft

**4. "Round the back" leads to a blank wall: Brassknock Manor has no back door, and no back at all.**
- **What:**
  - Three signs and Footman Pell tell visitors to go round the back, and the interior is entered by "the BACK door"
    (`country/manorInterior.ts:45`, door spot (-1150, 41.5), prompt "Go in round the back"). But the
    `brassknock-manor` prefab has no door, windows or terrace on its back. Its parts are front door, front windows
    and side windows only (`packages/prefabs/src/catalog/gta-country-manor.ts`).
  - The south facade is a 46 m blank stucco slab facing the formal gardens (`shots/G6/manor-back`). The prompt
    floats over plain wall.
- **Where:** (-1150, 40), the gardens side.
- **Why it matters:**
  - It is the payoff of the manor's running joke, and of the only way in.
  - The gardens (parterres, topiary, croquet, tea for two) are the manor's best storytelling, and they all face a
    wall with no features.
  - A visible blank back reads as "unfinished" more than anything else in the region.
- **Proposed fix:**
  - Add a back facade to the prefab, mirroring the front windows (both rows): a modest servants' door with a step,
    a boot scraper and a bell pull, and a small "TRADESMEN · VISITORS · EVERYONE" plate.
  - Add a gravel apron that meets `manor-path-back`.
  - Optionally add a lean-to or glasshouse on one end, so the back looks lived in and less formal than the front.
- **Severity:** blocker · **Type:** craft

### Polish

**5. Hedgeworth's rough is covered in identical mud mounds with bulrushes.**
- **What:**
  - `golf/yard.ts:254` fills 38 % of the rough band (and the ring round every green) with `reed-bed`, a marsh
    prefab with a big brown soil base.
  - Hosepipe Pond's ring and the Drip add more (`golf/greens.ts:242`).
  - The result is hundreds of raised brown ovals with cattails across a manicured course (`shots/G6/turn`,
    `drip-sign`, `shed`, `firsttee`). The gnome stands waist-deep in one at Thrift's shed (`shots/G6/shed`).
- **Where:** whole course, worst round holes 4–6 and the Turn.
- **Why it matters:** The lore says "tall grass", and this reads as bog. It is the most repeated prop in the region,
  and the mud bases look like terrain holes from a distance.
- **Proposed fix:**
  - Use `reed-bed` only on pond and Drip margins (where it belongs).
  - Fill the rough with base-less grasses (`ornamental-grass`, `giant-grass-blade`, a seed-head grass) in two or
    three heights.
  - Vary the density: thicker away from the fairway.
- **Severity:** polish · **Type:** craft

**6. Tee boxes and tee markers look placeholder.**
- **What:**
  - Every tee is a flat, unlit, saturated lime square with hard edges.
  - The two tee markers are blue spheres about the size of the gnome's head (`shots/G6/maze`, `drip`,
    E32 `hole5`, `hole7-round`).
  - On hole 7 the lime square sits on the shed roof like a sticker.
- **Where:** `golf/greens.ts` (tee decal, `tee-marker` placements).
- **Why it matters:** The tee is the first thing a golfer looks at, on every hole, and it is the least crafted surface
  on the course.
- **Proposed fix:**
  - Make tees a slightly raised, mown-striped rectangle with a darker fringe and soft corners, coloured like the
    fairway stripes but lighter.
  - Scale the markers to about 0.35, or give each hole its own marker (acorns, thimbles, a pair of snail shells on
    the Drip): a cheap place for jokes.
  - Add a small ball washer or tee bench by some tees.
- **Severity:** polish · **Type:** craft

**7. The course is flat and the giant plants are thin.**
- **What:**
  - Fairways are flat stripes on flat ground, and greens are flat discs. In `shots/G6/rhubarb` and
    `clubhouse-front` the course is a striped lawn to the horizon.
  - 110 "giant plants" are spread over a 300 x 560 m yard. The low hedges (1.2 m after E32) don't break up the views.
- **Where:** `golf/yard.ts` (giants loop), `golf/course.ts`.
- **Why it matters:** Lore promises "big hedges, tall grass, giant plants". The neighbour's garden should feel taller
  and wilder than Turfton (it is "over the fence"). The holes all look alike between the set-piece greens.
- **Proposed fix:**
  - Add gentle mounding along fairway edges and behind greens (a visual-only height offset where the ball does not
    roll, or a small `courseGroundY` tweak with tests).
  - Group the giant plants into a few big stands per hole (hostas round a green, a foxglove spinney at a dogleg)
    instead of a thin, even scatter.
  - Raise some of the perimeter hedges to 3–4 m.
- **Severity:** polish · **Type:** craft

**8. Wader's Rest is not reedy, and the gate stands in an open field.**
- **What:**
  - Lore: "a reedy camp… on a firm gravel spit… the reeds there are tall… the only dry patch for a mile".
  - In the game:
    - The site is ordinary mown lawn.
    - 150 reed and bulrush clumps are spread over 180 x 180 m. The "dense band" along the west and south edges
      works out to one clump per ~5 m.
    - The gate is two banner poles and two signs in open grass, with no fence, path or reeds to pass through,
      40 m from the camp (`shots/G6/waders-gate`).
- **Where:** `societies/flock/build.ts:112`; WADERS_REST site (-1220..-1040, -730..-550).
- **Why it matters:** The camp has no edge or sense of arrival. The Flock's whole look (grey on grey, the one pink
  flamingo) needs a green-brown reed wall to stand against.
- **Proposed fix:**
  - Ring the site with a real reed wall (3–5 deep, 1.5–2.5 m tall) broken only at the gate.
  - Run a gravel path (a pale decal in its own draw layer) from the gate through the reeds to the circle.
  - Lay a pale gravel paint under the camp itself (the "spit"), plus a couple of shallow pools with lily pads in the
    reed margin.
  - Add a low reed fence and a "PLEASE STAND ON ONE LEG" bell or rope at the gate.
- **Severity:** polish · **Type:** craft

**9. Oldroot Wood is not a wood, and the Wood Hide looks at nothing.**
- **What:**
  - 34 trees are spread over 220 x 300 m (x -1780..-1560, z -1710..-1410), about one tree per 1,900 m².
  - The Wood Hide at (-1700, -1330) "looks north into Oldroot Wood", but the wood's south edge is 80 m away, so the
    hide's window looks onto open meadow (`shots/G6/wood`).
- **Where:** `unmown/vignettes.ts:124`, `living/config.ts:60`.
- **Why it matters:** Lore: "big trunks, logs, moss and ferns… the Unmown's quietest corner". The checklist sends
  players to find a hedgehog and a woodpecker "at the edge of Oldroot Wood". A hide that frames empty grass is the
  opposite of a reward.
- **Proposed fix:**
  - Pull the wood's south edge to about z -1360.
  - Triple the trunk count, with clearings.
  - Add undergrowth (fern, bramble, fallen logs) between the trunks.
  - Keep one sightline from the hide to a clearing with the fairy ring, so the hide frames the Unmown's cutest vignette.
- **Severity:** polish · **Type:** craft

**10. Reedmere Hide is 55 m from the water.**
- **What:** The hide at (-1050, -1550) "looks south over the marsh". The water starts at z -1605, so the window frames
  a trail and lawn (`shots/G6/reedmere-hide`). The marsh itself is a flat water plane with sparse reeds
  (`shots/G6/boardwalk`).
- **Where:** `living/config.ts` UNMOWN_HIDES, `unmown/marsh.ts`.
- **Proposed fix:**
  - Move the hide to the shore (z about -1598), or extend the reed beds and shallow water north to it.
  - Densify the reeds round the water's edge.
  - Add a few lily pads and a heron.
- **Severity:** polish · **Type:** craft

**11. The Unmown's trails have stair-stepped edges.**
- **What:** The trail dirt is painted on the terrain grid, so every diagonal trail shows square 90° steps several
  metres across (`shots/G6/reedmere-hide`).
- **Where:** The Unmown loop and the Reedmere trail (`unmown/trails.ts` lines painted into the surface map).
- **Why it matters:** It is the most visible "computer-made" tell in a place meant to look untouched.
- **Proposed fix:**
  - Draw trails as a soft-edged ribbon decal along the polyline (like the roads) in `LAYER.road`, or smooth the
    paint mask.
  - Add worn grass edges.
- **Severity:** polish · **Type:** craft

**12. The vineyard gate opens onto 50 m of empty lawn, along a 12 m dirt slab.**
- **What:**
  - The gate arch is at z -61, but the first vine row is at z -112.
  - The "path up the middle" is a 12 m wide brown sheet (x -1146..-1134) that starts at the arch and climbs bare
    grass (`shots/G6/vine-gate`, `vine-rows`).
  - Lore promises "terraced slopes, stone walls". There are none, and the hill reads as an even slope.
- **Where:** `country/types.ts` VINEYARD (rows.maxZ -112, path), `country/vineyard.ts:132`.
- **Why it matters:** The gate frames nothing. It is the vineyard's postcard view, and right now it is a road into
  a field.
- **Proposed fix:**
  - Start the rows about 8 m inside the gate (rows.maxZ to about -70, keeping Chicory's lodge and the press-house
    clear).
  - Narrow the path to 3–4 m of pale gravel with grass verges.
  - Add two or three dry-stone terrace walls across the hill (`drystone-wall` exists) with the rows stepping between
    them.
  - Fill row-end gaps with posts, baskets and frost-pots.
  - The known "vines thin from afar" issue would also benefit from a denser canopy LOD.
- **Severity:** polish · **Type:** craft

**13. Text plates float off their boards and posts.**
- **What:**
  - Vineyard and manor signs are put 0.3 m in front of a `signpost` at 1.35 m, so the yellow plate hovers beside
    the post's own arm (`shots/G6/sign-pickers`).
  - On the golf `garden-sign`s the plate sits 1.4 m up, above the board, so from behind you see an empty board with
    a ghost frame hovering over it (`shots/G6/drip-sign`).
- **Where:** `country/trellisLife.ts:116` (PLATE_OFF), `golf/bottomGarden.ts:104` (`sign()`), and similar helpers.
- **Proposed fix:**
  - Read the board's face height and offset from `prefabBox` and seat the plate on it.
  - Give plates a back (a wood-coloured backing box), so the reverse side isn't empty.
- **Severity:** polish · **Type:** craft

**14. DJ Moleman's burrow is a big, empty square, and the star mole is hard to see.**
- **What:**
  - Lore: "a snug round room… decks against the north wall". The game has an 18 x 14 m square brown box with a
    small desk far away, two speakers and a floor-to-ceiling black pole (the "NOT THE TRANSMITTER" joke, which
    reads as a render glitch because its sign is too small).
  - DJ Moleman (0.8 m) is a dim silhouette behind the desk (`shots/G6/int-moleman-burrow`).
- **Where:** `societies/loamdeep/moleman.ts` (size, layout).
- **Why it matters:** The brief asks for the moles to be cute and misunderstood, and this is the mole the whole radio
  station is about. He should be the warmest, cosiest reveal in the game.
- **Proposed fix:**
  - Shrink the room to about 8 m and make it round, with curved wall segments or a ring of earth posts.
  - Bring the decks and DJ Moleman to the middle of the north wall under a warm lamp.
  - Fill the walls with stacked records, a kettle, a supper plate under a cloche (his family's kept supper, a cute
    echo of Loamdeep), cables running into the ceiling and a hat stand with no hats.
  - Make the pole a thin root with a big sign.
- **Severity:** polish · **Type:** spirit (moles cute and misunderstood)

**15. Loamdeep's entry tunnel is a flat-walled corridor under a black void.**
- **What:** The tunnel is two vertical brown planes with no ceiling in view: black above the walls, and gaps where
  you see over a wall into the next hall (`shots/G6/int-loamdeep`; E17's `interior-loamdeep` too).
- **Where:** `societies/loamdeep/interior.ts`, `hallsEast.ts`, `hallsWest.ts` (wall heights, ceiling).
- **Why it matters:** Lore: "warm, tidy… ceilings low for a gnome and just right for a mole". The first impression of
  the moles' town is a cardboard maze.
- **Proposed fix:**
  - Add a visible low ceiling (warm earth colour, roots hanging) and make the walls meet it.
  - Arch the tunnel with timber props every few metres.
  - Use more `mole-lamp-lit` with warm pools of light.
  - Lay a woven runner on the floor.
- **Severity:** polish · **Type:** craft

**16. The Flock's "Big Tent" is a plain rectangular room.**
- **What:** Inside, it is flat walls, a flat ceiling, eight grey floor mats and one shelf (`shots/G6/int-flock-tent`).
  Nothing says "tent", and there is no pink anywhere (the Lady's colour).
- **Where:** `societies/flock/tent.ts`.
- **Proposed fix:**
  - Add a centre pole and sloping canvas panels (angled blocks) from the pole to the walls, plus guy-rope shadows.
  - Add a pink ribbon shrine facing west (lore: she faces west), a stack of tea cups and the "owed cups" tally board.
  - Put reed mats instead of grey squares.
- **Severity:** polish · **Type:** craft

**17. Brassknock's tasting hall is sparse and murky.**
- **What:** A 26 x 16 m hall holds one rug, one table, two urns, one bookcase, two fireplaces and three bare window
  holes. The cream walls and ceiling of `HALL_THEME` render as brown-grey (`shots/G6/int-brassknock-manor`).
- **Where:** `country/manorInterior.ts`.
- **Why it matters:** This is the inside of Turfton's oldest money and the set of m50 "Trellisdown Tasting". It
  should look expensive and slightly faded.
- **Proposed fix:**
  - Brighten the light.
  - Add window frames and curtains, a chandelier, a long table laid with thimble glasses and grape-dew bottles, and
    a barrel rack.
  - Put up the promised portraits large enough to read.
  - Add dust sheets over a few chairs (most rooms are shut).
- **Severity:** polish · **Type:** craft

**18. Interiors show the sky or a black void above (camera clears low ceilings).**
- **What:**
  - In the Unmown Ranger Station (h 3.2 m) the top of the frame is open sky (`shots/G6/int-unmown-ranger-station`).
  - The clubhouse and Loamdeep show black where a ceiling should be.
- **Where:** `unmown/station.ts:29`, `golf/clubhouse.ts`, the Loamdeep halls; interior camera (shared, G1/G9).
- **Proposed fix:**
  - Pull the camera in under the ceiling inside short rooms (clamp camera height to the ceiling minus 0.3), or
    raise those rooms to at least 4 m.
  - Make ceilings double-sided.
- **Severity:** polish · **Type:** craft

**19. The clubhouse's "golf umbrella drying by the door" is a huge red-and-white café parasol.**
- **What:** `glaze-canopy-umbrella` at size 1.2 with a blue tint (0x2e4a7a) renders untinted (red/white) and gnome
  height, right at the entrance, blocking the view in (`shots/G6/int-hedgeworth-clubhouse`).
- **Where:** `golf/clubhouse.ts:210`.
- **Proposed fix:**
  - Use a golf-umbrella prefab (or add one: a smaller dome, a straight shaft and a hook handle), lying half-open on
    its side at about 0.6.
  - Check why the tint isn't applied.
- **Severity:** polish · **Type:** craft

**20. Espalier End falls short of its lore and reads as a ring of tombstones.**
- **What:**
  - Lore: twelve houses, "a very long hedge", "more pear trees than gnomes", a pear stand by the pump, and hedges
    kept "a little untidy to show they chose to".
  - Code: 10 houses, one hedgerow piece, 4 espalier pears, no pear stand.
  - Every house has the same identical clipped topiary pair and a grey plinth planter, set on a perfect circle. From
    the green the plinths line up like headstones (`shots/G6/espalier-2`).
  - The `thatched-cottage` roof reads as an upturned boat on a box (`espalier-1`, `espalier-2`).
- **Where:** `living/hamletEspalier.ts` (HOUSE_COUNT, planEspalierEnd).
- **Why it matters:** The village's joke (Judge Quince "deducts points for symmetry, symmetry is for the HOA") is
  undercut by the most symmetric layout in the game.
- **Proposed fix:**
  - Twelve houses, not on a perfect ring (jitter radius and angle), each with a different, slightly lopsided topiary
    entry.
  - A long, wobbly hedge along the road, with the No. 3 / No. 4 hedge visibly two heights.
  - Pear trees in every garden, plus pears "in transit" at the road edge.
  - A pear stand with a pear-shaped honesty box by the pump.
  - Check the thatched cottage's roof proportions.
- **Severity:** polish · **Type:** spirit (the joke is in the layout)

**21. The Burrow Door's porch is a box stuck on a blob.**
- **What:** The door frame is a square timber box that sticks out of the side of a smooth, low-poly dome. Its side faces
  show, and nothing (grass, stones, roots) blends the joint. The mound itself is a bare green dome on a flat lawn
  (`shots/G6/burrow`, `burrow-close`).
- **Where:** `societies/loamdeep/surface.ts`, BURROW door (-993.5, 300).
- **Proposed fix:**
  - Sink the porch into the mound (or add earth cheeks either side), and ring the door with stones and roots.
  - Add tufts and flowers on the dome, a tiny mole-height letterbox, a boot scraper and molehills trailing off
    toward the golf course (the "mole by the ninth green" thread).
- **Severity:** polish · **Type:** craft

**22. The open country between the west set pieces is empty, flat, mown lawn.**
- **What:** The gaps between the vineyard, the manor, Wader's Rest, the deer, the hunter camps and the Unmown are
  hundreds of metres of identical striped lawn, with the board fence at the edge (`shots/G6/vine-far`, `deer`,
  `camp-tent`, `waders-gate`).
- **Where:** Trellisdown and the west fringe, x -1400..-950.
- **Why it matters:** The user's goal is "hand crafted". The wild should get wilder the further west you go, and today
  the opposite happens.
- **Proposed fix:**
  - Add a west-of-Trellisdown dressing pass: hedgerows and dry-stone field walls following the land, copses,
    a few stiles and field gates, unmown field margins, a lone oak with a bench, and a pond for the deer.
  - Put the hunter camps in copses or hedge corners, not on open lawn.
  - Fade the mow stripes out west of x -1000.
- **Severity:** polish · **Type:** spirit (sense of place)

**23. Windfall Croft is not run-down.**
- **What:** Lore: "a small, run-down croft… an orchard whose fruit keeps falling over the wall". The unbought croft
  has crisp mown stripes, eight neat empty beds and a post-and-rail fence instead of a wall
  (`shots/G6/croft-beds`, `croft-orchard`).
- **Where:** `country/croft.ts`.
- **Why it matters:** It weakens the "buy a wreck and fix it up" arc. The croft should visibly improve once you own it
  and farm it.
- **Proposed fix:**
  - Before purchase: weeds in the beds, long grass inside the fence, a sagging gate and a broken pane in the
    farmhouse.
  - After purchase (farm state): tidy them away.
  - Make the orchard's south boundary a low stone wall, so the windfalls go over a wall.
- **Severity:** polish · **Type:** craft

**24. Hole 6's water carry ("The Drip") can't be seen from its tee.**
- **What:** From the 6th tee you see the giant birdbath standing on grass and a field of reed mounds. The Drip's water
  is a flat decal at ground level, hidden behind the rough's `reed-bed` mounds and its own ring of reeds every 6 m
  (`shots/G6/golf6`; E32's own `hole6` shows the same).
- **Where:** `golf/greens.ts:231-243` (pond disc and reed ring), `golf/yard.ts` grass band; hole 6 tee (-1282, 932).
- **Why it matters:** A par 3 whose whole idea is "carry the water" has to show the water. Players will find it with
  a splash, which feels unfair.
- **Proposed fix:**
  - Keep the line from the tee to the green clear of reeds.
  - Put reeds only on the far and side banks.
  - Sink the water about 0.3 m into a visible bank (edge ring in `LAYER.decal`) with a lighter, glinting surface.
  - Add the leaking hosepipe's ripples so it reads at a glance.
  - Check hole 1's Hosepipe Pond the same way.
- **Severity:** polish · **Type:** craft

**25. On a phone, the golf strip and the Card/Quit buttons sit across the line of play.**
- **What:** At 390 x 844 in portrait, the hole strip (top 250 px) and Card/Quit (top 352 px) sit exactly where the
  fairway meets the horizon, which is where the pin is. The low camera puts the lime tee box in the lower half, so
  the hole itself is a thin band behind the HUD (`shots/G6/golf1-phone`).
- On hole 5 the strip's club line is cut off ("Pitching Wedge 102 yd · Tee · 214 yd to"), and the gnome stands inside
  a tee-marker ball (`shots/G6/golf5-phone`).
- **Where:** `golf/hud.ts:192-213` (`placeTop`).
- **Proposed fix:**
  - In portrait, dock the strip as a compact two-line bar under the top HUD row, or move it to the bottom above the
    swing buttons.
  - Move Card/Quit into the Gnomlet row or to the bottom corners.
  - Raise the tee camera a little in portrait so the green shows above the HUD.
  - Wrap the strip's lines, or shorten them ("PW 102 · 214 to pin").
  - Keep the address spot clear of the markers.
- **Severity:** polish · **Type:** craft

### Nits

**26. Turfton's skyline shows as ghostly see-through towers from Windfall Croft.**
- **What:** From the croft (and the Cloverfield fields) a row of pale blue, semi-transparent tower silhouettes hangs
  in the sky over the farm (`shots/G6/croft-orchard`, `croft-phone`).
- **Where:** far-distance fog and the skyline (shared, G1/G9).
- **Proposed fix:** Either fade them fully into fog, or keep them opaque with atmospheric tint. Half-transparent
  reads as a rendering bug.
- **Severity:** nit · **Type:** craft

**27. Names are reused across the region.**
- **What:**
  - Teasel's Tent (hunter camp) vs Teasel Gimbal (Underspan welder), plus a Teasel on the court and a Teasel in
    traffic.
  - Old Burdock's Shack vs Burdock Flywheel (Underspan) vs Burdock Haybright (Unmown).
  - Chicory Snips vs Chicory Waymark vs Chicory Sprocket.
  - Two camps both called "Cutback Hide…" (`camp-north-2`, `camp-north-3`).
- **Where:** `country/camps.ts`, `societies/config.ts`, lore entries.
- **Proposed fix:** Rename the hunter camps' owners to fresh plant names (lore check), and rename `camp-north-2`.
- **Severity:** nit · **Type:** craft

**28. Deer are gnome-sized.**
- **What:** The red deer stand about 1.5x gnome height (`shots/G6/deer`). Canon 1, "the world is a garden seen from
  gnome height", suggests a real deer would be a towering giant next to a garden gnome.
- **Why it matters:** It's a missed wonder moment. A 6 m stag lifting its head over the hedge would be unforgettable.
  But it also changes hunting balance and herd collision.
- **Proposed fix:** A decider question: keep them as is (the game already treats them as game animals), or scale the
  ambient herds (not the quarry) up 3–4x as "the Tall Ones' deer".
- **Severity:** nit · **Type:** spirit

**29. Blustery weather particles are flat untextured squares.**
- **What:** The blowing "debris" shows as pale, flat squares up to 30 px across in every outdoor shot
  (e.g. `shots/G6/station`, `camp-tent`).
- **Where:** weather (G9's area, seen throughout G6).
- **Proposed fix:** A leaf or petal texture with a soft alpha, smaller and tumbling.
- **Severity:** nit · **Type:** craft

**30. The interior minimap still shows the surface.**
- **What:** Inside Loamdeep, the burrow, the tent and the halls, the minimap shows the lawn outside
  (`shots/G6/int-loamdeep`).
- **Where:** shared HUD (G9).
- **Proposed fix:** Hide the minimap, or show a simple room plan, while inside an interior.
- **Severity:** nit · **Type:** craft

## Counts

| Severity | Craft | Spirit | Total |
|---|---|---|---|
| Blocker | 4 (1, 2, 3, 4) | 0 | 4 |
| Polish | 18 (5–13, 15–19, 21, 23–25) | 3 (14, 20, 22) | 21 |
| Nit | 4 (26, 27, 29, 30) | 1 (28) | 5 |
| **Total** | 26 | 4 | 30 |

Spirit findings for the decider: 14 (the Moleman burrow as the cute reveal), 20 (Espalier End's layout carrying the
symmetry joke), 22 (the west should get wilder going west) and 28 (giant deer). Findings 18, 26, 29 and 30 touch
shared code that other groups own (interior camera, fog and skyline, weather, minimap); they are listed here because
they are visible across G6.

## What works (keep it)

- The writing: the Flock's bubbles and sermons, the mole notices ("Kind regards."), the hole names and tee jokes, the
  vineyard's and manor's sign lines (once readable), Espalier End's notice board, and the Unmown's "CONFISCATED
  MOWERS".
- The red deer herds: they graze and read well, and they are well placed near Wader's Rest.
- Hedgeworth's maze arch, the potting-shed tee with its ladder and sign, the birdbath on the Drip, and the
  clubhouse terrace with its planters.
- The manor's front: the seven chimneys, the gate, the brass name plate and the fountain.
- The Reedmere boardwalk: it is well built, with rails and steps.

## Not checked

- Touch play of a full round, the Loamdeep sorting and dig overlays, and the sermon hold on a real phone. Headless Edge
  shows no touch controls until touch is used, so on-screen button placement was judged from `golf/hud.ts`.
- Night and frost views (the frost-pots, the night watchman and the hunters asleep), and audio.
- Quests m25, m47–m51 and m60 played through. G10–G12 own the story; I only looked at their places.
