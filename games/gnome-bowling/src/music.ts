// Gnome Bowling music & shared volume control: ambient elevator/lounge track from @lawn/music
// paired with @arcade/volume's Master / Sounds / Music popover button.
import { createVolumeButton } from '@arcade/volume';
import { buildBowlingAmbient, playSong, setMusicVolume, setMuteKey, setMuted } from '@lawn/music';
import type { Ctx, System } from './config';
import { volume } from './volume';

const MUTE_KEY = 'gnome-bowling-music-muted';
const STYLE_ID = 'bmu-volume-style';

function urlMuted(): boolean {
  try {
    return location.hash.toLowerCase().includes('mute');
  } catch {
    return false;
  }
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#bmu-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}
#bmu-anchor {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  right: calc(env(safe-area-inset-right) + 12px);
  pointer-events: auto;
}
.bmu-vol-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: rgba(15, 15, 30, 0.65);
  color: #fff;
  font-family: system-ui;
  font-size: 20px;
  line-height: 44px;
  text-align: center;
  text-shadow: 0 1px 2px #000;
  cursor: pointer;
  touch-action: manipulation;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bmu-vol-btn .vb-label {
  display: none;
}
.bmu-vol-popover {
  top: auto;
  bottom: calc(100% + 8px);
  right: 0;
}
`;
  document.head.appendChild(style);
}

export function createMusic(ctx: Ctx): System {
  setMuteKey(MUTE_KEY);
  const seed = Math.floor(Math.random() * 0x7fffffff);

  const syncMusic = (): void => {
    const gain = urlMuted() ? 0 : volume.effective('music');
    setMusicVolume(gain);
    setMuted(gain <= 0.0001);
  };
  syncMusic();
  volume.subscribe(syncMusic);

  let started = false;
  const start = (): void => {
    if (started || urlMuted()) return;
    started = true;
    playSong((T, keep, out) => buildBowlingAmbient(T, keep, out, seed));
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });

  injectStyle();
  const root = document.createElement('div');
  root.id = 'bmu-root';
  const anchor = document.createElement('div');
  anchor.id = 'bmu-anchor';
  root.appendChild(anchor);

  const control = createVolumeButton(anchor, volume, {
    buttonClassName: 'bmu-vol-btn',
    className: 'bmu-vol-popover',
    title: 'Audio',
  });
  control.button.id = 'bmu-btn';
  control.button.title = 'Volume (M mute all, N mute music)';
  control.button.addEventListener('pointerdown', () => start());

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'n' || e.key === 'N') {
      start();
      volume.toggleMute('music');
    } else if (e.key === 'm' || e.key === 'M') {
      start();
      volume.toggleMute('master');
    }
  });

  ctx.ui.appendChild(root);

  return {
    update() {
      if (!started && ctx.state.phase !== 'title') start();
    },
  };
}
