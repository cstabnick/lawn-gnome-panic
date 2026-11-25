// Loamdeep's runtime (E17 issue J4): job spots in the halls, running a mole-job shift (HUD strip, lamps, roots, the
// sorting and digging games), paying and saving, the Under-Chorus speaker. Rules live in jobs.ts; this file wires them
// to the room, the HUD and the save.
import * as THREE from 'three';
import type { Blip } from '../../types';
import type { InteriorKit } from '../../interiors/types';
import { currentInterior, onInteriorChange } from '../../interiors/runtime';
import { interiorToWorld } from '../../interiors/registry';
import { playAt } from '../../sound/bus';
import { showShiftCard } from '../../workplaces/shiftCard';
import {
  HALL_NAMES, LAMP_TUNNELS, LOAMDEEP, MOLE_JOB_NAMES, MOLEMAN_BURROW, SOCIETY_CAST, SOCIETY_EVENTS, SOCIETY_INTERIORS,
  type HallId, type LampTunnelId, type MoleJobId, type SocietyDeps, type SocietyPart, type SocietySave,
} from '../config';
import { loadSocietySave, updateSocietySave } from '../save';
import {
  MOLE_JOBS, dropRoots, jobLine, lightLamp, recordNook, recordSorting, shiftPay, shiftStars, startShift, takeRoots,
  tickShift, type MoleShift,
} from './jobs';
import { openSortingGame, sortingOpen } from './sortingUi';
import { openDigGame, digOpen } from './digUi';

type RootHall = Exclude<HallId, 'rootway'>;

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;
/** Lamp spots sit this far into the tunnel from the lamp point. */
const LAMP_SPOT_OFFSET = 0.9;
/** The lamp light sits this high (metres). */
const LAMP_Y = 2.1;
const TUNNEL_NAMES: Readonly<Record<LampTunnelId, string>> = {
  westRise: 'the West Rise', eastRise: 'the East Rise', mothersNorth: "the Mother's North tunnel",
};

interface LampRef { tunnel: LampTunnelId; i: number; lit: THREE.Object3D; dark: THREE.Object3D; x: number; z: number }

let deps: SocietyDeps | null = null;
let shift: MoleShift | null = null;
let lampRefs: LampRef[] = [];
/** Tunnels of the last two Lamplighter shifts, so the next one picks another tunnel when it can. */
let recentTunnels: LampTunnelId[] = [];
/** Dig a Nook: faces dug in the current dig shift (cleared when a dig shift starts). */
const dugFaces = new Set<number>();
let saveCache: { at: number; save: SocietySave } | null = null;
let strip: HTMLElement | null = null;
let stripText = '';
let unsubInterior: (() => void) | null = null;

function toast(t: string): void {
  deps?.hud.toast(t);
}

function say(name: string, line: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
}

function cachedSave(): SocietySave {
  const now = Date.now();
  if (!saveCache || now - saveCache.at >= 1000) saveCache = { at: now, save: loadSocietySave() };
  return saveCache.save;
}

function writeSave(change: (s: SocietySave) => void): void {
  updateSocietySave(change);
  saveCache = null;
}

/** World point of a Loamdeep local point. */
function worldOf(lx: number, lz: number): [number, number] {
  return interiorToWorld(SOCIETY_INTERIORS.loamdeep, lx, lz);
}

function lampSpotPoint(t: LampTunnelId, x: number, z: number): [number, number] {
  const tun = LOAMDEEP.tunnels[t];
  const cx = (tun.minX + tun.maxX) / 2;
  return [x + Math.sign(cx - x) * LAMP_SPOT_OFFSET, z];
}

/** Lamps show lit, except the unlit ones of the lamps shift's tunnel. */
function paintLamps(): void {
  const active = shift && shift.job === 'lamps' ? shift : null;
  for (const r of lampRefs) {
    const unlitNow = active !== null && active.tunnel === r.tunnel && !active.lit[r.i];
    r.lit.visible = !unlitNow;
    r.dark.visible = unlitNow;
  }
}

