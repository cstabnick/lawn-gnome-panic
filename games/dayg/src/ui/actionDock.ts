// Unified top-right HUD action dock: groups Craft/Cook/Camp/Journal ('play') and Worlds/Sound/Trainer ('system')
// into a single non-overlapping bar on desktop (>= 680px) or a collapsible Menu drawer on mobile (< 680px).
export type DockGroup = 'play' | 'system';

export interface DockButtonDef {
  id: string;
  label: string;
  title: string;
  group: DockGroup;
  onClick: () => void;
  accent?: boolean;
}

export interface ActionDock {
  root: HTMLElement;
  addButton(def: DockButtonDef): HTMLButtonElement;
  setVisible(on: boolean): void;
  closeMenu(): void;
}

const CSS = `
#dayg-dock{
  position:fixed;
  top:calc(74px + env(safe-area-inset-top));
  right:calc(8px + env(safe-area-inset-right));
  z-index:35;
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  pointer-events:none;
  font-family:var(--dg-font);
}
#dayg-dock.dg-dock-hidden{
  display:none !important;
}
#dayg-dock .dg-dock-toggle{
  display:none;
  min-height:44px;
  min-width:44px;
  padding:0 12px;
  border-radius:10px;
  border:1px solid var(--dg-border-strong);
  background:rgba(14,18,13,0.84);
  color:var(--dg-text);
  font:600 13px var(--dg-font);
  cursor:pointer;
  touch-action:manipulation;
  pointer-events:auto;
  backdrop-filter:blur(6px);
  box-shadow:var(--dg-shadow);
}
#dayg-dock .dg-dock-bar{
  display:flex;
  align-items:center;
  gap:4px;
  padding:4px;
  border-radius:10px;
  background:rgba(14,18,13,0.78);
  border:1px solid var(--dg-border);
  backdrop-filter:blur(6px);
  pointer-events:auto;
  box-shadow:var(--dg-shadow);
}
#dayg-dock .dg-dock-sep{
  width:1px;
  height:24px;
  background:var(--dg-border);
  margin:0 2px;
  flex:none;
}
#dayg-dock .dg-dock-btn{
  min-height:44px;
  min-width:44px;
  padding:0 10px;
  border-radius:8px;
  border:1px solid transparent;
  background:var(--dg-surface-2);
  color:var(--dg-text);
  font:600 12px var(--dg-font);
  cursor:pointer;
  touch-action:manipulation;
  white-space:nowrap;
  transition:background-color .14s ease,border-color .14s ease,transform .08s ease;
}
#dayg-dock .dg-dock-btn:hover{
  background:var(--dg-surface-hover);
  border-color:var(--dg-border-strong);
}
#dayg-dock .dg-dock-btn:focus-visible,
#dayg-dock .dg-dock-toggle:focus-visible{
  outline:2px solid var(--dg-accent);
  outline-offset:2px;
}
#dayg-dock .dg-dock-btn.dg-dock-accent{
  color:var(--dg-accent);
}
@media (max-width:679px){
  #dayg-dock .dg-dock-toggle{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:6px;
  }
  #dayg-dock .dg-dock-bar{
    display:none;
    margin-top:6px;
    padding:8px;
    grid-template-columns:repeat(2,minmax(112px,1fr));
    gap:6px;
  }
  #dayg-dock.dg-dock-open .dg-dock-bar{
    display:grid;
  }
  #dayg-dock .dg-dock-sep{
    display:none;
  }
}
`;

export function createActionDock(ui: HTMLElement): ActionDock {
  if (typeof document !== 'undefined' && !document.getElementById('dayg-dock-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-dock-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const root = document.createElement('div');
  root.id = 'dayg-dock';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'dg-dock-toggle';
  toggle.textContent = '☰ Menu';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open game menu');

  const bar = document.createElement('div');
  bar.className = 'dg-dock-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Game actions');

  const sep = document.createElement('div');
  sep.className = 'dg-dock-sep';
  sep.setAttribute('aria-hidden', 'true');
  bar.appendChild(sep);

  let menuOpen = false;
  let visible = true;

  const stopProp = (e: Event): void => e.stopPropagation();
  bar.addEventListener('mousedown', stopProp);
  bar.addEventListener('pointerdown', stopProp);
  toggle.addEventListener('mousedown', stopProp);
  toggle.addEventListener('pointerdown', stopProp);

  function syncMenu(): void {
    root.classList.toggle('dg-dock-open', menuOpen);
    toggle.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
  }

  function closeMenu(): void {
    if (!menuOpen) return;
    menuOpen = false;
    syncMenu();
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuOpen = !menuOpen;
    syncMenu();
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (menuOpen && e.key === 'Escape') {
        closeMenu();
      }
    });
    window.addEventListener('pointerdown', (e) => {
      if (menuOpen && e.target instanceof Node && !root.contains(e.target)) {
        closeMenu();
      }
    });
  }

  root.append(toggle, bar);
  ui.appendChild(root);

  function addButton(def: DockButtonDef): HTMLButtonElement {
    const b = document.createElement('button');
    b.id = def.id;
    b.type = 'button';
    b.className = def.accent ? 'dg-dock-btn dg-dock-accent' : 'dg-dock-btn';
    b.textContent = def.label;
    b.title = def.title;
    b.setAttribute('aria-label', def.title);
    b.addEventListener('mousedown', stopProp);
    b.addEventListener('pointerdown', stopProp);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
      def.onClick();
    });
    if (def.group === 'play') {
      bar.insertBefore(b, sep);
    } else {
      bar.appendChild(b);
    }
    return b;
  }

  function setVisible(on: boolean): void {
    if (visible === on) return;
    visible = on;
    root.classList.toggle('dg-dock-hidden', !on);
    if (!on) closeMenu();
  }

  return { root, addButton, setVisible, closeMenu };
}
