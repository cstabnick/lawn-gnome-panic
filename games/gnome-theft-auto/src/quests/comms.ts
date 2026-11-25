// Mission comms: the talking-head briefings and phone calls that explain a quest while it is played (briefing/).
// COMMS[questId][step] plays when objective `step` starts: step 0 right after the quest's intro scene (the briefing:
// what you are doing, why, and who is involved), later steps as each objective begins (a call). Lines follow the
// direction bible (docs/design/gnome-theft-auto/direction/bible.md): at most 16 words, in the speaker's own voice,
// one place name per call. Story write-up: docs/design/gnome-theft-auto/story-edit-pass.md.
import type { GnomeLook } from '@lawn/gnome';
import type { BriefingCaller, BriefingLine } from '../briefing/briefing';
import { BASE_SPEAKER_LOOK, CAST } from '../cutscene/cast';
import { voiceFor } from '../voice/voices';
import { CITY_CALLER_NAMES, CITY_COMMS } from './commsCity';
import { NEWCOMER_CALLER_NAMES, NEWCOMER_COMMS } from './commsNewcomers';

export interface CommsLine {
  /** A CAST key (cutscene/cast.ts) or another speaker key from CALLER_NAMES. */
  who: string;
  text: string;
}

export interface CommsCall {
  mode: 'briefing' | 'call';
  lines: CommsLine[];
}

/** Display names on the comms card, by speaker key. */
export const CALLER_NAMES: Readonly<Record<string, string>> = {
  pip: 'Pip Potsworth',
  tansy: 'Tansy Clayfoot',
  vesper: 'Vesper Thorne',
  granny: 'Granny Gnertrude',
  diggs: 'Commander Diggs',
  bracken: 'Elder Bracken',
  loam: 'Father Loam',
  bodega: 'John Bodega',
  juniper: 'Councilwoman Juniper Vance',
  reginald: 'Reginald Vance',
  sorrel: 'Sorrel Tillbrook',
  clara: 'Clara',
  brenda: 'Baroness Brenda',
  'big lou': 'Big Lou',
  mossley: 'Mossley',
  burt: 'Burt',
  driftwood: 'Driftwood',
  cedric: 'Cedric',
  bramble: 'Bramble',
  shelldon: 'Shelldon',
  wally: 'Wind-Sock Wally',
  ...CITY_CALLER_NAMES,
  ...NEWCOMER_CALLER_NAMES,
};

/** Portrait look, name and voice for a speaker key. Unknown keys get the base look and a derived voice. */
export function callerOf(who: string): BriefingCaller {
  const key = who.toLowerCase();
  const preset = CAST[key];
  const look: GnomeLook = { ...BASE_SPEAKER_LOOK, ...(preset?.look ?? {}) };
  return { key, name: CALLER_NAMES[key] ?? who, look, voice: voiceFor(key) };
}

/** A call's lines, ready for Briefing.show(). */
export function briefingLines(call: CommsCall): BriefingLine[] {
  return call.lines.map((l) => ({ caller: callerOf(l.who), text: l.text }));
}

const brief = (...lines: [string, string][]): CommsCall => ({ mode: 'briefing', lines: lines.map(([who, text]) => ({ who, text })) });
const call = (...lines: [string, string][]): CommsCall => ({ mode: 'call', lines: lines.map(([who, text]) => ({ who, text })) });

