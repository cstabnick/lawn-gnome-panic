// Build-mode controller: hammer in hand, claim or build a base, pick a piece, see the ghost, place it, repair, take down, fit a lock, reinforce.
import type { Bus } from '../game/bus';
import type { InventorySystem, PlayerState } from '../game/types';
import type { Collider } from '../world/collide';
import type { BaseSystem } from './system';
import type { BaseView } from './view';
import { createBuildUi, type BuildUiHandlers, type BuildUiState } from './buildUi';
import { BUILD_NOISE, BUILD_RANGE, DISMANTLE, LOCK, PIECES, REINFORCE, REPAIR, TAG_ITEM } from './config';
import { PIECE_KINDS } from './types';
import { aimAt, boxHitsCircle, claimCheck, pieceBox, plotContains, snapPlot } from './grid';
import { barrierOn, baseHp, canPlace, findPiece, piecesOn, repairCost } from './model';
import { hasTag, type Tag } from '../items/defs';
import type { ItemStack } from '../sim/types';
import type { Aim, ClaimResult, Cost, PieceKind, PieceState, PlotDef } from './types';

export interface BuildDeps { base: BaseSystem; view: BaseView; ui: HTMLElement; inv: InventorySystem; collider: Collider; bus: Bus; getPlayer: () => PlayerState; getAim: () => number }
export interface BuildController { active(): boolean; open(): void; update(dt: number): void }

const SAMPLE_BUILD: BuildUiState = {
  mode: 'build', canBuild: true, claim: null,
  pieces: PIECE_KINDS.map((kind, i) => {
    const p = PIECES[kind];
    return { kind, name: p.name, prefab: p.prefab, cost: p.cost.map((c) => `${c.tag} ${c.count}`).join(', '), affordable: i < 4 };
  }),
  selected: 'plank-wall',
  target: { name: 'Plank wall', hp: 70, maxHp: 120, repair: 'PLANK 1, NAIL 2', canRepair: true, canDismantle: true, action: { label: 'Reinforce', enabled: false } },
  status: 'Plank wall: 45 s',
  baseHp: { hp: 430, maxHp: 600 },
};
const SAMPLE_CLAIM: BuildUiState = {
  mode: 'claim', canBuild: true, claim: { ok: false, why: 'The ground is not flat here.' },
  pieces: [], selected: null, target: null, status: null, baseHp: null,
};
const NOTE_SECONDS = 3;
const PLOT_HALF = 6;                 // half a plot's width: the snapped plot's centre offset
const ABANDON_WINDOW = 3;

const costText = (cost: readonly Cost[]): string => cost.map((c) => `${c.tag} ${c.count}`).join(', ');

