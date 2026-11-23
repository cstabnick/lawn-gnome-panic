// Base model: pieces, costs, repair and damage. Pure: no DOM, no three.js, no Math.random.
import type { Tag } from '../items/defs';
import { DISMANTLE, PIECES, REINFORCE, REPAIR } from './config';
import { PIECE_KINDS, type Aim, type BaseState, type Cost, type PieceKind, type PieceState, type PlotDef, type SlotKey } from './types';

// Phase 5 (online): pieces get an owner (the builder's gnome code) here; see docs/design/dayg/multiplayer.md. Not designed yet.
export function createBase(seed: number, plot: PlotDef): BaseState {
  return { version: 1, seed, plot, pieces: [], nextId: 1 };
}

export function findPiece(base: BaseState, id: string): PieceState | undefined {
  return base.pieces.find((p) => p.id === id);
}

export function piecesOn(base: BaseState, slot: SlotKey): PieceState[] {
  return base.pieces.filter((p) => p.slot === slot);
}

function isBarrier(p: PieceState): boolean {
  return p.kind === 'plank-wall' || p.kind === 'door' || (p.kind === 'barricade' && !p.overDoor);
}

export function barrierOn(base: BaseState, slot: SlotKey): PieceState | undefined {
  return base.pieces.find((p) => p.slot === slot && isBarrier(p));
}

export function canPlace(base: BaseState, kind: PieceKind, aim: Aim): string | null {
  if (PIECES[kind].slot !== aim.kind) return 'That does not go there.';
  if (aim.kind === 'edge') {
    const barrier = barrierOn(base, aim.slot);
    if (!barrier) return null;
    const overDoorTaken = piecesOn(base, aim.slot).some((p) => p.kind === 'barricade' && p.overDoor);
    if (kind === 'barricade' && barrier.kind === 'door' && !barrier.open && !overDoorTaken) return null;
    return 'Something is already built here.';
  }
  if (aim.kind === 'ladder') {
    const barrier = barrierOn(base, aim.slot);
    if (!barrier || (barrier.kind !== 'plank-wall' && barrier.kind !== 'door')) return 'A ladder needs a wall to lean on.';
    if (base.pieces.some((p) => p.kind === 'ladder' && p.slot === aim.slot && p.side === aim.side)) return 'There is a ladder here already.';
    return null;
  }
  return piecesOn(base, aim.slot).length > 0 ? 'Something is already built here.' : null;
}

export function placePiece(base: BaseState, kind: PieceKind, aim: Aim): PieceState {
  const def = PIECES[kind];
  const overDoor = kind === 'barricade' && barrierOn(base, aim.slot)?.kind === 'door';
  const side = kind === 'ladder' || overDoor ? aim.side : 1;
  const piece: PieceState = {
    id: `piece-${base.nextId++}`, kind, slot: aim.slot, side, hp: def.hp, maxHp: def.hp,
    open: false, hasLock: false, locked: false, up: false, reinforced: false, overDoor, items: [],
  };
  base.pieces.push(piece);
  return piece;
}

/** Removes the given pieces from base.pieces in place. */
function removeFrom(base: BaseState, gone: PieceState[]): void {
  for (let i = base.pieces.length - 1; i >= 0; i--) {
    if (gone.includes(base.pieces[i])) base.pieces.splice(i, 1);
  }
}

/** The piece, plus (for a plank wall or a door) the ladders on its slot. */
function removeWithLadders(base: BaseState, piece: PieceState): PieceState[] {
  const gone = [piece];
  if (piece.kind === 'plank-wall' || piece.kind === 'door') {
    for (const p of base.pieces) if (p.kind === 'ladder' && p.slot === piece.slot) gone.push(p);
  }
  removeFrom(base, gone);
  return gone;
}

export function damagePiece(base: BaseState, id: string, amount: number): PieceState[] {
  const piece = findPiece(base, id);
  if (!piece) return [];
  piece.hp -= amount;
  if (piece.hp > 0) return [];
  return removeWithLadders(base, piece);
}

/** Merges lines with the same tag (first-seen order) and drops zero counts. */
function mergeCosts(lines: readonly Cost[]): Cost[] {
  const sums = new Map<Tag, number>();
  for (const l of lines) sums.set(l.tag, (sums.get(l.tag) ?? 0) + l.count);
  const out: Cost[] = [];
  for (const [tag, count] of sums) if (count > 0) out.push({ tag, count });
  return out;
}

