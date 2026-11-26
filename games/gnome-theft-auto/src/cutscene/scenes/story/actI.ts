// Act I story scenes (one file per row). Only the E20 lead edits this file.
import type { SceneScript } from '../../script';
import { SCENES as r02 } from './m02-roof-on-credit';
import { SCENES as r05 } from './m05-sweepers-wages';
import { SCENES as r07 } from './m07-even-estates';
import { SCENES as r09 } from './m09-where-asphalt-sleeps';
import { SCENES as r10 } from './m10-under-the-span';
import { SCENES as r11 } from './m11-the-dons-cigars';
import { SCENES as r12 } from './m12-quarter-inch-at-home';
import { SCENES as r13 } from './m13-diner-on-route-south';
import { SCENES as r14 } from './m14-drainpipe-court';
import { SCENES as r15 } from './m15-founders-boot';

export const ACT_I_SCENES: Record<string, SceneScript> = { ...r02, ...r05, ...r07, ...r09, ...r10, ...r11, ...r12, ...r13, ...r14, ...r15 };
