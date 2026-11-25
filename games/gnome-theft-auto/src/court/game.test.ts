import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '@lawn/jam';
import { COURT, COURT_ORIGIN, type CourtControl, type CourtEvent } from './types';
import { disposePickup, newPickup, pickupResult, pickupView, stepPickup, type PickupGame } from './game';

const idle = (): CourtControl => ({ moveX: 0, moveZ: 0, turbo: false, shootDown: false, shootPressed: false,
  shootReleased: false, passPressed: false, fakePressed: false });

/** Walk to the ball; with it, run at the east hoop and shoot. */
function scripted(g: PickupGame, st: { held: boolean }): CourtControl {
  const v = pickupView(g);
  const me = v.gnomes[v.controlled];
  const c = idle();
  if (me.hasBall) {
    const dx = COURT.hoops[1].x - me.x, dz = COURT.z - me.z;
    const d = Math.hypot(dx, dz) || 1;
    if (d > 5) { c.moveX = dx / d; c.moveZ = dz / d; c.turbo = true; }
    else if (!st.held) { c.shootPressed = true; c.shootDown = true; st.held = true; }
    else { c.shootReleased = true; st.held = false; }
  } else {
    st.held = false;
    const dx = v.ball.x - me.x, dz = v.ball.z - me.z;
    const d = Math.hypot(dx, dz) || 1;
    c.moveX = dx / d; c.moveZ = dz / d;
  }
  return c;
}

function run(g: PickupGame, script: boolean): { events: CourtEvent[]; ok: boolean } {
  const events: CourtEvent[] = [];
  const sums: [number, number] = [0, 0];
  const st = { held: false };
  let ok = true;
  for (let i = 0; i < 400 * 60 && !g.done; i++) {
    for (const e of stepPickup(g, 1 / 60, script ? scripted(g, st) : idle())) {
      events.push(e);
      if (e.kind === 'score') {
        if (e.points !== 2 && e.points !== 3) ok = false;
        sums[e.team] += e.points;
      }
    }
    const v = pickupView(g);
    if (v.score[0] !== sums[0] || v.score[1] !== sums[1]) ok = false;
    for (const gn of v.gnomes) {
      if (Math.abs(gn.x - COURT_ORIGIN.x) > COURT.halfX + 2 || Math.abs(gn.z - COURT_ORIGIN.z) > COURT.halfZ + 2) ok = false;
    }
  }
  return { events, ok };
}

describe('pickup game', () => {
  beforeEach(() => { vi.spyOn(Math, 'random').mockImplementation(mulberry32(7)); });
  afterEach(() => { vi.restoreAllMocks(); });

  for (const script of [false, true]) {
    it(`ends once, scores add up, stays on court (${script ? 'scripted' : 'idle'} player)`, () => {
      const g = newPickup(null, 0, { target: 5 });
      expect(pickupResult(g)).toBeNull();
      const { events, ok } = run(g, script);
      const ends = events.filter((e) => e.kind === 'end') as Extract<CourtEvent, { kind: 'end' }>[];
      expect(ends).toHaveLength(1);
      expect(ok).toBe(true);
      const r = pickupResult(g)!;
      expect(r.won).toBe(ends[0].won);
      expect(r.score).toEqual(ends[0].score);
      disposePickup(g);
    });
  }

  it('swish puts Cardoon in the view', () => {
    const g = newPickup(null, 0, { opponents: 'swish' });
    expect(pickupView(g).gnomes.some((x) => x.name.includes('Cardoon'))).toBe(true);
    disposePickup(g);
  });
});