function pieceCostLines(piece: PieceState): Cost[] {
  return [...PIECES[piece.kind].cost, ...(piece.reinforced ? REINFORCE.cost : [])];
}

export function repairCost(piece: PieceState): Cost[] {
  return mergeCosts(pieceCostLines(piece).map((l) => ({ tag: l.tag, count: Math.ceil(l.count * REPAIR.costShare) })));
}

export function repairPiece(base: BaseState, id: string): void {
  const piece = findPiece(base, id);
  if (piece) piece.hp = piece.maxHp;
}

export function reinforcePiece(base: BaseState, id: string): void {
  const piece = findPiece(base, id);
  if (!piece || piece.kind !== 'barricade') return;
  piece.reinforced = true;
  piece.maxHp = REINFORCE.hp;
  piece.hp = REINFORCE.hp;
}

export function dismantlePiece(base: BaseState, id: string): { removed: PieceState[]; refund: Cost[] } {
  const piece = findPiece(base, id);
  if (!piece) return { removed: [], refund: [] };
  const refund = mergeCosts(pieceCostLines(piece).map((l) => ({ tag: l.tag, count: Math.floor(l.count * DISMANTLE.refundShare) })));
  return { removed: removeWithLadders(base, piece), refund };
}

export function setDoorState(base: BaseState, id: string, patch: { open?: boolean; locked?: boolean; hasLock?: boolean }): boolean {
  const door = findPiece(base, id);
  if (!door || door.kind !== 'door') return false;
  const nextOpen = patch.open ?? door.open;
  const nextHasLock = patch.hasLock ?? door.hasLock;
  let nextLocked = patch.locked ?? door.locked;
  if (patch.open === true) {
    if (door.locked) return false;
    if (piecesOn(base, door.slot).some((p) => p.kind === 'barricade' && p.overDoor)) return false;
  }
  if (patch.locked === true && (!nextHasLock || nextOpen)) return false;
  if (!nextHasLock) nextLocked = false;
  door.open = nextOpen;
  door.hasLock = nextHasLock;
  door.locked = nextLocked;
  return true;
}

export function setLadderUp(base: BaseState, id: string, up: boolean): void {
  const piece = findPiece(base, id);
  if (piece && piece.kind === 'ladder') piece.up = up;
}

export function baseHp(base: BaseState): { hp: number; maxHp: number } {
  let hp = 0;
  let maxHp = 0;
  for (const p of base.pieces) {
    if (PIECES[p.kind].slot !== 'edge') continue;
    hp += p.hp;
    maxHp += p.maxHp;
  }
  return { hp, maxHp };
}

export function serializeBase(base: BaseState): string {
  return JSON.stringify(base);
}

const SLOT_RE = /^(e:[xz]:\d+:\d+|c:\d+:\d+)$/;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function validPiece(v: unknown): v is PieceState {
  if (!isObj(v)) return false;
  if (typeof v.id !== 'string') return false;
  if (typeof v.kind !== 'string' || !(PIECE_KINDS as readonly string[]).includes(v.kind)) return false;
  if (typeof v.slot !== 'string' || !SLOT_RE.test(v.slot)) return false;
  if (v.side !== -1 && v.side !== 1) return false;
  if (!isNum(v.hp) || !isNum(v.maxHp) || !(v.maxHp > 0)) return false;
  for (const k of ['open', 'hasLock', 'locked', 'up', 'reinforced', 'overDoor']) if (typeof v[k] !== 'boolean') return false;
  if (!Array.isArray(v.items)) return false;
  return v.items.every((it) => isObj(it) && typeof it.def === 'string' && isNum(it.count) && isNum(it.condition));
}

export function parseBase(text: string): BaseState | null {
  let v: unknown;
  try { v = JSON.parse(text); } catch { return null; }
  if (!isObj(v) || v.version !== 1 || !isNum(v.seed)) return null;
  const plot = v.plot;
  if (!isObj(plot) || !isNum(plot.x0) || !isNum(plot.z0) || !isNum(plot.y) || typeof plot.region !== 'string') return null;
  if (!Number.isInteger(v.nextId) || (v.nextId as number) <= 0) return null;
  if (!Array.isArray(v.pieces) || !v.pieces.every(validPiece)) return null;
  return v as unknown as BaseState;
}
