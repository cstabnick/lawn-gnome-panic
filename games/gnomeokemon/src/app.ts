import { createLab, type Lab, type PanelSpace, type RoomId } from './lab/lab';
import { mountMusicControl, setMusicScene, unlockAndPlayMusic } from './music';
import { renderGnomokedex } from './screens/gnomokedex';
import { renderCourseMap, renderLobby } from './screens/lobby';
import { renderOptions } from './screens/options';
import { renderTitle } from './screens/title';
import { renderPhotoGallery } from './snap/gallery';
import { makeFakePhotos } from './snap/fake';
import { renderGradingView } from './snap/grading';
import { mountSnapGame } from './snap/game';
import type { CourseId, PhotoRecord } from './snap/types';
import { jesusVoice } from './snap/voice';
import { el, makeBtn } from './ui';

type Screen = RoomId | 'title';

const COURSES: readonly CourseId[] = ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost'];

/** Rooms whose short menu becomes a bottom sheet on a phone, so the room stays in view above it. */
const SHEET_ON_PHONE: readonly Screen[] = ['hall', 'map', 'dressing'];

/** Wide enough to dock a panel beside the 3D room instead of covering it. */
function isWide(): boolean {
  return window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)').matches;
}

/**
 * Mounts the game: a full-viewport 3D house. The title screen is the house from the garden. Playing walks the camera in
 * through the front door; each room's menu is a 2D panel docked beside the room.
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
  const brand = el(
    'button',
    {
      fontWeight: '800',
      fontSize: '16px',
      color: 'var(--accent)',
      whiteSpace: 'nowrap',
      pointerEvents: 'auto',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      minHeight: '44px',
      padding: '0 4px',
    },
    '🍄 Gnomokemon Snap',
  );
  brand.type = 'button';
  brand.className = 'lab-brand';
  brand.title = 'Leave the house: back to the title screen';
  const tabs = el('div', { display: 'flex', gap: '6px', overflowX: 'auto', flex: '1 1 auto', pointerEvents: 'auto', scrollbarWidth: 'none' });
  tabs.id = 'lab-tabs';
  const right = el('div', { display: 'flex', gap: '6px', alignItems: 'center', pointerEvents: 'auto', marginLeft: 'auto', whiteSpace: 'nowrap' });
  mountMusicControl(right);
  nav.append(brand, tabs, right);
  ui.append(nav);
  const phoneBrandHidden = window.matchMedia('(max-width: 640px)').matches;

  const unlockOnce = (): void => {
    unlockAndPlayMusic();
    jesusVoice.unlock();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('keydown', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce);
  window.addEventListener('keydown', unlockOnce);

  const TAB_DEFS: { room: RoomId; label: string }[] = [
    { room: 'hall', label: '🏠 Lobby' },
    { room: 'map', label: '🗺️ Safari Map' },
    { room: 'archive', label: '📖 Gnomokedex' },
    { room: 'darkroom', label: '🖼️ Darkroom' },
    { room: 'dressing', label: '🪞 Options' },
  ];

  // --- screen plumbing -----------------------------------------------------------------------------------------
  let current: Screen = 'title';
  let lastCourse: CourseId = 'lawn';
  let stopRide: (() => void) | null = null;
  /** Where the current ride was launched from; leaving the ride early puts you back there. */
  let rideOrigin: Screen = 'map';

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

  /** A panel docked to the left or right edge (full width on a phone; a bottom sheet if `sheet`). */
  function dock(side: 'left' | 'right', width: string, sheet = false): HTMLElement {
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
    return root;
  }

  /** How much of the screen a freshly mounted panel covers, so the camera can frame the room beside it. */
  function panelSpace(root: HTMLElement, side: 'left' | 'right', sheet: boolean): PanelSpace {
    const r = root.getBoundingClientRect();
    if (isWide()) return { side, frac: Math.min(0.9, r.width / window.innerWidth) };
    return { side, frac: 0, sheet: sheet ? Math.max(0, 1 - r.top / window.innerHeight) : 0 };
  }

  function setNavForTitle(title: boolean): void {
    brand.style.display = title || phoneBrandHidden ? 'none' : '';
    tabs.style.display = title ? 'none' : 'flex';
  }

  function endRide(): void {
    stopRide = null;
    snapLayer.style.display = 'none';
    snapLayer.replaceChildren();
    nav.style.display = 'flex';
    lab.setActive(true);
  }

  function startRide(course: CourseId): void {
    lastCourse = course;
    // Riding again from the results goes back to the map; anywhere else returns to where you started.
    rideOrigin = current === 'office' ? 'map' : current;
    screenLayer.replaceChildren();
    nav.style.display = 'none';
    lab.setActive(false);
    snapLayer.style.display = 'block';
    stopRide = mountSnapGame(snapLayer, course, {
      // Back from the ride you are simply standing in the room: no walk.
      onFinish: (photos) => {
        endRide();
        show('office', photos, true);
      },
      onExit: () => {
        endRide();
        show(rideOrigin, undefined, true);
      },
    });
  }

  function show(next: Screen, photos?: readonly PhotoRecord[], instant = false): void {
    if (stopRide) {
      stopRide();
      endRide();
    }
    current = next;
    screenLayer.replaceChildren();
    setNavForTitle(next === 'title');
    setMusicScene(next === 'office' ? 'grading' : 'menu');

    if (next === 'title') {
      lab.showTitle({ instant });
      renderTitle(screenLayer, {
        onPlay: () => show('hall'),
        onOptions: () => show('dressing'),
        onQuickRide: () => startRide('lawn'),
      });
      return;
    }

    renderTabs();
    lab.refresh();
    let root: HTMLElement;
    let side: 'left' | 'right';
    if (next === 'hall') {
      side = 'left';
      root = dock(side, 'min(440px, 38vw)', true);
      renderLobby(root, {
        onSafari: () => show('map'),
        onGnomokedex: () => show('archive'),
        onGallery: () => show('darkroom'),
        onQuickRide: () => startRide('lawn'),
      });
    } else if (next === 'map') {
      side = 'left';
      root = dock(side, 'min(480px, 40vw)', true);
      renderCourseMap(root, { onStartCourse: startRide, onBack: () => show('hall') });
    } else if (next === 'dressing') {
      side = 'right';
      root = dock(side, 'min(480px, 40vw)', true);
      renderOptions(root, () => lab.refreshMirror());
    } else if (next === 'archive') {
      side = 'right';
      root = dock(side, 'min(900px, 58vw)');
      renderGnomokedex(root, params.get('id'));
    } else if (next === 'darkroom') {
      side = 'right';
      root = dock(side, 'min(900px, 58vw)');
      renderPhotoGallery(root, () => show('map'));
    } else {
      side = 'right';
      root = dock(side, 'min(900px, 58vw)');
      renderGradingView(root, photos ?? [], {
        onRideAgain: () => startRide(lastCourse),
        onOpenGallery: () => show('darkroom'),
      });
    }
    lab.goTo(next, { instant, panel: panelSpace(root, side, SHEET_ON_PHONE.includes(next)) });
  }

  brand.onclick = () => {
    if (!stopRide) show('title');
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !stopRide && current !== 'hall' && current !== 'title') show('hall');
  });
  let lastWide = isWide();
  window.addEventListener('resize', () => {
    // Panels dock differently on narrow screens; rebuild the current one only when that changes.
    const wide = isWide();
    if (wide === lastWide) return;
    lastWide = wide;
    // The Grading Office holds the results mid-reveal; rebuilding it would lose them.
    if (!stopRide && current !== 'office' && current !== 'title') show(current, undefined, true);
  });

  // --- first screen ----------------------------------------------------------------------------------------------
  const urlCourse = params.get('course');
  const course: CourseId = COURSES.find((c) => c === urlCourse) ?? 'lawn';
  const mode = params.get('mode') ?? params.get('room') ?? 'title';
  const MODE_TO_SCREEN: Record<string, Screen> = {
    title: 'title',
    menu: 'hall',
    hall: 'hall',
    map: 'map',
    gnomokedex: 'archive',
    archive: 'archive',
    gallery: 'darkroom',
    darkroom: 'darkroom',
    options: 'dressing',
    dressing: 'dressing',
    office: 'office',
  };
  const first: Screen = MODE_TO_SCREEN[mode] ?? 'title';
  if (mode === 'snap') {
    show('hall', undefined, true);
    startRide(course);
  } else if (first === 'office') {
    const fake = Number(params.get('fake') ?? 0);
    show('office', fake > 0 ? makeFakePhotos(fake) : undefined, true);
  } else {
    show(first, undefined, true);
  }
}
