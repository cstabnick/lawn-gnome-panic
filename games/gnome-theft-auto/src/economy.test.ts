import { describe, expect, it } from 'vitest';
import {
  createEconomy,
  ECONOMY_KEY,
  FRAUD_ZONES,
  HOSPITAL_FEE,
  STARTING_ACORNS,
  STARTING_DEBT,
} from './economy';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

describe('economy', () => {
  it('starts new saves at 50 Acorns and 5000 Clay-Mart Kiln-Debt', () => {
    const economy = createEconomy(createMemoryStorage());
    expect(economy.state()).toEqual({
      acorns: STARTING_ACORNS,
      debtRemaining: STARTING_DEBT,
      debtPaidOff: false,
      loans: [],
    });
    expect(economy.state()).toEqual({
      acorns: 50,
      debtRemaining: 5000,
      debtPaidOff: false,
      loans: [],
    });
  });

  it('earns and spends Acorns, rejecting insufficient funds without mutating', () => {
    const economy = createEconomy(createMemoryStorage());

    economy.earn(0, 'ignored');
    economy.earn(-15, 'ignored');
    expect(economy.state().acorns).toBe(50);

    economy.earn(24.6, 'lawn job');
    expect(economy.state().acorns).toBe(75);

    expect(economy.spend(100, 'too pricey')).toBe(false);
    expect(economy.state().acorns).toBe(75);

    expect(economy.spend(0, 'freebie')).toBe(true);
    expect(economy.spend(-5, 'freebie')).toBe(true);
    expect(economy.state().acorns).toBe(75);

    expect(economy.spend(30, 'spray paint')).toBe(true);
    expect(economy.state().acorns).toBe(45);
  });

  it('clamps payDebt to available Acorns and debtRemaining and marks debtPaidOff', () => {
    const economy = createEconomy(createMemoryStorage());

    expect(economy.payDebt(200)).toBe(50);
    expect(economy.state()).toEqual({
      acorns: 0,
      debtRemaining: 4950,
      debtPaidOff: false,
      loans: [],
    });

    economy.earn(6000);
    expect(economy.payDebt(9999)).toBe(4950);
    expect(economy.state()).toEqual({
      acorns: 1050,
      debtRemaining: 0,
      debtPaidOff: true,
      loans: [],
    });

    expect(economy.payDebt(100)).toBe(0);
  });

  it('charges Glaze Clinic fee when funded and never goes negative when broke', () => {
    const economy = createEconomy(createMemoryStorage());

    const first = economy.chargeHospital();
    expect(first.fee).toBe(HOSPITAL_FEE);
    expect(first.receipt).toContain(`GLAZE CLINIC: -${HOSPITAL_FEE} Acorns`);
    expect(first.receipt).toContain('KILN-SHIELD: CLAIM DENIED');
    expect(economy.state().acorns).toBe(STARTING_ACORNS - HOSPITAL_FEE);

    economy.spend(economy.state().acorns - 5);
    expect(economy.state().acorns).toBe(5);

    const partial = economy.chargeHospital();
    expect(partial.fee).toBe(5);
    expect(partial.receipt).toContain('GLAZE CLINIC: -5 Acorns');
    expect(economy.state().acorns).toBe(0);

    const broke = economy.chargeHospital();
    expect(broke.fee).toBe(0);
    expect(broke.receipt).toContain('GLAZE CLINIC: -0 Acorns');
    expect(broke.receipt).not.toBe(first.receipt);
    expect(economy.state().acorns).toBe(0);
  });

  it('awards Kiln-Shield ragdoll fraud payouts only inside FRAUD_ZONES and above min speed', () => {
    const economy = createEconomy(createMemoryStorage());
    const downtown = FRAUD_ZONES[0];

    expect(economy.inFraudZone(downtown.x, downtown.z)).toBe(true);
    expect(economy.inFraudZone(-150, 130)).toBe(true);
    expect(economy.inFraudZone(60, 0)).toBe(true);
    expect(economy.inFraudZone(300, 300)).toBe(false);

    // Below minimum speed
    expect(economy.onPlayerRagdollImpact(3.9, downtown.x, downtown.z)).toBe(0);
    expect(economy.state().acorns).toBe(50);

    // Outside fraud zones
    expect(economy.onPlayerRagdollImpact(10, 300, 300)).toBe(0);
    expect(economy.state().acorns).toBe(50);

    // Inside a fraud zone at valid speed (payout is linear in speed)
    const inZone = economy.onPlayerRagdollImpact(10, downtown.x + 5, downtown.z - 5);
    expect(inZone).toBeGreaterThan(0);
    expect(economy.state().acorns).toBe(STARTING_ACORNS + inZone);

    // Without coordinates, speed >= 4 awards payout directly
    const noCoords = economy.onPlayerRagdollImpact(5);
    expect(noCoords).toBe(inZone / 2);
    expect(economy.state().acorns).toBe(STARTING_ACORNS + inZone + noCoords);
  });

  it('persists and restores state across storage round-trips', () => {
    const storage = createMemoryStorage();
    const firstSession = createEconomy(storage);

    firstSession.earn(200);
    firstSession.payDebt(125);
    firstSession.chargeHospital();

    expect(storage.getItem(ECONOMY_KEY)).not.toBeNull();

    const restored = createEconomy(storage);
    expect(restored.state()).toEqual({
      acorns: STARTING_ACORNS + 200 - 125 - HOSPITAL_FEE,
      debtRemaining: 4875,
      debtPaidOff: false,
      loans: [],
    });

    // Corrupt storage falls back cleanly to starting defaults
    const corrupt = createEconomy(createMemoryStorage({ [ECONOMY_KEY]: '{not-json' }));
    expect(corrupt.state()).toEqual({
      acorns: 50,
      debtRemaining: 5000,
      debtPaidOff: false,
      loans: [],
    });
  });
});

