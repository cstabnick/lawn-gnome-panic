// E25 firefighter job runtime: answer the bell, drive the Pumper to the call, man the hose, ladder the rescue, get
// paid per call. Fires are the shared fire system (src/fire/); the hose, ladder and scoring are this folder's modules.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { createFireField, clearFires, burningCount, douse, fuelPoint, ignite, nearestBurning, stepFires } from '../../fire/sim';
import { createFireView } from '../../fire/view';
import type { Fire, FireField, FuelPoint } from '../../fire/types';
import { gnomeState, makeGnome, randomTownLook } from '../../gnomes';
import { homePlaces } from '../../homes/data';
import { addInteractSpot } from '../../interactables';
import { LAND_PLACES } from '../../jobs/places';
import { RESCUE_PAY, WORK_ACHIEVEMENTS, WORK_JOBS } from '../../jobs/workDefs';
import { boxesBlocked, findSafeSpot } from '../../lockup/safeSpot';
import type { SpotProbe } from '../../lockup/types';
import { circleClearOfStreets } from '../../parking';
import { play2d, playAt } from '../../sound/bus';
import { SIREN_VEHICLES } from '../../sound/watchVehicles';
import { heightAt, slopeAt, waterAt } from '../../terrain';
import type { Blip, Box, Vehicle } from '../../types';
import { createVehicle, removeVehicle } from '../../vehicles';
import { finishShift, workLevel } from '../shift';
import { createShiftHud } from '../shiftHud';
import { registerJobs3Sounds } from '../sounds3';
import type { WorkDeps, WorkJobRuntime, WorkWaypoint } from '../types';
import { FOREST_PLACES, makeCall, scoreCall } from './calls';
import { HOSE, drainTank, hoseArc, hoseLanding, refillTank, stepLadder, type HoseAim, type Tank } from './hose';
import { createHoseView } from './hoseView';
import { openHoseUi, type HoseUi } from './hoseUi';
import { buildStation, cityHydrants, updateStation, type Station } from './station';
import { FIRE_JOB, FIRE_START_EVENT, PUMPER, type CallPlace, type FireCall } from './types';

const KINDS_KEY = 'gta-fire-kinds-v1';
const MIN_CALL_DIST = 80;
const MAX_CALL_DIST = 900;
const HYDRANT_NEAR = 60;
const FAR_RESCUE_FAIL = 150;
const PROPS_AWAY = 200;
const LEFTOVER_AWAY = 60;
const SIREN_OFF_DIST = 40;
const RESCUE_ANIM_S = 1.5;
const ARC_POINTS = 24;
const FIRE_COLOR = WORK_JOBS.firefighter.color;

interface CallProp {
  obj: THREE.Object3D;
  prefab: string;
  /** Its collider in world.boxes (solid props only), removed with it. */
  box?: Box;
}

/** Call props that stop a gnome or a vehicle (the rest are small enough to walk over). */
const SOLID_PROPS = new Set(['garden-shed', 'fire-garden-shed-burnt', 'fire-bbq-grill', 'gta-wheelie-bin',
  'giant-spotted-toadstool', 'capwood-toadstool-cluster', 'park-bench', 'kerb-hydrant']);

interface Rescuee {
  gnome: GnomeModel | null;
  cat: THREE.Object3D | null;
  /** Perch position (world). */
  px: number;
  py: number;
  pz: number;
  state: 'up' | 'down' | 'failed';
  /** Seconds since 'down' began; the landing spot beside the engine. */
  t: number;
  tx: number;
  tz: number;
}

interface ActiveCall {
  call: FireCall;
  cx: number;
  cz: number;
  yaw: number;
  group: string;
  tracked: { fire: Fire; initial: number }[];
  fuelPts: FuelPoint[];
  startFuel: number;
  props: CallProp[];
  rescue: Rescuee | null;
  hydrants: { x: number; z: number }[];
  /** Seconds since the call came in. */
  t: number;
  /** Seconds of the call when the last fire went out (null while one burns). */
  outAt: number | null;
  water: number;
  siren: boolean;
  ending: boolean;
}

interface OldCall {
  props: CallProp[];
  rescue: Rescuee | null;
  cx: number;
  cz: number;
}

