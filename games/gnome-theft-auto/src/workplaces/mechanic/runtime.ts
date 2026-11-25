// E24 mechanic job runtime (STUB: replaced by its E24 issue). Contract: installs the job, returns a WorkJobRuntime.
import type { WorkDeps, WorkJobRuntime } from '../types';

export function installMechanic(deps: WorkDeps): WorkJobRuntime {
  void deps;
  return { update() {}, isOpen: () => false, blips: () => [] };
}
