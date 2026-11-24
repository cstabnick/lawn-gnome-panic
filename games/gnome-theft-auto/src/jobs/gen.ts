// Sim jobs: gig generators. Pure: everything comes in through GenCtx (rng, road nodes, level, perks, surge, vehicle).
import type { Gig, GigKind, JobPerks, ParcelKind, Personality, Stop, Surge, VehicleKind } from './types';
import { JOB_TUNING as J } from './defs';
import { AIR_PADS, DROP_ZONES, FERRY_LOOP, LAND_PLACES, SKY_SIGHTS, STREETS, WATER_STOPS, placeById } from './places';
import type { Place } from './places';

export interface GenVehicle {
  kind: VehicleKind;
  /** Passenger seats (seats.ts passengerCount). */
  seats: number;
  mass: number;
  flies: boolean;
  fixedWing: boolean;
  boat: boolean;
}

export interface GenCtx {
  /** 0..1, deterministic in tests. */
  rng: () => number;
  /** Where the job vehicle is. */
  from: { x: number; z: number };
  level: number;
  perks: JobPerks;
  surge: Surge;
  /** Ground road nodes (no skyway decks): kerb pickups and address snapping. */
  roads: readonly { x: number; z: number }[];
  vehicle: GenVehicle;
  /** The job's depot spot (visuals.buildDepots), where courier rounds load and pilot gigs start; null if none. */
  home: { x: number; z: number } | null;
}

export interface CallInfo {
  key: string;
  owner: number;
  id: number;
  name: string;
  x: number;
  z: number;
  dest: string;
}

const FIRST_NAMES = ['Bess', 'Tilly', 'Mabel', 'Ursula', 'Dot', 'Nettie', 'Peony', 'Hazel', 'Clover', 'Mildred', 'Ivy', 'Edna'];
const LAST_NAMES = [
  'Rootley', 'Thimble', 'Mudge', 'Sprocket', 'Barrowby', 'Pebbleton', 'Hedgewick', 'Trowell', 'Bramblecombe',
  'Fernsby', 'Spadeworth', 'Greenacre',
];
const TAXI_PERSONALITIES: readonly Personality[] = ['plain', 'hurry', 'nervous', 'chatty'];

function pick<T>(list: readonly T[], c: GenCtx): T {
  return list[Math.floor(c.rng() * list.length)];
}

