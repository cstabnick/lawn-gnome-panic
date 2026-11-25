// Quest fuzzer: the markdown report (summary line, one row per run, one row per disruption).
import type { FuzzOutcome, FuzzResult } from './fuzz';

const OUTCOMES: FuzzOutcome[] = ['recovered', 'bug', 'bot', 'content', 'blocked', 'not-applied'];
const cell = (s: string): string => s.replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 160);

export function fuzzMarkdown(results: readonly FuzzResult[], seed: number): string {
  const count = (o: FuzzOutcome, rs: readonly FuzzResult[] = results): number => rs.filter((r) => r.outcome === o).length;
  const lines: string[] = [`# Quest fuzz (seed ${seed})`, ''];
  lines.push(`${results.length} runs: ${OUTCOMES.map((o) => `${count(o)} ${o}`).join(', ')}`, '');
  lines.push('| Quest | Variant | Disruption | Step | Frame | Outcome | Reason |', '|---|---|---|---|---|---|---|');
  for (const r of results) {
    const p = r.plan;
    const why = r.outcome === 'recovered' ? r.note : r.outcome === 'not-applied' ? r.note : `${r.note}: ${r.reason}`;
    lines.push(`| ${p.questId} | ${p.variant ?? ''} | ${p.disruption} | ${p.step} | ${p.at} f | ${r.outcome} | ${cell(why)} |`);
  }
  lines.push('', '## By disruption', '', `| Disruption | Runs | ${OUTCOMES.join(' | ')} |`, `|---|---|${OUTCOMES.map(() => '---').join('|')}|`);
  const ids = [...new Set(results.map((r) => r.plan.disruption))].sort();
  for (const id of ids) {
    const rs = results.filter((r) => r.plan.disruption === id);
    lines.push(`| ${id} | ${rs.length} | ${OUTCOMES.map((o) => count(o, rs)).join(' | ')} |`);
  }
  const look = new Set(['destroy-vehicle', 'sink-vehicle', 'crack-player', 'despawn-npc', 'traffic-sweep', 'save-reload']);
  const bad = results.filter((r) => r.outcome !== 'recovered' && r.outcome !== 'not-applied' && look.has(r.plan.disruption));
  lines.push('', '## Needs a look', '');
  if (bad.length === 0) lines.push('Nothing.');
  for (const r of bad) {
    const p = r.plan;
    lines.push(`### ${p.questId}${p.variant ? `/${p.variant}` : ''} ${p.disruption} step ${p.step} +${p.at}f: ${r.outcome}`, '', `${r.note}: ${r.reason}`, '', 'Log:');
    for (const l of r.tail.log) lines.push(`- ${cell(l)}`);
    lines.push('', `Toasts: ${r.tail.toasts.map(cell).join(' / ') || '(none)'}`, '');
  }
  lines.push('');
  return lines.join('\n');
}
