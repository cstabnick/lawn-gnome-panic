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

function cadenced(id: string, name: string, ms: number): BotFactory {
  return {
    id,
    name,
    create: () => wrapWithReactionCadence(createChampionV2Bot(), msToTicks(ms)),
  };
}

/** Champion v2 at three human-like reaction speeds (weak 300 ms, medium 150 ms, strong 60 ms). */
export function skillLadder(): { weak: BotFactory; medium: BotFactory; strong: BotFactory } {
  return {
    weak: cadenced('champion-v2-weak', 'Champion v2 (300 ms)', 300),
    medium: cadenced('champion-v2-medium', 'Champion v2 (150 ms)', 150),
    strong: cadenced('champion-v2-strong', 'Champion v2 (60 ms)', 60),
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
