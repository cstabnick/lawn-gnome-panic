// The pacing checker over every registered scene (pacing.ts). A scene in PACING_BASELINE (not yet re-directed) is only
// reported; every other scene must have no unwaived fault. `npm run cutscene-report -w games/gnome-theft-auto` prints the
// full report grouped by re-direction lane (direction/lanes.md).
import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { SceneScript, StageEnv } from './script';
import { compile, sampleFrame } from './timeline';
import { lineTiming } from './textSpeed';

installFakeDom();
const g = globalThis as Record<string, unknown>;
if (!g.window) g.window = { addEventListener: () => {}, removeEventListener: () => {} };
const { checkPacing, countByCode, formatPacing, formatTally, inBaseline, lineIndex, PACING, framing, tallyShots } = await import('./pacing');
const { PACING_BASELINE } = await import('./pacing.baseline');
const { LANES, laneOf, sceneUses } = await import('./lanes');
const { coverage } = await import('./direct');
const { envFor } = await import('./check');
const { SCENES } = await import('./scenes/index');
const { QUESTS } = await import('../quests/defs');

const uses = sceneUses(QUESTS);
const all = Object.values(SCENES);
const index = lineIndex(all);
const results = all.map((s) => checkPacing(s, envFor(s), { kindHint: uses.get(s.id)?.kind, lines: index }));
const byId = new Map(results.map((r) => [r.id, r]));
const tallies = new Map(all.map((s) => [s.id, tallyShots(s)] as const));

// npm sets npm_lifecycle_event to the script's name: the report prints for `npm run cutscene-report` (or CUTSCENE_REPORT=1).
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const wantReport = env.npm_lifecycle_event === 'cutscene-report' || !!env.CUTSCENE_REPORT;

function report(): string {
  const out: string[] = ['', '=== Cutscene pacing report (direction/bible.md; thresholds in src/cutscene/pacing.ts PACING) ==='];
  const totals: string[] = [];
  for (const lane of LANES) {
    const ids = all.map((s) => s.id).filter((id) => laneOf(id, uses.get(id)) === lane);
    ids.sort((a, b) => (uses.get(a)?.order ?? 1e9) - (uses.get(b)?.order ?? 1e9));
    const rs = ids.map((id) => byId.get(id)!);
    const n = rs.reduce((k, r) => k + r.faults.length, 0);
    totals.push(`${lane.padEnd(8)} ${String(rs.length).padStart(3)} scenes  ${String(n).padStart(4)} faults  ${rs.filter((r) => inBaseline(r.id, PACING_BASELINE)).length} in baseline`);
    out.push('', `--- ${lane}: ${rs.length} scenes, ${n} faults ---`);
    for (const r of rs) {
      out.push(`${inBaseline(r.id, PACING_BASELINE) ? '[baseline] ' : '[directed] '}${formatPacing(r)}`, formatTally(tallies.get(r.id)!));
    }
  }
  const codes = Object.entries(countByCode(results)).sort((a, b) => b[1] - a[1]).map(([c, k]) => `${c} ${k}`).join(', ');
  out.push('', '=== Totals ===', ...totals, `By code: ${codes}`);
  const monotone = all.filter((s) => tallies.get(s.id)!.monotone).map((s) => s.id);
  const thin = all.filter((s) => { const t = tallies.get(s.id)!; return t.sound.sfx + t.sound.stingers < 2; }).map((s) => s.id);
  out.push('', '=== Variety ===', ...(monotone.length ? monotone : ['(none)']));
  out.push('', '=== Sound ===', ...(thin.length ? thin : ['(none)']), '');
  return out.join('\n');
}

describe('pacing checker', () => {
  it('report', () => {
    if (wantReport) (globalThis as { process?: { stdout: { write(s: string): void } } }).process?.stdout.write(`${report()}
`);
    expect(results.length).toBe(all.length);
  });

  it.each(all.filter((s) => !inBaseline(s.id, PACING_BASELINE)).map((s) => [s.id] as const))(
    '%s (re-directed) has no unwaived pacing fault', (id) => {
      const r = byId.get(id)!;
      expect(r.faults.length === 0 ? `${id}: OK` : formatPacing(r)).toBe(`${id}: OK`);
    },
  );

  it('every baseline entry is a real scene that still has faults (remove it from the baseline once it passes)', () => {
    const stale: string[] = [];
    for (const b of PACING_BASELINE) {
      if (b.endsWith('*')) continue;
      const r = byId.get(b);
      if (!r) stale.push(`${b}: no such scene`);
      else if (r.faults.length === 0) stale.push(`${b}: passes now, remove it from pacing.baseline.ts`);
    }
    expect(stale).toEqual([]);
  });

  it('every waiver says why', () => {
    const bad = all.flatMap((s) => (s.direction?.waive ?? []).filter((w) => w.why.trim().length < 4).map((w) => `${s.id}: ${w.code}`));
    expect(bad).toEqual([]);
  });
});

// ---- The rules on small made-up scenes -------------------------------------------------------------------------------

const flat: StageEnv = { ground: () => 0 };
const room = (steps: SceneScript['steps'], extra: Partial<SceneScript> = {}): SceneScript => ({
  id: 'test-arrival',
  stage: { kind: 'room', room: 'mulch-club' },
  actors: [
    { id: 'a', at: [-1, 0], yaw: Math.PI / 2, scale: 1 },
    { id: 'b', at: [1, 0], yaw: -Math.PI / 2, scale: 1 },
  ],
  steps,
  ...extra,
});
const codes = (s: SceneScript): string[] => checkPacing(s, flat).faults.map((f) => f.code);

