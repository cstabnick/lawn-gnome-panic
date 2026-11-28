// Quest sim: play one quest from its giver to CONTRACT COMPLETE through a SessionHost, one solver per objective, and
// check what should have happened (reward once, achievement, bulletin, scenes, comms, save round trip, no errors).
import { GIVERS, QUESTS, questById } from '../quests/defs';
import { worldGiver } from '../quests/quests';
import { SCENES } from '../cutscene/scenes';
import type { QuestDef, CutsceneSpec } from '../quests/types';
import { savesToStart } from './prereqs';
import { solverFor } from './solvers';
import { stepDone, waitFor } from './util';
import type { Cheats, Finding, QuestResult, RunSession, SessionHost, SessionRecord, StepResult } from './types';
import { SimFail } from './types';

export interface RunOpts {
  cheats: Cheats;
  /** For a quest with a 'choice' objective: which ending. */
  variant?: 'A' | 'B';
  /** Sim seconds per objective (default 600). */
  budget?: number;
  /** Do the save round trip (default true when the host supports it). */
  roundTrip?: boolean;
  /** Called with each status line (the browser HUD, the CLI). */
  onStatus?: (line: string) => void;
  /** Called with every session the run plays on: right after `host.open` and after every save round trip reopen. */
  onSession?: (s: RunSession) => void;
  /** Before solving this objective, do a save/reload (round trip) mid-quest (the one at step 0 still happens). */
  reloadBeforeStep?: number;
  /** When a solver throws a 'bot' failure: step once and call it again for the same step, this many times (default 0). */
  solverRetries?: number;
}

/** The scene ids a run of `q` should play: intro, beats, arrival scenes, and the outro (or the chosen ending's). */
export function expectedScenes(q: QuestDef, variant?: 'A' | 'B'): string[] {
  const out: string[] = [];
  const spec = (s: CutsceneSpec | undefined): void => {
    if (s?.kind === 'script' && typeof s.script === 'string') out.push(s.script);
    else if (s?.kind === 'script' && typeof s.script !== 'string') out.push(s.script.id);
  };
  spec(q.cutscene);
  q.objectives.forEach((o, i) => {
    const beat = q.beats?.[i];
    if (beat) out.push(beat);
    if (o.kind === 'visit' && o.scene) out.push(o.scene);
  });
  const choice = q.objectives.find((o) => o.kind === 'choice');
  const ending = choice?.kind === 'choice' ? (variant === 'B' ? choice.optionB : choice.optionA).outro : undefined;
  if (ending) out.push(ending);
  else spec(q.outro);
  return out;
}

function mergeRecords(rs: SessionRecord[]): SessionRecord {
  const m: SessionRecord = {
    toasts: [], banners: [], achievements: [], bulletins: [], earned: [], scenes: [], sceneErrors: [],
    objectiveStarts: [], triggers: [], cheats: new Map(), log: [], errors: [], heatAdded: 0,
  };
  for (const r of rs) {
    m.toasts.push(...r.toasts); m.banners.push(...r.banners); m.achievements.push(...r.achievements);
    m.bulletins.push(...r.bulletins); m.earned.push(...r.earned); m.scenes.push(...r.scenes);
    m.sceneErrors.push(...r.sceneErrors); m.objectiveStarts.push(...r.objectiveStarts); m.triggers.push(...r.triggers);
    for (const [k, v] of r.cheats) if (!m.cheats.has(k)) m.cheats.set(k, v);
    m.log.push(...r.log); m.errors.push(...r.errors); m.heatAdded += r.heatAdded;
  }
  return m;
}

/** Sim seconds of sessions closed by a save round trip (added to the result's simSeconds). */
let roundTripSim = 0;

