// The pacing and craft checker: reads a compiled scene the way an editor watches a cut and reports what the direction
// bible (docs/design/gnome-theft-auto/direction/bible.md) calls a fault: lines too long to read, cuts that land in the
// middle of a line, flash cuts and shots held too long, dead air, a speaker not in frame (or too small, or seen from
// behind) while talking, the camera jumping the line, monologues, narration doing the acting, no hook, scenes over
// their length. Every number lives in PACING below and is quoted in the bible. Pure: no three.js, no DOM.
// Run: `npm run cutscene-report -w games/gnome-theft-auto` (the report), `npm test` (pacing.test.ts).
import type {
  ActorSample, CameraSample, PacingCode, PacingWaiver, SceneFrame, SceneKind, SceneScript, ShotSize, StageEnv, Step, Timeline,
} from './script';
import { GNOME_HEIGHT, compile, sampleFrame } from './timeline';
import { lineTiming, wordCount } from './textSpeed';

/** The bible's numbers. Change them there and here together. */
export const PACING = {
  /** A line's words: the target, and the limit that is a fault. */
  lineWordsTarget: 12,
  lineWordsMax: 16,
  /** Lines that may start in one shot before a cut. */
  linesPerShotMax: 3,
  /** Lines in a row by one speaker before someone else speaks, reacts on camera or the scene moves on. */
  speakerRunMax: 3,
  /** Narrator lines and captions in a scene (prologue and chapter openers / closers get two). */
  narrationMax: 1,
  narrationMaxBig: 2,
  /** A shot shorter than this is a flash cut (seconds). */
  shotMin: 0.8,
  /** Longest hold by shot class (seconds): close (cu/mcu), medium (ms/fs), wide, and moving shots. */
  shotMax: { close: 7, medium: 9, wide: 6, moving: 12 } as Record<ShotClass, number>,
  /** Longest stretch with no new line, action, sound hit or camera change (seconds). */
  deadAir: 3,
  /** Something must happen (a line, a move, a sound hit) by this time (seconds from the start of the fade-in). */
  hook: 3,
  /** A cut in the first share of a line's typing is a cut mid-line. */
  midLine: 0.8,
  /** The speaker must be framed for at least this share of the line's typing. */
  framedShare: 0.5,
  /** Below this share of the frame height a talking gnome is too small to read (a wide shot). */
  speakerFillMin: 0.25,
  /** Seen from more than this many degrees off their facing, a speaker shows the back of the hat. */
  backAngle: 115,
  /** Two speakers further apart than this (metres) are not one conversation: no 180-degree line between them. */
  lineSpan: 10,
  /** Lines shorter than this (words) never count as repeats. */
  repeatMinWords: 4,
  /** Scene length targets by kind: [ideal low, ideal high, fault above] seconds. */
  length: {
    intro: [30, 60, 75],
    outro: [15, 45, 60],
    arrival: [10, 35, 45],
    'chapter-open': [45, 80, 100],
    'chapter-close': [40, 80, 100],
    'race-intro': [15, 30, 35],
    'race-podium': [10, 22, 30],
  } as Record<SceneKind, [number, number, number]>,
} as const;

export type ShotClass = 'close' | 'medium' | 'wide' | 'moving';

export interface PacingFault {
  code: PacingCode;
  /** Scene time, seconds (normal text speed), or -1 for whole-scene faults. */
  t: number;
  detail: string;
  /** The line concerned, if any. */
  text?: string;
}

export interface PacingResult {
  id: string;
  kind: SceneKind;
  duration: number;
  shots: number;
  lines: number;
  faults: PacingFault[];
  /** Faults a waiver in the scene's `direction.waive` covers. */
  waived: PacingFault[];
}

const NARRATOR = /^narrator$/i;

