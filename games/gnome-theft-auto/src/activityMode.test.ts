import { afterEach, describe, expect, it } from 'vitest';
import {
  PEACEFUL_INTERIORS, activityHidesGun, currentTouchActivity, onTouchActivityChange, resetActivityMode, setActivityOn,
  setInteriorSource, setTouchActivity, type ActivityKey,
} from './activityMode';
import { CLUBHOUSE_INTERIOR } from './golf/types';
import { FLAT_ID } from './home/types';
import { DIGGS_BUNGALOW_INTERIOR, TOWNHOUSE_404_INTERIOR } from './homes/interiors';
import { SOCIETY_INTERIORS } from './societies/config';

afterEach(() => resetActivityMode());

describe('activityHidesGun (D30)', () => {
  it('is false on the street with nothing running', () => {
    expect(activityHidesGun()).toBe(false);
    setInteriorSource(() => 'test-gate-room');
    expect(activityHidesGun()).toBe(false);
  });

  const keys: ActivityKey[] = ['golf', 'comedy', 'court', 'skate', 'winter', 'chef', 'gnomazon', 'lift', 'hose', 'farm', 'shift', 'workplace'];
  for (const k of keys) {
    it(`is true during ${k} and false again after`, () => {
      setActivityOn(k, true);
      expect(activityHidesGun()).toBe(true);
      setActivityOn(k, false);
      expect(activityHidesGun()).toBe(false);
    });
  }

  it('is true in every peaceful interior', () => {
    for (const id of PEACEFUL_INTERIORS) {
      setInteriorSource(() => id);
      expect(activityHidesGun()).toBe(true);
    }
  });

  it('lists the real interior ids', () => {
    for (const id of [FLAT_ID, TOWNHOUSE_404_INTERIOR, DIGGS_BUNGALOW_INTERIOR, CLUBHOUSE_INTERIOR, SOCIETY_INTERIORS.moleman, SOCIETY_INTERIORS.tent, 'bodega', 'double-pot-sales', 'pl-cafe-pardon']) {
      expect(PEACEFUL_INTERIORS).toContain(id);
    }
  });
});

describe('touch activity', () => {
  it('merges layouts and tells listeners only on a change', () => {
    const heard: unknown[] = [];
    const off = onTouchActivityChange((t) => heard.push(t));
    setTouchActivity('winter', { stick: true, buttons: ['enter'] });
    setTouchActivity('winter', { stick: true, buttons: ['enter'] });
    setTouchActivity('hose', { stick: false, buttons: [] });
    expect(currentTouchActivity()).toEqual({ stick: true, buttons: ['enter'] });
    setTouchActivity('winter', null);
    setTouchActivity('hose', null);
    expect(currentTouchActivity()).toBeNull();
    expect(heard.length).toBe(4);
    off();
  });
});
