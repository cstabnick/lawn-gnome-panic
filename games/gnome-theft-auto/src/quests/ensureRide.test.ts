import { describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { RIDE_NEAR, ensureRideNear, questNeedsRide, type RideDeps } from './ensureRide';
import type { QuestDef } from './types';

const q = (kind: string): QuestDef => ({ id: 'q', objectives: [{ kind }] }) as unknown as QuestDef;
const veh = (o: Record<string, unknown> = {}): Vehicle =>
  ({ x: 10, z: 0, driver: 'none', spec: {}, ...o }) as unknown as Vehicle;
const rec = (uid: string, storedAt: number) => ({ uid, name: uid, storedAt }) as never;

function mk(o: Partial<RideDeps> = {}) {
  const deps: RideDeps = {
    player: { x: 0, z: 0, vehicle: null },
    vehicles: [],
    lockup: { list: vi.fn(() => []), instanceOf: vi.fn(() => null), callDelivery: vi.fn(() => null) },
    spawnLoaner: vi.fn(() => veh()),
    toast: vi.fn(),
    ...o,
  };
  return deps;
}

describe('ensureRideNear', () => {
  it('questNeedsRide', () => {
    expect(questNeedsRide(q('visit'))).toBe(true);
    expect(questNeedsRide(q('race'))).toBe(false);
    expect(questNeedsRide(q('steal-deliver'))).toBe(false);
    expect(questNeedsRide({ id: 'x', objectives: [] } as unknown as QuestDef)).toBe(false);
  });
  it('none-needed in a vehicle or for self-supplied quests', () => {
    expect(ensureRideNear(0, 0, q('visit'), mk({ player: { x: 0, z: 0, vehicle: veh() } }))).toBe('none-needed');
    expect(ensureRideNear(0, 0, q('race'), mk())).toBe('none-needed');
  });
  it('near with a free ground vehicle in range', () => {
    const d = mk({ vehicles: [veh()] });
    expect(ensureRideNear(0, 0, q('visit'), d)).toBe('near');
    expect(d.toast).not.toHaveBeenCalled();
  });
  it('ignores driven, quest-owned, exploded, boats, flyers and far vehicles', () => {
    const vs = [
      veh({ driver: 'npc' }), veh({ questOwned: true }), veh({ exploded: true }),
      veh({ spec: { boat: true } }), veh({ spec: { flies: true } }), veh({ x: RIDE_NEAR + 1 }),
    ];
    expect(ensureRideNear(0, 0, q('visit'), mk({ vehicles: vs }))).toBe('loaner');
  });
  it('delivers the most recently stored vehicle', () => {
    const d = mk();
    (d.lockup.list as ReturnType<typeof vi.fn>).mockReturnValue([rec('old', 1), rec('new', 5)]);
    expect(ensureRideNear(0, 0, q('visit'), d)).toBe('delivered');
    expect(d.lockup.callDelivery).toHaveBeenCalledWith('new', true);
    expect(d.toast).toHaveBeenCalledWith('Your new is on its way.');
  });
  it('falls back to a loaner on delivery error or empty lockup', () => {
    const d = mk();
    (d.lockup.list as ReturnType<typeof vi.fn>).mockReturnValue([rec('a', 1)]);
    (d.lockup.callDelivery as ReturnType<typeof vi.fn>).mockReturnValue('busy');
    expect(ensureRideNear(0, 0, q('visit'), d)).toBe('loaner');
    expect(d.toast).toHaveBeenCalledWith('A loaner ride-on is parked nearby.');
    expect(ensureRideNear(0, 0, q('visit'), mk())).toBe('loaner');
  });
  it('failed when no loaner can be placed', () => {
    expect(ensureRideNear(0, 0, q('visit'), mk({ spawnLoaner: () => null }))).toBe('failed');
  });
});