/** The kind of scene: `direction.kind`, else a hint (how a quest plays it), else the id and the title cards. */
export function sceneKind(script: SceneScript, hint?: SceneKind): SceneKind {
  if (script.direction?.kind) return script.direction.kind;
  const titles = script.steps.flatMap(function walk(s): string[] {
    if (s.do === 'title' && s.text) return [s.text];
    if (s.do === 'parallel') return s.tracks.flat().flatMap(walk);
    return [];
  });
  if (titles.some((t) => /END OF CHAPTER|THE END/i.test(t))) return 'chapter-close';
  if (script.id === 'prologue-intro' || titles.some((t) => /^CHAPTER\b/i.test(t))) return 'chapter-open';
  if (/^race-.*-intro$/.test(script.id)) return 'race-intro';
  if (/^race-.*-podium$/.test(script.id)) return 'race-podium';
  if (hint) return hint;
  if (/-intro$/.test(script.id)) return 'intro';
  if (/-outro$/.test(script.id)) return 'outro';
  return 'arrival';
}

/** Where `a` sits in the camera's view: inside a square safe frame, its fill of the frame height, and the view angle off its facing. */
export function framing(cam: CameraSample, a: ActorSample): { inFrame: boolean; fill: number; offFacing: number } {
  const px = a.x, py = a.y + a.head * 0.85, pz = a.z;
  const fx0 = cam.look[0] - cam.pos[0], fy0 = cam.look[1] - cam.pos[1], fz0 = cam.look[2] - cam.pos[2];
  const fl = Math.hypot(fx0, fy0, fz0) || 1;
  const fx = fx0 / fl, fy = fy0 / fl, fz = fz0 / fl;
  // right = f x up(0,1,0) = (-fz, 0, fx); up' = right x f.
  let rx = -fz, rz = fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl; rz /= rl;
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  const vx = px - cam.pos[0], vy = py - cam.pos[1], vz = pz - cam.pos[2];
  const depth = vx * fx + vy * fy + vz * fz;
  const toCam = Math.atan2(cam.pos[0] - a.x, cam.pos[2] - a.z);
  const off = Math.abs(Math.atan2(Math.sin(toCam - a.yaw), Math.cos(toCam - a.yaw))) * 180 / Math.PI;
  if (depth <= 0.05) return { inFrame: false, fill: 0, offFacing: off };
  const tv = Math.tan((cam.fov * Math.PI) / 360);
  const sx = (vx * rx + vz * rz) / depth;
  const sy = (vx * ux + vy * uy + vz * uz) / depth;
  // Square safe frame: what a portrait-ish phone still shows of a 16:9 shot is roughly its centre square.
  const inFrame = Math.abs(sx) <= tv && Math.abs(sy) <= tv;
  const fill = (a.head * GNOME_HEIGHT) / depth / (2 * tv);
  return { inFrame, fill, offFacing: off };
}

/** The size class of a shot at a frame: by the fill of its target actor (or the biggest framed actor). */
function classOf(frame: SceneFrame, kind: string): ShotClass {
  if (kind === 'dolly' || kind === 'orbit' || kind === 'follow' || kind === 'track') return 'moving';
  const tgt = frame.camera.target ? frame.actors[frame.camera.target] : undefined;
  let fill = 0;
  if (tgt?.visible) fill = framing(frame.camera, tgt).fill;
  else {
    for (const a of Object.values(frame.actors)) {
      if (!a.visible) continue;
      const f = framing(frame.camera, a);
      if (f.inFrame) fill = Math.max(fill, f.fill);
    }
  }
  if (fill >= 1.0) return 'close';
  if (fill >= 0.35) return 'medium';
  return 'wide';
}

const norm = (t: string): string => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export interface PacingOptions {
  /** How a quest plays the scene (intro / outro / arrival), when known. */
  kindHint?: SceneKind;
  /** Normalised line text -> ids of the scenes that say it (from lineIndex), for repeat-line. */
  lines?: Map<string, Set<string>>;
  /** Sample spacing, seconds. Default 0.1. */
  dt?: number;
}

/** Every line's normalised text and the scenes that say it, for the repeat-line check. */
export function lineIndex(scripts: readonly SceneScript[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const s of scripts) {
    const tl = compile(s, lineTiming('normal'));
    for (const ts of tl.steps) {
      if (ts.step.do !== 'say' || wordCount(ts.step.text) < PACING.repeatMinWords) continue;
      const k = norm(ts.step.text);
      if (!out.has(k)) out.set(k, new Set());
      out.get(k)!.add(s.id);
    }
  }
  return out;
}

