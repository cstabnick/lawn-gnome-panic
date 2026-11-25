// Rootwell's contract data (campus/types.ts) checked against its E01 sites, the roads and the flight model. Pure data,
// plus one fixed-wing flight on Rootwell Field. No scene.
import { describe, expect, it } from 'vitest';
import { AIRFIELDS, HIGHWAYS, ROAD_WIDTH, ROOTWELL_AIRFIELD, VEHICLES } from '../config';
import { initAir, stepAir } from '../craft/flight';
import type { AirBody } from '../craft/model';
import { inSite, siteRect } from '../sites';
import { STUNT_RAMPS } from '../stunts';
import {
  CAMPUS, CAMPUS_BUILDINGS, type CampusBuilding, OBSERVATORY, ROOTWELL_FIELD, WIND_FARM,
} from './types';

type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
type Pt = { x: number; z: number };

/** A building's footprint: w along x when its front faces north or south, d along x when it faces east or west. */
function footprint(b: CampusBuilding): Rect {
  const across = Math.abs(Math.cos(b.yaw)) < 0.5;
  const hw = (across ? b.d : b.w) / 2;
  const hd = (across ? b.w : b.d) / 2;
  return { minX: b.x - hw, maxX: b.x + hw, minZ: b.z - hd, maxZ: b.z + hd };
}

const overlaps = (a: Rect, b: Rect): boolean =>
  a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
const inside = (p: Pt, r: Rect): boolean =>
  p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ;
const rectInside = (a: Rect, b: Rect): boolean =>
  a.minX >= b.minX && a.maxX <= b.maxX && a.minZ >= b.minZ && a.maxZ <= b.maxZ;
const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Distance from a point to a segment a-b. */
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2));
  return dist(p, { x: a.x + dx * t, z: a.z + dz * t });
}

/** Smallest distance between a rectangle and a segment (sampled over the rectangle every 0.5 m). */
function rectSegDist(r: Rect, a: Pt, b: Pt): number {
  const nx = Math.max(1, Math.ceil((r.maxX - r.minX) / 0.5));
  const nz = Math.max(1, Math.ceil((r.maxZ - r.minZ) / 0.5));
  let best = Infinity;
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      const p = { x: r.minX + ((r.maxX - r.minX) * i) / nx, z: r.minZ + ((r.maxZ - r.minZ) * j) / nz };
      best = Math.min(best, segDist(p, a, b));
    }
  }
  return best;
}

const segments = HIGHWAYS.flatMap((h) =>
  h.points.slice(0, -1).map((p, i) => ({ a: { x: p[0], z: p[1] }, b: { x: h.points[i + 1][0], z: h.points[i + 1][1] } })),
);
const ROAD_CLEAR = ROAD_WIDTH / 2 + 2;

describe('Rootwell University (campus)', () => {
  const campus = siteRect('campus');
  const footprints = CAMPUS_BUILDINGS.map(footprint);
  const drive: Rect = { minX: 946, maxX: 1080, minZ: -204, maxZ: -196 };

  it('keeps every footprint inside the campus site', () => {
    footprints.forEach((f, i) => expect(rectInside(f, campus), CAMPUS_BUILDINGS[i].id).toBe(true));
  });

  it('keeps the footprints apart and off the quad, the car park and the drive', () => {
    footprints.forEach((f, i) => {
      const id = CAMPUS_BUILDINGS[i].id;
      footprints.forEach((g, j) => {
        if (j > i) expect(overlaps(f, g), `${id} vs ${CAMPUS_BUILDINGS[j].id}`).toBe(false);
      });
      expect(overlaps(f, CAMPUS.quad), `${id} vs quad`).toBe(false);
      expect(overlaps(f, CAMPUS.parking), `${id} vs parking`).toBe(false);
      expect(overlaps(f, drive), `${id} vs drive`).toBe(false);
    });
  });

  it('puts each door outside every footprint and inside the site', () => {
    CAMPUS_BUILDINGS.forEach((b) => {
      expect(inSite('campus', b.door.x, b.door.z), `${b.id} door in site`).toBe(true);
      footprints.forEach((f) => expect(inside(b.door, f), `${b.id} door clear of footprints`).toBe(false));
    });
  });

  it('has twelve tour buildings', () => {
    expect(CAMPUS_BUILDINGS.filter((b) => b.tour)).toHaveLength(12);
  });

  it('keeps the buildings, quad, car park and sugar store off the roads', () => {
    footprints.forEach((f, i) => {
      for (const s of segments) {
        expect(rectSegDist(f, s.a, s.b), `${CAMPUS_BUILDINGS[i].id} to road`).toBeGreaterThanOrEqual(ROAD_CLEAR);
      }
    });
    for (const s of segments) {
      expect(rectSegDist(CAMPUS.quad, s.a, s.b), 'quad to road').toBeGreaterThanOrEqual(ROAD_CLEAR);
      expect(rectSegDist(CAMPUS.parking, s.a, s.b), 'parking to road').toBeGreaterThanOrEqual(ROAD_CLEAR);
      expect(segDist(CAMPUS.sugarStore, s.a, s.b), 'sugar store to road').toBeGreaterThanOrEqual(ROAD_CLEAR);
    }
  });
});

