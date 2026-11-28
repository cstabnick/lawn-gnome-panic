// Where every character lives and works (E10, L58), from the character bible's "Homes and workplaces" table
// (docs/design/gnome-theft-auto/characters.md). Story epics (E20-E22) use homeOf / workOf / homeDoor for pick-up and
// drop-off objectives. Pure data; homes.test.ts checks it. Contract: docs/roadmaps/gta-batch-3/E10/contracts.md.
import { HOSPITAL } from '../config';
import { stageById } from '../quests/stages';
import { BANK_COUNTER, HOME_DOORS, SAUCER_COURT, type HomeDef, type WorkDef } from './types';

/** A stage's centre as a front-door spot [x, z, yaw 0] (the stage is already in the game). */
function stageDoor(id: string): [number, number, number] {
  const s = stageById(id);
  if (!s) throw new Error(`homes: no stage ${id}`);
  return [s.center[0], s.center[1], 0];
}
/** A home that is an existing stage. */
function atStage(characterId: string, name: string, stage: string): HomeDef {
  return { characterId, name, where: `stage:${stage}`, door: stageDoor(stage), kind: 'existing', acknowledged: true };
}
/** A home an area epic builds on its site later (it calls registerHome with a door). */
function onSite(characterId: string, name: string, site: string): HomeDef {
  return { characterId, name, where: `site:${site}`, door: null, kind: 'site', acknowledged: true };
}
/** A home that exists only as a data row; `stage` names an existing stage nearby, if any. */
function hidden(characterId: string, name: string, stage: string | null = null): HomeDef {
  return { characterId, name, where: stage ? `stage:${stage}` : null, door: null, kind: 'hidden', acknowledged: false };
}
/** A workplace that is a stage. */
function workStage(characterId: string, name: string, stage: string): WorkDef {
  const s = stageById(stage);
  if (!s) throw new Error(`homes: no stage ${stage}`);
  return { characterId, name, at: [s.center[0], s.center[1]], stage };
}
const noWork = (characterId: string, name: string): WorkDef => ({ characterId, name, at: null });

const SC_DOOR: [number, number, number] = [SAUCER_COURT.exit.x, SAUCER_COURT.exit.z, SAUCER_COURT.exit.yaw];