/** Checks one scene. `env` stands actors on the ground (check.ts envFor). */
export function checkPacing(script: SceneScript, env: StageEnv, opts: PacingOptions = {}): PacingResult {
  const tl: Timeline = compile(script, lineTiming('normal'));
  const kind = sceneKind(script, opts.kindHint);
  const dt = opts.dt ?? 0.1;
  const faults: PacingFault[] = [];
  const add = (code: PacingCode, t: number, detail: string, text?: string): void => { faults.push({ code, t, detail, text }); };
  const r1 = (v: number): string => v.toFixed(1);
  const frameAt = (t: number): SceneFrame => sampleFrame(tl, Math.min(t, tl.duration), env);
  const actorIds = new Set((script.actors ?? []).map((a) => a.id));

  // Shots: each cam step until the next one.
  const cams = tl.steps.filter((ts) => ts.step.do === 'cam');
  const shots = cams.map((ts, i) => ({ ts, start: ts.start, end: i + 1 < cams.length ? cams[i + 1].start : tl.duration }));
  const shotAt = (t: number): number => {
    let k = -1;
    for (let i = 0; i < shots.length; i++) if (shots[i].start <= t + 1e-6) k = i;
    return k;
  };
  const lines = tl.steps.filter((ts) => ts.step.do === 'say');

  // Scene length.
  const [, , maxLen] = PACING.length[kind];
  if (tl.duration > maxLen) add('scene-long', -1, `${r1(tl.duration)} s, over the ${maxLen} s limit for a ${kind} scene`);

  // Hook: a line, a move or a sound hit early on.
  const hookKinds = new Set(['say', 'walk', 'drive', 'gesture', 'sfx', 'stinger', 'horn', 'enter', 'exit', 'give', 'shake']);
  const firstHook = tl.steps.find((ts) => hookKinds.has(ts.step.do) || (ts.step.do === 'cam' && (ts.step.shot.kind === 'dolly' || ts.step.shot.kind === 'orbit') && ts.start > 0));
  const moveFromStart = cams[0] && cams[0].start < 0.05 && (cams[0].step.do === 'cam' && (cams[0].step.shot.kind === 'dolly' || cams[0].step.shot.kind === 'orbit'));
  const hookT = firstHook ? firstHook.start : Infinity;
  if (hookT > PACING.hook && !moveFromStart) add('no-hook', 0, `nothing happens until ${hookT === Infinity ? 'the end' : `${r1(hookT)} s`} (hook by ${PACING.hook} s)`);
  else if (hookT > PACING.hook) add('no-hook', 0, `only a camera move until ${r1(hookT)} s: open on an action, a sound or a line`);
  const firstLine = lines[0];
  if (firstLine && firstLine.step.do === 'say' && NARRATOR.test(firstLine.step.who) && firstLine === tl.steps.find((ts) => hookKinds.has(ts.step.do))) {
    add('opens-on-narration', firstLine.start, 'the scene opens on narration: open on a picture or a character', firstLine.step.text);
  }

  // Shots: dead, flash, too long, too many lines.
  shots.forEach((s, i) => {
    const len = s.end - s.start;
    const shotKind = s.ts.step.do === 'cam' ? s.ts.step.shot.kind : 'cut';
    if (len < 0.05 && i + 1 < shots.length) { add('dead-shot', s.start, `shot ${i + 1} (${shotKind}) is replaced at once and never seen`); return; }
    if (len < PACING.shotMin) add('shot-short', s.start, `shot ${i + 1} (${shotKind}) lasts ${r1(len)} s (min ${PACING.shotMin})`);
    const cls = classOf(frameAt(s.start + len / 2), shotKind);
    const max = PACING.shotMax[cls];
    if (len > max) add('shot-long', s.start, `shot ${i + 1} (${shotKind}, ${cls}) holds ${r1(len)} s (max ${max})`);
    const n = lines.filter((l) => l.start >= s.start - 1e-6 && l.start < s.end - 1e-6).length;
    if (n > PACING.linesPerShotMax) add('lines-per-shot', s.start, `${n} lines in shot ${i + 1} (max ${PACING.linesPerShotMax}): cut to a reaction or a new angle`);
  });

  // Lines.
  let narration = 0;
  let run = 0;
  let prevWho = '';
  for (const l of lines) {
    if (l.step.do !== 'say') continue;
    const { who, text } = l.step;
    const words = wordCount(text);
    if (words > PACING.lineWordsMax) add('line-long', l.start, `${words} words (max ${PACING.lineWordsMax}, aim for ${PACING.lineWordsTarget})`, text);
    if (NARRATOR.test(who)) narration++;
    run = who === prevWho ? run + 1 : 1;
    prevWho = who;
    if (run === PACING.speakerRunMax + 1) add('speaker-run', l.start, `${who} has ${run} lines in a row (max ${PACING.speakerRunMax})`, text);
    const typeDur = l.typeDur ?? 0;
    const cutIn = cams.find((c) => c.start > l.start + 0.05 && c.start < l.start + Math.max(0.5, typeDur * PACING.midLine));
    if (cutIn) add('line-outruns-shot', cutIn.start, `a cut ${r1(cutIn.start - l.start)} s into a ${r1(typeDur)} s line: cut on the end of the line`, text);
    // Framing while it types.
    if (!actorIds.has(who)) continue;
    const span = Math.max(typeDur, 1.0);
    let n = 0, framed = 0, back = 0, seen = 0;
    const fills: number[] = [];
    for (let t = l.start + 0.05; t < l.start + span; t += dt) {
      const f = frameAt(t);
      const a = f.actors[who];
      if (!a?.visible) continue;
      seen++;
      n++;
      const g = framing(f.camera, a);
      if (g.inFrame) {
        framed++;
        fills.push(g.fill);
        if (g.offFacing > PACING.backAngle && !a.seatedIn) back++;
      }
    }
    if (seen === 0) continue; // a hidden actor speaks: an off-screen voice
    if (framed / n < PACING.framedShare) add('speaker-unseen', l.start, `${who} is out of frame for ${Math.round((1 - framed / n) * 100)}% of the line`, text);
    else {
      fills.sort((x, y) => x - y);
      const med = fills[Math.floor(fills.length / 2)];
      if (med < PACING.speakerFillMin) add('speaker-small', l.start, `${who} fills ${Math.round(med * 100)}% of the frame height while talking (min ${Math.round(PACING.speakerFillMin * 100)}%)`, text);
      if (back / framed > 0.5) add('speaker-back', l.start, `${who} talks with their back to the camera`, text);
    }
    if (opts.lines) {
      const others = [...(opts.lines.get(norm(text)) ?? [])].filter((id) => id !== script.id);
      if (others.length > 0 && words >= PACING.repeatMinWords) add('repeat-line', l.start, `also said in ${others.slice(0, 3).join(', ')}${others.length > 3 ? ` (+${others.length - 3})` : ''}: vary or escalate a running line`, text);
    }
  }
  const captions = tl.steps.filter((ts) => ts.step.do === 'caption' && ts.step.text).length;
  const narrMax = kind === 'chapter-open' || kind === 'chapter-close' ? PACING.narrationMaxBig : PACING.narrationMax;
  if (narration + captions > narrMax) add('narration', -1, `${narration} narrator line(s) and ${captions} caption(s) (max ${narrMax} for a ${kind} scene): show it instead`);

  // The 180-degree line: consecutive lines between two on-screen actors keep the camera on one side of them.
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i - 1].step, q = lines[i].step;
    if (p.do !== 'say' || q.do !== 'say' || p.who === q.who || !actorIds.has(p.who) || !actorIds.has(q.who)) continue;
    const s0 = shotAt(lines[i - 1].start + 0.1), s1 = shotAt(lines[i].start + 0.1);
    if (s0 < 0 || s1 < 0 || s0 === s1) continue;
    const side = (t: number): number => {
      const f = frameAt(t);
      const a = f.actors[p.who], b = f.actors[q.who];
      if (!a?.visible || !b?.visible) return 0;
      const ex = b.x - a.x, ez = b.z - a.z;
      const el = Math.hypot(ex, ez);
      // Not one conversation (different places, or shouting distance): no line between them.
      if (el < 0.3 || el > PACING.lineSpan) return 0;
      const c = (ex * (f.camera.pos[2] - a.z) - ez * (f.camera.pos[0] - a.x)) / el;
      return Math.abs(c) < 0.4 ? 0 : Math.sign(c);
    };
    const a0 = side(lines[i - 1].start + 0.1), a1 = side(lines[i].start + 0.1);
    if (a0 !== 0 && a1 !== 0 && a0 !== a1) add('crosses-line', lines[i].start, `the camera jumps to the other side of ${p.who} and ${q.who} between their lines`, q.text);
  }

  // Dead air: stretches with no line, movement, sound hit, title or camera change.
  const busy: Array<[number, number]> = [];
  for (const ts of tl.steps) {
    const st = ts.step;
    switch (st.do) {
      case 'say': case 'walk': case 'drive': case 'enter': case 'exit': case 'give': case 'gesture': case 'fade': case 'shake':
        busy.push([ts.start, ts.start + Math.max(ts.dur, 0.8)]);
        break;
      case 'face':
        busy.push([ts.start, ts.start + Math.max(ts.dur, 0.5)]);
        break;
      case 'cam':
        busy.push([ts.start, ts.start + Math.max(st.shot.kind === 'dolly' || st.shot.kind === 'orbit' ? ts.dur : 0, 1.0)]);
        break;
      case 'sfx': case 'stinger': case 'horn': case 'spawn': case 'despawn': case 'hold': case 'lights':
        busy.push([ts.start, ts.start + 0.8]);
        break;
      case 'title': case 'caption':
        if (st.text) busy.push([ts.start, ts.start + 2.5]);
        break;
      case 'intro':
        busy.push([ts.start, ts.start + ts.dur]);
        break;
      default:
        break;
    }
  }
  busy.sort((a, b) => a[0] - b[0]);
  let reach = 0;
  for (const [s, e] of busy) {
    if (s - reach > PACING.deadAir) add('dead-air', reach, `${r1(s - reach)} s with nothing new (max ${PACING.deadAir}) from ${r1(reach)} s`);
    reach = Math.max(reach, e);
  }
  if (tl.duration - reach > PACING.deadAir) add('dead-air', reach, `${r1(tl.duration - reach)} s with nothing new at the end`);

  // Waivers.
  const waive: PacingWaiver[] = script.direction?.waive ?? [];
  const covered = (f: PacingFault): boolean => waive.some((w) => w.code === f.code && w.why.trim().length > 0
    && (!w.match || (f.text ?? '').includes(w.match) || f.detail.includes(w.match)));
  faults.sort((a, b) => a.t - b.t);
  return {
    id: script.id, kind, duration: tl.duration, shots: shots.length, lines: lines.length,
    faults: faults.filter((f) => !covered(f)), waived: faults.filter(covered),
  };
}

