// Every id the shop can sell, one array per shelf. The catalogue (catalog.ts) has exactly one ModDef per id; the prefab catalogue
// (packages/prefabs/src/catalog/gta-glaze-*.ts) has one prefab per ModDef.prefab. Adding an id here without both is a test failure.
// Codes store indices into these lists: APPEND new ids at the END of a list, never reorder or insert.

export const FINISH_IDS = ['gloss', 'matte', 'metallic', 'pearl', 'candy', 'chameleon', 'primer', 'glitter', 'holo', 'patina', 'chrome'] as const;
export const DECAL_IDS = [
  'flames', 'stripes', 'checker', 'stars', 'camo', 'lightning', 'number', 'hats', 'daisies', 'drip',
  'moth', 'koi', 'hazard', 'polka', 'sunburst', 'pinstripe',
] as const;
export const TYRE_IDS = ['stock', 'fat', 'slim', 'whitewall', 'knobbly', 'cart', 'saucer', 'spiked', 'balloon', 'cogs', 'glow'] as const;
export const RIM_IDS = ['stock', 'fivespoke', 'mesh', 'deepdish', 'spinner', 'daisy', 'acorn', 'turbine', 'gear', 'bottlecap', 'sunflower', 'sawblade'] as const;
export const STEER_IDS = ['stock', 'racing', 'banjo', 'donut', 'daisy', 'pretzel', 'ship', 'heart', 'square', 'sprocket'] as const;
export const LAMP_IDS = ['stock', 'round', 'square', 'halo', 'popup', 'lantern', 'bar', 'acorn', 'cateye', 'goggle', 'candle', 'spotlight'] as const;
export const BEAM_IDS = ['warm', 'xenon', 'amber', 'rose', 'firefly', 'violet', 'mint', 'crimson', 'sunset', 'sky'] as const;
export const SPOILER_IDS = ['ducktail', 'picket', 'barndoor', 'trellis', 'biplane', 'fin', 'leaf', 'sail', 'rake', 'watercan', 'butterfly'] as const;
export const SEAT_IDS = ['bench', 'bucket', 'saddle', 'beanbag', 'throne', 'springer', 'cosy', 'toadstool', 'barrel', 'teacup', 'hay'] as const;
export const ORNAMENT_IDS = ['hat', 'acorn', 'snail', 'flamingo', 'dragonfly', 'trowel', 'rooster', 'mushroom', 'gnomelet', 'bee', 'ladybird', 'dandelion', 'spraycan'] as const;
export const EXTRA_IDS = ['dice', 'flag', 'pipes', 'mudflaps', 'bunting', 'plate', 'roobar', 'bell', 'fairylights', 'toolbox', 'cooler', 'windsock'] as const;
export const GRILLE_IDS = ['stock', 'picket', 'wire', 'grin', 'slot'] as const;
export const BUMPER_IDS = ['stock', 'chrome', 'cowcatcher', 'log', 'fender'] as const;
export const CANOPY_IDS = ['umbrella', 'awning', 'bubble', 'leaf', 'toadstool'] as const;
export const MIRROR_IDS = ['wing', 'spoon', 'stalks', 'periscope'] as const;
export const EXHAUST_IDS = ['stack', 'twin', 'chimney', 'trumpet'] as const;
export const HORN_IDS = ['stock', 'squeak', 'moo', 'trumpet', 'siren', 'bell', 'kazoo'] as const;
