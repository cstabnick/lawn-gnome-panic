import { allGnomeokemon } from '../prefabs/registry';
import { loadBestPhotos } from '../snap/storage';
import type { CourseId } from '../snap/types';
import { COURSE_META, getCourseSpawns } from '../snap/world';
import { el } from '../ui';

const COURSE_BG: Record<CourseId, string> = {
  lawn: 'linear-gradient(135deg, #223826 0%, #18261b 100%)',
  desert: 'linear-gradient(135deg, #3b2a1b 0%, #241b14 100%)',
  depths: 'linear-gradient(135deg, #1b2f38 0%, #142026 100%)',
  kiln: 'linear-gradient(135deg, #381e2b 0%, #22141c 100%)',
  ocean: 'linear-gradient(135deg, #123c4a 0%, #0b242d 100%)',
  night: 'linear-gradient(135deg, #1b1b3a 0%, #101124 100%)',
  frost: 'linear-gradient(135deg, #213d4d 0%, #162630 100%)',
};

export const COURSE_ORDER: readonly CourseId[] = ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost'];

function bigBtn(label: string, sub: string, onClick: () => void, primary = false): HTMLButtonElement {
  const b = el('button', {
    minHeight: '56px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: `2px solid ${primary ? 'var(--accent)' : 'var(--line)'}`,
    background: primary ? 'var(--accent)' : 'var(--panel)',
    color: primary ? '#18231a' : 'var(--ink)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  });
  b.type = 'button';
  b.append(
    el('strong', { fontSize: '16px' }, label),
    el('span', { fontSize: '12px', opacity: '0.8', color: primary ? '#18231a' : 'var(--dim)' }, sub),
  );
  b.onclick = onClick;
  b.onmouseenter = () => {
    if (!primary) b.style.borderColor = 'var(--accent)';
  };
  b.onmouseleave = () => {
    if (!primary) b.style.borderColor = 'var(--line)';
  };
  return b;
}

function statPill(label: string, value: string): HTMLElement {
  const p = el('div', { background: '#162018', border: '1px solid var(--line)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', flex: '1 1 90px' });
  p.append(el('div', { color: 'var(--dim)' }, label), el('strong', { fontSize: '15px', color: 'var(--accent)' }, value));
  return p;
}

/** The lobby: title card, progress and the doors to every room. */
export function renderLobby(
  container: HTMLElement,
  actions: { onSafari: () => void; onGnomokedex: () => void; onGallery: () => void; onQuickRide: () => void },
): void {
  container.replaceChildren();
  container.id = 'lobby';
  const best = loadBestPhotos();
  const all = allGnomeokemon();
  const snapped = all.filter((e) => Boolean(best[e.prefab.id])).length;
  const total = Object.values(best).reduce((sum, p) => sum + (p?.score?.total ?? 0), 0);
  const divine = Object.values(best).filter((p) => p?.score?.grade === 'Divine').length;

  const wrap = el('div', { padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' });
  container.append(wrap);

  wrap.append(
    el('div', { fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }, 'Fescue Field Lab'),
    el('h1', { margin: '0', fontSize: '30px', lineHeight: '1.1' }, 'Gnomokemon Snap 64'),
    el(
      'p',
      { margin: '0', color: 'var(--dim)', fontSize: '14px', lineHeight: '1.45' },
      'Hop on the Giant Fetch Dog, toss treats and Pester Clods, blow the Gnome Flute and bring your best shots back to Gnome Jesus.',
    ),
  );

  const stats = el('div', { display: 'flex', gap: '8px', flexWrap: 'wrap' });
  stats.append(statPill('Gnomokedex', `${snapped} / ${all.length}`), statPill('Total score', total.toLocaleString()), statPill('Divine', String(divine)));
  wrap.append(stats);

  const badges = el('div', { display: 'flex', gap: '6px', flexWrap: 'wrap' });
  const badge = (label: string, earned: boolean): void => {
    badges.append(
      el(
        'span',
        {
          fontSize: '11px',
          padding: '3px 9px',
          borderRadius: '999px',
          border: `1px solid ${earned ? 'var(--accent)' : 'var(--line)'}`,
          background: earned ? 'var(--panel-2)' : '#141c16',
          color: earned ? 'var(--accent)' : 'var(--dim)',
          fontWeight: earned ? '700' : '500',
          opacity: earned ? '1' : '0.6',
        },
        label,
      ),
    );
  };
  badge('📸 First Snap', snapped >= 1);
  badge('🌿 20+ Explorer', snapped >= 20);
  badge('🏆 Divine Eye', divine >= 1);
  badge('👑 Master of Fescue', snapped >= all.length);
  wrap.append(badges);

  const menu = el('div', { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' });
  menu.append(
    bigBtn('📸 Start Safari', 'Pick a course in the Map Room', actions.onSafari, true),
    bigBtn('🐾 Quick Ride', 'Straight to World 1: Fescue Lawn', actions.onQuickRide),
    bigBtn('📖 Gnomokedex', `${all.length} creature models in the Archive`, actions.onGnomokedex),
    bigBtn('🖼️ Darkroom Gallery', `${snapped}/${all.length} best prints. Recreate any shot`, actions.onGallery),
  );
  wrap.append(menu);
  wrap.append(el('div', { fontSize: '11px', color: 'var(--dim)', marginTop: '4px' }, 'Tip: use the tabs above to walk between rooms. Esc returns to the lobby.'));
}

/** The Map Room's course list. */
export function renderCourseMap(container: HTMLElement, actions: { onStartCourse: (id: CourseId) => void; onBack: () => void }): void {
  container.replaceChildren();
  container.id = 'course-map';
  const best = loadBestPhotos();
  const wrap = el('div', { padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' });
  container.append(wrap);
  wrap.append(
    el('h2', { margin: '0', fontSize: '22px', color: 'var(--accent)' }, 'Select Safari Course'),
    el('div', { color: 'var(--dim)', fontSize: '13px', marginBottom: '4px' }, 'Seven worlds in the Yard. Pick a pin on the table.'),
  );

  for (const cid of COURSE_ORDER) {
    const meta = COURSE_META[cid];
    const species = [...new Set(getCourseSpawns(cid).map((s) => s.speciesId))];
    const done = species.filter((sid) => Boolean(best[sid])).length;
    const card = el('button', {
      background: COURSE_BG[cid],
      border: '2px solid var(--line)',
      borderRadius: '12px',
      padding: '12px 14px',
      color: 'var(--ink)',
      textAlign: 'left',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minHeight: '64px',
    });
    card.type = 'button';
    card.className = 'course-card';
    card.onmouseenter = () => (card.style.borderColor = 'var(--accent)');
    card.onmouseleave = () => (card.style.borderColor = 'var(--line)');
    card.onclick = () => actions.onStartCourse(cid);
    const row = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' });
    row.append(
      el('strong', { fontSize: '16px' }, meta.label),
      el('span', { padding: '2px 9px', borderRadius: '999px', background: 'rgba(0,0,0,0.35)', fontSize: '11px', color: 'var(--accent)', fontWeight: '700', whiteSpace: 'nowrap' }, `${done}/${species.length} species`),
    );
    card.append(row, el('div', { fontSize: '12px', color: 'var(--dim)' }, meta.subtitle));
    wrap.append(card);
  }
}