/** True when `id` is in the baseline list (exact ids, or a prefix ending in '*'). */
export function inBaseline(id: string, baseline: readonly string[]): boolean {
  return baseline.some((b) => (b.endsWith('*') ? id.startsWith(b.slice(0, -1)) : b === id));
}

/** A readable block for one scene. */
export function formatPacing(r: PacingResult): string {
  const [lo, hi, max] = PACING.length[r.kind];
  const head = `${r.id}  [${r.kind}, ${r.duration.toFixed(1)} s (aim ${lo}-${hi}, max ${max}), ${r.shots} shots, ${r.lines} lines]`;
  if (r.faults.length === 0) return `${head}  OK${r.waived.length ? ` (${r.waived.length} waived)` : ''}`;
  const rows = r.faults.map((f) => `    ${f.t >= 0 ? `t=${f.t.toFixed(1).padStart(5)}` : 'scene  '}  ${f.code.padEnd(18)} ${f.detail}${f.text ? `  "${f.text.length > 60 ? `${f.text.slice(0, 57)}...` : f.text}"` : ''}`);
  return [`${head}  ${r.faults.length} fault(s)${r.waived.length ? `, ${r.waived.length} waived` : ''}`, ...rows].join('\n');
}

/** Fault counts by code. */
export function countByCode(results: readonly PacingResult[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of results) for (const f of r.faults) out[f.code] = (out[f.code] ?? 0) + 1;
  return out;
}