/** One row per character (bible order). Rows E10 builds have a `door`; other rows are filled from the bible table. */
const ROWS: HomeDef[] = [
  { characterId: 'player', name: 'Flat 3B, Saucer Court', where: 'saucer-court', door: SC_DOOR, kind: 'flat', acknowledged: true, interiorId: 'flat-3b', plate: '3B' },
  { characterId: 'juniper', name: 'a narrow terrace on Kerb Row', where: 'home-01', door: [...HOME_DOORS.juniper], kind: 'facade', acknowledged: true, plate: 'J. VANCE' },
  { characterId: 'mayor-mulch', name: "the Mayor's Residence, Patio Heights", where: 'home-02', door: [...HOME_DOORS['mayor-mulch']], kind: 'facade', acknowledged: true, plate: 'THE MAYOR\nPLEASE KNOCK LOUDLY' },
  { characterId: 'reginald', name: 'townhouse 404, Patio Heights', where: 'home-03', door: [...HOME_DOORS.reginald], kind: 'interior', acknowledged: true, interiorId: 'townhouse-404', plate: '404\nR. VANCE' },
  { characterId: 'mabel', name: 'the flat over the Kerbstone Cabs garage', where: 'home-04', door: [...HOME_DOORS.mabel], kind: 'facade', acknowledged: true, plate: 'M. KERBSTONE\nFLAT ABOVE' },
  { characterId: 'sorrel', name: 'the cottage behind her radio booth, Mossy Wood', where: 'home-05', door: [...HOME_DOORS.sorrel], kind: 'facade', acknowledged: true, plate: 'SORREL\nON AIR? KNOCK LATER' },
  { characterId: 'diggs', name: 'a tin bungalow in Pebblewick', where: 'home-06', door: [...HOME_DOORS.diggs], kind: 'interior', acknowledged: true, interiorId: 'diggs-bungalow', plate: 'DIGGS' },
  { characterId: 'frank', name: 'the shack behind the south welcome sign', where: 'home-07', door: [...HOME_DOORS.frank], kind: 'facade', acknowledged: true, plate: 'FRANK\nNO SOLICITORS\nNO SOLICITING EITHER' },
  { characterId: 'hyssop', name: 'Saucer Court flat 3A', where: 'saucer-court', door: SC_DOOR, kind: 'facade', acknowledged: true, plate: '3A' },
  // ---- the rest of the bible, in bible order ----
  atStage('pip', "a hammock in Side-Valve's back office", 'side-valve-bay'), // from #39: the player's couch at Saucer Court
  atStage('tansy', 'the Loft above Side-Valve Salvage', 'side-valve-bay'), // act III: the Under-Deck culvert
  hidden('turncoat-cam', "a cot in Side-Valve's storeroom", 'side-valve-bay'), // later: HOA rental, Patio Heights; lockup in the Double Pot (#62)
  // thorne-tower is not a stage: the Glaze Tax Office stands in for it
  atStage('vesper', 'the penthouse of Thorne Tower', 'glaze-tax-office'),
  hidden('don-compost', 'rooms above the Mulch Club', 'mulch-club-door'),
  hidden('big-lou', 'a flat behind the Gnomecino', 'gnomecino-door'),
  hidden('big lou', 'a flat behind the Gnomecino', 'gnomecino-door'), // CITY_CAST key spelling of big-lou
  atStage('granny', "Granny Gnertrude's Farmhouse", 'granny-barn'),
  atStage('bramble', "the bunkhouse at Granny's barn", 'granny-barn'),
  atStage('bodega', 'the flat above Bodega & Sons', 'bodega-front'),
  atStage('bracken', 'a root-house in the Unmowed Hollow', 'unmowed-hollow'),
  atStage('loam', 'a snowmobile shed, Frozen Birdbath Basin', 'birdbath-basin'),
  atStage('theo', "Theo's camp at the bend", 'theo-camp'),
  atStage('wally', 'a caravan at the airfield apron', 'airfield-apron'),
  atStage('driftwood', "Driftwood's trailer", 'driftwood-trailer'), // from #43: a beach hut on Saltbucket Boardwalk (site:coast)
  atStage('brenda', 'the Vinyl Lounge throne, New Puddle', 'brenda-throne'),
  atStage('clara', 'a hollow log by the Tall House porch', 'tall-house-porch'),
  hidden('mossley', 'a chalk-marked basement on Kerb Row'),
  hidden('burt', 'a room above Clay-Mart'),
  atStage('cedric', 'the rusted Chapel van', 'chapel-van'),
  atStage('shelldon', 'a den behind the dumpsters', 'shelldon-alley'),
  hidden('midge', "the nurses' dorm, Glaze Clinic"),
  atStage('gary', 'the gatehouse at the Patio Gate', 'patio-gate'),
  atStage('rooster', 'the Squall-Box windmill', 'rooster-windmill'),
  atStage('ernie', 'the furnace room at the Compost Heap', 'compost-heap'),
  atStage('nora', 'the Knot-Hole', 'knot-hole'),
  atStage('sal', 'the Under-Deck culvert', 'culvert-under-deck'),
  atStage('nina', 'the Greenhouse Strip', 'greenhouse-strip'),
  hidden('dot', 'a room over the Kerbside Exchange'),
  hidden('hedda', 'a flat high in the Tattler Building'),
  hidden('grout', 'the back room, Local 404 Union Hall'),
  // the bible's `pebblewick` is not a stage: pebblewick-plots stands in for it
  atStage('yarrow', "the reeve's house, Pebblewick square", 'pebblewick-plots'),
  hidden('parsley', "a bedsit off the bank's back stair"),
  onSite('chard', 'a site caravan at an Even-Estates site', 'construction-1'),
  hidden('cardoon', 'a flat over the laundrette by the court'),
  onSite('fennel', "a hammock under the Gutter Bowls' deck", 'skate-park'),
  onSite('hogweed', 'a workshop-hammock in the Underspan', 'skyway-under'), // bible: site:skyway-society
  // the bible's `speedway` is not a stage: speedway-pits stands in for it
  atStage('lulu', 'a converted car-wash bay, Lost & Found Speedway', 'speedway-pits'),
  atStage('sage', 'a room above the Route South Acorn Diner', 'south-highway-diner'),
  hidden('cass', "a flat over the Pay 'n' Glaze paint store"), // E20 (L106): never shown
  onSite('chicory', "a gardener's lodge at the vineyard gate", 'vineyard'),
  onSite('wisteria', 'Brassknock Manor', 'mansion'),
  onSite('saxifrage', "the big tent at Wader's Rest", 'cult-camp'),
  onSite('nubbin', "his family's burrow in Loamdeep", 'mole-entrance'), // mole halls (E17)
  onSite('tumblesoil', "the Mother's Hall, Loamdeep", 'mole-entrance'), // mole halls (E17)
  onSite('peony', 'rooms above the Hedgeworth Clubhouse', 'golf-yard'),
  onSite('basil', "the pro's cottage by the first tee", 'golf-yard'),
  onSite('thrift', "a groundskeeper's shed by the ninth green", 'golf-yard'),
  onSite('gentian', 'the Woolly Sock Lodge', 'ski-hill'),
  onSite('chanterelle', 'a hut in a hollow toadstool stalk', 'toadstool-forest'),
  onSite('ragwort', 'the control hut on Pinwheel Ridge', 'wind-farm'),
  onSite('clary', "the starter's tower at the Dirt Bowl", 'dirt-track'),
  onSite('betony', 'a staff room in the Anthill Observatory', 'observatory-mound'),
  onSite('lovage', "the Dean's lodge on the quad", 'campus'),
  onSite('samphire', "the captain's cabin, the Bathtub Queen", 'pirate-ship'),
  onSite('marram', 'a hut on Long Spoon Pier', 'boardwalk'), // bible: site:coast
];

