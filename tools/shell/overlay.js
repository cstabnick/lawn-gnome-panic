(() => {
  if (window.__gnomeArcadeShellLoaded) return;
  window.__gnomeArcadeShellLoaded = true;

  const scriptEl = document.currentScript;
  const currentGame = scriptEl?.dataset?.game || '';
  const currentTitle = scriptEl?.dataset?.title || document.title || currentGame || 'Game';
  const homeUrl = scriptEl?.dataset?.home || '../';
  const shellBase = scriptEl?.dataset?.shellBase || '../shell/';
  const thumbsBase = scriptEl?.dataset?.thumbsBase || '../thumbs/';

  const params = new URLSearchParams(location.search);
  const hashLower = location.hash.toLowerCase();
  const suppressChrome =
    params.has('nohud') ||
    params.get('shell') === '0' ||
    hashLower.includes('snap');

  const isCoarsePointer = () =>
    window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;

  const canFullscreen = () =>
    Boolean(
      document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen,
    );

  const getFullscreenEl = () =>
    document.fullscreenElement || document.webkitFullscreenElement || null;

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>',
    restart: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  };

  const CSS = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      pointer-events: none;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #eef2f7;
      -webkit-font-smoothing: antialiased;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    /* Floating top pull-tab (invisible 44px touch wrapper around a sleek pill) */
    .tab-hit {
      position: fixed;
      top: env(safe-area-inset-top, 0px);
      left: 50%;
      transform: translateX(-50%);
      min-width: 44px;
      min-height: 44px;
      padding: 0 8px 12px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      pointer-events: auto;
      cursor: pointer;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      z-index: 2;
      transition: opacity 0.2s ease;
    }

    .tab-hit.is-hidden {
      display: none;
    }

    .tab-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 12px;
      border-radius: 0 0 11px 11px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-top: none;
      background: rgba(15, 19, 27, 0.72);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #eef2f7;
      font: 600 12px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      opacity: 0.62;
      transition: opacity 0.18s ease, background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
    }

    .tab-hit:hover .tab-pill,
    .tab-hit:focus-visible .tab-pill,
    .tab-hit.is-dragging .tab-pill {
      opacity: 1;
      background: rgba(20, 26, 38, 0.94);
      border-color: rgba(91, 141, 239, 0.7);
    }

    .tab-hit:focus-visible {
      outline: none;
    }

    .tab-pill svg {
      color: #7da7f8;
      flex-shrink: 0;
    }

    .tab-kbd {
      display: inline-flex;
      align-items: center;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: #b8c2d1;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    @media (pointer: coarse), (max-width: 640px) {
      .tab-kbd {
        display: none;
      }
      .tab-pill {
        height: 30px;
        padding: 0 13px;
        opacity: 0.78;
      }
    }

    /* Steam-style launch toast */
    .toast {
      position: fixed;
      right: calc(16px + env(safe-area-inset-right, 0px));
      bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      z-index: 3;
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: min(340px, calc(100vw - 32px));
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-left: 3px solid #5b8def;
      background: rgba(18, 22, 31, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .toast.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .toast.is-gone {
      display: none;
    }

    .toast-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(91, 141, 239, 0.16);
      color: #7da7f8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-body {
      min-width: 0;
      flex: 1;
    }

    .toast-title {
      font-size: 13px;
      font-weight: 700;
      color: #eef2f7;
      margin: 0 0 2px;
    }

    .toast-sub {
      font-size: 12px;
      color: #9aa4b2;
      margin: 0;
      line-height: 1.35;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #8a95a5;
      padding: 4px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    /* Full-screen Steam-like Overlay */
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      background: radial-gradient(circle at 20% 0%, rgba(42, 68, 122, 0.34), transparent 55%),
                  rgba(10, 13, 19, 0.82);
      backdrop-filter: blur(14px) saturate(1.15);
      -webkit-backdrop-filter: blur(14px) saturate(1.15);
      padding:
        calc(18px + env(safe-area-inset-top, 0px))
        calc(20px + env(safe-area-inset-right, 0px))
        calc(16px + env(safe-area-inset-bottom, 0px))
        calc(20px + env(safe-area-inset-left, 0px));
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transition: opacity 0.18s ease, visibility 0.18s ease;
    }

    .overlay.is-open {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    .shell-inner {
      width: 100%;
      max-width: 1080px;
      height: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transform: scale(0.985);
      transition: transform 0.18s ease;
    }

    .overlay.is-open .shell-inner {
      transform: scale(1);
    }

    /* Overlay Top Bar */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(22, 27, 37, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      background: rgba(91, 141, 239, 0.18);
      border: 1px solid rgba(91, 141, 239, 0.35);
      color: #8fb3ff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.9px;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .game-title {
      margin: 0;
      font-size: clamp(16px, 2.2vw, 21px);
      font-weight: 700;
      color: #f4f7fb;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta-group {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-left: auto;
    }

    .clocks {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #9aa4b2;
      font-variant-numeric: tabular-nums;
    }

    .clock-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
    }

    /* Action Bar */
    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(28, 34, 46, 0.92);
      color: #eef2f7;
      font: 600 14px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
      user-select: none;
      -webkit-user-select: none;
    }

    .btn:hover,
    .btn:focus-visible {
      background: rgba(40, 49, 66, 0.98);
      border-color: rgba(255, 255, 255, 0.3);
      outline: none;
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn-primary {
      background: #5b8def;
      border-color: #6f9cf5;
      color: #09111f;
      font-weight: 700;
      box-shadow: 0 6px 20px rgba(91, 141, 239, 0.32);
    }

    .btn-primary:hover,
    .btn-primary:focus-visible {
      background: #729ef4;
      border-color: #8cb2f8;
      color: #070d18;
    }

    .btn-resume {
      background: rgba(91, 141, 239, 0.14);
      border-color: rgba(91, 141, 239, 0.45);
      color: #d6e4ff;
    }

    .btn-resume:hover,
    .btn-resume:focus-visible {
      background: rgba(91, 141, 239, 0.24);
      border-color: rgba(125, 167, 248, 0.75);
    }

    .btn-ghost-sm {
      min-height: 36px;
      padding: 0 12px;
      font-size: 13px;
    }

    /* Switcher Panel */
    .switcher {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 14px;
      background: rgba(20, 25, 34, 0.84);
      border: 1px solid rgba(255, 255, 255, 0.09);
    }

    .switcher-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .switcher-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      color: #a7b2c2;
    }

    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: min(260px, 100%);
    }

    .search-wrap svg {
      position: absolute;
      left: 11px;
      color: #7d8898;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 36px;
      padding: 0 12px 0 34px;
      border-radius: 9px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(11, 14, 20, 0.75);
      color: #eef2f7;
      font: 500 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
      outline: none;
    }

    .search-input::placeholder {
      color: #768192;
    }

    .search-input:focus {
      border-color: #5b8def;
    }

    .games-grid {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      grid-auto-rows: max-content;
      gap: 12px;
      padding-right: 4px;
      align-content: start;
    }

    .game-card {
      position: relative;
      display: flex;
      flex-direction: column;
      border-radius: 10px;
      overflow: hidden;
      background: rgba(29, 35, 47, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.09);
      color: inherit;
      text-decoration: none;
      transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
    }

    .game-card:hover,
    .game-card:focus-visible {
      border-color: #5b8def;
      transform: translateY(-2px);
      background: rgba(36, 44, 59, 0.96);
      outline: none;
    }

    .game-card.is-current {
      border-color: rgba(91, 141, 239, 0.75);
      box-shadow: inset 0 0 0 1px rgba(91, 141, 239, 0.35);
    }

    .game-thumb {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9;
      flex-shrink: 0;
      object-fit: cover;
      background: linear-gradient(135deg, #2d4a35, #1d2a3a);
    }

    .game-card-body {
      padding: 9px 11px 10px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .game-card-title {
      font-size: 13px;
      font-weight: 600;
      color: #eef2f7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .playing-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 3px 7px;
      border-radius: 6px;
      background: rgba(91, 141, 239, 0.92);
      color: #09111f;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .empty-msg {
      grid-column: 1 / -1;
      text-align: center;
      padding: 28px 12px;
      color: #8b96a6;
      font-size: 14px;
    }

    /* Footer */
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #8b96a6;
      padding: 0 4px;
    }

    .kbd {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #dce4f0;
      font-size: 11px;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .overlay {
        padding:
          calc(12px + env(safe-area-inset-top, 0px))
          calc(12px + env(safe-area-inset-right, 0px))
          calc(12px + env(safe-area-inset-bottom, 0px))
          calc(12px + env(safe-area-inset-left, 0px));
      }
      .shell-inner {
        gap: 12px;
      }
      .topbar {
        padding: 10px 12px;
      }
      .clocks {
        display: none;
      }
      .actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .actions .btn {
        padding: 0 10px;
        font-size: 13px;
      }
      .actions .btn-primary {
        grid-column: 1 / -1;
        font-size: 14px;
      }
      .switcher {
        padding: 12px;
      }
      .games-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .footer {
        display: none;
      }
    }

    @media (max-height: 460px) and (orientation: landscape) {
      .shell-inner {
        gap: 8px;
      }
      .topbar {
        padding: 8px 12px;
      }
      .btn {
        min-height: 38px;
        padding: 0 12px;
        font-size: 13px;
      }
      .switcher {
        padding: 10px 12px;
      }
      .footer {
        display: none;
      }
    }
  `;

  function createEl(tag, className, html) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html !== undefined) el.innerHTML = html;
    return el;
  }

  function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  function formatClock(d) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function mount() {
    const host = document.createElement('gnome-arcade-shell');
    host.setAttribute('data-arcade-shell', 'true');
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    // 1. Floating top pull-tab
    const tabHit = createEl('div', 'tab-hit');
    tabHit.setAttribute('role', 'button');
    tabHit.setAttribute('tabindex', '0');
    tabHit.setAttribute('aria-label', 'Open Gnome Arcade Overlay');
    tabHit.setAttribute('aria-expanded', 'false');
    tabHit.title = 'Gnome Arcade Overlay (Shift+Tab) · Drag sideways to reposition';
    if (suppressChrome) tabHit.classList.add('is-hidden');

    const tabPill = createEl(
      'div',
      'tab-pill',
      `${ICONS.home}<span>Arcade</span><span class="tab-kbd">Shift+Tab</span>`,
    );
    tabHit.appendChild(tabPill);
    shadow.appendChild(tabHit);

    // Restore horizontal position if user dragged the tab earlier in this session
    try {
      const savedLeft = sessionStorage.getItem('gnome-shell-tab-x');
      if (savedLeft) {
        const pct = Number(savedLeft);
        if (Number.isFinite(pct) && pct >= 8 && pct <= 92) {
          tabHit.style.left = `${pct}%`;
        }
      }
    } catch {
      // ignore storage errors
    }

    // 2. Steam-style launch toast
    const toast = createEl('div', 'toast is-gone');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    const toastHint = isCoarsePointer()
      ? 'Tap Arcade at the top for Home & games'
      : 'Press Shift+Tab or click Arcade for Home & Fullscreen';
    toast.innerHTML = `
      <div class="toast-icon">${ICONS.home}</div>
      <div class="toast-body">
        <p class="toast-title">Gnome Arcade Overlay</p>
        <p class="toast-sub">${toastHint}</p>
      </div>
      <button type="button" class="toast-close" aria-label="Dismiss notification">${ICONS.close}</button>
    `;
    shadow.appendChild(toast);

    // 3. Full-screen Steam-style Overlay
    const overlay = createEl('div', 'overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Gnome Arcade Overlay');

    const inner = createEl('div', 'shell-inner');

    // Top bar
    const topbar = createEl('div', 'topbar');
    const brandGroup = createEl('div', 'brand-group');
    const brandBadge = createEl('span', 'brand-badge', `${ICONS.grid}<span>Arcade</span>`);
    const titleEl = createEl('h1', 'game-title');
    titleEl.textContent = currentTitle;
    brandGroup.append(brandBadge, titleEl);

    const metaGroup = createEl('div', 'meta-group');
    const clocks = createEl('div', 'clocks');
    const sessionClock = createEl('span', 'clock-pill');
    const wallClock = createEl('span', 'clock-pill');
    clocks.append(sessionClock, wallClock);

    const resumeBtn = createEl('button', 'btn btn-resume btn-ghost-sm', `${ICONS.play}<span>Resume</span>`);
    resumeBtn.type = 'button';
    metaGroup.append(clocks, resumeBtn);
    topbar.append(brandGroup, metaGroup);

    // Primary Actions
    const actions = createEl('div', 'actions');

    const homeLink = createEl('a', 'btn btn-primary', `${ICONS.home}<span>Back to Home</span>`);
    homeLink.href = homeUrl;

    const fsBtn = createEl('button', 'btn', `${ICONS.fullscreen}<span>Fullscreen</span>`);
    fsBtn.type = 'button';
    if (!canFullscreen()) fsBtn.style.display = 'none';

    const restartBtn = createEl('button', 'btn', `${ICONS.restart}<span>Restart</span>`);
    restartBtn.type = 'button';

    const copyBtn = createEl('button', 'btn', `${ICONS.link}<span>Copy Link</span>`);
    copyBtn.type = 'button';

    actions.append(homeLink, fsBtn, restartBtn, copyBtn);

    // Game Switcher
    const switcher = createEl('section', 'switcher');
    const switcherHead = createEl('div', 'switcher-head');
    const switcherTitle = createEl('h2', 'switcher-title', `${ICONS.grid}<span>Switch Game</span>`);

    const searchWrap = createEl('div', 'search-wrap', ICONS.search);
    const searchInput = createEl('input', 'search-input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Filter games...';
    searchInput.setAttribute('aria-label', 'Filter games');
    searchWrap.appendChild(searchInput);

    switcherHead.append(switcherTitle, searchWrap);
    const gamesGrid = createEl('div', 'games-grid');
    switcher.append(switcherHead, gamesGrid);

    // Footer
    const footer = createEl(
      'div',
      'footer',
      `<span><span class="kbd">Shift</span> + <span class="kbd">Tab</span> Toggle overlay · <span class="kbd">Esc</span> Resume</span><span>Tip: drag the top Arcade tab sideways if it overlaps a HUD</span>`,
    );

    inner.append(topbar, actions, switcher, footer);
    overlay.appendChild(inner);
    shadow.appendChild(overlay);

    // Append host to documentElement so fullscreening documentElement keeps the overlay inside fullscreen!
    document.documentElement.appendChild(host);

    // State
    let isOpen = false;
    let gamesList = null;
    let gamesLoading = false;
    const startedAt = Date.now();
    let toastTimer = null;

    function updateClocks() {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      sessionClock.textContent = `Session ${formatDuration(elapsedSec)}`;
      wallClock.textContent = formatClock(new Date());
    }
    updateClocks();
    setInterval(updateClocks, 1000);

    function syncFullscreenButton() {
      const active = Boolean(getFullscreenEl());
      fsBtn.innerHTML = active
        ? `${ICONS.exitFullscreen}<span>Exit Fullscreen</span>`
        : `${ICONS.fullscreen}<span>Fullscreen</span>`;
      fsBtn.setAttribute('aria-pressed', String(active));
    }
    syncFullscreenButton();

    // Keep overlay visible even if a game calls requestFullscreen() on a container element
    function syncFullscreenHost() {
      syncFullscreenButton();
      const fsEl = getFullscreenEl();
      if (fsEl && !fsEl.contains(host)) {
        const tag = fsEl.tagName;
        if (tag !== 'CANVAS' && tag !== 'VIDEO' && tag !== 'IMG' && tag !== 'IFRAME') {
          fsEl.appendChild(host);
        }
      } else if (!fsEl && host.parentElement !== document.documentElement) {
        document.documentElement.appendChild(host);
      }
    }
    document.addEventListener('fullscreenchange', syncFullscreenHost);
    document.addEventListener('webkitfullscreenchange', syncFullscreenHost);

    function dismissToast() {
      if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
      }
      toast.classList.remove('is-visible');
      setTimeout(() => {
        if (!toast.classList.contains('is-visible')) toast.classList.add('is-gone');
      }, 260);
    }

    function showToast() {
      if (suppressChrome) return;
      toast.classList.remove('is-gone');
      requestAnimationFrame(() => toast.classList.add('is-visible'));
      toastTimer = setTimeout(dismissToast, 4200);
    }

    function renderGames(filter = '') {
      if (!gamesList) {
        gamesGrid.innerHTML = '<div class="empty-msg">Loading games...</div>';
        return;
      }
      const q = filter.trim().toLowerCase();
      const filtered = q
        ? gamesList.filter(
            (g) =>
              g.title.toLowerCase().includes(q) ||
              g.name.toLowerCase().includes(q) ||
              (g.description && g.description.toLowerCase().includes(q)),
          )
        : gamesList;

      if (filtered.length === 0) {
        gamesGrid.innerHTML = '<div class="empty-msg">No matching games found.</div>';
        return;
      }

      const frag = document.createDocumentFragment();
      for (const g of filtered) {
        const isCurrent = g.name === currentGame;
        const card = createEl('a', isCurrent ? 'game-card is-current' : 'game-card');
        card.href = `${homeUrl}${encodeURIComponent(g.name)}/`;
        if (isCurrent) {
          card.addEventListener('click', (e) => {
            e.preventDefault();
            closeOverlay();
          });
        }
        if (g.hasThumb) {
          const img = createEl('img', 'game-thumb');
          img.src = `${thumbsBase}${encodeURIComponent(g.name)}.jpg`;
          img.alt = '';
          img.loading = 'lazy';
          img.width = 480;
          img.height = 270;
          card.appendChild(img);
        } else {
          card.appendChild(createEl('div', 'game-thumb'));
        }
        if (isCurrent) {
          const badge = createEl('span', 'playing-badge');
          badge.textContent = 'Playing';
          card.appendChild(badge);
        }
        const body = createEl('div', 'game-card-body');
        const nameEl = createEl('span', 'game-card-title');
        nameEl.textContent = g.title;
        body.appendChild(nameEl);
        card.appendChild(body);
        frag.appendChild(card);
      }
      gamesGrid.replaceChildren(frag);
    }

    async function ensureGamesLoaded() {
      if (gamesList || gamesLoading) return;
      gamesLoading = true;
      renderGames();
      try {
        const res = await fetch(`${shellBase}games.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        gamesList = Array.isArray(data) ? data : [];
      } catch {
        gamesList = [];
      } finally {
        gamesLoading = false;
        renderGames(searchInput.value);
      }
    }

    function openOverlay() {
      if (isOpen) return;
      isOpen = true;
      dismissToast();
      // Release pointer lock so FPS/3D games immediately give back the mouse cursor
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch {
          // ignore
        }
      }
      overlay.classList.add('is-open');
      tabHit.setAttribute('aria-expanded', 'true');
      tabHit.style.opacity = '0';
      tabHit.style.pointerEvents = 'none';
      updateClocks();
      syncFullscreenButton();
      ensureGamesLoaded();
      requestAnimationFrame(() => homeLink.focus({ preventScroll: true }));
    }

    function closeOverlay() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('is-open');
      tabHit.setAttribute('aria-expanded', 'false');
      tabHit.style.opacity = '';
      tabHit.style.pointerEvents = '';
      // Return focus to the game canvas or window
      const canvas = document.querySelector('canvas');
      if (canvas && typeof canvas.focus === 'function') {
        canvas.focus({ preventScroll: true });
      } else if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur?.();
      }
    }

    function toggleOverlay() {
      if (isOpen) closeOverlay();
      else openOverlay();
    }

    // Draggable top tab (horizontal slide along top edge; tap/click opens overlay)
    let dragState = null;
    tabHit.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const rect = tabHit.getBoundingClientRect();
      dragState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startCenter: rect.left + rect.width / 2,
        moved: false,
      };
      tabHit.setPointerCapture?.(e.pointerId);
    });

    tabHit.addEventListener('pointermove', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const dx = e.clientX - dragState.startX;
      if (!dragState.moved && Math.abs(dx) > 8) {
        dragState.moved = true;
        tabHit.classList.add('is-dragging');
      }
      if (dragState.moved) {
        e.stopPropagation();
        const vw = Math.max(window.innerWidth, 1);
        const pct = Math.min(92, Math.max(8, ((dragState.startCenter + dx) / vw) * 100));
        tabHit.style.left = `${pct.toFixed(2)}%`;
      }
    });

    function endTabDrag(e) {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      e.stopPropagation();
      const wasDrag = dragState.moved;
      dragState = null;
      tabHit.classList.remove('is-dragging');
      if (wasDrag) {
        try {
          const pct = parseFloat(tabHit.style.left);
          if (Number.isFinite(pct)) sessionStorage.setItem('gnome-shell-tab-x', String(pct));
        } catch {
          // ignore
        }
      } else {
        openOverlay();
      }
    }

    tabHit.addEventListener('pointerup', endTabDrag);
    tabHit.addEventListener('pointercancel', endTabDrag);
    tabHit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        openOverlay();
      }
    });

    // Toast interactions
    toast.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('.toast-close')) {
        dismissToast();
      } else {
        openOverlay();
      }
    });

    // Overlay button interactions
    resumeBtn.addEventListener('click', () => closeOverlay());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    fsBtn.addEventListener('click', async () => {
      try {
        if (getFullscreenEl()) {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        } else {
          const el = document.documentElement;
          if (el.requestFullscreen) await el.requestFullscreen();
          else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        }
      } catch {
        // Browser may block fullscreen in some contexts; keep UI responsive
      }
      syncFullscreenButton();
    });

    restartBtn.addEventListener('click', () => {
      location.reload();
    });

    let copyResetTimer = null;
    copyBtn.addEventListener('click', async () => {
      const url = location.href;
      let ok = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          ok = true;
        }
      } catch {
        // fallback below
      }
      if (!ok) {
        const tmp = document.createElement('input');
        tmp.value = url;
        tmp.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(tmp);
        tmp.select();
        try {
          ok = document.execCommand('copy');
        } catch {
          ok = false;
        }
        tmp.remove();
      }
      copyBtn.innerHTML = ok
        ? `${ICONS.check}<span>Copied!</span>`
        : `${ICONS.link}<span>Copy failed</span>`;
      if (copyResetTimer) clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(() => {
        copyBtn.innerHTML = `${ICONS.link}<span>Copy Link</span>`;
      }, 2000);
    });

    searchInput.addEventListener('input', () => {
      renderGames(searchInput.value);
    });

    // Isolate all overlay/tab/toast input so clicks/touches/keys never leak to the underlying game
    for (const ev of [
      'pointerdown',
      'pointerup',
      'mousedown',
      'mouseup',
      'click',
      'dblclick',
      'contextmenu',
      'touchstart',
      'touchmove',
      'touchend',
      'wheel',
      'keydown',
      'keyup',
      'keypress',
    ]) {
      host.addEventListener(ev, (e) => {
        e.stopPropagation();
      });
    }

    // Global capture-phase keyboard shortcut (Shift+Tab) and key isolation while overlay is open
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Tab' && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleOverlay();
          return;
        }
        if (!isOpen) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeOverlay();
          return;
        }
        // Allow typing in the filter box (host bubble listener still blocks it from reaching the game)
        const path = e.composedPath ? e.composedPath() : [];
        if (path.includes(searchInput)) return;
        // Allow Tab navigation inside overlay controls
        if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
          if (path.includes(host)) return;
        }
        e.stopImmediatePropagation();
      },
      { capture: true },
    );

    for (const ev of ['keyup', 'keypress']) {
      window.addEventListener(
        ev,
        (e) => {
          if (!isOpen) return;
          const path = e.composedPath ? e.composedPath() : [];
          if (path.includes(searchInput)) return;
          e.stopImmediatePropagation();
        },
        { capture: true },
      );
    }

    // Expose minimal debug/integration API
    window.__gnomeArcadeShell = {
      open: openOverlay,
      close: closeOverlay,
      toggle: toggleOverlay,
      isOpen: () => isOpen,
    };

    // Show subtle Steam-style toast briefly after load
    setTimeout(showToast, 650);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
