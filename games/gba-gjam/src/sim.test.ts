import { describe, expect, it } from 'vitest';
import { HOOP_X, HOOP_Y } from './arena';
import { normalizeBotInput } from './ai';
import { JamSimulation, type SimCallbacks } from './sim';
import { PRO_TEAMS } from './teams';
import type { AnnouncerEvent, MatchConfig } from './types';

function makeCallbacks(events: AnnouncerEvent[] = []): SimCallbacks {
  return {
    onAnnounce: (ev) => events.push(ev),
    onSound: () => {},
    onRimShake: () => {},
    onCameraPunch: () => {},
    onBurst: () => {},
    onAchievement: () => {},
    onMatchEnd: () => {},
  };
}

function makeConfig(): MatchConfig {
  const home = PRO_TEAMS[0];
  const away = PRO_TEAMS[1];
  return {
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeRoster: [home.roster[0], home.roster[1]],
    awayRoster: [away.roster[0], away.roster[1]],
    opponentMode: 'local2p',
    difficulty: 'pro',
    quarterSeconds: 60,
  };
}

const idle = () => normalizeBotInput(null);

function advanceToLive(sim: JamSimulation): void {
  for (let i = 0; i < 30; i++) {
    sim.step(0.05, idle(), idle());
    if (sim.phase === 'live') break;
  }
}

describe('GBA GJAM mechanics', () => {
  it('rebounds loose balls off the backboard', () => {
    const sim = new JamSimulation(makeConfig(), makeCallbacks());
    advanceToLive(sim);

    sim.ball.carrier = null;
    sim.ball.mode = 'loose';
    sim.ball.pos.set(HOOP_X + 0.3, HOOP_Y + 0.3, 0);
    sim.ball.vel.set(6, 1, 0);

    sim.step(0.016, idle(), idle());

    expect(sim.ball.vel.x).toBeLessThan(0);
    sim.dispose();
  });

  it('supports alley-oop lobs to a teammate near the hoop', () => {
    const events: AnnouncerEvent[] = [];
    const sim = new JamSimulation(makeConfig(), makeCallbacks(events));
    advanceToLive(sim);

    // Place P0 with ball at perimeter, P1 near the hoop
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(3, 0, 0);
    sim.players[1].pos.set(HOOP_X - 2.2, 0, 0.5);
    sim.players[2].pos.set(-5, 0, 2);
    sim.players[3].pos.set(-5, 0, -2);

    // P0 presses Turbo + Pass to throw alley-oop lob
    sim.step(0.016, { ...idle(), turbo: true, passPressed: true }, idle());
    expect(sim.ball.mode).toBe('pass');
    expect(sim.ball.isAlleyOop).toBe(true);
    expect(events.some((e) => e.text.includes('ALLEY-OOP'))).toBe(true);

    // Step until P1 catches and dunks
    let sawAlleyOopDunk = false;
    for (let i = 0; i < 50; i++) {
      sim.step(0.02, idle(), idle());
      if (sim.players[1].dunk?.style === 'alleyOop') {
        sawAlleyOopDunk = true;
        break;
      }
    }
    expect(sawAlleyOopDunk).toBe(true);
    sim.dispose();
  });

  it('supports self-lob off the backboard and spike-against-backboard dunk', () => {
    const events: AnnouncerEvent[] = [];
    const sim = new JamSimulation(makeConfig(), makeCallbacks(events));
    advanceToLive(sim);

    // P0 drives near hoop while teammate P1 is back near half-court
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(HOOP_X - 3.0, 0, 0);
    sim.players[1].pos.set(-2, 0, 0);
    sim.players[2].pos.set(-6, 0, 2);
    sim.players[3].pos.set(-6, 0, -2);

    sim.step(0.016, { ...idle(), turbo: true, passPressed: true }, idle());
    expect(sim.ball.mode).toBe('pass');
    expect(sim.ball.isBackboardLob).toBe(true);
    expect(events.some((e) => e.text.includes('OFF THE GLASS'))).toBe(true);

    // Step until P0 catches the backboard rebound mid-air and triggers backboard dunk
    let sawBackboardDunk = false;
    for (let i = 0; i < 60; i++) {
      sim.step(0.02, idle(), idle());
      if (sim.players[0].dunk?.style === 'backboard') {
        sawBackboardDunk = true;
        break;
      }
    }
    expect(sawBackboardDunk).toBe(true);
    sim.dispose();
  });

  it('supports partner-assisted launch dunk', () => {
    const events: AnnouncerEvent[] = [];
    const sim = new JamSimulation(makeConfig(), makeCallbacks(events));
    advanceToLive(sim);

    // P0 has ball outside normal solo dunk range, P1 is right next to P0
    sim.ball.carrier = 0;
    sim.ball.mode = 'held';
    sim.players[0].pos.set(HOOP_X - 6.5, 0, 0);
    sim.players[1].pos.set(HOOP_X - 7.5, 0, 0.2);

    sim.step(0.016, { ...idle(), turbo: true, shootPressed: true, shootDown: true }, idle());

    expect(sim.players[0].dunk?.style).toBe('partnerLaunch');
    expect(sim.players[0].dunk?.launcherIdx).toBe(1);
    expect(events.some((e) => e.text.includes('PARTNER LAUNCH'))).toBe(true);
    sim.dispose();
  });
});
