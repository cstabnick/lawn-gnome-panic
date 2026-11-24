import type { GsrAreaId } from '../audio/jingles';

export type CutsceneKind = 'game-intro' | 'level-intro' | 'boss-intro' | 'boss-defeat' | 'special';

export type CutsceneCameraCue =
  | 'wide-orbit'
  | 'leader-closeup'
  | 'sidekicks-pan'
  | 'boss-stage'
  | 'player-hero'
  | 'sky-ascend'
  | 'dj-booth'
  | 'crew-lineup';

export interface CutsceneTitleCard {
  badge: string;
  name: string;
  subtitle: string;
  accentColor: string;
}

export interface CutsceneBeat {
  speaker: string;
  role?: string;
  text: string;
  mutterHz: number;
  camera: CutsceneCameraCue;
  playJingle?: GsrAreaId;
  titleCard?: CutsceneTitleCard;
}

export interface CutsceneDef {
  id: string;
  kind: CutsceneKind;
  areaId?: GsrAreaId;
  title: string;
  nextLevelId?: GsrAreaId | null;
  beats: readonly CutsceneBeat[];
}

export const GAME_INTRO_CUTSCENE: CutsceneDef = {
  id: 'game-intro',
  kind: 'game-intro',
  title: 'Welcome to the Broadcast Archipelago',
  beats: [
    {
      speaker: 'DJ Broadcast',
      role: 'Pirate Radio Host',
      text: 'Yo, fresh runner! High above the garden in the Upper Aether, leaked pirate radio from Turfton tangles with glowing ley-lines—braiding into floating sky-islands and grindable Signal Rails!',
      mutterHz: 98,
      camera: 'dj-booth',
      titleCard: {
        badge: 'PIRATE TRANSMISSION · 108.0',
        name: 'THE BROADCAST ARCHIPELAGO',
        subtitle: 'Upper Aether · Sky-Islands & Ley-Line Signal Rails',
        accentColor: '#00e5ff',
      },
    },
    {
      speaker: 'Glide',
      role: 'Ley-Line Runner · Rail Carver',
      text: 'Where the signal knots tightest, ordinary things wake up! Upright pianos, bongos, foundry kilns, and arcade cabinets—The Woken, sprouting clay-glaze eyes and beats of their own.',
      mutterHz: 112,
      camera: 'wide-orbit',
    },
    {
      speaker: 'Spin',
      role: 'Ley-Line Runner · Trick Specialist',
      text: 'Eight turf-war gangs have locked down the Frequency Ladder climbing into the clouds. Each gang’s crew will test you one quest at a time before their Leader steps onto the stage!',
      mutterHz: 118,
      camera: 'sky-ascend',
      titleCard: {
        badge: 'THE FREQUENCY LADDER · 8 DISTRICTS',
        name: 'GANG TURF & BOSS STAGES',
        subtitle: 'Clear Every Crew Quest to Challenge Each Leader',
        accentColor: '#ff4ecd',
      },
    },
    {
      speaker: 'Tag',
      role: 'Ley-Line Runner · Graffiti Ace',
      text: 'Good thing you’ve got Aether Rollerblades! You’re riding with our squad—me, Spin, Glide, and DJ Broadcast on the pirate deck—ready to paint every sky-island in Turfton color.',
      mutterHz: 124,
      camera: 'crew-lineup',
      titleCard: {
        badge: 'THE CREW · LEY-LINE RUNNERS',
        name: 'SPIN, TAG & GLIDE',
        subtitle: 'Trick Specialists · Graffiti Aces · Rail Carvers',
        accentColor: '#ffd740',
      },
    },
    {
      speaker: 'DJ Broadcast',
      role: 'Pirate Radio Host',
      text: 'Quick rig check: Skate with WASD or Arrows, Jump & Double-Jump with Space, jump onto any glowing rail or billboard to Grind, hug buildings to Wall-Ride, Spray with F, and Trick with E right on the beat!',
      mutterHz: 96,
      camera: 'player-hero',
    },
  ],
};

export interface AreaCutsceneBundle {
  levelIntro: CutsceneDef;
  bossIntro: CutsceneDef;
  bossDefeat: CutsceneDef;
  questIntros?: Record<string, CutsceneDef>;
  extra?: readonly CutsceneDef[];
}

