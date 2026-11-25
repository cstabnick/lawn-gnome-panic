// E25 firefighter job runtime: answer the bell, drive the Pumper to the call, man the hose, ladder the rescue, get
// paid per call. STUB: issue 23 fills it in.
import type { WorkDeps, WorkJobRuntime } from '../types';

export function installFirefighter(deps: WorkDeps): WorkJobRuntime {
  void deps;
  return { update() {}, isOpen: () => false, blips: () => [], waypoint: () => null };
}
