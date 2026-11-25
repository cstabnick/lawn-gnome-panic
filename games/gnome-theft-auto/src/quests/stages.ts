// Stage spots: every place the story and the side quests happen, as plain data a cutscene can be staged in.
//
// A Stage is one environment on the real map: where it is, which way it faces, where the camera can stand, where each
// character stands (marks), where they walk while idle (walks), which vehicles are parked or pull up there and the
// drivable paths in and out. `set` lists the prefab set dressing built at the spot by stageSets.ts.
// Design notes for each place (what it looks and sounds like, who does what there) are in
// docs/design/gnome-theft-auto/environments.md. stages.test.ts checks every spot against the built world: inside the
// map, on land (unless the stage is a boat scene), out of building colliders, cameras with a clear view, and vehicle
// paths that follow roads without driving through anything.
//
// Conventions: world x/z in metres. yaw 0 faces +z (south), PI/2 faces +x (east), PI faces -z (north): the game's
// forward vector is (sin yaw, cos yaw). Heights in camera spots are metres ABOVE the ground at that x/z.
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { CLOVERFIELD_STAGES } from './stages/cloverfield';
import { EAST_STAGES } from './stages/east';
import type { CastMember, Stage, VehicleMark } from './stages/kit';
import { TURFTON_STAGES } from './stages/turfton';
import { TURFTON_B_STAGES } from './stages/turftonB';
import { TURFTON_C_STAGES } from './stages/turftonC';
import { WILDS_STAGES } from './stages/wilds';
import { SPEEDWAY_STAGES } from './stages/speedway';
import { PEBBLEWICK_STAGES } from './stages/pebblewick';
import { COAST_STAGES } from './stages/coast';
import { WINTER_STAGES } from './stages/winter';
import { DIRT_STAGES } from './stages/dirt';
import { STREET_STAGES } from './stages/street';
import { GOLF_STAGES } from './stages/golf';
import { ROOTWELL_STAGES } from './stages/rootwell';
import { COUNTRY_STAGES } from './stages/country';
import type { CutsceneRoom } from './types';

export * from './stages/kit';

// ---- The cast ------------------------------------------------------------------------------------------------------

