// The Turfton city contracts: five jobs handed out at the Kerbside Exchange (Dot Pennywort's board by the Central Bus
// Stop) for the city's recurring cast. Lore: docs/lore/rulings.md R-147..R-152; roadmap docs/roadmaps/gta-city-lore-quests.md.
// Intros are staged at the Exchange ('kerb-exchange' stage) with Dot and the client; payoffs at the client's own place.
// Scenes: cutscene/scenes/city/. Comms: quests/commsCity.ts. Unlock beats: unlocks.ts. Perks: perks.ts.
import type { GnomeLook } from '@lawn/gnome';
import { PAY_N_GLAZE, THORNE_TOWER } from '../config';
import type { QuestDef } from './types';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const IMPOUND_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xd9c36a };

/** The giver id of the Kerbside Exchange (defs.ts GIVERS). */
export const EXCHANGE_GIVER = 'kerb-exchange';
/** Where the Exchange desk stands (the report-back point of the errands). Same as its giver marker. */
export const EXCHANGE_AT: [number, number] = [-9, 45];

/** Thorne Tower's roof, metres above the ground: the Penthouse Exclusive's last gate hangs just over it. */
const TOWER_TOP = THORNE_TOWER.height;

export const CITY_QUESTS: readonly QuestDef[] = [
  {
    id: 'city-kerbside-rounds',
    title: 'Kerbside Rounds',
    giver: EXCHANGE_GIVER,
    rewardAcorns: 300,
    radioBulletin: 'city-kerbside-rounds',
    cutscene: { kind: 'script', script: 'city-kerbside-rounds-intro' },
    outro: { kind: 'script', script: 'city-kerbside-rounds-outro' },
    objectives: [
      {
        kind: 'visit',
        text: 'Collect the Tattler bundle from John Bodega in the Old Brick Quarter',
        at: [-70, 90],
        radius: 8,
        hint: 'Bodega & Sons (Old Brick Quarter)',
        toastOnEnter: 'John Bodega hands over a bundle of Tattlers. Asphalt the cat does not get up.',
      },
      {
        kind: 'visit',
        text: 'Drop a bundle at Neon-Moth Nina\'s stoop on the Greenhouse Strip',
        at: [55, -43],
        radius: 8,
        hint: 'Nina\'s stoop (Greenhouse Strip)',
        toastOnEnter: 'Nina swaps you a Tattler for a glow-band and points at the moth.',
      },
      {
        kind: 'visit',
        text: 'Pin a notice on the City Hall board for Councilwoman Vance, Downtown',
        at: [8, -70],
        radius: 9,
        hint: 'City Hall steps (Downtown)',
        toastOnEnter: 'Notice pinned: ZONING BOARD MEETS THURSDAY. BRING A CHAIR.',
      },
      {
        kind: 'visit',
        text: 'Report back to Dot at the Kerbside Exchange',
        at: EXCHANGE_AT,
        radius: 7,
        hint: 'Kerbside Exchange (Central Bus Stop)',
      },
    ],
    doneText: 'Dot punches your ticket: you are on the Exchange\'s books now. Every open job in Turfton is on her board (phone: Kerbside Exchange).',
  },
  {
    id: 'city-impound-run',
    title: 'Impound Run',
    giver: EXCHANGE_GIVER,
    prereq: 'city-kerbside-rounds',
    rewardAcorns: 550,
    radioBulletin: 'city-impound-run',
    cutscene: { kind: 'script', script: 'city-impound-run-intro' },
    outro: { kind: 'script', script: 'city-impound-run-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the two HOA impound clerks in the Clay-Mart returns yard',
        targets: [
          { id: 'impound-clerk-1', name: 'Impound Clerk Tare', near: [-134, 144], hint: 'Clay-Mart returns yard (Clay-Mart Industrial)', look: IMPOUND_LOOK },
          { id: 'impound-clerk-2', name: 'Impound Clerk Gross', near: [-127, 157], hint: 'Clay-Mart returns yard (Clay-Mart Industrial)', look: IMPOUND_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Drive Pip\'s impounded Zero-Turn to Pay \'n\' Glaze and respray the HOA tag off',
        vehicleKind: 'zero-turn',
        spawnAt: [-122.5, 158, Math.PI],
        dropAt: [PAY_N_GLAZE.bay.x, PAY_N_GLAZE.bay.z],
        radius: PAY_N_GLAZE.bay.radius + 1,
        hint: 'Pay \'n\' Glaze bay (Ring Blocks)',
        heatOnEnter: 1,
        maxDamage: 0.35,
        banter: [
          'Pip (on the phone): "Mind the paint! Well. Mind the primer."',
          'Pip (on the phone): "It pulls left. Everything I own pulls left."',
        ],
      },
    ],
    doneText: 'Fresh coat, no HOA tag. Pip says park it in Tansy\'s Lock-Up and call the Sling-Lift from your phone any time.',
  },
  {
    id: 'city-glow-band-express',
    title: 'Glow-Band Express',
    giver: EXCHANGE_GIVER,
    prereq: 'city-kerbside-rounds',
    rewardAcorns: 500,
    achievement: 'gta-glow-runner',
    radioBulletin: 'city-glow-band-express',
    cutscene: { kind: 'script', script: 'city-glow-band-express-intro' },
    outro: { kind: 'script', script: 'city-glow-band-express-outro' },
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Run Nina\'s glow-bands across town before the Velvet Toadstools go on',
        vehicle: { kind: 'push-bike', at: [2.5, 52, Math.PI] },
        seconds: 90,
        hint: 'Glow-band round',
        points: [
          { at: [55, -43], radius: 7, label: 'Nina\'s stoop, Greenhouse Strip (the clock starts)' },
          { at: [64, -30], radius: 6, label: 'The Gnomecino velvet rope' },
          { at: [-62, 90], radius: 6, label: 'Bodega & Sons, Old Brick Quarter' },
          { at: [-62.5, -90], radius: 7, label: 'Amphitheater stage door, Park & Arts' },
        ],
      },
    ],
    doneText: 'Every hat in the Amphitheater glows. The Velvet Toadstools play "Don\'t Mow My Baby Down" twice, and argue about it.',
  },
  {
    id: 'city-penthouse-exclusive',
    title: 'Penthouse Exclusive',
    giver: EXCHANGE_GIVER,
    prereq: 'city-kerbside-rounds',
    rewardAcorns: 700,
    achievement: 'gta-front-page',
    radioBulletin: 'city-penthouse-exclusive',
    cutscene: { kind: 'script', script: 'city-penthouse-exclusive-intro' },
    outro: { kind: 'script', script: 'city-penthouse-exclusive-outro' },
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Fly the Tattler\'s Sycamore Copter round Thorne Tower and photograph the penthouse',
        vehicle: { kind: 'sycamore-copter', at: [-22, 45, Math.PI] },
        requireVehicle: 'sycamore-copter',
        hint: 'Thorne Tower fly-by',
        heatOnStart: 1,
        points: [
          { at: [30, -8], height: Math.round(TOWER_TOP * 0.5), radius: 9, label: 'Thorne Tower, south face' },
          { at: [52, -30], height: Math.round(TOWER_TOP * 0.8), radius: 9, label: 'Thorne Tower, east face' },
          { at: [30, -30], height: TOWER_TOP + 8, radius: 10, label: 'Over the Penthouse Pot (the photo)' },
        ],
      },
      {
        kind: 'visit',
        text: 'Land and bring the photos to Hedda at the Kerbside Exchange',
        at: EXCHANGE_AT,
        radius: 9,
        hint: 'Kerbside Exchange (Central Bus Stop)',
      },
    ],
    doneText: 'Front page: VESPER\'S PENTHOUSE HAS NO GRASS. Hedda prints it in a font size usually kept for wars.',
  },
  {
    id: 'city-skyway-robbery',
    title: 'The Skyway Job',
    giver: EXCHANGE_GIVER,
    prereq: 'city-impound-run',
    rewardAcorns: 1000,
    achievement: 'gta-skyway-robbery',
    radioBulletin: 'city-skyway-robbery',
    cutscene: { kind: 'script', script: 'city-skyway-robbery-intro' },
    outro: { kind: 'script', script: 'city-skyway-robbery-outro' },
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Take the Skyway and beat the HOA ledger van to the east off-ramp',
        vehicle: { kind: 'zero-turn', at: [2.5, 58, Math.PI] },
        seconds: 55,
        hint: 'Turfton Skyway',
        points: [
          { at: [-219, -40], radius: 8, label: 'Skyway west on-ramp, west city edge (the clock starts)' },
          { at: [0, -60], height: 7.5, radius: 5, label: 'Skyway deck over Downtown' },
          { at: [316, -60], height: 7.5, radius: 5, label: 'Skyway deck over Ring Road North-East' },
          { at: [440, -46], height: 7.5, radius: 5, label: 'Skyway deck by the airfield' },
          { at: [550, 16], radius: 9, label: 'Skyway east off-ramp' },
        ],
      },
      {
        kind: 'crack',
        text: 'Crack the HOA van crew waiting under the off-ramp',
        targets: [
          { id: 'ledger-hoa-1', name: 'HOA Courier Tally', near: [560, 40], hint: 'East highway, under the Skyway', look: HOA_LOOK },
          { id: 'ledger-hoa-2', name: 'HOA Courier Docket', near: [566, 46], hint: 'East highway, under the Skyway', look: HOA_LOOK },
          { id: 'ledger-hoa-3', name: 'HOA Courier Ream', near: [554, 48], hint: 'East highway, under the Skyway', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Drive the HOA ledger van home to the Local 404 Union Hall in Clay-Mart Industrial',
        vehicleKind: 'hoa-van',
        spawnAt: [545, 45, Math.PI],
        dropAt: [-150, 177.5],
        radius: 10,
        hint: 'Local 404 Union Hall (Clay-Mart Industrial)',
        heatOnEnter: 3,
        maxDamage: 0.6,
      },
    ],
    doneText: 'The strike-fund ledger is back on Local 404\'s shelf. Big Wrench Grout reads it alone, and says the Skyway is paid for.',
  },
];
