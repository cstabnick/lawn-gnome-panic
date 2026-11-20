import { createClassicBot } from './classicBot';
import { DEFAULT_REMOTE_BOT_URL, RemoteBotController } from './remoteBot';
import { loadBotScript } from './scriptLoader';
import classicJamScript from './scripts/classic-jam.js?raw';
import downtownSniperScript from './scripts/downtown-sniper.js?raw';
import rimRusherScript from './scripts/rim-rusher.js?raw';
import type { BotController, BotPresetId, BotSlotAssignment } from './types';

export * from './types';
export * from './snapshot';
export * from './classicBot';
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
  'script-classic': 'Classic Jam (Worker Script)',
  'script-sniper': 'Downtown Sniper (Worker Script)',
  'script-rusher': 'Rim Rusher (Worker Script)',
  'remote-http': 'Python / Remote HTTP',
  'custom-script': 'Custom JS Script (Worker)',
};

export interface CreateBotOptions {
  onError?: (err: string) => void;
  onRemoteStatus?: (connected: boolean, detail?: string) => void;
}

export function createBotFromAssignment(
  assignment: BotSlotAssignment | undefined,
  opts: CreateBotOptions = {},
): BotController {
  if (!assignment || assignment.preset === 'classic') {
    return createClassicBot();
  }
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
