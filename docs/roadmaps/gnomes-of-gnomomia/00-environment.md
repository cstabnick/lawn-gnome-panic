# Environment (applies to every issue in this folder)

- Repo root, run every command from here: `C:/Users/cpsai/cstabnick/lawn-gnome-panic/.claude/worktrees/gnome-scrolls`
- Game folder: `games/gnomes-of-gnomomia` (Vite + TypeScript strict + three 0.187 + `@lawn/gnome`). Dependencies are installed. Do not add any.
- If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`
- Eight other workers are editing other files in this game at the same time. Edit ONLY the files your issue lists under "Change". Every other module is a stub that already exports its final signature, so import from them freely; do not change them.
- Read-only for you: `src/config.ts` (all types, tuning numbers and data tables), `src/events.ts` (the event bus), `src/state.ts` (the game state), `src/main.ts`.
- Check your work with `npx tsc --noEmit -p games/gnomes-of-gnomomia`. Errors in files you do not own may appear while others work; only yours must be clean. Do NOT run `vite build` or `npm run build`, do NOT start a dev server, do NOT `git commit`.
- UI rule: UI modules get the shared `#ui` element as `root`. Append your own container to it; never restyle or hide `#ui` itself. `#ui` has `pointer-events: none`, so set `pointer-events: auto` on your own clickable elements. Use the colours and font in `UI` from `src/config.ts`.
- Keep your code commented briefly and plainly.

## The event bus (src/events.ts), for reference

```ts
import { bus, say } from './events';
bus.on('hit', (e) => { ... });          // subscribe
bus.emit('changed', {});                // publish
say('You take 3 gold.', UI.gold);       // = bus.emit('message', { text, color })
```

Events and payloads:

| Event | Payload |
|---|---|
| `message` | `{ text: string; color?: string }` |
| `hit` | `{ attacker: number; target: number; damage: number; at: THREE.Vector3; spell?: boolean }` (ids: entity id, or `PLAYER_ID` = 0 for the player) |
| `miss` | `{ attacker: number; target: number; at: THREE.Vector3 }` |
| `heal` | `{ amount: number }` |
| `enemy-killed` | `{ defId: string; entityId: number }` |
| `item-added` | `{ item: string; count: number }` |
| `talk` | `{ npcId: string; entityId: number }` |
| `skill-up` | `{ skill: SkillId; level: number }` |
| `level-up` | `{ level: number }` |
| `player-died` | `{}` |
| `quest-updated` | `{ questId: string }` |
| `changed` | `{}` (inventory, equipment, gold, stats or quests changed) |
| `cast` | `{ spell: string; from: THREE.Vector3; to: THREE.Vector3 \| null }` |

## Module signatures (all exist now as stubs)

```ts
// src/world.ts
export function buildWorld(scene: THREE.Scene): void;
export function heightAt(x: number, z: number): number;
export function isBlocked(x: number, z: number): boolean;
export function getGroundMesh(): THREE.Object3D;
export function regionNameAt(x: number, z: number): string;

// src/pathfind.ts
export interface Point { x: number; z: number }
export function findPath(from: Point, to: Point, blocked: (x: number, z: number) => boolean): Point[];

// src/player.ts
export type PlayerAction = { type: 'attack' | 'talk' | 'take'; target: number };
export const player: { position: THREE.Vector3; facing: number; action: PlayerAction | null;
  path: { x: number; z: number }[]; model: GnomeModel | null; dead: boolean; swing: number };
export function createPlayer(scene: THREE.Scene): void;
export function walkTo(x: number, z: number): void;
export function interact(type: PlayerAction['type'], entityId: number): void;
export function stopPlayer(): void;
export function teleportPlayer(x: number, z: number): void;
export function updatePlayer(dt: number): void;

// src/entities.ts
export function spawnWorldEntities(scene: THREE.Scene): void;
export function updateEntities(dt: number): void;
export function getEntity(id: number): Entity | undefined;
export function allEntities(): readonly Entity[];
export function entityFromObject(obj: THREE.Object3D): Entity | undefined;
export function killEntity(id: number): void;
export function spawnLoot(x: number, z: number, items: InvSlot[], gold: number): Entity | null;
export function removeEntity(id: number): void;

// src/rules.ts
export function rollDice(count: number, sides: number, rng?: () => number): number;
export function attributeMod(value: number): number;
export function skillBonus(level: number): number;
export function attackRoll(bonus: number, armor: number, rng?: () => number): { hit: boolean; roll: number };
export function skillXpToNext(level: number): number;
export function useSkill(skill: SkillId, xp?: number): void;

// src/combat.ts
export function initCombat(scene: THREE.Scene): void;
export function updateCombat(dt: number): void;
export function enemyAttack(e: Entity): void;
export function castSpell(spell: SpellId): void;
export function spellCooldown(): number;

// src/camera.ts
export function initCamera(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement): void;
export function updateCamera(dt: number, target: THREE.Vector3): void;

// src/input.ts
export function initInput(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, scene: THREE.Scene): void;
export function updateInput(dt: number): void;

// src/ui/hud.ts
export interface MenuOption { label: string; onSelect: () => void }
export function createHud(root: HTMLElement): void;
export function updateHud(dt: number, camera: THREE.Camera): void;
export function setHoverText(text: string | null): void;
export function showContextMenu(x: number, y: number, options: MenuOption[]): void;
export function hideContextMenu(): void;

// src/inventory.ts
export function addItem(item: string, count?: number): boolean;
export function removeItem(item: string, count?: number): boolean;
export function countItem(item: string): number;
export function equipFromSlot(index: number): void;
export function unequip(slot: EquipSlot): void;
export function useFromSlot(index: number): void;
export function dropFromSlot(index: number): void;
export function pickUpLoot(entityId: number): void;

// src/ui/panels.ts
export function createPanels(root: HTMLElement): void;

// src/quests.ts
export function initQuests(): void;
export function questStatus(id: string): 'none' | 'active' | 'done';
export function startQuest(id: string): void;
export function checkCondition(c: Condition | undefined): boolean;

// src/ui/dialogue.ts
export function createDialogue(root: HTMLElement): void;
export function isDialogueOpen(): boolean;
export function closeDialogue(): void;

// src/ui/shop.ts
export function createShop(root: HTMLElement): void;
export function openShop(npcId: string): void;
export function closeShop(): void;

// src/audio.ts
export function initAudio(): void;

// src/save.ts
export function saveGame(): void;
export function loadGame(): boolean;
export function deleteSave(): void;

// src/ui/title.ts
export function showTitle(root: HTMLElement, hasSave: boolean): Promise<'continue' | 'new'>;
```

Keep every export of your files exactly as above (same names, parameters and return types). You may add private helpers.

## Screen layout (so UI pieces do not overlap)

- Top-left: hover text (hud.ts).
- Top-centre: region name and level-up banners (hud.ts).
- Top-right: HP / MP orbs and level (hud.ts), 3 orbs in a row, about 200 px wide, 70 px tall.
- Bottom-left: chat log, 420 x 150 px (hud.ts).
- Bottom-right: tabbed side panel, 250 x 360 px (panels.ts).
- Bottom-centre, 170 px from the bottom: dialogue box (dialogue.ts).
- Centre: shop window (shop.ts), title screen (title.ts).
- Floating over the 3D view: hitsplats, overhead HP bars (hud.ts); right-click menu (hud.ts) above everything (z-index 1000).
