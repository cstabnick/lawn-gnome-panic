import { allGnomeokemon, gnomeokemonIcon } from '../prefabs/registry';
import {
  COURSE_ORDER,
  COURSE_STORY,
  computeTotalPoints,
  getHighestUnlockedIncompleteCourse,
  getLabRank,
  getNextLockedCourse,
  getUnlockedCourses,
  isCourseUnlocked,
} from '../snap/progression';
import { loadBestPhotos } from '../snap/storage';
import type { CourseId, PhotoGrade } from '../snap/types';
import { COURSE_META, getCourseSpawns } from '../snap/world';
import { PANE_PAD, el, paneHead } from '../ui';

export { COURSE_ORDER };

const COURSE_BG: Record<CourseId, string> = {
  lawn: 'linear-gradient(135deg, #223826 0%, #18261b 100%)',
  desert: 'linear-gradient(135deg, #3b2a1b 0%, #241b14 100%)',
  city: 'linear-gradient(135deg, #3a3d42 0%, #1d2024 100%)',
  depths: 'linear-gradient(135deg, #1b2f38 0%, #142026 100%)',
  kiln: 'linear-gradient(135deg, #381e2b 0%, #22141c 100%)',
  ocean: 'linear-gradient(135deg, #123c4a 0%, #0b242d 100%)',
  night: 'linear-gradient(135deg, #1b1b3a 0%, #101124 100%)',
  frost: 'linear-gradient(135deg, #213d4d 0%, #162630 100%)',
};

const GRADE_COLOR: Record<PhotoGrade, string> = { Divine: '#ffe066', Gold: '#ffd166', Silver: '#cbd5e1', Bronze: '#d99b66' };

/** A small circular progress meter with text in the middle. */
function ring(done: number, total: number, size = 84): HTMLElement {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, done / total) : 0;
  const wrap = el('div', { position: 'relative', width: `${size}px`, height: `${size}px`, flex: '0 0 auto' });
  wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2a3c2e" stroke-width="7"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#ffcc33" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${(c * frac).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
  const label = el('div', { position: 'absolute', inset: '0', display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: '1.05' });
  label.append(el('strong', { fontSize: `${Math.round(size * 0.24)}px`, color: '#ffcc33' }, `${done}/${total}`), el('span', { fontSize: '9px', color: 'var(--dim)' }, 'snapped'));
  wrap.append(label);
  return wrap;
}

