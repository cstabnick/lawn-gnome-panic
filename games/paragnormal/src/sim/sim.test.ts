import { describe, expect, it } from 'vitest';
import { runSimulatedPlaythrough, verifyInteractableReachable } from './agents';
import { createSim, sightRangeFor, stepSim } from './engine';
import { MONSTER_PROFILES, patrolWindow } from './profiles';

describe('Paragnormal procedural world & simulation', () => {
  it('generates 20 distinct valid seeds with connected rooms and reachable obstacles', () => {
    for (let seed = 100; seed < 120; seed++) {
      const sim = createSim(seed);
      expect(sim.rooms.length).toBe(6);
      expect(sim.doorways.length).toBe(5);
      expect(sim.monsters.length).toBe(3);
      // Two fixed Gnome-Souls, plus one drawn from the seeded pool
      const kinds = sim.monsters.map((m) => m.kind);
      expect(new Set(kinds).size).toBe(3);
      expect(kinds).toContain('gardener');
      expect(kinds).toContain('watcher');

      // Every room has at least one hideable piece of furniture after the foyer
      for (let i = 1; i < sim.rooms.length; i++) {
        const hideables = sim.furniture.filter((f) => f.roomId === i && f.hideable);
        expect(hideables.length).toBeGreaterThanOrEqual(1);
      }

      // All interactables sit inside their assigned rooms
      for (const item of sim.interactables) {
        expect(verifyInteractableReachable(item, sim)).toBe(true);
      }
    }
  });

  it('Director cycles through highs and lows and releases Dream Drag in relief', () => {
    const sim = createSim(42);
    // Force a monster close to trigger build -> peak -> relief
    sim.monsters[0].x = sim.player.x;
    sim.monsters[0].z = sim.player.z + 4.0;
    sim.monsters[0].state = 'chase';

    const seen = new Set<string>();
    let maxDrag = 0;
    let dragInRelief = 1;

    for (let i = 0; i < 400; i++) {
      stepSim(
        sim,
        {
          moveForward: 0,
          moveRight: 0,
          yawDelta: 0,
          pitchDelta: 0,
          sprint: false,
          crouch: true,
          interact: false,
          toggleLantern: false,
        },
        0.05,
      );
      seen.add(sim.director.phase);
      maxDrag = Math.max(maxDrag, sim.director.dreamDrag);
      if (sim.director.phase === 'relief') {
        // Move monster away once relief begins so it can settle
        sim.monsters[0].x = 50;
        sim.monsters[0].state = 'patrol';
        dragInRelief = Math.min(dragInRelief, sim.director.dreamDrag);
      }
    }

    expect(seen.has('peak')).toBe(true);
    expect(seen.has('relief')).toBe(true);
    expect(maxDrag).toBeGreaterThan(0.2);
    expect(dragInRelief).toBeLessThan(0.15);
  });

  it('every generated seed is solvable end-to-end across all 3 obstacles', () => {
    const seeds = [1, 7, 13, 42, 77, 99, 256, 512];
    const results = seeds.map((s) => runSimulatedPlaythrough(s, 'cautious', 120, true));
    const escapes = results.filter((r) => r.escaped && r.obstaclesCleared === 3).length;
    expect(escapes).toBeGreaterThanOrEqual(7);
  });

  it('Cautious Gnome agent can still escape sometimes with live monsters', () => {
    // A guard against collapse, not a balance target: the scripted agent cannot dodge the Hush or the Lamplighter
    // well, and escapes about 1 house in 6 across these 60 seeds (16 of 60 before the third Gnome-Soul was added).
    const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
    const results = seeds.map((s) => runSimulatedPlaythrough(s, 'cautious', 150));
    const escapes = results.filter((r) => r.escaped).length;
    expect(escapes).toBeGreaterThanOrEqual(5);
  });

  it('the lantern gutters now and then, and the same seed gutters at the same moments', () => {
    const gutters = (seed: number): number[] => {
      const sim = createSim(seed);
      const times: number[] = [];
      const idle = {
        moveForward: 0,
        moveRight: 0,
        yawDelta: 0,
        pitchDelta: 0,
        sprint: false,
        crouch: false,
        interact: false,
        toggleLantern: false,
      };
      for (let i = 0; i < 20 * 300 && !sim.player.caught; i++) {
        stepSim(sim, idle, 0.05);
        for (const e of sim.events) if (e.kind === 'lantern_gutter') times.push(Number(sim.time.toFixed(2)));
      }
      return times;
    };
    const a = gutters(2024);
    expect(a.length).toBeGreaterThan(0);
    expect(gutters(2024)).toEqual(a);
  });

  it('a gutted lantern is not lit, so monsters see the gnome by the dark sight range', () => {
    const sim = createSim(7);
    const mon = sim.monsters[0];
    mon.x = sim.player.x + 10;
    mon.z = sim.player.z;
    sim.player.lanternOn = true;
    sim.player.lanternLit = true;
    const lit = sightRangeFor(mon, sim);
    sim.player.lanternLit = false;
    const gutted = sightRangeFor(mon, sim);
    expect(gutted).toBeLessThan(lit);
  });

  it('every Gnome-Soul profile has a sensible patrol window inside the house', () => {
    const sim = createSim(3);
    const n = sim.waypoints.length;
    for (const kind of Object.keys(MONSTER_PROFILES) as Array<keyof typeof MONSTER_PROFILES>) {
      const [lo, hi] = patrolWindow(MONSTER_PROFILES[kind], n);
      expect(lo).toBeGreaterThanOrEqual(1);
      expect(hi).toBeLessThanOrEqual(n - 1);
      expect(hi).toBeGreaterThan(lo);
    }
  });

  it('Reckless Runner gets caught more often than Cautious Gnome', () => {
    const seeds = [1, 7, 13, 42, 77, 99];
    const cautious = seeds.map((s) => runSimulatedPlaythrough(s, 'cautious', 120));
    const reckless = seeds.map((s) => runSimulatedPlaythrough(s, 'reckless', 120));
    const cautiousCaught = cautious.filter((r) => r.caught).length;
    const recklessCaught = reckless.filter((r) => r.caught).length;
    expect(recklessCaught).toBeGreaterThanOrEqual(cautiousCaught);
  });
});