function dist(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

function clientName(c: GenCtx): string {
  return `${pick(FIRST_NAMES, c)} ${pick(LAST_NAMES, c)}`;
}

/** The whole path length through `points` in order. */
function pathLength(points: readonly { x: number; z: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/** Nearest road node to (x, z), or (x, z) itself when there are none. */
export function nearestRoad(roads: readonly { x: number; z: number }[], x: number, z: number): { x: number; z: number } {
  let best: { x: number; z: number } | null = null;
  let bestD = Infinity;
  for (const r of roads) {
    const d = Math.hypot(r.x - x, r.z - z);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best ? { x: best.x, z: best.z } : { x, z };
}

export function makeTaxiFare(c: GenCtx): Gig | null {
  const v = c.vehicle;
  if (!(v.seats >= 1 && !v.flies && !v.boat)) return null;
  const T = J.taxi;
  const pickups = c.roads.filter((r) => {
    const d = dist(c.from, r);
    return d >= T.pickupMin && d <= T.pickupMax;
  });
  if (pickups.length === 0) return null;
  const pickup = pick(pickups, c);

  const areas: Place[] = LAND_PLACES.filter((p) => c.level >= 4 || p.area === 'city');
  const dests = areas
    .map((p) => ({ p, at: nearestRoad(c.roads, p.x, p.z) }))
    .filter((d) => dist(pickup, d.at) >= T.destMin);
  if (dests.length === 0) return null;
  const { p: place, at: drop } = pick(dests, c);

  const client = clientName(c);
  const personality: Personality = c.surge.celebrity ? 'celebrity' : pick(TAXI_PERSONALITIES, c);
  const d = dist(pickup, drop);
  const lead = dist(c.from, pickup);
  const stops: Stop[] = [
    {
      id: 'kerb', name: `${client} at the kerb`, x: pickup.x, z: pickup.z, action: 'pickup',
      radius: T.pickupRadius, maxSpeed: T.maxSpeed, dwell: T.dwell,
      hardDue: T.patience, hardReason: `${client} gave up waiting.`,
    },
    {
      id: place.id, name: place.name, x: drop.x, z: drop.z, action: 'drop',
      radius: T.dropRadius, maxSpeed: T.maxSpeed, dwell: T.dwell,
    },
  ];
  return {
    job: 'taxi', kind: 'fare', title: `Fare: ${client}`, client, personality, stops,
    basePay: Math.round(T.base + T.perM * d),
    timeLimit: Math.round((lead + d) / T.cruise + T.slack),
    passengers: 1, parcels: [], seed: Math.floor(c.rng() * 1e6),
  };
}

export function makeCourierRoute(c: GenCtx): Gig | null {
  const v = c.vehicle;
  if (v.flies || v.boat || !c.home) return null;
  const C = J.courier;
  const home = c.home;
  const cap = Math.min(c.perks.capacity, v.kind === 'push-bike' ? C.bikeCap : C.defaultCap);
  const n = Math.max(1, Math.min(cap, 2 + Math.floor(c.rng() * cap)));
  const maxD = c.level >= 4 ? 900 : 400;
  const spots = c.roads.filter((r) => {
    const d = dist(home, r);
    return d >= 60 && d <= maxD;
  });
  if (spots.length === 0) return null;

  const kinds: ParcelKind[] = ['mail', 'food', 'fragile'];
  if (v.mass >= C.heavyMass) kinds.push('heavy');
  if (c.level >= 3) kinds.push('vip');

  const stops: Stop[] = [{
    id: 'depot', name: 'Pigeon-Drop depot', x: home.x, z: home.z, action: 'pickup',
    radius: C.loadRadius, maxSpeed: C.maxSpeed, dwell: C.loadDwell,
  }];
  let prev = home;
  let elapsed = 0;
  let pay = 0;
  const parcels: ParcelKind[] = [];
  for (let k = 0; k < n; k++) {
    const at = pick(spots, c);
    const street = `${10 + Math.floor(c.rng() * 90)} ${pick(STREETS, c)}`;
    const kind = pick(kinds, c);
    const legTime = (dist(prev, at) / C.cruise + C.slack) * (kind === 'food' || kind === 'vip' ? 0.75 : 1);
    elapsed += legTime;
    pay += C.pay[kind];
    parcels.push(kind);
    stops.push({
      id: `addr-${k + 1}`, name: street, x: at.x, z: at.z, action: 'drop',
      radius: C.dropRadius, maxSpeed: C.maxSpeed, dwell: C.dwell,
      due: Math.round(elapsed), parcel: kind,
    });
    prev = at;
  }
  return {
    job: 'courier', kind: 'route', title: `Pigeon-Drop round (${n} parcels)`, client: 'Pigeon-Drop Couriers',
    personality: 'plain', stops, basePay: pay, timeLimit: Math.round(elapsed), passengers: 0, parcels,
    seed: Math.floor(c.rng() * 1e6),
  };
}

function landStop(id: string, name: string, x: number, z: number, radius: number): Stop {
  const P = J.pilot;
  return { id, name, x, z, action: 'land', radius, maxSpeed: P.landSpeed, dwell: P.landDwell };
}

function gateStop(s: Place): Stop {
  const P = J.pilot;
  return {
    id: `gate-${s.id}`, name: `Over ${s.name}`, x: s.x, z: s.z, action: 'gate', radius: P.gateRadius,
    maxSpeed: 0, dwell: 0, minAlt: P.gateMinAlt, maxAlt: P.gateMaxAlt,
  };
}

export function makePilotGig(c: GenCtx, kind: GigKind): Gig | null {
  const v = c.vehicle;
  if (!v.flies || !c.home) return null;
  const P = J.pilot;
  const home = c.home;
  const stand = landStop('stand', 'Airfield stand', home.x, home.z, P.landRadius * 2);
  const airfield = (): Stop => landStop('airfield', 'Airfield', home.x, home.z, P.landRadius);
  const passengers = Math.min(1, v.seats);
  let client = clientName(c);
  let stops: Stop[];
  let basePay: number;
  let title: string;

  if (kind === 'charter') {
    if (v.fixedWing) {
      const sight = pick(SKY_SIGHTS, c);
      stops = [stand, gateStop(sight), airfield()];
      title = 'Charter to Airfield';
    } else {
      const pad = pick(AIR_PADS.slice(1), c);
      stops = [stand, landStop(pad.id, pad.name, pad.x, pad.z, P.landRadius)];
      title = `Charter to ${pad.name}`;
    }
    basePay = P.charterBase + P.perM * pathLength([home, ...stops.slice(1)]);
  } else if (kind === 'scenic') {
    if (SKY_SIGHTS.length < 3) return null;
    const pool = [...SKY_SIGHTS];
    const picks: Place[] = [];
    for (let i = 0; i < 3; i++) picks.push(pool.splice(Math.floor(c.rng() * pool.length), 1)[0]);
    stops = [stand, ...picks.map(gateStop), airfield()];
    basePay = P.scenicBase;
    title = 'Scenic flight (3 sights)';
  } else if (kind === 'cargo') {
    const zone = pick(DROP_ZONES, c);
    stops = [
      stand,
      { id: zone.id, name: zone.name, x: zone.x, z: zone.z, action: 'cargo', radius: P.cargoRadius, maxSpeed: P.landSpeed, dwell: 0 },
      airfield(),
    ];
    basePay = P.cargoBase;
    title = `Cargo drop: ${zone.name}`;
    client = "Wally's Charters";
  } else {
    return null;
  }

  const route = pathLength([home, ...stops.slice(1).map((s) => ({ x: s.x, z: s.z }))]);
  return {
    job: 'pilot', kind, title, client, personality: 'plain', stops, basePay: Math.round(basePay),
    timeLimit: Math.round(route / P.cruise + P.slack), passengers: kind === 'cargo' ? 0 : passengers, parcels: [],
    seed: Math.floor(c.rng() * 1e6),
  };
}

export function makeBoatGig(c: GenCtx, kind: GigKind): Gig | null {
  if (!c.vehicle.boat) return null;
  const B = J.boat;
  if (kind === 'water-taxi') {
    let near: Place | null = null;
    let nearD = Infinity;
    for (const s of WATER_STOPS) {
      const d = dist(c.from, s);
      if (d < nearD) { nearD = d; near = s; }
    }
    if (!near || nearD > 400) return null;
    const dests = WATER_STOPS.filter((s) => s.area === near!.area && s.id !== near!.id && dist(near!, s) >= 60);
    if (dests.length === 0) return null;
    const dest = pick(dests, c);
    const d = dist(near, dest);
    const lead = dist(c.from, near);
    const passengers = Math.max(1, Math.min(c.vehicle.seats, 1 + Math.floor(c.rng() * c.perks.capacity)));
    const stops: Stop[] = [
      { id: near.id, name: near.name, x: near.x, z: near.z, action: 'pickup', radius: B.dockRadius, maxSpeed: B.maxSpeed, dwell: B.dwell },
      { id: dest.id, name: dest.name, x: dest.x, z: dest.z, action: 'drop', radius: B.dockRadius, maxSpeed: B.maxSpeed, dwell: B.dwell },
    ];
    return {
      job: 'boat', kind, title: `Water taxi to ${dest.name}`, client: clientName(c),
      personality: pick(TAXI_PERSONALITIES, c), stops, basePay: Math.round(B.base + B.perM * d),
      timeLimit: Math.round(d / B.cruise + B.slack + lead / B.cruise), passengers, parcels: [],
      seed: Math.floor(c.rng() * 1e6),
    };
  }
  if (kind === 'ferry') {
    let nearId = FERRY_LOOP[0];
    let nearD = Infinity;
    for (const id of FERRY_LOOP) {
      const s = WATER_STOPS.find((w) => w.id === id);
      if (!s) continue;
      const d = dist(c.from, s);
      if (d < nearD) { nearD = d; nearId = id; }
    }
    if (nearD > 300) return null;
    const at = FERRY_LOOP.indexOf(nearId);
    const order = [...FERRY_LOOP.slice(at), ...FERRY_LOOP.slice(0, at)];
    const stops: Stop[] = order.map((id, i) => {
      const s = WATER_STOPS.find((w) => w.id === id)!;
      return {
        id: s.id, name: s.name, x: s.x, z: s.z, action: 'drop', radius: B.dockRadius, maxSpeed: B.maxSpeed,
        dwell: B.dwell, due: (i + 1) * B.ferryLeg, board: 1 + Math.floor(c.rng() * 2),
      };
    });
    return {
      job: 'boat', kind, title: `Steamer loop (${stops.length} stops)`, client: 'Loch Moss Steamer Co.',
      personality: pick(TAXI_PERSONALITIES, c), stops, basePay: B.ferryPay,
      timeLimit: FERRY_LOOP.length * B.ferryLeg, passengers: Math.min(c.vehicle.seats, 2), parcels: [],
      seed: Math.floor(c.rng() * 1e6),
    };
  }
  return null;
}

/** A real player's cab: pick them up where they stand, drop them at place `call.dest`. */
export function makePlayerFare(c: GenCtx, call: CallInfo): Gig | null {
  const v = c.vehicle;
  if (!(v.seats >= 1 && !v.flies)) return null;
  const dest = placeById(call.dest);
  if (!dest) return null;
  const T = J.taxi;
  const pickup = { x: call.x, z: call.z };
  const drop = nearestRoad(c.roads, dest.x, dest.z);
  const d = dist(pickup, drop);
  const lead = dist(c.from, pickup);
  const stops: Stop[] = [
    {
      id: 'kerb', name: `${call.name} at the kerb`, x: pickup.x, z: pickup.z, action: 'pickup', radius: 15,
      maxSpeed: T.maxSpeed, dwell: 0.5, needsPlayer: true, hardDue: 180, hardReason: `${call.name} gave up on the cab.`,
    },
    {
      id: dest.id, name: dest.name, x: drop.x, z: drop.z, action: 'drop', radius: T.dropRadius,
      maxSpeed: T.maxSpeed, dwell: T.dwell,
    },
  ];
  return {
    job: 'taxi', kind: 'player-fare', title: `Fare: ${call.name}`, client: call.name, personality: 'plain', stops,
    playerFare: { key: call.key, id: call.id, from: call.owner }, basePay: Math.round(T.base + T.perM * d),
    timeLimit: Math.round((lead + d) / T.cruise + T.slack), passengers: 0, parcels: [],
    seed: Math.floor(c.rng() * 1e6),
  };
}