function sectionHead(title: string, hint?: string): HTMLElement {
  const row = el('div', { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', margin: '4px 0 -2px' });
  row.append(el('div', { fontSize: '12px', fontWeight: '800', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--accent)' }, title));
  if (hint) row.append(el('div', { fontSize: '11px', color: 'var(--dim)' }, hint));
  return row;
}

function courseDisplayName(courseId: CourseId): string {
  return COURSE_META[courseId].label.replace(/^\S+\s+/, '');
}

function buildProgressCard(
  total: number,
  options: { showHeaderStats?: boolean; allUnlockedLabel: string },
): HTMLElement {
  const rank = getLabRank(total);
  const nextLocked = getNextLockedCourse(total);
  const card = el('div', {
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid var(--line)',
    background: 'var(--panel)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  });

  if (options.showHeaderStats) {
    const top = el('div', {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      flexWrap: 'wrap',
    });
    top.append(
      el('span', { fontSize: '12px', fontWeight: '800', color: 'var(--ink)' }, `⭐ ${total.toLocaleString()} pts`),
      el(
        'span',
        {
          fontSize: '11px',
          fontWeight: '800',
          color: 'var(--accent)',
          background: 'rgba(255,204,51,0.12)',
          border: '1px solid rgba(255,204,51,0.35)',
          borderRadius: '999px',
          padding: '2px 8px',
        },
        `🎖️ ${rank.current.title}`,
      ),
    );
    card.append(top);
  }

  let label: string;
  let frac: number;
  if (nextLocked) {
    label = `Next map: ${courseDisplayName(nextLocked.courseId)} (${total.toLocaleString()} / ${nextLocked.unlockPts.toLocaleString()} pts)`;
    frac = Math.min(1, Math.max(0, total / Math.max(1, nextLocked.unlockPts)));
  } else if (rank.next) {
    label = `${options.allUnlockedLabel} · Next rank: ${rank.next.title} (${total.toLocaleString()} / ${rank.next.minPts.toLocaleString()} pts)`;
    frac = rank.progressFrac;
  } else {
    label = `${options.allUnlockedLabel} · ${rank.current.title}`;
    frac = 1;
  }

  card.append(el('div', { fontSize: '11px', color: 'var(--dim)', lineHeight: '1.3' }, label));
  const bar = el('div', { height: '6px', borderRadius: '999px', background: 'rgba(0,0,0,0.42)', overflow: 'hidden' });
  bar.append(el('div', { height: '100%', width: `${(frac * 100).toFixed(1)}%`, background: 'var(--accent)' }));
  card.append(bar);
  return card;
}

export interface LobbyActions {
  onSafari: () => void;
  onGnomokedex: () => void;
  onGallery: () => void;
  onQuickRide: (course?: CourseId) => void;
  onOptions: () => void;
  onMap: () => void;
}

/** The lobby: your progress, a big Start Safari card, a floor plan of the house you can click, and your latest prints. */
export function renderLobby(container: HTMLElement, actions: LobbyActions): void {
  container.replaceChildren();
  container.id = 'lobby';
  const best = loadBestPhotos();
  const all = allGnomeokemon();
  const snapped = all.filter((e) => Boolean(best[e.prefab.id])).length;
  const total = computeTotalPoints(best);
  const rank = getLabRank(total);
  const unlockedCount = getUnlockedCourses(total).length;
  const divine = Object.values(best).filter((p) => p?.score?.grade === 'Divine').length;

  const wrap = el('div', { padding: PANE_PAD, display: 'flex', flexDirection: 'column', gap: '14px' });
  container.append(wrap);

  // Header: the shared pane head, and the Gnomokedex progress ring beside the stats.
  const head = el('div', { display: 'flex', alignItems: 'center', gap: '14px' });
  const titleBox = paneHead({ eyebrow: 'Lobby', title: 'Gnomokemon Snap 64' });
  titleBox.style.flex = '1 1 auto';
  const stats = el('div', { display: 'flex', gap: '8px 12px', marginTop: '4px', fontSize: '12px', color: 'var(--dim)', flexWrap: 'wrap', alignItems: 'center' });
  titleBox.append(stats);
  stats.append(
    el('span', {}, `⭐ ${total.toLocaleString()} pts`),
    el('span', {}, `🏆 ${divine} Divine`),
    el(
      'span',
      {
        fontSize: '11px',
        fontWeight: '800',
        color: 'var(--accent)',
        background: 'rgba(255,204,51,0.12)',
        border: '1px solid rgba(255,204,51,0.35)',
        borderRadius: '999px',
        padding: '2px 8px',
      },
      `🎖️ ${rank.current.title}`,
    ),
  );
  head.append(titleBox, ring(snapped, all.length));
  wrap.append(head, buildProgressCard(total, { allUnlockedLabel: `All ${COURSE_ORDER.length} maps unlocked` }));

  // Hero: the one thing most people want.
  const hero = el('button', {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '104px',
    padding: '14px 16px',
    borderRadius: '16px',
    border: '2px solid var(--accent)',
    background: 'linear-gradient(120deg, #ffcc33 0%, #ffb300 100%)',
    color: '#18231a',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 6px 18px rgba(255,204,51,0.25)',
  });
  hero.type = 'button';
  hero.id = 'lobby-start';
  hero.append(
    el('div', { fontSize: '44px', lineHeight: '1' }, '📸'),
    (() => {
      const t = el('div', { flex: '1 1 auto' });
      t.append(
        el('div', { fontSize: '20px', fontWeight: '900' }, 'Start Safari'),
        el('div', { fontSize: '12px', opacity: '0.8', marginTop: '2px' }, 'Pick a course on the map table, then ride the dog.'),
      );
      return t;
    })(),
    el('div', { fontSize: '26px', fontWeight: '900' }, '→'),
  );
  hero.onclick = actions.onSafari;
  wrap.append(hero);

  const quickCourse = getHighestUnlockedIncompleteCourse(best, (c) => [...new Set(getCourseSpawns(c).map((s) => s.speciesId))]);
  const quick = el('button', {
    minHeight: '44px',
    padding: '8px 14px',
    borderRadius: '12px',
    border: '1px solid var(--line)',
    background: 'var(--panel)',
    color: 'var(--ink)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
    textAlign: 'left',
  }, `🐾 Quick Ride: Ch. ${COURSE_STORY[quickCourse].chapter} — ${courseDisplayName(quickCourse)}`);
  quick.type = 'button';
  quick.onclick = () => actions.onQuickRide(quickCourse);
  wrap.append(quick);

  // The floor plan: click a room and the camera walks there.
  wrap.append(sectionHead('Walk to a room', 'you are here: Lobby'));
  const plan = el('div', { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', padding: '8px', background: '#121b14', border: '1px solid var(--line)', borderRadius: '14px' });
  plan.id = 'floor-plan';
  const courseDone = COURSE_ORDER.filter((c) => {
    const sp = [...new Set(getCourseSpawns(c).map((s) => s.speciesId))];
    return sp.every((id) => Boolean(best[id]));
  }).length;
  const cell = (icon: string, name: string, sub: string, onClick: (() => void) | null, here = false): HTMLElement => {
    const b = el('button', {
      minHeight: '66px',
      padding: '6px 4px',
      borderRadius: '10px',
      border: `2px solid ${here ? 'var(--accent)' : 'var(--line)'}`,
      background: here ? '#2f3a22' : onClick ? 'var(--panel)' : '#141c16',
      color: onClick || here ? 'var(--ink)' : 'var(--dim)',
      cursor: onClick ? 'pointer' : 'default',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1px',
      opacity: onClick || here ? '1' : '0.6',
    });
    b.type = 'button';
    b.disabled = !onClick;
    b.append(el('span', { fontSize: '22px', lineHeight: '1.1' }, icon), el('strong', { fontSize: '12px' }, name), el('span', { fontSize: '10px', color: 'var(--dim)' }, sub));
    if (here) b.append(el('span', { fontSize: '9px', color: 'var(--accent)', fontWeight: '800' }, '● YOU ARE HERE'));
    if (onClick) b.onclick = onClick;
    return b;
  };
  // Upstairs first, as in the house.
  plan.append(
    cell('🪞', 'Dressing Room', 'options + mirror', actions.onOptions),
    cell('⚖️', 'Grading Office', 'opens after a ride', null),
    cell('🖼️', 'Darkroom', `${snapped}/${all.length} prints`, actions.onGallery),
    cell('🗺️', 'Map Room', `${unlockedCount}/${COURSE_ORDER.length} open · ${courseDone} done`, actions.onMap),
    cell('🏠', 'Lobby', 'stairs up', null, true),
    cell('📖', 'Archive', `${all.length} models`, actions.onGnomokedex),
  );
  wrap.append(plan);

  // Latest prints.
  const recent = Object.values(best)
    .filter((p) => Boolean(p))
    .sort((a, b) => b.capturedAt - a.capturedAt)
    .slice(0, 4);
  wrap.append(sectionHead('Latest prints', recent.length ? 'tap to open the Darkroom' : 'nothing on the line yet'));
  const strip = el('div', { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' });
  strip.id = 'recent-prints';
  for (let i = 0; i < 4; i++) {
    const p = recent[i];
    const slot = el('button', {
      position: 'relative',
      aspectRatio: '4 / 3',
      borderRadius: '8px',
      border: `2px solid ${p ? GRADE_COLOR[p.score.grade] : 'var(--line)'}`,
      background: p ? `center / cover url(${p.dataUrl})` : '#141c16',
      cursor: p ? 'pointer' : 'default',
      padding: '0',
      minHeight: '44px',
    });
    slot.type = 'button';
    slot.disabled = !p;
    if (p) {
      slot.title = `${p.name}: ${p.score.grade}`;
      slot.append(el('span', { position: 'absolute', left: '3px', bottom: '3px', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '999px', background: 'rgba(0,0,0,0.7)', color: GRADE_COLOR[p.score.grade] }, p.score.grade));
      slot.onclick = actions.onGallery;
    } else {
      slot.append(el('span', { color: 'var(--dim)', fontSize: '18px' }, '＋'));
    }
    strip.append(slot);
  }
  wrap.append(strip);

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
  wrap.append(sectionHead('Badges'), badges);
  wrap.append(el('div', { fontSize: '11px', color: 'var(--dim)' }, 'Tap an orb at the top to walk to that room. Keys 1–5 do the same, and Esc returns to the lobby.'));
}

/** The Map Room's course list: each world with its creatures, your progress and a "next up" marker. */
export function renderCourseMap(container: HTMLElement, actions: { onStartCourse: (id: CourseId) => void; onBack: () => void }): void {
  container.replaceChildren();
  container.id = 'course-map';
  const best = loadBestPhotos();
  const total = computeTotalPoints(best);
  const wrap = el('div', { padding: PANE_PAD, display: 'flex', flexDirection: 'column', gap: '10px' });
  container.append(wrap);
  wrap.append(
    paneHead({ eyebrow: 'Map Room', title: 'Select Safari Course', hint: 'Seven chapters in the Yard. Earn points to unlock new routes.' }),
    buildProgressCard(total, { showHeaderStats: true, allUnlockedLabel: `All ${COURSE_ORDER.length} chapters unlocked!` }),
  );

  const stats = COURSE_ORDER.map((cid) => {
    const species = [...new Set(getCourseSpawns(cid).map((s) => s.speciesId))];
    const done = species.filter((sid) => Boolean(best[sid])).length;
    return { cid, species, done };
  });
  const nextUp = stats.find((s) => isCourseUnlocked(s.cid, total) && s.done < s.species.length)?.cid;

  stats.forEach(({ cid, species, done }) => {
    const meta = COURSE_META[cid];
    const story = COURSE_STORY[cid];
    const unlocked = isCourseUnlocked(cid, total);
    const [emoji, ...rest] = meta.label.split(' ');
    const complete = done === species.length;
    const card = el('button', {
      background: COURSE_BG[cid],
      border: `2px solid ${unlocked && cid === nextUp ? 'var(--accent)' : 'var(--line)'}`,
      borderRadius: '14px',
      padding: '12px',
      color: 'var(--ink)',
      textAlign: 'left',
      cursor: unlocked ? 'pointer' : 'not-allowed',
      opacity: unlocked ? '1' : '0.68',
      display: 'flex',
      gap: '12px',
      alignItems: 'stretch',
      minHeight: '88px',
      position: 'relative',
    });
    card.type = 'button';
    card.className = 'course-card';
    if (unlocked) {
      card.onmouseenter = () => (card.style.borderColor = 'var(--accent)');
      card.onmouseleave = () => (card.style.borderColor = cid === nextUp ? 'var(--accent)' : 'var(--line)');
      card.onclick = () => actions.onStartCourse(cid);
    } else {
      card.disabled = true;
      card.dataset.locked = 'true';
    }

    const badge = el('div', { flex: '0 0 auto', width: '48px', display: 'grid', placeItems: 'center', fontSize: '34px', borderRadius: '12px', background: 'rgba(0,0,0,0.28)' }, emoji);
    const body = el('div', { flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '4px' });
    const titleRow = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' });
    const badgeLabel = !unlocked
      ? `🔒 ${story.unlockPts.toLocaleString()} pts`
      : complete
        ? '✓ COMPLETE'
        : cid === nextUp
          ? 'NEXT UP'
          : `Ch. ${story.chapter}`;
    titleRow.append(
      el('strong', { fontSize: '15px' }, rest.join(' ')),
      el(
        'span',
        {
          fontSize: '10px',
          fontWeight: '800',
          color: unlocked && complete ? '#18231a' : unlocked ? 'var(--accent)' : 'var(--dim)',
          background: unlocked && complete ? 'var(--accent)' : 'rgba(0,0,0,0.35)',
          padding: '2px 8px',
          borderRadius: '999px',
          whiteSpace: 'nowrap',
        },
        badgeLabel,
      ),
    );
    body.append(titleRow, el('div', { fontSize: '12px', color: 'var(--dim)', lineHeight: '1.35' }, unlocked ? story.fieldBriefing : story.lockedTeaser));

    if (unlocked) {
      // The creatures living there: lit if photographed, a silhouette if not.
      const icons = el('div', { display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' });
      for (const sid of species.slice(0, 9)) {
        const url = gnomeokemonIcon(sid, { size: 56 });
        const got = Boolean(best[sid]);
        const box = el('div', { width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', overflow: 'hidden' });
        if (url) {
          const img = el('img', { width: '24px', height: '24px', objectFit: 'contain', filter: got ? 'none' : 'brightness(0.15)', opacity: got ? '1' : '0.7' });
          img.src = url;
          img.alt = '';
          box.append(img);
        } else {
          box.textContent = got ? '●' : '○';
        }
        icons.append(box);
      }
      if (species.length > 9) icons.append(el('span', { alignSelf: 'center', fontSize: '10px', color: 'var(--dim)' }, `+${species.length - 9}`));
      body.append(icons);

      const bar = el('div', { height: '5px', borderRadius: '999px', background: 'rgba(0,0,0,0.4)', overflow: 'hidden', marginTop: '2px' });
      bar.append(el('div', { height: '100%', width: `${(done / Math.max(1, species.length)) * 100}%`, background: 'var(--accent)' }));
      body.append(bar, el('div', { fontSize: '10px', color: 'var(--dim)' }, `${done}/${species.length} species photographed`));
    } else {
      const currentPts = Math.min(total, story.unlockPts);
      const remainingPts = Math.max(0, story.unlockPts - total);
      const frac = Math.min(1, Math.max(0, total / Math.max(1, story.unlockPts)));
      const bar = el('div', { height: '5px', borderRadius: '999px', background: 'rgba(0,0,0,0.4)', overflow: 'hidden', marginTop: '4px' });
      bar.append(el('div', { height: '100%', width: `${(frac * 100).toFixed(1)}%`, background: 'var(--dim)' }));
      body.append(
        bar,
        el('div', { fontSize: '10px', color: 'var(--dim)' }, `${currentPts.toLocaleString()} / ${story.unlockPts.toLocaleString()} pts — ${remainingPts.toLocaleString()} pts to go`),
      );
    }

    card.append(badge, body);
    wrap.append(card);
  });
}
