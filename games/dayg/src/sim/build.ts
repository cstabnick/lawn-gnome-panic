// Building pieces (crafting.md, world.md). Step 0 stub: placePiece is real; roadmap 9.1 and 7.17 fill the rest.
import type { DailyRow, ItemStack, Piece, PieceDef, RegionId, SubjectKey, WorldState } from './types';
import type { Rng } from './rng';

export function placePiece(w: WorldState, def: PieceDef, owner: SubjectKey): Piece {
  const hp = w.tuning.build.hp[def.kind];
  const piece: Piece = { ...def, id: w.pieces.length, hp, maxHp: hp, owner, placedTick: w.tick };
  w.pieces.push(piece);
  if (def.kind === 'garden-bed') w.beds.push({ piece: piece.id, crop: null, plantedTick: 0, water: 0, tendedTick: 0, ready: false, picks: 0 });
  return piece;
}
export function damagePiece(w: WorldState, id: number, amount: number): void { /* roadmap 7.17 */ }
export function removePiece(w: WorldState, id: number): void { /* roadmap 7.17 */ }
export function piecesIn(w: WorldState, r: RegionId): Piece[] { return w.pieces.filter((p) => p.region === r && p.hp > 0); }
export function stepBuild(w: WorldState, rng: Rng): void { /* roadmap 7.17 */ }
export function defenceOf(w: WorldState, r: RegionId): number { return 0; }
export function checkSnare(w: WorldState, piece: number): ItemStack[] { return []; }
export function depthDaily(w: WorldState): Pick<DailyRow, 'piecesUp' | 'bedsGrowing' | 'farmedFood' | 'mown'> {
  return { piecesUp: 0, bedsGrowing: 0, farmedFood: 0, mown: null };
}
