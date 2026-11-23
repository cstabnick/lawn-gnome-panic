import { GNORMAN_LOOK, type GnomeEquipment, type GnomeLook } from '@lawn/gnome';
import type { GsrAreaId } from '../audio/jingles';

export const AREA_ORDER_ALL: readonly GsrAreaId[] = [
  'velvet-keys',
  'bongo-basin',
  'chrome-kiln',
  'neon-birdbath',
  'mulch-alley',
  'tupperware-mall',
  'hoa-citadel',
  'subsoil-relay',
  'zero-hz-zenith',
];

export interface GangLeaderDef {
  id: string;
  name: string;
  title: string;
  gangName: string;
  prefabId: string;
  primaryColor: string;
  accentColor: string;
  mutterHz: number;
  styleNote: string;
}

export interface SidekickDef {
  id: string;
  name: string;
  role: string;
  kind: 'woken' | 'gnome';
  prefabId?: string;
  gnomeLook?: GnomeLook;
  accentColor: string;
  mutterHz: number;
  tagline: string;
}

export interface CrewVariantDef {
  id: string;
  name: string;
  equips: GnomeEquipment;
  look: GnomeLook;
  mutterHz: number;
  shoutouts: readonly string[];
}

export interface AreaCastDef {
  areaId: GsrAreaId;
  areaNumber: number;
  areaName: string;
  built: boolean;
  leader: GangLeaderDef;
  sidekicks: readonly [SidekickDef, SidekickDef];
  crewVariants: readonly [CrewVariantDef, CrewVariantDef];
}

function makeCrewLook(
  hat: number,
  shirt: number,
  pants: number,
  boots: number,
  beard: number | null,
  equipment: GnomeEquipment,
  opts?: { glasses?: boolean; dress?: boolean; freckles?: boolean },
): GnomeLook {
  return {
    ...GNORMAN_LOOK,
    hat,
    shirt,
    pants,
    boots,
    beard,
    glasses: opts?.glasses ?? false,
    dress: opts?.dress ?? false,
    freckles: opts?.freckles ?? false,
    equipment,
  };
}

