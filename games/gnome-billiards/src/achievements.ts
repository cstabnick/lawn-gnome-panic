// Gnome Billiards' achievements: the game calls these, the tracker unlocks and shows the toast (see achievements' README).
import { createAchievementTracker } from '@lawn/achievements';

export interface BilliardsAchievements {
  firstPot(): void;
  breakThree(): void;
  scratch(): void;
  cpuWin(): void;
  onlineWin(): void;
  gameDone(): void;
  crackedWin(): void;
  challengeClear(): void;
  highRoller(): void;
}

export function createBilliardsAchievements(ui: HTMLElement): BilliardsAchievements {
  const tracker = createAchievementTracker({ ui });
  return {
    firstPot: () => void tracker.unlock('billiards-first-pot'),
    breakThree: () => void tracker.unlock('billiards-break-three'),
    scratch: () => void tracker.unlock('billiards-scratch'),
    cpuWin: () => void tracker.unlock('billiards-cpu-win'),
    onlineWin: () => void tracker.unlock('billiards-online-win'),
    gameDone: () => void tracker.increment('billiards-regular'),
    crackedWin: () => void tracker.unlock('billiards-cracked-win'),
    challengeClear: () => void tracker.unlock('billiards-challenge-clear'),
    highRoller: () => void tracker.unlock('billiards-high-roller'),
  };
}