export interface ShotTally {
  id: string;
  /** Camera steps by kind ('frame' counted by size below; 'push' counts frame shots with a push-in). */
  moves: Record<'cut' | 'dolly' | 'orbit' | 'follow' | 'track' | 'frame' | 'push', number>;
  sizes: Record<ShotSize, number>;
  heights: Record<'eye' | 'low' | 'high', number>;
  /** Longest run of consecutive cam steps with the same set-up (frame: who + size + height + side sign; others: kind). */
  longestRun: number;
  /** longestRun >= 3. */
  monotone: boolean;
  /** Sound cues: 'sfx' steps + say.sfx, 'stinger' steps + say.stinger, 'ambience' steps (+1 if the script has ambience), 'music' steps (+1 if script.music). */
  sound: { sfx: number; stingers: number; beds: number; music: number };
}

/** Visits every step in order, nested 'parallel' tracks included. */
function walkSteps(steps: readonly Step[], fn: (s: Step) => void): void {
  for (const s of steps) {
    fn(s);
    if (s.do === 'parallel') for (const track of s.tracks) walkSteps(track, fn);
  }
}

/** The shot and sound tally of one scene, read from its script (no compile): for the report's variety and sound lists. */
export function tallyShots(script: SceneScript): ShotTally {
  const t: ShotTally = {
    id: script.id,
    moves: { cut: 0, dolly: 0, orbit: 0, follow: 0, track: 0, frame: 0, push: 0 },
    sizes: { cu: 0, mcu: 0, ms: 0, fs: 0, ws: 0 },
    heights: { eye: 0, low: 0, high: 0 },
    longestRun: 0,
    monotone: false,
    sound: { sfx: 0, stingers: 0, beds: script.ambience ? 1 : 0, music: script.music ? 1 : 0 },
  };
  let run = 0;
  let prev = '';
  walkSteps(script.steps, (s) => {
    if (s.do === 'cam') {
      const shot = s.shot;
      t.moves[shot.kind]++;
      let key: string = shot.kind;
      if (shot.kind === 'frame') {
        const h = shot.height ?? 'eye';
        t.sizes[shot.size]++;
        t.heights[h]++;
        if (shot.push) t.moves.push++;
        key = `frame:${shot.who}:${shot.size}:${h}:${Math.sign(shot.side ?? 0)}`;
      }
      run = key === prev ? run + 1 : 1;
      prev = key;
      t.longestRun = Math.max(t.longestRun, run);
    } else if (s.do === 'sfx') t.sound.sfx++;
    else if (s.do === 'stinger') t.sound.stingers++;
    else if (s.do === 'ambience') t.sound.beds++;
    else if (s.do === 'music') t.sound.music++;
    else if (s.do === 'say') {
      if (s.sfx) t.sound.sfx++;
      if (s.stinger) t.sound.stingers++;
    }
  });
  t.monotone = t.longestRun >= 3;
  return t;
}

