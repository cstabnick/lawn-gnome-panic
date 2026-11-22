// Strangers & Freaks: all 11 side quests across Turfton and the four outer biomes.
import type { GnomeLook } from '@lawn/gnome';
import { GNOMECINO, PATIO_HEIGHTS, SIDE_VALVE } from '../config';
import type { QuestDef } from './types';

const MOSSLEY_LOOK: Partial<GnomeLook> = { hat: 0x3b6ea5, shirt: 0x7c6a53, glasses: true, beard: 0xb8b0a0 };
const CLARA_LOOK: Partial<GnomeLook> = { hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa, dress: true };
const BRACKEN_LOOK: Partial<GnomeLook> = { hat: 0x3d6e35, shirt: 0x5c4a32, beard: 0xd8d8d0 };
const GRANNY_LOOK: Partial<GnomeLook> = { hat: 0xf08bb4, shirt: 0x8e5ea2, glasses: true, dress: true };
const BURT_LOOK: Partial<GnomeLook> = { hat: 0x4b5563, shirt: 0xc9b99b, glasses: true };
const DRIFTWOOD_LOOK: Partial<GnomeLook> = { hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xe5e0d4 };
const CEDRIC_LOOK: Partial<GnomeLook> = { hat: 0x8e44ad, shirt: 0x5b3b24, beard: 0x3a2a1d };
const BRAMBLE_LOOK: Partial<GnomeLook> = { hat: 0x8b5a2b, shirt: 0x4a6b3b, beard: 0xc4b8a4 };
const SHELLDON_LOOK: Partial<GnomeLook> = { hat: 0x7a8a78, shirt: 0x3f4740, glasses: true };
const BRENDA_LOOK: Partial<GnomeLook> = { hat: 0xd4a04a, shirt: 0xb84a7a, glasses: true, dress: true };
const BIG_LOU_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0x2a2d36, beard: 0x222222 };
const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const RED_CAP_LOOK: Partial<GnomeLook> = { hat: 0xd8342c, shirt: 0x2b2e34 };

const PATIO_CENTER: [number, number] = [
  (PATIO_HEIGHTS.minX + PATIO_HEIGHTS.maxX) / 2,
  (PATIO_HEIGHTS.minZ + PATIO_HEIGHTS.maxZ) / 2,
];

