import {
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createChampionV2Bot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
  type BotController,
  type BotInput,
} from '../src/ai';
import { wrapWithReactionCadence, type BotFactory } from '../src/ai/eval';

/** Converts a reaction time in milliseconds to sim ticks at 60 Hz. */
function msToTicks(ms: number): number {
  return Math.max(1, Math.round((ms * 60) / 1000));
}

function cadenced(id: string, name: string, ms: number, make: () => BotController = createHybridAceBot): BotFactory {
  return {
    id,
    name,
    create: () => wrapWithReactionCadence(make(), msToTicks(ms)),
  };
}

/** Hybrid Ace at three human-like reaction speeds (weak 300 ms, medium 150 ms, strong 60 ms). */
export function skillLadder(): { weak: BotFactory; medium: BotFactory; strong: BotFactory } {
  return {
    weak: cadenced('hybrid-ace-weak', 'Hybrid Ace (300 ms)', 300),
    medium: cadenced('hybrid-ace-medium', 'Hybrid Ace (150 ms)', 150),
    strong: cadenced('hybrid-ace-strong', 'Hybrid Ace (60 ms)', 60),
  };
}

/** Wraps a bot so one input field is always forced to false. Keeps the base bot's id and name. */
function suppress(base: BotFactory, field: 'passPressed' | 'turbo', suffix: string, label: string): BotFactory {
  return {
    id: `${base.id}+${suffix}`,
    name: `${base.name} (${label})`,
    create: () => {
      const inner: BotController = base.create();
      const wrapped: BotController = {
        id: inner.id,
        name: inner.name,
        decide(state, ctx) {
          const out: BotInput = { ...(inner.decide(state, ctx) || {}) };
          out[field] = false;
          return out;
        },
        reset: () => inner.reset?.(),
        dispose: () => inner.dispose?.(),
      };
      return wrapped;
    },
  };
}

/** Same bot, never presses pass. Used to measure how much passing matters. */
export function noPassBot(base: BotFactory): BotFactory {
  return suppress(base, 'passPressed', 'no-pass', 'no pass');
}

/** Same bot, never turbos. Used to measure how much turbo matters. */
export function noTurboBot(base: BotFactory): BotFactory {
  return suppress(base, 'turbo', 'no-turbo', 'no turbo');
}

/** The six persona bots that get a round-robin in the scorecard. */
export function personas(): BotFactory[] {
  return [
    { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() },
    { id: 'arc-architect', name: 'Arc Architect', create: () => createArcArchitectBot() },
    { id: 'alley-oop-express', name: 'Alley-Oop Express', create: () => createAlleyOopExpressBot() },
    { id: 'lockdown-counter', name: 'Lockdown Counter', create: () => createLockdownCounterBot() },
    { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() },
    { id: 'fire-feeder', name: 'Fire Feeder', create: () => createFireFeederBot() },
  ];
}

/**
 * Same bot, but when it is about to shoot with a defender close it throws a pump fake first,
 * then takes the shot after the fake window. Used to check fakes are worth trying but not a free win.
 */
export function fakerBot(base: BotFactory, closeM = 2.6, holdTicks = 24, useFake = true): BotFactory {
  return {
    id: `${base.id}+${useFake ? 'faker' : 'waiter'}`,
    name: `${base.name} (${useFake ? 'faker' : 'waiter'})`,
    create: () => {
      const inner: BotController = base.create();
      let cool = 0;
      let pendingShoot = 0;
      return {
        id: inner.id,
        name: inner.name,
        decide(state, ctx) {
          const out: BotInput = { ...(inner.decide(state, ctx) || {}) };
          if (cool > 0) cool--;
          const me = state.players[ctx.playerIndex];
          const hasBall = state.ball.carrier === ctx.playerIndex;
          if (!hasBall) {
            pendingShoot = 0;
            return out;
          }
          if (pendingShoot > 0) {
            pendingShoot--;
            out.shootPressed = false;
            out.shootDown = false;
            if (pendingShoot === 0) {
              out.shootPressed = true;
              out.shootDown = true;
            }
            return out;
          }
          if (out.shootPressed && cool === 0) {
            const near = state.players.some(
              (o) => o.team !== me.team && Math.hypot(o.pos[0] - me.pos[0], o.pos[2] - me.pos[2]) < closeM,
            );
            if (near) {
              out.shootPressed = false;
              out.shootDown = false;
              out.fakePressed = useFake;
              pendingShoot = holdTicks;
              cool = holdTicks + 60;
            }
          }
          return out;
        },
        reset() {
          cool = 0;
          pendingShoot = 0;
          inner.reset?.();
        },
        dispose: () => inner.dispose?.(),
      };
    },
  };
}

/** Same bot, but on defense it pokes for a steal at every chance (the "just spam steal" strategy). */
export function stealSpamBot(base: BotFactory): BotFactory {
  return {
    id: `${base.id}+spam`,
    name: `${base.name} (steal spam)`,
    create: () => {
      const inner: BotController = base.create();
      return {
        id: inner.id,
        name: inner.name,
        decide(state, ctx) {
          const out: BotInput = { ...(inner.decide(state, ctx) || {}) };
          const me = state.players[ctx.playerIndex];
          const carrier = state.ball.carrier !== null ? state.players[state.ball.carrier] : null;
          if (carrier && carrier.team !== me.team) {
            const d = Math.hypot(carrier.pos[0] - me.pos[0], carrier.pos[2] - me.pos[2]);
            if (d < 1.6) out.passPressed = true;
          }
          return out;
        },
        reset: () => inner.reset?.(),
        dispose: () => inner.dispose?.(),
      };
    },
  };
}

/**
 * Flow-metrics bot: Champion v2 at 150 ms (the human-fair tier). It passes and works the ball, so it is the
 * right mirror for possession, passing and lead-change metrics. The skill ladder uses Hybrid Ace instead:
 * Champion v2 was tuned for the old quick-release meta, so its 60 ms vs 300 ms gap says little about skill.
 */
export function flowBot(): BotFactory {
  return cadenced("champion-v2-flow", "Champion v2 (150 ms)", 150, createChampionV2Bot);
}
