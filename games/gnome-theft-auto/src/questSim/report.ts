// Quest sim report: the markdown table and the summary line for a list of results (pure, no DOM or engine imports).
import type { QuestResult } from './types';

/** Count of passes, fails, blocked runs and the total. */
export function summarize(results: QuestResult[]): { pass: number; fail: number; blocked: number; total: number } {
  let pass = 0;
  let fail = 0;
  let blocked = 0;
  for (const r of results) {
    if (r.status === 'pass') pass++;
    else if (r.status === 'blocked') blocked++;
    else fail++;
  }
  return { pass, fail, blocked, total: results.length };
}

/** Escape a cell so a '|' in a reason does not break the table. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** The report as markdown: a heading, a summary line, one table row per run, and the findings. */
export function toMarkdown(results: QuestResult[], title: string): string {
  const s = summarize(results);
  const lines: string[] = [];
  lines.push(`# ${title}`, '');
  lines.push(`${s.pass} pass, ${s.fail} fail, ${s.blocked} blocked of ${s.total} runs`, '');
  lines.push('| Quest | Ending | Result | Steps | Cheats | Sim s | Wall ms | Reason |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of results) {
    const passed = r.steps.filter((st) => st.status === 'pass').length;
    const cheats = r.cheats.map((c) => c.id).join(', ');
    lines.push(
      `| ${cell(r.questId)} | ${r.variant ?? ''} | ${r.status} | ${passed}/${r.steps.length} | ${cell(cheats)} ` +
        `| ${r.simSeconds.toFixed(1)} | ${Math.round(r.wallMs)} | ${cell(r.reason)} |`,
    );
  }
  lines.push('');
  lines.push('## Findings', '');
  const findings = results.flatMap((r) => r.findings.map((f) => ({ r, f })));
  if (findings.length === 0) lines.push('None.');
  for (const { r, f } of findings) {
    const step = f.step !== undefined ? ` ${f.step}` : '';
    lines.push(`- ${r.questId}${step}: ${f.class} ${f.check}: ${f.detail}`);
  }
  lines.push('');
  return lines.join('\n');
}
