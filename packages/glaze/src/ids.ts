// Every id the shop can sell, one array per shelf. The catalogue (catalog.ts) has exactly one ModDef per id; the prefab catalogue
// (packages/prefabs/src/catalog/gta-glaze-*.ts) has one prefab per ModDef.prefab. Adding an id here without both is a test failure.

export const FINISH_IDS = ['gloss', 'matte', 'metallic', 'pearl', 'candy', 'chameleon', 'primer'] as const;
export const DECAL_IDS = ['flames', 'stripes', 'checker', 'stars', 'camo', 'lightning', 'number', 'hats', 'daisies', 'drip'] as const;
export const TYRE_IDS = ['stock', 'fat', 'slim', 'whitewall', 'knobbly', 'cart', 'saucer'] as const;
export const RIM_IDS = ['stock', 'fivespoke', 'mesh', 'deepdish', 'spinner', 'daisy', 'acorn', 'turbine'] as const;
export const STEER_IDS = ['stock', 'racing', 'banjo', 'donut', 'daisy', 'pretzel'] as const;
export const LAMP_IDS = ['stock', 'round', 'square', 'halo', 'popup', 'lantern', 'bar', 'acorn'] as const;
export const BEAM_IDS = ['warm', 'xenon', 'amber', 'rose', 'firefly', 'violet'] as const;
export const SPOILER_IDS = ['ducktail', 'picket', 'barndoor', 'trellis', 'biplane', 'fin', 'leaf'] as const;
export const SEAT_IDS = ['bench', 'bucket', 'saddle', 'beanbag', 'throne', 'springer', 'cosy'] as const;
export const ORNAMENT_IDS = ['hat', 'acorn', 'snail', 'flamingo', 'dragonfly', 'trowel', 'rooster', 'mushroom', 'gnomelet'] as const;
export const EXTRA_IDS = ['dice', 'flag', 'pipes', 'mudflaps', 'bunting', 'plate', 'roobar', 'bell'] as const;