interface HoseSession {
  ui: HoseUi;
  aim: HoseAim;
  ext: number;
  wasHeld: boolean;
  sprayT: number;
  steamT: number;
  arc: Float32Array;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function loadKinds(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KINDS_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveKinds(s: Set<string>): void {
  try {
    localStorage.setItem(KINDS_KEY, JSON.stringify([...s]));
  } catch {
    // storage blocked: the achievement just counts again next time
  }
}

export function installFirefighter(deps: WorkDeps): WorkJobRuntime {
  registerJobs3Sounds();
  const shiftHud = createShiftHud(deps.ui);
  const field: FireField = createFireField();
  const fireView = createFireView(deps.scene, deps.fx);
  const hoseView = createHoseView(deps.scene);
  const dev = new URLSearchParams(location.search).get('firecall');
  let devT = dev !== null ? 0 : -1;
  let devHose = -1;

  let station: Station | null = null;
  let removeSpot: (() => void) | null = null;
  let engine: Vehicle | null = null;
  let leftover: Vehicle | null = null;
  let onDuty = false;
  let level = 1;
  const tank: Tank = { level: 0, cap: 1 };
  let active: ActiveCall | null = null;
  const old: OldCall[] = [];
  let nextIn = Infinity;
  let nextId = 1;
  let hose: HoseSession | null = null;
  let cardOpen = false;
  let away = 0;
  let refilling = false;
  let crackleT = 0;
  const stationHydrants: { x: number; z: number }[] = [];
  const lastKinds = loadKinds();

  // ---- helpers ----

  function dropVehicle(v: Vehicle | null): void {
    if (!v) return;
    SIREN_VEHICLES.delete(v.id);
    removeVehicle(deps.scene, v);
    const i = deps.vehicles.indexOf(v);
    if (i >= 0) deps.vehicles.splice(i, 1);
  }

  function removeProps(props: CallProp[]): void {
    for (const p of props) {
      p.obj.removeFromParent();
      unbox(p);
    }
  }

  /** A collider from the prop's world bounds (solid props only). */
  function boxProp(p: CallProp): void {
    if (!SOLID_PROPS.has(p.prefab)) return;
    p.obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(p.obj);
    p.box = { minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y - p.obj.position.y };
    deps.world.boxes.push(p.box);
  }

  function unbox(p: CallProp): void {
    if (!p.box) return;
    const i = deps.world.boxes.indexOf(p.box);
    if (i >= 0) deps.world.boxes.splice(i, 1);
    p.box = undefined;
  }

  function dropRescuee(r: Rescuee | null): void {
    if (!r) return;
    r.cat?.removeFromParent();
    if (r.gnome) {
      r.gnome.object.removeFromParent();
      r.gnome.object.traverse((x) => {
        const g = (x as THREE.Mesh).geometry;
        if (g) g.dispose();
      });
    }
  }

  function dropOld(o: OldCall): void {
    removeProps(o.props);
    dropRescuee(o.rescue);
    const i = old.indexOf(o);
    if (i >= 0) old.splice(i, 1);
  }

  function makeProbe(extra?: (x: number, z: number, r: number) => boolean): SpotProbe {
    const blockedBy = boxesBlocked(deps.world.boxes, deps.world.half);
    return {
      ground: heightAt,
      water: (x, z) => waterAt(x, z)?.depth ?? 0,
      slope: slopeAt,
      blocked: (x, z, r) => blockedBy(x, z, r) || !circleClearOfStreets(x, z, r) || (extra?.(x, z, r) ?? false),
    };
  }

  function spotNear(x: number, z: number, radius: number, minDist: number, maxDist: number, extra?: (x: number, z: number, r: number) => boolean) {
    return findSafeSpot(x, z, makeProbe(extra), { radius, minDist, maxDist, maxSlope: 0.25, maxWater: 0 });
  }

  function setSpot(): void {
    if (!station) return;
    removeSpot?.();
    removeSpot = addInteractSpot({
      x: station.bell.x,
      z: station.bell.z,
      prompt: onDuty ? 'Go off duty' : 'Answer the bell (firefighter)',
      run: () => {
        if (onDuty) goOffDuty('Off duty. The kettle is on.');
        else startDuty();
        return true;
      },
    });
  }

  function nearestRoadYaw(x: number, z: number): number {
    let best = Infinity;
    let bx = 0;
    let bz = 0;
    for (const n of deps.world.roads.nodes) {
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < best) {
        best = d;
        bx = n.x;
        bz = n.z;
      }
    }
    return best < 150 ? Math.atan2(bx - x, bz - z) : Math.random() * Math.PI * 2;
  }

  function allHydrants(): { x: number; z: number }[] {
    const list = [...cityHydrants(), ...stationHydrants];
    if (active) list.push(...active.hydrants);
    return list;
  }

  // ---- duty ----

  function startDuty(): void {
    if (onDuty || !station) return;
    const why = deps.blocked();
    if (why) {
      deps.hud.toast(why);
      return;
    }
    if (leftover) {
      dropVehicle(leftover);
      leftover = null;
    }
    const e = station.engine;
    const v = createVehicle(deps.scene, 'fire-engine', e.x, e.z, e.yaw);
    deps.vehicles.push(v);
    deps.seatPlayer(v);
    engine = v;
    onDuty = true;
    level = workLevel('firefighter');
    tank.cap = (FIRE_JOB.tankS + FIRE_JOB.tankPerLevelS * (level - 1)) * FIRE_JOB.litresPerS;
    tank.level = tank.cap;
    away = 0;
    nextIn = FIRE_JOB.nextCallS;
    play2d('fire-bell');
    deps.hud.toast('On duty. Chief Pumpwell: "Keep the tank full and the dignity wet."', 5000);
    setSpot();
  }

  function goOffDuty(note: string | null): void {
    if (!onDuty) return;
    closeHose();
    if (active) clearActive();
    onDuty = false;
    nextIn = Infinity;
    if (engine) SIREN_VEHICLES.delete(engine.id);
    leftover = engine;
    engine = null;
    shiftHud.set(null);
    if (note) deps.hud.toast(note, 4000);
    setSpot();
  }

  // ---- calls ----

  function candidatePlaces(): CallPlace[] {
    const out: CallPlace[] = [];
    const seen = new Set<string>();
    const add = (p: CallPlace): void => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      out.push(p);
    };
    for (const p of LAND_PLACES) add({ id: p.id, name: p.name, x: p.x, z: p.z, area: p.area === 'city' ? 'city' : 'outskirts' });
    for (const p of homePlaces()) add({ id: p.id, name: p.name, x: p.x, z: p.z, area: 'city' });
    for (const p of FOREST_PLACES) add(p);
    const e = station?.engine ?? { x: 0, z: 0 };
    return out.filter((p) => {
      const d = Math.hypot(p.x - e.x, p.z - e.z);
      return d >= MIN_CALL_DIST && d <= MAX_CALL_DIST;
    });
  }