/** Replace the shift (or clear it), keep the lamps in step, and finish it when it is over. */
function setShift(next: MoleShift | null): void {
  shift = next;
  paintLamps();
  if (shift?.over) finishShift();
}

/** A different job's shift is running: say so and return true. */
function otherJobBlocks(job: MoleJobId): boolean {
  if (shift && shift.job !== job) {
    toast(`Finish the ${MOLE_JOB_NAMES[shift.job]} first. The moles are counting on you.`);
    return true;
  }
  return false;
}

const QUOTES: Readonly<Record<MoleJobId, { name: string; line: string }>> = {
  roots: { name: SOCIETY_CAST.tamp, line: 'You carry roots like someone who has been told about roots.' },
  lamps: { name: SOCIETY_CAST.delve, line: 'Lit, and nobody tripped. That is the whole art.' },
  post: { name: SOCIETY_CAST.sift, line: 'Every letter in its hole. The post is grateful, which it cannot say.' },
  dig: { name: SOCIETY_CAST.crumb, line: 'Tidy as a pantry. Nobody will mention the ceiling.' },
};

/** End the shift: pay for what was done, save it, show the card, tell the world. */
function finishShift(): void {
  const s = shift;
  if (!s) return;
  shift = null;
  paintLamps();
  if (s.done === 0) {
    toast('No harm done. The moles will keep your place.');
    return;
  }
  const stars = shiftStars(s);
  const pay = shiftPay(s);
  const def = MOLE_JOBS[s.job];
  deps?.economy.earn(pay, 'Loamdeep');
  writeSave((sv) => {
    sv.moleJobs[s.job]++;
    sv.moleBest[s.job] = Math.max(sv.moleBest[s.job], stars);
  });
  if (deps) {
    const q = QUOTES[s.job];
    const lines = [`${s.done} of ${def.units} done`];
    if (s.misses > 0) lines.push(`${s.misses} ${s.job === 'dig' ? 'collapsed' : 'missed'}, tidied away.`);
    showShiftCard(deps.ui, {
      icon: '⛏️',
      title: `${def.name}: Loamdeep`,
      quote: `${q.name}: "${q.line}"`,
      stars,
      lines,
      total: pay,
      level: 'Burrowfolk helper',
      xpFrac: 1,
    });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SOCIETY_EVENTS.moleJobDone, { detail: { job: s.job, stars, pay } }));
  }
}

function startRootShift(): MoleShift {
  return startShift('roots', Math.random);
}

function buildRootSpots(kit: InteriorKit): void {
  kit.spot({
    id: 'loamdeep-roots-pickup',
    x: LOAMDEEP.spots.rootPickup[0],
    z: LOAMDEEP.spots.rootPickup[1],
    prompt: 'Roots (Root Run)',
    run() {
      if (otherJobBlocks('roots')) return;
      if (shift && shift.rootTo !== null) {
        toast(`You have roots for ${HALL_NAMES[shift.rootTo]}.`);
        return;
      }
      const base = shift ?? startRootShift();
      const next = takeRoots(base, Math.random);
      setShift(next);
      if (next.rootTo) {
        toast(`Old Tamp: 'To ${HALL_NAMES[next.rootTo]}, if it pleases you. Gently.'`);
      }
    },
  });
  for (const hall of Object.keys(LOAMDEEP.spots.rootDrops) as RootHall[]) {
    const [x, z] = LOAMDEEP.spots.rootDrops[hall];
    kit.spot({
      id: `loamdeep-roots-drop-${hall}`,
      x,
      z,
      prompt: 'Drop the roots',
      run() {
        if (otherJobBlocks('roots')) return;
        if (!shift || shift.rootTo === null) {
          toast('Nothing to drop. Rootway Hall has roots.');
          return;
        }
        if (shift.rootTo !== hall) {
          toast(`These are for ${HALL_NAMES[shift.rootTo]}.`);
          return;
        }
        const [wx, wz] = worldOf(x, z);
        playAt('mole-squeak', { x: wx, z: wz });
        toast('Most kind.');
        setShift(dropRoots(shift, hall));
      },
    });
  }
}

