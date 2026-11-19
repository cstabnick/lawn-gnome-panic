import { expect, it } from 'vitest';
import { LEVELS } from '../levels';
import { assessLevel, curveProblems, difficultyLabel, type LevelReport } from './assess';

it('the difficulty curve matches the targets (smart bot, 24 seeds)', { timeout: 300_000 }, () => {
  const reports: LevelReport[] = LEVELS.map((level) => assessLevel(level, 24, ['smart']));
  const rows = reports.map(
    (r) =>
      `${String(r.id).padStart(2)} ${r.name.padEnd(20)} target ${Math.round(r.target * 100)}% smart ${Math.round((r.win.smart ?? 0) * 100)}% ${difficultyLabel(r.win.smart ?? 0)} ${r.verdict}`,
  );
  console.log(rows.join('\n'));
  const problems = curveProblems(reports);
  console.log(problems.length ? `Problems:\n${problems.map((p) => `- ${p}`).join('\n')}` : 'Curve OK');
  expect(problems).toEqual([]);
});
