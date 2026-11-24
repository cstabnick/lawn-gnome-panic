// Quest sim report: the markdown table and summary line hold for a pass and a fail with a finding.
import { describe, expect, it } from 'vitest';
import { summarize, toMarkdown } from './report';
import type { QuestResult } from './types';

const base = { title: 'Quest', steps: [], acorns: 0, achievements: [], bulletins: [], scenes: [], comms: [], errors: [], simSeconds: 1, wallMs: 1 };

const passed: QuestResult = { ...base, questId: 'sq-pass-one', status: 'pass', reason: '', cheats: [], findings: [] };
const failed: QuestResult = {
  ...base,
  questId: 'sq-fail-two',
  variant: 'B',
  status: 'fail',
  reason: 'bot: stuck | no route',
  cheats: [{ id: 'godMode', why: 'test' }],
  findings: [{ questId: 'sq-fail-two', step: 2, check: 'spot-in-collider', class: 'bug', detail: 'spot inside a wall' }],
};

describe('quest sim report', () => {
  it('summarizes the results', () => {
    expect(summarize([passed, failed])).toEqual({ pass: 1, fail: 1, blocked: 0, total: 2 });
  });

  it('writes the table, the summary line and the finding', () => {
    const md = toMarkdown([passed, failed], 'Run');
    expect(md).toContain('# Run');
    expect(md).toContain('1 pass, 1 fail, 0 blocked of 2 runs');
    expect(md).toContain('sq-pass-one');
    expect(md).toContain('sq-fail-two');
    expect(md).toContain('bot: stuck \\| no route');
    expect(md).toContain('- sq-fail-two 2: bug spot-in-collider: spot inside a wall');
  });
});
