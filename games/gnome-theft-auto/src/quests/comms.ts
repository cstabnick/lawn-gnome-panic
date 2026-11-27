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
import { STORY_COMMS } from './story';
import { GLAZE_COMMS } from './glazeQuests';

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
  cardoon: 'Cardoon "Swish" Trowelly',
  fennel: 'Fennel Gripwax',
  thrift: 'Thrift Hosepipe',
  peony: 'Dame Peony Gravelrake',
  basil: 'Basil Divot',
  'don compost': 'Don Compost',
  parsley: 'Parsley Inkpot',
  hyssop: 'Hyssop Doormat',
  'turncoat cam': 'Turncoat Cam',
  'mayor mulch': 'Mayor Mulch',
  'lugnut lulu': 'Lugnut Lulu',
  chard: 'Chard Levelright',
  hogweed: 'Hogweed Sprocket',
  gary: 'Gate-Guard Gary',
  sage: 'Sage Ladle',
  frank: 'Fence-Post Frank',
  chicory: 'Chicory Snips',
  wisteria: 'Countess Wisteria',
  'rooster weatherby': 'Rooster Weatherby',
  nubbin: 'Nubbin',
  tumblesoil: 'Old Mother Tumblesoil',
  saxifrage: 'Mother Saxifrage',
  ernie: 'Ash-Shovel Ernie',
  midge: 'Squeaky-Clean Midge',
  cass: 'Chrome-Knuckle Cass',
  'dj moleman': 'DJ Moleman',
  gentian: 'Gentian Bootlace',
  'thermos theo': 'Thermos Theo',
  chanterelle: 'Warden Chanterelle',
  ragwort: 'Ragwort Coilspring',
  clary: 'Marshal Clary',
  marram: 'Marram Teaspoon',
  samphire: 'Captain Samphire',
  betony: 'Professor Betony Sextant',
  lovage: 'Dean Lovage Inkwell',
  'silt-diver sal': 'Silt-Diver Sal',
  yarrow: 'Reeve Yarrow Potsherd',
  'burdock haybright': 'Head Ranger Burdock Haybright',
  hector: 'Hector Disdain',
  velma: 'Velma Crown',
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
      ['pip', 'And the bank owns your flat now. Tap faster.'],
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
  // ch1-founders-boot: comms live in its story file (quests/story/), E20.

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
    // E20: Sorrel's call moved to m22-off-air; the gate step is Granny's now (outline row 20).
    2: call(['granny', 'Lose the hats at the West Highway Gate. Then go home and say nothing.']),
  },
  // ch2-unmowed-tablet: comms live in its story file (quests/story/), E20.

  // ---- Chapter 3: the player is the one others lean on ----
  // ch3-salvage-raid: comms live in its story file (quests/story/), E20.

  // ch3-kiln-resin-ice, ch3-tundra-drift-run: comms live in their story files (quests/story/), E21.
  // ch4-runway-flares, ch4-sandpit-drop, ch4-spade-truce, ch5-even-cut (and the finale's parts): comms live in their
  // story files (quests/story/), E22.
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
  // E20: the story rows' own comms (quests/story/), last so a rewritten row's file wins over its old entry above.
  ...STORY_COMMS,
  // E20 L106: Chrome-Knuckle Cass's "On the House" (glazeQuests.ts).
  ...GLAZE_COMMS,
};

/** The call for objective `step` of a quest, if it has one. */
export function commsFor(questId: string, step: number): CommsCall | undefined {
  return COMMS[questId]?.[step];
}
