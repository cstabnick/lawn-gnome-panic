import { describe, expect, it } from 'vitest';
import { addCampDefense, computeSecurityScore, createEmptyCamp, establishCamp, hireCampNpc } from './campSecurity';

describe('camp security & NPC hiring', () => {
  it('refuses hiring until camp is established and security threshold is met', () => {
    const camp = createEmptyCamp();
    expect(hireCampNpc(camp, 'maren', 'Maren', 'guard').ok).toBe(false);

    establishCamp(camp, 'Oak Watch', { x: 10, y: 0, z: 10 }, 'forecourt');
    expect(computeSecurityScore(camp)).toBe(5);
    expect(hireCampNpc(camp, 'maren', 'Maren', 'guard').ok).toBe(false);

    addCampDefense(camp, 'slingshot-turret', { x: 12, y: 0, z: 12 });
    expect(computeSecurityScore(camp)).toBe(25);
    expect(hireCampNpc(camp, 'maren', 'Maren', 'guard').ok).toBe(true);
    expect(hireCampNpc(camp, 'barnaby', 'Barnaby', 'cook').ok).toBe(true);
  });
});
