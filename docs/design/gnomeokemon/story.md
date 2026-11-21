# Gnomokemon Snap: Story & Safari Progression

**Status: draft proposal.** Defines the narrative premise, 7-chapter story arc, point-based course unlock thresholds, Lab ranks, and Page #036 finale for [Gnomokemon Snap](../../../games/gnomeokemon) (`games/gnomeokemon`).

Grounded in [origin.md](origin.md), [regions.md](regions.md), [temperaments.md](temperaments.md), [core canon](../../lore/canon.md), and rulings [R-019](../../lore/rulings.md#r-019), [R-020](../../lore/rulings.md#r-020), and [R-030 to R-032](../../lore/rulings.md#r-030). Obeys all Snap ground rules: no date on the season, no Tall One sightings, no Gnomomia plot reveals (the Kiln stays cold, the Shed stays barred, the Mower never moves, the Backflow stays unvisited), and loose threads stay loose.

---

## 1. Premise & Characters

### The Fescue Field Lab & the Eye-Box

Where the walled back garden of **Fescue** meets the gnome-scale town road of **the Yard**, a two-storey red-roofed house with gold trim stands on prime lawn (R-019, R-020). This is the **Fescue Field Lab**.

For centuries, the Crown's *Ledger of Beasts and Burdens* filed garden creatures as pests and paid bounties by the tail and shell. Around thirty years ago, after the First Rumble, a wealthy, bearded archivist bought this lot outright in clay — glasshouse, potting bench, and all — and started doing the opposite. Instead of chasing creatures off the lawn, he drew them and wrote down what each one *wanted*. He called them **Gnomokemon**.

In a drawer of the Glasshouse's potting bench, he found the one Tall One object the Lab has ever worked out: the **Eye-Box**, a camera loaded with 24-frame rolls of film. You cannot glaze a mole or keep a moth in a jar, but a leftover thing that is *seen properly* settles into its pose. Photographs are the one gift Fescue can still give them.

There is one quiet catch the Lab never prints on its flyers: **nobody in Fescue knows how to make more film.** Every ride spends a roll that cannot be replaced. That is why the Safari Map Table does not open all seven routes at once. Until your photographs earn enough points to prove you have the Eye, the archivist will not hand you rare film for the deep pipes, the Stopping Road, or his own back garden.

### Cast

| Character | Role | Grounded Truth |
|---|---|---|
| **The Player Gnome** | Field Photographer | Your own gnome from the Gnome Creator (core canon rule 7), hired at the Lab as a Porch Intern. You never walk the rail yourself: you stand on the shoulders of the Lab's quiet, unnamed carrier gnome inside a garden-glove saddle strapped to Tag (R-019). |
| **Tag** | The Ride | A huge, patient town-side dog from the Yard (R-012, R-030), named for the cart-wheel collar tag nobody can read. Between rides he sleeps on the Lobby rug facing the front door. His habitual walk is the rail; wild creatures know his smell and treat him like weather; his tail sets the beat when the Gnome Flute plays. How his walk crosses between the town road and walled Fescue is never asked and never explained. |
| **Gnome Jesus (Hyssop)** | Lab Owner, Grader & Gnomokedex #036 | Given name **Hyssop** (nobody uses it). "Gnome Jesus" is the street name for his white robe, beard, and halo. He is not a god and takes no tithes; he is a dry, warm, wealthy, mildly vain archivist who grades every roll on the Scale of the Lawn — Size, Framing, Pose, and vibes. |

### The Secret of Blank Page #036

Every page in the Gnomokedex has a photograph — or a space waiting for one — except **Page #036**, which belongs to Hyssop himself. He has graded ten thousand snapshots over thirty years and never trusted a photographer to take an honest picture of *him*.

He keeps his own **Glasshouse** locked until a photographer proves themselves across Fescue and the Yard. Inside, propped on the potting bench facing the door, sits an empty Tall One's picture frame he never mentions. Every midnight he stands at the end of the Glasshouse loop, facing straight toward the lens, pretending to inspect the mist. He knows the *Pose* score rewards looking at the camera. He is terrified of Bronze.

---

## 2. Scoring Math & Unlock Thresholds

### How Total Points Work

In `games/gnomeokemon/src/screens/lobby.ts`, a player's **Total Points** (`total`) is the sum of their **single best photo score** across every photographed species (`Object.values(best).reduce((sum, p) => sum + p.score.total, 0)`).

From `games/gnomeokemon/src/snap/scoring.ts`, each photograph scores up to **4,500 pts**:
- **Size** (`0–1,000`): viewport coverage, sweet spot around 28–55%.
- **Framing** (`0–1,000`): closeness to dead center, minus `-220` if clipped at the edge.
- **Pose** (`0–1,000`): facing the camera (`0–750`) plus action state (`140` idle, `250` active).
- **Special** (`0–1,500`): Snack Time (`+600`), Flute Dance (`+650`), Startled (`+700`), Group Shot (`+350` for 2, up to `+600` for 3+), Bullseye Framing (`+200` when Size and Framing are both `>= 850`).

Grade bands (`gradeFromTotal`):
- **Bronze**: `< 1,700` (typical casual/distant shot: **~1,300**)
- **Silver**: `1,700–2,599` (solid everyday snap: **~2,100** average)
- **Gold**: `2,600–3,399` (close, well-framed, or tool-assisted shot: **~2,900** average)
- **Divine**: `>= 3,400` (centred, facing, active/group/bullseye: **~3,600+** average)

### Species Pool & Unlock Curve

Using the exact spawn lists in `games/gnomeokemon/src/snap/world.ts` (`getCourseSpawns`) in `COURSE_ORDER`:

| Ch. | `CourseId` | Course Name | Unlock Pts | New / Total Species in Course | Pool Available Before Unlock | Silver Pool (`avail × 2,100`) | Gold Pool (`avail × 2,900`) | Typical Unlock Pace |
|---|---|---|---:|---:|---:|---:|---:|---|
| 1 | `lawn` | Fescue Lawn | **0** | 17 / 17 | — | — | — | Unlocked from start |
| 2 | `desert` | Dry Yard | **10,000** | +4 / 4 | 17 | 35,700 *(28%)* | 49,300 *(20%)* | ~5 Silvers or ~7 Bronzes (1–2 Lawn rides) |
| 3 | `depths` | Drainpipe Deeps | **20,000** | +2 / 5 | 21 | 44,100 *(45%)* | 60,900 *(33%)* | ~10 Silvers or ~7 Golds (Dry Yard + a few Lawn finds) |
| 4 | `kiln` | The Stopping Road | **30,000** | +2 / 7 | 23 | 48,300 *(62%)* | 66,700 *(45%)* | ~14–15 Silvers or ~11 Golds (Deeps' 2 new + upgraded returns) |
| 5 | `ocean` | Cistern Reef | **40,000** | +5 / 6 | 25 | 52,500 *(76%)* | 72,500 *(55%)* | ~19 Silvers or ~14 Golds (Stopping Road's 2 new + easier boss shots) |
| 6 | `night` | The Glasshouse | **52,000** | +6 / 7 | 30 | 63,000 *(83%)* | 87,000 *(60%)* | ~25 Silvers or ~18 Golds (Cistern's 5 new species ≈ +10–14k in 1 ride) |
| 7 | `frost` | The Rime | **65,000** | +6 / 6 | 36 | 75,600 *(86%)* | 104,400 *(62%)* | ~31 Silvers or ~23 Golds (Glasshouse's 6 new species ≈ +13–17k in 1 ride) |
| ★ | *Finale* | Season Complete | **80,000** | *(all 42)* | 42 | 88,200 *(91%)* | 121,800 *(66%)* | ~38 Silvers or ~28 Golds (Rime's 6 new species ≈ +13–17k in 1 ride) |

**Why these numbers work:**
- **Fast first hook:** `10,000 pts` opens the Dry Yard after a single decent Lawn ride (or two casual ones).
- **Respects small-delta courses:** `depths` and `kiln` each add only 2 brand-new species (`rustcrab`/`clogmaw` and `glowmoth`/`kilnwarden`), though both also offer much closer, clearer angles on returning Lawn species (`dewdrop`, `hoseleech`, `unfired`, `kilnpup`, `strawight`, `grubthorn`, `minimower`). Keeping those steps at `+10,000` means one clean run plus 1–2 score upgrades always pushes you through.
- **No grind wall:** Every unlock stays at or below 86% of an all-Silver pool — a casual player who never chases Divines can unlock all seven courses naturally, while a skilled player using Bait, Pester, and the Flute sails through on Golds with room to spare.

---

## 3. The 7-Chapter Story Arc

### Chapter 1 — `lawn`: Fescue Lawn — *"The Morning Round"*
- **Unlock Threshold:** `0 pts` *(Unlocked at start)*
- **Species:** 17 total (`17 new`: Sproutling, Mossback, Staghorn, Thimblekin, Dewdrop, Hoseleech, Strawight, Paperwasp, Kilnpup, Unfired, Grubthorn, Minimower, Magpie Thief, Hedgewright, Acorn Drake, Bell Rat, Gnome Spirit)
- **Story Beat:** Your trial roll. Tag walks his bright morning ribbon from Mossbottom Vale past Puddlemere, the Hose, the Spinning Fountains, Cloverfield's edge, and the Rockery up to the Verge. Hyssop says it is a routine census of the garden; in truth, he is checking whether you point the Eye-Box at living things instead of grass and your own thumb. Along both edges of the trail, fresh molehills run south while Tag walks north — Grubthorn's clan is on the move, and the Lawn is busier than usual.
- **Opening Line (Gnome Jesus, Day 1):**
  > "Here is the Eye-Box. Twenty-four frames, and no, we cannot buy more at the corner shop. Climb onto Tag, hold still, and bring me something better than your thumb."
- **Field Briefing (Safari Map Card):**
  > Tag's morning walk from Mossbottom Vale to the Verge. Toss Bait for the hungry ones, play the Flute to set Tag's tail wagging, and watch the far grass for bosses.

---

### Chapter 2 — `desert`: Dry Yard — *"Down the Town Road"*
- **Unlock Threshold:** `10,000 pts`
- **Species:** 4 total (`4 new`: Cactuskin, Armadillan, Sunlizard, Tumblewight; `21 cumulative`)
- **Story Beat:** You have proven you will not waste a whole roll on dandelion fuzz. Hyssop unpins a route outside Fescue altogether: west down the town road into the Yard's **Dry Yard**, where sun-baked gravel, stacked terracotta mesas, cacti, and a quiet stucco house with two worn hollows on its porch step bake under high noon. No Fescue species lives here, and Tag pauses to sniff another big dog's paw prints in the dust. Hyssop wants proof that his rule holds past the garden wall — even out in the dry, every creature walks for what it wants.
- **Unlock Announcement (Gnome Jesus):**
  > "Ten thousand points! You actually have an eye, not just a finger. I have unpinned the Dry Yard down the town road — take a hat with a brim, the sun is rude out there."
- **Locked Teaser (Map Card, `< 10,000 pts`):**
  > *Unlocks at 10,000 pts.* Hyssop's pin sits west of the Lab, out on the town road. "Prove you can frame a slug before I lend you film for the sun."
- **Field Briefing (Safari Map Card):**
  > High noon in the Yard's dry country — terracotta mesas, gravel flats, and a quiet porch step. Hold your aim steady for rolling Tumblewights and coax shy Armadillans out with Bait.

---

### Chapter 3 — `depths`: Drainpipe Deeps — *"Into the Gutters"*
- **Unlock Threshold:** `20,000 pts`
- **Species:** 5 total (`2 new`: Rustcrab, Clogmaw; `3 returning`: Dewdrop, Hoseleech, Unfired; `23 cumulative`)
- **Story Beat:** Back inside Fescue, and straight down beneath Birdbath Keep. Hyssop opens the **Gutters** wing of the Drainpipe Deeps — slick stone ledges, dripping downpipes chalked with Pipewright marks (`THATCHFORD`), glowing algae lamps, and rising water. Something enormous has wedged itself into the lower arches (**Clogmaw**), and metallic **Rustcrabs** have been clambering up from the flooded hall below. Hyssop reminds you strictly: we chart the Gutters, never the Backflow. Down in the damp, you also spot an Unfired shuffling doggedly toward the Rockery — a clay compass pointing to Chapter 4.
- **Unlock Announcement (Gnome Jesus):**
  > "Twenty thousand. Impressive. Wipe your lens and mind your boots — I am opening the Drainpipe Deeps beneath the Keep, and the pipes are leaking again."
- **Locked Teaser (Map Card, `< 20,000 pts`):**
  > *Unlocks at 20,000 pts.* A damp chalk mark under Birdbath Keep. "Film hates puddles. Earn the points first, then we risk the gutters."
- **Field Briefing (Safari Map Card):**
  > The wet Gutters beneath Birdbath Keep, lit by algae glow and leaking brass fittings. Catch Rustcrabs hoarding scrap and coax Clogmaw out of the pipe arches.

---

### Chapter 4 — `kiln`: The Stopping Road — *"Cold Brick, Warm Coals"*
- **Unlock Threshold:** `30,000 pts`
- **Species:** 7 total (`2 new`: Glowmoth, Kilnwarden; `5 returning`: Kilnpup, Unfired, Strawight, Grubthorn, Minimower; `25 cumulative`)
- **Story Beat:** Following the Unfired compass through the Rockery pass toward the Verge — the dusk-hushed processional road where Gnorwin once carried the Stopping Stone, lined with seven name-scratched waystones. The great **Kiln** stands cold; the warm amber glow inside comes only from the chest coals of the **Kilnwarden**, who still tests whoever approaches, and the **Glowmoths** circling it. At the end of the road stands the barred Shed door, Old Rumble's silhouette behind the crack, and a tiny **Minimower** humming faithfully outside. Hyssop's remarks turn noticeably sharper here: he is quietly testing whether you have the patience for Sentinel and Aloof subjects — because he is one himself.
- **Unlock Announcement (Gnome Jesus):**
  > "Thirty thousand points! The Scale actually hummed. Take Tag down the Stopping Road at dusk — and for clay's sake, do not throw a clod at the Kilnwarden."
- **Locked Teaser (Map Card, `< 30,000 pts`):**
  > *Unlocks at 30,000 pts.* Seven tiny stone pins leading from the Rockery to the Verge. "Dusk light and stern creatures. Not for interns."
- **Field Briefing (Safari Map Card):**
  > The dusk road from the cold Kiln past seven waystones to the barred Shed door. The Kilnwarden respects patience over Pester clods, and rare Verge creatures gather closer here.

---

### Chapter 5 — `ocean`: Cistern Reef — *"The Drowned Hall"*
- **Unlock Threshold:** `40,000 pts`
- **Species:** 6 total (`5 new`: Kelpsprite, Barnacle Knight, Cisterneel, Drowned Toad, Sea Mower; `1 returning`: Hoseleech; `30 cumulative`)
- **Story Beat:** Deeper beneath Birdbath Keep, below the Gutters, lies the **Cistern wing** — a calm, drowned hall of sunken Pipewright barracks, swaying water-weed, and a tin Watch Box whose last duty shift was never ticked off. A bright shaft of daylight falls straight down through the Birdbath Basin's drain above. Here the **Barnacle Knight** still guards the Old Pedestal, **Kelpsprites** drift through sunbeams, **Cisterneels** and the **Drowned Toad** hold the quiet ledges, and the **Sea Mower** patrols in a trail of bubbles. This is the Lab's hardest public expedition; once you bring back clean frames from the bottom of the Keep, Hyssop has no excuse left to keep his own back door locked.
- **Unlock Announcement (Gnome Jesus):**
  > "Forty thousand. Even I am running out of polite ways to look unimpressed. The Cistern Reef is open — tell the Barnacle Knight his shift ended three centuries ago."
- **Locked Teaser (Map Card, `< 40,000 pts`):**
  > *Unlocks at 40,000 pts.* A blue glass pin stuck deep under the Keep. "The drowned hall waits for a steady hand. Come back at forty thousand."
- **Field Briefing (Safari Map Card):**
  > The drowned Cistern hall below Birdbath Keep, where sunbeams drop from the Basin drain. Hold still for shy Cisterneels and watch the Old Pedestal for the rising Sea Mower.

---

### Chapter 6 — `night`: The Glasshouse — *"Page Thirty-Six"*
- **Unlock Threshold:** `52,000 pts`
- **Species:** 7 total (`6 new`: Mooncap, Starbeetle, Dewghost, Clockwork Frog, Bonsai Titan, Gnome Jesus; `1 returning`: Glowmoth; `36 cumulative`)
- **Story Beat:** Midnight. Hyssop unlocks the Lab's own glass back door and lets Tag loop into **the Glasshouse** — the Tall One's conservatory that came with the lot, where nothing has ever been pruned, where the Eye-Box and its film rolls sleep in the potting-bench drawer, and where Hyssop's tea is perpetually cold. **Mooncaps**, **Starbeetles**, **Dewghosts**, the wind-up **Clockwork Frog**, and the **Bonsai Titan** share the mist. On the potting bench sits an **empty Tall One's picture frame** facing the door. At the far end of the loop stands **Gnome Jesus (#036)** himself, squared directly to the camera, claiming he is only checking the panes. Every safari up to tonight was his audition for you.
- **Unlock Announcement (Gnome Jesus):**
  > "Fifty-two thousand points. Very well. I am unlocking the Glasshouse out back — strictly for the Mooncaps and the Bonsai Titan, mind you. If you happen to see me, check the lighting first."
- **Locked Teaser (Map Card, `< 52,000 pts`):**
  > *Unlocks at 52,000 pts.* The glass door behind the Lab is latched from inside. "My private garden. Nobody enters with a wobbly wrist."
- **Field Briefing (Safari Map Card):**
  > Hyssop's own back-lot conservatory under midnight glass, mist, and cold tea. Steady your camera for shy nocturnal glow — and someone very specific waiting by the far shrine.

---

### Chapter 7 — `frost`: The Rime — *"The One Frozen Week"*
- **Unlock Threshold:** `65,000 pts`
- **Species:** 6 total (`6 new`: Snowcap, Icicle Imp, Pinego, Frosthound, Chimney Owl, Frost King; `42 cumulative` — full Gnomokedex)
- **Story Beat:** The turning of the year. Just as your Glasshouse prints dry on the Darkroom line, Fescue's one named season settles in: **The Rime**, the single hard-frost week when Birdbath Keep's Basin freezes solid (and down in the Cistern below, the Basin light shaft goes dark under ceiling ice). Hyssop places the final pin at the crown of the map table. Around the frozen Basin, terracotta chimneys smoke, **Snowcaps** sweep the Keep's steps, **Icicle Imps** hug the shady eaves, **Pinegos** curl in the hedges, a **Frosthound** races Tag's stride, a **Chimney Owl** watches from the pots, a small unexplained snow gnome stands by the gate, and the **Frost King** holds the ice beneath the Keep's one lit window. You have one frozen week — and the Lab's finest remaining rolls — to finish the season's census.
- **Unlock Announcement (Gnome Jesus):**
  > "Sixty-five thousand! And right on cue, the Basin has frozen over. The Rime lasts one week — bundle up, pat Tag on the neck, and bring me the Frost King before it thaws."
- **Locked Teaser (Map Card, `< 65,000 pts`):**
  > *Unlocks at 65,000 pts.* A pale frost pin perched atop Birdbath Keep. "The Basin only freezes once a season, and I am not wasting my last good winter rolls on guesswork."
- **Field Briefing (Safari Map Card):**
  > Birdbath Keep in its one week of hard frost — smoking chimneys, swept steps, and frozen ice tunnels. Track the racing Frosthound and frame the Frost King beneath the Keep's lit window.

---

## 4. Player Ranks (Lab Titles)

As **Total Points** climb, Hyssop upgrades your official Field Lab title (shown in the Lobby header alongside your score and progress ring).

| Rank | Points | Lab Title | Field Note | Hyssop's Promotion Line |
|---|---:|---|---|---|
| 1 | `0` | **Porch Intern** | Has a hat, a carrier, and a thumb over the lens. | *"Sign the ledger. Try not to drop the Eye-Box on Tag's ears."* |
| 2 | `10,000` | **Dewdrop Spotter** | Knows which end of the camera faces the creature. | *"You have graduated from grass landscapes. Wear the title lightly."* |
| 3 | `25,000` | **Field Surveyor** | Trusted with dry film in wet pipes. | *"Mud on the boots, focus on the subject. Field Surveyor, effective immediately."* |
| 4 | `40,000` | **Scale Apprentice** | Can tell a Gold pose from a creature merely blinking. | *"You are beginning to hear what the Scale hears. Do not get smug; that is my job."* |
| 5 | `55,000` | **Glasshouse Fellow** | Allowed near the potting bench. Not the drawer. | *"A Glasshouse Fellow! Help yourself to the tea. It has been cold since Tuesday."* |
| 6 | `80,000` | **Chief Gnomographer** | Signed the census. Framed Page Thirty-Six. | *"Chief Gnomographer. I would give you the Lab, except I like owning it. Have a biscuit."* |
| 7 | `115,000` | **Keeper of the Eye-Box** | Post-finale mastery (~2,740 Gold avg across all 42 species). | *"The Scale hums when you walk up the stairs. Take whatever roll you want from the drawer."* |

---

## 5. Climax & Finale

The story lands in two connected beats: **Page #036** in the Glasshouse (`night`), and **Season Complete** once you have ridden the Rime (`frost`) and reached **80,000 pts**.

### Beat A — Grading Page #036 (Gnome Jesus in the Glasshouse)

The first time you submit a photograph of `#036` (`gnomejesus`) in the Grading Office, Hyssop's theatrical poise slips according to the grade — matching [origin.md](origin.md#design-hooks-this-opens-not-built):

- **Bronze (`< 1,700`):** *(A little too quiet.)*
  > "Ah. Yes. That is... certainly a robe. Put it in the drawer. No, the bottom drawer. Let us move on."
- **Silver (`1,700–2,599`):** *(Polite, faintly wounded vanity.)*
  > "Silver. On *me*. Well. The moonlight was clearly being difficult. Come back to the Glasshouse when your hands are warmer."
- **Gold (`2,600–3,399`):** *(Theatrical surprise hiding genuine relief.)*
  > "Wait. That is me. That is ME! A handsome angle, completely candid — I was definitely inspecting a fern. Gold! We are framing this at once."
- **Divine (`>= 3,400`):** *(No boast at all — just a long beat before he sets the photo aside.)*
  > "..."
  > *(After a pause, quieter than usual:)* "Leave it on the desk. Go wash up. I will put it in the frame myself."

Once you earn at least a **Gold** (or any photo, upgraded later) of `#036`, the empty Tall One's picture frame on the Glasshouse potting bench displays your best `#036` print. Hyssop never mentions the frame out loud.

### Beat B — The Finale Milestone (`80,000 pts` — *Chief Gnomographer*)

When your **Total Points** cross **80,000 pts** (typically right after completing **The Rime** and polishing a handful of shots), returning to the Grading Office / Lobby triggers the Lab's ending beat:

1. **The Census Signed:** Hyssop closes the Gnomokedex with a slow nod.
   > "Eighty thousand points across the lawn, the pipes, the road, the glass, and the frost. Thirty years of sketching, and you did it in one season with a dog and a camera."
2. **Page #036 Acknowledged (Conditional Beat):**
   - *If `#036` is photographed at Gold or Divine:*
     > "Every page full. Even thirty-six. Especially thirty-six. Do not look so pleased; I only stood there because the bench needed dusting."
   - *If `#036` is Bronze, Silver, or still blank:*
     > "Nearly every page worthy of the shelf. Page thirty-six could still use a kinder hand, mind you. The Glasshouse door is unlocked whenever you fancy another try."
3. **The Quiet Closing Note (The Film Drawer & Tag):**
   > "The drawer in the Glasshouse still has a few rolls left. I stopped counting them years ago."
   > *(A beat.)*
   > "Take one more when you are ready. Tag is already by the door."

### Post-Finale Play

The game never locks or ends after `80,000 pts`. Players can:
- Hunt the remaining silhouettes to reach **42/42** (*Master of Fescue* badge in `lobby.ts`).
- Upgrade Page #036 to **Divine** to trigger Hyssop's silent reaction and upgrade the framed print in the Glasshouse.
- Push to **115,000 pts** for the **Keeper of the Eye-Box** title (Gold average across the full dex).
- Ride future adopted courses ([regions.md](regions.md#7-adopted-regions): *The Compost Heap*, *The Hose Run*, *Cloverfield Ranch*), whose species can slot cleanly into the post-finale census without shifting the 7-course main arc.

---

## 6. Loose Threads Kept Loose

Do not answer any of these in dialogue, UI copy, or future cutscenes:
- How many rolls of film remain in the Glasshouse drawer (Hyssop counts at night and never gives a number).
- How Tag's walk crosses between the Yard's town road and the walled garden of Fescue.
- Who Tag's Tall One person is, what his collar tag says, and whether they are coming back.
- Whether Hyssop is literally three thousand years old or merely bragging, who fired him, and whether his halo is a Tall-eye.
- What "kemon" means in "Gnomokemon."
- Who builds the small snow gnome outside Birdbath Keep's gate during the Rime.
- What lies beyond the Fence, or when the Kiln will next be lit (stays Gnomomia's).

---

## 7. Implementation Notes (For Future Code PRs)

No code is changed by this doc. When wiring progression into `games/gnomeokemon`:
- **Unlock source of truth:** Derive unlocks purely from `total` (already computed in `lobby.ts` line 61 from `loadBestPhotos()`), so existing saves automatically unlock every course they have already earned.
- **Course metadata:** Pair each `CourseId` in `COURSE_ORDER` with `{ unlockPts, chapterTitle, unlockLine, lockedTeaser, fieldBriefing }` alongside `COURSE_META`.
- **Unlock announcement toast/modal:** Track `lastSeenPoints` (or `announcedCourses`) in `localStorage` so returning from the Grading Office after crossing `10k / 20k / 30k / 40k / 52k / 65k / 80k` shows Hyssop's unlock/rank line once, cleanly, without repeating on every reload.
- **Quick Ride button (`lobby.ts`):** Point "Quick Ride" at the highest *unlocked* incomplete course (or `lawn` at `0 pts`) rather than hardcoding "World 1".
- **Drop "World N" labels:** Replace `World ${index + 1}` badges on `renderCourseMap` cards with `Ch. ${index + 1}` or lock/point badges (`🔒 20,000 pts`), matching [regions.md](regions.md#9-follow-ups-for-the-game).
