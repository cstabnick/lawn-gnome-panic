// The hobby teachers' intro cards (E18, L66): Wenna Gudgeon at the Bent Pin (fishing), Hazel Mattock at the Tuft & Tally
// Lodge (hunting), Dunnock Pell at the Reedwatch Hide (birding). The first time the player walks up to one on foot, their
// card (cutscene/castIntros.ts) slides in once per browser.
import type { QuestSave } from './quests/types';
import { CAST_INTROS } from './cutscene/castIntros';
import { showCharacterIntro } from './cutscene/introCard';
import { SHOP } from './fishing/types';
import { LODGE } from './hunting/species';
import { HIDE } from './birding/types';

export interface HobbyIntrosDeps {
  /** The player's position. */
  player: { x: number; z: number };
  /** True when the player is on foot, not in a cutscene (cards wait otherwise). */
  onFoot(): boolean;
  /** The live quest saves (quests.getJournal().saves): Rod, Comb and Notebook unlocks once all three intros are done. */
  saves(): Record<string, QuestSave>;
  /** Unlock an achievement ('gta-rod-comb-notebook'). Repeated calls are harmless. */
  unlock(id: string): void;
}

export interface HobbyIntros {
  update(dt: number): void;
}

const STORAGE_KEY = 'gta-hobby-intros-v1';
const RANGE = 9;
const CARD_EVERY = 0.25;
const ACH_EVERY = 2;
const ACHIEVEMENT = 'gta-rod-comb-notebook';
const HOBBY_QUESTS = ['nc-bent-pin', 'nc-tuft-and-tally', 'nc-reedwatch'] as const;

const SPOTS = [
  { key: 'wenna', x: SHOP.x, z: SHOP.z },
  { key: 'hazel', x: LODGE.x, z: LODGE.z },
  { key: 'dunnock', x: HIDE.x, z: HIDE.z },
] as const;

function loadShown(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveShown(shown: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...shown]));
  } catch { /* storage blocked: the card may show again next visit */ }
}

export function installHobbyIntros(deps: HobbyIntrosDeps): HobbyIntros {
  const shown = loadShown();
  let cardTimer = 0;
  let achTimer = 0;
  let achDone = false;

  function checkCards(): void {
    if (!deps.onFoot()) return;
    for (const spot of SPOTS) {
      if (shown.has(spot.key)) continue;
      if (Math.hypot(deps.player.x - spot.x, deps.player.z - spot.z) > RANGE) continue;
      shown.add(spot.key);
      saveShown(shown);
      try {
        void showCharacterIntro(CAST_INTROS[spot.key]).catch(() => {});
      } catch { /* no DOM */ }
      return; // one card per update at most
    }
  }

  function checkAchievement(): void {
    if (achDone) return;
    const saves = deps.saves();
    if (!HOBBY_QUESTS.every((id) => saves[id]?.state === 'done')) return;
    achDone = true;
    deps.unlock(ACHIEVEMENT);
  }

  return {
    update(dt: number): void {
      cardTimer += dt;
      if (cardTimer >= CARD_EVERY) {
        cardTimer = 0;
        checkCards();
      }
      achTimer += dt;
      if (achTimer >= ACH_EVERY) {
        achTimer = 0;
        checkAchievement();
      }
    },
  };
}
