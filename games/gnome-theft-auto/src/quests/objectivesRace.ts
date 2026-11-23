// The 'race' objective runner (Lost & Found Speedway). STUB: filled in by its issue; the exported signature is the contract.
import type { ObjectiveDef, QuestDeps, Run } from './types';

export function raceRun(
  obj: Extract<ObjectiveDef, { kind: 'race' }>,
  deps: QuestDeps,
  changed: () => void,
  say: (t: string) => void,
): Run {
  void deps; void changed; void say;
  return {
    lines: () => [obj.text],
    done: () => false,
    update() {},
    onCracked() {},
    blips: () => [],
    cracked: () => [],
    cleanup() {},
  };
}
