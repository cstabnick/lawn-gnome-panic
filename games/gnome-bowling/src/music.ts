// Gnome Bowling music: ambient elevator/lounge track from @lawn/music, plus a music toggle (button and N key).
import { buildBowlingAmbient, isMuted, playSong, setMuteKey, setMuted } from '@lawn/music';
import type { Ctx, System } from './config';

const MUTE_KEY = 'gnome-bowling-music-muted';

function urlMuted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

export function createMusic(ctx: Ctx): System {
  setMuteKey(MUTE_KEY);
  if (urlMuted()) setMuted(true);
  const seed = Math.floor(Math.random() * 0x7fffffff);

  let started = false;
  const start = (): void => {
    if (started || urlMuted()) return;
    started = true;
    playSong((T, keep, out) => buildBowlingAmbient(T, keep, out, seed));
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });

  const root = document.createElement('div');
  root.id = 'bmu-root';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:20;';

  const btn = document.createElement('button');
  btn.id = 'bmu-btn';
  btn.type = 'button';
  btn.style.cssText = [
    'position:absolute',
    'bottom:calc(env(safe-area-inset-bottom) + 12px)',
    'right:calc(env(safe-area-inset-right) + 12px)',
    'width:44px',
    'height:44px',
    'padding:0',
    'border:0',
    'border-radius:10px',
    'background:rgba(15,15,30,0.6)',
    'color:#fff',
    'font-family:system-ui',
    'font-size:20px',
    'line-height:44px',
    'text-align:center',
    'text-shadow:0 1px 2px #000',
    'cursor:pointer',
    'touch-action:manipulation',
    'pointer-events:auto',
  ].join(';');

  const paint = (): void => {
    btn.textContent = isMuted() ? '🔇' : '♪';
    btn.setAttribute('aria-label', isMuted() ? 'Music off' : 'Music on');
  };

  const toggle = (): void => {
    setMuted(!isMuted());
    paint();
  };

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    start();
    toggle();
  });
  window.addEventListener('keydown', (e) => {
    if (!e.repeat && (e.key === 'n' || e.key === 'N')) {
      start();
      toggle();
    }
  });

  root.appendChild(btn);
  ctx.ui.appendChild(root);
  paint();

  return {
    update() {
      if (!started && ctx.state.phase !== 'title') start();
    },
  };
}
