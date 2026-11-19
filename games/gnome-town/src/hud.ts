// The town's DOM interface, inside its own container appended to #ui: room name and online status (top left),
// account and map buttons (top right), the action button ("Enter the Gnomecino", "Play Blackjack"; bottom centre),
// chat log, chat input and emote picker (bottom). Phone-first: 44 px targets, safe-area insets, no hover.
// STUB: replaced by the hud issue; keep the export names and signatures.
import type { EmoteId, MapId, NetStatus } from './config';

export interface HudHandlers {
  /** The player sent a chat line (already trimmed, not empty). */
  onChat(text: string): void;
  onEmote(e: EmoteId): void;
  /** The action button was pressed. */
  onAction(): void;
  /** The account button was pressed. */
  onAccount(): void;
  /** A map was picked in the map panel. */
  onTravel(map: MapId): void;
}

export interface Hud {
  setMapName(name: string): void;
  /** inRoom: players on my map, me included; inTown: players in the whole town. */
  setStatus(status: NetStatus, inRoom: number, inTown: number): void;
  /** Shows the action button with this label, or hides it (null). */
  setAction(label: string | null): void;
  /** Appends a chat line to the log. */
  log(name: string, color: number, text: string): void;
  /** Appends a grey system line to the log ("You entered the Gnomecino."). */
  system(text: string): void;
  /** The account button's label, e.g. "👤 Guest" or "👤 Pip". */
  setAccount(label: string): void;
  /** True while the chat input has focus (main.ts then ignores movement keys). */
  readonly typing: boolean;
  /** Focuses the chat input (Enter key on desktop). */
  focusChat(): void;
  /** Hides the whole HUD while a game is open over the town, shows it again after. */
  setVisible(visible: boolean): void;
}

export function createHud(ui: HTMLElement, h: HudHandlers): Hud {
  void ui; void h;
  return {
    setMapName() {},
    setStatus() {},
    setAction() {},
    log() {},
    system() {},
    setAccount() {},
    typing: false,
    focusChat() {},
    setVisible() {},
  };
}
