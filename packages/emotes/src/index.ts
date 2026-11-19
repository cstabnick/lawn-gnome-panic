export type { EmoteDef, EmotePose, Joint } from './types';
export { EMOTES, getEmote, isEmoteId, emptyPose, zeroPose, sampleEmote } from './catalog';
export { createEmotePlayer, type EmotePlayer } from './player';
export {
  EMOTE_LOADOUT_KEY,
  MAX_EQUIPPED,
  DEFAULT_LOADOUT,
  sanitizeLoadout,
  loadLoadout,
  saveLoadout,
  emoteAchievementId,
  unlockedEmotes,
  loadUnlockedEmotes,
  loadMyEmotes,
  type LoadoutStorage,
} from './loadout';
