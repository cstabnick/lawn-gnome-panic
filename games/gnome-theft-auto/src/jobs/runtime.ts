// Sim jobs runtime (docs/roadmaps/gta-sim-jobs-and-tubing.md): the one object app.ts talks to. Duty, gigs, pay,
// career, HUD, the phone's Jobs app, depots, NPC fares, player cabs and passengers online, achievements.
// Nothing heavy runs per frame while off duty: update() returns after a cheap check.
import { getMyGnome } from '@lawn/gnome';
import { SYS } from '../online/protocol';
import { passengerCount } from '../seats';
import type { VehicleSpec } from '../types';
import { aboveGround, waterAt } from '../terrain';
import { seaState, waveSlope, waveTime } from '../waves';
import { speakAt } from '../voice/speech';
import { CHATTER, JOBS, JOB_ACHIEVEMENTS, JOB_TUNING as J, perksFor } from './defs';
import { anyJobAtLevel, bindJobStats, levelOf, levelProgress, recordFail, recordGig, sharedJobsStore, statsOf } from './career';
import { loaded, startGig, stepGig, timeLeft } from './gig';
import type { GenCtx, GenVehicle, CallInfo } from './gen';
import { makeBoatGig, makeCourierRoute, makePilotGig, makePlayerFare, makeTaxiFare } from './gen';
import { payFor } from './rating';
import { LAND_PLACES, placeById } from './places';
import { surgeFor } from './surge';
import { createJobHud } from './hud';
import type { JobHudView } from './hud';
import { createJobBoard } from './board';
import type { BoardActions, BoardRow, BoardView, WorkRow } from './board';
import { WORK_JOBS, workPerkLines, workTitle } from './workDefs';
import { createJobVisuals } from './visuals';
import type { JobVisuals, SeatMood } from './visuals';
import { createCabSync } from './cabSync';
import type { CabSync } from './cabSync';
import { createPaxSync } from './paxSync';
import type { PaxSync } from './paxSync';
import { callKey } from './cabCalls';
import type { SeenCall } from './cabCalls';
import {
  JOB_IDS, WORK_JOB_IDS, type Blip, type Gig, type GigKind, type GigState, type JobId, type JobPerks, type JobsDebug,
  type JobsDeps, type Jobs, type ParcelKind, type Sample, type Surge, type Vehicle, type VehicleKind, type WorkJobId,
} from './types';

/** Can `job` work in this vehicle? Taxi: a ground car with a spare seat. Courier: any ground vehicle. Pilot: aircraft. Boat: boats. */
export function vehicleOk(job: JobId, spec: VehicleSpec, kind: VehicleKind): boolean {
  const boat = !!spec.boat;
  switch (job) {
    case 'taxi': return !spec.flies && !boat && passengerCount(spec) >= 1;
    case 'courier': return !spec.flies && !boat;
    case 'pilot': return spec.flies;
    case 'boat': return boat && kind !== 'tow-tube' && kind !== 'tow-ski';
  }
}

/** What the player is told to do to go on duty in this job. */
export function needText(job: JobId): string {
  switch (job) {
    case 'taxi': return 'Get in a car with a spare seat.';
    case 'courier': return 'Get in any car, cart or bike.';
    case 'pilot': return 'Get in an aircraft.';
    case 'boat': return 'Get in a boat.';
  }
}

/** Seats 1..capacity that nobody has, highest first. */
export function freeSeats(capacity: number, taken: number[]): number[] {
  const out: number[] = [];
  for (let s = capacity; s >= 1; s--) if (!taken.includes(s)) out.push(s);
  return out;
}

