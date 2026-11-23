// Gnome Theft Auto: Turfton corporate brands, storefronts, and sidewalk props (Issue 1A).
import type { PrefabDef } from '../types';

const HOT_PINK = 0xff3b9a;
const COLA_RED = 0xc8242b;
const FIZZ_YELLOW = 0xf5e027;
const FIZZ_LIME = 0xd9ff3b;
const DEW_AMBER = 0xe89014;
const DEW_GLOW = 0xffb830;
const CLAYMART_BLUE = 0x1b63c6;
const CLAYMART_BLUE_LIGHT = 0x2272df;
const CLAYMART_BLUE_DEEP = 0x144ea0;
const CLAYMART_YELLOW = 0xf5c828;
const HUSKY_BLUE = 0x1c5fb8;
const GNOMA_MINT = 0x6be0b8;
const GNOMA_PINK = 0xf778a1;
const GNOMA_CREAM = 0xffeef4;
const OBSIDIAN = 0x121218;
const ASTROTURF = 0x3da842;

export const GTA_BRANDS: readonly PrefabDef[] = [
  {
    id: 'gta-bodega',
    name: 'Bodega & Sons (No Sons, Just John)',
    category: 'prop',
    uses: ['place'],
    tags: ['bodega', 'shop', 'storefront', 'watering', 'can', 'corner', 'neon', 'acorn', 'cola', 'turfton'],
    emoji: [],
    footprint: { r: 2.3, h: 2.5 },
    about: 'Gnome Theft Auto: Bodega & Sons (No Sons, Just John). An overturned tin watering-can corner shop with an open +z counter, neon window sign, and Acorn-Cola crate.',
    examine: [
      'An overturned galvanized tin shop with a broad copper rose overhead, a glowing counter inside, and an Acorn-Cola crate out front.',
      'Turfton saying: nobody knows who the Sons were, and John has been sweeping the same patch of clay dust since before the grid was chalked.',
      'Tip: drop by at midnight for lukewarm soda and spare spark plugs. Just mind the tabby cat sleeping on the crimson crate.',
      'Joke: the neon sign hums louder than a Zero-Turn and still uses less fuel than John does getting up from his stool.',
      'A tiny pawprint is pressed into the concrete plinth beside the counter, right next to a trail of bottlecaps.',
    ],
    parts: [
      { s: 'box', d: [3.6, 0.12, 3.0], at: [0, 0.06, 0], c: 'stone-dark' },                                   // concrete plinth
      { s: 'cyl', d: [1.15, 1.15, 2.7], rot: [90, 0, 0], at: [0, 1.22, -0.1], c: 'iron', seg: 10 },            // watering-can barrel
      { s: 'cyl', d: [1.2, 1.2, 0.12], rot: [90, 0, 0], at: [0, 1.22, -1.45], c: 'iron-dark', seg: 10 },       // back base rim
      { s: 'ring', d: [1.15, 0.06], at: [0, 1.22, 1.25], c: 'steel', seg: 10 },                                // front opening lip
      { s: 'cyl', d: [1.05, 1.05, 0.1], rot: [90, 0, 0], at: [0, 1.22, -0.9], c: 0x1e1c22, seg: 10 },          // dark back wall
      { s: 'cyl', d: [0.1, 0.18, 1.25], rot: [0, 0, 35], at: [-1.15, 1.85, 0.1], c: 'iron', seg: 8 },          // spout neck
      { s: 'cyl', d: [0.24, 0.12, 0.16], rot: [0, 0, 35], at: [-1.52, 2.36, 0.1], c: 'brass', seg: 8 },        // spout rose
      { s: 'box', d: [0.12, 0.7, 0.12], at: [1.15, 1.8, -0.85], c: 'iron-dark' },                              // handle rear post
      { s: 'box', d: [0.12, 0.12, 1.25], at: [1.15, 2.18, -0.25], c: 'iron-dark' },                            // handle top rail
      { s: 'box', d: [0.12, 0.55, 0.12], rot: [30, 0, 0], at: [1.15, 1.94, 0.36], c: 'iron-dark' },            // handle front brace
      { s: 'box', d: [1.55, 0.55, 0.46], at: [0, 0.395, 0.58], c: 'wood' },                                    // shop counter
      { s: 'box', d: [1.64, 0.06, 0.52], at: [0, 0.7, 0.58], c: 'wood-light' },                                // counter top
      { s: 'ball', d: [0.09], scale: [1, 0.9, 1.3], at: [0.45, 0.81, 0.58], c: 0x8d867e, seg: 6 },             // Asphalt the cat
      { s: 'box', d: [1.45, 0.42, 0.08], at: [0, 1.36, 0.85], c: 0xffe484, glow: true },                       // neon interior window
      { s: 'box', d: [0.9, 0.36, 0.08], at: [0.65, 1.66, 1.26], c: 0x16161c },                                 // neon sign plate
      { s: 'box', d: [0.74, 0.09, 0.06], at: [0.65, 1.71, 1.29], c: 0xff5a6e, glow: true },                    // neon sign upper tube
      { s: 'box', d: [0.6, 0.07, 0.06], at: [0.65, 1.58, 1.29], c: 0x3ef0d0, glow: true },                     // neon sign lower tube
      { s: 'box', d: [0.46, 0.34, 0.46], at: [-0.75, 0.29, 1.18], c: COLA_RED },                               // Acorn-Cola crate
      { s: 'box', d: [0.48, 0.08, 0.48], at: [-0.75, 0.29, 1.18], c: 'white' },                                // crate band
      { s: 'cyl', d: [0.05, 0.05, 0.14], at: [-0.82, 0.5, 1.13], c: 0x5c2c16, seg: 6 },                        // soda bottle
      { s: 'cyl', d: [0.05, 0.05, 0.14], at: [-0.68, 0.5, 1.23], c: 0x5c2c16, seg: 6 },                        // soda bottle
    ],
  },
  {
    id: 'gta-side-valve',
    name: 'Side-Valve Salvage',
    category: 'prop',
    uses: ['place'],
    tags: ['garage', 'salvage', 'chopshop', 'tansy', 'wrench', 'husky', 'blade', 'repair', 'turfton'],
    emoji: [],
    footprint: { r: 2.4, h: 2.4 },
    about: 'Gnome Theft Auto: Side-Valve Salvage. Tansy\'s chop-shop garage with a corrugated roof, half-open roll-up bay door facing +z, wrench sign, and Husky-Blade banners.',
    examine: [
      'A gritty clay-brick chop-shop with a ribbed tin roof, a half-raised bay door, and a giant steel wrench bolted above the lintel.',
      'Garage rule: Tansy can swap a two-stroke exhaust in forty seconds flat, provided you stop asking where the donor mower went.',
      'Tip: pull straight up to the bay if your rig is smoking. Just avoid wearing Buck-Iron green near the Husky-Blade banners.',
      'Joke: the shop charges a twenty percent emotional damage surcharge whenever someone rolls in a rival brand without warning.',
      'Two charred tyres sit stacked by the left pillar, still warm enough to keep a teacup comfortable.',
    ],
    parts: [
      { s: 'box', d: [4.2, 0.1, 3.4], at: [0, 0.05, 0], c: 'stone-dark' },                                      // garage apron
      { s: 'box', d: [4.0, 1.85, 0.24], at: [0, 1.025, -1.48], c: 'clay-dark' },                               // back wall
      { s: 'box', d: [0.24, 1.85, 3.0], at: [1.88, 1.025, 0], c: 'clay-dark', mirror: true },                  // side walls
      { s: 'box', d: [0.65, 1.85, 0.24], at: [1.67, 1.025, 1.38], c: 'stone', mirror: true },                  // front piers
      { s: 'box', d: [2.7, 0.42, 0.26], at: [0, 1.74, 1.38], c: 'iron-dark' },                                 // front lintel
      { s: 'box', d: [2.6, 1.45, 0.1], at: [0, 0.825, 0.9], c: 0x141418 },                                      // dark bay interior
      { s: 'box', d: [2.62, 0.18, 0.1], at: [0, 1.44, 1.35], c: 'iron' },                                      // roll-up slat 1
      { s: 'box', d: [2.62, 0.18, 0.1], at: [0, 1.24, 1.35], c: 'steel' },                                     // roll-up slat 2
      { s: 'box', d: [2.62, 0.18, 0.1], at: [0, 1.04, 1.35], c: 'iron' },                                      // roll-up slat 3
      { s: 'box', d: [4.3, 0.12, 3.3], at: [0, 2.0, 0], c: 'iron-dark' },                                      // roof deck
      { s: 'box', d: [0.22, 0.08, 3.34], at: [1.6, 2.09, 0], c: 'rust', mirror: true },                        // corrugated rib
      { s: 'box', d: [0.22, 0.08, 3.34], at: [0.8, 2.09, 0], c: 'iron', mirror: true },                        // corrugated rib
      { s: 'box', d: [0.22, 0.08, 3.34], at: [0, 2.09, 0], c: 'rust' },                                        // centre ridge rib
      { s: 'box', d: [2.1, 0.44, 0.1], at: [0, 2.34, 1.36], c: 0x1e242b },                                      // sign backing board
      { s: 'box', d: [1.3, 0.12, 0.08], at: [0, 2.34, 1.44], c: 'steel' },                                     // wrench shaft
      { s: 'cyl', d: [0.18, 0.18, 0.09], rot: [90, 0, 0], at: [0.72, 2.34, 1.44], c: 'steel', seg: 6, mirror: true }, // wrench jaw
      { s: 'box', d: [0.16, 0.12, 0.11], at: [0.82, 2.34, 1.45], c: 0x1e242b, mirror: true },                  // jaw notch
      { s: 'box', d: [0.46, 1.25, 0.06], at: [1.67, 1.08, 1.53], c: HUSKY_BLUE, mirror: true },                // Husky-Blade banner
      { s: 'box', d: [0.14, 1.15, 0.07], at: [1.67, 1.08, 1.54], c: 'silver', mirror: true },                  // banner silver stripe
      { s: 'ring', d: [0.2, 0.08], rot: [90, 0, 0], at: [-1.55, 0.08, 1.78], c: 'black', seg: 8 },             // scrap tyre bottom
      { s: 'ring', d: [0.2, 0.08], rot: [90, 0, 0], at: [-1.55, 0.22, 1.78], c: 'black', seg: 8 },             // scrap tyre top
    ],
  },
  {
    id: 'gta-pay-n-glaze',
    name: "Pay 'n' Glaze",
    category: 'prop',
    uses: ['place'],
    tags: ['pay', 'glaze', 'spray', 'paint', 'garage', 'pink', 'chrome', 'bay', 'neon', 'turfton'],
    emoji: [],
    footprint: { r: 2.4, h: 2.5 },
    about: "Gnome Theft Auto: Pay 'n' Glaze. A hot-pink (0xff3b9a) and chrome drive-through spray bay open on +z and -z, topped with a glowing neon roller sign.",
    examine: [
      'A blindingly hot-pink and chrome spray tunnel open at both ends, crowned by a glowing neon paint roller.',
      'Shop slogan, humming in neon: new coat, who dis.',
      'Tip: pull in with a charred fender and three Hats on your tail, then roll out the far arch before the Watch notices.',
      'Joke: the booth accepts acorns, gold coins, and suspiciously fresh hubcaps, with zero questions about the previous tint.',
      'Specks of every colour on the grid crust the inside walls like a fired kiln gone wild.',
    ],
    parts: [
      { s: 'box', d: [4.0, 0.04, 3.6], at: [0, 0.02, 0], c: 'stone-dark' },                                      // drive-through floor
      { s: 'box', d: [0.38, 1.65, 3.4], at: [1.75, 0.865, 0], c: HOT_PINK, mirror: true },                      // side walls
      { s: 'box', d: [0.42, 0.22, 3.44], at: [1.75, 0.15, 0], c: 'silver', mirror: true },                     // chrome kickplate
      { s: 'box', d: [0.42, 0.1, 3.44], at: [1.75, 1.1, 0], c: 'silver', mirror: true },                       // chrome trim band
      { s: 'box', d: [3.88, 0.42, 0.36], at: [0, 1.9, 1.54], c: HOT_PINK },                                    // front arch lintel (+z)
      { s: 'box', d: [0.5, 0.42, 0.38], rot: [0, 0, 45], at: [1.45, 1.62, 1.54], c: 'silver', mirror: true },  // front arch corners
      { s: 'box', d: [3.88, 0.42, 0.36], at: [0, 1.9, -1.54], c: HOT_PINK },                                   // back arch lintel (-z)
      { s: 'box', d: [0.5, 0.42, 0.38], rot: [0, 0, 45], at: [1.45, 1.62, -1.54], c: 'silver', mirror: true }, // back arch corners
      { s: 'box', d: [3.96, 0.14, 3.46], at: [0, 2.12, 0], c: 'silver' },                                      // chrome roof deck
      { s: 'cyl', d: [0.06, 0.06, 2.8], rot: [0, 0, 90], at: [0, 1.95, 0], c: 'silver', seg: 8 },              // overhead spray rail
      { s: 'cone', d: [0.12, 0.16], rot: [180, 0, 0], at: [0.7, 1.84, 0], c: HOT_PINK, seg: 6, mirror: true }, // spray nozzles
      { s: 'box', d: [0.1, 0.25, 0.1], at: [0.9, 2.28, 1.35], c: 'silver', mirror: true },                     // roller sign struts
      { s: 'cyl', d: [0.24, 0.24, 1.6], rot: [0, 0, 90], at: [0, 2.52, 1.35], c: HOT_PINK, glow: true, seg: 10 }, // neon roller
      { s: 'cyl', d: [0.26, 0.26, 0.08], rot: [0, 0, 90], at: [0.82, 2.52, 1.35], c: 'silver', seg: 10, mirror: true }, // roller caps
      { s: 'box', d: [2.2, 0.22, 0.1], at: [0, 2.28, 1.48], c: 0x38f2ff, glow: true },                         // neon cyan bar
    ],
  },
  {
    id: 'gta-gnomecino',
    name: 'The Gnomecino (Turfton Branch)',
    category: 'prop',
    uses: ['place'],
    tags: ['gnomecino', 'casino', 'neon', 'acorn', 'gold', 'velvet', 'rope', 'turfton'],
    emoji: [],
    footprint: { r: 2.5, h: 2.8 },
    about: 'Gnome Theft Auto: The Gnomecino (Turfton Branch). A neon-lit casino facade with a giant glowing golden acorn marquee, magenta windows, red carpet, and velvet rope.',
    examine: [
      'A velvet-and-neon casino palace topped by a glowing golden acorn marquee that can be spotted three blocks down the grid.',
      'House rule: the odds are printed on the brass plaque inside, in ink too small for fired eyes to read.',
      'Tip: Big Lou watches the red carpet. Leave your crowbar in the boot if you want to keep both ears attached.',
      'Joke: every slot wheel inside has three pictures of an acorn and zero pictures of anyone leaving with their shirt.',
      'A faint ring of gold dust around the stanchions marks where last Friday\'s winners tripped over the velvet rope.',
    ],
    parts: [
      { s: 'box', d: [4.2, 0.12, 3.4], at: [0, 0.06, 0], c: 'stone-dark' },                                      // entrance plinth
      { s: 'box', d: [1.3, 0.03, 1.1], at: [0, 0.13, 1.6], c: 0xa6192e },                                        // red carpet runner
      { s: 'box', d: [4.0, 1.95, 2.8], at: [0, 1.095, -0.1], c: 0x1f1428 },                                     // main facade
      { s: 'box', d: [4.16, 0.14, 2.96], at: [0, 2.14, -0.1], c: 'gold' },                                      // gold cornice
      { s: 'box', d: [0.24, 1.95, 0.16], at: [1.75, 1.095, 1.32], c: 'gold', mirror: true },                   // fluted pilasters
      { s: 'box', d: [1.1, 1.1, 0.08], at: [0, 0.67, 1.32], c: 0x3b1824 },                                      // double doors
      { s: 'box', d: [1.24, 1.18, 0.05], at: [0, 0.71, 1.29], c: 'gold' },                                     // door brass frame
      { s: 'box', d: [0.7, 0.75, 0.06], at: [1.15, 1.05, 1.32], c: 0xff3ba7, glow: true, mirror: true },       // neon windows
      { s: 'box', d: [0.76, 0.08, 0.08], at: [1.15, 0.64, 1.34], c: 0x38f2ff, glow: true, mirror: true },      // cyan window sills
      { s: 'box', d: [2.4, 0.24, 0.9], at: [0, 1.5, 1.72], c: 0x261233 },                                       // marquee canopy
      { s: 'box', d: [2.46, 0.08, 0.94], at: [0, 1.63, 1.72], c: 0xffd23f, glow: true },                       // marquee neon rim
      { s: 'ball', d: [0.42], scale: [1, 1.15, 0.85], at: [0, 2.55, 1.15], c: 'gold', glow: true, seg: 10 },   // golden acorn nut
      { s: 'cyl', d: [0.36, 0.46, 0.22], at: [0, 2.9, 1.15], c: 'brass', seg: 10 },                            // golden acorn cap
      { s: 'cyl', d: [0.05, 0.06, 0.18], at: [0, 3.08, 1.15], c: 'wood-dark', seg: 6 },                        // acorn stem
      { s: 'ring', d: [0.62, 0.05], at: [0, 2.65, 1.05], c: 0xff3ba7, glow: true, seg: 10 },                   // neon halo ring
      { s: 'cyl', d: [0.04, 0.05, 0.46], at: [0.85, 0.35, 2.05], c: 'gold', seg: 6, mirror: true },            // rope posts
      { s: 'box', d: [0.05, 0.05, 0.72], at: [0.85, 0.5, 1.72], c: 0xa6192e, mirror: true },                   // velvet ropes
    ],
  },
  {
    id: 'gta-clay-mart',
    name: 'Clay-Mart Warehouse',
    category: 'prop',
    uses: ['place'],
    tags: ['claymart', 'warehouse', 'store', 'tupperware', 'blue', 'yellow', 'superstore', 'turfton'],
    emoji: [],
    footprint: { r: 2.8, h: 2.4 },
    about: 'Gnome Theft Auto: Clay-Mart Warehouse. A blue-and-yellow big-box superstore shaped like an upside-down plastic Tupperware tub with snap-lid trim and sliding glass doors.',
    examine: [
      'A huge blue-and-yellow superstore built like a giant upside-down tub, complete with a snap-seal flange around its waist.',
      'Store slogan, booming over the lot: everything under one giant upside-down tub, including your Kiln-Debt.',
      'Tip: park round the back if you want budget hats. The front baskets are always blocked by bargain-hunting seniors.',
      'Joke: rumour says newcomers step straight out of the garden-centre crates with fresh glaze and a pre-approved invoice.',
      'A lone pink flamingo stands guard by the sliding doors, eyeing John Bodega\'s corner from across the avenue.',
    ],
    parts: [
      { s: 'box', d: [5.2, 0.1, 3.8], at: [0, 0.05, 0], c: 'stone' },                                           // parking apron
      { s: 'box', d: [5.05, 0.16, 3.65], at: [0, 0.18, 0], c: CLAYMART_YELLOW },                                // yellow snap-lid base
      { s: 'box', d: [4.8, 1.0, 3.4], at: [0, 0.6, 0], c: CLAYMART_BLUE },                                     // lower blue tub body
      { s: 'box', d: [4.55, 0.85, 3.2], at: [0, 1.525, 0], c: CLAYMART_BLUE_LIGHT },                            // upper tapered tub
      { s: 'box', d: [0.14, 1.85, 0.14], at: [2.36, 1.025, 1.66], c: CLAYMART_BLUE_DEEP, mirror: true },       // tub corner ribs
      { s: 'box', d: [4.75, 0.24, 3.35], at: [0, 2.07, 0], c: CLAYMART_YELLOW },                                // yellow roof fascia
      { s: 'box', d: [3.8, 0.12, 2.5], at: [0, 2.25, 0], c: CLAYMART_BLUE_DEEP },                               // upside-down tub rim
      { s: 'box', d: [1.5, 0.95, 0.08], at: [0, 0.58, 1.72], c: 0xa8dcf0, alpha: 0.75 },                       // sliding glass doors
      { s: 'box', d: [1.76, 0.16, 0.22], at: [0, 1.12, 1.76], c: CLAYMART_YELLOW },                            // yellow door header
      { s: 'ball', d: [0.34], scale: [1, 1, 0.3], at: [0, 1.62, 1.62], c: CLAYMART_YELLOW, glow: true, seg: 8 }, // starburst emblem
      { s: 'box', d: [0.85, 0.12, 0.08], at: [0, 1.62, 1.62], c: CLAYMART_YELLOW, glow: true },                // logo cross bar
      { s: 'box', d: [0.55, 0.36, 0.42], at: [1.55, 0.28, 1.85], c: CLAYMART_YELLOW, mirror: true },           // shopping baskets
      { s: 'cyl', d: [0.02, 0.02, 0.34], at: [-1.15, 0.27, 1.82], c: 'steel', seg: 4 },                        // flamingo leg
      { s: 'ball', d: [0.11], scale: [0.7, 0.8, 1.3], at: [-1.15, 0.48, 1.82], c: 'pink', seg: 6 },            // plastic flamingo
    ],
  },
  {
    id: 'gta-thorne-tower',
    name: 'Thorne Lawn & Order HQ',
    category: 'prop',
    uses: ['place'],
    tags: ['thorne', 'tower', 'hoa', 'office', 'obsidian', 'gold', 'astroturf', 'plaque', 'turfton'],
    emoji: [],
    footprint: { r: 2.5, h: 4.5 },
    about: 'Gnome Theft Auto: Thorne Lawn & Order HQ. An obsidian-and-gold monolithic office base on a manicured astroturf plinth with trimmed hedges and a tilted brass plaque.',
    examine: [
      'A sleek obsidian-and-gold monolith rising from an unnaturally tidy astroturf plinth flanked by razor-trimmed hedges.',
      'HOA creed, cast in brass by the steps: uniformity is peace, and peace is mandatory.',
      'Tip: wipe your boots before walking up the turf. Citations for stray clover dust start at fifty acorns.',
      'Joke: Vesper Thorne keeps a porcelain tea set on the top floor and zero blades of real grass in the entire building.',
      'The brass plaque is polished twice before dawn; if you squint, you can see your own hat height reflected in it.',
    ],
    parts: [
      { s: 'box', d: [4.6, 0.14, 3.8], at: [0, 0.07, 0], c: 'stone-dark' },                                      // stone plinth border
      { s: 'box', d: [4.4, 0.04, 3.6], at: [0, 0.16, 0], c: ASTROTURF },                                         // manicured astroturf
      { s: 'box', d: [0.95, 0.32, 0.5], at: [1.45, 0.34, 1.45], c: 'leaf-dark', mirror: true },                // trimmed boxwood hedges
      { s: 'box', d: [3.6, 1.4, 2.6], at: [0, 0.88, -0.15], c: OBSIDIAN },                                     // obsidian podium
      { s: 'box', d: [3.7, 0.1, 2.7], at: [0, 1.63, -0.15], c: 'gold' },                                       // gold belt trim
      { s: 'box', d: [3.1, 2.4, 2.2], at: [0, 2.88, -0.15], c: 0x16161e },                                     // monolithic shaft
      { s: 'box', d: [0.1, 2.4, 2.3], at: [0.95, 2.88, -0.15], c: 'gold', mirror: true },                      // gold vertical fins
      { s: 'box', d: [3.26, 0.18, 2.36], at: [0, 4.17, -0.15], c: 'gold' },                                    // crown cornice
      { s: 'box', d: [2.6, 0.24, 1.8], at: [0, 4.38, -0.15], c: OBSIDIAN },                                     // top obsidian cap
      { s: 'box', d: [1.1, 1.05, 0.12], at: [0, 0.705, 1.16], c: 0x89c4e1, alpha: 0.7 },                       // lobby glass doors
      { s: 'box', d: [1.6, 0.1, 0.65], at: [0, 1.32, 1.4], c: 'gold' },                                        // gold entrance canopy
      { s: 'box', d: [0.18, 0.45, 0.18], at: [-1.3, 0.4, 1.18], c: OBSIDIAN },                                 // plaque pedestal
      { s: 'box', d: [0.55, 0.34, 0.06], rot: [-35, 0, 0], at: [-1.3, 0.66, 1.22], c: 'brass' },               // brass plaque
      { s: 'box', d: [0.55, 0.55, 0.08], rot: [0, 0, 45], at: [0, 3.4, 0.96], c: 'gold', glow: true },         // glowing HOA crest
    ],
  },
  {
    id: 'gta-gnoma-truck',
    name: "Gnoma's Food Truck",
    category: 'prop',
    uses: ['place'],
    tags: ['gnoma', 'food', 'truck', 'van', 'waffle', 'mint', 'pink', 'awning', 'turfton'],
    emoji: [],
    footprint: { r: 1.5, h: 1.8 },
    about: "Gnome Theft Auto: Gnoma's Food Truck. A mint-and-pink step van facing +z with a side serving window on +x, striped awning, and a giant triple-acorn waffle sign on the roof.",
    examine: [
      'A cheerful mint-and-pink step van with a wide serving shelf on the side and a giant triple-acorn waffle bolted to the roof.',
      'Gnoma\'s motto, stencilled under the awning: oops, a little wobbly, we learn from it.',
      'Tip: walk up to the window after a bad scrape with the Watch. Warm acorn-flour cake mends clay faster than a nap.',
      'Joke: Chirp & Crumb claims their biscuits patch walls better, while Gnoma insists a good waffle should not require mortar.',
      'Three tiny brass whisks hang behind the counter, each one bent at a slightly different angle.',
    ],
    parts: [
      { s: 'box', d: [1.16, 0.68, 2.36], at: [0, 0.56, 0], c: GNOMA_MINT },                                     // lower mint body
      { s: 'box', d: [1.14, 0.54, 2.3], at: [0, 1.17, -0.02], c: GNOMA_CREAM },                                // upper cream cabin
      { s: 'box', d: [1.2, 0.12, 2.4], at: [0, 0.88, 0], c: GNOMA_PINK },                                       // pink waist stripe
      { s: 'box', d: [0.98, 0.38, 0.06], at: [0, 1.14, 1.14], c: 0xa8dcf0, alpha: 0.75 },                      // front windscreen
      { s: 'box', d: [0.16, 0.1, 0.04], at: [0.38, 0.48, 1.19], c: 0xfff3b0, glow: true, mirror: true },        // headlights
      { s: 'box', d: [0.08, 0.44, 1.05], at: [0.58, 1.12, -0.25], c: 0x261d22 },                               // serving window recess
      { s: 'box', d: [0.06, 0.1, 0.96], at: [0.56, 1.28, -0.25], c: 0xffe484, glow: true },                    // warm counter lamp
      { s: 'box', d: [0.24, 0.05, 1.08], at: [0.7, 0.88, -0.25], c: 'steel' },                                 // serving shelf
      { s: 'box', d: [0.48, 0.06, 1.16], rot: [0, 0, -22], at: [0.78, 1.38, -0.25], c: GNOMA_PINK },             // awning pink
      { s: 'box', d: [0.48, 0.07, 0.36], rot: [0, 0, -22], at: [0.78, 1.385, -0.25], c: GNOMA_MINT },            // awning mint stripe
      { s: 'cyl', d: [0.38, 0.38, 0.1], rot: [0, 0, 90], at: [0, 1.72, -0.25], c: 'straw', seg: 8 },           // roof waffle sign
      { s: 'ball', d: [0.11], at: [0, 1.88, -0.25], c: 'wood', seg: 6 },                                       // waffle acorn top
      { s: 'ball', d: [0.1], at: [0, 1.74, -0.42], c: 'wood', seg: 6 },                                        // waffle acorn rear
      { s: 'ball', d: [0.1], at: [0, 1.74, -0.08], c: 'wood', seg: 6 },                                        // waffle acorn front
      { s: 'ball', d: [0.08], at: [0, 2.0, -0.25], c: GNOMA_PINK, seg: 6 },                                    // pink frosting dollop
      { s: 'cyl', d: [0.19, 0.19, 0.12], rot: [0, 0, 90], at: [0.52, 0.19, 0.72], c: 0x222222, seg: 10, mirror: true },  // front wheels
      { s: 'cyl', d: [0.19, 0.19, 0.12], rot: [0, 0, 90], at: [0.52, 0.19, -0.72], c: 0x222222, seg: 10, mirror: true }, // rear wheels
    ],
  },
  {
    id: 'gta-vending-cola',
    name: 'Acorn-Cola Vending Machine',
    category: 'prop',
    uses: ['place'],
    tags: ['vending', 'machine', 'acorn', 'cola', 'crimson', 'soda', 'sidewalk', 'turfton'],
    emoji: [],
    footprint: { r: 0.5, h: 1.4 },
    about: 'Gnome Theft Auto: Acorn-Cola Vending Machine. A crimson-and-white sidewalk vending machine with a glowing front marquee, coin strip, and chute on +z.',
    examine: [
      'A glossy crimson vending machine humming on the kerb with a white glowing header and a dark slot at the bottom.',
      'Can slogan: open a cold one, crack a smile, not your hat.',
      'Tip: nudge the side panel if your bottle gets stuck. Two sharp taps usually convince the spring inside.',
      'Joke: Acorn-Cola sponsors the Hat Watch softball team, which explains why the watch officers never miss a machine.',
      'A strip of dried dandelion silk has been wedged beside the coin slot by someone trying to fool the latch.',
    ],
    parts: [
      { s: 'box', d: [0.68, 0.06, 0.48], at: [0, 0.03, 0], c: 'black' },                                         // base skids
      { s: 'box', d: [0.76, 1.32, 0.54], at: [0, 0.72, 0], c: COLA_RED },                                      // crimson cabinet
      { s: 'box', d: [0.58, 0.42, 0.05], at: [-0.04, 1.06, 0.27], c: 'white', glow: true },                    // glowing marquee
      { s: 'ball', d: [0.11], scale: [1, 1.2, 0.4], at: [-0.04, 1.06, 0.3], c: COLA_RED, seg: 8 },             // acorn crest
      { s: 'box', d: [0.56, 0.14, 0.04], rot: [0, 0, 12], at: [-0.04, 0.65, 0.27], c: 'white' },               // white wave stripe
      { s: 'box', d: [0.12, 0.62, 0.05], at: [0.29, 0.85, 0.27], c: 'silver' },                                // coin panel
      { s: 'box', d: [0.05, 0.28, 0.04], at: [0.29, 0.96, 0.29], c: 'spark', glow: true },                     // lit buttons
      { s: 'box', d: [0.46, 0.18, 0.06], at: [-0.04, 0.24, 0.26], c: 0x16161a },                               // pickup chute
    ],
  },
  {
    id: 'gta-vending-fizz',
    name: 'Dandelion Fizz Vending Machine',
    category: 'prop',
    uses: ['place'],
    tags: ['vending', 'machine', 'dandelion', 'fizz', 'yellow', 'soda', 'sidewalk', 'turfton'],
    emoji: [],
    footprint: { r: 0.5, h: 1.4 },
    about: 'Gnome Theft Auto: Dandelion Fizz Vending Machine. An electric-yellow sidewalk vending machine with a neon-lime front display and citrus badge on +z.',
    examine: [
      'An electric-yellow vending box buzzing like a wasp in a jar, with a glowing lime display panel facing the pavement.',
      'Label claim: one hundred and ten percent daily value of pollen and bad decisions.',
      'Tip: shake the top corner before jumping an Aether ramp. Nobody knows if it helps, though racers swear by it.',
      'Joke: Dandelion Fizz sponsors midnight Zero-Turn races, mostly because nobody under thirty miles an hour drinks it twice.',
      'Sticky yellow rings on top of the lid show where half the Carburettors set their cans while tuning carburettors.',
    ],
    parts: [
      { s: 'box', d: [0.68, 0.06, 0.48], at: [0, 0.03, 0], c: 'black' },                                         // base skids
      { s: 'box', d: [0.76, 1.32, 0.54], at: [0, 0.72, 0], c: FIZZ_YELLOW },                                   // yellow cabinet
      { s: 'box', d: [0.56, 0.64, 0.05], at: [-0.05, 0.96, 0.27], c: FIZZ_LIME, glow: true },                  // glowing fizz display
      { s: 'ball', d: [0.12], scale: [1, 1, 0.4], at: [-0.05, 1.05, 0.3], c: 'white', glow: true, seg: 8 },    // dandelion puff badge
      { s: 'box', d: [0.42, 0.08, 0.04], rot: [0, 0, -18], at: [-0.05, 0.78, 0.29], c: 0x269e3a },             // green leaf slash
      { s: 'box', d: [0.13, 0.66, 0.05], at: [0.29, 0.86, 0.27], c: 'black' },                                 // coin strip
      { s: 'box', d: [0.05, 0.3, 0.04], at: [0.29, 0.96, 0.29], c: 0x5eff7a, glow: true },                     // neon fizz buttons
      { s: 'box', d: [0.46, 0.18, 0.06], at: [-0.05, 0.24, 0.26], c: 0x16161a },                               // pickup chute
    ],
  },
  {
    id: 'gta-can-cola',
    name: 'Acorn-Cola Can',
    category: 'consumable',
    uses: ['hold', 'collect', 'place'],
    tags: ['can', 'soda', 'acorn', 'cola', 'drink', 'crimson', 'fizzy', 'turfton'],
    emoji: [],
    grip: [0, 0.03, 0],
    wear: { rot: [90, 0, 0] },
    about: 'Gnome Theft Auto: Acorn-Cola Can. A small upright crimson drink can with a white wave band and a silver lid; the tab is a sliver of silver.',
    examine: [
      'A crimson drink can with a white wave band and a silver lid, sweating gently even when the lawn is dry.',
      'Can slogan: keep your chin up and your lid on, and the fizz will do the rest.',
      'Tip: give it one sharp shake before opening, then hold it low and well away from your best hat.',
      'Joke: the tab pops easier than a gnome\'s temper, and the mess lasts about as long as the apology.',
      'A dent on one side shows it was dropped from a moving Zero-Turn, and it still fizzes the same.',
    ],
    parts: [
      { s: 'cyl', d: [0.07, 0.07, 0.2], at: [0, 0.1, 0], c: COLA_RED, seg: 8 },                              // can body
      { s: 'cyl', d: [0.072, 0.072, 0.05], at: [0, 0.11, 0], c: 'white', seg: 8 },                            // white wave band
      { s: 'cyl', d: [0.062, 0.062, 0.012], at: [0, 0.194, 0], c: 'silver', seg: 8 },                       // silver lid rim
      { s: 'box', d: [0.035, 0.006, 0.02], at: [0, 0.203, 0.01], c: 'silver' },                             // pull tab
    ],
  },
  {
    id: 'gta-can-fizz',
    name: 'Dandelion Fizz Can',
    category: 'consumable',
    uses: ['hold', 'collect', 'place'],
    tags: ['can', 'soda', 'dandelion', 'fizz', 'drink', 'yellow', 'fizzy', 'turfton'],
    emoji: [],
    grip: [0, 0.03, 0],
    wear: { rot: [90, 0, 0] },
    about: 'Gnome Theft Auto: Dandelion Fizz Can. A small upright yellow drink can with a lime band, a silver lid and a white dandelion-puff badge on its front.',
    examine: [
      'A yellow drink can with a lime band and a fluffy white puff badge, humming faintly when shaken.',
      'Dandelion rhyme: sunshine in a tin, one sip for the spring and one for the grin.',
      'Tip: chill it in the spigot\'s trickle, not in the sun, or the puff badge goes sticky.',
      'Joke: nobody has ever finished a Dandelion Fizz without sneezing, and the label counts that as a feature.',
      'Someone has tallied every sip on the side in chalk, and the tally ran out of room a long time ago.',
    ],
    parts: [
      { s: 'cyl', d: [0.07, 0.07, 0.2], at: [0, 0.1, 0], c: FIZZ_YELLOW, seg: 8 },                            // can body
      { s: 'cyl', d: [0.072, 0.072, 0.05], at: [0, 0.11, 0], c: FIZZ_LIME, seg: 8 },                          // lime band
      { s: 'cyl', d: [0.062, 0.062, 0.012], at: [0, 0.194, 0], c: 'silver', seg: 8 },                       // silver lid rim
      { s: 'box', d: [0.035, 0.006, 0.02], at: [0, 0.203, 0.01], c: 'silver' },                             // pull tab
      { s: 'ball', d: [0.028], scale: [1, 1, 0.5], at: [0, 0.15, 0.072], c: 'white', glow: true, seg: 6 },   // dandelion puff badge
    ],
  },
  {
    id: 'gta-crash-helmet',
    name: 'Kiln-Shield Crash Helmet',
    category: 'armor',
    uses: ['wear-head'],
    tags: ['helmet', 'helm', 'crash', 'padded', 'head', 'kiln', 'shield', 'turfton'],
    emoji: [],
    about: 'Gnome Theft Auto: Kiln-Shield Crash Helmet. A glossy orange padded shell with a black rim, a visor bar and a white crest stripe.',
    examine: [
      'A glossy orange shell with a padded black rim and a stubby visor bar, the sort of helm that rattles when dropped.',
      'Kiln-Shield slogan: a cracked gnome is a sad gnome, so wear the hat that bounces.',
      'Tip: buckle it before you climb out of anything moving. The ground will not wait for the strap.',
      'Joke: the policy covers head injuries, and also the helmet, which the adjuster has never once seen intact.',
      'A dent above the visor shows where a Zero-Turn once bounced off, and the gnome inside got up and walked away.',
    ],
    parts: [
      { s: 'ball', d: [0.16], scale: [1, 0.85, 1.05], at: [0, 0.136, 0], c: 0xff7a1a, seg: 8 },            // shell
      { s: 'ring', d: [0.165, 0.025], rot: [90, 0, 0], at: [0, 0.08, 0], c: 'black', seg: 10 },            // padded rim
      { s: 'box', d: [0.2, 0.05, 0.05], at: [0, 0.13, 0.17], c: 'black' },                                  // visor bar
      { s: 'box', d: [0.03, 0.03, 0.2], at: [0, 0.268, 0], c: 'white' },                                    // crest stripe
      { s: 'box', d: [0.02, 0.1, 0.02], at: [0.1, 0.05, 0.1], c: 'black' },                                 // chin strap
    ],
  },
  {
    id: 'gta-dew-pump',
    name: 'Black Dew Fuel Canopy',
    category: 'prop',
    uses: ['place'],
    tags: ['black', 'dew', 'fuel', 'pump', 'canopy', 'station', 'amber', 'chrome', 'highway', 'turfton'],
    emoji: [],
    footprint: { r: 2.0, h: 2.6 },
    about: 'Gnome Theft Auto: Black Dew Fuel Canopy. An amber-and-chrome roadside fuel station canopy on two steel pillars with twin metered pumps on a stone island.',
    examine: [
      'A roadside fuel canopy trimmed in glowing amber and chrome, sheltering twin Black Dew pumps on a stone island.',
      'Station sign: eighty-seven octane, one hundred percent unlicensed.',
      'Tip: cut your engine before pulling alongside the hose. A hot spark near refined compost dew chars a rig in seconds.',
      'Joke: the dial ticks faster than an acorn rolling downhill, and the receipt always lists your tax under miscellaneous.',
      'A faded sticker on the chrome column warns drivers not to smoke near the amber tanks.',
    ],
    parts: [
      { s: 'box', d: [3.2, 0.14, 1.2], at: [0, 0.07, 0], c: 'stone' },                                          // concrete island
      { s: 'cyl', d: [0.11, 0.12, 2.2], at: [1.3, 1.24, 0], c: 'silver', seg: 8, mirror: true },               // chrome pillars
      { s: 'box', d: [3.8, 0.24, 2.6], at: [0, 2.42, 0], c: 'black' },                                          // canopy roof slab
      { s: 'box', d: [3.86, 0.16, 2.66], at: [0, 2.44, 0], c: DEW_AMBER },                                      // amber fascia band
      { s: 'box', d: [2.6, 0.12, 0.06], at: [0, 2.44, 1.34], c: DEW_GLOW, glow: true },                        // front amber sign
      { s: 'box', d: [2.6, 0.12, 0.06], at: [0, 2.44, -1.34], c: DEW_GLOW, glow: true },                       // rear amber sign
      { s: 'box', d: [0.44, 0.92, 0.36], at: [0.65, 0.6, 0], c: DEW_AMBER, mirror: true },                     // fuel pumps
      { s: 'box', d: [0.48, 0.1, 0.4], at: [0.65, 1.1, 0], c: 'silver', mirror: true },                         // pump chrome caps
      { s: 'box', d: [0.28, 0.22, 0.04], at: [0.65, 0.85, 0.19], c: 'spark', glow: true, mirror: true },       // lit meter dials
      { s: 'box', d: [0.06, 0.46, 0.08], at: [0.9, 0.72, 0], c: 'black', mirror: true },                       // fuel hoses
    ],
  },
  {
    id: 'gta-dew-barrel',
    name: 'Black Dew Fuel Barrel',
    category: 'prop',
    uses: ['place'],
    tags: ['barrel', 'drum', 'fuel', 'black', 'dew', 'amber', 'explosive', 'turfton'],
    emoji: [],
    footprint: { r: 0.4, h: 0.9 },
    about: 'Gnome Theft Auto: Black Dew Fuel Barrel. A shootable black-and-amber roadside fuel drum with steel ribs and a brass bung cap.',
    examine: [
      'A heavy black iron drum ringed with a bright amber stripe and topped by a little brass bung cap.',
      'Yard proverb: a full barrel makes noise when you kick it, and far too much noise when you shoot it.',
      'Tip: keep at least three gnome-lengths back before taking target practice. Shrapnel leaves nasty chips in fired clay.',
      'Joke: every driver in Cloverfield swears these barrels only sit near tight corners to improve the evening fireworks.',
      'A tiny amber droplet emblem is stencilled on the front band, still tacky from the Compost Heap refinery.',
    ],
    parts: [
      { s: 'cyl', d: [0.28, 0.28, 0.88], at: [0, 0.44, 0], c: 'black', seg: 10 },                               // barrel drum
      { s: 'cyl', d: [0.292, 0.292, 0.36], at: [0, 0.45, 0], c: DEW_AMBER, seg: 10 },                          // amber hazard band
      { s: 'ring', d: [0.28, 0.025], rot: [90, 0, 0], at: [0, 0.86, 0], c: 'steel', seg: 10 },                 // top rim
      { s: 'ring', d: [0.28, 0.025], rot: [90, 0, 0], at: [0, 0.64, 0], c: 'steel', seg: 10 },                 // upper rib
      { s: 'ring', d: [0.28, 0.025], rot: [90, 0, 0], at: [0, 0.24, 0], c: 'steel', seg: 10 },                 // lower rib
      { s: 'cyl', d: [0.05, 0.05, 0.04], at: [0.12, 0.89, 0.05], c: 'brass', seg: 6 },                         // brass bung cap
      { s: 'ball', d: [0.06], scale: [0.8, 1.3, 0.35], at: [0, 0.45, 0.29], c: DEW_GLOW, glow: true, seg: 6 }, // amber droplet badge
    ],
  },
  {
    id: 'gta-billboard',
    name: 'Turfton Roadside Billboard',
    category: 'prop',
    uses: ['place'],
    tags: ['billboard', 'sign', 'frame', 'roadside', 'highway', 'advert', 'brand', 'turfton'],
    emoji: [],
    tint: 0xf4f4f0,
    footprint: { r: 2.4, h: 3.2 },
    about: 'Gnome Theft Auto: Turfton Roadside Billboard. A double-post steel billboard frame with overhead floodlights and a tintable +z panel face ("panel", c: "tint").',
    examine: [
      'A tall double-post steel hoarding beside the highway, lit from above by twin hooded lamps and facing oncoming traffic.',
      'Turfton truth: every blade of grass in town is sponsored, and the taller boards only yell it louder.',
      'Tip: watch the road rather than the fine print. Kiln-Shield policies never cover reading while steering.',
      'Joke: Buck-Iron and Razor-Back pay extra just to rent facing boards and insult each other across the asphalt.',
      'Peeling glue along the steel catwalk shows at least seven old slogans layered beneath the current paste.',
    ],
    parts: [
      { s: 'box', d: [0.46, 0.16, 0.46], at: [1.35, 0.08, 0], c: 'stone-dark', mirror: true },                  // concrete footings
      { s: 'cyl', d: [0.1, 0.12, 2.4], at: [1.35, 1.36, 0], c: 'iron', seg: 8, mirror: true },                  // steel posts
      { s: 'box', d: [2.7, 0.12, 0.1], at: [0, 1.1, 0], c: 'iron-dark' },                                       // cross brace
      { s: 'box', d: [4.2, 1.9, 0.14], at: [0, 2.25, 0.08], c: 'iron-dark' },                                  // frame backing
      { s: 'box', d: [4.36, 0.1, 0.22], at: [0, 3.22, 0.08], c: 'steel' },                                     // top frame rail
      { s: 'box', d: [4.36, 0.1, 0.22], at: [0, 1.28, 0.08], c: 'steel' },                                     // bottom frame rail
      { s: 'box', d: [4.0, 1.72, 0.04], at: [0, 2.25, 0.16], c: 'tint', name: 'panel' },                       // tintable panel face
      { s: 'box', d: [4.0, 0.05, 0.36], at: [0, 1.24, 0.3], c: 'iron' },                                       // service catwalk
      { s: 'cyl', d: [0.03, 0.03, 0.45], rot: [75, 0, 0], at: [1.1, 3.3, 0.32], c: 'iron', seg: 6, mirror: true }, // lamp arms
      { s: 'cone', d: [0.1, 0.14], rot: [155, 0, 0], at: [1.1, 3.34, 0.54], c: 'iron-dark', seg: 6, mirror: true }, // lamp hoods
      { s: 'ball', d: [0.055], at: [1.1, 3.28, 0.52], c: 'spark', glow: true, seg: 6, mirror: true },          // floodlight bulbs
    ],
  },
];