export const COMMS: Readonly<Record<string, Readonly<Record<number, CommsCall>>>> = {
  // ---- Chapter 1: a hired hand doing errands for the debt ----
  'prologue-fresh-kiln': {
    0: brief(
      ['pip', 'Stay on my tail! Side-Valve Salvage, past The Gnomecino.'],
      ['pip', 'Tansy runs it. Best mechanic in Turfton. Worst mornings.'],
      ['pip', 'I owe her. She owes me. Somebody owes somebody. Drive!'],
    ),
    1: call(['pip', 'That\'s the bay! Tansy\'s the one with the spanner and no smile.']),
  },
  'first-contract': {
    0: brief(
      ['pip', 'The Mulch Club is Don Compost\'s. He doesn\'t talk. He taps.'],
      ['pip', 'Three gold hats owe him Acorns. Crack them and he pays your debt down.'],
      ['pip', 'Clay-Mart owns your Kiln-Debt. Five thousand. This is how you start.'],
    ),
  },
  'ch1-mowers-keepers': {
    0: brief(
      ['tansy', 'The HOA clamps anything with a motor and no permit.'],
      ['tansy', 'The farmers\' bikes are at the Picnic Median. Enforcers on them.'],
      ['tansy', 'Crack the Enforcers. Then the bikes are just bikes.'],
    ),
    1: call(['tansy', 'Clamps are off. Ride one in. Cam will get the bay door.']),
    2: call(['pip', 'One more! Cam says the second one pulls left. Cam says a lot.']),
    3: call(['tansy', 'Somebody\'s at my door with tape and a clipboard. Deal with it.']),
  },
  'ch1-two-coat-tail': {
    0: brief(
      ['juniper', 'Mayor Mulch is leasing the city\'s medians. I want to know to whom.'],
      ['juniper', 'Tail him to Patio Heights. That is Vesper Thorne\'s street.'],
      ['juniper', 'Vesper runs the HOA. My brother Reginald measures lawns for him.'],
    ),
    2: call(['juniper', 'You were seen. Deal with his guards. Keep the camera dry.']),
    3: call(['juniper', 'Post him a copy, his own letterbox. Let him find out at breakfast.']),
    4: call(['juniper', 'City Hall. The side door. Reginald uses the front.']),
  },
  'ch1-tax-break-in': {
    0: brief(
      ['tansy', 'Vesper put a lien on my bay. Forty-eight hours, then it\'s his.'],
      ['tansy', 'The deed is in the Glaze & Tax vault, in Thorne Tower.'],
      ['pip', 'Crack the auditors, grab the deed, take his Combine. I brought butter knives!'],
    ),
    1: call(['pip', 'Auditors down! Vault\'s inside. Deed first, snacks second.']),
    2: call(['tansy', 'That Combine in his yard is Vesper\'s. Bring it to my bay. Loudly.']),
  },
  'ch1-founders-boot': {
    0: brief(
      ['tansy', 'Founder\'s Trim Day. Gnorwin\'s Boot rolls in the parade.'],
      ['tansy', 'Gnorwin Clayfoot, first king of Fescue. Allegedly my great-great-something.'],
      ['tansy', 'Vesper\'s tribunal is at the Amphitheater. Put the Boot in the jury box.'],
    ),
    1: call(['pip', 'Boot\'s in the jury box! Reginald is very upset. Crack his Enforcers!']),
    2: call(['tansy', 'Four hats on your tail. Bring the Combine home. The stamp\'s inked.']),
  },
  // ---- Chapter 2: debt paid, and the first refusal ----
  'ch2-dew-run': {
    0: brief(
      ['tansy', 'Granny Gnertrude, out at Cloverfield. Fences anything. Pays in pie.'],
      ['tansy', 'Vesper froze her Black Dew. Half of Turfton\'s engines drink it.'],
      ['tansy', 'Help her, and she clears your Kiln-Debt. Mind her pumpkins.'],
    ),
    1: call(['granny', 'Combine\'s across the road. Here comes the convoy. Bring me that hauler.']),
  },
  'ch2-sprinkler-gauntlet': {
    0: brief(
      ['granny', 'Reginald\'s laser-level boys are measuring my silo for a foreclosure.'],
      ['granny', 'Crack them. Then haul the silo south before they come back with paper.'],
    ),
    1: call(['granny', 'Hitch the silo. Mind the sprinklers. Rooster says they\'re watching. They\'re not.']),
    2: call(['bramble', 'Boss says more of them at the south barn. Foreclosure team. Big clipboards.']),
  },
  'ch2-vespers-offer': {
    0: brief(
      ['granny', 'That card was Vesper Thorne. Folks call him the Glazier.'],
      ['granny', 'He wants the Golden Acorn out of Tansy\'s crate. He\'ll offer the moon.'],
      ['granny', 'Listen to him. Say no. Then run.'],
    ),
    1: call(['granny', 'Porcelain Guards. They don\'t bend, so make them crack.']),
    2: call(
      ['sorrel', 'This is Sorrel Tillbrook, 88.7 Fescue Public. Elder Bracken asks you west.'],
      ['sorrel', 'Mossy Wood. Bring Pip. He won\'t want to come.'],
    ),
  },
  'ch2-unmowed-tablet': {
    0: brief(
      ['sorrel', 'The Unmowed are the gnomes who never let a mower in.'],
      ['sorrel', 'Vesper\'s welders are plating his Grand Combine at the Compost Heap.'],
      ['sorrel', 'The Elder wants their plates. He says they are his to melt.'],
    ),
    2: call(['bracken', 'The plate rig. Bring it to the hollow. Do not drive on the moss.']),
  },
  // ---- Chapter 3: the player is the one others lean on ----
  'ch3-salvage-raid': {
    0: call(
      ['tansy', 'Cam sold us. Get Pip out. I\'ll draw them off.'],
      ['tansy', 'Father Loam, up in Frostbite Fells, mends cracked clay. Go north.'],
    ),
    1: call(['tansy', 'Ring Road, northwest. Lose the cordon. Don\'t come back for me.']),
    2: call(['pip', 'Take my Zero-Turn. You drive. I\'m, uh, short an arm.']),
  },
  'ch3-kiln-resin-ice': {
    0: brief(
      ['loam', 'Kiln-Resin, from the northern shrine. Without it, the boy\'s arm stays in a sack.'],
      ['loam', 'The HOA salts the road to keep pilgrims off it. Crack the plow crew.'],
    ),
    2: call(['loam', 'Ninety seconds while it sets. Keep them off the basin, my child.']),
    3: call(['pip', 'It set! Arm\'s on! Thermos Theo says there\'s post for us. Snail post!']),
  },
  'ch3-tundra-drift-run': {
    0: brief(
      ['pip', 'Tansy\'s hiding in the Dust Flats, at the overlook. She\'s got the Stone!'],
      ['pip', 'Loam packed the barrels in ice. Very volatile. Drive like it\'s soup.'],
    ),
    1: call(['tansy', 'HOA spotters on the ridge. Crack them before they phone it in.']),
  },
  // ---- Chapter 4: the one everybody's plan depends on ----
  'ch4-runway-flares': {
    0: brief(
      ['tansy', 'Fort Sandpit. The Spade Guard\'s fort, and the Whirligig\'s pad.'],
      ['tansy', 'The Unmowed are coming to help. Flares show them where.'],
      ['tansy', 'Commander Diggs runs the fort. He\'s not ours. Not yet.'],
    ),
    1: call(['pip', 'Crop Duster\'s on the apron! Fly low and drop the flare on the Flats!']),
    2: call(['bracken', 'We see the first flare. One more, on the north ridge.']),
  },
  'ch4-sandpit-drop': {
    0: brief(
      ['tansy', 'The Whirligig flies. Vesper\'s Combine doesn\'t. That\'s our edge.'],
      ['pip', 'Over the wall, out of the plane, onto the pad. Easy. Probably.'],
    ),
    1: call(['pip', 'You\'re on the pad! Snipers are waking up. Crack them, then lift off!']),
    2: call(['tansy', 'Bring her home to the overlook. Lower than you think.']),
  },
  'ch4-spade-truce': {
    0: brief(
      ['tansy', 'Vesper fired the Spade Guard by phone. Diggs took it personally.'],
      ['tansy', 'Help him take the armory back. Every free gun in Turfton came out of it.'],
    ),
    1: call(['diggs', 'HOA lockout at my gate. Crack them. Nobody locks the Guard out.']),
    2: call(['diggs', 'Gate\'s clear. Armory\'s inside. Walk in like you own it. I do.']),
  },
  // ---- Chapter 5: the hand on the jam ----
  'ch5-even-cut': {
    0: brief(
      ['tansy', 'The Grand Combine is coming down the meridian with the Golden Acorn inside.'],
      ['tansy', 'Clear his escort. Then the Whirligig, the deck, the Stone in the intake.'],
      ['granny', 'Cloverfield\'s on the south canal, sugar. Diggs has the rest. Go.'],
    ),
    1: call(['pip', 'Escort\'s down! Whirligig\'s warm! Over the Combine and jump!']),
    2: call(['bracken', 'The intake, child. Gnorwin\'s Stone was made for it. Set it true.']),
    3: call(['tansy', 'It\'s jammed. Vesper\'s on his throne. Knock the hat off him.']),
    4: call(['juniper', 'The acorn is loose. Bracken wants a monument. Tansy wants a power grid. Your call.']),
  },
  // ---- Strangers & Freaks ----
  'sq-grid-truthers': {
    0: call(['mossley', 'Four markers, then zero, zero. Walk, don\'t run. Running looks guilty.']),
    3: call(['mossley', 'Centre datum. Dig where the paving is newest.']),
  },
  'sq-snail-rigging': {
    0: call(['shelldon', 'Fence gap on the paddock side. Swap one bowl. Walk.']),
    1: call(['shelldon', 'Out. Back to my alley. The slugs will not follow. The bookies might.']),
  },
  'sq-big-lou-embargo': {
    0: call(['big lou', 'Red Caps. Downtown. My towels.']),
    1: call(['big lou', 'Car\'s out front. No mud. No dust. No excuses.']),
  },
  'sq-mulch-pyramid': {
    0: call(['cedric', 'Top of the drive, friend. Spread it thick. Smile at the wasps.']),
    1: call(['tansy', 'Cedric\'s mulch has wasps in it. Every pallet to my bay before the HOA.']),
  },
  'sq-biscuit-hotdog': {
    0: call(['bramble', 'Combine\'s in the yard. Hook the hotdog. Drive soft. It squeaks.']),
  },
  'sq-castaway-drydock': {
    0: call(['driftwood', 'Keep her level. The canal\'s south. The sea is waiting.']),
  },
  'sq-porcelain-blues': {
    0: call(['clara', 'Three scavengers. They will be proud of themselves. Crack them anyway.']),
    1: call(['clara', 'Bring the lanterns to the porch. Knock softly. Once.']),
  },
  'sq-fescue-fugitive': {
    0: call(['bracken', 'Vesper\'s gallery, Patio Heights. The Stone sits under a sprinkler. Lift it dry.']),
  },
  'sq-hose-revolt': {
    0: call(['brenda', 'Four hoses, subject! The Ring Blocks main first. Kink with conviction!']),
    3: call(['brenda', 'The club, subject! Vesper\'s eighteenth hole shall be a lake!']),
  },
  'sq-hoa-audit': {
    0: call(['burt', 'Five officers, five clipboards, five biomes. I marked them. Sorry.']),
  },
  'sq-porcelain-support': {
    0: call(['clara', 'Drive slowly. The bunker is in Mossy Wood. Elder Bracken is expecting us.']),
  },
  'sq-tessie': {
    0: call(['driftwood', 'Three sightings. Go slow. She spooks.']),
    1: call(['driftwood', 'Buoys now. Drop them while the patrol boat looks the other way.']),
  },
  ...CITY_COMMS,
  ...NEWCOMER_COMMS,
};

/** The call for objective `step` of a quest, if it has one. */
export function commsFor(questId: string, step: number): CommsCall | undefined {
  return COMMS[questId]?.[step];
}
