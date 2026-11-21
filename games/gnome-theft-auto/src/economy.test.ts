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
    });
    expect(economy.state()).toEqual({
      acorns: 50,
      debtRemaining: 5000,
      debtPaidOff: false,
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
    });

    economy.earn(6000);
    expect(economy.payDebt(9999)).toBe(4950);
    expect(economy.state()).toEqual({
      acorns: 1050,
      debtRemaining: 0,
      debtPaidOff: true,
    });

    expect(economy.payDebt(100)).toBe(0);
  });

  it('charges Glaze Clinic fee when funded and never goes negative when broke', () => {
    const economy = createEconomy(createMemoryStorage());

    const first = economy.chargeHospital();
    expect(first.fee).toBe(HOSPITAL_FEE);
    expect(first.receipt).toContain('GLAZE CLINIC: -25 Acorns');
    expect(first.receipt).toContain('KILN-SHIELD: CLAIM DENIED');
    expect(economy.state().acorns).toBe(25);

    economy.spend(20);
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

    // Inside a fraud zone at valid speed
    expect(economy.onPlayerRagdollImpact(10, downtown.x + 5, downtown.z - 5)).toBe(80);
    expect(economy.state().acorns).toBe(130);

    // Without coordinates, speed >= 4 awards payout directly
    expect(economy.onPlayerRagdollImpact(5)).toBe(40);
    expect(economy.state().acorns).toBe(170);
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
      acorns: 100,
      debtRemaining: 4875,
      debtPaidOff: false,
    });

    // Corrupt storage falls back cleanly to starting defaults
    const corrupt = createEconomy(createMemoryStorage({ [ECONOMY_KEY]: '{not-json' }));
    expect(corrupt.state()).toEqual({
      acorns: 50,
      debtRemaining: 5000,
      debtPaidOff: false,
    });
  });
});
