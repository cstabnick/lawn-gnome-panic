import {
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createChampionV1Bot,
  createChampionV2Bot,
  createClassicBot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
  setBotFactory,
  type BotController,
  type BotPresetId,
  type BotSlotAssignment,
  type CreateBotOptions,
} from '@lawn/jam';
import { DEFAULT_REMOTE_BOT_URL, RemoteBotController } from './remoteBot';
import { loadBotScript } from './scriptLoader';
import classicJamScript from './scripts/classic-jam.js?raw';
import downtownSniperScript from './scripts/downtown-sniper.js?raw';
import rimRusherScript from './scripts/rim-rusher.js?raw';

// The headless basketball (types, snapshot, classic + preset bots) lives in @lawn/jam.
export * from '@lawn/jam';
export * from './scriptLoader';
export * from './remoteBot';

export const BOT_SCRIPT_PRESETS: Record<
  'script-classic' | 'script-sniper' | 'script-rusher',
  { label: string; code: string }
> = {
  'script-classic': { label: 'Classic Jam (JS Script)', code: classicJamScript },
  'script-sniper': { label: 'Downtown Sniper (JS Script)', code: downtownSniperScript },
  'script-rusher': { label: 'Rim Rusher (JS Script)', code: rimRusherScript },
};

export const BOT_PRESET_LABELS: Record<BotPresetId, string> = {
  classic: 'Classic Jam (Built-in)',
  'shove-hound': 'Shove Hound (Enforcer)',
  'arc-architect': 'Arc Architect (3PT Spacing)',
  'fire-feeder': 'Fire Feeder (Streak Funnel)',
  'alley-oop-express': 'Alley-Oop Express (Duo Lob)',
  'lockdown-counter': 'Lockdown Counter (Rim Blocker)',
  'hybrid-ace': 'Hybrid Ace (EV Optimizer)',
  'champion-v1': 'Champion v1 (Experimental Leader)',
  'champion-v2': 'Champion v2 (Promoted Leader)',
  'script-classic': 'Classic Jam (Worker Script)',
  'script-sniper': 'Downtown Sniper (Worker Script)',
  'script-rusher': 'Rim Rusher (Worker Script)',
  'remote-http': 'Python / Remote HTTP',
  'custom-script': 'Custom JS Script (Worker)',
};

export function createBotFromAssignment(
  assignment: BotSlotAssignment | undefined,
  opts: CreateBotOptions = {},
): BotController {
  if (!assignment || assignment.preset === 'classic') {
    return createClassicBot();
  }
  if (assignment.preset === 'shove-hound') return createShoveHoundBot();
  if (assignment.preset === 'arc-architect') return createArcArchitectBot();
  if (assignment.preset === 'fire-feeder') return createFireFeederBot();
  if (assignment.preset === 'alley-oop-express') return createAlleyOopExpressBot();
  if (assignment.preset === 'lockdown-counter') return createLockdownCounterBot();
  if (assignment.preset === 'hybrid-ace') return createHybridAceBot();
  if (assignment.preset === 'champion-v1') return createChampionV1Bot();
  if (assignment.preset === 'champion-v2') return createChampionV2Bot();
  if (assignment.preset === 'remote-http') {
    return new RemoteBotController({
      url: assignment.remoteUrl || DEFAULT_REMOTE_BOT_URL,
      onStatusChange: opts.onRemoteStatus,
    });
  }
  if (assignment.preset === 'custom-script') {
    return loadBotScript(assignment.customCode || classicJamScript, {
      id: 'custom-script',
      name: 'Custom Script Bot',
      onError: opts.onError,
    });
  }
  const preset = BOT_SCRIPT_PRESETS[assignment.preset];
  return loadBotScript(preset.code, {
    id: assignment.preset,
    name: preset.label,
    onError: opts.onError,
  });
}

// Every JamSimulation built in the game uses scripts, Worker and remote bots through this factory.
setBotFactory(createBotFromAssignment);