describe('The Anthill, its observatory and Dean\'s Leap', () => {
  const mound = siteRect('observatory-mound');
  const ramp = STUNT_RAMPS.find((r) => r.id === 'deans-leap');
  const dome = OBSERVATORY.dome;
  const summit = OBSERVATORY.summit;
  const runUp = [OBSERVATORY.runUp.from, OBSERVATORY.runUp.to];
  const inMound = (p: Pt) => p.x >= mound.minX && p.x <= mound.maxX && p.z >= mound.minZ && p.z <= mound.maxZ;

  it('keeps the summit, dome, door, run-up, road and ant doors inside the mound site', () => {
    const points: Pt[] = [
      summit, dome, OBSERVATORY.door, OBSERVATORY.runUp.from, OBSERVATORY.runUp.to, OBSERVATORY.roadEnd,
      ...OBSERVATORY.antDoors,
    ];
    points.forEach((p) => expect(inMound(p)).toBe(true));
  });

  it('keeps the dome on the flattened summit and the run-up 4 m clear of it', () => {
    expect(dist(dome, summit) + dome.r).toBeLessThanOrEqual(OBSERVATORY.flatR);
    for (let i = 0; i <= 20; i++) {
      const p = { x: runUp[0].x + ((runUp[1].x - runUp[0].x) * i) / 20, z: runUp[0].z + ((runUp[1].z - runUp[0].z) * i) / 20 };
      expect(dist(p, dome)).toBeGreaterThanOrEqual(dome.r + 4);
    }
  });

  it('has Dean\'s Leap on the north rim, facing north, centred on the summit', () => {
    expect(ramp).toBeDefined();
    expect(ramp!.yaw).toBeCloseTo(Math.PI, 6);
    expect(dist(ramp!, summit)).toBeLessThanOrEqual(OBSERVATORY.flatR);
    expect(ramp!.z - ramp!.length / 2).toBeLessThan(summit.z);
  });

  it('keeps the landing area clear of the dome, the door and the ant doors', () => {
    const c = OBSERVATORY.leapClear;
    expect(inside(dome, c)).toBe(false);
    expect(inside(OBSERVATORY.door, c)).toBe(false);
    OBSERVATORY.antDoors.forEach((d) => expect(inside(d, c)).toBe(false));
    // The dome circle itself must not reach into the clear area.
    const nx = Math.max(c.minX, Math.min(dome.x, c.maxX));
    const nz = Math.max(c.minZ, Math.min(dome.z, c.maxZ));
    expect(dist({ x: nx, z: nz }, dome)).toBeGreaterThan(dome.r);
  });
});

