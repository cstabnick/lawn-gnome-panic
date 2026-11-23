// Building pieces (crafting.md, world.md). Pieces live in the sim: Hatless pressure wears walls down, spike lines
// thin the horde, snares catch food. Pure: all randomness from the rng passed in; every knob from w.tuning.
import { bubbleIn } from './bubbles';
import { formatDate } from './chronicle';
import type { Rng } from './rng';
import { hatlessInRegion } from './horde';
import { DISTRICTS, type DailyRow, type ItemStack, type Piece, type PieceDef, type PieceKind, type RegionId, type SubjectKey, type WorldState } from './types';

const WALL_KINDS: readonly PieceKind[] = ['plank-wall', 'barricade', 'reinforced-barricade', 'stone-wall', 'door'];
const SPIKE_HP_PER_KILL = 5;

export function placePiece(w: WorldState, def: PieceDef, owner: SubjectKey): Piece {
  const hp = w.tuning.build.hp[def.kind];
  const piece: Piece = { ...def, id: w.pieces.length, hp, maxHp: hp, owner, placedTick: w.tick };
  w.pieces.push(piece);
  if (def.kind === 'garden-bed') w.beds.push({ piece: piece.id, crop: null, plantedTick: 0, water: 0, tendedTick: 0, ready: false, picks: 0 });
  return piece;
}

export function damagePiece(w: WorldState, id: number, amount: number): void {
  const p = w.pieces[id];
  if (!p || p.hp <= 0) return;
  p.hp = Math.max(0, p.hp - amount);
  if (p.hp > 0) return;
  w.events.push({ kind: 'piece-broken', piece: id, region: p.region });
  const name = w.graph.byId[p.region].name;
  w.chronicle.push({ tick: w.tick, text: `${formatDate(w.tick, w.tuning)}. The ${p.kind.replace(/-/g, ' ')} at ${name} gave way.` });
}

export function removePiece(w: WorldState, id: number): void {
  const p = w.pieces[id];
  if (p) p.hp = 0;
}

export function piecesIn(w: WorldState, r: RegionId): Piece[] { return w.pieces.filter((p) => p.region === r && p.hp > 0); }

/** Takes n Hatless out of region r: loose density first, then herds, then a promoted region's count. */
function removeHatless(w: WorldState, r: RegionId, n: number): void {
  let left = n;
  const dens = w.horde.density[r] ?? 0;
  const fromDensity = Math.min(left, dens);
  w.horde.density[r] = dens - fromDensity;
  left -= fromDensity;
  for (const h of w.horde.herds) {
    if (left <= 0) break;
    if (h.region !== r) continue;
    const take = Math.min(left, h.size);
    h.size -= take;
    left -= take;
  }
  w.horde.herds = w.horde.herds.filter((h) => h.size > 0);
  if (left > 0 && w.promoted.region === r) {
    const take = Math.min(left, w.promoted.hatless);
    w.promoted.hatless -= take;
    left -= take;
  }
}

export function stepBuild(w: WorldState, rng: Rng): void {
  const t = w.tuning.build;
  const perTick = 1 / w.tuning.clock.ticksPerDay;
  for (const reg of w.graph.regions) {
    const r = reg.id;
    if (bubbleIn(w, r) !== null) continue;   // L0 bubbles are simulated by the game
    const here = piecesIn(w, r);
    const walls = here.filter((p) => WALL_KINDS.includes(p.kind));
    const H = hatlessInRegion(w, r);
    if (H > 0 && walls.length > 0) {
      const each = (t.pushPerHatless * H) / walls.length;
      for (const p of walls) damagePiece(w, p.id, each);
    }
    for (const sp of here) {
      if (sp.kind !== 'spike-line' || sp.hp <= 0) continue;
      const cur = hatlessInRegion(w, r);
      const kills = Math.min(cur, rng.round(Math.min(cur, t.spikeKillsPerDay * perTick)));
      if (kills <= 0) continue;
      removeHatless(w, r, kills);
      w.ledger.hatlessDestroyed += kills;
      damagePiece(w, sp.id, SPIKE_HP_PER_KILL * kills);
    }
    for (const sn of here) {
      if (sn.kind !== 'snare' || sn.hp <= 0) continue;
      if (rng.chance(t.snareFoodPerDay * perTick)) w.flags[`snare:${sn.id}`] = true;
    }
  }
}

export function defenceOf(w: WorldState, r: RegionId): number {
  let sum = 0;
  for (const p of piecesIn(w, r)) if (WALL_KINDS.includes(p.kind)) sum += p.hp;
  return sum;
}

/** A set snare catches one pickled slug, booked as farmed and taken by the player. */
export function checkSnare(w: WorldState, piece: number): ItemStack[] {
  const p = w.pieces[piece];
  const key = `snare:${piece}`;
  if (!p || p.kind !== 'snare' || p.hp <= 0 || !w.flags[key]) return [];
  delete w.flags[key];
  w.ledger.farmed.food += 1;
  w.ledger.removedByPlayer.food += 1;
  return [{ def: 'pickled-slug', count: 1, condition: 1 }];
}

export function depthDaily(w: WorldState): Pick<DailyRow, 'piecesUp' | 'bedsGrowing' | 'farmedFood' | 'mown'> {
  const standing = (id: number): boolean => (w.pieces[id]?.hp ?? 0) > 0;
  const piecesUp = w.pieces.filter((p) => p.hp > 0).length;
  const bedsGrowing = w.beds.filter((b) => b.crop !== null && !b.ready && standing(b.piece)).length;
  const mown = DISTRICTS.find((d) => (w.mowing.mownUntil[d] ?? -1) > w.tick) ?? null;
  return { piecesUp, bedsGrowing, farmedFood: w.ledger.farmed.food, mown };
}