const WORK_ROWS: WorkDef[] = [
  { characterId: 'player', name: 'the crew; Side-Valve Salvage', at: null, stage: 'side-valve-bay' },
  workStage('pip', 'Side-Valve Salvage', 'side-valve-bay'),
  workStage('tansy', 'Side-Valve Salvage', 'side-valve-bay'),
  workStage('turncoat-cam', 'Side-Valve sweeper; Patio Gate valet', 'side-valve-bay'),
  workStage('vesper', 'Thorne Lawn & Order; the HOA; the Double Pot sales floor', 'glaze-tax-office'), // thorne-tower is not a stage
  workStage('don-compost', 'the Mulch Club', 'mulch-club-door'),
  workStage('big-lou', 'the Gnomecino door', 'gnomecino-door'),
  workStage('big lou', 'the Gnomecino door', 'gnomecino-door'), // CITY_CAST key spelling of big-lou
  workStage('granny', 'her barn and bake shop', 'granny-barn'),
  noWork('bramble', "Granny's fields"),
  { characterId: 'juniper', name: 'City Hall', at: [8, -70], stage: 'city-hall-steps' },
  workStage('reginald', 'HOA audit office, Thorne Tower', 'glaze-tax-office'), // thorne-tower is not a stage
  { characterId: 'mayor-mulch', name: 'City Hall', at: [8, -70], stage: 'city-hall-steps' },
  { characterId: 'mabel', name: 'Kerbstone Cabs; Central Bus Stop kiosk', at: [-6.25, 14], stage: 'bus-stop' },
  workStage('bodega', 'Bodega & Sons', 'bodega-front'),
  workStage('diggs', 'Fort Sandpit', 'fort-sandpit-gate'),
  workStage('bracken', 'the Unmowed', 'unmowed-hollow'),
  workStage('sorrel', '88.7 Fescue Public Radio booth', 'sorrel-radio-booth'),
  workStage('loam', 'chapel-van; Kiln-Resin shrine', 'chapel-van'),
  workStage('theo', "the bend's fire and post", 'theo-camp'),
  workStage('wally', "Wally's Charters", 'airfield-apron'),
  noWork('driftwood', 'tube hut, Saltbucket Boardwalk'),
  workStage('brenda', 'New Puddle', 'brenda-throne'),
  workStage('clara', 'the porcelain refuge', 'tall-house-porch'),
  noWork('mossley', 'his survey markers'),
  workStage('burt', 'ex-HOA; Clay-Mart lot', 'clay-mart-lot'),
  workStage('cedric', 'Chapel of Mulch recruiter', 'chapel-van'),
  workStage('shelldon', 'snail-post courier', 'shelldon-alley'),
  { characterId: 'midge', name: 'Glaze Clinic Hospital', at: [HOSPITAL.x, HOSPITAL.z], stage: 'glaze-clinic' },
  workStage('gary', 'the Patio Gate', 'patio-gate'),
  workStage('rooster', 'his forecasts', 'rooster-windmill'),
  workStage('frank', 'the highway; the diner counter', 'south-highway-diner'),
  workStage('ernie', 'the Compost Heap furnace', 'compost-heap'),
  workStage('nora', 'the Knot-Hole', 'knot-hole'),
  workStage('sal', 'salvage diving', 'culvert-under-deck'),
  workStage('nina', 'the Gnomecino floor', 'greenhouse-strip'),
  workStage('dot', 'the Kerbside Exchange', 'kerb-exchange'),
  noWork('hedda', 'the Turfton Tattler'),
  noWork('grout', 'Local 404, the Skyway'),
  workStage('yarrow', 'Pebblewick', 'pebblewick-plots'), // pebblewick is not a stage
  noWork('hyssop', 'watches the stairwell (retired crossing warden)'),
  { characterId: 'parsley', name: 'First Kiln Bank', at: [BANK_COUNTER.x, BANK_COUNTER.z] },
  noWork('chard', 'Levelright Construction'),
  noWork('cardoon', 'Drainpipe Court'),
  noWork('fennel', 'the Gutter Bowls; Bodega deliveries'),
  noWork('hogweed', 'the Underspan workshops'),
  workStage('lulu', 'the Carburettors; Rutbottom in summer', 'speedway-pits'), // speedway is not a stage
  workStage('sage', 'the diner kitchen (chef-job employer)', 'south-highway-diner'),
  workStage('cass', "the Pay 'n' Glaze custom shop", 'pay-n-glaze'),
  noWork('chicory', 'Trellisdown Vineyard'),
  noWork('wisteria', 'Trellisdown Vineyard'),
  noWork('saxifrage', 'the Flock'),
  noWork('nubbin', 'Loamdeep post runner'),
  noWork('tumblesoil', 'keeps Loamdeep'),
  noWork('peony', 'Hedgeworth Links'),
  noWork('basil', 'Hedgeworth pro shop'),
  noWork('thrift', 'Hedgeworth grounds'),
  noWork('gentian', 'Snowdrop Slope'),
  noWork('chanterelle', 'warden of Capwood'),
  noWork('ragwort', 'Pinwheel Ridge'),
  noWork('clary', 'Rutbottom Dirt Bowl'),
  noWork('betony', 'Rootwell University'),
  noWork('lovage', 'Rootwell University'),
  noWork('samphire', 'the Bathtub Queen'),
  noWork('marram', 'Saltbucket Boardwalk'),
];

