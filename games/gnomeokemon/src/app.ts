import { createLab, type Lab, type RoomId } from './lab/lab';
import { mountMusicControl, setMusicScene, unlockAndPlayMusic } from './music';
import { renderGnomokedex } from './screens/gnomokedex';
import { renderCourseMap, renderLobby } from './screens/lobby';
import { renderPhotoGallery } from './snap/gallery';
import { renderGradingView } from './snap/grading';
import { mountSnapGame } from './snap/game';
import type { CourseId, PhotoRecord } from './snap/types';
import { el, makeBtn } from './ui';

type Screen = RoomId;

const COURSES: readonly CourseId[] = ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost'];

/** Wide enough to dock a panel beside the 3D room instead of covering it. */
function isWide(): boolean {
  return window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)').matches;
}

export interface Dock {
  root: HTMLElement;
  body: HTMLElement;
}

/**
 * Mounts the Field Lab: a full-viewport 3D building with a thin 2D menu on top. Every screen is a room; the menu for
 * that room is a panel docked to one side so the room stays visible next to it.
 */
export function mountApp(ui: HTMLElement, params: URLSearchParams): void {
  Object.assign(ui.style, { position: 'fixed', inset: '0', minHeight: '0', padding: '0', overflow: 'hidden', background: '#0d140f' });
  ui.replaceChildren();

  const lab: Lab = createLab(ui);

  const screenLayer = el('div', { position: 'absolute', inset: '0', pointerEvents: 'none' });
  screenLayer.id = 'lab-screens';
  const snapLayer = el('div', { position: 'fixed', inset: '0', display: 'none', zIndex: '50', background: '#0d140f' });
  snapLayer.id = 'snap-layer';
  ui.append(screenLayer, snapLayer);

  // --- top bar -------------------------------------------------------------------------------------------------
  const nav = el('nav', {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: 'calc(8px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 8px calc(12px + env(safe-area-inset-left))',
    background: 'linear-gradient(180deg, rgba(10,16,12,0.88) 0%, rgba(10,16,12,0) 100%)',
    pointerEvents: 'none',
    zIndex: '5',
  });
  const brand = el('div', { fontWeight: '800', fontSize: '16px', color: 'var(--accent)', whiteSpace: 'nowrap', pointerEvents: 'auto' }, '🍄 Gnomokemon Snap');
  brand.className = 'lab-brand';
  if (window.matchMedia('(max-width: 640px)').matches) brand.style.display = 'none';
  const tabs = el('div', { display: 'flex', gap: '6px', overflowX: 'auto', flex: '1 1 auto', pointerEvents: 'auto', scrollbarWidth: 'none' });
  tabs.id = 'lab-tabs';
  const right = el('div', { display: 'flex', gap: '6px', alignItems: 'center', pointerEvents: 'auto' });
  right.style.whiteSpace = 'nowrap';
  mountMusicControl(right);
  nav.append(brand, tabs, right);
  ui.append(nav);

  const unlockOnce = (): void => {
    unlockAndPlayMusic();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('keydown', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce);
  window.addEventListener('keydown', unlockOnce);

  const TAB_DEFS: { room: Screen; label: string }[] = [
    { room: 'hall', label: '🏠 Lobby' },
    { room: 'map', label: '🗺️ Safari Map' },
    { room: 'archive', label: '📖 Gnomokedex' },
    { room: 'darkroom', label: '🖼️ Darkroom' },
  ];

  // --- screen plumbing -----------------------------------------------------------------------------------------
  let current: Screen = 'hall';
  let lastCourse: CourseId = 'lawn';
  let stopRide: (() => void) | null = null;

  function renderTabs(): void {
    tabs.replaceChildren(
      ...TAB_DEFS.map((t) => {
        const b = makeBtn(t.label, () => show(t.room), current === t.room);
        b.style.whiteSpace = 'nowrap';
        b.style.background = current === t.room ? 'var(--panel-2)' : 'rgba(18,28,20,0.78)';
        b.dataset.room = t.room;
        return b;
      }),
    );
  }

  /** A panel docked to the left or right edge (full width on a phone). */
  function dock(side: 'left' | 'right', width: string, sheet = false): Dock {
    const wide = isWide();
    const root = el('section', {
      position: 'absolute',
      top: wide || !sheet ? 'calc(62px + env(safe-area-inset-top))' : 'max(46vh, calc(62px + env(safe-area-inset-top)))',
      bottom: '0',
      left: wide && side === 'right' ? 'auto' : '0',
      right: wide && side === 'left' ? 'auto' : '0',
      width: wide ? width : 'auto',
      overflowY: 'auto',
      pointerEvents: 'auto',
      background: 'rgba(16, 24, 18, 0.9)',
      backdropFilter: 'blur(6px)',
      borderLeft: wide && side === 'right' ? '1px solid var(--line)' : 'none',
      borderRight: wide && side === 'left' ? '1px solid var(--line)' : 'none',
      borderTop: wide ? 'none' : '1px solid var(--line)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    });
    root.className = 'lab-dock';
    screenLayer.append(root);
    return { root, body: root };
  }

  function startRide(course: CourseId): void {
    lastCourse = course;
    screenLayer.replaceChildren();
    nav.style.display = 'none';
    lab.setActive(false);
    snapLayer.style.display = 'block';
    const leave = (): void => {
      stopRide = null;
      snapLayer.style.display = 'none';
      snapLayer.replaceChildren();
      nav.style.display = 'flex';
      lab.setActive(true);
    };
    stopRide = mountSnapGame(snapLayer, course, {
      onFinish: (photos) => {
        leave();
        show('office', photos);
      },
      onExit: () => {
        leave();
        show('map');
      },
    });
  }

  function show(next: Screen, photos?: readonly PhotoRecord[]): void {
    if (stopRide) {
      stopRide();
      stopRide = null;
      snapLayer.style.display = 'none';
      snapLayer.replaceChildren();
      nav.style.display = 'flex';
      lab.setActive(true);
    }
    current = next;
    screenLayer.replaceChildren();
    renderTabs();
    lab.refresh();
    const wide = isWide();
    const docksLeft = next === 'hall' || next === 'map';
    lab.goTo(next, { shift: wide ? (docksLeft ? -2.9 : 7.2) : 0, lift: !wide && docksLeft ? 0.2 : 0 });
    setMusicScene(next === 'office' ? 'grading' : 'menu');

    if (next === 'hall') {
      const d = dock('left', 'min(440px, 38vw)', true);
      renderLobby(d.body, {
        onSafari: () => show('map'),
        onGnomokedex: () => show('archive'),
        onGallery: () => show('darkroom'),
        onQuickRide: () => startRide('lawn'),
      });
    } else if (next === 'map') {
      const d = dock('left', 'min(480px, 40vw)', true);
      renderCourseMap(d.body, { onStartCourse: startRide, onBack: () => show('hall') });
    } else if (next === 'archive') {
      const d = dock('right', 'min(900px, 58vw)');
      renderGnomokedex(d.body, params.get('id'));
    } else if (next === 'darkroom') {
      const d = dock('right', 'min(900px, 58vw)');
      renderPhotoGallery(d.body, () => show('map'));
    } else {
      const d = dock('right', 'min(900px, 58vw)');
      renderGradingView(d.body, photos ?? [], {
        onRideAgain: () => startRide(lastCourse),
        onOpenGallery: () => show('darkroom'),
      });
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !stopRide && current !== 'hall') show('hall');
  });
  let lastWide = isWide();
  window.addEventListener('resize', () => {
    // Panels dock differently on narrow screens; rebuild the current one only when that changes.
    const wide = isWide();
    if (wide === lastWide) return;
    lastWide = wide;
    if (!stopRide) show(current);
  });

  // --- first screen ----------------------------------------------------------------------------------------------
  const urlCourse = params.get('course');
  const course: CourseId = COURSES.find((c) => c === urlCourse) ?? 'lawn';
  const mode = params.get('mode') ?? params.get('room') ?? 'hall';
  const MODE_TO_SCREEN: Record<string, Screen> = {
    menu: 'hall',
    hall: 'hall',
    map: 'map',
    gnomokedex: 'archive',
    archive: 'archive',
    gallery: 'darkroom',
    darkroom: 'darkroom',
    office: 'office',
  };
  lab.goTo(MODE_TO_SCREEN[mode] ?? 'hall', { instant: true, shift: 0 });
  if (mode === 'snap') {
    show('hall');
    startRide(course);
  } else {
    show(MODE_TO_SCREEN[mode] ?? 'hall');
  }
}
