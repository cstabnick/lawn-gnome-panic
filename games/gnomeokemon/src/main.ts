import { PALETTE, type Swatch } from '@lawn/prefabs';
import {
  allGnomeokemon,
  getGnomeokemon,
  gnomeokemonIcon,
  type GnomeokemonElement,
  type GnomeokemonEntry,
} from './prefabs/registry';
import { renderSnap64Menu } from './menu';
import { mountMusicControl, setMusicScene, unlockAndPlayMusic } from './music';
import { renderPhotoGallery } from './snap/gallery';
import { mountSnapGame } from './snap/game';
import { photoCloud } from './snap/cloud';
import type { CourseId } from './snap/types';
import { createViewer } from './viewer';

const ui = document.getElementById('ui')!;
const params = new URLSearchParams(location.search);

type AppMode = 'menu' | 'gnomokedex' | 'snap' | 'gallery';

const ELEMENT_META: Record<GnomeokemonElement, { label: string; color: string; bg: string }> = {
  bloom: { label: 'Bloom', color: '#8ae278', bg: '#274523' },
  sun: { label: 'Sun', color: '#ffae42', bg: '#4a2b17' },
  rain: { label: 'Rain', color: '#64c8ff', bg: '#1a384d' },
  clay: { label: 'Clay', color: '#e69b73', bg: '#472c21' },
  iron: { label: 'Iron', color: '#c4d0db', bg: '#2f3942' },
};

const TINT_SWATCHES: readonly Swatch[] = [
  'moss', 'leaf', 'terracotta', 'flame', 'glaze-blue', 'glaze-green',
  'red', 'blue', 'yellow', 'purple', 'gold', 'ruby', 'amethyst', 'chalk', 'black',
];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: Partial<CSSStyleDeclaration> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeBadge(element: GnomeokemonElement): HTMLElement {
  const meta = ELEMENT_META[element];
  return el(
    'span',
    {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.03em',
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.color}44`,
    },
    meta.label,
  );
}

function makeIconImg(entry: GnomeokemonEntry, px: number, tint?: Swatch | number): HTMLElement {
  const url = gnomeokemonIcon(entry, { size: px * 2, tint });
  if (!url) {
    return el(
      'div',
      { width: `${px}px`, height: `${px}px`, display: 'grid', placeItems: 'center', fontSize: `${Math.round(px * 0.5)}px` },
      entry.prefab.emoji[0] ?? '❓',
    );
  }
  const img = el('img', { width: `${px}px`, height: `${px}px`, display: 'block', objectFit: 'contain' });
  img.src = url;
  img.alt = entry.prefab.name;
  return img;
}

function makeBtn(label: string, onClick: () => void, active = false): HTMLButtonElement {
  const b = el(
    'button',
    {
      minHeight: '44px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
      background: active ? 'var(--panel-2)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--ink)',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
    },
    label,
  );
  b.type = 'button';
  b.onclick = onClick;
  return b;
}

function renderContactSheet(): void {
  const sheet = el('div', { padding: '16px' });
  sheet.id = 'sheet';
  sheet.append(el('h2', { margin: '0 0 12px', color: 'var(--accent)' }, `Gnomokedex Prefab Sheet (${allGnomeokemon().length})`));
  const grid = el('div', { display: 'flex', flexWrap: 'wrap', gap: '10px' });
  for (const entry of allGnomeokemon()) {
    const card = el('div', {
      width: '132px',
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: '10px',
      padding: '8px',
      textAlign: 'center',
    });
    const pic = makeIconImg(entry, 112);
    pic.style.margin = '0 auto';
    card.append(
      pic,
      el('div', { fontSize: '11px', color: 'var(--dim)', marginTop: '4px' }, `#${entry.dex} · ${ELEMENT_META[entry.element].label}`),
      el('div', { fontSize: '13px', fontWeight: '600' }, entry.prefab.name),
    );
    grid.append(card);
  }
  sheet.append(grid);
  ui.append(sheet);
}

