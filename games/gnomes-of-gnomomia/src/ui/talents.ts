// Talent tree panel: one column per branch of the player's class, six tiers deep.
import { BRANCHES, TALENTS, TIER_GATE } from '../data/classes';
import { bus, say } from '../events';
import { gateLabel } from '../gates';
import { TOUCH } from './layout';
import { state } from '../state';
import { UI, type TalentDef } from '../config';
import { branchPoints, canLearn, learnTalent, respec, talentRank } from '../talents';

/** The container last drawn into; redrawn in place when talents or the level change. */
let shown: HTMLElement | null = null;

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function make(tag: string, style: Record<string, string> = {}, text?: string): HTMLElement {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Fills the talents container. Re-renders itself on talents-changed and level-up. */
export function renderTalents(container: HTMLElement): void {
  shown = container;
  draw(container);
}

function draw(c: HTMLElement): void {
  c.replaceChildren();

  if (state.classId === null) {
    c.append(make('div', { padding: '8px', color: UI.textDim }, 'Choose your Calling in Thatchford (level 5+).'));
    return;
  }
  const classId = state.classId;
  const branches = BRANCHES[classId];

  c.append(make('div', { color: UI.gold, fontWeight: 'bold' }, `Points available: ${state.skillPoints}`));

  const grid = make('div', {
    display: 'grid', gridTemplateColumns: `repeat(${branches.length}, minmax(0, 1fr))`, gap: '4px', marginTop: '6px',
  });
  for (const branch of branches) {
    const col = make('div', { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '0' });
    col.append(make('div', { textAlign: 'center', color: UI.gold, fontSize: '11px' },
      `${cap(branch)} (${branchPoints(classId, branch)})`));
    for (let tier = 1; tier <= 6; tier++) {
      const talent = Object.values(TALENTS).find((t) => t.classId === classId && t.branch === branch && t.tier === tier);
      col.append(talent ? talentCell(c, talent) : emptyCell(tier));
    }
    grid.append(col);
  }
  c.append(grid);

  const respecBtn = document.createElement('button');
  respecBtn.textContent = 'Respec';
  respecBtn.title = 'Give back every talent point';
  Object.assign(respecBtn.style, {
    marginTop: '8px', width: '100%', padding: '4px', cursor: 'pointer', color: UI.text,
    background: UI.panelBgDark, border: `1px solid ${UI.borderLight}`, fontFamily: UI.font,
  });
  respecBtn.onclick = () => {
    respec();
    draw(c);
  };
  c.append(respecBtn);
}

function talentCell(c: HTMLElement, t: TalentDef): HTMLElement {
  const rank = talentRank(t.id);
  const can = canLearn(t.id);
  // A closed quest gate: the talent shows a lock and the in-world reason (tooltip and details line).
  const why = gateLabel(t.gate);
  const cell = make('div', {
    padding: '4px 5px', boxSizing: 'border-box', minWidth: '0', minHeight: TOUCH ? '44px' : '34px',
    background: UI.panelBgDark,
    border: `1px solid ${UI.border}`, cursor: 'pointer', opacity: !can && rank === 0 ? '0.45' : '1',
  });
  cell.title = why === null ? t.about : `${t.about}\n🔒 ${why}`;
  cell.append(
    make('div', { fontSize: '11px', lineHeight: '1.2' }, why === null ? t.name : `🔒 ${t.name}`),
    make('div', { fontSize: '10px', color: UI.textDim }, `${rank}/${t.maxRank}`),
  );
  if (why !== null) cell.append(make('div', { fontSize: '10px', color: UI.bad, lineHeight: '1.2' }, why));
  cell.onclick = () => {
    if (why !== null && !can) say(why, UI.bad);
    learnTalent(t.id);
    draw(c);
  };
  return cell;
}

function emptyCell(tier: number): HTMLElement {
  return make('div', {
    padding: '4px 5px', boxSizing: 'border-box', minHeight: TOUCH ? '44px' : '34px', border: `1px dashed ${UI.border}`,
    color: UI.textDim, fontSize: '10px',
  }, `Tier ${tier} · ${TIER_GATE[tier]} pts`);
}

function redraw(): void {
  if (shown && shown.isConnected) draw(shown);
}

bus.on('talents-changed', redraw);
bus.on('level-up', redraw);