describe('pacing rules', () => {
  it('a well-covered exchange passes', () => {
    const c = coverage('a', 'b');
    const s = room([
      { do: 'cam', shot: c.single('a') },
      { do: 'say', who: 'a', text: 'You took the mower.' },
      { do: 'cam', shot: c.single('b') },
      { do: 'say', who: 'b', text: 'I borrowed it with intent.' },
      { do: 'cam', shot: c.ots('a') },
      { do: 'say', who: 'a', text: 'Bring it back.' },
    ]);
    expect(codes(s)).toEqual([]);
  });

  it('coverage keeps every shot on one side of the line', () => {
    for (const side of [1, -1] as const) {
      const c = coverage('a', 'b', side);
      const signs = [c.single('a'), c.single('b'), c.ots('a'), c.ots('b')].map((shot) => {
        const f = sampleFrame(compile(room([{ do: 'cam', shot }, { do: 'wait', s: 1 }]), lineTiming('normal')), 0.5, flat);
        return Math.sign(f.camera.pos[2]);
      });
      expect(new Set(signs).size).toBe(1);
    }
  });

  it('frames a frame shot at its size', () => {
    const tl = compile(room([{ do: 'cam', shot: { kind: 'frame', who: 'a', size: 'cu' } }, { do: 'wait', s: 1 }]), lineTiming('normal'));
    const f = sampleFrame(tl, 0.5, flat);
    const fr = framing(f.camera, f.actors.a);
    expect(fr.inFrame).toBe(true);
    expect(fr.fill).toBeGreaterThan(1.2);
  });

  it('flags long lines, monologues, narration, flash and dead shots, dead air', () => {
    const s = room([
      { do: 'cam', shot: { kind: 'frame', who: 'a', size: 'ws' } },
      { do: 'cam', shot: { kind: 'frame', who: 'a', size: 'ms' } },
      { do: 'say', who: 'Narrator', text: 'It was a dark and stormy night in Turfton.' },
      { do: 'say', who: 'Narrator', text: 'Again.' },
      { do: 'say', who: 'a', text: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen.' },
      { do: 'say', who: 'a', text: 'Two.' },
      { do: 'say', who: 'a', text: 'Three.' },
      { do: 'say', who: 'a', text: 'Four.' },
      { do: 'wait', s: 4 },
      { do: 'cam', shot: { kind: 'frame', who: 'b', size: 'ms' } },
      { do: 'wait', s: 0.3 },
      { do: 'cam', shot: { kind: 'frame', who: 'a', size: 'ms' } },
      { do: 'say', who: 'a', text: 'Done.' },
    ]);
    const c = codes(s);
    for (const k of ['dead-shot', 'opens-on-narration', 'narration', 'line-long', 'speaker-run', 'lines-per-shot', 'dead-air', 'shot-short']) {
      expect(c, k).toContain(k);
    }
  });

  it('flags a speaker out of frame, too small, a cut mid-line and a jump across the line', () => {
    const c = coverage('a', 'b', 1);
    const flip = coverage('a', 'b', -1);
    const s = room([
      { do: 'cam', shot: { kind: 'frame', who: 'b', size: 'cu' } },
      { do: 'say', who: 'a', text: 'I am talking but you are looking at him, and he is not even listening to me.', async: true },
      { do: 'wait', s: 1.2 },
      { do: 'cam', shot: { kind: 'frame', who: 'a', size: 'ws', toward: 'b' } },
      { do: 'wait', s: 3 },
      { do: 'cam', shot: c.single('a') },
      { do: 'say', who: 'a', text: 'Now on this side.' },
      { do: 'cam', shot: flip.single('b') },
      { do: 'say', who: 'b', text: 'And now the other.' },
    ]);
    const k = codes(s);
    for (const code of ['speaker-unseen', 'line-outruns-shot', 'crosses-line']) expect(k, code).toContain(code);
    const small = room([{ do: 'cam', shot: { kind: 'frame', who: 'a', size: 'ws' } }, { do: 'say', who: 'a', text: 'Can anyone see me?' }]);
    expect(codes(small)).toContain('speaker-small');
  });

  it('honours a waiver with a reason', () => {
    const s = room([{ do: 'cam', shot: { kind: 'frame', who: 'a', size: 'ws' } }, { do: 'say', who: 'a', text: 'Can anyone see me?' }],
      { direction: { waive: [{ code: 'speaker-small', why: 'lost in the crowd on purpose' }] } });
    const r = checkPacing(s, flat);
    expect(r.faults.map((f) => f.code)).not.toContain('speaker-small');
    expect(r.waived.map((f) => f.code)).toContain('speaker-small');
  });

  it('keeps its numbers in one place', () => {
    expect(PACING.lineWordsMax).toBeGreaterThan(PACING.lineWordsTarget);
  });
});

describe('shot tally', () => {
  const cam = (size: 'cu' | 'ms') => ({ do: 'cam' as const, shot: { kind: 'frame' as const, who: 'a', size } });
  it('three identical frame cams in a row are monotone', () => {
    const t = tallyShots(room([cam('cu'), cam('cu'), cam('cu')]));
    expect(t.longestRun).toBe(3);
    expect(t.monotone).toBe(true);
  });
  it('alternating sizes are not monotone', () => {
    const t = tallyShots(room([cam('cu'), cam('ms'), cam('cu'), cam('ms')]));
    expect(t.monotone).toBe(false);
    expect(t.longestRun).toBe(1);
  });
  it('a say with sfx counts as one sfx', () => {
    const t = tallyShots(room([{ do: 'say', who: 'a', text: 'Hi there.', sfx: 'punch' }]));
    expect(t.sound.sfx).toBe(1);
    expect(formatTally(t)).toContain('sfx 1');
  });
});
