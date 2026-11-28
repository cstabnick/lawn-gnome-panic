import { describe, expect, it } from 'vitest';
import { enterLabelFor, promptVerb, type EnterContext } from './enterLabel';

const none: EnterContext = {
  mounting: false, inVehicle: false, preferredVehicleVerb: null, giver: null, garage: null, lockup: null, dealer: null, gun: null,
  hunt: null, bird: null, fish: null, job: null, town: null, portal: null, interactable: null, vehicleVerb: null, ride: false,
};

describe('touch action button label (E03: mobile could not enter buildings)', () => {
  it('offers a button for the Gnomecino door prompt', () => {
    expect(enterLabelFor({ ...none, portal: 'Enter The Gnomecino' })).toBe('Enter');
  });
  it('offers a button for every prompt the interact key acts on', () => {
    for (const k of ['hunt', 'bird', 'fish', 'job', 'town', 'portal', 'interactable'] as const) {
      expect(enterLabelFor({ ...none, [k]: 'Something here' })).not.toBeNull();
    }
  });
  it('keeps the old priorities', () => {
    expect(enterLabelFor({ ...none, inVehicle: true, portal: 'Enter' })).toBe('Exit');
    expect(enterLabelFor({ ...none, giver: 'x', portal: 'Enter' })).toBe('Enter');
    expect(enterLabelFor({ ...none, lockup: 'Buy the Lock-Up' })).toBe('Buy');
    expect(enterLabelFor({ ...none, vehicleVerb: 'Drive', ride: true })).toBe('Drive');
    expect(enterLabelFor({ ...none, mounting: true, giver: 'x' })).toBeNull();
    expect(enterLabelFor(none)).toBeNull();
  });
  it('turns prompts into short verbs', () => {
    expect(promptVerb('Ride the Pebblewick Hopper to Turfton (8 Acorns)')).toBe('Ride');
    expect(promptVerb('Talk to the hide keeper')).toBe('Talk');
    expect(promptVerb('Pick up the crate')).toBe('Use');
    expect(promptVerb('Leave Bodega & Sons')).toBe('Leave');
  });
});
