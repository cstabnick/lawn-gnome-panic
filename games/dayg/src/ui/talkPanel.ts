// The talk panel (quests.md "Talking to NPCs"). Step 0 stub: a hidden #dayg-talk container on the shared #ui element.
import { DOM_MORE } from '../config';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { InventorySystem, NpcActors, PlayerState, SimHost } from '../game/types';
import type { NpcId } from '../sim/types';

export interface TalkPanel { root: HTMLElement; open(npc: NpcId): void; close(): void; isOpen(): boolean }
export interface TalkDeps { host: SimHost; npcs: NpcActors; interact: Interact; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }

export function createTalkPanel(ui: HTMLElement, deps: TalkDeps): TalkPanel {
  const root = document.createElement('div');
  root.id = DOM_MORE.talk;
  root.hidden = true;
  ui.appendChild(root);
  return {
    root,
    open: (npc: NpcId): void => { /* roadmap 8.1 */ },
    close: (): void => { root.hidden = true; },
    isOpen: (): boolean => !root.hidden,
  };
}
