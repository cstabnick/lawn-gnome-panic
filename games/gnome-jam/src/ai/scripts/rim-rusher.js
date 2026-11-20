// Rim Rusher: turbo-drives straight to the hoop for poster dunks and plays physical defense.

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

  if (state.ball.mode === 'loose') {
    return steer(p, state.ball.pos[0], state.ball.pos[2], true);
  }

  if (state.ball.carrier === p.index) {
    if (ctx.role === 'teammate' && ctx.humanInput?.passPressed) return { passPressed: true };
    if (ctx.role === 'teammate' && ctx.humanInput?.shootPressed) return { shootPressed: true, shootDown: true };

    const distHoop = Math.hypot(hx - p.pos[0], p.pos[2]);
    if (distHoop < 3.5 + (p.stats.dunk / 10) * 0.18) {
      return { turbo: true, shootPressed: true, shootDown: true };
    }
    return steer(p, hx - dir * 1.0, 0, p.turbo > 15);
  }

  const teamHasBall =
    state.ball.carrier !== null && state.players[state.ball.carrier]?.team === p.team;
  if (teamHasBall) {
    // Cut to the opposite block for a putback/alley-oop
    return steer(p, hx - dir * 2.4, p.index % 2 === 0 ? 2.2 : -2.2, true);
  }

  // Aggressive ball-hawking defense
  const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
  if (!carrier) return {};
  const out = steer(p, carrier.pos[0], carrier.pos[2], p.turbo > 25);
  const d = Math.hypot(p.pos[0] - carrier.pos[0], p.pos[2] - carrier.pos[2]);
  if (d < 1.55 && p.stealCooldown <= 0 && Math.random() < 2.2 * ctx.dt) {
    out.passPressed = true;
    out.turbo = true;
  }
  if ((!carrier.grounded || carrier.isDunking) && d < 2.4 && p.grounded) {
    out.shootPressed = true;
  }
  return out;
}