export const SIDE_QUESTS: readonly QuestDef[] = [
  {
    id: 'sq-grid-truthers',
    title: 'The Grid Truthers',
    giver: 'strangers',
    rewardAcorns: 450,
    radioBulletin: 'sq-grid-truthers',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Mossley "Plumb-Line" Inkcap',
          text: 'Sixty units! Every single road in Turfton sits on a dead-even sixty-unit grid! You think soil grows in sixty-unit squares?!',
          look: MOSSLEY_LOOK,
          hz: 195,
        },
        {
          speaker: 'Mossley "Plumb-Line" Inkcap',
          text: 'Hit the four survey markers across Turfton and check the dead-center datum at (0, 0). Something Tall-One-sized is buried down there.',
          look: MOSSLEY_LOOK,
          hz: 205,
        },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Inspect Survey Marker Alpha in southwest Turfton',
        at: [-120, 120],
        radius: 10,
        hint: 'Survey Marker Alpha (-120, 120)',
      },
      {
        kind: 'visit',
        text: 'Inspect Survey Marker Beta in northwest Turfton',
        at: [-120, -120],
        radius: 10,
        hint: 'Survey Marker Beta (-120, -120)',
        heatOnEnter: 1,
        toastOnEnter: 'Hat Watch spotted you snooping around the grid datum!',
      },
      {
        kind: 'visit',
        text: 'Inspect Survey Marker Gamma in northeast Turfton',
        at: [120, -120],
        radius: 10,
        hint: 'Survey Marker Gamma (120, -120)',
      },
      {
        kind: 'visit',
        text: 'Uncover the buried Tall-One Pencil under Center Datum (0, 0)',
        at: [0, 0],
        radius: 10,
        hint: 'Center Datum (0, 0)',
        heatOnEnter: 1,
      },
    ],
    doneText: 'You unearth a redwood-sized Tall-One Pencil under (0, 0). Mossley sells the graphite as "artisan eyebrow pencil" and retires.',
  },
  {
    id: 'sq-porcelain-blues',
    title: 'Porcelain Blues',
    giver: 'strangers-porch',
    rewardAcorns: 500,
    radioBulletin: 'sq-porcelain-blues',
    cutscene: {
      kind: 'dialogue',
      room: 'unmowed-hollow',
      lines: [
        {
          speaker: 'Clara',
          text: 'Earthenware gnomes get glued back together at the clinic. Porcelain doesn\'t bounce—one hard knock and my glaze fractures for good.',
          look: CLARA_LOOK,
          hz: 215,
        },
        {
          speaker: 'Clara',
          text: 'HOA scavengers took three wax lanterns from the Tall House Porch at (-560, 40). Crack the thieves and bring the lanterns back before dusk.',
          look: CLARA_LOOK,
          hz: 205,
        },
      ],
    },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the three HOA scavengers guarding the stolen porcelain lanterns',
        targets: [
          { id: 'porcelain-scav-1', name: 'Scavenger Chisel', near: [-552, 34], hint: 'Tall House Porch (-560, 40)', look: HOA_LOOK },
          { id: 'porcelain-scav-2', name: 'Scavenger Trowel', near: [-566, 48], hint: 'Tall House Porch (-560, 40)', look: HOA_LOOK },
          { id: 'porcelain-scav-3', name: 'Scavenger Plinth', near: [-470, 15], hint: 'Mossy Wood Trail', look: HOA_LOOK },
        ],
      },
      {
        kind: 'visit',
        text: 'Return the recovered lanterns to Clara at the Tall House Porch',
        at: [-560, 40],
        radius: 12,
        hint: 'Tall House Porch (-560, 40)',
      },
    ],
    doneText: 'Lanterns lit and porch door sealed. Clara gifts you a Porcelain-Glaze Charm to keep your own clay from chipping.',
  },
  {
    id: 'sq-fescue-fugitive',
    title: 'The Fescue Fugitive',
    giver: 'unmowed-hollow',
    rewardAcorns: 650,
    radioBulletin: 'sq-fescue-fugitive',
    cutscene: {
      kind: 'dialogue',
      room: 'unmowed-hollow',
      lines: [
        {
          speaker: 'Elder Bracken',
          text: 'Vesper Thorne keeps a Replica Stopping Stone in his Patio Heights gallery—not for reverence, mind you. He props his patio door open with it.',
          look: BRACKEN_LOOK,
          hz: 145,
        },
        {
          speaker: 'Elder Bracken',
          text: 'Liberate that stone from Patio Heights and bring it back to the Hollow—unless Granny Gnertrude gets in your ear with an acorn bid first.',
          look: BRACKEN_LOOK,
          hz: 140,
        },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Infiltrate Vesper\'s Patio Heights gallery and seize the Replica Stopping Stone',
        at: PATIO_CENTER,
        radius: 16,
        hint: 'Patio Heights Gallery',
      },
      {
        kind: 'choice',
        text: 'Return the Replica Stopping Stone to Elder Bracken or fence it to Granny Gnertrude',
        optionA: {
          label: 'Return to Elder Bracken (Unmowed Hollow)',
          at: [-350, 40],
          endingText: 'Elder Bracken sets the Replica Stopping Stone in Unmowed Hollow—sacred Fescue history rescued from doorstop duty.',
        },
        optionB: {
          label: 'Fence to Granny Gnertrude (Cloverfield Barn)',
          at: [-25, 330],
          endingText: 'Granny Gnertrude weighs the stone, laughs, and pays out a crate of Cloverfield Acorns on the spot.',
          bonusAcorns: 500,
        },
      },
    ],
    doneText: 'The Replica Stopping Stone leaves Patio Heights for good—another piece of Fescue lore out of Vesper\'s hands.',
  },
  {
    id: 'sq-hoa-audit',
    title: 'The HOA Audit',
    giver: 'strangers',
    rewardAcorns: 750,
    radioBulletin: 'sq-hoa-audit',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Burt',
          text: 'I used to write citations for the HOA until they stiffed me on three weeks of overtime. Want to know a secret? The Tall Ones aren\'t even on the board.',
          look: BURT_LOOK,
          hz: 185,
        },
        {
          speaker: 'Burt',
          text: 'Five petty citation officers are out across all five biomes ticketing cactuses and snowmen. Crack all five and expose the racket.',
          look: BURT_LOOK,
          hz: 190,
        },
      ],
    },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the five petty HOA citation officers across all five biomes',
        targets: [
          { id: 'audit-turfton', name: 'Inspector Ledger', near: [0, -60], hint: 'Turfton Downtown', look: HOA_LOOK },
          { id: 'audit-dust', name: 'Inspector Saguaro', near: [310, 40], hint: 'The Dust Flats (Cactus Unit)', look: HOA_LOOK },
          { id: 'audit-fells', name: 'Inspector Drift', near: [20, -360], hint: 'Frostbite Fells (Snowman Unit)', look: HOA_LOOK },
          { id: 'audit-moss', name: 'Inspector Lichen', near: [-320, -20], hint: 'Mossy Wood (Bark Unit)', look: HOA_LOOK },
          { id: 'audit-clover', name: 'Inspector Stubble', near: [10, 350], hint: 'Cloverfield Farms', look: HOA_LOOK },
        ],
      },
    ],
    doneText: 'Audit closed. Every clipboard confirms the HOA is just middle-management gnomes forging Tall-One stationery.',
  },
  {
    id: 'sq-castaway-drydock',
    title: "Castaway's Dry-Dock",
    giver: 'cloverfield-barn',
    rewardAcorns: 550,
    radioBulletin: 'sq-castaway-drydock',
    cutscene: {
      kind: 'dialogue',
      room: 'cloverfield-barn',
      lines: [
        {
          speaker: 'Driftwood',
          text: 'Six months I\'ve been lashed to this lawn-boat trailer out in Cloverfield, waiting for the high-tide bell that never rings.',
          look: DRIFTWOOD_LOOK,
          hz: 170,
        },
        {
          speaker: 'Driftwood',
          text: 'Hitch my turf-raft behind a Combine Harvester and haul it north to the Southern Drainage Canal at (55, 230) before dry season bakes the clay.',
          look: DRIFTWOOD_LOOK,
          hz: 175,
        },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Haul Driftwood\'s lawn-boat with a Combine Harvester to the Southern Drainage Canal',
        vehicleKind: 'combine',
        spawnAt: [30, 460, Math.PI],
        dropAt: [55, 230],
        radius: 14,
        hint: 'Southern Drainage Canal (55, 230)',
      },
    ],
    doneText: 'Lawn-boat docked at the Southern Drainage Canal! Driftwood salutes you with a Sea-Foam Mower Tint and Captain\'s Hat.',
  },
  {
    id: 'sq-mulch-pyramid',
    title: 'The Mulch Pyramid Scheme',
    giver: 'strangers',
    rewardAcorns: 600,
    radioBulletin: 'sq-mulch-pyramid',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Cedric "Double-Bag" Peat',
          text: 'It\'s not a pyramid, partner—it\'s an inverted compost funnel! Just roll this Mulch-Spreader full of "Artisanal Miracle Mulch" up to Patio Heights.',
          look: CEDRIC_LOOK,
          hz: 205,
        },
        {
          speaker: 'Cedric "Double-Bag" Peat',
          text: 'Small caveat: it\'s dyed sawdust and craft glitter, and the wasps love it. Once the neighbors call the Watch, repo that rig back to Side-Valve.',
          look: CEDRIC_LOOK,
          hz: 195,
        },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Deliver the "Artisanal Miracle Mulch" spreader to Patio Heights',
        vehicleKind: 'mulch-spreader',
        spawnAt: [-52, 68, 0],
        dropAt: [145, -145],
        radius: 12,
        hint: 'Patio Heights Drop Zone',
        heatOnEnter: 1,
      },
      {
        kind: 'steal-deliver',
        text: 'Repo the remaining Mulch-Spreader pallets back to Side-Valve Salvage before HOA seizure',
        vehicleKind: 'mulch-spreader',
        spawnAt: [145, -145, Math.PI],
        dropAt: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
        radius: 12,
        hint: 'Side-Valve Salvage Bay',
        heatOnEnter: 2,
      },
    ],
    doneText: 'Pallets repoed—and the Chapel of Mulch\'s glitter-sawdust quota scheme is officially busted wide open.',
  },
  {
    id: 'sq-biscuit-hotdog',
    title: "Biscuit's Lost Squeaky Toy",
    giver: 'cloverfield-barn',
    rewardAcorns: 650,
    radioBulletin: 'sq-biscuit-hotdog',
    cutscene: {
      kind: 'dialogue',
      room: 'cloverfield-barn',
      lines: [
        {
          speaker: 'Farmer Bramble',
          text: 'Don\'t look up—just listen! Biscuit dropped his city-bus-sized rubber squeaky hotdog right in the giant pawprint crater at (80, 380).',
          look: BRAMBLE_LOOK,
          hz: 190,
        },
        {
          speaker: 'Farmer Bramble',
          text: 'Winch it with a Combine Harvester and drag it back to Cloverfield Barn at (-25, 340) before Biscuit comes back sniffing for dinner!',
          look: BRAMBLE_LOOK,
          hz: 195,
        },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Haul Biscuit\'s giant squeaky hotdog in a Combine from the crater back to Cloverfield Barn',
        vehicleKind: 'combine',
        spawnAt: [80, 380, -Math.PI / 2],
        dropAt: [-25, 340],
        radius: 14,
        hint: 'Cloverfield Barn (-25, 340)',
        squeakPulse: true,
      },
    ],
    doneText: 'Every pothole sent out a deafening SQUEAK that scattered the Watch—Bramble\'s barn is safe from giant paws.',
  },
  {
    id: 'sq-snail-rigging',
    title: 'Snail-Racing Rigging',
    giver: 'strangers',
    rewardAcorns: 550,
    achievement: 'gta-snail-saboteur',
    radioBulletin: 'sq-snail-rigging',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Shelldon "No-Trail" Mucilage',
          text: 'Keep your brim low. My encrypted courier snails are getting dusted in the alley heats by a syndicate running Espresso-Fed Slugs.',
          look: SHELLDON_LOOK,
          hz: 175,
        },
        {
          speaker: 'Shelldon "No-Trail" Mucilage',
          text: 'Slip into the downtown paddock, swap their crisp romaine for decaf dandelion greens, and bolt back to my dumpster alley.',
          look: SHELLDON_LOOK,
          hz: 180,
        },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Sneak into the downtown alley paddock and swap the espresso slugs\' lettuce',
        at: [24, -18],
        radius: 9,
        hint: 'Downtown Snail-Race Alley',
      },
      {
        kind: 'visit',
        text: 'Escape back to Shelldon\'s dumpster alley',
        at: [-60, 60],
        radius: 10,
        hint: 'Shelldon\'s Alley (-60, 60)',
      },
    ],
    doneText: 'Espresso slugs fast asleep on decaf dandelion greens. Shelldon hands over a Tinfoil Conspiracy Brim and alley-heat clearance.',
  },
  {
    id: 'sq-porcelain-support',
    title: 'The Porcelain Support Group',
    giver: 'strangers-porch',
    rewardAcorns: 700,
    radioBulletin: 'sq-porcelain-support',
    cutscene: {
      kind: 'dialogue',
      room: 'unmowed-hollow',
      lines: [
        {
          speaker: 'Clara',
          text: 'Four newly escaped porcelain gnomes made it off the Tall House porch, and they\'re currently arguing over whether a toaster is an altar.',
          look: CLARA_LOOK,
          hz: 210,
        },
        {
          speaker: 'Clara',
          text: 'Take the shock-absorbed Ride-On Lowrider and bring them gently to the padded Mossy Wood bunker at (-350, 40). Keep damage under 15% or their glaze chips!',
          look: CLARA_LOOK,
          hz: 205,
        },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Escort the porcelain refugees in a Ride-On Lowrider to the Mossy Wood bunker without chipping them',
        vehicleKind: 'lowrider',
        spawnAt: [-550, 36, Math.PI / 2],
        dropAt: [-350, 40],
        radius: 12,
        hint: 'Mossy Wood Bunker (-350, 40)',
        heatOnEnter: 1,
        maxDamage: 0.15,
        banter: [
          'Porcelain Passenger: "Watch the bumps! My glaze is bisque-fired!"',
          'Porcelain Passenger: "Wait—is a toaster a Tall-One altar or just a warm box?"',
          'Porcelain Passenger: "Use the hydraulics! Hop over the kerb!"',
        ],
      },
    ],
    doneText: 'All four porcelain refugees tucked safely into the moss bunker—glaze spotless, toaster theology unresolved.',
  },
  {
    id: 'sq-hose-revolt',
    title: 'The Great Hose-Pipe Tax Revolt',
    giver: 'strangers-canal',
    rewardAcorns: 800,
    achievement: 'gta-turf-violator',
    radioBulletin: 'sq-hose-revolt',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Baroness Brenda',
          text: 'Hear ye! From this zip-tied lawn-chair throne, I declare the Southern Drainage Canal the Sovereign Republic of New Puddle!',
          look: BRENDA_LOOK,
          hz: 185,
        },
        {
          speaker: 'Baroness Brenda',
          text: 'Kink four pressurized Tall-One garden hoses across Turfton and Patio Heights so Vesper\'s putting-green club turns into a mud bog.',
          look: BRENDA_LOOK,
          hz: 190,
        },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Kink Pressurized Hose #1 in North Turfton',
        at: [10, -112],
        radius: 10,
        hint: 'North Turfton Hose Valve',
        prop: 'hose',
        toastOnEnter: 'CRUNCH! Hose #1 kinked — pressure surging!',
      },
      {
        kind: 'visit',
        text: 'Kink Pressurized Hose #2 near the Greenhouse Strip',
        at: [90, -45],
        radius: 10,
        hint: 'Greenhouse Strip Hose Valve',
        prop: 'hose',
        toastOnEnter: 'CRUNCH! Hose #2 kinked — valves rattling!',
      },
      {
        kind: 'visit',
        text: 'Kink Pressurized Hose #3 at Patio Heights West Gate',
        at: [135, -135],
        radius: 10,
        hint: 'Patio Heights West Valve',
        prop: 'hose',
        toastOnEnter: 'CRUNCH! Hose #3 kinked — Patio Heights pipes groaning!',
      },
      {
        kind: 'visit',
        text: 'Kink Pressurized Hose #4 at Vesper\'s Putting-Green Country Club',
        at: [185, -185],
        radius: 10,
        hint: 'Patio Heights Country Club',
        prop: 'hose',
        heatOnEnter: 4,
        toastOnEnter: 'PATIO HEIGHTS FLOODED! 4-Hat HOA Enforcement inbound!',
      },
    ],
    doneText: 'Vesper\'s putting green is a glorious bog! Baroness Brenda salutes your Turf-Code violation from her lawn-chair throne.',
  },
  {
    id: 'sq-big-lou-embargo',
    title: "Big Lou's Dry-Hat Embargo",
    giver: 'strangers-gnomecino',
    rewardAcorns: 750,
    achievement: 'gta-dry-bone',
    radioBulletin: 'sq-big-lou-embargo',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        {
          speaker: 'Big Lou',
          text: 'House rule at The Gnomecino: spotless, bone-dry felt hats only. Some Red Cap hooligans just hijacked my microfiber hat-towel crate.',
          look: BIG_LOU_LOOK,
          hz: 130,
        },
        {
          speaker: 'Big Lou',
          text: 'Crack those Red Caps, grab the VIP\'s Zero-Turn Racer from across downtown, and bring it to my door without a scratch or mud splatter.',
          look: BIG_LOU_LOOK,
          hz: 125,
        },
      ],
    },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the Red Cap hooligans who hijacked Big Lou\'s microfiber hat-towel crate',
        targets: [
          { id: 'lou-redcap-1', name: 'Red Cap Knuckles', near: [-82, -26], hint: 'Downtown West Alley', look: RED_CAP_LOOK },
          { id: 'lou-redcap-2', name: 'Red Cap Brim', near: [-96, -34], hint: 'Downtown West Alley', look: RED_CAP_LOOK },
          { id: 'lou-redcap-3', name: 'Red Cap Tassel', near: [-88, -42], hint: 'Downtown West Alley', look: RED_CAP_LOOK },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Chauffeur the VIP Zero-Turn Racer across downtown to The Gnomecino without a single smudge',
        vehicleKind: 'zero-turn',
        spawnAt: [-90, -30, Math.PI / 2],
        dropAt: [GNOMECINO.x - 16, GNOMECINO.z],
        radius: 10,
        hint: 'The Gnomecino VIP Entrance',
        heatOnEnter: 1,
        maxDamage: 0.2,
      },
    ],
    doneText: 'Bowler hat crisp, bone-dry, and spotless. Big Lou waves you past the velvet rope with a Microfiber Bowler of your own.',
  },
];
