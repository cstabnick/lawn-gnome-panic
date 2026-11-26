// The E20 story stages, one file per row. Only the E20 lead edits this file.
import type { Stage } from '../kit';
import * as r02 from './s02-roof-on-credit';
import * as r05 from './s05-sweepers-wages';
import * as r07 from './s07-even-estates';
import * as r09 from './s09-where-asphalt-sleeps';
import * as r10 from './s10-under-the-span';
import * as r11 from './s11-the-dons-cigars';
import * as r12 from './s12-quarter-inch-at-home';
import * as r13 from './s13-diner-on-route-south';
import * as r14 from './s14-drainpipe-court';
import * as r15 from './s15-founders-boot';
import * as r17 from './s17-the-dew-buyer';
import * as r19 from './s19-squall-box-forecast';
import * as r21 from './s21-penthouse-viewing';
import * as r22 from './s22-off-air';
import * as r23 from './s23-unmowed-tablet';
import * as r24 from './s24-the-burrow-door';
import * as r25 from './s25-one-leg-to-stand-on';
import * as r26 from './s26-the-knot-hole';
import * as r27 from './s27-heap-of-trouble';
import * as r28 from './s28-sibling-rivalry';
import * as r29 from './s29-the-kicked-board';
import * as r30 from './s30-cams-big-night';
import * as r31 from './s31-granny-cracks';
import * as r32 from './s32-driftwoods-chart';
import * as r33 from './s33-the-bench-lock';
import * as r34 from './s34-forty-seven-wrenches';
import * as r35 from './s35-salvage-raid';

const FILES = [r02, r05, r07, r09, r10, r11, r12, r13, r14, r15, r17, r19, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35];
export const STORY_STAGES: readonly Stage[] = FILES.flatMap((f) => f.STAGES);
/** Existing stage id -> extra quest ids for its usedBy. */
export const STORY_STAGE_USES: Readonly<Record<string, readonly string[]>> = (() => {
  const out: Record<string, string[]> = {};
  for (const f of FILES) for (const [id, qs] of Object.entries(f.USES)) (out[id] ??= []).push(...qs);
  return out;
})();