function buildLampSpots(kit: InteriorKit): void {
  const [tx, tz] = LOAMDEEP.spots.taper;
  kit.spot({
    id: 'loamdeep-taper',
    x: tx,
    z: tz,
    prompt: 'Take a taper (Lamplighter)',
    run() {
      if (otherJobBlocks('lamps')) return;
      if (shift) {
        toast('You already have a taper. Light the lamps.');
        return;
      }
      const pool = LAMP_TUNNELS.filter((t) => !recentTunnels.includes(t));
      const choices = pool.length > 0 ? pool : LAMP_TUNNELS;
      const tunnel = choices[Math.min(choices.length - 1, Math.floor(Math.random() * choices.length))];
      recentTunnels = [...recentTunnels, tunnel].slice(-2);
      setShift({ ...startShift('lamps', Math.random), tunnel });
      say(SOCIETY_CAST.delve, `Mind the wobble on ${TUNNEL_NAMES[tunnel]}.`);
    },
  });
  for (const t of LAMP_TUNNELS) {
    LOAMDEEP.lamps[t].forEach(([x, z], i) => {
      const [sx, sz] = lampSpotPoint(t, x, z);
      kit.spot({
        id: `loamdeep-lamp-${t}-${i}`,
        x: sx,
        z: sz,
        prompt: 'Light the lamp',
        run() {
          if (otherJobBlocks('lamps')) return;
          if (!shift || shift.job !== 'lamps') {
            toast('Mistress Delve keeps the tapers in Lamplight Hall.');
            return;
          }
          if (shift.tunnel !== t || shift.lit[i]) {
            toast('Already burning, and very nicely.');
            return;
          }
          const [wx, wz] = worldOf(sx, sz);
          playAt('lamp-whoomp', { x: wx, z: wz });
          setShift(lightLamp(shift, i));
        },
      });
    });
  }
}

function buildPostSpot(kit: InteriorKit): void {
  const [x, z] = LOAMDEEP.spots.sortingDesk;
  kit.spot({
    id: 'loamdeep-sorting',
    x,
    z,
    prompt: 'Sort the post (Post Sorting)',
    run() {
      if (otherJobBlocks('post')) return;
      if (!deps || sortingOpen() || digOpen()) return;
      openSortingGame(deps.ui, {
        letters: MOLE_JOBS.post.units,
        seconds: MOLE_JOBS.post.seconds,
        rand: Math.random,
        onDone(r) {
          if (r.quit && r.sorted === 0) return;
          setShift(recordSorting(startShift('post', Math.random), r.sorted, r.misses));
        },
      });
    },
  });
}

function buildDigSpots(kit: InteriorKit): void {
  LOAMDEEP.spots.digFaces.forEach(([x, z], i) => {
    kit.spot({
      id: `loamdeep-dig-${i}`,
      x,
      z,
      prompt: 'Dig a nook (Dig a Nook)',
      run() {
        if (otherJobBlocks('dig')) return;
        if (!deps || sortingOpen() || digOpen()) return;
        if (dugFaces.has(i)) {
          toast('That nook is done. A lovely one.');
          return;
        }
        if (!shift) {
          dugFaces.clear();
          setShift(startShift('dig', Math.random));
        }
        openDigGame(deps.ui, {
          nook: i,
          rand: Math.random,
          onDone(r) {
            if (r.quit) return;
            dugFaces.add(i);
            if (!shift || shift.job !== 'dig') return;
            const [wx, wz] = worldOf(x, z);
            playAt('soil-crumble', { x: wx, z: wz });
            setShift(recordNook(shift, r.good));
          },
        });
      },
    });
  });
}

/**
 * Adds the job spots and the live lamps to the room being built (called from loamdeep/interior.ts on every entry). The
 * room is rebuilt on every entry, so the lamp objects are rebuilt here and shown from the current shift.
 */
