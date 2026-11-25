import { createClassicBot } from './classicBot';
import {
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createChampionV1Bot,
  createChampionV2Bot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
} from './bots';
import type { BotController, BotSlotAssignment } from './types';

export interface CreateBotOptions {
  onError?: (err: string) => void;
  onRemoteStatus?: (connected: boolean, detail?: string) => void;
}

export type BotFactory = (assignment: BotSlotAssignment | undefined, opts: CreateBotOptions) => BotController;

/** Classic bot for undefined/'classic', pure preset bots by id; anything needing the game (scripts, remote) falls back to classic. */
export const defaultBotFactory: BotFactory = (assignment) => {
  switch (assignment?.preset) {
    case 'shove-hound': return createShoveHoundBot();
    case 'arc-architect': return createArcArchitectBot();
    case 'fire-feeder': return createFireFeederBot();
    case 'alley-oop-express': return createAlleyOopExpressBot();
    case 'lockdown-counter': return createLockdownCounterBot();
    case 'hybrid-ace': return createHybridAceBot();
    case 'champion-v1': return createChampionV1Bot();
    case 'champion-v2': return createChampionV2Bot();
    default: return createClassicBot();
  }
};

let current: BotFactory = defaultBotFactory;

/** Replace the factory JamSimulation uses for slots with no explicit bot. Pass null to restore the default. */
export function setBotFactory(f: BotFactory | null): void {
  current = f ?? defaultBotFactory;
}

/** Build the bot for a slot with the current factory (used by JamSimulation). */
export function createSlotBot(assignment: BotSlotAssignment | undefined, opts: CreateBotOptions = {}): BotController {
  return current(assignment, opts);
}