/** Play quest `questId` once. Never throws: every failure is in the result. */
export async function runQuest(host: SessionHost, questId: string, opts: RunOpts): Promise<QuestResult> {
  const wall0 = Date.now();
  const q = questById(questId);
  const result: QuestResult = {
    questId, title: q?.title ?? questId, variant: opts.variant, status: 'pass', reason: '', steps: [], cheats: [],
    findings: [], acorns: 0, achievements: [], bulletins: [], scenes: [], comms: [], errors: [], simSeconds: 0, wallMs: 0,
  };
  const fail = (cls: Finding['class'], reason: string, step?: number): void => {
    if (result.status === 'pass') {
      result.status = cls === 'blocked' ? 'blocked' : 'fail';
      result.reason = `${cls}: ${reason}`;
    }
    result.findings.push({ questId, step, check: 'run', class: cls, detail: reason });
  };
  if (!q) {
    fail('content', `no quest ${questId}`);
    return result;
  }
  const budget = opts.budget ?? 600;
  const status = (s: string): void => opts.onStatus?.(`${q.id}${opts.variant ? `/${opts.variant}` : ''}: ${s}`);
  const records: SessionRecord[] = [];
  let s: RunSession | null = null;
  let simBase = 0;
  let layer: 'headless' | 'browser' = 'headless';
  try {
    // 1. A save in which the quest is offered.
    let saves;
    try {
      saves = savesToStart(q, QUESTS);
    } catch (e) {
      throw new SimFail('content', `prerequisites: ${(e as Error).message}`);
    }
    s = await host.open(saves, opts.cheats);
    opts.onSession?.(s);
    const ctx = s;
    layer = ctx.layer;

    // 2. Take it from the giver.
    const g0 = GIVERS[q.giver];
    if (!g0) throw new SimFail('content', `giver ${q.giver} missing`);
    const g = worldGiver(g0); // an interior giver is local to its room (the coast's cabin)
    status(`going to ${g.name}`);
    ctx.useCheat('instantTravel', 'teleport to the giver');
    ctx.teleport(g.x, g.z);
    await ctx.step();
    if (ctx.quests.getJournal().activeId !== null) throw new SimFail('bug', `another quest is active at the start: ${ctx.quests.getJournal().activeId}`);
    if (!ctx.quests.prompt(g.x, g.z)) throw new SimFail('bug', `no prompt at ${g.name} (quest not offered)`);
    if (!ctx.quests.interact(g.x, g.z)) throw new SimFail('bug', `interact at ${g.name} did nothing`);
    const taken = await waitFor(ctx, () => ctx.quests.getJournal().activeId === q.id, 120);
    if (!taken) throw new SimFail('bug', `quest not active after the giver's scene (active: ${ctx.quests.getJournal().activeId})`);

    const roundTripAt = opts.roundTrip === false || !host.reopen ? -2 : q.objectives.length > 1 ? 0 : -1;
    if (roundTripAt === -1) s = await roundTrip(host, s, q, 0, records, opts.onSession);

    // 3. Each objective.
    for (let i = 0; i < q.objectives.length; i++) {
      const obj = q.objectives[i];
      if (opts.reloadBeforeStep === i && host.reopen) s = await roundTrip(host, s!, q, i, records, opts.onSession);
      const cur: RunSession = s!;
      const t0 = cur.now();
      const sr: StepResult = { step: i, kind: obj.kind, status: 'pass', simSeconds: 0 };
      result.steps.push(sr);
      status(`step ${i + 1}/${q.objectives.length}: ${obj.kind}: ${obj.text}`);
      cur.log(`step ${i} ${obj.kind}: ${obj.text}`);
      // A beat scene may still be playing; the run starts once it is over.
      await waitFor(cur, () => cur.quests.getJournal().activeLines.length > 0 || stepDone(cur, q.id, i), 60);
      try {
        for (let tries = opts.solverRetries ?? 0; ; tries--) {
          try {
            await solverFor(obj).solve(obj as never, cur, { questId: q.id, step: i, choice: opts.variant, budget });
            break;
          } catch (e) {
            if (!(e instanceof SimFail) || e.failClass !== 'bot' || tries <= 0) throw e;
            if (stepDone(cur, q.id, i)) break;
            cur.log(`solver retry (${tries} left) after: ${e.message}`);
            await cur.step();
          }
        }
        if (!stepDone(cur, q.id, i)) throw new SimFail('bot', `${obj.kind} solver returned but the step is not done`);
      } catch (e) {
        sr.status = 'fail';
        sr.detail = (e as Error).message;
        sr.simSeconds = cur.now() - t0;
        for (let k = i + 1; k < q.objectives.length; k++) result.steps.push({ step: k, kind: q.objectives[k].kind, status: 'skipped', simSeconds: 0 });
        throw e;
      }
      sr.simSeconds = cur.now() - t0;
      if (i === roundTripAt) s = await roundTrip(host, cur, q, i + 1, records, opts.onSession);
    }

    // 4. The payoff: outro scene, banner.
    const last: RunSession = s!;
    status('finishing');
    await waitFor(last, () => last.record.banners.includes('CONTRACT COMPLETE'), 120);
    if (last.quests.getJournal().saves[q.id]?.state !== 'done') throw new SimFail('bug', 'quest not saved as done');
  } catch (e) {
    const cls = e instanceof SimFail ? e.failClass : 'bug';
    const msg = e instanceof SimFail ? e.message : `exception: ${(e as Error).stack?.split('\n').slice(0, 3).join(' | ') ?? String(e)}`;
    fail(cls, msg, result.steps.find((x) => x.status === 'fail')?.step);
  }
  if (s) {
    records.push(s.record);
    simBase += s.now() + roundTripSim;
    roundTripSim = 0;
    s.dispose();
  }
  const rec = mergeRecords(records);
  checkRecord(q, rec, result, layer, opts.variant);
  result.cheats = [...rec.cheats].map(([id, why]) => ({ id, why }));
  result.simSeconds = simBase;
  result.wallMs = Date.now() - wall0;
  return result;
}

