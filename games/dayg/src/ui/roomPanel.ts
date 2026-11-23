// The room panel: solo, create, join or reopen (roadmap 8.7). Step 0 stub: a hidden #dayg-room container on the shared #ui element.
import { DOM_MORE } from '../config';
import type { RoomChoice, RoomListItem, RoomPanel } from '../game/types';

export function createRoomPanel(ui: HTMLElement): RoomPanel {
  const root = document.createElement('div');
  root.id = DOM_MORE.room;
  root.hidden = true;
  ui.appendChild(root);
  return {
    root,
    open: (): void => { /* roadmap 8.7 */ },
    close: (): void => { root.hidden = true; },
    isOpen: (): boolean => !root.hidden,
    onChoose: (fn: (c: RoomChoice) => void): void => { /* roadmap 8.7 */ },
    onOpen: (fn: () => void): void => { /* roadmap 8.7 */ },
    setWorlds: (list: readonly RoomListItem[]): void => { /* roadmap 8.7 */ },
    setStatus: (text: string): void => { /* roadmap 8.7 */ },
  };
}