describe('Rootwell Field (second runway)', () => {
  const site = siteRect('runway-2');
  const runway = ROOTWELL_FIELD.runway;
  const runwayRect: Rect = {
    minX: runway.x - runway.width / 2, maxX: runway.x + runway.width / 2,
    minZ: runway.z - runway.length / 2, maxZ: runway.z + runway.length / 2,
  };
  const { apron, taxiway, pad } = ROOTWELL_FIELD;
  const padRect: Rect = { minX: pad.x - pad.r, maxX: pad.x + pad.r, minZ: pad.z - pad.r, maxZ: pad.z + pad.r };
  const spots = ROOTWELL_AIRFIELD.planeSpots;

  it('has two airfields, with Rootwell Field matching its runway data', () => {
    expect(AIRFIELDS).toHaveLength(2);
    expect(ROOTWELL_AIRFIELD.x).toBe(runway.x);
    expect(ROOTWELL_AIRFIELD.z).toBe(runway.z);
    expect(ROOTWELL_AIRFIELD.yaw).toBe(runway.yaw);
    expect(ROOTWELL_AIRFIELD.length).toBe(runway.length);
    expect(ROOTWELL_AIRFIELD.width).toBe(runway.width);
  });

  it('keeps the runway, apron, taxiway and pad inside the site', () => {
    expect(rectInside(runwayRect, site)).toBe(true);
    expect(rectInside(apron, site)).toBe(true);
    expect(rectInside(taxiway, site)).toBe(true);
    expect(rectInside(padRect, site)).toBe(true);
  });

  it('spaces the plane spots out, keeps them off the runway and inside the site', () => {
    spots.forEach((s, i) => {
      expect(inside(s, site), `spot ${i} in site`).toBe(true);
      expect(inside(s, runwayRect), `spot ${i} off runway`).toBe(false);
      spots.forEach((t, j) => {
        if (j > i) expect(dist(s, t), `spots ${i} and ${j}`).toBeGreaterThanOrEqual(12);
      });
    });
    const dealer = siteRect('aircraft-dealer');
    spots.forEach((s) => expect(inside(s, dealer)).toBe(false));
  });
});

describe('Pinwheel Ridge (wind farm)', () => {
  const site = siteRect('wind-farm');
  const { pinwheels, hut, substation } = WIND_FARM;

  it('places ten pinwheels in the site, 30 m apart', () => {
    expect(pinwheels).toHaveLength(10);
    pinwheels.forEach((p) => expect(inSite('wind-farm', p.x, p.z)).toBe(true));
    for (let i = 1; i < pinwheels.length; i++) {
      expect(pinwheels[i].x - pinwheels[i - 1].x).toBe(30);
    }
  });

  it('keeps the hut and substation in the site and 10 m from every pinwheel', () => {
    expect(inside(hut, site)).toBe(true);
    expect(inside(substation, site)).toBe(true);
    for (const p of pinwheels) {
      expect(dist(hut, p)).toBeGreaterThanOrEqual(10);
      expect(dist(substation, p)).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('Hedge-Hopper on Rootwell Field', () => {
  const DT = 1 / 60;
  const spec = VEHICLES['hedge-hopper'].air!;
  const runway = ROOTWELL_FIELD.runway;
  const north = runway.z - runway.length / 2;
  const south = runway.z + runway.length / 2;
  const onRunway = (z: number) => z >= north && z <= south;

  /** Full throttle until airborne, climb to 20 m at half throttle, then throttle back and sink about 2.6 m/s until it
   *  touches down (from the north threshold it lands near z 700, well inside the 420 m runway). */
  function flight(startZ: number) {
    const body: AirBody = { x: runway.x, y: 0, z: startZ, yaw: 0, speed: 0, vy: 0 };
    const st = initAir();
    const env = { floorY: 0, water: false };
    let takeoff: Pt | undefined;
    let touchdown: Pt | undefined;
    let phase: 'takeoff' | 'climb' | 'descend' = 'takeoff';
    for (let i = 0; i < 60 * 60 && !touchdown; i++) {
      if (phase === 'takeoff') {
        stepAir(body, st, spec, { throttle: 1, steer: 0, lift: 1, powered: true }, env, DT);
        if (st.airborne) { takeoff = { x: body.x, z: body.z }; phase = 'climb'; }
      } else if (phase === 'climb') {
        stepAir(body, st, spec, { throttle: 0.5, steer: 0, lift: 0.6, powered: true }, env, DT);
        if (body.y >= 20) phase = 'descend';
      } else {
        stepAir(body, st, spec, { throttle: 0, steer: 0, lift: -0.2, powered: true }, env, DT);
        if (!st.airborne && body.y <= 0.1) touchdown = { x: body.x, z: body.z };
      }
    }
    return { takeoff, touchdown, body, st };
  }

  it('takes off from the runway and lands on it again', () => {
    const f = flight(north + 10);
    expect(f.takeoff).toBeDefined();
    expect(onRunway(f.takeoff!.z)).toBe(true);
    expect(f.touchdown).toBeDefined();
    expect(f.touchdown!.z).toBeGreaterThan(north);
    expect(f.touchdown!.z).toBeLessThan(south);
    expect(f.body.y).toBeLessThanOrEqual(0.1);
    expect(f.st.airborne).toBe(false);
  });
});
