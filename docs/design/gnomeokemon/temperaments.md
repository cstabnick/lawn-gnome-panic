# Temperaments: how each Gnomokemon behaves

**Status: draft proposal.** Today every creature reacts the same way. Bait makes it walk to the apple and eat; Pester
makes it startle in place; the Flute makes it dance if it is within 12 units of the dog (`snap/game.ts`). What differs
is only the idle motion: `patrol`, `hop`, `orbit`, `swoop`, `burrow`, `roll` (`world.ts`). This file proposes
**temperament** as the missing layer: some Gnomokemon are docile, some curious, some skittish or shy, some defend
something, some steal, some stand guard and some ignore everything. Nothing here is built; the last section says what
the code would need.

It follows Fescue's rule 6 (every creature wants something and none is evil for no reason) and the core's **no
gore**: aggression is a warning, a shove or a smear on the lens, never a wound. See
[origin.md](origin.md) for what the creatures are.

## 1. The eight temperaments

| Temperament | In a sentence | Why they are like that |
|---|---|---|
| **Docile** | Grazes and basks; trusts everything | nothing has ever gone wrong for them |
| **Curious** | Comes over to look, then looks back | they were made to be asked something |
| **Skittish** | Flees early; only holds still if you do | a lot of things have gone wrong for them |
| **Shy** | Hides, then peeks; needs patience | they are small, in a world with a dog in it |
| **Territorial** | Defends a nest, a spire, a post, a stretch of bank | there is a thing behind them |
| **Thief** | Takes the bait and the shine | it wants something of yours |
| **Sentinel** | Holds a post and stays put | its job is to stand there |
| **Aloof** | Ignores bait and pestering; poses for a steady camera | it needs nothing from you |

**Aggressive is not a temperament.** Only *Territorial* ones act against the player, and they do it for a reason that
is on the creature's Gnomokedex line ("to protect its grubs", "its Paper Spire safe", "to flow freely").

## 2. What each temperament does to the tools

