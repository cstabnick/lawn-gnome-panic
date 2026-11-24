import { describe, expect, it } from 'vitest';
import {
  addCampDefense,
  collectCampProduction,
  computeSecurityScore,
  createEmptyCamp,
  dismissCampNpc,
  establishCamp,
  hireCampNpc,
  reassignNpcRole,
  repairAllDefenses,
  tickCampProduction,
  upgradeDefense,
} from './campSecurity';

describe('camp security & NPC hiring', () => {
  it('refuses hiring until camp is established and security threshold is met', () => {
    const camp = createEmptyCamp();
    expect(hireCampNpc(camp, 'maren', 'Maren', 'guard').ok).toBe(false);

    establishCamp(camp, 'Oak Watch', { x: 10, y: 0, z: 10 }, 'forecourt');
    expect(computeSecurityScore(camp)).toBe(5);
    expect(hireCampNpc(camp, 'maren', 'Maren', 'guard').ok).toBe(false);

    const turret = addCampDefense(camp, 'slingshot-turret', { x: 12, y: 0, z: 12 });
    expect(computeSecurityScore(camp)).toBe(25);
    expect(hireCampNpc(camp, 'maren', 'Maren', 'guard').ok).toBe(true);
    expect(hireCampNpc(camp, 'barnaby', 'Barnaby', 'cook').ok).toBe(true);

    // Upgrade turret Mk I -> Mk II -> Mk III
    const up2 = upgradeDefense(camp, turret.id);
    expect(up2.ok).toBe(true);
    expect(up2.tier).toBe(2);
    expect(computeSecurityScore(camp)).toBeGreaterThan(35);

    // Damage & repair
    turret.hp = 10;
    expect(repairAllDefenses(camp)).toBe(1);
    expect(turret.hp).toBe(turret.maxHp);
  });

  it('accumulates production, supports role reassignment and dismissal', () => {
    const camp = createEmptyCamp();
    establishCamp(camp, 'Pine Bastion', { x: 0, y: 0, z: 0 }, 'forecourt');
    addCampDefense(camp, 'auto-crossbow', { x: 2, y: 0, z: 2 });
    expect(hireCampNpc(camp, 'alder', 'Alder', 'scavenger').ok).toBe(true);
    expect(hireCampNpc(camp, 'barnaby', 'Barnaby', 'cook').ok).toBe(true);

    tickCampProduction(camp, 2);
    const got = collectCampProduction(camp);
    expect(got.acorns).toBeGreaterThanOrEqual(20);
    expect(got.rations).toBeGreaterThanOrEqual(2);

    expect(reassignNpcRole(camp, 'alder', 'mechanic')).toBe(true);
    expect(camp.hired.find((h) => h.survivorId === 'alder')?.role).toBe('mechanic');
    expect(dismissCampNpc(camp, 'alder')).toBe(true);
    expect(camp.hired).toHaveLength(1);
  });
});