export const AREA_CUTSCENES: Record<GsrAreaId, AreaCutsceneBundle> = {
  'velvet-keys': {
    levelIntro: {
      id: 'area-1-level-intro',
      kind: 'level-intro',
      areaId: 'velvet-keys',
      title: 'Area 1: Velvet Keys Plaza',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'First rung of the Frequency Ladder: Velvet Keys Plaza! Stabilize the D Dorian base carrier so our signal holds steady.',
          mutterHz: 98,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Maestro Upright',
          role: 'Leader · The Ivory Syndicate',
          text: 'Only conservatory-trained D Dorian belongs on these rooftops! Ivory Syndicate—keep those street skaters off my recital stage!',
          mutterHz: 76,
          camera: 'leader-closeup',
          playJingle: 'velvet-keys',
          titleCard: {
            badge: 'AREA 1 · THE IVORY SYNDICATE',
            name: 'MAESTRO UPRIGHT',
            subtitle: 'Grand Conservatory Bandleader · 162 BPM Jungle-Jazz',
            accentColor: '#ff4ecd',
          },
        },
        {
          speaker: 'Pluck & Saxy Sal',
          role: 'Syndicate Sidekicks',
          text: 'Pluck: "Catch me on the awning if you can!" — Saxy Sal: "Best reverb in the plaza is right by the Piano Fountain!"',
          mutterHz: 114,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-1-boss-intro',
      kind: 'boss-intro',
      areaId: 'velvet-keys',
      title: 'Boss Showdown: Maestro Upright',
      beats: [
        {
          speaker: 'Maestro Upright',
          role: 'Leader · The Ivory Syndicate',
          text: 'You tagged my billboards, out-skated Pluck, and hijacked the relay dishes?! Very well—step onto the Penthouse Stage!',
          mutterHz: 74,
          camera: 'boss-stage',
          playJingle: 'velvet-keys',
          titleCard: {
            badge: 'BOSS ENCOUNTER · PENTHOUSE STAGE',
            name: 'MAESTRO UPRIGHT',
            subtitle: 'Tag the Maestro 3 times to retune Velvet Keys!',
            accentColor: '#ffd740',
          },
        },
        {
          speaker: 'Saxy Sal',
          role: 'Syndicate Sidekick',
          text: 'Careful, runner—when the Maestro’s keys glow gold, the whole roof shakes in 16th-note breaks!',
          mutterHz: 118,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-1-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'velvet-keys',
      title: 'Velvet Keys Retuned!',
      nextLevelId: 'bongo-basin',
      beats: [
        {
          speaker: 'Maestro Upright',
          role: 'Leader · The Ivory Syndicate',
          text: 'Magnificent phrasing... street-skating has its own counterpoint after all. Take the D Dorian carrier—our conservatory is yours!',
          mutterHz: 80,
          camera: 'leader-closeup',
          playJingle: 'velvet-keys',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Area 1 locked in! Base melody is crystal clear—next stop up the ladder: Bongo Basin Overpass!',
          mutterHz: 100,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'vk-pluck-chase': {
        id: 'quest-vk-pluck-chase',
        kind: 'special',
        areaId: 'velvet-keys',
        title: 'Handoff: Out-Groove Pluck',
        beats: [
          {
            speaker: 'Pluck',
            role: 'Ivory Syndicate · Upright Bass Runner',
            text: 'So you tagged our conservatory billboards—cute! Around Velvet Keys, street paint doesn’t earn a recital pass unless you can keep time with a walking D Dorian bassline.',
            mutterHz: 108,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Saxy Sal',
            role: 'Ivory Syndicate · Plaza Alto Busker',
            text: 'Pluck’s bouncing past the Piano Fountain on a single steel endpin! Boost with Shift and spray him three times if you want the Ivory Syndicate to take you seriously.',
            mutterHz: 118,
            camera: 'wide-orbit',
          },
        ],
      },
      'vk-tune-dishes': {
        id: 'quest-vk-tune-dishes',
        kind: 'special',
        areaId: 'velvet-keys',
        title: 'Handoff: Tune the Courtyard Dishes',
        beats: [
          {
            speaker: 'Saxy Sal',
            role: 'Ivory Syndicate · Plaza Alto Busker',
            text: 'Whoa—you actually out-grooved Pluck! Maestro Upright hates Ley-Line Runners messing with conservatory acoustics, so he locked the rooftop dishes to pure recital frequency.',
            mutterHz: 118,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Pluck',
            role: 'Ivory Syndicate · Upright Bass Runner',
            text: 'Grind the bridges linking the Vinyl Rotunda, Espresso-Dew Cafe, and Brass-Bell Amphitheater to retune all three Relay Dishes—then Maestro’s Penthouse Stage opens up!',
            mutterHz: 108,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'bongo-basin': {
    levelIntro: {
      id: 'area-2-level-intro',
      kind: 'level-intro',
      areaId: 'bongo-basin',
      title: 'Area 2: Bongo Basin Overpass',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Welcome to Bongo Basin Overpass! Grab a bowl of acorn-chili at Brenda’s diner and lock down the Master Clock rhythm!',
          mutterHz: 98,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Conga King Kora',
          role: 'Leader · The Rip-Skin Collective',
          text: 'Four decks of tarmac and every rimshot belongs to the Rip-Skin Collective! Show me your bounce or pay the rhythm toll!',
          mutterHz: 84,
          camera: 'leader-closeup',
          playJingle: 'bongo-basin',
          titleCard: {
            badge: 'AREA 2 · THE RIP-SKIN COLLECTIVE',
            name: 'CONGA KING KORA',
            subtitle: 'Overpass Rhythm Sovereign · 132 BPM Bongo Rip Mix',
            accentColor: '#ff9100',
          },
        },
        {
          speaker: 'Rimshot Rizzo & Timbale Tobe',
          role: 'Collective Sidekicks',
          text: 'Rizzo: "Keep up on the S-curve, rookie!" — Tobe: "Hit the bongo pads on the downbeat!"',
          mutterHz: 120,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-2-boss-intro',
      kind: 'boss-intro',
      areaId: 'bongo-basin',
      title: 'Boss Showdown: Conga King Kora',
      beats: [
        {
          speaker: 'Conga King Kora',
          role: 'Leader · The Rip-Skin Collective',
          text: 'You cleared my toll-gates and silenced the drumline?! Climb up to the 12-meter Cloverleaf Crown and face the King!',
          mutterHz: 82,
          camera: 'boss-stage',
          playJingle: 'bongo-basin',
          titleCard: {
            badge: 'BOSS ENCOUNTER · CLOVERLEAF CROWN',
            name: 'CONGA KING KORA',
            subtitle: 'Ride the bongo pads up top and tag Kora 3 times!',
            accentColor: '#ff9100',
          },
        },
        {
          speaker: 'Rimshot Rizzo',
          role: 'Collective Sidekick',
          text: 'Nobody out-drifts the King on the upper viaduct—let’s hear that polyrhythm!',
          mutterHz: 124,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-2-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'bongo-basin',
      title: 'Bongo Basin Retuned!',
      nextLevelId: 'chrome-kiln',
      beats: [
        {
          speaker: 'Conga King Kora',
          role: 'Leader · The Rip-Skin Collective',
          text: 'Hah! Cleanest 16th-note slap I’ve heard since the highway opened. The Master Clock is synced—keep climbing, runner!',
          mutterHz: 86,
          camera: 'leader-closeup',
          playJingle: 'bongo-basin',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Rhythm locked! Now we need raw signal wattage—head into the molten canyon of Chrome Kiln Foundry!',
          mutterHz: 100,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'bb-bongo-chain': {
        id: 'quest-bb-bongo-chain',
        kind: 'special',
        areaId: 'bongo-basin',
        title: 'Handoff: Bongo Bounce Jam',
        beats: [
          {
            speaker: 'Rimshot Rizzo',
            role: 'Rip-Skin Collective · Viaduct Pace-Setter',
            text: 'Alright, you painted the toll decks—now show us your bounce! The Rip-Skin Collective built this four-tier S-curve for riders who never drop a beat in mid-air.',
            mutterHz: 124,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Timbale Tobe',
            role: 'Rip-Skin Collective · Toll-Gate Percussionist',
            text: 'Hit all five glowing Bongo Pads from the Big Acorn Diner up to the Cloverleaf Crown—every drum skin resets your Air-Jump, so chain ’em clean!',
            mutterHz: 102,
            camera: 'wide-orbit',
          },
        ],
      },
      'bb-black-dew-relays': {
        id: 'quest-bb-black-dew-relays',
        kind: 'special',
        areaId: 'bongo-basin',
        title: 'Handoff: Hijack the Black Dew Relays',
        beats: [
          {
            speaker: 'Timbale Tobe',
            role: 'Rip-Skin Collective · Toll-Gate Percussionist',
            text: 'Clean aerial cadence, runner! Still, Conga King Kora says pirate broadcasts don’t run on air—our Black Dew relays fuel the whole Master Clock.',
            mutterHz: 102,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Rimshot Rizzo',
            role: 'Rip-Skin Collective · Viaduct Pace-Setter',
            text: 'Check the Southbound Viaduct, West Toll-Gate Deck, and Conga Grain-Silo. Spray-tune all three Black Dew relays if you’re bold enough to hijack our tempo!',
            mutterHz: 124,
            camera: 'wide-orbit',
          },
        ],
      },
      'bb-clear-drumline': {
        id: 'quest-bb-clear-drumline',
        kind: 'special',
        areaId: 'bongo-basin',
        title: 'Handoff: Clear the Drumline',
        beats: [
          {
            speaker: 'Rimshot Rizzo',
            role: 'Rip-Skin Collective · Viaduct Pace-Setter',
            text: 'You hijacked the Dew relays?! That’s a declaration of rhythm war on the Rip-Skin Collective—Brenda’s chili-bowl truce is officially over!',
            mutterHz: 124,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Timbale Tobe',
            role: 'Rip-Skin Collective · Toll-Gate Percussionist',
            text: 'Our three Conga Sentries are marching the 4-meter Southbound Viaduct Span! Silence the drumline and Kora will meet you on the Cloverleaf Crown.',
            mutterHz: 102,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'chrome-kiln': {
    levelIntro: {
      id: 'area-3-level-intro',
      kind: 'level-intro',
      areaId: 'chrome-kiln',
      title: 'Area 3: Chrome Kiln Foundry',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Careful—it’s 900 degrees of acid-funk down in Chrome Kiln Foundry! These smelters are giant vacuum-tube amplifiers for our signal.',
          mutterHz: 96,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Furnace Vera',
          role: 'Leader · The Glaze Grinders',
          text: 'Union rules, runner: nobody cools my boilers! If you want Crucible wattage, ride the updraft vents and prove your mettle!',
          mutterHz: 72,
          camera: 'leader-closeup',
          playJingle: 'chrome-kiln',
          titleCard: {
            badge: 'AREA 3 · THE GLAZE GRINDERS',
            name: 'FURNACE VERA',
            subtitle: 'Crucible Union Forge-Master · 138 BPM Acid-Funk',
            accentColor: '#76ff03',
          },
        },
        {
          speaker: 'Trundle & Slaghammer Salvo',
          role: 'Grinder Sidekicks',
          text: 'Trundle: "Don’t splash my glaze vat!" — Salvo: "Safety inspector’s watching, so make those vent launches look sharp!"',
          mutterHz: 90,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-3-boss-intro',
      kind: 'boss-intro',
      areaId: 'chrome-kiln',
      title: 'Boss Showdown: Furnace Vera',
      beats: [
        {
          speaker: 'Furnace Vera',
          role: 'Leader · The Glaze Grinders',
          text: 'You tagged the stacks and out-rode my anvil patrol?! Meet me on the 13-meter Crucible Bridge—let’s turn up the 303!',
          mutterHz: 70,
          camera: 'boss-stage',
          playJingle: 'chrome-kiln',
          titleCard: {
            badge: 'BOSS ENCOUNTER · CRUCIBLE BRIDGE',
            name: 'FURNACE VERA',
            subtitle: 'Launch off the exhaust vents and tag Vera 3 times!',
            accentColor: '#76ff03',
          },
        },
        {
          speaker: 'Slaghammer Salvo',
          role: 'Grinder Sidekick',
          text: 'Hard hats on, crew! Vera’s ride cymbal is about to rattle the whole canyon!',
          mutterHz: 88,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-3-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'chrome-kiln',
      title: 'Chrome Kiln Retuned!',
      nextLevelId: 'neon-birdbath',
      beats: [
        {
          speaker: 'Furnace Vera',
          role: 'Leader · The Glaze Grinders',
          text: 'Pure chrome finish! You’ve earned union clearance—take our thermal wattage and pierce the mid-Aether cloud!',
          mutterHz: 76,
          camera: 'leader-closeup',
          playJingle: 'chrome-kiln',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Wattage at 100%! Up next is my old stomping ground—Neon Birdbath Spire!',
          mutterHz: 102,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'ck-cymbal-patrol': {
        id: 'quest-ck-cymbal-patrol',
        kind: 'special',
        areaId: 'chrome-kiln',
        title: 'Handoff: Mute the Anvil Patrol',
        beats: [
          {
            speaker: 'Trundle',
            role: 'Glaze Grinders · Molten Glaze Hauler',
            text: 'Hey! Watch where you sling that neon paint—you almost splashed my 900-degree boot glaze! Local 404 doesn’t let outside skaters tag the smelter stacks for free.',
            mutterHz: 94,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Slaghammer Salvo',
            role: 'Glaze Grinders · Union Shop Steward',
            text: 'Our three Anvil Sentries just clocked in on the East Glaze-Press Hall roof. Take the green ramp up and mute their 138 BPM clang if you want union clearance!',
            mutterHz: 88,
            camera: 'wide-orbit',
          },
        ],
      },
      'ck-vent-dishes': {
        id: 'quest-ck-vent-dishes',
        kind: 'special',
        areaId: 'chrome-kiln',
        title: 'Handoff: Tune the Smelter Dishes',
        beats: [
          {
            speaker: 'Slaghammer Salvo',
            role: 'Glaze Grinders · Union Shop Steward',
            text: 'Welp, there goes the foundry whistle—you silenced the Anvil Patrol clean! Inspector Clem just flipped the "DAYS SINCE GLAZE SPILL" sign back to zero.',
            mutterHz: 88,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Trundle',
            role: 'Glaze Grinders · Molten Glaze Hauler',
            text: 'Still gotta prove you can ride the heat! Launch off the canyon’s Updraft Vents to tune the three Smelter Dishes on the Chimney, Canteen, and Crucible Crown!',
            mutterHz: 94,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'neon-birdbath': {
    levelIntro: {
      id: 'area-4-level-intro',
      kind: 'level-intro',
      areaId: 'neon-birdbath',
      title: 'Area 4: Neon Birdbath Spire',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Look at that cyan mist... Neon Birdbath Spire, where I spun my very first pirate 45. Retune this beacon and we’ll expose the upper dome!',
          mutterHz: 100,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Fountainhead Finn',
          role: 'Leader · The Splash-Back Skaters',
          text: 'This spire is a living museum of midnight radio! Splash-Back Skaters—keep the mist lagoon pristine and the glass rails humming!',
          mutterHz: 90,
          camera: 'leader-closeup',
          playJingle: 'neon-birdbath',
          titleCard: {
            badge: 'AREA 4 · THE SPLASH-BACK SKATERS',
            name: 'FOUNTAINHEAD FINN',
            subtitle: 'Spire Glass-Beacon Curator · 170 BPM Liquid Jazz-DnB',
            accentColor: '#00e5ff',
          },
        },
        {
          speaker: 'Gus & Vapor Vesper',
          role: 'Splash-Back Sidekicks',
          text: 'Gus: "Catch me around the lagoon!" — Vesper: "Soar through the aerial rings to reach the 16.5m Apex!"',
          mutterHz: 118,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-4-boss-intro',
      kind: 'boss-intro',
      areaId: 'neon-birdbath',
      title: 'Boss Showdown: Fountainhead Finn',
      beats: [
        {
          speaker: 'Fountainhead Finn',
          role: 'Leader · The Splash-Back Skaters',
          text: 'You threaded the mist rings and tagged Gus on the spiral?! Climb to the Birdbath Apex—show me a Lydian encore!',
          mutterHz: 88,
          camera: 'boss-stage',
          playJingle: 'neon-birdbath',
          titleCard: {
            badge: 'BOSS ENCOUNTER · BIRDBATH APEX',
            name: 'FOUNTAINHEAD FINN',
            subtitle: 'Ascend the spiral beacon and tag Finn 3 times!',
            accentColor: '#00e5ff',
          },
        },
        {
          speaker: 'Vapor Vesper',
          role: 'Splash-Back Sidekick',
          text: 'All eyes from the honeymoon pier are on the lighthouse—don’t miss the final rail!',
          mutterHz: 130,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-4-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'neon-birdbath',
      title: 'Neon Birdbath Beacon Lit!',
      nextLevelId: 'mulch-alley',
      beats: [
        {
          speaker: 'Fountainhead Finn',
          role: 'Leader · The Splash-Back Skaters',
          text: 'Look at the neon glass—it’s scattering pirate waves across the entire upper sky! You’re worthy of the Birdbath, runner.',
          mutterHz: 92,
          camera: 'leader-closeup',
          playJingle: 'neon-birdbath',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Beacon’s live! Look up through the cloud deck—we just picked up an encrypted chiptune signal from Mulch Alley Arcade!',
          mutterHz: 102,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'nb-mist-rings': {
        id: 'quest-nb-mist-rings',
        kind: 'special',
        areaId: 'neon-birdbath',
        title: 'Handoff: Fly the Mist Rings',
        beats: [
          {
            speaker: 'Vapor Vesper',
            role: 'Splash-Back Skaters · Spire Aerial Guide',
            text: 'Fresh neon on the rim, runner! Up here at Neon Birdbath Spire, the Splash-Back Skaters live by one rule: never skate flat when the mist geysers can carry you into the clouds.',
            mutterHz: 130,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Gus',
            role: 'Splash-Back Skaters · Lydian Mist Bassist',
            text: 'Hit the Mist Geysers and glass lagoon rails, then pop an Air-Jump through all four green Mist Rings—let’s see if a Turfton runner can hold 170 BPM in mid-air!',
            mutterHz: 104,
            camera: 'wide-orbit',
          },
        ],
      },
      'nb-gus-chase': {
        id: 'quest-nb-gus-chase',
        kind: 'special',
        areaId: 'neon-birdbath',
        title: 'Handoff: Out-Skate Gus',
        beats: [
          {
            speaker: 'Gus',
            role: 'Splash-Back Skaters · Lydian Mist Bassist',
            text: 'Alright, you’ve got air—my cousin Pluck down in Velvet Keys warned me you had serious hops! Still, nobody laps the Mist Lagoon faster than a Woken bass on glass rails.',
            mutterHz: 104,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Vapor Vesper',
            role: 'Splash-Back Skaters · Spire Aerial Guide',
            text: 'Gus is carving loops around the water rim—cut inside across the mist pools and hit Spray (F) three times to tag him out!',
            mutterHz: 130,
            camera: 'wide-orbit',
          },
        ],
      },
      'nb-tune-spouts': {
        id: 'quest-nb-tune-spouts',
        kind: 'special',
        areaId: 'neon-birdbath',
        title: 'Handoff: Tune the Pirate Beacons',
        beats: [
          {
            speaker: 'Vapor Vesper',
            role: 'Splash-Back Skaters · Spire Aerial Guide',
            text: 'Whoa, you beat Gus around his own lagoon! Fountainhead Finn says only true midnight-radio legends get to touch DJ Broadcast’s old spire hardware.',
            mutterHz: 130,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Gus',
            role: 'Splash-Back Skaters · Lydian Mist Bassist',
            text: 'Climb to the East Mist-Spa, West Observatory, and 16.5-meter Apex Beacon—tune all three Pirate Beacons to summon Finn for the final Lydian encore!',
            mutterHz: 104,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'mulch-alley': {
    levelIntro: {
      id: 'area-5-level-intro',
      kind: 'level-intro',
      areaId: 'mulch-alley',
      title: 'Area 5: Mulch Alley Arcade',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'We’re in the upper canyon—Mulch Alley Arcade! Don Compost’s bootleg cassettes hold the coordinates to break the Sky-Mall dome.',
          mutterHz: 98,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Quarter-Slot Quinn',
          role: 'Leader · The Token Sharks',
          text: 'No free plays in my alley, runner! Drop a token or beat my CRT high-score chain—Token Sharks, guard the tape vault!',
          mutterHz: 96,
          camera: 'leader-closeup',
          playJingle: 'mulch-alley',
          titleCard: {
            badge: 'AREA 5 · THE TOKEN SHARKS',
            name: 'QUARTER-SLOT QUINN',
            subtitle: 'High-Score Arcade Boss · 118 BPM Chiptune Funk-Hop',
            accentColor: '#ff5252',
          },
        },
        {
          speaker: 'Pixel Pip & Bootleg Bramble',
          role: 'Token Shark Sidekicks',
          text: 'Pip: "Fire-escape switchbacks are mine!" — Bramble: "Good luck cracking Don Compost’s cipher!"',
          mutterHz: 122,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-5-boss-intro',
      kind: 'boss-intro',
      areaId: 'mulch-alley',
      title: 'Boss Showdown: Quarter-Slot Quinn',
      beats: [
        {
          speaker: 'Quarter-Slot Quinn',
          role: 'Leader · The Token Sharks',
          text: 'You racked up a million-point combo on my pinball mezzanine?! Step up to the Marquee Tower—insert coin for Boss Round!',
          mutterHz: 94,
          camera: 'boss-stage',
          playJingle: 'mulch-alley',
          titleCard: {
            badge: 'BOSS ENCOUNTER · MARQUEE TOWER',
            name: 'QUARTER-SLOT QUINN',
            subtitle: 'Bounce the CRT bumpers and tag Quinn 3 times!',
            accentColor: '#ff5252',
          },
        },
        {
          speaker: 'Pixel Pip',
          role: 'Token Shark Sidekick',
          text: 'Watch the 8-bit shockwaves—Quinn’s cabinet just hit attract-mode overdrive!',
          mutterHz: 136,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-5-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'mulch-alley',
      title: 'Mulch Alley Retuned!',
      nextLevelId: 'tupperware-mall',
      beats: [
        {
          speaker: 'Quarter-Slot Quinn',
          role: 'Leader · The Token Sharks',
          text: 'NEW HIGH SCORE... alright, alright, take the bootleg coordinates. Tell Barcode Betty the Sharks sent you!',
          mutterHz: 98,
          camera: 'leader-closeup',
          playJingle: 'mulch-alley',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Coordinates decoded! Next frequency sits right under a giant inverted Tupperware lid—Tupperware Sky-Mall!',
          mutterHz: 100,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'ma-bumper-chain': {
        id: 'quest-ma-bumper-chain',
        kind: 'special',
        areaId: 'mulch-alley',
        title: 'Handoff: CRT Bumper Chain',
        beats: [
          {
            speaker: 'Bootleg Bramble',
            role: 'Token Sharks · CRT Tape Vault',
            text: 'Nice tags on the alley walls, kid—too bad Token Shark turf runs on high-score combos, not spray cans alone. Nobody reaches Don Compost’s vault from street level!',
            mutterHz: 108,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Pixel Pip',
            role: 'Token Sharks · Bootleg Tape Runner',
            text: 'Bounce across all four glowing CRT Bumper Pads from the alley floor up to the Pinball Mezzanine—each bumper resets your Air-Jump like a free extra ball!',
            mutterHz: 136,
            camera: 'wide-orbit',
          },
        ],
      },
      'ma-pip-chase': {
        id: 'quest-ma-pip-chase',
        kind: 'special',
        areaId: 'mulch-alley',
        title: 'Handoff: Catch Pixel Pip',
        beats: [
          {
            speaker: 'Pixel Pip',
            role: 'Token Sharks · Bootleg Tape Runner',
            text: '1-UP! You actually nailed the CRT Bumper Chain! Alright, Ley-Line Runner—let’s see if your Turfton blades can catch the fastest courier in Mulch Alley!',
            mutterHz: 136,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Bootleg Bramble',
            role: 'Token Sharks · CRT Tape Vault',
            text: 'Pip’s weaving down the neon switchbacks with Don Compost’s master cassette! Boost with Shift and spray (F) three times before she ghosts you!',
            mutterHz: 108,
            camera: 'wide-orbit',
          },
        ],
      },
      'ma-tune-cabinets': {
        id: 'quest-ma-tune-cabinets',
        kind: 'special',
        areaId: 'mulch-alley',
        title: 'Handoff: Hack Bootleg Cabinets',
        beats: [
          {
            speaker: 'Bootleg Bramble',
            role: 'Token Sharks · CRT Tape Vault',
            text: 'You caught Pip AND kept your combo alive?! Quarter-Slot Quinn’s coin-door is rattling—he doesn’t hand out Sky-Mall coordinates to unverified rookies.',
            mutterHz: 108,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Pixel Pip',
            role: 'Token Sharks · Bootleg Tape Runner',
            text: 'Hit the CRT Repair Loft, Bootleg Vault, and Pinball Mezzanine to spray-hack all three Bootleg Cabinets—once the cipher drops, Quinn will meet you on the Marquee Tower!',
            mutterHz: 136,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'tupperware-mall': {
    levelIntro: {
      id: 'area-6-level-intro',
      kind: 'level-intro',
      areaId: 'tupperware-mall',
      title: 'Area 6: Tupperware Sky-Mall',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'That translucent Tall-One lid traps static over the whole upper sky. Crack the Clearance Crew’s lock to open the dome!',
          mutterHz: 98,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Barcode Betty',
          role: 'Leader · The Clearance Crew',
          text: 'Attention Ley-Line Runners: unauthorized skating in the atrium will be scanned and marked down! Clearance Crew, man the escalators!',
          mutterHz: 106,
          camera: 'leader-closeup',
          playJingle: 'tupperware-mall',
          titleCard: {
            badge: 'AREA 6 · THE CLEARANCE CREW',
            name: 'BARCODE BETTY',
            subtitle: 'Clearance Checkout Sovereign · 126 BPM Future-Funk',
            accentColor: '#4dd0e1',
          },
        },
        {
          speaker: 'Cartwheel Carl & Coupon Cora',
          role: 'Clearance Sidekicks',
          text: 'Carl: "Out of my lane, squeaky wheel coming through!" — Cora: "Free acorn-smoothie if you clear the food court!"',
          mutterHz: 118,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-6-boss-intro',
      kind: 'boss-intro',
      areaId: 'tupperware-mall',
      title: 'Boss Showdown: Barcode Betty',
      beats: [
        {
          speaker: 'Barcode Betty',
          role: 'Leader · The Clearance Crew',
          text: 'Price check on aisle zero! Climb up to the Checkout Tower—let’s see if your skates can dodge my laser scanner!',
          mutterHz: 104,
          camera: 'boss-stage',
          playJingle: 'tupperware-mall',
          titleCard: {
            badge: 'BOSS ENCOUNTER · CHECKOUT TOWER',
            name: 'BARCODE BETTY',
            subtitle: 'Jump the scanner beams and tag Betty 3 times!',
            accentColor: '#4dd0e1',
          },
        },
        {
          speaker: 'Coupon Cora',
          role: 'Clearance Sidekick',
          text: 'No returns, no exchanges—Betty’s ringing up a 126 BPM finale!',
          mutterHz: 138,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-6-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'tupperware-mall',
      title: 'Sky-Mall Dome Cracked!',
      nextLevelId: 'hoa-citadel',
      beats: [
        {
          speaker: 'Barcode Betty',
          role: 'Leader · The Clearance Crew',
          text: 'BEEP—receipt printed! The Tupperware seal just popped wide open. Enjoy the fresh air up at the HOA Citadel!',
          mutterHz: 108,
          camera: 'leader-closeup',
          playJingle: 'tupperware-mall',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Static shield shattered! Brace yourself—Inspector Vance-Bot’s 100 MHz Compliance Jammer is dead ahead at HOA Citadel Terrace!',
          mutterHz: 98,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'tm-carl-chase': {
        id: 'quest-tm-carl-chase',
        kind: 'special',
        areaId: 'tupperware-mall',
        title: 'Handoff: Out-Drift Cartwheel Carl',
        beats: [
          {
            speaker: 'Cartwheel Carl',
            role: 'Clearance Crew · Atrium Cart Captain',
            text: 'SQUEAK-SQUEAK! Unauthorized graffiti in the Sky-Mall atrium?! The Clearance Crew owns every aisle under this Tupperware dome—and my front caster takes corners at sixty!',
            mutterHz: 96,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Coupon Cora',
            role: 'Clearance Crew · Food-Court DJ',
            text: 'Carl loops right past the Food Court Island! Cut the inside rail, boost with Shift, and tag him three times with Spray (F) to mark down his ego!',
            mutterHz: 138,
            camera: 'wide-orbit',
          },
        ],
      },
      'tm-clearance-rings': {
        id: 'quest-tm-clearance-rings',
        kind: 'special',
        areaId: 'tupperware-mall',
        title: 'Handoff: Fly the Clearance Rings',
        beats: [
          {
            speaker: 'Coupon Cora',
            role: 'Clearance Crew · Food-Court DJ',
            text: 'Haha, you out-drifted Carl’s squeaky wheel! Still, Barcode Betty locks the upper dome behind our sky-aisle clearance gates—no receipt, no roof access.',
            mutterHz: 138,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Cartwheel Carl',
            role: 'Clearance Crew · Atrium Cart Captain',
            text: 'Launch off the Escalator Hub and central Updraft Vents to fly through all four Clearance Rings—let’s see if Ley-Line Runners qualify for upper-mezzanine air!',
            mutterHz: 96,
            camera: 'wide-orbit',
          },
        ],
      },
      'tm-pa-speakers': {
        id: 'quest-tm-pa-speakers',
        kind: 'special',
        areaId: 'tupperware-mall',
        title: 'Handoff: Hijack Mall PA',
        beats: [
          {
            speaker: 'Cartwheel Carl',
            role: 'Clearance Crew · Atrium Cart Captain',
            text: 'All four Clearance Rings punched! Betty’s laser scanner is heating up—she’s blasting 126 BPM store announcements across the whole Tupperware lid to drown out your pirate signal.',
            mutterHz: 96,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Coupon Cora',
            role: 'Clearance Crew · Food-Court DJ',
            text: 'Ride up to Clay-Mart Wing, the Escalator Hub, and Checkout Tower to hijack all three Mall PA Speakers—then Betty’s Checkout showdown goes live!',
            mutterHz: 138,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'hoa-citadel': {
    levelIntro: {
      id: 'area-7-level-intro',
      kind: 'level-intro',
      areaId: 'hoa-citadel',
      title: 'Area 7: HOA Citadel Terrace',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Manicured sky-hedges and beige paint swatches... HOA Citadel Terrace! Grind every "NO GRINDING" sign you see to jam their bylaws!',
          mutterHz: 98,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Inspector Vance-Bot',
          role: 'Leader · The Bylaw Brass',
          text: 'Halt! Your rollerblades exceed approved decibel limits! Bylaw Brass—issue citations and restore eggshell silence!',
          mutterHz: 70,
          camera: 'leader-closeup',
          playJingle: 'hoa-citadel',
          titleCard: {
            badge: 'AREA 7 · THE BYLAW BRASS',
            name: 'INSPECTOR VANCE-BOT',
            subtitle: '100 MHz Compliance Jammer · 112 BPM Brass Dub-Funk',
            accentColor: '#ffd740',
          },
        },
        {
          speaker: 'Clipboard Clive & Beige-Swatch Bertha',
          role: 'Bylaw Sidekicks',
          text: 'Clive: "That air-jump was three inches over regulation!" — Bertha: "Magenta is NOT an approved trim color!"',
          mutterHz: 118,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-7-boss-intro',
      kind: 'boss-intro',
      areaId: 'hoa-citadel',
      title: 'Boss Showdown: Inspector Vance-Bot',
      beats: [
        {
          speaker: 'Inspector Vance-Bot',
          role: 'Leader · The Bylaw Brass',
          text: 'You ground every citation gate and painted the Gazebo Tribunal neon?! Approach the Megaphone Spire for final sentencing!',
          mutterHz: 68,
          camera: 'boss-stage',
          playJingle: 'hoa-citadel',
          titleCard: {
            badge: 'BOSS ENCOUNTER · MEGAPHONE SPIRE',
            name: 'INSPECTOR VANCE-BOT',
            subtitle: 'Override the 100 MHz Jammer by tagging Vance-Bot 3 times!',
            accentColor: '#ffd740',
          },
        },
        {
          speaker: 'Clipboard Clive',
          role: 'Bylaw Sidekick',
          text: 'Form 44-G in triplicate! Nobody overrides the Inspector’s brass section!',
          mutterHz: 110,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-7-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'hoa-citadel',
      title: 'Bylaw Jammer Overridden!',
      nextLevelId: 'subsoil-relay',
      beats: [
        {
          speaker: 'Inspector Vance-Bot',
          role: 'Leader · The Bylaw Brass',
          text: 'Compliance... failed. Wait—this F# harmonic minor actually swings! Fine... variance granted for pirate radio!',
          mutterHz: 74,
          camera: 'leader-closeup',
          playJingle: 'hoa-citadel',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Airwaves are open all the way to the summit! One last tower left: Subsoil Relay Tower on 108.0!',
          mutterHz: 100,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'hc-no-grinding': {
        id: 'quest-hc-no-grinding',
        kind: 'special',
        areaId: 'hoa-citadel',
        title: 'Handoff: Silence Citation Patrol',
        beats: [
          {
            speaker: 'Beige-Swatch Bertha',
            role: 'Bylaw Brass · Trim & Topiary Marshal',
            text: 'Scandalous! Neon paint over Eggshell Swatch #04?! Inspector Vance-Bot’s HOA Covenant strictly forbids unapproved pigment, unauthorized inline wheels, and any tempo above a brisk walk!',
            mutterHz: 126,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Clipboard Clive',
            role: 'Bylaw Brass · Deputy Citation Officer',
            text: 'Three Citation Sentries are marching the Hedge Depot and Gazebo walkways with brass whistles at the ready. Keep off the grass—or silence all three patrols if you dare!',
            mutterHz: 110,
            camera: 'wide-orbit',
          },
        ],
      },
      'hc-tune-jammers': {
        id: 'quest-hc-tune-jammers',
        kind: 'special',
        areaId: 'hoa-citadel',
        title: 'Handoff: Flip Compliance Jammers',
        beats: [
          {
            speaker: 'Clipboard Clive',
            role: 'Bylaw Brass · Deputy Citation Officer',
            text: 'Form 88-Z! You silenced the Citation Patrol AND ground straight past our "NO GRINDING" placards?! That’s three separate infractions in one combo!',
            mutterHz: 110,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Beige-Swatch Bertha',
            role: 'Bylaw Brass · Trim & Topiary Marshal',
            text: 'No matter—our three Compliance Jammers on the Permit Office, Beige Archive, and Gazebo Tribunal will keep pirate radio locked below the terrace!',
            mutterHz: 126,
            camera: 'wide-orbit',
          },
        ],
      },
      'hc-defiance-rings': {
        id: 'quest-hc-defiance-rings',
        kind: 'special',
        areaId: 'hoa-citadel',
        title: 'Handoff: Fly the Defiance Rings',
        beats: [
          {
            speaker: 'Beige-Swatch Bertha',
            role: 'Bylaw Brass · Trim & Topiary Marshal',
            text: 'Every jammer flipped to pirate brass?! The hedges are swaying in F# harmonic minor—Inspector Vance-Bot is spooling up the Megaphone Spire!',
            mutterHz: 126,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Clipboard Clive',
            role: 'Bylaw Brass · Deputy Citation Officer',
            text: 'If you insist on trespassing past regulation airspace, hit the garden updrafts and clear all four Defiance Rings—then face the Inspector’s final sentencing!',
            mutterHz: 110,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'subsoil-relay': {
    levelIntro: {
      id: 'area-8-level-intro',
      kind: 'level-intro',
      areaId: 'subsoil-relay',
      title: 'Area 8: Subsoil Relay Tower',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'This is it—the eighth rung! All seven frequencies converge inside Static-Crown Sol’s colossal tuning-fork spire.',
          mutterHz: 94,
          camera: 'wide-orbit',
        },
        {
          speaker: 'Static-Crown Sol',
          role: 'Leader · The Deep-Cut Syndicate',
          text: 'Turn back, runner. You think we’re jamming Turfton’s signal? We’re keeping the tuning fork locked so the ninth silence never wakes!',
          mutterHz: 68,
          camera: 'leader-closeup',
          playJingle: 'subsoil-relay',
          titleCard: {
            badge: 'AREA 8 · THE DEEP-CUT SYNDICATE',
            name: 'STATIC-CROWN SOL',
            subtitle: '108.0 Keeper of the Fork · 166 BPM Dark Dub-Jungle',
            accentColor: '#7c4dff',
          },
        },
        {
          speaker: 'Reel-to-Reel Rex & Sub-Bass Sable',
          role: 'Deep-Cut Sidekicks',
          text: 'Rex: "DJ Moleman’s 108.0 tapes run deep here!" — Sable: "Flip the dish polarity if you dare climb the shaft!"',
          mutterHz: 104,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-8-boss-intro',
      kind: 'boss-intro',
      areaId: 'subsoil-relay',
      title: 'Boss Showdown: Static-Crown Sol',
      beats: [
        {
          speaker: 'Static-Crown Sol',
          role: 'Leader · The Deep-Cut Syndicate',
          text: 'Every dish is aligned... if you retune this apex, all eight bands will harmonize at once—and whatever sleeps above us will hear it!',
          mutterHz: 66,
          camera: 'boss-stage',
          playJingle: 'subsoil-relay',
          titleCard: {
            badge: 'BOSS ENCOUNTER · TUNING-FORK APEX',
            name: 'STATIC-CROWN SOL',
            subtitle: 'Harmonize the 8th tower by tagging Sol 3 times!',
            accentColor: '#7c4dff',
          },
        },
        {
          speaker: 'Sub-Bass Sable',
          role: 'Deep-Cut Sidekick',
          text: 'Hold onto your skates—the whole spire is resonating at 166 BPM!',
          mutterHz: 116,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossDefeat: {
      id: 'area-8-boss-defeat',
      kind: 'boss-defeat',
      areaId: 'subsoil-relay',
      title: '108.0 Convergence Complete!',
      nextLevelId: 'zero-hz-zenith',
      beats: [
        {
          speaker: 'Static-Crown Sol',
          role: 'Leader · The Deep-Cut Syndicate',
          text: 'All eight frequencies just locked into one chord... look above the tuning fork! The Silent Frequency is opening!',
          mutterHz: 72,
          camera: 'sky-ascend',
          playJingle: 'subsoil-relay',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'What is that place?! An inverted vinyl spiral floating above the clouds... Ley-Line Runner, we’re going in!',
          mutterHz: 102,
          camera: 'sky-ascend',
        },
      ],
    },
    questIntros: {
      'sr-flip-dishes': {
        id: 'quest-sr-flip-dishes',
        kind: 'special',
        areaId: 'subsoil-relay',
        title: 'Handoff: Sync Acoustic Dishes',
        beats: [
          {
            speaker: 'Sub-Bass Sable',
            role: 'Deep-Cut Syndicate · Frequency Dish Spotter',
            text: 'Stop right there, runner. You tagged the outer relay pylons, so listen: the Deep-Cut Syndicate isn’t some turf gang hoarding airtime—we’re anchoring DJ Moleman’s 108.0 subsoil wave.',
            mutterHz: 116,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Reel-to-Reel Rex',
            role: 'Deep-Cut Syndicate · Tape Archive Sentinel',
            text: 'If you really mean to converge all eight bands, spray-tune the three Acoustic Dishes on Subsoil Bunker, Echo Chamber, and the Scaffolding Ring—and feel the spire resonate!',
            mutterHz: 92,
            camera: 'wide-orbit',
          },
        ],
      },
      'sr-subsoil-rings': {
        id: 'quest-sr-subsoil-rings',
        kind: 'special',
        areaId: 'subsoil-relay',
        title: 'Handoff: Thread Sub-Bass Rings',
        beats: [
          {
            speaker: 'Reel-to-Reel Rex',
            role: 'Deep-Cut Syndicate · Tape Archive Sentinel',
            text: 'Hear that low rumble through your skates? All three dishes are locking phase at 166 BPM! Static-Crown Sol warned us a Ley-Line Runner might wake what sleeps above the eighth rung.',
            mutterHz: 92,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Sub-Bass Sable',
            role: 'Deep-Cut Syndicate · Frequency Dish Spotter',
            text: 'Ride the deep updraft vents between the steel scaffolding decks and thread all four Sub-Bass Rings—only a skater who rides the shockwave can climb the fork!',
            mutterHz: 116,
            camera: 'wide-orbit',
          },
        ],
      },
      'sr-reel-patrol': {
        id: 'quest-sr-reel-patrol',
        kind: 'special',
        areaId: 'subsoil-relay',
        title: 'Handoff: Silence Tape Sentries',
        beats: [
          {
            speaker: 'Sub-Bass Sable',
            role: 'Deep-Cut Syndicate · Frequency Dish Spotter',
            text: 'You threaded the Sub-Bass Rings cleanly... alright, Turfton runner, there’s only one seal left between the eight districts and the Silent Frequency above.',
            mutterHz: 116,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Reel-to-Reel Rex',
            role: 'Deep-Cut Syndicate · Tape Archive Sentinel',
            text: 'Our three Tape Sentries are guarding the Cassette Archive deck! Silence their lock-loops and Static-Crown Sol will face you at the 16-meter Tuning-Fork Apex!',
            mutterHz: 92,
            camera: 'wide-orbit',
          },
        ],
      },
    },
  },

  'zero-hz-zenith': {
    levelIntro: {
      id: 'area-9-level-intro',
      kind: 'level-intro',
      areaId: 'zero-hz-zenith',
      title: 'Area 9: Zero-Hz Zenith',
      beats: [
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'There’s no wind up here, no static—just frozen soundwaves and a giant monochrome record groove...',
          mutterHz: 90,
          camera: 'wide-orbit',
        },
        {
          speaker: 'The Original Needle',
          role: 'Leader · The Unfired Choir',
          text: 'Before pirate radio, before Turfton, there was only the quiet groove. Zero-Hz swallows every lone melody whole.',
          mutterHz: 64,
          camera: 'leader-closeup',
          playJingle: 'zero-hz-zenith',
          titleCard: {
            badge: 'AREA 9 · SECRET FINALE',
            name: 'THE ORIGINAL NEEDLE',
            subtitle: 'The Unfired Choir · 158 BPM Symphonic Encore',
            accentColor: '#ffd740',
          },
        },
        {
          speaker: 'Dead-Wax Echo & Mute Metronome',
          role: 'Unfired Choir Sidekicks',
          text: 'Echo: "Paint the silent grooves to wake the color!" — Metronome: "...(ticks silently in E Dorian)..."',
          mutterHz: 110,
          camera: 'sidekicks-pan',
        },
      ],
    },
    bossIntro: {
      id: 'area-9-boss-intro',
      kind: 'boss-intro',
      areaId: 'zero-hz-zenith',
      title: 'Final Encore: The Original Needle',
      beats: [
        {
          speaker: 'The Original Needle',
          role: 'Leader · The Unfired Choir',
          text: 'You restored color to the Four-Track Monolith! Now face the Turntable Crown—let us hear if all eight districts can truly play as one!',
          mutterHz: 64,
          camera: 'boss-stage',
          playJingle: 'zero-hz-zenith',
          titleCard: {
            badge: 'FINAL SHOWDOWN · TURNTABLE CROWN',
            name: 'THE ORIGINAL NEEDLE',
            subtitle: 'Weave all 8 genres together and tag the Needle 3 times!',
            accentColor: '#ffd740',
          },
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'Give it everything you’ve got, runner! Every gnome in the Archipelago is listening!',
          mutterHz: 102,
          camera: 'player-hero',
        },
      ],
    },
    bossDefeat: {
      id: 'area-9-ending',
      kind: 'boss-defeat',
      areaId: 'zero-hz-zenith',
      title: 'Grand Finale: The Archipelago Sings Forever',
      nextLevelId: null,
      beats: [
        {
          speaker: 'The Original Needle',
          role: 'Leader · The Unfired Choir',
          text: 'Dorian jazz, bongo polyrhythms, acid kilns, Lydian mist, chiptune, disco, brass, and dub... together, they never fade into silence.',
          mutterHz: 68,
          camera: 'leader-closeup',
          playJingle: 'zero-hz-zenith',
          titleCard: {
            badge: 'FINALE COMPLETE · BROADCAST ARCHIPELAGO',
            name: 'ZERO-HZ AWAKENED',
            subtitle: 'All 9 Frequencies Harmonized',
            accentColor: '#ffd740',
          },
        },
        {
          speaker: 'Maestro Upright & Conga King Kora',
          role: 'All-Star Ensemble',
          text: 'Maestro: "What a turnaround!" — Kora: "Best jam session in Aether history!"',
          mutterHz: 84,
          camera: 'sidekicks-pan',
        },
        {
          speaker: 'DJ Broadcast',
          role: 'Pirate Radio Host',
          text: 'From Turfton’s birdbaths to the apex of the sky—this is DJ Broadcast signing ON forever. Keep carving those ley-lines, runner!',
          mutterHz: 100,
          camera: 'wide-orbit',
        },
      ],
    },
    extra: [
      {
        id: 'area-9-awakening',
        kind: 'special',
        areaId: 'zero-hz-zenith',
        title: 'Special: The Eighth-Band Convergence',
        beats: [
          {
            speaker: 'Static-Crown Sol',
            role: 'Leader · The Deep-Cut Syndicate',
            text: 'Look at the sky above the tuning fork—all seven lower towers are projecting straight into the upper void!',
            mutterHz: 70,
            camera: 'sky-ascend',
          },
          {
            speaker: 'DJ Broadcast',
            role: 'Pirate Radio Host',
            text: 'A ninth frequency is materializing out of pure dead-wax! Grab your skates—we’re riding the harmonic beam!',
            mutterHz: 102,
            camera: 'player-hero',
            playJingle: 'zero-hz-zenith',
          },
        ],
      },
      {
        id: 'area-9-mid-encore',
        kind: 'special',
        areaId: 'zero-hz-zenith',
        title: 'Special: All Eight Gangs Unite',
        beats: [
          {
            speaker: 'Furnace Vera',
            role: 'Leader · The Glaze Grinders',
            text: 'Zero-Hz swallowed our acid-funk solo—so we brought the whole Archipelago up the ladder to back you up!',
            mutterHz: 74,
            camera: 'wide-orbit',
          },
          {
            speaker: 'Fountainhead Finn & Quarter-Slot Quinn',
            role: 'All-Star Ensemble',
            text: 'Finn: "Lydian mist on your left!" — Quinn: "8-bit arps on your right! Hit the Turntable Crown together!"',
            mutterHz: 94,
            camera: 'sidekicks-pan',
            playJingle: 'zero-hz-zenith',
          },
        ],
      },
    ],
    questIntros: {
      'zh-echo-chase': {
        id: 'quest-zh-echo-chase',
        kind: 'special',
        areaId: 'zero-hz-zenith',
        title: 'Handoff: Catch Dead-Wax Echo',
        beats: [
          {
            speaker: 'Dead-Wax Echo',
            role: 'Unfired Choir · Unfired Herald',
            text: 'Your paint brought color back to the Dead-Wax Gate... yet the Unfired Choir remembers the quiet before Turfton ever spun a single record.',
            mutterHz: 110,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Mute Metronome',
            role: 'Unfired Choir · Zero-Beat Keeper',
            text: '*(Clicks steadily in E Dorian)* Echo glides along the inner vinyl groove—boost with Shift and tag them three times with Spray (F) to keep the needle moving!',
            mutterHz: 86,
            camera: 'wide-orbit',
          },
        ],
      },
      'zh-choir-rings': {
        id: 'quest-zh-choir-rings',
        kind: 'special',
        areaId: 'zero-hz-zenith',
        title: 'Handoff: Thread Encore Rings',
        beats: [
          {
            speaker: 'Mute Metronome',
            role: 'Unfired Choir · Zero-Beat Keeper',
            text: '*(Rings softly as color floods its pendulum)* Every district’s pulse is echoing through your skates now—Velvet Keys, Bongo Basin, Chrome Kiln, all climbing into the silent groove.',
            mutterHz: 86,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Dead-Wax Echo',
            role: 'Unfired Choir · Unfired Herald',
            text: 'Launch off the Choir Amphitheater and zenith vents to thread all four Golden Groove Rings—show The Original Needle that all eight styles belong in the sky!',
            mutterHz: 110,
            camera: 'wide-orbit',
          },
        ],
      },
      'zh-tune-tracks': {
        id: 'quest-zh-tune-tracks',
        kind: 'special',
        areaId: 'zero-hz-zenith',
        title: 'Handoff: Wake the Four Tracks',
        beats: [
          {
            speaker: 'Dead-Wax Echo',
            role: 'Unfired Choir · Unfired Herald',
            text: 'The whole vinyl spiral is glowing gold! Only the Four-Track Monolith still holds the silence between the eight gangs and our Choir.',
            mutterHz: 110,
            camera: 'sidekicks-pan',
          },
          {
            speaker: 'Mute Metronome',
            role: 'Unfired Choir · Zero-Beat Keeper',
            text: '*(Ticks in triumphant unison)* Tune the three Harmonic Beacons across Dead-Wax Gate, Echo-Null Pedestal, and the Four-Track Monolith—and awaken the Turntable Crown!',
            mutterHz: 86,
            camera: 'boss-stage',
          },
        ],
      },
    },
  },
};

export const ALL_CUTSCENES: readonly CutsceneDef[] = [
  GAME_INTRO_CUTSCENE,
  ...Object.values(AREA_CUTSCENES).flatMap((bundle) => [
    bundle.levelIntro,
    bundle.bossIntro,
    bundle.bossDefeat,
    ...Object.values(bundle.questIntros ?? {}),
    ...(bundle.extra ?? []),
  ]),
];
