// Tubing runtime (docs/roadmaps/gta-sim-jobs-and-tubing.md): the tow line on a boat, riders (real players and NPCs),
// ropes, the Mossbank tube rack, the buoy run, the 🛟 Tubing phone app and the SYS.tow hub adapter.
import { sharedJobsStore } from '../jobs/career';
import { JOB_ACHIEVEMENTS } from '../jobs/defs';
import type { JobsDeps } from '../jobs/types';
import { JOB_WIRE, TOW_CMD, TOW_EMPTY, TOW_NPC, decodeTow, encodeTow, type TowSlotWire, type TowWire } from '../jobs/protocol';
import { SYS } from '../online/protocol';
import type { MirrorChanges, OwnedEnt, SyncAdapter, SyncLink } from '../online/hub';
import { heightAt, waterAt } from '../terrain';
import { waveSlope, waveTime } from '../waves';
import { createVehicle, removeVehicle, syncVehicleMesh } from '../vehicles';
import type { Blip, InputState, Vehicle } from '../types';
import { BUOY_GATES, FINISH_POINTS, GATE_POINTS, newRun, stepRun, type RunState } from './course';
import { MAX_ROPES, createTubingView, type RopeSeg, type TubeView } from './view';
import { hookPoint, newScore, newTube, scoreStep, stepTube } from './tow';
import { TOW, type BoatPose, type Sea, type Tubing, type TubeScore, type TubeState } from './types';

/** The Mossbank tube rack (rent a tube here). */
const RACK = { x: -702, z: -548 };
const RACK_COST = 5;
const RACK_MAX = 2;
const RACK_RANGE = 15;
const HOOK_ASK_S = 4;
const AUTO_HOOK_S = 2;
const STEP_S = 0.05;
const NPC_HOP_S = 5;
const TUBE_COLOR = '#ff7a1a';

/** The first free slot index in `slots` (player ids, TOW_NPC or TOW_EMPTY), or -1. */
export function freeSlot(slots: number[]): number {
  return slots.indexOf(TOW_EMPTY);
}

/** Boat's forward speed (m/s) from its last position to this one. */
export function boatSpeedFrom(prevX: number, prevZ: number, x: number, z: number, yaw: number, dt: number): number {
  if (dt <= 0) return 0;
  return ((x - prevX) * Math.sin(yaw) + (z - prevZ) * Math.cos(yaw)) / dt;
}

interface Npc {
  state: TubeState;
  score: TubeScore;
  downT: number;
  seed: number;
  t: number;
}

interface Slot {
  who: number;
  npc: Npc | null;
  points: number;
}

interface Ride {
  host: number | null;
  slot: number;
  state: TubeState | null;
  score: TubeScore;
  /** Seconds since asking to hook on (slot -1). */
  askT: number;
  /** Seconds since the last points report. */
  secT: number;
  /** Seconds since the last tubeRider achievement step. */
  tenT: number;
  /** Eased boat speed, m/s. */
  speed: number;
  lastX: number | null;
  lastZ: number;
}

const emptySlot = (): Slot => ({ who: TOW_EMPTY, npc: null, points: 0 });

const newRide = (): Ride => ({
  host: null, slot: -1, state: null, score: newScore(), askT: 0, secT: 0, tenT: 0, speed: 0, lastX: null, lastZ: 0,
});

const sea: Sea = {
  surface: (x, z) => waterAt(x, z)?.surface ?? heightAt(x, z),
  slope: (x, z, out) => waveSlope(x, z, waveTime(), out),
};

function poseOf(b: Vehicle, speed: number): BoatPose {
  return { x: b.x, z: b.z, yaw: b.yaw, speed, radius: b.spec.radius };
}

function slotWire(s: Slot): TowSlotWire {
  if (s.npc) return { who: TOW_NPC, x: s.npc.state.x, z: s.npc.state.z, yaw: s.npc.state.yaw };
  return { who: s.who, x: 0, z: 0, yaw: 0 };
}

