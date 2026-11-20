// Downtown Sniper: hunts 3-point shots from the wings and spaces the floor.

function steer(p, tx, tz, turbo) {
  const dx = tx - p.pos[0];
  const dz = tz - p.pos[2];
  const d = Math.hypot(dx, dz);
  if (d <= 0.3) return { moveX: 0, moveZ: 0, turbo: false };
  return { moveX: dx / d, moveZ: dz / d, turbo: !!turbo };
}

function decide(state, ctx) {
  const p = state.players[ctx.playerIndex];
  if (!p || p.stunTimer > 0 || p.isDunking) return {};

  const dir = p.team === 0 ? 1 : -1;
  const hx = dir * state.court.hoopX;
  const mateIdx = p.team === 0 ? (p.index === 0 ? 1 : 0) : p.index === 2 ? 3 : 2;
  const mate = state.players[mateIdx];

  if (state.ball.mode === 'loose') {
    return steer(p, state.ball.pos[0], state.ball.pos[2], true);
  }

  if (state.ball.carrier === p.index) {
    if (ctx.role === 'teammate' && ctx.humanInput?.passPressed) return { passPressed: true };
    if (ctx.role === 'teammate' && ctx.humanInput?.shootPressed) return { shootPressed: true, shootDown: true };

    if (p.isShooting) {
      return p.vel[1] <= 0.25 ? { shootReleased: true } : { shootDown: true };
    }

    const distHoop = Math.hypot(hx - p.pos[0], p.pos[2]);
    // Shoot as soon as we're in the sweet 3-point zone!
    if (distHoop >= state.court.threePtRadius + 0.45 && distHoop <= 7.4) {
      return { shootPressed: true, shootDown: true };
    }

    // Move to wing 3-point spot
    const wingZ = p.index % 2 === 0 ? 3.8 : -3.8;
    const spotX = hx - dir * (state.court.threePtRadius + 0.9);
    return steer(p, spotX, wingZ, p.turbo > 40);
  }

  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    const wingZ = mate.pos[2] >= 0 ? -4.0 : 4.0;
    const spotX = hx - dir * (state.court.threePtRadius + 1.0);
    return steer(p, spotX, wingZ, false);
  }

  // Defense: shade the ball carrier
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (!carrier) return {};
  const ownHoopX = (carrier.team === 0 ? 1 : -1) * state.court.hoopX;
  const gx = carrier.pos[0] + Math.sign(ownHoopX - carrier.pos[0]) * 1.2;
  const out = steer(p, gx, carrier.pos[2] * 0.9, p.turbo > 35);
  const d = Math.hypot(p.pos[0] - carrier.pos[0], p.pos[2] - carrier.pos[2]);
  if (d < 1.5 && p.stealCooldown <= 0 && Math.random() < 1.8 * ctx.dt) {
    out.passPressed = true;
  }
  if ((!carrier.grounded || carrier.isDunking) && d < 2.2 && p.grounded) {
    out.shootPressed = true;
  }
  return out;
}