export const HOMES: HomeDef[] = ROWS;
export const WORKS: WorkDef[] = WORK_ROWS;

/** Add or replace a home row (area epics register their site homes). */
export function registerHome(def: HomeDef): void {
  const i = HOMES.findIndex((h) => h.characterId === def.characterId);
  if (i >= 0) HOMES[i] = def;
  else HOMES.push(def);
}

/** Add or replace a workplace row. */
export function registerWork(def: WorkDef): void {
  const i = WORKS.findIndex((w) => w.characterId === def.characterId);
  if (i >= 0) WORKS[i] = def;
  else WORKS.push(def);
}

export function homeOf(characterId: string): HomeDef | undefined {
  return HOMES.find((h) => h.characterId === characterId);
}

export function workOf(characterId: string): WorkDef | undefined {
  return WORKS.find((w) => w.characterId === characterId);
}

/** The spot outside a character's front door [x, z] (for quest `visit` objectives). Throws when the home has no place. */
export function homeDoor(characterId: string): [number, number] {
  const d = homeOf(characterId)?.door;
  if (!d) throw new Error(`homes: ${characterId} has no door in the world`);
  return [d[0], d[1]];
}

/** Acknowledged homes with a door, as places (taxi, jobs, map). */
export function homePlaces(): { id: string; characterId: string; name: string; x: number; z: number }[] {
  return HOMES.filter((h) => h.acknowledged && h.door && h.characterId !== 'player')
    .map((h) => ({ id: `home-${h.characterId}`, characterId: h.characterId, name: h.name, x: h.door![0], z: h.door![1] }));
}

/** Short place names for the built homes ("Juniper Vance's terrace"). */
const PLACE_NAMES: Record<string, string> = {
  juniper: "Juniper Vance's terrace",
  'mayor-mulch': "the Mayor's Residence",
  reginald: "Reginald Vance's townhouse",
  mabel: "Mabel's flat",
  sorrel: "Sorrel's cottage",
  diggs: "Diggs' bungalow",
  frank: "Frank's shack",
};

/** Built homes (facade or interior, with a door) as taxi/courier destinations. */
export function homeLandPlaces(): { id: string; name: string; x: number; z: number; area: 'city' | 'outskirts' | 'forest' }[] {
  return HOMES.filter((h) => (h.kind === 'facade' || h.kind === 'interior') && h.door).map((h) => {
    const [x, z] = h.door!;
    const area = h.characterId === 'sorrel' ? 'forest' : Math.abs(x) <= 215 && Math.abs(z) <= 215 ? 'city' : 'outskirts';
    return { id: `home-${h.characterId}`, name: PLACE_NAMES[h.characterId] ?? h.name, x, z, area };
  });
}