export const AREA_CAST: Record<GsrAreaId, AreaCastDef> = {
  'velvet-keys': {
    areaId: 'velvet-keys',
    areaNumber: 1,
    areaName: 'Velvet Keys Plaza',
    built: true,
    leader: {
      id: 'leader-maestro-upright',
      name: 'Maestro Upright',
      title: 'Grand Conservatory Bandleader',
      gangName: 'The Ivory Syndicate',
      prefabId: 'gsr-upright-piano',
      primaryColor: '#ff4ecd',
      accentColor: '#ffd740',
      mutterHz: 76,
      styleNote: 'Lacquered upright piano crowned with a neon magenta Dorian halo.',
    },
    sidekicks: [
      {
        id: 'sk-pluck',
        name: 'Pluck',
        role: 'Upright Bass Runner',
        kind: 'woken',
        prefabId: 'gsr-upright-bass',
        accentColor: '#ff4ecd',
        mutterHz: 108,
        tagline: 'Bouncing on a steel endpin, laying down walking Dorian quarters.',
      },
      {
        id: 'sk-saxy-sal',
        name: 'Saxy Sal',
        role: 'Plaza Alto Busker',
        kind: 'woken',
        prefabId: 'gsr-saxophone-woken',
        accentColor: '#ffd740',
        mutterHz: 118,
        tagline: 'Claims fountain acoustics beat any velvet-curtain conservatory.',
      },
    ],
    crewVariants: [
      {
        id: 'vk-ivory-tuner',
        name: 'Ivory Tuner',
        equips: { head: 'wiseguy-fedora', neck: 'gsr-vinyl-chain' },
        look: makeCrewLook(0x2a143d, 0x3b1e54, 0x1b122b, 0x111111, 0xe8e0f0, {
          head: 'wiseguy-fedora',
          neck: 'gsr-vinyl-chain',
        }, { glasses: true }),
        mutterHz: 112,
        shoutouts: [
          'Hey, watch the lacquer on those boots—this plaza is tuned to D Dorian!',
          'Maestro says no street-skating without a proper jazz turnaround!',
          'Nice carve, kid, but can you hold a ninth chord on a 90-degree rail?',
        ],
      },
      {
        id: 'vk-dorian-busker',
        name: 'Dorian Busker',
        equips: { head: 'brick-beret', hand: 'gsr-aether-can' },
        look: makeCrewLook(0xc2185b, 0x6a1b9a, 0x261542, 0x1b1d28, null, {
          head: 'brick-beret',
          hand: 'gsr-aether-can',
        }, { freckles: true }),
        mutterHz: 128,
        shoutouts: [
          'Espresso-dew and fresh neon paint—nothing beats Velvet Keys!',
          'You call that a tag? Check out my magenta stencil by the Rotunda!',
          'Keep your knees bent on the piano-key walkway, runner!',
        ],
      },
    ],
  },

  'bongo-basin': {
    areaId: 'bongo-basin',
    areaNumber: 2,
    areaName: 'Bongo Basin Overpass',
    built: true,
    leader: {
      id: 'leader-conga-kora',
      name: 'Conga King Kora',
      title: 'Overpass Rhythm Sovereign',
      gangName: 'The Rip-Skin Collective',
      prefabId: 'gsr-bongo-stack',
      primaryColor: '#ff9100',
      accentColor: '#ffd740',
      mutterHz: 84,
      styleNote: 'Crowned twin-drum hover-bonga rig blasting 132 BPM Mixolydian slaps.',
    },
    sidekicks: [
      {
        id: 'sk-rimshot-rizzo',
        name: 'Rimshot Rizzo',
        role: 'Viaduct Pace-Setter',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0xff6d00, 0x372214, 0x1b1d28, 0x222222, 0x3e2723, {
          head: 'aviator-cap',
          back: 'gsr-spray-pack',
          neck: 'tire-tread-collar',
        }),
        accentColor: '#ff9100',
        mutterHz: 124,
        tagline: 'Skates the cloverleaf crown with twin pressurized paint tanks.',
      },
      {
        id: 'sk-timbale-tobe',
        name: 'Timbale Tobe',
        role: 'Toll-Gate Percussionist',
        kind: 'woken',
        prefabId: 'gsr-bongo-stack',
        accentColor: '#ffd740',
        mutterHz: 102,
        tagline: 'Answers every overpass jump with a crisp brass-lug rimshot.',
      },
    ],
    crewVariants: [
      {
        id: 'bb-viaduct-drifter',
        name: 'Viaduct Drifter',
        equips: { neck: 'tire-tread-collar', hand: 'gsr-aether-can' },
        look: makeCrewLook(0xff9100, 0x2b1d12, 0x191b26, 0x111111, 0x5d4037, {
          neck: 'tire-tread-collar',
          hand: 'gsr-aether-can',
        }),
        mutterHz: 116,
        shoutouts: [
          'Two acorns or one clean bongo bounce—nobody rides the toll deck free!',
          'You smell that? Fresh acorn-chili at Brenda’s diner!',
          'Hit the bongo pad on the downbeat if you want to clear the viaduct!',
        ],
      },
      {
        id: 'bb-chili-skater',
        name: 'Chili-Run Skater',
        equips: { head: 'gba-headband', back: 'rough-satchel' },
        look: makeCrewLook(0xe65100, 0xd84315, 0x263238, 0x222222, null, {
          head: 'gba-headband',
          back: 'rough-satchel',
        }, { freckles: true }),
        mutterHz: 132,
        shoutouts: [
          'Hot parcel coming through! Don’t clip my satchel on the S-curve!',
          'King Kora’s got the whole cloverleaf locked in A Mixolydian!',
          'Carve wide on the tarmac, runner—there’s oil-glaze on the shoulder!',
        ],
      },
    ],
  },

  'chrome-kiln': {
    areaId: 'chrome-kiln',
    areaNumber: 3,
    areaName: 'Chrome Kiln Foundry',
    built: true,
    leader: {
      id: 'leader-furnace-vera',
      name: 'Furnace Vera',
      title: 'Crucible Union Forge-Master',
      gangName: 'The Glaze Grinders',
      prefabId: 'gsr-anvil-cymbal',
      primaryColor: '#76ff03',
      accentColor: '#ff6d00',
      mutterHz: 72,
      styleNote: 'Forged iron anvil-cymbal glowing with E Phrygian Dominant acid-funk heat.',
    },
    sidekicks: [
      {
        id: 'sk-trundle',
        name: 'Trundle',
        role: 'Molten Glaze Hauler',
        kind: 'woken',
        prefabId: 'gsr-glaze-trolley',
        accentColor: '#ff6d00',
        mutterHz: 94,
        tagline: 'Carries 900-degree neon boot glaze and complains if anyone splashes it.',
      },
      {
        id: 'sk-slaghammer-salvo',
        name: 'Slaghammer Salvo',
        role: 'Union Shop Steward',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0x37474f, 0x263238, 0x1b1d28, 0x111111, 0x90a4ae, {
          head: 'gsr-kiln-visor',
          back: 'salvage-wrench-pack',
          hand: 'garden-mallet',
        }),
        accentColor: '#76ff03',
        mutterHz: 88,
        tagline: 'Enforces foundry break whistles and hammers acid basslines on steel beams.',
      },
    ],
    crewVariants: [
      {
        id: 'ck-kiln-welder',
        name: 'Kiln Welder',
        equips: { head: 'gsr-kiln-visor', hand: 'brass-calipers' },
        look: makeCrewLook(0x263238, 0x37474f, 0x1b1d28, 0x111111, 0xb0bec5, {
          head: 'gsr-kiln-visor',
          hand: 'brass-calipers',
        }),
        mutterHz: 98,
        shoutouts: [
          'Half the skate boots in the Aether were glazed right in this canyon!',
          'Mind the molten channel—glaze dries fast on fired clay!',
          'Days since last glaze spill: zero! And proud of it!',
        ],
      },
      {
        id: 'ck-smelter-rigger',
        name: 'Smelter Rigger',
        equips: { head: 'foreman-hard-hat', back: 'salvage-wrench-pack' },
        look: makeCrewLook(0xffc107, 0x455a64, 0x212121, 0x1b1d28, 0x78909c, {
          head: 'foreman-hard-hat',
          back: 'salvage-wrench-pack',
        }),
        mutterHz: 106,
        shoutouts: [
          'Those exhaust vents aren’t elevators, kid—oh, who am I kidding, ride ’em!',
          'Furnace Vera’s Crucible Crown is running at 138 BPM tonight!',
          'Watch your head under the gantry crane!',
        ],
      },
    ],
  },

  'neon-birdbath': {
    areaId: 'neon-birdbath',
    areaNumber: 4,
    areaName: 'Neon Birdbath Spire',
    built: true,
    leader: {
      id: 'leader-fountainhead-finn',
      name: 'Fountainhead Finn',
      title: 'Spire Glass-Beacon Curator',
      gangName: 'The Splash-Back Skaters',
      prefabId: 'gsr-neon-fountain',
      primaryColor: '#00e5ff',
      accentColor: '#ff4ecd',
      mutterHz: 90,
      styleNote: 'Tiered neon-glass birdbath swirling with 170 BPM G Lydian mist.',
    },
    sidekicks: [
      {
        id: 'sk-gus',
        name: 'Gus',
        role: 'Lydian Mist Bassist',
        kind: 'woken',
        prefabId: 'gsr-upright-bass',
        accentColor: '#00e5ff',
        mutterHz: 104,
        tagline: 'Pluck’s cousin from the upper lagoon; skates circles around the mist bowls.',
      },
      {
        id: 'sk-vapor-vesper',
        name: 'Vapor Vesper',
        role: 'Spire Aerial Guide',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0x00bcd4, 0x1a237e, 0x120824, 0x00e5ff, null, {
          head: 'gsr-dj-headphones',
          back: 'gsr-mist-wings',
          neck: 'vip-towel-scarf',
        }),
        accentColor: '#ff4ecd',
        mutterHz: 130,
        tagline: 'Carves between aerial rings on glowing glass-tube wings.',
      },
    ],
    crewVariants: [
      {
        id: 'nb-lagoon-glider',
        name: 'Lagoon Glider',
        equips: { back: 'gsr-mist-wings', neck: 'visitor-lanyard' },
        look: makeCrewLook(0x00e5ff, 0x283593, 0x140824, 0x00bcd4, null, {
          back: 'gsr-mist-wings',
          neck: 'visitor-lanyard',
        }, { dress: true }),
        mutterHz: 134,
        shoutouts: [
          'Aether mist never dampens clay—glide right through the lagoon!',
          'DJ Broadcast spun his very first pirate 45 at the top of this spire!',
          'Catch the mist-bowl updraft to hit the aerial rings!',
        ],
      },
      {
        id: 'nb-spire-mist-rat',
        name: 'Spire Mist-Rat',
        equips: { head: 'flight-goggles', hand: 'super-soaker' },
        look: makeCrewLook(0xff4ecd, 0x006064, 0x1b1d28, 0x222222, 0xe0f7fa, {
          head: 'flight-goggles',
          hand: 'super-soaker',
        }),
        mutterHz: 120,
        shoutouts: [
          'Honeymooners are posing by the pier—don’t spray the postcard stand!',
          'Liquid DnB at 170 BPM feels weightless up on the 16-meter apex!',
          'Keep your goggles down when crossing the glass tubing rails!',
        ],
      },
    ],
  },

  'mulch-alley': {
    areaId: 'mulch-alley',
    areaNumber: 5,
    areaName: 'Mulch Alley Arcade',
    built: true,
    leader: {
      id: 'leader-quarter-quinn',
      name: 'Quarter-Slot Quinn',
      title: 'High-Score Arcade Boss',
      gangName: 'The Token Sharks',
      prefabId: 'gsr-arcade-cabinet',
      primaryColor: '#ff5252',
      accentColor: '#ffd740',
      mutterHz: 96,
      styleNote: 'Woken CRT arcade cabinet crowned with glowing token-slot eyes.',
    },
    sidekicks: [
      {
        id: 'sk-pixel-pip',
        name: 'Pixel Pip',
        role: 'Bootleg Tape Runner',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0xd50000, 0x212121, 0x111111, 0xff5252, null, {
          head: 'dealer-visor',
          hand: 'pocket-transistor',
        }),
        accentColor: '#ff5252',
        mutterHz: 136,
        tagline: 'Hustles bootleg Mulch Club cassettes between fire-escape switchbacks.',
      },
      {
        id: 'sk-bootleg-bramble',
        name: 'Bootleg Bramble',
        role: 'CRT Tape Vault',
        kind: 'woken',
        prefabId: 'gsr-cassette-deck',
        accentColor: '#ffd740',
        mutterHz: 108,
        tagline: 'Guards Don Compost’s encrypted Sky-Mall coordinate reels.',
      },
    ],
    crewVariants: [
      {
        id: 'ma-token-hustler',
        name: 'Token Hustler',
        equips: { head: 'dealer-visor', neck: 'time-card-clip' },
        look: makeCrewLook(0xb71c1c, 0x311b92, 0x120824, 0x222222, null, {
          head: 'dealer-visor',
          neck: 'time-card-clip',
        }),
        mutterHz: 126,
        shoutouts: [
          'Two tokens per grind—no quarters, no continue!',
          'Chain the CRT bumper pads if you want to beat Quinn’s high score!',
          'Don Compost’s back-alley tapes are strictly members-only!',
        ],
      },
      {
        id: 'ma-crt-scavenger',
        name: 'CRT Scavenger',
        equips: { head: 'gsr-dj-headphones', hand: 'pocket-transistor' },
        look: makeCrewLook(0xff5252, 0x263238, 0x1b1d28, 0x111111, 0xcfd8dc, {
          head: 'gsr-dj-headphones',
          hand: 'pocket-transistor',
        }),
        mutterHz: 114,
        shoutouts: [
          'Hear that chiptune bass? Straight off an 8-bit Turfton bootleg!',
          'Watch the fire-escape gaps—the alley drops straight to the clouds!',
          'Quinn’s marquee lights up whenever someone hits a 5x combo!',
        ],
      },
    ],
  },

  'tupperware-mall': {
    areaId: 'tupperware-mall',
    areaNumber: 6,
    areaName: 'Tupperware Sky-Mall',
    built: true,
    leader: {
      id: 'leader-barcode-betty',
      name: 'Barcode Betty',
      title: 'Clearance Checkout Sovereign',
      gangName: 'The Clearance Crew',
      prefabId: 'gsr-barcode-register',
      primaryColor: '#4dd0e1',
      accentColor: '#ff8a80',
      mutterHz: 106,
      styleNote: 'Woken Clay-Mart price-scanner register firing laser beat-beams.',
    },
    sidekicks: [
      {
        id: 'sk-cartwheel-carl',
        name: 'Cartwheel Carl',
        role: 'Atrium Cart Captain',
        kind: 'woken',
        prefabId: 'gsr-shopping-cart-woken',
        accentColor: '#4dd0e1',
        mutterHz: 96,
        tagline: 'Drifts down inverted escalators at 60 km/h with squeaky front casters.',
      },
      {
        id: 'sk-coupon-cora',
        name: 'Coupon Cora',
        role: 'Food-Court DJ',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0x4dd0e1, 0xf06292, 0xfafafa, 0x4dd0e1, null, {
          head: 'golf-visor',
          back: 'disco-pack',
        }, { dress: true }),
        accentColor: '#ff8a80',
        mutterHz: 138,
        tagline: 'Spins 126 BPM future-funk beside the acorn-smoothie kiosk.',
      },
    ],
    crewVariants: [
      {
        id: 'tm-clearance-clerk',
        name: 'Clearance Clerk',
        equips: { neck: 'name-tag', back: 'disco-pack' },
        look: makeCrewLook(0x00acc1, 0xf8bbd0, 0x37474f, 0xffffff, null, {
          neck: 'name-tag',
          back: 'disco-pack',
        }),
        mutterHz: 128,
        shoutouts: [
          'Attention shoppers: unauthorized rail-grinding in aisle four!',
          'Everything under the Tupperware dome is 40% off—except Betty’s turf!',
          'Hop the up-escalator to reach the food-court skylight!',
        ],
      },
      {
        id: 'tm-food-court-loiterer',
        name: 'Food-Court Loiterer',
        equips: { head: 'golf-visor', hand: 'martini-glass' },
        look: makeCrewLook(0xff8a80, 0x80deea, 0x455a64, 0x222222, null, {
          head: 'golf-visor',
          hand: 'martini-glass',
        }, { glasses: true }),
        mutterHz: 122,
        shoutouts: [
          'I’ve been skating this atrium since 1997—don’t spill my acorn-fizz!',
          'Plastic ferns have the best reverb in the whole mall!',
          'Dodge the red scanner beams when Betty rings up a sale!',
        ],
      },
    ],
  },

  'hoa-citadel': {
    areaId: 'hoa-citadel',
    areaNumber: 7,
    areaName: 'HOA Citadel Terrace',
    built: true,
    leader: {
      id: 'leader-vance-bot',
      name: 'Inspector Vance-Bot',
      title: '100 MHz Compliance Jammer',
      gangName: 'The Bylaw Brass',
      prefabId: 'gsr-megaphone-statue',
      primaryColor: '#ffd740',
      accentColor: '#2e7d32',
      mutterHz: 70,
      styleNote: 'Colossal brass HOA megaphone statue enforcing beige-swatch bylaws.',
    },
    sidekicks: [
      {
        id: 'sk-clipboard-clive',
        name: 'Clipboard Clive',
        role: 'Deputy Citation Officer',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0x2e7d32, 0xd7ccc8, 0x4e342e, 0x1b1d28, 0xe0e0e0, {
          head: 'megaphone-cap',
          hand: 'ruler-stick',
        }, { glasses: true }),
        accentColor: '#ffd740',
        mutterHz: 110,
        tagline: 'Measures grass-blade height mid-grind with a brass ruler.',
      },
      {
        id: 'sk-beige-bertha',
        name: 'Beige-Swatch Bertha',
        role: 'Trim & Topiary Marshal',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0xa1887f, 0xd7ccc8, 0x5d4037, 0x222222, null, {
          head: 'microfiber-bowler',
          neck: 'gba-whistle',
        }, { dress: true }),
        accentColor: '#2e7d32',
        mutterHz: 126,
        tagline: 'Blows an off-beat whistle at any color brighter than eggshell.',
      },
    ],
    crewVariants: [
      {
        id: 'hc-citation-warden',
        name: 'Citation Warden',
        equips: { head: 'megaphone-cap', neck: 'gba-whistle' },
        look: makeCrewLook(0x1b5e20, 0xefebe9, 0x3e2723, 0x111111, 0xbdbdbd, {
          head: 'megaphone-cap',
          neck: 'gba-whistle',
        }),
        mutterHz: 102,
        shoutouts: [
          'Section 12-B: Neon graffiti is strictly non-compliant with beige standards!',
          'Do NOT grind the "NO GRINDING" signs—that’s a double citation!',
          'Quiet hours begin whenever Inspector Vance-Bot says so!',
        ],
      },
      {
        id: 'hc-hedge-inspector',
        name: 'Hedge Inspector',
        equips: { head: 'microfiber-bowler', hand: 'ruler-stick' },
        look: makeCrewLook(0x8d6e63, 0xd7ccc8, 0x4e342e, 0x222222, null, {
          head: 'microfiber-bowler',
          hand: 'ruler-stick',
        }, { glasses: true }),
        mutterHz: 118,
        shoutouts: [
          'Your inline wheels are two millimeters outside regulation width!',
          'Keep off the manicured sky-hedges, runner!',
          'The Gazebo Tribunal is in session—no air-tricks allowed!',
        ],
      },
    ],
  },

  'subsoil-relay': {
    areaId: 'subsoil-relay',
    areaNumber: 8,
    areaName: 'Subsoil Relay Tower',
    built: true,
    leader: {
      id: 'leader-static-sol',
      name: 'Static-Crown Sol',
      title: '108.0 Keeper of the Fork',
      gangName: 'The Deep-Cut Syndicate',
      prefabId: 'gsr-tuning-fork-pylon',
      primaryColor: '#7c4dff',
      accentColor: '#ffab40',
      mutterHz: 68,
      styleNote: 'Colossal tuning-fork antenna spire humming with 166 BPM dark dub-jungle.',
    },
    sidekicks: [
      {
        id: 'sk-reel-rex',
        name: 'Reel-to-Reel Rex',
        role: 'Tape Archive Sentinel',
        kind: 'woken',
        prefabId: 'gsr-cassette-deck',
        accentColor: '#ffab40',
        mutterHz: 92,
        tagline: 'Spins subterranean 108.0 dub reels from DJ Moleman’s deepest tunnel.',
      },
      {
        id: 'sk-subbass-sable',
        name: 'Sub-Bass Sable',
        role: 'Frequency Dish Spotter',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0x311b92, 0x1a0d36, 0x111111, 0x7c4dff, null, {
          head: 'tinfoil-brim',
          back: 'explorer-pack',
        }),
        accentColor: '#7c4dff',
        mutterHz: 116,
        tagline: 'Listens for the silent ninth band humming above the scaffolding.',
      },
    ],
    crewVariants: [
      {
        id: 'sr-static-listener',
        name: 'Static Listener',
        equips: { head: 'tinfoil-brim', neck: 'tin-can-phone' },
        look: makeCrewLook(0x4527a0, 0x1c0e36, 0x111111, 0x222222, 0x9575cd, {
          head: 'tinfoil-brim',
          neck: 'tin-can-phone',
        }),
        mutterHz: 100,
        shoutouts: [
          'We aren’t jamming the signal—we’re holding the silence down!',
          'Tune the parabolic dishes before the tuning fork loses phase!',
          'DJ Moleman sent this 108.0 frequency up from three yards below Turfton!',
        ],
      },
      {
        id: 'sr-tape-archivist',
        name: 'Tape Archivist',
        equips: { back: 'explorer-pack', hand: 'porcelain-lantern' },
        look: makeCrewLook(0x512da8, 0x261542, 0x1b1d28, 0x111111, null, {
          back: 'explorer-pack',
          hand: 'porcelain-lantern',
        }),
        mutterHz: 122,
        shoutouts: [
          'Keep your lantern lit—the shaft scaffolding drops into pure static!',
          'If all eight bands harmonize at once, something above us wakes up!',
          'Flip the dish polarity mid-grind to cross the central spire!',
        ],
      },
    ],
  },

  'zero-hz-zenith': {
    areaId: 'zero-hz-zenith',
    areaNumber: 9,
    areaName: 'Zero-Hz Zenith',
    built: true,
    leader: {
      id: 'leader-original-needle',
      name: 'The Original Needle',
      title: 'Apex of the Silent Frequency',
      gangName: 'The Unfired Choir',
      prefabId: 'gsr-gramophone-needle',
      primaryColor: '#ffffff',
      accentColor: '#ffd740',
      mutterHz: 64,
      styleNote: 'Colossal living gramophone horn hovering over an inverted vinyl cosmos.',
    },
    sidekicks: [
      {
        id: 'sk-deadwax-echo',
        name: 'Dead-Wax Echo',
        role: 'Unfired Herald',
        kind: 'gnome',
        gnomeLook: makeCrewLook(0xf5f5f5, 0x212121, 0x111111, 0xfafafa, null, {
          head: 'letter-crown',
          neck: 'stopping-stone-charm',
        }),
        accentColor: '#ffd740',
        mutterHz: 110,
        tagline: 'Skates the silent run-out groove in pale monochrome clay.',
      },
      {
        id: 'sk-mute-metronome',
        name: 'Mute Metronome',
        role: 'Zero-Beat Keeper',
        kind: 'woken',
        prefabId: 'gsr-metronome',
        accentColor: '#ffffff',
        mutterHz: 86,
        tagline: 'Swings without a sound until all eight regional styles ignite it.',
      },
    ],
    crewVariants: [
      {
        id: 'zh-unfired-acolyte',
        name: 'Unfired Acolyte',
        equips: { head: 'chalk-cap', neck: 'stopping-stone-charm' },
        look: makeCrewLook(0xe0e0e0, 0x424242, 0x212121, 0xbdbdbd, null, {
          head: 'chalk-cap',
          neck: 'stopping-stone-charm',
        }),
        mutterHz: 105,
        shoutouts: [
          'No single genre survives Zero-Hz—only the whole Archipelago together!',
          'Paint the mono-grooves to wake the color in the vinyl!',
          'Listen closely... beneath the silence, every district is humming!',
        ],
      },
      {
        id: 'zh-groove-phantom',
        name: 'Groove Phantom',
        equips: { head: 'letter-crown', back: 'picnic-cape' },
        look: makeCrewLook(0xfafafa, 0x303030, 0x181818, 0xeeeeee, 0xe0e0e0, {
          head: 'letter-crown',
          back: 'picnic-cape',
        }),
        mutterHz: 94,
        shoutouts: [
          'Every needle eventually lifts—unless the runners keep spinning!',
          'Four-Track Monolith ahead—bring all eight beats to the crown!',
          'The Unfired Choir remembers the world before the first broadcast!',
        ],
      },
    ],
  },
};
