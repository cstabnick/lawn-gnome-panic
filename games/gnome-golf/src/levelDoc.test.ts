import { describe, expect, it } from 'vitest';
import { validateLevelDoc } from '@lawn/level';
import { COURSE_DOC } from './levelDoc';
import { HOLES } from './config';

describe('island level document', () => {
  it('passes the shared level validator', () => {
    expect(validateLevelDoc(COURSE_DOC)).toEqual([]);
  });

  it('has nine holes', () => {
    expect(HOLES.length).toBe(9);
    expect(COURSE_DOC.data.holes.length).toBe(9);
  });

  it('indexes every hole’s tee, pin and green as markers', () => {
    HOLES.forEach((h, i) => {
      const n = i + 1;
      const at = (id: string) => COURSE_DOC.markers.find((m) => m.id === id);
      const tee = at(`tee-${n}`);
      const pin = at(`pin-${n}`);
      const green = at(`green-${n}`);
      expect(tee && { x: tee.x, z: tee.z }).toEqual(h.tee);
      expect(pin && { x: pin.x, z: pin.z }).toEqual(h.pin);
      expect(green && { x: green.x, z: green.z, r: green.r }).toEqual({ x: h.green.x, z: h.green.z, r: h.green.r });
    });
  });

  it('round-trips through JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(COURSE_DOC))).toEqual(COURSE_DOC);
  });
});
