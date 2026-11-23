// The ledger panel: people, factions, quests, skills (roadmap 8.2). Step 0 stub: a hidden #dayg-ledger container on the shared #ui element.
import { DOM_MORE } from '../config';
import type { Bus } from '../game/bus';
import type { LedgerPanel, LedgerTab, QuestRunner, SimHost, SkillSystem } from '../game/types';

export function createLedgerPanel(ui: HTMLElement, deps: { host: SimHost; quests: QuestRunner; skills: SkillSystem; bus: Bus }): LedgerPanel {
  const root = document.createElement('div');
  root.id = DOM_MORE.ledger;
  root.hidden = true;
  ui.appendChild(root);
  return {
    root,
    open: (tab?: LedgerTab): void => { /* roadmap 8.2 */ },
    close: (): void => { root.hidden = true; },
    toggle: (): void => { /* roadmap 8.2 */ },
    isOpen: (): boolean => !root.hidden,
  };
}