async function roundTrip(host: SessionHost, s: RunSession, q: QuestDef, expectStep: number, records: SessionRecord[], onSession?: (s: RunSession) => void): Promise<RunSession> {
  records.push(s.record);
  roundTripSim += s.now();
  const n = await host.reopen!(s);
  onSession?.(n);
  const j = n.quests.getJournal();
  if (j.activeId !== q.id) throw new SimFail('bug', `save round trip: active quest ${j.activeId}, expected ${q.id}`);
  if (j.activeStep !== expectStep) throw new SimFail('bug', `save round trip: step ${j.activeStep}, expected ${expectStep}`);
  await n.step();
  return n;
}

/** What the session record says about rewards, scenes and comms. Adds findings; a pass with a bad payout becomes a fail. */
function checkRecord(q: QuestDef, rec: SessionRecord, result: QuestResult, layer: 'headless' | 'browser', variant?: 'A' | 'B'): void {
  result.errors = rec.errors.map((e) => e.split('\n')[0]);
  result.scenes = rec.scenes;
  result.comms = [...new Set(rec.objectiveStarts.filter((o) => o.questId === q.id && o.comms).map((o) => o.step))];
  result.achievements = rec.achievements;
  result.bulletins = rec.bulletins;
  const reward = rec.earned.filter((e) => e.reason === `Quest: ${q.title}`);
  result.acorns = reward.reduce((n, e) => n + e.amount, 0);
  const add = (check: string, cls: Finding['class'], detail: string): void => {
    result.findings.push({ questId: q.id, check, class: cls, detail });
    if (result.status === 'pass') {
      result.status = 'fail';
      result.reason = `${cls}: ${check}: ${detail}`;
    }
  };
  for (const e of rec.sceneErrors) add('scene-broken', 'content', e);
  for (const id of expectedScenes(q, variant)) if (!SCENES[id]) add('scene-missing', 'content', `scene ${id} is not in SCENES`);
  if (result.status !== 'pass' && result.reason) {
    // The run did not finish: payout checks would only repeat that.
    return;
  }
  if (reward.length !== 1) add('reward', 'bug', `quest reward paid ${reward.length} times`);
  else if (reward[0].amount !== (q.rewardAcorns ?? 250)) add('reward', 'bug', `reward ${reward[0].amount}, expected ${q.rewardAcorns ?? 250}`);
  // The browser layer cannot see achievements or bulletins (app.ts closures); only the headless layer checks them.
  if (layer === 'headless') {
    if (q.achievement && !rec.achievements.includes(q.achievement)) add('achievement', 'bug', `achievement ${q.achievement} not unlocked`);
    const bulletin = q.radioBulletin ?? q.id;
    if (!rec.bulletins.includes(bulletin)) add('bulletin', 'bug', `radio bulletin ${bulletin} not sent`);
  }
  for (const id of expectedScenes(q, variant)) {
    if (SCENES[id] && !rec.scenes.includes(id)) add('scene-not-played', 'bug', `scene ${id} did not play`);
  }
  if (rec.errors.length > 0) add('errors', 'bug', rec.errors[0].split('\n')[0]);
}
