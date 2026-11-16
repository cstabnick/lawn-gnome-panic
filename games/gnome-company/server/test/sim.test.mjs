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

test('GameRoomSim runs days 1-3, reincarnates after game over, and keeps the shed reset during the summary', () => {
  const sim = new GameRoomSim('SHED');
  const p = sim.addPlayer('p1', 'Brother Sprout', '#ef4444');
  const input = { zone: 'shed', x: 2.6, y: 0, z: 2.6, yaw: 0, pitch: 0, crouching: false, flashlightOn: false };
  for (let day = 1; day <= 3; day++) {
    assert.equal(sim.snapshot.phase, 'lobby');
    assert.equal(sim.snapshot.day, day);
    sim.handlePullLever('p1');
    assert.equal(sim.snapshot.phase, 'yard');
    sim.handlePullLever('p1');
    assert.equal(sim.snapshot.phase, 'day_summary');
    // A client still standing on the lever must not undo the return to spawn.
    sim.applyInput('p1', input);
    assert.equal(p.x, 0);
    assert.equal(p.z, 0.5);
    for (let i = 0; i < 200; i++) sim.step(0.05);
  }
  assert.equal(sim.snapshot.phase, 'game_over');
  sim.handlePullLever('p1');
  assert.equal(sim.snapshot.phase, 'lobby');
  assert.equal(sim.snapshot.day, 1);
});