export const CAST: readonly CastMember[] = [
  {
    id: 'pip', name: 'Pip "Two-Stroke" Potsworth', preset: 'pip', home: 'side-valve-bay',
    haunts: ['bus-stop', 'bodega-front', 'birdbath-basin', 'dust-safehouse', 'meridian-finale'],
    routine: 'Sleeps on a cot behind the Side-Valve parts shelves, meets every snail-coach at the bus stop looking for marks, buys Acorn-Cola at Bodega & Sons, tinkers with his Zero-Turn until it backfires.',
    vehicle: { kind: 'zero-turn', parkedAt: 'pip-zero-turn', note: 'His own red Zero-Turn, primer patches and a toolbox strapped on; the push-bike in the prologue is borrowed.',
      glaze: { paint: 0xc82828, finish: 'primer', exhaust: 'twin', extras: ['toolbox', 'mudflaps'], ornament: 'acorn', tyre: 'knobbly' } },
  },
  {
    id: 'tansy', name: 'Tansy "Side-Valve" Clayfoot', preset: 'tansy', home: 'side-valve-bay',
    haunts: ['dust-safehouse', 'culvert-under-deck', 'meridian-finale'],
    routine: 'Opens the bay at dawn with chicory coffee, works under a smoking Zero-Turn all day, counts the forty-seven wrenches before locking up; from chapter 4 runs the crew out of the Dust Flats safehouse.',
    vehicle: { kind: 'zero-turn', parkedAt: 'tansy-zero-turn', note: 'The smoking orange Zero-Turn always on the bay apron, never quite fixed.',
      glaze: { paint: 0xf08a24, finish: 'matte', exhaust: 'stack', extras: ['toolbox'], ornament: 'trowel', rim: 'deepdish', rimColor: 0x2f353d } },
  },
  {
    id: 'vesper', name: 'Vesper "The Glazier" Thorne', preset: 'vesper', home: 'glaze-tax-office',
    haunts: ['patio-gallery', 'patio-gate', 'south-highway-diner', 'meridian-finale'],
    routine: 'Inspects the Patio Heights astroturf at 06:00 with calipers, holds office hours at the Glaze & Tax counter under Thorne Tower, dines alone at the South Highway diner when he wants a meeting to look casual.',
    vehicle: { kind: 'lowrider', parkedAt: 'vesper-lowrider', note: 'A pearl-white Lowrider, gold rims, never a speck of mud; the HOA vans and the Grand Combine do his dirty driving.',
      glaze: { paint: 0xf8f8fa, finish: 'pearl', rim: 'spinner', rimColor: 0xc9a227, bumper: 'chrome', tyre: 'whitewall', ornament: 'hat', underglow: 0xc9a227 } },
  },
  {
    id: 'don-compost', name: 'Don Compost', home: 'mulch-club-door', haunts: [],
    routine: 'Never seen outside before dark. Arrives at the Mulch Club side door at dusk in his black Lowrider, two bodyguards first, then him; leaves at dawn.',
    vehicle: { kind: 'lowrider', parkedAt: 'don-lowrider', note: 'Gloss black Lowrider, whitewalls, chrome bumper, a bodyguard always leaning on it.',
      glaze: { paint: 0x141414, finish: 'gloss', tyre: 'whitewall', bumper: 'chrome', rim: 'mesh', rimColor: 0xd9d9d9, lamp: 'round', beam: 'warm' } },
  },
  {
    id: 'granny', name: 'Granny Gnertrude', preset: 'granny', home: 'granny-barn',
    haunts: ['meridian-finale'],
    routine: 'Bakes at dawn, weighs fenced Fescue relics on the kitchen scale all morning, sits on the porch with the double-barrel over her pumpkins in the afternoon.',
    vehicle: { kind: 'ride-on', parkedAt: 'granny-ride-on', note: 'A lilac Ride-On with a hay seat, a cowcatcher and a cooler of pies.',
      glaze: { paint: 0x8e44ad, finish: 'patina', seat: 'hay', bumper: 'cowcatcher', extras: ['cooler', 'bunting'], horn: 'moo' } },
  },
  {
    id: 'juniper', name: 'Councilwoman Juniper "The Trowel" Vance', preset: 'juniper', home: 'city-hall-steps',
    haunts: ['meridian-finale'],
    routine: 'Gives a press statement on the City Hall steps every noon, paces between the flagpoles reading petitions, drives home past Bodega & Sons at dusk.',
    vehicle: { kind: 'ride-on', parkedAt: 'juniper-ride-on', note: 'Navy pearl Ride-On with a flag on the back, kept spotless to annoy her brother.',
      glaze: { paint: 0x2f5a8f, finish: 'pearl', extras: ['flag'], ornament: 'trowel', tyre: 'whitewall' } },
  },
  {
    id: 'mayor-mulch', name: 'Mayor Barnaby "Two-Coat" Mulch', home: 'city-hall-steps', haunts: ['patio-gallery'],
    routine: 'Cuts ribbons in the morning, naps in his office after lunch, slips out to Patio Heights after dark.',
    vehicle: { kind: 'ride-on', parkedAt: 'mayor-ride-on', note: 'Candy-red Ride-On on its second coat (a third after the finale), bunting, a bell.',
      glaze: { paint: 0xc21f2a, finish: 'candy', extras: ['bunting', 'bell'], bumper: 'chrome', seat: 'throne' } },
  },
  {
    id: 'reginald', name: 'Reginald "Quarter-Inch" Vance', preset: 'reginald', home: 'amphitheater', haunts: ['granny-barn', 'city-hall-steps'],
    routine: 'Measures grass with a laser level at 3:00, writes citations until noon, chairs HOA tribunals at the Amphitheater; whistles up a Code-Enforcement Van when anyone argues.',
    vehicle: { kind: 'hoa-van', parkedAt: 'reginald-van', note: 'An HOA Code-Enforcement Van with his calipers on the dashboard.',
      glaze: { paint: 0xf4f1e6, finish: 'gloss', decal: 'none', lamp: 'square', beam: 'xenon', horn: 'siren' } },
  },
  {
    id: 'diggs', name: 'Commander Diggs', preset: 'diggs', home: 'fort-sandpit-gate', haunts: ['dust-safehouse', 'meridian-finale'],
    routine: 'Inspects the sandbag line at dawn, drills the Spade Guard on the parade square at noon, sits on the gatehouse step polishing his trowels at dusk.',
    vehicle: { kind: 'zero-turn', parkedAt: 'diggs-zero-turn', note: 'Olive matte Zero-Turn with a roo-bar; he tears out of the gate on it in chapter 4.',
      glaze: { paint: 0x4b6329, finish: 'matte', bumper: 'log', extras: ['roobar', 'flag'], tyre: 'knobbly', lamp: 'bar' } },
  },
  {
    id: 'bracken', name: 'Elder Bracken', preset: 'bracken', home: 'unmowed-hollow', haunts: ['meridian-finale'],
    routine: 'Walks the standing-stone ring at dawn, sits in judgement by the fire, refuses to touch anything with an engine. Rides nothing.',
    vehicle: null,
  },
  {
    id: 'sorrel', name: 'Sorrel Tillbrook', preset: 'sorrel', home: 'sorrel-radio-booth', haunts: ['unmowed-hollow'],
    routine: 'Broadcasts 88.7 Fescue Public Radio from a booth of crates in the hollow: tapes rain at dawn, reads the news at noon, plays forty-five minutes of rain on terracotta at night.',
    vehicle: null,
  },
  {
    id: 'loam', name: 'Father Loam', preset: 'loam', home: 'birdbath-basin', haunts: ['kiln-shrine', 'chapel-van'],
    routine: 'Preaches from his "snowmobile" on the frozen birdbath at dawn, mixes Kiln-Resin by the stove all day, walks up to the northern shrine to bless the resin at dusk.',
    vehicle: { kind: 'ride-on', parkedAt: 'loam-snowmobile', note: 'His "snowmobile": a Ride-On on spiked tyres with candle lamps and a bell. His old Chapel of Mulch van rots in Mossy Wood.',
      glaze: { paint: 0x3c5266, finish: 'patina', tyre: 'spiked', lamp: 'candle', beam: 'amber', extras: ['bell'], seat: 'cosy' } },
  },
  {
    id: 'wally', name: 'Wind-Sock Wally', preset: 'wally', home: 'airfield-apron', haunts: [],
    routine: 'Sits in a lawn chair at the end of the runway with binoculars, reads the windsock out loud, refuels Crop Dusters, stirs a chili pot nobody may fly over.',
    vehicle: { kind: 'plane', parkedAt: 'wally-crop-duster', note: 'The Crop Duster on the apron is his; he lends it to anybody who can say the stall speed.' },
  },
  {
    id: 'driftwood', name: 'Driftwood', preset: 'driftwood', home: 'loch-dock', haunts: ['driftwood-trailer', 'canal-raft'],
    routine: 'Six months lashed to a lawn-boat trailer in Cloverfield, then the canal, then the Loch Moss dock, always watching the water for Tessie and for the high-tide bell.',
    vehicle: { kind: 'walnut-dinghy', parkedAt: 'driftwood-dinghy', note: 'A walnut-shell dinghy tied up at the Loch Moss dock; his turf-raft lives on the canal.',
      glaze: { paint: 0x4f9d92, finish: 'patina' } },
  },
  {
    id: 'bodega', name: 'John Bodega', preset: 'bodega', home: 'bodega-front', haunts: [],
    routine: 'Behind the counter of Bodega & Sons from dawn to late shift, sweeps clay dust off the step at dusk; Asphalt the cat sits on the crate by the neon window.',
    vehicle: { kind: 'push-bike', parkedAt: 'bodega-bike', note: 'A delivery Push-Mower Bike with a crate on the back, chained to the drainpipe.',
      glaze: { paint: 0x3b7a57, finish: 'gloss', extras: ['cooler'], horn: 'bell' } },
  },
  {
    id: 'big-lou', name: 'Big Lou', preset: 'big lou', home: 'gnomecino-door', haunts: [],
    routine: 'Works the velvet rope of The Gnomecino from dusk to dawn, towels every hat that comes in, naps in the back booth at noon.',
    vehicle: { kind: 'lowrider', parkedAt: 'lou-lowrider', note: 'Matte black Lowrider with a microfibre-towel seat, parked by the rope.',
      glaze: { paint: 0x23262e, finish: 'matte', tyre: 'whitewall', seat: 'cosy', lamp: 'cateye', underglow: 0x7cf0ff } },
  },
  {
    id: 'brenda', name: 'Baroness Brenda', preset: 'brenda', home: 'brenda-throne', haunts: [],
    routine: 'Holds court on her zip-tied lounger throne by the canal all day, reviews her Push-Mower Bike gang at noon, proclaims new laws at dusk.',
    vehicle: { kind: 'push-bike', parkedAt: 'brenda-bike', note: 'Glitter-gold Push-Mower Bike with a flamingo ornament; her gang rides the same in pink.',
      glaze: { paint: 0xd4a04a, finish: 'glitter', ornament: 'flamingo', extras: ['flag', 'bunting'], horn: 'kazoo' } },
  },
  {
    id: 'clara', name: 'Clara', preset: 'clara', home: 'tall-house-porch', haunts: [],
    routine: 'Lights the porcelain lanterns on the Tall House Porch at dusk, counts escaped porcelain gnomes at the porch step, never leaves the porch boards.',
    vehicle: { kind: 'lowrider', parkedAt: 'clara-lowrider', note: 'The shock-absorbed Lowrider she lends for refugee runs: pearl white, cosy seat, slammed soft.',
      glaze: { paint: 0xe6e8f0, finish: 'pearl', seat: 'cosy', rideHeight: -0.6, tyre: 'balloon' } },
  },
  {
    id: 'mossley', name: 'Mossley "Plumb-Line" Inkcap', preset: 'mossley', home: 'bodega-front', haunts: ['culvert-under-deck'],
    routine: 'Sits at a folding table outside Bodega & Sons with survey maps, walks the grid with a plumb-line at noon, stares into the culvert at night.',
    vehicle: { kind: 'push-bike', parkedAt: 'mossley-bike', note: 'Push-Mower Bike with a windsock and a survey flag.',
      glaze: { paint: 0x3b6ea5, finish: 'matte', extras: ['windsock', 'flag'] } },
  },
  {
    id: 'burt', name: 'Burt', preset: 'burt', home: 'clay-mart-lot', haunts: ['bodega-front'],
    routine: 'Ex-HOA citation writer. Lives in his decommissioned van behind Clay-Mart, drinks coffee outside Bodega & Sons, rereads old citations.',
    vehicle: { kind: 'hoa-van', parkedAt: 'burt-van', note: 'A decommissioned HOA van in primer, the badge scraped off.',
      glaze: { paint: 0x9a9a92, finish: 'primer', extras: ['mudflaps'] } },
  },
  {
    id: 'cedric', name: 'Cedric "Double-Bag" Peat', preset: 'cedric', home: 'bodega-front', haunts: ['compost-heap'],
    routine: 'Pitches "Artisanal Miracle Mulch" outside Bodega & Sons, refills it with dyed sawdust at the Compost Heap after dark.',
    vehicle: { kind: 'mulch-spreader', parkedAt: 'cedric-spreader', note: 'A glitter-purple Mulch-Spreader leaking craft glitter.',
      glaze: { paint: 0x8e44ad, finish: 'glitter', extras: ['bunting'] } },
  },
  {
    id: 'bramble', name: 'Farmer Bramble', preset: 'bramble', home: 'granny-barn', haunts: ['biscuits-nap', 'south-barn'],
    routine: 'Ploughs the Cloverfield rows at dawn, checks the rim of Biscuit\'s Nap for paw tracks at noon, drinks with Granny on the porch at dusk.',
    vehicle: { kind: 'combine', parkedAt: 'bramble-combine', note: 'A Buck-Iron Combine, green and gold, the one everybody borrows.',
      glaze: { paint: 0x2f6b3a, finish: 'gloss', decalColor: 0xd4a04a } },
  },
  {
    id: 'shelldon', name: 'Shelldon "No-Trail" Mucilage', preset: 'shelldon', home: 'shelldon-alley', haunts: ['snail-paddock', 'birdbath-basin'],
    routine: 'Never steps on a paved road. Feeds his courier snails in the dumpster alley at dawn, sends scrolls all day, scouts the downtown slug paddock at night.',
    vehicle: { kind: 'snail-coach', parkedAt: 'shelldon-coach', note: 'A retired snail-coach he lives in; it never leaves the alley.',
      glaze: { paint: 0x7a8a78, finish: 'patina' } },
  },
  {
    id: 'midge', name: 'Squeaky-Clean Midge', home: 'glaze-clinic', haunts: [],
    routine: 'Paces outside the Glaze Clinic doors between patients at 140 BPM, re-glazes anyone the ambulance brings in.',
    vehicle: null,
  },
  {
    id: 'gary', name: 'Gate-Guard Gary', home: 'patio-gate', haunts: [],
    routine: 'Reads a 900-page HOA binder in the sentry box all day, waves luxury Zero-Turns through, sighs at push-bikes.',
    vehicle: null,
  },
  {
    id: 'rooster', name: 'Rooster "Squall-Box" Weatherby', home: 'rooster-windmill', haunts: [],
    routine: 'Roosts on the windmill platform shouting barometric prophecies through a tin funnel; climbs down only for seed.',
    vehicle: null,
  },
  {
    id: 'frank', name: 'Fence-Post Frank', home: 'south-highway-diner', haunts: [],
    routine: 'Leans on his hand-painted sign by the South Highway all day, waving at convoys, eats every meal at the diner counter.',
    vehicle: null,
  },
  {
    id: 'ernie', name: 'Ash-Shovel Ernie', home: 'compost-heap', haunts: [],
    routine: 'Stokes the mulch furnace and roasts chestnuts on a trowel, humming Fescue work-songs.',
    vehicle: null,
  },
  {
    id: 'theo', name: 'Thermos Theo', home: 'theo-camp', haunts: ['birdbath-basin'],
    routine: 'Keeps the pine-cone barrel burning, pours tea for anyone who reaches the basin, holds Shelldon\'s scrolls for collection.',
    vehicle: null,
  },
  {
    id: 'nora', name: 'Knot-Hole Nora', home: 'knot-hole', haunts: [],
    routine: 'Sits on an overturned thimble and watches the neighbour\'s yard through the knot-hole with a brass spyglass.',
    vehicle: null,
  },
  {
    id: 'sal', name: 'Silt-Diver Sal', home: 'culvert-under-deck', haunts: [],
    routine: 'Fishes acorns and magazines out of the storm grates with a magnet on a string; knows every pipe of the Under-Deck.',
    vehicle: null,
  },
  {
    id: 'nina', name: 'Neon-Moth Nina', home: 'greenhouse-strip', haunts: ['gnomecino-door'],
    routine: 'Sells glow-stick hat-bands from a flowerpot stoop under the grow-lamps all night, shoos the giant moth off the Gnomecino sign.',
    vehicle: { kind: 'push-bike', parkedAt: 'nina-bike', note: 'Push-Mower Bike strung with fairy lights, glow tyres and violet underglow.',
      glaze: { paint: 0x2b1f3a, finish: 'holo', tyre: 'glow', extras: ['fairylights'], underglow: 0x8e44ad } },
  },
  {
    id: 'turncoat-cam', name: 'Turncoat Cam', home: 'side-valve-bay', haunts: ['patio-gate'],
    routine: 'Used to sweep the Side-Valve bay; after chapter 3 races for a Patio Heights charter and parks at the gate.',
    vehicle: { kind: 'zero-turn', parkedAt: 'cam-zero-turn', note: 'Chameleon-finish Zero-Turn with a fin spoiler, bought with the reward money.',
      glaze: { paint: 0xf4f4f8, finish: 'chameleon', spoiler: 'fin', rim: 'turbine', underglow: 0xffffff } },
  },
  {
    id: 'dot', name: 'Dorrit "Dot" Pennywort', preset: 'dot', home: 'kerb-exchange', haunts: ['bus-stop'],
    routine: 'Opens the Exchange with the first snail-coach, punches a ticket for every job, eats lunch on the bus-stop bench, closes when the board is empty, which it never is.',
    vehicle: null,
  },
  {
    id: 'hedda', name: 'Hedda Galley', preset: 'hedda', home: 'kerb-exchange', haunts: ['city-hall-steps'],
    routine: 'Reads every job slip on the Exchange board before the first coffee, then walks the Hall steps with a pencil behind one ear.',
    vehicle: null,
  },
  {
    id: 'grout', name: 'Union Boss "Big Wrench" Grout', preset: 'grout', home: 'clay-mart-lot', haunts: [],
    routine: 'Holds the morning shift meeting in the Clay-Mart returns yard, then sits on the loading dock with a thermos until the van is loaded.',
    vehicle: null,
  },
  {
    id: 'mabel', name: 'Mabel Kerbstone', home: 'bus-stop', haunts: [],
    routine: 'Drives the one Turfton Taxi; every fare ends at the Central Bus Stop.',
    vehicle: null,
  },
];