export function buildJobSpots(kit: InteriorKit): void {
  lampRefs = [];
  buildRootSpots(kit);
  buildLampSpots(kit);
  buildPostSpot(kit);
  buildDigSpots(kit);
  for (const t of LAMP_TUNNELS) {
    const yaw = t === 'westRise' ? E : W;
    LOAMDEEP.lamps[t].forEach(([x, z], i) => {
      const lit = kit.put('mole-lamp-lit', x, z, yaw, { y: LAMP_Y, solid: false });
      const dark = kit.put('mole-lamp', x, z, yaw, { y: LAMP_Y, solid: false });
      lit.name = 'loamdeep-lamp-lit';
      dark.name = 'loamdeep-lamp-dark';
      const [sx, sz] = lampSpotPoint(t, x, z);
      lampRefs.push({ tunnel: t, i, lit, dark, x: sx, z: sz });
    });
  }
  paintLamps();
}

function ensureStrip(ui: HTMLElement): HTMLElement | null {
  if (strip || typeof document === 'undefined') return strip;
  const el = document.createElement('div');
  el.setAttribute('data-gta', 'loamdeep-shift');
  el.style.cssText = [
    'position:fixed', 'left:50%', 'transform:translateX(-50%)',
    'top:calc(env(safe-area-inset-top) + 64px)', 'z-index:30', 'pointer-events:none',
    'padding:6px 12px', 'border-radius:12px', 'background:rgba(20,16,12,.82)', 'color:#fff',
    'font:700 14px system-ui,sans-serif', 'white-space:nowrap', 'display:none',
  ].join(';');
  ui.appendChild(el);
  strip = el;
  return el;
}

function paintStrip(): void {
  if (!deps) return;
  const el = ensureStrip(deps.ui);
  if (!el) return;
  const text = shift ? jobLine(shift) : '';
  if (text !== stripText) {
    stripText = text;
    el.textContent = text;
  }
  el.style.display = shift ? 'block' : 'none';
}

export function installLoamdeep(deps0: SocietyDeps): SocietyPart {
  deps = deps0;
  unsubInterior?.();
  unsubInterior = onInteriorChange((id) => {
    if (shift && id !== 'loamdeep') finishShift();
  });
  return {
    update(dt) {
      if (shift && !(sortingOpen() || digOpen())) {
        setShift(tickShift(shift, dt));
      }
      if (shift && currentInterior() !== 'loamdeep') finishShift();
      paintStrip();
    },
    isOpen() {
      return sortingOpen() || digOpen();
    },
    blips() {
      const out: Blip[] = [];
      if (!shift) return out;
      if (shift.job === 'roots' && shift.rootTo) {
        const [x, z] = worldOf(...LOAMDEEP.spots.rootDrops[shift.rootTo]);
        out.push({ x, z, color: '#ffcc66', label: HALL_NAMES[shift.rootTo] });
      } else if (shift.job === 'lamps' && shift.tunnel) {
        const tunnel = shift.tunnel;
        const ref = lampRefs.find((r) => r.tunnel === tunnel && !shift?.lit[r.i]);
        if (ref) {
          const [x, z] = worldOf(ref.x, ref.z);
          out.push({ x, z, color: '#ffcc66', label: 'Lamp' });
        }
      }
      return out;
    },
    speaker(x, z) {
      const here = currentInterior();
      if (here === SOCIETY_INTERIORS.loamdeep) {
        if (!cachedSave().molemanVisits) return null;
        let best: [number, number] | null = null;
        let bestD = Infinity;
        for (const [lx, lz] of LOAMDEEP.spots.speakers) {
          const [wx, wz] = worldOf(lx, lz);
          const d = Math.hypot(wx - x, wz - z);
          if (d < bestD) { bestD = d; best = [wx, wz]; }
        }
        return best ? { x: best[0], y: 1.2, z: best[1], station: 'under' } : null;
      }
      if (here === SOCIETY_INTERIORS.moleman) {
        const [wx, wz] = interiorToWorld(SOCIETY_INTERIORS.moleman, MOLEMAN_BURROW.decks[0], MOLEMAN_BURROW.decks[1]);
        return { x: wx, y: 1.2, z: wz, station: 'under' };
      }
      return null;
    },
  };
}
