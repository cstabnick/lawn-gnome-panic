// E24 comedy job runtime (STUB: replaced by its E24 issue). Contract: installs the job, returns a WorkJobRuntime.
import type { WorkDeps, WorkJobRuntime } from '../types';

export function installComedy(deps: WorkDeps): WorkJobRuntime {
  void deps;
  return { update() {}, isOpen: () => false, blips: () => [] };
}
