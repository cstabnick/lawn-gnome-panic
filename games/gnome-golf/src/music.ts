// Gnome Golf music: a generated ambient track from @lawn/music, plus a small music toggle (button and N key).
import { buildGolfAmbient, isMuted, playSong, setMuteKey, setMuted } from '@lawn/music';
import type { Ctx, System } from './config';

const MUTE_KEY = 'gnome-golf-music-muted';

export function createMusic(ctx: Ctx): System {
  setMuteKey(MUTE_KEY);
  const seed = Math.floor(Math.random() * 0x7fffffff);

  // Start the song once: on the first pointer (the title screen) or the first frame past the title.
  let started = false;
  const start = (): void => {
    if (started) return;
    started = true;
    playSong((T, keep, out) => buildGolfAmbient(T, keep, out, seed));
  };
  window.addEventListener('pointerdown', start, { once: true });

  // Toggle button, under the minimap (top-right). Never hidden, in every phase.
  const root = document.createElement('div');
  root.id = 'gmu-root';
  root.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

  const btn = document.createElement('button');
  btn.id = 'gmu-btn';
  btn.type = 'button';
  btn.style.cssText = [
    'position:absolute',
    'top:calc(env(safe-area-inset-top) + 176px)',
    'right:calc(env(safe-area-inset-right) + 10px)',
    'width:44px',
    'height:44px',
    'padding:0',
    'border:0',
    'border-radius:10px',
    'background:rgba(10,30,20,0.55)',
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
    toggle();
  });
  window.addEventListener('keydown', (e) => {
    if (!e.repeat && (e.key === 'n' || e.key === 'N')) toggle();
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
