// Gnome Creator trance music & shared volume control: uplifting trance from @lawn/music
// paired with @arcade/volume's Master / Sounds / Music popover button.
import { createVolumeButton } from '@arcade/volume';
import { buildTranceTrack, playSong, setMusicVolume, setMuteKey, setMuted } from '@lawn/music';
import { volume } from './volume';

const MUTE_KEY = 'gnome-creator-music-muted';
const STYLE_ID = 'gc-music-style';

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
#gc-music-bar {
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  left: max(12px, env(safe-area-inset-left));
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
  z-index: 20;
}
.gc-vol-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  background: rgba(20, 30, 20, 0.82);
  color: #fff;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
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
.gc-vol-btn .vb-label {
  display: none;
}
.av-panel.gc-vol-popover {
  top: calc(100% + 8px);
  left: 0;
  right: auto;
}
.gc-next-btn {
  height: 44px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  background: rgba(20, 30, 20, 0.82);
  color: #fff;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  touch-action: manipulation;
}
.gc-next-btn:hover, .gc-vol-btn:hover {
  background: rgba(34, 52, 34, 0.92);
  border-color: rgba(255, 255, 255, 0.55);
}
`;
  document.head.appendChild(style);
}

export function initCreatorMusic(parent: HTMLElement): void {
  setMuteKey(MUTE_KEY);
  let seed = Math.floor(Math.random() * 0x7fffffff);

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
    playSong((T, keep, out) => buildTranceTrack(T, keep, out, seed));
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });

  injectStyle();
  const bar = document.createElement('div');
  bar.id = 'gc-music-bar';
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());

  const control = createVolumeButton(bar, volume, {
    buttonClassName: 'gc-vol-btn',
    className: 'gc-vol-popover',
    title: 'Audio',
  });
  control.button.id = 'gc-vol-btn';
  control.button.title = 'Volume (M mute all, N mute music)';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'gc-next-btn';
  nextBtn.textContent = 'TRANCE MIX ↻';
  nextBtn.title = 'Generate a new trance mix';
  nextBtn.onclick = () => {
    started = true;
    seed = (seed + 0x9e3779b9) >>> 0;
    playSong((T, keep, out) => buildTranceTrack(T, keep, out, seed));
  };
  bar.appendChild(nextBtn);

  parent.appendChild(bar);

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const k = e.key.toLowerCase();
    if (k === 'm') {
      volume.toggleMute('master');
    } else if (k === 'n') {
      volume.toggleMute('music');
    }
  });
}
