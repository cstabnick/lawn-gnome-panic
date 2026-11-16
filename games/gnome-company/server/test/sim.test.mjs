import test from 'node:test';
import assert from 'node:assert/strict';
import { GameRoomSim } from '../dist/sim.mjs';

test('GameRoomSim starts day, spawns all creatures and zones, and dog never kills players', () => {
  const sim = new GameRoomSim('SHED');
  const p = sim.addPlayer('p1', 'Brother Sprout', '#ef4444');
  assert.equal(p.zone, 'shed');
  assert.equal(sim.snapshot.phase, 'lobby');

  sim.handlePullLever('p1');
  assert.equal(sim.snapshot.phase, 'yard');

  const mobs = Object.values(sim.snapshot.enemies);
  const kinds = new Set(mobs.map((m) => m.kind));
  assert.ok(kinds.has('earthworm'));
  assert.ok(kinds.has('mower'));
  assert.ok(kinds.has('squirrel'));
  assert.ok(kinds.has('spider'));
  assert.ok(kinds.has('cultist'));
  assert.ok(kinds.has('pillbug'));
  assert.ok(kinds.has('dog'));

  const zones = new Set(Object.values(sim.snapshot.items).map((i) => i.zone));
  assert.ok(zones.has('yard'));
  assert.ok(zones.has('deku'));
  assert.ok(zones.has('house'));

  // Place player next to dog and pillbug and step 2 seconds: player must take 0 damage
  const dog = mobs.find((m) => m.kind === 'dog');
  assert.ok(dog);
  p.zone = 'yard';
  p.x = dog.x;
  p.z = dog.z;
  for (let i = 0; i < 40; i++) {
    sim.step(0.05);
  }
  assert.equal(p.alive, true);
  assert.equal(p.hp, 100);
});

test('Hostile AI respects line-of-sight obscurity, stealth bushes, and follows patrol routes', () => {
  const sim = new GameRoomSim('AI01');
  const p = sim.addPlayer('p1', 'SneakyGnome', '#22c55e');
  sim.handlePullLever('p1');

  const mobs = Object.values(sim.snapshot.enemies);
  const mower = mobs.find((m) => m.kind === 'mower');
  assert.ok(mower);
  assert.ok(mower.routeId);

  // Place player directly across the central hedge (y_h3 at x=0, z=4) from the mower
  p.zone = 'yard';
  p.x = 0;
  p.z = 8;
  mower.x = 0;
  mower.z = 0;
  mower.yaw = 0; // facing +Z toward the hedge and player
  mower.state = 'patrol';
  mower.stateTimer = 0.5;

  for (let i = 0; i < 15; i++) {
    sim.step(0.05);
  }
  // Hedge y_h3 blocks sight, so mower must stay in patrol instead of revving/charging
  assert.equal(mower.state, 'patrol');

  // Test spider search state when player breaks line of sight behind a Deku pillar (d_p1 at -6, 3)
  const spider = mobs.find((m) => m.kind === 'spider' && m.zone === 'deku');
  assert.ok(spider);
  p.zone = 'deku';
  p.x = -6;
  p.z = 0;
  spider.x = -6;
  spider.z = -4;
  spider.yaw = 0; // facing +Z toward player (clear LOS before pillar at z=3)
  for (let i = 0; i < 6; i++) {
    sim.step(0.05);
  }
  assert.equal(spider.state, 'chase');

  // Now move player behind pillar d_p1 (x=-6, z=3, w=2.2, d=2.2)
  p.x = -6;
  p.z = 6;
  p.crouching = true;
  spider.z = -1;
  for (let i = 0; i < 4; i++) {
    sim.step(0.05);
  }
  assert.equal(spider.state, 'search');
});