describe('economy loans', () => {
  it('borrow books a loan, adds to the same id, and rejects a non-positive amount', () => {
    const economy = createEconomy(createMemoryStorage());

    expect(economy.borrow('farm', 'Mossbank Farm loan', 300)).toBe(true);
    expect(economy.state().loans).toEqual([
      { id: 'farm', name: 'Mossbank Farm loan', principal: 300, remaining: 300 },
    ]);
    expect(economy.state().acorns).toBe(STARTING_ACORNS);

    expect(economy.borrow('farm', 'Mossbank Farm loan', 100)).toBe(true);
    expect(economy.state().loans).toEqual([
      { id: 'farm', name: 'Mossbank Farm loan', principal: 400, remaining: 400 },
    ]);

    expect(economy.borrow('farm', 'Mossbank Farm loan', 0)).toBe(false);
    expect(economy.borrow('farm', 'Mossbank Farm loan', -10)).toBe(false);
    expect(economy.state().loans[0].remaining).toBe(400);
  });

  it('payLoan clamps to the wallet and the remaining amount, and removes a paid-off loan', () => {
    const economy = createEconomy(createMemoryStorage());
    economy.borrow('home', 'Home loan', 200);

    // Wallet is 50, so only 50 can be paid.
    expect(economy.payLoan('home', 999)).toBe(50);
    expect(economy.state().acorns).toBe(0);
    expect(economy.state().loans[0].remaining).toBe(150);

    economy.earn(1000);
    expect(economy.payLoan('home', 999)).toBe(150);
    expect(economy.state().loans).toEqual([]);
    expect(economy.state().acorns).toBe(1000 - 150);

    expect(economy.payLoan('home', 10)).toBe(0);
  });

  it('payLoan returns 0 for an unknown id', () => {
    const economy = createEconomy(createMemoryStorage());
    economy.earn(100);
    expect(economy.payLoan('nope', 10)).toBe(0);
    expect(economy.state().acorns).toBe(150);
  });

  it('totalOwed is Kiln-Debt plus every open loan', () => {
    const economy = createEconomy(createMemoryStorage());
    expect(economy.totalOwed()).toBe(STARTING_DEBT);

    economy.borrow('a', 'A loan', 300);
    economy.borrow('b', 'B loan', 200);
    expect(economy.totalOwed()).toBe(STARTING_DEBT + 500);

    economy.earn(300);
    economy.payLoan('a', 300);
    expect(economy.totalOwed()).toBe(STARTING_DEBT + 200);
  });

  it('loads a stored save without loans as loans: []', () => {
    const storage = createMemoryStorage({
      [ECONOMY_KEY]: JSON.stringify({ acorns: 40, debtRemaining: 4000, debtPaidOff: false }),
    });
    const economy = createEconomy(storage);
    expect(economy.state()).toEqual({
      acorns: 40,
      debtRemaining: 4000,
      debtPaidOff: false,
      loans: [],
    });
  });

  it('keeps loans across a second createEconomy on the same storage', () => {
    const storage = createMemoryStorage();
    createEconomy(storage).borrow('farm', 'Mossbank Farm loan', 250);

    const restored = createEconomy(storage);
    expect(restored.state().loans).toEqual([
      { id: 'farm', name: 'Mossbank Farm loan', principal: 250, remaining: 250 },
    ]);
    expect(restored.totalOwed()).toBe(STARTING_DEBT + 250);
  });

  it('payDebt never touches loans', () => {
    const economy = createEconomy(createMemoryStorage());
    economy.borrow('farm', 'Mossbank Farm loan', 300);
    economy.earn(500);

    expect(economy.payDebt(100)).toBe(100);
    expect(economy.state().loans).toEqual([
      { id: 'farm', name: 'Mossbank Farm loan', principal: 300, remaining: 300 },
    ]);
    expect(economy.state().debtRemaining).toBe(STARTING_DEBT - 100);
  });
});
