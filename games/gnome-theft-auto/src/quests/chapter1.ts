// Prologue & Chapter 1: "Fresh Out the Kiln" & "Acorns & Alibis".
import type { GnomeLook } from '@lawn/gnome';
import { AMPHITHEATER, SIDE_VALVE } from '../config';
import type { QuestDef } from './types';

const GOLD_HAT = 0xffd23f;

const PIP_LOOK: Partial<GnomeLook> = { hat: 0xd93636, shirt: 0x2f8a4a, beard: 0x6b5b4b };
const TANSY_LOOK: Partial<GnomeLook> = { hat: 0xf2c230, shirt: 0x2b2e34, glasses: true };
const VESPER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xf4f4f8, skin: 0xfafafa, glasses: true };
const JUNIPER_LOOK: Partial<GnomeLook> = { hat: 0x3b6ea5, shirt: 0x2c3e50, glasses: true };
const REGINALD_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b, glasses: true };
const BODEGA_LOOK: Partial<GnomeLook> = { hat: 0x7c4a2d, shirt: 0x3c4b5c, beard: 0x888888 };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

export const CHAPTER_1_QUESTS: readonly QuestDef[] = [
  {
    id: 'prologue-fresh-kiln',
    title: 'Fresh Out the Kiln',
    giver: 'pip-spawn',
    chapter: 1,
    rewardAcorns: 150,
    achievement: 'gta-fresh-kiln',
    radioBulletin: 'prologue-fresh-kiln',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      titleCard: 'GNOME THEFT AUTO',
      lines: [
        {
          speaker: 'Narrator',
          text: 'Every gnome thinks they are limited edition—until they step off the snail-coach in Turfton and realize half the block was cast from the same garden-centre mould.',
          hz: 130,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Don\'t look at me like that! Technically it\'s not stealing if the owner left the key in the ignition and went inside a flowerpot.',
          look: PIP_LOOK,
          hz: 210,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Grab that Ride-On at the kerb and follow me past The Gnomecino to Side-Valve Salvage. Tansy\'s got a Fescue crate that hums like a battery.',
          look: PIP_LOOK,
          hz: 215,
        },
      ],
    },
    objectives: [
      {
        kind: 'chase-follow',
        text: 'Follow Pip Potsworth through Turfton to Side-Valve Salvage',
        leaderName: 'Pip Potsworth',
        leaderKind: 'push-bike',
        waypoints: [[-10, 18], [30, 0], [90, -50], [0, 0], [-90, 60], [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z]],
        speed: 14,
        maxDist: 65,
        hint: 'Follow Pip on his Push-Mower Bike',
      },
      {
        kind: 'visit',
        text: 'Meet Tansy Clayfoot at Side-Valve Salvage',
        at: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
        radius: 8,
        hint: 'Side-Valve Salvage bay',
      },
    ],
    doneText: 'Okay, yeah—that humming Golden Acorn in the grass-catcher is definitely not grass.',
  },
  {
    id: 'first-contract',
    title: 'First Contract',
    giver: 'mulch-club',
    chapter: 1,
    rewardAcorns: 1000,
    radioBulletin: 'first-contract',
    cutscene: { kind: 'contract' },
    achievement: 'gta-first-contract',
    doneText: 'Contract complete. Don Compost taps his armrest once—your first 1,000 Acorns of Kiln-Debt are cleared.',
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the three marked gnomes',
        targets: [
          { id: 'dibbler', name: 'Dandy Dibbler', near: [-320, 40], hint: 'Mossy Wood', look: { hat: GOLD_HAT, glasses: true } },
          { id: 'gravelbottom', name: 'Gordie Gravelbottom', near: [20, -330], hint: 'Frostbite Fells', look: { hat: GOLD_HAT, beard: 0x3b2a1a } },
          { id: 'spadewell', name: 'Sandy Spadewell', near: [330, 110], hint: 'The Dust Flats', look: { hat: GOLD_HAT, freckles: true } },
        ],
      },
    ],
  },
  {
    id: 'ch1-mowers-keepers',
    title: "Mower's Keepers",
    giver: 'side-valve',
    prereq: 'prologue-fresh-kiln',
    chapter: 1,
    rewardAcorns: 400,
    radioBulletin: 'ch1-mowers-keepers',
    cutscene: {
      kind: 'dialogue',
      room: 'side-valve',
      lines: [
        {
          speaker: 'Tansy Clayfoot',
          text: 'The HOA put a "boot" on my client\'s Push-Mower Bike at block (60, -60). Technically it\'s a giant clothespin, and technically I can\'t touch it.',
          look: TANSY_LOOK,
          hz: 165,
        },
        {
          speaker: 'Tansy Clayfoot',
          text: 'Good thing you\'re not me. Crack the two HOA enforcers watching it and bring the bike back to my bay.',
          look: TANSY_LOOK,
          hz: 160,
        },
      ],
    },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the HOA Enforcers guarding the clamped bike',
        targets: [
          { id: 'hoa-clamp-1', name: 'HOA Enforcer Finch', near: [56, -60], hint: 'Downtown Block (60, -60)', look: HOA_LOOK },
          { id: 'hoa-clamp-2', name: 'HOA Enforcer Bramble', near: [64, -60], hint: 'Downtown Block (60, -60)', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Repo the Push-Mower Bike and return to Side-Valve Salvage',
        vehicleKind: 'push-bike',
        spawnAt: [60, -56, 0],
        dropAt: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
        radius: 8,
        hint: 'Side-Valve Salvage bay',
        heatOnEnter: 1,
      },
    ],
    doneText: 'Bike recovered—but taped to the handlebars is an HOA eviction notice addressed to Tansy\'s own garage.',
  },
  {
    id: 'ch1-two-coat-tail',
    title: 'Two-Coat Tail',
    giver: 'city-hall',
    prereq: 'ch1-mowers-keepers',
    chapter: 1,
    rewardAcorns: 450,
    radioBulletin: 'ch1-two-coat-tail',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Councilwoman Juniper Vance',
          text: 'Mayor Barnaby "Two-Coat" Mulch is meeting someone in Patio Heights after dark. Tail his Ride-On without spooking him.',
          look: JUNIPER_LOOK,
          hz: 195,
        },
        {
          speaker: 'John Bodega',
          text: 'Late shift at Bodega & Sons. Asphalt watches Mayor Mulch\'s headlights roll past the neon window while I sweep up today\'s clay dust.',
          look: BODEGA_LOOK,
          hz: 140,
          bodegaCameo: true,
        },
      ],
    },
    objectives: [
      {
        kind: 'chase-follow',
        text: 'Tail Mayor Mulch to Patio Heights',
        leaderName: 'Mayor Barnaby Mulch',
        leaderKind: 'ride-on',
        waypoints: [[0, -60], [60, -60], [120, -120], [160, -160]],
        speed: 15,
        maxDist: 75,
        hint: 'Follow Mayor Mulch northeast',
      },
      {
        kind: 'visit',
        text: 'Witness the median-lease kickback handover in Patio Heights',
        at: [165, -165],
        radius: 12,
        hint: 'Patio Heights courtyard',
      },
    ],
    doneText: 'Caught on tape: Mayor Mulch signing Turfton\'s median leases straight over to Vesper Thorne.',
  },
  {
    id: 'ch1-tax-break-in',
    title: 'The Glaze & Tax Break-In',
    giver: 'side-valve',
    prereq: 'ch1-two-coat-tail',
    chapter: 1,
    rewardAcorns: 550,
    radioBulletin: 'ch1-tax-break-in',
    cutscene: {
      kind: 'dialogue',
      room: 'side-valve',
      lines: [
        {
          speaker: 'Vesper Thorne',
          text: 'A forty-eight-hour foreclosure lien, Ms. Clayfoot. Cracks are a failure of discipline—and do not open that Fescue crate.',
          look: VESPER_LOOK,
          hz: 125,
        },
        {
          speaker: 'Tansy Clayfoot',
          text: 'Vesper filed my deed at the Glaze & Tax Office by Thorne Tower. Crack his auditors, grab the blueprint, and roll out in the heavy Combine.',
          look: TANSY_LOOK,
          hz: 165,
        },
      ],
    },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the HOA Tax Auditors outside Thorne Tower',
        targets: [
          { id: 'tax-auditor-1', name: 'Auditor Crumb', near: [20, -45], hint: 'Thorne Tower', look: HOA_LOOK },
          { id: 'tax-auditor-2', name: 'Auditor Silt', near: [40, -45], hint: 'Thorne Tower', look: HOA_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Steal the Combine Harvester and smash back to Side-Valve Salvage',
        vehicleKind: 'combine',
        spawnAt: [0, -48, Math.PI],
        dropAt: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
        radius: 10,
        hint: 'Side-Valve Salvage bay',
        heatOnEnter: 2,
      },
    ],
    doneText: 'Deed recovered—along with Vesper\'s blueprint for The Grand Combine, powered by a Fescue Golden Acorn.',
  },
  {
    id: 'ch1-founders-boot',
    title: "Founder's Boot & The Kangaroo Court",
    giver: 'side-valve',
    prereq: 'ch1-tax-break-in',
    chapter: 1,
    rewardAcorns: 700,
    achievement: 'gta-boot-legger',
    radioBulletin: 'ch1-founders-boot',
    cutscene: {
      kind: 'dialogue',
      room: 'side-valve',
      lines: [
        {
          speaker: 'Tansy Clayfoot',
          text: 'Vesper scheduled an emergency HOA zoning tribunal at the Amphitheater during the Founder\'s Trim Day parade so nobody can protest.',
          look: TANSY_LOOK,
          hz: 165,
        },
        {
          speaker: 'Pip Potsworth',
          text: 'Hear me out: what if we steal the 30-foot Gnorwin Clayfoot Boot parade float and park it straight inside the jury box?',
          look: PIP_LOOK,
          hz: 215,
        },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: "Hijack Gnorwin's Boot Parade Float and crash the Amphitheater tribunal",
        vehicleKind: 'boot-float',
        spawnAt: [0, -120, Math.PI / 2],
        dropAt: [AMPHITHEATER.x, AMPHITHEATER.z + 18],
        radius: 14,
        hint: 'Turfton Amphitheater',
        heatOnEnter: 2,
      },
      {
        kind: 'crack',
        text: 'Scatter Reginald Vance and his HOA Enforcers at the Amphitheater',
        targets: [
          { id: 'reginald-vance', name: 'Reginald "Quarter-Inch" Vance', near: [-90, -80], hint: 'Turfton Amphitheater', look: REGINALD_LOOK },
          { id: 'tribunal-hoa-1', name: 'HOA Bailiff Pike', near: [-82, -84], hint: 'Turfton Amphitheater', look: HOA_LOOK },
          { id: 'tribunal-hoa-2', name: 'HOA Bailiff Reed', near: [-98, -84], hint: 'Turfton Amphitheater', look: HOA_LOOK },
          { id: 'tribunal-hoa-3', name: 'HOA Bailiff Moss', near: [-90, -72], hint: 'Turfton Amphitheater', look: HOA_LOOK },
        ],
      },
      {
        kind: 'visit',
        text: 'Escape back to Side-Valve Salvage',
        at: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
        radius: 10,
        hint: 'Side-Valve Salvage bay',
      },
    ],
    doneText: 'Tribunal adjourned. Tansy\'s deed is stamped, and Vesper knows you\'re not playing by HOA rules.',
  },
];
