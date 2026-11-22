import { describe, expect, it } from 'vitest';
import { HELPER_GNOMES } from '../data/helpers';
import { computeStyleRank } from '../game/events';
import { LEVEL_ORDER, LEVELS, sampleSurfaceHeight } from '../levels/loader';
import { REGIONAL_GRAFFITI } from '../view/graffiti';
import { createSkater, stepSkater } from './skater';

describe('Gnom Set Radio level documents & rollerblade sim', () => {
  it('all 9 levels satisfy @lawn/level format and event counts', () => {
    expect(LEVEL_ORDER).toEqual([
      'velvet-keys',
      'bongo-basin',
      'chrome-kiln',
      'neon-birdbath',
      'mulch-alley',
      'tupperware-mall',
      'hoa-citadel',
      'subsoil-relay',
      'zero-hz-zenith',
    ]);

    for (const id of LEVEL_ORDER) {
      const lvl = LEVELS[id];
      expect(lvl.format).toBe('lawn-level');
      expect(lvl.data.events.filter((e) => e.kind === 'story').length).toBeGreaterThanOrEqual(3);
      expect(lvl.data.events.filter((e) => e.kind === 'boss').length).toBe(1);
      expect(lvl.data.events.filter((e) => e.kind === 'side').length).toBe(2);
    }
  });

  it('skater accelerates via @lawn/vehicle and climbs ramp onto Conservatory Terrace rooftop', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    s.x = 0;
    s.z = 20;
    s.y = 0;
    const btn = { jump: false, trick: false, railCooldown: 0 };
    for (let i = 0; i < 120; i++) {
      stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: true }, 1 / 60, btn);
    }
    expect(s.z).toBeLessThan(8);
    expect(s.y).toBeGreaterThan(3.0);
    expect(sampleSurfaceHeight(doc, 0, 0, s.y)).toBeCloseTo(3.5, 1);
  });

  it('supports double jump / air jump once mid-air and resets on landing', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const btn = { jump: false, trick: false, railCooldown: 0 };

    // Ground jump
    stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(s.grounded).toBe(false);
    expect(s.airJumpsLeft).toBe(1);

    // Release jump button for 1 frame
    stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);

    // Air jump!
    const airRes = stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(airRes.airJumpTriggered).toBe(true);
    expect(s.airJumpsLeft).toBe(0);
    expect(s.vy).toBeGreaterThan(10);

    // Cannot triple jump
    stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    const thirdRes = stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(thirdRes.airJumpTriggered).toBe(false);
  });

  it('skater snaps onto 3D ley-line rail and scores tricks', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    s.x = -10;
    s.y = 2.0;
    s.z = 24;
    s.vx = 12;
    s.vy = -1;
    s.grounded = false;
    const btn = { jump: false, trick: false, railCooldown: 0 };

    const res = stepSkater(
      s,
      doc,
      { moveX: 1, moveZ: 0, jump: false, grind: true, trick: false, boost: false },
      1 / 60,
      btn,
    );
    expect(s.grinding).toBe(true);
    expect(s.railId).toBe('rail-plaza-loop');
    expect(res.trickTriggered).toBe('Ley-Line Grind');

    const trickRes = stepSkater(
      s,
      doc,
      { moveX: 1, moveZ: 0, jump: false, grind: true, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(trickRes.trickTriggered).toBeTruthy();
    expect(s.comboMult).toBeGreaterThan(1);
  });

  it('supports directional air tricks, grind hop, and ground Cess Spin with cooldown', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const btn = { jump: false, trick: false, railCooldown: 0 };

    // Ground Cess Spin requires speed > 4.5
    for (let i = 0; i < 30; i++) {
      stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: true }, 1 / 60, btn);
    }
    const groundTrick = stepSkater(
      s,
      doc,
      { moveX: 0, moveZ: -1, jump: false, grind: false, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(groundTrick.trickTriggered).toBe('Cess Spin');
    expect(groundTrick.trickAnim).toBe('groundSpin');
    expect(s.groundTrickCooldown).toBeGreaterThan(0);

    // Cooldown prevents instant spam on ground
    stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    const spamTrick = stepSkater(
      s,
      doc,
      { moveX: 0, moveZ: -1, jump: false, grind: false, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(spamTrick.trickTriggered).toBeNull();

    // Directional air tricks
    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    s.grounded = false;
    s.y = 5;
    s.yaw = Math.PI; // facing -Z
    const flipRes = stepSkater(
      s,
      doc,
      { moveX: 0, moveZ: -1, jump: false, grind: false, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(flipRes.trickTriggered).toBe('Aether Flip');
    expect(flipRes.trickAnim).toBe('frontflip');

    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    const spinRes = stepSkater(
      s,
      doc,
      { moveX: 1, moveZ: 0, jump: false, grind: false, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(spinRes.trickTriggered).toBe('360 Clay Spin');
    expect(spinRes.trickAnim).toBe('spin360');

    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    const grabRes = stepSkater(
      s,
      doc,
      { moveX: 0, moveZ: 1, jump: false, grind: false, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(grabRes.trickTriggered).toBe('Turfton Grab');
    expect(grabRes.trickAnim).toBe('grab');

    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    const corkRes = stepSkater(
      s,
      doc,
      { moveX: 0, moveZ: 0, jump: false, grind: false, trick: true, boost: false },
      1 / 60,
      btn,
    );
    expect(corkRes.trickTriggered).toBe('Broadcast Cork');
    expect(corkRes.trickAnim).toBe('cork');
  });

  it('does not drift backward at spawn when no movement input is pressed', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const startX = s.x;
    const startZ = s.z;
    const btn = { jump: false, trick: false, railCooldown: 0 };
    for (let i = 0; i < 60; i++) {
      stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    }
    expect(Math.abs(s.x - startX)).toBeLessThan(0.05);
    expect(Math.abs(s.z - startZ)).toBeLessThan(0.05);
    expect(Math.hypot(s.vx, s.vz)).toBeLessThan(0.05);
  });

  it('wall-riding along a building sets wallRiding and non-zero wallSide', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const b = doc.data.buildings[0]!;
    s.x = b.x + b.w * 0.5 + 0.3;
    s.y = b.yBase + 1.4;
    s.z = b.z;
    s.vx = -2;
    s.vy = 0;
    s.vz = -12;
    s.grounded = false;
    const btn = { jump: false, trick: false, railCooldown: 0 };
    const res = stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(res.wallRideStarted).toBe(true);
    expect(s.wallRiding).toBe(true);
    expect(s.wallSide).not.toBe(0);
  });

  it('provides 3 regional graffiti variations and a helper gnome per level', () => {
    for (const id of LEVEL_ORDER) {
      expect(REGIONAL_GRAFFITI[id]).toHaveLength(3);
      expect(HELPER_GNOMES[id].facts.length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(HELPER_GNOMES[id].hints).length).toBeGreaterThan(0);
    }
  });

  it('supports coyote-time jump shortly after leaving ground and jump buffering before landing', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const btn = { jump: false, trick: false, railCooldown: 0 };

    // Grounded frame sets coyoteTimer, then move off into air
    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(s.coyoteTimer).toBeGreaterThan(0);
    s.grounded = false;
    s.y = 4.0;
    s.vy = -1.0;

    // Coyote jump succeeds without consuming air jump
    const coyoteRes = stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(coyoteRes.jumpTriggered).toBe(true);
    expect(s.airJumpsLeft).toBe(1);

    // Release jump and exhaust air jump
    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    s.airJumpsLeft = 0;
    s.coyoteTimer = 0;
    s.y = 0.2;
    s.vy = -8.0;

    // Press jump just before landing -> buffers, then triggers on landing frame
    stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(s.jumpBufferTimer).toBeGreaterThan(0);
    const landAndJump = stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(landAndJump.jumpTriggered).toBe(true);
    expect(s.vy).toBeGreaterThan(10);
  });

  it('wall-kicks away from a building wall and awards Wall-Kick trick', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const b = doc.data.buildings[0]!;
    s.x = b.x + b.w * 0.5 + 0.3;
    s.y = b.yBase + 1.4;
    s.z = b.z;
    s.vx = -2;
    s.vy = 0;
    s.vz = -12;
    s.grounded = false;
    const btn = { jump: false, trick: false, railCooldown: 0 };

    stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(s.wallRiding).toBe(true);

    const kickRes = stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: true, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(kickRes.wallKickTriggered).toBe(true);
    expect(kickRes.trickTriggered).toBe('Wall-Kick');
    expect(s.vx).toBeGreaterThan(5);
    expect(s.vy).toBeGreaterThan(12);
  });

  it('computes style ranks S, A, B, C accurately', () => {
    expect(computeStyleRank(6200, 3, 0)).toBe('S');
    expect(computeStyleRank(4200, 6, 1)).toBe('S');
    expect(computeStyleRank(3400, 4, 0)).toBe('A');
    expect(computeStyleRank(1500, 2, 0)).toBe('B');
    expect(computeStyleRank(600, 1, 0)).toBe('C');
  });

  it('brakes smoothly and cycles 3 breakdance moves with cancel-on-move', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const btn = { jump: false, trick: false, railCooldown: 0, dance: false };

    // Build speed, then brake
    for (let i = 0; i < 30; i++) {
      stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: true }, 1 / 60, btn);
    }
    const preBrakeSpd = Math.hypot(s.vx, s.vz);
    expect(preBrakeSpd).toBeGreaterThan(8);
    for (let i = 0; i < 20; i++) {
      stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false, brake: true }, 1 / 60, btn);
    }
    expect(s.braking).toBe(true);
    expect(Math.hypot(s.vx, s.vz)).toBeLessThan(preBrakeSpd * 0.4);

    // Cycle 3 breakdance moves
    const moves: string[] = [];
    for (let m = 0; m < 3; m++) {
      const r = stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false, dance: true }, 1 / 60, btn);
      if (r.danceStarted) moves.push(r.danceStarted);
      stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false, dance: false }, 1 / 60, btn);
    }
    expect(moves).toEqual(['headspin', 'windmill', 'airfreeze']);
    expect(s.danceMove).toBe('airfreeze');

    // Moving cancels dance
    stepSkater(s, doc, { moveX: 0, moveZ: -1, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(s.danceMove).toBeNull();
  });

  it('pushes skater out of static prop and billboard colliders', () => {
    const doc = LEVELS['velvet-keys'];
    const s = createSkater(doc);
    const prop = doc.props[0]!;
    s.x = prop.x + 0.1;
    s.z = prop.z + 0.1;
    s.y = 0;
    s.vx = -5;
    const btn = { jump: false, trick: false, railCooldown: 0 };
    const res = stepSkater(s, doc, { moveX: 0, moveZ: 0, jump: false, grind: false, trick: false, boost: false }, 1 / 60, btn);
    expect(res.bumped).toBe(true);
    expect(Math.hypot(s.x - prop.x, s.z - prop.z)).toBeGreaterThanOrEqual(0.6);
  });
});