export function installTubing(deps: JobsDeps): Tubing {
  const view = createTubingView(deps.scene);
  view.buildBuoys();
  const store = sharedJobsStore();
  let link: SyncLink = deps.hub.link;

  // Driver state.
  let towOn = false;
  const slots: Slot[] = [emptySlot(), emptySlot(), emptySlot()];
  let run: RunState = newRun();
  /** Points banked from gates and finished runs. */
  let banked = 0;
  let prevBoat: { x: number; z: number; v: Vehicle } | null = null;

  // Rider state.
  let myTube: Vehicle | null = null;
  let ride: Ride = newRide();
  const rented: Vehicle[] = [];
  let autoT = 0;

  // Mirrors of other boats' tow records, by owner.
  const mirrors = new Map<number, TowWire>();
  /** NPC tube keys currently shown in the view ('me:i' or 'owner:i'). */
  const shownNpc = new Set<string>();
  const ropePool: RopeSeg[] = [];
  const ropeList: RopeSeg[] = [];
  let lastRopes = 0;

  // HUD line.
  const hudEl = document.createElement('div');
  hudEl.id = 'gta-tube-hud';
  hudEl.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 96px);left:50%;transform:translateX(-50%);'
    + 'z-index:25;pointer-events:none;display:none;padding:4px 12px;border-radius:999px;background:rgba(10,14,18,.6);'
    + 'color:#fff;font:13px/1.3 system-ui,sans-serif;white-space:nowrap;text-align:center;';
  const hudText = document.createElement('div');
  const hudRisk = document.createElement('div');
  hudRisk.style.cssText = 'height:4px;margin-top:3px;border-radius:2px;background:rgba(255,255,255,.25);display:none;';
  const hudFill = document.createElement('div');
  hudFill.style.cssText = 'height:100%;width:0%;border-radius:2px;background:#ff7a1a;';
  hudRisk.appendChild(hudFill);
  hudEl.append(hudText, hudRisk);
  deps.ui.appendChild(hudEl);
  let hudShown = false;

  const boatNow = (): Vehicle | null => {
    const v = deps.player.vehicle;
    return v && v.spec.boat && v.kind !== 'tow-tube' && v.driver === 'player' ? v : null;
  };
  const occupied = (): number => slots.filter((s) => s.who !== TOW_EMPTY).length;
  const teamScore = (): number => slots.reduce((a, s) => a + s.points, 0) + banked;

  /** Captain achievement and the towed-max record, after a slot changes. */
  function noteSlots(): void {
    const n = occupied();
    if (n === 3) deps.unlock(JOB_ACHIEVEMENTS.towCaptain);
    const st = store.get();
    if (n > st.towedMax) {
      st.towedMax = n;
      store.commit();
    }
  }

  function showNpc(key: string, v: TubeView | null): void {
    if (v) {
      shownNpc.add(key);
      view.npcTube(key, v);
    } else if (shownNpc.delete(key)) {
      view.npcTube(key, null);
    }
  }

  function removeTube(v: Vehicle): void {
    removeVehicle(deps.scene, v);
    const i = deps.vehicles.indexOf(v);
    if (i >= 0) deps.vehicles.splice(i, 1);
    const r = rented.indexOf(v);
    if (r >= 0) rented.splice(r, 1);
    if (myTube === v) myTube = null;
  }

  function towOff(): void {
    for (let i = 0; i < slots.length; i++) {
      showNpc('me:' + i, null);
      slots[i] = emptySlot();
    }
    towOn = false;
    run = newRun();
    banked = 0;
    prevBoat = null;
    view.highlightGate(null);
  }

  /** Let go of the rope to the host (if it is still there) and forget the ride. */
  function unhook(reason?: string): void {
    const host = ride.host;
    if (host !== null && mirrors.has(host)) link.command(host, 1, TOW_CMD.unhook);
    if (ride.slot >= 0) {
      const st = store.get();
      st.tubeBest = Math.max(st.tubeBest, ride.score.points);
      store.commit();
    }
    ride = newRide();
    if (reason) deps.hud.toast(reason);
  }

  function dropMirror(owner: number): void {
    mirrors.delete(owner);
    for (const k of [...shownNpc]) if (k.startsWith(owner + ':')) showNpc(k, null);
  }

  /** Nearest boat with its tow line out and a free slot within hookRange of (x, z). */
  function findBoat(x: number, z: number): { owner: number; boat: Vehicle; w: TowWire } | null {
    let best: { owner: number; boat: Vehicle; w: TowWire } | null = null;
    let bestD = Infinity;
    for (const [owner, w] of mirrors) {
      if (!w.on || freeSlot(w.slots.map((s) => s.who)) < 0) continue;
      const boat = deps.net.vehicleOf(owner);
      if (!boat) continue;
      const d = Math.hypot(boat.x - x, boat.z - z);
      if (d <= TOW.hookRange && d < bestD) {
        best = { owner, boat, w };
        bestD = d;
      }
    }
    return best;
  }

  /** The tube a driver's slot shows: an NPC's state, a player's vehicle. */
  function slotTube(s: Slot): { x: number; y: number; z: number } | null {
    if (s.npc) return s.npc.state;
    if (s.who < 0) return null;
    return deps.net.vehicleOf(s.who);
  }

  function setTow(on: boolean): string | null {
    if (!on) {
      towOff();
      return null;
    }
    if (towOn) return null;
    if (!boatNow()) return 'Drive a boat first.';
    towOn = true;
    run = newRun();
    banked = 0;
    deps.hud.toast('Tow line out. Riders hop on from the 🛟 app or swim up on a tube.');
    return null;
  }

  function addNpcRider(): string | null {
    if (!towOn) return 'Put the tow line out first.';
    const idx = freeSlot(slots.map((s) => s.who));
    if (idx < 0) return 'The tow line is full.';
    const boat = boatNow();
    if (!boat) return 'Drive a boat first.';
    slots[idx] = {
      who: TOW_NPC,
      npc: {
        state: newTube(poseOf(boat, boat.speed), idx, sea), score: newScore(), downT: 0, seed: 500 + idx, t: 0,
      },
      points: 0,
    };
    noteSlots();
    return null;
  }

  /** Driver: the NPC riders and the buoy run, every frame while the tow line is out. */
  function tickDriver(dt: number): void {
    const boat = boatNow();
    if (!boat) {
      towOff();
      deps.hud.toast('You left the boat. Tow line in.');
      return;
    }
    const pose = poseOf(boat, boat.speed);
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const key = 'me:' + i;
      const n = s.npc;
      if (!n) {
        showNpc(key, null);
        continue;
      }
      n.t += dt;
      if (n.downT > 0) {
        n.downT -= dt;
        if (n.downT <= 0) {
          n.state.fallen = false;
          n.state.risk = 0;
        }
      }
      let hop = Math.floor((n.t - dt) / NPC_HOP_S) !== Math.floor(n.t / NPC_HOP_S);
      const lean = 0.8 * Math.sin(n.t * 0.7 + i * 2);
      let left = dt;
      while (left > 1e-6) {
        const h = Math.min(STEP_S, left);
        left -= h;
        const ev = stepTube(n.state, pose, { lean, hop }, sea, h);
        hop = false;
        scoreStep(n.score, n.state, ev, h);
        if (ev?.t === 'fell') n.downT = TOW.npcReboard;
      }
      s.points = n.score.points;
      showNpc(key, {
        x: n.state.x, y: n.state.y, z: n.state.z, yaw: n.state.yaw, lean: n.state.lean,
        riderUp: !n.state.fallen, seed: n.seed,
      });
    }

    if (prevBoat && prevBoat.v === boat) {
      const ev = stepRun(run, prevBoat.x, prevBoat.z, boat.x, boat.z, dt);
      if (ev === 'gate') {
        banked += GATE_POINTS;
        deps.play('stunt');
        deps.hud.toast(`Buoy ${run.next}/${BUOY_GATES.length}`);
      } else if (ev === 'finish') {
        const time = run.time ?? run.t;
        deps.hud.toast(`Buoy run: ${time.toFixed(1)} s`);
        deps.unlock(JOB_ACHIEVEMENTS.buoyRun);
        const st = store.get();
        if (st.buoyBest === null || time < st.buoyBest) st.buoyBest = time;
        store.commit();
        banked += FINISH_POINTS;
        run = newRun();
      } else if (ev === 'reset') {
        deps.hud.toast('Buoy run timed out.');
      }
    }
    prevBoat = { x: boat.x, z: boat.z, v: boat };
    view.highlightGate(run.next);
  }

  /** Rider: attach to my slot, or give up asking, while hooked on; the points and the tubeRider achievement. */
  function tickRider(dt: number): void {
    const host = ride.host;
    if (host === null) return;
    const me = deps.net.myId();
    const entry = mirrors.get(host);
    const found = entry && me !== null ? entry.slots.findIndex((s) => s.who === me) : -1;

    if (ride.slot < 0) {
      ride.askT += dt;
      if (found >= 0) {
        const boat = deps.net.vehicleOf(host);
        if (boat && myTube) {
          const st = newTube(poseOf(boat, 0), found, sea);
          st.x = myTube.x;
          st.y = myTube.y;
          st.z = myTube.z;
          ride.slot = found;
          ride.state = st;
          ride.score = newScore();
          ride.secT = 0;
          ride.tenT = 0;
          ride.speed = 0;
          ride.lastX = null;
          ride.askT = 0;
          deps.hud.toast('Hooked on! Lean with {move}, hop with {jump}.');
        }
      } else if (ride.askT > HOOK_ASK_S) {
        deps.hud.toast('That tow line is full.');
        ride.host = null;
        ride.askT = 0;
      }
      return;
    }

    if (found < 0) {
      unhook('Let go of the tow line.');
      return;
    }
    if (myTube && myTube.driver !== 'player') {
      unhook('You stepped off the tube.');
      return;
    }
    if (!ride.state) return;

    ride.secT += dt;
    if (ride.secT >= 1) {
      ride.secT -= 1;
      link.command(host, 1, TOW_CMD.points, [Math.round(ride.score.points)]);
      store.get().tubeSeconds += 1;
      ride.tenT += 1;
      if (ride.tenT >= 10) {
        ride.tenT = 0;
        deps.increment(JOB_ACHIEVEMENTS.tubeRider, 10);
        store.commit();
      }
    }
  }

  /** Sitting on a tow tube behind a boat with a free slot: ask to hook on (every 2 s). */
  function autoHook(dt: number): void {
    const pv = deps.player.vehicle;
    if (!pv || pv.kind !== 'tow-tube' || pv.driver !== 'player') return;
    myTube = pv;
    if (ride.host !== null) return;
    autoT -= dt;
    if (autoT > 0) return;
    autoT = AUTO_HOOK_S;
    const hit = findBoat(pv.x, pv.z);
    if (!hit) return;
    ride.host = hit.owner;
    ride.slot = -1;
    ride.askT = 0;
    link.command(hit.owner, 1, TOW_CMD.hook);
  }

  /** The rider's tube: stepped from the host's boat pose, drawn, and the fall or the snapped rope handled. */
  function stepRider(v: Vehicle, inp: InputState, dt: number): void {
    const host = ride.host;
    const boat = host === null ? null : deps.net.vehicleOf(host);
    const st = ride.state;
    if (!boat || !st) {
      unhook('Your boat left.');
      return;
    }
    const raw = ride.lastX === null ? 0 : boatSpeedFrom(ride.lastX, ride.lastZ, boat.x, boat.z, boat.yaw, dt);
    ride.lastX = boat.x;
    ride.lastZ = boat.z;
    ride.speed += (raw - ride.speed) * Math.min(1, dt * 4);
    const pose = poseOf(boat, ride.speed);

    let hop = !!inp.jump || inp.lift > 0;
    let fell: { vx: number; vy: number; vz: number } | null = null;
    let left = dt;
    while (left > 1e-6 && !fell) {
      const h = Math.min(STEP_S, left);
      left -= h;
      const ev = stepTube(st, pose, { lean: inp.moveX, hop }, sea, h);
      hop = false;
      scoreStep(ride.score, st, ev, h);
      if (ev?.t === 'fell') fell = ev;
    }

    v.x = st.x;
    v.y = st.y;
    v.z = st.z;
    v.yaw = st.yaw;
    v.speed = Math.hypot(st.vx, st.vz);
    syncVehicleMesh(v, dt);
    v.object.rotation.z = -st.lean * 0.35;

    const hp = hookPoint(pose, ride.slot);
    if (Math.hypot(st.x - hp.x, st.z - hp.z) > TOW.snapDist) {
      unhook('The rope snapped!');
      return;
    }
    if (fell) {
      deps.throwPlayer(v, fell.vx, fell.vy, fell.vz);
      unhook('Wipe-out! Swim back to the tube and hop on.');
    }
  }

  /** On foot or in the water near a boat with its tow line out: a tube behind it, sit on it, ask to hook on. */
  function hopOn(): string | null {
    if (!deps.net.online()) return 'Online only: ask a friend with a boat, or drive one and add NPC riders.';
    if (deps.player.vehicle) return 'Get out first.';
    if (ride.host !== null) return 'Already on a tow line.';
    const hit = findBoat(deps.player.x, deps.player.z);
    if (!hit) return 'No boat with a free tow line nearby.';
    const slot = freeSlot(hit.w.slots.map((s) => s.who));
    const st = newTube(poseOf(hit.boat, 0), slot, sea);
    if (myTube && myTube.driver === 'none') removeTube(myTube);
    const tube = createVehicle(deps.scene, 'tow-tube', st.x, st.z, hit.boat.yaw);
    tube.y = st.y;
    deps.vehicles.push(tube);
    deps.seatPlayer(tube);
    myTube = tube;
    ride = { ...newRide(), host: hit.owner, slot: -1 };
    link.command(hit.owner, 1, TOW_CMD.hook);
    return null;
  }

  /** Rent a tube on open water near the player (5 Acorns). */
  function spawnTube(): string | null {
    if (!deps.economy.spend(RACK_COST, 'Tube rent')) return 'Not enough Acorns.';
    const p = deps.player;
    let at: { x: number; z: number } | null = null;
    for (const r of [6, 12]) {
      for (let k = 0; k < 8 && !at; k++) {
        const a = (k * Math.PI) / 4;
        const x = p.x + Math.cos(a) * r;
        const z = p.z + Math.sin(a) * r;
        if ((waterAt(x, z)?.depth ?? 0) > 0.6) at = { x, z };
      }
    }
    if (!at) {
      deps.economy.earn(RACK_COST, 'Tube refund');
      return 'No open water here.';
    }
    const tube = createVehicle(deps.scene, 'tow-tube', at.x, at.z, 0);
    tube.y = sea.surface(at.x, at.z) + TOW.floatY;
    deps.vehicles.push(tube);
    rented.push(tube);
    if (rented.length > RACK_MAX) {
      const old = rented.find((v) => v !== tube && v.driver === 'none');
      if (old) removeTube(old);
    }
    deps.hud.toast('Tube in the water: swim over and hop on (E).');
    return null;
  }

  /** Ropes from my boat and from the boats I see, and the NPC riders I see. */
  function drawRopes(): void {
    if (!towOn && mirrors.size === 0 && lastRopes === 0) return;
    ropeList.length = 0;
    const pushRope = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, rope: number): void => {
      if (ropeList.length >= MAX_ROPES) return;
      const k = ropeList.length;
      let seg = ropePool[k];
      if (!seg) {
        seg = { ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, rope: 0 };
        ropePool[k] = seg;
      }
      seg.ax = ax; seg.ay = ay; seg.az = az;
      seg.bx = bx; seg.by = by; seg.bz = bz;
      seg.rope = rope;
      ropeList.push(seg);
    };
    const me = deps.net.myId();

    if (towOn) {
      const boat = boatNow();
      if (boat) {
        const pose = poseOf(boat, boat.speed);
        for (let i = 0; i < slots.length; i++) {
          const t = slotTube(slots[i]);
          if (!t) continue;
          const h = hookPoint(pose, i);
          pushRope(h.x, boat.y + 0.4, h.z, t.x, t.y, t.z, TOW.slots[i].rope);
        }
      }
    }

    for (const [owner, w] of mirrors) {
      const boat = deps.net.vehicleOf(owner);
      if (!w.on || !boat) {
        for (let i = 0; i < TOW.slots.length; i++) showNpc(owner + ':' + i, null);
        continue;
      }
      const pose = poseOf(boat, boat.speed);
      for (let i = 0; i < w.slots.length; i++) {
        const s = w.slots[i];
        const key = owner + ':' + i;
        if (s.who === TOW_NPC) {
          const y = sea.surface(s.x, s.z) + TOW.floatY;
          showNpc(key, { x: s.x, y, z: s.z, yaw: s.yaw, lean: 0, riderUp: true, seed: 500 + i });
        } else {
          showNpc(key, null);
        }
        if (s.who === TOW_EMPTY) continue;
        let t: { x: number; y: number; z: number } | null = null;
        if (s.who === TOW_NPC) t = { x: s.x, y: sea.surface(s.x, s.z) + TOW.floatY, z: s.z };
        else if (s.who === me) t = myTube;
        else t = deps.net.vehicleOf(s.who);
        if (!t) continue;
        const h = hookPoint(pose, i);
        pushRope(h.x, boat.y + 0.4, h.z, t.x, t.y, t.z, TOW.slots[i].rope);
      }
    }

    lastRopes = ropeList.length;
    view.ropes(ropeList);
  }

  function refreshHud(): void {
    let text = '';
    let risk = -1;
    if (ride.slot >= 0 && ride.state) {
      const team = ride.host !== null ? mirrors.get(ride.host)?.score ?? 0 : 0;
      text = `🛟 ${ride.score.points} pts · air ${ride.score.air.toFixed(1)} s · team ${team}`;
      risk = ride.state.risk;
    } else if (towOn) {
      const n = occupied();
      const time = run.next > 0 ? `${run.t.toFixed(1)} s` : '-';
      text = `Tow: ${n} riders · team ${teamScore()} · gates ${run.next}/${BUOY_GATES.length} · ${time}`;
    }
    const show = text !== '';
    if (show !== hudShown) {
      hudEl.style.display = show ? 'block' : 'none';
      hudShown = show;
    }
    if (!show) return;
    hudText.textContent = text;
    hudRisk.style.display = risk >= 0 ? 'block' : 'none';
    hudFill.style.width = `${Math.round(Math.min(1, Math.max(0, risk)) * 100)}%`;
  }

  // Hub: the tow record, the riders' commands, and mirrored boats.
  const adapter: SyncAdapter = {
    sys: SYS.tow,
    radius: 300,
    hz: 5,

    collect(out: OwnedEnt[]): void {
      if (!towOn || !boatNow()) return;
      const boat = boatNow();
      if (!boat) return;
      const rec = encodeTow({ on: true, score: teamScore(), gates: run.next, slots: slots.map(slotWire) });
      out.push({ id: 1, x: boat.x, z: boat.z, rec });
    },

    receive(ch: MirrorChanges): void {
      for (const e of [...ch.added, ...ch.changed]) {
        const w = decodeTow(e.rec);
        if (w) mirrors.set(e.owner, w);
      }
      for (const e of ch.removed) dropMirror(e.owner);
    },

    command(from: number, _id: number, c: number, a: readonly number[]): void {
      if (c === TOW_CMD.hook) {
        if (!towOn || slots.some((s) => s.who === from)) return;
        const idx = freeSlot(slots.map((s) => s.who));
        if (idx < 0) return;
        slots[idx] = { who: from, npc: null, points: 0 };
        deps.hud.toast(`${deps.net.nameOf(from) ?? 'A rider'} hooked on.`);
        noteSlots();
      } else if (c === TOW_CMD.unhook) {
        const s = slots.find((x) => x.who === from);
        if (s) slots[slots.indexOf(s)] = emptySlot();
      } else if (c === TOW_CMD.points) {
        const s = slots.find((x) => x.who === from);
        if (s) s.points = Math.max(0, Math.min(JOB_WIRE.maxPoints, a[0] ?? 0));
      }
    },

    ownerGone(owner: number): void {
      dropMirror(owner);
      if (ride.host === owner) unhook('Your boat left.');
    },

    update(): void {
      // Nothing: the runtime's update() draws everything.
    },

    reset(): void {
      mirrors.clear();
      for (const k of [...shownNpc]) if (!k.startsWith('me:')) showNpc(k, null);
      for (let i = 0; i < slots.length; i++) if (slots[i].who >= 0) slots[i] = emptySlot();
      if (ride.host !== null) unhook('Let go of the tow line.');
    },
  };

  deps.hub.register(SYS.tow, (l) => {
    link = l;
    return adapter;
  });

  deps.phone.addApp({
    id: 'tubing',
    label: 'Tubing',
    icon: '🛟',
    detail: () => (towOn ? 'Tow line out' : 'Tow riders behind a boat, or hop on one'),
    run: () => {
      const r = boatNow() ? setTow(!towOn) : hopOn();
      if (r) deps.hud.toast(r);
    },
  });

  return {
    drives(v: Vehicle): boolean {
      return v === myTube && ride.host !== null && ride.slot >= 0 && ride.state !== null;
    },

    stepRider,

    update(dt: number): void {
      autoHook(dt);
      if (towOn) tickDriver(dt);
      tickRider(dt);
      drawRopes();
      view.update(dt, deps.player.x, deps.player.z);
      refreshHud();
    },

    blips(): Blip[] {
      const out: Blip[] = [{ x: RACK.x, z: RACK.z, color: TUBE_COLOR, label: 'Tube rack' }];
      if (towOn && run.next < BUOY_GATES.length) {
        const g = BUOY_GATES[run.next];
        out.push({ x: g.x, z: g.z, color: TUBE_COLOR, quest: 'objective', label: `Buoy ${run.next + 1}` });
      }
      return out;
    },

    prompt(x: number, z: number): string | null {
      return Math.hypot(x - RACK.x, z - RACK.z) <= 4 ? 'Rent a tow tube (5 🌰)' : null;
    },

    interact(x: number, z: number): boolean {
      if (Math.hypot(x - RACK.x, z - RACK.z) > 4) return false;
      const r = spawnTube();
      if (r) deps.hud.toast(r);
      return true;
    },

    setTow,
    addNpcRider,
    hopOn,
    spawnTube,

    debug() {
      return {
        tow: towOn
          ? {
            on: true,
            slots: slots.map((s) => (s.npc ? 'npc' : s.who === TOW_EMPTY ? null : s.who)),
            score: teamScore(),
            gates: run.next,
          }
          : null,
        ride: ride.host === null
          ? null
          : {
            host: ride.host,
            slot: ride.slot,
            points: ride.score.points,
            fallen: ride.state?.fallen ?? false,
            air: ride.score.air,
          },
        ropes: lastRopes,
      };
    },
  };
}