function renderGnomokedex(container: HTMLElement): void {
  container.replaceChildren();
  const entries = allGnomeokemon();
  const root = el('div', {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    maxWidth: '1360px',
    margin: '0 auto',
  });
  root.id = 'gnomokedex-view';

  const left = el('div', { flex: '1 1 460px', minWidth: '0' });
  const right = el('div', { flex: '1 1 380px', maxWidth: '520px', width: '100%', position: 'sticky', top: '16px' });
  root.append(left, right);
  container.append(root);

  left.append(
    el('h1', { margin: '0 0 4px', fontSize: '24px', letterSpacing: '-0.01em' }, 'Gnomokedex'),
    el(
      'div',
      { color: 'var(--dim)', fontSize: '13px', marginBottom: '12px', lineHeight: '1.45' },
      `${entries.length} Fescue creature models stored as @lawn/prefabs definitions. Drag to orbit, scroll or tap +/- to zoom.`,
    ),
  );

  const search = el('input', {
    width: '100%',
    minHeight: '44px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--line)',
    background: 'var(--panel)',
    color: 'var(--ink)',
    fontSize: '14px',
  });
  search.placeholder = 'Search name, region (Mossbottom, Rockery...), element, or emoji';
  search.setAttribute('aria-label', 'Search Gnomokedex models');
  left.append(search);

  const chips = el('div', { display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0 14px' });
  left.append(chips);

  let activeElement: GnomeokemonElement | '' = '';
  const chipBtns: { value: GnomeokemonElement | ''; btn: HTMLButtonElement }[] = [];

  const addFilterChip = (label: string, value: GnomeokemonElement | ''): void => {
    const b = makeBtn(label, () => {
      activeElement = value;
      renderGrid();
    });
    b.style.borderRadius = '999px';
    b.style.padding = '6px 14px';
    chipBtns.push({ value, btn: b });
    chips.append(b);
  };

  addFilterChip(`All (${entries.length})`, '');
  for (const elem of ['bloom', 'sun', 'rain', 'clay', 'iron'] as const) {
    const count = entries.filter((e) => e.element === elem).length;
    if (count > 0) addFilterChip(`${ELEMENT_META[elem].label} (${count})`, elem);
  }

  const grid = el('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(124px, 1fr))',
    gap: '10px',
  });
  left.append(grid);

  const stageCard = el('div', {
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: '12px',
    padding: '12px',
  });
  right.append(stageCard);

  const viewer = createViewer();
  stageCard.append(viewer.element);

  const controlsBar = el('div', {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
  });
  stageCard.append(controlsBar);

  const info = el('div', { marginTop: '12px', fontSize: '13px', lineHeight: '1.5' });
  stageCard.append(info);

  let selected: GnomeokemonEntry = (params.get('id') && getGnomeokemon(params.get('id')!)) || entries[0];
  let tintOverride: Swatch | undefined;
  let trimOverride: Swatch | undefined;
  let autoRotate = true;
  let animateIdle = true;
  let showGnome = false;
  let showPrefabJson = false;

  function stepSelection(delta: number): void {
    const idx = entries.indexOf(selected);
    const next = entries[(idx + delta + entries.length) % entries.length];
    selectEntry(next);
  }

  function renderControls(): void {
    controlsBar.replaceChildren();
    controlsBar.append(
      makeBtn('◀ Prev', () => stepSelection(-1)),
      makeBtn('Next ▶', () => stepSelection(1)),
      makeBtn(autoRotate ? 'Spin: On' : 'Spin: Off', () => {
        autoRotate = !autoRotate;
        viewer.setAutoRotate(autoRotate);
        renderControls();
      }, autoRotate),
      makeBtn(animateIdle ? 'Idle: On' : 'Idle: Off', () => {
        animateIdle = !animateIdle;
        viewer.setAnimate(animateIdle);
        renderControls();
      }, animateIdle),
      makeBtn(showGnome ? 'Gnome: On' : 'Gnome Scale', () => {
        showGnome = !showGnome;
        viewer.setGnomeScale(showGnome);
        renderControls();
      }, showGnome),
      makeBtn('+', () => viewer.zoomBy(0.84)),
      makeBtn('−', () => viewer.zoomBy(1.18)),
      makeBtn('Reset', () => viewer.resetView()),
    );
  }

  function renderInspector(): void {
    const p = selected.prefab;
    info.replaceChildren();

    const titleRow = el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' });
    const titleLeft = el('div', { display: 'flex', alignItems: 'center', gap: '8px' });
    titleLeft.append(
      el('span', { color: 'var(--dim)', fontWeight: '700', fontSize: '14px' }, `#${selected.dex}`),
      el('span', { fontSize: '20px', fontWeight: '700' }, p.name),
    );
    titleRow.append(titleLeft, makeBadge(selected.element));
    info.append(titleRow);

    info.append(
      el(
        'div',
        { color: 'var(--dim)', fontSize: '12px', marginTop: '2px' },
        `${selected.region} · ${selected.rank} · ${selected.family} · ${p.parts.length} parts`,
      ),
    );

    info.append(el('p', { margin: '8px 0 6px', color: 'var(--ink)' }, p.about));

    const wantsBox = el('div', {
      background: 'var(--panel-2)',
      borderLeft: '3px solid var(--accent)',
      padding: '6px 10px',
      borderRadius: '4px',
      marginBottom: '8px',
      fontSize: '12px',
    });
    wantsBox.append(el('strong', {}, 'Wants: '), document.createTextNode(selected.wants));
    info.append(wantsBox);

    info.append(el('div', { color: 'var(--dim)', fontSize: '12px', fontWeight: '600' }, 'Field Notes (Examine)'));
    const exList = el('ul', { margin: '4px 0 10px', paddingLeft: '18px', fontStyle: 'italic', color: '#dce6d2' });
    for (const line of p.examine) exList.append(el('li', { margin: '3px 0' }, line));
    info.append(exList);

    const swatchLabel = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' });
    swatchLabel.append(el('span', { color: 'var(--dim)', fontSize: '12px', fontWeight: '600' }, 'Glaze Variants (tint / trim)'));
    if (tintOverride || trimOverride) {
      const resetGlaze = el('button', {
        background: 'transparent',
        border: 'none',
        color: 'var(--accent)',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '4px 6px',
      }, 'Reset default');
      resetGlaze.onclick = () => {
        tintOverride = undefined;
        trimOverride = undefined;
        selectEntry(selected);
      };
      swatchLabel.append(resetGlaze);
    }
    info.append(swatchLabel);

    const swatchRow = el('div', { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' });
    for (const sw of TINT_SWATCHES) {
      const hex = `#${PALETTE[sw].toString(16).padStart(6, '0')}`;
      const isSelected = tintOverride === sw;
      const b = el('button', {
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: isSelected ? '2px solid var(--accent)' : '1px solid #0008',
        background: hex,
        cursor: 'pointer',
      });
      b.title = `Tint: ${sw}`;
      b.setAttribute('aria-label', `Tint ${sw}`);
      b.onclick = () => {
        tintOverride = tintOverride === sw ? undefined : sw;
        viewer.show(selected, { tint: tintOverride, trim: trimOverride });
        renderInspector();
      };
      swatchRow.append(b);
    }
    info.append(swatchRow);

    const pivotsText = p.pivots ? Object.keys(p.pivots).join(', ') : 'none';
    info.append(
      el(
        'div',
        { color: 'var(--dim)', fontSize: '12px', marginTop: '10px' },
        `Prefab ID: ${p.id} · Pivots: ${pivotsText} · Tags: ${p.tags.join(', ')}`,
      ),
    );

    const jsonBtn = makeBtn(showPrefabJson ? 'Hide Prefab Data' : 'Inspect Prefab Data & Code', () => {
      showPrefabJson = !showPrefabJson;
      renderInspector();
    });
    jsonBtn.style.marginTop = '10px';
    jsonBtn.style.width = '100%';
    info.append(jsonBtn);

    if (showPrefabJson) {
      const pre = el('pre', {
        background: '#0d140f',
        border: '1px solid var(--line)',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '11px',
        overflowX: 'auto',
        maxHeight: '260px',
        marginTop: '8px',
        color: '#cfe3c4',
      });
      const tintArg = tintOverride ? `, { tint: '${tintOverride}' }` : '';
      pre.textContent =
        `// Loaded via @lawn/prefabs:\n` +
        `import { buildGnomeokemon, gnomeokemonIcon } from './prefabs/registry';\n` +
        `scene.add(buildGnomeokemon('${p.id}'${tintArg}));\n\n` +
        JSON.stringify(p, null, 2);
      info.append(pre);
    }
  }

  function selectEntry(entry: GnomeokemonEntry): void {
    selected = entry;
    viewer.show(entry, { tint: tintOverride, trim: trimOverride });
    renderControls();
    renderInspector();
    for (const card of grid.children) {
      const elCard = card as HTMLElement;
      const isCurrent = elCard.dataset.id === entry.prefab.id;
      elCard.style.borderColor = isCurrent ? 'var(--accent)' : 'var(--line)';
      elCard.style.background = isCurrent ? 'var(--panel-2)' : 'var(--panel)';
    }
  }

  function matches(entry: GnomeokemonEntry, q: string): boolean {
    if (!q) return true;
    const p = entry.prefab;
    if (p.emoji.some((em) => q.includes(em))) return true;
    const hay = [
      entry.dex,
      entry.element,
      entry.region,
      entry.rank,
      entry.family,
      p.id,
      p.name,
      ...p.tags,
    ]
      .join(' ')
      .toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .every((word) => hay.includes(word));
  }

  function renderGrid(): void {
    const q = search.value.trim();
    for (const item of chipBtns) {
      const active = item.value === activeElement;
      item.btn.style.borderColor = active ? 'var(--accent)' : 'var(--line)';
      item.btn.style.background = active ? 'var(--panel-2)' : 'transparent';
      item.btn.style.color = active ? 'var(--accent)' : 'var(--ink)';
    }

    grid.replaceChildren();
    let count = 0;
    for (const entry of entries) {
      if (activeElement && entry.element !== activeElement) continue;
      if (!matches(entry, q)) continue;
      count++;

      const card = el('button', {
        background: entry.prefab.id === selected.prefab.id ? 'var(--panel-2)' : 'var(--panel)',
        border: `1px solid ${entry.prefab.id === selected.prefab.id ? 'var(--accent)' : 'var(--line)'}`,
        borderRadius: '10px',
        padding: '8px 6px',
        color: 'var(--ink)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minHeight: '44px',
        textAlign: 'center',
      });
      card.type = 'button';
      card.className = 'gnomeokemon-card';
      card.dataset.id = entry.prefab.id;
      card.append(
        makeIconImg(entry, 72),
        el('div', { fontSize: '11px', color: 'var(--dim)' }, `#${entry.dex} · ${ELEMENT_META[entry.element].label}`),
        el('div', { fontSize: '13px', fontWeight: '600' }, entry.prefab.name),
      );
      card.onclick = () => selectEntry(entry);
      grid.append(card);
    }

    if (count === 0) {
      grid.append(el('div', { color: 'var(--dim)', padding: '12px 0' }, 'No Gnomokemon match that search.'));
    }
  }

  search.oninput = renderGrid;
  renderGrid();
  selectEntry(selected);
}

function renderShell(): void {
  const shell = el('div', { minHeight: '100%' });
  shell.id = 'gnomeokemon-app';

  const nav = el('nav', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 16px',
    background: '#131c15',
    borderBottom: '1px solid var(--line)',
    flexWrap: 'wrap',
  });
  const brand = el('div', { fontWeight: '800', fontSize: '16px', color: 'var(--accent)' }, '🍄 Gnomokemon');
  const tabs = el('div', { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' });
  const rightNav = el('div', { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' });
  rightNav.append(tabs);
  mountMusicControl(rightNav);
  nav.append(brand, rightNav);

  const unlockOnce = (): void => {
    unlockAndPlayMusic();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('keydown', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce);
  window.addEventListener('keydown', unlockOnce);

  const body = el('div');
  shell.append(nav, body);
  ui.append(shell);

  let activeCleanup: (() => void) | null = null;
  const urlCourse = params.get('course');
  let activeCourse: CourseId =
    urlCourse === 'desert' || urlCourse === 'depths' || urlCourse === 'kiln' || urlCourse === 'ocean' || urlCourse === 'night' || urlCourse === 'frost'
      ? urlCourse
      : 'lawn';
  let mode: AppMode = (params.get('mode') as AppMode) || 'menu';
  if (mode !== 'menu' && mode !== 'snap' && mode !== 'gnomokedex' && mode !== 'gallery') mode = 'menu';

  function switchMode(next: AppMode, courseOverride?: CourseId): void {
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
    if (courseOverride) activeCourse = courseOverride;
    mode = next;
    renderNav();
    if (mode === 'menu') {
      setMusicScene('menu');
      renderSnap64Menu(body, {
        onStartCourse: (cid) => switchMode('snap', cid),
        onOpenGnomokedex: () => switchMode('gnomokedex'),
        onOpenGallery: () => switchMode('gallery'),
      });
    } else if (mode === 'snap') {
      setMusicScene(activeCourse === 'lawn' ? 'snap' : activeCourse);
      activeCleanup = mountSnapGame(body, () => switchMode('gallery'), activeCourse);
    } else if (mode === 'gallery') {
      setMusicScene('menu');
      renderPhotoGallery(body, () => switchMode('menu'));
    } else {
      setMusicScene('menu');
      renderGnomokedex(body);
    }
  }

  function renderNav(): void {
    tabs.replaceChildren(
      makeBtn('🏠 Snap 64 Menu', () => switchMode('menu'), mode === 'menu'),
      makeBtn('📸 Gnomokemon Snap', () => switchMode('snap'), mode === 'snap'),
      makeBtn('📖 Gnomokedex', () => switchMode('gnomokedex'), mode === 'gnomokedex'),
      makeBtn('🖼️ Photo Gallery', () => switchMode('gallery'), mode === 'gallery'),
    );
  }

  switchMode(mode);
}

if (params.has('sheet')) renderContactSheet();
else {
  // Pulls and merges the account's best photos in the background. The gallery reads the photos each time it is
  // shown, so a pull that lands later is picked up the next time the player opens it; nothing re-renders here.
  void photoCloud.syncAtStartup();
  renderShell();
}
