import '../questSim/globals';
import { beforeAll, describe, expect, it } from 'vitest';
import { AIRFIELD, ROOTWELL_AIRFIELD } from '../config';
import { GNOMECINO_DOOR } from '../portal/gnomecinoDoor';
import { pushOutOfBoxes } from '../collide';
import { deckContactsAt } from '../highways/deck';
import { waterAt } from '../terrain';
import { buildSimWorld, type SimWorld } from '../questSim/harness';
import { AMBULANCE_STOPS, DROP_ZONES, SKY_BEHAVIOURS } from './behaviours';

// Sky-traffic fixed points that the NPC flights touch on or near the ground must be on legal ground: dry land, off the
// skyway decks and clear of colliders. A failure names the point and what is wrong with it.

/** The crop-duster field and its anchor (behaviours.ts). */
const CROP_FIELD = { x: 40, z: 440, w: 160, d: 90 } as const;

/** The airfield circuit's parking offset from the airfield centre (behaviours.ts). */
const PARKING_OFFSET = { x: -40, z: -22 } as const;

function problems(sim: SimWorld, x: number, z: number, r: number): string[] {
  const out: string[] = [];
  if (pushOutOfBoxes(x, z, r, sim.world.boxes, 0).hit) out.push('in a box');
  if (waterAt(x, z) !== null) out.push('on water');
  if (deckContactsAt(x, z).length > 0) out.push('on a skyway deck');
  return out;
}

const fmt = (p: { x: number; z: number }) => `(${p.x}, ${p.z})`;

describe('sky-traffic places are on legal ground', () => {
  let sim: SimWorld;
  beforeAll(() => {
    sim = buildSimWorld();
  }, 60_000);

  describe('drop zones (r 4)', () => {
    DROP_ZONES.forEach((p, i) => {
      it(`mail-drop zone ${i} ${fmt(p)}`, () => {
        expect(problems(sim, p.x, p.z, 4)).toEqual([]);
      });
    });
  });

  describe('ambulance stops (r 4)', () => {
    AMBULANCE_STOPS.forEach((p, i) => {
      it(`ambulance stop ${i} ${fmt(p)}`, () => {
        expect(problems(sim, p.x, p.z, 4)).toEqual([]);
      });
    });
  });

  it('airfield-circuit parking (r 3)', () => {
    const p = { x: AIRFIELD.x + PARKING_OFFSET.x, z: AIRFIELD.z + PARKING_OFFSET.z };
    expect(problems(sim, p.x, p.z, 3), `parking at ${fmt(p)}`).toEqual([]);
  });

  it('rootwell-circuit parking (r 3)', () => {
    const p = { x: 1250, z: 545 };
    expect(problems(sim, p.x, p.z, 3), `parking at ${fmt(p)}`).toEqual([]);
  });

  describe('crop-duster field', () => {
    const { x, z, w, d } = CROP_FIELD;
    const anchor = SKY_BEHAVIOURS.find((b) => b.id === 'crop-duster')?.anchor;

    it('anchor equals the field centre', () => {
      expect(anchor).toEqual({ x, z });
    });

    it('centre is dry and off decks', () => {
      expect(waterAt(x, z), 'water at centre').toBeNull();
      expect(deckContactsAt(x, z), 'deck at centre').toEqual([]);
    });

    it.each([
      ['north-west', x - w / 2, z - d / 2],
      ['north-east', x + w / 2, z - d / 2],
      ['south-west', x - w / 2, z + d / 2],
      ['south-east', x + w / 2, z + d / 2],
    ])('corner %s is dry and off decks', (_name, cx, cz) => {
      expect(waterAt(cx, cz), `water at (${cx}, ${cz})`).toBeNull();
      expect(deckContactsAt(cx, cz), `deck at (${cx}, ${cz})`).toEqual([]);
    });

    it('at least 80 % of a 10 m grid over the field is clear of boxes', () => {
      let total = 0;
      let clear = 0;
      for (let gx = x - w / 2; gx <= x + w / 2 + 1e-9; gx += 10) {
        for (let gz = z - d / 2; gz <= z + d / 2 + 1e-9; gz += 10) {
          total++;
          if (!pushOutOfBoxes(gx, gz, 0, sim.world.boxes, 0).hit) clear++;
        }
      }
      expect(clear / total).toBeGreaterThanOrEqual(0.8);
    });
  });

  // The Gnomecino door is read from portal/ and must not be edited here. If the door is not on legal ground, this test
  // is skipped (see the report) rather than moving the door.
  it('Gnomecino door (r 0.5) is clear of boxes and dry', () => {
    const p = GNOMECINO_DOOR;
    expect(problems(sim, p.x, p.z, 0.5)).toEqual([]);
  });
});
