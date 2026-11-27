// Act IV story scenes (rows 54-70, one file per row; rows 64 and 70 in two files each). Only the E22 lead edits this file.
// The kept rows' original scenes stay in ch4.ts / ch4b.ts / ch4c.ts / ch5.ts.
import type { SceneScript } from '../../script';
import { SCENES as r54 } from './m54-the-heist-board';
import { SCENES as r55 } from './m55-runway-flares';
import { SCENES as r56 } from './m56-mortar-for-a-mower';
import { SCENES as r57 } from './m57-sandpit-drop';
import { SCENES as r58 } from './m58-the-reeves-barn';
import { SCENES as r59 } from './m59-spade-truce';
import { SCENES as r60 } from './m60-the-moles-dig';
import { SCENES as r61 } from './m61-diggs-medal';
import { SCENES as r62 } from './m62-cams-cell';
import { SCENES as r63 } from './m63-four-taps';
import { SCENES as r64a } from './m64a-all-hats';
import { SCENES as r64 } from './m64-all-hats';
import { SCENES as r65 } from './m65-the-countess-relents';
import { SCENES as r66 } from './m66-porcelain-hearts';
import { SCENES as r67 } from './m67-emergency-assessment';
import { SCENES as r68 } from './m68-lights-out';
import { SCENES as r69 } from './m69-the-combine-wakes';
import { SCENES as r70a } from './m70a-even-cut';
import { SCENES as r70 } from './m70-even-cut';

export const ACT_IV_SCENES: Record<string, SceneScript> = {
  ...r54, ...r55, ...r56, ...r57, ...r58, ...r59, ...r60, ...r61, ...r62, ...r63, ...r64a, ...r64, ...r65, ...r66, ...r67,
  ...r68, ...r69, ...r70a, ...r70,
};