/** One line per scene, e.g. "  shots: frame 6 (cu 1 mcu 3 ms 2) dolly 1 | eye 5 low 1 | run 3 MONOTONE | sound: sfx 2 stingers 1 beds 1 music 1". */
export function formatTally(t: ShotTally): string {
  const sizes = (Object.keys(t.sizes) as ShotSize[]).filter((k) => t.sizes[k] > 0).map((k) => `${k} ${t.sizes[k]}`).join(' ');
  const order: Array<'frame' | 'dolly' | 'orbit' | 'follow' | 'track' | 'cut'> = ['frame', 'dolly', 'orbit', 'follow', 'track', 'cut'];
  const shotParts = order.filter((k) => t.moves[k] > 0)
    .map((k) => (k === 'frame' && sizes ? `frame ${t.moves.frame} (${sizes})` : `${k} ${t.moves[k]}`));
  if (t.moves.push > 0) shotParts.push(`push ${t.moves.push}`);
  const heights = (Object.keys(t.heights) as Array<keyof ShotTally['heights']>).filter((k) => t.heights[k] > 0)
    .map((k) => `${k} ${t.heights[k]}`).join(' ');
  const run = `run ${t.longestRun}${t.monotone ? ' MONOTONE' : ''}`;
  const sound = `sound: sfx ${t.sound.sfx} stingers ${t.sound.stingers} beds ${t.sound.beds} music ${t.sound.music}`;
  return `  shots: ${shotParts.join(' ') || 'none'} | ${heights || 'no heights'} | ${run} | ${sound}`;
}
