import { createVolumeButton } from '@arcade/volume';
import { volume } from '../volume';

/**
 * Top-right volume button beside the pause button (reuses the .vb-btn style).
 * Opens a Master / Sounds / Music popover; M still toggles music mute.
 */
export function createMuteButton(
  parent: HTMLElement,
  _isMuted: () => boolean,
  onToggle: () => void,
): { show(): void; hide(): void } {
  const control = createVolumeButton(parent, volume, {
    buttonClassName: 'vb-btn',
    title: 'Audio',
  });
  control.element.style.position = 'absolute';
  control.element.style.top = '14px';
  control.element.style.right = '152px';
  control.element.style.zIndex = '40';

  control.button.style.position = 'relative';
  control.button.style.top = '0';
  control.button.style.right = '0';
  control.button.style.display = 'flex';
  control.button.title = 'Volume settings (M toggles music)';
  control.hide();

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyM' || e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; // typing in chat or name box
    onToggle();
  });

  return {
    show() { control.show(); },
    hide() { control.hide(); },
  };
}
