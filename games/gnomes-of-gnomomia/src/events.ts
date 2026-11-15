// A tiny typed event bus. Systems talk through these events instead of importing each other.
// Handlers run synchronously, in the order they subscribed.
import type * as THREE from 'three';
import type { SkillId } from './config';

export interface GameEvents {
  /** A line for the chat box. color is a CSS colour (default UI.text). */
  message: { text: string; color?: string };
  /** A hit landed. attacker/target are entity ids, or PLAYER_ID (0) for the player. at = world position of the target's feet. */
  hit: { attacker: number; target: number; damage: number; at: THREE.Vector3; spell?: boolean };
  /** An attack missed (the HUD shows a blue 0). */
  miss: { attacker: number; target: number; at: THREE.Vector3 };
  /** The player healed (potion, spell, regen is not reported). */
  heal: { amount: number };
  /** An enemy died. defId is its ENEMIES key. */
  'enemy-killed': { defId: string; entityId: number };
  /** Items went into the inventory (pickup, reward or purchase). */
  'item-added': { item: string; count: number };
  /** The player reached an NPC and starts talking. npcId is its NPCS key. */
  talk: { npcId: string; entityId: number };
  'skill-up': { skill: SkillId; level: number };
  'level-up': { level: number };
  'player-died': Record<string, never>;
  'quest-updated': { questId: string };
  /** Inventory, equipment, gold, stats or quests changed: panels redraw. */
  changed: Record<string, never>;
  /** A spell was cast (for sound and effects). */
  cast: { spell: string; from: THREE.Vector3; to: THREE.Vector3 | null };
}

type Handler<K extends keyof GameEvents> = (payload: GameEvents[K]) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers = new Map<keyof GameEvents, ((payload: any) => void)[]>();

export const bus = {
  on<K extends keyof GameEvents>(type: K, fn: Handler<K>): void {
    const list = handlers.get(type) ?? [];
    list.push(fn);
    handlers.set(type, list);
  },
  off<K extends keyof GameEvents>(type: K, fn: Handler<K>): void {
    const list = handlers.get(type);
    if (list) handlers.set(type, list.filter((h) => h !== fn));
  },
  emit<K extends keyof GameEvents>(type: K, payload: GameEvents[K]): void {
    for (const h of [...(handlers.get(type) ?? [])]) h(payload);
  },
};

/** Shorthand for bus.emit('message', ...). */
export function say(text: string, color?: string): void {
  bus.emit('message', { text, color });
}