/** The gig kinds this job can get now. Taxi: street fares only (player calls come through the cab system). */
export function kindsFor(job: JobId, perks: JobPerks, vehicle: { boat: boolean }): GigKind[] {
  if (job === 'taxi') return perks.kinds.filter((k) => k === 'fare');
  if (job === 'boat') return vehicle.boat ? perks.kinds : [];
  return perks.kinds;
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function genVehicleOf(v: Vehicle): GenVehicle {
  return {
    kind: v.kind, seats: passengerCount(v.spec), mass: v.spec.mass, flies: v.spec.flies,
    fixedWing: !!v.spec.fixedWing, boat: !!v.spec.boat,
  };
}

function moodFor(g: Gig, comfort: number, boat: boolean): SeatMood {
  if (g.personality === 'nervous') return 'nervous';
  if (boat && comfort < 60) return 'seasick';
  return 'calm';
}

function freshShift() {
  return { done: 0, failed: 0, earned: 0, bestTip: 0, stars: 0, starN: 0 };
}

export function installJobs(deps: JobsDeps): Jobs {
  const store = sharedJobsStore();

  // ---- Live state ----
  let duty: JobId | null = null;
  let dutyVehicle: Vehicle | null = null;
  let gig: GigState | null = null;
  let gigSurge: Surge | null = null;
  let gigPerks: JobPerks | null = null;
  let nextGigT = 0;
  let lastHp: number | null = null;
  let ranOver = false;
  let actionFlag = false;
  let outT = 0;
  let chatterT = 0;
  let boardT = 0;
  // The workplace the HUD route points at ("Show me" on the board), or null.
  let workRoute: WorkJobId | null = null;
  let faresDone = 0;
  let seated: [number, number][] = [];
  let shown: ParcelKind[] = [];
  let shift = freshShift();
  const sample: Sample = {
    x: 0, y: 0, z: 0, speed: 0, yaw: 0, vy: 0, aboveGround: 0, hpLoss: 0, ranOver: false, waveSlope: 0,
    stalled: false, action: false, inVehicle: false, playerAboard: false,
  };
  const tmp = { x: 0, z: 0 };

  bindJobStats(() => statsOf(store.get(), duty));

  // ---- World: depots, roads, HUD, board, online adapters ----
  const visuals: JobVisuals = createJobVisuals(deps.scene);
  const built = visuals.buildDepots(deps.world);
  deps.world.boxes.push(...built.boxes);
  const home: Record<JobId, { x: number; z: number } | null> = { taxi: null, courier: null, pilot: null, boat: null };
  for (const s of built.spots) if (s.job !== 'tubes') home[s.job] = { x: s.x, z: s.z };
  const roads = deps.world.roads.nodes.filter((n) => !n.deck).map((n) => ({ x: n.x, z: n.z }));

  const hud = createJobHud(deps.ui);
  const cab = deps.hub.register(SYS.cab, (link) => createCabSync(link, deps.net)) as CabSync;
  const pax = deps.hub.register(SYS.pax, (link) => createPaxSync(link, deps.net, visuals)) as PaxSync;

  const toast = (text: string) => deps.hud.toast(text);
  const nameOf = (id: number) => deps.net.nameOf(id) ?? 'Your driver';
  const levelFor = (job: JobId) => levelOf(store.get().jobs[job].xp);
  const pos = () => {
    const v = deps.player.vehicle;
    return v ? { x: v.x, z: v.z } : { x: deps.player.x, z: deps.player.z };
  };

  // Rider notes from the cab system.
  cab.onRider((n) => {
    if (n.t === 'assigned') toast(`${nameOf(n.driver)} is on the way. Ask to ride (E) when they pull up.`);
    else if (n.t === 'riding') toast(`Riding with ${nameOf(n.driver)}.`);
    else if (n.t === 'paid') toast(`Arrived. Kerbstone Cabs covered the fare (${n.stars}★).`);
    else if (n.t === 'reopened') toast('Your driver gave up. Waiting for another cab...');
    else if (n.t === 'expired') toast('No cab came. Try again later.');
    else if (n.t === 'left') toast('You got out early.');
  });

  // ---- Duty ----
  /** Why `job` cannot start here (licence, vehicle), or null. No side effects. */
  function dutyWhy(job: JobId): string | null {
    if (!store.get().jobs[job].licensed && JOBS[job].licence > 0) {
      return `Buy the licence first (${JOBS[job].licence} 🌰) on the Jobs app.`;
    }
    const v = deps.player.vehicle;
    if (!v || v.driver !== 'player' || deps.player.seat !== 0 || !vehicleOk(job, v.spec, v.kind)) return needText(job);
    return null;
  }

  function goOnDuty(job: JobId): string | null {
    const blockedWhy = deps.blocked();
    if (blockedWhy) return blockedWhy;
    if (duty === job) return 'Already on duty.';
    const why = dutyWhy(job);
    if (why) return why;
    const v = deps.player.vehicle;
    if (!v) return needText(job);
    const rec = store.get().jobs[job];
    if (!rec.licensed) { rec.licensed = true; store.commit(); }
    if (duty) goOffDuty();
    duty = job;
    dutyVehicle = v;
    visuals.setSign(v, job);
    nextGigT = 3;
    lastHp = v.hp;
    outT = 0;
    ranOver = false;
    shift = freshShift();
    toast(`${JOBS[job].giver}: "You're on, ${JOBS[job].title}."`);
    return null;
  }

  /** Clear passengers, parcels, the waiting fare and the publish to others. */
  function clearLoad(): void {
    if (dutyVehicle) {
      visuals.setPassengers(dutyVehicle, [], 'calm');
      visuals.setParcels(dutyVehicle, []);
    }
    seated = [];
    shown = [];
    pax.setMine(null, null);
    visuals.hideWaiting('fare');
  }

  function goOffDuty(): void {
    if (!duty) return;
    if (gig) {
      if (gig.gig.playerFare) cab.giveUp();
      recordFail(store.get(), duty);
      store.commit();
      shift.failed++;
      gig = null;
    }
    if (dutyVehicle) visuals.clearVehicle(dutyVehicle);
    clearLoad();
    if (shift.done || shift.failed) {
      const avg = shift.starN ? (shift.stars / shift.starN).toFixed(1) : '-';
      hud.summary('Shift over', [
        `Gigs done: ${shift.done}`, `Failed: ${shift.failed}`, `Earned: ${shift.earned} 🌰`,
        `Best tip: ${shift.bestTip} 🌰`, `Average stars: ${avg}`,
      ]);
    }
    duty = null;
    dutyVehicle = null;
    gigSurge = null;
    gigPerks = null;
    hud.set(null);
  }

  /** Move the duty sign to another vehicle the player drives (no gig running). */
  function moveDuty(job: JobId, v: Vehicle): void {
    if (dutyVehicle) visuals.clearVehicle(dutyVehicle);
    dutyVehicle = v;
    visuals.setSign(v, job);
    lastHp = v.hp;
    outT = 0;
  }

  // ---- Gigs ----
  function generate(kind: GigKind, ctx: GenCtx): Gig | null {
    switch (kind) {
      case 'fare': return makeTaxiFare(ctx);
      case 'route': return makeCourierRoute(ctx);
      case 'charter':
      case 'scenic':
      case 'cargo': return makePilotGig(ctx, kind);
      case 'water-taxi':
      case 'ferry': return makeBoatGig(ctx, kind);
      default: return null;
    }
  }

  function genCtx(job: JobId, v: Vehicle, level: number, perks: JobPerks, surge: Surge): GenCtx {
    return {
      rng: Math.random, from: { x: v.x, z: v.z }, level, perks, surge, roads,
      vehicle: genVehicleOf(v), home: home[job],
    };
  }

  function startJob(g: Gig, perks: JobPerks, surge: Surge, v: Vehicle): void {
    gig = startGig(g);
    gigSurge = surge;
    gigPerks = perks;
    seated = [];
    shown = [];
    chatterT = g.personality === 'chatty' ? 10 + Math.random() * 8 : 20 + Math.random() * 15;
    toast(`New job: ${g.title}${surge.label ? ' — ' + surge.label : ''}`);
    if (g.kind === 'fare') {
      const s0 = g.stops[0];
      visuals.showWaiting('fare', s0.x, s0.z, Math.atan2(v.x - s0.x, v.z - s0.z), g.seed, 'hail-cab');
    }
  }

  /** Generate and start a gig now. Null when it started, else the reason it did not. */
  function offerGig(kind?: GigKind): string | null {
    if (!duty || !dutyVehicle) return 'Not on duty.';
    if (gig) return 'A job is already running.';
    const job = duty;
    const v = dutyVehicle;
    const level = levelFor(job);
    const perks = perksFor(job, level);
    const surge = surgeFor(job, deps.timeLabel(), seaState(), level, Math.random());
    const kinds = kindsFor(job, perks, { boat: !!v.spec.boat });
    const choice = kind ?? (kinds.length ? pick(kinds) : undefined);
    if (!choice || !kinds.includes(choice)) return kind ? `${kind} is not open to this job.` : 'Nothing to offer here.';
    const g = generate(choice, genCtx(job, v, level, perks, surge));
    if (!g) return 'No job came up here.';
    startJob(g, perks, surge, v);
    return null;
  }

  /** A stop was reached (the gig is still running, or this is its last stop). */
  function onReached(st: GigState, idx: number, v: Vehicle): void {
    const g = st.gig;
    const stop = g.stops[idx];
    if (stop.action === 'gate') {
      const n = g.stops.slice(0, idx + 1).filter((s) => s.action === 'gate').length;
      deps.play('stunt');
      toast(`Gate ${n}`);
      return;
    }
    if (stop.action === 'cargo') {
      visuals.dropCrate(v.x, v.y, v.z, Math.sin(v.yaw) * v.speed, Math.cos(v.yaw) * v.speed);
      return;
    }
    if (idx === 0) {
      visuals.hideWaiting('fare');
      if (g.passengers > 0) {
        const taken = deps.net.riders().map((r) => r.seat);
        seated = freeSeats(passengerCount(v.spec), taken)
          .slice(0, g.passengers)
          .map((s, i): [number, number] => [s, g.seed + i]);
        visuals.setPassengers(v, seated, moodFor(g, st.comfort.score, !!v.spec.boat));
        const line = pick(CHATTER[g.personality].board);
        toast(`${g.client}: "${line}"`);
        speakAt(line, g.seed, v.x, v.z);
      }
      shown = [...g.parcels];
      visuals.setParcels(v, shown);
    } else if (stop.parcel) {
      shown = shown.slice(1);
      visuals.setParcels(v, shown);
      toast(`Delivered to ${stop.name}.`);
      deps.play('door');
    } else if (stop.board !== undefined && seated.length) {
      const n = Math.min(seated.length, stop.board);
      for (let i = 0; i < n; i++) seated[i] = [seated[i][0], g.seed + 31 * idx + i];
      visuals.setPassengers(v, seated, moodFor(g, st.comfort.score, !!v.spec.boat));
    }
    pax.setMine({ parcels: shown.length, seats: seated }, v);
  }

  function finish(st: GigState, v: Vehicle): void {
    if (!duty || !gigPerks || !gigSurge) return;
    const job = duty;
    const g = st.gig;
    const pay = payFor(st, gigPerks, gigSurge);
    deps.economy.earn(pay.total, JOBS[job].employer);
    toast(`+${pay.total} 🌰  ${'★'.repeat(pay.stars)}  ${pay.notes.slice(0, 3).join(' · ')}`);
    if (pay.stars >= 4 || pay.stars <= 2) {
      const line = pick(pay.stars >= 4 ? CHATTER[g.personality].good : CHATTER[g.personality].bad);
      toast(`${g.client}: "${line}"`);
      speakAt(line, g.seed, v.x, v.z);
    }
    const drops = g.stops.filter((s) => s.parcel).length;
    const extra = {
      parcels: g.kind === 'route' ? drops : 0,
      fragileClean: g.parcels.includes('fragile') && st.condition >= 0.99,
      perfectLanding: g.passengers > 0 && g.stops.some((s, i) => s.action === 'land' && (st.scores[i] ?? 0) >= 95),
      ferryLoop: g.kind === 'ferry',
      playerFare: !!g.playerFare,
    };
    const level = recordGig(store.get(), job, g.kind, pay, extra);
    store.commit();
    faresDone++;
    shift.done++;
    shift.earned += pay.total;
    shift.bestTip = Math.max(shift.bestTip, pay.tip);
    shift.stars += pay.stars;
    shift.starN++;
    if (g.playerFare) cab.drop(pay.total, pay.stars);

    if (job === 'taxi') deps.increment(JOB_ACHIEVEMENTS.cabbie);
    if (job === 'taxi' && pay.stars === 5) deps.unlock(JOB_ACHIEVEMENTS.fiveStar);
    if (g.playerFare) deps.unlock(JOB_ACHIEVEMENTS.realFare);
    if (job === 'courier' && drops) deps.increment(JOB_ACHIEVEMENTS.courier, drops);
    if (extra.fragileClean) deps.unlock(JOB_ACHIEVEMENTS.notAScratch);
    if (job === 'pilot') deps.increment(JOB_ACHIEVEMENTS.pilot);
    if (extra.perfectLanding) deps.unlock(JOB_ACHIEVEMENTS.butter);
    if (extra.ferryLoop) deps.unlock(JOB_ACHIEVEMENTS.ferry);
    if (anyJobAtLevel(store.get(), 5)) deps.unlock(JOB_ACHIEVEMENTS.career);

    if (level) deps.hud.banner(`${JOBS[job].title} level ${level}`);
    clearLoad();
    gig = null;
    gigSurge = null;
    gigPerks = null;
    nextGigT = J.nextGigS;
  }

  function failGig(reason: string): void {
    if (!gig || !duty) return;
    const g = gig;
    gig = null;
    toast(reason);
    recordFail(store.get(), duty);
    store.commit();
    shift.failed++;
    if (g.gig.playerFare) cab.giveUp();
    clearLoad();
    gigSurge = null;
    gigPerks = null;
    nextGigT = J.nextGigS;
  }

  /** The action button's label for the current state (also decides what the I key does). */
  function actionLabel(): string | null {
    const g = gig;
    if (g) {
      const stop = g.gig.stops[g.idx];
      if (stop && stop.action === 'cargo' && dutyVehicle &&
          Math.hypot(stop.x - dutyVehicle.x, stop.z - dutyVehicle.z) <= stop.radius) return 'Drop cargo';
      return null;
    }
    if (!duty) return null;
    if (duty === 'taxi' && dutyVehicle && cab.open(dutyVehicle.x, dutyVehicle.z).length) return 'Accept call';
    return 'Next job';
  }

  function hudView(d: JobId, v: Vehicle): JobHudView {
    const g = gig;
    const lines: string[] = [];
    let timer: number | null = null;
    let meter: string | null = null;
    let stars: number | null = null;
    let tag: string | null = null;
    let title = `${JOBS[d].title} - waiting for work`;
    if (g) {
      const stop = g.gig.stops[g.idx];
      if (stop) {
        lines.push(`To: ${stop.name}, ${Math.round(Math.hypot(stop.x - v.x, stop.z - v.z))} m`);
        timer = d === 'taxi' && g.idx === 0 && stop.hardDue !== undefined ? stop.hardDue - g.t : timeLeft(g);
      } else {
        timer = timeLeft(g);
      }
      if (g.gig.parcels.length) lines.push(`Parcels: ${shown.length} (fragile ${Math.round(g.condition * 100)}%)`);
      if (g.gig.playerFare) lines.push(`Pull up by ${g.gig.client}: they ride with E`);
      if (gigPerks && gigSurge) meter = `🌰 ${Math.round(g.gig.basePay * gigPerks.payMult * gigSurge.payMult)}`;
      if (loaded(g)) stars = g.comfort.score / 20;
      tag = gigSurge?.label ?? null;
      title = g.gig.title + (g.gig.personality !== 'plain' ? ` (${g.gig.personality})` : '');
    } else if (d === 'taxi') {
      const n = cab.open(v.x, v.z).length;
      if (n) lines.push(`Player calls: ${n} (I to accept)`);
    }
    return { job: d, title, lines: lines.slice(0, 3), meter, timer, stars, tag, action: actionLabel() };
  }

  /** Chatter and the cab-status check for a running gig. */
  function tickGig(dt: number, v: Vehicle): void {
    const g = gig;
    if (!g) return;
    if (g.gig.playerFare && duty === 'taxi') {
      const me = deps.net.myId();
      if (me !== null) {
        const s = cab.status(me);
        if (s === 'lost' || s === 'gone') { failGig('The fare cancelled.'); return; }
      }
    }
    if (loaded(g)) {
      chatterT -= dt;
      if (chatterT <= 0) {
        const line = pick(CHATTER[g.gig.personality].ride);
        toast(`${g.gig.client}: "${line}"`);
        speakAt(line, g.gig.seed, v.x, v.z);
        chatterT = g.gig.personality === 'chatty' ? 10 + Math.random() * 8 : 20 + Math.random() * 15;
      }
    }
  }

  function sampleOf(v: Vehicle): Sample {
    const boat = !!v.spec.boat;
    const hpLoss = lastHp === null ? 0 : Math.max(0, lastHp - v.hp);
    lastHp = v.hp;
    let wave = 0;
    if (boat) {
      waveSlope(v.x, v.z, waveTime(), tmp);
      wave = Math.hypot(tmp.x, tmp.z);
    }
    const above = boat ? v.y - (waterAt(v.x, v.z)?.surface ?? v.y) : aboveGround(v.x, v.y, v.z);
    const speed = Math.abs(v.speed);
    const pf = gig?.gig.playerFare;
    sample.x = v.x;
    sample.y = v.y;
    sample.z = v.z;
    sample.speed = speed;
    sample.yaw = v.yaw;
    sample.vy = v.vy;
    sample.aboveGround = above;
    sample.hpLoss = hpLoss;
    sample.ranOver = ranOver;
    sample.waveSlope = wave;
    sample.stalled = !!v.spec.fixedWing && above > 2 && speed < (v.spec.stallSpeed ?? 0);
    sample.action = actionFlag;
    sample.inVehicle = deps.player.vehicle === v && v.driver === 'player' && deps.player.seat === 0;
    sample.playerAboard = !!pf && deps.net.riders().some((r) => r.id === pf.from);
    ranOver = false;
    actionFlag = false;
    return sample;
  }

  // ---- Board, depots, calls ----
  function nearDepot(x: number, z: number): JobId | null {
    for (const s of built.spots) {
      if (s.job !== 'tubes' && Math.hypot(s.x - x, s.z - z) <= 3.5) return s.job;
    }
    return null;
  }

  function dutyBlocked(job: JobId): string | null {
    return deps.blocked() ?? (duty === job ? null : dutyWhy(job));
  }

  function boardView(): BoardView {
    const rows: BoardRow[] = JOB_IDS.map((job) => {
      const rec = store.get().jobs[job];
      const level = levelOf(rec.xp);
      const prog = levelProgress(rec.xp);
      return {
        job, title: JOBS[job].title, icon: JOBS[job].icon, employer: JOBS[job].employer, blurb: JOBS[job].blurb,
        level, xpInto: prog.into, xpNeed: prog.need, licensed: rec.licensed, licence: JOBS[job].licence,
        onDuty: duty === job, blocked: dutyBlocked(job), perks: perksFor(job, level).lines,
        done: rec.done, earned: rec.earned,
      };
    });
    const rider = cab.rider();
    const p = pos();
    const calls = duty === 'taxi' && dutyVehicle
      ? cab.open(dutyVehicle.x, dutyVehicle.z).map((c) => ({
        key: callKey(c.owner, c.call.id),
        label: `${c.call.name} -> ${placeById(c.call.dest)?.name ?? c.call.dest}, ${Math.round(Math.hypot(c.call.x - p.x, c.call.z - p.z))} m`,
      }))
      : [];
    const work: WorkRow[] = WORK_JOB_IDS.map((job) => {
      const def = WORK_JOBS[job];
      const rec = store.get().work[job];
      const prog = levelProgress(rec.xp);
      return {
        job, title: def.title, icon: def.icon, employer: def.employer, blurb: def.blurb,
        level: prog.level, levelTitle: workTitle(job, prog.level), xpInto: prog.into, xpNeed: prog.need,
        done: rec.done, earned: rec.earned, perks: workPerkLines(job, prog.level),
        place: def.place.name, routed: workRoute === job,
      };
    });
    return {
      rows,
      work,
      cab: {
        phase: rider.phase,
        driver: rider.driver !== null ? nameOf(rider.driver) : null,
        dest: rider.dest ? (placeById(rider.dest)?.name ?? rider.dest) : null,
      },
      places: LAND_PLACES.map((pl) => ({ id: pl.id, name: pl.name })),
      calls,
      online: deps.net.online(),
      shiftEarned: shift.earned,
    };
  }

  function openBoard(): void {
    board.open(boardView());
  }

  const actions: BoardActions = {
    duty: (job) => {
      const why = goOnDuty(job);
      if (why) toast(why);
    },
    offDuty: () => goOffDuty(),
    buyLicence: (job) => {
      const def = JOBS[job];
      const rec = store.get().jobs[job];
      if (rec.licensed) return;
      if (!deps.economy.spend(def.licence, 'Licence')) {
        toast('Not enough Acorns.');
        return;
      }
      rec.licensed = true;
      store.commit();
      toast(`${def.title} licence signed.`);
    },
    callCab: (dest) => {
      const why = callCab(dest);
      if (why) toast(why);
    },
    cancelCab: () => cab.cancel(),
    takeCall: (key) => {
      const why = takeKey(key);
      if (why) toast(why);
    },
    routeWork: (job) => {
      workRoute = job;
      toast(`Route set: ${WORK_JOBS[job].place.name}`);
      board.refresh(boardView());
    },
    clearRoute: () => {
      workRoute = null;
      board.refresh(boardView());
    },
  };
  const board = createJobBoard(deps.ui, actions);

  function callCab(dest: string): string | null {
    if (duty) return 'Go off duty first.';
    if (deps.player.vehicle) return 'Get out first.';
    const p = pos();
    const why = cab.call(dest, getMyGnome()?.name ?? 'A gnome', p.x, p.z);
    if (why) return why;
    toast(`Cab called to ${placeById(dest)?.name ?? dest}. A driver on Kerbstone duty will pick you up.`);
    return null;
  }

  function takeKey(key: string): string | null {
    if (duty !== 'taxi' || !dutyVehicle) return 'Go on taxi duty first.';
    if (gig) return 'Finish your current job first.';
    const why = cab.take(key);
    if (why) return why;
    const seen = cab.job();
    if (!seen) return 'That call is gone.';
    const v = dutyVehicle;
    const info: CallInfo = {
      key, owner: seen.owner, id: seen.call.id, name: seen.call.name, x: seen.call.x, z: seen.call.z, dest: seen.call.dest,
    };
    const level = levelFor('taxi');
    const perks = perksFor('taxi', level);
    const surge = surgeFor('taxi', deps.timeLabel(), seaState(), level, Math.random());
    const g = makePlayerFare(genCtx('taxi', v, level, perks, surge), info);
    if (!g) {
      cab.giveUp();
      return 'No route to that fare.';
    }
    startJob(g, perks, surge, v);
    return null;
  }

  function takeCall(): string | null {
    const d = dutyVehicle;
    if (!d) return 'Not on duty.';
    let best: SeenCall | null = null;
    let bestD = Infinity;
    for (const c of cab.open(d.x, d.z)) {
      const dd = Math.hypot(c.call.x - d.x, c.call.z - d.z);
      if (dd < bestD) { bestD = dd; best = c; }
    }
    if (!best) return 'No call waiting.';
    return takeKey(callKey(best.owner, best.call.id));
  }

  // ---- Wiring for the phone and the world ----
  deps.phone.addApp({
    id: 'jobs', label: 'Jobs', icon: '💼',
    detail: () => (duty ? 'On duty: ' + JOBS[duty].title : 'Taxi, courier, pilot, boat, chef, mechanic, comedian'),
    run: openBoard,
  });
  hud.onAction(() => {
    const label = actionLabel();
    if (label === 'Drop cargo') actionFlag = true;
    else if (label === 'Accept call') {
      const why = takeCall();
      if (why) toast(why);
    } else if (label === 'Next job') nextGigT = 0;
  });

  const depotBlips: Blip[] = built.spots.flatMap((s): Blip[] => (s.job === 'tubes' ? [] : [{
    x: s.x, z: s.z, color: JOBS[s.job].color, label: `${JOBS[s.job].icon} ${JOBS[s.job].depot.name}`,
  }]));

  // ---- Per frame ----
  function update(dt: number): void {
    const p = pos();
    cab.tick(p.x, p.z);
    // Drop the workplace route once the player is there (on foot or driving).
    if (workRoute) {
      const place = WORK_JOBS[workRoute].place;
      if (Math.hypot(place.x - p.x, place.z - p.z) <= 12) {
        workRoute = null;
        if (board.isOpen()) board.refresh(boardView());
      }
    }
    if (!duty || !dutyVehicle) {
      visuals.update(dt, p.x, p.z);
      return;
    }
    const job = duty;
    const pv = deps.player.vehicle;

    // Keep the duty on a vehicle the player drives (no gig running).
    if (!gig && pv && pv !== dutyVehicle && pv.driver === 'player' && deps.player.seat === 0 && vehicleOk(job, pv.spec, pv.kind)) {
      moveDuty(job, pv);
    }
    const dv = dutyVehicle;

    if (dv.exploded || dv.sunk || dv.hp <= 0) {
      toast('Your job vehicle is wrecked. Shift over.');
      goOffDuty();
      visuals.update(dt, p.x, p.z);
      return;
    }
    const inDuty = deps.player.vehicle === dv && dv.driver === 'player' && deps.player.seat === 0;
    if (!gig && !inDuty) {
      outT += dt;
      if (outT > J.outOfVehicleS * 1.5) {
        toast('You left the job vehicle too long. Shift over.');
        goOffDuty();
        visuals.update(dt, p.x, p.z);
        return;
      }
    } else {
      outT = 0;
    }

    const s = sampleOf(dv);
    if (!gig) {
      const spawnMult = perksFor(job, levelFor(job)).spawnMult *
        surgeFor(job, deps.timeLabel(), seaState(), levelFor(job), 1).spawnMult;
      nextGigT -= dt * spawnMult;
      if (nextGigT <= 0 && offerGig() !== null) nextGigT = 5;
    } else {
      const st = gig;
      const ev = stepGig(st, s, dt, !!gigSurge?.storm);
      if (ev?.t === 'reached') onReached(st, ev.stop, dv);
      else if (ev?.t === 'done') {
        onReached(st, st.gig.stops.length - 1, dv);
        finish(st, dv);
      } else if (ev?.t === 'failed') failGig(ev.reason);
      tickGig(dt, dv);
    }

    if (duty) hud.set(hudView(duty, dv));
    if (board.isOpen()) {
      boardT -= dt;
      if (boardT <= 0) {
        boardT = 0.5;
        board.refresh(boardView());
      }
    }
    visuals.update(dt, p.x, p.z);
  }

  return {
    update,
    waypoint() {
      const g = gig;
      if (g && duty && g.idx < g.gig.stops.length) {
        const stop = g.gig.stops[g.idx];
        return {
          x: stop.x, z: stop.z, color: JOBS[duty].color, label: stop.name,
          direct: duty === 'pilot' || duty === 'boat',
        };
      }
      // No gig stop: the workplace route from the board ("Show me").
      if (workRoute) {
        const def = WORK_JOBS[workRoute];
        return { x: def.place.x, z: def.place.z, color: def.color, label: def.place.name, direct: false };
      }
      return null;
    },
    blips() {
      const out: Blip[] = [];
      const g = gig;
      const color = duty ? JOBS[duty].color : '#ffd23f';
      if (g && g.idx < g.gig.stops.length) {
        const stop = g.gig.stops[g.idx];
        out.push({ x: stop.x, z: stop.z, color, kind: 'objective', label: stop.name });
        const next = g.gig.stops[g.idx + 1];
        if (next) out.push({ x: next.x, z: next.z, color });
      }
      if (duty === 'taxi' && dutyVehicle && !g) {
        for (const c of cab.open(dutyVehicle.x, dutyVehicle.z)) {
          out.push({ x: c.call.x, z: c.call.z, color: '#ffd23f', label: `Cab call: ${c.call.name}` });
        }
      }
      return out.concat(depotBlips);
    },
    prompt(x, z) {
      const job = nearDepot(x, z);
      return job ? `Talk to ${JOBS[job].giver} (${JOBS[job].title})` : null;
    },
    interact(x, z) {
      if (!nearDepot(x, z)) return false;
      openBoard();
      return true;
    },
    onRunOver() {
      ranOver = true;
    },
    stats: () => statsOf(store.get(), duty),
    onDuty: () => duty,
    goOnDuty,
    goOffDuty,
    forceGig(kind) {
      if (!duty) return 'Not on duty.';
      if (gig) return 'A job is already running.';
      return offerGig(kind);
    },
    addXp(job, xp) {
      const rec = store.get().jobs[job];
      const before = levelOf(rec.xp);
      rec.xp += xp;
      store.commit();
      const after = levelOf(rec.xp);
      if (after > before) deps.hud.banner(`${JOBS[job].title} level ${after}`);
      if (anyJobAtLevel(store.get(), 5)) deps.unlock(JOB_ACHIEVEMENTS.career);
    },
    callCab,
    takeCall,
    debug(): JobsDebug {
      const p = pos();
      const g = gig;
      const next = g && g.idx < g.gig.stops.length ? g.gig.stops[g.idx] : null;
      const rider = cab.rider();
      return {
        duty,
        gig: g ? {
          kind: g.gig.kind, idx: g.idx, stops: g.gig.stops.length, phase: g.phase, t: g.t,
          comfort: g.comfort.score, next: next ? { x: next.x, z: next.z } : null,
        } : null,
        cab: { phase: rider.phase, driver: rider.driver },
        openCalls: cab.open(p.x, p.z).length,
        earnedShift: shift.earned,
        fares: faresDone,
      };
    },
  };
}