export function createBuildController(deps: BuildDeps): BuildController {
  const { base, view, inv, collider, bus, getPlayer, getAim } = deps;
  const sample = new URLSearchParams(location.search).get('buildui');

  type Mode = 'off' | 'claim' | 'build';
  let mode: Mode = 'off';
  let t = 0;
  let selected: PieceKind = PIECE_KINDS[0];
  let claimRes: ClaimResult | null = null;
  let lastAim: Aim | null = null;
  let lastWhy: string | null = null;
  let statusNow: string | null = null;
  let targetId: string | null = null;
  let targetView: BuildUiState['target'] = null;
  let abandonAt: number | null = null;
  const handlers: BuildUiHandlers = { toggle, select, place, repair, dismantle, targetAction, claim, abandon, exit };
  let note: { text: string; until: number } | null = null;

  const say = (text: string, seconds = NOTE_SECONDS): void => { note = { text, until: t + seconds }; };
  const have = (tag: Tag): number => inv.countTag(tag);
  const affordable = (cost: readonly Cost[]): boolean => cost.every((c) => have(c.tag) >= c.count);
  const missingCost = (cost: readonly Cost[]): string | null => {
    const c = cost.find((line) => have(line.tag) < line.count);
    return c ? `Needs ${c.count - have(c.tag)} more ${c.tag}` : null;
  };
  const missingTool = (tools: readonly Tag[]): string | null => {
    const tool = tools.find((tg) => have(tg) === 0);
    return tool ? `Needs a ${tool}` : null;
  };
  const spend = (cost: readonly Cost[]): void => { for (const c of cost) inv.consumeTag(c.tag, c.count); };
  const heldHammer = (): boolean => { const h = inv.held(); return !!h && hasTag(h.def, 'HAMMER'); };
  const hasTool = (tag: Tag): boolean => have(tag) > 0;

  function open(): void {
    if (mode !== 'off') return;
    if (have('HAMMER') === 0) { say('Hold a hammer to build.'); return; }
    if (!heldHammer()) {
      const ref = inv.findTag('HAMMER');
      if (ref) inv.move(ref, { where: 'hand', index: 0 });
    }
    mode = base.state() ? 'build' : 'claim';
  }

  function exit(): void {
    mode = 'off';
    targetId = null;
    targetView = null;
    lastAim = null;
    lastWhy = null;
    statusNow = null;
    view.showGhost(null, null, null, false);
    view.showPlot(null);
  }

  function toggle(): void { if (mode === 'off') open(); else exit(); }

  function select(kind: PieceKind): void { selected = kind; }

  function claim(): void {
    if (mode !== 'claim') return;
    if (!claimRes || !claimRes.ok) { say(claimRes && !claimRes.ok && claimRes.why ? claimRes.why : 'Nothing to claim here.'); return; }
    if (base.claim(claimRes.plot)) { mode = 'build'; say('Base claimed.'); }
    else say('You cannot claim this plot.');
  }

  function abandon(): void {
    if (abandonAt !== null && t - abandonAt <= ABANDON_WINDOW) {
      abandonAt = null;
      base.abandon();
      mode = 'claim';
      targetId = null;
      targetView = null;
      say('Base abandoned.');
      return;
    }
    abandonAt = t;
    say('Press ABANDON again to give up this base.', ABANDON_WINDOW);
  }

  function buildTarget(piece: PieceState): NonNullable<BuildUiState['target']> {
    const rc = repairCost(piece);
    const action = piece.kind === 'door' && !piece.hasLock
      ? { label: 'Fit lock', enabled: affordable(LOCK.cost) && hasTool('HAMMER') }
      : piece.kind === 'barricade' && !piece.reinforced
        ? { label: 'Reinforce', enabled: affordable(REINFORCE.cost) }
        : null;
    return {
      name: PIECES[piece.kind].name,
      hp: piece.hp,
      maxHp: piece.maxHp,
      repair: rc.length > 0 ? costText(rc) : null,
      canRepair: piece.hp < piece.maxHp && affordable(rc),
      canDismantle: true,
      action,
    };
  }

  function currentPiece(): PieceState | null {
    const st = base.state();
    return st && targetId ? findPiece(st, targetId) ?? null : null;
  }

  function place(): void {
    if (mode !== 'build') return;
    if (lastWhy !== null) { say(lastWhy); return; }
    const aim = lastAim;
    if (!aim) return;
    const kind = selected;
    const def = PIECES[kind];
    const started = base.startWork(`Building: ${def.name}`, def.seconds, () => {
      const st = base.state();
      if (!st) return;
      const why = canPlace(st, kind, aim) ?? missingCost(def.cost) ?? missingTool(def.tools);
      if (why) { say(why); return; }
      if (!base.place(kind, aim)) { say('Something is in the way.'); return; }
      spend(def.cost);
      const pos = getPlayer().pos;
      bus.emit('noise', { x: pos.x, z: pos.z, radius: BUILD_NOISE, source: 'other' });
      say(`${def.name} is up.`);
    });
    if (!started) say('Busy.');
  }

  function repair(): void {
    if (mode !== 'build') return;
    const piece = currentPiece();
    if (!piece) { say('Aim at a piece to repair it.'); return; }
    if (piece.hp >= piece.maxHp) { say('It is not damaged.'); return; }
    const cost = repairCost(piece);
    if (!affordable(cost)) { say(missingCost(cost) ?? 'Not enough materials.'); return; }
    const id = piece.id;
    const started = base.startWork('Repairing', REPAIR.seconds, () => {
      if (!affordable(cost)) { say(missingCost(cost) ?? 'Not enough materials.'); return; }
      spend(cost);
      base.repair(id);
      say('Repaired.');
    });
    if (!started) say('Busy.');
  }

  function dismantle(): void {
    if (mode !== 'build') return;
    const piece = currentPiece();
    if (!piece) { say('Aim at a piece to take it down.'); return; }
    const id = piece.id;
    const started = base.startWork('Taking it down', DISMANTLE.seconds, () => {
      const st = base.state();
      const cur = st ? findPiece(st, id) : undefined;
      if (!cur) return;
      const items: ItemStack[] = cur.items.map((s) => ({ ...s }));
      const refund = base.dismantle(id);
      let overflow = false;
      for (const c of refund) {
        const def = TAG_ITEM[c.tag];
        if (!def || c.count <= 0) continue;
        if (inv.add({ def, count: c.count, condition: 1 })) overflow = true;
      }
      for (const s of items) if (inv.add(s)) overflow = true;
      say(overflow ? 'Some of it does not fit in your pack.' : 'Taken down.');
    });
    if (!started) say('Busy.');
  }

  function targetAction(): void {
    if (mode !== 'build') return;
    const piece = currentPiece();
    if (!piece) { say('Aim at a piece first.'); return; }
    const id = piece.id;
    if (piece.kind === 'door' && !piece.hasLock) {
      if (!affordable(LOCK.cost) || !hasTool('HAMMER')) { say(missingCost(LOCK.cost) ?? missingTool(LOCK.tools) ?? 'Not enough materials.'); return; }
      const started = base.startWork('Fitting a lock', LOCK.seconds, () => {
        if (!affordable(LOCK.cost)) { say(missingCost(LOCK.cost) ?? 'Not enough materials.'); return; }
        spend(LOCK.cost);
        base.setDoor(id, { hasLock: true });
        const leftover = inv.add({ def: LOCK.key, count: 1, condition: 1 });
        say(leftover ? 'You fit the lock, but the key does not fit in your pack.' : 'You fit the lock and keep the key.');
      });
      if (!started) say('Busy.');
      return;
    }
    if (piece.kind === 'barricade' && !piece.reinforced) {
      if (!affordable(REINFORCE.cost)) { say(missingCost(REINFORCE.cost) ?? 'Not enough materials.'); return; }
      const started = base.startWork('Reinforcing', REINFORCE.seconds, () => {
        if (!affordable(REINFORCE.cost)) { say(missingCost(REINFORCE.cost) ?? 'Not enough materials.'); return; }
        spend(REINFORCE.cost);
        base.reinforce(id);
        say('Reinforced.');
      });
      if (!started) say('Busy.');
      return;
    }
    say('Nothing to do here.');
  }

  function exitIfLost(p: PlayerState): void {
    if (mode !== 'off' && (!p.alive || !heldHammer())) exit();
  }

  function updateClaim(p: PlayerState): void {
    const r = claimCheck(collider, p.pos.x, p.pos.y, p.pos.z);
    claimRes = r;
    if (r.ok) { view.showPlot(r.plot); return; }
    const s = snapPlot(p.pos.x, p.pos.z);
    const region = collider.regionAt(s.x0 + PLOT_HALF, s.z0 + PLOT_HALF);
    view.showPlot(region ? { x0: s.x0, z0: s.z0, y: p.pos.y, region } : null);
  }

  function updateBuild(p: PlayerState): void {
    const st = base.state();
    if (!st) { mode = 'claim'; return; }
    const plot: PlotDef = st.plot;
    targetId = null;
    targetView = null;
    lastAim = null;
    lastWhy = null;
    statusNow = null;
    view.showPlot(plot);
    if (!plotContains(plot, p.pos.x, p.pos.z, BUILD_RANGE)) {
      statusNow = 'Too far from your base.';
      view.showGhost(null, null, null, false);
      return;
    }
    const def = PIECES[selected];
    const aim = aimAt(plot, p.pos.x, p.pos.z, getAim(), def.slot);
    let why: string | null = null;
    if (!aim) {
      why = 'Aim at the base.';
    } else {
      why = canPlace(st, selected, aim) ?? missingCost(def.cost) ?? missingTool(def.tools);
      if (why === null) {
        const overDoor = selected === 'barricade' && aim.kind === 'edge' && barrierOn(st, aim.slot)?.kind === 'door';
        const box = pieceBox(plot, { kind: selected, slot: aim.slot, side: aim.side, overDoor, open: false });
        if (box && boxHitsCircle(box, p.pos.x, p.pos.z, 0.5)) why = 'Step out of the way.';
      }
    }
    view.showGhost(selected, plot, aim, why === null);
    lastAim = aim;
    lastWhy = why;
    statusNow = why ?? `${def.name}: ${def.seconds} s`;
    if (aim && (aim.kind === 'edge' || aim.kind === 'cell')) {
      const piece = piecesOn(st, aim.slot)[0];
      if (piece) { targetId = piece.id; targetView = buildTarget(piece); }
    }
  }

  function snapshot(): BuildUiState {
    const st = base.state();
    const shownNote = note && t < note.until ? note.text : null;
    return {
      mode,
      canBuild: have('HAMMER') > 0,
      claim: mode === 'claim' && claimRes ? (claimRes.ok ? { ok: true, why: null } : { ok: false, why: claimRes.why }) : null,
      pieces: PIECE_KINDS.map((kind) => {
        const d = PIECES[kind];
        return { kind, name: d.name, prefab: d.prefab, cost: costText(d.cost), affordable: affordable(d.cost) };
      }),
      selected,
      target: mode === 'build' ? targetView : null,
      status: mode === 'build' ? (shownNote ?? statusNow) : shownNote,
      baseHp: mode === 'build' && st ? baseHp(st) : null,
    };
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const tg = e.target as HTMLElement | null;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (e.code === 'KeyB') { toggle(); return; }
    if (mode === 'off') return;
    const digit = /^Digit([1-9])$/.exec(e.code);
    if (digit) { const kind = PIECE_KINDS[Number(digit[1]) - 1]; if (kind) select(kind); return; }
    switch (e.code) {
      case 'KeyF': place(); break;
      case 'KeyG': repair(); break;
      case 'KeyX': dismantle(); break;
      case 'KeyT': targetAction(); break;
      case 'Escape': exit(); break;
      default: break;
    }
  };
  const ui = createBuildUi(deps.ui, handlers);
  if (sample === '1') { ui.update(SAMPLE_BUILD); ui.setVisible(true); return { active: () => false, open: () => {}, update: () => {} }; }
  if (sample === 'claim') { ui.update(SAMPLE_CLAIM); ui.setVisible(true); return { active: () => false, open: () => {}, update: () => {} }; }
  window.addEventListener('keydown', onKey);

  return {
    active: () => mode !== 'off',
    open,
    update(dt: number): void {
      t += dt;
      const p = getPlayer();
      exitIfLost(p);
      if (mode === 'claim') updateClaim(p);
      else if (mode === 'build') updateBuild(p);
      ui.update(snapshot());
      ui.setVisible(p.alive);
    },
  };
}