// ---- The stages ----------------------------------------------------------------------------------------------------

export const STAGES: readonly Stage[] = [...TURFTON_STAGES, ...TURFTON_B_STAGES, ...TURFTON_C_STAGES, ...CLOVERFIELD_STAGES, ...WILDS_STAGES, ...EAST_STAGES, ...SPEEDWAY_STAGES, ...PEBBLEWICK_STAGES, ...COAST_STAGES, ...WINTER_STAGES, ...DIRT_STAGES, ...STREET_STAGES, ...GOLF_STAGES, ...ROOTWELL_STAGES, ...COUNTRY_STAGES];

export function stageById(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}

export function castById(id: string): CastMember | undefined {
  return CAST.find((c) => c.id === id);
}

/** Every stage a quest (or named cutscene) uses. */
export function stagesFor(questId: string): Stage[] {
  return STAGES.filter((s) => s.usedBy.includes(questId));
}

/** The in-world stage that is the outside of an off-map cutscene room. */
export function stageForRoom(room: CutsceneRoom): Stage | undefined {
  return STAGES.find((s) => s.room === room);
}

/** A vehicle mark by id, searching every stage. */
export function vehicleMark(id: string): { stage: Stage; mark: VehicleMark } | undefined {
  for (const stage of STAGES) {
    const m = stage.vehicles.find((v) => v.id === id);
    if (m) return { stage, mark: m };
  }
  return undefined;
}

/**
 * The colliders of every stage's solid set props, as world boxes (absolute top heights): the set builder adds them to
 * the world's boxes, and stages.test.ts checks marks and paths against them. A prop's solid half-extents turn with its
 * yaw; the box is the axis-aligned bound of the turned rectangle.
 */
export function stageSetBoxes(): Box[] {
  const out: Box[] = [];
  for (const s of STAGES) {
    for (const p of s.set) {
      if (!p.solid) continue;
      const [hw, hd, h] = p.solid;
      const c = Math.abs(Math.cos(p.yaw)), sn = Math.abs(Math.sin(p.yaw));
      const ex = hw * c + hd * sn, ez = hw * sn + hd * c;
      const [x, z] = p.at;
      out.push({ minX: x - ex, maxX: x + ex, minZ: z - ez, maxZ: z + ez, h: heightAt(x, z) + h });
    }
  }
  return out;
}