  function buildProp(act: ActiveCall, p: FireCall['props'][number]): void {
    if (!getPrefab(p.prefab)) return;
    const c = Math.cos(act.yaw);
    const s = Math.sin(act.yaw);
    const x = act.cx + p.dx * c + p.dz * s;
    const z = act.cz - p.dx * s + p.dz * c;
    const obj = buildPrefab(p.prefab, p.tint !== undefined ? { tint: p.tint } : {});
    obj.position.set(x, heightAt(x, z), z);
    obj.rotation.y = act.yaw + p.yaw;
    if (p.scale) obj.scale.setScalar(p.scale);
    deps.scene.add(obj);
    const cp: CallProp = { obj, prefab: p.prefab };
    boxProp(cp);
    act.props.push(cp);
  }

  function startCall(places: CallPlace[]): boolean {
    if (!station || !engine || places.length === 0) return false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const seed = (Date.now() + attempt * 977) & 0xffff;
      const call = makeCall(level, seed, places, nextId);
      const spot = spotNear(call.place.x, call.place.z, 5, 0, 40);
      if (!spot) {
        places = places.filter((p) => p.id !== call.place.id);
        if (places.length === 0) return false;
        continue;
      }
      nextId++;
      begin(call, spot.x, spot.z);
      return true;
    }
    return false;
  }

  function begin(call: FireCall, cx: number, cz: number): void {
    for (const o of [...old]) dropOld(o);
    const yaw = nearestRoadYaw(cx, cz);
    const group = `call-${call.id}`;
    const act: ActiveCall = {
      call, cx, cz, yaw, group, tracked: [], fuelPts: [], startFuel: 0, props: [], rescue: null, hydrants: [],
      t: 0, outAt: null, water: 0, siren: true, ending: false,
    };
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const at = (dx: number, dz: number) => ({ x: cx + dx * c + dz * s, z: cz - dx * s + dz * c });
    for (const p of call.props) buildProp(act, p);
    for (const f of call.fires) {
      const w = at(f.dx, f.dz);
      const fire = ignite(field, w.x, heightAt(w.x, w.z) + f.y, w.z, { r: f.r, kind: call.kind, fuel: f.fuel, group });
      act.tracked.push({ fire, initial: f.fuel });
      act.startFuel += f.fuel;
    }
    for (const f of call.spread) {
      const w = at(f.dx, f.dz);
      act.fuelPts.push(fuelPoint(w.x, heightAt(w.x, w.z) + f.y, w.z, f.r, call.kind, f.fuel, group));
      act.startFuel += f.fuel;
    }
    const r = call.rescue;
    if (r) {
      const w = at(r.dx, r.dz);
      const py = heightAt(w.x, w.z) + r.y;
      const res: Rescuee = { gnome: null, cat: null, px: w.x, py, pz: w.z, state: 'up', t: 0, tx: w.x, tz: w.z };
      if (r.who === 'cat' && getPrefab('asphalt-cat')) {
        res.cat = buildPrefab('asphalt-cat');
        res.cat.position.set(w.x, py, w.z);
        deps.scene.add(res.cat);
      } else {
        res.gnome = makeGnome(deps.scene, randomTownLook());
        res.gnome.update(gnomeState(w.x, py, w.z, yaw + Math.PI, 0), 0);
      }
      act.rescue = res;
    }
    // Hydrants: the fixed ones, and a kerb hydrant of its own when none is within reach.
    const all = [...cityHydrants(), ...stationHydrants];
    if (!all.some((h) => Math.hypot(h.x - cx, h.z - cz) <= HYDRANT_NEAR)) {
      const hs = spotNear(cx, cz, 0.6, 12, 25, (x, z, rr) => Math.hypot(x - cx, z - cz) < 6 + rr);
      const hx = hs?.x ?? cx + 15;
      const hz = hs?.z ?? cz;
      if (getPrefab('kerb-hydrant')) {
        const o = buildPrefab('kerb-hydrant');
        o.position.set(hx, heightAt(hx, hz), hz);
        deps.scene.add(o);
        act.props.push({ obj: o, prefab: 'kerb-hydrant' });
      }
      act.hydrants.push({ x: hx, z: hz });
    }
    active = act;
    SIREN_VEHICLES.add(engine!.id);
    play2d('fire-bell');
    deps.hud.toast(`Call: ${call.title}. ${call.caller}: "${call.line}"`, 8000);
  }

  function clearActive(): void {
    const a = active;
    if (!a) return;
    clearFires(field, a.group);
    removeProps(a.props);
    dropRescuee(a.rescue);
    if (engine) SIREN_VEHICLES.delete(engine.id);
    active = null;
  }

  function burntFraction(a: ActiveCall): number {
    let burned = 0;
    for (const t of a.tracked) burned += t.initial - Math.max(0, t.fire.fuel);
    return a.startFuel > 0 ? clamp(burned / a.startFuel, 0, 1) : 0;
  }

  function endCall(a: ActiveCall): void {
    if (a.ending) return;
    a.ending = true;
    closeHose();
    const burnt = burntFraction(a);
    const putOut = a.tracked.filter((t) => t.fire.state === 'out').length;
    const res = a.rescue;
    const rescued = res ? res.state === 'down' : null;
    if (res && res.state === 'up') res.state = 'failed';
    const score = scoreCall(a.call, { seconds: a.outAt ?? a.t, burnt, water: a.water, rescued });
    // A shed that mostly burnt is swapped for the burnt one and stays that way.
    if (a.call.kind === 'shed' && burnt > 0.6 && getPrefab('fire-garden-shed-burnt')) {
      for (const p of a.props) {
        if (p.prefab !== 'garden-shed') continue;
        const b = buildPrefab('fire-garden-shed-burnt');
        b.position.copy(p.obj.position);
        b.rotation.copy(p.obj.rotation);
        p.obj.parent?.add(b);
        p.obj.removeFromParent();
        unbox(p);
        p.obj = b;
        p.prefab = 'fire-garden-shed-burnt';
        boxProp(p);
      }
    }
    if (engine) SIREN_VEHICLES.delete(engine.id);
    deps.hud.toast(`${a.call.title}: ${score.lines.join(' · ')}`, 6000);
    cardOpen = true;
    nextIn = Infinity;
    finishShift(deps, 'firefighter', {
      units: [{ stars: score.stars }],
      extra: { fires: putOut, calls: 1, rescues: rescued ? 1 : 0 },
      bonus: rescued ? RESCUE_PAY : 0,
      bonusNote: 'Rescue',
      quote: score.quote,
      onClose: () => {
        cardOpen = false;
        if (onDuty) nextIn = FIRE_JOB.nextCallS;
      },
    });
    if (putOut > 0) {
      deps.increment(WORK_ACHIEVEMENTS.hoseGnome, putOut);
      if (!lastKinds.has(a.call.kind)) {
        lastKinds.add(a.call.kind);
        saveKinds(lastKinds);
        deps.increment(WORK_ACHIEVEMENTS.bbqSeason);
      }
    }
    old.push({ props: a.props, rescue: a.rescue, cx: a.cx, cz: a.cz });
    active = null;
  }

  // ---- the hose ----

  function aimAtFire(a: ActiveCall, nozzle: THREE.Vector3): HoseAim {
    const f = nearestBurning(field, nozzle.x, nozzle.z);
    const tx = f?.x ?? a.cx;
    const tz = f?.z ?? a.cz;
    const yaw = Math.atan2(tx - nozzle.x, tz - nozzle.z);
    let pitch: number = HOSE.minPitch;
    let bestD = Infinity;
    for (let p = HOSE.minPitch; p <= HOSE.maxPitch + 1e-6; p += 0.02) {
      const land = hoseLanding(nozzle, { yaw, pitch: p }, heightAt(tx, tz));
      const d = Math.hypot(land.x - tx, land.z - tz);
      if (d < bestD) {
        bestD = d;
        pitch = p;
      }
    }
    return { yaw, pitch };
  }

  function nozzlePos(out: THREE.Vector3): THREE.Vector3 {
    const piv = engine?.object.getObjectByName(PUMPER.nozzle);
    if (piv) return piv.getWorldPosition(out);
    return out.set(engine?.x ?? 0, (engine?.y ?? 0) + 2, engine?.z ?? 0);
  }

  function canHose(): boolean {
    const a = active;
    if (!a || !engine || hose || a.ending || cardOpen) return false;
    if (deps.player.vehicle !== engine) return false;
    if (Math.abs(engine.speed) >= FIRE_JOB.stopSpeed) return false;
    return Math.hypot(engine.x - a.cx, engine.z - a.cz) <= FIRE_JOB.hoseRange;
  }

  function openHose(): void {
    const a = active;
    if (!a || !engine || hose) return;
    const nozzle = nozzlePos(new THREE.Vector3());
    const aim = aimAtFire(a, nozzle);
    const yawToCall = Math.atan2(a.cx - engine.x, a.cz - engine.z);
    const ui = openHoseUi(deps.ui);
    hose = { ui, aim, ext: 0, wasHeld: false, sprayT: 0, steamT: 0, arc: new Float32Array(ARC_POINTS * 3) };
    deps.showroom({
      x: engine.x + Math.sin(yawToCall) * 5,
      y: engine.y + 1.2,
      z: engine.z + Math.cos(yawToCall) * 5,
      radius: 5,
      distance: 15,
      centered: true,
      fixedYaw: yawToCall,
      fixedPitch: 0.3,
    });
  }

  function closeHose(): void {
    if (!hose) return;
    hose.ui.close();
    hose = null;
    deps.showroom(null);
    hoseView.set(null, 0, 0);
    const lad = engine?.object.getObjectByName(PUMPER.ladder);
    if (lad) {
      lad.rotation.set(0, 0, 0);
      lad.scale.z = 1;
    }
  }

  const _nozzle = new THREE.Vector3();

  function stepHose(a: ActiveCall, h: HoseSession, dt: number): void {
    const e = engine!;
    e.speed = 0;
    const inp = h.ui.read();
    if (inp.leave) {
      closeHose();
      return;
    }
    h.aim.yaw += inp.aimX * HOSE.yawRate * dt;
    h.aim.pitch = clamp(h.aim.pitch + inp.aimY * HOSE.pitchRate * dt, HOSE.minPitch, HOSE.maxPitch);
    const nozzle = nozzlePos(_nozzle);
    const piv = e.object.getObjectByName(PUMPER.nozzle);
    if (piv) {
      piv.rotation.order = 'YXZ';
      piv.rotation.y = h.aim.yaw - e.yaw;
      piv.rotation.x = -h.aim.pitch;
    }

    let landed = false;
    if (inp.spray && tank.level > 0) {
      const litres = drainTank(tank, dt, FIRE_JOB.litresPerS);
      let land = hoseLanding(nozzle, h.aim, heightAt(nozzle.x, nozzle.z));
      land = hoseLanding(nozzle, h.aim, heightAt(land.x, land.z));
      land = hoseLanding(nozzle, h.aim, heightAt(land.x, land.z));
      const removed = douse(field, land.x, land.z, HOSE.sprayRadius, litres);
      a.water += litres;
      h.steamT -= dt;
      if (removed > 0.0005 && h.steamT <= 0) {
        h.steamT = 0.2;
        fireView.steam(land.x, land.y + 0.8, land.z);
        playAt('steam-hiss', land);
      }
      h.sprayT -= dt;
      if (h.sprayT <= 0) {
        h.sprayT = 0.9;
        playAt('hose-spray', nozzle);
      }
      const n = hoseArc(nozzle, h.aim, land.y, ARC_POINTS, h.arc);
      hoseView.set(h.arc, n, dt);
      landed = true;
    }
    if (!landed) hoseView.set(null, 0, dt);

    // Ladder: only while someone is still up there.
    const res = a.rescue;
    const lad = e.object.getObjectByName(PUMPER.ladder);
    if (res && res.state === 'up' && a.call.rescue) {
      const band = a.call.rescue.band;
      const step = stepLadder(h.ext, inp.ladder, h.wasHeld, dt, band);
      h.wasHeld = inp.ladder;
      h.ext = step.ext;
      h.ui.setLadder(h.ext, band);
      if (step.event === 'rescue') rescue(a, res, e);
      else if (step.event === 'bonk') play2d('ladder-clunk');
    } else {
      h.wasHeld = false;
      h.ext = Math.max(0, h.ext - dt * 0.5);
      h.ui.setLadder(null, null);
    }
    if (lad) {
      lad.rotation.order = 'YXZ';
      lad.rotation.y = res ? Math.atan2(res.px - e.x, res.pz - e.z) - e.yaw : 0;
      lad.rotation.x = -0.9 * Math.min(1, h.ext * 2);
      lad.scale.z = 1 + 1.4 * h.ext;
    }

    h.ui.setTank(tank.cap > 0 ? tank.level / tank.cap : 0, refilling);
    const left = burningCount(field, a.group);
    h.ui.setHint(
      tank.level <= 0 && left > 0 ? 'Out of water: find a hydrant'
        : left > 0 ? `${left} fire${left === 1 ? '' : 's'} left`
          : res && res.state === 'up' ? 'Fires out! Ladder the rescue' : 'All out. Back to the cab.',
    );
  }

  function rescue(a: ActiveCall, res: Rescuee, e: Vehicle): void {
    res.state = 'down';
    res.t = 0;
    const side = e.yaw + Math.PI / 2;
    res.tx = e.x + Math.sin(side) * 2.6;
    res.tz = e.z + Math.cos(side) * 2.6;
    deps.increment(WORK_ACHIEVEMENTS.ladderGnome);
    const r = a.call.rescue!;
    play2d(r.who === 'cat' ? 'cat-meow' : 'rescue-cheer');
    deps.hud.toast(`${r.name}: "${r.thanks}"`, 5000);
  }

  function stepRescuee(a: { rescue: Rescuee | null; yaw?: number }, dt: number): void {
    const res = a.rescue;
    if (!res) return;
    let x = res.px;
    let y = res.py;
    let z = res.pz;
    if (res.state === 'down') {
      res.t = Math.min(RESCUE_ANIM_S, res.t + dt);
      const k = res.t / RESCUE_ANIM_S;
      x = res.px + (res.tx - res.px) * k;
      z = res.pz + (res.tz - res.pz) * k;
      y = res.py + (heightAt(res.tx, res.tz) - res.py) * k;
      if (k >= 1) {
        res.px = res.tx;
        res.pz = res.tz;
        res.py = y;
        res.state = 'down';
      }
    }
    const yaw = a.yaw ?? 0;
    if (res.cat) res.cat.position.set(x, y, z);
    if (res.gnome) {
      res.gnome.object.position.set(x, y, z);
      res.gnome.update(gnomeState(x, y, z, yaw + Math.PI, 0), dt);
    }
  }

  // ---- HUD, waypoint, blips ----

  function updateHud(): void {
    if (!onDuty) {
      shiftHud.set(null);
      return;
    }
    const a = active;
    const frac = tank.cap > 0 ? tank.level / tank.cap : 0;
    const tankLine = refilling ? 'Refilling at the hydrant' : `Tank ${Math.round(frac * 100)}%`;
    if (hose || cardOpen) {
      shiftHud.set(null);
      return;
    }
    if (!a) {
      shiftHud.set({
        icon: '🚒', title: 'On duty: Fire Station No. 1', lines: ['Waiting for the bell', tankLine],
        meter: { label: 'Tank', frac }, action: null, color: FIRE_COLOR,
      });
      return;
    }
    const lines: string[] = [];
    const left = burningCount(field, a.group);
    const d = engine ? Math.round(Math.hypot(engine.x - a.cx, engine.z - a.cz)) : 0;
    lines.push(left > 0 ? (d > FIRE_JOB.hoseRange ? `${d} m to the fire` : `${left} fire${left === 1 ? '' : 's'} burning`) : 'Fires out');
    if (a.rescue && a.rescue.state === 'up') lines.push(`${a.call.rescue?.name ?? 'Someone'} is stuck up high`);
    lines.push(tankLine);
    shiftHud.set({
      icon: '🚒', title: a.call.title, lines, meter: { label: 'Tank', frac },
      action: canHose() ? 'Man the hose' : null, color: FIRE_COLOR,
    });
  }

  // ---- per frame ----

  function devStep(dt: number): void {
    if (devHose > 0 && --devHose === 0) openHose();
    if (devT < 0 || !station) return;
    devT += dt;
    if (devT < 2) return;
    devT = -1;
    deps.teleport(station.bell.x, station.bell.z, 0);
    startDuty();
    if (!onDuty || !engine) return;
    const e = station.engine;
    const places = candidatePlaces().sort((p, q) => Math.hypot(p.x - e.x, p.z - e.z) - Math.hypot(q.x - e.x, q.z - e.z));
    if (places.length === 0) return;
    level = Math.max(level, 3);
    if (!startCall([places[0]])) return;
    if (dev === 'hose' && active) {
      const a = active;
      const sp = spotNear(a.cx, a.cz, 2.5, 16, 24);
      const ex = sp?.x ?? a.cx - 18;
      const ez = sp?.z ?? a.cz;
      // A fresh engine at the spot (a moved one would be pulled back by its chassis); the hose opens a few frames later.
      dropVehicle(engine);
      const v = createVehicle(deps.scene, 'fire-engine', ex, ez, Math.atan2(a.cx - ex, a.cz - ez));
      deps.vehicles.push(v);
      deps.seatPlayer(v);
      engine = v;
      SIREN_VEHICLES.add(v.id);
      devHose = 5;
    }
  }

  function update(dt: number): void {
    if (!station) {
      station = buildStation(deps.scene, deps.world);
      stationHydrants.push(...station.hydrants);
      setSpot();
      window.addEventListener(FIRE_START_EVENT, () => startDuty());
    }
    updateStation(dt);
    const act = active;
    stepFires(field, dt, act?.fuelPts ?? []);
    fireView.update(dt, field, deps.player.x, deps.player.z);
    const p = deps.player;

    // Old calls' props go once the player is far away.
    for (const o of [...old]) if (Math.hypot(p.x - o.cx, p.z - o.cz) > PROPS_AWAY) dropOld(o);
    for (const o of old) stepRescuee({ rescue: o.rescue }, dt);
    if (leftover && p.vehicle !== leftover && Math.hypot(p.x - leftover.x, p.z - leftover.z) > LEFTOVER_AWAY) {
      dropVehicle(leftover);
      leftover = null;
    }
    devStep(dt);

    // Crackle near a burning fire.
    crackleT -= dt;
    if (crackleT <= 0) {
      crackleT = 2.5;
      const f = nearestBurning(field, p.x, p.z);
      if (f && Math.hypot(f.x - p.x, f.z - p.z) < 40) playAt('fire-crackle', f);
    }

    if (!onDuty || !engine) {
      refilling = false;
      updateHud();
      return;
    }

    // The engine wrecked or gone, or the player far from it too long: off duty.
    if (engine.exploded || !deps.vehicles.includes(engine)) {
      goOffDuty('The Pumper is a write-off. Off duty.');
      return;
    }
    const outOfCab = p.vehicle !== engine;
    const dEng = Math.hypot(p.x - engine.x, p.z - engine.z);
    away = outOfCab && dEng > FIRE_JOB.abandonDist ? away + dt : 0;
    if (away > FIRE_JOB.abandonS) {
      goOffDuty('You left the Pumper behind. Off duty.');
      return;
    }

    // Tank: refill when stopped at a hydrant (in the cab or at the hose).
    const stopped = Math.abs(engine.speed) < FIRE_JOB.stopSpeed;
    let nearHydrant = false;
    if (stopped) {
      for (const h of allHydrants()) {
        if (Math.hypot(h.x - engine.x, h.z - engine.z) <= FIRE_JOB.hydrantRadius) {
          nearHydrant = true;
          break;
        }
      }
    }
    refilling = nearHydrant && tank.level < tank.cap;
    if (refilling) refillTank(tank, dt, FIRE_JOB.refillPerS);

    if (act) {
      act.t += dt;
      // Fires lit by spread join the tally.
      for (const f of field.fires) {
        if (f.group === act.group && !act.tracked.some((t) => t.fire === f)) act.tracked.push({ fire: f, initial: f.fuel });
      }
      if (act.siren && Math.hypot(engine.x - act.cx, engine.z - act.cz) < SIREN_OFF_DIST) {
        act.siren = false;
        SIREN_VEHICLES.delete(engine.id);
      }
      if (hose) stepHose(act, hose, dt);
      stepRescuee(act, dt);
      if (!hose && act.rescue) {
        // The ladder folds back down once the hose is let go.
        const lad = engine.object.getObjectByName(PUMPER.ladder);
        if (lad && lad.scale.z !== 1) {
          lad.rotation.set(0, 0, 0);
          lad.scale.z = 1;
        }
      }

      const left = burningCount(field, act.group);
      if (left === 0 && act.outAt === null) act.outAt = act.t;
      const res = act.rescue;
      if (left === 0 && res && res.state === 'up' && Math.hypot(p.x - act.cx, p.z - act.cz) > FAR_RESCUE_FAIL) res.state = 'failed';
      const timedOut = act.t >= FIRE_JOB.callTimeoutS;
      if (timedOut && res && res.state === 'up') res.state = 'failed';
      const rescueDone = !res || res.state !== 'up';
      if ((left === 0 && rescueDone) || timedOut) endCall(act);
    } else if (!cardOpen) {
      nextIn -= dt;
      if (nextIn <= 0 && !deps.blocked()) {
        const places = candidatePlaces();
        if (!startCall(places)) nextIn = 10;
      }
    }
    updateHud();
  }

  const offAction = shiftHud.onAction(() => {
    if (canHose()) openHose();
  });
  void offAction;

  return {
    update,
    isOpen: () => hose?.ui.isOpen() ?? false,
    blips() {
      const out: Blip[] = [];
      if (station) out.push({ x: station.bell.x, z: station.bell.z, color: FIRE_COLOR, label: '🚒 Fire Station No. 1 (firefighter)' });
      if (active) out.push({ x: active.cx, z: active.cz, color: FIRE_COLOR, label: active.call.title });
      return out;
    },
    waypoint(): WorkWaypoint | null {
      if (!active) return null;
      return { x: active.cx, z: active.cz, color: FIRE_COLOR, label: active.call.title };
    },
  };
}
