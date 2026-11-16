// The book reader: opens on 'book-open' and shows a book, note, letter, plaque, journal or scroll one page at a time.
// The Lore tab (panels.ts) re-opens read pieces through the same event.
import { UI, type BookDef } from '../config';
import { BOOKS } from '../content';
import { bus, say } from '../events';

const PARCHMENT = '#f2e6c8';
const INK = '#3b2a1a';
const RULED = 'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(120, 90, 60, 0.3) 27px, rgba(120, 90, 60, 0.3) 28px)';

/** Per-kind look: `card` styles the panel, `text` styles each paragraph. */
const LOOKS: Record<BookDef['kind'], { card: Record<string, string>; text: Record<string, string> }> = {
  book: { card: { background: PARCHMENT }, text: {} },
  journal: { card: { background: PARCHMENT, backgroundImage: RULED }, text: { lineHeight: '28px' } },
  note: {
    card: { background: '#fff7b8', color: '#3b3520', width: 'min(340px, 92vw)', height: 'auto', boxShadow: '2px 4px 10px rgba(0, 0, 0, 0.45)' },
    text: {},
  },
  letter: { card: { background: '#fbf3dc' }, text: {} },
  scroll: { card: { background: PARCHMENT, padding: '26px 24px' }, text: {} },
  plaque: {
    card: {
      background: '#8d9097', color: '#f4f6f8', textShadow: '0 1px 0 #5a5d63, 0 -1px 0 #c2c5ca',
      textAlign: 'center', width: 'min(420px, 92vw)', height: 'auto',
    },
    text: { textAlign: 'center' },
  },
};

let overlay: HTMLDivElement | null = null;
let card: HTMLDivElement | null = null;
/** The BOOKS id on screen, or null when the reader is closed. */
let openId: string | null = null;
let page = 0;

/** True while the reader is open. */
export function isBookOpen(): boolean {
  return openId !== null;
}

/** Closes the reader if it is open. */
export function closeBook(): void {
  if (openId === null) return;
  openId = null;
  if (overlay) overlay.style.display = 'none';
  card?.replaceChildren();
}

/** Creates the reader (hidden) under the shared #ui element and subscribes to 'book-open'. Call once. */
export function createBookReader(ui: HTMLElement): void {
  overlay = document.createElement('div');
  overlay.id = 'book-reader';
  Object.assign(overlay.style, {
    position: 'absolute', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(20, 15, 10, 0.35)', pointerEvents: 'auto', fontFamily: UI.font,
  });

  card = document.createElement('div');
  card.id = 'book-reader-card';
  overlay.appendChild(card);
  ui.appendChild(overlay);
  // A click on the dimmed backdrop (not the page) closes the reader.
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBook(); });

  bus.on('book-open', ({ book, first }) => open(book, first));

  window.addEventListener('keydown', (e) => {
    if (openId === null) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeBook();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      turn(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      turn(1);
    }
  });
}

/** Shows a piece from its first page. Unknown ids are ignored. */
function open(id: string, first: boolean): void {
  const b = BOOKS[id] as BookDef | undefined;
  if (!b || !overlay) return;
  openId = id;
  page = 0;
  overlay.style.display = 'flex';
  draw();
  if (first) say(`New lore added to your journal: ${b.title}`, UI.gold);
}

/** A piece always has at least one page, even when its list is empty. */
function pagesOf(b: BookDef): readonly string[] {
  return b.pages.length > 0 ? b.pages : [''];
}

function turn(delta: number): void {
  if (openId === null) return;
  const b = BOOKS[openId] as BookDef | undefined;
  if (!b) return;
  page = Math.min(Math.max(0, page + delta), pagesOf(b).length - 1);
  draw();
}

function make(tag: string, style: Record<string, string> = {}, text?: string): HTMLElement {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (text !== undefined) e.textContent = text;
  return e;
}

function navButton(label: string, disabled: boolean, onSelect: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = disabled;
  Object.assign(btn.style, {
    background: 'transparent', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: '14px',
    padding: '4px 6px', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? '0.35' : '1',
    textShadow: 'none',
  });
  if (!disabled) btn.onclick = onSelect;
  return btn;
}

/** Redraws the panel for the open piece and the current page. */
function draw(): void {
  if (!card || openId === null) return;
  const b = BOOKS[openId] as BookDef | undefined;
  if (!b) {
    closeBook();
    return;
  }
  const pages = pagesOf(b);
  page = Math.min(Math.max(0, page), pages.length - 1);
  const last = page === pages.length - 1;
  const look = LOOKS[b.kind];

  card.style.cssText = '';
  Object.assign(card.style, {
    position: 'relative', boxSizing: 'border-box', width: 'min(460px, 92vw)', height: 'min(520px, 80vh)',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '16px 20px',
    border: `2px solid ${UI.border}`, boxShadow: `0 0 0 1px ${UI.borderLight}, 0 6px 18px rgba(0, 0, 0, 0.5)`,
    color: INK, fontFamily: 'Georgia, "Times New Roman", serif',
  }, look.card);

  const children: HTMLElement[] = [];
  if (b.kind === 'scroll') children.push(rollEnd(true));

  // Header: title, author line, close button.
  const head = make('div', { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', flex: '0 0 auto' });
  const titles = make('div', { flex: '1', minWidth: '0' });
  titles.append(make('div', { fontWeight: 'bold', fontSize: '18px', lineHeight: '1.25' }, b.title));
  if (b.author) titles.append(make('div', { fontStyle: 'italic', fontSize: '13px', marginTop: '2px' }, b.author));
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.title = 'Close';
  Object.assign(closeBtn.style, {
    background: 'transparent', border: 'none', color: 'inherit', fontSize: '18px', lineHeight: '1',
    padding: '2px 4px', cursor: 'pointer', textShadow: 'none',
  });
  closeBtn.onclick = () => closeBook();
  head.append(titles, closeBtn);
  children.push(head);

  // Body: the current page, one <p> per paragraph (blank lines separate them).
  const body = make('div', { flex: '1 1 auto', minHeight: '0', overflowY: 'auto' });
  const paragraphs = pages[page].split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 0);
  for (const para of paragraphs) {
    const p = document.createElement('p');
    p.textContent = para;
    Object.assign(p.style, {
      margin: '0 0 0.8em', fontSize: '16px', lineHeight: '1.5', whiteSpace: 'pre-line',
    }, look.text);
    body.append(p);
  }
  if (b.kind === 'letter' && last && b.author) {
    body.append(make('div', { fontStyle: 'italic', textAlign: 'right', marginTop: '14px' }, `— ${b.author}`));
  }
  children.push(body);

  // Footer: page turns, hidden for a one-page piece.
  if (pages.length > 1) {
    const foot = make('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto',
      marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${UI.borderLight}`,
    });
    foot.append(
      navButton('◀ Prev', page === 0, () => turn(-1)),
      make('span', { fontSize: '13px' }, `Page ${page + 1} of ${pages.length}`),
      navButton('Next ▶', last, () => turn(1)),
    );
    children.push(foot);
  }
  if (b.kind === 'scroll') children.push(rollEnd(false));

  card.replaceChildren(...children);
}

/** The rolled end of a scroll: a darker bar across the top or bottom of the parchment. */
function rollEnd(top: boolean): HTMLElement {
  return make('div', {
    flex: '0 0 auto', height: '14px', background: '#b08a52', borderRadius: '7px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
    margin: top ? '-26px -24px 12px' : '12px -24px -26px',
  });
}
