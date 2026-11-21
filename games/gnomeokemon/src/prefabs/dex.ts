import { getPrefab } from '@lawn/prefabs';
import type { GnomeokemonEntry } from './types';

const DEX_META = [
  {
    "id": "sproutling",
    "dex": "001",
    "element": "bloom",
    "region": "Mossbottom Vale",
    "rank": "Starter",
    "family": "Plant / Glazed clay",
    "wants": "A sunny patch of damp loam and a drop of morning dew."
  },
  {
    "id": "kilnpup",
    "dex": "002",
    "element": "sun",
    "region": "The Rockery",
    "rank": "Starter",
    "family": "Fired clay",
    "wants": "Warm hearthstones and an occasional charcoal cinder to chew."
  },
  {
    "id": "dewdrop",
    "dex": "003",
    "element": "rain",
    "region": "Thatchford Downs",
    "rank": "Starter",
    "family": "Soft / Glazed clay",
    "wants": "A clean puddle and someone to toss pebbles into it."
  },
  {
    "id": "mossback",
    "dex": "004",
    "element": "bloom",
    "region": "Mossbottom Vale",
    "rank": "Wild",
    "family": "Soft / Plant",
    "wants": "Wet lettuce leaves and deep shade under the rhubarb."
  },
  {
    "id": "staghorn",
    "dex": "005",
    "element": "bloom",
    "region": "Mossbottom Vale",
    "rank": "Wild",
    "family": "Shelled",
    "wants": "To protect its grubs inside the rotting log mounds."
  },
  {
    "id": "thimblekin",
    "dex": "006",
    "element": "clay",
    "region": "Mossbottom Vale",
    "rank": "Wild",
    "family": "Fired clay",
    "wants": "Everything you own, preferably shiny."
  },
  {
    "id": "hoseleech",
    "dex": "007",
    "element": "rain",
    "region": "Thatchford Downs",
    "rank": "Wild",
    "family": "Soft / Hose",
    "wants": "High water pressure and a warm sunny bank to coil on."
  },
  {
    "id": "strawight",
    "dex": "008",
    "element": "sun",
    "region": "Cloverfield",
    "rank": "Wild",
    "family": "Plant",
    "wants": "To guard the clover rows until the Straw King returns."
  },
  {
    "id": "paperwasp",
    "dex": "009",
    "element": "sun",
    "region": "Hedgewood",
    "rank": "Wild",
    "family": "Winged",
    "wants": "Its Paper Spire safe from the Hedgewright loggers."
  },
  {
    "id": "unfired",
    "dex": "010",
    "element": "clay",
    "region": "The Rockery",
    "rank": "Elite",
    "family": "Unfired clay",
    "wants": "To be finished in the Kiln."
  },
  {
    "id": "grubthorn",
    "dex": "011",
    "element": "clay",
    "region": "Mossbottom Vale",
    "rank": "Boss",
    "family": "Furred",
    "wants": "To lead his clan south, away from the shaking."
  },
  {
    "id": "minimower",
    "dex": "012",
    "element": "iron",
    "region": "The Verge",
    "rank": "Boss",
    "family": "Metal",
    "wants": "To stand by the Shed door and hum along."
  },
  {
    "id": "armadillan",
    "dex": "013",
    "element": "clay",
    "region": "Desert Yard",
    "rank": "Wild",
    "family": "Shelled",
    "wants": "Cool sand under a porch step and crunchy beetles."
  },
  {
    "id": "sunlizard",
    "dex": "014",
    "element": "sun",
    "region": "Desert Yard",
    "rank": "Wild",
    "family": "Shelled",
    "wants": "A flat red rock at high noon to toast its belly."
  },
  {
    "id": "cactuskin",
    "dex": "015",
    "element": "bloom",
    "region": "Desert Yard",
    "rank": "Wild",
    "family": "Plant",
    "wants": "One spoonful of rainwater a month and plenty of respect."
  },
  {
    "id": "tumblewight",
    "dex": "016",
    "element": "sun",
    "region": "Desert Yard",
    "rank": "Elite",
    "family": "Plant",
    "wants": "A strong desert gust to roll it somewhere new."
  },
  {
    "id": "clogmaw",
    "dex": "017",
    "element": "rain",
    "region": "Drainpipe Deeps",
    "rank": "Boss",
    "family": "Soft",
    "wants": "To flow freely; it is a blockage that just wants to move."
  },
  {
    "id": "rustcrab",
    "dex": "018",
    "element": "iron",
    "region": "Drainpipe Deeps",
    "rank": "Wild",
    "family": "Metal",
    "wants": "Shiny scrap nuts and a dry ledge above the backflow."
  },
  {
    "id": "kilnwarden",
    "dex": "019",
    "element": "sun",
    "region": "The Kiln & Shed",
    "rank": "Boss",
    "family": "Fired clay",
    "wants": "To test whoever would use the great Kiln."
  },
  {
    "id": "glowmoth",
    "dex": "020",
    "element": "bloom",
    "region": "The Kiln & Shed",
    "rank": "Wild",
    "family": "Winged",
    "wants": "A warm lantern or Heartspark glow to circle at dusk."
  },
  {
    "id": "seamower",
    "dex": "021",
    "element": "rain",
    "region": "Cistern Reef",
    "rank": "Boss",
    "family": "Metal / Water",
    "wants": "To patrol the sunken basin and churn bubbles with its fins."
  },
  {
    "id": "cisterneel",
    "dex": "022",
    "element": "rain",
    "region": "Cistern Reef",
    "rank": "Wild",
    "family": "Soft",
    "wants": "Dark underwater pipes and drifting plankton."
  },
  {
    "id": "drownedtoad",
    "dex": "023",
    "element": "rain",
    "region": "Cistern Reef",
    "rank": "Elite",
    "family": "Soft",
    "wants": "Quiet sunken ledges and fat water-beetles."
  },
  {
    "id": "barnacleknight",
    "dex": "024",
    "element": "iron",
    "region": "Cistern Reef",
    "rank": "Wild",
    "family": "Metal / Shelled",
    "wants": "A sturdy tin-can helm and a quiet corner of the reef."
  },
  {
    "id": "kelpsprite",
    "dex": "025",
    "element": "bloom",
    "region": "Cistern Reef",
    "rank": "Wild",
    "family": "Plant",
    "wants": "Sunbeams filtering down through the cistern water."
  },
  {
    "id": "magpiethief",
    "dex": "026",
    "element": "clay",
    "region": "Thatchford Downs",
    "rank": "Wild",
    "family": "Winged",
    "wants": "Shiny things—especially Tall-eye glass marbles."
  },
  {
    "id": "hedgewright",
    "dex": "027",
    "element": "bloom",
    "region": "Hedgewood",
    "rank": "Wild",
    "family": "Fired clay",
    "wants": "The Hedgewood timber clear and the Wildlings kept back."
  },
  {
    "id": "acorndrake",
    "dex": "028",
    "element": "sun",
    "region": "Hedgewood",
    "rank": "Elite",
    "family": "Winged / Plant",
    "wants": "Warm pine resin and high branches to perch on."
  },
  {
    "id": "bellrat",
    "dex": "029",
    "element": "clay",
    "region": "Birdbath Keep",
    "rank": "Wild",
    "family": "Furred",
    "wants": "Cheese rinds from the Keep pantry and a shiny brass bell."
  },
  {
    "id": "gnomespirit",
    "dex": "030",
    "element": "bloom",
    "region": "Mossbottom Vale",
    "rank": "Boss",
    "family": "Glazed clay",
    "wants": "The whole lawn kept in balance—cut a little, water a little."
  },
  {
    "id": "mooncap",
    "dex": "031",
    "element": "bloom",
    "region": "Starlight Greenhouse",
    "rank": "Wild",
    "family": "Plant / Glazed clay",
    "wants": "Cool night mist and a quiet spot under the greenhouse glass."
  },
  {
    "id": "starbeetle",
    "dex": "032",
    "element": "sun",
    "region": "Starlight Greenhouse",
    "rank": "Wild",
    "family": "Shelled",
    "wants": "Dewdrops on glass panes that catch the moonlight."
  },
  {
    "id": "dewghost",
    "dex": "033",
    "element": "rain",
    "region": "Starlight Greenhouse",
    "rank": "Wild",
    "family": "Soft",
    "wants": "A warm glass lantern to drift inside."
  },
  {
    "id": "bonsaititan",
    "dex": "034",
    "element": "bloom",
    "region": "Starlight Greenhouse",
    "rank": "Boss",
    "family": "Plant",
    "wants": "Peaceful roots in its porcelain pot and mist on its needles."
  },
  {
    "id": "clockworkfrog",
    "dex": "035",
    "element": "iron",
    "region": "Starlight Greenhouse",
    "rank": "Elite",
    "family": "Metal",
    "wants": "Someone to wind its brass key once a night."
  },
  {
    "id": "gnomejesus",
    "dex": "036",
    "element": "sun",
    "region": "Starlight Greenhouse",
    "rank": "Boss",
    "family": "Glazed clay",
    "wants": "Every Gnomokemon framed with care and honesty."
  },
  {
    "id": "snowcap",
    "dex": "037",
    "element": "rain",
    "region": "Frosty Birdbath",
    "rank": "Wild",
    "family": "Fired clay",
    "wants": "A warm wool scarf and a mug of heated cistern broth."
  },
  {
    "id": "icicleimp",
    "dex": "038",
    "element": "rain",
    "region": "Frosty Birdbath",
    "rank": "Wild",
    "family": "Soft / Ice",
    "wants": "A shady eave where the morning sun cannot melt its horns."
  },
  {
    "id": "pinego",
    "dex": "039",
    "element": "bloom",
    "region": "Frosty Birdbath",
    "rank": "Wild",
    "family": "Plant / Furred",
    "wants": "Dry pine needles and a cozy burrow under the hedge."
  },
  {
    "id": "frosthound",
    "dex": "040",
    "element": "rain",
    "region": "Frosty Birdbath",
    "rank": "Elite",
    "family": "Glazed clay",
    "wants": "A frosty morning sprint around the frozen Basin."
  },
  {
    "id": "chimneyowl",
    "dex": "041",
    "element": "sun",
    "region": "Frosty Birdbath",
    "rank": "Elite",
    "family": "Winged",
    "wants": "A warm terracotta chimney pot to roost on in the snow."
  },
  {
    "id": "frostking",
    "dex": "042",
    "element": "rain",
    "region": "Frosty Birdbath",
    "rank": "Boss",
    "family": "Fired clay / Ice",
    "wants": "The frozen Birdbath Basin undisturbed until the Rime ends."
  }
] as const;

export const DEX_ENTRIES: readonly GnomeokemonEntry[] = DEX_META.map((m) => {
  const prefab = getPrefab(m.id);
  if (!prefab) throw new Error('Missing @lawn/prefabs entry: ' + m.id);
  return { dex: m.dex, element: m.element, region: m.region, rank: m.rank, family: m.family, wants: m.wants, prefab };
});
