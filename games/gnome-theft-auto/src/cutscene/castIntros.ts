// Character intro cards (L105): who each main character is, in a name, a role and one line, for the 'intro' scene step
// (script.ts) and showCharacterIntro (introCard.ts). Pure data; lore: docs/design/gnome-theft-auto/characters.md and
// docs/lore/. E20-E22 place the intros in the story; this file only says what each card reads.

/** What one intro card shows. */
export interface CharacterIntro {
  /** Display name, e.g. "Pip Potsworth". */
  name: string;
  /** A short role, at most 28 characters, e.g. "Your neighbour. Fixer." */
  role: string;
  /** One line of who they are, at most 70 characters, in the game's dry voice. */
  line: string;
  /** Accent colour 0xRRGGBB for the card's stripe (the character's hat colour). Default 0xffd23f. */
  accent?: number;
}

/** By cast key (cutscene/cast.ts CAST keys), plus the two speakers without a CAST preset. */
export const CAST_INTROS: Readonly<Record<string, CharacterIntro>> = {
  pip: { name: 'Pip "Two-Stroke" Potsworth', role: 'Mechanic. Liability.', line: 'Fast-talking engine nut who drags you into every plan. Never still.', accent: 0xc82828 },
  tansy: { name: 'Tansy "Side-Valve" Clayfoot', role: 'Boss of Side-Valve Salvage.', line: 'Runs the bay and the crew. Dry, short orders, and no nonsense.', accent: 0xf08a24 },
  vesper: { name: 'Vesper "The Glazier" Thorne', role: 'HOA chair. Porcelain.', line: 'Soft-spoken and very polite, and happy to buy your street. Nice hat.', accent: 0x141418 },
  granny: { name: 'Granny Gnertrude', role: 'Fence. Pie. Cloverfield.', line: 'The sharpest fence in three biomes, with a pie in the oven.', accent: 0x8e44ad },
  diggs: { name: 'Commander Diggs', role: 'Commander, Fort Sandpit.', line: 'Runs the Spade Guard by the book. Effective immediately.', accent: 0x4b6329 },
  bracken: { name: 'Elder Bracken', role: 'Elder of the Unmowed.', line: 'Keeps the Cracked Tablet and the old ways in Mossy Wood. No jokes.', accent: 0x2e6f40 },
  loam: { name: 'Father Loam', role: 'Excommunicated chaplain.', line: 'Keeps the Kiln-Resin shrine on the frozen basin. Blesses getaways.', accent: 0x9ec6de },
  bodega: { name: 'John Bodega', role: 'Corner shopkeeper.', line: 'Runs the corner shop, sweeps the step, and never looks up from it.', accent: 0x7c4a2d },
  juniper: { name: 'Councilwoman Juniper "The Trowel" Vance', role: 'City Council. Paperwork.', line: 'Beats the HOA with forms, faster than they can file. Never hurries.', accent: 0x2f5a8f },
  reginald: { name: 'Reginald "Quarter-Inch" Vance', role: 'HOA audit officer.', line: 'Measures everything to a quarter-inch and signs what he doubts.', accent: 0x18181e },
  sorrel: { name: 'Sorrel Tillbrook', role: 'Radio host, 88.7 Fescue.', line: 'The calm voice of the Unmowed on the radio. Keeps the rain tapes.', accent: 0x4f7a5a },
  clara: { name: 'Clara', role: 'Keeper of the refuge.', line: 'Leads cracked gnomes to the oak stump. Counts them gently.', accent: 0xf6f6fa },
  brenda: { name: 'Baroness Brenda', role: 'Sovereign of New Puddle.', line: 'Taxes everyone, declares everything, and rides a gold push-bike.', accent: 0xd4a04a },
  'big lou': { name: 'Big Lou', role: 'Door of the Gnomecino.', line: 'Checks every hat at the door. One or two words, and always "Hat."', accent: 0x18181e },
  mossley: { name: 'Mossley "Plumb-Line" Inkcap', role: 'Grid-truther surveyor.', line: 'Proves the gridlines with a plumb-line. Sixty and sixty, every time.', accent: 0x3b6ea5 },
  burt: { name: 'Burt', role: 'Ex-HOA citation writer.', line: 'Leaks van routes to the street crews, and jumps at every sound.', accent: 0x4b5563 },
  driftwood: { name: 'Driftwood', role: 'Castaway and boatman.', line: 'Follows the water, tells long stories, and runs a tube hut by the sea.', accent: 0x4f9d92 },
  cedric: { name: 'Cedric "Double-Bag" Peat', role: 'Chapel of Mulch recruiter.', line: 'Ground-floor opportunity in every sentence. Three friends by Friday.', accent: 0x8e44ad },
  bramble: { name: 'Farmer Bramble', role: 'Cloverfield grower.', line: 'Granny\'s neighbour and drinking partner. Don\'t look up. Listen.', accent: 0x8b5a2b },
  shelldon: { name: 'Shelldon "No-Trail" Mucilage', role: 'Snail-Mail Express courier.', line: 'Carries scrolls by snail, in capitals, and never on a paved road.', accent: 0x7a8a78 },
  wally: { name: 'Wind-Sock Wally', role: 'Airfield keeper and pilot.', line: 'Dry and gravelly. Calls everyone "kid" and quotes the stall speed.', accent: 0x6b4a2e },
  dot: { name: 'Dorrit "Dot" Pennywort', role: 'Kerbside Exchange job board.', line: 'Pins everyone\'s jobs to the board and punches the tickets. "Next!"', accent: 0x2a4d7a },
  hedda: { name: 'Hedda Galley', role: 'Editor, Turfton Tattler.', line: 'Writes headlines like telegrams. Nobody has ever photographed her.', accent: 0x1c1c1c },
  nina: { name: 'Neon-Moth Nina', role: 'Night vendor, Greenhouse.', line: 'Sells glow-bands and gossip after dark. You did not hear it here.', accent: 0x7a3cff },
  grout: { name: '"Big Wrench" Grout', role: 'Head of Local 404.', line: 'Union boss with a pipe wrench. Pays in real acorns, only real ones.', accent: 0x3d4a5c },
  peony: { name: 'Dame Peony Gravelrake', role: 'Owner, Hedgeworth Links.', line: 'Runs the neighbour\'s course by the card. Vesper holds her mortgage.', accent: 0x3f6b3a },
  basil: { name: 'Basil Divot', role: 'Club pro. Superstitious.', line: 'Plays every round to win and blames every bad lie on a mole.', accent: 0xc0282d },
  thrift: { name: 'Thrift Hosepipe', role: 'Groundskeeper.', line: 'Talks to the grass, waters the ninth green and keeps its secrets.', accent: 0x6b4a2e },
  mabel: { name: 'Mabel Kerbstone', role: 'Turfton Taxi driver.', line: 'Hop in, dear. Knows every fare\'s business and sells none of it.', accent: 0xf2c200 },
  'mayor mulch': { name: 'Mayor Barnaby "Two-Coat" Mulch', role: 'Mayor of Turfton.', line: 'Wants to be on the winning side. Waves at cameras that are not there.', accent: 0xffd23f },
  'turncoat cam': { name: 'Turncoat Cam', role: 'Side-Valve sweeper.', line: 'Broom always in hand, eyes on the bay, never on the person talking.', accent: 0xffd23f },
};

const titleCase = (s: string): string => s.replace(/\b\w/g, (m) => m.toUpperCase());

/**
 * The card for `who` (a cast key or label, any case), with any of `over`'s fields replacing the stored ones. An unknown
 * `who` gets its title-cased name and empty role and line.
 */
export function introFor(who: string, over: Partial<CharacterIntro> = {}): CharacterIntro {
  // Story ids are hyphenated ('turncoat-cam'); CAST keys use spaces ('turncoat cam').
  const base = CAST_INTROS[who.toLowerCase()] ?? CAST_INTROS[who.toLowerCase().replace(/-/g, ' ')] ?? { name: titleCase(who), role: '', line: '' };
  return {
    name: over.name ?? base.name,
    role: over.role ?? base.role,
    line: over.line ?? base.line,
    accent: over.accent ?? base.accent,
  };
}