The game's tools: **Snap**, **Bait** (a windfall apple), **Pester** (a purple scare), **Flute**, **Zoom**, **Speed**
(a pat on Tag's neck). Responses below reuse the game's existing action states (`eating`, `startled`, `dancing`) and
`baitTarget`; the differences are who comes, who bolts, who hides and who gives a bonus.

| | Bait | Pester | Flute | Tag nearby (about 6 units) | Best shot |
|---|---|---|---|---|---|
| **Docile** | comes, eats | brief startle, then resumes | dances readily | ignores | Snack Time, Flute Dance |
| **Curious** | arrives first, circles it | backs off 2 s, comes back | dances, wants more | approaches, circles Tag | any |
| **Skittish** | comes only if Tag is slow or stopped | bolts out of frame | freezes (no dance) unless Tag is still | flees | catch it when Tag has stopped |
| **Shy** | comes after 2 s of stillness | hides (burrow, curl, submerge) for ~6 s | dances once it has eaten | retreats to cover | wait out the hide |
| **Territorial** | ignores it or defends it | warning display: a good photo, at a cost | the Flute calms it into dancing | warns the dog off | Pester on purpose, then pay |
| **Thief** | takes it and leaves with it | drops what it stole | dances while holding loot | eyes the dog, hovers | catch it mid-theft |
| **Sentinel** | ignores it unless it lands on the post | stiff startle, does not leave | sways in place | ignores | patience, centred |
| **Aloof** | ignores | ignores | ignores | ignores | hold the camera steady 2 s and it turns to pose |

**Two design ideas follow from the table.**

- **The Flute is the pacifier.** It turns a Territorial creature's display into a dance, and it is the only tool that
  works on every temperament except Aloof. That gives the Flute a role besides "+650".
- **Pester has a cost on Territorial ones.** A display is a great photo (Startled +700) and it earns a *shove*. The
  shove should cost something small and soft, never harm: a smear on the lens (the next frame is soft), the
  dog hustling a few seconds (lost position on the rail), or one lost frame. Never film-ending, never damage to Tag.

## 3. Reading the table for the player

Players shouldn't need a manual. Each Gnomokedex page gets a one-word temperament and a two-line hint, in
Gnome Jesus's voice ("Shy. It will come out if you stop talking."). The "wants" line stays as the lore.

## 4. The creatures

The table gives each Gnomokemon its **origin lineage** ([origin.md](origin.md): Grown, Dropped, Shaped), its
temperament, its idle behaviour in the course data today, and the one-line reason. Bestiary **Aggro** is Fescue's
design-doc column ([bestiary](../gnomomia/bestiary.md)); the Snap temperament is different (a fight is not the game),
but where the bestiary says "yes" Snap says Territorial or Thief.

| # | Species | Origin | Temperament | Idle behaviour | Why |
|---|---|---|---|---|---|
| 001 | Sproutling | Grown | Curious | hop, patrol | a sprout in a glazed shard, nosy by nature |
| 002 | Kilnpup | Shaped | Curious | orbit, hop | treats Tag as a big cousin; orbits him |
| 003 | Dewdrop | Shaped | Curious | hop | wants someone to toss pebbles in it: **Pester is a game to it**, it splashes in delight |
| 004 | Mossback | Grown | Docile | patrol | a slow grazer under the rhubarb |
| 005 | Staghorn | Grown | Territorial | orbit | protects grubs in the log mounds; rears its horns at Pester |
| 006 | Thimblekin | Dropped | Thief | patrol | wants everything you own, preferably shiny |
| 007 | Hoseleech | Dropped | Territorial | orbit | holds its sunny bank; the Flute charms it into a sway |
| 008 | Strawight | Dropped | Sentinel | patrol | guards the clover rows until the Straw King returns |
| 009 | Paperwasp | Grown | Territorial | swoop | defends the Paper Spire |
| 010 | Unfired | Shaped | Docile | patrol | slow and mostly water; Pester makes it slump (a dent, never a break) |
| 011 | Grubthorn | Grown | **Skittish (Boss)** | burrow | leading his clan south; flees Tag, but only because he is going |
| 012 | Minimower | Dropped | Aloof (Boss) | patrol | wants nothing anyone can name; only holds still when you do |
| 013 | Armadillan | Grown | Shy | roll, patrol | curls up when Tag is near; unrolls for bait |
| 014 | Sunlizard | Grown | Docile | orbit, patrol | basks; ignores everything while it does |
| 015 | Cactuskin | Grown | Sentinel | hop, patrol | "plenty of respect": flares spines, stays put |
| 016 | Tumblewight | Grown | Aloof (Elite) | roll | rolled by the wind, not by you; hold steady for the rare pause |
| 017 | Clogmaw | Grown | Territorial (Boss) | hop, orbit | a blockage that wants to move: surges when blocked |
| 018 | Rustcrab | Dropped | Thief | patrol, orbit | takes scrap nuts and the bait's shine |
| 019 | Kilnwarden | Shaped | Sentinel (Boss) | patrol | tests whoever would light the Kiln; **Pestering it fails the test**, patience wins |
| 020 | Glowmoth | Grown | Curious | swoop | circles any lantern: Tag's glow, the Glasshouse lamp |
| 021 | Sea Mower | Dropped | Territorial (Boss) | patrol, orbit | patrols the basin; Pester makes it churn bubbles |
| 022 | Cisterneel | Grown | Shy | swoop, orbit | stays in dark pipes; shows itself to a still camera |
| 023 | Drowned Toad | Grown | Shy (Elite) | hop | a quiet sunken ledge is all it asks |
| 024 | Barnacle Knight | Dropped | Sentinel | patrol | stands by its tin-can helm; there are forty |
| 025 | Kelpsprite | Grown | Curious | swoop, orbit | plays in sunbeams |
| 026 | Magpie Thief | Grown | Thief | swoop | shiny things, especially Tall-eyes; the lens is bait to it |
| 027 | Hedgewright | Shaped | Territorial | patrol | keeps the Wildlings out of its timber (see regions.md section 7) |
| 028 | Acorndrake | Grown | Aloof (Elite) | swoop | perches high on warm resin; looks down |
| 029 | Bellrat | Grown | Skittish | orbit | rings a brass bell when startled: **its alarm startles neighbours** |
| 030 | Gnome Spirit | Shaped | Aloof (Boss) | orbit | keeper of the lawn's balance: cut a little, water a little |
| 031 | Mooncap | Grown | Shy | hop, patrol | glows only when unobserved; steady camera, it brightens |
| 032 | Starbeetle | Grown | Docile | orbit | follows the light on the glass |
| 033 | Dewghost | Grown | Shy | swoop | drifts into a warm lantern |
| 034 | Bonsai Titan | Dropped | Sentinel (Boss) | patrol | its roots stay in the porcelain pot; shots reward time |
| 035 | Clockwork Frog | Dropped | Curious (Elite) | hop | needs its key wound once a night: it **hops fast, then slows**, and hops up to Tag to be wound |
| 036 | Gnome Jesus | Shaped | Aloof (Mythic) | orbit | poses: faces the lens when the camera is steady ([origin.md](origin.md#3-why-is-gnome-jesus-looking-at-me)) |
| 037 | Snowcap | Shaped | Docile | hop, patrol | seeks a scarf and broth; trusts everything warm |
| 038 | Icicle Imp | Grown | Skittish | swoop | hides in shade so its horns don't melt; flees the sun's glare |
| 039 | Pinego | Grown | Shy | roll | rolls up like a pine cone when Tag is near |
| 040 | Frosthound | Shaped | Curious (Elite) | orbit | wants a sprint round the Basin; **races Tag** |
| 041 | Chimney Owl | Grown | Aloof (Elite) | swoop | roosts on a chimney pot; turns only its head |
| 042 | Frost King | Shaped | Aloof (Boss) | patrol | wants the Basin undisturbed; **Pester cracks the ice**, a lens-smear's worth |

Counts: Docile 5, Curious 7, Skittish 3, Shy 6, Territorial 6, Thief 3, Sentinel 5, Aloof 7 (some tagged Boss or Elite
beside it). 42 in total.

## 5. Group behaviour: the elder and the pup

The spawn lists place many species **twice with two scales** (a 1.25 and a 1.1: Sproutling, Dewdrop, Armadillan,
Cactuskin, Sunlizard, Rustcrab, Glowmoth and others). Make that lore: the larger is the **elder** and the smaller its
**pup**. A pup has its elder's temperament shifted one step toward Curious, and follows the elder's lead on the
tools. A Territorial elder's pup stays behind it.

## 6. What the code would need

All of it hangs on two small additions, and none touches the dex, the prefabs or grading:

1. A `temperament` and a `notice` radius in the per-species data (and an optional per-spawn override).
2. The creature update in `game.ts` branches on temperament in three places: what bait does, what pester does, and
   whether it flees or approaches when the dog is within `notice`.

The Flute, the Zoom and the scoring stay as they are. This is a follow-up, not a prerequisite for the lore.
